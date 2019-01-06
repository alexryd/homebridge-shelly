const shellies = require('shellies')

const { handleFailedRequest } = require('./error-handlers')

module.exports = homebridge => {
  const {
    Shelly1RelayAccessory,
    Shelly2RelayAccessory,
    Shelly4ProRelayAccessory,
  } = require('./accessories')(homebridge)

  class ShellyPlatform {
    constructor(log, config) {
      this.log = log
      this.config = config

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
      let platformAccessories = null

      if (type === 'SHSW-1') {
        platformAccessories = [
          new Shelly1RelayAccessory(this.log, device).platformAccessory
        ]
      } else if (type === 'SHSW-21' || type === 'SHSW-22') {
        platformAccessories = [
          new Shelly2RelayAccessory(this.log, device, 0).platformAccessory,
          new Shelly2RelayAccessory(this.log, device, 1).platformAccessory,
        ]
      } else if (type === 'SHSW-44') {
        platformAccessories = [
          new Shelly4ProRelayAccessory(this.log, device, 0).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 1).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 2).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 3).platformAccessory,
        ]
      }

      if (platformAccessories) {
        homebridge.registerPlatformAccessories(
          'homebridge-shelly',
          'Shelly',
          platformAccessories
        )
      }
    }

    async configureAccessory(platformAccessory) {
      const ctx = platformAccessory.context
      let device = shellies.getDevice(ctx.type, ctx.id)

      if (!device) {
        device = shellies.createDevice(ctx.type, ctx.id, ctx.host)
        shellies.addDevice(device)

        try {
          device.settings = await device.getSettings()
        } catch (e) {
          handleFailedRequest(
            this.log,
            device,
            e,
            'Failed to load device settings'
          )
          device.online = false
        }
      }

      const type = device.type

      if (type === 'SHSW-1') {
        new Shelly1RelayAccessory(this.log, device, platformAccessory)
      } else if (type === 'SHSW-21' || type === 'SHSW-22') {
        new Shelly2RelayAccessory(
          this.log,
          device,
          ctx.index,
          platformAccessory
        )
      } else if (type === 'SHSW-44') {
        new Shelly4ProRelayAccessory(
          this.log,
          device,
          ctx.index,
          platformAccessory
        )
      }
    }
  }

  return ShellyPlatform
}
