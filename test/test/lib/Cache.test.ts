import { faker } from '@faker-js/faker'
import { expect } from 'chai'

import { Cache } from '../../../src/Cache'
import { defaultStringify, defaultParse } from '../../../src/dataConverter'
import { TestLruCacheClient } from '../../test-utils/TestLruCacheClient'
import { getRandomData } from '../../test-utils/getRandomData'

describe('Cache', function () {
  let lruClient = new TestLruCacheClient()
  let cacheOptions = {
    prefix: '',
    ttl: 1
  }
  let cache = new Cache(lruClient, cacheOptions)

  beforeEach(function () {
    lruClient = new TestLruCacheClient()
    cacheOptions = {
      prefix: faker.lorem.word(),
      ttl: faker.datatype.number({ min: 10 * 1000, max: 100 * 1000 })
    }
    cache = new Cache(lruClient, cacheOptions)
  })

  describe('key()', function () {
    it('should add prefix', function () {
      const id = faker.datatype.uuid()
      const result = cache.key(id)
      expect(result).to.equal(`${cacheOptions.prefix}${id}`)
    })
  })

  describe('get()', function () {
    let id = ''
    let data = {}

    beforeEach(async function () {
      id = faker.datatype.uuid()
      data = getRandomData({ undefined: false })
      data = defaultParse(defaultStringify(data))
      await lruClient.set(cache.key(id), defaultStringify(data), 100 * 1000)
    })

    it('should return data', async function () {
      const result = await cache.get(id)
      expect(result).to.deep.equal(data)
    })

    it('should return undefined if id is not in cache', async function () {
      await lruClient.del(cache.key(id))

      const result = await cache.get(id)
      expect(result).to.equal(undefined)
    })
  })

  describe('getMany()', function () {
    let idDataMap = new Map()

    beforeEach(async function () {
      idDataMap = new Map()
      const keyTextMap = new Map()
      const size = faker.datatype.number({ min: 1, max: 100 })
      for (let i = 0; i < size; i += 1) {
        const id = faker.random.alphaNumeric(i + 1)
        const data = getRandomData()
        idDataMap.set(id, defaultParse(defaultStringify(data)))
        keyTextMap.set(cache.key(id), defaultStringify(data))
      }
      await lruClient.setMany(keyTextMap, 100 * 1000)
    })

    it('should return data map', async function () {
      const result = await cache.getMany(idDataMap.keys())
      expect(result).to.be.an.instanceOf(Map)
      expect(result).to.have.all.keys([...idDataMap.keys()])
      for (const [key, data] of idDataMap.entries()) {
        expect(result.get(key)).to.deep.equal(data)
      }
    })
  })

  describe('del()', function () {
    let id = ''
    let data = {}

    beforeEach(async function () {
      id = faker.datatype.uuid()
      data = getRandomData({ undefined: false })
      data = defaultParse(defaultStringify(data))
      await lruClient.set(cache.key(id), defaultStringify(data), 100 * 1000)
    })

    it('should not found data after del()', async function () {
      await cache.del(id)

      const afterDelData = await lruClient.get(cache.key(id))
      expect(afterDelData).to.equal(undefined)
    })

    it('should not effect data if delete other id', async function () {
      const otherId = faker.datatype.uuid()
      await cache.del(otherId)

      const afterDelDataText = await lruClient.get(cache.key(id))
      expect(afterDelDataText).to.equal(defaultStringify(data))
    })
  })

  describe('delMany()', function () {
    let idDataMap = new Map()

    beforeEach(async function () {
      idDataMap = new Map()
      const keyTextMap = new Map()
      const size = faker.datatype.number({ min: 1, max: 100 })
      for (let i = 0; i < size; i += 1) {
        const id = faker.random.alphaNumeric(i + 1)
        const data = getRandomData()
        idDataMap.set(id, defaultParse(defaultStringify(data)))
        keyTextMap.set(cache.key(id), defaultStringify(data))
      }
      await lruClient.setMany(keyTextMap, 100 * 1000)
    })

    it('should delete every id in list', async function () {
      await cache.delMany(idDataMap.keys())

      const afterDelTextList = await lruClient.getMany([...idDataMap.keys()])
      for (const [, text] of afterDelTextList) {
        expect(text).to.equal(undefined)
      }
    })
  })

  describe('set()', function () {
    let id = ''
    let data = {}

    beforeEach(function () {
      id = faker.datatype.uuid()
      data = getRandomData({ undefined: false, null: false })
    })

    it('should set data to cache', async function () {
      await cache.set(id, data)

      const afterSetCache = await lruClient.get(cache.key(id))
      expect(afterSetCache).to.equal(defaultStringify(data))
    })

    it('should set data even cache already exist', async function () {
      const fakeData = getRandomData({ undefined: false, null: false, [typeof data]: false })
      await lruClient.set(cache.key(id), defaultStringify(fakeData), 100 * 1000)

      await cache.set(id, data)

      const afterSetCache = await lruClient.get(cache.key(id))
      expect(afterSetCache).to.equal(defaultStringify(data))
    })
  })

  describe('setNotExist()', function () {
    let id = ''
    let data = {}

    beforeEach(function () {
      id = faker.datatype.uuid()
      data = getRandomData({ undefined: false, null: false })
    })

    it('should set data to cache', async function () {
      const result = await cache.setNotExist(id, data)
      expect(result).to.equal(true)

      const afterSetCache = await lruClient.get(cache.key(id))
      expect(afterSetCache).to.equal(defaultStringify(data))
    })

    it('should not set data if cache already exist', async function () {
      const fakeData = getRandomData({ undefined: false, null: false, [typeof data]: false })
      await lruClient.set(cache.key(id), defaultStringify(fakeData), 100 * 1000)

      const result = await cache.setNotExist(id, data)
      expect(result).to.equal(false)

      const afterSetCache = await lruClient.get(cache.key(id))
      expect(afterSetCache).to.equal(defaultStringify(fakeData))
    })
  })

  describe('setMany()', function () {
    let idDataMap = new Map()

    beforeEach(async function () {
      idDataMap = new Map()
      const size = faker.datatype.number({ min: 1, max: 100 })
      for (let i = 0; i < size; i += 1) {
        const id = faker.random.alphaNumeric(i + 1)
        const data = getRandomData()
        idDataMap.set(id, defaultParse(defaultStringify(data)))
      }
    })

    it('should set every data to cache', async function () {
      await cache.setMany(idDataMap.entries())

      const keyList = [...idDataMap.keys()].map((id) => cache.key(id))
      const afterSetCacheList = await lruClient.getMany(keyList)
      const afterSetCacheMap = new Map(afterSetCacheList)
      for (const [id, data] of idDataMap.entries()) {
        const key = cache.key(id)
        expect(afterSetCacheMap.has(key)).to.equal(true)

        const cacheText = afterSetCacheMap.get(key)
        expect(cacheText).to.equal(defaultStringify(data))
      }
    })
  })
})
