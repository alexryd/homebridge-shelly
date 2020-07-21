
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
  const PowerConsumptionAbility =
    require('../abilities/power-consumption')(homebridge)
  const Service = homebridge.hap.Service
  const SmokeSensorAbility = require('../abilities/smoke-sensor')(homebridge)
  const TemperatureSensorAbility =
    require('../abilities/temperature-sensor')(homebridge)
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
      super(device, index, config, log, [
        new ContactSensorAbility('state'),
        new LightSensorAbility('lux'),
        new BatteryAbility('battery'),
      ])
    }
  }

  class ShellyDoorWindow2Accessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, [
        new ContactSensorAbility('dwIsOpened'),
        new LightSensorAbility('luminosity'),
        new TemperatureSensorAbility('extTemp'),
        new BatteryAbility('battery')
      ])
    }
  }

  class ShellyFloodAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, [
        new LeakSensorAbility('flood'),
        new TemperatureSensorAbility('temperature'),
        new BatteryAbility('battery'),
      ])
    }
  }

  class ShellyGasSmokeSensorAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, [
        new SmokeSensorAbility({
          name: 'alarmState',
          getter: function() {
            return this.alarmState !== 'unknown' && this.alarmState !== 'none'
          },
        })
      ])
    }
  }

  class ShellyHTAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, [
        new TemperatureSensorAbility('temperature'),
        new HumiditySensorAbility('humidity'),
        new BatteryAbility('battery'),
      ])
    }
  }

  class ShellyRelayContactSensorAccessory extends ShellyAccessory {
    constructor(device, index, config, log, powerMeterIndex = false) {
      super('contactSensor', device, index, config, log)

      this.abilities.push(new ContactSensorAbility('relay' + index))

      if (powerMeterIndex !== false) {
        this.abilities.push(new PowerConsumptionAbility(
          Service.ContactSensor,
          'powerMeter' + powerMeterIndex
        ))
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
        this.abilities.push(new PowerConsumptionAbility(
          Service.MotionSensor,
          'powerMeter' + powerMeterIndex
        ))
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
        this.abilities.push(new PowerConsumptionAbility(
          Service.OccupancySensor,
          'powerMeter' + powerMeterIndex
        ))
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
  }
}
