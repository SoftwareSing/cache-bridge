const { sleep } = require('./sleep')

/**
 * @typedef {import('./Cache')} Cache
 * @typedef {import('./Locker')} Locker
 * @typedef {import('./Db')} Db
 */

const CACHE = Symbol('cache')
const LOCKER = Symbol('locker')
const DB = Symbol('db')

module.exports = class CacheBridge {
  /**
   * @param {Object} options
   * @param {Cache} options.cache
   * @param {Locker} options.locker
   * @param {Db} options.db
   */
  constructor ({ cache, locker, db }) {
    this[CACHE] = cache
    this[LOCKER] = locker
    this[DB] = db
  }

  /**
   * @param {String} id
   */
  async get (id) {
    let lockFlag
    let sleepTime
    while (!lockFlag) {
      const data = await this[CACHE].get(id)
      if (data !== undefined) return data

      lockFlag = await this[LOCKER].lock(id)
      if (!lockFlag) {
        sleepTime = getSleepTime(sleepTime)
        await sleep(sleepTime)
      }
    }

    const data = await this[CACHE].get(id)
    if (data !== undefined) {
      await this[LOCKER].unlock(id, lockFlag)
      return data
    }

    const dbData = await this[DB].get(id)
    const cacheData = await this[CACHE].set(id, dbData)
    await this[LOCKER].unlock(id, lockFlag)
    return cacheData
  }

  /**
   * @param {Iterable<String>} idList
   */
  async getMany (idList) {
    /**
     * @type {Map<String, Any>}
     */
    const resultMap = new Map()
    const ungetIdSet = new Set(idList)
    while (ungetIdSet.size > 0) {
      const cacheMap = await this[CACHE].getMany(ungetIdSet.keys())
      for (const [id, data] of cacheMap.entries()) {
        if (data !== undefined) {
          resultMap.set(id, data)
          ungetIdSet.delete(id)
        }
      }
      if (ungetIdSet.size < 1) break

      // lock and get data
      const idFlagMap = await this[LOCKER].lockMany(ungetIdSet.keys())
      for (const [id, flag] of idFlagMap.entries()) {
        if (!flag) idFlagMap.delete(id)
      }
      if (idFlagMap.size < 1) {
        await sleep(10)
        continue
      }

      const cacheMap2 = await this[CACHE].getMany(idFlagMap.keys())
      const unlockMap = new Map()
      for (const [id, data] of cacheMap2.entries()) {
        if (data !== undefined) {
          resultMap.set(id, data)
          ungetIdSet.delete(id)
          unlockMap.set(id, idFlagMap.get(id))
          idFlagMap.delete(id)
        }
      }
      await this[LOCKER].unlockMany(unlockMap)
      if (idFlagMap.size < 1) {
        await sleep(10)
        continue
      }

      const dbMap = await this[DB].getMany(idFlagMap.keys())
      await this[CACHE].setMany(dbMap.entries())
      await this[LOCKER].unlockMany(idFlagMap)
      for (const [id, data] of dbMap.entries()) {
        resultMap.set(id, data)
        ungetIdSet.delete(id)
      }
    }

    return resultMap
  }
}

function getSleepTime (lastSleepTime = 3) {
  const sleepTime = Math.floor(lastSleepTime * 1.5) + 1
  return Math.min(sleepTime, 200)
}
