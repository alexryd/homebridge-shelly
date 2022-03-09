
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const SwitchAbility = require('../abilities/switch')(homebridge)
  const { ShellyRelayAccessory } = require('./base')(homebridge)

  class ShellyRelaySwitchAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log, powerMeterIndex = false,
      enableTotalConsumption = false) {
      super('switch', device, index, config, log)

      this.abilities.push(new SwitchAbility(
        'relay' + index,
        this.setRelay.bind(this)
      ))

      if (powerMeterIndex !== false) {
        this.addPowerMeter(
          'power' + powerMeterIndex,
          enableTotalConsumption ? 'energyCounter' + powerMeterIndex : null
        )
      }
    }

    get category() {
      return Accessory.Categories.SWITCH
    }
  }

  return {
    ShellyRelaySwitchAccessory,
  }
}
