"use client"

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { MathfieldElement, Selector, Selection } from 'mathlive'
import { Label } from '@/components/coss/label'
import { Textarea } from '@/components/coss/textarea'
import { Button } from './button'
import { DraftMathPreview } from './draft-math-preview'
import { attachMathFieldComposition, mathFieldDescription, mathFieldEditingValue, mathFieldOutputFormat, mathFieldReducedMotionCSS } from '@/lib/prism-next/math-field-adapter'
import { configureMathFieldRuntime, loadMathFieldRuntime, type MathFieldRuntime } from '@/lib/prism-next/math-field-runtime'
import { mathFieldTemplates, mathFieldRelations, mathFieldGreek, mathFieldSubjectTools, mathFieldShortcuts, mathFieldNumberKeys, mathFieldKeyboardCommands, type MathFieldKey, type MathFieldSubject, type MathFieldTool } from '@/lib/prism-next/math-field-tools'
import { createMathFieldShortcut } from '@/lib/prism-next/math-field-shortcut'
import './math-field.css'

export type MathFieldCursor = { value: string; position: number; selection: Selection }
export type MathFieldProps = {
  value: string
  onChange: (value: string) => void
  mode?: 'inline' | 'block'
  subject?: MathFieldSubject
  readOnlyReason?: string
  label: string
  onConfirm?: () => void
  onCancel?: () => void
  /** MathLive model offsets, NOT LaTeX/UTF-16 string indexes. Host owns splitting. */
  onSplitRequest?: (cursor: MathFieldCursor) => void
}

