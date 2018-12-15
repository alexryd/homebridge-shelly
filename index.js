const shellies = require('shellies')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const PlatformAccessory = homebridge.platformAccessory
  const Service = homebridge.hap.Service
  const uuid = homebridge.hap.uuid

  const createAccessory = (device, name) => {
    const accessory = new PlatformAccessory(name, uuid.generate(name))

    const infoService = accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, 'Shelly')
      .setCharacteristic(Characteristic.Model, device.type)
      .setCharacteristic(Characteristic.SerialNumber, device.id)

    if (device.settings && device.settings.fw) {
      infoService.setCharacteristic(
        Characteristic.FirmwareRevision,
        device.settings.fw
      )
    }

    if (device.settings && device.settings.hwinfo) {
      infoService.setCharacteristic(
        Characteristic.HardwareRevision,
        device.settings.hwinfo.hw_revision
      )
    }

    accessory.context = {
      type: device.type,
      id: device.id,
      host: device.host,
    }

    accessory.updateReachability(device.online)

    return accessory
  }

  const createShelly1RelayAccessory = device => {
    const accessory = createAccessory(
      device,
      device.name || `${device.type} ${device.id}`
    )

    accessory.category = Accessory.Categories.SWITCH

    accessory.addService(
      new Service.Switch()
        .setCharacteristic(Characteristic.On, device.relay0)
    )

    setupShelly1RelayHandlers(device, accessory)

    return accessory
  }

  const createAccessoriesForDevice = device => {
    let accessories = []

    if (device.type === 'SHSW-1') {
      accessories.push(createShelly1RelayAccessory(device))
    }

    return accessories
  }

  const setupShelly1RelayHandlers = (device, accessory) => {
    const onCharacteristic = accessory
      .getService(Service.Switch)
      .getCharacteristic(Characteristic.On)
      .on('set', async (newValue, callback) => {
        await device.setRelay(0, newValue)
        callback()
      })

    device.on('change:relay0', newValue => {
      onCharacteristic.setValue(newValue)
    })
  }

  const setupHandlersForAccessory = (device, accessory) => {
    device.on('online', () => { accessory.updateReachability(true) })
    device.on('offline', () => { accessory.updateReachability(false) })

    if (device.type === 'SHSW-1') {
      setupShelly1RelayHandlers(device, accessory)
    }
  }

  class ShellyPlatform {
    constructor(log, config, api) {
      this.log = log
      this.config = config
      this.api = api

      shellies.on('discover', this.discoverDeviceHandler.bind(this))
      this.api.on('didFinishLaunching', () => { shellies.start() })
    }

    discoverDeviceHandler(device) {
      const accessories = createAccessoriesForDevice(device)

      if (accessories.length > 0) {
        this.api.registerPlatformAccessories(
          'homebridge-shelly',
          'Shelly',
          accessories
        )
      }
    }

    async configureAccessory(accessory) {
      const ctx = accessory.context
      let device = shellies.getDevice(ctx.type, ctx.id)

      if (!device) {
        device = shellies.createDevice(ctx.type, ctx.id, ctx.host)
        shellies.addDevice(device)

        try {
          device.settings = await device.getSettings()
        } catch (e) {
          this.log(
            'Device with ID',
            device.id,
            'and address',
            device.host,
            'is unreachable'
          )
          device.online = false
        }
      }

      setupHandlersForAccessory(device, accessory)
    }
  }

  homebridge.registerPlatform(
    'homebridge-shelly',
    'Shelly',
    ShellyPlatform,
    true
  )
}
