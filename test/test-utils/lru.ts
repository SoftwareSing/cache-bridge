import { LRUCache } from 'lru-cache'

export const lru = new LRUCache<string, string>({
  max: 1000,
  ttl: 60 * 1000
})
