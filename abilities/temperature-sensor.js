
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

    _createService() {
      const service = super._createService()

      // allow negative temperatures
      service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ minValue: -100 })

      return service
    }

    _valueToHomeKit(value) {
      return Math.min(Math.max(value, -270), 100)
    }
  }

  return TemperatureSensorAbility
}
