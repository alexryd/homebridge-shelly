# homebridge-shelly
[![NPM Version](https://img.shields.io/npm/v/homebridge-shelly.svg)](https://www.npmjs.com/package/homebridge-shelly)
[![Build Status](https://travis-ci.org/alexryd/homebridge-shelly.svg?branch=master)](https://travis-ci.org/alexryd/homebridge-shelly)

[Shelly](https://shelly.cloud) plugin for [Homebridge](https://homebridge.io),
enabling HomeKit support for Shelly devices.

## Supported devices
Currently the following devices are supported:
* [Shelly 1](https://shelly.cloud/shelly1-open-source/)
* [Shelly 1PM](https://shelly.cloud/shelly-1pm-wifi-smart-relay-home-automation/)
* Shelly 2 <sup>1</sup>
* [Shelly 2.5](https://shelly.cloud/shelly-25-wifi-smart-relay-roller-shutter-home-automation/) <sup>1</sup>
* [Shelly 4Pro](https://shelly.cloud/shelly-4-pro/)
* [Shelly H&T](https://shelly.cloud/shelly-humidity-and-temperature/)
* [Shelly Plug](https://shelly.cloud/shelly-plug/)
* [Shelly Plug S](https://shelly.cloud/shelly-plug-s/)
* [Shelly Sense](https://shelly.cloud/shelly-sense/)

### Notes
<sup>1</sup> To use Shelly 2 or Shelly 2.5 in roller shutter mode the device
must have been calibrated.

## Installation
1. Install homebridge by following
   [the instructions](https://www.npmjs.com/package/homebridge#installation).
2. Install this plugin by running `npm install -g homebridge-shelly`.
3. Add the configuration to your homebridge config.json.

## Configuration
In most cases, simply adding this plugin to the homebridge config.json will be
enough:
```json
"platforms": [
  {
    "platform": "Shelly",
    "name": "Shelly"
  }
]
```
Your Shelly devices will then be automatically discovered, as long as they are
on the same network and subnet as the device running homebridge.

### Network interface
Sometimes setting the `"networkInterface"` option to the local IP address of
your device will help when your devices aren't automatically discovered, or
you see error messages like `addMembership EADDRNOTAVAIL`.

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

## Unsupported devices
If you have a Shelly device that is not yet supported by this plugin you can
help adding support for it by following these steps:

1. Run `$ homebridge-shelly describe <ip-address>` with the IP address of the
   Shelly device.
2. Create [a new issue](https://github.com/alexryd/homebridge-shelly/issues)
   and post the output from the previous command.

## Donations
I develop this plugin in my spare time. If you like it and you find it useful,
please consider donating a small amount by clicking the button below. That will
allow me to buy new Shelly devices so that I can add support for them.

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=P52VXJECUYTG8&source=url)
