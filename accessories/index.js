
module.exports = homebridge => {
  const {
    Shelly1RelayAccessory,
    Shelly2RelayAccessory,
    Shelly4ProRelayAccessory,
  } = require('./relays')(homebridge)

  const {
    Shelly2RollerShutterAccessory,
  } = require('./roller-shutters')(homebridge)

  return {
    Shelly1RelayAccessory,
    Shelly2RelayAccessory,
    Shelly2RollerShutterAccessory,
    Shelly4ProRelayAccessory,
  }
}
