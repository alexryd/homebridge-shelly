module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const ThermostatAbility = require('../abilities/thermostat')(homebridge)
  const { ShellyRelayAccessory } = require('./base')(homebridge)

  class ShellyThermostatAccessory extends ShellyRelayAccessory {
    constructor(device, index, config, log) {
      super('thermostat', device, index, config, log)

      const humidityEnabled = index === 0 && config.humidity
      const heatingEnabled = config.heating || true
      const coolingEnabled = config.cooling || false
      const hysteresis = config.hysteresis || 0.5

      if (!heatingEnabled && !coolingEnabled) {
        throw new Error(`Invalid config, 
          either cooling or heating should be true`)
      }

      if (humidityEnabled && index !== 0) {
        throw new Error(`Invalid config, 
          humidity can only work with one DHT22 sensor connected`)
      }

      this.abilities.push(new ThermostatAbility(
        'relay0',
        'externalTemperature' + index,
        humidityEnabled ? 'externalHumidity' : null,
        heatingEnabled,
        coolingEnabled,
        this.getTemperatureSettings.bind(this),
        this.setAct.bind(this),
        this.setTemperature.bind(this),
        this.setUnit.bind(this),
        hysteresis
      ))
    }

    /**
     * Sets the relay to the new value.
     * @returns {Promise} A Promise that resolves when the state of the relay
     * has been updated.
     */
    getTemperatureSettings() {
      const settings = this.device.settings
      if (settings) {
        return this.device.settings.ext_temperature[`${this.index}`]
      }
      return null
    }

    /**
     * Sets the relay to the new value.
     * @returns {Promise} A Promise that resolves when
     * the external temperature action has been updated.
     */
    setAct(overAct, underAct) {
      return this.device.addon
        .setExternalTemperatureAct(this.index, overAct, underAct)
    }

    /**
     * Sets the relay to the new value.
     * @returns {Promise} A Promise that resolves when
     * the external temperature threshold has been updated.
     */
    setTemperature(overtemp, undertemp) {
      return this.device.addon
        .setExternalTemperatureThreshold(this.index, overtemp, undertemp)
    }

    /**
     * Sets the relay to the new value.
     * @returns {Promise} A Promise that resolves when the temperature unit
     * has been updated.
     */
    setUnit(fahrenheit) {
      return this.device.addon.setExternalSensorTemperatureUnit(fahrenheit)
    }

    get category() {
      return Accessory.Categories.THERMOSTAT
    }
  }

  return {
    ShellyThermostatAccessory,
  }
}
