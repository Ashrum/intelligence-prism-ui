import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import temml from 'temml'
import { createTestRuntime } from './helpers/test-runtime.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
const file = new URL('bundle.mjs', await createTestRuntime('p185'))
writeFileSync(file, (await build({
  stdin: { contents: "export * from './components/prism-next/formula-tools'", loader: 'tsx', resolveDir: root },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
})).outputFiles[0].text)
const { FormulaQuickTools, FormulaFloatingToolbar } = await import(file)
const h = React.createElement
const children = node => React.Children.toArray(node?.props?.children)
const walk = node => React.isValidElement(node) ? [node, ...children(node).flatMap(walk)] : []
const read = path => readFileSync(root + path, 'utf8')
test('default row markup equals explicit row and retains nine original buttons', () => {
  const props = { onInsert() {}, trailing: h('span', null, '宿主') }
  const markup = renderToStaticMarkup(h(FormulaQuickTools, props))
  assert.equal(markup, renderToStaticMarkup(h(FormulaQuickTools, { ...props, variant: 'row' })))
  assert.equal((markup.match(/<button/g) ?? []).length, 9)
  assert.match(markup, /role="group"/)
  assert.match(markup, /插入正负/)
  assert.doesNotMatch(markup, /toolbar-symbol/)
})
test('floating uses eight symbol buttons, separators, shortcut tooltips and optional finish', () => {
  const tree = FormulaQuickTools({ variant: 'floating', onInsert() {}, trailing: h('button', null, '图片'), finish: { onFinish() {} } })
  const markup = renderToStaticMarkup(tree)
  assert.match(markup, /role="toolbar"/)
  assert.equal((markup.match(/prism-formula-toolbar-symbol/g) ?? []).length, 8)
  assert.match(markup, /a⁄b/)
  assert.doesNotMatch(markup, /插入正负/)
  assert.match(markup, /完成（Enter）/)
  assert.equal((markup.match(/data-slot="toolbar-separator"/g) ?? []).length, 2)
  const tips = walk(tree).filter(node => node.props.side === 'bottom')
  assert.equal(tips.length, 9)
  assert.match(renderToStaticMarkup(h('div', null, tips.flatMap(children))), /sqrt/)
  assert.match(renderToStaticMarkup(h('div', null, tips.flatMap(children))), /pi/)
  assert.doesNotMatch(renderToStaticMarkup(FormulaQuickTools({ variant: 'floating', onInsert() {} })), /完成（Enter）/)
})
test('pointer handlers preserve focus and insertion and finish emit only host intents', () => {
  const calls = []
  const tree = FormulaQuickTools({ variant: 'floating', onInsert: value => calls.push(value), finish: { onFinish: () => calls.push('finish') } })
  const buttons = walk(tree).map(node => node.props.render).filter(node => node?.props.onClick)
  assert.equal(buttons.length, 9)
  let prevented = 0
  tree.props.onPointerDown({ preventDefault() { prevented++ } })
  for (const button of buttons) button.props.onPointerDown({ preventDefault() { prevented++ } })
  assert.equal(prevented, 10)
  buttons[0].props.onClick(); buttons.at(-1).props.onClick()
  assert.deepEqual(calls, [String.raw`\frac{#?}{#?}`, 'finish'])
})
test('positioning contract delegates top/start 8px, collision flip and focus preservation to Base UI', () => {
  assert.equal(FormulaFloatingToolbar({ open: false, anchor: {}, onInsert() {} }), null)
  assert.equal(FormulaFloatingToolbar({ open: true, anchor: null, onInsert() {} }), null)
  const anchor = {}, tree = FormulaFloatingToolbar({ open: true, anchor, onInsert() {} })
  const nodes = walk(tree), positioner = nodes.find(node => node.props.anchor === anchor)
  assert.equal(positioner.props.side, 'top'); assert.equal(positioner.props.align, 'start'); assert.equal(positioner.props.sideOffset, 8)
  assert.equal(positioner.props.collisionAvoidance.side, 'flip')
  assert.equal(nodes.find(node => 'initialFocus' in node.props).props.initialFocus, false)
  assert.equal(nodes.find(node => 'finalFocus' in node.props).props.finalFocus, false)
  assert.equal(tree.props.modal, false)
})
test('inline fraction rule enlarges ordinary mfrac but excludes explicit tfrac; source and script structures stay intact', () => {
  const css = read('app/(next)/next/theme.css')
  assert.match(css, /\.prism-math:not\(\[display="block"\]\) mfrac:not\(mstyle\[displaystyle="false"\] \*\) \{ math-style:normal; \}/)
  assert.match(css, /\.prism-math \{[^}]*font-size:1\.125em/)
  const source = String.raw`\frac{x^2}{\sqrt[3]{y}}+\tfrac{1}{2}`
  const html = temml.renderToString(source, { annotate: true })
  assert.match(html, /<msup>/); assert.match(html, /<mroot>/)
  assert.match(html, /<mstyle displaystyle="false" scriptlevel="0"><mfrac>/)
  assert.ok(html.includes(source), 'annotation retains original TeX')
})
