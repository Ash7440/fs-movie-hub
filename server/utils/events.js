const EventEmitter = require('events')
const conversionEvents = new EventEmitter()

conversionEvents.setMaxListeners(100)

module.exports = conversionEvents