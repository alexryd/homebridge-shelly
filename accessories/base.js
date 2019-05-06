
module.exports = homebridge => {
  const Characteristic = homebridge.hap.Characteristic
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

    updateReachability() {
      this.platformAccessory.updateReachability(this.device.online)
    }

    setupEventHandlers() {
      this.platformAccessory
        .on('identify', this.identify.bind(this))

      this.device
        .on('online', this.updateReachability, this)
        .on('offline', this.updateReachability, this)
        .on('change:settings', this.updateSettings, this)
    }

    detach() {
      this.device
        .removeListener('online', this.updateReachability, this)
        .removeListener('offline', this.updateReachability, this)
        .removeListener('change:settings', this.updateSettings, this)
    }

    identify(paired, callback) {
      this.log.info(this.name, 'at', this.device.host, 'identified')
      callback()
    }
  }

  return ShellyAccessory
}
