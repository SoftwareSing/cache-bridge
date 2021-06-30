const Store = require('./Store')

/**
 * @typedef {import('./CacheClient')} CacheClient
 */

/**
 * @callback stringify
 * @param {Any} value any value
 * @return {String}
 */
/**
 * @callback parse
 * @param {String}
 * @return {Any}
 */

function defaultStringify (value) {
  const str = JSON.stringify(value)
  return str === undefined ? 'undefined' : str
}
function defaultParse (text) {
  return text === 'undefined' ? undefined : JSON.parse(text)
}

module.exports = class Cache extends Store {
  /**
   * @param {CacheClient} cacheClient
   * @param {Object} options
   * @param {String} options.prefix
   * @param {Number} options.ttl expire time, in seconds.
   * @param {stringify} options.stringify
   * @param {parse} options.parse
   * @param {Boolean} options.cacheUndefined if false, ignore undefined value on set, setMany, etc.
   * @param {Number} options.ttlForUndefined if cacheUndefined is true, set the expire time only for undefined
   */
  constructor (cacheClient, { prefix, ttl, stringify = defaultStringify, parse = defaultParse, cacheUndefined = true, ttlForUndefined = 1 }) {
    super()
    this._client = cacheClient
    this.prefix = prefix
    this.ttl = ttl
    this.stringify = stringify
    this.parse = parse
    this.cacheUndefined = cacheUndefined
    this.ttlForUndefined = ttlForUndefined
  }

  key (id) {
    return `${this.prefix}${id}`
  }

  /**
   * @param {String} id
   */
  async get (id) {
    const text = await this._client.get(this.key(id))
    return this.parse(text)
  }

  /**
   * @param {Iterable<String>} idList
   * @return {Promise<Map<String, Any>>}
   */
  async getMany (idList) {
  }

  /**
   * @param {String} id
   * @param {Any} data
   * @param {Number} [ttl]
   */
  set (id, data, ttl) {
    if (data === undefined && !this.cacheUndefined) return Promise.resolve()
    if (ttl === undefined) {
      ttl = data === undefined
        ? this.ttlForUndefined
        : this.ttl
    }
    return this._client.set(this.key(id), this.stringify(data), ttl)
  }

  /**
   * @param {Iterable<[String, Any]>} setList
   * @param {Number} [ttl]
   */
  async setMany (setList, ttl) {
  }

  async setNotExist (id, data) {
  }

  /**
   * @param {Iterable<[String, Any]>} setList
   */
  async setManyNotExist (setList) {
  }
}
