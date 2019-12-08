const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
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
     */
    constructor(switchProperty, brightnessProperty, setLight) {
      super()

      this._switchProperty = switchProperty
      this._brightnessProperty = brightnessProperty
      this._setLight = setLight
      this._updatingDeviceLight = false
    }

    get on() {
      return this.device[this._switchProperty]
    }

    get brightness() {
      return this.device[this._brightnessProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const lightbulbService = new Service.Lightbulb()
        .setCharacteristic(Characteristic.On, this.on)
        .setCharacteristic(Characteristic.Brightness, this.brightness)

      this.platformAccessory.addService(lightbulbService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      const lightbulbService = this.platformAccessory
        .getService(Service.Lightbulb)

      lightbulbService.getCharacteristic(Characteristic.On)
        .on('set', this._onSetHandler.bind(this))

      lightbulbService.getCharacteristic(Characteristic.Brightness)
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
    }

    /**
     * Handles changes from HomeKit to the On characteristic.
     */
    async _onSetHandler(newValue, callback) {
      if (this.on !== newValue) {
        this._updateDeviceLightDebounced()
      }

      callback()
    }

    /**
     * Handles changes from HomeKit to the Brightness characteristic.
     */
    async _brightnessSetHandler(newValue, callback) {
      if (this.brightness !== newValue) {
        this._updateDeviceLightDebounced()
      }

      callback()
    }

    /**
     * Updates the device's switch state and brightness, debouncing the
     * requests.
     */
    _updateDeviceLightDebounced() {
      if (this._updatingDeviceLight === true) {
        return
      }
      this._updatingDeviceLight = true

      setImmediate(() => {
        this._updateDeviceLight()
        this._updatingDeviceLight = false
      })
    }

    /**
     * Updates the device's switch state and brightness.
     */
    async _updateDeviceLight() {
      try {
        const lightbulbService = this.platformAccessory
          .getService(Service.Lightbulb)

        const on = lightbulbService.getCharacteristic(Characteristic.On).value
        const brightness = lightbulbService
          .getCharacteristic(Characteristic.Brightness).value

        this.log.debug(
          'Setting light of device',
          this.device.type,
          this.device.id,
          'to',
          on ? 'on,' : 'off,',
          brightness,
          '%'
        )

        await this._setLight({
          [this._switchProperty]: on,
          [this._brightnessProperty]: brightness,
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

      this.platformAccessory
        .getService(Service.Lightbulb)
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

      this.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .setValue(this.brightness)
    }

    detach() {
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

      super.detach()
    }
  }

  return LightbulbAbility
}
