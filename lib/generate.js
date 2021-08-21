const Bridge = require('./Bridge')
const Cache = require('./Cache')
const CacheLocker = require('./CacheLocker')
const Store = require('./Store')

/**
 * @typedef {import('./CacheClient')} CacheClient
 * @typedef {import('./Cache').parse} parse
 * @typedef {import('./Cache').stringify} stringify
 * @typedef {import('./Store').storeGet} storeGet
 * @typedef {import('./Store').storeGetMany} storeGetMany
 */

/**
 * @param {Object} options
 * @param {CacheClient} options.cacheClient
 * @param {String} options.prefix
 * @param {Number} options.ttl expire time, in milliseconds.
 * @param {storeGet} options.get function for get data from DB
 * @param {storeGetMany} options.getMany function for get multi data from db
 * @param {stringify} [options.stringify] function for convert data to string, default is JSON.stringify
 * @param {parse} [options.parse] function for revert data from string, default is JSON.parse
 * @param {Boolean} [options.cacheUndefined] if false, ignore undefined value on set, setMany, etc.
 * @param {Number} [options.ttlForUndefined] if cacheUndefined is true, set the expire time only for undefined
 */
exports.generate = function ({ cacheClient, prefix, ttl, get, getMany, stringify = undefined, parse = undefined, cacheUndefined = undefined, ttlForUndefined = undefined }) {
  const db = new Store()
  if (get) db.get = get
  if (getMany) db.getMany = getMany

  const cache = new Cache(
    cacheClient,
    { prefix, ttl, stringify, parse, cacheUndefined, ttlForUndefined }
  )

  const locker = new CacheLocker(
    new Cache(cacheClient, {
      prefix: `L:${prefix}`,
      ttl: 2 * 1000
    })
  )

  const bridge = new Bridge({ cache, locker, db })

  return { bridge, cache, locker, db }
}
