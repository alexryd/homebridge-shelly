
const getDeviceIdentifier = device => {
  return `(device ${device.id}, at ${device.host})`
}

const handleFailedRequest = (log, device, e) => {
  if (e.status === 401) {
    log('Wrong username or password', getDeviceIdentifier(device))
  } else if (e.status && e.response) {
    if (e.response.error) {
      log(
        'Error:',
        e.response.error.message,
        getDeviceIdentifier(device)
      )
    } else {
      log(
        'Error:',
        e.status,
        e.message,
        getDeviceIdentifier(device)
      )
    }

    if (e.response.body && Object.keys(e.response.body).length > 0) {
      log(e.response.body)
    }
  } else if (e.errno) {
    log('Error:', e.message, getDeviceIdentifier(device))
  } else if (e.code === 'ABORTED') {
    log('Request timeout', getDeviceIdentifier(device))
  } else {
    log('Error sending request', getDeviceIdentifier(device))
    log(e.stack)
  }
}

module.exports = {
  handleFailedRequest,
}
