/* eslint-env mocha */

const Homebridge = require('./mocks/homebridge')

const homebridge = new Homebridge()

const {
  ConsumptionCharacteristic
} = require('../util/custom-characteristics')(homebridge)

describe('ConsumptionCharacteristic', function() {
  describe('#constructor()', function() {
    it('should set a name and UUID', function() {
      const char = new ConsumptionCharacteristic()
      char.displayName.should.be.ok()
      char.UUID.should.be.ok()
    })

    it('should set its properties', function() {
      const char = new ConsumptionCharacteristic()
      char.props.should.be.ok()
      char.props.format.should.be.ok()
      char.props.perms.should.be.ok()
    })
  })
})
