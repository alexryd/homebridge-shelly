const EventEmitter = require('events')

class Accessory {}
Accessory.Categories = {
  SWITCH: 'SWITCH'
}

class Characteristic {
  constructor(displayName, UUID, props) {
    this.displayName = displayName
    this.UUID = UUID
    this.props = props
    this.value = null
  }

  setProps(props) {
    this.props = props
  }

  getDefaultValue() {
    return 'default value'
  }
}

Characteristic.FirmwareRevision = 'FirmwareRevision'
Characteristic.HardwareRevision = 'HardwareRevision'
Characteristic.Manufacturer = 'Manufacturer'
Characteristic.Model = 'Model'
Characteristic.On = 'On'
Characteristic.SerialNumber = 'SerialNumber'

Characteristic.Formats = {
  FLOAT: 'FLOAT',
}

Characteristic.Perms = {
  NOTIFY: 'NOTIFY',
  READ: 'READ',
  WRITE: 'WRITE',
}

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
