
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class LeakSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether a leak has been detected.
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(detectedProperty, invalidValue = -1) {
      super(
        Service.LeakSensor,
        Characteristic.LeakDetected,
        detectedProperty,
        invalidValue
      )
    }

    _valueToHomeKit(value) {
      const LD = Characteristic.LeakDetected
      return value ? LD.LEAK_DETECTED : LD.LEAK_NOT_DETECTED
    }
  }

  return LeakSensorAbility
}
