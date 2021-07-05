module.exports = class Locker {
  /**
   * @param {String} id
   * @returns {Promise<String>} return flag string when success lock, return undefined when already locked by other proccess
   */
  async lock (id) {
  }

  /**
   * @param {Iterable<String>} idList
   * @returns {Promise<Map<String, String>>}
   */
  async lockMany (idList) {

  }

  /**
   * @param {String} id
   * @param {String} flag
   */
  async unlock (id, flag) {

  }

  /**
   * @param {Map<String, String>} idFlagMap
   */
  async unlockMany (idFlagMap) {

  }
}
