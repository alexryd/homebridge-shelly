/* eslint-env browser,jquery */

function loadDevices() {
  const list = $('#devices-list').empty()

  $.ajax({
    url: '/api/devices',
    success: function(result) {
      const devices = result.data.slice().sort(function(a, b) {
        return String(a.type + a.id).localeCompare(b.type + b.id)
      })

      if (devices.length > 0) {
        for (let i = 0; i < devices.length; i++) {
          renderDevice(list, devices[i])
        }
      } else {
        list.append(
          $('<div class="empty-list">')
            .text('No devices discovered')
        )
      }
    }
  })
}

function renderDevice(list, device) {
  $('<div class="device">')
    .toggleClass('excluded', device.excluded)
    .append(
      $('<div class="heading">')
        .append(
          $('<div class="title">')
            .text(device.name ? device.name + ' [' + device.id + ']' : (device.modelName + ' ' + device.id))
        )
        .append(
          $('<a class="host-link" target="_blank">')
            .attr('href', 'http://' + device.host)
            .text(device.host)
        )
    )
    .append(
      $('<div class="status">')
        .append(
          $('<div class="status-badges">')
            .append(renderStatusBadges(device))
        )
        .append(
          $('<div class="last-seen">')
            .append(renderLastSeen(device))
        )
    )
    .append(
      $('<div class="actions">')
        .append(
          $('<a class="remove-link">')
            .text('Remove')
            .on('click', function() {
              if (confirm('Are you sure you want to remove this device?')) {
                removeDevice(device)
              }
            })
        )
    )
    .appendTo(list)
}

function renderLastSeen(device) {
  const lastSeen = device.lastSeen
  let label, datetime
  let title = 'Last seen: '

  if (lastSeen === null) {
    label = 'Unknown'
  } else if (lastSeen < 60 * 1000) {
    label = Math.floor(lastSeen / 1000) + ' s'
  } else if (lastSeen < 60 * 60 * 1000) {
    label = Math.floor(lastSeen / (60 * 1000)) + ' m'
  } else if (lastSeen < 24 * 60 * 60 * 1000) {
    label = Math.floor(lastSeen / (60 * 60 * 1000)) + ' h'
  } else {
    label = Math.floor(lastSeen / (24 * 60 * 60 * 1000)) + ' d'
  }

  if (lastSeen === null) {
    datetime = ''
    title += 'Unknown'
  } else {
    datetime = new Date(Date.now() - device.lastSeen).toISOString()
    title += new Date(Date.now() - device.lastSeen).toLocaleString()
  }

  return $('<time>')
    .attr('datetime', datetime)
    .attr('title', title)
    .text(label)
}

function renderStatusBadges(device) {
  const badges = [
    $('<div>')
      .addClass('status-badge')
      .addClass(device.online ? 'online' : 'offline')
      .text(device.online ? 'Online' : 'Offline')
  ]

  if (device.unknown) {
    badges.push($('<div>').addClass('status-badge unknown').text('Unknown'))
  }

  if (device.excluded) {
    badges.push($('<div>').addClass('status-badge excluded').text('Excluded'))
  }

  return badges
}

function removeDevice(device) {
  $.ajax({
    url: '/api/devices/' + device.type + '.' + device.id,
    method: 'DELETE',
    success: function() {
      loadDevices()
    }
  })
}

$.when($.ready).then(loadDevices)
