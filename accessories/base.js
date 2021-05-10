const { handleFailedRequest } = require('../util/error-handlers')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const PlatformAccessory = homebridge.platformAccessory
  const Service = homebridge.hap.Service
  const uuid = homebridge.hap.uuid

  const PowerMeterAbility = require('../abilities/power-meter')(homebridge)

  /**
   * Base class for all accessories.
   */
  class ShellyAccessory {
    /**
     * @param {string} accessoryType - Type identifier of this accessory.
     * @param {Object} device - The device associated with this accessory.
     * @param {number} index - The index of this accessory, in case the device
     * has multiple accessories.
     * @param {Object} config - Configuration options for this accessory.
     * @param {Object} log - The logger to use.
     * @param {Object[]} abilities - The abilities that this accessory should
     * have.
     */
    constructor(accessoryType, device, index, config, log, abilities = null) {
      this.accessoryType = accessoryType
      this.device = device
      this.index = index || 0
      this.config = config || {}
      this.log = log
      this.platformAccessory = null
      this.abilities = abilities || []
      this.defaultName = `${device.type} ${device.id} ${index}`
    }

    /**
     * The name of this accessory, as specified by either the configuration, the
     * device or the `defaultName` property.
     */
    get name() {
      if (this.config.name) {
        return this.config.name
      } else if (this.device.name) {
        return this.device.name
      }
      return this.defaultName
    }

    /**
     * The HomeKit category of this accessory.
     */
    get category() {
      // subclasses should override this
      return Accessory.Categories.OTHER
    }

    /**
     * Sets up this accessory and all of its abilities.
     * @param {Object} platformAccessory - A homebridge platform accessory to
     * associate with this accessory. Omit this parameter to create a new
     * platform accessory.
     */
    setup(platformAccessory = null) {
      this.platformAccessory = platformAccessory ||
        this._createPlatformAccessory()

      this._setupEventHandlers()
      this.updateAccessoryInformation()

      for (const a of this.abilities) {
        a.setup(this)
      }
    }

    _createPlatformAccessory() {
      const d = this.device
      const pa = new PlatformAccessory(
        this.name,
        uuid.generate(this.defaultName)
      )

      pa.category = this.category

      // set some info about this accessory
      pa.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, 'Shelly')
        .setCharacteristic(Characteristic.Model, d.type)
        .setCharacteristic(Characteristic.SerialNumber, d.id)

      // store some key info about this accessory in the context, so that
      // it will be persisted between restarts
      pa.context = {
        type: d.type,
        id: d.id,
        host: d.host,
        accessoryType: this.accessoryType,
        index: this.index,
      }

      // store the device mode if it has one
      if (d.mode) {
        pa.context.mode = d.mode
      }

      return pa
    }

    _setupEventHandlers() {
      this.platformAccessory.on('identify', this.identify.bind(this))
      this.device.on('change:settings', this.updateAccessoryInformation, this)
    }

    /**
     * Updates the accessory information based on the device settings.
     */
    updateAccessoryInformation() {
      const d = this.device
      const infoService = this.platformAccessory
        .getService(Service.AccessoryInformation)

      if (d.settings && d.settings.fw) {
        const fw = d.settings.fw
        // find the version number
        const m = fw.match(/v([0-9]+(?:\.[0-9]+)*)/)
        infoService.setCharacteristic(
          Characteristic.FirmwareRevision,
          m !== null ? m[1] : fw
        )
      }

      if (d.settings && d.settings.hwinfo) {
        infoService.setCharacteristic(
          Characteristic.HardwareRevision,
          d.settings.hwinfo.hw_revision
        )
      }

      infoService.setCharacteristic(
        Characteristic.Name, this.name
      )
    }

    /**
     * Identifies this accessory. This is usually requested by HomeKit during
     * setup.
     * @param {function} callback - Must be invoked after the accessory has been
     * identified.
     */
    identify(paired, callback) {
      this.log.info(this.name, 'at', this.device.host, 'identified')
      callback()
    }

    /**
     * Helper method for identifying an accessory by switching its state on
     * and off.
     * @param {boolean} currentState - The current state.
     * @param {function} handler - A handler function that sets the state to
     * the given value.
     * @param {function} callback - A callback that will be invoked once this
     * method is done.
     */
    async _identifyBySwitching(currentState, handler, callback,
      timeout = 1000) {
      try {
        // invert the current state for the given number of milliseconds
        await handler.call(this, !currentState)
        await new Promise(resolve => setTimeout(resolve, timeout))
        await handler.call(this, currentState)
        callback()
      } catch (e) {
        handleFailedRequest(
          this.log,
          this.device,
          e,
          'Failed to identify device'
        )
        callback(e)
      }
    }

    /**
     * Detaches this accessory and its abilities, removing all references to the
     * device that it was first associated with.
     */
    detach() {
      for (const a of this.abilities) {
        a.detach()
      }

      this.device.removeListener(
        'change:settings',
        this.updateAccessoryInformation,
        this
      )

      this.device = null
    }
  }

  /**
   * Base class for all accessories that use a Shelly device with a relay.
   */
  class ShellyRelayAccessory extends ShellyAccessory {
    /**
     * Adds a power meter service to this accessory.
     * This method must be called before setup().
     * @param {string} consumptionProperty - The device property used to
     * indicate the current power consumption (Watt).
     * @param {string} electricCurrentProperty - The device property used to
     * indicate the amount of electric current (Ampere).
     * @param {string} voltageProperty - The device property used to indicate
     * the current voltage (Volt).
     */
    addPowerMeter(consumptionProperty, electricCurrentProperty = null,
      voltageProperty = null) {
      this.abilities.push(new PowerMeterAbility(
        consumptionProperty,
        electricCurrentProperty,
        voltageProperty
      ))
    }

    /**
     * Sets the relay to the new value.
     * @returns {Promise} A Promise that resolves when the state of the relay
     * has been updated.
     */
    setRelay(newValue) {
      return this.device.setRelay(this.index, newValue)
    }

    identify(paired, callback) {
      super.identify(paired, () => {
        this._identifyBySwitching(
          this.device['relay' + this.index],
          state => this.setRelay(state),
          callback
        )
      })
    }
  }

  return {
    ShellyAccessory,
    ShellyRelayAccessory,
  }
}
