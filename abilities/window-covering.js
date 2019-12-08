const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Ability = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  const positionStates = new Map()
  positionStates.set('stop', Characteristic.PositionState.STOPPED)
  positionStates.set('open', Characteristic.PositionState.INCREASING)
  positionStates.set('close', Characteristic.PositionState.DECREASING)

  class WindowCoveringAbility extends Ability {
    constructor(positionProperty, stateProperty, setPosition) {
      super()

      this._positionProperty = positionProperty
      this._stateProperty = stateProperty
      this._setPosition = setPosition
      this._targetPosition = null
      this._updatingTargetPosition = false
    }

    get position() {
      return this.device[this._positionProperty]
    }

    get state() {
      return positionStates.get(this.device[this._stateProperty])
    }

    get targetPosition() {
      return this._targetPosition !== null
        ? this._targetPosition
        : this.position
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const coveringService = new Service.WindowCovering()
        .setCharacteristic(Characteristic.PositionState, this.state)
        .setCharacteristic(Characteristic.CurrentPosition, this.position)
        .setCharacteristic(Characteristic.TargetPosition, this.targetPosition)

      this.platformAccessory.addService(coveringService)
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      const coveringService = this.platformAccessory
        .getService(Service.WindowCovering)

      coveringService
        .getCharacteristic(Characteristic.TargetPosition)
        .on('set', this._targetPositionSetHandler.bind(this))

      this.device
        .on(
          'change:' + this._stateProperty,
          this._stateChangeHandler,
          this
        )
        .on(
          'change:' + this._positionProperty,
          this._positionChangeHandler,
          this
        )
    }

    /**
     * Handles changes from HomeKit to the TargetPosition characteristic.
     */
    async _targetPositionSetHandler(newValue, callback) {
      const d = this.device

      if (this.targetPosition === newValue) {
        callback()
        return
      }

      this.log.debug(
        'Setting',
        this._positionProperty,
        'of device',
        d.type,
        d.id,
        'to',
        newValue
      )

      try {
        await this._setPosition(newValue)
        this._targetPosition = newValue
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

      this.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.PositionState)
        .setValue(this.state)

      this._updateTargetPosition()
    }

    /**
     * Handles changes from the device to the position property.
     */
    _positionChangeHandler(newValue) {
      this.log.debug(
        this._positionProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.CurrentPosition)
        .setValue(this.position)

      this._updateTargetPosition()
    }

    /**
     * Since Shelly devices don't have a target position property, this method
     * simulates one.
     */
    _updateTargetPosition() {
      if (this._updatingTargetPosition) {
        return
      }
      this._updatingTargetPosition = true

      setImmediate(() => {
        const state = this.device[this._stateProperty]
        const position = this.position
        let targetPosition = null

        if (state === 'stop') {
          targetPosition = position
        } else if (state === 'open' && this.targetPosition <= position) {
          // we don't know what the target position is here, but we set it
          // to 100 so that the interface shows that the roller is opening
          targetPosition = 100
        } else if (state === 'close' && this.targetPosition >= position) {
          // we don't know what the target position is here, but we set it
          // to 0 so that the interface shows that the roller is closing
          targetPosition = 0
        }

        if (targetPosition !== null && targetPosition !== this.targetPosition) {
          this.log.debug(
            'Setting target position of device',
            this.device.type,
            this.device.id,
            'to',
            targetPosition
          )

          this._targetPosition = targetPosition

          this.platformAccessory
            .getService(Service.WindowCovering)
            .getCharacteristic(Characteristic.TargetPosition)
            .setValue(targetPosition)
        }

        this._updatingTargetPosition = false
      })
    }

    detach() {
      this.device
        .removeListener(
          'change:' + this._stateProperty,
          this._stateChangeHandler,
          this
        )
        .removeListener(
          'change:' + this._positionProperty,
          this._positionChangeHandler,
          this
        )

      super.detach()
    }
  }

  return WindowCoveringAbility
}
