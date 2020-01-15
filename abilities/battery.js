
module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class BatteryAbility extends Ability {
    /**
     * @param {string} levelProperty - The device property used to indicate
     * the current battery level.
     * @param {boolean} chargeable - Whether the device is chargeable.
     * @param {string} chargingProperty - The device property used to indicate
     * whether the device is currently charging.
     */
    constructor(levelProperty, chargeable = false, chargingProperty = null) {
      super()

      this._levelProperty = levelProperty
      this._chargeable = chargeable
      this._chargingProperty = chargingProperty
    }

    get level() {
      return this.device[this._levelProperty]
    }

    get chargingState() {
      const CS = Characteristic.ChargingState

      if (!this._chargeable) {
        return CS.NOT_CHARGEABLE
      } else if (this.device[this._chargingProperty]) {
        return CS.CHARGING
      }
      return CS.NOT_CHARGING
    }

    get statusLow() {
      const SLB = Characteristic.StatusLowBattery
      return this.level < 10 ? SLB.BATTERY_LEVEL_LOW : SLB.BATTERY_LEVEL_NORMAL
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const batteryService = new Service.BatteryService()
        .setCharacteristic(Characteristic.BatteryLevel, this.level)
        .setCharacteristic(Characteristic.ChargingState, this.chargingState)
        .setCharacteristic(Characteristic.StatusLowBattery, this.statusLow)

      this.platformAccessory.addService(batteryService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.device.on(
        'change:' + this._levelProperty,
        this._levelChangeHandler,
        this
      )

      if (this._chargeable && this._chargingProperty) {
        this.device.on(
          'change:' + this._chargingProperty,
          this._chargingChangeHandler,
          this
        )
      }
    }

    /**
     * Handles changes from the device to the level property.
     */
    _levelChangeHandler(newValue) {
      this.log.debug(
        this._levelProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        '%'
      )

      this.platformAccessory.getService(Service.BatteryService)
        .setCharacteristic(Characteristic.BatteryLevel, this.level)
        .setCharacteristic(Characteristic.StatusLowBattery, this.statusLow)
    }

    /**
     * Handles changes from the device to the charging property.
     */
    _chargingChangeHandler(newValue) {
      this.log.debug(
        this._chargingProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory.getService(Service.BatteryService)
        .setCharacteristic(Characteristic.ChargingState, this.chargingState)
    }

    detach() {
      this.device.removeListener(
        'change:' + this._levelProperty,
        this._levelChangeHandler,
        this
      )

      if (this._chargingProperty) {
        this.device.removeListener(
          'change:' + this._chargingProperty,
          this._chargingChangeHandler,
          this
        )
      }

      super.detach()
    }
  }

  return BatteryAbility
}
