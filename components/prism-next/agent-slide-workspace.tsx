"use client"

import { useId, useState, type KeyboardEvent } from "react"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { Textarea } from "@/components/coss/textarea"
import { Badge } from "./badge"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import type { AgentDocumentSave } from "./agent-document-workspace"

export type AgentSlideCapabilityKind = "view" | "reorder" | "edit-text" | "add" | "delete" | "generate" | "export"
export type AgentSlideCapability = { supported: true; reason?: string } | { supported: false; reason: string }
export type AgentSlideCapabilities = Record<AgentSlideCapabilityKind, AgentSlideCapability>
export type AgentSlide = {
  id: string
  /** Host-supplied one-based display number; array order is the supplied deck order. */
  number: number
  title: string
  points: string
  thumbnail?: { src: string; alt: string }
  notes?: string
  status?: string
}
export type AgentSlideContext = { deckId: string; version: string }
export type AgentSlideIntent = AgentSlideContext & (
  | { type: "select-slide"; slideId: string }
  | { type: "reorder"; slideId: string; toIndex: number }
  | { type: "edit-text"; slideId: string; title: string; points: string }
  | { type: "add-slide"; afterSlideId: string | null }
  | { type: "delete-slide"; slideId: string }
  | { type: "request-generate" | "request-export" | "open-source" }
)
export type AgentSlideWorkspaceProps = Omit<AgentRecordViewProps, "onExpand"> & AgentSlideContext & {
  title: string
  versionLabel?: string
  source?: { label: string; openable?: boolean }
  save?: AgentDocumentSave
  slides: readonly AgentSlide[]
  selectedSlideId: string | null
  capabilities: AgentSlideCapabilities
  /** Presence (including an empty string) disables all content changes. */
  readOnlyReason?: string
  onIntent?: (intent: AgentSlideIntent) => void
  onExpand?: (trigger: HTMLButtonElement, context: AgentSlideContext) => void
  onBack?: (context: AgentSlideContext) => void
  notice?: string
}

type TextDraft = AgentSlideContext & { slideId: string; baseline: string; title: string; points: string }
const labels: Record<AgentSlideCapabilityKind, string> = { view: "查看", reorder: "调序", "edit-text": "编辑文字", add: "新增", delete: "删除", generate: "生成", export: "导出" }
const kinds = Object.keys(labels) as AgentSlideCapabilityKind[]
const saveLabels = { unsaved: "未保存", "saved-draft": "已保存草稿", submitted: "已提交", conflict: "冲突", unknown: "状态未确认" }

function SlideThumbnail({ thumbnail }: { thumbnail?: AgentSlide["thumbnail"] }) {
  const [failed, setFailed] = useState(false)
  if (!thumbnail?.src) return <p className="text-ui-hint">未提供缩略图</p>
  if (failed) return <p className="text-ui-hint">缩略图加载失败，请阅读文字内容。</p>
  return <img src={thumbnail.src} alt={thumbnail.alt.trim() || "课件缩略图（未提供图片说明）"} onError={() => setFailed(true)} className="h-auto max-h-80 max-w-full object-contain" />
}

