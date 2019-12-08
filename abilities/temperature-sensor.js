
module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class TemperatureSensorAbility extends Ability {
    /**
     * @param {string} temperatureProperty - The device property used to
     * indicate the current temperature.
     */
    constructor(temperatureProperty) {
      super()

      this._temperatureProperty = temperatureProperty
    }

    get temperature() {
      return this.device[this._temperatureProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const temperatureService = new Service.TemperatureSensor()

      temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ minValue: -100 })
        .setValue(this.temperature)

      this.platformAccessory.addService(temperatureService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.device.on(
        'change:' + this._temperatureProperty,
        this._temperatureChangeHandler,
        this
      )
    }

    /**
     * Handles changes from the device to the temperature property.
     */
    _temperatureChangeHandler(newValue) {
      this.log.debug(
        this._temperatureProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        'degrees C'
      )

      this.platformAccessory
        .getService(Service.TemperatureSensor)
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setValue(this.temperature)
    }

    detach() {
      this.device.removeListener(
        'change:' + this._temperatureProperty,
        this._temperatureChangeHandler,
        this
      )

      super.detach()
    }
  }

  return TemperatureSensorAbility
}
