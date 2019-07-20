/* eslint-env mocha */

const shellies = require('shellies')
const should = require('should')

const Homebridge = require('../mocks/homebridge')
const log = require('../mocks/log')

const homebridge = new Homebridge()

const AccessoryFactory = require('../../accessories/factory')(homebridge)

describe('AccessoryFactory', function() {
  describe('#getDefaultAccessoryType()', function() {
    it('should return an accessory type', function() {
      AccessoryFactory.getDefaultAccessoryType('SHSW-1').should.equal('switch')
      AccessoryFactory.getDefaultAccessoryType('SHSW-25').should.equal('switch')
      AccessoryFactory.getDefaultAccessoryType('SHSW-25', 'roller')
        .should.equal('windowCovering')
    })

    it('should return null for unknown device types', function() {
      should(AccessoryFactory.getDefaultAccessoryType('UNKNOWN')).be.null()
    })
  })

  describe('#getAccessoryClass()', function() {
    it('should return an accessory class', function() {
      should(AccessoryFactory.getAccessoryClass('SHSW-1', 'switch')).be.ok()
    })

    it('should return null for unknown device types', function() {
      should(AccessoryFactory.getAccessoryClass('UNKNOWN', 'switch')).be.null()
    })
  })

  describe('#getAccessoryConfig()', function() {
    it('should return the config for the given index', function() {
      const config = { accessories: [{}, { foo: 'bar' }] }
      AccessoryFactory.getAccessoryConfig(config, 1).foo.should.equal('bar')
    })

    it('should merge accessory and device configs', function() {
      const accessoryConfig = { foo: 'bar' }
      const config = {
        accessories: [accessoryConfig],
        foo: 'baz',
        bar: 'baz'
      }
      const c = AccessoryFactory.getAccessoryConfig(config, 0)

      c.foo.should.equal('bar')
      c.bar.should.equal('baz')
    })

    it('should return an empty object for undefined configs', function() {
      AccessoryFactory.getAccessoryConfig({}, 0).should.be.empty()
    })
  })

  describe('#createAccessory()', function() {
    it('should create accessories for Shelly Bulb devices', function() {
      const device = shellies.createDevice('SHBLB-1', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly H&T devices', function() {
      const device = shellies.createDevice('SHHT-1', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly Plug devices', function() {
      const device = shellies.createDevice('SHPLG-1', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly Plug S devices', function() {
      const device = shellies.createDevice('SHPLG-S', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
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
        const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
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
        const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
        should(accessory).be.ok()
      }
    )

    it('should create accessories for Shelly Sense devices', function() {
      const device = shellies.createDevice('SHSEN-1', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly 1 devices', function() {
      const device = shellies.createDevice('SHSW-1', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
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
        const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
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
        const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
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
        const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
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
        const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
        should(accessory).be.ok()
      }
    )

    it('should create accessories for Shelly HD devices', function() {
      const device = shellies.createDevice('SHSW-22', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly 4Pro devices', function() {
      const device = shellies.createDevice('SHSW-44', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
      should(accessory).be.ok()
    })

    it('should create accessories for Shelly 1PM devices', function() {
      const device = shellies.createDevice('SHSW-PM', '192.168.1.2', 'ABC123')
      const accessory = AccessoryFactory.createAccessory(device, 0, {}, log)
      should(accessory).be.ok()
    })
  })

  describe('#createAccessories()', function() {
    it('should create an accessory', function() {
      const accessories = AccessoryFactory.createAccessories(
        shellies.createDevice('SHSW-1', 'ABC123', '192.168.1.2'),
        {},
        log
      )
      should(accessories).be.ok()
      accessories.length.should.equal(1)
      should(accessories[0]).be.ok()
    })

    it('should return null for unknown devices', function() {
      const accessories = AccessoryFactory.createAccessories(
        { type: 'UNKNOWN' },
        {},
        log
      )
      should(accessories).be.null()
    })

    it(
      'should create 4 accessories for Shelly RGBW2 devices in white mode',
      function() {
        const accessories = AccessoryFactory.createAccessories(
          shellies.createDevice('SHRGBW2', 'ABC123', '192.168.1.2', 'white'),
          {},
          log
        )
        accessories.length.should.equal(4)
      }
    )

    it(
      'should create 1 accessory for Shelly RGBW2 devices in color mode',
      function() {
        const accessories = AccessoryFactory.createAccessories(
          shellies.createDevice('SHRGBW2', 'ABC123', '192.168.1.2', 'color'),
          {},
          log
        )
        accessories.length.should.equal(1)
      }
    )

    it(
      'should create 1 accessory for Shelly 2 devices in roller mode',
      function() {
        const accessories = AccessoryFactory.createAccessories(
          shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2', 'roller'),
          {},
          log
        )
        accessories.length.should.equal(1)
      }
    )

    it(
      'should create 2 accessories for Shelly 2 devices in relay mode',
      function() {
        const accessories = AccessoryFactory.createAccessories(
          shellies.createDevice('SHSW-21', 'ABC123', '192.168.1.2', 'relay'),
          {},
          log
        )
        accessories.length.should.equal(2)
      }
    )

    it('should create 2 accessories for Shelly HD devices', function() {
      const accessories = AccessoryFactory.createAccessories(
        shellies.createDevice('SHSW-22', 'ABC123', '192.168.1.2'),
        {},
        log
      )
      accessories.length.should.equal(2)
    })

    it(
      'should create 1 accessory for Shelly 2.5 devices in roller mode',
      function() {
        const accessories = AccessoryFactory.createAccessories(
          shellies.createDevice('SHSW-25', 'ABC123', '192.168.1.2', 'roller'),
          {},
          log
        )
        accessories.length.should.equal(1)
      }
    )

    it(
      'should create 2 accessories for Shelly 2.5 devices in relay mode',
      function() {
        const accessories = AccessoryFactory.createAccessories(
          shellies.createDevice('SHSW-25', 'ABC123', '192.168.1.2', 'relay'),
          {},
          log
        )
        accessories.length.should.equal(2)
      }
    )

    it('should create 4 accessories for Shelly 4Pro devices', function() {
      const accessories = AccessoryFactory.createAccessories(
        shellies.createDevice('SHSW-44', 'ABC123', '192.168.1.2'),
        {},
        log
      )
      accessories.length.should.equal(4)
    })
  })
})
