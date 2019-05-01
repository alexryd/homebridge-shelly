const colorConvert = require('color-convert')

const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service
  const ShellyAccessory = require('./base')(homebridge)

  class ShellyRGBW2ColorLightbulbAccessory extends ShellyAccessory {
    constructor(log, device, platformAccessory = null) {
      const hsv = colorConvert.rgb.hsv(device.red, device.green, device.blue)

      super(log, device, platformAccessory, {
        hue: hsv[0],
        saturation: hsv[1],
        _updatingDeviceColor: false,
        _updatingHueSaturation: false,
      })
    }

    get name() {
      const d = this.device
      return d.name || `Shelly RGBW2 ${d.id}`
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.LIGHTBULB
      pa.context.mode = 'color'

      pa.addService(
        new Service.Lightbulb()
          .setCharacteristic(
            Characteristic.On,
            this.device.colorSwitch
          )
          .setCharacteristic(
            Characteristic.Hue,
            this.hue
          )
          .setCharacteristic(
            Characteristic.Saturation,
            this.saturation
          )
          .setCharacteristic(
            Characteristic.Brightness,
            this.device.gain
          )
      )

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      const d = this.device
      const lightbulbService = this.platformAccessory
        .getService(Service.Lightbulb)

      lightbulbService
        .getCharacteristic(Characteristic.On)
        .on('set', async (newValue, callback) => {
          if (d.colorSwitch === newValue) {
            callback()
            return
          }

          try {
            this.log.debug(
              'Setting state of switch on device',
              d.type,
              d.id,
              'to',
              newValue
            )
            await d.setColor({
              colorSwitch: newValue,
            })
            callback()
          } catch (e) {
            handleFailedRequest(this.log, d, e, 'Failed to set switch state')
            callback(e)
          }
        })

      lightbulbService
        .getCharacteristic(Characteristic.Hue)
        .on('set', async (newValue, callback) => {
          if (this.hue === newValue) {
            callback()
            return
          }

          this.hue = newValue
          this._updateDeviceColor()
          callback()
        })

      lightbulbService
        .getCharacteristic(Characteristic.Saturation)
        .on('set', async (newValue, callback) => {
          if (this.saturation === newValue) {
            callback()
            return
          }

          this.saturation = newValue
          this._updateDeviceColor()
          callback()
        })

      lightbulbService
        .getCharacteristic(Characteristic.Brightness)
        .on('set', async (newValue, callback) => {
          if (this.device.gain === newValue) {
            callback()
            return
          }

          try {
            this.log.debug(
              'Setting gain on device',
              d.type,
              d.id,
              'to',
              newValue
            )
            await d.setColor({
              gain: newValue,
            })
            callback()
          } catch (e) {
            handleFailedRequest(this.log, d, e, 'Failed to set gain')
            callback(e)
          }
        })

      d
        .on('change:colorSwitch', this.changeSwitchHandler, this)
        .on('change:red', this.changeColorHandler, this)
        .on('change:green', this.changeColorHandler, this)
        .on('change:blue', this.changeColorHandler, this)
        .on('change:gain', this.changeGainHandler, this)
    }

    changeSwitchHandler(newValue) {
      this.log.debug(
        'Switch state on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .setValue(newValue)
    }

    changeColorHandler() {
      this._updateHueSaturation()
    }

    changeGainHandler(newValue) {
      this.log.debug(
        'Gain on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .setValue(newValue)
    }

    _updateDeviceColor() {
      if (this._updatingDeviceColor === true) {
        return
      }
      this._updatingDeviceColor = true

      setImmediate(async () => {
        try {
          const rgb = colorConvert.hsv.rgb(this.hue, this.saturation, 100)

          this.log.debug(
            'Setting color on device',
            this.device.type,
            this.device.id,
            'to',
            rgb
          )

          await this.device.setColor({
            red: rgb[0],
            green: rgb[1],
            blue: rgb[2],
          })
        } catch (e) {
          handleFailedRequest(this.log, this.device, e, 'Failed to set color')
        }

        this._updatingDeviceColor = false
      })
    }

    _updateHueSaturation() {
      if (this._updatingHueSaturation === true) {
        return
      }
      this._updatingHueSaturation = true

      setImmediate(() => {
        const d = this.device
        const hsv = colorConvert.rgb.hsv(d.red, d.green, d.blue)
        const lightbulbService = this.platformAccessory
          .getService(Service.Lightbulb)

        this.hue = hsv[0]
        this.saturation = hsv[1]

        this.log.debug(
          'Color on device',
          d.type,
          d.id,
          'changed to',
          [d.red, d.green, d.blue]
        )

        lightbulbService
          .getCharacteristic(Characteristic.Hue)
          .setValue(this.hue)

        lightbulbService
          .getCharacteristic(Characteristic.Saturation)
          .setValue(this.saturation)

        this._updatingHueSaturation = false
      })
    }

    detach() {
      super.detach()

      this.device
        .removeListener('change:colorSwitch', this.changeSwitchHandler, this)
        .removeListener('change:red', this.changeColorHandler, this)
        .removeListener('change:green', this.changeColorHandler, this)
        .removeListener('change:blue', this.changeColorHandler, this)
        .removeListener('change:gain', this.changeGainHandler, this)
    }
  }

  class ShellyRGBW2WhiteLightbulbAccessory extends ShellyAccessory {
    constructor(log, device, index, platformAccessory = null) {
      super(log, device, platformAccessory, { index })
    }

    get name() {
      const d = this.device
      if (d.name) {
        return `${d.name} #${this.index}`
      } else {
        return `Shelly RGBW2 ${d.id} #${this.index}`
      }
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.LIGHTBULB
      pa.context.mode = 'white'
      pa.context.index = this.index

      pa.addService(
        new Service.Lightbulb()
          .setCharacteristic(
            Characteristic.On,
            this.device['whiteSwitch' + this.index]
          )
          .setCharacteristic(
            Characteristic.Brightness,
            this.device['brightness' + this.index]
          )
      )

      return pa
    }

    setupEventHandlers() {
      super.setupEventHandlers()

      const d = this.device
      const i = this.index
      const lightbulbService = this.platformAccessory
        .getService(Service.Lightbulb)

      lightbulbService
        .getCharacteristic(Characteristic.On)
        .on('set', async (newValue, callback) => {
          if (d['whiteSwitch' + i] === newValue) {
            callback()
            return
          }

          try {
            this.log.debug(
              'Setting state of switch #' + i,
              'on device',
              d.type,
              d.id,
              'to',
              newValue
            )
            await d.setWhiteChannel(i, d['brightness' + i], newValue)
            callback()
          } catch (e) {
            handleFailedRequest(this.log, d, e, 'Failed to set switch state')
            callback(e)
          }
        })

      lightbulbService
        .getCharacteristic(Characteristic.Brightness)
        .on('set', async (newValue, callback) => {
          if (d['brightness' + i] === newValue) {
            callback()
            return
          }

          try {
            this.log.debug(
              'Setting brightness for channel #' + i,
              'on device',
              d.type,
              d.id,
              'to',
              newValue
            )
            await d.setWhiteChannel(i, newValue, d['whiteSwitch' + i])
            callback()
          } catch (e) {
            handleFailedRequest(this.log, d, e, 'Failed to set brightness')
            callback(e)
          }
        })

      d
        .on('change:whiteSwitch' + i, this.changeSwitchHandler, this)
        .on('change:brightness' + i, this.changeBrightnessHandler, this)
    }

    changeSwitchHandler(newValue) {
      this.log.debug(
        'State of switch #' + this.index,
        'on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .setValue(newValue)
    }

    changeBrightnessHandler(newValue) {
      this.log.debug(
        'Brightness of channel #' + this.index,
        'on device',
        this.device.type,
        this.device.id,
        'changed to',
        newValue
      )

      this.platformAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .setValue(newValue)
    }

    detach() {
      super.detach()

      this.device
        .removeListener(
          'change:whiteSwitch' + this.index,
          this.changeSwitchHandler,
          this
        )
        .removeListener(
          'change:brightness' + this.index,
          this.changeBrightnessHandler,
          this
        )
    }
  }

  return {
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
  }
}
