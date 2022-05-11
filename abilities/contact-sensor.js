
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class ContactSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether contact has been detected.
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(detectedProperty, invalidValue = -1) {
      super(
        Service.ContactSensor,
        Characteristic.ContactSensorState,
        detectedProperty,
        invalidValue
      )
    }

    _valueToHomeKit(value) {
      const CSS = Characteristic.ContactSensorState

      return value !== this._invalidValue && !value
        ? CSS.CONTACT_DETECTED
        : CSS.CONTACT_NOT_DETECTED
    }
  }

  return ContactSensorAbility
}
