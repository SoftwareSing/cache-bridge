import { v4 as uuidv4 } from 'uuid'
import { type Locker } from './Locker'
import { type Cache } from './Cache'

export class CacheLocker implements Locker {
  protected readonly cache: Cache

  constructor (cache: Cache) {
    this.cache = cache
  }

  async lock (id: string): Promise<string | undefined> {
    const flag = generateFlag()
    const isSuccessSetFlag: boolean = await this.cache.setNotExist(id, flag)
    return isSuccessSetFlag ? flag : undefined
  }

  async lockMany (idList: Iterable<string>): Promise<Map<string, string | undefined>> {
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

  async unlock (id: string, flag: string): Promise<void> {
    if (flag === undefined) return
    const onCacheFlag = await this.cache.get(id)
    if (flag !== onCacheFlag) return
    await this.cache.del(id)
  }

  async unlockMany (idFlagMap: Map<string, string | undefined>): Promise<void> {
    const getList: string[] = []
    for (const [id, flag] of idFlagMap.entries()) {
      if (flag !== undefined) getList.push(id)
    }
    const onCacheMap = await this.cache.getMany(getList)

    const delList = []
    for (const [id, onCacheFlag] of onCacheMap.entries()) {
      const flag = idFlagMap.get(id)
      if (flag === onCacheFlag) delList.push(id)
    }
    await this.cache.delMany(delList)
  }
}

function generateFlag (): string {
  return uuidv4()
}
