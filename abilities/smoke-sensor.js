
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class SmokeSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether smoke has been detected.
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(detectedProperty, invalidValue = -1) {
      super(
        Service.SmokeSensor,
        Characteristic.SmokeDetected,
        detectedProperty,
        invalidValue
      )
    }

    _valueToHomeKit(value) {
      const SD = Characteristic.SmokeDetected

      return value !== this._invalidValue && value
        ? SD.SMOKE_DETECTED
        : SD.SMOKE_NOT_DETECTED
    }
  }

  return SmokeSensorAbility
}
