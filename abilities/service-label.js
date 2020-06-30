
module.exports = homebridge => {
  const { Ability } = require('./base')(homebridge)
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service

  class ServiceLabelAbility extends Ability {
    /**
     * @param {string} namespace - The naming schema for the accessory. Must be
     * either "dots" or "arabicNumerals".
     */
    constructor(namespace = 'arabicNumerals') {
      super()

      if (namespace !== 'dots' && namespace !== 'arabicNumerals') {
        throw new Error(`Invalid namespace "${namespace}"`)
      }

      this.namespace = namespace
    }

    _setupPlatformAccessory() {
      super._setupPlatformAccessory()

      const SLN = Characteristic.ServiceLabelNamespace

      this.platformAccessory.addService(
        new Service.ServiceLabel()
          .setCharacteristic(
            SLN,
            this.namespace === 'dots' ? SLN.DOTS : SLN.ARABIC_NUMERALS
          )
      )
    }
  }

  return ServiceLabelAbility
}
