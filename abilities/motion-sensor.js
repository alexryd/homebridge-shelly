
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class MotionSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether motion has been detected.
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(detectedProperty, invalidValue = -1) {
      super(
        Service.MotionSensor,
        Characteristic.MotionDetected,
        detectedProperty,
        invalidValue
      )
    }

    _valueToHomeKit(value) {
      return !!value
    }
  }

  return MotionSensorAbility
}
