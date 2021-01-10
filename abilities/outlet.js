const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class OutletAbility extends Ability {
    /**
     * @param {string} switchProperty - The device property used to indicate
     * the switch state.
     * @param {function} setSwitch - A function that updates the device's switch
     * state. Must return a Promise.
     * @param {string} inUseProperty - The device property used to indicate
     * whether the outlet is in use.
     */
    constructor(switchProperty, setSwitch, inUseProperty = null) {
      super()

      this._switchProperty = switchProperty
      this._setSwitch = setSwitch
      this._inUseProperty = inUseProperty
    }

    get service() {
      return this.platformAccessory.getService(Service.Outlet)
    }

    get on() {
      return !!this.device[this._switchProperty]
    }

    get inUse() {
      return this._inUseProperty ? !!this.device[this._inUseProperty] : false
    }

    _createService() {
      return new Service.Outlet()
        .setCharacteristic(Characteristic.On, this.on)
        .setCharacteristic(Characteristic.OutletInUse, this.inUse)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.service
        .getCharacteristic(Characteristic.On)
        .on('set', this._onSetHandler.bind(this))

      this.device.on(
        'change:' + this._switchProperty,
        this._switchChangeHandler,
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
     * Handles changes from HomeKit to the On characteristic.
     */
    async _onSetHandler(newValue, callback) {
      const d = this.device

      if (this.on === newValue) {
        callback()
        return
      }

      try {
        this.log.debug(
          'Setting',
          this._switchProperty,
          'of device',
          d.type,
          d.id,
          'to',
          newValue
        )
        await this._setSwitch(newValue)
        callback()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          'Failed to set ' + this._switchProperty
        )
        callback(e)
      }
    }

    /**
     * Handles changes from the device to the switch property.
     */
    _switchChangeHandler(newValue) {
      this.log.debug(
        this._switchProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(Characteristic.On)
        .setValue(this.on)
    }

    /**
     * Handles changes from the device to the in use property.
     */
    _inUseChangeHandler(newValue) {
      this.service
        .getCharacteristic(Characteristic.OutletInUse)
        .setValue(this.inUse)
    }

    detach() {
      this.device
        .removeListener(
          'change:' + this._switchProperty,
          this._switchChangeHandler,
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

  return OutletAbility
}
