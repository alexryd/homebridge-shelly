
module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class LightSensorAbility extends Ability {
    /**
     * @param {string} levelProperty - The device property used to indicate
     * the current ambient light level.
     */
    constructor(levelProperty) {
      super()

      this._levelProperty = levelProperty
    }

    get level() {
      return this.device[this._levelProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const lightService = new Service.LightSensor()
        .setCharacteristic(Characteristic.CurrentAmbientLightLevel, this.level)

      this.platformAccessory.addService(lightService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.device.on(
        'change:' + this._levelProperty,
        this._levelChangeHandler,
        this
      )
    }

    /**
     * Handles changes from the device to the level property.
     */
    _levelChangeHandler(newValue) {
      this.log.debug(
        this._levelProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        'lux'
      )

      this.platformAccessory
        .getService(Service.LightSensor)
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .setValue(this.level)
    }

    detach() {
      this.device.removeListener(
        'change:' + this._levelProperty,
        this._levelChangeHandler,
        this
      )

      super.detach()
    }
  }

  return LightSensorAbility
}
