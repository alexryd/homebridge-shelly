
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const GarageDoorSwitchAbility =
    require('../abilities/garage-door-switch')(homebridge)
  const GarageDoorOpenerAbility =
    require('../abilities/garage-door-opener')(homebridge)
  const {
    ShellyAccessory,
    ShellyRelayAccessory
  } = require('./base')(homebridge)

  class Shelly1GarageDoorSwitchAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log) {
      super('garageDoorOpener', device, index, config, log)

      this.abilities.push(new GarageDoorSwitchAbility(
        'relay' + index,
        'input' + index,
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
    Shelly1GarageDoorSwitchAccessory,
    Shelly2GarageDoorOpenerAccessory
  }
}
