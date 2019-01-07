const shellies = require('shellies')

const { handleFailedRequest } = require('./error-handlers')

module.exports = homebridge => {
  const {
    Shelly1RelayAccessory,
    Shelly2RelayAccessory,
    Shelly4ProRelayAccessory,
  } = require('./accessories')(homebridge)

  class DeviceWrapper {
    constructor(platform, device, ...accessories) {
      this.platform = platform
      this.device = device
      this.accessories = accessories

      device
        .on('online', () => {
          platform.log.debug(
            'Device',
            device.type,
            device.id,
            'came online'
          )
          this.loadSettings()
        })
        .on('offline', () => {
          platform.log.debug(
            'Device',
            device.type,
            device.id,
            'went offline'
          )
        })

      if (device.online) {
        this.loadSettings()
      }
    }

    get platformAccessories() {
      return this.accessories.map(a => a.platformAccessory)
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
        .on('discover', this.discoverDeviceHandler.bind(this))
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

      homebridge.on('didFinishLaunching', () => { shellies.start() })
    }

    discoverDeviceHandler(device) {
      this.log.debug(
        'New device discovered:',
        device.type,
        device.id,
        'at',
        device.host
      )

      const type = device.type
      let deviceWrapper = null

      if (type === 'SHSW-1') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new Shelly1RelayAccessory(this.log, device)
        )
      } else if (type === 'SHSW-21' || type === 'SHSW-22') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new Shelly2RelayAccessory(this.log, device, 0),
          new Shelly2RelayAccessory(this.log, device, 1)
        )
      } else if (type === 'SHSW-44') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new Shelly4ProRelayAccessory(this.log, device, 0),
          new Shelly4ProRelayAccessory(this.log, device, 1),
          new Shelly4ProRelayAccessory(this.log, device, 2),
          new Shelly4ProRelayAccessory(this.log, device, 3)
        )
      }

      if (deviceWrapper) {
        this.deviceWrappers.set(device, deviceWrapper)

        homebridge.registerPlatformAccessories(
          'homebridge-shelly',
          'Shelly',
          deviceWrapper.platformAccessories
        )
      } else {
        this.log.debug('Unknown device, so skipping it')
      }
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
      } else if (type === 'SHSW-21' || type === 'SHSW-22') {
        deviceWrapper.accessories.push(
          new Shelly2RelayAccessory(
            this.log,
            device,
            ctx.index,
            platformAccessory
          )
        )
      } else if (type === 'SHSW-44') {
        deviceWrapper.accessories.push(
          new Shelly4ProRelayAccessory(
            this.log,
            device,
            ctx.index,
            platformAccessory
          )
        )
      }
    }
  }

  ShellyPlatform.DeviceWrapper = DeviceWrapper
  ShellyPlatform.Shelly1RelayAccessory = Shelly1RelayAccessory
  ShellyPlatform.Shelly2RelayAccessory = Shelly2RelayAccessory
  ShellyPlatform.Shelly4ProRelayAccessory = Shelly4ProRelayAccessory

  return ShellyPlatform
}
