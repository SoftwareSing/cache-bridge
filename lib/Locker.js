module.exports = class Locker {
  /**
   * @param {String} id
   * @returns {Promise<String>} return flag string when success lock, return undefined when already locked by other proccess
   */
  async lock (id) {
    throw new Error('should implement Locker.lock')
  }

  /**
   * @param {Iterable<String>} idList
   * @returns {Promise<Map<String, String>>}
   */
  async lockMany (idList) {
    throw new Error('should implement Locker.lockMany')
  }

  /**
   * @param {String} id
   * @param {String} flag
   */
  async unlock (id, flag) {
    throw new Error('should implement Locker.unlock')
  }

  /**
   * @param {Map<String, String>} idFlagMap
   */
  async unlockMany (idFlagMap) {
    throw new Error('should implement Locker.unlockMany')
  }
}
