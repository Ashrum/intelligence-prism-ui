import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import temml from 'temml'
import { modelField, keyboardField, ml } from './helpers/mathlive-model.mjs'
import { mathFieldEditingValue, mathFieldOutputFormat } from '../lib/prism-next/math-field-adapter.ts'
import { mathFieldShortcuts, mathFieldTemplates, mathFieldRelations, mathFieldGreek, mathFieldSubjectTools } from '../lib/prism-next/math-field-tools.ts'
import { createMathFieldShortcut } from '../lib/prism-next/math-field-shortcut.ts'
const render = value => temml.renderToString(value, {strict: true, throwOnError: true, trust: false})
const corpus = JSON.parse(readFileSync(new URL('./fixtures/math-field-corpus.json', import.meta.url)))
test('52 corpus items: editing projection -> public getValue without placeholders -> strict Temml; unchanged load round-trip is equivalent', () => {
  assert.equal(corpus.length, 52)
  let requests = 0
  const saved = globalThis.fetch
  globalThis.fetch = () => { requests++; throw Error('network blocked') }
  try {
    for (const {id, input} of corpus) {
      const {field} = modelField()
      field.setValue(mathFieldEditingValue(input), {silenceNotifications: true, selectionMode: 'placeholder'})
      const output = field.getValue(mathFieldOutputFormat)
      assert.deepEqual(ml.validateLatex(output), [], id)
      assert.equal(render(output), render(input), id)
      field.setValue(mathFieldEditingValue(output), {silenceNotifications: true})
      assert.equal(field.getValue(mathFieldOutputFormat), output, id)
    }
    assert.equal(requests, 0)
    console.log('CORPUS_GATE', JSON.stringify({ total:52, temml:52, equivalent:52, stable:52, requests }))
  } finally { globalThis.fetch = saved }
})
for (const [sequence, expected] of [ ['x^2','x^2'], ['a/b',String.raw`\frac{a}{b}`], ['sqrt',String.raw`\sqrt{}`], ['pi',String.raw`\pi`], ['<=',String.raw`\le`], ['!=',String.raw`\ne`], ['+-',String.raw`\pm`], ['*',String.raw`\times`], ['x_1','x_1'], ['alpha',String.raw`\alpha`] ]) {
  test(`actual MathLive keystrokes ${sequence}, then one-action literal restoration`, () => {
    const {field, internal, type} = keyboardField()
    Object.assign(internal.options.inlineShortcuts, mathFieldShortcuts)
    const transaction = createMathFieldShortcut(field)
    type(sequence, event => transaction.beforeKey(event), () => transaction.afterInput())
    assert.equal(field.getValue(mathFieldOutputFormat), expected)
    assert.equal(transaction.available(), true)
    assert.equal(transaction.restore(), true)
    // Literal characters are text atoms, not a second shortcut conversion.
    if (sequence !== '*') assert.match(field.getValue(mathFieldOutputFormat), /\\text\{/u)
    if (sequence === '*') assert.equal(field.getValue(mathFieldOutputFormat), '*')
    else assert.equal(internal.model.atoms.filter(atom => atom.type !== 'first').map(atom => atom.value ?? '').join(''), sequence)
    assert.doesNotThrow(() => render(field.getValue(mathFieldOutputFormat)))
  })
}
test('every template starts at a selected placeholder and produces Temml-compatible storage; all offered symbols render', () => {
  for (const item of [...mathFieldTemplates, ...mathFieldRelations, ...mathFieldGreek, ...Object.values(mathFieldSubjectTools).flat()]) {
    const {field, model} = modelField('x')
    field.insert(item.latex, {format: 'latex', mode: 'math', selectionMode: 'placeholder'})
    if (item.latex.includes('#?')) assert.ok(model.getAtoms(model.selection).some(atom => atom.type === 'placeholder'), item.label)
    assert.doesNotThrow(() => render(field.getValue(mathFieldOutputFormat)), item.label)
  }
})
