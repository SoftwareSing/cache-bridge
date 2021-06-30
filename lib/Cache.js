const Store = require('./Store')

module.exports = class Cache extends Store {
  /**
   * @param {String} id
   * @return {Promise<Any>}
   */
  async get (id) {
  }

  /**
   * @param {Iterable<String>} idList
   * @return {Promise<Map<String, Any>>}
   */
  async getMany (idList) {
  }

  async set (id, data) {
  }

  /**
   * @param {Iterable<[String, Any]>} setList
   */
  async setMany (setList) {
  }

  async setNotExist (id, data) {
  }

  /**
   * @param {Iterable<[String, Any]>} setList
   */
  async setManyNotExist (setList) {
  }
}
