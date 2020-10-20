
module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class StatelessProgrammableSwitchAbility extends Ability {
    /**
     * @param {string} inputTypeProperty - The device property used to indicate
     * which type of input has been triggered, e.g. 'S', 'SS' or 'L'.
     * @param {string} inputCounterProperty - The device property used to
     * indicate the current input event count.
     * @param {number} index - The index of this switch.
     */
    constructor(inputTypeProperty, inputCounterProperty, index = 1) {
      super()

      this.inputTypeProperty = inputTypeProperty
      this.inputCounterProperty = inputCounterProperty
      this.index = index
      this._switchTimeout = null
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

      this.device
        .on(
          'change:' + this.inputTypeProperty,
          this._inputTypeChangeHandler,
          this
        )
        .on(
          'change:' + this.inputCounterProperty,
          this._inputCounterChangeHandler,
          this
        )
    }

    /**
     * Handles changes from the device to the input type property.
     */
    _inputTypeChangeHandler(newValue) {
      this.log.debug(
        this.inputTypeProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this._triggerSwitchDebounced()
    }

    /**
     * Handles changes from the device to the input counter property.
     */
    _inputCounterChangeHandler(newValue) {
      this.log.debug(
        this.inputCounterProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this._triggerSwitchDebounced()
    }

    /**
     * Triggers a new switch event, debouncing the requests.
     */
    _triggerSwitchDebounced() {
      if (this._switchTimeout !== null) {
        return
      }

      this._switchTimeout = setTimeout(() => {
        this._triggerSwitch()
        this._switchTimeout = null
      }, 0)
    }

    /**
     * Triggers a new switch event.
     */
    _triggerSwitch() {
      const PSE = Characteristic.ProgrammableSwitchEvent
      const inputType = this.device[this.inputTypeProperty]
      let switchEvent = null

      if (inputType === 'S') {
        switchEvent = PSE.SINGLE_PRESS
      } else if (inputType === 'SS') {
        switchEvent = PSE.DOUBLE_PRESS
      } else if (inputType === 'L') {
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
      this.device
        .removeListener(
          'change:' + this.inputTypeProperty,
          this._inputTypeChangeHandler,
          this
        )
        .removeListener(
          'change:' + this.inputCounterProperty,
          this._inputCounterChangeHandler,
          this
        )

      super.detach()
    }
  }

  return StatelessProgrammableSwitchAbility
}
