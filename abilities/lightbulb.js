const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class LightbulbAbility extends Ability {
    /**
     * @param {string} switchProperty - The device property used to indicate the
     * switch state.
     * @param {string} brightnessProperty - The device property used to indicate
     * the current brightness.
     * @param {function} setLight - A function that updates the device's switch
     * state and brightness. Must return a Promise.
     * @param {string} colorTemperatureProperty - The device property used to
     * indicate the current color temperature, if supported.
     */
    constructor(switchProperty, brightnessProperty, setLight,
      colorTemperatureProperty = null) {
      super()

      this._switchProperty = switchProperty
      this._brightnessProperty = brightnessProperty
      this._setLight = setLight
      this._colorTemperatureProperty = colorTemperatureProperty
      this._deviceLightTimeout = null
    }

    get service() {
      return this.platformAccessory.getService(Service.Lightbulb)
    }

    get on() {
      return this.device[this._switchProperty]
    }

    get brightness() {
      return this.device[this._brightnessProperty]
    }

    get colorTemperature() {
      return this.device[this._colorTemperatureProperty]
    }

    _colorTemperatureFromHomekit(value) {
      // convert from reciprocal megaKelvin to Kelvin
      return Math.round(1000000 / value)
    }

    _colorTemperatureToHomekit(value) {
      // convert from Kelvin to reciprocal megaKelvin
      return Math.round(1000000 / value)
    }

    _createService() {
      const service = new Service.Lightbulb()
        .setCharacteristic(Characteristic.On, this.on)
        .setCharacteristic(Characteristic.Brightness, this.brightness)

      if (this._colorTemperatureProperty) {
        service.addCharacteristic(Characteristic.ColorTemperature)
          // set valid values to 2700 - 6500 K
          .setProps({ minValue: 154, maxValue: 370 })
          .setValue(this._colorTemperatureToHomekit(this.colorTemperature))
      }

      return service
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      const service = this.service

      service.getCharacteristic(Characteristic.On)
        .on('set', this._onSetHandler.bind(this))

      service.getCharacteristic(Characteristic.Brightness)
        .on('set', this._brightnessSetHandler.bind(this))

      this.device
        .on(
          'change:' + this._switchProperty,
          this._switchChangeHandler,
          this
        )
        .on(
          'change:' + this._brightnessProperty,
          this._brightnessChangeHandler,
          this
        )

      if (this._colorTemperatureProperty) {
        service.getCharacteristic(Characteristic.ColorTemperature)
          .on('set', this._colorTemperatureSetHandler.bind(this))

        this.device.on(
          'change:' + this._colorTemperatureProperty,
          this._colorTemperatureChangeHandler,
          this
        )
      }
    }

    /**
     * Handles changes from HomeKit to the On characteristic.
     */
    _onSetHandler(newValue, callback) {
      if (this.on !== newValue) {
        this._updateDeviceLightDebounced()
      }

      callback()
    }

    /**
     * Handles changes from HomeKit to the Brightness characteristic.
     */
    _brightnessSetHandler(newValue, callback) {
      if (this.brightness !== newValue) {
        this._updateDeviceLightDebounced()
      }

      callback()
    }

    /**
     * Handles changes from HomeKit to the ColorTemperature characteristic.
     */
    _colorTemperatureSetHandler(newValue, callback) {
      if (this.colorTemperature !== newValue) {
        this._updateDeviceLightDebounced()
      }

      callback()
    }

    /**
     * Updates the device's switch state and brightness, debouncing the
     * requests.
     */
    _updateDeviceLightDebounced() {
      if (this._deviceLightTimeout !== null) {
        return
      }

      this._deviceLightTimeout = setTimeout(() => {
        this._updateDeviceLight()
        this._deviceLightTimeout = null
      }, 100)
    }

    /**
     * Updates the device's switch state and brightness.
     */
    async _updateDeviceLight() {
      try {
        const service = this.service

        const on = service.getCharacteristic(Characteristic.On).value
        const brightness = service
          .getCharacteristic(Characteristic.Brightness).value
        const colorTemperature = this._colorTemperatureProperty
          ? this._colorTemperatureFromHomekit(
            service.getCharacteristic(Characteristic.ColorTemperature).value
          )
          : null

        this.log.debug(
          'Setting light of device',
          this.device.type,
          this.device.id,
          'to',
          on ? 'on,' : 'off,',
          brightness,
          '%',
          colorTemperature !== null ? ', ' + colorTemperature + 'K' : ''
        )

        const props = {
          [this._switchProperty]: on,
          // Shelly devices don't accept a brightness value of 0
          [this._brightnessProperty]: Math.max(brightness, 1),
        }

        if (colorTemperature !== null) {
          props[this._colorTemperatureProperty] = colorTemperature
        }

        await this._setLight(props)
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
     * Handles changes from the device to the switch property.
     */
    _switchChangeHandler(newValue) {
      this.log.debug(
        this._switchProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(Characteristic.On)
        .setValue(this.on)
    }

    /**
     * Handles changes from the device to the brightness property.
     */
    _brightnessChangeHandler(newValue) {
      this.log.debug(
        this._brightnessProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(Characteristic.Brightness)
        .setValue(this.brightness)
    }

    /**
     * Handles changes from the device to the colorTemperature property.
     */
    _colorTemperatureChangeHandler(newValue) {
      this.log.debug(
        this._colorTemperatureProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(Characteristic.ColorTemperature)
        .setValue(this._colorTemperatureToHomekit(this.colorTemperature))
    }

    detach() {
      if (this._deviceLightTimeout !== null) {
        clearTimeout(this._deviceLightTimeout)
        this._deviceLightTimeout = null
      }

      this.device
        .removeListener(
          'change:' + this._switchProperty,
          this._switchChangeHandler,
          this
        )
        .removeListener(
          'change:' + this._brightnessProperty,
          this._brightnessChangeHandler,
          this
        )
        .removeListener(
          'change:' + this._colorTemperatureProperty,
          this._colorTemperatureChangeHandler,
          this
        )

      super.detach()
    }
  }

  return LightbulbAbility
}
