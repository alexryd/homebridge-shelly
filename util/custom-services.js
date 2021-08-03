
module.exports = homebridge => {
  const {
    ConsumptionCharacteristic,
    ElectricCurrentCharacteristic,
    VoltageCharacteristic,
  } = require('./custom-characteristics')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
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

  class TiltSensorService extends Service {
    constructor(displayName = 'Tilt Sensor', subtype = null) {
      super(displayName, TiltSensorService.UUID, subtype)

      this.addCharacteristic(Characteristic.CurrentTiltAngle)
    }
  }
  // use a random UUID
  TiltSensorService.UUID = 'DA2354B4-3C77-4EAF-BD37-AA0838B59513'

  return {
    PowerMeterService,
    TiltSensorService,
  }
}
