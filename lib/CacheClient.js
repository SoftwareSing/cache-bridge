module.exports = class CacheClient {
  /**
   * @param {String} key
   * @returns {Promise<String>}
   */
  async get (key) {
    throw new Error('should implement CacheClient.get')
  }

  /**
   * @param {Array<String>} keyList
   * @returns {Promise<Iterable<[String, String]>>} [ [key, value], [key, value], [key, value] ]
   */
  async getMany (keyList) {
    throw new Error('should implement CacheClient.getMany')
  }

  /**
   * @param {String} key
   */
  async del (key) {
    throw new Error('should implement CacheClient.del')
  }

  /**
   * @param {Array<String>} keyList
   */
  async delMany (keyList) {
    throw new Error('should implement CacheClient.delMany')
  }

  /**
   * @param {String} key
   * @param {String} text stringify data
   * @param {Number} ttl expire time, in milliseconds.
   */
  async set (key, text, ttl) {
    throw new Error('should implement CacheClient.set')
  }

  /**
   * @param {Map<String, String>} keyTextMap Map<'key', 'stringify data'>
   * @param {Number} ttl
   */
  async setMany (keyTextMap, ttl) {
    throw new Error('should implement CacheClient.setMany')
  }

  /**
   * @param {String} key
   * @param {String} text stringify data
   * @param {Number} ttl expire time, in milliseconds.
   * @returns {Promise<Boolean>} return true if success set key, otherwise return false
   */
  async setNotExist (key, text, ttl) {
    throw new Error('should implement CacheClient.setNotExist')
  }
}
