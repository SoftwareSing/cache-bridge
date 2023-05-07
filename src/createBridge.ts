import { Bridge } from './core/Bridge'
import { Cache } from './core/Cache'
import { type CacheClient } from './core/CacheClient'
import { CacheLocker } from './core/CacheLocker'
import { type parse, type stringify } from './core/dataConverter'
import { type Locker } from './core/Locker'
import { type Store, type get, type getMany } from './core/Store'

/**
 * @param options
 * @param options.cacheClient
 * @param options.prefix
 * @param ptions.ttl expire time, in milliseconds.
 * @param options.get function for get data from DB
 * @param options.getMany function for get multi data from db
 * @param options.stringify function for convert data to string, default is JSON.stringify
 * @param options.parse function for revert data from string, default is JSON.parse
 * @param options.cacheUndefined if false, ignore undefined value on set, setMany, etc.
 * @param options.ttlForUndefined if cacheUndefined is true, set the expire time only for undefined
 */
export function createBridge ({
  cacheClient,
  prefix = '',
  ttl,
  get,
  getMany,
  stringify,
  parse,
  cacheUndefined,
  ttlForCacheUndefined,
  ttlForLockDb = 2 * 1000
}: {
  cacheClient: CacheClient
  prefix?: string
  ttl: number
  get?: get
  getMany?: getMany
  stringify?: stringify
  parse?: parse
  cacheUndefined?: boolean
  ttlForCacheUndefined?: number
  ttlForLockDb?: number
}): { bridge: Bridge, cache: Cache, locker: Locker, db: Store } {
  let db: Store
  if (get !== undefined && getMany !== undefined) {
    db = { get, getMany }
  } else if (getMany === undefined && get !== undefined) {
    db = { get, getMany: generateGetManyByGetOne(get) }
  } else if (get === undefined && getMany !== undefined) {
    db = { get: generateGetOneByGetMany(getMany), getMany }
  } else {
    throw new Error('At least one of \'get\' and \'getMany\' must be provided.')
  }

  const cache = new Cache(
    cacheClient,
    { prefix, ttl, stringify, parse, cacheUndefined, ttlForUndefined: ttlForCacheUndefined }
  )

  const locker = new CacheLocker(
    new Cache(cacheClient, {
      prefix: `L:${prefix}`,
      ttl: ttlForLockDb
    })
  )

  const bridge = new Bridge({ cache, locker, db })

  return { bridge, cache, locker, db }
}

function generateGetManyByGetOne (get: get): getMany {
  return async (idList: string[]): Promise<Map<string, ReturnType<get>>> => {
    const idDataList = await Promise.all(
      idList.map(
        async (id): Promise<[string, ReturnType<get>]> => [id, await get(id)]
      )
    )
    return new Map(idDataList)
  }
}

function generateGetOneByGetMany (getMany: getMany): get {
  return async (id) => {
    const map = await getMany([id])
    return map.get(id)
  }
}
