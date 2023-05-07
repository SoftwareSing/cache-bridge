import { faker } from '@faker-js/faker'
import { expect } from 'chai'

import { type CacheClient } from '../../../src/core/CacheClient'
import { sleep } from '../../../src/core/sleep'
import { getRandomData } from '../../test-utils/getRandomData'
import { shuffle } from '../../test-utils/shuffle'

export function cacheClientStandardTest (getCacheClient: () => CacheClient): void {
  describe('CacheClient standard test', function () {
    let cacheClient: CacheClient
    let idDataMap: Map<string, string>

    beforeEach(function () {
      cacheClient = getCacheClient()

      idDataMap = new Map()
      const size = faker.datatype.number({ min: 25, max: 100 })
      for (let i = 0; i < size; i += 1) {
        const id = faker.random.alphaNumeric(i + 1)
        const data = JSON.stringify(getRandomData({ undefined: false, null: false }))
        idDataMap.set(id, data)
      }
    })

    describe('get()', function () {
      let id = ''
      let data = ''

      beforeEach(async function () {
        [id, data] = faker.helpers.arrayElement([...idDataMap.entries()])
        await cacheClient.set(id, data, 10000)
      })

      it('should return data', async function () {
        const result = await cacheClient.get(id)
        expect(result).to.equal(data)
      })

      it('should return undefined if id is not in cache', async function () {
        id = `${id}${faker.datatype.uuid()}`

        const result = await cacheClient.get(id)
        expect(result).to.equal(undefined)
      })

      it('should be able to call get() many times and data will not be changed', async function () {
        const times = faker.datatype.number({ min: 5, max: 20 })

        for (let i = 0; i < times; i += 1) {
          const result = await cacheClient.get(id)
          expect(result).to.equal(data)
        }
      })
    })

    describe('getMany()', function () {
      beforeEach(async function () {
        await cacheClient.setMany(idDataMap, 10000)
      })

      it('should return array of [id, data]', async function () {
        const result = await cacheClient.getMany(
          shuffle(idDataMap.keys())
        )

        let count = 0
        for (const [key, data] of result) {
          expect(data).to.equal(idDataMap.get(key))
          count += 1
        }
        expect(count).to.equal(idDataMap.size)
      })

      it('should return [id, undefined] when id is not in cache', async function () {
        const notExistId = faker.datatype.uuid()
        const result = await cacheClient.getMany(
          shuffle([...idDataMap.keys(), notExistId])
        )

        let count = 0
        for (const [key, data] of result) {
          if (key === notExistId) expect(data).to.equal(undefined)
          else expect(data).to.equal(idDataMap.get(key))

          count += 1
        }
        expect(count).to.equal(idDataMap.size + 1)
      })

      it('should be able to call getMany() many times and data will not be changed', async function () {
        const times = faker.datatype.number({ min: 5, max: 20 })

        for (let i = 0; i < times; i += 1) {
          const result = await cacheClient.getMany(
            shuffle(idDataMap.keys())
          )

          let count = 0
          for (const [key, data] of result) {
            expect(data).to.equal(idDataMap.get(key))
            count += 1
          }
          expect(count).to.equal(idDataMap.size)
        }
      })
    })

    describe('del()', function () {
      let id = ''
      let data = ''

      beforeEach(async function () {
        [id, data] = faker.helpers.arrayElement([...idDataMap.entries()])
        await cacheClient.set(id, data, 10000)
      })

      it('should not found data after del()', async function () {
        await cacheClient.del(id)

        const afterDelData = await cacheClient.get(id)
        expect(afterDelData).to.equal(undefined)
      })

      it('should not effect data when delete other id', async function () {
        const otherId = faker.datatype.uuid()
        await cacheClient.del(otherId)

        const afterDelData = await cacheClient.get(id)
        expect(afterDelData).to.equal(data)
      })
    })

    describe('delMany()', function () {
      beforeEach(async function () {
        await cacheClient.setMany(idDataMap, 10000)
      })

      it('should delete every id in list', async function () {
        const delIdList = faker.helpers.arrayElements(
          [...idDataMap.keys()],
          faker.datatype.number({ min: 5, max: 20 })
        )

        await cacheClient.delMany(shuffle(delIdList))

        const expectNotExistDataList = await cacheClient.getMany(delIdList)
        let delCount = 0
        for (const [, data] of expectNotExistDataList) {
          expect(data).to.equal(undefined)
          delCount += 1
        }
        expect(delCount).to.equal(delIdList.length)

        const delIdSet = new Set(delIdList)
        const existIdList = [...idDataMap.keys()].filter((id) => !delIdSet.has(id))
        const expectExistDataList = await cacheClient.getMany(existIdList)
        let existCount = 0
        for (const [id, data] of expectExistDataList) {
          expect(data).to.equal(idDataMap.get(id))
          existCount += 1
        }
        expect(existCount).to.equal(idDataMap.size - delIdList.length)
      })

      it('should not throw error when some id not in cache', async function () {
        const [delId, notDelId] = faker.helpers.arrayElements(
          [...idDataMap.keys()],
          2
        )
        const notExistId = faker.datatype.uuid()

        await cacheClient.delMany(shuffle([delId, notExistId]))

        const delData = await cacheClient.get(delId)
        expect(delData).to.equal(undefined)

        const notExistData = await cacheClient.get(notExistId)
        expect(notExistData).to.equal(undefined)

        const existData = await cacheClient.get(notDelId)
        expect(existData).to.equal(idDataMap.get(notDelId))
      })
    })

    describe('set()', function () {
      let id = ''
      let data = ''

      beforeEach(function () {
        [id, data] = faker.helpers.arrayElement([...idDataMap.entries()])
      })

      it('should set data to cache', async function () {
        await cacheClient.set(id, data, 10000)

        const afterSetCache = await cacheClient.get(id)
        expect(afterSetCache).to.equal(data)
      })

      it('should set data even cache already exist', async function () {
        const fakeData = `${faker.random.alphaNumeric(10)}${data}`
        await cacheClient.set(id, fakeData, 10000)

        await cacheClient.set(id, data, 10000)

        const afterSetCache = await cacheClient.get(id)
        expect(afterSetCache).to.equal(data)
      })

      it('ttl should work', async function () {
        const ttl = faker.datatype.number({ min: 100, max: 500 })

        await cacheClient.set(id, data, ttl)

        await sleep(ttl + 10)
        const afterTtlCache = await cacheClient.get(id)
        expect(afterTtlCache).to.equal(undefined)
      })
    })

    describe('setMany()', function () {
      it('should set every data to cache', async function () {
        await cacheClient.setMany(
          new Map(idDataMap.entries()),
          10000
        )

        const expectExistDataList = await cacheClient.getMany(
          [...idDataMap.keys()]
        )
        for (const [key, data] of expectExistDataList) {
          expect(data).to.equal(idDataMap.get(key))
        }
      })

      it('should set data even cache already exist', async function () {
        const [id, data] = faker.helpers.arrayElement([...idDataMap.entries()])
        const fakeData = `${faker.random.alphaNumeric(10)}${data}`
        await cacheClient.set(id, fakeData, 10000)

        await cacheClient.setMany(
          new Map(idDataMap.entries()),
          10000
        )

        const expectExistDataList = await cacheClient.getMany(
          [...idDataMap.keys()]
        )
        for (const [key, data] of expectExistDataList) {
          expect(data).to.equal(idDataMap.get(key))
        }
      })

      it('ttl should work', async function () {
        const ttl = faker.datatype.number({ min: 100, max: 500 })

        await cacheClient.setMany(
          new Map(idDataMap.entries()),
          ttl
        )

        await sleep(ttl + 10)
        const afterTtlCacheList = await cacheClient.getMany(
          [...idDataMap.keys()]
        )
        for (const [, data] of afterTtlCacheList) {
          expect(data).to.equal(undefined)
        }
      })
    })

    describe('setNotExist()', function () {
      let id = ''
      let data = ''

      beforeEach(function () {
        [id, data] = faker.helpers.arrayElement([...idDataMap.entries()])
      })

      it('should set data to cache', async function () {
        const result = await cacheClient.setNotExist(id, data, 10000)
        expect(result).to.equal(true)

        const afterSetCache = await cacheClient.get(id)
        expect(afterSetCache).to.equal(data)
      })

      it('should not set data when cache already exist', async function () {
        const fakeData = `${faker.random.alphaNumeric(10)}${data}`
        await cacheClient.set(id, fakeData, 100000)

        const result = await cacheClient.setNotExist(id, data, 10000)
        expect(result).to.equal(false)

        const afterSetCache = await cacheClient.get(id)
        expect(afterSetCache).to.not.equal(data)
        expect(afterSetCache).to.equal(fakeData)
      })

      it('ttl should work', async function () {
        const ttl = faker.datatype.number({ min: 100, max: 500 })

        const result = await cacheClient.setNotExist(id, data, ttl)
        expect(result).to.equal(true)

        await sleep(ttl + 10)
        const afterTtlCache = await cacheClient.get(id)
        expect(afterTtlCache).to.equal(undefined)
      })
    })
  })
}
