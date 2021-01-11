const { handleFailedRequest } = require('../util/error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class ValveAbility extends Ability {
    /**
     * @param {string} activeProperty - The device property used to indicate
     * whether the valve is active.
     * @param {function} setActive - A function that updates the device's active
     * state. Must return a Promise.
     * @param {string} inUseProperty - The device property used to indicate
     * whether the valve is in use.
     */
    constructor(activeProperty, setActive, inUseProperty = null) {
      super()

      this._activeProperty = activeProperty
      this._setActive = setActive
      this._inUseProperty = inUseProperty
    }

    get service() {
      return this.platformAccessory.getService(Service.Valve)
    }

    get active() {
      return !!this.device[this._activeProperty]
    }

    get inUse() {
      return this._inUseProperty ? !!this.device[this._inUseProperty] : false
    }

    _activeFromHomeKit(value) {
      return value === Characteristic.Active.ACTIVE
    }

    _activeToHomeKit(value) {
      const A = Characteristic.Active
      return value ? A.ACTIVE : A.INACTIVE
    }

    _inUseFromHomeKit(value) {
      return value === Characteristic.InUse.IN_USE
    }

    _inUseToHomeKit(value) {
      const IU = Characteristic.InUse
      return value ? IU.IN_USE : IU.NOT_IN_USE
    }

    _createService() {
      return new Service.Valve()
        .setCharacteristic(
          Characteristic.Active,
          this._activeToHomeKit(this.active)
        )
        .setCharacteristic(
          Characteristic.InUse,
          this._inUseToHomeKit(this.inUse)
        )
        .setCharacteristic(
          Characteristic.ValveType,
          Characteristic.ValveType.GENERIC_VALVE
        )
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.service
        .getCharacteristic(Characteristic.Active)
        .on('set', this._activeSetHandler.bind(this))

      this.device.on(
        'change:' + this._activeProperty,
        this._activeChangeHandler,
        this
      )

      if (this._inUseProperty) {
        this.device.on(
          'change:' + this._inUseProperty,
          this._inUseChangeHandler,
          this
        )
      }
    }

    /**
     * Handles changes from HomeKit to the Active characteristic.
     */
    async _activeSetHandler(newValue, callback) {
      const d = this.device
      const nv = this._activeFromHomeKit(newValue)

      if (this.active === nv) {
        callback()
        return
      }

      try {
        this.log.debug(
          'Setting',
          this._activeProperty,
          'of device',
          d.type,
          d.id,
          'to',
          nv
        )
        await this._setActive(nv)
        callback()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          'Failed to set ' + this._activeProperty
        )
        callback(e)
      }
    }

    /**
     * Handles changes from the device to the active property.
     */
    _activeChangeHandler(newValue) {
      this.log.debug(
        this._activeProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(Characteristic.Active)
        .setValue(this._activeToHomeKit(this.active))
    }

    /**
     * Handles changes from the device to the in use property.
     */
    _inUseChangeHandler(newValue) {
      this.service
        .getCharacteristic(Characteristic.InUse)
        .setValue(this._inUseToHomeKit(this.inUse))
    }

    detach() {
      this.device
        .removeListener(
          'change:' + this._activeProperty,
          this._activeChangeHandler,
          this
        )
        .removeListener(
          'change:' + this._inUseProperty,
          this._inUseChangeHandler,
          this
        )

      super.detach()
    }
  }

  return ValveAbility
}
