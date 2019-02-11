
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

  class ShellyHTAccessory extends ShellyAccessory {
    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.SENSOR

      const temperatureSensor = new Service.TemperatureSensor()
      temperatureSensor
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ minValue: -100 })
        .setValue(this.device.temperature)
      pa.addService(temperatureSensor)

      pa.addService(
        new Service.HumiditySensor()
          .setCharacteristic(
            Characteristic.CurrentRelativeHumidity,
            this.device.humidity
          )
      )

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

      this.device
        .on('change:temperature', this.temperatureChangeHandler, this)
        .on('change:humidity', this.humidityChangeHandler, this)
        .on('change:battery', this.batteryChangeHandler, this)
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
          'change:temperature',
          this.temperatureChangeHandler,
          this
        )
        .removeListener('change:humidity', this.humidityChangeHandler, this)
        .removeListener('change:battery', this.batteryChangeHandler, this)
    }
  }

  return {
    ShellyHTAccessory,
  }
}
