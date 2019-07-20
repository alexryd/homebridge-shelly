const shellies = require('shellies')

const { handleFailedRequest } = require('./error-handlers')

module.exports = homebridge => {
  const AccessoryFactory = require('./accessories/factory')(homebridge)

  class DeviceWrapper {
    constructor(platform, device, config, ...accessories) {
      this.platform = platform
      this.device = device
      this.config = config || {}
      this.accessories = accessories

      if (config && config.username && config.password) {
        device.setAuthCredentials(config.username, config.password)
      }

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
      this.config = config || {}
      this.deviceConfigs = new Map()
      this.deviceWrappers = new Map()

      this.configure()

      shellies
        .on('discover', this.discoverDeviceHandler, this)
        .on('stale', this.deviceStaleHandler, this)

      homebridge.on('didFinishLaunching', () => {
        const num = this.deviceWrappers.size
        this.log.info(
          `${num} ${num === 1 ? 'device' : 'devices'} loaded from cache`
        )

        shellies.start(this.config.networkInterface)
      })
    }

    configure() {
      const config = this.config

      if (config.username && config.password) {
        shellies.setAuthCredentials(config.username, config.password)
      }

      if (typeof config.requestTimeout === 'number') {
        shellies.request.timeout(config.requestTimeout)
      }

      if (typeof config.staleTimeout === 'number') {
        shellies.staleTimeout = config.staleTimeout
      }

      if (Array.isArray(config.devices)) {
        for (const c of config.devices) {
          let id = c.id
          if (!id) {
            continue
          }

          id = id.toUpperCase().trim()

          this.deviceConfigs.set(id, c)
        }
      }
    }

    getDeviceConfig(deviceId) {
      return this.deviceConfigs.get(deviceId) || {}
    }

    discoverDeviceHandler(device, unknown) {
      if (this.getDeviceConfig(device.id).exclude) {
        this.log.info(
          'Excluding device',
          device.type,
          device.id,
          'at',
          device.host,
        )
        return
      }

      if (!unknown) {
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
      } else {
        this.log.info(
          'Unknown device',
          device.type,
          device.id,
          'at',
          device.host,
          'discovered'
        )
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
      const deviceConfig = this.getDeviceConfig(device.id)
      const accessories = AccessoryFactory.createAccessories(
        device,
        deviceConfig,
        this.log
      )

      if (accessories && accessories.length > 0) {
        const deviceWrapper = new DeviceWrapper(
          this,
          device,
          deviceConfig,
          ...accessories
        )

        this.deviceWrappers.set(device, deviceWrapper)

        homebridge.registerPlatformAccessories(
          'homebridge-shelly',
          'Shelly',
          deviceWrapper.platformAccessories
        )

        return deviceWrapper
      }

      return null
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
      const deviceConfig = this.getDeviceConfig(ctx.id)

      this.log.debug(
        'Configuring cached accessory for device',
        ctx.type,
        ctx.id
      )

      let device = shellies.getDevice(ctx.type, ctx.id)

      if (!device) {
        device = shellies.createDevice(ctx.type, ctx.id, ctx.host, ctx.mode)
        shellies.addDevice(device)
      }

      let deviceWrapper = this.deviceWrappers.get(device)

      if (!deviceWrapper) {
        deviceWrapper = new DeviceWrapper(this, device, deviceConfig)
        this.deviceWrappers.set(device, deviceWrapper)
      }

      const accessory = AccessoryFactory.createAccessory(
        device,
        ctx.index,
        deviceConfig,
        this.log,
        platformAccessory
      )

      if (accessory) {
        deviceWrapper.accessories.push(accessory)
      }
    }
  }

  ShellyPlatform.DeviceWrapper = DeviceWrapper

  return ShellyPlatform
}
