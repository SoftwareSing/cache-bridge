module.exports = class CacheClient {
  /**
   * @param {String} key
   * @return {Promise<String>}
   */
  async get (key) {
    throw new Error('should implement _get')
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
