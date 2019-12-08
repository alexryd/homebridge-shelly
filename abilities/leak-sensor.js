
module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class LeakSensorAbility extends Ability {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether a leak has been detected.
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

      const leakService = new Service.LeakSensor()
        .setCharacteristic(Characteristic.LeakDetected, this.detected)

      this.platformAccessory.addService(leakService)
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
        .getService(Service.LeakSensor)
        .getCharacteristic(Characteristic.LeakDetected)
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

  return LeakSensorAbility
}
