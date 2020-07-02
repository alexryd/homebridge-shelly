
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class SmokeSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether smoke has been detected.
     */
    constructor(detectedProperty) {
      super(
        Service.SmokeSensor,
        Characteristic.SmokeDetected,
        detectedProperty
      )
    }

    _valueToHomeKit(value) {
      const SD = Characteristic.SmokeDetected
      return value ? SD.SMOKE_DETECTED : SD.SMOKE_NOT_DETECTED
    }
  }

  return SmokeSensorAbility
}
