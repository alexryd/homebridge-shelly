module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const { handleFailedRequest } = require('../util/error-handlers')
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service
  const Shelly1ExternalActionAct = {
    DISABLED: 'disabled',
    RELAY_ON: 'relay_on',
    RELAY_OFF: 'relay_off'
  }

  const Shelly1ExternalSensorsUnit = {
    CELCIUS: 'C',
    FAHRENHEIT: 'F'
  }

  class ThermostatAbility extends Ability {
    /**
    * @param {string} activeProperty - The device property
    * used to indicate if the relay is active.
    * @param {string} temperatureProperty - The property on the device
    * returning the temperature.
    * @param {string} humidityProperty - The property on the device
    * returning the humidity.
    * @param {boolean} heatingEnabled - Boolean to
    * enable heating on thermostat.
    * @param {boolean} coolingEnabled - Boolean to
    * enable cooling on thermostat.
    * @param {function} getTemperatureSettings - A function that returns
    * the settings of the temperature sensor. Must return a Promise.
    * @param {function} setAct - A function that updates
    * the device's acts.
    * @param {function} setTemperature - A function that updates
    * the device's target temperature.
    * @param {function} setUnit - A function that updates
    * the device's temperature unit.
    * @param {number} hysteresis - Number sets the hysteresis
    * which difference the thermostat should switch on/off relay.
    */
    constructor(activeProperty,
      temperatureProperty,
      humidityProperty,
      heatingEnabled,
      coolingEnabled,
      getTemperatureSettings,
      setAct,
      setTemperature,
      setUnit,
      hysteresis = 0.0) {
      super()
      const validOptions = [Characteristic.TargetHeatingCoolingState.OFF]
      if (heatingEnabled) {
        validOptions.push(Characteristic.TargetHeatingCoolingState.HEAT)
      }
      if (coolingEnabled) {
        validOptions.push(Characteristic.TargetHeatingCoolingState.COOL)
      }
      this._modes = validOptions
      this._activeProperty = activeProperty
      this._temperatureProperty = temperatureProperty
      this._humidityProperty = humidityProperty
      this._getTemperatureSettings = getTemperatureSettings
      this._setAct = setAct
      this._setTemperature = setTemperature
      this._setUnit = setUnit
      this._hysteresis = hysteresis
    }

    get service() {
      return this.platformAccessory.getService(Service.Thermostat)
    }

    get active() {
      return !!this.device[this._activeProperty]
    }

    get heatingCoolingState() {
      if (this.active) {
        const targetState = this.targetHeatingCoolingState
        switch (targetState) {
          case Characteristic.TargetHeatingCoolingState.HEAT:
            return Characteristic.CurrentHeatingCoolingState.HEAT
          case Characteristic.TargetHeatingCoolingState.COOL:
            return Characteristic.CurrentHeatingCoolingState.COOL
          default:
            return Characteristic.CurrentHeatingCoolingState.OFF
        }
      } else {
        return Characteristic.CurrentHeatingCoolingState.OFF
      }
    }

    get targetHeatingCoolingState() {
      const settings = this._getTemperatureSettings()
      if (!settings) {
        return Characteristic.TargetHeatingCoolingState.OFF
      }
      const overAct = settings.overtemp_act
      const underAct = settings.undertemp_act
      const coolState = Characteristic.TargetHeatingCoolingState.COOL
      if (overAct === this._overActForState(coolState) &&
        underAct === this._underActForState(coolState)) {
        return Characteristic.TargetHeatingCoolingState.COOL
      }
      const heatState = Characteristic.TargetHeatingCoolingState.HEAT
      if (overAct === this._overActForState(heatState) &&
        underAct === this._underActForState(heatState)) {
        return Characteristic.TargetHeatingCoolingState.HEAT
      }
      return Characteristic.TargetHeatingCoolingState.OFF
    }

    get temperature() {
      const value = this.device[this._temperatureProperty]
      return Math.min(Math.max(value, -270), 100)
    }

    get targetTemperature() {
      const settings = this._getTemperatureSettings()
      let value = this.temperature
      switch (this.targetHeatingCoolingState) {
        case Characteristic.TargetHeatingCoolingState.OFF:
          break
        case Characteristic.TargetHeatingCoolingState.HEAT:
          value = settings.overtemp_threshold_tC
          break
        case Characteristic.TargetHeatingCoolingState.COOL:
          value = settings.undertemp_threshold_tC
          break
      }
      return Math.min(Math.max(value, 10), 38)
    }

    get humidity() {
      const value = this.device[this._humidityProperty]
      return Math.min(Math.max(value, 0), 100)
    }

    get displayUnit() {
      const settings = this.device.settings
      if (!settings) {
        return Characteristic.TemperatureDisplayUnits.CELSIUS
      }
      const unit = this.device.settings.ext_sensors.temperature_unit
      const ceclius = unit === Shelly1ExternalSensorsUnit.CELCIUS
      return ceclius
        ? Characteristic.TemperatureDisplayUnits.CELSIUS
        : Characteristic.TemperatureDisplayUnits.FAHRENHEIT
    }

    _createService() {
      const service = new Service.Thermostat()

      service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .setProps({
          validValues: this._modes
        })
      service.setCharacteristic(Characteristic.CurrentHeatingCoolingState,
        this.heatingCoolingState)
      service.setCharacteristic(Characteristic.TargetHeatingCoolingState,
        this.targetHeatingCoolingState)
      service.setCharacteristic(Characteristic.CurrentTemperature,
        this.temperature)
      service.setCharacteristic(Characteristic.TargetTemperature,
        this.targetTemperature)

      if (this._humidityProperty) {
        service.setCharacteristic(Characteristic.CurrentRelativeHumidity,
          this.humidity)
      }
      return service
    }

    _setupEventHandlers() {
      super._setupEventHandlers()

      this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .on('set', this._targetHeatingCoolingSetHandler.bind(this))
      this.service.getCharacteristic(Characteristic.TargetTemperature)
        .on('set', this._targetTemperatureSetHandler.bind(this))
      this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .on('set', this._temperatureDisplayUnitSetHandler.bind(this))

      this.device.on(
        'change:settings',
        this._settingsChangedHandler,
        this)

      this.device.on(
        'change:' + this._activeProperty,
        this._activeChangeHandler,
        this
      )

      this.device.on(
        'change:' + this._temperatureProperty,
        this._temperatureChangeHandler,
        this
      )

      if (this._humidityProperty) {
        this.device.on(
          'change:' + this._humidityProperty,
          this._humidityChangeHandler,
          this
        )
      }
    }

    /**
     * Handles changes from the device to the temperature property.
     */
    _temperatureChangeHandler(newValue) {
      this.log.debug(
        this._temperatureProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setValue(this.temperature)
    }

    /**
     * Handles changes from the device to the humidity property.
     */
    _humidityChangeHandler(newValue) {
      this.log.debug(
        this._humidityProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .setValue(this.humidity)
    }

    /**
     * Handles changes from the device settings to the properties:
     * TargetHeatingCoolingState
     * TargetTemperature
     * TargetHumidity
     * TemperatureDisplayUnits
     */
    _settingsChangedHandler() {
      this.log.debug(
        'settings',
        'of device',
        this.device.type,
        this.device.id,
        'changed'
      )
      this.service
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .setValue(this.heatingCoolingState)
      this.service
        .getCharacteristic(Characteristic.TargetTemperature)
        .setValue(this.targetTemperature)
      this.service
        .getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .setValue(this.displayUnit)
    }

    _underActForState(state) {
      switch (state) {
        case Characteristic.TargetHeatingCoolingState.OFF:
          return Shelly1ExternalActionAct.DISABLED
        case Characteristic.TargetHeatingCoolingState.HEAT:
          return Shelly1ExternalActionAct.RELAY_ON
        case Characteristic.TargetHeatingCoolingState.COOL:
          return Shelly1ExternalActionAct.RELAY_OFF
      }
    }

    _overActForState(state) {
      switch (state) {
        case Characteristic.TargetHeatingCoolingState.OFF:
          return Shelly1ExternalActionAct.DISABLED
        case Characteristic.TargetHeatingCoolingState.HEAT:
          return Shelly1ExternalActionAct.RELAY_OFF
        case Characteristic.TargetHeatingCoolingState.COOL:
          return Shelly1ExternalActionAct.RELAY_ON
      }
    }

    /**
     * Handles changes from the device to the active property.
     */
    _activeChangeHandler(newValue) {
      this.log.debug(
        this._activeProperty,
        'of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.service
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .setValue(this.heatingCoolingState)
    }

    /**
     * Handles changes from HomeKit's TargetHeatingCoolingState characteristic.
     */
    async _targetHeatingCoolingSetHandler(newValue, callback) {
      const d = this.device
      const nv = newValue

      if (this.targetHeatingCoolingState === nv) {
        callback()
        return
      }

      try {
        this.log.debug(
          'Setting targetHeatingCooling',
          this._temperatureProperty,
          'of device',
          d.type,
          d.id,
          'to',
          nv
        )
        const overAct = this._overActForState(nv)
        const underAct = this._underActForState(nv)
        const temperature = this.targetTemperature
        await this._setAct(overAct, underAct)
        // Swap temperatures, target is swapped when hot/cold changes
        await this._setTemperatureForState(nv, temperature)
        callback()
        await this.reloadSettings()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          `Failed to set targetHeatingCooling#${this._temperatureProperty}`
        )
        callback(e)
      }
    }

    /**
     * Handles changes from HomeKit of the TargetTemperature characteristic.
     */
    async _targetTemperatureSetHandler(newValue, callback) {
      const d = this.device
      const nv = newValue

      if (this.targetTemperature === nv) {
        callback()
        return
      }

      try {
        this.log.debug(
          'Setting targetTemperature',
          this._temperatureProperty,
          'of device',
          d.type,
          d.id,
          'to',
          nv
        )
        await this._setTemperatureForState(this.targetHeatingCoolingState, nv)
        callback()
        await this.reloadSettings()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          `Failed to set targetTemperature#${this._temperatureProperty}`
        )
        callback(e)
      }
    }

    async _setTemperatureForState(state, newValue) {
      const heating = state === Characteristic.TargetHeatingCoolingState.HEAT ||
       state === Characteristic.TargetHeatingCoolingState.OFF
      const overtemp = heating ? newValue : newValue + this._hysteresis
      const undertemp = heating ? newValue - this._hysteresis : newValue
      await this._setTemperature(overtemp, undertemp)
    }

    /**
     * Handles changes from HomeKit's TemperatureDisplayUnits characteristic.
     */
    async _temperatureDisplayUnitSetHandler(newValue, callback) {
      const d = this.device
      const nv = newValue

      if (this.displayUnit === nv) {
        callback()
        return
      }

      try {
        this.log.debug(
          'Setting',
          'displayUnit',
          'of device',
          d.type,
          d.id,
          'to',
          nv
        )
        const f = nv === Characteristic.TemperatureDisplayUnits.FAHRENHEIT
        await this._setUnit(f)
        await this.reloadSettings()
        callback()
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          'Failed to set displayUnit'
        )
        callback(e)
      }
    }

    /**
     * Reloads the settings of the device.
     */
    async reloadSettings() {
      const d = this.device
      return d.getSettings()
        .then(settings => {
          d.settings = settings
        })
        .catch(error => {
          handleFailedRequest(
            this.platform.log,
            d,
            error,
            'Failed to load device settings'
          )
        })
    }

    detach() {
      this.device.removeListener(
        'change:settings',
        this._settingsChangedHandler,
        this
      )

      this.device.removeListener(
        'change:' + this._activeProperty,
        this._activeChangeHandler,
        this
      )

      this.device.removeListener(
        'change:' + this._temperatureProperty,
        this._temperatureChangeHandler,
        this
      )

      if (this._humidityChangeHandler) {
        this.device.removeListener(
          'change:' + this._humidityProperty,
          this._humidityChangeHandler,
          this
        )
      }

      super.detach()
    }
  }

  return ThermostatAbility
}
