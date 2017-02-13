import comparison, { applyDirctory, md5File, INSERT, UPDATE, DELETE, NORMAL } from '../src/folder-comparison'
import path from 'path'
import md5 from 'md5'
import fsp from 'fs-promise'

const patch = path.resolve(__dirname, './patch')
const zippath = path.resolve(__dirname, './patch/1.0.0-1.0.1.zip')
const original = path.resolve(__dirname, './diff-test-1.0.0')
const freshly = path.resolve(__dirname, './diff-test-1.0.1')
const dist = path.resolve(__dirname, './diff-test-1.0.1-new')

afterAll(async () => {
  await fsp.remove(patch)
  await fsp.remove(dist)
})

it('文件夹比对生成增量文件压缩包', async () => {
  await comparison(original, freshly, zippath)
  const zipText = await fsp.readFile(zippath + '.md5', 'utf8')
  const md5Text = await md5File(zippath)
  expect(md5Text).toEqual(zipText)
})

it('解压文件并还原', async () => {
  const updateResult = await applyDirctory(original, zippath, dist)
  const inset = updateResult.filter(item => item.action === INSERT)[0]
  const update = updateResult.filter(item => item.action === UPDATE)[0]
  const dele = updateResult.filter(item => item.action === DELETE)[0]
  const normal = updateResult.filter(item => item.action === NORMAL)[0]

  expect(inset.name).toEqual('b.jpg')
  expect(update.name).toEqual('a.js')
  expect(dele.name).toEqual('a.jpg')
  expect(normal.name).toEqual('c.js')
})

