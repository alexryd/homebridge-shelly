
module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class MotionSensorAbility extends Ability {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether motion has been detected.
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

      const motionService = new Service.MotionSensor()
        .setCharacteristic(Characteristic.MotionDetected, this.detected)

      this.platformAccessory.addService(motionService)
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
        .getService(Service.MotionSensor)
        .getCharacteristic(Characteristic.MotionDetected)
        .setValue(this.detected)
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

  return MotionSensorAbility
}
