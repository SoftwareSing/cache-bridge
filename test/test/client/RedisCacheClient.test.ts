import { createClient } from 'redis'

import { RedisCacheClient } from '../../../src/client/RedisCacheClient'
import { cacheClientStandardTest } from './cacheClientStandardTest'

describe('RedisCacheClient', function () {
  const redis = createClient()

  before(async function () {
    await redis.connect()
  })

  after(async function () {
    await redis.quit()
  })

  beforeEach(async function () {
    await redis.flushAll()
  })

  const getCacheClient = (): RedisCacheClient => {
    return new RedisCacheClient({ client: redis })
  }

  cacheClientStandardTest(getCacheClient)
})
