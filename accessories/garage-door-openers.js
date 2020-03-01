
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const BasicGarageDoorOpenerAbility =
    require('../abilities/basic-garage-door-opener')(homebridge)
  const GarageDoorOpenerAbility =
    require('../abilities/garage-door-opener')(homebridge)
  const { ShellyRelayAccessory } = require('./base')(homebridge)

  class Shelly1GarageDoorOpenerAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log) {
      super('garageDoorOpener', device, index, config, log)

      this.abilities.push(new BasicGarageDoorOpenerAbility(
        'rollerPosition',
        'rollerState',
        this.setRelay.bind(this)
      ))
    }

    get category() {
      return Accessory.Categories.GARAGE_DOOR_OPENER
    }
  }
  
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
    Shelly1GarageDoorOpenerAccessory,
    Shelly2GarageDoorOpenerAccessory
  }
}
