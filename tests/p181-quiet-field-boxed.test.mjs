import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import React from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import { createTestRuntime } from './helpers/test-runtime.mjs'

const runtime = await createTestRuntime('p181'), h = React.createElement
const baseline = 'aa86cfee819b2306842518e87f41a0b1aaea2fa7'
async function bundle(name, before = false) {
  const output = await build({
    stdin: { contents: `export * from './components/prism-next/authoring-surface';
export * from './components/prism-next/formula-tools';
export { Input } from './components/coss/input'; export { Textarea } from './components/coss/textarea';`, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': process.cwd() }, loader: { '.css': 'empty' }, write: false,
    plugins: before ? [{ name: 'frozen-main', setup(b) {
      b.onLoad({ filter: /components\/prism-next\/authoring-surface\.tsx$/ }, () => ({ contents: execFileSync('git', ['show', `${baseline}:components/prism-next/authoring-surface.tsx`], { encoding: 'utf8' }), loader: 'tsx' }))
    } }] : [],
  })
  const file = new URL(`${name}.mjs`, runtime)
  await writeFile(file, output.outputFiles[0].text)
  return import(file.href)
}
const api = await bundle('current'), before = await bundle('main', true)
const css = await readFile('components/prism-next/authoring-surface.css', 'utf8')
const paletteCSS = await readFile('components/prism-next/math-field.css', 'utf8')

test('default and explicit quiet output match frozen main bytes in all five themes, including nested controls and toolbar', () => {
  for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
    for (const kind of ['input', 'textarea', 'contenteditable']) {
      for (const nested of [false, true]) {
        const tree = (exports, props = {}) => {
          let control = kind === 'contenteditable'
            ? h('div', { contentEditable: true, role: 'textbox', 'aria-label': '题干', className: 'text-read-body' })
            : h(kind === 'input' ? exports.Input : exports.Textarea, { defaultValue: '已知 a + b = 5', 'aria-label': '题干', className: 'text-read-body' })
          if (nested) control = h('div', {}, h('div', {}, control))
          return h('section', { 'data-prism-theme': theme }, h(exports.QuietField, { id: 'quiet', className: 'host-field', toolbar: h(exports.Input, { 'aria-label': '工具' }), ...props }, control))
        }
        assert.equal(render(tree(api)), render(tree(before)))
        assert.equal(render(tree(api, { appearance: 'quiet' })), render(tree(before)))
      }
    }
  }
})

test('boxed keeps leading, trailing and toolbar separate from the editable surface; ChoiceKey is unchanged', () => {
  const choice = h(api.ChoiceKey, { selected: true, 'aria-label': '正确答案 B' }, 'B')
  const html = render(h(api.QuietField, { appearance: 'boxed', leading: choice, trailing: h('button', { type: 'button', 'aria-label': '删除选项 B' }, '×'), toolbar: h('button', {}, '公式') }, h(api.Input, { className: 'text-read-body', defaultValue: '√3' })))
  for (const slot of ['quiet-field-leading', 'quiet-field-trailing', 'quiet-field-toolbar']) assert.ok(html.includes(`data-slot="${slot}"`))
  assert.ok(html.includes(render(choice)))
  assert.match(html, /data-appearance="boxed"/)
  assert.match(html, /text-read-body prism-quiet-field-input prism-quiet-field-control/)
  assert.match(html, /value="√3"/)
  assert.doesNotMatch(html, /\s(?:appearance|lines|leading|trailing|invalid|message)=/)
  assert.match(css, /\.prism-quiet-field-leading, \.prism-quiet-field-trailing\s*\{[^}]*align-items: center; align-self: center/)
})

