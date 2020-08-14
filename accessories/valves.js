
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const PowerConsumptionAbility =
    require('../abilities/power-consumption')(homebridge)
  const Service = homebridge.hap.Service
  const { ShellyRelayAccessory } = require('./base')(homebridge)
  const ValveAbility = require('../abilities/valve')(homebridge)

  class ShellyRelayValveAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log, powerMeterIndex = false) {
      super('valve', device, index, config, log)

      const consumptionProperty = powerMeterIndex !== false
        ? 'power' + powerMeterIndex
        : null

      this.abilities.push(new ValveAbility(
        'relay' + index,
        this.setRelay.bind(this),
        consumptionProperty
      ))

      if (consumptionProperty) {
        this.abilities.push(new PowerConsumptionAbility(
          Service.Valve,
          consumptionProperty
        ))
      }
    }

    get category() {
      return Accessory.Categories.FAUCET
    }
  }

  return {
    ShellyRelayValveAccessory,
  }
}
