"use client"

import { useCallback, useId, useRef, useState, useLayoutEffect, type PointerEvent, type ReactNode, type RefObject } from "react"
import "./paper-preview.css"
import { PaperPreviewContinuous, type PaperPreviewContinuousProps } from "./paper-preview-continuous"
export { PaperPreviewContinuous, locatePaperTarget, type PaperPreviewLocation, type PaperPreviewContinuousProps } from "./paper-preview-continuous"
export { PaperPreviewSurface, type PaperPreviewSurfaceProps } from "./paper-preview-surface"
export { dockPaperToolbar } from "./paper-preview-layout"
import { ZoomIn, ZoomOut, TriangleAlert, FileImage, RotateCcw, RotateCw } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Empty } from "@/components/coss/empty"
import { Skeleton } from "@/components/coss/skeleton"
import { Sheet, SheetPopup, SheetTitle, SheetDescription, SheetTrigger } from "@/components/coss/sheet"
import { Button } from "./button"
import { Badge, type BadgeProps } from "./badge"
import { DocumentRegionViewer, type DocumentRegion } from "./document-region-viewer"

export type PaperPreviewRotation = 0 | 90 | 180 | 270
export type PaperPreviewZoom = "page" | "width" | number
export type PaperPreviewPage = {
  id: string; imageUrl?: string; thumbnailUrl?: string; alt?: string
  paperSize?: "A4" | "A3"; orientation?: "portrait" | "landscape"
  dimensions?: { width: number; height: number }
  quality?: "normal" | "unknown"; anomaly?: string; regions?: DocumentRegion[]
}
export type PaperPreviewVersion = { id: string; label: string; current?: boolean; validated?: boolean; restorable?: boolean }
export type PaperPreviewAction = { id: string; label: string; primary?: boolean; disabled?: boolean }
export type PaperPreviewProps = {
  /** Opt-in continuous canvas; omitted keeps the original single-page DOM. */
  layout?: "single" | "continuous"
  continuous?: Omit<PaperPreviewContinuousProps, "pages" | "zoom" | "rotations" | "selected" | "onZoom" | "onSelect">

  /** Canvas omits document metadata, thumbnails, versions and document actions. */
  variant?: "default" | "canvas"
  title?: string; subtitle?: string; status?: { label: string; variant?: BadgeProps["variant"] }
  pages: readonly PaperPreviewPage[]; page?: number; defaultPage?: number; onPageChange?: (page: number) => void
  zoom?: PaperPreviewZoom; defaultZoom?: PaperPreviewZoom; onZoomChange?: (zoom: PaperPreviewZoom) => void
  rotation?: Record<string, PaperPreviewRotation>; defaultRotation?: Record<string, PaperPreviewRotation>
  onRotationChange?: (pageId: string, degrees: PaperPreviewRotation) => void
  state?: "ready" | "loading" | "empty" | "error"; errorMessage?: string; onRetry?: () => void
  information?: readonly { label: string; value?: ReactNode }[]; informationSlot?: ReactNode
  versions?: readonly PaperPreviewVersion[]; onSetCurrentVersion?: (id: string) => void
  actions?: readonly PaperPreviewAction[]; onAction?: (actionId: string) => void
  selectedRegionId?: string; onRegionSelect?: (pageId: string, regionId: string) => void
  hasPrev?: boolean; hasNext?: boolean; onPrev?: () => void; onNext?: () => void; onClose?: () => void
}

export function clampPaperPage(page: number, count: number) {
  return Math.max(0, Math.min(Math.max(0, count - 1), Number.isFinite(page) ? Math.trunc(page) : 0))
}
export function clampPaperZoom(percent: number) { return Math.max(5, Math.min(300, Number.isFinite(percent) ? percent : 100)) }
export function paperDimensions(size: "A4" | "A3" = "A4", orientation: "portrait" | "landscape" = "portrait") {
  const [w, h] = size === "A3" ? [297, 420] : [210, 297]
  return { width: (orientation === "landscape" ? h : w) * 96 / 25.4, height: (orientation === "landscape" ? w : h) * 96 / 25.4 }
}
export function paperZoomPercent(zoom: PaperPreviewZoom, viewport: { width: number; height: number }, paper: { width: number; height: number }) {
  return typeof zoom === "number" ? clampPaperZoom(zoom) : clampPaperZoom(100 * (zoom === "width" ? viewport.width / paper.width : Math.min(viewport.width / paper.width, viewport.height / paper.height)))
}
export function stepPaperZoom(actualPercent: number, factor: number) { return clampPaperZoom(actualPercent * factor) }
export function rotatedPaperDimensions(paper: { width: number; height: number }, rotation: PaperPreviewRotation) {
  return rotation === 90 || rotation === 270 ? { width: paper.height, height: paper.width } : paper
}
/** Scroll position that keeps a normalized paper point under a viewport-local anchor. */
export function paperZoomAnchor(anchor: { x: number; y: number }, point: { x: number; y: number }, origin: { x: number; y: number }, size: { width: number; height: number }) {
  return { left: Math.max(0, origin.x + point.x * size.width - anchor.x), top: Math.max(0, origin.y + point.y * size.height - anchor.y) }
}
const known = (value?: ReactNode) => value === undefined || value === null || value === "" ? "未提供" : value

