/* eslint-env mocha */

const shellies = require('shellies')
const should = require('should')
const sinon = require('sinon')

const Homebridge = require('../mocks/homebridge')
const log = require('../mocks/log')

const homebridge = new Homebridge()
const Accessory = homebridge.hap.Accessory
const Characteristic = homebridge.hap.Characteristic
const Service = homebridge.hap.Service

const {
  _getHueSaturation,
  _getRedGreenBlue,
  ShellyColorLightbulbAccessory,
  ShellyWhiteLightbulbAccessory,
  ShellyBulbColorLightbulbAccessory,
  ShellyRGBW2ColorLightbulbAccessory,
  ShellyRGBW2WhiteLightbulbAccessory,
} = require('../../accessories/lightbulbs')(homebridge)

describe('getHueSaturation()', function() {
  it('should return the correct hue', function() {
    _getHueSaturation('rgb', 231, 56, 189).hue.should.equal(314)
    _getHueSaturation('rgbw', 76, 158, 11).hue.should.equal(93)
  })

  it('should return the correct saturation', function() {
    _getHueSaturation('rgb', 231, 56, 189).saturation.should.equal(76)
    _getHueSaturation('rgbw', 76, 158, 11).saturation.should.equal(100)
  })
})

describe('getRedGreenBlue()', function() {
  it('should return the correct red, green and blue', function() {
    const rgb = _getRedGreenBlue('rgb', 93, 93)
    rgb.red.should.equal(125)
    rgb.green.should.equal(255)
    rgb.blue.should.equal(18)

    const rgbw = _getRedGreenBlue('rgbw', 314, 100)
    rgbw.red.should.equal(255)
    rgbw.green.should.equal(0)
    rgbw.blue.should.equal(195)
  })

  it('should return the correct white', function() {
    _getRedGreenBlue('rgbw', 286, 68).white.should.equal(82)
    _getRedGreenBlue('rgbw', 12, 100).white.should.equal(0)
  })
})

