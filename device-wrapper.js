const { handleFailedRequest } = require('./util/error-handlers')

module.exports = homebridge => {
  class DeviceWrapper {
    constructor(platform, device, config, ...accessories) {
      this.platform = platform
      this.device = device
      this.config = config || {}
      this.accessories = accessories

      if (config && config.username && config.password) {
        device.setAuthCredentials(config.username, config.password)
      }

      if (config && config.name) {
        device.name = config.name
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

  return DeviceWrapper
}
