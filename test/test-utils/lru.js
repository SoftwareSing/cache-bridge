const LRU = require('lru-cache')

exports.lru = new LRU({
  max: 100 * 1000 * 1000,
  length: (value, key) => value.length + key.length,
  maxAge: 60 * 1000
})
