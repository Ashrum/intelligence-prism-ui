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
const file = new URL('bundle.mjs', await createTestRuntime('p188'))
writeFileSync(file, (await build({
  stdin: { contents: "export * from './components/prism-next/formula-tools'", loader: 'tsx', resolveDir: root },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
})).outputFiles[0].text)
const { FormulaQuickTools, FormulaFloatingToolbar } = await import(file)
const h = React.createElement
const children = node => React.Children.toArray(node?.props?.children)
const walk = node => React.isValidElement(node) ? [node, ...children(node).flatMap(walk)] : []
const read = path => readFileSync(root + path, 'utf8')


for (const toolset of ['math', 'physics', 'chemistry', 'biology', 'text']) {
  test(`P188 ${toolset} floating and host slots use inverse toolbar; row stays unchanged`, () => {
    const props = { toolset, onInsert() {}, formulaTrailing: h('button', null, h('span', null, 'Σ')), trailing: h('button', null, '更多') }
    const tree = FormulaQuickTools({ ...props, variant: 'floating' })
    const html = renderToStaticMarkup(tree)
    assert.equal(tree.props['data-prism-formula-floating-toolbar'], '')
    const toolbar = html.match(/<[^>]*data-slot="toolbar"[^>]*>/)[0]
    for (const cls of ['bg-foreground', 'border-foreground', 'text-background']) assert.ok(toolbar.includes(cls))
    assert.doesNotMatch(toolbar, /bg-card|text-card-foreground/)
    assert.match(html, /<button>.*Σ.*<\/button>/)
    const row = renderToStaticMarkup(FormulaQuickTools(props))
    assert.equal(row, renderToStaticMarkup(FormulaQuickTools({ ...props, variant: 'row' })))
    assert.doesNotMatch(row, /data-prism-formula-floating-toolbar|bg-foreground|border-background\/60/)
  })
}
test('P188 finish keeps outline, accessible label and Check icon', () => {
  const tree = FormulaQuickTools({ variant: 'floating', onInsert() {}, finish: { onFinish() {} } })
  const finish = walk(tree).map(node => node.props.render).find(node => node?.props['aria-label'] === '完成（Enter）')
  assert.equal(finish.props.render.props.variant, 'outline')
  assert.equal(finish.props.render.props.className, 'border-background/60 text-background')
  assert.match(renderToStaticMarkup(tree), /lucide-check/)
})
test('P188 scoped CSS covers native and coss host buttons without changing portal panels', () => {
  const css = read('components/prism-next/math-field.css')
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selector]) => selector.includes('[data-prism-formula-floating-toolbar]'))
  assert.equal(rules.length, 5)
  for (const [, selector] of rules) assert.ok(selector.includes('[data-slot="toolbar"]'))
  const rule = part => rules.find(([, selector]) => selector.includes(part))?.[2] ?? ''
  assert.match(rule(' button '), /color: var\(--background\);\s*background-color: transparent/)
  assert.match(rule(':is(:hover, :active, [data-pressed])'), /var\(--background\) 15%, transparent/)
  assert.match(rule(':focus-visible'), /--tw-ring-color: color-mix\(in srgb, var\(--background\) 60%, transparent\)/)
  assert.match(rule(':focus-visible'), /box-shadow:.*var\(--tw-ring-color\)/)
  assert.match(rule('button:is(:disabled, [aria-disabled="true"], [data-disabled])'), /opacity: 0\.4/)
  assert.match(rule('[data-slot="toolbar-separator"]'), /var\(--background\) 20%, transparent/)
  assert.doesNotMatch(rules.map(([, , declarations]) => declarations).join(''), /#[\da-f]{3,8}\b|text-primary|--primary/)
})
test('P188 dark appearance follows existing foreground/background tokens', () => {
  const theme = read('app/(next)/next/theme.css')
  assert.match(theme, /--background:#0F0F0F;\s*--foreground:#E1E5EA;/)
  assert.match(theme, /--background:#FFFFFF;\s*--foreground:#1F2328;/)
  const css = read('components/prism-next/math-field.css').split('/* P188:')[1]
  assert.doesNotMatch(css, /prefers-color-scheme|data-prism-theme|#[\da-f]{3,8}\b/)
})
