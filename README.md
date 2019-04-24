# homebridge-shelly
[![NPM Version](https://img.shields.io/npm/v/homebridge-shelly.svg)](https://www.npmjs.com/package/homebridge-shelly)
[![Build Status](https://travis-ci.org/alexryd/homebridge-shelly.svg?branch=master)](https://travis-ci.org/alexryd/homebridge-shelly)

[Shelly](https://shelly.cloud) plugin for [Homebridge](https://homebridge.io),
enabling HomeKit support for Shelly devices.

## Supported devices
Currently the following Shelly devices are supported:
* [Shelly 1](https://shelly.cloud/shelly1-open-source/)
* [Shelly 1PM](https://shelly.cloud/shelly-1pm-wifi-smart-relay-home-automation/)
* Shelly 2 <sup>1</sup>
* [Shelly 2.5](https://shelly.cloud/shelly-25-wifi-smart-relay-roller-shutter-home-automation/) <sup>1</sup>
* [Shelly 4Pro](https://shelly.cloud/shelly-4-pro/)
* [Shelly H&T](https://shelly.cloud/shelly-humidity-and-temperature/)

### Notes
<sup>1</sup> To use Shelly2 or Shelly2.5 in roller shutter mode the device must
have been calibrated.

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
    "name": "Shelly",
    "username": null,
    "password": null
  }
]
```

### Authentication
Set the `"username"` and `"password"` options if you have restricted the web
interface with a username and password. Note that this configuration applies
to all Shelly devices.

### Request timeout
The `"requestTimeout"` option can be used to configure the timeout for HTTP
requests to the Shelly devices. Specify in milliseconds. Default is 10 seconds.

### Stale timeout
Use the `"staleTimeout"` option to configure how long a device can be offline
before it is regarded as stale and unregistered from HomeKit. Specify in
milliseconds. Default is 8 hours.

### Automatic discovery
That's it. There are no other configuration options. Shelly devices will be
automatically discovered, as long as they are on the same network and subnet as
the device running homebridge and they are running the default firmware.
