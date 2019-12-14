
module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  const detectedToState = detected => {
    const CSS = Characteristic.ContactSensorState
    return !detected ? CSS.CONTACT_DETECTED : CSS.CONTACT_NOT_DETECTED
  }

  class ContactSensorAbility extends Ability {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether contact has been detected.
     */
    constructor(detectedProperty) {
      super()

      this._detectedProperty = detectedProperty
    }

    get detected() {
      return !!this.device[this._detectedProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const contactService = new Service.ContactSensor()
        .setCharacteristic(
          Characteristic.ContactSensorState,
          detectedToState(this.detected)
        )

      this.platformAccessory.addService(contactService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.device.on(
        'change:' + this._detectedProperty,
        this._detectedChangeHandler,
        this
      )
    }

    /**
     * Handles changes from the device to the detected property.
     */
    _detectedChangeHandler(newValue) {
      this.log.debug(
        this._detectedProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.ContactSensor)
        .getCharacteristic(Characteristic.ContactSensorState)
        .setValue(detectedToState(this.detected))
    }

    detach() {
      this.device.removeListener(
        'change:' + this._detectedProperty,
        this._detectedChangeHandler,
        this
      )

      super.detach()
    }
  }

  return ContactSensorAbility
}
