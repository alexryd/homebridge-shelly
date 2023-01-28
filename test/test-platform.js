/* eslint-env mocha */

const os = require('os')
const shellies = require('@tritter/shellies')
const should = require('should')
const sinon = require('sinon')

const Homebridge = require('./mocks/homebridge')
const log = require('./mocks/log')

const homebridge = new Homebridge()

const AccessoryFactory = require('../accessories/factory')(homebridge)
const DeviceWrapper = require('../device-wrapper')(homebridge)
const ShellyPlatform = require('../platform')(homebridge)

describe('ShellyPlatform', function() {
  let platform = null
  let start = null

  beforeEach(function() {
    platform = new ShellyPlatform(log, { admin: { enabled: false } })
    start = sinon.stub(shellies, 'start')
  })

  afterEach(function() {
    sinon.restore()
    shellies.removeAllListeners()
    shellies.removeAllDevices()
    homebridge.removeAllListeners()
  })

  describe('#constructor()', function() {
    it('should not throw when no config is given', function() {
      should(() => new ShellyPlatform(log)).not.throw()
    })

    it('should invoke configure()', function() {
      const configure = sinon.stub(
        ShellyPlatform.prototype,
        'configure'
      )

      new ShellyPlatform(log, {}) // eslint-disable-line no-new

      configure.calledOnce.should.be.true()
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
      'should invoke deviceStaleHandler() when `stale` is emitted',
      function() {
        const handler = sinon.stub(
          ShellyPlatform.prototype,
          'deviceStaleHandler'
        )
        const device = { type: 'UNKNOWN' }

        new ShellyPlatform(log, {}) // eslint-disable-line no-new
        shellies.emit('stale', device)

        handler.calledOnce.should.be.true()
        handler.calledWith(device).should.be.true()
      }
    )

    it(
      'should invoke start() when `didFinishLaunching` is emitted',
      function() {
        new ShellyPlatform(log, { // eslint-disable-line no-new
          admin: {
            enabled: false,
          },
        })
        homebridge.emit('didFinishLaunching')

        start.called.should.be.true()
      }
    )
  })

  describe('#configure()', function() {
    it(
      'should invoke setAuthCredentials() when credentials are given',
      function() {
        const setAuthCredentials = sinon.stub(shellies, 'setAuthCredentials')

        platform.config = {
          username: 'foo',
          password: 'bar',
        }
        platform.configure()

        setAuthCredentials.calledOnce.should.be.true()
        setAuthCredentials.calledWith('foo', 'bar').should.be.true()
      }
    )

    it('should set the request timeout when given', function() {
      const timeout = sinon.stub(shellies.request, 'timeout')

      platform.config = {
        requestTimeout: 1000,
      }
      platform.configure()

      timeout.calledOnce.should.be.true()
      timeout.calledWith(1000).should.be.true()
    })

    it('should set the stale timeout when given', function() {
      platform.config = {
        staleTimeout: 1000,
      }
      platform.configure()

      shellies.staleTimeout.should.equal(1000)
    })

    it('should skip invalid device config arrays', function() {
      platform.config = {
        devices: 'foo',
      }
      platform.configure()
      platform.deviceConfigs.size.should.equal(0)
    })

    it('should skip device configs with no IDs', function() {
      platform.config = {
        devices: [
          { foo: 'bar' },
        ],
      }
      platform.configure()
      platform.deviceConfigs.size.should.equal(0)
    })

    it('should properly setup device configs', function() {
      platform.config = {
        devices: [
          { id: 'abc123', foo: 'bar' },
          { id: 'ABC124', bar: 'foo' },
        ],
      }
      platform.configure()
      platform.deviceConfigs.size.should.equal(2)
      platform.deviceConfigs.get('ABC123').should.be.ok()
      platform.deviceConfigs.get('ABC124').should.be.ok()
    })
  })

  describe('#getNetworkInterface()', function() {
    it('should return null when no interface is configured', function() {
      should(platform.config.networkInterface).be.undefined()
      should(platform.getNetworkInterface()).be.null()
    })

    it(
      'should return null when an unknown interface is configured',
      function() {
        const networkInterfaces = sinon.stub(os, 'networkInterfaces')
          .returns({ en0: [{ address: '192.168.1.2' }] })

        platform.config.networkInterface = 'en1'
        should(platform.getNetworkInterface()).be.null()

        networkInterfaces.calledOnce.should.be.true()
      }
    )

    it(
      'should return an address when an interface name is configured',
      function() {
        const networkInterfaces = sinon.stub(os, 'networkInterfaces')
          .returns({
            en0: [
              { address: '192.168.1.2' },
              { address: '192.168.1.3' },
              { address: '192.168.1.4' },
            ]
          })

        platform.config.networkInterface = 'en0'
        platform.getNetworkInterface().should.equal('192.168.1.2')

        networkInterfaces.calledOnce.should.be.true()
      }
    )

    it(
      'should return the same address when a valid address is configured',
      function() {
        const networkInterfaces = sinon.stub(os, 'networkInterfaces')
          .returns({
            en0: [
              { address: '192.168.1.2' },
              { address: '192.168.1.3' },
              { address: '192.168.1.4' },
            ]
          })

        platform.config.networkInterface = '192.168.1.3'
        platform.getNetworkInterface().should.equal('192.168.1.3')

        networkInterfaces.calledOnce.should.be.true()
      }
    )
  })

  describe('#getDeviceConfig()', function() {
    it('should return the config for the given device ID', function() {
      const deviceId = 'ABC123'
      const config = { foo: 'bar' }
      platform.deviceConfigs.set(deviceId, config)
      platform.getDeviceConfig(deviceId).should.equal(config)
    })

    it('should return an empty object for unknown device IDs', function() {
      platform.getDeviceConfig('UNKNOWN').should.be.empty()
    })
  })

  describe('#discoverDeviceHandler()', function() {
    it('should invoke addDevice()', function() {
      const addDevice = sinon.stub(platform, 'addDevice')
      const device = {}
      platform.discoverDeviceHandler(device)
      addDevice.calledOnce.should.be.true()
      addDevice.calledWith(device).should.be.true()
    })
  })

  describe('#deviceStaleHandler()', function() {
    it('should invoke removeDevice()', function() {
      const removeDevice = sinon.stub(platform, 'removeDevice')
      const device = {}
      platform.deviceStaleHandler(device)
      removeDevice.calledOnce.should.be.true()
      removeDevice.calledWith(device).should.be.true()
    })
  })

  describe('#addDevice()', function() {
    let registerPlatformAccessories = null

    beforeEach(function() {
      registerPlatformAccessories = sinon.stub(
        homebridge,
        'registerPlatformAccessories'
      )
    })

    it('should do nothing with unknown devices', function() {
      platform.addDevice({ type: 'UNKNOWN' })
      registerPlatformAccessories.called.should.be.false()
    })

    it('should register accessories', function() {
      platform.addDevice(
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

  describe('#removeDevice()', function() {
    let device = null
    let deviceWrapper = null

    beforeEach(function() {
      device = shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2')
      deviceWrapper = new DeviceWrapper(
        platform,
        device,
        {},
        ...AccessoryFactory.createAccessories(device, {}, log)
      )
    })

    it('should unregister the device\'s platform accessories', function() {
      const unregisterPlatformAccessories = sinon.stub(
        homebridge,
        'unregisterPlatformAccessories'
      )

      platform.deviceWrappers.set(device, deviceWrapper)
      platform.removeDevice(device)

      unregisterPlatformAccessories.calledOnce.should.be.true()
    })

    it('should destroy the associated device wrapper', function() {
      const destroy = sinon.stub(deviceWrapper, 'destroy')

      platform.deviceWrappers.set(device, deviceWrapper)
      platform.removeDevice(device)

      destroy.calledOnce.should.be.true()
    })

    it('should remove the associated device wrapper', function() {
      platform.deviceWrappers.set(device, deviceWrapper)
      platform.removeDevice(device)
      platform.deviceWrappers.has(device).should.be.false()
    })

    it('should do nothing for unknown devices', function() {
      const unregisterPlatformAccessories = sinon.stub(
        homebridge,
        'unregisterPlatformAccessories'
      )

      platform.removeDevice(device)

      unregisterPlatformAccessories.called.should.be.false()
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
      platformAccessory.addService(new homebridge.hap.Service.WindowCovering())
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
        new DeviceWrapper(platform, device)
      )

      platform.configureAccessory(platformAccessory)

      platform.deviceWrappers.size.should.equal(1)
    })

    it('should create an accessory', function() {
      platform.configureAccessory(platformAccessory)

      const deviceWrapper = platform.deviceWrappers.values().next().value
      deviceWrapper.accessories.length.should.equal(1)
    })
  })
})
