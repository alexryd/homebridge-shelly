
module.exports = homebridge => {
  const Service = homebridge.hap.Service
  const Characteristic = homebridge.hap.Characteristic

  class ShellyAccessory {
    constructor(log) {
      this.log = log
      this.id = '123456'
      this.name = 'Shelly Accessory'
    }

    identify() {
      this.log('Shelly device identified')
    }

    getServices() {
      const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'Shelly')
        .setCharacteristic(Characteristic.Model, '1')
        .setCharacteristic(Characteristic.SerialNumber, '123456')

      const switchService = new Service.Switch()
        .setCharacteristic(Characteristic.On, true)

      return [informationService, switchService]
    }
  }

  class ShellyPlatform {
    constructor(log, config) {
      this.log = log
      this.config = config
    }

    accessories(callback) {
      callback([new ShellyAccessory(this.log)])
    }
  }

  homebridge.registerPlatform('homebridge-shelly', 'Shelly', ShellyPlatform)
}
