
module.exports = homebridge => {
  const BatteryAbility = require('../abilities/battery')(homebridge)
  const ServiceLabelAbility = require('../abilities/service-label')(homebridge)
  const {
    StatelessProgrammableSwitchAbility,
    StatelessProgrammableToggleAbility,
  } = require('../abilities/stateless-programmable-switch')(homebridge)
  const { ShellyAccessory } = require('./base')(homebridge)

  class ShellyButton1StatelessSwitchAccessory extends ShellyAccessory {
    constructor(device, index, config, log) {
      super('statelessSwitch', device, index, config, log, [
        new StatelessProgrammableSwitchAbility(
          'inputEvent0',
          'inputEventCounter0'
        ),
        new BatteryAbility('battery'),
      ])
    }
  }

  class ShellyInputStatelessSwitchAccessory extends ShellyAccessory {
    constructor(device, index, config, log, numberOfInputs = 1, numberOfFirstInput = 0) {
      super('statelessSwitch', device, index, config, log)

      if (numberOfInputs === 1) {
        this.abilities.push(new StatelessProgrammableSwitchAbility(
          'inputEvent' + numberOfFirstInput,
          'inputEventCounter' + numberOfFirstInput
        ))
      } else {
        for (let i = 0; i < numberOfInputs; i++) {
          this.abilities.push(new StatelessProgrammableSwitchAbility(
            'inputEvent' + (i + numberOfFirstInput),
            'inputEventCounter' + (i + numberOfFirstInput),
            i + 1
          ))
        }

        this.abilities.push(new ServiceLabelAbility())
      }
    }
  }

  class ShellyInputStatelessToggleAccessory extends ShellyAccessory {
    constructor(device, index, config, log, numberOfInputs = 1, numberOfFirstInput = 0) {
      super('statelessToggle', device, index, config, log)

      if (numberOfInputs === 1) {
        this.abilities.push(new StatelessProgrammableToggleAbility(
          'input' + numberOfFirstInput,
          'inputEventCounter' + numberOfFirstInput
        ))
      } else {
        for (let i = 0; i < numberOfInputs; i++) {
          this.abilities.push(new StatelessProgrammableToggleAbility(
            'input' + (i + numberOfFirstInput),
            'inputEventCounter' + (i + numberOfFirstInput),
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
    ShellyInputStatelessToggleAccessory,
  }
}
