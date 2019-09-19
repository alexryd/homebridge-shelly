
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service
  const ShellyAccessory = require('./base')(homebridge)

  const setBatteryLevel = (service, level) => {
    const SLB = Characteristic.StatusLowBattery
    const status = level < 10 ? SLB.BATTERY_LEVEL_LOW : SLB.BATTERY_LEVEL_NORMAL

    service
      .setCharacteristic(
        Characteristic.BatteryLevel,
        level
      )
      .setCharacteristic(SLB, status)

    return service
  }

  const setChargingState = (service, charging) => {
    const CS = Characteristic.ChargingState
    const state = charging ? CS.CHARGING : CS.NOT_CHARGING

    service.setCharacteristic(CS, state)

    return service
  }

  class ShellySensorAccessory extends ShellyAccessory {
    constructor(device, index, config, log, types, platformAccessory = null) {
      super('sensor', device, index, config, log, platformAccessory, {
        _types: new Set(types),
      })
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.SENSOR

      if (this._types.has('motion')) {
        pa.addService(
          new Service.MotionSensor()
            .setCharacteristic(
              Characteristic.MotionDetected,
              this.device.motion
            )
        )
      }

      if (this._types.has('flood')) {
        pa.addService(
          new Service.LeakSensor()
            .setCharacteristic(
              Characteristic.LeakDetected,
              this.device.flood
            )
        )
      }

      if (this._types.has('temperature')) {
        const temperatureSensor = new Service.TemperatureSensor()
        temperatureSensor
          .getCharacteristic(Characteristic.CurrentTemperature)
          .setProps({ minValue: -100 })
          .setValue(this.device.temperature)
        pa.addService(temperatureSensor)
      }

      if (this._types.has('humidity')) {
        pa.addService(
          new Service.HumiditySensor()
            .setCharacteristic(
              Characteristic.CurrentRelativeHumidity,
              this.device.humidity
            )
        )
      }

      if (this._types.has('illuminance')) {
        pa.addService(
          new Service.LightSensor()
            .setCharacteristic(
              Characteristic.CurrentAmbientLightLevel,
              this.device.illuminance
            )
        )
      }

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      const d = this.device

      if (this._types.has('motion')) {
        d.on('change:motion', this.motionChangeHandler, this)
      }
      if (this._types.has('flood')) {
        d.on('change:flood', this.floodChangeHandler, this)
      }
      if (this._types.has('temperature')) {
        d.on('change:temperature', this.temperatureChangeHandler, this)
      }
      if (this._types.has('humidity')) {
        d.on('change:humidity', this.humidityChangeHandler, this)
      }
      if (this._types.has('illuminance')) {
        d.on('change:illuminance', this.illuminanceChangeHandler, this)
      }
    }

    motionChangeHandler(newValue) {
      this.log.debug(
        'Motion sensor on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.MotionSensor)
        .getCharacteristic(Characteristic.MotionDetected)
        .setValue(newValue)
    }

    floodChangeHandler(newValue) {
      this.log.debug(
        'Flood sensor on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.LeakSensor)
        .getCharacteristic(Characteristic.LeakDetected)
        .setValue(newValue)
    }

    temperatureChangeHandler(newValue) {
      this.log.debug(
        'Temperature sensor on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        'degrees C'
      )

      this.platformAccessory
        .getService(Service.TemperatureSensor)
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setValue(newValue)
    }

    humidityChangeHandler(newValue) {
      this.log.debug(
        'Humidity sensor on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        '%'
      )

      this.platformAccessory
        .getService(Service.HumiditySensor)
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .setValue(newValue)
    }

    illuminanceChangeHandler(newValue) {
      this.log.debug(
        'Light sensor on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        'lux'
      )

      this.platformAccessory
        .getService(Service.LightSensor)
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .setValue(newValue)
    }

    detach() {
      super.detach()

      this.device
        .removeListener('change:motion', this.motionChangeHandler, this)
        .removeListener('change:flood', this.floodChangeHandler, this)
        .removeListener(
          'change:temperature',
          this.temperatureChangeHandler,
          this
        )
        .removeListener('change:humidity', this.humidityChangeHandler, this)
        .removeListener(
          'change:illuminance',
          this.illuminanceChangeHandler,
          this
        )
    }
  }

  class ShellyHTAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(
        device,
        index,
        config,
        log,
        ['temperature', 'humidity'],
        platformAccessory
      )
    }

    get name() {
      const d = this.device
      const c = this.config
      if (c.name) {
        return c.name
      }
      return d.name || `Shelly H&T ${d.id}`
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.addService(
        setBatteryLevel(
          new Service.BatteryService().setCharacteristic(
            Characteristic.ChargingState,
            Characteristic.ChargingState.NOT_CHARGEABLE
          ),
          this.device.battery
        )
      )

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      this.device.on('change:battery', this.batteryChangeHandler, this)
    }

    batteryChangeHandler(newValue) {
      this.log.debug(
        'Battery level for device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        '%'
      )

      setBatteryLevel(
        this.platformAccessory.getService(Service.BatteryService),
        newValue
      )
    }

    detach() {
      super.detach()

      this.device.removeListener(
        'change:battery',
        this.batteryChangeHandler,
        this
      )
    }
  }

  class ShellyFloodAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(
        device,
        index,
        config,
        log,
        ['flood', 'temperature'],
        platformAccessory
      )
    }

    get name() {
      const d = this.device
      return d.name || `Shelly Flood ${d.id}`
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.addService(
        setBatteryLevel(
          new Service.BatteryService().setCharacteristic(
            Characteristic.ChargingState,
            Characteristic.ChargingState.NOT_CHARGEABLE
          ),
          this.device.battery
        )
      )

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      this.device.on('change:battery', this.batteryChangeHandler, this)
    }

    batteryChangeHandler(newValue) {
      this.log.debug(
        'Battery level for device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        '%'
      )

      setBatteryLevel(
        this.platformAccessory.getService(Service.BatteryService),
        newValue
      )
    }

    detach() {
      super.detach()

      this.device.removeListener(
        'change:battery',
        this.batteryChangeHandler,
        this
      )
    }
  }

  class ShellySenseAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(
        device,
        index,
        config,
        log,
        ['motion', 'temperature', 'humidity', 'illuminance'],
        platformAccessory
      )
    }

    get name() {
      const d = this.device
      return d.name || `Shelly Sense ${d.id}`
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.addService(
        setBatteryLevel(
          setChargingState(
            new Service.BatteryService(),
            this.device.charging
          ),
          this.device.battery
        )
      )

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      this.device
        .on('change:charging', this.chargingChangeHandler, this)
        .on('change:battery', this.batteryChangeHandler, this)
    }

    chargingChangeHandler(newValue) {
      this.log.debug(
        'Charging state for device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      setChargingState(
        this.platformAccessory.getService(Service.BatteryService),
        newValue
      )
    }

    batteryChangeHandler(newValue) {
      this.log.debug(
        'Battery level for device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue,
        '%'
      )

      setBatteryLevel(
        this.platformAccessory.getService(Service.BatteryService),
        newValue
      )
    }

    detach() {
      super.detach()

      this.device
        .removeListener(
          'change:charging',
          this.chargingChangeHandler,
          this
        )
        .removeListener(
          'change:battery',
          this.batteryChangeHandler,
          this
        )
    }
  }

  return {
    ShellySensorAccessory,
    ShellyHTAccessory,
    ShellyFloodAccessory,
    ShellySenseAccessory,
  }
}
