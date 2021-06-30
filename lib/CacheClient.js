module.exports = class CacheClient {
  /**
   * @param {String} key
   * @return {Promise<String>}
   */
  async get (key) {
    throw new Error('should implement _get')
  }

  /**
   * @param {Array<String>} keyList
   * @return {Promise<Iterable<[String, String]>>} [ [key, value], [key, value], [key, value] ]
   */
  async getMany (keyList) {
    throw new Error('should implement _getMany')
  }

  /**
   * @param {String} key
   * @param {String} text
   * @param {Number} ttl expire time, in milliseconds.
   */
  async set (key, text, ttl) {
    throw new Error('should implement _set')
  }
}
