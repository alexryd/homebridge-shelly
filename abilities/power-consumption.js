
module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const {
    ConsumptionCharacteristic
  } = require('../characteristics')(homebridge)

  class PowerConsumptionAbility extends Ability {
    /**
     * @param {object} Service - The HomeKit service that power consumption
     * should be reported for.
     * @param {string} consumptionProperty - The device property used to
     * indicate the current power consumption.
     */
    constructor(Service, consumptionProperty) {
      super()

      this._Service = Service
      this._consumptionProperty = consumptionProperty
    }

    get consumption() {
      return this.device[this._consumptionProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      this.platformAccessory
        .getService(this._Service)
        .addCharacteristic(ConsumptionCharacteristic)
        .setValue(this.consumption)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.device.on(
        'change:' + this._consumptionProperty,
        this._consumptionChangeHandler,
        this
      )
    }

    /**
     * Handles changes from the device to the consumption property.
     */
    _consumptionChangeHandler(newValue) {
      this.log.debug(
        this._consumptionProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(this._Service)
        .getCharacteristic(ConsumptionCharacteristic)
        .setValue(newValue)
    }

    detach() {
      this.device.removeListener(
        'change:' + this._consumptionProperty,
        this._consumptionChangeHandler,
        this
      )

      super.detach()
    }
  }

  return PowerConsumptionAbility
}
