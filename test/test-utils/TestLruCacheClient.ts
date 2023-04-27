import { LruCacheClient } from '../../src/client/LruCacheClient'
import { lru } from './lru'
import { shuffle } from './shuffle'

export class TestLruCacheClient extends LruCacheClient {
  constructor () {
    super({ client: lru })
  }

  async getMany (keyList: string[]): Promise<Array<[string, string | undefined]>> {
    // shuffle just testing Cache can handle random order result
    keyList = shuffle(new Set(keyList))
    return await super.getMany(keyList)
  }
}
