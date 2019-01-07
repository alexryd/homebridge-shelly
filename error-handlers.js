
const getDeviceIdentifier = device => {
  return `(device ${device.id}, at ${device.host})`
}

const handleFailedRequest = (log, device, e, msg = null) => {
  if (msg) {
    log.error(msg)
  }

  if (e.status === 401) {
    log.error('Wrong username or password', getDeviceIdentifier(device))
  } else if (e.status && e.response) {
    if (e.response.error) {
      log.error(
        'Error:',
        e.response.error.message,
        getDeviceIdentifier(device)
      )
    } else {
      log.error(
        'Error:',
        e.status,
        e.message,
        getDeviceIdentifier(device)
      )
    }

    if (e.response.body && Object.keys(e.response.body).length > 0) {
      log.error(e.response.body)
    }
  } else if (e.errno) {
    log.error('Error:', e.message, getDeviceIdentifier(device))
  } else if (e.code === 'ABORTED') {
    log.error('Request timeout', getDeviceIdentifier(device))
  } else {
    log.error('Error sending request', getDeviceIdentifier(device))
    if (e.stack) {
      log.error(e.stack)
    }
  }
}

module.exports = {
  handleFailedRequest,
}
