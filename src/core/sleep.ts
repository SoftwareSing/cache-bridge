// eslint-disable-next-line @typescript-eslint/promise-function-async
export function sleep (ms = 0): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}
