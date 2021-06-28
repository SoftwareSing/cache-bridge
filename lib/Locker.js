module.exports = class Locker {
  /**
   * @param {String} id
   * @return {Promise<String>} return flag string when success lock, return undefined when already locked by other proccess
   */
  async lock (id) {
  }

  /**
   * @param {Iterable<String>} idList
   * @return {Promise<Map<String, String>>}
   */
  async lockMany (idList) {

  }

  async unlock (id, flag) {

  }

  /**
   * @param {Map<String, String>}
   */
  async unlockMany (idFlagMap) {

  }
}
