
module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const {
    ConsumptionCharacteristic,
    TotalConsumptionCharacteristic,
    ElectricCurrentCharacteristic,
    VoltageCharacteristic,
  } = require('../util/custom-characteristics')(homebridge)
  const { PowerMeterService } = require('../util/custom-services')(homebridge)

  class PowerMeterAbility extends Ability {
    /**
     * @param {string} consumptionProperty - The device property used to
     * indicate the current power consumption (Watt).
     * @param {string} totalConsumptionProperty - The device property used to
     * indicate the total current power consumption (Kilowatt-hour).
     * @param {string} electricCurrentProperty - The device property used to
     * indicate the amount of electric current (Ampere).
     * @param {string} voltageProperty - The device property used to indicate
     * the current voltage (Volt).
     */
    constructor(consumptionProperty, totalConsumptionProperty = null,
      electricCurrentProperty = null, voltageProperty = null) {
      super()

      this._consumptionProperty = consumptionProperty
      this._totalConsumptionProperty = totalConsumptionProperty
      this._electricCurrentProperty = electricCurrentProperty
      this._voltageProperty = voltageProperty
    }

    get service() {
      return this.platformAccessory.getService(PowerMeterService)
    }

    get consumption() {
      return Math.min(
        Math.max(this.device[this._consumptionProperty], 0),
        65535
      )
    }

    get totalConsumption() {
      return Math.max(this.device[this._totalConsumptionProperty] / 1000, 0)
    }

    get electricCurrent() {
      return this.device[this._electricCurrentProperty]
    }

    get voltage() {
      return this.device[this._voltageProperty]
    }

    _createService() {
      const service = new PowerMeterService()
        .setCharacteristic(ConsumptionCharacteristic, this.consumption)

      if (this._totalConsumptionProperty) {
        service.setCharacteristic(
          TotalConsumptionCharacteristic,
          this.totalConsumption
        )
      }

      if (this._electricCurrentProperty) {
        service.setCharacteristic(
          ElectricCurrentCharacteristic,
          this.electricCurrent
        )
      }

      if (this._voltageProperty) {
        service.setCharacteristic(VoltageCharacteristic, this.voltage)
      }

      return service
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.device.on(
        'change:' + this._consumptionProperty,
        this._consumptionChangeHandler,
        this
      )

      if (this._totalConsumptionProperty) {
        this.device.on(
          'change:' + this._totalConsumptionProperty,
          this._totalConsumptionChangeHandler,
          this
        )
      }

      if (this._electricCurrentProperty) {
        this.device.on(
          'change:' + this._electricCurrentProperty,
          this._electricCurrentChangeHandler,
          this
        )
      }

      if (this._voltageProperty) {
        this.device.on(
          'change:' + this._voltageProperty,
          this._voltageChangeHandler,
          this
        )
      }
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

      this.service
        .getCharacteristic(ConsumptionCharacteristic)
        .setValue(this.consumption)
    }

    /**
     * Handles changes from the device to the total consumption property.
     */
    _totalConsumptionChangeHandler(newValue) {
      this.log.debug(
        this._totalConsumptionProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(TotalConsumptionCharacteristic)
        .setValue(this.totalConsumption)
    }

    /**
     * Handles changes from the device to the electric current property.
     */
    _electricCurrentChangeHandler(newValue) {
      this.log.debug(
        this._electricCurrentProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(ElectricCurrentCharacteristic)
        .setValue(this.electricCurrent)
    }

    /**
     * Handles changes from the device to the voltage property.
     */
    _voltageChangeHandler(newValue) {
      this.log.debug(
        this._voltageProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(VoltageCharacteristic)
        .setValue(this.voltage)
    }

    detach() {
      this.device.removeListener(
        'change:' + this._consumptionProperty,
        this._consumptionChangeHandler,
        this
      )

      if (this._totalConsumptionProperty) {
        this.device.removeListener(
          'change:' + this._totalConsumptionProperty,
          this._totalConsumptionChangeHandler,
          this
        )
      }

      if (this._electricCurrentProperty) {
        this.device.removeListener(
          'change:' + this._electricCurrentProperty,
          this._electricCurrentChangeHandler,
          this
        )
      }

      if (this._voltageProperty) {
        this.device.removeListener(
          'change:' + this._voltageProperty,
          this._voltageChangeHandler,
          this
        )
      }

      super.detach()
    }
  }

  return PowerMeterAbility
}
