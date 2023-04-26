import { CacheClient } from '../../src/CacheClient'
import { lru } from './lru'
import { shuffle } from './shuffle'

export class LruCacheClient implements CacheClient {
  async get (key: string): Promise<string | undefined> {
    return await lru.get(key)
  }

  /**
   * @returns [ [key, value], [key, value], [key, value] ]
   */
  async getMany (keyList: string[]): Promise<Array<[string, string | undefined]>> {
    // shuffle and filter duplicates are not necessary
    // it's just for test
    keyList = shuffle(new Set(keyList))

    const promiseList = keyList.map(
      async (key): Promise<[string, string | undefined]> => [key, await this.get(key)]
    )
    return await Promise.all(promiseList)
  }

  async del (key: string): Promise<void> {
    lru.delete(key)
  }

  async delMany (keyList: string[]): Promise<void> {
    await Promise.all(keyList.map(async (key) => await this.del(key)))
  }

  async set (key: string, text: string, ttl: number): Promise<void> {
    lru.set(key, text, { ttl })
  }

  async setMany (keyTextMap: Map<string, string>, ttl: number): Promise<void> {
    const promiseList = []
    for (const [key, text] of keyTextMap.entries()) {
      promiseList.push(this.set(key, text, ttl))
    }
    await Promise.all(promiseList)
  }

  async setNotExist (key: string, text: string, ttl: number): Promise<boolean> {
    lru.peek(key) // make lru remove stale cache
    if (lru.has(key)) return false

    lru.set(key, text, { ttl })
    return true
  }
}
