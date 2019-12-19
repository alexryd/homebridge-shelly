const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class OutletAbility extends Ability {
    /**
     * @param {string} switchProperty - The device property used to indicate
     * the switch state.
     * @param {string} inUseProperty - The device property used to indicate
     * whether the outlet is in use.
     * @param {function} setSwitch - A function that updates the device's switch
     * state. Must return a Promise.
     */
    constructor(switchProperty, inUseProperty, setSwitch) {
      super()

      this._switchProperty = switchProperty
      this._inUseProperty = inUseProperty
      this._setSwitch = setSwitch
    }

    get on() {
      return this.device[this._switchProperty]
    }

    get inUse() {
      return !!this.device[this._inUseProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const outletService = new Service.Outlet()
        .setCharacteristic(Characteristic.On, this.on)
        .setCharacteristic(Characteristic.OutletInUse, this.inUse)

      this.platformAccessory.addService(outletService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      const outletService = this.platformAccessory.getService(Service.Outlet)

      outletService
        .getCharacteristic(Characteristic.On)
        .on('set', this._onSetHandler.bind(this))

      this.device
        .on('change:' + this._switchProperty, this._switchChangeHandler, this)
        .on('change:' + this._inUseProperty, this._inUseChangeHandler, this)
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

      this.platformAccessory
        .getService(Service.Outlet)
        .getCharacteristic(Characteristic.On)
        .setValue(this.on)
    }

    /**
     * Handles changes from the device to the in use property.
     */
    _inUseChangeHandler(newValue) {
      this.platformAccessory
        .getService(Service.Outlet)
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
