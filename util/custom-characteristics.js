
module.exports = homebridge => {
  const Characteristic = homebridge.hap.Characteristic

  const Formats = Characteristic.Formats
  const Perms = Characteristic.Perms

  class ConsumptionCharacteristic extends Characteristic {
    constructor() {
      super('Consumption', ConsumptionCharacteristic.UUID)
      this.setProps({
        format: Formats.FLOAT,
        unit: 'W',
        minValue: 0,
        maxValue: 65535,
        minStep: 0.1,
        perms: [Perms.READ, Perms.NOTIFY],
      })
      this.value = this.getDefaultValue()
    }
  }
  ConsumptionCharacteristic.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52'

  class TotalConsumptionCharacteristic extends Characteristic {
    constructor() {
      super('Total Consumption', TotalConsumptionCharacteristic.UUID)
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        minValue: 0,
        minStep: 0.001,
        perms: [Perms.READ, Perms.NOTIFY],
      })
      this.value = this.getDefaultValue()
    }
  }
  TotalConsumptionCharacteristic.UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52'

  class ElectricCurrentCharacteristic extends Characteristic {
    constructor() {
      super('Electric Current', ElectricCurrentCharacteristic.UUID)
      this.setProps({
        format: Formats.FLOAT,
        unit: 'A',
        perms: [Perms.READ, Perms.NOTIFY],
      })
      this.value = this.getDefaultValue()
    }
  }
  ElectricCurrentCharacteristic.UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52'

  class VoltageCharacteristic extends Characteristic {
    constructor() {
      super('Voltage', VoltageCharacteristic.UUID)
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        perms: [Perms.READ, Perms.NOTIFY],
      })
      this.value = this.getDefaultValue()
    }
  }
  VoltageCharacteristic.UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52'

  return {
    ConsumptionCharacteristic,
    TotalConsumptionCharacteristic,
    ElectricCurrentCharacteristic,
    VoltageCharacteristic,
  }
}
