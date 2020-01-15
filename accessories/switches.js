
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const PowerConsumptionAbility =
    require('../abilities/power-consumption')(homebridge)
  const SwitchAbility = require('../abilities/switch')(homebridge)
  const Service = homebridge.hap.Service
  const { ShellyRelayAccessory } = require('./base')(homebridge)

  class ShellyRelaySwitchAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log, powerMeterIndex = false) {
      super('switch', device, index, config, log)

      this.abilities.push(new SwitchAbility(
        'relay' + index,
        this.setRelay.bind(this)
      ))

      if (powerMeterIndex !== false) {
        this.abilities.push(new PowerConsumptionAbility(
          Service.Switch,
          'powerMeter' + powerMeterIndex
        ))
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
