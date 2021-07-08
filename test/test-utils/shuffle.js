/**
 * @template T
 * @param {Iterable<T>} list
 */
exports.shuffle = function shuffle (list) {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[j]
    result[j] = result[i]
    result[i] = temp
  }
  return result
}
