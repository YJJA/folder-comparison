import DiffMatchPatch from 'diff-match-patch'

const diff = new DiffMatchPatch()

// patch
export function patch(text1, text2) {
  const patches = diff.patch_make(text1, text2)
  return diff.patch_toText(patches)
}

// apply
export function apply(text1, patchText) {
  const patches = diff.patch_fromText(patchText)
  const [text2, result] = diff.patch_apply(patches, text1)
  if (result) return text2
}

export default {patch, apply}
