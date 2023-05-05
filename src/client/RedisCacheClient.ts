import { type CacheClient } from '../CacheClient'

export class RedisCacheClient implements CacheClient {
  protected readonly redis: Redis
  protected useUnlink: boolean

  constructor ({ client, useUnlink = false }: { client: Redis, useUnlink?: boolean }) {
    this.redis = client
    this.useUnlink = useUnlink
  }

  async get (key: string): Promise<string | undefined> {
    const result = await this.redis.get(key)
    return result !== null ? result : undefined
  }

  /**
   * @returns [ [key, value], [key, value], [key, value] ]
   */
  async getMany (keyList: string[]): Promise<Array<[string, string | undefined]>> {
    if (keyList.length < 1) return []

    const valueList = await this.redis.mGet(keyList)

    const result = new Array(keyList.length)
    for (let i = 0; i < result.length; i += 1) {
      const key = keyList[i]
      const value = valueList[i]
      result[i] = [key, value !== null ? value : undefined]
    }
    return result
  }

  async del (key: string): Promise<void> {
    if (this.useUnlink) {
      await this.redis.unlink(key)
    } else {
      await this.redis.del(key)
    }
  }

  async delMany (keyList: string[]): Promise<void> {
    if (keyList.length < 1) return

    if (this.useUnlink) {
      await this.redis.unlink(keyList)
    } else {
      await this.redis.del(keyList)
    }
  }

  async set (key: string, text: string, ttl: number): Promise<void> {
    await this.redis.set(key, text, { PX: ttl })
  }

  async setMany (keyTextMap: Map<string, string>, ttl: number): Promise<void> {
    if (keyTextMap.size < 1) return

    // mSet can not use with ttl, so use multi
    const multi = this.redis.multi()
    for (const [key, text] of keyTextMap.entries()) {
      multi.set(key, text, { PX: ttl })
    }
    await multi.exec()
  }

  async setNotExist (key: string, text: string, ttl: number): Promise<boolean> {
    const result = await this.redis.set(key, text, { PX: ttl, NX: true })
    return result !== null
  }
}

interface Multi {
  set: (k: string, t: string, o: { PX: number, NX?: true }) => any
  exec: () => Promise<any>
}

interface Redis {
  get: (k: string) => Promise<string | null>
  mGet: (kList: string[]) => Promise<Array<string | null>>
  unlink: (k: string | string[]) => Promise<any>
  del: (k: string | string[]) => Promise<any>
  set: (k: string, t: string, o: { PX: number, NX?: true }) => Promise<string | null>
  multi: () => Multi
}
