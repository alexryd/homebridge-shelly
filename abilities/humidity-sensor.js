
module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class HumiditySensorAbility extends Ability {
    /**
     * @param {string} humidityProperty - The device property used to indicate
     * the current relative humidity.
     */
    constructor(humidityProperty) {
      super()

      this._humidityProperty = humidityProperty
    }

    get humidity() {
      return this.device[this._humidityProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const humidityService = new Service.HumiditySensor()
        .setCharacteristic(
          Characteristic.CurrentRelativeHumidity,
          this.humidity
        )

      this.platformAccessory.addService(humidityService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.device.on(
        'change:' + this._humidityProperty,
        this._humidityChangeHandler,
        this
      )
    }

    /**
     * Handles changes from the device to the humidity property.
     */
    _humidityChangeHandler(newValue) {
      this.log.debug(
        this._humidityProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        '%'
      )

      this.platformAccessory
        .getService(Service.HumiditySensor)
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .setValue(this.humidity)
    }

    detach() {
      this.device.removeListener(
        'change:' + this._humidityProperty,
        this._humidityChangeHandler,
        this
      )

      super.detach()
    }
  }

  return HumiditySensorAbility
}
