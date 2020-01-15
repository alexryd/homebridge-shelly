
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class OccupancySensorAbility extends SinglePropertyAbility {
    /**
     * @param {string} detectedProperty - The device property used to indicate
     * whether occupancy has been detected.
     */
    constructor(detectedProperty) {
      super(
        Service.OccupancySensor,
        Characteristic.OccupancyDetected,
        detectedProperty
      )
    }

    _valueToHomeKit(value) {
      const OD = Characteristic.OccupancyDetected
      return value ? OD.OCCUPANCY_DETECTED : OD.OCCUPANCY_NOT_DETECTED
    }
  }

  return OccupancySensorAbility
}
