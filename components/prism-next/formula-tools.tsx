"use client"

import { useId, useRef, useState, type ReactNode } from 'react'
import { Field, FieldLabel } from '@/components/coss/field'
import { Input } from '@/components/coss/input'
import { Button } from './button'
import { Button as CossButton } from '@/components/coss/button'
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@/components/coss/toolbar'
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/coss/tooltip'
import { Kbd } from '@/components/coss/kbd'
import { PopoverPrimitive } from '@/components/coss/popover'
import { Check } from 'lucide-react'
import { formulaQuickTools, searchFormulaTools, mathFieldShortcuts } from '@/lib/prism-next/math-field-tools'
import './math-field.css'

export type FormulaQuickToolsProps = {
  onInsert: (latex: string) => void
  trailing?: ReactNode
  disabled?: boolean
  variant?: 'row' | 'floating'
  finish?: { onFinish: () => void; label?: string }
}

export function FormulaQuickTools({ onInsert, trailing, disabled, variant = 'row', finish }: FormulaQuickToolsProps) {
  if (variant === 'floating') return <Toolbar aria-label="快捷公式" className="items-center gap-0.5 rounded-xl p-1 shadow-lg/5 max-w-full overflow-x-auto" onPointerDown={event => event.preventDefault()}>
    <ToolbarGroup className="gap-0.5">
      {formulaQuickTools.filter(tool => tool.label !== '正负').map(tool => {
        const shortcut = Object.entries(mathFieldShortcuts).find(([, latex]) => latex === tool.latex)?.[0]
        return <Tooltip key={tool.label}>
          <TooltipTrigger render={<ToolbarButton render={<CossButton type="button" variant="ghost" size="icon-sm" />} disabled={disabled}
            aria-label={`插入${tool.label}`} onPointerDown={event => event.preventDefault()} onClick={() => onInsert(tool.latex)} />}>
            <span className="prism-formula-toolbar-symbol font-serif" aria-hidden="true">{tool.label === '分数' ? 'a⁄b' : tool.face}</span>
          </TooltipTrigger>
          <TooltipPopup side="top">{tool.label}{shortcut && <>　<Kbd>{shortcut}</Kbd></>}</TooltipPopup>
        </Tooltip>
      })}
    </ToolbarGroup>
    {trailing && <><ToolbarSeparator /><ToolbarGroup className="gap-0.5">{trailing}</ToolbarGroup></>}
    {finish && <><ToolbarSeparator /><Tooltip>
      <TooltipTrigger render={<ToolbarButton render={<CossButton type="button" size="icon-sm" />} disabled={disabled}
        aria-label={`${finish.label ?? '完成'}（Enter）`} onPointerDown={event => event.preventDefault()} onClick={finish.onFinish} />}><Check aria-hidden="true" /></TooltipTrigger>
      <TooltipPopup side="top">{finish.label ?? '完成'} <Kbd>↵</Kbd></TooltipPopup>
    </Tooltip></>}
  </Toolbar>
  return <div className="flex min-w-0 items-center gap-1 overflow-x-auto" role="group" aria-label="快捷公式">
    {formulaQuickTools.map(tool => <Button key={tool.label} type="button" variant="outline" size="navigation" className="shrink-0" disabled={disabled}
      aria-label={`插入${tool.label}`} title={tool.label} onPointerDown={event => event.preventDefault()} onClick={() => onInsert(tool.latex)}>{tool.face}</Button>)}
    {trailing}
  </div>
}

export type FormulaFloatingToolbarProps = Omit<FormulaQuickToolsProps, 'variant'> & {
  anchor: Element | null
  open: boolean
}

/** Host owns active field and visibility; opening never moves the editor focus. */
export function FormulaFloatingToolbar({ anchor, open, ...props }: FormulaFloatingToolbarProps) {
  if (!open || !anchor) return null
  return <PopoverPrimitive.Root open modal={false}>
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner anchor={anchor} side="top" align="start" sideOffset={8}
        collisionAvoidance={{ side: 'flip', align: 'shift', fallbackAxisSide: 'none' }} className="z-50 max-w-(--available-width)">
        <PopoverPrimitive.Popup data-prism-formula-floating-toolbar="" initialFocus={false} finalFocus={false}>
          <FormulaQuickTools {...props} variant="floating" />
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>
}

export type FormulaPaletteProps = {
  onInsert: (latex: string) => void
  footer?: ReactNode
  disabled?: boolean
}

export function FormulaPalette({ onInsert, footer, disabled }: FormulaPaletteProps) {
  const [query, setQuery] = useState('')
  const id = useId(), input = useRef<HTMLInputElement>(null), buttons = useRef<(HTMLButtonElement | null)[]>([])
  const results = searchFormulaTools(query)
  const focusResult = (index: number) => buttons.current[index]?.focus()
  return <section className="min-w-0 space-y-3" aria-label="更多公式">
    <Field className="w-full">
      <FieldLabel>搜索公式</FieldLabel>
      <Input ref={input} id={`${id}-search`} type="search" value={query} disabled={disabled} placeholder="分数、根号、绝对值…"
        aria-controls={`${id}-results`} onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
            event.preventDefault(); focusResult(event.key === 'ArrowDown' ? 0 : results.length - 1)
          } else if (event.key === 'Enter' && results.length) { event.preventDefault(); onInsert(results[0].latex) }
        }} />
    </Field>
    <p className="text-ui-hint text-muted-foreground" role="status">{query.trim() ? `搜索结果 · ${results.length} 项` : '常用'}</p>
    <div id={`${id}-results`} className="prism-formula-palette-grid" role="group" aria-label={query.trim() ? '公式搜索结果' : '常用公式'}>
      {results.map((tool, index) => <Button key={tool.label} ref={node => { buttons.current[index] = node }} type="button" variant="outline" size="navigation"
        className="prism-formula-palette-tool" disabled={disabled} title={tool.label} aria-label={`插入${tool.label}`} onClick={() => onInsert(tool.latex)}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); focusResult((index + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length)
          } else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); focusResult(event.key === 'Home' ? 0 : results.length - 1) }
          else if (event.key === 'Escape') { event.preventDefault(); input.current?.focus() }
        }}><span className="prism-formula-palette-face" aria-hidden="true">{tool.face}</span><span className="prism-formula-palette-label text-ui-hint">{tool.label}</span></Button>)}
    </div>
    {!results.length && <p className="text-ui-hint text-muted-foreground">没有找到公式，试试其他中文名称。</p>}
    {footer}
  </section>
}
