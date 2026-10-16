import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root))
const digest = data => createHash('sha256').update(data).digest('hex')
const manifest = JSON.parse(read('public/fonts/blueprint/manifest.json'))
const css = read('app/(next)/next/blueprint-fonts.css').toString()
assert.deepEqual(manifest.fonts.map(font => font.weight), [400, 500])
assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/)
assert.equal(digest(read('public/fonts/blueprint/OFL.txt')), manifest.licenseSha256)
for (const font of manifest.fonts) {
  const data = read(`public/fonts/blueprint/${font.file}`)
  assert.equal(data.toString('ascii', 0, 4), 'wOF2', `${font.weight} must be WOFF2`)
  assert.equal(data.readUInt32BE(8), data.length, 'WOFF2 declared length must match file')
  assert.equal(data.length, font.bytes)
  assert.equal(digest(data), font.sha256)
  assert.ok(font.bytes < font.sourceBytes, 'the hosted file must be a real subset')
  assert.ok(font.codepointCount >= 95 && font.codepointCount < 256)
  assert.ok(font.sourceUrl.startsWith(`https://raw.githubusercontent.com/vercel/geist-font/${manifest.sourceCommit}/`))
  assert.ok(css.includes(`/fonts/blueprint/${font.file}`))
  assert.ok(css.includes(`font-weight:${font.weight}; font-display:swap; unicode-range:${font.unicodeRange};`))
}
console.log(`Blueprint font assets: two verified WOFF2 subsets, ${manifest.fonts.reduce((sum, font) => sum + font.bytes, 0)} bytes total; OFL and generated unicode-range agree with the pinned manifest.`)
