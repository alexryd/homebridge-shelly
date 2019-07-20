/* eslint-env mocha */

const shellies = require('shellies')
const sinon = require('sinon')

const Homebridge = require('../mocks/homebridge')
const log = require('../mocks/log')

const homebridge = new Homebridge()
const Accessory = homebridge.hap.Accessory
const Characteristic = homebridge.hap.Characteristic
const Service = homebridge.hap.Service

const {
  ShellySensorAccessory,
  ShellyHTAccessory,
  ShellySenseAccessory,
} = require('../../accessories/sensors')(homebridge)

describe('ShellySensorAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSEN-1', 'ABC123', '192.168.1.2')
    accessory = new ShellySensorAccessory(
      device,
      0,
      {},
      log,
      ['motion', 'temperature', 'humidity', 'illuminance']
    )
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#createPlatformAccessory()', function() {
    it('should set the correct category', function() {
      const pa = accessory.createPlatformAccessory()
      pa.category.should.equal(Accessory.Categories.SENSOR)
    })

    it('should add a motion sensor service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.MotionSensor).should.be.ok()
    })

    it(
      'should set current motion state to the device motion state',
      function() {
        device.motion = true

        const pa = accessory.createPlatformAccessory()
        pa
          .getService(Service.MotionSensor)
          .getCharacteristic(Characteristic.MotionDetected)
          .value
          .should.equal(device.motion)
      }
    )

    it('should add a temperature sensor service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.TemperatureSensor).should.be.ok()
    })

    it('should set current temperate to the device temperature', function() {
      device.temperature = 25.8

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.TemperatureSensor)
        .getCharacteristic(Characteristic.CurrentTemperature)
        .value
        .should.equal(device.temperature)
    })

    it('should add a humidity sensor service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.HumiditySensor).should.be.ok()
    })

    it('should set current humidity to the device humidity', function() {
      device.humidity = 37

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.HumiditySensor)
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .value
        .should.equal(device.humidity)
    })

    it('should add a light sensor service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.LightSensor).should.be.ok()
    })

    it('should set current light level to the device light level', function() {
      device.illuminance = 436.2

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.LightSensor)
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .value
        .should.equal(device.illuminance)
    })
  })

  describe('#setupEventHandlers()', function() {
    it(
      'should invoke motionChangeHandler() when motion changes',
      function() {
        const handler = sinon.stub(
          ShellySensorAccessory.prototype,
          'motionChangeHandler'
        )
        accessory.setupEventHandlers()
        device.motion = true
        handler.calledOnce.should.be.true()
      }
    )

    it(
      'should invoke temperatureChangeHandler() when temperature changes',
      function() {
        const handler = sinon.stub(
          ShellySensorAccessory.prototype,
          'temperatureChangeHandler'
        )
        accessory.setupEventHandlers()
        device.temperature = 22.7
        handler.calledOnce.should.be.true()
      }
    )

    it(
      'should invoke humidityChangeHandler() when humidity changes',
      function() {
        const handler = sinon.stub(
          ShellySensorAccessory.prototype,
          'humidityChangeHandler'
        )
        accessory.setupEventHandlers()
        device.humidity = 42
        handler.calledOnce.should.be.true()
      }
    )

    it(
      'should invoke illuminanceChangeHandler() when illuminance changes',
      function() {
        const handler = sinon.stub(
          ShellySensorAccessory.prototype,
          'illuminanceChangeHandler'
        )
        accessory.setupEventHandlers()
        device.illuminance = 108.9
        handler.calledOnce.should.be.true()
      }
    )
  })

  describe('#motionChangeHandler()', function() {
    it('should update MotionDetected when motion changes', function() {
      const motionDetected = accessory.platformAccessory
        .getService(Service.MotionSensor)
        .getCharacteristic(Characteristic.MotionDetected)

      device.motion = true
      motionDetected.value.should.equal(true)

      device.motion = false
      motionDetected.value.should.equal(false)
    })
  })

  describe('#temperatureChangeHandler()', function() {
    it('should update CurrentTemperature when temperature changes', function() {
      const currentTemperature = accessory.platformAccessory
        .getService(Service.TemperatureSensor)
        .getCharacteristic(Characteristic.CurrentTemperature)

      device.temperature = 18.7
      currentTemperature.value.should.equal(18.7)

      device.temperature = 12.4
      currentTemperature.value.should.equal(12.4)
    })
  })

  describe('#humidityChangeHandler()', function() {
    it(
      'should update CurrentRelativeHumidity when humidity changes',
      function() {
        const currentRelativeHumidity = accessory.platformAccessory
          .getService(Service.HumiditySensor)
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)

        device.humidity = 12
        currentRelativeHumidity.value.should.equal(12)

        device.humidity = 18
        currentRelativeHumidity.value.should.equal(18)
      }
    )
  })

  describe('#illuminanceChangeHandler()', function() {
    it(
      'should update CurrentAmbientLightLevel when illuminance changes',
      function() {
        const currentAmbientLightLevel = accessory.platformAccessory
          .getService(Service.LightSensor)
          .getCharacteristic(Characteristic.CurrentAmbientLightLevel)

        device.illuminance = 297
        currentAmbientLightLevel.value.should.equal(297)

        device.illuminance = 809
        currentAmbientLightLevel.value.should.equal(809)
      }
    )
  })

  describe('#detach()', function() {
    it('should remove all event listeners from the device', function() {
      device.eventNames().length.should.not.equal(0)
      accessory.detach()
      device.eventNames().length.should.equal(0)
    })
  })
})

