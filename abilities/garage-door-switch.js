const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class GarageDoorSwitchAbility extends Ability {
    /**
     * @param {string} switchProperty - The device property to trigger the garage door to open or close.
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

    get state() {
      return this.device[this._stateProperty] || 0;
    }

    get isSwitchedOn() {
      return this.device[this._switchProperty] || false;
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

    _setupPlatformAccessory() {
      const CDS = Characteristic.CurrentDoorState
      const TDS = Characteristic.TargetDoorState
      super._setupPlatformAccessory()

      // This is the initial setup of the garage door
      this.platformAccessory.addService(
        new Service.GarageDoorOpener()
          .setCharacteristic(CDS, this.currentState)
          .setCharacteristic(TDS, TDS.CLOSED)
          .setCharacteristic(Characteristic.ObstructionDetected, false)
      )
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      // This is the handler to catch HomeKit events
      this.platformAccessory
        .getService(Service.GarageDoorOpener)
        .getCharacteristic(Characteristic.TargetDoorState)
        .on('set', this._targetDoorStateSetHandler.bind(this))

      this.platformAccessory
        .getService(Service.GarageDoorOpener)
        .getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', this.getState.bind(this));

      this.platformAccessory
        .getService(Service.GarageDoorOpener)
        .getCharacteristic(Characteristic.TargetDoorState)
        .on('get', this.getState.bind(this));

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
        this.platformAccessory
          .getService(Service.GarageDoorOpener)
          .getCharacteristic(TDS)
          .setValue(TDS.CLOSED, null, 'shelly')
        this.platformAccessory
          .getService(Service.GarageDoorOpener)
          .setCharacteristic(CDS, CDS.CLOSING)

        setTimeout(() => {
          this.platformAccessory
            .getService(Service.GarageDoorOpener)
            .setCharacteristic(CDS, CDS.CLOSED)
        }, 1000)
      } else {
        this.platformAccessory
          .getService(Service.GarageDoorOpener)
          .getCharacteristic(TDS)
          .setValue(TDS.OPEN, null, 'shelly')
        this.platformAccessory
          .getService(Service.GarageDoorOpener)
          .setCharacteristic(CDS, CDS.OPENING)

        setTimeout(() => {
          this.platformAccessory
            .getService(Service.GarageDoorOpener)
            .setCharacteristic(CDS, CDS.OPEN)
        }, 1000)
      }
    }

    getState(callback) {
      const CDS = Characteristic.CurrentDoorState
      const TDS = Characteristic.TargetDoorState

      callback(null, this.currentState);
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
