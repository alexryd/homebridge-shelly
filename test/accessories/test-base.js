/* eslint-env mocha */

const shellies = require('shellies')
const should = require('should')
const sinon = require('sinon')

const Homebridge = require('../mocks/homebridge')
const log = require('../mocks/log')

const homebridge = new Homebridge()
const Characteristic = homebridge.hap.Characteristic
const Service = homebridge.hap.Service

const ShellyAccessory = require('../../accessories/base')(homebridge)

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

  describe('#updateReachability()', function() {
    it('should update the reachability of the platform accessory', function() {
      const updateReachability = sinon.stub(
        accessory.platformAccessory,
        'updateReachability'
      )
      accessory.updateReachability()
      updateReachability.calledOnce.should.be.true()
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

  describe('#detach', function() {
    it('should remove all event listeners from the device', function() {
      device.eventNames().length.should.not.equal(0)
      accessory.detach()
      device.eventNames().length.should.equal(0)
    })
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
