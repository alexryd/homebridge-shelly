const { handleFailedRequest } = require('../util/error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class GarageDoorSwitchAbility extends Ability {
    /**
     * @param {string} switchProperty - The device property to trigger the
     * garage door to open or close.
     * @param {string} stateProperty - The device property used to indicate the
     * garage door is closed.
     * @param {function} setSwitch - A function that updates the device's switch
     * state. Must return a Promise.
     */
    constructor(switchProperty, stateProperty, setSwitch) {
      super()
      this._switchProperty = switchProperty
      this._stateProperty = stateProperty
      this._setSwitch = setSwitch
      this._targetState = null
    }

    get service() {
      return this.platformAccessory.getService(Service.GarageDoorOpener)
    }

    get state() {
      return this.device[this._stateProperty] || 0
    }

    get currentState() {
      const CDS = Characteristic.CurrentDoorState

      if (this.state > 0) {
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
      return cs === CDS.OPEN || cs === CDS.OPENING ? TDS.OPEN : TDS.CLOSED
    }

    _createService() {
      const CDS = Characteristic.CurrentDoorState
      const TDS = Characteristic.TargetDoorState

      return new Service.GarageDoorOpener()
        .setCharacteristic(CDS, this.currentState)
        .setCharacteristic(TDS, TDS.CLOSED)
        .setCharacteristic(Characteristic.ObstructionDetected, false)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      // This is the handler to catch HomeKit events
      this.service
        .getCharacteristic(Characteristic.TargetDoorState)
        .on('set', this._targetDoorStateSetHandler.bind(this))

      // This is the handler to catch device events
      // This one is always correct!
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
    async _targetDoorStateSetHandler(newValue, callback, context) {
      const d = this.device

      // If the context is shelly then this is an internal update
      // to ensure that homekit is in sync with the current status
      // If not, we really trigger the switch
      if (context === 'shelly') {
        callback()
        return
      }

      this._targetState = newValue

      this.log.debug(
        'Target homekit state is',
        newValue
      )

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
        await this._setSwitch(true)
        callback()
        this.updateGarageDoorState()
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
     * This means either the garage door just closed or it has started to open.
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

      this.updateGarageDoorState()
    }

    updateGarageDoorState() {
      const CDS = Characteristic.CurrentDoorState
      const TDS = Characteristic.TargetDoorState

      if (this.currentState === CDS.CLOSED) {
        this.service
          .getCharacteristic(TDS)
          .setValue(TDS.CLOSED, null, 'shelly')
        this.service
          .setCharacteristic(CDS, CDS.CLOSING)

        setTimeout(() => {
          this.service
            .setCharacteristic(CDS, CDS.CLOSED)
        }, 1000)
      } else {
        this.service
          .getCharacteristic(TDS)
          .setValue(TDS.OPEN, null, 'shelly')
        this.service
          .setCharacteristic(CDS, CDS.OPENING)

        setTimeout(() => {
          this.service
            .setCharacteristic(CDS, CDS.OPEN)
        }, 1000)
      }
    }

    getState(callback) {
      callback(null, this.currentState)
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

  return GarageDoorSwitchAbility
}
