
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class TemperatureSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} temperatureProperty - The device property used to
     * indicate the current temperature.
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(temperatureProperty, invalidValue = 999) {
      super(
        Service.TemperatureSensor,
        Characteristic.CurrentTemperature,
        temperatureProperty,
        invalidValue
      )
    }

    _createService() {
      const service = super._createService()

      // allow negative temperatures
      service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ minValue: -100 })

      return service
    }

    _valueToHomeKit(value) {
      return value !== this._invalidValue
        ? Math.min(Math.max(value, -270), 100)
        : 0
    }
  }

  return TemperatureSensorAbility
}
