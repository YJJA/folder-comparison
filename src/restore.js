import path from 'path'
import unzip from 'unzip2'
import fse from 'fs-extra'
import fs from 'fs'
import types from './types'
import text from './text'

// restore
export async function restore(original, file) {
  // body...
}

// restoreToZip
export async function restoreFromZip(original, zipFile, dist) {
  const patchesDist = zipFile.replace(/\.zip$/, '')
  await unzipFile(zipFile, patchesDist)

  const updateJsonPath = path.join(patchesDist, 'update.json')
  const updateJson = await fse.readJson(updateJsonPath)

  await fse.mkdirs(dist)

  let uptatePromise = updateJson.map(async update => {
    const { name, action } = update
    const filepath = path.join(patchesDist, name)
    const target = path.join(dist, name)
    const originalpath = path.join(original, name)

    if (action === types.INSERT) {
      await fse.copy(filepath, target)
      return update
    }

    if (action === types.UPDATE) {
      let patchText = await fse.readFile(filepath, 'utf8')
      let originalText = await fse.readFile(originalpath, 'utf8')
      let freshlyText = text.apply(originalText, patchText)
      if (!freshlyText) {
        throw new Error('文件还原操作发生错误 ' + name)
      }
      await fse.outputFile(target, new Buffer(freshlyText), 'utf8')
      return update
    }

    if (action === types.DELETE) {
      return update
    }

    await fse.copy(originalpath, target)
    return update
  })

  let updateResult = await Promise.all(uptatePromise)
  await fse.remove(patchesDist)
  return updateResult
}

// unzipFile
export async function unzipFile(src, dist) {
  await fse.mkdirs(dist)
  await new Promise((resolve, reject) => {
    fs.createReadStream(src)
      .pipe(unzip.Extract({ path: dist }))
      .on('error', (err) => reject(err))
      .on('close', () => resolve(dist))
  })
  return dist
}
