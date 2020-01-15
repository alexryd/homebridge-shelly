
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class LightSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} levelProperty - The device property used to indicate
     * the current ambient light level.
     */
    constructor(levelProperty) {
      super(
        Service.LightSensor,
        Characteristic.CurrentAmbientLightLevel,
        levelProperty
      )
    }
  }

  return LightSensorAbility
}
