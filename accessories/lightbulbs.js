
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const ColorLightbulbAbility =
    require('../abilities/color-lightbulb')(homebridge)
  const LightbulbAbility = require('../abilities/lightbulb')(homebridge)
  const { ShellyAccessory } = require('./base')(homebridge)

  class ShellyColorLightbulbAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('colorLightbulb', device, index, config, log)

      const colorMode = config.colorMode || 'rgbw'

      if (colorMode !== 'rgb' && colorMode !== 'rgbw') {
        throw new Error(`Invalid color mode "${colorMode}"`)
      }

      this.abilities.push(new ColorLightbulbAbility(
        'switch',
        'gain',
        'red',
        'green',
        'blue',
        'white',
        this.setLight.bind(this),
        colorMode
      ))
    }

    get category() {
      return Accessory.Categories.LIGHTBULB
    }

    /**
     * Sets the light according to the supplied options.
     * @returns {Promise} A Promise that resolves when the state of the relay
     * has been updated.
     */
    setLight(opts) {
      return this.device.setColor(opts)
    }

    identify(paired, callback) {
      super.identify(paired, () => {
        this._identifyBySwitching(
          this.device.switch,
          state => this.setLight({ switch: state }),
          callback
        )
      })
    }
  }

  class ShellyWhiteLightbulbAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('whiteLightbulb', device, index, config, log)

      this.abilities.push(new LightbulbAbility(
        'switch',
        'brightness',
        this.setLight.bind(this)
      ))
    }

    get category() {
      return Accessory.Categories.LIGHTBULB
    }

    /**
     * Sets the light according to the supplied options.
     * @returns {Promise} A Promise that resolves when the state of the relay
     * has been updated.
     */
    setLight(opts) {
      return this.device.setWhite(opts.brightness, opts.switch)
    }

    identify(paired, callback) {
      super.identify(paired, () => {
        this._identifyBySwitching(
          this.device.switch,
          state => this.setLight({
            brightness: this.device.brightness,
            switch: state,
          }),
          callback
        )
      })
    }
  }

  class ShellyBulbColorLightbulbAccessory
    extends ShellyColorLightbulbAccessory {}

  class ShellyDimmerWhiteLightbulbAccessory
    extends ShellyWhiteLightbulbAccessory {}

  class ShellyRGBW2ColorLightbulbAccessory
    extends ShellyColorLightbulbAccessory {
    _createPlatformAccessory() {
      const pa = super._createPlatformAccessory()
      pa.context.mode = 'color'
      return pa
    }
  }

  class ShellyRGBW2WhiteLightbulbAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('whiteLightbulb', device, index, config, log)

      this.abilities.push(new LightbulbAbility(
        'switch' + index,
        'brightness' + index,
        this.setLight.bind(this)
      ))
    }

    get category() {
      return Accessory.Categories.LIGHTBULB
    }

    _createPlatformAccessory() {
      const pa = super._createPlatformAccessory()
      pa.context.mode = 'white'
      return pa
    }

    /**
     * Sets the light according to the supplied options.
     * @returns {Promise} A Promise that resolves when the state of the relay
     * has been updated.
     */
    setLight(opts) {
      return this.device.setWhite(
        this.index,
        opts['brightness' + this.index],
        opts['switch' + this.index]
      )
    }

    identify(paired, callback) {
      super.identify(paired, () => {
        this._identifyBySwitching(
          this.device['switch' + this.index],
          state => this.setLight({
            ['brightness' + this.index]: this.device['brightness' + this.index],
            ['switch' + this.index]: state,
          }),
          callback
        )
      })
    }
  }

  return {
    ShellyBulbColorLightbulbAccessory,
    ShellyDimmerWhiteLightbulbAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
  }
}
