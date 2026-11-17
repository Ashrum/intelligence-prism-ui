"use client"

import { useId, useRef, useState, type ReactNode } from 'react'
import { Field, FieldLabel } from '@/components/coss/field'
import { Input } from '@/components/coss/input'
import { Button } from './button'
import { formulaQuickTools, searchFormulaTools } from '@/lib/prism-next/math-field-tools'

export type FormulaQuickToolsProps = {
  onInsert: (latex: string) => void
  trailing?: ReactNode
  disabled?: boolean
}

export function FormulaQuickTools({ onInsert, trailing, disabled }: FormulaQuickToolsProps) {
  return <div className="flex min-w-0 items-center gap-1 overflow-x-auto" role="group" aria-label="快捷公式">
    {formulaQuickTools.map(tool => <Button key={tool.label} type="button" variant="outline" size="navigation" className="shrink-0" disabled={disabled}
      aria-label={`插入${tool.label}`} title={tool.label} onPointerDown={event => event.preventDefault()} onClick={() => onInsert(tool.latex)}>{tool.face}</Button>)}
    {trailing}
  </div>
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
    <div id={`${id}-results`} className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={query.trim() ? '公式搜索结果' : '常用公式'}>
      {results.map((tool, index) => <Button key={tool.label} ref={node => { buttons.current[index] = node }} type="button" variant="outline" size="navigation"
        className="min-w-0" disabled={disabled} aria-label={`插入${tool.label}`} onClick={() => onInsert(tool.latex)}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); focusResult((index + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length)
          } else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); focusResult(event.key === 'Home' ? 0 : results.length - 1) }
          else if (event.key === 'Escape') { event.preventDefault(); input.current?.focus() }
        }}><span aria-hidden="true">{tool.face}</span><span>{tool.label}</span></Button>)}
    </div>
    {!results.length && <p className="text-ui-hint text-muted-foreground">没有找到公式，试试其他中文名称。</p>}
    {footer}
  </section>
}
