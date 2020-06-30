
module.exports = homebridge => {
  const BatteryAbility = require('../abilities/battery')(homebridge)
  const ServiceLabelAbility = require('../abilities/service-label')(homebridge)
  const StatelessProgrammableSwitchAbility =
    require('../abilities/stateless-programmable-switch')(homebridge)
  const { ShellyAccessory } = require('./base')(homebridge)

  class ShellyButton1StatelessSwitchAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('statelessSwitch', device, index, config, log, [
        new StatelessProgrammableSwitchAbility('inputEvent0'),
        new BatteryAbility('battery'),
      ])
    }
  }

  class ShellyInputStatelessSwitchAccessory extends ShellyAccessory {
    constructor(device, index, config, log, numberOfInputs = 1) {
      super('statelessSwitch', device, index, config, log)

      if (numberOfInputs === 1) {
        this.abilities.push(new StatelessProgrammableSwitchAbility(
          'inputEvent0'
        ))
      } else {
        for (let i = 0; i < numberOfInputs; i++) {
          this.abilities.push(new StatelessProgrammableSwitchAbility(
            'inputEvent' + i,
            i + 1
          ))
        }

        this.abilities.push(new ServiceLabelAbility())
      }
    }
  }

  return {
    ShellyButton1StatelessSwitchAccessory,
    ShellyInputStatelessSwitchAccessory,
  }
}
