const { handleFailedRequest } = require('../error-handlers')

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
      super.identify(paired, async () => {
        const d = this.device
        const currentSwitchState = d.switch

        try {
          await this.setLight({ switch: !currentSwitchState })
          await new Promise(resolve => setTimeout(resolve, 1000))
          await this.setLight({ switch: currentSwitchState })
          callback()
        } catch (e) {
          handleFailedRequest(
            this.log,
            d,
            e,
            'Failed to identify device'
          )
          callback(e)
        }
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
      super.identify(paired, async () => {
        const d = this.device
        const currentSwitchState = d.switch

        try {
          await this.setLight({
            brightness: d.brightness,
            switch: !currentSwitchState,
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
          await this.setLight({
            brightness: d.brightness,
            switch: currentSwitchState,
          })
          callback()
        } catch (e) {
          handleFailedRequest(
            this.log,
            d,
            e,
            'Failed to identify device'
          )
          callback(e)
        }
      })
    }
  }

  class ShellyBulbColorLightbulbAccessory
    extends ShellyColorLightbulbAccessory {
    get defaultName() {
      return `Shelly Bulb ${this.device.id}`
    }
  }

  class ShellyDimmerWhiteLightbulbAccessory
    extends ShellyWhiteLightbulbAccessory {
    get defaultName() {
      return `Shelly Dimmer ${this.device.id}`
    }
  }

  class ShellyRGBW2ColorLightbulbAccessory
    extends ShellyColorLightbulbAccessory {
    get defaultName() {
      return `Shelly RGBW2 ${this.device.id}`
    }

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

    get defaultName() {
      return `Shelly RGBW2 ${this.device.id} #${this.index}`
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
      super.identify(paired, async () => {
        const d = this.device
        const currentSwitchState = d['switch' + this.index]

        try {
          await this.setLight({
            ['brightness' + this.index]: d['brightness' + this.index],
            ['switch' + this.index]: !currentSwitchState,
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
          await this.setLight({
            ['brightness' + this.index]: d['brightness' + this.index],
            ['switch' + this.index]: currentSwitchState,
          })
          callback()
        } catch (e) {
          handleFailedRequest(
            this.log,
            d,
            e,
            'Failed to identify device'
          )
          callback(e)
        }
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
