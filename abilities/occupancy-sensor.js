
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class OccupancySensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether occupancy has been detected.
     * @param {any} invalidValue - A property value that indicates that the
     * current value is invalid.
     */
    constructor(detectedProperty, invalidValue = -1) {
      super(
        Service.OccupancySensor,
        Characteristic.OccupancyDetected,
        detectedProperty,
        invalidValue
      )
    }

    _valueToHomeKit(value) {
      const OD = Characteristic.OccupancyDetected

      return value !== this._invalidValue && value
        ? OD.OCCUPANCY_DETECTED
        : OD.OCCUPANCY_NOT_DETECTED
    }
  }

  return OccupancySensorAbility
}
