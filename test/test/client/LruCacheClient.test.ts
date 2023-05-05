import { LRUCache } from 'lru-cache'

import { LruCacheClient } from '../../../src/client/LruCacheClient'
import { cacheClientStandardTest } from './cacheClientStandardTest'

describe('LruCacheClient', function () {
  const lru = new LRUCache<string, string>({
    max: 1000,
    ttl: 60 * 1000
  })

  const getCacheClient = (): LruCacheClient => {
    return new LruCacheClient({ client: lru })
  }

  beforeEach(function () {
    lru.clear()
  })

  cacheClientStandardTest(getCacheClient)
})
