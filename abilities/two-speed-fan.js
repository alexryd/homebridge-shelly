const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class TwoSpeedFanAbility extends Ability {
    /**
     * @param {string} switchProperty - The device property used to indicate the
     * switch state.
     * @param {function} setSpeed - A function that updates the device's switch
     * state. Must return a Promise.
     */
    constructor(speedOneProperty, speedTwoProperty, setSpeed) {
      super()

      this._speedOneProperty = speedOneProperty
      this._speedTwoProperty = speedTwoProperty
      this._setSpeed = setSpeed
      this._lastSpeed = 0
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      this.platformAccessory.addService(
        new Service.Fanv2()
          .setCharacteristic(Characteristic.Active, this.active)
          .setCharacteristic(Characteristic.RotationSpeed, this.speed)
      )
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.platformAccessory
        .getService(Service.Fanv2)
        .getCharacteristic(Characteristic.Active)
        .on('get', this.getActive.bind(this))
        .on('set', this._targetActiveSetHandler.bind(this))

      this.platformAccessory
        .getService(Service.Fanv2)
        .getCharacteristic(Characteristic.RotationSpeed)
        .setProps({
          minValue: 0,
          maxValue: 100,
          minStep: 50
        })
        .on('get', this.getSpeed.bind(this))
        .on('set', this._targetSpeedSetHandler.bind(this))

      this.device
        .on(
          'change:' + this._speedOneProperty,
          this._speedOnePropertyChangeHandler,
          this
        )
        .on(
          'change:' + this._speedTwoProperty,
          this._speedTwoPropertyChangeHandler,
          this
        )
    }

    get active() {
      return this.speed > 0 ? 1 : 0
    }

    get speed() {
      if (this.device[this._speedTwoProperty]) {
        return 100
      } else if (this.device[this._speedOneProperty]) {
        return 50
      }

      return 0
    }

    getActive(callback) {
      callback(null, this.active)
    }

    getSpeed(callback) {
      callback(null, this.speed)
    }

    async _targetSpeedSetHandler(value, callback, context) {
      const d = this.device

      if (context === 'shelly' || this.speed === value) {
        callback()
        return
      }

      this.log.debug(
        'Setting fan speed ',
        'of device',
        d.type,
        d.id,
        'to',
        value
      )

      try {
        // Always keep track of the last speed set
        this._lastSpeed = value
        await this._setSpeed(value)
        callback()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          'Failed to set fan speed'
        )
        callback(e)
      }
    }

    _speedOnePropertyChangeHandler(newValue) {
      this.log.debug(
        this._speedOneProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this._stateChangeHandler()
    }

    _speedTwoPropertyChangeHandler(newValue) {
      this.log.debug(
        this._speedTwoProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this._stateChangeHandler()
    }

    _stateChangeHandler() {
      this.platformAccessory
        .getService(Service.Fanv2)
        .getCharacteristic(Characteristic.Active)
        .setValue(this.active, null, 'shelly')

      if (this.active > 0) {
        this.platformAccessory
          .getService(Service.Fanv2)
          .getCharacteristic(Characteristic.RotationSpeed)
          .setValue(this.speed, null, 'shelly')
      }
    }

    async _targetActiveSetHandler(newValue, callback, context) {
      const d = this.device

      if (context === 'shelly' || this.active === newValue) {
        callback()
        return
      }

      this.log.debug(
        'Setting fan active ',
        'of device',
        d.type,
        d.id,
        'to',
        newValue
      )

      try {
        if (newValue === 0) {
          // Always keep track of the last speed set
          this._lastSpeed = this.speed
          await this._setSpeed(0)
        } else {
          await this._setSpeed(this._lastSpeed)
        }
        callback()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          'Failed to set fan speed'
        )
        callback(e)
      }
    }

    detach() {
      this.device
        .removeListener(
          'change:' + this._speedOneProperty,
          this._speedOnePropertyChangeHandler,
          this
        )

      this.device
        .removeListener(
          'change:' + this._speedTwoProperty,
          this._speedTwoPropertyChangeHandler,
          this
        )

      super.detach()
    }
  }

  return TwoSpeedFanAbility
}
