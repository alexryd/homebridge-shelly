/* eslint-env mocha */

const shellies = require('shellies')
const should = require('should')
const sinon = require('sinon')

const Homebridge = require('./mocks/homebridge')
const log = require('./mocks/log')

const homebridge = new Homebridge()
const Accessory = homebridge.hap.Accessory
const Characteristic = homebridge.hap.Characteristic
const Service = homebridge.hap.Service

const { ConsumptionCharacteristic } = require('../characteristics')(homebridge)
const {
  ShellyAccessory,
  ShellyRelayAccessory,
  Shelly1RelayAccessory,
  Shelly2RelayAccessory,
  Shelly4ProRelayAccessory,
} = require('../accessories')(homebridge)

describe('ShellyAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')
    accessory = new ShellyAccessory(log, device)
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#constructor()', function() {
    it('should create a platform accessory when none is supplied', function() {
      const a = new ShellyAccessory(log, device)
      a.platformAccessory.should.be.ok()
    })

    it('should not create a platform access when one is supplied', function() {
      // eslint-disable-next-line new-cap
      const platformAccessory = new homebridge.platformAccessory()
      const a = new ShellyAccessory(log, device, platformAccessory)
      a.platformAccessory.should.equal(platformAccessory)
    })

    it('should set all additional properties', function() {
      const a = new ShellyAccessory(log, device, null, {
        foo: 'bar',
        bar: 'baz',
      })
      a.foo.should.equal('bar')
      a.bar.should.equal('baz')
    })

    it('should invoke updateSettings() and setupEventHandlers()', function() {
      const updateSettings = sinon.stub(
        ShellyAccessory.prototype,
        'updateSettings'
      )
      const setupEventHandlers = sinon.stub(
        ShellyAccessory.prototype,
        'setupEventHandlers'
      )
      new ShellyAccessory(log, device) // eslint-disable-line no-new

      updateSettings.calledOnce.should.be.true()
      setupEventHandlers.calledOnce.should.be.true()
    })
  })

  describe('#name', function() {
    it('should return the device name when one is set', function() {
      device.name = 'foo'
      accessory.name.should.equal(device.name)
    })

    it('should generate a proper name when no device name is set', function() {
      accessory.name.should.be.ok()
      accessory.name.indexOf(device.type).should.not.equal(-1)
      accessory.name.indexOf(device.id).should.not.equal(-1)
    })
  })

  describe('#createPlatformAccessory()', function() {
    it('should return a platform accessory', function() {
      accessory.createPlatformAccessory().should.be.instanceof(
        homebridge.platformAccessory
      )
    })

    it('should set manufacturer, model and serial number', function() {
      const pa = accessory.createPlatformAccessory()
      const ai = pa.getService(Service.AccessoryInformation)

      ai.getCharacteristic(Characteristic.Manufacturer).value.should.be.ok()
      ai.getCharacteristic(Characteristic.Model).value.should.be.ok()
      ai.getCharacteristic(Characteristic.SerialNumber).value.should.be.ok()
    })

    it('should store device info in the context', function() {
      const pa = accessory.createPlatformAccessory()
      pa.context.type.should.equal(device.type)
      pa.context.id.should.equal(device.id)
      pa.context.host.should.equal(device.host)
    })

    it(
      'should set the reachability based on whether the device is online',
      function() {
        device.online = false

        const pa = accessory.createPlatformAccessory()
        pa.reachability.should.be.false()
      }
    )
  })

  describe('#updateSettings()', function() {
    it('should do nothing when no settings are loaded', function() {
      device.settings = null
      accessory.updateSettings()

      should(
        accessory.platformAccessory
          .getService(Service.AccessoryInformation)
          .getCharacteristic(Characteristic.FirmwareRevision)
          .value
      ).not.be.ok()
    })

    it('should set the firmware revision', function() {
      device.settings = { fw: '20190103-091629/v1.4.4@165d718b' }
      accessory.updateSettings()

      should(
        accessory.platformAccessory
          .getService(Service.AccessoryInformation)
          .getCharacteristic(Characteristic.FirmwareRevision)
          .value
      ).equal('1.4.4')
    })

    it('should set the hardware revision', function() {
      device.settings = {
        hwinfo: {
          hw_revision: 'prod-2018-08',
        },
      }
      accessory.updateSettings()

      should(
        accessory.platformAccessory
          .getService(Service.AccessoryInformation)
          .getCharacteristic(Characteristic.HardwareRevision)
          .value
      ).equal(device.settings.hwinfo.hw_revision)
    })
  })

  describe('#setupEventHandlers()', function() {
    it('should invoke identify() on `identify` events', function() {
      const identify = sinon.stub(ShellyAccessory.prototype, 'identify')
      accessory.setupEventHandlers()
      accessory.platformAccessory.emit('identify', true, () => {})

      identify.calledOnce.should.be.true()
    })

    it('should update reachability when the device goes offline', function() {
      const updateReachability = sinon.stub(
        accessory.platformAccessory,
        'updateReachability'
      )

      device.online = true
      updateReachability.calledOnce.should.be.true()
      updateReachability.calledWith(true).should.be.true()

      device.online = false
      updateReachability.calledTwice.should.be.true()
      updateReachability.calledWith(false).should.be.true()
    })

    it(
      'should invoke updateSettings() when device settings change',
      function() {
        const updateSettings = sinon.stub(
          ShellyAccessory.prototype,
          'updateSettings'
        )
        accessory.setupEventHandlers()
        device.settings = {}

        updateSettings.calledOnce.should.be.true()
      }
    )
  })

  describe('#identify()', function() {
    it('should log a message', function() {
      const logStub = sinon.stub(log, 'log')
      accessory.identify(true, () => {})
      logStub.called.should.be.true()
    })

    it('should invoke the callback', function() {
      const callback = sinon.fake()
      accessory.identify(true, callback)
      callback.calledOnce.should.be.true()
      callback.calledWith().should.be.true()
    })
  })
})

