
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class HumiditySensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} humidityProperty - The device property used to indicate
     * the current relative humidity.
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(humidityProperty, invalidValue = 999) {
      super(
        Service.HumiditySensor,
        Characteristic.CurrentRelativeHumidity,
        humidityProperty,
        invalidValue
      )
    }

    _valueToHomeKit(value) {
      return Math.min(Math.max(value, 0), 100)
    }
  }

  return HumiditySensorAbility
}
