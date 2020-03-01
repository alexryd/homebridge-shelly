const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class BasicGarageDoorOpenerAbility extends Ability {
    /**
     * @param {string} stateProperty - The device property used to indicate the
     * garage door is closed.
     * @param {function} setState - A function that updates the device's
     * target state. Must return a Promise.
     */
    constructor(stateProperty, setState) {
      super()
      this._stateProperty = stateProperty
      this._setState = setState
      this._targetState = null
    }

    get state() {
      return this.device[this._stateProperty]
    }

    get currentState() {
      const CDS = Characteristic.CurrentDoorState

      if (!!this.state) {
        return CDS.CLOSED
      }
      
      return CDS.OPEN
    }

    get targetState() {
      if (this._targetState !== null) {
        return this._targetState
      }

      const CDS = Characteristic.CurrentDoorState
      const TDS = Characteristic.TargetDoorState
      const cs = this.currentState
      return cs === CDS.CLOSED ? TDS.OPEN : TDS.CLOSED
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      this.platformAccessory.addService(
        new Service.GarageDoorOpener()
          .setCharacteristic(Characteristic.CurrentDoorState, this.currentState)
          .setCharacteristic(Characteristic.TargetDoorState, this.targetState)
          .setCharacteristic(Characteristic.ObstructionDetected, false)
      )
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.platformAccessory
        .getService(Service.GarageDoorOpener)
        .getCharacteristic(Characteristic.TargetDoorState)
        .on('set', this._targetDoorStateSetHandler.bind(this))

      this.device
        .on(
          'change:' + this._stateProperty,
          this._stateChangeHandler,
          this
        )
    }

    /**
     * Handles changes from HomeKit to the TargetDoorState characteristic.
     */
    async _targetDoorStateSetHandler(newValue, callback) {
      const d = this.device

      if (this.targetState === newValue) {
        callback()
        return
      }

      this._targetState = newValue

      this.log.debug(
        'Setting',
        this._switchProperty,
        'of device',
        d.type,
        d.id,
        'to',
        true
      )

      try {
        await this._setState(true)
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
     * Handles changes from the device to the state property.
     */
    _stateChangeHandler(newValue) {
      this.log.debug(
        this._stateProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.GarageDoorOpener)
        .getCharacteristic(Characteristic.CurrentDoorState)
        .setValue(this.currentState)
    }

    detach() {
      this.device
        .removeListener(
          'change:' + this._stateProperty,
          this._stateChangeHandler,
          this
        )

      super.detach()
    }
  }

  return BasicGarageDoorOpenerAbility
}