describe('ShellyHTAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHHT-1', 'ABC123', '192.168.1.2')
    accessory = new ShellyHTAccessory(device, 0, {}, log)
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#name', function() {
    it('should return the device name when one is set', function() {
      device.name = 'foo'
      accessory.name.should.equal(device.name)
    })

    it('should generate a proper name when no device name is set', function() {
      accessory.name.should.be.ok()
      accessory.name.indexOf(device.id).should.not.equal(-1)
    })
  })

  describe('#createPlatformAccessory()', function() {
    it('should add a battery service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.BatteryService).should.be.ok()
    })

    it('should set the battery level and status', function() {
      device.battery = 8

      const pa = accessory.createPlatformAccessory()
      const bs = pa.getService(Service.BatteryService)

      bs.getCharacteristic(Characteristic.BatteryLevel).value
        .should.equal(device.battery)
      bs.getCharacteristic(Characteristic.StatusLowBattery).value
        .should.equal(Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW)
    })
  })

  describe('#setupEventHandlers()', function() {
    it(
      'should invoke batteryChangeHandler() when battery changes',
      function() {
        const handler = sinon.stub(
          ShellyHTAccessory.prototype,
          'batteryChangeHandler'
        )
        accessory.setupEventHandlers()
        device.battery = 98
        handler.calledOnce.should.be.true()
      }
    )
  })

  describe('#batteryChangeHandler()', function() {
    it('should update BatteryLevel when battery changes', function() {
      const batteryService = accessory.platformAccessory
        .getService(Service.BatteryService)
      const batteryLevel = batteryService
        .getCharacteristic(Characteristic.BatteryLevel)
      const statusLowBattery = batteryService
        .getCharacteristic(Characteristic.StatusLowBattery)

      device.battery = 18
      batteryLevel.value.should.equal(18)
      statusLowBattery.value
        .should.equal(Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL)

      device.battery = 8
      batteryLevel.value.should.equal(8)
      statusLowBattery.value
        .should.equal(Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW)
    })
  })

  describe('#detach()', function() {
    it('should remove all event listeners from the device', function() {
      device.eventNames().length.should.not.equal(0)
      accessory.detach()
      device.eventNames().length.should.equal(0)
    })
  })
})

describe('ShellySenseAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSEN-1', 'ABC123', '192.168.1.2')
    accessory = new ShellySenseAccessory(device, 0, {}, log)
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#name', function() {
    it('should return the device name when one is set', function() {
      device.name = 'foo'
      accessory.name.should.equal(device.name)
    })

    it('should generate a proper name when no device name is set', function() {
      accessory.name.should.be.ok()
      accessory.name.indexOf(device.id).should.not.equal(-1)
    })
  })

  describe('#createPlatformAccessory()', function() {
    it('should add a battery service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.BatteryService).should.be.ok()
    })

    it('should set the battery level and status', function() {
      device.battery = 7

      const pa = accessory.createPlatformAccessory()
      const bs = pa.getService(Service.BatteryService)

      bs.getCharacteristic(Characteristic.BatteryLevel).value
        .should.equal(device.battery)
      bs.getCharacteristic(Characteristic.StatusLowBattery).value
        .should.equal(Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW)
    })

    it('should set charging state to the device charging state', function() {
      device.charging = true

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.BatteryService)
        .getCharacteristic(Characteristic.ChargingState)
        .value
        .should.equal(Characteristic.ChargingState.CHARGING)
    })
  })

  describe('#setupEventHandlers()', function() {
    it(
      'should invoke batteryChangeHandler() when battery changes',
      function() {
        const handler = sinon.stub(
          ShellySenseAccessory.prototype,
          'batteryChangeHandler'
        )
        accessory.setupEventHandlers()
        device.battery = 97
        handler.calledOnce.should.be.true()
      }
    )

    it(
      'should invoke chargingChangeHandler() when charging changes',
      function() {
        const handler = sinon.stub(
          ShellySenseAccessory.prototype,
          'chargingChangeHandler'
        )
        accessory.setupEventHandlers()
        device.charging = true
        handler.calledOnce.should.be.true()
      }
    )
  })

  describe('#batteryChangeHandler()', function() {
    it('should update BatteryLevel when battery changes', function() {
      const batteryService = accessory.platformAccessory
        .getService(Service.BatteryService)
      const batteryLevel = batteryService
        .getCharacteristic(Characteristic.BatteryLevel)
      const statusLowBattery = batteryService
        .getCharacteristic(Characteristic.StatusLowBattery)

      device.battery = 17
      batteryLevel.value.should.equal(17)
      statusLowBattery.value
        .should.equal(Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL)

      device.battery = 7
      batteryLevel.value.should.equal(7)
      statusLowBattery.value
        .should.equal(Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW)
    })
  })

  describe('#chargingChangeHandler()', function() {
    it('should update ChargingState when charging changes', function() {
      const chargingState = accessory.platformAccessory
        .getService(Service.BatteryService)
        .getCharacteristic(Characteristic.ChargingState)

      device.charging = true
      chargingState.value.should.equal(Characteristic.ChargingState.CHARGING)

      device.charging = false
      chargingState.value
        .should.equal(Characteristic.ChargingState.NOT_CHARGING)
    })
  })

  describe('#detach()', function() {
    it('should remove all event listeners from the device', function() {
      device.eventNames().length.should.not.equal(0)
      accessory.detach()
      device.eventNames().length.should.equal(0)
    })
  })
})
