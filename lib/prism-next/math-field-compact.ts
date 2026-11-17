import type { MathfieldElement, VirtualKeyboardLayout } from 'mathlive'
import { mathFieldOutputFormat } from './math-field-adapter'
import { formulaTools, formulaQuickTools } from './math-field-tools'

export type MathFieldExitReason = 'forward' | 'backward' | 'escape'

/** MathLive reports model boundaries, including Tab after the last placeholder. */
export function attachMathFieldExit(element: MathfieldElement, options: {
  blocked: () => boolean
  onExit: (reason: MathFieldExitReason) => void
}) {
  const move = (event: CustomEvent<{ direction: string }>) => {
    if (options.blocked()) return
    const direction = event.detail.direction
    if (direction !== 'forward' && direction !== 'backward') return
    event.preventDefault(); event.stopPropagation(); options.onExit(direction)
  }
  element.addEventListener('move-out', move)
  return () => element.removeEventListener('move-out', move)
}

export type MathFieldFinishReason = 'enter' | 'forward' | 'backward' | 'tab' | 'escape' | 'blur'
export type MathFieldFinishDetail = { relatedTarget?: Element | null }

/** Public model offsets only: do not use MathLive leapTarget's single-child fallback. */
export function moveMathFieldPlaceholder(element: MathfieldElement, backward = false) {
  const ranges = element.selection.ranges
  const start = Math.min(...ranges.flat()), end = Math.max(...ranges.flat())
  for (let offset = backward ? start : end + 1; backward ? offset > 0 : offset <= element.lastOffset; offset += backward ? -1 : 1) {
    if (element.getValue(offset - 1, offset, 'latex') === '\\placeholder{}') {
      element.selection = { ranges: [[offset - 1, offset]] }
      return true
    }
  }
  return false
}

/** One notification per editing session; capture the value before host callbacks. */
export function attachMathFieldFinish(element: MathfieldElement, root: HTMLElement, options: {
  enabled: () => boolean
  blocked: () => boolean
  onFinish: (value: string, reason: MathFieldFinishReason, detail?: MathFieldFinishDetail) => void
}) {
  let finished = false
  let internalPointer = false
  let pointerTarget: Element | null = null
  const internal = (target: EventTarget | null) => target instanceof Element && (
    root.contains(target) || Boolean(target.closest('.ML__keyboard'))
  )
  const finish = (reason: MathFieldFinishReason, detail?: MathFieldFinishDetail) => {
    if (!options.enabled() || options.blocked() || finished) return
    const value = element.getValue(mathFieldOutputFormat)
    finished = true
    options.onFinish(value, reason, detail)
  }
  const pointer = (event: PointerEvent) => {
    internalPointer = event.composedPath().some(internal)
    pointerTarget = event.composedPath().find(target => target instanceof Element) as Element | undefined ?? null
    queueMicrotask(() => { internalPointer = false; pointerTarget = null })
  }
  const blur = (event: FocusEvent) => {
    if (!options.enabled()) return
    const target = event.relatedTarget ?? pointerTarget ?? root.ownerDocument.activeElement
    if (internal(target) || (!event.relatedTarget && internalPointer)) return
    finish('blur', { relatedTarget: target instanceof Element ? target : null })
  }
  const focus = (event: FocusEvent) => { if (!internal(event.relatedTarget) && !internalPointer) finished = false }
  const input = () => { finished = false }
  element.addEventListener('blur', blur)
  // Capture native blur before MathLive replaces it with an Event without relatedTarget.
  root.addEventListener('blur', blur, true)
  root.addEventListener('focusout', blur)
  root.addEventListener('focusin', focus)
  element.addEventListener('input', input)
  root.ownerDocument.addEventListener('pointerdown', pointer, true)
  return { finish, dispose() {
    element.removeEventListener('blur', blur)
    root.removeEventListener('blur', blur, true)
    root.removeEventListener('focusout', blur)
    root.removeEventListener('focusin', focus)
    element.removeEventListener('input', input)
    root.ownerDocument.removeEventListener('pointerdown', pointer, true)
  } }
}

const key = (item: typeof formulaTools[number]) => ({ label: item.face, tooltip: item.label, insert: item.latex })
const navigation = [
  { label: '←', tooltip: '上一个空格', command: 'moveToPreviousPlaceholder' },
  { label: '→', tooltip: '下一个空格', command: 'moveToNextPlaceholder' },
  { label: '⌫', tooltip: '退格', command: 'deleteBackward' },
]
export const compactKeyboardLayouts: VirtualKeyboardLayout[] = [
  { label: '123', rows: [
    ['7', '8', '9', key(formulaQuickTools[0])], ['4', '5', '6', key(formulaQuickTools[1])],
    ['1', '2', '3', key(formulaQuickTools[2])], ['0', '.', 'x', '+'], navigation,
  ] },
  { label: 'abc', rows: [Array.from('qwertyuiop'), Array.from('asdfghjkl'), Array.from('zxcvbnm'), navigation] },
  { label: '符号', rows: [formulaQuickTools.slice(4).map(key), formulaTools.slice(16, 24).map(key), formulaTools.slice(24).map(key), navigation] },
  { label: '函数', rows: [formulaTools.slice(9, 13).map(key), formulaTools.slice(13, 16).map(key), navigation] },
]

let releaseKeyboard: (() => void) | undefined
/** Own the shared keyboard only while this field is focused; restore its previous host. */
export function attachCompactKeyboard(element: MathfieldElement, container: HTMLElement) {
  // In an embedded component preview, keep the keyboard in this document.
  if (window.top !== window) element.mathVirtualKeyboardPolicy = 'sandboxed'
  const media = window.matchMedia('(pointer: coarse), (width < 768px)')
  let release: (() => void) | undefined
  const hide = () => { release?.(); release = undefined }
  const show = () => {
    if (!media.matches || element.readOnly) { hide(); return }
    if (release) return
    releaseKeyboard?.()
    const keyboard = window.mathVirtualKeyboard
    const previous = { container: keyboard.container, layouts: keyboard.layouts }
    keyboard.container = container
    keyboard.layouts = compactKeyboardLayouts
    release = () => {
      keyboard.hide()
      keyboard.container = previous.container; keyboard.layouts = previous.layouts
      releaseKeyboard = undefined
    }
    releaseKeyboard = hide
    keyboard.show()
  }
  const update = () => { if (document.activeElement === element) show(); else hide() }
  element.addEventListener('focus', show)
  element.addEventListener('blur', hide)
  media.addEventListener('change', update)
  update()
  return () => {
    hide(); element.removeEventListener('focus', show); element.removeEventListener('blur', hide)
    media.removeEventListener('change', update)
  }
}
