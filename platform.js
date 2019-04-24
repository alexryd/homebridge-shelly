const shellies = require('shellies')

const { handleFailedRequest } = require('./error-handlers')

module.exports = homebridge => {
  const {
    Shelly1RelayAccessory,
    Shelly2RelayAccessory,
    Shelly2RollerShutterAccessory,
    Shelly4ProRelayAccessory,
    ShellyHTAccessory,
  } = require('./accessories')(homebridge)

  class DeviceWrapper {
    constructor(platform, device, ...accessories) {
      this.platform = platform
      this.device = device
      this.accessories = accessories

      device
        .on('online', this.deviceOnlineHandler, this)
        .on('offline', this.deviceOfflineHandler, this)
        .on('change:host', this.changeHostHandler, this)
        .on('change:mode', this.changeModeHandler, this)

      if (device.online) {
        this.loadSettings()
      }
    }

    get platformAccessories() {
      return this.accessories.map(a => a.platformAccessory)
    }

    deviceOnlineHandler() {
      this.platform.log.debug(
        'Device',
        this.device.type,
        this.device.id,
        'came online'
      )

      this.loadSettings()
    }

    deviceOfflineHandler() {
      this.platform.log.debug(
        'Device',
        this.device.type,
        this.device.id,
        'went offline'
      )
    }

    changeHostHandler(newValue, oldValue) {
      this.platform.log.debug(
        'Device',
        this.device.type,
        this.device.id,
        'changed host from',
        oldValue,
        'to',
        newValue
      )

      homebridge.updatePlatformAccessories(this.platformAccessories)
    }

    changeModeHandler(newValue, oldValue) {
      this.platform.log.debug(
        'Device',
        this.device.type,
        this.device.id,
        'changed mode from',
        oldValue,
        'to',
        newValue
      )

      // re-add the device since we need to replace its accessories
      this.platform.removeDevice(this.device)
      this.platform.addDevice(this.device)
    }

    loadSettings() {
      const d = this.device

      if (!d.settings) {
        this.platform.log.debug('Loading settings for device', d.type, d.id)

        d.getSettings()
          .then(settings => {
            d.settings = settings
          })
          .catch(error => {
            handleFailedRequest(
              this.platform.log,
              d,
              error,
              'Failed to load device settings'
            )
            d.online = false
          })
      }
    }

    destroy() {
      this.device
        .removeListener('online', this.deviceOnlineHandler, this)
        .removeListener('offline', this.deviceOfflineHandler, this)
        .removeListener('change:host', this.changeHostHandler, this)
        .removeListener('change:mode', this.changeModeHandler, this)

      for (const accessory of this.accessories) {
        accessory.detach()
      }
      this.accessories.length = 0
    }
  }

  class ShellyPlatform {
    constructor(log, config) {
      this.log = log
      this.config = config
      this.deviceWrappers = new Map()

      if (config.username && config.password) {
        shellies.setAuthCredentials(config.username, config.password)
      }

      if (typeof config.requestTimeout === 'number') {
        shellies.request.timeout(config.requestTimeout)
      }

      if (typeof config.staleTimeout === 'number') {
        shellies.staleTimeout = config.staleTimeout
      }

      shellies
        .on('discover', this.discoverDeviceHandler, this)
        .on('stale', this.deviceStaleHandler, this)
        .on('unknown', (type, id, host) => {
          log.debug(
            'Unknown device',
            type,
            id,
            'at',
            host,
            'discovered'
          )
        })

      homebridge.on('didFinishLaunching', () => {
        const num = this.deviceWrappers.size
        this.log.info(
          `${num} ${num === 1 ? 'device' : 'devices'} loaded from cache`
        )

        shellies.start(config.networkInterface)
      })
    }

    discoverDeviceHandler(device) {
      this.log.info(
        'New device discovered:',
        device.type,
        device.id,
        'at',
        device.host
      )

      if (!this.addDevice(device)) {
        this.log.info('Unknown device, so skipping it')
      }
    }

    deviceStaleHandler(device) {
      this.log.info(
        'Device',
        device.type,
        device.id,
        'is stale. Unregistering its accessories.'
      )

      this.removeDevice(device)
    }

    addDevice(device) {
      const type = device.type
      let deviceWrapper = null

      if (type === 'SHSW-1') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new Shelly1RelayAccessory(this.log, device)
        )
      } else if (type === 'SHSW-21' || type === 'SHSW-25') {
        if (device.mode === 'roller') {
          deviceWrapper = new DeviceWrapper(
            this,
            device,
            new Shelly2RollerShutterAccessory(this.log, device)
          )
        } else {
          deviceWrapper = new DeviceWrapper(
            this,
            device,
            new Shelly2RelayAccessory(this.log, device, 0),
            new Shelly2RelayAccessory(this.log, device, 1)
          )
        }
      } else if (type === 'SHSW-44') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new Shelly4ProRelayAccessory(this.log, device, 0),
          new Shelly4ProRelayAccessory(this.log, device, 1),
          new Shelly4ProRelayAccessory(this.log, device, 2),
          new Shelly4ProRelayAccessory(this.log, device, 3)
        )
      } else if (type === 'SHHT-1') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new ShellyHTAccessory(this.log, device)
        )
      }

      if (deviceWrapper) {
        this.deviceWrappers.set(device, deviceWrapper)

        homebridge.registerPlatformAccessories(
          'homebridge-shelly',
          'Shelly',
          deviceWrapper.platformAccessories
        )
      }

      return deviceWrapper
    }

    removeDevice(device) {
      const deviceWrapper = this.deviceWrappers.get(device)
      if (!deviceWrapper) {
        return
      }

      homebridge.unregisterPlatformAccessories(
        'homebridge-shelly',
        'Shelly',
        deviceWrapper.platformAccessories
      )

      deviceWrapper.destroy()
      this.deviceWrappers.delete(device)
    }

    configureAccessory(platformAccessory) {
      const ctx = platformAccessory.context
      let device = shellies.getDevice(ctx.type, ctx.id)

      this.log.debug(
        'Configuring cached accessory for device',
        ctx.type,
        ctx.id
      )

      if (!device) {
        device = shellies.createDevice(ctx.type, ctx.id, ctx.host)

        if (ctx.mode && device.hasOwnProperty('mode')) {
          device.mode = ctx.mode
        }

        shellies.addDevice(device)
      }

      let deviceWrapper = this.deviceWrappers.get(device)

      if (!deviceWrapper) {
        deviceWrapper = new DeviceWrapper(this, device)
        this.deviceWrappers.set(device, deviceWrapper)
      }

      const type = device.type

      if (type === 'SHSW-1') {
        deviceWrapper.accessories.push(
          new Shelly1RelayAccessory(this.log, device, platformAccessory)
        )
      } else if (type === 'SHSW-21' || type === 'SHSW-25') {
        if (ctx.mode === 'roller') {
          deviceWrapper.accessories.push(
            new Shelly2RollerShutterAccessory(
              this.log,
              device,
              platformAccessory
            )
          )
        } else {
          deviceWrapper.accessories.push(
            new Shelly2RelayAccessory(
              this.log,
              device,
              ctx.index,
              platformAccessory
            )
          )
        }
      } else if (type === 'SHSW-44') {
        deviceWrapper.accessories.push(
          new Shelly4ProRelayAccessory(
            this.log,
            device,
            ctx.index,
            platformAccessory
          )
        )
      } else if (type === 'SHHT-1') {
        deviceWrapper.accessories.push(
          new ShellyHTAccessory(
            this.log,
            device,
            platformAccessory
          )
        )
      }
    }
  }

  ShellyPlatform.DeviceWrapper = DeviceWrapper
  ShellyPlatform.Shelly1RelayAccessory = Shelly1RelayAccessory
  ShellyPlatform.Shelly2RelayAccessory = Shelly2RelayAccessory
  ShellyPlatform.Shelly2RollerShutterAccessory = Shelly2RollerShutterAccessory
  ShellyPlatform.Shelly4ProRelayAccessory = Shelly4ProRelayAccessory
  ShellyPlatform.ShellyHTAccessory = ShellyHTAccessory

  return ShellyPlatform
}
