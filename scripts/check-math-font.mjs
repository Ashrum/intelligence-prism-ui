import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const font = readFileSync(new URL('public/fonts/typography-review/stix-two-math.woff2', root))
assert.equal(font.toString('ascii', 0, 4), 'wOF2', 'The mathematics font must be WOFF2')
assert.equal(createHash('sha256').update(font).digest('hex'), '094191335def3f0452c81ec0713cfc2f29bb6af8cecbf79b60881fbf2db97562', 'Preserve the complete STIX Two Math font and its MATH tables')
assert.ok(readFileSync(new URL('public/fonts/typography-review/STIX-OFL.txt', root), 'utf8').includes('SIL OPEN FONT LICENSE'))
console.log('STIX Two Math: complete pinned asset and license verified.')
