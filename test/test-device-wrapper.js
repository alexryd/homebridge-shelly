/* eslint-env mocha */

const shellies = require('@tritter/shellies')
const sinon = require('sinon')

const Homebridge = require('./mocks/homebridge')
const log = require('./mocks/log')

const homebridge = new Homebridge()

const AccessoryFactory = require('../accessories/factory')(homebridge)
const DeviceWrapper = require('../device-wrapper')(homebridge)
const ShellyPlatform = require('../platform')(homebridge)

describe('DeviceWrapper', function() {
  let platform = null
  let device = null
  let deviceWrapper = null

  beforeEach(function() {
    platform = new ShellyPlatform(log, {})
    device = shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2')
    deviceWrapper = new DeviceWrapper(platform, device)
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
        new DeviceWrapper(platform, d, {
          username: 'foo',
          password: 'bar',
        })

        setAuthCredentials.calledOnce.should.be.true()
        setAuthCredentials.calledWith('foo', 'bar').should.be.true()
      }
    )

    it('should invoke loadSettings() if the device is online', function() {
      const loadSettings = sinon.stub(
        DeviceWrapper.prototype,
        'loadSettings'
      )
      const d = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')

      d.online = true
      // eslint-disable-next-line no-new
      new DeviceWrapper(platform, d)

      loadSettings.calledOnce.should.be.true()
    })

    it('should not invoke loadSettings() if the device is offline', function() {
      const loadSettings = sinon.stub(
        DeviceWrapper.prototype,
        'loadSettings'
      )

      // eslint-disable-next-line no-new
      new DeviceWrapper(platform, device)

      loadSettings.called.should.be.false()
    })

    it('should invoke loadSettings() when the device goes online', function() {
      const loadSettings = sinon.stub(
        DeviceWrapper.prototype,
        'loadSettings'
      )
      const d = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')

      // eslint-disable-next-line no-new
      new DeviceWrapper(platform, d)

      d.online = true
      loadSettings.calledOnce.should.be.true()
    })

    it('should invoke changeHostHandler() when the host changes', function() {
      const changeHostHandler = sinon.stub(
        DeviceWrapper.prototype,
        'changeHostHandler'
      )
      const d = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')

      // eslint-disable-next-line no-new
      new DeviceWrapper(platform, d)

      d.host = '192.168.1.3'
      changeHostHandler.calledOnce.should.be.true()
    })

    it('should invoke changeModeHandler() when the mode changes', function() {
      const changeModeHandler = sinon.stub(
        DeviceWrapper.prototype,
        'changeModeHandler'
      )
      const d = shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2')

      // eslint-disable-next-line no-new
      new DeviceWrapper(platform, d)

      d.mode = 'roller'
      changeModeHandler.calledOnce.should.be.true()
    })
  })

  describe('#platformAccessories', function() {
    it('should return all platform accessories', function() {
      deviceWrapper.accessories = AccessoryFactory.createAccessories(
        device,
        {},
        log
      )

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

      deviceWrapper.accessories = AccessoryFactory.createAccessories(
        device,
        {},
        log
      )

      for (const accessory of deviceWrapper.accessories) {
        sinon.stub(accessory, 'detach').callsFake(detach)
      }

      deviceWrapper.destroy()

      detach.called.should.be.true()
      detach.callCount.should.equal(2)
    })

    it('should remove all of its accessories', function() {
      deviceWrapper.accessories = AccessoryFactory.createAccessories(
        device,
        {},
        log
      )
      deviceWrapper.destroy()
      deviceWrapper.accessories.length.should.equal(0)
    })
  })
})
