import { type CacheClient } from '../CacheClient'

export class IoRedisCacheClient implements CacheClient {
  protected readonly redis: ioRedis
  protected useUnlink: boolean

  constructor ({ client, useUnlink = false }: { client: ioRedis, useUnlink?: boolean }) {
    if (!isIoRedis(client)) {
      throw new Error('IoRedisCacheClient needs to be used with ioredis, but the provided client does not meet the requirements.\nIf you are using node-redis, please switch to RedisCacheClient.')
    }

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

    const valueList = await this.redis.mget(keyList)

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
    await this.redis.set(key, text, 'PX', ttl)
  }

  async setMany (keyTextMap: Map<string, string>, ttl: number): Promise<void> {
    if (keyTextMap.size < 1) return

    // mSet can not use with ttl, so use multi
    const multi = this.redis.multi()
    for (const [key, text] of keyTextMap.entries()) {
      multi.set(key, text, 'PX', ttl)
    }
    await multi.exec()
  }

  async setNotExist (key: string, text: string, ttl: number): Promise<boolean> {
    const result = await this.redis.set(key, text, 'PX', ttl, 'NX')
    return result !== null
  }
}

type ioDel1 = (...args: [...keys: string[]]) => Promise<any>
type ioDel2 = (...args: [keys: string[]]) => Promise<any>

type ioSet1 = (
  key: string,
  value: string,
  millisecondsToken: 'PX',
  milliseconds: number
) => Promise<string | null>
type ioSet2 = (
  key: string,
  value: string,
  millisecondsToken: 'PX',
  milliseconds: number,
  nx: 'NX'
) => Promise<string | null>

interface ioMulti {
  set: (
    key: string,
    value: string,
    millisecondsToken: 'PX',
    milliseconds: number
  ) => any
  exec: () => Promise<any>
}

interface ioRedis {
  get: (k: string) => Promise<string | null>
  mget: (kList: string[]) => Promise<Array<string | null>>
  unlink: ioDel1 & ioDel2
  del: ioDel1 & ioDel2
  set: ioSet1 & ioSet2
  multi: () => ioMulti
}

function isIoRedis (r: any): r is ioRedis {
  return typeof r.mget === 'function'
}
