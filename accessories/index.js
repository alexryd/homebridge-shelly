
module.exports = homebridge => {
  const {
    ShellyBulbColorLightbulbAccessory,
    ShellyDimmerWhiteLightbulbAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
  } = require('./lightbulbs')(homebridge)

  const {
    Shelly1OutletAccessory,
    Shelly1PMOutletAccessory,
    Shelly2OutletAccessory,
    Shelly4ProOutletAccessory,
    ShellyEMOutletAccessory,
    ShellyHDOutletAccessory,
    ShellyPlugOutletAccessory,
  } = require('./outlets')(homebridge)

  const {
    ShellyHTAccessory,
    ShellyFloodAccessory,
    ShellySenseAccessory,
  } = require('./sensors')(homebridge)

  const {
    Shelly1PMSwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly2SwitchAccessory,
    Shelly4ProSwitchAccessory,
    ShellyEMSwitchAccessory,
    ShellyHDSwitchAccessory,
    ShellyPlugSwitchAccessory,
  } = require('./switches')(homebridge)

  const {
    Shelly2WindowCoveringAccessory,
  } = require('./window-coverings')(homebridge)

  return {
    Shelly1OutletAccessory,
    Shelly1PMOutletAccessory,
    Shelly1PMSwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly2OutletAccessory,
    Shelly2SwitchAccessory,
    Shelly2WindowCoveringAccessory,
    Shelly4ProOutletAccessory,
    Shelly4ProSwitchAccessory,
    ShellyBulbColorLightbulbAccessory,
    ShellyDimmerWhiteLightbulbAccessory,
    ShellyEMOutletAccessory,
    ShellyEMSwitchAccessory,
    ShellyFloodAccessory,
    ShellyHDOutletAccessory,
    ShellyHDSwitchAccessory,
    ShellyHTAccessory,
    ShellyPlugOutletAccessory,
    ShellyPlugSwitchAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
    ShellySenseAccessory,
  }
}
