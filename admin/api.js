const express = require('express')
const shellies = require('@tritter/shellies')

module.exports = (platform, config, log) => {
  const api = express()
  api.use(express.json())

  const deviceToJson = device => {
    const lastSeen = device.lastSeen
      ? Date.now() - device.lastSeen.getTime()
      : null

    return {
      type: device.type,
      id: device.id,
      host: device.host,
      name: device.name,
      modelName: device.modelName,
      online: device.online,
      lastSeen: lastSeen,
      unknown: shellies.isUnknownDevice(device),
      excluded: !platform.deviceWrappers.has(device),
    }
  }

  api.get('/devices', (req, res) => {
    const devices = []

    for (const device of shellies) {
      devices.push(deviceToJson(device))
    }

    res.json({
      success: true,
      data: devices,
    })
  })

  api.get('/devices/:type.:id', (req, res) => {
    const device = shellies.getDevice(req.params.type, req.params.id)
    if (device) {
      res.json({
        success: true,
        data: deviceToJson(device),
      })
    } else {
      res.status(404).json({
        success: false,
        reason: 'Not found',
      })
    }
  })

  api.delete('/devices/:type.:id', (req, res) => {
    const device = shellies.getDevice(req.params.type, req.params.id)
    if (device) {
      log.info(`Removing device ${device.type} ${device.id}`)

      platform.removeDevice(device)
      shellies.removeDevice(device)

      res.status(200).json({
        success: true,
      })
    } else {
      res.status(404).json({
        success: false,
        reason: 'Not found',
      })
    }
  })

  return api
}
