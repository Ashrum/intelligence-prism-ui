"use client"
/** Adapted from Beautiful UI Prompt Bar (2026-09-29 snapshot).
 * Copyright (c) 2026 Shane Levine. MIT License; full permission and warranty
 * notice is retained in docs/third-party/beautifului-LICENSE.txt.
 * Controls compose unchanged coss originals (particles 28/29/23).
 */
import { useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode } from "react"
import { ArrowUp, ChevronDown, Paperclip, Plus, Square, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Label } from "@/components/coss/label"
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/coss/input-group"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuRadioGroup, MenuRadioItem } from "@/components/coss/menu"
import { Popover, PopoverPopup } from "@/components/coss/popover"
import { cn } from "@/lib/utils"
import { createPromptSweep } from "./agent-prompt-sweep"
import { AgentVoiceButtons, AgentVoiceStatus, AgentDictationIndicator, AgentDictationAnnouncement, isDictating, type AgentDictation, type AgentVoiceMode, type AgentVoicePrivacy, type AgentVoiceIntent } from "./agent-voice"
import { AgentPromptAttachmentStrip, type AgentPromptRichAttachment, type AgentPromptAttachmentErrorDisplay } from "./agent-prompt-attachments"
export type { AgentPromptRichAttachment, AgentPromptAttachmentErrorDisplay } from "./agent-prompt-attachments"
import "./agent-conversation.css"

export type AgentPromptOption = { id: string; label: string; description?: string; disabled?: boolean }
export type AgentPromptAttachment = { id: string; label: string }
export type AgentPromptStatusHint = {
  message: string
  tone?: "info" | "error"
  action?: { label: string; onClick: () => void; disabled?: boolean }
  details?: ReactNode
}
export type AgentPromptIntent = AgentVoiceIntent
  | { type: "submit"; text: string; attachmentIds: string[] }
  | { type: "attach" }
  | { type: "stop" }
  | { type: "select-source" | "run-command" | "select-model" | "remove-attachment"; id: string }
