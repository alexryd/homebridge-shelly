
module.exports = homebridge => {
  const {
    ShellyBulbColorLightbulbAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
  } = require('./lightbulbs')(homebridge)

  const {
    Shelly1RelayAccessory,
    Shelly1PMRelayAccessory,
    Shelly2RelayAccessory,
    Shelly4ProRelayAccessory,
    ShellyPlugRelayAccessory,
  } = require('./relays')(homebridge)

  const {
    Shelly2RollerShutterAccessory,
  } = require('./roller-shutters')(homebridge)

  const {
    ShellyHTAccessory,
    ShellySenseAccessory,
  } = require('./sensors')(homebridge)

  return {
    Shelly1RelayAccessory,
    Shelly1PMRelayAccessory,
    Shelly2RelayAccessory,
    Shelly2RollerShutterAccessory,
    Shelly4ProRelayAccessory,
    ShellyBulbColorLightbulbAccessory,
    ShellyHTAccessory,
    ShellyPlugRelayAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
    ShellySenseAccessory,
  }
}
