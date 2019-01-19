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
  Shelly2RollerShutterAccessory,
} = require('../../accessories/roller-shutters')(homebridge)

describe('Shelly2RollerShutterAccessory', function() {
  let device = null
  let getStatus = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-22', 'ABC123', '192.168.1.2')
    getStatus = sinon.stub(device, 'getStatus').resolves({
      rollers: [
        { current_pos: 40 },
      ],
    })
    accessory = new Shelly2RollerShutterAccessory(log, device)
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('#constructor()', function() {
    it('should load the current position', function() {
      const getCurrentPosition = sinon.stub(
        Shelly2RollerShutterAccessory.prototype,
        'getCurrentPosition'
      ).resolves(20)

      // eslint-disable-next-line no-new
      new Shelly2RollerShutterAccessory(log, device)
      getCurrentPosition.calledOnce.should.be.true()
    })

    it('should set the current and target position', function() {
      const coveringService = accessory.platformAccessory
        .getService(Service.WindowCovering)

      coveringService.getCharacteristic(Characteristic.CurrentPosition).value
        .should.equal(40)
      coveringService.getCharacteristic(Characteristic.TargetPosition).value
        .should.equal(40)
    })

    it('should handle failed requests', function() {
      const getCurrentPosition = sinon.stub(
        Shelly2RollerShutterAccessory.prototype,
        'getCurrentPosition'
      ).rejects({})

      // eslint-disable-next-line no-new
      should(() => new Shelly2RollerShutterAccessory(log, device)).not.throw()
      getCurrentPosition.calledOnce.should.be.true()
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

    it('should update CurrentPosition', function(done) {
      const getCurrentPosition = sinon.stub(
        accessory,
        'getCurrentPosition'
      )

      accessory.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.CurrentPosition)
        .on('change', value => {
          value.should.equal(10)
          done()
        })

      getCurrentPosition.resolves(10)
      device.rollerState = 'open'
    })

    it('should handle failed requests', function() {
      const getCurrentPosition = sinon.stub(
        accessory,
        'getCurrentPosition'
      ).rejects({})

      should(() => accessory.rollerStateChangeHandler(60)).not.throw()
      getCurrentPosition.calledOnce.should.be.true()
    })
  })

  describe('#getCurrentPosition()', function() {
    it('should resolve with the current roller position', function() {
      return accessory.getCurrentPosition().should.be.fulfilledWith(40)
    })

    it('should reject when getStatus() rejects', async function() {
      const error = new Error()
      getStatus.reset()
      getStatus.rejects(error)

      try {
        await accessory.getCurrentPosition()
        'unreachable'.should.equal(1)
      } catch (e) {
        e.should.equal(error)
      }
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
