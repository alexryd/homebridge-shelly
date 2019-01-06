
const log = (...args) => log.log.apply(this, args)

log.log = (...args) => {}

log.debug = (...args) => log.log.apply(this, ['debug:'].concat(args))
log.info = (...args) => log.log.apply(this, ['info:'].concat(args))
log.warn = (...args) => log.log.apply(this, ['warn:'].concat(args))
log.error = (...args) => log.log.apply(this, ['error:'].concat(args))

module.exports = log
