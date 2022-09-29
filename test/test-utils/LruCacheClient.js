// const { CacheClient } = require('../../dist/CacheClient')
const { shuffle } = require('./shuffle')
const { lru } = require('./lru')

// type checking is just for test
// if you are looking for an example for CacheClient, it's not necessary to do type checking on your implement
module.exports = class LruCacheClient {
  /**
   * @param {String} key
   * @returns {Promise<String>}
   */
  async get (key) {
    checkIsString(key, 'key')

    return lru.get(key)
  }

  /**
   * @param {Array<String>} keyList
   * @returns {Promise<Iterable<[String, String]>>} [ [key, value], [key, value], [key, value] ]
   */
  async getMany (keyList) {
    checkIsArray(keyList, 'keyList')

    // shuffle and filter duplicates are not necessary
    // it's just for test
    keyList = shuffle(new Set(keyList))

    const promiseList = keyList.map(async (key) => [key, await this.get(key)])
    return await Promise.all(promiseList)
  }

  /**
   * @param {String} key
   */
  async del (key) {
    checkIsString(key, 'key')

    lru.delete(key)
  }

  /**
   * @param {Array<String>} keyList
   */
  async delMany (keyList) {
    checkIsArray(keyList, 'keyList')

    await Promise.all(keyList.map((key) => this.del(key)))
  }

  /**
   * @param {String} key
   * @param {String} text stringify data
   * @param {Number} ttl expire time, in milliseconds.
   */
  async set (key, text, ttl) {
    checkIsString(key, 'key')
    checkIsString(text, 'text')
    checkIsNumber(ttl, 'ttl')

    lru.set(key, text, ttl)
  }

  /**
   * @param {Map<String, String>} keyTextMap Map<'key', 'stringify data'>
   * @param {Number} ttl
   */
  async setMany (keyTextMap, ttl) {
    checkIsMap(keyTextMap, 'keyTextMap')

    const promiseList = []
    for (const [key, text] of keyTextMap.entries()) {
      promiseList.push(this.set(key, text, ttl))
    }
    await Promise.all(promiseList)
  }

  /**
   * @param {String} key
   * @param {String} text stringify data
   * @param {Number} ttl expire time, in milliseconds.
   * @returns {Promise<Boolean>} return true if success set key, otherwise return false
   */
  async setNotExist (key, text, ttl) {
    checkIsString(key, 'key')
    checkIsString(text, 'text')
    checkIsNumber(ttl, 'ttl')

    lru.peek(key) // make lru remove stale cache
    if (lru.has(key)) return false

    lru.set(key, text, ttl)
    return true
  }
}

function checkIsString (value, name) {
  const type = typeof value
  if (type !== 'string') throw new Error(`expect ${name} is a String, but got ${type}`)
}

function checkIsNumber (value, name) {
  const type = typeof value
  if (type !== 'number') throw new Error(`expect ${name} is a Number, but got ${type}`)
}

function checkIsArray (value, name) {
  if (!Array.isArray(value)) throw new Error(`expect ${name} is an Array, but got ${typeof value}`)
}

function checkIsMap (value, name) {
  if (!(value instanceof Map)) throw new Error(`expect ${name} is a Map, but got ${typeof value}`)
}
