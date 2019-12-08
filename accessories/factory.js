
module.exports = homebridge => {
  const {
    ShellyBulbColorLightbulbAccessory,
    ShellyDimmerWhiteLightbulbAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
  } = require('./lightbulbs')(homebridge)

  const {
    Shelly1OutletAccessory,
    Shelly1PMOutletAccessory,
    Shelly2OutletAccessory,
    Shelly4ProOutletAccessory,
    ShellyEMOutletAccessory,
    ShellyHDOutletAccessory,
    ShellyPlugOutletAccessory,
  } = require('./outlets')(homebridge)

  const {
    ShellyHTAccessory,
    ShellyFloodAccessory,
    ShellySenseAccessory,
  } = require('./sensors')(homebridge)

  const {
    Shelly1PMSwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly2SwitchAccessory,
    Shelly4ProSwitchAccessory,
    ShellyEMSwitchAccessory,
    ShellyHDSwitchAccessory,
    ShellyPlugSwitchAccessory,
  } = require('./switches')(homebridge)

  const {
    Shelly2WindowCoveringAccessory,
  } = require('./window-coverings')(homebridge)

  const FRIENDLY_DEVICE_NAMES = {
    'SHBLB-1': 'Shelly Bulb',
    'SHDM-1': 'Shelly Dimmer',
    SHEM: 'Shelly EM',
    'SHHT-1': 'Shelly H&T',
    'SHPLG-1': 'Shelly Plug',
    'SHPLG-S': 'Shelly Plug S',
    'SHPLG2-1': 'Shelly Plug',
    SHRGBW2: 'Shelly RGBW2',
    'SHSEN-1': 'Shelly Sense',
    'SHSW-1': 'Shelly 1',
    'SHSW-21': 'Shelly 2',
    'SHSW-22': 'Shelly HD',
    'SHSW-25': 'Shelly 2.5',
    'SHSW-44': 'Shelly 4Pro',
    'SHSW-PM': 'Shelly 1PM',
    'SHWT-1': 'Shelly Flood',
  }

  return {
    /**
     * Returns the default accessory type identifier for the given device type
     * and (optionally) device mode.
     */
    getDefaultAccessoryType(deviceType, deviceMode = null) {
      switch (deviceType) {
        case 'SHBLB-1':
          return 'colorLightbulb'
        case 'SHDM-1':
          return 'whiteLightbulb'
        case 'SHEM':
          return 'switch'
        case 'SHHT-1':
          return 'sensor'
        case 'SHPLG-1':
        case 'SHPLG-S':
        case 'SHPLG2-1':
          return 'switch'
        case 'SHRGBW2':
          if (deviceMode === 'white') {
            return 'whiteLightbulb'
          }
          return 'colorLightbulb'
        case 'SHSEN-1':
          return 'sensor'
        case 'SHSW-1':
          return 'switch'
        case 'SHSW-21':
        case 'SHSW-25':
          if (deviceMode === 'roller') {
            return 'windowCovering'
          }
          return 'switch'
        case 'SHSW-22':
        case 'SHSW-44':
        case 'SHSW-PM':
          return 'switch'
        case 'SHWT-1':
          return 'sensor'
      }

      return null
    },

    /**
     * Returns a default name for the given device type, id, mode and index.
     */
    getDefaultAccessoryName(deviceType, deviceId, deviceMode, index) {
      const n = [
        FRIENDLY_DEVICE_NAMES[deviceType] || deviceType,
        deviceId,
      ]
      // only add the index to the name for devices that have more than one
      // accessory
      if (this.getNumberOfAccessories(deviceType, deviceMode) > 1) {
        n.push('#' + index)
      }
      return n.join(' ')
    },

    /**
     * Returns the number of accessories for the given device type and mode.
     */
    getNumberOfAccessories(deviceType, deviceMode = null) {
      if (deviceType === 'SHRGBW2' && deviceMode === 'white') {
        return 4
      } else if (deviceType === 'SHSW-21' && deviceMode !== 'roller') {
        return 2
      } else if (deviceType === 'SHSW-22') {
        return 2
      } else if (deviceType === 'SHSW-25' && deviceMode !== 'roller') {
        return 2
      } else if (deviceType === 'SHSW-44') {
        return 4
      }
      return 1
    },

    /**
     * Returns a reference to the accessory class for the given device type,
     * accessory type and (optionally) device mode.
     */
    getAccessoryClass(deviceType, accessoryType, deviceMode = null) {
      switch (deviceType) {
        case 'SHBLB-1':
          return ShellyBulbColorLightbulbAccessory
        case 'SHDM-1':
          return ShellyDimmerWhiteLightbulbAccessory
        case 'SHEM':
          if (accessoryType === 'outlet') {
            return ShellyEMOutletAccessory
          }
          return ShellyEMSwitchAccessory
        case 'SHHT-1':
          return ShellyHTAccessory
        case 'SHPLG-1':
        case 'SHPLG-S':
        case 'SHPLG2-1':
          if (accessoryType === 'outlet') {
            return ShellyPlugOutletAccessory
          }
          return ShellyPlugSwitchAccessory
        case 'SHRGBW2':
          if (deviceMode === 'white') {
            return ShellyRGBW2WhiteLightbulbAccessory
          }
          return ShellyRGBW2ColorLightbulbAccessory
        case 'SHSEN-1':
          return ShellySenseAccessory
        case 'SHSW-1':
          if (accessoryType === 'outlet') {
            return Shelly1OutletAccessory
          }
          return Shelly1SwitchAccessory
        case 'SHSW-21':
        case 'SHSW-25':
          if (deviceMode === 'roller') {
            return Shelly2WindowCoveringAccessory
          }
          if (accessoryType === 'outlet') {
            return Shelly2OutletAccessory
          }
          return Shelly2SwitchAccessory
        case 'SHSW-22':
          if (accessoryType === 'outlet') {
            return ShellyHDOutletAccessory
          }
          return ShellyHDSwitchAccessory
        case 'SHSW-44':
          if (accessoryType === 'outlet') {
            return Shelly4ProOutletAccessory
          }
          return Shelly4ProSwitchAccessory
        case 'SHSW-PM':
          if (accessoryType === 'outlet') {
            return Shelly1PMOutletAccessory
          }
          return Shelly1PMSwitchAccessory
        case 'SHWT-1':
          return ShellyFloodAccessory
      }

      return null
    },

    /**
     * Extracts and returns the configuration options for the accessory with
     * the given index.
     */
    getAccessoryConfig(config, index) {
      let accessoryConfig = {}
      if (Array.isArray(config.accessories) && config.accessories[index]) {
        accessoryConfig = config.accessories[index]
      }

      // merge the accessory config with the device config, but remove the
      // accessories array
      const cfg = Object.assign({}, config, accessoryConfig)
      delete cfg.accessories
      return cfg
    },

    /**
     * Creates an accessory for the given device and index.
     */
    createAccessory(device, index, config, log,
      platformAccessory = null) {
      const accessoryConfig = this.getAccessoryConfig(config, index)
      const accessoryType = accessoryConfig.type ||
        this.getDefaultAccessoryType(device.type, device.mode)
      const AccessoryClass = this.getAccessoryClass(
        device.type,
        accessoryType,
        device.mode
      )

      if (!AccessoryClass) {
        return null
      }

      const accessory = new AccessoryClass(
        device,
        index,
        accessoryConfig,
        log
      )
      // override the default name with a more friendly name
      accessory.defaultName = this.getDefaultAccessoryName(
        device.type,
        device.id,
        device.mode,
        index
      )
      accessory.setup(platformAccessory)
      return accessory
    },

    /**
     * Creates all accessories for the given device.
     */
    createAccessories(device, config, log) {
      // helper function that creates the given number of accessories
      const multiple = num => {
        return Array.from(
          { length: num },
          (_, i) => this.createAccessory(device, i, config, log)
        )
      }

      const accessories = multiple(
        this.getNumberOfAccessories(device.type, device.mode)
      )
      // skip unknown devices
      if (!accessories[0]) {
        return null
      }

      return accessories
    }
  }
}
