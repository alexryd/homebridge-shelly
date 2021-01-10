const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class GarageDoorOpenerAbility extends Ability {
    /**
     * @param {string} positionProperty - The device property used to indicate
     * the current position.
     * @param {string} stateProperty - The device property used to indicate the
     * current state.
     * @param {function} setPosition - A function that updates the device's
     * target position. Must return a Promise.
     */
    constructor(positionProperty, stateProperty, setPosition) {
      super()

      this._positionProperty = positionProperty
      this._stateProperty = stateProperty
      this._setPosition = setPosition
      this._targetState = null
    }

    get service() {
      return this.platformAccessory.getService(Service.GarageDoorOpener)
    }

    get position() {
      return this.device[this._positionProperty] || 0
    }

    get state() {
      return this.device[this._stateProperty] || 'stop'
    }

    get currentState() {
      const CDS = Characteristic.CurrentDoorState

      if (this.state === 'open') {
        return CDS.OPENING
      } else if (this.state === 'close') {
        return CDS.CLOSING
      } else if (this.position >= 100) {
        return CDS.OPEN
      } else if (this.position <= 0) {
        return CDS.CLOSED
      }
      return CDS.STOPPED
    }

    get targetState() {
      if (this._targetState !== null) {
        return this._targetState
      }

      const CDS = Characteristic.CurrentDoorState
      const TDS = Characteristic.TargetDoorState
      const cs = this.currentState
      return cs === CDS.OPEN || cs === CDS.OPENING ? TDS.OPEN : TDS.CLOSED
    }

    _createService() {
      return new Service.GarageDoorOpener()
        .setCharacteristic(Characteristic.CurrentDoorState, this.currentState)
        .setCharacteristic(Characteristic.TargetDoorState, this.targetState)
        .setCharacteristic(Characteristic.ObstructionDetected, false)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.service
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

      const position = newValue === Characteristic.TargetDoorState.OPEN
        ? 100
        : 0

      this.log.debug(
        'Setting',
        this._positionProperty,
        'of device',
        d.type,
        d.id,
        'to',
        position
      )

      try {
        await this._setPosition(position)
        callback()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          'Failed to set ' + this._positionProperty
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

      this.service
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

  return GarageDoorOpenerAbility
}
