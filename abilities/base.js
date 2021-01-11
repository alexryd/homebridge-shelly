const { handleFailedRequest } = require('../util/error-handlers')

module.exports = homebridge => {
  const Characteristic = homebridge.hap.Characteristic

  /**
   * An Ability is more or less equivalent to a HomeKit Service. An Accessory
   * has one or more Abilities.
   */
  class Ability {
    constructor() {
      this.device = null
      this.accessory = null
      this.log = null
      this.platformAccessory = null
    }

    get service() {
      // subclasses should override this property to return the corresponding
      // Service from the platform accessory
      return null
    }

    /**
     * Adds this ability to the given accessory.
     * @param {object} accessory - The accessory to add this ability to.
     */
    setup(accessory) {
      this.device = accessory.device
      this.accessory = accessory
      this.log = accessory.log
      this.platformAccessory = accessory.platformAccessory

      if (!this.service) {
        this.platformAccessory.addService(this._createService())
      }

      this._setupEventHandlers()
    }

    _createService() {
      // subclasses should override this method to create a Service and setup
      // its characteristics
      return null
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
      this._setPositionTimeout = null
      this._targetPosition = null
      this._targetPositionTimeout = null
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
    _targetPositionSetHandler(newValue, callback) {
      const d = this.device

      callback()

      if (this.targetPosition === newValue ||
          this._setPositionTimeout !== null) {
        return
      }

      this._setPositionTimeout = setTimeout(async () => {
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
        } catch (e) {
          handleFailedRequest(
            this.log,
            d,
            e,
            'Failed to set ' + this._positionProperty
          )
        }

        this._setPositionTimeout = null
      }, 1000)
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
      if (this._targetPositionTimeout !== null) {
        return
      }

      this._targetPositionTimeout = setTimeout(() => {
        this._updateTargetPosition()
        this._targetPositionTimeout = null
      }, 500)
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
      if (this._setPositionTimeout !== null) {
        clearTimeout(this._setPositionTimeout)
        this._setPositionTimeout = null
      }
      if (this._targetPositionTimeout !== null) {
        clearTimeout(this._targetPositionTimeout)
        this._targetPositionTimeout = null
      }

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
     * @param {Object} Service - The HAP service class to use.
     * @param {Object} Characteristic - The HAP characteristic class to use.
     * @param {(string|Object)} property - Name of the device property to use,
     * or an object with the name and a getter function.
     * @param {function} updater - A function that updates the device property.
     * Must return a Promise.
     */
    constructor(Service, Characteristic, property, updater = null) {
      super()

      let propertyName = property
      let propertyGetter = null

      if (typeof property !== 'string') {
        propertyName = property.name
        propertyGetter = property.getter
      }

      this._Service = Service
      this._Characteristic = Characteristic
      this._propertyName = propertyName
      this._propertyGetter = propertyGetter
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
      return this._propertyGetter
        ? this._propertyGetter.call(this.device, this._propertyName)
        : this.device[this._propertyName]
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

    _createService() {
      return new this._Service()
        .setCharacteristic(
          this._Characteristic,
          this._valueToHomeKit(this.value)
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
        'change:' + this._propertyName,
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
          this._propertyName,
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
          'Failed to set ' + this._propertyName
        )
        callback(e)
      }
    }

    /**
     * Handles changes from the device to our device property.
     */
    _propertyChangeHandler(newValue) {
      this.log.debug(
        this._propertyName,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      const nv = this._propertyGetter
        ? this._propertyGetter.call(this.device, this._propertyName)
        : newValue

      this.characteristic.setValue(
        this._valueToHomeKit(nv)
      )
    }

    detach() {
      this.device.removeListener(
        'change:' + this._propertyName,
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
