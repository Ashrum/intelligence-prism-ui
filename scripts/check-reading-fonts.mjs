import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(process.argv[2] || resolve(dirname(fileURLToPath(import.meta.url)), '..'))
const read = path => readFileSync(resolve(root, path))
const manifest = JSON.parse(read('public/fonts/reading/manifest.json'))
const css = read('app/review/reading-review/fonts.css').toString()
const requested = new Set([...read('app/review/reading-review/reading-review.tsx').toString()].map(c => c.codePointAt(0)))
const points = value => {
  const result = new Set()
  for (const range of value.split(',')) {
    const match = /^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/.exec(range)
    assert(match, `Invalid unicode range: ${range}`)
    const start = parseInt(match[1], 16)
    const end = parseInt(match[2] || match[1], 16)
    assert(start <= end && end <= 0x10ffff, `Invalid unicode range: ${range}`)
    for (let cp = start; cp <= end; cp++) result.add(cp)
  }
  return result
}

for (const source of manifest.sources) {
  const files = manifest.files.filter(file => file.family === source.family)
  const common = files.filter(file => file.file.includes('-common-'))
  assert.equal(common.length, 1, `${source.family}: expected one common shard`)
  const commonPoints = points(common[0].unicodeRange)
  const covered = new Set()
  for (const file of files) {
    assert(/^(sans|serif)-(common|\d+)-[0-9a-f]{12}\.woff2$/.test(file.file), 'Invalid font path')
    const bytes = read(`public/fonts/reading/${file.file}`)
    assert.equal(bytes.length, file.bytes, `${file.file}: size mismatch`)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${file.file}: hash mismatch`)
    assert.equal(file.weight, source.weight, `${file.file}: weight mismatch`)
    const declared = points(file.unicodeRange)
    assert.equal(declared.size, file.characters, `${file.file}: character count mismatch`)
    for (const cp of declared) {
      assert(!covered.has(cp), `${source.family}: overlapping unicode ranges`)
      covered.add(cp)
    }
    const rule = `@font-face { font-family: '${file.family}'; src: url('/fonts/reading/${file.file}') format('woff2'); font-style: normal; font-weight: ${file.weight}; font-display: swap; unicode-range: ${file.unicodeRange}; }`
    assert(css.includes(rule), `${file.file}: CSS and manifest differ`)
  }
  assert.equal(covered.size, source.characters, `${source.family}: incomplete declared source coverage`)
  const missing = [...requested].filter(cp => covered.has(cp) && !commonPoints.has(cp) && cp >= 0x20)
  assert.equal(missing.length, 0, `${source.family}: ${missing.length} source characters fall outside the common shard (${missing.map(cp => String.fromCodePoint(cp)).join('')}). Rebuild with scripts/build-reading-fonts.py and the pinned source fonts.`)
}
console.log('Reading fonts: common coverage, declared ranges, asset hashes and CSS references verified.')
