const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const {
    ConsumptionCharacteristic
  } = require('../characteristics')(homebridge)
  const Service = homebridge.hap.Service
  const ShellyAccessory = require('./base')(homebridge)

  class ShellySwitchAccessory extends ShellyAccessory {
    constructor(device, index, config, log, platformAccessory = null,
      powerMeterIndex = null, props = null
    ) {
      super(
        'switch',
        device,
        index,
        config,
        log,
        platformAccessory,
        Object.assign({ powerMeterIndex }, props)
      )
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.SWITCH

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

    identify(paired, callback) {
      super.identify(paired, async () => {
        const d = this.device
        const currentState = d['relay' + this.index]

        try {
          await d.setRelay(this.index, !currentState)
          await new Promise(resolve => setTimeout(resolve, 1000))
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
      })
    }
  }

  class Shelly1SwitchAccessory extends ShellySwitchAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(device, index, config, log, platformAccessory)
    }

    get name() {
      const d = this.device
      const c = this.config

      return c.name || d.name || `Shelly 1 ${d.id}`
    }
  }

  class Shelly1PMSwitchAccessory extends ShellySwitchAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(device, index, config, log, platformAccessory, index)
    }

    get name() {
      const d = this.device
      const c = this.config

      return c.name || d.name || `Shelly 1PM ${d.id}`
    }
  }

  class Shelly2SwitchAccessory extends ShellySwitchAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(
        device,
        index,
        config,
        log,
        platformAccessory,
        // Shelly 2 has a single power meter
        device.type === 'SHSW-21' ? 0 : index
      )
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()
      pa.context.mode = 'relay'
      return pa
    }

    get name() {
      const d = this.device
      const c = this.config
      if (c.name) {
        return c.name
      }
      if (d.name) {
        return `${d.name} #${this.index}`
      } else {
        const n = d.type === 'SHSW-25' ? '2.5' : '2'
        return `Shelly ${n} ${d.id} #${this.index}`
      }
    }
  }

  class Shelly4ProSwitchAccessory extends ShellySwitchAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(device, index, config, log, platformAccessory, index)
    }

    get name() {
      const d = this.device
      if (d.name) {
        return `${d.name} #${this.index}`
      } else {
        return `Shelly 4Pro ${d.id} #${this.index}`
      }
    }
  }

  class ShellyEMSwitchAccessory extends ShellySwitchAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(device, index, config, log, platformAccessory, index)
    }

    get name() {
      const d = this.device
      return d.name || `Shelly EM ${d.id}`
    }
  }

  class ShellyHDSwitchAccessory extends ShellySwitchAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(device, index, config, log, platformAccessory, index)
    }

    get name() {
      const d = this.device
      if (d.name) {
        return `${d.name} #${this.index}`
      } else {
        return `Shelly HD ${d.id} #${this.index}`
      }
    }
  }

  class ShellyPlugSwitchAccessory extends ShellySwitchAccessory {
    constructor(device, index, config, log, platformAccessory = null) {
      super(device, index, config, log, platformAccessory, index)
    }

    get name() {
      const d = this.device
      const n = d.type === 'SHPLG-S' ? 'Plug S' : 'Plug'
      return d.name || `Shelly ${n} ${d.id}`
    }
  }

  return {
    ShellySwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly1PMSwitchAccessory,
    Shelly2SwitchAccessory,
    Shelly4ProSwitchAccessory,
    ShellyEMSwitchAccessory,
    ShellyHDSwitchAccessory,
    ShellyPlugSwitchAccessory,
  }
}
