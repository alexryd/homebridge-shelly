/* eslint-env mocha */

const sinon = require('sinon')

const log = require('./mocks/log')

const { handleFailedRequest } = require('../util/error-handlers')

describe('handleFailedRequest()', function() {
  it('should log error messages', function() {
    const logStub = sinon.stub(log, 'log')
    const device = {
      type: 'SHSW-1',
      id: 'ABC123',
      host: '192.168.1.2',
    }

    handleFailedRequest(log, device, {})

    logStub.called.should.equal(true)
  })
})
