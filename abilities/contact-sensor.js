
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class ContactSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether contact has been detected.
     */
    constructor(detectedProperty, invert=true) {
      super(
        Service.ContactSensor,
        Characteristic.ContactSensorState,
        detectedProperty
      )

      this.invert = invert
    }

    _valueToHomeKit(value) {
      const CSS = Characteristic.ContactSensorState
      if ( this.invert ) {
        return !value ? CSS.CONTACT_DETECTED : CSS.CONTACT_NOT_DETECTED
      }
      return value ? CSS.CONTACT_DETECTED : CSS.CONTACT_NOT_DETECTED
    }
  }

  return ContactSensorAbility
}
