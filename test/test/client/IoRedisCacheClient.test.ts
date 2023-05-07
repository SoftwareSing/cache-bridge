import IoRedis from 'ioredis'

import { IoRedisCacheClient } from '../../../src/client/IoRedisCacheClient'
import { cacheClientStandardTest } from './cacheClientStandardTest'

describe('IoRedisCacheClient', function () {
  const redis = new IoRedis({ lazyConnect: true })

  before(async function () {
    await redis.connect()
  })

  after(async function () {
    await redis.quit()
  })

  beforeEach(async function () {
    await redis.flushall()
  })

  const getCacheClient = (): IoRedisCacheClient => {
    return new IoRedisCacheClient({ client: redis })
  }

  cacheClientStandardTest(getCacheClient)
})
