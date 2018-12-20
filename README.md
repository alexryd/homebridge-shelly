# homebridge-shelly
[![NPM Version](https://img.shields.io/npm/v/homebridge-shelly.svg)](https://www.npmjs.com/package/homebridge-shelly)

[Shelly](https://shelly.cloud) plugin for [Homebridge](https://homebridge.io).

## Supported devices
Currently the following Shelly devices are supported:
* [Shelly1](https://shelly.cloud/shelly1-open-source/)
* [Shelly2](https://shelly.cloud/shelly2/) in relay mode

## Installation
1. Install homebridge by following
   [the instructions](https://www.npmjs.com/package/homebridge#installation).
2. Install homebridge-shelly by running `npm install homebridge-shelly -g`.
3. Add the configuration to your config.json.

## Configuration
```json
"platforms": [
  {
    "platform": "Shelly",
    "name": "Shelly"
  }
]
```

That's it. There are no other configuration options. Shelly devices will be
automatically discovered, as long as they are on the same network and subnet as
the device running homebridge.
