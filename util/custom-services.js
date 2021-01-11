
module.exports = homebridge => {
  const {
    ConsumptionCharacteristic,
    ElectricCurrentCharacteristic,
    VoltageCharacteristic,
  } = require('./custom-characteristics')(homebridge)
  const Service = homebridge.hap.Service

  class PowerMeterService extends Service {
    constructor(displayName = 'Power Meter', subtype = null) {
      super(displayName, PowerMeterService.UUID, subtype)

      this.addCharacteristic(ConsumptionCharacteristic)
      this.addOptionalCharacteristic(ElectricCurrentCharacteristic)
      this.addOptionalCharacteristic(VoltageCharacteristic)
    }
  }
  // use a random UUID
  PowerMeterService.UUID = 'DEDBEA44-11ED-429C-BD75-9A2286AA8707'

  return {
    PowerMeterService,
  }
}
