/**
 * @callback storeGet
 * @param {String} id
 * @returns {Promise<Any>}
 */
/**
 * @callback storeGetMany
 * @param {Array<String>} idList
 * @returns {Promise<Map<String, Any>>}
 */

module.exports = class Store {
  /**
   * @param {String} id
   * @returns {Promise<Any>}
   */
  async get (id) {
    throw new Error('should implement Store.get')
  }

  /**
   * @param {Array<String>} idList
   * @returns {Promise<Map<String, Any>>}
   */
  async getMany (idList) {
    throw new Error('should implement Store.getMany')
  }
}
