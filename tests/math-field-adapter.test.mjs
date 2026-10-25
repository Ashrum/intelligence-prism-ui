import test from 'node:test'
import assert from 'node:assert/strict'
import temml from 'temml'
import { modelField, send } from './helpers/mathlive-model.mjs'
import { attachMathFieldComposition, mathFieldEditingValue, mathFieldOutputFormat, mathFieldDescription } from '../lib/prism-next/math-field-adapter.ts'
const render = value => temml.renderToString(value, { strict: true, throwOnError: true, trust: false })
const output = field => field.getValue(mathFieldOutputFormat)
function session(value = 'x+1') {
  const { field, model } = modelField(value)
  const states = [], commits = []
  let readOnly = false
  const adapter = attachMathFieldComposition(field, { readOnly: () => readOnly, onComposing: state => states.push(state), onCommit: () => commits.push(output(field)) })
  return { field, model, states, commits, adapter, lock: () => { readOnly = true } }
}
function compose(field, value) {
  send(field, 'compositionstart', { data: '' })
  send(field, 'compositionupdate', { data: value })
  send(field, 'compositionend', { data: value })
}
test('IME gate: candidate lifecycle blocks shortcuts, caret moves, host confirm/cancel/undo and input, then emits text once', () => {
  const { field, model, states, commits, adapter } = session()
  let nativeCalls = 0
  for (const type of ['compositionstart', 'compositionupdate', 'compositionend', 'keydown', 'input']) field.addEventListener(type, () => nativeCalls++)
  send(field, 'compositionstart', { data: '' })
  const position = model.position
  send(field, 'compositionupdate', { data: 'zhong' })
  for (const key of ['ArrowLeft', 'Enter', 'Escape', 'z']) send(field, 'keydown', { key, isComposing: true, metaKey: true })
  send(field, 'input', { inputType: 'insertCompositionText', data: 'zhong' })
  assert.equal(adapter.isComposing(), true)
  assert.equal(output(field), 'x+1'); assert.equal(model.position, position); assert.equal(commits.length, 0)
  send(field, 'compositionend', { data: '中文' })
  send(field, 'input', { inputType: 'insertCompositionText', data: '中文' })
  send(field, 'input', { inputType: 'insertText', data: '中文' })
  assert.equal(nativeCalls, 0)
  assert.equal(output(field), String.raw`x+1\text{中文}`)
  assert.equal(commits.length, 1); assert.deepEqual(states, [true, false])
  assert.doesNotThrow(() => render(output(field)))
  console.log('IME_GATE', JSON.stringify({ output: output(field), temml: true, nativeCalls }))
  adapter.dispose()
})
test('cancelled composition keeps both expression and selection', () => {
  const { field, model, commits } = session(); model.setSelection(1, 3)
  const selection = structuredClone(model.selection)
  compose(field, '')
  assert.equal(output(field), 'x+1'); assert.deepEqual(model.selection, selection); assert.equal(commits.length, 0)
})
test('selection replacement, consecutive composition merging and trailing input', () => {
  const { field, model, commits } = session(); model.setSelection(1, 3)
  compose(field, '中'); compose(field, '文')
  send(field, 'input', { inputType: 'insertCompositionText', data: '文' })
  assert.equal(output(field), String.raw`x\text{中文}`); assert.equal(commits.length, 2)
  assert.doesNotThrow(() => render(output(field)))
})
test('composition with digits/operators stays literal text; existing math remains math', () => {
  const { field } = session(String.raw`x^2+\frac{1}{2}`)
  compose(field, '中文123+x^2')
  const value = output(field)
  assert.match(value, /\\text\{/u); assert.match(value, /中文123/u)
  assert.doesNotThrow(() => render(value))
})
test('Chinese paste uses text mode at the selection; read-only blocks both paste and composition', () => {
  const { field, model, lock } = session(); model.setSelection(1, 3)
  const event = send(field, 'paste', { clipboardData: { getData: () => '中文123' } })
  assert.equal(event.defaultPrevented, true); assert.equal(output(field), String.raw`x\text{中文123}`)
  lock(); compose(field, '不能写入'); send(field, 'paste', { clipboardData: { getData: () => '不能写入' } })
  assert.equal(output(field), String.raw`x\text{中文123}`)
})
test('editing projection restores selectable empty arguments without changing opaque text, escaped braces or comments', () => {
  for (const source of [String.raw`y=\frac{1}{}x^{2}-4x+3`, String.raw`\frac{}{}`, String.raw`\sqrt{}`]) {
    const { field, model } = modelField()
    field.setValue(mathFieldEditingValue(source), { silenceNotifications: true, selectionMode: 'placeholder' })
    assert.ok(model.atoms.some(atom => atom.type === 'placeholder'))
    assert.equal(render(output(field)), render(source))
    assert.ok(model.getAtoms(model.selection).some(atom => atom.type === 'placeholder'))
  }
  for (const source of [String.raw`\text{中文{} }`, String.raw`\ce{H2 + {}}`, String.raw`\{\}`, '% {}']) assert.equal(mathFieldEditingValue(source), source)
})
test('accessible description preserves exact source for normal, Chinese, cases, chemistry, invalid and empty values', () => {
  for (const source of ['x^2', String.raw`\text{中文}`, String.raw`\begin{cases}x=1\\y=2\end{cases}`, String.raw`\ce{2H2 + O2 -> 2H2O}`, String.raw`\frac{1}{`, '']) {
    assert.equal(mathFieldDescription(source), `当前公式原文：${source || '空'}`)
  }
})

test('Tab command moves between the rehydrated fraction slots', () => {
  const { field, model } = modelField()
  field.setValue(mathFieldEditingValue(String.raw`\frac{}{}`), { silenceNotifications: true, selectionMode: 'placeholder' })
  const first = model.position
  field.executeCommand('moveToNextGroup')
  assert.notEqual(model.position, first)
  assert.ok(model.getAtoms(model.selection).some(atom => atom.type === 'placeholder'))
  field.executeCommand('moveToPreviousGroup')
  assert.equal(model.position, first)
})
