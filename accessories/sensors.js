
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const BatteryAbility = require('../abilities/battery')(homebridge)
  const ContactSensorAbility =
    require('../abilities/contact-sensor')(homebridge)
  const HumiditySensorAbility =
    require('../abilities/humidity-sensor')(homebridge)
  const LeakSensorAbility = require('../abilities/leak-sensor')(homebridge)
  const LightSensorAbility = require('../abilities/light-sensor')(homebridge)
  const MotionSensorAbility = require('../abilities/motion-sensor')(homebridge)
  const OccupancySensorAbility =
    require('../abilities/occupancy-sensor')(homebridge)
  const PowerMeterAbility =
    require('../abilities/power-meter')(homebridge)
  const SmokeSensorAbility = require('../abilities/smoke-sensor')(homebridge)
  const TemperatureSensorAbility =
    require('../abilities/temperature-sensor')(homebridge)
  const TiltSensorAbility = require('../abilities/tilt-sensor')(homebridge)
  const { ShellyAccessory } = require('./base')(homebridge)

  class ShellySensorAccessory extends ShellyAccessory {
    constructor(device, index, config, log, abilities = null) {
      super('sensor', device, index, config, log, abilities)
    }

    get category() {
      return Accessory.Categories.SENSOR
    }
  }

  class ShellyDoorWindowAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log)

      if (config.state !== false) {
        this.abilities.push(new ContactSensorAbility('state'))
      }

      if (config.illuminance !== false) {
        this.abilities.push(new LightSensorAbility('illuminance'))
      }

      if (config.vibration !== false) {
        this.abilities.push(new LightSensorAbility('vibration'))
      }

      if (config.tilt !== false) {
        this.abilities.push(new LightSensorAbility('tilt'))
      }

      if (config.battery !== false) {
        this.abilities.push(new BatteryAbility('battery'))
      }
    }
  }

  class ShellyDoorWindow2Accessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log)

      if (config.state !== false) {
        this.abilities.push(new ContactSensorAbility('state'))
      }

      if (config.illuminance !== false) {
        this.abilities.push(new LightSensorAbility('illuminance'))
      }

      if (config.vibration !== false) {
        this.abilities.push(new LightSensorAbility('vibration'))
      }

      if (config.tilt !== false) {
        this.abilities.push(new LightSensorAbility('tilt'))
      }

      if (config.temperature !== false) {
        this.abilities.push(new TemperatureSensorAbility('temperature'))
      }

      if (config.battery !== false) {
        this.abilities.push(new BatteryAbility('battery'))
      }
    }
  }

  class ShellyFloodAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log)

      if (config.flood !== false) {
        this.abilities.push(new LeakSensorAbility('flood'))
      }

      if (config.temperature !== false) {
        this.abilities.push(new TemperatureSensorAbility('temperature'))
      }

      if (config.battery !== false) {
        this.abilities.push(new BatteryAbility('battery'))
      }
    }
  }

  class ShellyGasSmokeSensorAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, [
        new SmokeSensorAbility({
          name: 'gas',
          getter: function() {
            return this.gas !== 'unknown' && this.gas !== 'none'
          },
        })
      ])
    }
  }

  class ShellyHTAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log)

      if (config.temperature !== false) {
        this.abilities.push(new TemperatureSensorAbility('temperature'))
      }

      if (config.humidity !== false) {
        this.abilities.push(new HumiditySensorAbility('humidity'))
      }

      if (config.battery !== false) {
        this.abilities.push(new BatteryAbility('battery'), false, null, -1)
      }
    }
  }

  class ShellyRelayContactSensorAccessory extends ShellyAccessory {
    constructor(device, index, config, log, powerMeterIndex = false) {
      super('contactSensor', device, index, config, log)

      this.abilities.push(new ContactSensorAbility('relay' + index))

      if (powerMeterIndex !== false) {
        this.abilities.push(new PowerMeterAbility('power' + powerMeterIndex))
      }
    }

    get category() {
      return Accessory.Categories.SENSOR
    }
  }

  class ShellyRelayMotionSensorAccessory extends ShellyAccessory {
    constructor(device, index, config, log, powerMeterIndex = false) {
      super('motionSensor', device, index, config, log)

      this.abilities.push(new MotionSensorAbility('relay' + index))

      if (powerMeterIndex !== false) {
        this.abilities.push(new PowerMeterAbility('power' + powerMeterIndex))
      }
    }

    get category() {
      return Accessory.Categories.SENSOR
    }
  }

  class ShellyRelayOccupancySensorAccessory extends ShellyAccessory {
    constructor(device, index, config, log, powerMeterIndex = false) {
      super('occupancySensor', device, index, config, log)

      this.abilities.push(new OccupancySensorAbility('relay' + index))

      if (powerMeterIndex !== false) {
        this.abilities.push(new PowerMeterAbility('power' + powerMeterIndex))
      }
    }

    get category() {
      return Accessory.Categories.SENSOR
    }
  }

  class ShellySenseAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, [
        new MotionSensorAbility('motion'),
        new TemperatureSensorAbility('temperature'),
        new HumiditySensorAbility('humidity'),
        new LightSensorAbility('illuminance'),
        new BatteryAbility('battery', true, 'charging'),
      ])
    }
  }

  class ShellyMotionAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log)

      if (config.motion !== false) {
        this.abilities.push(new MotionSensorAbility('motion'))
      }

      if (config.illuminance !== false) {
        this.abilities.push(new LightSensorAbility('illuminance'))
      }

      if (config.battery !== false) {
        this.abilities.push(new BatteryAbility('battery'))
      }
    }
  }

  return {
    ShellyDoorWindowAccessory,
    ShellyDoorWindow2Accessory,
    ShellyFloodAccessory,
    ShellyGasSmokeSensorAccessory,
    ShellyHTAccessory,
    ShellyRelayContactSensorAccessory,
    ShellyRelayMotionSensorAccessory,
    ShellyRelayOccupancySensorAccessory,
    ShellySenseAccessory,
    ShellyMotionAccessory,
  }
}
