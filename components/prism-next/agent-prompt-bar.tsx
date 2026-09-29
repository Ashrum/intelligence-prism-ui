"use client"
/** Adapted from Beautiful UI Prompt Bar (2026-09-29 snapshot).
 * Copyright (c) 2026 Shane Levine. MIT License; full permission and warranty
 * notice is retained in docs/third-party/beautifului-LICENSE.txt.
 * Controls compose unchanged coss originals (particles 28/29/23).
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { ArrowUp, ChevronDown, Paperclip, Plus, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Label } from "@/components/coss/label"
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/coss/input-group"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuRadioGroup, MenuRadioItem } from "@/components/coss/menu"
import { Popover, PopoverPopup } from "@/components/coss/popover"
import { cn } from "@/lib/utils"
import { createPromptSweep } from "./agent-prompt-sweep"
import { AgentVoiceButtons, AgentVoiceStatus, type AgentDictation, type AgentVoiceMode, type AgentVoicePrivacy, type AgentVoiceIntent } from "./agent-voice"
import "./agent-conversation.css"

export type AgentPromptOption = { id: string; label: string; description?: string; disabled?: boolean }
export type AgentPromptAttachment = { id: string; label: string }
export type AgentPromptIntent = AgentVoiceIntent
  | { type: "submit"; text: string; attachmentIds: string[] }
  | { type: "attach" }
  | { type: "select-source" | "run-command" | "select-model" | "remove-attachment"; id: string }
export type AgentPromptBarProps = {
  value: string; onValueChange: (value: string) => void; onIntent: (intent: AgentPromptIntent) => void
  sources: readonly AgentPromptOption[]; commands: readonly AgentPromptOption[]; models: readonly AgentPromptOption[]; modelId?: string
  attachments?: readonly AgentPromptAttachment[]; variant?: "Rounded" | "Pill"; label?: string; placeholder?: string
  contextActions?: ReactNode; dictation: AgentDictation; voice: AgentVoiceMode; privacy?: AgentVoicePrivacy
  disabled?: boolean; sendDisabledReason?: string; activity?: ReactNode
}
export function parsePromptToken(draft: string) {
  const match = /(^|\s)([@/])([^\s@/]*)$/u.exec(draft)
  return match ? { kind: match[2] === "@" ? "source" as const : "command" as const, query: match[3].toLocaleLowerCase(), start: match.index + match[1].length } : null
}
export function AgentPromptBar({ value, onValueChange, onIntent, sources, commands, models, modelId, attachments = [], variant = "Rounded", label = "消息", placeholder = "随心输入", contextActions, dictation, voice, privacy, disabled = false, sendDisabledReason, activity }: AgentPromptBarProps) {
  const id = useId(), input = useRef<HTMLTextAreaElement>(null), anchor = useRef<HTMLDivElement>(null), root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const sweep = useRef<ReturnType<typeof createPromptSweep> | null>(null)
  const [dismissed, setDismissed] = useState<string | null>(null), [active, setActive] = useState(0)
  const [plusOpen, setPlusOpen] = useState(false), [modelOpen, setModelOpen] = useState(false)
  const token = disabled || dismissed === value || plusOpen || modelOpen ? null : parsePromptToken(value)
  const rows = token ? (token.kind === "source" ? sources : commands).filter(row => row.label.toLocaleLowerCase().replace(/^\//, "").includes(token.query)) : []
  const enabledRows = rows.filter(row => !row.disabled)
  const selected = enabledRows[Math.min(active, Math.max(0, enabledRows.length - 1))]
  const model = models.find(item => item.id === modelId)
  useEffect(() => {
    if (!canvas.current || typeof window.matchMedia !== "function") return
    const current = createPromptSweep(canvas.current, window.matchMedia("(prefers-reduced-motion: reduce)"))
    sweep.current = current
    const element = canvas.current
    const lost = () => current.destroy()
    element.addEventListener("webglcontextlost", lost)
    return () => { element.removeEventListener("webglcontextlost", lost); current.destroy(); sweep.current = null }
  }, [])
  const close = () => { setDismissed(value); setPlusOpen(false); setModelOpen(false) }
  const pick = (row: AgentPromptOption, kind: "source" | "command") => {
    if (disabled || row.disabled) return
    const editingToken = parsePromptToken(value)
    const prefix = editingToken?.kind === kind ? value.slice(0, editingToken.start) : value
    onValueChange(`${prefix}${kind === "source" ? "@" : "/"}${row.label.replace(/^[@/]/, "")} `)
    onIntent({ type: kind === "source" ? "select-source" : "run-command", id: row.id })
    close(); input.current?.focus()
  }
  const submit = () => {
    if (disabled || sendDisabledReason || (!value.trim() && !attachments.length)) return
    onIntent({ type: "submit", text: value.trim(), attachmentIds: attachments.map(item => item.id) })
    close(); sweep.current?.play()
  }
  return <div ref={root} data-agent-prompt-bar data-variant={variant} className="min-w-0 space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div ref={anchor} className="relative min-w-0">
      <Popover open={Boolean(token)} onOpenChange={open => { if (!open) setDismissed(value) }}>
        <PopoverPopup anchor={anchor} side="top" align="start" initialFocus={false} finalFocus={false} portalProps={{ container: root }} className="w-[var(--anchor-width)] max-w-full" aria-label={token?.kind === "source" ? "来源提及" : "命令选择"}>
          <div id={`${id}-options`} role="listbox" aria-label={token?.kind === "source" ? "来源" : "命令"} className="max-h-64 overflow-y-auto space-y-1">
            {rows.map(row => <Button key={row.id} id={`${id}-option-${row.id}`} role="option" aria-selected={selected?.id === row.id} disabled={row.disabled} type="button" tabIndex={-1}
              variant={selected?.id === row.id ? "secondary" : "ghost"} className="h-auto w-full justify-start whitespace-normal text-left" onMouseDown={event => event.preventDefault()}
              onPointerMove={() => { const index = enabledRows.indexOf(row); if (index >= 0) setActive(index) }} onClick={() => token && pick(row, token.kind)}>
              <span className="min-w-0"><span className="block text-ui-action">{row.label}</span>{row.description && <span className="block text-ui-hint text-muted-foreground">{row.description}</span>}</span>
            </Button>)}
            {!rows.length && <p role="status" className="p-2 text-ui-hint">没有匹配项</p>}
          </div>
          <p className="mt-2 text-ui-meta text-muted-foreground">↑↓ 选择 · Enter 确认 · Esc 关闭</p>
        </PopoverPopup>
      </Popover>
      <InputGroup className={cn("agent-prompt-surface isolate overflow-hidden", variant === "Pill" ? "rounded-3xl" : "rounded-xl")}>
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-[inherit]" />
        {attachments.length > 0 && <InputGroupAddon align="block-start" className="min-w-0 flex-wrap gap-2">{attachments.map(item => <span key={item.id} className="flex max-w-full items-center gap-1 rounded-md border px-2 text-ui-hint">
          <Paperclip aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 break-all">{item.label}</span><Button type="button" variant="ghost" size="icon-xs" aria-label={`移除附件：${item.label}`} disabled={disabled} onClick={() => onIntent({ type: "remove-attachment", id: item.id })}><X aria-hidden="true" /></Button>
        </span>)}</InputGroupAddon>}
        <InputGroupTextarea ref={input} id={id} value={value} disabled={disabled} placeholder={placeholder} rows={2}
          role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={Boolean(token)} aria-controls={token ? `${id}-options` : undefined} aria-activedescendant={token && selected ? `${id}-option-${selected.id}` : undefined}
          aria-describedby={`${id}-help${sendDisabledReason ? ` ${id}-blocked` : ""}`} className="[&>textarea]:max-h-52 [&>textarea]:overflow-y-auto"
          onChange={event => { onValueChange(event.target.value); setDismissed(null); setActive(0); setPlusOpen(false); setModelOpen(false) }}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
            if (event.key === "Escape") { event.preventDefault(); close(); return }
            if (token) {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); if (enabledRows.length) setActive((Math.min(active, enabledRows.length - 1) + (event.key === "ArrowDown" ? 1 : enabledRows.length - 1)) % enabledRows.length); return }
              if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (selected) pick(selected, token.kind); return }
              if (event.key === "Tab") close()
            }
            if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit() }
          }} />
        <InputGroupAddon align="block-end" className="min-w-0 flex-wrap gap-1.5">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1">
            <Menu open={plusOpen} onOpenChange={open => { setPlusOpen(open); if (open) { setDismissed(value); setModelOpen(false) } }}>
              <MenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label="添加附件与来源" />}><Plus aria-hidden="true" /></MenuTrigger>
              <MenuPopup side="top" align="start" portalProps={{ container: root }}>
                <MenuItem onClick={() => onIntent({ type: "attach" })}><Paperclip aria-hidden="true" />添加附件</MenuItem>
                {sources.map(source => <MenuItem key={source.id} disabled={source.disabled} onClick={() => pick(source, "source")}>{source.label}</MenuItem>)}
              </MenuPopup>
            </Menu>
            {contextActions}
          </div>
          <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-1">
            {activity}
            <Menu open={modelOpen} onOpenChange={open => { setModelOpen(open); if (open) { setDismissed(value); setPlusOpen(false) } }}>
              <MenuTrigger render={<Button type="button" variant="ghost" size="sm" className="h-auto max-w-full whitespace-normal" disabled={disabled || !models.length} aria-label={`选择模型：${model?.label ?? "尚未选择"}`} />}><span className="min-w-0 break-words">{model?.label ?? "选择模型"}</span><ChevronDown aria-hidden="true" /></MenuTrigger>
              <MenuPopup side="top" align="end" portalProps={{ container: root }}><MenuRadioGroup value={modelId ?? ""} onValueChange={next => { if (!disabled) onIntent({ type: "select-model", id: next }) }}>
                {models.map(item => <MenuRadioItem key={item.id} value={item.id} disabled={item.disabled}>{item.label}{item.description && <span className="block text-ui-hint text-muted-foreground">{item.description}</span>}</MenuRadioItem>)}
              </MenuRadioGroup></MenuPopup>
            </Menu>
            <AgentVoiceButtons dictation={dictation} voice={voice} privacy={privacy} disabled={disabled} onIntent={onIntent} onStart={() => sweep.current?.play()} />
            <Button type="button" size="icon-sm" className={variant === "Pill" ? "rounded-full" : undefined} aria-label="发送消息" disabled={disabled || Boolean(sendDisabledReason) || (!value.trim() && !attachments.length)} onClick={submit}><ArrowUp aria-hidden="true" /></Button>
          </div>
        </InputGroupAddon>
      </InputGroup>
    </div>
    <p id={`${id}-help`} className="text-ui-meta text-muted-foreground">@ 来源 · / 命令 · Enter 发送 · Shift + Enter 换行</p>
    {sendDisabledReason && <p id={`${id}-blocked`} role="status" className="text-ui-hint">{sendDisabledReason}</p>}
    <AgentVoiceStatus dictation={dictation} voice={voice} privacy={privacy} onIntent={onIntent} />
  </div>
}
