<a href="https://github.com/alexryd/homebridge-shelly"><img src="homebridge-shelly.png" height="120"></a>

# homebridge-shelly
[![npm-version](https://badgen.net/npm/v/homebridge-shelly)](https://www.npmjs.com/package/homebridge-shelly)
[![npm-total-downloads](https://badgen.net/npm/dt/homebridge-shelly)](https://www.npmjs.com/package/homebridge-shelly)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![certified-hoobs-plugin](https://badgen.net/badge/HOOBS/Certified/yellow)](https://plugins.hoobs.org)

[Homebridge](https://homebridge.io) plugin for [Shelly](https://shelly.cloud),
enabling HomeKit support for Shelly devices.

Note that this is an unofficial plugin.

## Supported devices
* [Shelly 1](https://shelly.cloud/shelly1-open-source/)
* [Shelly 1L](https://shelly.cloud/products/shelly-1l-single-wire-smart-home-automation-relay/)
* [Shelly 1PM](https://shelly.cloud/shelly-1pm-wifi-smart-relay-home-automation/)
* Shelly 2 <sup>1</sup>
* [Shelly 2.5](https://shelly.cloud/shelly-25-wifi-smart-relay-roller-shutter-home-automation/) <sup>1</sup>
* [Shelly 3EM](https://shelly.cloud/shelly-3-phase-energy-meter-with-contactor-control-wifi-smart-home-automation/)
* [Shelly 4Pro](https://shelly.cloud/shelly-4-pro/)
* [Shelly Air](https://shelly.cloud/products/shelly-air-smart-home-air-purifier/)
* [Shelly Bulb](https://shelly.cloud/shelly-bulb/) <sup>2</sup>
* [Shelly Button 1](https://shelly.cloud/products/shelly-button-1-smart-home-automation-device/) <sup>3</sup>
* Shelly Dimmer
* [Shelly Dimmer 2](https://shelly.cloud/products/shelly-dimmer-2-smart-home-light-contoller/)
* Shelly Door/Window
* [Shelly Door/Window 2](https://shelly.cloud/products/shelly-door-window-2-smart-home-automation-sensor/) <sup>3</sup>
* [Shelly Duo](https://shelly.cloud/wifi-smart-home-automation-shelly-duo/)
* [Shelly EM](https://shelly.cloud/shelly-energy-meter-with-contactor-control-wifi-smart-home-automation/)
* [Shelly Flood](https://shelly.cloud/shelly-flood-and-temperature-sensor-wifi-smart-home-automation/)
* Shelly HD
* [Shelly H&T](https://shelly.cloud/shelly-humidity-and-temperature/)
* [Shelly i3](https://shelly.cloud/products/shelly-i3-smart-home-automation-device/)
* [Shelly Motion](https://shelly.cloud/shelly-motion-smart-home-automation-sensor/) <sup>4</sup>
* [Shelly Plug](https://shelly.cloud/shelly-plug/)
* [Shelly Plug S](https://shelly.cloud/shelly-plug-s/)
* [Shelly Plug US](https://shelly.cloud/products/shelly-plug-us-smart-home-automation-device/)
* [Shelly RGBW2](https://shelly.cloud/wifi-smart-shelly-rgbw-2/)
* [Shelly Sense](https://shelly.cloud/shelly-sense/)
* [Shelly Uni](https://shelly.cloud/products/shelly-uni-smart-home-automation-device/)
* [Shelly Vintage](https://shelly.cloud/wifi-smart-home-automation-shelly-vintage/)

Is your device not on the list? See the section about unsupported devices below.

### Notes
<sup>1</sup> To use Shelly 2 or Shelly 2.5 in roller shutter mode the device
must have been calibrated and be running firmware version 1.4.9 or later.

<sup>2</sup> Requires firmware version 1.5.1 or later.

<sup>3</sup> Requires firmware version 1.8.0 or later.

<sup>4</sup> Requires setting the `Internet & Security -> CoIoT -> Remote
address` option on the Shelly device to the IP address of your device running
homebridge.

## Installation
1. Install Homebridge by following
   [the instructions](https://github.com/homebridge/homebridge/wiki).
2. Install this plugin using [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x), or by running `npm install -g homebridge-shelly`.
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
Your Shelly devices should then be automatically discovered, as long as they use the stock firmware (no Tasmota etc.) and are
on the same network and subnet as the device running homebridge. See [this wiki page](https://github.com/alexryd/homebridge-shelly/wiki/Shelly,-CoAP-and-multicast) if that doesn't work.

To see a list of all discovered devices, visit the administration page by going
to `http://<IP-ADDRESS>:8181/`, where IP-ADDRESS is the address of the
device that you are running homebridge on.

### Network interface
Sometimes setting the `"networkInterface"` option to the name of the network
interface or the local IP address of your device will help when your devices
aren't automatically discovered, or you see error messages like
`addMembership EADDRNOTAVAIL` or `addMembership EADDRINUSE`.

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
milliseconds. Set to `0` or `false` to disable. Disabled by default.

### Administration interface
By default, this plugin will launch an HTTP server on port 8181 to serve an
administration interface. You can disable this by setting `"admin"."enabled"`
to `false`. You can also change the port number using `"admin"."port"`.

### Device specific configurations
Configurations for specific Shelly devices can be set using the `"devices"`
array. Each object in the array must contain an `"id"` property with the ID of
the Shelly device that you want to target. IDs are always made up of 6 or 12
hexadecimal characters and can be found in the Shelly Cloud app or the web
interface of a device, under *Settings -> Device info -> Device ID*.

#### General configurations
* `"exclude"` - set to `true` to exclude the device from Homebridge.
* `"username"` and `"password"` - set these if you have restricted the web
  interface of the device with a username and password. This will override the
  global `"username"` and `"password"` options.
* `"name"` - sets a custom name for the device.

#### Shelly switch configurations
*Applies to Shelly 1, 1PM, 2 and 2.5 in relay mode, 4Pro, EM, Plug and Plug S.*
* `"type"` - sets the type of accessory the device is identified as. Available
  types are `"contactSensor"`, `"motionSensor"`, `"occupancySensor"`,
  `"outlet"`, `"switch"` (default), `"fan"` and `"valve"`.

#### Additional Shelly 2 and 2.5 switch configurations
*Applies to Shelly 2 and 2.5 in relay mode*
* `"type"` - sets the type of accessory the device is identified as. If the fan type is set, each of the outputs triggers a different fan speed.

#### Shelly 2.5 configurations
* `"type"` - in roller mode, the device can be identified as either `"door"`,
  `"garageDoorOpener"`, `"window"` or `"windowCovering"` (default).

#### Shelly RGBW2 configurations
* `"colorMode"` - set to `"rgbw"` (default) to have HomeKit control all four
  channels of the device (R, G, B, and W), or to `"rgb"` to omit the W channel.

### Example configuration
```json
"platforms": [
  {
    "platform": "Shelly",
    "name": "Shelly",
    "username": "admin",
    "password": "pa$$word",
    "devices": [
      { "id": "74B5A3", "exclude": true },
      { "id": "A612F0", "username": "admin", "password": "pa$$word2" },
      { "id": "6A78BB", "colorMode": "rgb" },
      { "id": "AD2214", "name": "My Device" },
      { "id": "1D56AF", "type": "outlet" }
    ],
    "admin": {
      "enabled": true,
      "port": 8181
    }
  }
]
```

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

<a href='https://ko-fi.com/S6S3ZKXP' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi1.png?v=2' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
