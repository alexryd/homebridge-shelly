const colorConvert = require('color-convert')

const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Characteristic = homebridge.hap.Characteristic
  const LightbulbAbility = require('./lightbulb')(homebridge)
  const Service = homebridge.hap.Service

  class ColorLightbulbAbility extends LightbulbAbility {
    /**
     * @param {string} switchProperty - The device property used to indicate the
     * switch state.
     * @param {string} brightnessProperty - The device property used to indicate
     * the current brightness.
     * @param {string} redProperty - The device property used to indicate the
     * current level of red.
     * @param {string} greenProperty - The device property used to indicate the
     * current level of green.
     * @param {string} blueProperty - The device property used to indicate the
     * current level of blue.
     * @param {string} whiteProperty - The device property used to indicate the
     * current level of white. This is only applicable when colorMode is set to
     * "rgbw".
     * @param {function} setLight - A function that updates the device's switch
     * state, brightness and color. Must return a Promise.
     * @param {string} colorMode - The color mode. Must be either "rgb" or
     * "rgbw".
     */
    constructor(switchProperty, brightnessProperty, redProperty, greenProperty,
      blueProperty, whiteProperty, setLight, colorMode = 'rgbw') {
      super(switchProperty, brightnessProperty, setLight)

      if (colorMode !== 'rgb' && colorMode !== 'rgbw') {
        throw new Error(`Invalid color mode "${colorMode}"`)
      }

      this._redProperty = redProperty
      this._greenProperty = greenProperty
      this._blueProperty = blueProperty
      this._whiteProperty = whiteProperty
      this.colorMode = colorMode
      this.hue = 0
      this.saturation = 0
      this._updatingHueSaturation = false
    }

    get red() {
      return this.device[this._redProperty]
    }

    get green() {
      return this.device[this._greenProperty]
    }

    get blue() {
      return this.device[this._blueProperty]
    }

    get white() {
      return this.device[this._whiteProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()
      this._updateHueSaturation()
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      const lightbulbService = this.platformAccessory
        .getService(Service.Lightbulb)

      lightbulbService.getCharacteristic(Characteristic.Hue)
        .on('set', this._hueSetHandler.bind(this))

      lightbulbService.getCharacteristic(Characteristic.Saturation)
        .on('set', this._saturationSetHandler.bind(this))

      this.device
        .on('change:' + this._redProperty, this._rgbChangeHandler, this)
        .on('change:' + this._greenProperty, this._rgbChangeHandler, this)
        .on('change:' + this._blueProperty, this._rgbChangeHandler, this)

      if (this.colorMode === 'rgbw') {
        this.device.on(
          'change:' + this._whiteProperty,
          this._rgbChangeHandler,
          this
        )
      }
    }

    /**
     * Handles changes from HomeKit to the Hue characteristic.
     */
    async _hueSetHandler(newValue, callback) {
      if (this.hue !== newValue) {
        this.hue = newValue
        this._updateDeviceLightDebounced()
      }

      callback()
    }

    /**
     * Handles changes from HomeKit to the Saturation characteristic.
     */
    async _saturationSetHandler(newValue, callback) {
      if (this.saturation !== newValue) {
        this.saturation = newValue
        this._updateDeviceLightDebounced()
      }

      callback()
    }

    async _updateDeviceLight() {
      try {
        const lightbulbService = this.platformAccessory
          .getService(Service.Lightbulb)

        const on = lightbulbService.getCharacteristic(Characteristic.On).value
        const brightness = lightbulbService
          .getCharacteristic(Characteristic.Brightness).value
        const color = this._getRedGreenBlue()

        this.log.debug(
          'Setting light of device',
          this.device.type,
          this.device.id,
          'to',
          on ? 'on,' : 'off,',
          brightness,
          '%,',
          '(' + Object.values(color).join(',') + ')'
        )

        await this._setLight({
          [this._switchProperty]: on,
          [this._brightnessProperty]: brightness,
          ...color
        })
      } catch (e) {
        handleFailedRequest(
          this.log,
          this.device,
          e,
          'Failed to set light'
        )
      }
    }

    /**
     * Converts hue and saturation to RGB/RGBW.
     */
    _getRedGreenBlue() {
      const rgb = colorConvert.hsv.rgb(
        this.hue,
        // in rgbw mode we set the saturation to 100 here when converting to RGB
        // and then set the white component to the actual saturation
        this.colorMode === 'rgbw' ? 100 : this.saturation,
        100
      )
      const ret = {
        [this._redProperty]: rgb[0],
        [this._greenProperty]: rgb[1],
        [this._blueProperty]: rgb[2],
      }
      if (this.colorMode === 'rgbw') {
        ret[this._whiteProperty] = 255 - Math.round(this.saturation / 100 * 255)
      }
      return ret
    }

    /**
     * Handles changes from the device to any of the red, green, blue or white
     * properties.
     */
    _rgbChangeHandler() {
      this._updateHueSaturationDebounced()
    }

    /**
     * Updates the hue and saturation, debouncing the requests.
     */
    _updateHueSaturationDebounced() {
      if (this._updatingHueSaturation === true) {
        return
      }
      this._updatingHueSaturation = true

      setImmediate(() => {
        this.log.debug(
          'Color of device',
          this.device.type,
          this.device.id,
          'changed to',
          '(' + (this.colorMode === 'rgbw'
            ? [this.red, this.green, this.blue, this.white]
            : [this.red, this.green, this.blue]).join(',') + ')'
        )

        this._updateHueSaturation()
        this._updatingHueSaturation = false
      })
    }

    /**
     * Updates the hue and saturation based on the current levels of red, green,
     * blue and (optionally) white.
     */
    _updateHueSaturation() {
      const hsv = colorConvert.rgb.hsv(this.red, this.green, this.blue)
      this.hue = hsv[0]
      this.saturation = this.colorMode === 'rgbw'
        // in rgbw mode we use the white component as the saturation, otherwise
        // we calculate it from the red, green and blue components
        ? 100 - Math.round(this.white / 255 * 100)
        : hsv[1]

      this.platformAccessory.getService(Service.Lightbulb)
        .setCharacteristic(Characteristic.Hue, this.hue)
        .setCharacteristic(Characteristic.Saturation, this.saturation)
    }

    detach() {
      this.device
        .removeListener(
          'change:' + this._redProperty,
          this._rgbChangeHandler,
          this
        )
        .removeListener(
          'change:' + this._greenProperty,
          this._rgbChangeHandler,
          this
        )
        .removeListener(
          'change:' + this._blueProperty,
          this._rgbChangeHandler,
          this
        )
        .removeListener(
          'change:' + this._whiteProperty,
          this._rgbChangeHandler,
          this
        )

      super.detach()
    }
  }

  return ColorLightbulbAbility
}
