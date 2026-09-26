"use client"

import { useId, useRef, type DragEvent, type ReactNode } from "react"
import { GripVertical } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Label } from "@/components/coss/label"
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/coss/progress"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentCaptureAction = { disabledReason?: string }
export type AgentCaptureSet = { id: string; title: string; version: { id: string; label: string }; snapshot?: string }
export type AgentCaptureQuality = { state: "clear" | "blurry" | "skewed" | "cropped" | "glare" | "unknown"; reason?: string }
export type AgentCaptureUsage =
  | { state: "unused" | "unknown" }
  | { state: "used"; label: string; removalImpact: string }
export type AgentCapturePage = {
  id: string; name: string; source: string | null; capturedAt: string | null
  quality: AgentCaptureQuality; needsRecapture: boolean | null; usage: AgentCaptureUsage
  thumbnail?: ReactNode; thumbnailUrl?: string; previewUrl?: string
  lockedReason?: string
  actions?: { inspect?: AgentCaptureAction; recapture?: AgentCaptureAction; remove?: AgentCaptureAction; reorder?: AgentCaptureAction }
}
export type AgentCaptureRequest = { id: string; label: string }
export type AgentCaptureReceipt =
  | { state: "idle" }
  | { state: "unknown"; reason?: string }
  | { state: "received" | "running" | "succeeded" | "failed" | "unconfirmed"; operation: "capture" | "upload"; request: AgentCaptureRequest; progress?: number; reason?: string }
export type AgentCaptureSave = { state: "unsaved" | "saving" | "saved" | "conflict" | "error" | "unconfirmed" | "unknown"; description?: string }
type CaptureContext = { setId: string; versionId: string }
export type AgentCaptureScanIntent = CaptureContext & (
  | { type: "capture-request" | "confirm-set" }
  | { type: "recapture-request" | "inspect-page"; pageId: string }
  | { type: "remove-page"; pageId: string; requiresConfirmation: boolean }
  /** Zero-based final position after removing the source page. */
  | { type: "reorder"; pageId: string; toIndex: number; via: "up" | "down" | "drag" | "to-position" }
)
export type AgentCapturePreview = CaptureContext & {
  pageId: string; requestedBy: "user"; state: "loading" | "ready" | "error"; message?: string
}
export type AgentCaptureScanProps = AgentRecordViewProps & {
  captureSet: AgentCaptureSet
  /** Complete current page collection in page order; never a paginated upload queue. */
  pages: readonly AgentCapturePage[]
  capturedCount: number | null; totalPages: number | null; qualitySummary: string | null
  receipt: AgentCaptureReceipt; save?: AgentCaptureSave; readOnlyReason?: string
  actions?: { capture?: AgentCaptureAction; confirm?: AgentCaptureAction }
  onIntent?: (intent: AgentCaptureScanIntent) => void
  inlineLimit?: number; onBack?: () => void; notice?: string
  /** Activate only in response to inspect-page, and clear on close or authorization changes. */
  preview?: AgentCapturePreview | null
  renderPreview?: (page: AgentCapturePage, context: { view: "inline" | "workspace"; density: "default" | "compact" }) => ReactNode
}

const qualityLabels = { clear: "清晰", blurry: "模糊", skewed: "倾斜", cropped: "缺角", glare: "反光", unknown: "未知" }
const saveLabels = { unsaved: "未保存", saving: "保存中", saved: "已保存", conflict: "版本冲突", error: "保存失败", unconfirmed: "保存回执未确认", unknown: "未知" }
const known = (value: string | null | undefined) => !!value?.trim() && value.trim() !== "未知"
const hasId = (value: string) => !!value.trim()
const countKnown = (value: number | null): value is number => value !== null && Number.isInteger(value) && value >= 0
const limitReason = (value: string | undefined, fallback: string) => value === undefined ? undefined : value.trim() || fallback
const copy = (value: string) => value.trim().replace(/[。；;]+$/u, "")
const describedBy = (values: (string | undefined)[]) => [...new Set(values.filter(Boolean))].join(" ") || undefined

