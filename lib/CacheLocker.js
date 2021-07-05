const { v4: uuidv4 } = require('uuid')

const Locker = require('./Locker')

/**
 * @typedef {import('./Cache')} Cache
 */

module.exports = class CacheLocker extends Locker {
  /**
   * @param {Cache} cache
   */
  constructor (cache) {
    super()
    this._cache = cache
  }

  /**
   * @param {String} id
   */
  async lock (id) {
    const flag = generateFlag()
    const isSuccessSetFlag = await this._cache.setNotExist(id, flag)
    return isSuccessSetFlag ? flag : undefined
  }

  /**
   * @param {Iterable<String>} idList
   * @returns {Promise<Map<String, String>>}
   */
  async lockMany (idList) {
    const lockPromiseMap = new Map()
    for (const id of idList) {
      if (lockPromiseMap.has(id)) continue
      lockPromiseMap.set(id, this.lock(id))
    }

    const idFlagMap = new Map()
    for (const [id, promise] of lockPromiseMap.entries()) {
      const flag = await promise
      idFlagMap.set(id, flag)
    }

    return idFlagMap
  }

  /**
   * @param {String} id
   * @param {String} flag
   */
  async unlock (id, flag) {
    if (!flag) return
    const onCacheFlag = await this._cache.get(id)
    if (flag !== onCacheFlag) return
    await this._cache.del(id)
  }

  /**
   * @param {Map<String, String>} idFlagMap
   */
  async unlockMany (idFlagMap) {
    const getList = []
    for (const [id, flag] of idFlagMap.entries()) {
      if (flag) getList.push(id)
    }
    const onCacheMap = await this._cache.getMany(getList)

    const delList = []
    for (const [id, onCacheFlag] of onCacheMap.entries()) {
      const flag = idFlagMap.get(id)
      if (flag === onCacheFlag) delList.push(id)
    }
    await this._cache.delMany(delList)
  }
}

/**
 * @returns {String}
 */
function generateFlag () {
  return uuidv4()
}
