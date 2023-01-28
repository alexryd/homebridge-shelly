
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const WindowCoveringAbility =
    require('../abilities/window-covering')(homebridge)
  const StatelessWindowCoveringAbility =
    require('../abilities/stateless-window-covering')(homebridge)
  const { ShellyAccessory } =
    require('./base')(homebridge)

  class Shelly2WindowCoveringAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('windowCovering', device, index, config, log)

      this.abilities.push(new WindowCoveringAbility(
        'rollerPosition',
        'rollerState',
        this.setPosition.bind(this)
      ))
    }

    get category() {
      return Accessory.Categories.WINDOW_COVERING
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

  class ShellyUniWindowCoveringAccessory extends ShellyAccessory {
    constructor(device, config, log) {
      super('windowCovering', device, null, config, log)
      this._relayDownIndex = 0
      this._relayUpIndex = 1

      const clearTimeout = config.clearTimeout || 60
      this.abilities.push(new StatelessWindowCoveringAbility(
        'relay' + this._relayDownIndex,
        'relay' + this._relayUpIndex,
        this.setPosition.bind(this),
        clearTimeout
      ))
    }

    get category() {
      return Accessory.Categories.WINDOW_COVERING
    }

    /**
     * Sets the current position to the new value.
     * @returns {Promise} A Promise that resolves when the position has been
     * updated.
     */
    setPosition(newValue) {
      if (newValue < 50) {
        return Promise.all([this.device.setRelay(this._relayUpIndex, false),
          this.device.setRelay(this._relayDownIndex, true)])
      } else if (newValue > 50) {
        return Promise.all([this.device.setRelay(this._relayDownIndex, false),
          this.device.setRelay(this._relayUpIndex, true)])
      } else {
        return Promise.all([this.device.setRelay(this._relayUpIndex, false),
          this.device.setRelay(this._relayDownIndex, false)])
      }
    }
  }

  return {
    Shelly2WindowCoveringAccessory,
    ShellyUniWindowCoveringAccessory
  }
}
