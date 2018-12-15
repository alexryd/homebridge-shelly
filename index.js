const shellies = require('shellies')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const PlatformAccessory = homebridge.platformAccessory
  const Service = homebridge.hap.Service
  const UUIDGen = homebridge.hap.uuid

  class ShellyPlatform {
    constructor(log, config, api) {
      this.log = log
      this.config = config
      this.api = api

      shellies.on('discover', this.discoverDeviceHandler.bind(this))
      this.api.on('didFinishLaunching', () => { shellies.start() })
    }

    discoverDeviceHandler(device) {
      const accessory = this.createAccessory(device)
      this.api.registerPlatformAccessories(
        'homebridge-shelly',
        'Shelly',
        [accessory]
      )
    }

    createAccessory(device) {
      const name = device.name || `${device.type} ${device.id}`
      const accessory = new PlatformAccessory(
        name,
        UUIDGen.generate(name),
        Accessory.Categories.SWITCH
      )

      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, 'Shelly')
        .setCharacteristic(Characteristic.Model, device.type)
        .setCharacteristic(Characteristic.SerialNumber, device.id)
        .setCharacteristic(Characteristic.FirmwareRevision, device.settings.fw)

      accessory.addService(
        new Service.Switch()
          .setCharacteristic(Characteristic.On, true)
      )

      accessory.context = {
        type: device.type,
        id: device.id,
        host: device.host,
      }

      return accessory
    }

    async configureAccessory(accessory) {
      const ctx = accessory.context
      const device = shellies.createDevice(ctx.type, ctx.id, ctx.host)

      shellies.addDevice(device)

      try {
        device.settings = await device.getSettings()
      } catch (e) {
        this.log(
          'Device with ID',
          device.id,
          'and address',
          device.host,
          'unreachable'
        )
        device.online = false
      }
    }
  }

  homebridge.registerPlatform(
    'homebridge-shelly',
    'Shelly',
    ShellyPlatform,
    true
  )
}