export type AgentPromptBarProps = {
  value: string; onValueChange: (value: string) => void; onIntent: (intent: AgentPromptIntent) => void
  sources: readonly AgentPromptOption[]; commands: readonly AgentPromptOption[]; models: readonly AgentPromptOption[]; modelId?: string
  /** Host-controlled availability; false omits the model menu entirely. Defaults to true for existing callers. */
  showModelSelector?: boolean
  attachments?: readonly AgentPromptAttachment[]; variant?: "Rounded" | "Pill"; label?: string; placeholder?: string
  /** Opt-in rich strip; legacy attachments retain their original rendering and intents. */
  richAttachments?: readonly AgentPromptRichAttachment[]
  attachmentErrorDisplay?: AgentPromptAttachmentErrorDisplay
  onRemoveAttachment?: (id: string) => void
  onOpenAttachment?: (id: string) => void
  /** Receives dropped or pasted files only; the host validates and uploads them. */
  onDropFiles?: (files: File[]) => void
  contextActions?: ReactNode; dictation: AgentDictation; voice: AgentVoiceMode; privacy?: AgentVoicePrivacy
  /** Opt-in layout; omitted props retain the legacy rendering. */
  density?: "compact"
  expandable?: boolean
  primaryAction?: "send" | "stop" | "stopping"
  /** Names the host-defined stop scope; never inferred from draft or activity. */
  stopLabel?: string
  statusHint?: AgentPromptStatusHint
  disabled?: boolean; sendDisabledReason?: string; announceDisabledReason?: boolean; activity?: ReactNode
}
export function parsePromptToken(draft: string) {
  const match = /(^|\s)([@/])([^\s@/]*)$/u.exec(draft)
  return match ? { kind: match[2] === "@" ? "source" as const : "command" as const, query: match[3].toLocaleLowerCase(), start: match.index + match[1].length } : null
}
export function AgentPromptBar({ value, onValueChange, onIntent, sources, commands, models, modelId, showModelSelector = true, attachments = [], variant = "Rounded", label = "消息", placeholder = "随心输入", contextActions, dictation, voice, privacy, disabled = false, sendDisabledReason: hostSendDisabledReason, announceDisabledReason = true, activity, density, expandable = false, primaryAction, stopLabel = "停止当前回答", statusHint, richAttachments, attachmentErrorDisplay, onRemoveAttachment, onOpenAttachment, onDropFiles }: AgentPromptBarProps) {
  const id = useId(), input = useRef<HTMLTextAreaElement>(null), anchor = useRef<HTMLDivElement>(null), root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const sweep = useRef<ReturnType<typeof createPromptSweep> | null>(null)
  const [dismissed, setDismissed] = useState<string | null>(null), [active, setActive] = useState(0)
  const [plusOpen, setPlusOpen] = useState(false), [modelOpen, setModelOpen] = useState(false)
  const [expanded, setExpanded] = useState(false), [canExpand, setCanExpand] = useState(false)
  const selection = useRef<{ start: number; end: number; direction: "forward" | "backward" | "none"; scrollTop: number } | null>(null)
  const stopRequested = useRef(false)
  const enhanced = density === "compact" || expandable || primaryAction !== undefined || statusHint !== undefined
  const stopping = primaryAction === "stopping"
  const fileDropEnabled = Boolean(onDropFiles) && !disabled
  const [fileDrag, setFileDrag] = useState({ enabled: fileDropEnabled, depth: 0 })
  if (fileDrag.enabled !== fileDropEnabled) setFileDrag({ enabled: fileDropEnabled, depth: 0 })
  const draggingFiles = fileDrag.enabled === fileDropEnabled && fileDrag.depth > 0
  const hasFiles = (transfer: DataTransfer) => Array.from(transfer.types).includes("Files")
  const attachmentIds = richAttachments?.length ? [...new Set([...attachments.map(item => item.id), ...richAttachments.map(item => item.id)])] : attachments.map(item => item.id)
  const richBlockedReason = richAttachments?.some(item => item.status === "uploading") ? "附件上传中，请等待完成或取消上传" : richAttachments?.some(item => item.status === "error") ? "附件上传失败，请移除失败附件后重试" : undefined
  // Only explicit host facts block sending; unknown states never imply readiness.
  const sendDisabledReason = hostSendDisabledReason || richBlockedReason
  useEffect(() => { stopRequested.current = false }, [primaryAction])
  useEffect(() => {
    if (!expandable) { setExpanded(false); setCanExpand(false); return }
    const element = input.current
    if (!element || expanded) return
    const measure = () => {
      const limit = Number.parseFloat(window.getComputedStyle(element).maxHeight)
      setCanExpand(Number.isFinite(limit) && element.scrollHeight >= limit)
    }
    measure()
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure)
    observer?.observe(element)
    window.addEventListener("resize", measure)
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure) }
  }, [value, expandable, expanded])
  useLayoutEffect(() => {
    const saved = selection.current, element = input.current
    if (!saved || !element) return
    element.focus({ preventScroll: true })
    element.setSelectionRange(saved.start, saved.end, saved.direction)
    element.scrollTop = saved.scrollTop
    selection.current = null
  }, [expanded])
  const changeExpanded = (next: boolean) => {
    const element = input.current
    if (element) selection.current = { start: element.selectionStart, end: element.selectionEnd, direction: element.selectionDirection, scrollTop: element.scrollTop }
    setExpanded(next)
  }
  const requestStop = () => {
    if (disabled || primaryAction !== "stop" || stopRequested.current) return
    stopRequested.current = true
    onIntent({ type: "stop" })
  }
  const dictating = isDictating(dictation.state)
  // Interim is a preview inside the input surface, never part of the editable draft.
  const interim = dictating ? dictation.interim : undefined
  const transcript = interim || (dictation.state === "inserted" && !value ? dictation.final : undefined)
  const token = disabled || dismissed === value || plusOpen || (showModelSelector && modelOpen) ? null : parsePromptToken(value)
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
  useEffect(() => {
    if (!showModelSelector) setModelOpen(false)
  }, [showModelSelector])
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
    if (disabled || (primaryAction && primaryAction !== "send") || sendDisabledReason || (!value.trim() && !attachmentIds.length)) return
    onIntent({ type: "submit", text: value.trim(), attachmentIds })
    close(); sweep.current?.play()
  }
  return <div ref={root} data-agent-prompt-bar data-variant={variant} data-dictating={dictating} data-density={density} data-expanded={expandable ? expanded : undefined} className="min-w-0 space-y-2" onKeyDownCapture={event => {
    if (event.key !== "Escape" || !dictating || disabled || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
    event.preventDefault(); event.stopPropagation(); close(); onIntent({ type: "dictation-stop" })
  }}>
    <AgentDictationAnnouncement state={dictation.state} />
    <Label htmlFor={id} className="sr-only">{label}</Label>
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
      <InputGroup onDragEnter={fileDropEnabled ? event => {
        if (!hasFiles(event.dataTransfer)) return
        event.preventDefault(); setFileDrag(current => ({ enabled: fileDropEnabled, depth: current.depth + 1 }))
      } : undefined} onDragOver={fileDropEnabled ? event => {
        if (!hasFiles(event.dataTransfer)) return
        event.preventDefault(); event.dataTransfer.dropEffect = "copy"
      } : undefined} onDragLeave={fileDropEnabled ? () => {
        setFileDrag(current => ({ enabled: fileDropEnabled, depth: Math.max(0, current.depth - 1) }))
      } : undefined} onDrop={fileDropEnabled ? event => {
        if (!hasFiles(event.dataTransfer)) return
        event.preventDefault(); setFileDrag({ enabled: fileDropEnabled, depth: 0 })
        const files = Array.from(event.dataTransfer.files)
        if (files.length) onDropFiles?.(files)
      } : undefined} onPaste={fileDropEnabled ? event => {
        const files = Array.from(event.clipboardData.files)
        if (!files.length) return
        event.preventDefault(); onDropFiles?.(files)
      } : undefined} className={cn("agent-prompt-surface isolate overflow-hidden", variant === "Pill" ? "rounded-3xl" : "rounded-xl", dictating && "border-ring ring-ring/24 ring-[3px] shadow-none")}>
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-[inherit]" />
        {richAttachments !== undefined || (fileDropEnabled && draggingFiles) ? <>
          {richAttachments && richAttachments.length > 0 && <AgentPromptAttachmentStrip errorDisplay={attachmentErrorDisplay} items={richAttachments} disabled={disabled} onOpen={onOpenAttachment}
            onRemove={id => { if (onRemoveAttachment) onRemoveAttachment(id); else onIntent({ type: "remove-attachment", id }) }} />}
          {attachments.length > 0 && <InputGroupAddon align="block-start" className="min-w-0 flex-wrap gap-2">{attachments.map(item => <span key={item.id} className="flex max-w-full items-center gap-1 rounded-md border px-2 text-ui-hint">
          <Paperclip aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 break-all">{item.label}</span><Button type="button" variant="ghost" size="icon-xs" aria-label={`移除附件：${item.label}`} disabled={disabled} onClick={() => onIntent({ type: "remove-attachment", id: item.id })}><X aria-hidden="true" /></Button>
        </span>)}</InputGroupAddon>}
          {fileDropEnabled && draggingFiles && <div className="bp-prompt-drop-zone pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-ring bg-background p-4 text-center text-ui-body" role="status">松开以添加附件</div>}
        </> : attachments.length > 0 && <InputGroupAddon align="block-start" className="min-w-0 flex-wrap gap-2">{attachments.map(item => <span key={item.id} className="flex max-w-full items-center gap-1 rounded-md border px-2 text-ui-hint">
          <Paperclip aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 break-all">{item.label}</span><Button type="button" variant="ghost" size="icon-xs" aria-label={`移除附件：${item.label}`} disabled={disabled} onClick={() => onIntent({ type: "remove-attachment", id: item.id })}><X aria-hidden="true" /></Button>
        </span>)}</InputGroupAddon>}
        <div className="agent-dictation-field relative w-full min-w-0" data-shimmer={dictating && !value && !transcript}>
        {dictating && !value && !transcript && <span aria-hidden="true" className="agent-dictation-placeholder pointer-events-none absolute left-[calc(--spacing(3)-1px)] top-[calc(--spacing(3)-1px)] text-read-body">正在听…</span>}
        <InputGroupTextarea ref={input} id={id} value={value} disabled={disabled} placeholder={dictating ? "正在听…" : placeholder} rows={density === "compact" ? 1 : 2}
          role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={Boolean(token)} aria-controls={token ? `${id}-options` : undefined} aria-activedescendant={token && selected ? `${id}-option-${selected.id}` : undefined}
          aria-describedby={`${id}-help${transcript ? ` ${id}-transcript` : ""}${sendDisabledReason ? ` ${id}-blocked` : ""}${statusHint && !sendDisabledReason ? ` ${id}-hint` : ""}`} className={cn(enhanced && "block [&>textarea]:block", expandable && expanded ? "[&>textarea]:min-h-[min(24rem,50dvh)]! [&>textarea]:max-h-[min(36rem,65dvh)] [&>textarea]:overflow-y-auto" : "[&>textarea]:max-h-52 [&>textarea]:overflow-y-auto", density === "compact" && !expanded && "[&>textarea]:min-h-13! [&>textarea]:max-sm:min-h-13!")}
          onChange={event => { onValueChange(event.target.value); setDismissed(null); setActive(0); setPlusOpen(false); setModelOpen(false) }}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
            if (event.key === "Escape") { event.preventDefault(); if (token || plusOpen || modelOpen) close(); else if (expanded) changeExpanded(false); else close(); return }
            if (token) {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); if (enabledRows.length) setActive((Math.min(active, enabledRows.length - 1) + (event.key === "ArrowDown" ? 1 : enabledRows.length - 1)) % enabledRows.length); return }
              if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (selected) pick(selected, token.kind); return }
              if (event.key === "Tab") close()
            }
            if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit() }
          }} />
        </div>
        {transcript && <p id={`${id}-transcript`} data-dictation-transcript={interim ? "interim" : "final"} className={cn("w-full max-h-52 overflow-y-auto whitespace-pre-wrap break-words px-[calc(--spacing(3)-1px)] pb-2 text-read-body", interim ? "text-muted-foreground" : "text-foreground")}>{transcript}</p>}
        {enhanced ? <InputGroupAddon align="block-end" className="min-w-0 flex-wrap gap-1.5">
          <div role="group" aria-label="材料与输入工具" className="flex min-w-0 max-w-full flex-1 flex-wrap items-center gap-2">
            <Menu open={plusOpen} onOpenChange={open => { setPlusOpen(open); if (open) { setDismissed(value); setModelOpen(false) } }}>
              <MenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" className="-ml-1.75 sm:-ml-1.5" disabled={disabled} aria-label="添加附件与来源" />}><Plus aria-hidden="true" /></MenuTrigger>
              <MenuPopup side="top" align="start" portalProps={{ container: root }}>
                <MenuItem onClick={() => onIntent({ type: "attach" })}><Paperclip aria-hidden="true" />添加附件</MenuItem>
                {sources.map(source => <MenuItem key={source.id} disabled={source.disabled} onClick={() => pick(source, "source")}>{source.label}</MenuItem>)}
              </MenuPopup>
            </Menu>
            {contextActions}
            {showModelSelector && <Menu open={modelOpen} onOpenChange={open => { setModelOpen(open); if (open) { setDismissed(value); setPlusOpen(false) } }}>
              <MenuTrigger render={<Button type="button" variant="ghost" size="sm" className="h-auto max-w-full whitespace-normal" disabled={disabled || !models.length} aria-label={`选择模型：${model?.label ?? "尚未选择"}`} />}><span className="min-w-0 break-words">{model?.label ?? "选择模型"}</span><ChevronDown aria-hidden="true" /></MenuTrigger>
              <MenuPopup side="top" align="end" portalProps={{ container: root }}><MenuRadioGroup value={modelId ?? ""} onValueChange={next => { if (!disabled) onIntent({ type: "select-model", id: next }) }}>
                {models.map(item => <MenuRadioItem key={item.id} value={item.id} disabled={item.disabled}>{item.label}{item.description && <span className="block text-ui-hint text-muted-foreground">{item.description}</span>}</MenuRadioItem>)}
              </MenuRadioGroup></MenuPopup>
            </Menu>}
            <AgentDictationIndicator dictation={dictation} disabled={disabled} onIntent={onIntent} />
            <AgentVoiceButtons portalContainer={root} dictation={dictation} voice={voice} privacy={privacy} disabled={disabled} onIntent={onIntent} onStart={() => sweep.current?.play()} />
            {expandable && (canExpand || expanded) && <Button type="button" variant="ghost" size="sm" disabled={disabled} aria-expanded={expanded} aria-controls={id} onMouseDown={event => event.preventDefault()} onClick={() => changeExpanded(!expanded)}>{expanded ? "收起" : "展开编辑"}</Button>}
          </div>
          <div role="group" aria-label="主动作" className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
            {activity}
            <Button type="button" size="icon-lg" className={cn("size-9 sm:size-9 after:absolute after:inset-1/2 after:size-11 pointer-coarse:after:size-11 after:-translate-x-1/2 after:-translate-y-1/2", variant === "Pill" && "rounded-full")}
              aria-label={stopping ? "正在请求停止" : primaryAction === "stop" ? stopLabel : "发送消息"}
              title={stopping ? "正在请求停止" : primaryAction === "stop" ? stopLabel : "发送消息"}
              aria-describedby={primaryAction === "stop" || stopping ? undefined : sendDisabledReason ? `${id}-blocked` : undefined}
              disabled={disabled || stopping || (primaryAction !== "stop" && (Boolean(sendDisabledReason) || (!value.trim() && !attachmentIds.length)))}
              onClick={primaryAction === "stop" ? requestStop : submit}>{primaryAction === "stop" || stopping ? <Square aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}</Button>
            {(primaryAction === "stop" || stopping) && <span role={stopping ? "status" : undefined} className="text-ui-hint">{stopping ? "正在请求停止" : stopLabel}</span>}
          </div>
        </InputGroupAddon> : <InputGroupAddon align="block-end" className="min-w-0 flex-wrap gap-1.5">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1">
            <Menu open={plusOpen} onOpenChange={open => { setPlusOpen(open); if (open) { setDismissed(value); setModelOpen(false) } }}>
              <MenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" className="-ml-1.75 sm:-ml-1.5" disabled={disabled} aria-label="添加附件与来源" />}><Plus aria-hidden="true" /></MenuTrigger>
              <MenuPopup side="top" align="start" portalProps={{ container: root }}>
                <MenuItem onClick={() => onIntent({ type: "attach" })}><Paperclip aria-hidden="true" />添加附件</MenuItem>
                {sources.map(source => <MenuItem key={source.id} disabled={source.disabled} onClick={() => pick(source, "source")}>{source.label}</MenuItem>)}
              </MenuPopup>
            </Menu>
            {contextActions}
          </div>
          <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-1">
            {activity}
            {showModelSelector && <Menu open={modelOpen} onOpenChange={open => { setModelOpen(open); if (open) { setDismissed(value); setPlusOpen(false) } }}>
              <MenuTrigger render={<Button type="button" variant="ghost" size="sm" className="h-auto max-w-full whitespace-normal" disabled={disabled || !models.length} aria-label={`选择模型：${model?.label ?? "尚未选择"}`} />}><span className="min-w-0 break-words">{model?.label ?? "选择模型"}</span><ChevronDown aria-hidden="true" /></MenuTrigger>
              <MenuPopup side="top" align="end" portalProps={{ container: root }}><MenuRadioGroup value={modelId ?? ""} onValueChange={next => { if (!disabled) onIntent({ type: "select-model", id: next }) }}>
                {models.map(item => <MenuRadioItem key={item.id} value={item.id} disabled={item.disabled}>{item.label}{item.description && <span className="block text-ui-hint text-muted-foreground">{item.description}</span>}</MenuRadioItem>)}
              </MenuRadioGroup></MenuPopup>
            </Menu>}
            <AgentDictationIndicator dictation={dictation} disabled={disabled} onIntent={onIntent} />
            <AgentVoiceButtons portalContainer={root} dictation={dictation} voice={voice} privacy={privacy} disabled={disabled} onIntent={onIntent} onStart={() => sweep.current?.play()} />
            <Button type="button" size="icon-sm" className={variant === "Pill" ? "rounded-full" : undefined} aria-label="发送消息" aria-describedby={sendDisabledReason ? `${id}-blocked` : undefined} disabled={disabled || Boolean(sendDisabledReason) || (!value.trim() && !attachmentIds.length)} onClick={submit}><ArrowUp aria-hidden="true" /></Button>
          </div>
        </InputGroupAddon>}
      </InputGroup>
    </div>
    <p id={`${id}-help`} className="text-ui-meta text-muted-foreground">{primaryAction === "stop" || stopping ? "@ 来源 · / 命令 · Shift + Enter 换行 · 当前草稿不会自动发送" : "@ 来源 · / 命令 · Enter 发送 · Shift + Enter 换行"}</p>
    {statusHint ? <div className="space-y-2" data-prompt-status-hint>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <p id={`${id}-${sendDisabledReason ? "blocked" : "hint"}`} role={sendDisabledReason && !announceDisabledReason ? undefined : statusHint.tone === "error" ? "alert" : "status"} className="min-w-0 break-words text-ui-hint">{statusHint.tone === "error" && "错误："}{sendDisabledReason || statusHint.message}</p>
        {statusHint.action && <Button type="button" variant="ghost" size="sm" disabled={statusHint.action.disabled} onClick={statusHint.action.onClick}>{statusHint.action.label}</Button>}
      </div>
      {statusHint.details && <details><summary className="cursor-pointer text-ui-action">详情</summary><div className="mt-2 min-w-0 text-ui-hint">{statusHint.details}</div></details>}
    </div> : sendDisabledReason && <p id={`${id}-blocked`} role={announceDisabledReason ? "status" : undefined} className="text-ui-hint">{sendDisabledReason}</p>}
    <AgentVoiceStatus hideUnavailable promptStatus dictation={dictation} voice={voice} privacy={privacy} onIntent={onIntent} />
  </div>
}
