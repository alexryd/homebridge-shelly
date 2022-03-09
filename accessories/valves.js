
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const { ShellyRelayAccessory } = require('./base')(homebridge)
  const ValveAbility = require('../abilities/valve')(homebridge)

  class ShellyRelayValveAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log, powerMeterIndex = false,
      enableElectricCurrent = false, enableVoltage = false) {
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
        this.addPowerMeter(
          consumptionProperty,
          enableElectricCurrent ? 'current' + powerMeterIndex : null,
          enableVoltage ? 'voltage' + powerMeterIndex : null,
        )
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
