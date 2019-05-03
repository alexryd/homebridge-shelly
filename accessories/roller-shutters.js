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
      super(log, device, platformAccessory, {
        targetPosition: device.rollerPosition,
        _updatingTargetPosition: false,
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
        .setCharacteristic(
          Characteristic.CurrentPosition,
          this.device.rollerPosition
        )
        .setCharacteristic(
          Characteristic.TargetPosition,
          this.targetPosition
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

      d
        .on('change:rollerState', this.rollerStateChangeHandler, this)
        .on('change:rollerPosition', this.rollerPositionChangeHandler, this)
    }

    rollerStateChangeHandler(newValue) {
      this.log.debug(
        'Roller shutter state of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.PositionState)
        .setValue(positionStates.get(newValue))

      this._updateTargetPosition()
    }

    rollerPositionChangeHandler(newValue) {
      this.log.debug(
        'Roller position of device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.WindowCovering)
        .getCharacteristic(Characteristic.CurrentPosition)
        .setValue(newValue)

      this._updateTargetPosition()
    }

    _updateTargetPosition() {
      if (this._updatingTargetPosition) {
        return
      }
      this._updatingTargetPosition = true

      setImmediate(() => {
        const state = this.device.rollerState
        const position = this.device.rollerPosition
        let targetPosition = null

        if (state === 'stop') {
          targetPosition = position
        } else if (state === 'open' && this.targetPosition <= position) {
          // we don't know what the target position is here, but we set it
          // to 100 so that the interface shows that the roller is opening
          targetPosition = 100
        } else if (state === 'close' && this.targetPosition >= position) {
          // we don't know what the target position is here, but we set it
          // to 0 so that the interface shows that the roller is closing
          targetPosition = 0
        }

        if (targetPosition !== null && targetPosition !== this.targetPosition) {
          this.log.debug(
            'Setting target roller shutter position of device',
            this.device.type,
            this.device.id,
            'to',
            targetPosition
          )

          this.targetPosition = targetPosition

          this.platformAccessory
            .getService(Service.WindowCovering)
            .getCharacteristic(Characteristic.TargetPosition)
            .setValue(targetPosition)
        }

        this._updatingTargetPosition = false
      })
    }

    detach() {
      super.detach()

      this.device
        .removeListener(
          'change:rollerState',
          this.rollerStateChangeHandler,
          this
        )
        .removeListener(
          'change:rollerPosition',
          this.rollerPositionChangeHandler,
          this
        )
    }
  }

  return {
    Shelly2RollerShutterAccessory,
  }
}
