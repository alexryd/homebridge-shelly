const shellies = require('shellies')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const { ConsumptionCharacteristic } = require('./characteristics')(homebridge)
  const PlatformAccessory = homebridge.platformAccessory
  const Service = homebridge.hap.Service
  const uuid = homebridge.hap.uuid

  class ShellyAccessory {
    constructor(log, device, platformAccessory = null, props = null) {
      this.log = log
      this.device = device
      this.platformAccessory = platformAccessory

      if (props) {
        Object.assign(this, props)
      }

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
        .on('identify', this.identify.bind(this))

      this.device
        .on('online', () => { pa.updateReachability(true) })
        .on('offline', () => { pa.updateReachability(false) })
        .on('change:settings', this.updateSettings.bind(this))
    }

    identify(paired, callback) {
      this.log(
        'Device with ID',
        device.id,
        'and address',
        device.host,
        'identified'
      )
      callback()
    }
  }

  class ShellyRelayAccessory extends ShellyAccessory {
    constructor(log, device, index, powerMeterIndex = null,
      platformAccessory = null
    ) {
      super(log, device, platformAccessory, { index, powerMeterIndex })
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.SWITCH
      pa.context.index = this.index

      const switchService = new Service.Switch()
        .setCharacteristic(
          Characteristic.On,
          this.device['relay' + this.index]
        )

      if (this.powerMeterIndex !== null) {
        switchService.addCharacteristic(ConsumptionCharacteristic)
          .setValue(this.device['powerMeter' + this.powerMeterIndex])
      }

      pa.addService(switchService)

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      const d = this.device
      const onCharacteristic = this.platformAccessory
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)
        .on('set', async (newValue, callback) => {
          await d.setRelay(this.index, newValue)
          callback()
        })

      d.on('change:relay' + this.index, newValue => {
        onCharacteristic.setValue(newValue)
      })

      if (this.powerMeterIndex !== null) {
        d.on('change:powerMeter' + this.powerMeterIndex, newValue => {
          this.platformAccessory.getService(Service.Switch)
            .getCharacteristic(ConsumptionCharacteristic)
            .setValue(newValue)
        })
      }
    }

    async identify(paired, callback) {
      const currentState = this.device['relay' + this.index]
      await this.device.setRelay(this.index, !currentState)

      setTimeout(async () => {
        await this.device.setRelay(this.index, currentState)
        callback()
      }, 1000)
    }
  }

  class Shelly1RelayAccessory extends ShellyRelayAccessory {
    constructor(log, device, platformAccessory = null) {
      super(log, device, 0, null, platformAccessory)
    }

    get name() {
      const d = this.device
      return d.name || `Shelly1 ${d.id}`
    }
  }

  class Shelly2RelayAccessory extends ShellyRelayAccessory {
    constructor(log, device, index, platformAccessory = null) {
      const powerMeterIndex = device.type === 'SHSW-21' ? 0 : index
      super(log, device, index, powerMeterIndex, platformAccessory)
    }

    get name() {
      const d = this.device
      if (d.name) {
        return `${d.name} #${this.index}`
      } else {
        return `Shelly2 ${d.id} #${this.index}`
      }
    }
  }

  class Shelly4ProRelayAccessory extends ShellyRelayAccessory {
    constructor(log, device, index, platformAccessory = null) {
      super(log, device, index, index, platformAccessory)
    }

    get name() {
      const d = this.device
      if (d.name) {
        return `${d.name} #${this.index}`
      } else {
        return `Shelly4Pro ${d.id} #${this.index}`
      }
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
      const type = device.type
      let platformAccessories = null

      if (type === 'SHSW-1') {
        platformAccessories = [
          new Shelly1RelayAccessory(this.log, device).platformAccessory
        ]
      } else if (type === 'SHSW-21' || type === 'SHSW-22') {
        platformAccessories = [
          new Shelly2RelayAccessory(this.log, device, 0).platformAccessory,
          new Shelly2RelayAccessory(this.log, device, 1).platformAccessory,
        ]
      } else if (type === 'SHSW-44') {
        platformAccessories = [
          new Shelly4ProRelayAccessory(this.log, device, 0).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 1).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 2).platformAccessory,
          new Shelly4ProRelayAccessory(this.log, device, 3).platformAccessory,
        ]
      }

      if (platformAccessories) {
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

      const type = device.type

      if (type === 'SHSW-1') {
        new Shelly1RelayAccessory(this.log, device, platformAccessory)
      } else if (type === 'SHSW-21' || type === 'SHSW-22') {
        new Shelly2RelayAccessory(
          this.log,
          device,
          ctx.index,
          platformAccessory
        )
      } else if (type === 'SHSW-44') {
        new Shelly4ProRelayAccessory(
          this.log,
          device,
          ctx.index,
          platformAccessory
        )
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
