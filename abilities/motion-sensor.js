
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class MotionSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether motion has been detected.
     */
    constructor(detectedProperty) {
      super(
        Service.MotionSensor,
        Characteristic.MotionDetected,
        detectedProperty
      )
    }

    _valueToHomeKit(value) {
      return !!value
    }
  }

  return MotionSensorAbility
}
