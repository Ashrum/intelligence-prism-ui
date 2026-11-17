import test from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTestRuntime } from './helpers/test-runtime.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const file = new URL('bundle.mjs', await createTestRuntime('p187'))
writeFileSync(file, (await build({
  stdin: { contents: "export * from './components/prism-next/formula-tools'; export * from './lib/prism-next/math-field-tools'", loader: 'tsx', resolveDir: root },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
})).outputFiles[0].text)
const { FormulaQuickTools, chemistryToolbarTools, biologyToolbarTools, chemistrySnippets, mathFieldSubjectTools } = await import(file)
const h = React.createElement
const walk = node => React.isValidElement(node)
  ? [node, ...React.Children.toArray(node.props.children).flatMap(walk), ...walk(node.props.render)] : []
const chemistry = [
  ['H₂O', '化学式 / 方程式', 'onOpenChemistry', ''],
  ['⬡', '结构式', 'onOpenStructure', undefined],
  ['→', '反应箭头（可带条件）', 'onOpenChemistry', '->'],
  ['⇌', '可逆', 'onOpenChemistry', '<=>'],
  ['↑', '气体', 'onOpenChemistry', ' ^'],
  ['↓', '沉淀', 'onOpenChemistry', ' v'],
  ['ⁿ⁺', '离子电荷', 'onOpenChemistry', '^'],
  ['·', '结晶水点', 'onOpenChemistry', '*'],
  ['△', '加热', 'onOpenChemistry', '->[△]'],
  ['ΔH', '反应热', 'onInsert', String.raw`\Delta H=#?\ \mathrm{kJ\cdot mol^{-1}}`],
]
const biology = [
  ['♀', '雌', 'onInsert', String.raw`\text{♀}`],
  ['♂', '雄', 'onInsert', String.raw`\text{♂}`],
  ['×', '杂交', 'onInsert', String.raw`\times`],
  ['P', '亲本', 'onInsert', String.raw`\mathrm{P}`],
  ['F₁', '子一代', 'onInsert', String.raw`\mathrm{F_{#?}}`],
  ['Xᴮ', '伴性基因（上标）', 'onInsert', 'X^{#?}'],
  ['→', '箭头（可带条件）', 'onInsert', String.raw`\xrightarrow{#?}`],
  ['H₂O', '化学式 / 方程式', 'onOpenChemistry', ''],
  ['5′', '序列方向', 'onInsertText', '5′--3′'],
]
const actions = ['onInsert', 'onOpenChemistry', 'onOpenStructure', 'onInsertText']

test('P187 tool definitions preserve exact order, names, faces, actions and payloads', () => {
  for (const [tools, expected] of [[chemistryToolbarTools, chemistry], [biologyToolbarTools, biology]]) {
    assert.deepEqual(tools.map(tool => [tool.face, tool.label, tool.action, tool.value]), expected)
  }
  assert.deepEqual(chemistrySnippets, chemistry.slice(2, 9).map(([face, label, , snippet]) => ({ label, face, snippet })))
})

