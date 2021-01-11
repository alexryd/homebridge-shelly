const colorConvert = require('color-convert')

const { handleFailedRequest } = require('../util/error-handlers')

module.exports = homebridge => {
  const Characteristic = homebridge.hap.Characteristic
  const LightbulbAbility = require('./lightbulb')(homebridge)

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
      this._hueSaturationTimeout = null
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

    _createService() {
      const service = super._createService()

      this._updateHueSaturation()

      service
        .setCharacteristic(Characteristic.Hue, this.hue)
        .setCharacteristic(Characteristic.Saturation, this.saturation)

      return service
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      const service = this.service

      service.getCharacteristic(Characteristic.Hue)
        .on('set', this._hueSetHandler.bind(this))

      service.getCharacteristic(Characteristic.Saturation)
        .on('set', this._saturationSetHandler.bind(this))

      this.device
        .on('change:' + this._redProperty, this._rgbChangeHandler, this)
        .on('change:' + this._greenProperty, this._rgbChangeHandler, this)
        .on('change:' + this._blueProperty, this._rgbChangeHandler, this)
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
        const service = this.service

        const on = service.getCharacteristic(Characteristic.On).value
        const brightness = service
          .getCharacteristic(Characteristic.Brightness).value
        const color = this._getRedGreenBlue(brightness)

        this.log.debug(
          'Setting light of device',
          this.device.type,
          this.device.id,
          'to',
          on ? 'on,' : 'off,',
          brightness + '%,',
          '(' + Object.values(color).join(',') + ')'
        )

        await this._setLight({
          [this._switchProperty]: on,
          // Shelly devices don't accept a brightness value of 0
          [this._brightnessProperty]: Math.max(brightness, 1),
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
    _getRedGreenBlue(brightness) {
      const rgb = colorConvert.hsv.rgb(this.hue, this.saturation, 100)
      const ret = {
        [this._redProperty]: rgb[0],
        [this._greenProperty]: rgb[1],
        [this._blueProperty]: rgb[2],
      }
      if (this.colorMode === 'rgbw') {
        ret[this._whiteProperty] =
          Math.round(Math.min(rgb[0], rgb[1], rgb[2]) * (brightness / 100))
      }
      return ret
    }

    /**
     * Handles changes from the device to any of the red, green or blue
     * properties.
     */
    _rgbChangeHandler() {
      this._updateHueSaturationDebounced()
    }

    /**
     * Updates the hue and saturation, debouncing the requests.
     */
    _updateHueSaturationDebounced() {
      if (this._hueSaturationTimeout !== null) {
        return
      }

      this._hueSaturationTimeout = setTimeout(() => {
        this.log.debug(
          'Color of device',
          this.device.type,
          this.device.id,
          'changed to',
          '(' + [this.red, this.green, this.blue].join(',') + ')'
        )

        this._updateHueSaturation()

        this.service
          .setCharacteristic(Characteristic.Hue, this.hue)
          .setCharacteristic(Characteristic.Saturation, this.saturation)

        this._hueSaturationTimeout = null
      }, 100)
    }

    /**
     * Updates the hue and saturation based on the current levels of red, green,
     * and blue.
     */
    _updateHueSaturation() {
      const hsv = colorConvert.rgb.hsv(this.red, this.green, this.blue)
      this.hue = hsv[0]
      this.saturation = hsv[1]
    }

    detach() {
      if (this._hueSaturationTimeout !== null) {
        clearTimeout(this._hueSaturationTimeout)
        this._hueSaturationTimeout = null
      }

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
