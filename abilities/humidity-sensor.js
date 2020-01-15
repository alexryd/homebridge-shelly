
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class HumiditySensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} humidityProperty - The device property used to indicate
     * the current relative humidity.
     */
    constructor(humidityProperty) {
      super(
        Service.HumiditySensor,
        Characteristic.CurrentRelativeHumidity,
        humidityProperty
      )
    }
  }

  return HumiditySensorAbility
}