export function MathField(props: MathFieldProps) {
  const { value, label, mode = 'inline', subject = 'math', readOnlyReason, onSplitRequest } = props
  const id = useId(), mount = useRef<HTMLDivElement>(null), source = useRef<HTMLTextAreaElement>(null)
  const field = useRef<MathfieldElement | null>(null), runtime = useRef<MathFieldRuntime | null>(null)
  const latest = useRef(props)
  useLayoutEffect(() => { latest.current = props })
  const shortcut = useRef<ReturnType<typeof createMathFieldShortcut> | null>(null)
  const [canRestore, setCanRestore] = useState(false)
  const composing = useRef(false), sourceComposing = useRef(false)
  const [ime, setIme] = useState(false), [opened, setOpened] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'failed' | 'initialization-failed'>('idle')
  const [advanced, setAdvanced] = useState(false), [keyboard, setKeyboard] = useState(false)
  const [page, setPage] = useState('数字'), [api, setApi] = useState<MathFieldRuntime | null>(null)
  const invalid = Boolean(api && !api.sourceIsValid(value))
  const sourcePanel = useRef<HTMLDetailsElement>(null)
  const disabled = Boolean(readOnlyReason) || ime
  const emit = useCallback(() => {
    const element = field.current
    if (!element || latest.current.readOnlyReason) return
    const next = element.getValue(mathFieldOutputFormat)
    if (next !== latest.current.value) {
      latest.current.onChange(next)
      // Give the host's React update a chance to commit; rejected edits must
      // not leave an uncontrolled value inside the custom element.
      queueMicrotask(() => {
        const current = latest.current.value
        if (field.current === element && !composing.current && runtime.current?.sourceIsValid(current) && element.getValue(mathFieldOutputFormat) === next && current !== next) {
          element.setValue(mathFieldEditingValue(current), { silenceNotifications: true, mode: 'math', format: 'latex' })
        }
      })
    }
  }, [])

  useEffect(() => {
    if (!opened) return
    let active = true, cleanup: (() => void) | undefined
    loadMathFieldRuntime().then(loaded => {
      if (!active || !mount.current) return
      try {
        configureMathFieldRuntime(loaded.MathfieldElement)
        runtime.current = loaded
        setApi(loaded)
        const element = new loaded.MathfieldElement()
        cleanup = () => {
          element.remove(); field.current = null; runtime.current = null; shortcut.current = null; composing.current = false
        }
        element.mathVirtualKeyboardPolicy = 'manual'
        element.smartMode = false
        element.id = `${id}-visual`
        element.setAttribute('class', 'prism-math-field-input text-read-body')
        element.setAttribute('aria-label', latest.current.label)
        element.setAttribute('aria-describedby', `${id}-description ${id}-reason`)
        element.readOnly = Boolean(latest.current.readOnlyReason)
        const transaction = createMathFieldShortcut(element); shortcut.current = transaction
        const composition = attachMathFieldComposition(element, {
          readOnly: () => Boolean(latest.current.readOnlyReason),
          onComposing: state => { transaction.reset(); setCanRestore(false); composing.current = state; setIme(state) },
          onCommit: () => emit(),
        })
        const input = () => { if (!composing.current) { transaction.afterInput(); setCanRestore(transaction.available()); emit() } }
        const keydown = (event: KeyboardEvent) => {
          if (composing.current || event.isComposing || event.keyCode === 229) return
          transaction.beforeKey(event)
          if (event.key === 'Escape') {
            event.preventDefault(); event.stopPropagation(); setKeyboard(false); latest.current.onCancel?.()
          } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault(); event.stopPropagation()
            if (!latest.current.readOnlyReason) latest.current.onConfirm?.()
          }
        }
        const resetShortcut = () => { transaction.reset(); setCanRestore(false) }
        const touch = (event: PointerEvent) => {
          if (event.pointerType === 'touch' && !latest.current.readOnlyReason) setKeyboard(true)
        }
        cleanup = () => {
          composition.dispose(); element.removeEventListener('input', input)
          element.removeEventListener('keydown', keydown, true); element.removeEventListener('pointerdown', touch)
          element.removeEventListener('pointerdown', resetShortcut); element.removeEventListener('paste', resetShortcut); shortcut.current = null
          element.remove(); field.current = null; runtime.current = null; composing.current = false
        }
        element.addEventListener('input', input)
        element.addEventListener('keydown', keydown, true)
        element.addEventListener('pointerdown', touch)
        element.addEventListener('pointerdown', resetShortcut)
        element.addEventListener('paste', resetShortcut)
        mount.current.appendChild(element); field.current = element
        // MathLive 0.111.1 requires connectedCallback to finish before these
        // accessors are used. Other options above support deferred assignment.
        element.menuItems = []
        element.inlineShortcuts = { ...element.inlineShortcuts, ...mathFieldShortcuts }
        const reducedMotionStyle = document.createElement('style')
        reducedMotionStyle.textContent = mathFieldReducedMotionCSS
        element.shadowRoot?.appendChild(reducedMotionStyle)
        const initialInvalid = !loaded.sourceIsValid(latest.current.value)
        if (!initialInvalid) element.setValue(mathFieldEditingValue(latest.current.value), { silenceNotifications: true, selectionMode: 'placeholder', mode: 'math', format: 'latex' })
        element.readOnly = Boolean(latest.current.readOnlyReason) || initialInvalid
        if (!latest.current.readOnlyReason && !initialInvalid) element.focus()
        setPhase('ready')
      } catch (error) {
        // Programming/initialization errors are distinct from resource failure.
        // Keep the original Error (and stack) visible, including in development.
        console.error('[MathField] initialization failed', error)
        cleanup?.(); cleanup = undefined
        runtime.current = null; setApi(null)
        setPhase('initialization-failed'); setAdvanced(true)
      }
    }, () => { if (active) { setPhase('failed'); setAdvanced(true) } })
    return () => { active = false; cleanup?.() }
  }, [opened, id, emit])

  useEffect(() => {
    const element = field.current, loaded = runtime.current
    if (composing.current || sourceComposing.current) return
    if (!element || !loaded) return
    const bad = !loaded.sourceIsValid(value)
    element.readOnly = Boolean(readOnlyReason) || bad
    element.setAttribute('aria-label', label)
    element.defaultMode = mode === 'inline' ? 'inline-math' : 'math'
    if (!bad && element.getValue(mathFieldOutputFormat) !== value) {
      element.setValue(mathFieldEditingValue(value), { silenceNotifications: true, selectionMode: 'placeholder', mode: 'math', format: 'latex' })
    }
  }, [value, label, readOnlyReason, mode, phase, ime])

  const act = (command: Selector) => {
    if (!field.current || disabled || invalid) return
    shortcut.current?.reset(); setCanRestore(false)
    field.current.focus(); field.current.executeCommand(command); emit()
  }
  const insert = (tool: MathFieldTool) => {
    if (!field.current || disabled || invalid) return
    shortcut.current?.reset(); setCanRestore(false)
    field.current.focus()
    field.current.insert(tool.latex, { format: 'latex', mode: 'math', selectionMode: 'placeholder' })
    emit()
  }
  const tools = (items: readonly MathFieldTool[]) => <ToolButtons items={items} disabled={disabled || invalid} onInsert={insert} />
  const keys = (items: readonly MathFieldKey[]) => <KeyboardButtons items={items} disabled={disabled || invalid} onCommand={act} onInsert={insert} />
  const rawKey = (event: React.KeyboardEvent) => {
    if (sourceComposing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); props.onCancel?.() }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !disabled) { event.preventDefault(); event.stopPropagation(); props.onConfirm?.() }
  }
  return <section className="prism-math-field min-w-0 space-y-3" data-mode={mode} aria-labelledby={`${id}-label`}>
    <Label id={`${id}-label`} htmlFor={`${id}-visual`} className="text-ui-action">{label}</Label>
    <p id={`${id}-reason`} className="text-ui-hint text-muted-foreground">{readOnlyReason || '直接打字或点模板输入公式；Tab / 方向键移动，⌘ / Ctrl + Enter 确认，Esc 取消。'}</p>
    <p id={`${id}-description`} className="sr-only">{mathFieldDescription(value)}</p>
    {phase === 'idle' && <Button type="button" variant="outline" disabled={ime} onClick={() => { setPhase('loading'); setOpened(true) }}>打开公式框</Button>}
    {phase === 'loading' && <p role="status" className="text-ui-hint">正在准备公式框…</p>}
    {phase === 'failed' && <p role="status" className="text-ui-hint">公式框暂不可用，可继续编辑公式原文并确认。</p>}
    {phase === 'initialization-failed' && <p role="alert" className="text-ui-hint">公式框初始化出错，可继续编辑公式原文并确认。</p>}
    <div ref={mount} hidden={phase !== 'ready' || invalid} />
    {phase === 'ready' && <>
      {invalid && <p role="status" className="text-ui-hint">公式原文有误，请在高级区检查；原文已保留。</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="公式模板">
        {tools(mathFieldTemplates)}
        <details><summary className="cursor-pointer text-ui-action">关系符</summary><div className="flex flex-wrap gap-2">{tools(mathFieldRelations)}</div></details>
        <details><summary className="cursor-pointer text-ui-action">希腊字母</summary><div className="flex flex-wrap gap-2">{tools(mathFieldGreek)}</div></details>
        <details><summary className="cursor-pointer text-ui-action">{subject === 'physics' ? '物理符号' : subject === 'chemistry' ? '化学符号' : '数学符号'}</summary><div className="flex flex-wrap gap-2">{tools(mathFieldSubjectTools[subject])}</div></details>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="公式编辑操作">
        <Button type="button" variant="outline" disabled={disabled || invalid} onClick={() => act('undo')}>撤销</Button>
        <Button type="button" variant="outline" disabled={disabled || invalid || !canRestore} onClick={() => { if (!disabled && shortcut.current?.restore()) { setCanRestore(false); emit(); field.current?.focus() } }}>还原速记</Button>
        <Button type="button" variant="outline" disabled={disabled || invalid} onClick={() => act('redo')}>重做</Button>
        <Button type="button" variant="outline" disabled={disabled || invalid} aria-label="数学键盘" aria-expanded={keyboard} onClick={() => setKeyboard(!keyboard)}>数学键盘</Button>
        {onSplitRequest && <Button type="button" variant="outline" disabled={disabled || invalid} onClick={() => {
          const element = field.current
          if (element && !composing.current && !readOnlyReason) onSplitRequest({ value, position: element.position, selection: structuredClone(element.selection) })
        }}>在光标处拆开</Button>}
      </div>
      {keyboard && !readOnlyReason && <div className="space-y-2 rounded-lg border border-input bg-background p-2" role="group" aria-label="数学虚拟键盘">
        <div className="flex flex-wrap gap-2">{['数字', '字母', '符号', '希腊', '学科'].map(name => <Button key={name} type="button" variant="outline" aria-label={`${name}键盘页`} aria-pressed={name === page} disabled={ime} onClick={() => setPage(name)}>{name}</Button>)}</div>
        <div className="prism-math-keyboard-grid">
          {page === '数字' && keys(mathFieldNumberKeys)}
          {page === '字母' && keys(Array.from('abcdefghijklmnopqrstuvwxyz', char => ({ label: `字母 ${char}`, latex: char, face: char })))}
          {page === '符号' && keys(mathFieldRelations)}{page === '希腊' && keys(mathFieldGreek)}{page === '学科' && keys(mathFieldSubjectTools[subject])}
        </div>
        <div className="prism-math-keyboard-grid">
          {page !== '数字' && keys(mathFieldKeyboardCommands)}
          <Button type="button" variant="outline" size="navigation" aria-label="收起数学键盘" disabled={ime} onClick={() => setKeyboard(false)}>⌄</Button>
        </div>
      </div>}
    </>}
    <details ref={sourcePanel} open={advanced || phase === 'failed' || phase === 'initialization-failed' || invalid} onToggle={event => setAdvanced(event.currentTarget.open)}>
      <summary className="cursor-pointer text-ui-action">高级 · 公式原文</summary>
      <div className="mt-2 space-y-2">
        <Label htmlFor={`${id}-source`} className="text-ui-action">公式原文</Label>
        <Textarea id={`${id}-source`} ref={source} value={value} readOnly={Boolean(readOnlyReason)} aria-describedby={`${id}-reason`} className="text-read-body" onKeyDown={rawKey}
          onCompositionStart={() => { sourceComposing.current = true; setIme(true) }}
          onCompositionEnd={event => { sourceComposing.current = false; setIme(false); if (!readOnlyReason) props.onChange(event.currentTarget.value) }}
          onChange={event => { if (!readOnlyReason) props.onChange(event.target.value) }} />
      </div>
    </details>
    <DraftMathPreview value={value} formulaMode={mode} label="排版预览" showHelp={false} onLocateError={location => {
      setAdvanced(true); if (sourcePanel.current) sourcePanel.current.open = true; source.current?.focus(); source.current?.setSelectionRange(location.start, location.end)
    }} />
    <div className="flex flex-wrap gap-2">
      {props.onConfirm && <Button type="button" disabled={disabled} onClick={() => { if (!composing.current && !sourceComposing.current) props.onConfirm?.() }}>确认</Button>}
      {props.onCancel && <Button type="button" variant="outline" disabled={ime} onClick={() => { if (!composing.current && !sourceComposing.current) props.onCancel?.() }}>取消</Button>}
    </div>
  </section>
}

function ToolButtons({ items, disabled, onInsert }: { items: readonly MathFieldTool[]; disabled: boolean; onInsert: (tool: MathFieldTool) => void }) {
  return items.map(tool => <Button key={tool.label} type="button" variant="outline" size="navigation" disabled={disabled} aria-label={`插入${tool.label}`} onClick={() => onInsert(tool)}>{tool.label}</Button>)
}

function KeyboardButtons({ items, disabled, onCommand, onInsert }: { items: readonly MathFieldKey[]; disabled: boolean; onCommand: (command: Selector) => void; onInsert: (tool: MathFieldTool) => void }) {
  return items.map(key => <Button key={key.label} type="button" variant="outline" size="navigation"
    className="prism-math-key min-w-0 min-h-11 px-0 text-ui-body" disabled={disabled} aria-label={key.label}
    style={'keyboardSpan' in key && key.keyboardSpan ? { gridColumn: `span ${key.keyboardSpan}` } : undefined}
    onClick={() => 'command' in key ? onCommand(key.command) : onInsert(key)}>{key.face}</Button>)
}