function PageImage({ page, label, onRetry, thumbnail = false }: { page: PaperPreviewPage; label: string; onRetry?: () => void; thumbnail?: boolean }) {
  const [failed, setFailed] = useState(false)
  const src = thumbnail ? page.thumbnailUrl ?? page.imageUrl : page.imageUrl
  if (thumbnail && (!src || failed)) return <span role="img" className="flex h-full w-full flex-col items-center justify-center gap-2" aria-label={failed ? "图像加载失败" : "扫描图像未接入"}><FileImage aria-hidden="true" /><span className="text-ui-meta">{page.paperSize ?? "A4"}</span></span>
  if (!src) return <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center"><span className={thumbnail ? "text-ui-meta" : "text-ui-body"}>扫描图像未接入</span><span className="text-ui-meta">{page.paperSize ?? "A4"}</span></div>
  if (failed) return <div className="flex h-full flex-col items-center justify-center gap-2 p-2"><span className="text-ui-hint" role={thumbnail ? undefined : "alert"}>图像加载失败</span>{!thumbnail && <Button variant="outline" disabled={!onRetry} onClick={() => { setFailed(false); onRetry?.() }}>重试</Button>}</div>
  return <img src={src} alt={thumbnail ? "" : page.alt || label} className="h-full w-full object-contain" onError={() => setFailed(true)} />
}

/** Shared passive thumbnail; key resets image failure when the source changes. */
export function PaperThumbnail({ page, label }: { page: PaperPreviewPage; label: string }) {
  return <PageImage key={`${page.id}:${page.thumbnailUrl ?? page.imageUrl ?? "missing"}`} page={page} label={label} thumbnail />
}

