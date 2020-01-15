
module.exports = homebridge => {
  const { PositionableAbility } = require('./base')(homebridge)
  const Service = homebridge.hap.Service

  class WindowAbility extends PositionableAbility {
    /**
     * @param {string} positionProperty - The device property used to indicate
     * the current position.
     * @param {string} stateProperty - The device property used to indicate the
     * current state.
     * @param {function} setPosition - A function that updates the device's
     * target position. Must return a Promise.
     */
    constructor(positionProperty, stateProperty, setPosition) {
      super(
        Service.Window,
        positionProperty,
        stateProperty,
        setPosition
      )
    }
  }

  return WindowAbility
}
