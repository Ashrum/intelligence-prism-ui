"use client"

import { useId, useRef, useState, type PointerEvent } from "react"
import { Card } from "@/components/coss/card"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Checkbox } from "@/components/coss/checkbox"
import { Button } from "./button"
import { DocumentRegionViewer } from "./document-region-viewer"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

/** Percentages of the original image: left, top, width, height. */
export type AgentImageRect = [number, number, number, number]
export type AgentImageRegion = { id: string; label: string; rect: AgentImageRect; source: "teacher" | "system" | "example" }
export type AgentCanvasImage = {
  id: string; name: string; src?: string; alt?: string | null
  width?: number; height?: number
  source: { label: string; openable?: boolean } | null
  version: { id: string; label: string | null }
  availability: { state: "available" } | { state: "unavailable"; reason: string } | { state: "unknown"; reason?: string }
  regions?: readonly AgentImageRegion[]
}
export type AgentImageCapability = { supported: true } | { supported: false; reason: string }
export type AgentImageCapabilities = Record<"view" | "zoom" | "annotate" | "crop" | "compose", AgentImageCapability>
type ImageContext = { imageSetId: string; version: string }
type ImageTarget = { imageId: string; imageVersion: string }
export type AgentImageCanvasIntent = ImageContext & (
  | ({ type: "select-image" | "open-source" } & ImageTarget)
  | ({ type: "zoom"; percent: number } & ImageTarget)
  | ({ type: "annotate-create"; region: { label: string; rect: AgentImageRect; source: "teacher" } } & ImageTarget)
  | ({ type: "annotate-update"; regionId: string; label: string; rect: AgentImageRect } & ImageTarget)
  | ({ type: "annotate-delete"; regionId: string } & ImageTarget)
  | ({ type: "crop-request"; rect: AgentImageRect } & ImageTarget)
  | { type: "compare"; images: readonly ImageTarget[] }
)
export type AgentImageCanvasProps = AgentRecordViewProps & {
  title: string
  imageSet: { id: string; version: string }
  /** Complete, authorized image collection. Selection and comparison are host-owned. */
  images: readonly AgentCanvasImage[]
  selectedImageId: string | null
  comparisonIds?: readonly string[]
  capabilities: AgentImageCapabilities
  onIntent?: (intent: AgentImageCanvasIntent) => void
  onBack?: () => void
  notice?: string
}

const hasText = (value: string | null | undefined): value is string => !!value?.trim()
export function isAgentImageRect(rect: readonly number[]): rect is AgentImageRect {
  return rect.length === 4 && rect.every(Number.isFinite) && rect[0] >= 0 && rect[1] >= 0 && rect[2] > 0 && rect[3] > 0 && rect[0] + rect[2] <= 100 && rect[1] + rect[3] <= 100
}
export function agentImageRectFromPoints(start: readonly [number, number], end: readonly [number, number]): AgentImageRect | null {
  if (![...start, ...end].every(Number.isFinite)) return null
  const clamp = (value: number) => Math.max(0, Math.min(100, value))
  const [x1, y1, x2, y2] = [...start, ...end].map(clamp)
  const rect: AgentImageRect = [Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)]
  return isAgentImageRect(rect) ? rect : null
}
export function agentImagePanDelta(key: string): [number, number] | null {
  return ({ ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] } as Record<string, [number, number]>)[key] ?? null
}
const capabilityLabels = { view: "查看", zoom: "缩放", annotate: "区域标注", crop: "裁切", compose: "并列比较" }
const sourceLabels = { teacher: "教师", system: "系统", example: "示例" }
type SelectionDraft = { basis: string; mode: "annotate" | "crop"; regionId?: string; label: string; values: string[] }

