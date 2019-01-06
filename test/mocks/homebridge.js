const EventEmitter = require('events')

class Accessory {}
Accessory.Categories = {
  SWITCH: 'SWITCH'
}

class Characteristic {}
Characteristic.FirmwareRevision = 'FirmwareRevision'
Characteristic.HardwareRevision = 'HardwareRevision'
Characteristic.Manufacturer = 'Manufacturer'
Characteristic.Model = 'Model'
Characteristic.On = 'On'
Characteristic.SerialNumber = 'SerialNumber'

class PlatformAccessory {}

class Service {}
Service.AccessoryInformation = 'AccessoryInformation'

class SwitchService extends Service {}
Service.SwitchService = SwitchService

class Homebridge extends EventEmitter {
  constructor() {
    super()

    this.hap = {
      Accessory,
      Characteristic,
      Service,
      uuid: {
        generate: () => {},
      },
    }

    this.platformAccessory = PlatformAccessory
  }

  registerPlatform() {}
  registerPlatformAccessories() {}
}

module.exports = Homebridge
