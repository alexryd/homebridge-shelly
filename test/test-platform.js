/* eslint-env mocha */

require('should')

const shellies = require('shellies')
const should = require('should')
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
        new ShellyPlatform(log, {}) // eslint-disable-line no-new
        homebridge.emit('didFinishLaunching')

        start.called.should.be.true()
      }
    )

    it('should pass the network interface to start()', function() {
      const networkInterface = '127.0.0.1'

      new ShellyPlatform(log, { // eslint-disable-line no-new
        networkInterface,
      })
      homebridge.emit('didFinishLaunching')

      start.calledWith(networkInterface).should.be.true()
    })
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
      deviceWrapper = new ShellyPlatform.DeviceWrapper(
        platform,
        device,
        {},
        ...platform.createAccessoriesForDevice(device)
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
        new ShellyPlatform.DeviceWrapper(platform, device)
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

  describe('#createAccessoriesForDevice()', function() {
    it('should create an accessory', function() {
      const accessories = platform.createAccessoriesForDevice(
        shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')
      )
      should(accessories).be.ok()
      accessories.length.should.equal(1)
      should(accessories[0]).be.ok()
    })

    it('should return null for unknown devices', function() {
      const accessories = platform.createAccessoriesForDevice(
        { type: 'UNKNOWN' }
      )
      should(accessories).be.null()
    })

    it(
      'should create 4 accessories for Shelly RGBW2 devices in white mode',
      function() {
        const accessories = platform.createAccessoriesForDevice(
          shellies.createDevice('SHRGBW2', 'ABC123', '192.168.1.2', 'white')
        )
        accessories.length.should.equal(4)
      }
    )

    it(
      'should create 1 accessory for Shelly RGBW2 devices in color mode',
      function() {
        const accessories = platform.createAccessoriesForDevice(
          shellies.createDevice('SHRGBW2', 'ABC123', '192.168.1.2', 'color')
        )
        accessories.length.should.equal(1)
      }
    )

    it(
      'should create 1 accessory for Shelly 2 devices in roller mode',
      function() {
        const accessories = platform.createAccessoriesForDevice(
          shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2', 'roller')
        )
        accessories.length.should.equal(1)
      }
    )

    it(
      'should create 2 accessories for Shelly 2 devices in relay mode',
      function() {
        const accessories = platform.createAccessoriesForDevice(
          shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2', 'relay')
        )
        accessories.length.should.equal(2)
      }
    )

    it('should create 2 accessories for Shelly HD devices', function() {
      const accessories = platform.createAccessoriesForDevice(
        shellies.createDevice('SHSW-22', 'ABC123', '192.168.1.2')
      )
      accessories.length.should.equal(2)
    })

    it(
      'should create 1 accessory for Shelly 2.5 devices in roller mode',
      function() {
        const accessories = platform.createAccessoriesForDevice(
          shellies.createDevice('SHSW-25', 'ABC123', '192.168.1.2', 'roller')
        )
        accessories.length.should.equal(1)
      }
    )

    it(
      'should create 2 accessories for Shelly 2.5 devices in relay mode',
      function() {
        const accessories = platform.createAccessoriesForDevice(
          shellies.createDevice('SHSW-25', 'ABC123', '192.168.1.2', 'relay')
        )
        accessories.length.should.equal(2)
      }
    )

    it('should create 4 accessories for Shelly 4Pro devices', function() {
      const accessories = platform.createAccessoriesForDevice(
        shellies.createDevice('SHSW-44', 'ABC123', '192.168.1.2')
      )
      accessories.length.should.equal(4)
    })
  })

  describe('#createAccessory()', function() {
    it('should create accessories for Shelly Bulb devices', function() {
      const device = shellies.createDevice('SHBLB-1', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly H&T devices', function() {
      const device = shellies.createDevice('SHHT-1', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly Plug devices', function() {
      const device = shellies.createDevice('SHPLG-1', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly Plug S devices', function() {
      const device = shellies.createDevice('SHPLG-S', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device)
      should(accessory).be.ok()
    })

    it(
      'should create accessories for Shelly RGBW2 devices in white mode',
      function() {
        const device = shellies.createDevice(
          'SHRGBW2',
          '192.168.1.2',
          'ABC123',
          'white'
        )
        const accessory = platform.createAccessory(device, null, { index: 0 })
        should(accessory).be.ok()
      }
    )

    it(
      'should create accessories for Shelly RGBW2 devices in color mode',
      function() {
        const device = shellies.createDevice(
          'SHRGBW2',
          '192.168.1.2',
          'ABC123',
          'color'
        )
        const accessory = platform.createAccessory(device)
        should(accessory).be.ok()
      }
    )

    it('should create accessories for Shelly Sense devices', function() {
      const device = shellies.createDevice('SHSEN-1', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly 1 devices', function() {
      const device = shellies.createDevice('SHSW-1', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device)
      should(accessory).be.ok()
    })

    it(
      'should create accessories for Shelly 2 devices in roller mode',
      function() {
        const device = shellies.createDevice(
          'SHSW-21',
          '192.168.1.2',
          'ABC123',
          'roller'
        )
        const accessory = platform.createAccessory(device)
        should(accessory).be.ok()
      }
    )

    it(
      'should create accessories for Shelly 2 devices in relay mode',
      function() {
        const device = shellies.createDevice(
          'SHSW-21',
          '192.168.1.2',
          'ABC123',
          'relay'
        )
        const accessory = platform.createAccessory(device, null, { index: 0 })
        should(accessory).be.ok()
      }
    )

    it(
      'should create accessories for Shelly 2.5 devices in roller mode',
      function() {
        const device = shellies.createDevice(
          'SHSW-25',
          '192.168.1.2',
          'ABC123',
          'roller'
        )
        const accessory = platform.createAccessory(device)
        should(accessory).be.ok()
      }
    )

    it(
      'should create accessories for Shelly 2.5 devices in relay mode',
      function() {
        const device = shellies.createDevice(
          'SHSW-25',
          '192.168.1.2',
          'ABC123',
          'relay'
        )
        const accessory = platform.createAccessory(device, null, { index: 0 })
        should(accessory).be.ok()
      }
    )

    it('should create accessories for Shelly HD devices', function() {
      const device = shellies.createDevice('SHSW-22', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device, null, { index: 0 })
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly 4Pro devices', function() {
      const device = shellies.createDevice('SHSW-44', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device, null, { index: 0 })
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly 1PM devices', function() {
      const device = shellies.createDevice('SHSW-PM', '192.168.1.2', 'ABC123')
      const accessory = platform.createAccessory(device)
      should(accessory).be.ok()
    })
  })
})

describe('DeviceWrapper', function() {
  let platform = null
  let device = null
  let deviceWrapper = null

  beforeEach(function() {
    platform = new ShellyPlatform(log, {})
    device = shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2')
    deviceWrapper = new ShellyPlatform.DeviceWrapper(platform, device)
  })

  afterEach(function() {
    sinon.restore()
    device.removeAllListeners()
    homebridge.removeAllListeners()
  })

  describe('#constructor()', function() {
    it(
      'should invoke setAuthCredentials() when credentials are given',
      function() {
        const d = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')
        const setAuthCredentials = sinon.stub(d, 'setAuthCredentials')

        // eslint-disable-next-line no-new
        new ShellyPlatform.DeviceWrapper(platform, d, {
          username: 'foo',
          password: 'bar',
        })

        setAuthCredentials.calledOnce.should.be.true()
        setAuthCredentials.calledWith('foo', 'bar').should.be.true()
      }
    )

    it('should invoke loadSettings() if the device is online', function() {
      const loadSettings = sinon.stub(
        ShellyPlatform.DeviceWrapper.prototype,
        'loadSettings'
      )
      const d = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')

      d.online = true
      // eslint-disable-next-line no-new
      new ShellyPlatform.DeviceWrapper(platform, d)

      loadSettings.calledOnce.should.be.true()
    })

    it('should not invoke loadSettings() if the device is offline', function() {
      const loadSettings = sinon.stub(
        ShellyPlatform.DeviceWrapper.prototype,
        'loadSettings'
      )

      // eslint-disable-next-line no-new
      new ShellyPlatform.DeviceWrapper(platform, device)

      loadSettings.called.should.be.false()
    })

    it('should invoke loadSettings() when the device goes online', function() {
      const loadSettings = sinon.stub(
        ShellyPlatform.DeviceWrapper.prototype,
        'loadSettings'
      )
      const d = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')

      // eslint-disable-next-line no-new
      new ShellyPlatform.DeviceWrapper(platform, d)

      d.online = true
      loadSettings.calledOnce.should.be.true()
    })

    it('should invoke changeHostHandler() when the host changes', function() {
      const changeHostHandler = sinon.stub(
        ShellyPlatform.DeviceWrapper.prototype,
        'changeHostHandler'
      )
      const d = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')

      // eslint-disable-next-line no-new
      new ShellyPlatform.DeviceWrapper(platform, d)

      d.host = '192.168.1.3'
      changeHostHandler.calledOnce.should.be.true()
    })

    it('should invoke changeModeHandler() when the mode changes', function() {
      const changeModeHandler = sinon.stub(
        ShellyPlatform.DeviceWrapper.prototype,
        'changeModeHandler'
      )
      const d = shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2')

      // eslint-disable-next-line no-new
      new ShellyPlatform.DeviceWrapper(platform, d)

      d.mode = 'roller'
      changeModeHandler.calledOnce.should.be.true()
    })
  })

  describe('#platformAccessories', function() {
    it('should return all platform accessories', function() {
      deviceWrapper.accessories = platform.createAccessoriesForDevice(device)
      const platformAccessories = deviceWrapper.platformAccessories

      platformAccessories.length.should.equal(2)

      for (const pa of platformAccessories) {
        pa.should.be.instanceof(homebridge.platformAccessory)
      }
    })
  })

  describe('#changeHostHandler()', function() {
    it('should invoke updatePlatformAccessories()', function() {
      const updatePlatformAccessories = sinon.stub(
        homebridge,
        'updatePlatformAccessories'
      )

      deviceWrapper.changeHostHandler('192.168.1.3', '192.168.1.2', device)

      updatePlatformAccessories.calledOnce.should.be.true()
      updatePlatformAccessories
        .calledWith(deviceWrapper.platformAccessories).should.be.true()
    })
  })

  describe('#changeModeHandler()', function() {
    it('should remove and re-add its device', function() {
      const removeDevice = sinon.stub(platform, 'removeDevice')
      const addDevice = sinon.stub(platform, 'addDevice')

      deviceWrapper.changeModeHandler('roller', 'relay', device)

      removeDevice.calledOnce.should.be.true()
      removeDevice.calledWith(device).should.be.true()
      addDevice.calledOnce.should.be.true()
      addDevice.calledWith(device).should.be.true()
    })
  })

  describe('#loadSettings()', function() {
    it('should not do anything when settings are loaded', function() {
      const getSettings = sinon.stub(device, 'getSettings')

      device.settings = {}
      deviceWrapper.loadSettings()

      getSettings.called.should.be.false()
    })

    it('should load settings', function(done) {
      const settings = {}
      const getSettings = sinon.stub(device, 'getSettings').resolves(settings)

      device.on('change:settings', s => {
        s.should.equal(settings)
        getSettings.calledOnce.should.be.true()
        done()
      })

      deviceWrapper.loadSettings()
    })

    it('should set the device to offline on errors', function(done) {
      sinon.stub(device, 'getSettings').rejects()

      device.online = true
      device.on('offline', () => done())

      deviceWrapper.loadSettings()
    })
  })

  describe('#destroy()', function() {
    it('should remove all event listeners from the device', function() {
      device.eventNames().length.should.not.equal(0)
      deviceWrapper.destroy()
      device.eventNames().length.should.equal(0)
    })

    it('should invoke detach() on all of its accessories', function() {
      const detach = sinon.fake()

      deviceWrapper.accessories = platform.createAccessoriesForDevice(device)

      for (const accessory of deviceWrapper.accessories) {
        sinon.stub(accessory, 'detach').callsFake(detach)
      }

      deviceWrapper.destroy()

      detach.called.should.be.true()
      detach.callCount.should.equal(2)
    })

    it('should remove all of its accessories', function() {
      deviceWrapper.accessories = platform.createAccessoriesForDevice(device)
      deviceWrapper.destroy()
      deviceWrapper.accessories.length.should.equal(0)
    })
  })
})
