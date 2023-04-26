import { faker } from '@faker-js/faker'
import { expect } from 'chai'

import { Bridge } from '../../../src/Bridge'
import { Cache } from '../../../src/Cache'
import { CacheLocker } from '../../../src/CacheLocker'
import { LruCacheClient } from '../../test-utils/LruCacheClient'
import { getRandomData } from '../../test-utils/getRandomData'

describe('Bridge', function () {
  let lruClient = new LruCacheClient()
  let db = new Cache(lruClient, {
    prefix: `db${faker.lorem.word()}`,
    ttl: Infinity
  })
  let cache = new Cache(lruClient, {
    prefix: `cache${faker.lorem.word()}`,
    ttl: faker.datatype.number({ min: 10 * 1000, max: 100 * 1000 })
  })
  let locker = new CacheLocker(
    new Cache(lruClient, {
      prefix: `lock${faker.lorem.word()}`,
      ttl: 2 * 1000
    })
  )
  let bridge = new Bridge({ cache, locker, db })

  beforeEach(function () {
    lruClient = new LruCacheClient()
    db = new Cache(lruClient, {
      prefix: `db${faker.lorem.word()}`,
      ttl: Infinity
    })
    cache = new Cache(lruClient, {
      prefix: `cache${faker.lorem.word()}`,
      ttl: faker.datatype.number({ min: 10 * 1000, max: 100 * 1000 })
    })
    locker = new CacheLocker(
      new Cache(lruClient, {
        prefix: `lock${faker.lorem.word()}`,
        ttl: 2 * 1000
      })
    )
    bridge = new Bridge({ cache, locker, db })
  })

  describe('get()', function () {
    let id = ''
    let data = {}

    beforeEach(async function () {
      id = faker.datatype.uuid()
      data = getRandomData({ undefined: false })
      await db.set(id, data)
      data = await db.get(id)
    })

    it('should return data', async function () {
      const result = await bridge.get(id)
      expect(result).to.deep.equal(data)
    })
  })

  describe('getMany()', function () {
    let idDataMap = new Map()

    beforeEach(async function () {
      idDataMap = new Map()
      const size = faker.datatype.number({ min: 1, max: 100 })
      for (let i = 0; i < size; i += 1) {
        const id = faker.random.alphaNumeric(i + 1)
        const data = getRandomData()
        idDataMap.set(id, data)
      }
      await db.setMany(idDataMap.entries())
    })

    it('should return Map<id, data>', async function () {
      const result = await bridge.getMany(idDataMap.keys())
      expect(result).to.be.an.instanceOf(Map)
      expect(result).to.have.all.keys([...idDataMap.keys()])
      for (const [key, data] of idDataMap.entries()) {
        expect(result.get(key)).to.deep.equal(data)
      }
    })
  })
})
