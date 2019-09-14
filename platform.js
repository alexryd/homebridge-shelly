const shellies = require('shellies')

const AdminServer = require('./admin')

module.exports = homebridge => {
  const AccessoryFactory = require('./accessories/factory')(homebridge)
  const DeviceWrapper = require('./device-wrapper')(homebridge)

  class ShellyPlatform {
    constructor(log, config) {
      this.log = log
      this.config = config || {}
      this.deviceConfigs = new Map()
      this.deviceWrappers = new Map()
      this.stalePlatformAccessories = new Set()
      this.adminServer = null

      this.configure()

      shellies
        .on('discover', this.discoverDeviceHandler, this)
        .on('stale', this.deviceStaleHandler, this)

      homebridge.on('didFinishLaunching', () => {
        const num = Array.from(this.deviceWrappers.values()).reduce(
          (n, dw) => n + dw.platformAccessories.length,
          0
        )
        this.log.info(
          `${num} ${num === 1 ? 'accessory' : 'accessories'} loaded from cache`
        )

        this.handleStalePlatformAccessories()
        shellies.start(this.config.networkInterface)

        if (!this.config.admin || this.config.admin.enabled !== false) {
          // start the admin server
          this.adminServer = new AdminServer(this, this.config.admin || {}, log)
          this.adminServer.listen()
            .then(port => {
              this.log.info(`Admin server is running on port ${port}`)
            })
            .catch(e => {
              this.log.error('Failed to launch the admin server:', e.message)
            })
        }
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

    getDeviceConfig(deviceId) {
      return this.deviceConfigs.get(deviceId) || {}
    }

    discoverDeviceHandler(device, unknown) {
      if (this.getDeviceConfig(device.id).exclude) {
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
      const deviceConfig = this.getDeviceConfig(device.id)
      const accessories = AccessoryFactory.createAccessories(
        device,
        deviceConfig,
        this.log
      )

      if (accessories && accessories.length > 0) {
        const deviceWrapper = new DeviceWrapper(
          this,
          device,
          deviceConfig,
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
      const deviceConfig = this.getDeviceConfig(ctx.id)

      if (deviceConfig.exclude ||
          this.accessoryTypeHasChanged(ctx, deviceConfig)) {
        this.stalePlatformAccessories.add(platformAccessory)
        return
      }

      this.log.debug(
        'Configuring cached accessory',
        '#' + (ctx.index || 0),
        'for device',
        ctx.type,
        ctx.id
      )

      this.createAccessoryFromContext(ctx, platformAccessory)
    }

    accessoryTypeHasChanged(ctx, deviceConfig) {
      const accessoryConfig = AccessoryFactory.getAccessoryConfig(
        deviceConfig,
        ctx.index || 0
      )
      const defaultAccessoryType = AccessoryFactory.getDefaultAccessoryType(
        ctx.type,
        ctx.mode
      )
      const oldAccessoryType = ctx.accessoryType || defaultAccessoryType
      const newAccessoryType = accessoryConfig.type || defaultAccessoryType

      return oldAccessoryType !== newAccessoryType
    }

    createAccessoryFromContext(ctx, platformAccessory = null) {
      const deviceConfig = this.getDeviceConfig(ctx.id)
      let device = shellies.getDevice(ctx.type, ctx.id)

      if (!device) {
        device = shellies.createDevice(ctx.type, ctx.id, ctx.host, ctx.mode)
        shellies.addDevice(device)
      }

      let deviceWrapper = this.deviceWrappers.get(device)

      if (!deviceWrapper) {
        deviceWrapper = new DeviceWrapper(this, device, deviceConfig)
        this.deviceWrappers.set(device, deviceWrapper)
      }

      const accessory = AccessoryFactory.createAccessory(
        device,
        ctx.index,
        deviceConfig,
        this.log,
        platformAccessory
      )

      if (accessory) {
        deviceWrapper.accessories.push(accessory)
      }

      return accessory
    }

    handleStalePlatformAccessories() {
      if (this.stalePlatformAccessories.size > 0) {
        homebridge.unregisterPlatformAccessories(
          'homebridge-shelly',
          'Shelly',
          Array.from(this.stalePlatformAccessories)
        )
      }

      for (const platformAccessory of this.stalePlatformAccessories) {
        const ctx = platformAccessory.context
        const deviceConfig = this.getDeviceConfig(ctx.id)

        if (deviceConfig.exclude) {
          continue
        }

        this.log.debug(
          'Recreating accessory',
          '#' + (ctx.index || 0),
          'for device',
          ctx.type,
          ctx.id,
          'since its configured type has changed'
        )

        const accessory = this.createAccessoryFromContext(ctx)

        if (accessory) {
          homebridge.registerPlatformAccessories(
            'homebridge-shelly',
            'Shelly',
            [accessory.platformAccessory]
          )
        }
      }

      delete this.stalePlatformAccessories
    }
  }

  return ShellyPlatform
}
