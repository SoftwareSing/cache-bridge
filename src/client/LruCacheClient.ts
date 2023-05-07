import { type CacheClient } from '../core/CacheClient'

interface LRU {
  get: (k: string) => string | undefined
  delete: (k: string) => boolean
  has: (k: string) => boolean
  set: (k: string, v: string | undefined, options: { ttl: number }) => any
}

export class LruCacheClient implements CacheClient {
  protected readonly lru: LRU

  constructor ({ client }: { client: LRU }) {
    this.lru = client
  }

  async get (key: string): Promise<string | undefined> {
    return this.lru.get(key)
  }

  /**
   * @returns [ [key, value], [key, value], [key, value] ]
   */
  async getMany (keyList: string[]): Promise<Array<[string, string | undefined]>> {
    return keyList.map((key) => [key, this.lru.get(key)])
  }

  async del (key: string): Promise<void> {
    this.lru.delete(key)
  }

  async delMany (keyList: string[]): Promise<void> {
    for (const key of keyList) {
      this.lru.delete(key)
    }
  }

  async set (key: string, text: string, ttl: number): Promise<void> {
    this.lru.set(key, text, { ttl })
  }

  async setMany (keyTextMap: Map<string, string>, ttl: number): Promise<void> {
    for (const [key, text] of keyTextMap.entries()) {
      this.lru.set(key, text, { ttl })
    }
  }

  async setNotExist (key: string, text: string, ttl: number): Promise<boolean> {
    if (this.lru.has(key)) return false

    this.lru.set(key, text, { ttl })
    return true
  }
}
