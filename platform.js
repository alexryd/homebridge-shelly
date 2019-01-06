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

      this.device.on('online', this.loadSettings.bind(this))

      if (this.device.online) {
        this.loadSettings()
      }
    }

    get platformAccessories() {
      return this.accessories.map(a => a.platformAccessory)
    }

    loadSettings() {
      const d = this.device

      if (!d.settings) {
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
        shellies.request.timeout(config.requestTimeout * 1000)
      }

      if (typeof config.staleTimeout === 'number') {
        shellies.staleTimeout = config.staleTimeout
      }

      shellies.on('discover', this.discoverDeviceHandler.bind(this))
      homebridge.on('didFinishLaunching', () => { shellies.start() })
    }

    discoverDeviceHandler(device) {
      const type = device.type
      let deviceWrapper = null

      if (type === 'SHSW-1') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new Shelly1RelayAccessory(this.log, device).platformAccessory
        )
      } else if (type === 'SHSW-21' || type === 'SHSW-22') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new Shelly2RelayAccessory(this.log, device, 0).platformAccessory,
          new Shelly2RelayAccessory(this.log, device, 1).platformAccessory
        )
      } else if (type === 'SHSW-44') {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          new Shelly4ProRelayAccessory(this.log, device, 0).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 1).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 2).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 3).platformAccessory
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
    }

    configureAccessory(platformAccessory) {
      const ctx = platformAccessory.context
      let device = shellies.getDevice(ctx.type, ctx.id)

      if (!device) {
        device = shellies.createDevice(ctx.type, ctx.id, ctx.host)
        device.online = false
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

  return ShellyPlatform
}
