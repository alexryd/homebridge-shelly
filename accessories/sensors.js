
module.exports = homebridge => {
  const Accessory = homebridge.hap.Accessory
  const BatteryAbility = require('../abilities/battery')(homebridge)
  const HumiditySensorAbility =
    require('../abilities/humidity-sensor')(homebridge)
  const LeakSensorAbility = require('../abilities/leak-sensor')(homebridge)
  const LightSensorAbility = require('../abilities/light-sensor')(homebridge)
  const MotionSensorAbility = require('../abilities/motion-sensor')(homebridge)
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

  class ShellyHTAccessory extends ShellySensorAccessory {
    constructor(device, index, config, log) {
      super(device, index, config, log, [
        new TemperatureSensorAbility('temperature'),
        new HumiditySensorAbility('humidity'),
        new BatteryAbility('battery'),
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
    ShellyHTAccessory,
    ShellyFloodAccessory,
    ShellySenseAccessory,
  }
}
