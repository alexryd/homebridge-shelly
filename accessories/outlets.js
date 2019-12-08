
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

  class Shelly1OutletAccessory extends ShellyRelayOutletAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, false)
    }

    get defaultName() {
      return `Shelly 1 ${this.device.id}`
    }
  }

  class Shelly1PMOutletAccessory extends ShellyRelayOutletAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }

    get defaultName() {
      return `Shelly 1PM ${this.device.id}`
    }
  }

  class Shelly2OutletAccessory extends ShellyRelayOutletAccessory {
    constructor(device, index, config, log) {
      super(
        device,
        index,
        config,
        log,
        // Shelly 2 has a single power meter
        device.type === 'SHSW-21' ? 0 : index
      )
    }

    _createPlatformAccessory() {
      const pa = super._createPlatformAccessory()
      pa.context.mode = 'relay'
      return pa
    }

    get defaultName() {
      const n = this.device.type === 'SHSW-25' ? '2.5' : '2'
      return `Shelly ${n} ${this.device.id} #${this.index}`
    }
  }

  class Shelly4ProOutletAccessory extends ShellyRelayOutletAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }

    get defaultName() {
      return `Shelly 4Pro ${this.device.id} #${this.index}`
    }
  }

  class ShellyEMOutletAccessory extends ShellyRelayOutletAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }

    get defaultName() {
      return `Shelly EM ${this.device.id}`
    }
  }

  class ShellyHDOutletAccessory extends ShellyRelayOutletAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }

    get defaultName() {
      return `Shelly HD ${this.device.id} #${this.index}`
    }
  }

  class ShellyPlugOutletAccessory extends ShellyRelayOutletAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }

    get name() {
      const n = this.device.type === 'SHPLG-S' ? 'Plug S' : 'Plug'
      return `Shelly ${n} ${this.device.id}`
    }
  }

  return {
    ShellyRelayOutletAccessory,
    Shelly1PMOutletAccessory,
    Shelly1OutletAccessory,
    Shelly2OutletAccessory,
    Shelly4ProOutletAccessory,
    ShellyEMOutletAccessory,
    ShellyHDOutletAccessory,
    ShellyPlugOutletAccessory,
  }
}
