
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

  const FACTORIES = new Map()

  /**
   * Base class for all accessory factories.
   */
  class AccessoryFactory {
    /**
     * @param {object} device - The device that accessories will be created for.
     */
    constructor(device) {
      this.device = device
    }

    /**
     * The friendly name of this type of device.
     */
    get friendlyName() {
      return this.device.type
    }

    /**
     * The default accessory type identifier for the device.
     */
    get defaultAccessoryType() {
      // 'switch' is the most common type of accessory
      return 'switch'
    }

    /**
     * The number of accessories that this type of device has.
     */
    get numberOfAccessories() {
      return 1
    }

    /**
     * Returns a default name for the device and the given accessory index.
     */
    getDefaultAccessoryName(index) {
      const n = [
        this.friendlyName,
        this.device.id,
      ]
      // only add the index to the name for devices that have more than one
      // accessory
      if (this.numberOfAccessories > 1) {
        n.push('#' + index)
      }
      return n.join(' ')
    }

    /**
     * Creates an accessory for the device, with the given type and index.
     */
    createAccessory(accessoryType, index, config, log) {
      const accessory = this._createAccessory(accessoryType, index, config, log)
      if (accessory) {
        // override the default name with a more friendly name
        accessory.defaultName = this.getDefaultAccessoryName(index)
      }
      return accessory
    }

    _createAccessory(accessoryType, index, config, log) {
      return null
    }
  }

  /**
   * Shelly Bulb factory.
   */
  class ShellyBulbFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly Bulb'
    }

    get defaultAccessoryType() {
      return 'colorLightbulb'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyBulbColorLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHBLB-1', ShellyBulbFactory)

  /**
   * Shelly Dimmer factory.
   */
  class ShellyDimmerFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly Dimmer'
    }

    get defaultAccessoryType() {
      return 'whiteLightbulb'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyDimmerWhiteLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHDM-1', ShellyDimmerFactory)

  /**
   * Shelly EM factory.
   */
  class ShellyEMFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly EM'
    }

    _createAccessory(accessoryType, ...opts) {
      if (accessoryType === 'outlet') {
        return new ShellyEMOutletAccessory(this.device, ...opts)
      }
      return new ShellyEMSwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHEM', ShellyEMFactory)

  /**
   * Shelly H&T factory.
   */
  class ShellyHTFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly H&T'
    }

    get defaultAccessoryType() {
      return 'sensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyHTAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHHT-1', ShellyHTFactory)

  /**
   * Shelly Plug factory.
   */
  class ShellyPlugFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly Plug'
    }

    _createAccessory(accessoryType, ...opts) {
      if (accessoryType === 'outlet') {
        return new ShellyPlugOutletAccessory(this.device, ...opts)
      }
      return new ShellyPlugSwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHPLG-1', ShellyPlugFactory)
  FACTORIES.set('SHPLG2-1', ShellyPlugFactory)

  /**
   * Shelly Plug S factory.
   */
  class ShellyPlugSFactory extends ShellyPlugFactory {
    get friendlyName() {
      return 'Shelly Plug S'
    }
  }
  FACTORIES.set('SHPLG-S', ShellyPlugSFactory)

  /**
   * Shelly RGBW2 factory.
   */
  class ShellyRGBW2Factory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly RGBW2'
    }

    get defaultAccessoryType() {
      if (this.device.mode === 'white') {
        return 'whiteLightbulb'
      }
      return 'colorLightbulb'
    }

    get numberOfAccessories() {
      if (this.device.mode === 'white') {
        return 4
      }
      return 1
    }

    _createAccessory(accessoryType, ...opts) {
      if (this.device.mode === 'white') {
        return new ShellyRGBW2WhiteLightbulbAccessory(this.device, ...opts)
      }
      return new ShellyRGBW2ColorLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHRGBW2', ShellyRGBW2Factory)

  /**
   * Shelly Sense factory.
   */
  class ShellySenseFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly Sense'
    }

    get defaultAccessoryType() {
      return 'sensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellySenseAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHSEN-1', ShellySenseFactory)

  /**
   * Shelly 1 factory.
   */
  class Shelly1Factory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly 1'
    }

    _createAccessory(accessoryType, ...opts) {
      if (accessoryType === 'outlet') {
        return new Shelly1OutletAccessory(this.device, ...opts)
      }
      return new Shelly1SwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHSW-1', Shelly1Factory)

  /**
   * Shelly 2 factory.
   */
  class Shelly2Factory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly 2'
    }

    get defaultAccessoryType() {
      if (this.device.mode === 'roller') {
        return 'windowCovering'
      }
      return 'switch'
    }

    get numberOfAccessories() {
      if (this.device.mode === 'roller') {
        return 1
      }
      return 2
    }

    _createAccessory(accessoryType, ...opts) {
      if (this.device.mode === 'roller') {
        return new Shelly2WindowCoveringAccessory(this.device, ...opts)
      }
      if (accessoryType === 'outlet') {
        return new Shelly2OutletAccessory(this.device, ...opts)
      }
      return new Shelly2SwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHSW-21', Shelly2Factory)

  /**
   * Shelly HD factory.
   */
  class ShellyHDFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly HD'
    }

    get numberOfAccessories() {
      return 2
    }

    _createAccessory(accessoryType, ...opts) {
      if (accessoryType === 'outlet') {
        return new ShellyHDOutletAccessory(this.device, ...opts)
      }
      return new ShellyHDSwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHSW-22', ShellyHDFactory)

  /**
   * Shelly 2.5 factory.
   */
  class Shelly25Factory extends Shelly2Factory {
    get friendlyName() {
      return 'Shelly 2.5'
    }
  }
  FACTORIES.set('SHSW-25', Shelly25Factory)

  /**
   * Shelly 4Pro factory.
   */
  class Shelly4ProFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly 4Pro'
    }

    get numberOfAccessories() {
      return 4
    }

    _createAccessory(accessoryType, ...opts) {
      if (accessoryType === 'outlet') {
        return new Shelly4ProOutletAccessory(this.device, ...opts)
      }
      return new Shelly4ProSwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHSW-44', Shelly4ProFactory)

  /**
   * Shelly 1PM factory.
   */
  class Shelly1PMFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly 1PM'
    }

    _createAccessory(accessoryType, ...opts) {
      if (accessoryType === 'outlet') {
        return new Shelly1PMOutletAccessory(this.device, ...opts)
      }
      return new Shelly1PMSwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHSW-PM', Shelly1PMFactory)

  /**
   * Shelly Flood factory.
   */
  class ShellyFloodFactory extends AccessoryFactory {
    get friendlyName() {
      return 'Shelly Flood'
    }

    get defaultAccessoryType() {
      return 'sensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyFloodAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHWT-1', ShellyFloodFactory)

  /**
   * Returns the factory for the given device.
   */
  const getFactory = device => {
    const FactoryClass = FACTORIES.get(device.type)
    if (!FactoryClass) {
      return null
    }
    return new FactoryClass(device)
  }

  return {
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
     * Returns the default accessory type identifier for the given device type
     * and (optionally) mode.
     */
    getDefaultAccessoryType(deviceType, deviceMode = null) {
      // create a dummy device
      const device = {
        id: '_',
        type: deviceType,
        mode: deviceMode,
      }
      const factory = getFactory(device)
      if (!factory) {
        return null
      }
      return factory.defaultAccessoryType
    },

    /**
     * Creates an accessory for the given device and index.
     */
    createAccessory(device, index, config, log,
      platformAccessory = null) {
      const factory = getFactory(device)
      if (!factory) {
        return null
      }

      const accessoryConfig = this.getAccessoryConfig(config, index)
      const accessoryType = accessoryConfig.type || factory.defaultAccessoryType

      const accessory = factory.createAccessory(
        accessoryType,
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
      const factory = getFactory(device)
      if (!factory) {
        return null
      }

      // helper function that creates the given number of accessories
      const multiple = num => {
        return Array.from(
          { length: num },
          (_, i) => this.createAccessory(device, i, config, log)
        )
      }

      return multiple(factory.numberOfAccessories)
    }
  }
}
