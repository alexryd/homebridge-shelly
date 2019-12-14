
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const OutletAbility = require('../abilities/outlet')(homebridge)
  const PowerConsumptionAbility =
    require('../abilities/power-consumption')(homebridge)
  const Service = homebridge.hap.Service
  const { ShellyRelayAccessory } = require('./base')(homebridge)

  class ShellyRelayOutletAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log, powerMeterIndex = false) {
      super('outlet', device, index, config, log)

      const consumptionProperty = powerMeterIndex !== false
        ? 'powerMeter' + powerMeterIndex
        : null

      this.abilities.push(new OutletAbility(
        'relay' + index,
        consumptionProperty,
        this.setRelay.bind(this)
      ))

      if (consumptionProperty) {
        this.abilities.push(new PowerConsumptionAbility(
          Service.Outlet,
          consumptionProperty
        ))
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
