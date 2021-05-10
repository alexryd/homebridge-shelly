
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const SwitchAbility = require('../abilities/switch')(homebridge)
  const { ShellyRelayAccessory } = require('./base')(homebridge)

  class ShellyRelaySwitchAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log, powerMeterIndex = false) {
      super('switch', device, index, config, log)

      this.abilities.push(new SwitchAbility(
        'relay' + index,
        this.setRelay.bind(this)
      ))

      if (powerMeterIndex !== false) {
        this.addPowerMeter('power' + powerMeterIndex)
      }
    }

    /**
     * The name of this accessory, as specified by either the configuration, the
     * device or the `defaultName` property.
     */
    get name() {
      if (this.config.channels && this.config.channels[this.index] && this.config.channels[this.index].name) {
        return this.config.channels[this.index].name
      } else if (this.config.name) {
        return this.config.name
      }

      const d = this.device
      if (d.settings && d.settings.relays && d.settings.relays[this.index] && d.settings.relays[this.index].name) {
        return d.settings.relays[this.index].name
      } else if (this.device.name) {
        return this.device.name
      }
      return this.defaultName
    }

    get category() {
      return Accessory.Categories.SWITCH
    }
  }

  return {
    ShellyRelaySwitchAccessory,
  }
}
