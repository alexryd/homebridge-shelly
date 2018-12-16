const shellies = require('shellies')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const PlatformAccessory = homebridge.platformAccessory
  const Service = homebridge.hap.Service
  const uuid = homebridge.hap.uuid

  class ShellyAccessory {
    constructor(device, platformAccessory = null) {
      this.device = device
      this.platformAccessory = platformAccessory

      if (!this.platformAccessory) {
        this.platformAccessory = this.createPlatformAccessory()
      }

      this.updateSettings()
      this.setupEventHandlers()
    }

    get name() {
      const d = this.device
      return d.name || `${d.type} ${d.id}`
    }

    createPlatformAccessory() {
      const d = this.device
      const pa = new PlatformAccessory(
        this.name,
        uuid.generate(this.name)
      )

      pa.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, 'Shelly')
        .setCharacteristic(Characteristic.Model, d.type)
        .setCharacteristic(Characteristic.SerialNumber, d.id)

      pa.context = {
        type: d.type,
        id: d.id,
        host: d.host,
      }

      pa.updateReachability(d.online)

      return pa
    }

    updateSettings() {
      const d = this.device
      const infoService = this.platformAccessory
        .getService(Service.AccessoryInformation)

      if (d.settings && d.settings.fw) {
        const fw = d.settings.fw
        const m = fw.match(/v([0-9]+(?:\.[0-9]+)*)/)
        infoService.setCharacteristic(
          Characteristic.FirmwareRevision,
          m !== null ? m[1] : fw
        )
      }

      if (d.settings && d.settings.hwinfo) {
        infoService.setCharacteristic(
          Characteristic.HardwareRevision,
          d.settings.hwinfo.hw_revision
        )
      }
    }

    setupEventHandlers() {
      const pa = this.platformAccessory

      this.device
        .on('online', () => { pa.updateReachability(true) })
        .on('offline', () => { pa.updateReachability(false) })
        .on('change:settings', this.updateSettings.bind(this))
    }
  }

  class Shelly1RelayAccessory extends ShellyAccessory {
    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.SWITCH

      pa.addService(
        new Service.Switch()
          .setCharacteristic(Characteristic.On, this.device.relay0)
      )

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      const d = this.device
      const onCharacteristic = this.platformAccessory
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)
        .on('set', async (newValue, callback) => {
          await d.setRelay(0, newValue)
          callback()
        })

      d.on('change:relay0', newValue => {
        onCharacteristic.setValue(newValue)
      })
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
      const platformAccessories = []

      if (device.type === 'SHSW-1') {
        const accessory = new Shelly1RelayAccessory(device)
        platformAccessories.push(accessory.platformAccessory)
      }

      if (platformAccessories.length > 0) {
        this.api.registerPlatformAccessories(
          'homebridge-shelly',
          'Shelly',
          platformAccessories
        )
      }
    }

    async configureAccessory(platformAccessory) {
      const ctx = platformAccessory.context
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

      if (device.type === 'SHSW-1') {
        new Shelly1RelayAccessory(device, platformAccessory)
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