describe('ShellyColorLightbulbAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHRGBW2', 'ABC123', '192.168.1.2', 'color')
    accessory = new ShellyColorLightbulbAccessory(log, device)
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#createPlatformAccessory()', function() {
    it('should set the correct category', function() {
      const pa = accessory.createPlatformAccessory()
      pa.category.should.equal(Accessory.Categories.LIGHTBULB)
    })

    it('should add a lightbulb service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.Lightbulb).should.be.ok()
    })

    it('should set On to the switch state', function() {
      device.switch = true

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .value
        .should.equal(true)
    })

    it('should set Hue to the current hue', function() {
      accessory.hue = 78

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Hue)
        .value
        .should.equal(78)
    })

    it('should set Saturation to the current saturation', function() {
      accessory.saturation = 42

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Saturation)
        .value
        .should.equal(42)
    })

    it('should set Brightness to the current gain', function() {
      device.gain = 13

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .value
        .should.equal(13)
    })

    it('should skip Brightness for devices without gain', function() {
      const d = shellies.createDevice('SHBLB-1', 'ABC123', '192.168.1.2')
      const a = new ShellyColorLightbulbAccessory(log, d)

      should.not.exist(d.gain)

      const pa = a.createPlatformAccessory()
      should(
        pa.getService(Service.Lightbulb)
          .getCharacteristic(Characteristic.Brightness)
          .value
      ).not.be.ok()
    })
  })

  describe('#setupEventHandlers()', function() {
    it('should set the switch state when On is set', function(done) {
      const setColor = sinon.stub(device, 'setColor').resolves()

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .emit('set', true, e => {
          setColor.calledOnce.should.be.true()
          should.not.exist(e)
          done()
        })
    })

    it('should handle errors when setting the switch state', function(done) {
      const error = new Error()
      const setColor = sinon.stub(device, 'setColor').rejects(error)

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .emit('set', true, e => {
          setColor.calledOnce.should.be.true()
          e.should.equal(error)
          done()
        })
    })

    it('should update the device color when Hue is set', function(done) {
      const _updateDeviceColor = sinon.stub(
        accessory,
        '_updateDeviceColor'
      ).resolves()

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Hue)
        .emit('set', 42, e => {
          _updateDeviceColor.calledOnce.should.be.true()
          should.not.exist(e)
          done()
        })
    })

    it('should update the device color when Saturation is set', function(done) {
      const _updateDeviceColor = sinon.stub(
        accessory,
        '_updateDeviceColor'
      ).resolves()

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Saturation)
        .emit('set', 4, e => {
          _updateDeviceColor.calledOnce.should.be.true()
          should.not.exist(e)
          done()
        })
    })

    it('should set the gain when Brightness is set', function(done) {
      const setColor = sinon.stub(device, 'setColor').resolves()

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .emit('set', 97, e => {
          setColor.calledOnce.should.be.true()
          should.not.exist(e)
          done()
        })
    })

    it('should handle errors when setting the gain', function(done) {
      const error = new Error()
      const setColor = sinon.stub(device, 'setColor').rejects(error)

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .emit('set', 82, e => {
          setColor.calledOnce.should.be.true()
          e.should.equal(error)
          done()
        })
    })
  })

  describe('#switchChangeHandler()', function() {
    it('should update On when the switch state is changed', function() {
      const on = accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)

      device.switch = true
      on.value.should.be.true()

      device.switch = false
      on.value.should.be.false()
    })
  })

  describe('#colorChangeHandler()', function() {
    it('should invoke _updateHueSaturation()', function() {
      const _updateHueSaturation = sinon.stub(accessory, '_updateHueSaturation')
      device.red = 41
      _updateHueSaturation.calledOnce.should.be.true()
    })
  })

  describe('#gainChangeHandler()', function() {
    it('should update Brightness when the gain is changed', function() {
      const brightness = accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)

      device.gain = 55
      brightness.value.should.equal(55)
    })
  })

  describe('#_updateDeviceColor()', function() {
    it('should set the device color', function(done) {
      const setColor = sinon.stub(device, 'setColor').resolves()

      accessory._updateDeviceColor()
      accessory._updateDeviceColor()
      accessory._updateDeviceColor()

      setImmediate(() => {
        setColor.calledOnce.should.be.true()
        done()
      })
    })

    it('should handle errors when setting the device color', function(done) {
      const setColor = sinon.stub(device, 'setColor').rejects(new Error())

      accessory._updateDeviceColor()

      setImmediate(() => {
        setColor.calledOnce.should.be.true()
        done()
      })
    })
  })

  describe('#_updateHueSaturation()', function() {
    it('should set Hue and Saturation', function(done) {
      const lightbulbService = accessory.platformAccessory
        .getService(Service.Lightbulb)
      const hue = lightbulbService.getCharacteristic(Characteristic.Hue)
      const saturation = lightbulbService
        .getCharacteristic(Characteristic.Saturation)

      device.red = 238
      device.green = 34
      device.blue = 108
      device.white = 12

      accessory._updateHueSaturation()
      accessory._updateHueSaturation()
      accessory._updateHueSaturation()

      setImmediate(() => {
        hue.value.should.equal(338)
        saturation.value.should.equal(95)
        done()
      })
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

describe('ShellyWhiteLightbulbAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHRGBW2', 'ABC123', '192.168.1.2', 'white')
    accessory = new ShellyWhiteLightbulbAccessory(
      log,
      device,
      'switch0',
      'brightness0'
    )
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#createPlatformAccessory()', function() {
    it('should set the correct category', function() {
      const pa = accessory.createPlatformAccessory()
      pa.category.should.equal(Accessory.Categories.LIGHTBULB)
    })

    it('should add a lightbulb service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.Lightbulb).should.be.ok()
    })

    it('should set On to the switch state', function() {
      device.switch0 = true

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .value
        .should.equal(true)
    })

    it('should set Brightness to the current brightness', function() {
      device.brightness0 = 45

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .value
        .should.equal(45)
    })
  })

  describe('#setupEventHandlers()', function() {
    it('should set the switch state when On is set', function(done) {
      const setSwitch = sinon.stub(accessory, 'setSwitch').resolves()

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .emit('set', true, e => {
          setSwitch.calledOnce.should.be.true()
          setSwitch.calledWith(true).should.be.true()
          should.not.exist(e)
          done()
        })
    })

    it('should handle errors when setting the switch state', function(done) {
      const error = new Error()
      const setSwitch = sinon.stub(accessory, 'setSwitch').rejects(error)

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .emit('set', true, e => {
          setSwitch.calledOnce.should.be.true()
          e.should.equal(error)
          done()
        })
    })

    it('should set the brightness when Brightness is set', function(done) {
      const setBrightness = sinon.stub(accessory, 'setBrightness').resolves()

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .emit('set', 92, e => {
          setBrightness.calledOnce.should.be.true()
          setBrightness.calledWith(92).should.be.true()
          should.not.exist(e)
          done()
        })
    })

    it('should handle errors when setting the brightness', function(done) {
      const error = new Error()
      const setBrightness = sinon.stub(accessory, 'setBrightness')
        .rejects(error)

      accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .emit('set', 42, e => {
          setBrightness.calledOnce.should.be.true()
          e.should.equal(error)
          done()
        })
    })
  })

  describe('#switchChangeHandler()', function() {
    it('should update On when the switch state is changed', function() {
      const on = accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)

      device.switch0 = true
      on.value.should.be.true()

      device.switch0 = false
      on.value.should.be.false()
    })
  })

  describe('#brightnessChangeHandler()', function() {
    it('should update Brightness when the brightness is changed', function() {
      const brightness = accessory.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)

      device.brightness0 = 63
      brightness.value.should.equal(63)
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

describe('ShellyBulbColorLightbulbAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHBLB-1', 'ABC123', '192.168.1.2')
    accessory = new ShellyBulbColorLightbulbAccessory(log, device)
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

describe('ShellyRGBW2ColorLightbulbAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHRGBW2', 'ABC123', '192.168.1.2', 'color')
    accessory = new ShellyRGBW2ColorLightbulbAccessory(log, device)
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
    it('should add its mode to the context', function() {
      const pa = accessory.createPlatformAccessory()
      pa.context.mode.should.equal('color')
    })
  })
})

describe('ShellyRGBW2WhiteLightbulbAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHRGBW2', 'ABC123', '192.168.1.2', 'white')
    accessory = new ShellyRGBW2WhiteLightbulbAccessory(log, device, 1)
  })

  afterEach(function() {
    sinon.restore()
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

  describe('#createPlatformAccessory()', function() {
    it('should add its mode to the context', function() {
      const pa = accessory.createPlatformAccessory()
      pa.context.mode.should.equal('white')
    })

    it('should add its index to the context', function() {
      const pa = accessory.createPlatformAccessory()
      pa.context.index.should.equal(accessory.index)
    })
  })

  describe('#setSwitch()', function() {
    it('should invoke setWhite()', function() {
      const setWhite = sinon.stub(device, 'setWhite').resolves()
      accessory.setSwitch(true)
      setWhite.calledOnce.should.be.true()
    })
  })

  describe('#setBrightness()', function() {
    it('should invoke setWhite()', function() {
      const setWhite = sinon.stub(device, 'setWhite').resolves()
      accessory.setBrightness(31)
      setWhite.calledOnce.should.be.true()
    })
  })
})
