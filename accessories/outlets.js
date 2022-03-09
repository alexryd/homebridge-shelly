
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const OutletAbility = require('../abilities/outlet')(homebridge)
  const { ShellyRelayAccessory } = require('./base')(homebridge)

  class ShellyRelayOutletAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log, powerMeterIndex = false,
      enableElectricCurrent = false, enableVoltage = false) {
      super('outlet', device, index, config, log)

      const consumptionProperty = powerMeterIndex !== false
        ? 'power' + powerMeterIndex
        : null

      this.abilities.push(new OutletAbility(
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
      return Accessory.Categories.OUTLET
    }
  }

  return {
    ShellyRelayOutletAccessory,
  }
}
