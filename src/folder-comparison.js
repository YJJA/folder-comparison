import fs from 'fs'
import path from 'path'
import fsp from 'fs-promise'
import md5 from 'md5'
import unzip from 'unzip2'
import archiver from 'archiver'
import DiffMatchPatch from 'diff-match-patch'

export const INSERT = 'insert' // 新增
export const UPDATE = 'update' // 更新
export const DELETE = 'delete' // 删除
export const NORMAL = 'normal' // 正常

// 文件夹对比，并生成增量补订
export default async function comparison(original, freshly, zipPath) {
  const patches = await diffDirctory(original, freshly)
  return await patchesToZip(zipPath, patches)
}

// 生成压缩补丁文件
export async function patchesToZip(zipPath, patches) {
  await fsp.mkdirs(path.dirname(zipPath))
  await new Promise((resolve, reject) => {
    let archive = archiver('zip', {store: true})
    let output = fs.createWriteStream(zipPath)

    archive.on('error', err => reject(err))
    output.on('error', err => reject(err))
    output.on('close', () => resolve())

    let updateJson = patches.map(update => {
      const {action, name, patch, path} = update
      // 新增
      if (action === INSERT) {
        archive.file(path, { name })
      }
      // 更新
      if (action === UPDATE) {
        archive.append(patch, { name })
      }

      // 删除 / 正常
      return {action, name}
    })

    archive.append(JSON.stringify(updateJson), {name: 'update.json'})
    archive.pipe(output)
    archive.finalize()
  })

  const zipMd5 = await md5File(zipPath)
  await fsp.outputFile(zipPath + '.md5', zipMd5, 'utf8')

  return zipPath
}

// 文件夹解析
export async function parseDirctory(parentpath, filename = '') {
  let fullpath = path.join(parentpath, filename)
  let children = await fsp.readdir(fullpath)

  let childrenPromise = children.map(async child => {
    let childname = path.join(filename, child)
    let childpath = path.join(parentpath, childname)
    let stat = await fsp.stat(childpath)

    if (stat.isFile()) return {path: childpath, name: childname}
    if (stat.isDirectory()) return await parseDirctory(parentpath, childname)
  })

  const childpaths = await Promise.all(childrenPromise)
  return childpaths.reduce((arr, child) => arr.concat(child), [])
}

// 文件夹对比
export async function diffDirctory(original, freshly) {
  const [oFiles, fFiles] = await Promise.all([
    parseDirctory(original),
    parseDirctory(freshly)
  ])
  // 可增量文件后缀
  const fileExt = ['.jsbundle', '.js', '.css']

  let diffPromise = fFiles.map(async fFile => {
    let oFile = includesFile(oFiles, fFile.name)
    // 新文件在原文件夹中没有找到的进行新增操作
    if (!oFile) {
      return { action: INSERT, name: fFile.name, path: fFile.path }
    }

    // 标记已匹配到的文件
    oFile.isFound = true
    // 新文件在原文件夹中已找到， 对比文件MD5值
    let [fFileText, oFileText] = await Promise.all([
      fsp.readFile(fFile.path, 'utf8'),
      fsp.readFile(oFile.path, 'utf8')
    ])
    // MD5值不相同时，判断文件是否是可增量文件
    if (md5(fFileText) !== md5(oFileText)) {
      // 是可增量文件，增量操作
      if (fileExt.includes(path.extname(fFile.name))) {
        const patchText = patchToText(oFileText, fFileText)
        return {action: UPDATE, name: fFile.name, patch: patchText}
      } else {
        // 不是增量文件，插入操作
        return {action: INSERT, name: fFile.name, path: fFile.path}
      }
    }
    // MD5值相同时不做操作
    return {action: NORMAL, name: fFile.name}
  })

  let patches = await Promise.all(diffPromise)
  // 没有匹配的旧资源将全部进行删除操作
  oFiles.forEach(oFile => {
    if (!oFile.isFound) {
      patches.push({action: DELETE, name: oFile.name})
    }
  })
  return patches
}

// 文件还原操作
export async function applyDirctory(original, patches, dist) {
  // 文件夹解压
  const patchesDist = patches.replace(/\.zip$/, '')
  await unzipFile(patches, patchesDist)
  // 读取 update.json 文件
  const updateJsonPath = path.join(patchesDist, 'update.json')
  const updateJson = await fsp.readJson(updateJsonPath)
  // 遍历 update.json 文件，执行相应操作 insert/update/detele
  await fsp.mkdirs(dist)
  let uptatePromise = updateJson.map(async update => {
    const { name, action } = update
    const filepath = path.join(patchesDist, name)
    const target = path.join(dist, name)
    const originalpath = path.join(original, name)

    // 插入 直接将增量包中的文件 复制 到dist
    if (action === INSERT) {
      await fsp.copy(filepath, target)
      return update
    }

    // 更新 将增量包中的文件与原文件还原成新文件 保存到dist
    if (action === UPDATE) {
      let patchText = await fsp.readFile(filepath, 'utf8')
      let originalText = await fsp.readFile(originalpath, 'utf8')
      let freshlyText = applyToText(originalText, patchText)
      if (!freshlyText) {
        throw new Error('文件还原操作发生错误 ' + name)
      }
      await fsp.outputFile(target, new Buffer(freshlyText), 'utf8')
      return update
    }

    // 删除 不做操作
    if (action === DELETE) {
      return update
    }

    // 正常 将原文件夹中的文件 复制到 dist
    await fsp.copy(originalpath, target)
    return update
  })

  let updateResult = await Promise.all(uptatePromise)
  await fsp.remove(patchesDist)
  return updateResult
}

// 文件解压
export async function unzipFile(src, dist) {
  await fsp.mkdirs(dist)
  await new Promise((resolve, reject) => {
    fs.createReadStream(src)
      .pipe(unzip.Extract({ path: dist }))
      .on('error', (err) => reject(err))
      .on('close', () => resolve(dist))
  })
  return dist
}

// 文件 MD5
export async function md5File(filepath) {
  const buf = await fsp.readFile(filepath)
  return md5(buf)
}

// 数据查找
function includesFile(files, name) {
  for (var i = 0; i < files.length; i++) {
    if (files[i].name === name) {
      return files[i]
    }
  }
}

const diff = new DiffMatchPatch()

// 文本对比
function patchToText(originalText, freshlyText) {
  const patches = diff.patch_make(originalText, freshlyText)
  return diff.patch_toText(patches)
}

// 文本还原
function applyToText(originalText, patchText) {
  let patch = diff.patch_fromText(patchText)
  let [freshlyText, isSuccess] = diff.patch_apply(patch, originalText)
  if (isSuccess) return freshlyText
}
