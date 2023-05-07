export type stringify = (value: any) => string
export type parse = (text: string | undefined) => any

export const defaultStringify: stringify = (value) => {
  const str = JSON.stringify(value)
  return str === undefined ? 'undefined' : str
}
export const defaultParse: parse = (text) => {
  if (text === undefined) return undefined
  if (text === 'undefined') return undefined
  return JSON.parse(text)
}
