
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const { TiltSensorService } = require('../util/custom-services')(homebridge)
  const Characteristic = homebridge.hap.Characteristic

  class TiltSensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} tiltProperty - The device property used to indicate
     * the current tilt angle (in degrees).
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(tiltProperty, invalidValue = -1) {
      super(
        TiltSensorService,
        Characteristic.CurrentTiltAngle,
        tiltProperty,
        invalidValue
      )
    }

    _createService() {
      const service = super._createService()

      service
        .getCharacteristic(Characteristic.CurrentTiltAngle)
        .setProps({
          minValue: 0,
          maxValue: 180,
        })

      return service
    }

    _valueToHomeKit(value) {
      return Math.min(Math.max(value, 0), 180)
    }
  }

  return TiltSensorAbility
}
