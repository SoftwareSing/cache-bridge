import { Store } from './Store'
import { sleep } from './sleep'
import { Cache } from './Cache'
import { Locker } from './Locker'

export class Bridge implements Store {
  protected readonly cache: Cache
  protected readonly locker: Locker
  protected readonly db: Store

  constructor ({ cache, locker, db }: { cache: Cache, locker: Locker, db: Store }) {
    this.cache = cache
    this.locker = locker
    this.db = db
  }

  async get (id: string): Promise<any> {
    let lockFlag: string | undefined
    let sleepTime: number = 3
    while (lockFlag === undefined) {
      const data = await this.cache.get(id)
      if (data !== undefined) return data

      lockFlag = await this.locker.lock(id)
      if (lockFlag === undefined) {
        sleepTime = getSleepTime(sleepTime)
        await sleep(sleepTime)
      }
    }

    const data = await this.cache.get(id)
    if (data !== undefined) {
      await this.locker.unlock(id, lockFlag)
      return data
    }

    const dbData = await this.db.get(id)
    await this.cache.set(id, dbData)
    await this.locker.unlock(id, lockFlag)
    return dbData
  }

  async getMany (idList: Iterable<string>): Promise<Map<string, any>> {
    const resultMap = new Map()
    const ungetIdSet = new Set(idList)
    while (ungetIdSet.size > 0) {
      const cacheMap = await this.cache.getMany(ungetIdSet.keys())
      for (const [id, data] of cacheMap.entries()) {
        if (data !== undefined) {
          resultMap.set(id, data)
          ungetIdSet.delete(id)
        }
      }
      if (ungetIdSet.size < 1) break

      // lock and get data
      const idFlagMap = await this.locker.lockMany(ungetIdSet.keys())
      for (const [id, flag] of idFlagMap.entries()) {
        if (flag === undefined) idFlagMap.delete(id)
      }
      if (idFlagMap.size < 1) {
        await sleep(10)
        continue
      }

      const cacheMap2 = await this.cache.getMany(idFlagMap.keys())
      const unlockMap = new Map()
      for (const [id, data] of cacheMap2.entries()) {
        if (data !== undefined) {
          resultMap.set(id, data)
          ungetIdSet.delete(id)
          unlockMap.set(id, idFlagMap.get(id))
          idFlagMap.delete(id)
        }
      }
      await this.locker.unlockMany(unlockMap)
      if (idFlagMap.size < 1) {
        await sleep(10)
        continue
      }

      const dbMap = await this.db.getMany([...idFlagMap.keys()])
      await this.cache.setMany(dbMap.entries())
      await this.locker.unlockMany(idFlagMap)
      for (const [id, data] of dbMap.entries()) {
        resultMap.set(id, data)
        ungetIdSet.delete(id)
      }
    }

    return resultMap
  }
}

function getSleepTime (lastSleepTime: number): number {
  const sleepTime = Math.floor(lastSleepTime * 1.5) + 1
  return Math.min(sleepTime, 200)
}
