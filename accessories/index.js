
module.exports = homebridge => {
  const {
    ShellyBulbColorLightbulbAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
  } = require('./lightbulbs')(homebridge)

  const {
    ShellyHTAccessory,
    ShellySenseAccessory,
  } = require('./sensors')(homebridge)

  const {
    Shelly1PMSwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly2SwitchAccessory,
    Shelly4ProSwitchAccessory,
    ShellyPlugSwitchAccessory,
  } = require('./switches')(homebridge)

  const {
    Shelly2WindowCoveringAccessory,
  } = require('./window-coverings')(homebridge)

  return {
    Shelly1PMSwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly2SwitchAccessory,
    Shelly2WindowCoveringAccessory,
    Shelly4ProSwitchAccessory,
    ShellyBulbColorLightbulbAccessory,
    ShellyHTAccessory,
    ShellyPlugSwitchAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
    ShellySenseAccessory,
  }
}
