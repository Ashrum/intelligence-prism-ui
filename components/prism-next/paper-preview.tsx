"use client"

import { useCallback, useId, useRef, useState, type ReactNode, type RefObject } from "react"
import "./paper-preview.css"
import { ZoomIn, ZoomOut, TriangleAlert, FileImage } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Empty } from "@/components/coss/empty"
import { Skeleton } from "@/components/coss/skeleton"
import { Sheet, SheetPopup, SheetTitle, SheetDescription, SheetTrigger } from "@/components/coss/sheet"
import { Button } from "./button"
import { Badge, type BadgeProps } from "./badge"
import { DocumentRegionViewer, type DocumentRegion } from "./document-region-viewer"

export type PaperPreviewZoom = "page" | "width" | number
export type PaperPreviewPage = {
  id: string; imageUrl?: string; thumbnailUrl?: string; alt?: string
  paperSize?: "A4" | "A3"; orientation?: "portrait" | "landscape"
  quality?: "normal" | "unknown"; anomaly?: string; regions?: DocumentRegion[]
}
export type PaperPreviewVersion = { id: string; label: string; current?: boolean; validated?: boolean; restorable?: boolean }
export type PaperPreviewAction = { id: string; label: string; primary?: boolean; disabled?: boolean }
export type PaperPreviewProps = {
  /** Canvas omits document metadata, thumbnails, versions and document actions. */
  variant?: "default" | "canvas"
  title?: string; subtitle?: string; status?: { label: string; variant?: BadgeProps["variant"] }
  pages: readonly PaperPreviewPage[]; page?: number; defaultPage?: number; onPageChange?: (page: number) => void
  zoom?: PaperPreviewZoom; defaultZoom?: PaperPreviewZoom; onZoomChange?: (zoom: PaperPreviewZoom) => void
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
  const [viewport, setViewport] = useState({ width: 288, height: 448 })
  const id = useId()
  const pageIndex = clampPaperPage(props.page ?? localPage, pages.length), current = pages[pageIndex]
  const zoom = props.zoom ?? localZoom
  const dimensions = paperDimensions(current?.paperSize, current?.orientation)
  const percent = paperZoomPercent(zoom, viewport, dimensions)
  const ready = state === "ready" && !!current
  // Bind measurement to the actual DOM node, including delayed mounts/replacements.
  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const measure = () => setViewport({ width: Math.max(1, node.clientWidth - 32), height: Math.max(1, node.clientHeight - 32) })
    measure()
    const observer = new ResizeObserver(measure); observer.observe(node)
    return () => observer.disconnect()
  }, [])
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
  function changeZoom(next: PaperPreviewZoom) {
    if (!ready) return
    if (props.zoom === undefined) setLocalZoom(next)
    props.onZoomChange?.(next)
  }
  function stepZoom(factor: number) {
    const actual = paperRef.current ? paperRef.current.getBoundingClientRect().width / dimensions.width * 100 : percent
    changeZoom(stepPaperZoom(actual, factor))
  }
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
          <Button variant="outline" disabled={!ready} aria-pressed={zoom === "page"} onClick={() => changeZoom("page")}>适合页面</Button>
          <Button variant="outline" disabled={!ready} aria-pressed={zoom === "width"} onClick={() => changeZoom("width")}>适合宽度</Button>
        </div>
        {ready && current.anomaly && <p className="pb-2 text-ui-hint" role="status"><Badge variant="warning" className="h-auto whitespace-normal">异常页 · {current.anomaly}</Badge></p>}
        <Card>
          {state === "loading" ? <div role="status" aria-busy="true" className="grid gap-3 p-4"><span className="text-ui-hint">正在加载试卷…</span><Skeleton className="h-80 w-full motion-reduce:animate-none" /></div>
            : state === "error" ? <Empty><p role="alert" className="text-ui-hint">{props.errorMessage || "加载失败"}</p><Button disabled={!onRetry} onClick={onRetry}>重试</Button></Empty>
            : !ready ? <Empty><p className="text-ui-body">无页面</p></Empty>
            : <div ref={viewportRef} tabIndex={0} aria-label="试卷页面，左右方向键翻页" className="paper-preview-viewport" onKeyDown={event => {
              if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) return
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); changePage(pageIndex + (event.key === "ArrowLeft" ? -1 : 1)) }
            }}>
              <div ref={paperRef} className="relative mx-auto" style={{ width: dimensions.width * percent / 100, height: dimensions.height * percent / 100 }} data-paper-size={current.paperSize ?? "A4"}>
                <DocumentRegionViewer key={current.id} label={`第 ${pageIndex + 1} 页`} pageLayout={{ width: dimensions.width * percent / 100, height: dimensions.height * percent / 100 }} regions={current.regions ?? []} selectedId={props.selectedRegionId} locateRequest={locateRequest} onSelect={props.onRegionSelect ? regionId => props.onRegionSelect?.(current.id, regionId) : undefined} background={<PageImage key={`${current.id}:${current.imageUrl}`} page={current} label={`第 ${pageIndex + 1} 页扫描图像`} onRetry={onRetry} />} />
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