for (const [toolset, expected] of [['chemistry', chemistry], ['biology', biology]]) {
  for (const variant of ['row', 'floating']) {
    test(`P187 ${toolset}/${variant} renders only its tools and dispatches each intent with preserved focus`, () => {
      const calls = []
      const callbacks = Object.fromEntries(actions.map(action => [action, (...args) => calls.push([action, args])]))
      const tree = FormulaQuickTools({ toolset, variant, ...callbacks })
      const nodes = walk(tree)
      const buttons = nodes.filter(node => node.props.onClick)
      assert.deepEqual(buttons.map(node => node.props['aria-label']), expected.map(tool => tool[1]))
      for (const [index, button] of buttons.entries()) {
        const [face, , action, value] = expected[index]
        assert.equal((button.props.render?.props.size ?? button.props.size), face.length > 2 ? 'sm' : 'icon-sm')
        assert.equal(button.props.disabled, false)
        let prevented = false
        button.props.onPointerDown({ preventDefault() { prevented = true } })
        assert.equal(prevented, true)
        button.props.onClick()
        assert.deepEqual(calls.at(-1), [action, value === undefined ? [] : [value]])
      }
      assert.equal(calls.length, expected.length)
      assert.equal(nodes.filter(node => node.props.side === 'bottom').length, expected.length)
      const html = renderToStaticMarkup(tree)
      assert.equal((html.match(/<button\b/g) ?? []).length, expected.length)
      assert.doesNotMatch(html, /插入分数|插入根号|插入圆周率/)
      assert.equal(html.includes('lucide-hexagon'), toolset === 'chemistry')
    })

    test(`P187 ${toolset}/${variant} keeps missing callbacks visible and disables only affected buttons`, () => {
      for (const missing of [...actions, 'all', 'disabled']) {
        const callbacks = Object.fromEntries(actions.map(action => [action, () => {}]))
        if (missing === 'all') for (const action of actions) delete callbacks[action]
        else delete callbacks[missing]
        const tree = FormulaQuickTools({ toolset, variant, ...callbacks, disabled: missing === 'disabled' })
        const tags = renderToStaticMarkup(tree).match(/<button\b[^>]*>/g)
        assert.equal(tags.length, expected.length)
        for (const [index, tag] of tags.entries()) {
          const action = expected[index][2]
          assert.equal(/ disabled=""/.test(tag), missing === 'all' || missing === 'disabled' || missing === action)
        }
      }
    })
  }

  test(`P187 ${toolset} keeps formula slot, separator, trailing and finish in order`, () => {
    const calls = []
    const tree = FormulaQuickTools({ toolset, variant: 'floating', onInsert() {},
      formulaTrailing: h('button', null, '粘贴公式'), trailing: h('button', null, '图片 / 表格 / 更多'),
      finish: { onFinish: () => calls.push('finish') },
    })
    const html = renderToStaticMarkup(tree)
    assert.ok(html.indexOf(expected.at(-1)[1]) < html.indexOf('粘贴公式'))
    assert.ok(html.indexOf('粘贴公式') < html.indexOf('data-slot="toolbar-separator"'))
    assert.ok(html.indexOf('data-slot="toolbar-separator"') < html.indexOf('图片 / 表格 / 更多'))
    assert.ok(html.indexOf('图片 / 表格 / 更多') < html.indexOf('完成（Enter）'))
    walk(tree).find(node => node.props['aria-label'] === '完成（Enter）').props.onClick()
    assert.deepEqual(calls, ['finish'])
  })
}

test('P187 preserves math/physics/text buttons and the MathField chemistry keyboard data', () => {
  const math = ['分数', '根号', '上标', '下标', '括号', '小于等于', '不等于', '正负', '圆周率']
  for (const variant of ['row', 'floating']) for (const toolset of ['math', 'physics', 'text']) {
    const calls = []
    const tree = FormulaQuickTools({ toolset, variant, onInsert: value => calls.push(value), onOpenFormula: () => calls.push('formula'), onInsertUnderline: () => calls.push('underline') })
    const buttons = walk(tree).filter(node => node.props.onClick)
    const expected = toolset === 'text' ? ['插入公式', '下划线（填空线）'] : [
      ...math.filter(label => variant === 'row' || label !== '正负'),
      ...(toolset === 'physics' ? ['矢量', '米每秒', '牛顿', '加速度单位'] : []),
    ].map(label => '插入' + label)
    assert.deepEqual(buttons.map(node => node.props['aria-label']), expected)
    buttons.forEach(button => button.props.onClick())
    assert.equal(calls.length, expected.length)
    if (toolset === 'text') assert.deepEqual(calls, ['formula', 'underline'])
    else assert.equal(calls[0], String.raw`\frac{#?}{#?}`)
  }
  assert.deepEqual(mathFieldSubjectTools.chemistry.map(({ label, latex, face, keyboardSpan }) => [label, latex, face, keyboardSpan]), [
    ['水', String.raw`\ce{H2O}`, 'H₂O', 2],
    ['反应箭头', String.raw`\rightarrow`, '→', undefined],
    ['可逆反应', String.raw`\rightleftharpoons`, '⇌', undefined],
    ['化学方程式', String.raw`\ce{2H2 + O2 -> 2H2O}`, '2H₂+O₂→2H₂O', 4],
  ])
})
