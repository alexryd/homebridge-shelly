const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service
  const ShellyAccessory = require('./base')(homebridge)

  const positionStates = new Map()
  positionStates.set('stop', Characteristic.PositionState.STOPPED)
  positionStates.set('open', Characteristic.PositionState.INCREASING)
  positionStates.set('close', Characteristic.PositionState.DECREASING)

  class Shelly2RollerShutterAccessory extends ShellyAccessory {
    constructor(log, device, platformAccessory = null) {
      super(log, device, platformAccessory)

      this.targetPosition = null

      this.getCurrentPosition()
        .then(position => {
          const coveringService = this.platformAccessory
            .getService(Service.WindowCovering)

          this.targetPosition = position

          coveringService
            .getCharacteristic(Characteristic.CurrentPosition)
            .setValue(position)

          coveringService
            .getCharacteristic(Characteristic.TargetPosition)
            .setValue(position)
        })
        .catch(e => {
          handleFailedRequest(
            log,
            device,
            e,
            'Failed to load current roller shutter position'
          )
        })
    }

    get name() {
      const d = this.device
      const n = d.type === 'SHSW-25' ? '2.5' : '2'
      return d.name || `Shelly ${n} ${d.id}`
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.WINDOW_COVERING
      pa.context.mode = 'roller'

      const coveringService = new Service.WindowCovering()
        .setCharacteristic(
          Characteristic.PositionState,
          positionStates.get(this.device.rollerState)
        )

      pa.addService(coveringService)

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      const d = this.device

      this.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.TargetPosition)
        .on('set', async (newValue, callback) => {
          if (newValue === this.targetPosition) {
            callback()
            return
          }

          this.log.debug(
            'Setting target roller shutter position of device',
            d.type,
            d.id,
            'to',
            newValue
          )

          try {
            await d.setRollerPosition(newValue)
            this.targetPosition = newValue
            callback()
          } catch (e) {
            handleFailedRequest(
              this.log,
              d,
              e,
              'Failed to set roller shutter position'
            )
            callback(e)
          }
        })

      d.on('change:rollerState', this.rollerStateChangeHandler, this)
    }

    rollerStateChangeHandler(newValue) {
      const d = this.device
      const coveringService = this.platformAccessory
        .getService(Service.WindowCovering)

      this.log.debug(
        'Roller shutter state of device',
        d.type,
        d.id,
        'changed to',
        newValue
      )

      coveringService
        .getCharacteristic(Characteristic.PositionState)
        .setValue(positionStates.get(newValue))

      this.getCurrentPosition()
        .then(position => {
          this.log.debug(
            'Setting current roller shutter position of device',
            d.type,
            d.id,
            'to',
            position
          )

          coveringService
            .getCharacteristic(Characteristic.CurrentPosition)
            .setValue(position)

          let targetPosition = null

          if (newValue === 'stop') {
            targetPosition = position
          } else if (newValue === 'open' && this.targetPosition <= position) {
            // we don't know what the target position is here, but we set it
            // to 100 so that the interface shows that the roller is opening
            targetPosition = 100
          } else if (newValue === 'close' && this.targetPosition >= position) {
            // we don't know what the target position is here, but we set it
            // to 0 so that the interface shows that the roller is closing
            targetPosition = 0
          }

          if (targetPosition !== null) {
            this.targetPosition = targetPosition

            coveringService
              .getCharacteristic(Characteristic.TargetPosition)
              .setValue(targetPosition)
          }
        })
        .catch(e => {
          handleFailedRequest(
            this.log,
            d,
            e,
            'Failed to load current roller shutter position'
          )
        })
    }

    async getCurrentPosition() {
      const status = await this.device.getStatus()
      return status.rollers[0].current_pos
    }

    detach() {
      super.detach()

      this.device
        .removeListener(
          'change:rollerState',
          this.rollerStateChangeHandler,
          this
        )
    }
  }

  return {
    Shelly2RollerShutterAccessory,
  }
}
