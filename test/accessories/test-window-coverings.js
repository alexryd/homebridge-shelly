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
  Shelly2WindowCoveringAccessory,
} = require('../../accessories/window-coverings')(homebridge)

describe('Shelly2WindowCoveringAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-25', 'ABC123', '192.168.1.2', 'roller')
    accessory = new Shelly2WindowCoveringAccessory(log, device)
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
    it('should set the correct category', function() {
      const pa = accessory.createPlatformAccessory()
      pa.category.should.equal(Accessory.Categories.WINDOW_COVERING)
    })

    it('should store the mode in the context', function() {
      const pa = accessory.createPlatformAccessory()
      pa.context.mode.should.equal('roller')
    })

    it('should add a window covering service', function() {
      const pa = accessory.createPlatformAccessory()
      pa.getService(Service.WindowCovering).should.be.ok()
    })

    it('should set PositionState to the roller state', function() {
      device.rollerState = 'open'

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.PositionState)
        .value
        .should.equal(Characteristic.PositionState.INCREASING)
    })

    it('should set CurrentPosition to the roller position', function() {
      device.rollerPosition = 64

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.CurrentPosition)
        .value
        .should.equal(device.rollerPosition)
    })

    it('should set TargetPosition to the target position', function() {
      accessory.targetPosition = 92

      const pa = accessory.createPlatformAccessory()
      pa
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.TargetPosition)
        .value
        .should.equal(accessory.targetPosition)
    })
  })

  describe('#setupEventHandlers()', function() {
    it(
      'should not set the roller position when it has not changed',
      function(done) {
        const setRollerPosition = sinon.stub(
          device,
          'setRollerPosition'
        ).resolves()

        accessory.targetPosition = 70

        accessory.platformAccessory
          .getService(Service.WindowCovering)
          .getCharacteristic(Characteristic.TargetPosition)
          .emit('set', 70, e => {
            setRollerPosition.called.should.be.false()
            should.not.exist(e)
            done()
          })
      }
    )

    it(
      'should set the roller position when TargetPosition is set',
      function(done) {
        const setRollerPosition = sinon.stub(
          device,
          'setRollerPosition'
        ).resolves()

        accessory.platformAccessory
          .getService(Service.WindowCovering)
          .getCharacteristic(Characteristic.TargetPosition)
          .emit('set', 30, e => {
            setRollerPosition.calledOnce.should.be.true()
            setRollerPosition.calledWith(30).should.be.true()
            should.not.exist(e)
            done()
          })
      }
    )

    it('should handle errors when setting the roller position', function(done) {
      const error = new Error()
      const setRollerPosition = sinon.stub(
        device,
        'setRollerPosition'
      ).rejects(error)

      accessory.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.TargetPosition)
        .emit('set', 30, e => {
          setRollerPosition.calledOnce.should.be.true()
          setRollerPosition.calledWith(30).should.be.true()
          e.should.equal(error)
          done()
        })
    })
  })

  describe('#rollerStateChangeHandler()', function() {
    it(
      'should update PositionState when the roller state is changed',
      function() {
        const positionState = accessory.platformAccessory
          .getService(Service.WindowCovering)
          .getCharacteristic(Characteristic.PositionState)

        device.rollerState = 'open'
        positionState.value.should.equal(
          Characteristic.PositionState.INCREASING
        )

        device.rollerState = 'close'
        positionState.value.should.equal(
          Characteristic.PositionState.DECREASING
        )
      }
    )
  })

  describe('#rollerPositionChangeHandler()', function() {
    it(
      'should update CurrentPosition when the roller position changes',
      function() {
        const currentPosition = accessory.platformAccessory
          .getService(Service.WindowCovering)
          .getCharacteristic(Characteristic.CurrentPosition)

        device.rollerPosition = 23
        currentPosition.value.should.equal(23)

        device.rollerPosition = 77
        currentPosition.value.should.equal(77)
      }
    )
  })

  describe('#_updateTargetPosition()', function() {
    it('should set TargetPosition when stopping', function(done) {
      accessory.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.TargetPosition)
        .on('change', value => {
          value.should.equal(10)
          done()
        })

      device.rollerState = 'stop'
      device.rollerPosition = 10
      accessory._updateTargetPosition()
    })

    it('should properly set TargetPosition when opening', function(done) {
      accessory.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.TargetPosition)
        .on('change', value => {
          value.should.equal(100)
          done()
        })

      device.rollerState = 'open'
      device.rollerPosition = 10
      accessory.targetPosition = 0
      accessory._updateTargetPosition()
    })

    it('should properly set TargetPosition when closing', function(done) {
      accessory.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.TargetPosition)
        .on('change', value => {
          value.should.equal(0)
          done()
        })

      device.rollerState = 'close'
      device.rollerPosition = 10
      accessory.targetPosition = 100
      accessory._updateTargetPosition()
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