describe('ShellyRelayAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-22', 'ABC123', '192.168.1.2')
    accessory = new ShellyRelayAccessory(log, device, 1, 1)
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#createPlatformAccessory()', function() {
    it('should set the correct category', function() {
      const pa = accessory.createPlatformAccessory()
      pa.category.should.equal(Accessory.Categories.SWITCH)
    })

    it('should add its index to the context', function() {
      const pa = accessory.createPlatformAccessory()
      pa.context.index.should.equal(accessory.index)
    })

    it('should add a switch service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.Switch).should.be.ok()
    })

    it('should set On to the relay state', function() {
      device['relay' + accessory.index] = true

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)
        .value
        .should.equal(device['relay' + accessory.index])
    })

    it('should set Consumption to the power meter value', function() {
      device['powerMeter' + accessory.powerMeterIndex] = 3.45

      const pa = accessory.createPlatformAccessory()
      let value = null

      for (let c of pa.getService(Service.Switch).characteristics.values()) {
        if (c.UUID === ConsumptionCharacteristic.UUID) {
          value = c.value
        }
      }

      value.should.equal(device['powerMeter' + accessory.powerMeterIndex])
    })

    it(
      'should not set Consumption for devices without power meters',
      function() {
        const a = new ShellyRelayAccessory(log, device, 0)
        const pa = a.createPlatformAccessory()
        let found = false

        for (let c of pa.getService(Service.Switch).characteristics.values()) {
          if (c.UUID === ConsumptionCharacteristic.UUID) {
            found = true
            break
          }
        }

        found.should.be.false()
      }
    )
  })

  describe('#setupEventHandlers()', function() {
    it('should set the relay state when On is set', function(done) {
      const setRelay = sinon.stub(device, 'setRelay').resolves()

      accessory.platformAccessory
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)
        .emit('set', true, e => {
          setRelay.calledOnce.should.be.true()
          setRelay.calledWith(accessory.index, true).should.be.true()
          should.not.exist(e)
          done()
        })
    })

    it('should handle errors when setting the relay state', function(done) {
      const error = new Error()
      const setRelay = sinon.stub(device, 'setRelay').rejects(error)

      accessory.platformAccessory
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)
        .emit('set', true, e => {
          setRelay.calledOnce.should.be.true()
          setRelay.calledWith(accessory.index, true).should.be.true()
          e.should.equal(error)
          done()
        })
    })

    it('should update On when the relay state is changed', function() {
      const on = accessory.platformAccessory
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)

      device['relay' + accessory.index] = true
      on.value.should.be.true()

      device['relay' + accessory.index] = false
      on.value.should.be.false()
    })

    it('should update Consumption when the power meter is changed', function() {
      const pa = accessory.platformAccessory
      let consumption = null

      for (let c of pa.getService(Service.Switch).characteristics.values()) {
        if (c.UUID === ConsumptionCharacteristic.UUID) {
          consumption = c
          break
        }
      }

      device['powerMeter' + accessory.powerMeterIndex] = 4.32
      consumption.value.should.equal(4.32)

      device['powerMeter' + accessory.powerMeterIndex] = 0
      consumption.value.should.equal(0)
    })
  })
})

describe('Shelly1RelayAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')
    accessory = new Shelly1RelayAccessory(log, device)
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
})

describe('Shelly2RelayAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2')
    accessory = new Shelly2RelayAccessory(log, device, 0)
  })

  describe('#name', function() {
    it('should return the device name when one is set', function() {
      device.name = 'foo'
      accessory.name.indexOf(device.name).should.not.equal(-1)
    })

    it('should generate a proper name when no device name is set', function() {
      accessory.name.should.be.ok()
      accessory.name.indexOf(device.id).should.not.equal(-1)
    })
  })
})

describe('Shelly4ProRelayAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-44', 'ABC123', '192.168.1.2')
    accessory = new Shelly4ProRelayAccessory(log, device, 0)
  })

  describe('#name', function() {
    it('should return the device name when one is set', function() {
      device.name = 'foo'
      accessory.name.indexOf(device.name).should.not.equal(-1)
    })

    it('should generate a proper name when no device name is set', function() {
      accessory.name.should.be.ok()
      accessory.name.indexOf(device.id).should.not.equal(-1)
    })
  })
})
