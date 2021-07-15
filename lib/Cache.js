const Store = require('./Store')

/**
 * @typedef {import('./CacheClient')} CacheClient
 */

/**
 * @callback stringify
 * @param {Any} value any value
 * @returns {String}
 */
/**
 * @callback parse
 * @param {String}
 * @returns {Any}
 */

const SET_ONE = Symbol('setOne')

function defaultStringify (value) {
  const str = JSON.stringify(value)
  return str === undefined ? 'undefined' : str
}
function defaultParse (text) {
  if (text === undefined) return undefined
  if (text === 'undefined') return undefined
  return JSON.parse(text)
}

module.exports = class Cache extends Store {
  /**
   * @param {CacheClient} cacheClient
   * @param {Object} options
   * @param {String} options.prefix
   * @param {Number} options.ttl expire time, in seconds.
   * @param {stringify} [options.stringify] function for convert data to string, default is JSON.stringify
   * @param {parse} [options.parse] function for revert data from string, default is JSON.parse
   * @param {Boolean} [options.cacheUndefined] if false, ignore undefined value on set, setMany, etc.
   * @param {Number} [options.ttlForUndefined] if cacheUndefined is true, set the expire time only for undefined
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
   */
  async getMany (idList) {
    const keyIdMap = new Map()
    for (const id of idList) {
      keyIdMap.set(this.key(id), id)
    }

    const keyTextList = await this._client.getMany([...keyIdMap.keys()])
    /**
     * @type {Map<String, Any>}
     */
    const result = new Map()
    for (const [key, text] of keyTextList) {
      const id = keyIdMap.get(key)
      result.set(id, this.parse(text))
    }
    return result
  }

  /**
   * @param {String} id
   */
  del (id) {
    return this._client.del(this.key(id))
  }

  /**
   * @param {Iterable<String>} idList
   */
  delMany (idList) {
    const keyArray = []
    for (const id of idList) {
      keyArray.push(this.key(id))
    }
    return this._client.delMany(keyArray)
  }

  /**
   * @param {String} id
   * @param {Any} data
   * @param {Number} [ttl]
   * @returns {Promise<void>}
   */
  set (id, data, ttl) {
    return this[SET_ONE](id, data, ttl, 'set')
  }

  /**
   * @param {String} id
   * @param {Any} data
   * @param {Number} [ttl]
   * @returns {Promise<Boolean>}
   */
  setNotExist (id, data, ttl) {
    return this[SET_ONE](id, data, ttl, 'setNotExist')
  }

  /**
   * @param {Iterable<[String, Any]>} setList [ [id, data], [id, data], ...... ]
   * @param {Number} [ttl]
   */
  async setMany (setList, ttl) {
    const ttlForUndefined = ttl === undefined ? this.ttlForUndefined : ttl
    if (ttl === undefined) ttl = this.ttl

    const map = new Map()
    const undefinedMap = ttlForUndefined !== ttl ? new Map() : undefined
    for (const [id, data] of setList) {
      if (data === undefined && !this.cacheUndefined) continue

      const key = this.key(id)
      const text = this.stringify(data)
      if (data === undefined && undefinedMap) undefinedMap.set(key, text)
      else map.set(key, text)
    }

    if (undefinedMap && undefinedMap.size > 0) {
      await Promise.all([
        this._client.setMany(map, ttl),
        this._client.setMany(undefinedMap, ttlForUndefined)
      ])
    } else {
      await this._client.setMany(map, ttl)
    }
  }

  /**
   * @param { 'set' | 'setNotExist' } clientSetMethod
   */
  [SET_ONE] (id, data, ttl, clientSetMethod) {
    if (data === undefined && !this.cacheUndefined) return Promise.resolve()
    if (ttl === undefined) {
      ttl = data === undefined
        ? this.ttlForUndefined
        : this.ttl
    }
    return this._client[clientSetMethod](this.key(id), this.stringify(data), ttl)
  }
}
