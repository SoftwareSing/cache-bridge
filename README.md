# cache-bridge

Simplify managing data between cache and database.

## Features

- Get data from cache, and automatically copy it from database when cache miss.
- Will acquire the lock before accessing database, avoid [Cache stampede](https://en.wikipedia.org/wiki/Cache_stampede).
- Supports [lru-cache](https://www.npmjs.com/package/lru-cache).
- Supports Redis, via [node-redis](https://www.npmjs.com/package/redis) or [ioredis](https://www.npmjs.com/package/ioredis).

## Example

```typescript
import { createClient } from 'redis'
import { MongoClient, ObjectId } from 'mongodb'
import { createBridge, RedisCacheClient } from './src'

const redis = createClient()
const mongo = new MongoClient('mongodb://localhost:27017')

async function main (): Promise<void> {
  await redis.connect()
  await mongo.connect()

  const { bridge } = createBridge({
    cacheClient: new RedisCacheClient({ client: redis }),
    prefix: 'cache',
    ttl: 5000,
    // set how to get data from the DB
    get: async (id) => {
      return await mongo.db().collection('a').findOne({ _id: new ObjectId(id) })
    },
    // set how to get multiple data from the DB
    getMany: async (idList) => {
      const list = await mongo.db().collection('a')
        .find({
          _id: { $in: idList.map((id) => new ObjectId(id)) }
        })
        .toArray()
      return new Map(
        list.map((data) => [data._id.toHexString(), data])
      )
    }
  })

  const consoleData = async (id: string): Promise<void> => {
    console.log(await bridge.get(id))
  }

  // when called sequentially
  const id1 = '000000000000000000000001'
  await consoleData(id1) // get data from the DB
  await consoleData(id1) // get data from the cache
  await consoleData(id1) // get data from the cache

  // when called simultaneously
  const id2 = '000000000000000000000002'
  await Promise.all([
    consoleData(id2), // get data from the DB
    consoleData(id2), // wait for the previous line to store the data in the cache and get data from the cache
    consoleData(id2) // wait for and get data from the cache
  ])
}

main()
```
