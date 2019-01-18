const EventEmitter = require('events')

class Accessory {}
Accessory.Categories = {
  SWITCH: 'SWITCH',
  WINDOW_COVERING: 'WINDOW_COVERING',
}

class Characteristic extends EventEmitter {
  constructor(displayName, UUID, props) {
    super()

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

  setValue(value) {
    this.value = value
    this.emit('change', value)
  }
}

class CurrentPosition extends Characteristic {
  constructor() {
    super('CurrentPosition', 'CurrentPosition')
  }
}
Characteristic.CurrentPosition = CurrentPosition

class FirmwareRevision extends Characteristic {
  constructor() {
    super('FirmwareRevision', 'FirmwareRevision')
  }
}
Characteristic.FirmwareRevision = FirmwareRevision

class HardwareRevision extends Characteristic {
  constructor() {
    super('HardwareRevision', 'HardwareRevision')
  }
}
Characteristic.HardwareRevision = HardwareRevision

class Manufacturer extends Characteristic {
  constructor() {
    super('Manufacturer', 'Manufacturer')
  }
}
Characteristic.Manufacturer = Manufacturer

class Model extends Characteristic {
  constructor() {
    super('Model', 'Model')
  }
}
Characteristic.Model = Model

class On extends Characteristic {
  constructor() {
    super('On', 'On')
  }
}
Characteristic.On = On

class PositionState extends Characteristic {
  constructor() {
    super('PositionState', 'PositionState')
  }
}
PositionState.STOPPED = 0
PositionState.INCREASING = 1
PositionState.DECREASING = 2
Characteristic.PositionState = PositionState

class SerialNumber extends Characteristic {
  constructor() {
    super('SerialNumber', 'SerialNumber')
  }
}
Characteristic.SerialNumber = SerialNumber

class TargetPosition extends Characteristic {
  constructor() {
    super('TargetPosition', 'TargetPosition')
  }
}
Characteristic.TargetPosition = TargetPosition

Characteristic.Formats = {
  FLOAT: 'FLOAT',
}

Characteristic.Perms = {
  NOTIFY: 'NOTIFY',
  READ: 'READ',
  WRITE: 'WRITE',
}

class PlatformAccessory extends EventEmitter {
  constructor(displayName, UUID) {
    super()

    this.displayName = displayName
    this.UUID = UUID
    this.services = new Map()
    this.reachability = false

    this.addService(new Service.AccessoryInformation())
  }

  getService(name) {
    return this.services.get(name)
  }

  addService(service) {
    this.services.set(service.constructor, service)
  }

  updateReachability(value) {
    this.reachability = value
  }
}

class Service {
  constructor() {
    this.characteristics = new Map()
  }

  getCharacteristic(name) {
    return this.characteristics.get(name)
  }

  addCharacteristic(characteristic) {
    let c = characteristic
    if (typeof c === 'function') {
      c = new characteristic() // eslint-disable-line new-cap
    }

    this.characteristics.set(c.constructor, c)
    return c
  }

  setCharacteristic(name, value) {
    this.characteristics.get(name).setValue(value)
    return this
  }
}

class AccessoryInformation extends Service {
  constructor() {
    super()

    this.addCharacteristic(Manufacturer)
    this.addCharacteristic(Model)
    this.addCharacteristic(SerialNumber)
    this.addCharacteristic(FirmwareRevision)
    this.addCharacteristic(HardwareRevision)
  }
}
Service.AccessoryInformation = AccessoryInformation

class Switch extends Service {
  constructor() {
    super()

    this.addCharacteristic(On)
  }
}
Service.Switch = Switch

class WindowCovering extends Service {
  constructor() {
    super()

    this.addCharacteristic(CurrentPosition)
    this.addCharacteristic(PositionState)
    this.addCharacteristic(TargetPosition)
  }
}
Service.WindowCovering = WindowCovering

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
  updatePlatformAccessories() {}
  unregisterPlatformAccessories() {}
}

module.exports = Homebridge