test('invalid and a unique description reach the first actual nested input, preserving host description and later tool inputs', () => {
  const field = (Control, extra = {}) => h(api.QuietField, { appearance: 'boxed', invalid: true, message: '等号右边缺内容' }, h('div', {}, h(React.Fragment, {},
    h('div', {}, h(Control, { ...extra, 'aria-label': '题干', 'aria-describedby': 'host-help' })),
    h(api.Input, { 'aria-label': '工具输入', 'aria-describedby': 'tool-help' }),
  )))
  const html = render(h('div', {}, field(api.Input), field(api.Textarea), field('div', { contentEditable: true, role: 'textbox' })))
  const messages = [...html.matchAll(/<p id="([^"]+)" data-slot="quiet-field-message"/g)].map(m => m[1])
  assert.equal(messages.length, 3)
  assert.equal(new Set(messages).size, 3)
  for (const id of messages) assert.ok(html.includes(`aria-describedby="host-help ${id}"`))
  for (const tag of html.match(/<(?:input|textarea|div)\b[^>]*aria-label="题干"[^>]*>/g)) assert.match(tag, /aria-invalid="true"/)
  const tools = html.match(/<input\b[^>]*aria-label="工具输入"[^>]*>/g)
  assert.equal(tools.length, 3)
  for (const tool of tools) { assert.match(tool, /aria-describedby="tool-help"/); assert.doesNotMatch(tool, /aria-invalid/) }
  assert.match(render(h(api.QuietField, { appearance: 'boxed', invalid: false }, h(api.Input, { 'aria-invalid': true }))), /aria-invalid="false"/)
})

test('boxed minimum lines are finite positive integers and size the actual nested writing area', () => {
  for (const [lines, expected] of [[undefined, 1], [3, 3], [0, 1], [-2, 1], [2.5, 3], [Infinity, 1], [NaN, 1]]) {
    const html = render(h(api.QuietField, { appearance: 'boxed', lines }, h('div', {}, h(api.Textarea))))
    assert.ok(html.includes(`--quiet-field-lines:${expected}`))
  }
  assert.match(css, /min-height: calc\(var\(--quiet-field-lines, 1\) \* 30px \+ 22px\)/)
  assert.match(css, /\.prism-quiet-field-input > \[data-slot="textarea"\]/)
  assert.match(css, /min-height: calc\(var\(--quiet-field-lines, 1\) \* 30px\);[\s\S]*height: auto; padding: 0; line-height: 30px/)
})

test('boxed states use scoped semantic paint, real focus-within, invalid precedence and reduced-motion fallback', () => {
  const boxed = css.slice(css.indexOf('/* P181'))
  for (const token of ['--background', '--card', '--foreground', '--border', '--brand-blue-text', '--brand-blue', '--brand-magenta-text']) assert.ok(boxed.includes(`var(${token})`))
  assert.match(boxed, /\[data-appearance="boxed"\]:hover/)
  assert.match(boxed, /\[data-appearance="boxed"\]:focus-within/)
  assert.ok(boxed.indexOf(':is([data-invalid="true"]') > boxed.indexOf(':focus-within'))
  assert.match(boxed, /&::placeholder.*--muted-foreground/)
  assert.match(boxed, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition: none/)
  assert.match(css, /\.prism-ai-field\[data-state="done"\][^\n]*:not\(\[data-appearance="boxed"\]\)/)
  assert.doesNotMatch(boxed, /#[0-9a-f]{3,8}\b|font-size:/i)
})

test('long formula names have separate symbol and label rows, container-sized columns and no third line', () => {
  const html = render(h(api.FormulaPalette, { onInsert() {} }))
  assert.match(html, /class="prism-formula-palette-grid"/)
  assert.match(html, /title="分段函数" aria-label="插入分段函数"/)
  assert.match(html, /class="prism-formula-palette-face" aria-hidden="true">f\(x\)<\/span><span class="prism-formula-palette-label text-ui-hint">分段函数<\/span>/)
  assert.match(paletteCSS, /repeat\(auto-fit, minmax\(min\(100%, 6rem\), 1fr\)\)/)
  assert.match(paletteCSS, /\.prism-formula-palette-tool\[data-slot="button"\][^}]*flex-direction: column;[^}]*height: 56px;[^}]*min-width: 0/)
  assert.match(paletteCSS, /\.prism-formula-palette-label[^}]*max-width: 100%;[^}]*overflow: hidden;[^}]*white-space: nowrap/)
})
