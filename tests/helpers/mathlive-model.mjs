// Test-only bridge: exercise installed parser/model and public method bodies.
// No DOM, layout, focus, native IME or browser acceptance is claimed here.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
const dir = mkdtempSync(join(tmpdir(), 'p119-model-'))
const file = join(dir, 'mathlive.mjs')
writeFileSync(file, readFileSync(new URL('../../node_modules/mathlive/mathlive.mjs', import.meta.url), 'utf8') + '\nexport {parseLatex, Atom, getDefaultContext, getDefault, _Model, _Mathfield, ModeEditor, perform, UndoManager};\n')
globalThis.HTMLElement ??= class extends EventTarget {}
export const ml = await import(pathToFileURL(file))
rmSync(dir, { recursive: true })
globalThis.MathfieldElement = ml.MathfieldElement
globalThis.document = { getElementById: () => null }
globalThis.window = { mathVirtualKeyboard: { visible: false, update() {} } }
export function modelField(value = '') {
  const internal = {
    options: ml.getDefault(), context: ml.getDefaultContext(), dirty: true,
    contentEditable: true, isSelectionEditable: true, hasEditableContent: true,
    onContentWillChange: () => true, onSelectionDidChange: () => {},
    snapshot: () => {}, flushInlineShortcutBuffer: () => {}, scrollIntoView: () => {},
    stopCoalescingUndo: () => {}, defaultStyle: {}, styleBias: 'left', inlineShortcutBuffer: [],
    undoManager: { canUndo: () => false, reset: () => {}, snapshot: () => {} },
  }
  internal.model = new ml._Model(internal, 'math', new ml.Atom({ type: 'root', mode: 'math', body: ml.parseLatex(value, { context: internal.context }) }))
  internal.model.position = internal.model.lastOffset
  internal.switchMode = ml._Mathfield.prototype.switchMode.bind(internal)
  internal.canUndo = () => internal.undoManager.canUndo()
  internal.canRedo = () => false
  internal.insert = ml._Mathfield.prototype.insert.bind(internal)
  internal.executeCommand = command => ml.perform(internal, command)
  internal.setValue = ml._Mathfield.prototype.setValue.bind(internal)
  const field = new EventTarget()
  field._mathfield = internal
  Object.defineProperty(field, 'mode', Object.getOwnPropertyDescriptor(ml.MathfieldElement.prototype, 'mode'))
  Object.defineProperty(field, 'selection', {get: () => modelSelection(), set: selection => { internal.model.selection = selection }})
  function modelSelection() { return internal.model.selection }
  for (const name of ['getValue', 'insert', 'setValue', 'executeCommand']) field[name] = ml.MathfieldElement.prototype[name].bind(field)
  return { field, model: internal.model, internal }
}
export function send(field, type, props = {}) {
  const event = new Event(type, { cancelable: true, bubbles: true, composed: true })
  Object.assign(event, props)
  field.dispatchEvent(event)
  return event
}

globalThis.KeyboardEvent ??= class extends Event { constructor(type, props) { super(type, {cancelable: true}); for (const [key, value] of Object.entries(props)) if (!['type','isTrusted'].includes(key)) Object.defineProperty(this, key, {value}) } }
export function keyboardField(value = '') {
  const result = modelField(value), { internal, model } = result
  internal.keyboardDelegate = { cancelComposition() {}, setAriaLabel() {} }
  internal.options.inlineShortcutTimeout = 0
  internal.undoManager = new ml.UndoManager(model)
  internal.undoManager.startRecording()
  for (const name of ['canUndo', 'canRedo', 'snapshot', 'undo', 'redo', 'stopCoalescingUndo', 'flushInlineShortcutBuffer', 'switchMode', 'onInput', 'onKeystroke']) internal[name] = ml._Mathfield.prototype[name].bind(internal)
  Object.defineProperty(internal, 'keybindings', { get: () => Object.getOwnPropertyDescriptor(ml._Mathfield.prototype, 'keybindings').get.call(internal) })
  internal.snapshot()
  result.type = (text, beforeKey, afterInput) => {
    for (const key of text) {
      const mapping = {'^':['Digit6',true], '/':['Slash',false], '<':['Comma',true], '>':['Period',true], '=':['Equal',false], '!':['Digit1',true], '+':['Equal',true], '-':['Minus',false], '*':['Digit8',true], '_':['Minus',true]}
      const [code, shiftKey] = mapping[key] ?? [/[a-z]/i.test(key) ? `Key${key.toUpperCase()}` : `Digit${key}`, false]
      const event = { key, code, shiftKey, preventDefault() {}, stopPropagation() {} }
      beforeKey?.(event)
      if (internal.onKeystroke(event)) internal.onInput(key)
      afterInput?.()
    }
  }
  return result
}
