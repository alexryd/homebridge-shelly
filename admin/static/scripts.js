/* eslint-env browser,jquery */

function loadDevices() {
  var list = $('#devices-list').empty()

  $.ajax({
    url: '/api/devices',
    success: function(result) {
      var devices = result.data.slice().sort(function(a, b) {
        return String(a.type + a.id).localeCompare(b.type + b.id)
      })
      for (var i = 0; i < devices.length; i++) {
        renderDevice(list, devices[i])
      }
    }
  })
}

function renderDevice(list, device) {
  $('<div class="device">')
    .toggleClass('excluded', device.excluded)
    .append(
      $('<div class="title">')
        .text(device.type + ' ' + device.id)
    )
    .append(
      $('<a class="host-link" target="_blank">')
        .attr('href', 'http://' + device.host)
        .text(device.host)
    )
    .append(
      $('<div class="status-badges">')
        .append(renderStatusBadges(device))
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

function renderStatusBadges(device) {
  var badges = [
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
