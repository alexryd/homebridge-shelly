
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

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      // the default maximum light level is 100k lux, but Shelly devices can
      // report more than that, so we need to increase it
      this.characteristic.setProps({
        maxValue: 500000,
      })
    }
  }

  return LightSensorAbility
}
