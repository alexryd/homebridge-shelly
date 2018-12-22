
module.exports = homebridge => {
  const ShellyPlatform = require('./platform')(homebridge)

  homebridge.registerPlatform(
    'homebridge-shelly',
    'Shelly',
    ShellyPlatform,
    true
  )
}