/** Semantic 29: external deck facts, a temporary text draft, and version-bound requests only. */
export function AgentSlideWorkspace({ deckId, version, title, versionLabel, source, save, slides, selectedSlideId,
  capabilities, readOnlyReason, onIntent, onExpand, onBack, view = "inline", density = "default", details,
  notice = "文字与缩略图仅供查看；修改、生成和导出需确认结果，不代表已保存或已有可下载文件。",
}: AgentSlideWorkspaceProps) {
  const id = useId()
  const [draft, setDraft] = useState<TextDraft | null>(null)
  const [feedback, setFeedback] = useState("")
  const context = { deckId, version }
  const canView = capabilities.view.supported
  const valid = !!deckId.trim() && !!version.trim() && slides.every(slide => slide.id.trim() && Number.isInteger(slide.number) && slide.number > 0)
    && new Set(slides.map(slide => slide.id)).size === slides.length && new Set(slides.map(slide => slide.number)).size === slides.length
  const selectedIndex = slides.findIndex(slide => slide.id === selectedSlideId)
  const selected = slides[selectedIndex]
  const readOnly = readOnlyReason !== undefined
  const state = save?.state ?? "unknown"
  const available = canView && valid && !!onIntent
  const baseline = JSON.stringify([context, slides, capabilities, readOnlyReason, state === "conflict"])
  const stale = !!draft && (draft.baseline !== baseline || draft.slideId !== selectedSlideId)
  const editingAllowed = available && !readOnly && state !== "conflict"
  const supports = (kind: AgentSlideCapabilityKind) => available && capabilities[kind].supported &&
    (kind === "view" || kind === "export" || editingAllowed)
  const request = (intent: AgentSlideIntent, kind: AgentSlideCapabilityKind) => {
    if (!supports(kind) || draft) return
    onIntent?.(intent)
  }
  function move(slide: AgentSlide, index: number, direction: number) {
    const toIndex = index + direction
    if (toIndex < 0 || toIndex >= slides.length) return
    request({ ...context, type: "reorder", slideId: slide.id, toIndex }, "reorder")
  }
  function directoryKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.nativeEvent.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.shiftKey) return
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-slide-select]"))
    const index = buttons.indexOf(event.target as HTMLButtonElement)
    if (index < 0) return
    if (event.altKey) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault()
        move(slides[index], index, event.key === "ArrowUp" ? -1 : 1)
      }
      return
    }
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : event.key === "ArrowDown" ? Math.min(index + 1, buttons.length - 1)
        : event.key === "ArrowUp" ? Math.max(index - 1, 0) : undefined
    if (next === undefined) return
    event.preventDefault()
    buttons[next]?.focus()
  }
  // Identical reasons appear once, with their capability scope. No per-slide disabled tools.
  const reasons = new Map<string, string[]>()
  for (const kind of kinds) {
    const capability = capabilities[kind]
    const reason = capability.reason?.trim() || (!capability.supported ? "暂不支持" : "")
    if (reason) reasons.set(reason, [...(reasons.get(reason) ?? []), `${labels[kind]}${capability.supported ? "" : "不支持"}`])
  }
  const tool = (label: string, kind: AgentSlideCapabilityKind, action: () => void, disabled = false) => supports(kind) &&
    <Button type="button" variant="outline" disabled={!!draft || disabled} onClick={() => { if (!draft && !disabled && supports(kind)) action() }}>{label}</Button>
  const titleOf = (slide: AgentSlide) => slide.title.trim() || "未命名页面"
  return <Card data-agent-slide-view={view} data-density={density} aria-labelledby={`${id}-title`} className={`@container min-w-0 ${density === "compact" ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="break-words text-block-title">{title || "演示文稿"}</h3>
      <p className="break-words text-ui-hint">{readOnly ? "只读版本" : "当前版本"} · {versionLabel?.trim() || "版本未确认"}{canView && ` · ${slides.length} 页`}</p>
      <div className="flex flex-wrap items-center gap-2"><span className="text-ui-hint">保存状态</span><Badge variant={state === "saved-draft" || state === "submitted" ? "secondary" : "warning"}>{saveLabels[state]}</Badge></div>
      {save?.description && <p className="break-words text-ui-hint">{save.description}</p>}
      <p className="break-words text-ui-hint">来源：{source?.label.trim() || "未确认"}</p>
    </header>
    <section aria-label="课件能力" className="min-w-0 space-y-2">
      {readOnly && <p className="break-words text-ui-hint">{readOnlyReason?.trim() || "当前版本仅供查看。"}</p>}
      {[...reasons].map(([reason, scope]) => <p key={reason} className="break-words text-ui-hint">{scope.join("、")}：{reason}</p>)}
      {!valid && <p className="text-ui-hint">课件身份、版本或页列表未确认，暂不可操作。</p>}
      {!onIntent && <p className="text-ui-hint">当前仅供浏览，暂未提供操作入口。</p>}
    </section>
    {canView && valid && slides.length > 0 && slides.every(slide => !slide.status?.trim()) && <p className="text-ui-hint">页面状态未确认</p>}
    {canView && valid && (view === "inline" ? <section aria-label="课件缩略摘要" className="min-w-0 space-y-3">
      <ol className="grid min-w-0 gap-3 @min-[48rem]:grid-cols-3">{slides.slice(0, 3).map(slide => <li key={slide.id} className="min-w-0 space-y-2">
        <p className="break-words text-ui-body">第 {slide.number} 页 · {titleOf(slide)}</p>
        <SlideThumbnail key={`${slide.id}:${slide.thumbnail?.src}`} thumbnail={slide.thumbnail} />
        {slide.status?.trim() && <p className="break-words text-ui-hint">{slide.status}</p>}
      </li>)}</ol>
      {slides.length > 3 && <p className="text-ui-hint">展示前 3 页，共 {slides.length} 页。</p>}
      {!slides.length && <p className="text-ui-hint">尚未提供幻灯片。</p>}
    </section> : <div className="grid min-w-0 items-start gap-5 @min-[48rem]:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
      <nav aria-label="幻灯片列表" onKeyDown={directoryKeys} className="min-w-0 space-y-3">
        <p className="text-ui-hint">上下键移动焦点，回车或空格选页。{supports("reorder") && "Alt + 上下键可调序，也可使用下方按钮。"}</p>
        <ol className="min-w-0 space-y-2">{slides.map(slide => <li key={slide.id} className="min-w-0">
          <Button type="button" variant={slide.id === selectedSlideId ? "secondary" : "ghost"} data-slide-select="" disabled={!available || !!draft}
            className="h-auto min-h-9 w-full justify-start whitespace-normal py-2 text-left sm:h-auto" aria-current={slide.id === selectedSlideId ? "page" : undefined}
            onClick={() => request({ ...context, type: "select-slide", slideId: slide.id }, "view")}>
            第 {slide.number} 页 · {titleOf(slide)}{slide.status?.trim() && ` · ${slide.status}`}
          </Button>
        </li>)}</ol>
        {!slides.length && <p className="text-ui-hint">尚未提供幻灯片。</p>}
      </nav>
      <article aria-label="当前页预览" className="min-w-0 space-y-4">
        {selected ? <>
          <h4 className="break-words text-block-title">第 {selected.number} 页 · {titleOf(selected)}</h4>
          <SlideThumbnail key={`${selected.id}:${selected.thumbnail?.src}`} thumbnail={selected.thumbnail} />
          <p className="max-w-[40em] whitespace-pre-wrap break-words text-read-body">{selected.points || "尚未提供要点。"}</p>
          <section aria-label="讲者备注" className="space-y-2"><h5 className="text-ui-action">讲者备注</h5><p className="whitespace-pre-wrap break-words text-read-body">{selected.notes?.trim() ? selected.notes : "尚未提供讲者备注。"}</p></section>
          <div className="flex flex-wrap gap-2">
            {tool("上移", "reorder", () => move(selected, selectedIndex, -1), selectedIndex === 0)}
            {tool("下移", "reorder", () => move(selected, selectedIndex, 1), selectedIndex === slides.length - 1)}
            {tool("编辑标题与要点", "edit-text", () => { setFeedback(""); setDraft({ ...context, slideId: selected.id, baseline, title: selected.title, points: selected.points }) })}
            {tool("删除当前页", "delete", () => request({ ...context, type: "delete-slide", slideId: selected.id }, "delete"))}
          </div>
        </> : <p role="status" className="text-ui-hint">{selectedSlideId === null ? "请选择要查看的页面。" : "当前页面未列出，请重新选择。"}</p>}
        {tool("新增一页", "add", () => request({ ...context, type: "add-slide", afterSlideId: selected?.id ?? null }, "add"), !!slides.length && !selected)}
      </article>
    </div>)}
    {draft && <section aria-label="文字草稿" className="min-w-0 space-y-3">
      <p className="text-ui-hint">尚有未确认的文字草稿；请确认修改或放弃草稿后再选页、调序或返回。</p>
      {stale && <p role="status" className="text-ui-hint">课件或可用操作已变化，草稿保留但不可提交；请放弃后重新编辑。</p>}
      {canView && draft.deckId === deckId && !readOnly && <>
        <Field><FieldLabel htmlFor={`${id}-draft-title`}>页面标题</FieldLabel><Input id={`${id}-draft-title`} nativeInput value={draft.title} readOnly={stale || !supports("edit-text")} onChange={event => setDraft({ ...draft, title: event.target.value })} /></Field>
        <Field><FieldLabel htmlFor={`${id}-draft-points`}>要点文本</FieldLabel><Textarea id={`${id}-draft-points`} value={draft.points} readOnly={stale || !supports("edit-text")} onChange={event => setDraft({ ...draft, points: event.target.value })} /></Field>
      </>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={stale || !supports("edit-text")} onClick={() => {
          if (stale || !supports("edit-text")) return
          onIntent?.({ deckId: draft.deckId, version: draft.version, type: "edit-text", slideId: draft.slideId, title: draft.title, points: draft.points })
          setDraft(null); setFeedback("已提交文字修改请求，结果待确认。")
        }}>确认修改</Button>
        <Button type="button" variant="outline" onClick={() => { setDraft(null); setFeedback("") }}>放弃草稿</Button>
      </div>
    </section>}
    {feedback && <p role="status" className="text-ui-hint">{feedback}</p>}
    <div className="flex flex-wrap gap-2">
      {tool("生成课件", "generate", () => request({ ...context, type: "request-generate" }, "generate"))}
      {tool("导出课件", "export", () => request({ ...context, type: "request-export" }, "export"))}
      {source?.openable && tool("查看来源", "view", () => request({ ...context, type: "open-source" }, "view"))}
      {canView && valid && view === "inline" && onExpand && <Button type="button" variant="outline" onClick={event => onExpand(event.currentTarget, context)}>打开课件</Button>}
      {view === "workspace" && onBack && <Button type="button" variant="outline" disabled={!!draft} onClick={() => { if (!draft) onBack(context) }}>返回原位置</Button>}
    </div>
    <p className="break-words text-ui-hint">{notice}</p>
    {canView && <RecordDetails>{details}</RecordDetails>}
  </Card>
}
