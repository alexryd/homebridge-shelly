
module.exports = homebridge => {
  const Characteristic = homebridge.hap.Characteristic

  class ConsumptionCharacteristic extends Characteristic {
    constructor() {
      super('Consumption', ConsumptionCharacteristic.UUID)
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'W',
        minValue: 0,
        maxValue: 65535,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      })
      this.value = this.getDefaultValue()
    }
  }
  ConsumptionCharacteristic.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52'

  return {
    ConsumptionCharacteristic,
  }
}
