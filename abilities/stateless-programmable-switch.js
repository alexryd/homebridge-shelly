
module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class StatelessProgrammableSwitchAbility extends Ability {
    /**
     * @param {string} inputProperty - The device property used to indicate
     * switch events.
     * @param {number} index - The index of this switch.
     */
    constructor(inputProperty, index = 1) {
      super()

      this.inputProperty = inputProperty
      this.index = index
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      this.platformAccessory.addService(
        new Service.StatelessProgrammableSwitch(
          'Button ' + this.index,
          this.index
        )
          .setCharacteristic(
            Characteristic.ServiceLabelIndex,
            this.index
          )
      )
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.device.on(
        'change:' + this.inputProperty,
        this.inputChangeHandler,
        this
      )
    }

    /**
     * Handles switch events from the device.
     */
    inputChangeHandler(newValue) {
      this.log.debug(
        this.inputProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      const PSE = Characteristic.ProgrammableSwitchEvent
      let switchEvent = null

      if (newValue === 'S') {
        switchEvent = PSE.SINGLE_PRESS
      } else if (newValue === 'SS') {
        switchEvent = PSE.DOUBLE_PRESS
      } else if (newValue === 'L') {
        switchEvent = PSE.LONG_PRESS
      } else {
        return
      }

      this.platformAccessory
        .getServiceById('Button ' + this.index, this.index)
        .getCharacteristic(PSE)
        .updateValue(switchEvent)
    }

    detach() {
      this.device.removeListener(
        'change:' + this.inputProperty,
        this.inputChangeHandler,
        this
      )

      super.detach()
    }
  }

  return StatelessProgrammableSwitchAbility
}
