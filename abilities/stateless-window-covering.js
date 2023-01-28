
module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service
  const { handleFailedRequest } = require('../util/error-handlers')

  class StatelessWindowCoveringAbility extends Ability {
    /**
     * @param {string} switchDownProperty -
     * The device property used to indicate the switch state.
     * @param {string} switchUpProperty -
     * The device property used to indicate the switch state.
     * @param {function} setPositionUp - A function that updates the device's
     * target down. Must return a Promise.
     * @param {number} clearPositionTimeout
     * Timeout when the position should changed back to default.
     */
    constructor(
      switchDownProperty,
      switchUpProperty,
      setPosition,
      clearPositionTimeout) {
      super()

      this._Service = Service.WindowCovering
      this._switchDownProperty = switchDownProperty
      this._switchUpProperty = switchUpProperty
      this._setPosition = setPosition
      this._setPositionTimeout = null
      this._targetPosition = null
      this._targetPositionTimeout = null
      this._clearPosition = 50
      this._clearState = 'stop'
      this._clearPositionTimeout = null
      this._clearPositionTimeoutSeconds = clearPositionTimeout
    }

    /**
       * The HAP service that this ability has added.
       */
    get service() {
      return this.platformAccessory.getService(this._Service)
    }

    /**
       * The device's current position.
       */
    get position() {
      return this._targetPosition !== null
        ? this._targetPosition
        : this._clearPosition
    }

    /**
       * The device's current state.
       */
    get state() {
      return this._clearState
    }

    /**
       * The current position state.
       */
    get positionState() {
      const PS = Characteristic.PositionState
      if (this.state === 'open') {
        return PS.INCREASING
      } else if (this.state === 'close') {
        return PS.DECREASING
      }
      return PS.STOPPED
    }

    /**
       * The target position.
       */
    get targetPosition() {
      return this._targetPosition !== null
        ? this._targetPosition
      // default to the current position
        : this.position
    }

    _createService() {
      return new this._Service()
        .setCharacteristic(Characteristic.PositionState, this.positionState)
        .setCharacteristic(Characteristic.CurrentPosition, this.position)
        .setCharacteristic(Characteristic.TargetPosition, this.targetPosition)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.service
        .getCharacteristic(Characteristic.TargetPosition)
        .on('set',
          this._targetPositionSetHandler.bind(this))

      this.device
        .on(
          'change:' + this._switchDownProperty,
          this._switchDownChangeHandler,
          this
        )
        .on(
          'change:' + this._switchUpProperty,
          this._switchUpChangeHandler,
          this
        )
    }

    /**
       * Handles changes from HomeKit to the TargetPosition characteristic.
       */
    _targetPositionSetHandler(newValue, callback) {
      const d = this.device

      callback()

      if (this.targetPosition === newValue) {
        return
      }

      if (this._setPositionTimeout !== null) {
        clearTimeout(this._setPositionTimeout)
        this._setPositionTimeout = null
      }

      this._setPositionTimeout = setTimeout(async () => {
        this.log.debug(
          'Setting',
          'position',
          'of device',
          d.type,
          d.id,
          'to',
          newValue
        )

        try {
          await this._setPosition(newValue)
          this._updateTargetPositionDebounced()
        } catch (e) {
          handleFailedRequest(
            this.log,
            d,
            e,
            'Failed to set position'
          )
        }

        this._setPositionTimeout = null
      }, 1000)
    }

    /**
       * Handles changes from the device to the position property.
       */
    _switchDownChangeHandler(newValue) {
      this.log.debug(
        this._switchDownProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )
      if (newValue) {
        this._clearState = 'close'

        this.service
          .getCharacteristic(Characteristic.PositionState)
          .setValue(this.positionState)

        this._updateTargetPositionDebounced()
      }
    }

    /**
       * Handles changes from the device to the state property.
       */
    _switchUpChangeHandler(newValue) {
      this.log.debug(
        this._switchUpProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )
      if (newValue) {
        this._clearState = 'open'

        this.service
          .getCharacteristic(Characteristic.PositionState)
          .setValue(this.positionState)

        this._updateTargetPositionDebounced()
      }
    }

    /**
       * Invokes the _updateTargetPosition() method, debouncing the requests.
       */
    _updateTargetPositionDebounced() {
      if (this._targetPositionTimeout !== null) {
        clearTimeout(this._targetPositionTimeout)
        this._targetPositionTimeout = null
      }
      this._targetPositionTimeout = setTimeout(() => {
        this._updateTargetPosition()
        this._targetPositionTimeout = null
      }, 500)

      // Reset the position back to clear - 50
      if (this._clearPositionTimeout !== null) {
        clearTimeout(this._clearPositionTimeout)
        this._clearPositionTimeout = null
      }
      this._clearPositionTimeout = setTimeout(() => {
        this._clearState = 'stop'
        this._targetPosition = null
        this._updateTargetPosition()
        this._clearPositionTimeout = null
      }, this._clearPositionTimeoutSeconds * 1000)
    }

    /**
       * Since Shelly devices don't have a target position property, this method
       * simulates one.
       */
    _updateTargetPosition() {
      const state = this.state
      const position = this.position
      let targetPosition = null

      if (state === 'stop') {
        targetPosition = position
      } else if (state === 'open') {
        // we don't know what the target position is here, but we set it
        // to 100 so that the interface shows that the roller is opening
        targetPosition = 100
      } else if (state === 'close') {
        // we don't know what the target position is here, but we set it
        // to 0 so that the interface shows that the roller is closing
        targetPosition = 0
      }

      if (targetPosition !== null) {
        this.log.debug(
          'Setting target position of device',
          this.device.type,
          this.device.id,
          'to',
          targetPosition
        )

        this._targetPosition = targetPosition

        this.service
          .getCharacteristic(Characteristic.CurrentPosition)
          .setValue(targetPosition)
        this.service
          .getCharacteristic(Characteristic.TargetPosition)
          .setValue(targetPosition)
      }
    }

    detach() {
      if (this._setPositionTimeout !== null) {
        clearTimeout(this._setPositionTimeout)
        this._setPositionTimeout = null
      }
      if (this._targetPositionTimeout !== null) {
        clearTimeout(this._targetPositionTimeout)
        this._targetPositionTimeout = null
      }
      if (this._clearPositionTimeout !== null) {
        clearTimeout(this._clearPositionTimeout)
        this._clearPositionTimeout = null
      }

      this.device
        .removeListener(
          'change:' + this._switchUpProperty,
          this._switchUpChangeHandler,
          this
        )
        .removeListener(
          'change:' + this._switchDownProperty,
          this._switchDownChangeHandler,
          this
        )

      super.detach()
    }
  }

  return StatelessWindowCoveringAbility
}
