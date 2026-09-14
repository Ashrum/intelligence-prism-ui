import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(process.argv[2] || resolve(dirname(fileURLToPath(import.meta.url)), '..'))
const read = path => readFileSync(resolve(root, path))
const manifest = JSON.parse(read('public/fonts/reading/manifest.json'))
const css = read('app/fonts.css').toString()
// Only the archived design uses these bundled reading fonts. The new coss
// design uses the system UI font and the separately bundled mathematics font.
const textSources = ['app/(legacy)', 'components/prism', 'components/ui'].flatMap(dir => readdirSync(resolve(root, dir), { recursive: true }).filter(file => /\.tsx?$/.test(file)).map(file => `${dir}/${file}`)).concat('app/chatgpt-auth.ts').sort()
assert.deepEqual(manifest.textSources, textSources, 'Font corpus differs from the legacy source inventory')
const requested = new Set([...textSources.map(file => read(file).toString()).join('\n')].map(c => c.codePointAt(0)))
assert(read('app/(legacy)/layout.tsx').toString().includes('import "../fonts.css"'), 'Reading fonts must be imported by the legacy root layout')
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
  const variations = []
  for (const file of files) {
    assert(/^(sans|serif)-(common|\d+)-[0-9a-f]{12}\.woff2$/.test(file.file), 'Invalid font path')
    const bytes = read(`public/fonts/reading/${file.file}`)
    assert.equal(bytes.length, file.bytes, `${file.file}: size mismatch`)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${file.file}: hash mismatch`)
    assert.equal(file.weight, source.weight, `${file.file}: weight mismatch`)
    const declared = points(file.unicodeRange)
    assert(Array.isArray(file.variationSequences), `${file.file}: missing variation sequence inventory`)
    for (const sequence of file.variationSequences) {
      assert(/^[0-9A-F]{4,6} [0-9A-F]{4,6}$/.test(sequence), `${file.file}: invalid variation sequence`)
      assert(declared.has(parseInt(sequence.split(' ')[0], 16)), `${file.file}: variation base outside shard`)
      variations.push(sequence)
    }
    assert.equal(declared.size, file.characters, `${file.file}: character count mismatch`)
    for (const cp of declared) {
      assert(!covered.has(cp), `${source.family}: overlapping unicode ranges`)
      covered.add(cp)
    }
    const rule = `@font-face { font-family: '${file.family}'; src: url('/fonts/reading/${file.file}') format('woff2'); font-style: normal; font-weight: ${file.weight}; font-display: swap; unicode-range: ${file.unicodeRange}; }`
    assert(css.includes(rule), `${file.file}: CSS and manifest differ`)
  }
  assert.equal(covered.size, source.characters, `${source.family}: incomplete declared source coverage`)
  assert.equal(new Set(variations).size, variations.length, `${source.family}: duplicate variation sequences`)
  assert.deepEqual(variations.sort(), source.variationSequences, `${source.family}: incomplete variation sequence inventory`)
  const missing = [...requested].filter(cp => covered.has(cp) && !commonPoints.has(cp) && cp >= 0x20)
  assert.equal(missing.length, 0, `${source.family}: ${missing.length} app/components source characters fall outside the common shard (${missing.map(cp => String.fromCodePoint(cp)).join('')}). Rebuild with scripts/build-reading-fonts.py and the pinned source fonts.`)
}
console.log('Reading fonts: common coverage, declared ranges, variation inventory, asset hashes and CSS references verified.')
