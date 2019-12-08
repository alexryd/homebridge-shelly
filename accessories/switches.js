
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

  class Shelly1SwitchAccessory extends ShellyRelaySwitchAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, false)
    }
  }

  class Shelly1PMSwitchAccessory extends ShellyRelaySwitchAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }
  }

  class Shelly2SwitchAccessory extends ShellyRelaySwitchAccessory {
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
  }

  class Shelly4ProSwitchAccessory extends ShellyRelaySwitchAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }
  }

  class ShellyEMSwitchAccessory extends ShellyRelaySwitchAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }
  }

  class ShellyHDSwitchAccessory extends ShellyRelaySwitchAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }
  }

  class ShellyPlugSwitchAccessory extends ShellyRelaySwitchAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, index)
    }
  }

  return {
    ShellyRelaySwitchAccessory,
    Shelly1PMSwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly2SwitchAccessory,
    Shelly4ProSwitchAccessory,
    ShellyEMSwitchAccessory,
    ShellyHDSwitchAccessory,
    ShellyPlugSwitchAccessory,
  }
}
