import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import temml from 'temml'
import { previewDraft as preview } from '../lib/prism-next/draft-math.ts'
const previewDraft=value=>preview(value,temml.renderToString)
const math=value=>previewDraft(value).filter(part=>part.kind==='math').map(part=>part.html).join('')

test('current Unicode algebra renders without rewriting prose or the source draft',()=>{
 const value='已知函数 f(x) = x² − 2x + 1，x ∈ R。\n当 0 ≤ x ≤ 3 时，求 (x − 2)² − 1 的最小值。'
 const parts=previewDraft(value)
 assert.equal(parts.map(part=>part.source).join(''),value)
 assert.equal(parts.some(part=>part.kind==='error'),false)
 assert.match(math(value),/<msup>/);assert.match(math(value),/<mo>∈<\/mo>/);assert.match(math(value),/<mo>≤<\/mo>/)
 const changed=value.replace('x² − 2x','y³ − 7y')
 assert.notEqual(math(value),math(changed));assert.match(math(changed),/<mi>y<\/mi>/)
})
test('explicit fractions and roots render and errors show the current input, never old output',()=>{
 const good=String.raw`求 \(\frac{1}{\sqrt{x^2+1}}\) 的值。`
 assert.match(math(good),/<mfrac>/);assert.match(math(good),/<msqrt>/)
 for(const value of [String.raw`\(\frac{1}{x\)`,String.raw`\(\unknown{x}\)`,String.raw`\(x^2`,String.raw`\)`]){
  const parts=previewDraft(value)
  assert.ok(parts.some(part=>part.kind==='error'));assert.equal(parts.map(p=>p.source).join(''),value)
  assert.equal(parts.some(part=>part.kind==='math'),false)
 }
 assert.equal(previewDraft(good).some(p=>p.kind==='error'),false)
})
test('ordinary prose, empty fields and line breaks remain plain content',()=>{
 for(const value of ['', '这是中文说明。\nFind the minimum value.','编号 123。']){
  const parts=previewDraft(value);assert.equal(parts.map(p=>p.source).join(''),value);assert.equal(parts.every(p=>p.kind==='text'),true)
 }
})
test('untrusted markup, presentation overrides and oversized formulas cannot become active output',()=>{
 for(const value of [String.raw`\(\href{javascript:alert(1)}{x}\)`,String.raw`\(\includegraphics{https://example.test/x}\)`,String.raw`\(\textcolor{white}{x}\)`,String.raw`\(\def\a{\a}\a\)`,String.raw`\(${ 'x'.repeat(1001) }\)`])assert.ok(previewDraft(value).some(p=>p.kind==='error'))
 const raw='<img src=x onerror=alert(1)>'
 assert.equal(previewDraft(raw).map(p=>p.source).join(''),raw)
 assert.doesNotMatch(math(raw),/<img|<script|href=/)
 const long='长'.repeat(12001);assert.equal(previewDraft(long)[0].source,long);assert.equal(previewDraft(long)[0].kind,'error')
})

test('production keeps the formula module intact so its lexer still parses commands',async t=>{
 const directory=new URL('../dist/client/assets/',import.meta.url)
 if(!existsSync(directory)){t.skip('Run the production build to verify the emitted module.');return}
 const asset=readdirSync(directory).find(name=>/^temml-.*\.mjs$/.test(name))
 assert.ok(asset,'The same-origin Temml module must be emitted with the client assets.')
 const url=new URL(asset,directory)
 assert.deepEqual(readFileSync(url),readFileSync(new URL('../node_modules/temml/dist/temml.mjs',import.meta.url)))
 const renderer=(await import(url.href)).default.renderToString
 const parts=preview(String.raw`\(\frac{1}{\sqrt{x^2+1}}\)`,renderer)
 assert.equal(parts[0].kind,'math');assert.match(parts[0].html,/<mfrac>/);assert.match(parts[0].html,/<msqrt>/)
})
