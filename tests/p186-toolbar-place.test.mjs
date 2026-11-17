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
const file = new URL('bundle.mjs', await createTestRuntime('p186'))
writeFileSync(file, (await build({
  stdin: { contents: "export * from './components/prism-next/formula-tools'", loader: 'tsx', resolveDir: root },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
})).outputFiles[0].text)
const { FormulaQuickTools, FormulaFloatingToolbar } = await import(file)
const h = React.createElement
const children = node => React.Children.toArray(node?.props?.children)
const walk = node => React.isValidElement(node) ? [node, ...children(node).flatMap(walk)] : []
const read = path => readFileSync(root + path, 'utf8')

test('defaults preserve explicit math markup for both variants', () => {
  for (const variant of ['row', 'floating']) {
    const props = { variant, onInsert() {} }
    assert.equal(renderToStaticMarkup(h(FormulaQuickTools, props)), renderToStaticMarkup(h(FormulaQuickTools, { ...props, toolset: 'math' })))
  }
})
test('placement forwards both directions, alignments and zero offset without changing collision policy', () => {
  for (const side of ['top', 'bottom']) for (const align of ['start', 'end']) {
    const anchor = {}, tree = FormulaFloatingToolbar({ anchor, open: true, side, align, sideOffset: 0, onInsert() {} })
    const positioner = walk(tree).find(node => node.props.anchor === anchor)
    assert.deepEqual([positioner.props.side, positioner.props.align, positioner.props.sideOffset], [side, align, 0])
    assert.deepEqual(positioner.props.collisionAvoidance, { side: 'flip', align: 'shift', fallbackAxisSide: 'none' })
  }
})
test('four toolsets retain quick symbols and append the four subject tools; text emits host intents', () => {
  const labels = { physics: ['矢量', '米每秒', '牛顿', '加速度单位'], chemistry: ['水', '反应箭头', '可逆反应', '化学方程式'] }
  for (const variant of ['row', 'floating']) for (const toolset of ['math', 'physics', 'chemistry', 'text']) {
    const calls = []
    const tree = FormulaQuickTools({ variant, toolset, onInsert: value => calls.push(value), onOpenFormula: () => calls.push('formula'), onInsertUnderline: () => calls.push('underline') })
    const html = renderToStaticMarkup(tree)
    assert.equal((html.match(/<button/g) ?? []).length, toolset === 'text' ? 2 : (variant === 'row' ? 9 : 8) + (toolset === 'math' ? 0 : 4))
    for (const label of labels[toolset] ?? []) assert.ok(html.includes('插入' + label))
    const nodes = walk(tree)
    for (const node of nodes.filter(node => 'side' in node.props)) assert.equal(node.props.side, 'bottom')
    const buttons = nodes.flatMap(node => [node, node.props.render]).filter(node => node?.props.onClick)
    for (const button of buttons) {
      let prevented = false
      button.props.onPointerDown({ preventDefault() { prevented = true } })
      assert.ok(prevented)
    }
    if (toolset === 'text') {
      assert.doesNotMatch(html, /插入分数|插入正负/)
      for (const button of buttons) button.props.onClick()
      assert.deepEqual(calls, ['formula', 'underline'])
    } else if (toolset !== 'math') {
      buttons.at(-1).props.onClick()
      assert.equal(calls.length, 1)
      assert.ok(calls[0].includes(toolset === 'physics' ? 'm/s^2' : '2H2'))
    }
  }
})
test('formula slot stays inside first group before separator and trailing; finish is primary outline', () => {
  const tree = FormulaQuickTools({ variant: 'floating', onInsert() {}, formulaTrailing: h('button', null, '粘贴公式'), trailing: h('button', null, '图片'), finish: { onFinish() {} } })
  const html = renderToStaticMarkup(tree)
  assert.ok(html.indexOf('粘贴公式') < html.indexOf('data-slot="toolbar-separator"'))
  assert.ok(html.indexOf('data-slot="toolbar-separator"') < html.indexOf('图片'))
  const finish = walk(tree).map(node => node.props.render).find(node => node?.props['aria-label'] === '完成（Enter）')
  assert.equal(finish.props.render.props.variant, 'outline')
  assert.equal(finish.props.render.props.className, 'border-primary/40 text-primary')
  assert.equal(walk(tree).filter(node => node.props.side === 'bottom').length, 9)
})
