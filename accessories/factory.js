
module.exports = homebridge => {
  const {
    Shelly2DoorAccessory,
  } = require('./doors')(homebridge)

  const {
    Shelly2GarageDoorOpenerAccessory,
  } = require('./garage-door-openers')(homebridge)

  const {
    ShellyColorLightbulbAccessory,
    ShellyColorTemperatureLightbulbAccessory,
    ShellyWhiteLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
  } = require('./lightbulbs')(homebridge)

  const {
    ShellyRelayOutletAccessory,
  } = require('./outlets')(homebridge)

  const {
    ShellyDoorWindowAccessory,
    ShellyDoorWindow2Accessory,
    ShellyFloodAccessory,
    ShellyGasSmokeSensorAccessory,
    ShellyHTAccessory,
    ShellyRelayContactSensorAccessory,
    ShellyRelayMotionSensorAccessory,
    ShellyRelayOccupancySensorAccessory,
    ShellySenseAccessory,
    ShellyMotionAccessory,
    ShellyTemperatureAddOnAccessory
  } = require('./sensors')(homebridge)

  const {
    ShellyButton1StatelessSwitchAccessory,
    ShellyInputStatelessSwitchAccessory,
  } = require('./stateless-switches')(homebridge)

  const {
    ShellyRelaySwitchAccessory,
  } = require('./switches')(homebridge)

  const {
    ShellyThermostatAccessory,
  } = require('./thermostat')(homebridge)

  const {
    ShellyRelayValveAccessory,
  } = require('./valves')(homebridge)

  const {
    Shelly2WindowCoveringAccessory,
  } = require('./window-coverings')(homebridge)

  const {
    Shelly2WindowAccessory,
  } = require('./windows')(homebridge)

  const FACTORIES = new Map()

  /**
   * Base class for all accessory factories.
   */
  class AccessoryFactory {
    /**
     * @param {object} device - The device that accessories will be created for.
     */
    constructor(device, config) {
      this.device = device
      this.config = config
    }

    /**
     * The default accessory type identifier for the device.
     */
    get defaultAccessoryType() {
      return ''
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
      const d = this.device
      const n = []

      if (d.name) {
        n.push(d.name)
      } else {
        n.push(d.modelName)
        n.push(d.id)
      }

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
   * Base class for accessory factories of devices with relays.
   */
  class RelayAccessoryFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'switch'
    }

    /**
     * The number of power meters that the device has.
     */
    get numberOfPowerMeters() {
      return this.numberOfAccessories
    }

    _createAccessory(accessoryType, index, config, log) {
      const powerMeterIndex = this.numberOfPowerMeters > 0
        ? Math.min(index, this.numberOfPowerMeters - 1)
        : false

      return this._createAccessoryForRelay(
        accessoryType,
        index,
        config,
        log,
        powerMeterIndex
      )
    }

    /**
     * Helper method that creates an accessory of the given type for devices
     * that have one or more relays.
     */
    _createAccessoryForRelay(accessoryType, ...opts) {
      if (accessoryType === 'contactSensor') {
        return new ShellyRelayContactSensorAccessory(this.device, ...opts)
      } else if (accessoryType === 'motionSensor') {
        return new ShellyRelayMotionSensorAccessory(this.device, ...opts)
      } else if (accessoryType === 'occupancySensor') {
        return new ShellyRelayOccupancySensorAccessory(this.device, ...opts)
      } else if (accessoryType === 'outlet') {
        return new ShellyRelayOutletAccessory(this.device, ...opts)
      } else if (accessoryType === 'valve') {
        return new ShellyRelayValveAccessory(this.device, ...opts)
      }
      return new ShellyRelaySwitchAccessory(this.device, ...opts)
    }
  }

  /**
   * Shelly Air factory.
   */
  class ShellyAirFactory extends RelayAccessoryFactory {}
  FACTORIES.set('SHAIR-1', ShellyAirFactory)

  /**
   * Shelly Bulb factory.
   */
  class ShellyBulbFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'colorLightbulb'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyColorLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHBLB-1', ShellyBulbFactory)

  /**
   * Shelly Button1 factory.
   */
  class ShellyButton1Factory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'statelessSwitch'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyButton1StatelessSwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHBTN-1', ShellyButton1Factory)

  /**
   * Shelly Button1 version 2 factory.
   */
  class ShellyButton1V2Factory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'statelessSwitch'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyButton1StatelessSwitchAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHBTN-2', ShellyButton1V2Factory)

  /**
   * Shelly Duo factory.
   */
  class ShellyDuo extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'colorTemperatureLightbulb'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyColorTemperatureLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHBDUO-1', ShellyDuo)

  /**
   * Shelly Color Bulb factory.
   */
  class ShellyColorBulbFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'colorLightbulb'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyColorLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHCB-1', ShellyColorBulbFactory)

  /**
   * Shelly Dimmer factory.
   */
  class ShellyDimmerFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'whiteLightbulb'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyWhiteLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHDM-1', ShellyDimmerFactory)
  FACTORIES.set('SHDM-2', ShellyDimmerFactory)

  /**
   * Shelly Door/Window factory.
   */
  class ShellyDoorWindowFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'sensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyDoorWindowAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHDW-1', ShellyDoorWindowFactory)

  /**
   * Shelly Door/Window 2 factory.
   */
  class ShellyDoorWindow2Factory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'sensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyDoorWindow2Accessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHDW-2', ShellyDoorWindow2Factory)

  /**
   * Shelly EM factory.
   */
  class ShellyEMFactory extends RelayAccessoryFactory {
    get numberOfPowerMeters() {
      return 2
    }
  }
  FACTORIES.set('SHEM', ShellyEMFactory)

  /**
   * Shelly 3EM factory.
   */
  class Shelly3EMFactory extends RelayAccessoryFactory {
    get numberOfPowerMeters() {
      return 3
    }
  }
  FACTORIES.set('SHEM-3', Shelly3EMFactory)

  /**
   * Shelly Gas factory.
   */
  class ShellyGasFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'smokeSensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyGasSmokeSensorAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHGS-1', ShellyGasFactory)

  /**
   * Shelly H&T factory.
   */
  class ShellyHTFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'sensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyHTAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHHT-1', ShellyHTFactory)

  /**
   * Shelly i3 factory.
   */
  class ShellyI3Factory extends AccessoryFactory {
    get defaultName() {
      return 'Shelly i3'
    }

    get defaultAccessoryType() {
      return 'statelessSwitch'
    }

    _createAccessory(accessoryType, index, config, log) {
      return new ShellyInputStatelessSwitchAccessory(
        this.device,
        index,
        config,
        log,
        3
      )
    }
  }
  FACTORIES.set('SHIX3-1', ShellyI3Factory)

  /**
   * Shelly Plug factory.
   */
  class ShellyPlugFactory extends RelayAccessoryFactory {}
  FACTORIES.set('SHPLG-1', ShellyPlugFactory)
  FACTORIES.set('SHPLG2-1', ShellyPlugFactory)

  /**
   * Shelly Plug S factory.
   */
  class ShellyPlugSFactory extends ShellyPlugFactory {}
  FACTORIES.set('SHPLG-S', ShellyPlugSFactory)

  /**
   * Shelly Plug US factory.
   */
  class ShellyPlugUSFactory extends ShellyPlugFactory {}
  FACTORIES.set('SHPLG-U1', ShellyPlugUSFactory)

  /**
   * Shelly RGBW2 factory.
   */
  class ShellyRGBW2Factory extends AccessoryFactory {
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
      return new ShellyColorLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHRGBW2', ShellyRGBW2Factory)

  /**
   * Shelly Sense factory.
   */
  class ShellySenseFactory extends AccessoryFactory {
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
  class Shelly1Factory extends RelayAccessoryFactory {
    get numberOfPowerMeters() {
      return 0
    }

    get numberOfAccessories() {
      if (this.config.type === 'temperatureSensor' ||
          this.config.type === 'thermostat') {
        return this.config.sensors || super.numberOfAccessories
      }
      return super.numberOfAccessories
    }

    _createAccessory(accessoryType, index, config, log) {
      if (accessoryType === 'temperatureSensor') {
        return new ShellyTemperatureAddOnAccessory(
          this.device,
          index,
          config,
          log)
      } else if (accessoryType === 'thermostat') {
        return new ShellyThermostatAccessory(
          this.device,
          index,
          config,
          log)
      }
      return super._createAccessory(accessoryType, index, config, log)
    }
  }
  FACTORIES.set('SHSW-1', Shelly1Factory)

  /**
   * Shelly 2 factory.
   */
  class Shelly2Factory extends RelayAccessoryFactory {
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

    get numberOfPowerMeters() {
      return 1
    }

    _createAccessory(accessoryType, index, config, log) {
      if (this.device.mode === 'roller') {
        if (accessoryType === 'door') {
          return new Shelly2DoorAccessory(this.device, index, config, log)
        } else if (accessoryType === 'garageDoorOpener') {
          return new Shelly2GarageDoorOpenerAccessory(
            this.device,
            index,
            config,
            log
          )
        } else if (accessoryType === 'window') {
          return new Shelly2WindowAccessory(this.device, index, config, log)
        }
        return new Shelly2WindowCoveringAccessory(
          this.device,
          index,
          config,
          log
        )
      }

      return super._createAccessory(accessoryType, index, config, log)
    }
  }
  FACTORIES.set('SHSW-21', Shelly2Factory)

  /**
   * Shelly HD factory.
   */
  class ShellyHDFactory extends RelayAccessoryFactory {
    get numberOfAccessories() {
      return 2
    }
  }
  FACTORIES.set('SHSW-22', ShellyHDFactory)

  /**
   * Shelly 2.5 factory.
   */
  class Shelly25Factory extends Shelly2Factory {
    get numberOfPowerMeters() {
      if (this.device.mode === 'roller') {
        return 1
      }
      return 2
    }
  }
  FACTORIES.set('SHSW-25', Shelly25Factory)

  /**
   * Shelly 4Pro factory.
   */
  class Shelly4ProFactory extends RelayAccessoryFactory {
    get numberOfAccessories() {
      return 4
    }
  }
  FACTORIES.set('SHSW-44', Shelly4ProFactory)

  /**
   * Shelly 1L factory.
   */
  class Shelly1LFactory extends RelayAccessoryFactory {}
  FACTORIES.set('SHSW-L', Shelly1LFactory)

  /**
   * Shelly 1PM factory.
   */
  class Shelly1PMFactory extends RelayAccessoryFactory {}
  FACTORIES.set('SHSW-PM', Shelly1PMFactory)

  /**
   * Shelly Uni factory.
   */
  class ShellyUniFactory extends RelayAccessoryFactory {
    get numberOfAccessories() {
      return 2
    }
  }
  FACTORIES.set('SHUNI-1', ShellyUniFactory)

  /**
   * Shelly Vintage factory.
   */
  class ShellyVintageFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'whiteLightbulb'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyWhiteLightbulbAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHVIN-1', ShellyVintageFactory)

  /**
   * Shelly Flood factory.
   */
  class ShellyFloodFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'sensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyFloodAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHWT-1', ShellyFloodFactory)

  /**
   * Shelly Motion factory.
   */
  class ShellyMotionFactory extends AccessoryFactory {
    get defaultAccessoryType() {
      return 'sensor'
    }

    _createAccessory(accessoryType, ...opts) {
      return new ShellyMotionAccessory(this.device, ...opts)
    }
  }
  FACTORIES.set('SHMOS-01', ShellyMotionFactory)

  /**
   * Returns the factory for the given device.
   */
  const getFactory = (device, config = null) => {
    const FactoryClass = FACTORIES.get(device.type)
    if (!FactoryClass) {
      return null
    }
    return new FactoryClass(device, config)
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
      const factory = getFactory(device, config)
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
      const factory = getFactory(device, config)
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
