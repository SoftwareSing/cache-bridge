const faker = require('faker')

const typeList = ['undefined', 'null', 'number', 'boolean', 'string', 'object', 'array']

/**
 * @param {{ undefined: Boolean, null: Boolean, number: Boolean, boolean: Boolean, string: Boolean, object: Boolean, array: Boolean }} [typeEnable]
 */
exports.getRandomData = function getRandomData (typeEnable = {}) {
  let defaultEnable = !Object.values(typeEnable)[0]
  if (typeof defaultEnable !== 'boolean') defaultEnable = true

  const availableTypeList = typeList.filter((type) => {
    const enable = typeEnable[type]
    return typeof enable === 'boolean' ? enable : defaultEnable
  })
  if (availableTypeList.length < 1) return undefined

  const type = faker.random.arrayElement(availableTypeList)
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

function getRandomObject () {
  const result = {}
  const keyNum = faker.datatype.number(20)
  for (let i = 0; i < keyNum; i += 1) {
    result[faker.random.alphaNumeric(i + 1)] = getRandomBaseData()
  }
  return result
}

function getRandomArray () {
  return (new Array(faker.datatype.number(20)))
    .fill()
    .map(getRandomBaseData)
}

function getRandomBaseData () {
  const getFunc = faker.random.arrayElement([
    faker.datatype.number,
    faker.datatype.boolean,
    faker.lorem.sentence
  ])
  return getFunc()
}
