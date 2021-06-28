exports.sleep = function sleep (ms = 0) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms)
  })
}
