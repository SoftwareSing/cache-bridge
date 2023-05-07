import { faker } from '@faker-js/faker'

interface TypeEnable {
  undefined?: boolean
  null?: boolean
  number?: boolean
  boolean?: boolean
  string?: boolean
  object?: boolean
  array?: boolean
}
const typeList: Array<keyof TypeEnable> = ['undefined', 'null', 'number', 'boolean', 'string', 'object', 'array']

export function getRandomData (typeEnable: TypeEnable = {}): any {
  let defaultEnable = Boolean(Object.values(typeEnable)[0])
  defaultEnable = !defaultEnable

  const availableTypeList = typeList.filter((type) => {
    const enable = typeEnable[type]
    return typeof enable === 'boolean' ? enable : defaultEnable
  })
  if (availableTypeList.length < 1) throw new Error('At least one type needs to be allowed')

  const type = faker.helpers.arrayElement(availableTypeList)
  switch (type) {
    case 'null': return null
    case 'number': return faker.datatype.number()
    case 'boolean': return faker.datatype.boolean()
    case 'string': return faker.lorem.paragraphs()
    case 'object': return getRandomObject()
    case 'array': return getRandomArray()
    default: return undefined
  }
}

function getRandomObject (): object {
  const result: Record<string, any> = {}
  const keyNum = faker.datatype.number(20)
  for (let i = 0; i < keyNum; i += 1) {
    result[faker.random.alphaNumeric(i + 1)] = getRandomBaseData()
  }
  return result
}

function getRandomArray (): Array<string | number | boolean> {
  return (new Array(faker.datatype.number(20)))
    .fill(undefined)
    .map(getRandomBaseData)
}

function getRandomBaseData (): string | number | boolean {
  const getFunc = faker.helpers.arrayElement([
    faker.datatype.number,
    faker.datatype.boolean,
    faker.lorem.sentence
  ])
  return getFunc()
}
