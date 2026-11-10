"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { Input } from "@/components/coss/input"
import { cn } from "@/lib/utils"
import { BpButton } from "./blueprint"
import { BpCollapse } from "./progress"

export interface BpDecisionItem {
  id: string
  question: ReactNode
  description?: ReactNode
  options: { value: string; label: ReactNode; recommended?: boolean }[]
  other?: { label?: string; placeholder?: string; submitLabel?: string } | false
}

export type BpDecisionAnswer = { value: string } | { other: string }

export interface BpDecisionDockProps {
  items: BpDecisionItem[]
  index: number
  onIndexChange: (index: number) => void
  folded: boolean
  onFoldedChange: (folded: boolean) => void
  onAnswer: (id: string, answer: BpDecisionAnswer) => void
  confirmDwell?: number
  laterLabel?: string
  title?: string
}

interface DockSnapshot { item: BpDecisionItem; index: number; count: number }
interface DockConfirmation extends DockSnapshot { answer: BpDecisionAnswer; label: ReactNode }

export function BpDecisionDock({ items, index, onIndexChange, folded, onFoldedChange, onAnswer, confirmDwell = 800, laterLabel = "稍后", title = "待你决定" }: BpDecisionDockProps) {
  const currentIndex = Math.min(Math.max(0, index), Math.max(0, items.length - 1))
  const item = items[currentIndex]
  const [snapshot, setSnapshot] = useState<DockSnapshot | null>(item ? { item, index: currentIndex, count: items.length } : null)
  const [confirmation, setConfirmation] = useState<DockConfirmation | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)
  const [other, setOther] = useState<{ id: string; text: string } | null>(null)
  const locked = useRef(false)
  const body = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const otherButton = useRef<HTMLButtonElement>(null)
  const latest = useRef<DockSnapshot | null>(null)
  latest.current = item ? { item, index: currentIndex, count: items.length } : null
  const contentId = useId()
  const inputId = useId()
  const present = !closing && (confirmation !== null || items.length > 0)

  useEffect(() => {
    if (!present) { setEntered(false); return }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [present])

  // Retain the answered item even if the host removes it synchronously.
  useEffect(() => {
    if (!confirmation) return
    const timer = setTimeout(() => {
      if (latest.current) setLeaving(true)
      else setClosing(true)
    }, Math.max(0, confirmDwell))
    return () => clearTimeout(timer)
  }, [confirmation, confirmDwell])

  useEffect(() => {
    if (confirmation || leaving || closing || !item) return
    if (snapshot && snapshot.item.id !== item.id) setLeaving(true)
    else setSnapshot({ item, index: currentIndex, count: items.length })
  }, [item, currentIndex, items.length, confirmation, leaving, closing, snapshot?.item.id])

  const finishSwap = () => {
    setSnapshot(latest.current)
    setConfirmation(null)
    locked.current = false
    setOther(null)
    setLeaving(false)
    setClosing(false)
  }
  useEffect(() => {
    if (!leaving && !closing) return
    // Read the CSS duration so the fallback follows both tokens and reduced motion.
    const element = closing ? root.current?.firstElementChild : body.current
    const style = element ? getComputedStyle(element) : null
    const toMilliseconds = (value: string) => Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000)
    const durations = (style?.transitionDuration ?? "0s").split(",").map(toMilliseconds)
    const delays = (style?.transitionDelay ?? "0s").split(",").map(toMilliseconds)
    const milliseconds = Math.max(...durations.map((duration, index) => duration + delays[index % delays.length])) || 0
    const timer = setTimeout(finishSwap, milliseconds)
    return () => clearTimeout(timer)
  }, [leaving, closing])

  const display = confirmation ?? snapshot
  const switching = leaving || (!confirmation && display?.item.id !== item?.id)
  const editing = !!display && other?.id === display.item.id && !confirmation
  useEffect(() => { if (editing) input.current?.focus() }, [editing])

  const answer = (value: BpDecisionAnswer, label: ReactNode) => {
    if (!display || locked.current || switching || !present) return
    locked.current = true
    setConfirmation({ ...display, answer: value, label })
    setOther(null)
    onAnswer(display.item.id, value)
  }
  const choose = (optionIndex: number) => {
    if (!display || locked.current || switching || folded || !present) return
    const option = display.item.options[optionIndex]
    if (option) answer({ value: option.value }, option.label)
    else if (optionIndex === display.item.options.length && display.item.other !== false) setOther({ id: display.item.id, text: "" })
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (event.defaultPrevented || event.nativeEvent.isComposing || target.closest?.('input, textarea, [contenteditable]:not([contenteditable="false"])')) return
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      onFoldedChange(true)
    } else if (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && /^[1-9]$/.test(event.key)) {
      const choice = Number(event.key) - 1
      const count = display ? display.item.options.length + (display.item.other === false ? 0 : 1) : 0
      if (choice < count && !folded && !confirmation && !switching) { event.preventDefault(); choose(choice) }
    }
  }
  const expanded = !!confirmation || !folded
  const otherConfig = display?.item.other || {}
  const options = display ? [
    ...display.item.options.map(option => ({ ...option, isOther: false })),
    ...(display.item.other === false ? [] : [{ value: "", label: otherConfig.label ?? "其他…（自己写）", recommended: false, isOther: true }]),
  ] : []

  return <div ref={root} className="bp-decision-dock @container/bp-decision min-w-0 text-ui-body [overflow-wrap:anywhere]" tabIndex={-1} aria-label={title} onKeyDown={onKeyDown}>
    <BpCollapse open={present && entered} className={cn(
      "transition-[grid-template-rows,opacity,transform]! motion-reduce:transition-[opacity,grid-template-rows]! motion-reduce:[transition-duration:var(--motion-fast),0ms]! motion-reduce:translate-y-0",
      present && entered ? "translate-y-0 opacity-100 motion-reduce:[transition-delay:0ms,0ms]!" : "translate-y-2 opacity-0 motion-reduce:[transition-delay:0ms,var(--motion-fast)]!",
    )}>
      {display && <div className="border border-foreground border-l-[3px] border-l-warning-foreground bg-card [@container_bp-decision_(width<=480px)]:max-h-[50dvh]">
        <BpCollapse open={!expanded}>
          <div className="flex min-h-11 items-center gap-2.5 px-3.5 text-ui-hint">
            <strong className="shrink-0 text-ui-meta text-warning-foreground">{display.count} 件{title}</strong>
            <span className="min-w-0 flex-1 truncate">{display.item.question}</span>
            <button type="button" className="shrink-0 py-2 text-(--link)" aria-expanded={false} aria-controls={contentId} onClick={() => onFoldedChange(false)}>展开</button>
          </div>
        </BpCollapse>
        <BpCollapse id={contentId} open={expanded}>
          <div className="flex min-h-0 flex-col [@container_bp-decision_(width<=480px)]:max-h-[calc(50dvh-2px)]">
            <header className="flex shrink-0 flex-wrap items-center gap-2.5 px-3.5 pt-2.5 text-ui-meta">
              <strong className="text-warning-foreground">{title}</strong>
              <span className="font-mono tabular-nums text-muted-foreground">{display.index + 1} / {display.count}</span>
              <button type="button" aria-label="上一件" disabled={!!confirmation || switching || display.index === 0} onClick={() => onIndexChange(display.index - 1)} className="size-6 shrink-0 border border-border disabled:text-muted-foreground [@container_bp-decision_(width<=480px)]:size-8">‹</button>
              <button type="button" aria-label="下一件" disabled={!!confirmation || switching || display.index >= display.count - 1} onClick={() => onIndexChange(display.index + 1)} className="size-6 shrink-0 border border-border disabled:text-muted-foreground [@container_bp-decision_(width<=480px)]:size-8">›</button>
              <span className="flex-1" />
              <button type="button" className="shrink-0 py-2 text-ui-action text-(--link)" aria-expanded={true} aria-controls={contentId} onClick={() => onFoldedChange(true)}>{laterLabel}</button>
            </header>
            <div ref={body} className={cn("min-h-0 overflow-y-auto transition-opacity duration-(--motion-base) ease-bp motion-reduce:duration-(--motion-fast)", leaving ? "opacity-0" : "opacity-100")}
              onTransitionEnd={event => { if (leaving && event.target === event.currentTarget && event.propertyName === "opacity") finishSwap() }}
              onTransitionCancel={() => { if (leaving) finishSwap() }}>
              <div className="space-y-1 px-3.5 pb-2.5 pt-2"><div className="text-block-title">{display.item.question}</div>{display.item.description != null && <div className="text-ui-hint text-muted-foreground">{display.item.description}</div>}</div>
              {options.map((option, optionIndex) => {
                const selected = !!confirmation && (option.isOther ? "other" in confirmation.answer : "value" in confirmation.answer && confirmation.answer.value === option.value)
                if (option.isOther && editing) return <form key="other" className="space-y-2 border-t border-border px-3.5 py-2.5" onSubmit={event => { event.preventDefault(); const text = other.text.trim(); if (text) answer({ other: text }, text) }}>
                  <label htmlFor={inputId} className="text-ui-meta text-muted-foreground">{optionIndex + 1} · {otherConfig.label ?? "其他（Agent 会按你写的继续）"}</label>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
                    <Input nativeInput ref={input} id={inputId} placeholder={otherConfig.placeholder} value={other.text} onChange={event => setOther({ id: display.item.id, text: event.target.value })} onKeyDown={event => { if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault() }} />
                    <BpButton type="submit" variant="primary" disabled={!other.text.trim()}>{otherConfig.submitLabel ?? "回答"}</BpButton>
                  </div>
                  <button type="button" className="text-ui-meta text-(--link) underline" onClick={() => { setOther(null); requestAnimationFrame(() => otherButton.current?.focus()) }}>返回选项</button>
                </form>
                return <button key={option.isOther ? "other" : `option-${option.value}`} type="button" ref={option.isOther ? otherButton : undefined} data-slot="decision-option" disabled={!!confirmation || switching} onClick={() => choose(optionIndex)}
                  className={cn("flex w-full items-center gap-2.5 border-t border-border px-3.5 py-2.5 text-left transition-colors duration-(--motion-fast) ease-bp [@container_bp-decision_(width<=480px)]:min-h-12", selected ? "bg-accent font-semibold" : confirmation ? "text-muted-foreground" : "hover:bg-accent")}>
                  <span aria-hidden="true" className={cn("grid size-[22px] shrink-0 place-items-center border font-mono text-ui-meta transition-colors duration-(--motion-fast) ease-bp", selected ? "border-foreground bg-foreground text-background" : confirmation ? "border-border" : "border-foreground")}>{selected ? "✓" : optionIndex + 1}</span>
                  <span className="min-w-0">{selected ? confirmation.label : option.label}</span>
                  {selected ? <span className="ml-auto text-ui-meta font-normal text-success-foreground">已选，继续处理</span> : option.recommended && <span className="shrink-0 border border-(--link) px-1.5 text-ui-meta text-(--link)">推荐</span>}
                </button>
              })}
              <div className="border-t border-border px-3.5 py-2 text-ui-meta text-muted-foreground [@media(pointer:coarse)]:hidden">按 1–{options.length} 选择 · Esc 稍后</div>
            </div>
          </div>
        </BpCollapse>
      </div>}
    </BpCollapse>
  </div>
}

export interface BpDecisionReceiptProps { question: ReactNode; answer?: ReactNode }

export function BpDecisionReceipt({ question, answer }: BpDecisionReceiptProps) {
  return <div className="bp-decision-receipt flex min-w-0 flex-wrap items-baseline gap-2 text-ui-hint [overflow-wrap:anywhere]">
    {answer == null ? <><span aria-hidden="true" className="size-[7px] shrink-0 self-center rounded-full bg-warning-foreground" /><strong className="text-warning-foreground">等你决定</strong>{question}<span className="text-muted-foreground">· 在输入框上方</span></> : <><span className="text-success-foreground">✓</span>{question}<span className="text-muted-foreground">→</span><strong>{answer}</strong></>}
  </div>
}
