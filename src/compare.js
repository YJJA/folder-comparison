import fse from 'fs-extra'
import fs from 'fs'
import path from 'path'
import md5 from 'md5'
import archiver from 'archiver'

import type from './type'
import text from './text'

// createActions
export async function createActions(original, freshly) {
  const [originalFiles, freshlyFiles] = await Promise.all([
    through(original),
    through(freshly)
  ])

  const fileExt = ['.jsbundle', '.js', '.css']

  const diffPromise = freshlyFiles.map(async freshlyFile => {
    const originalFile = originalFiles.find(item => {
      return item.name === freshlyFile.name
    })

    if (!originalFile) {
      return {...freshlyFile, action: type.INSERT}
    }

    originalFile.isFound = true

    let [freshlyFileText, originalFileText] = await Promise.all([
      fse.readFile(freshlyFile.path, 'utf8'),
      fse.readFile(originalFile.path, 'utf8')
    ])

    if (md5(freshlyFileText) !== md5(originalFileText)) {
      if (fileExt.includes(path.extname(freshlyFile.name))) {
        const patchText = text.patch(originalFileText, freshlyFileText)
        return {
          action: type.UPDATE,
          name: freshlyFile.name,
          patch: patchText
        }
      } else {
        return {
          action: type.INSERT,
          name: freshlyFile.name,
          path: freshlyFile.path
        }
      }
    } else {
      return {action: type.NORMAL, name: freshlyFile.name}
    }
  })

  const actions = await Promise.all(diffPromise)
  originalFiles.forEach(oFile => {
    if (!oFile.isFound) {
      actions.push({action: type.DELETE, name: oFile.name})
    }
  })

  return actions
}

// through
export async function through(rootpath, childpath = '.', result = []) {
  const fullpath = path.join(rootpath, childpath)
  const children = await fse.readdir(fullpath)

  const childrenPromise = children.forEach(async child => {
    let childname = path.join(childpath, child)
    let childpath = path.join(rootpath, childname)
    let stat = await fse.stat(childpath)

    if (stat.isFile()) return result.push({path: childpath, name: childname})
    if (stat.isDirectory()) return await through(rootpath, childname, result)
  })

  return Promise.all(childrenPromise)
    .then(() => result)
}

// compare
export async function compare(original, freshly, dist) {
  const actions = await createActions(original, freshly)
  await fse.mkdirs(path.dirname(dist))
  await actionsToFile(dist)
}

// compareToZip
export async function compareToZip(original, freshly, dist) {
  const actions = await createActions(original, freshly)
  await fse.mkdirs(path.dirname(dist))
  await actionsToZip(dist)
}

// actionsToZip
function actionsToZip(actions, dist) {
  return new Promise((resolve, reject) => {
    let archive = archiver('zip', {store: true})
    let output = fs.createWriteStream(dist)

    archive.on('error', err => reject(err))
    output.on('error', err => reject(err))
    output.on('close', () => resolve())

    let updateJson = actions.map(update => {
      const {action, name, patch, path} = update
      if (action === type.INSERT) {
        archive.file(path, { name })
      }
      if (action === type.UPDATE) {
        archive.append(patch, { name })
      }
      return {action, name}
    })

    archive.append(JSON.stringify(updateJson), {name: 'update.json'})
    archive.pipe(output)
    archive.finalize()
  })
}

// actionsToFile
function actionsToFile(actions, dist) {

}
