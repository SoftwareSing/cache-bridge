import fs from 'fs'
import path from 'path'

const sourcePaths = [
  './package.json',
  './package-lock.json',
  './README.md',
  './LICENSE'
]
const destPath = './dist'

for (const sourcePath of sourcePaths) {
  const filename = path.basename(sourcePath)
  const destFilePath = path.join(destPath, filename)
  fs.copyFileSync(sourcePath, destFilePath)
  console.log(`${sourcePath} was copied to ${destFilePath}`)
}
