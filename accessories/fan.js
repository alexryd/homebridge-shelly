
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const TwoSpeedFanAbility =
    require('../abilities/two-speed-fan')(homebridge)
  const {
    ShellyAccessory
  } = require('./base')(homebridge)

  class Shelly2FanAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('fan', device, index, config, log)

      this.abilities.push(new TwoSpeedFanAbility(
        'relay' + index,
        'relay' + (index + 1),
        this.setSpeed.bind(this)
      ))
    }

    get category() {
      return Accessory.Categories.FAN
    }

    /**
     * Sets the current position to the new value.
     * @returns {Promise} A Promise that resolves when the position has been
     * updated.
     */
    async setSpeed(newValue) {
      switch (newValue) {
        case 0:
          await this.device.setRelay(this.index, false)
          await this.device.setRelay(this.index + 1, false)
          break
        case 50:
          await this.device.setRelay(this.index, true)
          await this.device.setRelay(this.index + 1, false)
          break
        case 100:
          await this.device.setRelay(this.index, false)
          await this.device.setRelay(this.index + 1, true)
          break
      }
    }
  }

  return {
    Shelly2FanAccessory
  }
}
