
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class LeakSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether a leak has been detected.
     */
    constructor(detectedProperty) {
      super(
        Service.LeakSensor,
        Characteristic.LeakDetected,
        detectedProperty
      )
    }

    _valueToHomeKit(value) {
      const LD = Characteristic.LeakDetected
      return value ? LD.LEAK_DETECTED : LD.LEAK_NOT_DETECTED
    }
  }

  return LeakSensorAbility
}
