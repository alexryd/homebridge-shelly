const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class SwitchAbility extends Ability {
    /**
     * @param {string} switchProperty - The device property used to indicate the
     * switch state.
     * @param {function} setSwitch - A function that updates the device's switch
     * state. Must return a Promise.
     */
    constructor(switchProperty, setSwitch) {
      super()

      this._switchProperty = switchProperty
      this._setSwitch = setSwitch
    }

    get on() {
      return this.device[this._switchProperty]
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const switchService = new Service.Switch()
        .setCharacteristic(Characteristic.On, this.on)

      this.platformAccessory.addService(switchService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      const switchService = this.platformAccessory.getService(Service.Switch)

      switchService
        .getCharacteristic(Characteristic.On)
        .on('set', this._onSetHandler.bind(this))

      this.device
        .on('change:' + this._switchProperty, this._switchChangeHandler, this)
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
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)
        .setValue(this.on)
    }

    detach() {
      this.device
        .removeListener(
          'change:' + this._switchProperty,
          this._switchChangeHandler,
          this
        )

      super.detach()
    }
  }

  return SwitchAbility
}
