/* eslint-env mocha */

require('should')

const shellies = require('shellies')
const sinon = require('sinon')

const Homebridge = require('./mocks/homebridge')
const log = require('./mocks/log')

const homebridge = new Homebridge()
const ShellyPlatform = require('../platform')(homebridge)

describe('ShellyPlatform', function() {
  let platform = null
  let start = null

  beforeEach(function() {
    platform = new ShellyPlatform(log, {})
    start = sinon.stub(shellies, 'start')
  })

  afterEach(function() {
    sinon.restore()
    shellies.removeAllListeners()
    shellies.removeAllDevices()
    homebridge.removeAllListeners()
  })

  describe('#constructor()', function() {
    it(
      'should invoke setAuthCredentials() when credentials are given',
      function() {
        const setAuthCredentials = sinon.stub(shellies, 'setAuthCredentials')

        new ShellyPlatform(log, { // eslint-disable-line no-new
          username: 'foo',
          password: 'bar',
        })

        setAuthCredentials.calledOnce.should.be.true()
        setAuthCredentials.calledWith('foo', 'bar').should.be.true()
      }
    )

    it('should set the request timeout when given', function() {
      const timeout = sinon.stub(shellies.request, 'timeout')

      new ShellyPlatform(log, { // eslint-disable-line no-new
        requestTimeout: 1000,
      })

      timeout.calledOnce.should.be.true()
      timeout.calledWith(1000).should.be.true()
    })

    it('should set the stale timeout when given', function() {
      new ShellyPlatform(log, { // eslint-disable-line no-new
        staleTimeout: 1000,
      })

      shellies.staleTimeout.should.equal(1000)
    })

    it(
      'should invoke discoverDeviceHandler() when `discover` is emitted',
      function() {
        const handler = sinon.stub(
          ShellyPlatform.prototype,
          'discoverDeviceHandler'
        )
        const device = { type: 'UNKNOWN' }

        new ShellyPlatform(log, {}) // eslint-disable-line no-new
        shellies.emit('discover', device)

        handler.calledOnce.should.be.true()
        handler.calledWith(device).should.be.true()
      }
    )

    it(
      'should invoke start() when `didFinishLaunching` is emitted',
      function() {
        new ShellyPlatform(log, {}) // eslint-disable-line no-new
        homebridge.emit('didFinishLaunching')

        start.called.should.be.true()
      }
    )
  })

  describe('#discoverDeviceHandler()', function() {
    let registerPlatformAccessories = null

    beforeEach(function() {
      registerPlatformAccessories = sinon.stub(
        homebridge,
        'registerPlatformAccessories'
      )
    })

    it('should do nothing with unknown devices', function() {
      platform.discoverDeviceHandler({ type: 'UNKNOWN' })
      registerPlatformAccessories.called.should.be.false()
    })

    it('should register 1 accessory for Shelly1 devices', function() {
      platform.discoverDeviceHandler(
        shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')
      )

      platform.deviceWrappers.size.should.equal(1)
      registerPlatformAccessories.calledOnce.should.be.true()
      registerPlatformAccessories.firstCall.args[2][0]
        .should.be.instanceof(homebridge.platformAccessory)
    })

    it('should register 2 accessories for Shelly2 devices', function() {
      platform.discoverDeviceHandler(
        shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2')
      )

      platform.deviceWrappers.size.should.equal(1)
      registerPlatformAccessories.calledOnce.should.be.true()
      registerPlatformAccessories.firstCall.args[2].length.should.equal(2)

      for (const pa of registerPlatformAccessories.firstCall.args[2]) {
        pa.should.be.instanceof(homebridge.platformAccessory)
      }
    })

    it('should register 4 accessories for Shelly4Pro devices', function() {
      platform.discoverDeviceHandler(
        shellies.createDevice('SHSW-44', 'ABC123', '192.168.1.2')
      )

      platform.deviceWrappers.size.should.equal(1)
      registerPlatformAccessories.calledOnce.should.be.true()
      registerPlatformAccessories.firstCall.args[2].length.should.equal(4)

      for (const pa of registerPlatformAccessories.firstCall.args[2]) {
        pa.should.be.instanceof(homebridge.platformAccessory)
      }
    })
  })

  describe('#configureAccessory()', function() {
    let platformAccessory = null

    beforeEach(function() {
      // eslint-disable-next-line new-cap
      platformAccessory = new homebridge.platformAccessory('Testing', 'Testing')
      platformAccessory.context = {
        type: 'SHSW-1',
        id: 'ABC123',
        host: '192.168.1.2',
      }
      platformAccessory.addService(new homebridge.hap.Service.Switch())
    })

    it('should create a new device when needed', function() {
      platform.configureAccessory(platformAccessory)
      shellies.size.should.equal(1)
    })

    it('should reuse existing devices', function() {
      shellies.addDevice(
        shellies.createDevice(
          platformAccessory.context.type,
          platformAccessory.context.id,
          platformAccessory.context.host
        )
      )

      platform.configureAccessory(platformAccessory)
      shellies.size.should.equal(1)
    })

    it('should create a new device wrapper when needed', function() {
      platform.configureAccessory(platformAccessory)
      platform.deviceWrappers.size.should.equal(1)
    })

    it('should reuse existing device wrappers', function() {
      const device = shellies.createDevice(
        platformAccessory.context.type,
        platformAccessory.context.id,
        platformAccessory.context.host
      )

      shellies.addDevice(device)
      platform.deviceWrappers.set(
        device,
        new ShellyPlatform.DeviceWrapper(platform, device)
      )

      platform.configureAccessory(platformAccessory)

      platform.deviceWrappers.size.should.equal(1)
    })

    it('should create accessories for Shelly1 devices', function() {
      platformAccessory.context.type = 'SHSW-1'
      platform.configureAccessory(platformAccessory)

      const deviceWrapper = platform.deviceWrappers.values().next().value

      deviceWrapper.device.type.should.equal('SHSW-1')
      deviceWrapper.accessories.length.should.equal(1)
      deviceWrapper.accessories[0]
        .should.be.instanceof(ShellyPlatform.Shelly1RelayAccessory)
    })

    it('should create accessories for Shelly2 devices', function() {
      platformAccessory.context.type = 'SHSW-21'
      platformAccessory.context.index = 0
      platform.configureAccessory(platformAccessory)

      const deviceWrapper = platform.deviceWrappers.values().next().value

      deviceWrapper.device.type.should.equal('SHSW-21')
      deviceWrapper.accessories.length.should.equal(1)
      deviceWrapper.accessories[0]
        .should.be.instanceof(ShellyPlatform.Shelly2RelayAccessory)
    })

    it('should create accessories for Shelly4Pro devices', function() {
      platformAccessory.context.type = 'SHSW-44'
      platformAccessory.context.index = 0
      platform.configureAccessory(platformAccessory)

      const deviceWrapper = platform.deviceWrappers.values().next().value

      deviceWrapper.device.type.should.equal('SHSW-44')
      deviceWrapper.accessories.length.should.equal(1)
      deviceWrapper.accessories[0]
        .should.be.instanceof(ShellyPlatform.Shelly4ProRelayAccessory)
    })
  })
})
