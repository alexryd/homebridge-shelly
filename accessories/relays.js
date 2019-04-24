const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const {
    ConsumptionCharacteristic
  } = require('../characteristics')(homebridge)
  const Service = homebridge.hap.Service
  const ShellyAccessory = require('./base')(homebridge)

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

      this.platformAccessory
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)
        .on('set', async (newValue, callback) => {
          if (d['relay' + this.index] === newValue) {
            callback()
            return
          }

          try {
            this.log.debug(
              'Setting state of relay #' + this.index,
              'on device',
              d.type,
              d.id,
              'to',
              newValue
            )
            await d.setRelay(this.index, newValue)
            callback()
          } catch (e) {
            handleFailedRequest(this.log, d, e, 'Failed to set relay state')
            callback(e)
          }
        })

      d.on('change:relay' + this.index, this.relayChangeHandler, this)

      if (this.powerMeterIndex !== null) {
        d.on(
          'change:powerMeter' + this.powerMeterIndex,
          this.powerMeterChangeHandler,
          this
        )
      }
    }

    relayChangeHandler(newValue) {
      this.log.debug(
        'State of relay #' + this.index,
        'on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.Switch)
        .getCharacteristic(Characteristic.On)
        .setValue(newValue)
    }

    powerMeterChangeHandler(newValue) {
      this.log.debug(
        'Power meter #' + this.powerMeterIndex,
        'on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory.getService(Service.Switch)
        .getCharacteristic(ConsumptionCharacteristic)
        .setValue(newValue)
    }

    detach() {
      super.detach()

      this.device
        .removeListener(
          'change:relay' + this.index,
          this.relayChangeHandler,
          this
        )
        .removeListener(
          'change:powerMeter' + this.powerMeterIndex,
          this.powerMeterChangeHandler,
          this
        )
    }

    async identify(paired, callback) {
      const d = this.device
      const currentState = d['relay' + this.index]

      this.log.info(
        'Relay #' + this.index,
        'on device',
        d.type,
        d.id,
        'at',
        d.host,
        'identified'
      )

      try {
        await d.setRelay(this.index, !currentState)
      } catch (e) {
        handleFailedRequest(
          this.log,
          d,
          e,
          'Failed to identify device'
        )
        callback(e)
        return
      }

      setTimeout(async () => {
        try {
          await d.setRelay(this.index, currentState)
          callback()
        } catch (e) {
          handleFailedRequest(
            this.log,
            d,
            e,
            'Failed to identify device'
          )
          callback(e)
        }
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

  class Shelly1PMRelayAccessory extends ShellyRelayAccessory {
    constructor(log, device, platformAccessory = null) {
      super(log, device, 0, 0, platformAccessory)
    }

    get name() {
      const d = this.device
      return d.name || `Shelly 1PM ${d.id}`
    }
  }

  class Shelly2RelayAccessory extends ShellyRelayAccessory {
    constructor(log, device, index, platformAccessory = null) {
      const powerMeterIndex = device.type === 'SHSW-21' ? 0 : index
      super(log, device, index, powerMeterIndex, platformAccessory)
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()
      pa.context.mode = 'relay'
      return pa
    }

    get name() {
      const d = this.device
      if (d.name) {
        return `${d.name} #${this.index}`
      } else {
        return `${d.type} ${d.id} #${this.index}`
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

  class ShellyPlugRelayAccessory extends ShellyRelayAccessory {
    constructor(log, device, platformAccessory = null) {
      super(log, device, 0, 0, platformAccessory)
    }

    get name() {
      const d = this.device
      const n = d.type === 'SHPLG2-1' ? 'Plug S' : 'Plug'
      return d.name || `Shelly ${n} ${d.id}`
    }
  }

  return {
    ShellyRelayAccessory,
    Shelly1RelayAccessory,
    Shelly1PMRelayAccessory,
    Shelly2RelayAccessory,
    Shelly4ProRelayAccessory,
    ShellyPlugRelayAccessory,
  }
}
