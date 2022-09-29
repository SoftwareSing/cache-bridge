export interface CacheClient {
  get: (key: string) => Promise<string>

  /**
   * @returns [ [key, value], [key, value], [key, value] ]
   */
  getMany: (keyList: string[]) => Promise<Iterable<[string, string]>>

  del: (key: string) => Promise<void>

  delMany: (keyList: string[]) => Promise<void>

  /**
   * @param key cache key
   * @param text stringify data
   * @param ttl expire time, in milliseconds.
   */
  set: (key: string, text: string, ttl: number) => Promise<void>

  /**
   * @param keyTextMap Map<'key', 'stringify data'>
   * @param ttl expire time, in milliseconds.
   */
  setMany: (keyTextMap: Map<string, string>, ttl: number) => Promise<void>

  /**
   * @param key cache key
   * @param text stringify data
   * @param ttl expire time, in milliseconds.
   * @returns return true if success set key, otherwise return false
   */
  setNotExist: (key: string, text: string, ttl: number) => Promise<boolean>
}
