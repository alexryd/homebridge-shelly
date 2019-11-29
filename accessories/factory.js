
module.exports = homebridge => {
  const {
    Shelly1OutletAccessory,
    Shelly1PMOutletAccessory,
    Shelly1PMSwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly1MotionAccessory,
    Shelly2OutletAccessory,
    Shelly2SwitchAccessory,
    Shelly2WindowCoveringAccessory,
    Shelly2MotionAccessory,
    Shelly4ProOutletAccessory,
    Shelly4ProSwitchAccessory,
    ShellyBulbColorLightbulbAccessory,
    ShellyDimmerWhiteLightbulbAccessory,
    ShellyEMOutletAccessory,
    ShellyEMSwitchAccessory,
    ShellyFloodAccessory,
    ShellyHDOutletAccessory,
    ShellyHDSwitchAccessory,
    ShellyHTAccessory,
    ShellyPlugOutletAccessory,
    ShellyPlugSwitchAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
    ShellySenseAccessory,
  } = require('./index')(homebridge)

  return {
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
          if (accessoryType === 'motion') {
            return Shelly1MotionAccessory
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
          if (accessoryType === 'motion') {
            return Shelly2MotionAccessory
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

      return new AccessoryClass(
        device,
        index,
        accessoryConfig,
        log,
        platformAccessory
      )
    },

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
