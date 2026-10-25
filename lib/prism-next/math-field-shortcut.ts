import type { MathfieldElement, Selection } from 'mathlive'

/** A short-lived typing transaction, not document history. Public model offsets
 * are paired with the exact editing snapshot; never used as string indexes.
 * MathLive's ordinary undo restores keyword shortcuts but drops ^/_ and fraction
 * keystrokes. This explicit action restores the literal characters for both.
 */
export function createMathFieldShortcut(field: MathfieldElement) {
  let run: { value: string; selection: Selection; text: string; after: string } | undefined
  let pending = false
  const reset = () => { run = undefined; pending = false }
  return {
    reset,
    beforeKey(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229 || event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1 || /\s/u.test(event.key)) { reset(); return }
      if (!run || run.after !== field.getValue()) run = { value: field.getValue(), selection: structuredClone(field.selection), text: '', after: field.getValue() }
      run.text += event.key; pending = true
    },
    afterInput() { if (run) run.after = field.getValue(); pending = false },
    selectionChanged() { if (!pending) reset() },
    available() { return Boolean(run && run.after === field.getValue() && /sqrt|alpha|pi|<=|>=|!=|\+-|[\^_/*]/u.test(run.text)) },
    restore() {
      if (!run || run.after !== field.getValue()) return false
      const previous = run; reset()
      field.setValue(previous.value, { silenceNotifications: true, mode: 'math', format: 'latex' })
      field.selection = previous.selection
      // MathLive text-mode '*' serializes to textasteriskcentered, which Temml
      // does not support. Insert that original glyph via literal math LaTeX.
      const chunks = previous.text.split('*')
      chunks.forEach((text, index) => {
        if (text) field.insert(text, { mode: 'text', selectionMode: 'after', insertionMode: 'replaceSelection' })
        if (index < chunks.length - 1) field.insert('*', { mode: 'math', format: 'latex', selectionMode: 'after' })
      })
      return true
    },
  }
}
