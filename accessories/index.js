
module.exports = homebridge => {
  const {
    Shelly1RelayAccessory,
    Shelly1PMRelayAccessory,
    Shelly2RelayAccessory,
    Shelly4ProRelayAccessory,
  } = require('./relays')(homebridge)

  const {
    Shelly2RollerShutterAccessory,
  } = require('./roller-shutters')(homebridge)

  const {
    ShellyHTAccessory,
  } = require('./sensors')(homebridge)

  return {
    Shelly1RelayAccessory,
    Shelly1PMRelayAccessory,
    Shelly2RelayAccessory,
    Shelly2RollerShutterAccessory,
    Shelly4ProRelayAccessory,
    ShellyHTAccessory,
  }
}
