
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const WindowCoveringAbility =
    require('../abilities/window-covering')(homebridge)
  const { ShellyAccessory } = require('./base')(homebridge)

  class Shelly2WindowCoveringAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('windowCovering', device, index, config, log)

      this.abilities.push(new WindowCoveringAbility(
        'rollerPosition',
        'rollerState',
        this.setPosition.bind(this)
      ))
    }

    get defaultName() {
      const n = this.device.type === 'SHSW-25' ? '2.5' : '2'
      return `Shelly ${n} ${this.device.id}`
    }

    get category() {
      return Accessory.Categories.WINDOW_COVERING
    }

    _createPlatformAccessory() {
      const pa = super._createPlatformAccessory()
      pa.context.mode = 'roller'
      return pa
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
    Shelly2WindowCoveringAccessory,
  }
}
