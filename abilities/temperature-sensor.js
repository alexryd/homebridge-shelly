
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class TemperatureSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} temperatureProperty - The device property used to
     * indicate the current temperature.
     */
    constructor(temperatureProperty) {
      super(
        Service.TemperatureSensor,
        Characteristic.CurrentTemperature,
        temperatureProperty
      )
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      this.characteristic.setProps({ minValue: -100 })
    }
  }

  return TemperatureSensorAbility
}
