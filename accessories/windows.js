
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const WindowAbility = require('../abilities/window')(homebridge)
  const { ShellyAccessory } = require('./base')(homebridge)

  class Shelly2WindowAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('window', device, index, config, log)

      this.abilities.push(new WindowAbility(
        'rollerPosition',
        'rollerState',
        this.setPosition.bind(this)
      ))
    }

    get category() {
      return Accessory.Categories.WINDOW
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
    Shelly2WindowAccessory,
  }
}
