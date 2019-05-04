const colorConvert = require('color-convert')

const { handleFailedRequest } = require('../error-handlers')

module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const Characteristic = homebridge.hap.Characteristic
  const Service = homebridge.hap.Service
  const ShellyAccessory = require('./base')(homebridge)

  class ShellyColorLightbulbAccessory extends ShellyAccessory {
    constructor(log, device, platformAccessory = null, props = null) {
      const hsv = colorConvert.rgb.hsv(device.red, device.green, device.blue)

      super(
        log,
        device,
        platformAccessory,
        Object.assign({
          hue: hsv[0],
          saturation: hsv[1],
          _updatingDeviceColor: false,
          _updatingHueSaturation: false,
        }, props)
      )
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.LIGHTBULB

      const lightbulbService = new Service.Lightbulb()
        .setCharacteristic(
          Characteristic.On,
          this.device.switch
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

      pa.addService(lightbulbService)

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
          if (d.switch === newValue) {
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
              switch: newValue,
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
        .on('change:switch', this.changeSwitchHandler, this)
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
        .removeListener('change:switch', this.changeSwitchHandler, this)
        .removeListener('change:red', this.changeColorHandler, this)
        .removeListener('change:green', this.changeColorHandler, this)
        .removeListener('change:blue', this.changeColorHandler, this)
        .removeListener('change:gain', this.changeGainHandler, this)
    }
  }

  class ShellyWhiteLightbulbAccessory extends ShellyAccessory {
    constructor(log, device, switchProperty = 'switch',
      brightnessProperty = 'brightness', platformAccessory = null,
      props = null) {
      super(
        log,
        device,
        platformAccessory,
        Object.assign({
          _switchProperty: switchProperty,
          _brightnessProperty: brightnessProperty,
        }, props)
      )
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()

      pa.category = Accessory.Categories.LIGHTBULB

      pa.addService(
        new Service.Lightbulb()
          .setCharacteristic(
            Characteristic.On,
            this.device[this._switchProperty]
          )
          .setCharacteristic(
            Characteristic.Brightness,
            this.device[this._brightnessProperty]
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
          if (d[this._switchProperty] === newValue) {
            callback()
            return
          }

          try {
            this.log.debug(
              'Setting state of',
              this._switchProperty,
              'on device',
              d.type,
              d.id,
              'to',
              newValue
            )
            await this.setSwitch(newValue)
            callback()
          } catch (e) {
            handleFailedRequest(this.log, d, e, 'Failed to set switch state')
            callback(e)
          }
        })

      lightbulbService
        .getCharacteristic(Characteristic.Brightness)
        .on('set', async (newValue, callback) => {
          if (d[this._brightnessProperty] === newValue) {
            callback()
            return
          }

          try {
            this.log.debug(
              'Setting',
              this._brightnessProperty,
              'on device',
              d.type,
              d.id,
              'to',
              newValue
            )
            await this.setBrightness(newValue)
            callback()
          } catch (e) {
            handleFailedRequest(this.log, d, e, 'Failed to set brightness')
            callback(e)
          }
        })

      d
        .on(`change:${this._switchProperty}`, this.changeSwitchHandler, this)
        .on(
          `change:${this._brightnessProperty}`,
          this.changeBrightnessHandler,
          this
        )
    }

    changeSwitchHandler(newValue) {
      this.log.debug(
        'State of',
        this._switchProperty,
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
        this._brightnessProperty,
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
          `change:${this._switchProperty}`,
          this.changeSwitchHandler,
          this
        )
        .removeListener(
          `change:${this._brightnessProperty}`,
          this.changeBrightnessHandler,
          this
        )
    }

    setSwitch(newValue) {
      // subclasses should override this
    }

    setBrightness(newValue) {
      // subclasses should override this
    }
  }

  class ShellyRGBW2ColorLightbulbAccessory
    extends ShellyColorLightbulbAccessory {
    get name() {
      const d = this.device
      return d.name || `Shelly RGBW2 ${d.id}`
    }

    createPlatformAccessory() {
      const pa = super.createPlatformAccessory()
      pa.context.mode = 'color'
      return pa
    }
  }

  class ShellyRGBW2WhiteLightbulbAccessory
    extends ShellyWhiteLightbulbAccessory {
    constructor(log, device, index, platformAccessory = null) {
      super(
        log,
        device,
        `switch${index}`,
        `brightness${index}`,
        platformAccessory,
        { index }
      )
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
      pa.context.mode = 'white'
      pa.context.index = this.index
      return pa
    }

    setSwitch(newValue) {
      return this.device.setWhiteChannel(
        this.index,
        this.device[this._brightnessProperty],
        newValue
      )
    }

    setBrightness(newValue) {
      return this.device.setWhiteChannel(
        this.index,
        newValue,
        this.device[this._switchProperty]
      )
    }
  }

  return {
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
  }
}