/** Presents page facts and version-bound requests; device, quality and processing services stay outside. */
export function AgentCaptureScan({ captureSet, pages, capturedCount, totalPages, qualitySummary, receipt,
  save = { state: "unknown" }, actions = {}, readOnlyReason, onIntent, view = "inline", density = "default",
  inlineLimit = 2, onExpand, onBack, details, preview, renderPreview,
  notice = "确认页集合不代表已识别或批阅；采集与保存结果以实际回执为准。",
}: AgentCaptureScanProps) {
  const id = useId(), workspace = view === "workspace"
  const context: CaptureContext = { setId: captureSet.id, versionId: captureSet.version.id }
  const revision = JSON.stringify(context)
  const drag = useRef<{ pageId: string; revision: string; pages: typeof pages } | null>(null)
  const identitiesValid = pages.every(page => hasId(page.id)) && new Set(pages.map(page => page.id)).size === pages.length
  const identityBlock = !hasId(context.setId) || !hasId(context.versionId) ? "页集合或版本尚未确认，暂不能操作。"
    : !identitiesValid ? "页面记录有重复或缺失，请重新核对。" : undefined
  const operation = "operation" in receipt ? receipt.operation === "capture" ? "采集" : "上传" : "采集"
  const receiptLabel = receipt.state === "idle" ? "暂无进行中的采集请求" : receipt.state === "unknown" ? undefined
    : `${operation}${{ received: "请求已接收", running: "中", succeeded: "已完成", failed: "失败", unconfirmed: "回执未确认" }[receipt.state]}`
  const receiptBlock = receipt.state === "unconfirmed" ? `请先核对原${operation}请求，确认前暂不改动页集合。`
    : receipt.state === "unknown" ? "请先核对采集结果，确认前暂不改动页集合。"
      : receipt.state === "running" || receipt.state === "received" ? `请等待当前${operation}请求的结果，再改动页集合。` : undefined
  const globalBlock = identityBlock || (captureSet.snapshot !== undefined ? "历史页集合只读。" : undefined)
    || limitReason(readOnlyReason, "当前页集合只读。") || receiptBlock
    || (["saving", "conflict", "unconfirmed"].includes(save.state) ? save.description || (save.state === "conflict" ? "请先核对当前版本，再改动页集合。" : "请先核对保存结果，再改动页集合。") : undefined)
    || (!onIntent ? "当前仅可查看页集合。" : undefined)
  const progress = receipt.state === "running" && typeof receipt.progress === "number" && Number.isFinite(receipt.progress) && receipt.progress >= 0 && receipt.progress <= 100 ? receipt.progress : null
  const limit = Number.isFinite(inlineLimit) ? Math.max(1, Math.floor(inlineLimit)) : 2
  const visible = pages.filter((page, index) => workspace || !onExpand || index < limit || page.quality.state !== "clear"
    || page.needsRecapture !== false || page.usage.state !== "unused" || page.id === preview?.pageId || page.lockedReason !== undefined)

  // One explanation serves all matching facts and controls. Scopes use page names, never internal IDs.
  const notes = new Map<string, { id: string; scopes: Set<number>; labels: Set<string> }>()
  function note(value: string | undefined | null, scope: number, label: string) {
    if (!value || !copy(value)) return undefined
    const text = copy(value)
    let entry = notes.get(text)
    if (!entry) { entry = { id: `${id}-note-${notes.size}`, scopes: new Set(), labels: new Set() }; notes.set(text, entry) }
    entry.scopes.add(scope); entry.labels.add(label)
    return entry.id
  }
  const globalNotes = [note(globalBlock, -1, "操作限制"), note(save.description, -1, "保存说明"),
    note("reason" in receipt ? receipt.reason : undefined, -1, "采集与上传说明"), note(known(qualitySummary) ? qualitySummary : undefined, -1, "质量摘要")]
  const unknown = [!known(captureSet.version.label) && "版本", !countKnown(capturedCount) && "已采集页数", !countKnown(totalPages) && "总页数",
    !known(qualitySummary) && "质量摘要", save.state === "unknown" && "保存状态", receipt.state === "unknown" && "采集状态",
    receipt.state === "running" && progress === null && "进度", "request" in receipt && !known(receipt.request.label) && "原请求名称"].filter(Boolean)
  function pageBlock(page: AgentCapturePage, action: keyof NonNullable<AgentCapturePage["actions"]>) {
    return (action === "inspect" ? identityBlock || (!onIntent ? "当前无法打开页面预览。" : undefined) : globalBlock || limitReason(page.lockedReason, "此页暂不可修改。"))
      || (!page.actions?.[action] ? "此操作暂不可用。" : limitReason(page.actions[action]?.disabledReason, "此操作暂不可用。"))
      || (action === "remove" && page.usage.state === "unknown" ? "后续使用情况未知，请先核对删除影响。" : undefined)
      || (action === "remove" && page.usage.state === "used" && !known(page.usage.removalImpact) ? "删除影响尚未提供，暂不能删除。" : undefined)
  }
  function moveBlock(page: AgentCapturePage, toIndex: number) {
    const block = pageBlock(page, "reorder"), fromIndex = pages.indexOf(page)
    if (block) return block
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= pages.length || fromIndex === toIndex) return "请选择不同的有效位置。"
    const locked = pages.slice(Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex) + 1)
      .find(target => target.lockedReason !== undefined || !target.actions?.reorder || target.actions.reorder.disabledReason !== undefined)
    return locked ? limitReason(locked.lockedReason, "此页暂不可修改。") || limitReason(locked.actions?.reorder?.disabledReason, "此页暂不可调整顺序。") || "移动范围内有不可调整顺序的页面。" : undefined
  }
  function move(page: AgentCapturePage, toIndex: number, via: "up" | "down" | "drag" | "to-position") {
    if (workspace && !moveBlock(page, toIndex)) onIntent?.({ ...context, type: "reorder", pageId: page.id, toIndex, via })
  }
  function dropTarget(beforeIndex: number) {
    const active = drag.current
    if (!workspace || !active || active.revision !== revision || active.pages !== pages) return
    const from = pages.findIndex(page => page.id === active.pageId), page = pages[from]
    const toIndex = beforeIndex - (from < beforeIndex ? 1 : 0)
    if (page && !moveBlock(page, toIndex)) return { page, toIndex }
  }
  const dropHandlers = (beforeIndex: number) => ({
    onDragOver: (event: DragEvent) => { if (dropTarget(beforeIndex)) { event.preventDefault(); event.dataTransfer.dropEffect = "move" } },
    onDrop: (event: DragEvent) => {
      const target = dropTarget(beforeIndex)
      if (target) { event.preventDefault(); event.stopPropagation(); move(target.page, target.toIndex, "drag") }
      drag.current = null
    },
  })
  function pageButton(page: AgentCapturePage, scope: number, action: keyof NonNullable<AgentCapturePage["actions"]>, label: string,
    emit: () => void, extraBlock?: string, description?: string) {
    if (!page.actions?.[action]) return null
    const block = pageBlock(page, action) || extraBlock, labelId = `${id}-${scope}-${action}-${label}`
    return <Button type="button" size="navigation" variant="outline" className="max-w-full whitespace-normal"
      data-capture-action={action} data-capture-page={scope} disabled={!!block}
      aria-labelledby={`${labelId} ${id}-page-${scope}`} aria-describedby={describedBy([note(block, scope, "操作限制"), description])}
      onClick={() => { if (!block) emit() }}><span id={labelId}>{label}</span></Button>
  }
  function setButton(action: "capture" | "confirm", label: string) {
    if (!actions[action]) return null
    const block = globalBlock || limitReason(actions[action]?.disabledReason, "此操作暂不可用。") || (action === "confirm" && !pages.length ? "请先采集页面，再确认页集合。" : undefined)
    return <Button type="button" size="navigation" variant={action === "capture" ? "default" : "outline"} className="max-w-full whitespace-normal"
      data-capture-action={action} disabled={!!block} aria-describedby={note(block, -1, "操作限制")}
      onClick={() => { if (!block) onIntent?.({ ...context, type: action === "capture" ? "capture-request" : "confirm-set" }) }}>{label}</Button>
  }
  const previewPage = preview && pages.find(page => page.id === preview.pageId)
  const previewValid = preview?.requestedBy === "user" && preview.setId === context.setId && preview.versionId === context.versionId
    && previewPage && !pageBlock(previewPage, "inspect")
  if (preview && !previewValid) note("预览对应的页面、版本或查看能力已变化，请重新选择。", -1, "预览")
  const unknownFields = (page: AgentCapturePage) => [!known(page.source) && "来源", !known(page.capturedAt) && "采集时间", page.quality.state === "unknown" && "质量",
    !["clear", "unknown"].includes(page.quality.state) && !known(page.quality.reason) && "质量原因", page.needsRecapture === null && "补采需求",
    page.usage.state === "unknown" && "后续使用", page.usage.state === "used" && !known(page.usage.label) && "后续处理名称"].filter((field): field is string => !!field)
  // Use the complete supplied collection, never just the inline subset, to claim "all pages".
  const sharedUnknown = pages.length > 1 ? unknownFields(pages[0]).filter(field => pages.every(page => unknownFields(page).includes(field))) : []
  const allCapturedAtKnown = pages.every(page => known(page.capturedAt))
  const rows = visible.map(page => {
    const scope = pages.indexOf(page), titleId = `${id}-page-${scope}`
    note(known(page.source) ? page.source : undefined, scope, "来源")
    if (allCapturedAtKnown) note(page.capturedAt, scope, "采集时间")
    note(known(page.quality.reason) ? page.quality.reason : undefined, scope, "质量原因"); note(limitReason(page.lockedReason, "此页暂不可修改。"), scope, "操作限制")
    const impact = page.usage.state === "used" ? note(page.usage.removalImpact, scope, "删除影响") : undefined
    const pageUnknown = unknownFields(page).filter(field => !sharedUnknown.includes(field))
    const controls = <div className="flex flex-wrap gap-2">
      {pageButton(page, scope, "inspect", "查看大图", () => onIntent?.({ ...context, type: "inspect-page", pageId: page.id }))}
      {pageButton(page, scope, "recapture", page.needsRecapture === true ? "补采此页" : "重新采集／替换", () => onIntent?.({ ...context, type: "recapture-request", pageId: page.id }))}
      {workspace && pageButton(page, scope, "remove", page.usage.state === "used" ? "申请删除" : "删除页", () => onIntent?.({ ...context, type: "remove-page", pageId: page.id, requiresConfirmation: page.usage.state === "used" }), undefined, impact)}
      {workspace && pageButton(page, scope, "reorder", "上移", () => move(page, scope - 1, "up"), scope === 0 ? "已在首位，不能上移。" : moveBlock(page, scope - 1))}
      {workspace && pageButton(page, scope, "reorder", "下移", () => move(page, scope + 1, "down"), scope === pages.length - 1 ? "已在末位，不能下移。" : moveBlock(page, scope + 1))}
    </div>
    const positionId = `${id}-position-${scope}`, positionBlock = pageBlock(page, "reorder")
    const positions = pages.map((_, index) => ({ value: String(index), label: `第 ${index + 1} 位` }))
    const position = workspace && page.actions?.reorder && <div className="min-w-0 space-y-2">
      <Label id={`${positionId}-label`} htmlFor={positionId}>移到位置</Label>
      <Select value={String(scope)} items={positions} disabled={!!positionBlock} data-capture-position={scope}
        onValueChange={value => { const index = positions.findIndex(option => option.value === value); if (index >= 0) move(page, index, "to-position") }}>
        <SelectTrigger id={positionId} className="w-full min-w-0" aria-labelledby={`${positionId}-label ${titleId}`}
          aria-describedby={describedBy([note(positionBlock, scope, "操作限制"), ...positions.map((_, index) => index !== scope ? note(moveBlock(page, index), scope, "页序限制") : undefined)])}><SelectValue /></SelectTrigger>
        <SelectPopup>{positions.map((option, index) => <SelectItem key={option.value} value={option.value} disabled={!!moveBlock(page, index)}>{option.label}</SelectItem>)}</SelectPopup>
      </Select>
    </div>
    return { page, scope, titleId, pageUnknown, controls, position }
  })
  // Construct controls before rendering notes so every association points at one visible explanation.
  const setControls = <div className="flex flex-wrap gap-2">{setButton("capture", "继续采集")}{setButton("confirm", "确认页集合")}
    {!workspace && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>管理页集合</Button>}
  </div>
  function renderNotes(scope: number) {
    const entries = [...notes].filter(([, entry]) => scope === -1 ? entry.scopes.has(-1) || entry.scopes.size > 1 : entry.scopes.size === 1 && entry.scopes.has(scope))
    return entries.length > 0 && <ul className="min-w-0 space-y-2" aria-label={scope === -1 ? "页集合共用说明" : "页面说明"}>
      {entries.map(([text, entry]) => {
        const all = visible.every(page => entry.scopes.has(pages.indexOf(page)))
        const names = scope === -1 && !entry.scopes.has(-1) && !all ? [...entry.scopes].map(index => pages[index].name || "未命名页面").join("、") : ""
        return <li key={entry.id} id={entry.id} className="break-words text-ui-hint">{names && `${names} · `}{[...entry.labels].join("、")}：{text}。</li>
      })}
    </ul>
  }
  return <Card data-agent-capture-view={view} data-density={density} aria-labelledby={`${id}-title`} className={`min-w-0 ${density === "compact" ? "gap-3 p-3" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1 space-y-2">
      <p className="text-ui-hint">{captureSet.snapshot !== undefined ? ["历史页集合", captureSet.snapshot].filter(Boolean).join(" · ") : "当前页集合"}</p>
      <h2 id={`${id}-title`} className="break-words text-block-title">{captureSet.title}</h2>
    </div>{workspace && onBack && <Button type="button" size="navigation" variant="outline" onClick={onBack}>返回原位置</Button>}</div>
      <div className="flex flex-wrap gap-2">{known(captureSet.version.label) && <Badge variant="outline">{captureSet.version.label}</Badge>}
        {save.state !== "unknown" && <Badge variant={save.state === "error" || save.state === "conflict" ? "warning" : "outline"}>{saveLabels[save.state]}</Badge>}</div>
      {(countKnown(capturedCount) || countKnown(totalPages)) && <p className="text-ui-hint">{[countKnown(capturedCount) && `已采集 ${capturedCount} 页`, countKnown(totalPages) && `总页数 ${totalPages} 页`].filter(Boolean).join(" · ")}</p>}
      {receiptLabel && <p role="status" className="break-words text-ui-hint">{[receiptLabel, "request" in receipt && known(receipt.request.label) && receipt.request.label].filter(Boolean).join(" · ")}</p>}
      {progress !== null && <div className="space-y-2"><p className="text-ui-hint">{operation}进度：{progress}%</p><Progress value={progress} aria-label={`${operation}进度`}><ProgressTrack><ProgressIndicator className="motion-reduce:transition-none" /></ProgressTrack></Progress></div>}
    </header>
    {sharedUnknown.length > 0 && <p className="break-words text-ui-hint" data-capture-unknown="pages">{sharedUnknown.join("、")}：全部页未知。</p>}
    {unknown.length > 0 && <p className="break-words text-ui-hint" data-capture-unknown="set">未知：{unknown.join("、")}。</p>}
    {renderNotes(-1)}{setControls}
    {!pages.length && <p className="text-ui-hint">尚未提供采集页面。</p>}
    <ol aria-label="采集页面顺序" className={density === "compact" ? "min-w-0 space-y-4" : "min-w-0 space-y-6"}>
      {rows.map(({ page, scope, titleId, pageUnknown, controls, position }) => <li key={identitiesValid ? page.id : scope} value={scope + 1} className="min-w-0 space-y-3" {...dropHandlers(scope)}
        aria-labelledby={titleId} aria-describedby={describedBy([...globalNotes, ...[...notes.values()].filter(entry => entry.scopes.has(scope)).map(entry => entry.id)])}>
        <div className="flex flex-wrap items-start justify-between gap-2"><h3 id={titleId} className="min-w-0 flex-1 break-words text-item-title">{page.name || "未命名页面"}</h3>
          {workspace && page.actions?.reorder && <span draggable={!pageBlock(page, "reorder")} data-capture-drag={scope} className="shrink-0 p-2" aria-label="拖动调整页序；也可使用移动按钮"
            onDragStart={event => { if (pageBlock(page, "reorder")) { event.preventDefault(); return }; drag.current = { pageId: page.id, revision, pages }; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", "capture-page") }}
            onDragEnd={() => { drag.current = null }}><GripVertical aria-hidden="true" /></span>}
        </div>
        <div className="flex flex-wrap gap-2">{page.quality.state !== "unknown" && <Badge variant={page.quality.state === "clear" ? "outline" : "warning"}>{qualityLabels[page.quality.state]}</Badge>}
          {page.needsRecapture === true && <Badge variant="warning">需要补采</Badge>}
          {page.usage.state === "used" && <Badge variant="outline">已用于后续处理</Badge>}
          {page.usage.state === "unused" && <Badge variant="outline">尚未用于后续处理</Badge>}
        </div>
        {page.usage.state === "used" && known(page.usage.label) && <p className="break-words text-ui-hint">已用于：{page.usage.label}</p>}
        {!allCapturedAtKnown && known(page.capturedAt) && <p className="break-words text-ui-hint">采集时间：{page.capturedAt}</p>}
        {pageUnknown.length > 0 && <p className="break-words text-ui-hint" data-capture-unknown="page">未知：{pageUnknown.join("、")}。</p>}
        {renderNotes(scope)}
        {workspace && (page.thumbnail != null ? <div className="max-w-full overflow-x-auto">{page.thumbnail}</div> : page.thumbnailUrl
          ? <img src={page.thumbnailUrl} alt="页面缩略图" loading="lazy" className="h-24 max-w-full object-contain" /> : <p className="text-ui-hint">暂无缩略图。</p>)}
        {controls}{position}
        {previewValid && previewPage === page && <section aria-label="页面大图" className="min-w-0 space-y-2">
          {preview.state === "ready" ? renderPreview ? renderPreview(page, { view, density }) : page.previewUrl
            ? <img src={page.previewUrl} alt="页面大图" loading="lazy" className="h-auto max-w-full" /> : <p className="text-ui-hint">暂未提供大图。</p>
            : <p role={preview.state === "error" ? "alert" : "status"} className="break-words text-ui-hint">{preview.state === "error" ? `预览失败：${preview.message || "内容暂不可用。"}` : preview.message || "正在加载大图…"}</p>}
        </section>}
      </li>)}
    </ol>
    {workspace && pages.some(page => page.actions?.reorder) && <div className="p-2 text-ui-hint" data-capture-drop-end="" {...dropHandlers(pages.length)}>拖至此处移到末尾；也可用上移、下移或指定位置。</div>}
    {notice && <p className="break-words text-ui-hint" data-capture-boundary="">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
