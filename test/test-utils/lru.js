const LRU = require('lru-cache')

exports.lru = new LRU({
  max: 1000,
  ttl: 60 * 1000
})
