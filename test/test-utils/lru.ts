import LRU from 'lru-cache'

export const lru = new LRU({
  max: 1000,
  ttl: 60 * 1000
})
