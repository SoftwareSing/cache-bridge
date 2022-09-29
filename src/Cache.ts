import { Store } from './Store'
import { CacheClient } from './CacheClient'

type stringify = (value: any) => string
type parse = (text: string) => any

const defaultStringify: stringify = (value) => {
  const str = JSON.stringify(value)
  return str === undefined ? 'undefined' : str
}
const defaultParse: parse = (text) => {
  if (text === undefined) return undefined
  if (text === 'undefined') return undefined
  return JSON.parse(text)
}

export class Cache implements Store {
  protected readonly client: CacheClient
  protected readonly prefix: string
  protected readonly ttl: number
  protected readonly stringify: stringify
  protected readonly parse: parse
  protected readonly cacheUndefined: boolean
  protected readonly ttlForUndefined: number

  /**
   * @param cacheOptions.ttl expire time, in milliseconds
   * @param cacheOptions.stringify function for convert data to string, default is JSON.stringify
   * @param cacheOptions.parse function for revert data from string, default is JSON.parse
   * @param cacheOptions.cacheUndefined if false, ignore undefined value on set, setMany, etc.
   * @param cacheOptions.ttlForUndefined if cacheUndefined is true, set the expire time only for undefined
   */
  constructor (
    cacheClient: CacheClient,
    cacheOptions: {
      prefix: string
      ttl: number
      stringify?: stringify
      parse?: parse
      cacheUndefined?: boolean
      ttlForUndefined?: number
    }
  ) {
    this.client = cacheClient
    this.prefix = cacheOptions.prefix
    this.ttl = cacheOptions.ttl
    this.stringify = cacheOptions.stringify ?? defaultStringify
    this.parse = cacheOptions.parse ?? defaultParse
    this.cacheUndefined = cacheOptions.cacheUndefined ?? true
    this.ttlForUndefined = cacheOptions.ttlForUndefined ?? 1
  }

  key (id: string): string {
    return `${this.prefix}${id}`
  }

  async get (id: string): Promise<any> {
    const text = await this.client.get(this.key(id))
    return this.parse(text)
  }

  async getMany (idList: Iterable<string>): Promise<Map<string, any>> {
    const keyIdMap: Map<string, string> = new Map()
    for (const id of idList) {
      keyIdMap.set(this.key(id), id)
    }

    const keyTextList = await this.client.getMany([...keyIdMap.keys()])
    const result = new Map()
    for (const [key, text] of keyTextList) {
      const id = keyIdMap.get(key)
      result.set(id, this.parse(text))
    }
    return result
  }

  async del (id: string): Promise<void> {
    return await this.client.del(this.key(id))
  }

  async delMany (idList: Iterable<string>): Promise<void> {
    const keyArray = []
    for (const id of idList) {
      keyArray.push(this.key(id))
    }
    return await this.client.delMany(keyArray)
  }

  async set (id: string, data: any, ttl?: number): Promise<void> {
    if (data === undefined && !this.cacheUndefined) return undefined
    if (ttl === undefined) {
      ttl = data === undefined ? this.ttlForUndefined : this.ttl
    }

    return await this.client.set(this.key(id), this.stringify(data), ttl)
  }

  async setNotExist (id: string, data: any, ttl?: number): Promise<boolean> {
    if (data === undefined && !this.cacheUndefined) return false
    if (ttl === undefined) {
      ttl = data === undefined ? this.ttlForUndefined : this.ttl
    }

    return await this.client.setNotExist(this.key(id), this.stringify(data), ttl)
  }

  /**
   * @param setList [ [id, data], [id, data], ...... ]
   */
  async setMany (setList: Iterable<[string, any]>, ttl?: number): Promise<void> {
    const ttlForUndefined = ttl === undefined ? this.ttlForUndefined : ttl
    if (ttl === undefined) ttl = this.ttl

    const map = new Map()
    const undefinedMap = ttlForUndefined !== ttl ? new Map() : undefined
    for (const [id, data] of setList) {
      if (data === undefined && !this.cacheUndefined) continue

      const key = this.key(id)
      const text = this.stringify(data)
      if (data === undefined && (undefinedMap !== undefined)) undefinedMap.set(key, text)
      else map.set(key, text)
    }

    if ((undefinedMap != null) && undefinedMap.size > 0) {
      await Promise.all([
        this.client.setMany(map, ttl),
        this.client.setMany(undefinedMap, ttlForUndefined)
      ])
    } else {
      await this.client.setMany(map, ttl)
    }
  }
}
