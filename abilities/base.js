const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
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
   * Common base class for all abilities that use a single device property and a
   * single HomeKit characteristic.
   */
  class SinglePropertyAbility extends Ability {
    /**
     * @param {object} Service - The HAP service class  to use.
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
    SinglePropertyAbility,
  }
}
