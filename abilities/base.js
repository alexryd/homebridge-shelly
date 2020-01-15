const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Characteristic = homebridge.hap.Characteristic

  class Ability {
    constructor() {
      this.device = null
      this.accessory = null
      this.log = null
      this.platformAccessory = null
    }

    /**
     * Adds this ability to the given accessory.
     * @param {object} accessory - The accessory to add this ability to.
     * @param {boolean} setupPlatformAccessory - Whether the platform accessory
     * is new and needs to be set up.
     */
    setup(accessory, setupPlatformAccessory = true) {
      this.device = accessory.device
      this.accessory = accessory
      this.log = accessory.log
      this.platformAccessory = accessory.platformAccessory

      if (setupPlatformAccessory) {
        this._setupPlatformAccessory()
      }
      this._setupEventHandlers()
    }

    _setupPlatformAccessory() {
      // subclasses should use this method to add services and characteristics
      // to the platform accessory
    }

    _setupEventHandlers() {
      // subclasses should use this method to set up event handlers on the
      // platform accessory and the device
    }

    /**
     * Detaches this ability, removing all references to the device that it was
     * first associated with.
     */
    detach() {
      // subclasses should use this method to remove all event handlers and all
      // references to the device
      this.device = null
    }
  }

  /**
   * Common base class for all abilities that use a position and a state.
   */
  class PositionableAbility extends Ability {
    /**
     * @param {object} Service - The HAP service class to use.
     * @param {string} positionProperty - The device property used to indicate
     * the current position.
     * @param {string} stateProperty - The device property used to indicate the
     * current state.
     * @param {function} setPosition - A function that updates the device's
     * target position. Must return a Promise.
     */
    constructor(Service, positionProperty, stateProperty, setPosition) {
      super()

      this._Service = Service
      this._positionProperty = positionProperty
      this._stateProperty = stateProperty
      this._setPosition = setPosition
      this._targetPosition = null
      this._updatingTargetPosition = false
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
      return this.device[this._positionProperty] || 0
    }

    /**
     * The device's current state.
     */
    get state() {
      return this.device[this._stateProperty] || 'stop'
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

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      this.platformAccessory.addService(
        new this._Service()
          .setCharacteristic(Characteristic.PositionState, this.positionState)
          .setCharacteristic(Characteristic.CurrentPosition, this.position)
          .setCharacteristic(Characteristic.TargetPosition, this.targetPosition)
      )
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.service
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

      this.service
        .getCharacteristic(Characteristic.PositionState)
        .setValue(this.positionState)

      this._updateTargetPositionDebounced()
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

      this.service
        .getCharacteristic(Characteristic.CurrentPosition)
        .setValue(this.position)

      this._updateTargetPositionDebounced()
    }

    /**
     * Invokes the _updateTargetPosition() method, debouncing the requests.
     */
    _updateTargetPositionDebounced() {
      if (this._updatingTargetPosition) {
        return
      }
      this._updatingTargetPosition = true

      setImmediate(() => {
        this._updateTargetPosition()
        this._updatingTargetPosition = false
      })
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

        this.service
          .getCharacteristic(Characteristic.TargetPosition)
          .setValue(targetPosition)
      }
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

  /**
   * Common base class for all abilities that use a single device property and a
   * single HomeKit characteristic.
   */
  class SinglePropertyAbility extends Ability {
    /**
     * @param {object} Service - The HAP service class to use.
     * @param {object} Characteristic - The HAP characteristic class to use.
     * @param {string} property - Name of the device property to use.
     * @param {function} updater - A function that updates the device property.
     * Must return a Promise.
     */
    constructor(Service, Characteristic, property, updater = null) {
      super()

      this._Service = Service
      this._Characteristic = Characteristic
      this._property = property
      this._updater = updater
    }

    /**
     * The HAP service that this ability has added.
     */
    get service() {
      return this.platformAccessory.getService(this._Service)
    }

    /**
     * The HAP characteristic that this ability is using.
     */
    get characteristic() {
      return this.service.getCharacteristic(this._Characteristic)
    }

    /**
     * The value of this ability's associated device property.
     */
    get value() {
      return this.device[this._property]
    }

    /**
     * Transforms the given value that was supplied by HomeKit.
     */
    _valueFromHomeKit(value) {
      return value
    }

    /**
     * Transforms the given value that will be transmitted to HomeKit.
     */
    _valueToHomeKit(value) {
      return value
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      // add our service and set our characteristic
      this.platformAccessory.addService(
        new this._Service()
          .setCharacteristic(
            this._Characteristic,
            this._valueToHomeKit(this.value)
          )
      )
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      if (this._updater) {
        // we only need to listen for changes to the characteristic if we have
        // an updater function
        this.characteristic.on(
          'set',
          this._characteristicSetHandler.bind(this)
        )
      }

      this.device.on(
        'change:' + this._property,
        this._propertyChangeHandler,
        this
      )
    }

    /**
     * Handles changes from HomeKit to our characteristic.
     */
    async _characteristicSetHandler(newValue, callback) {
      const d = this.device
      const nv = this._valueFromHomeKit(newValue)

      if (this.value === nv) {
        callback()
        return
      }

      try {
        this.log.debug(
          'Setting',
          this._property,
          'of device',
          d.type,
          d.id,
          'to',
          nv
        )
        await this._updater(nv)
        callback()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          'Failed to set ' + this._property
        )
        callback(e)
      }
    }

    /**
     * Handles changes from the device to our device property.
     */
    _propertyChangeHandler(newValue) {
      this.log.debug(
        this._property,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.characteristic.setValue(
        this._valueToHomeKit(newValue)
      )
    }

    detach() {
      this.device.removeListener(
        'change:' + this._property,
        this._propertyChangeHandler,
        this
      )

      super.detach()
    }
  }

  return {
    Ability,
    PositionableAbility,
    SinglePropertyAbility,
  }
}
