
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
      accessory.setup(platformAccessory)
      return accessory
    },

    /**
     * Creates all accessories for the given device.
     */
    createAccessories(device, config, log) {
      const type = device.type
      const mode = device.mode

      const multiple = num => {
        return Array.from(
          { length: num },
          (_, i) => this.createAccessory(device, i, config, log)
        )
      }

      if (type === 'SHRGBW2' && mode === 'white') {
        return multiple(4)
      } else if (type === 'SHSW-21' && mode !== 'roller') {
        return multiple(2)
      } else if (type === 'SHSW-22') {
        return multiple(2)
      } else if (type === 'SHSW-25' && mode !== 'roller') {
        return multiple(2)
      } else if (type === 'SHSW-44') {
        return multiple(4)
      }

      const accessory = this.createAccessory(device, 0, config, log)
      if (accessory) {
        return [accessory]
      }

      return null
    }
  }
}
