const shellies = require('shellies')

const { handleFailedRequest } = require('./error-handlers')

module.exports = homebridge => {
  const {
    Shelly1PMSwitchAccessory,
    Shelly1SwitchAccessory,
    Shelly2SwitchAccessory,
    Shelly2WindowCoveringAccessory,
    Shelly4ProSwitchAccessory,
    ShellyBulbColorLightbulbAccessory,
    ShellyHDSwitchAccessory,
    ShellyHTAccessory,
    ShellyPlugSwitchAccessory,
    ShellyRGBW2ColorLightbulbAccessory,
    ShellyRGBW2WhiteLightbulbAccessory,
    ShellySenseAccessory,
  } = require('./accessories')(homebridge)

  class DeviceWrapper {
    constructor(platform, device, config, ...accessories) {
      this.platform = platform
      this.device = device
      this.config = config || {}
      this.accessories = accessories

      if (config && config.username && config.password) {
        device.setAuthCredentials(config.username, config.password)
      }

      device
        .on('online', this.deviceOnlineHandler, this)
        .on('offline', this.deviceOfflineHandler, this)
        .on('change:host', this.changeHostHandler, this)
        .on('change:mode', this.changeModeHandler, this)

      if (device.online) {
        this.loadSettings()
      }
    }

    get platformAccessories() {
      return this.accessories.map(a => a.platformAccessory)
    }

    deviceOnlineHandler() {
      this.platform.log.debug(
        'Device',
        this.device.type,
        this.device.id,
        'came online'
      )

      this.loadSettings()
    }

    deviceOfflineHandler() {
      this.platform.log.debug(
        'Device',
        this.device.type,
        this.device.id,
        'went offline'
      )
    }

    changeHostHandler(newValue, oldValue) {
      this.platform.log.debug(
        'Device',
        this.device.type,
        this.device.id,
        'changed host from',
        oldValue,
        'to',
        newValue
      )

      homebridge.updatePlatformAccessories(this.platformAccessories)
    }

    changeModeHandler(newValue, oldValue) {
      this.platform.log.debug(
        'Device',
        this.device.type,
        this.device.id,
        'changed mode from',
        oldValue,
        'to',
        newValue
      )

      // re-add the device since we need to replace its accessories
      this.platform.removeDevice(this.device)
      this.platform.addDevice(this.device)
    }

    loadSettings() {
      const d = this.device

      if (!d.settings) {
        this.platform.log.debug('Loading settings for device', d.type, d.id)

        d.getSettings()
          .then(settings => {
            d.settings = settings
          })
          .catch(error => {
            handleFailedRequest(
              this.platform.log,
              d,
              error,
              'Failed to load device settings'
            )
            d.online = false
          })
      }
    }

    destroy() {
      this.device
        .removeListener('online', this.deviceOnlineHandler, this)
        .removeListener('offline', this.deviceOfflineHandler, this)
        .removeListener('change:host', this.changeHostHandler, this)
        .removeListener('change:mode', this.changeModeHandler, this)

      for (const accessory of this.accessories) {
        accessory.detach()
      }
      this.accessories.length = 0
    }
  }

  class ShellyPlatform {
    constructor(log, config) {
      this.log = log
      this.config = config
      this.deviceConfigs = new Map()
      this.deviceWrappers = new Map()

      this.configure()

      shellies
        .on('discover', this.discoverDeviceHandler, this)
        .on('stale', this.deviceStaleHandler, this)

      homebridge.on('didFinishLaunching', () => {
        const num = this.deviceWrappers.size
        this.log.info(
          `${num} ${num === 1 ? 'device' : 'devices'} loaded from cache`
        )

        shellies.start(config.networkInterface)
      })
    }

    configure() {
      const config = this.config

      if (config.username && config.password) {
        shellies.setAuthCredentials(config.username, config.password)
      }

      if (typeof config.requestTimeout === 'number') {
        shellies.request.timeout(config.requestTimeout)
      }

      if (typeof config.staleTimeout === 'number') {
        shellies.staleTimeout = config.staleTimeout
      }

      if (Array.isArray(config.devices)) {
        for (const c of config.devices) {
          let id = c.id
          if (!id) {
            continue
          }

          id = id.toUpperCase().trim()

          this.deviceConfigs.set(id, c)
        }
      }
    }

    getDeviceConfig(device) {
      return this.deviceConfigs.get(device.id) || {}
    }

    discoverDeviceHandler(device, unknown) {
      if (this.getDeviceConfig(device).exclude) {
        this.log.info(
          'Excluding device',
          device.type,
          device.id,
          'at',
          device.host,
        )
        return
      }

      if (!unknown) {
        this.log.info(
          'New device discovered:',
          device.type,
          device.id,
          'at',
          device.host
        )

        if (!this.addDevice(device)) {
          this.log.info('Unknown device, so skipping it')
        }
      } else {
        this.log.info(
          'Unknown device',
          device.type,
          device.id,
          'at',
          device.host,
          'discovered'
        )
      }
    }

    deviceStaleHandler(device) {
      this.log.info(
        'Device',
        device.type,
        device.id,
        'is stale. Unregistering its accessories.'
      )

      this.removeDevice(device)
    }

    addDevice(device) {
      const accessories = this.createAccessoriesForDevice(device)

      if (accessories && accessories.length > 0) {
        const deviceWrapper = new DeviceWrapper(
          this,
          device,
          this.getDeviceConfig(device),
          ...accessories
        )

        this.deviceWrappers.set(device, deviceWrapper)

        homebridge.registerPlatformAccessories(
          'homebridge-shelly',
          'Shelly',
          deviceWrapper.platformAccessories
        )

        return deviceWrapper
      }

      return null
    }

    removeDevice(device) {
      const deviceWrapper = this.deviceWrappers.get(device)
      if (!deviceWrapper) {
        return
      }

      homebridge.unregisterPlatformAccessories(
        'homebridge-shelly',
        'Shelly',
        deviceWrapper.platformAccessories
      )

      deviceWrapper.destroy()
      this.deviceWrappers.delete(device)
    }

    configureAccessory(platformAccessory) {
      const ctx = platformAccessory.context

      this.log.debug(
        'Configuring cached accessory for device',
        ctx.type,
        ctx.id
      )

      let device = shellies.getDevice(ctx.type, ctx.id)

      if (!device) {
        device = shellies.createDevice(ctx.type, ctx.id, ctx.host, ctx.mode)
        shellies.addDevice(device)
      }

      let deviceWrapper = this.deviceWrappers.get(device)

      if (!deviceWrapper) {
        deviceWrapper = new DeviceWrapper(
          this,
          device,
          this.getDeviceConfig(device)
        )
        this.deviceWrappers.set(device, deviceWrapper)
      }

      const accessory = this.createAccessory(device, platformAccessory, ctx)

      if (accessory) {
        deviceWrapper.accessories.push(accessory)
      }
    }

    createAccessoriesForDevice(device) {
      const type = device.type
      const mode = device.mode

      const multiple = num => {
        return Array.from(
          { length: num },
          (_, i) => this.createAccessory(device, null, { index: i })
        )
      }

      if (type === 'SHRGBW2' && mode === 'white') {
        return multiple(4)
      } else if (type === 'SHSW-21' && mode !== 'roller') {
        return multiple(2)
      } else if (type === 'SHSW-22') {
        return multiple(2)
      } else if (type === 'SHSW-25' && mode !== 'roller') {
        return multiple(2)
      } else if (type === 'SHSW-44') {
        return multiple(4)
      }

      const accessory = this.createAccessory(device, null, {})
      if (accessory) {
        return [accessory]
      }

      return null
    }

    createAccessory(device, pa, ctx) {
      const log = this.log
      const config = this.getDeviceConfig(device)

      switch (device.type) {
        case 'SHBLB-1':
          return new ShellyBulbColorLightbulbAccessory(log, device, pa)
        case 'SHHT-1':
          return new ShellyHTAccessory(log, device, pa)
        case 'SHPLG-1':
        case 'SHPLG-S':
        case 'SHPLG2-1':
          return new ShellyPlugSwitchAccessory(log, device, pa)
        case 'SHRGBW2':
          if (device.mode === 'white') {
            return new ShellyRGBW2WhiteLightbulbAccessory(
              log,
              device,
              ctx.index,
              pa
            )
          } else {
            return new ShellyRGBW2ColorLightbulbAccessory(
              log,
              device,
              config.colorMode,
              pa
            )
          }
        case 'SHSEN-1':
          return new ShellySenseAccessory(log, device, pa)
        case 'SHSW-1':
          return new Shelly1SwitchAccessory(log, device, pa)
        case 'SHSW-21':
        case 'SHSW-25':
          if (device.mode === 'roller') {
            return new Shelly2WindowCoveringAccessory(log, device, pa)
          } else {
            return new Shelly2SwitchAccessory(log, device, ctx.index, pa)
          }
        case 'SHSW-22':
          return new ShellyHDSwitchAccessory(log, device, ctx.index, pa)
        case 'SHSW-44':
          return new Shelly4ProSwitchAccessory(log, device, ctx.index, pa)
        case 'SHSW-PM':
          return new Shelly1PMSwitchAccessory(log, device, pa)
      }

      return null
    }
  }

  ShellyPlatform.DeviceWrapper = DeviceWrapper

  return ShellyPlatform
}
