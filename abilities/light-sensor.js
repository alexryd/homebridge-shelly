
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class LightSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} levelProperty - The device property used to indicate
     * the current ambient light level.
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(levelProperty, invalidValue = -1) {
      super(
        Service.LightSensor,
        Characteristic.CurrentAmbientLightLevel,
        levelProperty,
        invalidValue
      )
    }

    _createService() {
      const service = super._createService()

      // the default maximum light level is 100k lux, but Shelly devices can
      // report more than that, so we need to increase it
      service
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .setProps({
          maxValue: 500000,
        })

      return service
    }

    _valueToHomeKit(value) {
      return value !== this._invalidValue
        ? Math.min(Math.max(value, 0.0001), 500000)
        : 0.0001
    }
  }

  return LightSensorAbility
}
