const faker = require('faker')
const { expect } = require('chai')

const Cache = require('../../../lib/Cache')
const LruCacheClient = require('../../test-utils/LruCacheClient')
const { getRandomData } = require('../../test-utils/getRandomData')

describe('Cache', function () {
  let lruClient = new LruCacheClient()
  let cacheOptions = {
    prefix: '',
    ttl: 1
  }
  let cache = new Cache(lruClient, cacheOptions)

  beforeEach(function () {
    lruClient = new LruCacheClient()
    cacheOptions = {
      prefix: faker.lorem.word(),
      ttl: faker.datatype.number({ min: 10, max: 100 })
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
      data = cache.parse(cache.stringify(data))
      await lruClient.set(cache.key(id), cache.stringify(data), 100)
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
        idDataMap.set(id, cache.parse(cache.stringify(data)))
        keyTextMap.set(cache.key(id), cache.stringify(data))
      }
      await lruClient.setMany(keyTextMap, 100)
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
      data = cache.parse(cache.stringify(data))
      await lruClient.set(cache.key(id), cache.stringify(data), 100)
    })

    it('should not found data after del()', async function () {
      const result = await cache.del(id)
      expect(result).to.equal(undefined)

      const afterDelData = await lruClient.get(cache.key(id))
      expect(afterDelData).to.equal(undefined)
    })

    it('should not effect data if delete other id', async function () {
      const otherId = faker.datatype.uuid()
      const result = await cache.del(otherId)
      expect(result).to.equal(undefined)

      const afterDelDataText = await lruClient.get(cache.key(id))
      expect(afterDelDataText).to.equal(cache.stringify(data))
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
        idDataMap.set(id, cache.parse(cache.stringify(data)))
        keyTextMap.set(cache.key(id), cache.stringify(data))
      }
      await lruClient.setMany(keyTextMap, 100)
    })

    it('should delete every id in list', async function () {
      const result = await cache.delMany(idDataMap.keys())
      expect(result).to.equal(undefined)

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
      const result = await cache.set(id, data)
      expect(result).to.equal(undefined)

      const afterSetCache = await lruClient.get(cache.key(id))
      expect(afterSetCache).to.equal(cache.stringify(data))
    })

    it('should set data even cache already exist', async function () {
      const fakeData = getRandomData({ undefined: false, null: false, [typeof data]: false })
      await lruClient.set(cache.key(id), cache.stringify(fakeData), 100)

      const result = await cache.set(id, data)
      expect(result).to.equal(undefined)

      const afterSetCache = await lruClient.get(cache.key(id))
      expect(afterSetCache).to.equal(cache.stringify(data))
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
      expect(afterSetCache).to.equal(cache.stringify(data))
    })

    it('should not set data if cache already exist', async function () {
      const fakeData = getRandomData({ undefined: false, null: false, [typeof data]: false })
      await lruClient.set(cache.key(id), cache.stringify(fakeData), 100)

      const result = await cache.setNotExist(id, data)
      expect(result).to.equal(false)

      const afterSetCache = await lruClient.get(cache.key(id))
      expect(afterSetCache).to.equal(cache.stringify(fakeData))
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
        idDataMap.set(id, cache.parse(cache.stringify(data)))
      }
    })

    it('should set every data to cache', async function () {
      const result = await cache.setMany(idDataMap.entries())
      expect(result).to.equal(undefined)

      const keyList = [...idDataMap.keys()].map((id) => cache.key(id))
      const afterSetCacheList = await lruClient.getMany(keyList)
      const afterSetCacheMap = new Map(afterSetCacheList)
      for (const [id, data] of idDataMap.entries()) {
        const key = cache.key(id)
        expect(afterSetCacheMap.has(key)).to.equal(true)

        const cacheText = afterSetCacheMap.get(key)
        expect(cacheText).to.equal(cache.stringify(data))
      }
    })
  })
})
