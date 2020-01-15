
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const GarageDoorOpenerAbility =
    require('../abilities/garage-door-opener')(homebridge)
  const { ShellyAccessory } = require('./base')(homebridge)

  class Shelly2GarageDoorOpenerAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('garageDoorOpener', device, index, config, log)

      this.abilities.push(new GarageDoorOpenerAbility(
        'rollerPosition',
        'rollerState',
        this.setPosition.bind(this)
      ))
    }

    get category() {
      return Accessory.Categories.GARAGE_DOOR_OPENER
    }

    /**
     * Sets the current position to the new value.
     * @returns {Promise} A Promise that resolves when the position has been
     * updated.
     */
    setPosition(newValue) {
      return this.device.setRollerPosition(newValue)
    }
  }

  return {
    Shelly2GarageDoorOpenerAccessory,
  }
}
