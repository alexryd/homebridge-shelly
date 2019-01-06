/* eslint-env mocha */

require('should')

const Homebridge = require('./mocks/homebridge')
const log = require('./mocks/log')

const homebridge = new Homebridge()
const ShellyPlatform = require('../platform')(homebridge)

describe('ShellyPlatform', function() {
  it('loads properly with a homebridge mock', function() {
    const platform = new ShellyPlatform(log, {})
    platform.deviceWrappers.size.should.equal(0)
  })
})