/** Semantic 30. Reuse DocumentRegionViewer for the main canvas; no pixel editing. */
export function AgentImageCanvas({ title, imageSet, images, selectedImageId, comparisonIds = [], capabilities,
  view = "inline", density = "default", onIntent, onExpand, onBack, details,
  notice = "标注与裁切仅提交请求，不修改原图。" }: AgentImageCanvasProps) {
  const id = useId(), full = view === "workspace", compact = density === "compact"
  const surface = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ basis: string; pointerId: number; start: [number, number]; last: [number, number]; mode: "pan" | "draw" } | null>(null)
  const [zoomState, setZoom] = useState({ basis: "", percent: 100 })
  const [regionState, setRegion] = useState({ basis: "", index: -1 })
  const [draft, setDraft] = useState<SelectionDraft | null>(null)
  const [checkedState, setChecked] = useState<{ basis: string; ids: string[] }>({ basis: "", ids: [] })
  const [failed, setFailed] = useState<string[]>([])
  const image = images.find(item => item.id === selectedImageId)
  const context = { imageSetId: imageSet.id, version: imageSet.version }
  const valid = hasText(imageSet.id) && hasText(imageSet.version) && images.every(item => hasText(item.id) && hasText(item.version.id)) && new Set(images.map(item => item.id)).size === images.length
  const basis = JSON.stringify([imageSet, image, capabilities])
  const collectionBasis = JSON.stringify([imageSet, images, capabilities])
  const zoom = zoomState.basis === basis && capabilities.zoom.supported ? zoomState.percent : 100
  const selectedRegion = regionState.basis === basis ? regionState.index : -1
  const checked = checkedState.basis === collectionBasis ? checkedState.ids : []
  const errorKey = (item: AgentCanvasImage) => JSON.stringify([imageSet, item.id, item.version.id, item.src])
  const unavailable = (item: AgentCanvasImage) => item.availability.state !== "available"
    ? item.availability.reason || (item.availability.state === "unknown" ? "可用性未知。" : "图片不可用。")
    : !hasText(item.src) ? "未提供图片。" : failed.includes(errorKey(item)) ? "图片加载失败。" : undefined
  const canView = (item: AgentCanvasImage) => capabilities.view.supported && !unavailable(item)
  const ready = !!image && canView(image)
  const canRequest = valid && !!onIntent
  const regions = image?.regions ?? []
  const validRegions = new Set(regions.map(region => region.id)).size === regions.length && regions.every(region => hasText(region.id) && hasText(region.label) && isAgentImageRect(region.rect))
  const canEdit = ready && canRequest && validRegions
  const staleDraft = !!draft && draft.basis !== basis
  const rect = draft?.values.map(value => value.trim() === "" ? NaN : Number(value))
  const validRect = !!rect && isAgentImageRect(rect)
  const target = (item: AgentCanvasImage): ImageTarget => ({ imageId: item.id, imageVersion: item.version.id })
  const emit = (intent: AgentImageCanvasIntent) => { if (canRequest) onIntent?.(intent) }
  const viewport = () => surface.current?.querySelector<HTMLDivElement>(".review-sheet-viewport")
  const startDraft = (mode: SelectionDraft["mode"], region?: AgentImageRegion) => {
    if (!canEdit || !capabilities[mode].supported || draft) return
    if (region) setRegion({ basis, index: regions.indexOf(region) })
    setDraft({ basis, mode, regionId: region?.id, label: region?.label ?? "", values: (region?.rect ?? [10, 10, 40, 30]).map(String) })
  }
  const submit = () => {
    if (!image || !draft || staleDraft || !canEdit || !capabilities[draft.mode].supported || !validRect) return
    if (draft.mode === "crop") emit({ ...context, ...target(image), type: "crop-request", rect: [...rect] as AgentImageRect })
    else if (hasText(draft.label)) {
      if (draft.regionId) emit({ ...context, ...target(image), type: "annotate-update", regionId: draft.regionId, label: draft.label, rect: [...rect] as AgentImageRect })
      else emit({ ...context, ...target(image), type: "annotate-create", region: { label: draft.label, rect: [...rect] as AgentImageRect, source: "teacher" } })
    } else return
    viewport()?.focus()
    setDraft(null)
  }
  const changeZoom = (percent: number) => {
    if (!ready || !capabilities.zoom.supported || draft) return
    setZoom({ basis, percent }); gesture.current = null
    if (percent === 100) viewport()?.scrollTo({ left: 0, top: 0 })
    if (image) emit({ ...context, ...target(image), type: "zoom", percent })
  }
  const point = (event: PointerEvent<HTMLDivElement>): [number, number] | null => {
    const box = surface.current?.querySelector(".review-sheet")?.getBoundingClientRect()
    return box && box.width > 0 && box.height > 0 ? [(event.clientX - box.left) / box.width * 100, (event.clientY - box.top) / box.height * 100] : null
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current
    if (!active || active.basis !== basis || active.pointerId !== event.pointerId || !ready) return
    if (active.mode === "pan") {
      viewport()?.scrollBy({ left: active.last[0] - event.clientX, top: active.last[1] - event.clientY })
      active.last = [event.clientX, event.clientY]
    } else if (draft && !staleDraft && canEdit && capabilities[draft.mode].supported) {
      const end = point(event), next = end && agentImageRectFromPoints(active.start, end)
      if (next) setDraft({ ...draft, values: next.map(String) })
    }
  }
  const renderImage = (item: AgentCanvasImage, thumbnail: boolean) => <img key={errorKey(item)} src={item.src} alt={hasText(item.alt) ? item.alt : "缺少图片说明"}
    width={item.width && item.width > 0 ? item.width : undefined} height={item.height && item.height > 0 ? item.height : undefined}
    draggable={false} className={thumbnail ? "block max-h-48 max-w-full object-contain" : "block h-auto w-full max-w-none"}
    onError={() => setFailed(values => [...new Set([...values, errorKey(item)])])} />
  const capabilityFacts = new Map<string, string[]>()
  for (const key of Object.keys(capabilityLabels) as (keyof AgentImageCapabilities)[]) {
    const capability = capabilities[key]
    if (!capability.supported) {
      const reason = capability.reason.trim() || "暂不支持。"
      capabilityFacts.set(reason, [...(capabilityFacts.get(reason) ?? []), capabilityLabels[key]])
    }
  }
  const compared = [...new Set(comparisonIds)].map(key => images.find(item => item.id === key)).filter((item): item is AgentCanvasImage => !!item)
  const imageProblems = new Map<string, number[]>()
  images.forEach((item, index) => {
    const reason = unavailable(item)
    if (reason) imageProblems.set(reason, [...(imageProblems.get(reason) ?? []), index])
  })
  const problems = [...imageProblems]
  const problemId = (item: AgentCanvasImage) => {
    const index = problems.findIndex(([reason]) => reason === unavailable(item))
    return index < 0 ? undefined : `${id}-image-problem-${index}`
  }
  return <Card aria-labelledby={`${id}-title`} data-agent-image-view={view} data-density={density} className={compact ? "min-w-0 gap-3 p-4" : "min-w-0 gap-5 p-5"}>
    <h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3>
    {!valid && <p className="text-ui-hint">图片或版本尚未确认。</p>}
    {!onIntent && <p className="text-ui-hint">当前仅供查看。</p>}
    <div id={`${id}-capabilities`} className="space-y-2">{[...capabilityFacts].map(([reason, labels]) => <p key={reason} className="break-words text-ui-hint">{labels.join("、")}：{reason}</p>)}</div>
    {problems.map(([reason, indices], index) => indices.length > 1 && <p key={index} id={`${id}-image-problem-${index}`} className="break-words text-ui-hint">{indices.length === images.length ? "全部图片" : `图片 ${indices.map(position => position + 1).join("、")}`}：{reason}</p>)}
    <ol aria-label="图片列表" className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-4"}>
      {images.map((item, index) => <li key={index} aria-describedby={problemId(item)} className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="navigation" aria-pressed={item.id === selectedImageId} disabled={!canRequest || !!draft} onClick={() => { if (!draft) emit({ ...context, ...target(item), type: "select-image" }) }}>{item.name || "未命名图片"}</Button>
          {full && capabilities.compose.supported && <Label htmlFor={`${id}-compare-${index}`} className="flex items-center gap-2">
            <Checkbox id={`${id}-compare-${index}`} checked={checked.includes(item.id)} disabled={!canRequest || !canView(item)} aria-label={`对比${item.name || "未命名图片"}`}
              onCheckedChange={value => { if (canRequest && canView(item)) setChecked({ basis: collectionBasis, ids: value ? [...new Set([...checked, item.id])] : checked.filter(key => key !== item.id) }) }} />加入比较
          </Label>}
        </div>
        {unavailable(item) && imageProblems.get(unavailable(item)!)?.length === 1 && <p id={problemId(item)} className="break-words text-ui-hint">{unavailable(item)}</p>}
      </li>)}
    </ol>
    {!images.length && <p className="text-ui-hint">暂无图片。</p>}
    {images.length > 0 && !image && <p className="text-ui-hint">{selectedImageId === null ? "请选择图片。" : "当前图片未列出。"}</p>}
    {image && <>
      <p className="break-words text-ui-hint">来源：{hasText(image.source?.label) ? image.source.label : "未知"} · 版本：{hasText(image.version.label) ? image.version.label : "未知"}{image.width && image.height ? ` · ${image.width} × ${image.height}` : " · 尺寸未知"}</p>
      {!hasText(image.alt) && <p className="text-ui-hint">缺少图片说明</p>}
      <p className="text-ui-hint">{regions.length} 个区域标注</p>
      {!validRegions && <p className="text-ui-hint">区域标注信息不完整，请核对。</p>}
      {ready && (!full ? renderImage(image, true) : <>
        <div className="flex flex-wrap gap-2" aria-describedby={`${id}-capabilities`}>
          <Button type="button" variant="outline" size="navigation" disabled={!capabilities.zoom.supported || zoom <= 50 || !!draft} onClick={() => changeZoom(Math.max(50, zoom - 25))}>缩小</Button>
          <span className="text-ui-body" aria-live="polite">{zoom}%</span>
          <Button type="button" variant="outline" size="navigation" disabled={!capabilities.zoom.supported || zoom >= 300 || !!draft} onClick={() => changeZoom(Math.min(300, zoom + 25))}>放大</Button>
          <Button type="button" variant="outline" size="navigation" disabled={!capabilities.zoom.supported || !!draft} onClick={() => changeZoom(100)}>适应宽度</Button>
          <Button type="button" variant="outline" size="navigation" disabled={!canEdit || !capabilities.annotate.supported || !!draft} onClick={() => startDraft("annotate")}>绘制标注</Button>
          <Button type="button" variant="outline" size="navigation" disabled={!canEdit || !capabilities.crop.supported || !!draft} onClick={() => startDraft("crop")}>选择裁切范围</Button>
        </div>
        <p id={`${id}-pan-help`} className="text-ui-hint">拖动图片或聚焦画布后按方向键平移；选择范围时也可输入百分比。</p>
        <div ref={surface} className="min-w-0 [&_.review-sheet]:min-w-0 [&_.review-sheet]:aspect-auto [&_.review-region-hit>span]:max-w-full [&_.review-region-hit>span]:break-words" style={{ touchAction: "none" }}
          onKeyDown={event => {
            if (!(event.target as HTMLElement).classList.contains("review-sheet-viewport")) return
            const delta = agentImagePanDelta(event.key)
            if (delta) { event.preventDefault(); viewport()?.scrollBy({ left: delta[0], top: delta[1] }) }
          }}
          onPointerDown={event => {
            if (event.button !== 0 || !event.isPrimary || !ready || (event.target as HTMLElement).closest("button") || (draft && (staleDraft || !canEdit))) return
            const start = point(event)
            if (!start || start.some(value => value < 0 || value > 100)) return
            gesture.current = { basis, pointerId: event.pointerId, start, last: [event.clientX, event.clientY], mode: draft ? "draw" : "pan" }
            event.currentTarget.setPointerCapture(event.pointerId)
          }} onPointerMove={move} onPointerUp={event => { move(event); gesture.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
          onPointerCancel={() => { gesture.current = null }} onLostPointerCapture={() => { gesture.current = null }}>
          <DocumentRegionViewer label="图片画布，方向键平移" zoom={zoom} regions={validRegions ? regions.map((region, index) => ({ id: String(index), label: region.label, rect: region.rect })) : []}
            selectedId={String(selectedRegion)} onSelect={key => { if (!draft) setRegion({ basis, index: Number(key) }) }}
            background={<>{renderImage(image, false)}{draft && !staleDraft && validRect && <div aria-hidden="true" className="review-sheet-region pointer-events-none" style={{ left: `${rect[0]}%`, top: `${rect[1]}%`, width: `${rect[2]}%`, height: `${rect[3]}%` }}><div className="review-region-hit" data-selected="true" /></div>}</>} />
        </div>
        <ol aria-label="区域列表" className="space-y-3">{regions.map((region, index) => <li key={index} className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="navigation" disabled={!validRegions || !!draft} aria-pressed={selectedRegion === index} onClick={() => { if (validRegions && !draft) setRegion({ basis, index }) }}>定位{region.label || "未命名区域"}</Button>
            <span className="text-ui-hint">来源：{sourceLabels[region.source]}</span>
            <Button type="button" variant="outline" size="navigation" aria-label={`编辑${region.label}`} disabled={!canEdit || !capabilities.annotate.supported || !!draft} onClick={() => startDraft("annotate", region)}>编辑</Button>
            <Button type="button" variant="outline" size="navigation" aria-label={`删除${region.label}`} disabled={!canEdit || !capabilities.annotate.supported || !!draft} onClick={() => { if (canEdit && capabilities.annotate.supported && !draft) emit({ ...context, ...target(image), type: "annotate-delete", regionId: region.id }) }}>删除</Button>
          </div>
        </li>)}</ol>
      </>)}
      {image.source?.openable && <Button type="button" variant="outline" size="navigation" disabled={!canRequest} onClick={() => emit({ ...context, ...target(image), type: "open-source" })}>查看来源</Button>}
    </>}
    {draft && <section aria-label="范围选择" className="min-w-0 space-y-3">
      <h4 className="text-ui-action">{draft.mode === "crop" ? "裁切范围" : "区域标注"}</h4>
      {staleDraft && <p role="status" className="text-ui-hint">图片或标注已变化，请取消选区后重新选择。</p>}
      {draft.mode === "annotate" && <div className="space-y-2"><Label htmlFor={`${id}-label`}>区域名称</Label><Input nativeInput id={`${id}-label`} value={draft.label} disabled={staleDraft} onChange={event => setDraft({ ...draft, label: event.target.value })} /></div>}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3">{["左侧（%）", "顶部（%）", "宽度（%）", "高度（%）"].map((label, index) => <div key={label} className="min-w-0 space-y-2">
        <Label htmlFor={`${id}-rect-${index}`}>{label}</Label><Input nativeInput id={`${id}-rect-${index}`} type="number" step="0.1" min={index < 2 ? 0 : 0.1} max={100} value={draft.values[index]} disabled={staleDraft}
          aria-invalid={!validRect} onChange={event => setDraft({ ...draft, values: draft.values.map((value, position) => position === index ? event.target.value : value) })} />
      </div>)}</div>
      {!validRect && <p role="status" className="text-ui-hint">请输入图片范围内的百分比，宽度和高度须大于零。</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="navigation" disabled={staleDraft || !canEdit || !validRect || !capabilities[draft.mode].supported || (draft.mode === "annotate" && !hasText(draft.label))} onClick={submit}>{draft.mode === "crop" ? "请求裁切" : draft.regionId ? "请求更新标注" : "请求添加标注"}</Button>
        <Button type="button" variant="outline" size="navigation" onClick={() => { viewport()?.focus(); setDraft(null); gesture.current = null }}>取消选区</Button>
      </div>
    </section>}
    {full && capabilities.compose.supported && <Button type="button" variant="outline" size="navigation" disabled={!canRequest || checked.length < 2} onClick={() => {
      const items = checked.map(key => images.find(item => item.id === key))
      if (items.length >= 2 && items.every((item): item is AgentCanvasImage => !!item && canView(item))) emit({ ...context, type: "compare", images: items.map(target) })
    }}>并列比较（{checked.length}）</Button>}
    {full && capabilities.compose.supported && capabilities.view.supported && compared.length >= 2 && <section aria-label="图片并列比较" className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">
      {compared.map((item, index) => <figure key={index} aria-describedby={problemId(item)} className="min-w-0 space-y-2"><figcaption className="break-words text-ui-body">{item.name || "未命名图片"}</figcaption>{canView(item) ? renderImage(item, true) : <p className="text-ui-hint">不可查看</p>}</figure>)}
    </section>}
    <p className="break-words text-ui-hint text-muted-foreground" data-image-notice="">{notice}</p>
    <RecordDetails>{details}</RecordDetails>
    <div className="flex flex-wrap gap-2">
      {!full && onExpand && <Button type="button" variant="outline" size="navigation" onClick={event => onExpand(event.currentTarget)}>查看大图</Button>}
      {full && onBack && <Button type="button" variant="outline" size="navigation" disabled={!!draft} onClick={() => { if (!draft) onBack() }}>返回原位置</Button>}
    </div>
    {draft && <p className="text-ui-hint">范围尚未提交；请提交请求或取消选区后再切换图片或返回。</p>}
  </Card>
}
