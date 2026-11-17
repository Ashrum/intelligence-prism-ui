import type { MathfieldElement, VirtualKeyboardLayout } from 'mathlive'
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
