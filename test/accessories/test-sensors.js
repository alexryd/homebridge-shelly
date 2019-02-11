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
  ShellyHTAccessory,
} = require('../../accessories/sensors')(homebridge)

describe('ShellyHTAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHHT-1', 'ABC123', '192.168.1.2')
    accessory = new ShellyHTAccessory(log, device)
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#createPlatformAccessory()', function() {
    it('should set the correct category', function() {
      const pa = accessory.createPlatformAccessory()
      pa.category.should.equal(Accessory.Categories.SENSOR)
    })

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

    it('should add a battery service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.HumiditySensor).should.be.ok()
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
      'should invoke temperatureChangeHandler() when temperature changes',
      function() {
        const handler = sinon.stub(
          ShellyHTAccessory.prototype,
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
          ShellyHTAccessory.prototype,
          'humidityChangeHandler'
        )
        accessory.setupEventHandlers()
        device.humidity = 42
        handler.calledOnce.should.be.true()
      }
    )

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