export function PaperPreview(props: PaperPreviewProps) {
  const { pages, title, subtitle, status, variant = "default", state = "ready", information = [], informationSlot, versions, actions = [], onRetry, onClose } = props
  const [locateRequest, setLocateRequest] = useState(0)
  const [localPage, setLocalPage] = useState(props.defaultPage ?? 0)
  const [localZoom, setLocalZoom] = useState<PaperPreviewZoom>(props.defaultZoom ?? "page")
  const paperRef = useRef<HTMLDivElement>(null)
  const viewportNode = useRef<HTMLDivElement>(null)
  const wheelHandler = useRef<(event: WheelEvent) => void>(() => {})
  const anchorRequest = useRef<{ pageId: string; rotation: PaperPreviewRotation; zoom: PaperPreviewZoom; anchor: { x: number; y: number }; point: { x: number; y: number } } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number }>())
  const gesture = useRef({ pageId: "", rotation: 0, moved: false, pinch: false, distance: 0, percent: 100, startTime: 0, tapEligible: false })
  const tapCenter = useRef<{ x: number; y: number } | null>(null)
  const pinchPoint = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const [localRotation, setLocalRotation] = useState(props.defaultRotation ?? {})
  const [viewport, setViewport] = useState({ width: 288, height: 448 })
  const id = useId()
  const pageIndex = clampPaperPage(props.page ?? localPage, pages.length), current = pages[pageIndex]
  const zoom = props.zoom ?? localZoom
  const rotation = (props.rotation ?? localRotation)[current?.id] ?? 0
  const sourceDimensions = paperDimensions(current?.paperSize, current?.orientation)
  const dimensions = rotatedPaperDimensions(sourceDimensions, rotation)
  const percent = paperZoomPercent(zoom, viewport, dimensions)
  const ready = state === "ready" && !!current
  // Bind measurement to the actual DOM node, including delayed mounts/replacements.
  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    viewportNode.current = node
    if (!node) return
    const wheel = (event: WheelEvent) => wheelHandler.current(event)
    node.addEventListener?.("wheel", wheel, { passive: false })
    const measure = () => setViewport({ width: Math.max(1, node.clientWidth - 32), height: Math.max(1, node.clientHeight - 32) })
    measure()
    const observer = new ResizeObserver(measure); observer.observe(node)
    return () => {
      observer.disconnect(); node.removeEventListener?.("wheel", wheel); viewportNode.current = null
      pointers.current.clear(); anchorRequest.current = null; tapCenter.current = null; pinchPoint.current = null
    }
  }, [])
  useLayoutEffect(() => {
    const request = anchorRequest.current, node = viewportNode.current, paper = paperRef.current
    if (!request || !node || !paper) return
    if (request.pageId !== current?.id || request.rotation !== rotation) { anchorRequest.current = null; return }
    // Controlled viewers wait for the host to return the requested zoom.
    if (zoom !== request.zoom) return
    const viewRect = node.getBoundingClientRect(), rect = paper.getBoundingClientRect()
    const next = paperZoomAnchor(request.anchor, request.point, { x: rect.left - viewRect.left - node.clientLeft + node.scrollLeft, y: rect.top - viewRect.top - node.clientTop + node.scrollTop }, rect)
    node.scrollLeft = next.left; node.scrollTop = next.top; anchorRequest.current = null
  }, [zoom, percent, current?.id, rotation])
  function selectRegion(regionId: string) {
    props.onRegionSelect?.(current.id, regionId)
    if (regionId === props.selectedRegionId) setLocateRequest(value => value + 1)
  }
  function changePage(next: number) {
    const value = clampPaperPage(next, pages.length)
    if (!ready || value === pageIndex) return
    if (props.page === undefined) setLocalPage(value)
    props.onPageChange?.(value)
  }
  function changeZoom(next: PaperPreviewZoom, client?: { x: number; y: number }, point?: { x: number; y: number }) {
    if (!ready) return
    anchorRequest.current = null
    const node = viewportNode.current, paper = paperRef.current
    if (client && node && paper) {
      const viewRect = node.getBoundingClientRect(), rect = paper.getBoundingClientRect()
      anchorRequest.current = { pageId: current.id, rotation, zoom: next,
        anchor: { x: client.x - viewRect.left - node.clientLeft, y: client.y - viewRect.top - node.clientTop },
        point: point ?? { x: (client.x - rect.left) / rect.width, y: (client.y - rect.top) / rect.height } }
    }
    if (props.zoom === undefined) setLocalZoom(next)
    props.onZoomChange?.(next)
  }
  function stepZoom(factor: number) {
    const actual = paperRef.current ? paperRef.current.getBoundingClientRect().width / dimensions.width * 100 : percent
    changeZoom(stepPaperZoom(actual, factor))
  }
  function rotate(direction: 1 | -1) {
    if (!ready) return
    const next = ((rotation + direction * 90 + 360) % 360) as PaperPreviewRotation
    anchorRequest.current = null
    if (props.rotation === undefined) setLocalRotation(value => ({ ...value, [current.id]: next }))
    props.onRotationChange?.(current.id, next)
  }
  function toggleZoom(client?: { x: number; y: number }) { changeZoom(zoom === 100 ? "page" : 100, client) }
  wheelHandler.current = event => {
    if (!ready || !(event.ctrlKey || event.metaKey)) return
    event.preventDefault()
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.height : 1)
    changeZoom(stepPaperZoom(percent, Math.exp(-Math.max(-25, Math.min(25, delta)) * .01)), { x: event.clientX, y: event.clientY })
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!ready || (event.pointerType === "mouse" && event.button !== 0)) return
    const active = pointers.current
    if (!active.size) {
      suppressClick.current = false
      tapCenter.current = null; pinchPoint.current = null
      gesture.current = { pageId: current.id, rotation, moved: false, pinch: false, distance: 0, percent, startTime: event.timeStamp, tapEligible: event.pointerType === "touch" }
    }
    active.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY })
    // Capture on the original target so a stationary region tap keeps its normal click target.
    ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
    if (active.size === 2) {
      const [a, b] = [...active.values()]
      gesture.current.pinch = true; gesture.current.distance = Math.hypot(a.x - b.x, a.y - b.y); gesture.current.percent = percent
      gesture.current.tapEligible &&= event.pointerType === "touch"
      const rect = paperRef.current?.getBoundingClientRect()
      if (rect) pinchPoint.current = { x: ((a.x + b.x) / 2 - rect.left) / rect.width, y: ((a.y + b.y) / 2 - rect.top) / rect.height }
    } else if (active.size > 2) gesture.current.tapEligible = false
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const active = pointers.current, previous = active.get(event.pointerId), node = viewportNode.current, session = gesture.current
    if (!previous || !node) return
    if (session.pageId !== current?.id || session.rotation !== rotation) { active.clear(); return }
    const x = event.clientX, y = event.clientY
    const crossed = Math.hypot(x - previous.startX, y - previous.startY) > 5
    const wasMoved = session.moved
    session.moved ||= crossed
    if (session.moved) suppressClick.current = true
    active.set(event.pointerId, { ...previous, x, y })
    if (active.size === 2) {
      event.preventDefault()
      const [a, b] = [...active.values()], distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (session.moved && session.distance > 0) {
        suppressClick.current = true
        changeZoom(stepPaperZoom(session.percent, distance / session.distance), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, pinchPoint.current ?? undefined)
      }
    } else if ((event.pointerType === "mouse" || event.pointerType === "pen") && !session.pinch && session.moved && (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight)) {
      event.preventDefault(); suppressClick.current = true
      node.scrollLeft -= x - (wasMoved ? previous.x : previous.startX)
      node.scrollTop -= y - (wasMoved ? previous.y : previous.startY)
    }
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const active = pointers.current, session = gesture.current
    if (!active.has(event.pointerId)) return
    if (cancelled) { session.tapEligible = false; suppressClick.current = true }
    if (active.size === 2 && session.pinch) {
      const [a, b] = [...active.values()]
      tapCenter.current = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      suppressClick.current = true
    }
    active.delete(event.pointerId)
    if (!active.size) {
      if (!cancelled && session.tapEligible && session.pinch && !session.moved && event.timeStamp - session.startTime < 300 && session.pageId === current?.id && session.rotation === rotation && tapCenter.current) toggleZoom(tapCenter.current)
      session.tapEligible = false; session.pinch = false; session.distance = 0
      tapCenter.current = null; pinchPoint.current = null
    }
    if ((event.target as HTMLElement).hasPointerCapture?.(event.pointerId)) (event.target as HTMLElement).releasePointerCapture(event.pointerId)
  }
  if (props.layout === "continuous") return <PaperPreviewContinuous {...props.continuous} viewportRef={props.continuous?.viewportRef ?? viewportNode} pages={pages} zoom={zoom} rotations={props.rotation ?? localRotation} selected={props.selectedRegionId} onZoom={changeZoom} onSelect={props.onRegionSelect ? (regionId, pageId) => props.onRegionSelect?.(pageId, regionId) : undefined} />
  return <section className="paper-preview min-w-0" aria-labelledby={variant === "canvas" ? undefined : `${id}-title`} aria-label={variant === "canvas" ? title || "试卷预览" : undefined} data-paper-preview data-state={state}>
    {variant !== "canvas" && <header className="flex flex-wrap items-start justify-between gap-3 pb-4">
      <div className="min-w-0 flex-1"><h2 id={`${id}-title`} className="text-block-title break-words">{known(title)}</h2><p className="text-ui-hint break-words">{known(subtitle)}</p></div>
      {status ? <Badge variant={status.variant} className="h-auto whitespace-normal">{known(status.label)}</Badge> : <Badge>未提供</Badge>}
      {onClose && <Button variant="ghost" onClick={onClose}>关闭预览</Button>}
    </header>}
    <div className={variant === "canvas" ? "min-w-0" : "paper-preview-layout"}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 pb-3" role="group" aria-label="页面与缩放">
          <Button variant="outline" disabled={!ready || pageIndex === 0} onClick={() => changePage(pageIndex - 1)}>上一页</Button>
          <span role="status" className="text-ui-body">第 {ready ? pageIndex + 1 : 0} / {pages.length} 页</span>
          <Button variant="outline" disabled={!ready || pageIndex >= pages.length - 1} onClick={() => changePage(pageIndex + 1)}>下一页</Button>
          <Button variant="outline" size="icon" aria-label="缩小" disabled={!ready || percent <= 5} onClick={() => stepZoom(.8)}><ZoomOut /></Button>
          <output className="text-ui-body" aria-label="当前缩放">{Math.round(percent)}%</output>
          <Button variant="outline" size="icon" aria-label="放大" disabled={!ready || percent >= 300} onClick={() => stepZoom(1.25)}><ZoomIn /></Button>
          <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="向左旋转" disabled={!ready} onClick={() => rotate(-1)}><RotateCcw /></Button>
          <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="向右旋转" disabled={!ready} onClick={() => rotate(1)}><RotateCw /></Button>
          <Button variant="outline" disabled={!ready} aria-pressed={zoom === "page"} onClick={() => changeZoom("page")}>适合页面</Button>
          <Button variant="outline" disabled={!ready} aria-pressed={zoom === "width"} onClick={() => changeZoom("width")}>适合宽度</Button>
        </div>
        {ready && current.anomaly && <p className="pb-2 text-ui-hint" role="status"><Badge variant="warning" className="h-auto whitespace-normal">异常页 · {current.anomaly}</Badge></p>}
        <Card>
          {state === "loading" ? <div role="status" aria-busy="true" className="grid gap-3 p-4"><span className="text-ui-hint">正在加载试卷…</span><Skeleton className="h-80 w-full motion-reduce:animate-none" /></div>
            : state === "error" ? <Empty><p role="alert" className="text-ui-hint">{props.errorMessage || "加载失败"}</p><Button disabled={!onRetry} onClick={onRetry}>重试</Button></Empty>
            : !ready ? <Empty><p className="text-ui-body">无页面</p></Empty>
            : <div ref={viewportRef} tabIndex={0} aria-label="试卷页面，左右方向键翻页，+ 或 = 放大，- 缩小，0 适合页面，R 向右旋转，Shift+R 向左旋转" className="paper-preview-viewport"
              onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => pointerEnd(event)} onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={event => pointerEnd(event, true)}
              onDragStart={event => event.preventDefault()}
              onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation() } }}
              onDoubleClick={event => { if (!suppressClick.current) { event.preventDefault(); toggleZoom({ x: event.clientX, y: event.clientY }) } }}
              onKeyDown={event => {
                if (event.defaultPrevented || event.nativeEvent?.isComposing || event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) return
                if (!event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); changePage(pageIndex + (event.key === "ArrowLeft" ? -1 : 1)) }
                else if (event.key === "+" || event.key === "=") { event.preventDefault(); stepZoom(1.25) }
                else if (event.key === "-") { event.preventDefault(); stepZoom(.8) }
                else if (event.key === "0") { event.preventDefault(); changeZoom("page") }
                else if (event.key.toLowerCase() === "r") { event.preventDefault(); rotate(event.shiftKey ? -1 : 1) }
              }}>
              <div ref={paperRef} className="relative mx-auto" style={{ width: dimensions.width * percent / 100, height: dimensions.height * percent / 100 }} data-paper-size={current.paperSize ?? "A4"}>
                <DocumentRegionViewer key={current.id} label={`第 ${pageIndex + 1} 页`} pageLayout={{ width: sourceDimensions.width * percent / 100, height: sourceDimensions.height * percent / 100 }} pageRotation={rotation} locateOnResize={false} regions={current.regions ?? []} selectedId={props.selectedRegionId} locateRequest={locateRequest} onSelect={props.onRegionSelect ? regionId => props.onRegionSelect?.(current.id, regionId) : undefined} background={<PageImage key={`${current.id}:${current.imageUrl}`} page={current} label={`第 ${pageIndex + 1} 页扫描图像`} onRetry={onRetry} />} />
                {current.anomaly && <div className="pointer-events-none absolute inset-x-2 top-2" data-paper-anomaly><Badge variant="warning" className="h-auto sm:h-auto max-w-full whitespace-normal"><TriangleAlert aria-hidden="true" />异常页 · {current.anomaly}</Badge></div>}
              </div>
            </div>}
        </Card>
        {ready && !!current.regions?.length && <div className="flex flex-wrap gap-2 pt-3" role="group" aria-label="答题区域">{current.regions.map(region => <Button key={region.id} variant="outline" aria-pressed={props.selectedRegionId === region.id} disabled={!props.onRegionSelect} onClick={() => selectRegion(region.id)}>{region.label}</Button>)}</div>}
      </div>
      {variant !== "canvas" && <aside className="grid min-w-0 content-start gap-5" aria-label="试卷信息">
        <dl className="grid gap-3">{information.map((item, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 text-ui-body"><dt className="break-words">{item.label}</dt><dd className="min-w-0 break-words">{known(item.value)}</dd></div>)}</dl>
        {informationSlot}
        <section aria-label="扫描页面"><h3 className="pb-2 text-item-title">扫描页面</h3><div className="grid max-h-80 grid-cols-2 gap-2 overflow-auto p-1">{pages.map((page, index) => <Button key={page.id} className="h-auto sm:h-auto min-w-0 flex-col items-stretch whitespace-normal p-2" variant={pageIndex === index ? "secondary" : "outline"} disabled={!ready} aria-pressed={pageIndex === index} aria-label={`第 ${index + 1} 页 · ${page.anomaly ? `异常页 · ${page.anomaly}` : page.quality === "normal" ? "正常" : "未提供"}`} onClick={() => changePage(index)}>
          <span className="block w-full" style={{ aspectRatio: `${paperDimensions(page.paperSize, page.orientation).width} / ${paperDimensions(page.paperSize, page.orientation).height}` }}><PaperThumbnail page={page} label="" /></span><span className="text-ui-body">第 {index + 1} 页{pageIndex === index ? " · 当前页" : ""}</span><span className="text-ui-hint">{page.anomaly ? <span className="flex items-start justify-center gap-1"><TriangleAlert aria-hidden="true" /><span className="min-w-0 break-words">异常页 · {page.anomaly}</span></span> : page.quality === "normal" ? "正常" : "未提供"}</span>
        </Button>)}</div></section>
        <section aria-label="扫描版本"><h3 className="pb-2 text-item-title">扫描版本</h3>{versions === undefined ? <p className="text-ui-hint">未提供</p> : versions.length === 0 ? <p className="text-ui-hint">暂无扫描版本</p> : <ul className="grid gap-2">{versions.map(version => <li key={version.id}><Card className="gap-2 p-3"><p className="text-ui-body break-words">{version.label} · {version.current ? "当前扫描件" : "历史扫描件"}</p>{!version.current && <><p className="text-ui-hint">{version.validated === true ? "已通过校验" : version.validated === false ? "未通过校验" : "校验状态未提供"} · {version.restorable === true ? "可恢复" : version.restorable === false ? "不可恢复" : "恢复状态未提供"}</p><Button className="h-auto whitespace-normal" variant="outline" disabled={!version.restorable || !version.validated || !props.onSetCurrentVersion} onClick={() => { if (version.restorable && version.validated) props.onSetCurrentVersion?.(version.id) }}>设为当前扫描件</Button></>}</Card></li>)}</ul>}</section>
        <div className="grid gap-2">{actions.map(action => <Button key={action.id} className="h-auto whitespace-normal" variant={action.primary ? "default" : "outline"} disabled={action.disabled || !props.onAction} onClick={() => { if (!action.disabled) props.onAction?.(action.id) }}>{action.label}</Button>)}</div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!props.hasPrev || !props.onPrev} onClick={() => { if (props.hasPrev) props.onPrev?.() }}>上一份</Button><Button variant="outline" disabled={!props.hasNext || !props.onNext} onClick={() => { if (props.hasNext) props.onNext?.() }}>下一份</Button></div>
      </aside>}
    </div>
  </section>
}

/** Sheet retains Base UI Escape/focus trapping and trigger focus return. */
export function PaperPreviewDialog({ open, onOpenChange, triggerLabel = "打开试卷预览", returnFocus, ...props }: PaperPreviewProps & {
  open?: boolean; onOpenChange?: (open: boolean) => void; triggerLabel?: string; returnFocus?: RefObject<HTMLElement | null>
}) {
  return <Sheet open={open} onOpenChange={value => { onOpenChange?.(value); if (!value) props.onClose?.() }}>
    <SheetTrigger render={<Button variant="outline" />}>{triggerLabel}</SheetTrigger>
    <SheetPopup className="h-dvh w-screen max-w-none overflow-auto motion-reduce:transition-none" closeProps={{ "aria-label": "关闭预览" }} finalFocus={returnFocus}>
      <div className="sr-only"><SheetTitle>{props.title || "试卷预览"}</SheetTitle><SheetDescription>{props.subtitle || "查看扫描页面、异常和扫描版本"}</SheetDescription></div>
      <div className="p-4 pt-12"><PaperPreview {...props} onClose={undefined} /></div>
    </SheetPopup>
  </Sheet>
}
