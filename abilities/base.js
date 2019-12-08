
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

  return Ability
}
