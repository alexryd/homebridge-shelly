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
  ConsumptionCharacteristic
} = require('../../characteristics')(homebridge)
const {
  ShellySwitchAccessory,
  Shelly1PMSwitchAccessory,
  Shelly1SwitchAccessory,
  Shelly2SwitchAccessory,
  Shelly4ProSwitchAccessory,
  ShellyHDSwitchAccessory,
  ShellyPlugSwitchAccessory,
} = require('../../accessories/switches')(homebridge)

describe('ShellySwitchAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-25', 'ABC123', '192.168.1.2')
    accessory = new ShellySwitchAccessory(device, 1, {}, log, null, 1)
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
        const a = new ShellySwitchAccessory(device, 0, {}, log)
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
    it(
      'should not set the relay state when it has not changed',
      function(done) {
        const setRelay = sinon.stub(device, 'setRelay').resolves()

        device['relay' + accessory.index].should.be.false()

        accessory.platformAccessory
          .getService(Service.Switch)
          .getCharacteristic(Characteristic.On)
          .emit('set', false, e => {
            setRelay.called.should.be.false()
            should.not.exist(e)
            done()
          })
      }
    )

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
  })

  describe('#relayChangeHandler()', function() {
    it('should update On when the relay state is changed', function() {
      const on = accessory.platformAccessory
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)

      device['relay' + accessory.index] = true
      on.value.should.be.true()

      device['relay' + accessory.index] = false
      on.value.should.be.false()
    })
  })

  describe('#powerMeterChangeHandler()', function() {
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

  describe('#detach()', function() {
    it('should remove all event listeners from the device', function() {
      device.eventNames().length.should.not.equal(0)
      accessory.detach()
      device.eventNames().length.should.equal(0)
    })
  })
})

describe('Shelly1SwitchAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2')
    accessory = new Shelly1SwitchAccessory(device, 0, {}, log)
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

describe('Shelly1PMSwitchAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-PM', 'ABC123', '192.168.1.2')
    accessory = new Shelly1PMSwitchAccessory(device, 0, {}, log)
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

describe('Shelly2SwitchAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2')
    accessory = new Shelly2SwitchAccessory(device, 0, {}, log)
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

describe('Shelly4ProSwitchAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-44', 'ABC123', '192.168.1.2')
    accessory = new Shelly4ProSwitchAccessory(device, 0, {}, log)
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

describe('ShellyHDSwitchAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHSW-22', 'ABC123', '192.168.1.2')
    accessory = new ShellyHDSwitchAccessory(device, 0, {}, log)
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

describe('ShellyPlugSwitchAccessory', function() {
  let device = null
  let accessory = null

  beforeEach(function() {
    device = shellies.createDevice('SHPLG-1', 'ABC123', '192.168.1.2')
    accessory = new ShellyPlugSwitchAccessory(device, 0, {}, log)
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
