import { faker } from '@faker-js/faker'
import { expect } from 'chai'

import { CacheLocker } from '../../../src/core/CacheLocker'
import { Cache } from '../../../src/core/Cache'
import { TestLruCacheClient } from '../../test-utils/TestLruCacheClient'

describe('CacheLocker', function () {
  let lruClient = new TestLruCacheClient()
  let cache = new Cache(lruClient, { prefix: '', ttl: 1 })
  let locker = new CacheLocker(cache)

  beforeEach(function () {
    lruClient = new TestLruCacheClient()
    cache = new Cache(lruClient, {
      prefix: faker.lorem.word(),
      ttl: faker.datatype.number({ min: 10 * 1000, max: 100 * 1000 })
    })
    locker = new CacheLocker(cache)
  })

  describe('lock()', function () {
    let id = ''

    beforeEach(function () {
      id = faker.datatype.uuid()
    })

    it('should return flag if success lock', async function () {
      const result = await locker.lock(id)
      expect(result).to.be.a('string')
      expect(result?.length).to.be.greaterThan(0)

      const flagInCache = await cache.get(id)
      expect(result).to.equal(flagInCache)
    })

    it('should return undefined if lock fail', async function () {
      const fakeFlag = faker.datatype.uuid()
      await cache.set(id, fakeFlag)

      const result = await locker.lock(id)
      expect(result).to.equal(undefined)

      const flagInCache = await cache.get(id)
      expect(flagInCache).to.equal(fakeFlag)
    })
  })

  describe('lockMany()', function () {
    let idList = ['']

    beforeEach(function () {
      idList = (new Array(faker.datatype.number({ min: 1, max: 100 })))
        .fill(undefined)
        .map(faker.datatype.uuid)
    })

    it('should return Map<id, flag>', async function () {
      const result = await locker.lockMany(idList.values())
      expect(result).to.be.an.instanceOf(Map)
      expect(result).to.have.all.keys(...idList)

      for (const [id, flag] of result.entries()) {
        expect(flag).to.be.a('string')
        expect(flag?.length).to.be.greaterThan(0)

        const flagInCache = await cache.get(id)
        expect(flag).to.equal(flagInCache)
      }
    })

    it('should try lock every id even some id already been lock', async function () {
      const lockId = faker.helpers.arrayElement(idList)
      const lockFlag = await locker.lock(lockId)

      const result = await locker.lockMany(idList.values())
      expect(result).to.be.an.instanceOf(Map)
      expect(result).to.have.all.keys(...idList)

      expect(result.get(lockId)).to.equal(undefined)

      for (const [id, flag] of result.entries()) {
        if (id === lockId) continue
        expect(flag).to.be.a('string')
      }

      const afterLockFlag = await cache.get(lockId)
      expect(afterLockFlag).to.equal(lockFlag)
    })
  })

  describe('unlock()', function () {
    let id = ''
    let flag = ''

    beforeEach(async function () {
      id = faker.datatype.uuid()
      flag = faker.datatype.uuid()
      await cache.set(id, flag)
    })

    it('should remove lock', async function () {
      await locker.unlock(id, flag)

      const flagInCache = await cache.get(id)
      expect(flagInCache).to.equal(undefined)
    })

    it('should not remove lock if flag not match', async function () {
      const fakeFlag = faker.datatype.uuid()
      await locker.unlock(id, fakeFlag)

      const flagInCache = await cache.get(id)
      expect(flagInCache).to.equal(flag)
    })
  })

  describe('unlockMany()', function () {
    let idFlagMap = new Map([['', '']])

    beforeEach(async function () {
      idFlagMap = new Map()
      const size = faker.datatype.number({ min: 10, max: 100 })
      for (let i = 0; i < size; i += 1) {
        idFlagMap.set(faker.datatype.uuid(), faker.datatype.uuid())
      }
      await cache.setMany(idFlagMap.entries())
    })

    it('should remove all target lock', async function () {
      await locker.unlockMany(new Map(idFlagMap.entries()))

      const flagInCacheMap = await cache.getMany(idFlagMap.keys())
      for (const id of idFlagMap.keys()) {
        expect(flagInCacheMap.get(id)).to.equal(undefined)
      }
    })

    it('should not remove lock if flag not match', async function () {
      const inputMap = new Map(idFlagMap.entries())
      const wrongFlagId = faker.helpers.arrayElement([...inputMap.keys()])
      inputMap.set(wrongFlagId, faker.datatype.uuid())

      await locker.unlockMany(inputMap)

      expect(await cache.get(wrongFlagId)).to.equal(idFlagMap.get(wrongFlagId))

      const flagInCacheMap = await cache.getMany(idFlagMap.keys())
      for (const id of idFlagMap.keys()) {
        if (id === wrongFlagId) continue
        expect(flagInCacheMap.get(id)).to.equal(undefined)
      }
    })
  })
})
