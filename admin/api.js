const express = require('express')
const shellies = require('shellies')

module.exports = (platform, config) => {
  const api = express()
  api.use(express.json())

  api.get('/devices', (req, res) => {
    const devices = []

    for (const device of shellies) {
      devices.push({
        type: device.type,
        id: device.id,
        host: device.host,
        online: device.online,
        unknown: shellies.isUnknownDevice(device),
        excluded: !platform.deviceWrappers.has(device),
      })
    }

    res.json({
      success: true,
      data: devices,
    })
  })

  return api
}
