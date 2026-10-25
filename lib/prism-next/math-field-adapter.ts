import type { MathfieldElement } from 'mathlive'

// P119: native media query responds to both initial and live OS preference.
// Scoped to this custom element's open shadow root, including caret pseudo-elements.
export const mathFieldReducedMotionCSS = '@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }'

export const mathFieldOutputFormat = 'latex-without-placeholders' as const

/** Editing projection only. Never rewrite Chinese or the stored source.
 * Opaque text/chemical/environment arguments are copied verbatim; escaped braces
 * and comments cannot become template slots. MathLive owns serialization.
 */
export function mathFieldEditingValue(source: string): string {
  let result = '', i = 0
  const opaque = new Set(['text', 'textrm', 'textbf', 'textit', 'texttt', 'operatorname', 'mathrm', 'ce', 'pu', 'begin', 'end'])
  while (i < source.length) {
    if (source[i] === '%') {
      const end = source.indexOf('\n', i)
      if (end < 0) return result + source.slice(i)
      result += source.slice(i, end + 1); i = end + 1
    } else if (source[i] === '\\') {
      const token = source.slice(i).match(/^\\([a-zA-Z]+|.)/u)?.[0] ?? '\\'
      result += token; i += token.length
      if (opaque.has(token.slice(1))) {
        while (/\s/u.test(source[i] ?? '') && i < source.length) result += source[i++]
        if (source[i] === '{') {
          let depth = 0
          do {
            const char = source[i++]; result += char
            if (char === '\\' && i < source.length) result += source[i++]
            else if (char === '{') depth++
            else if (char === '}') depth--
          } while (i < source.length && depth > 0)
        }
      }
    } else if (source.slice(i, i + 2) === '{}') {
      result += '{\\placeholder{}}'; i += 2
    } else result += source[i++]
  }
  return result
}

export function mathFieldDescription(source: string): string {
  return `当前公式原文：${source || '空'}`
}

/** Native capture listeners run before MathLive's shadow keyboard delegate.
 * Candidate text stays in the OS input method; only its committed text enters
 * the math model, using the public text-mode insertion API. No private model.
 */
export function attachMathFieldComposition(field: MathfieldElement, options: {
  readOnly: () => boolean
  onComposing: (value: boolean) => void
  onCommit: () => void
}) {
  let composing = false, trailing: string | null = null
  const listeners: [string, EventListener][] = []
  const listen = (type: string, callback: EventListener) => {
    field.addEventListener(type, callback, true); listeners.push([type, callback])
  }
  const stop = (event: Event) => event.stopImmediatePropagation()
  const insert = (text: string) => {
    if (!text || options.readOnly()) return
    field.insert(text, { mode: 'text', insertionMode: 'replaceSelection', selectionMode: 'after' })
    field.mode = 'math'
    options.onCommit()
  }
  listen('compositionstart', event => {
    stop(event); trailing = null; composing = true; options.onComposing(true)
  })
  listen('compositionupdate', stop)
  listen('compositionend', event => {
    stop(event)
    if (!composing) return
    const text = (event as CompositionEvent).data ?? ''
    // Keep controlled writes blocked until the commit callback has completed.
    trailing = text
    insert(text)
    composing = false; options.onComposing(false)
  })
  for (const type of ['keydown', 'keypress', 'keyup']) listen(type, event => {
    const key = event as KeyboardEvent
    if (composing || key.isComposing || key.keyCode === 229) stop(event)
    else if (type === 'keydown') trailing = null
  })
  for (const type of ['beforeinput', 'input']) listen(type, event => {
    const input = event as InputEvent
    // MathLive's own model notifications originate at the host, with no data
    // payload. Raw browser IME events come from the keyboard sink.
    if (composing || input.isComposing || input.inputType === 'insertCompositionText' ||
      input.inputType === 'insertFromComposition' ||
      (trailing !== null && input.data === trailing && input.inputType === 'insertText')) {
      stop(event)
      if (!composing && type === 'beforeinput') event.preventDefault()
    }
  })
  listen('paste', event => {
    if (composing) { stop(event); event.preventDefault(); return }
    trailing = null
    const text = (event as ClipboardEvent).clipboardData?.getData('text/plain') ?? ''
    if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text)) {
      stop(event); event.preventDefault(); insert(text)
    }
  })
  return { isComposing: () => composing, dispose: () => {
    for (const [type, listener] of listeners) field.removeEventListener(type, listener, true)
  } }
}
