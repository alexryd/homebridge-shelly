
module.exports = homebridge => {
  const { SinglePropertyAbility } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class SwitchAbility extends SinglePropertyAbility {
    /**
     * @param {string} switchProperty - The device property used to indicate the
     * switch state.
     * @param {function} setSwitch - A function that updates the device's switch
     * state. Must return a Promise.
     */
    constructor(switchProperty, setSwitch) {
      super(
        Service.Switch,
        Characteristic.On,
        switchProperty,
        setSwitch
      )
    }

    _valueToHomeKit(value) {
      return !!value
    }
  }

  return SwitchAbility
}
