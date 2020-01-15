
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const DoorAbility = require('../abilities/door')(homebridge)
  const { ShellyAccessory } = require('./base')(homebridge)

  class Shelly2DoorAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('door', device, index, config, log)

      this.abilities.push(new DoorAbility(
        'rollerPosition',
        'rollerState',
        this.setPosition.bind(this)
      ))
    }

    get category() {
      return Accessory.Categories.DOOR
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
    Shelly2DoorAccessory,
  }
}
