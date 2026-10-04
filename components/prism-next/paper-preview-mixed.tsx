"use client"
import "./review-workspace.css"

import { useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from "react"
import { PaperPreviewRegionEditor, canEditPaperRegion, type PaperPreviewRegionEditing } from "./paper-preview-region-editor"
import { DocumentRegionViewer } from "@/components/prism-next/document-region-viewer"
import { clampPaperZoom, paperZoomPercent, rotatedPaperDimensions, type PaperPreviewPage, type PaperPreviewRotation, type PaperPreviewZoom } from "@/components/prism-next/paper-preview"

// Measurements may be absent while a pane is hidden or content is not laid out.
const positiveSize=(value:number,fallback:number)=>Number.isFinite(value)&&value>0?value:fallback

export type PaperPreviewMixedPage = PaperPreviewPage & { width:number; height:number; content?:ReactNode }
// Mixed digital/scan engine of PaperPreview continuous mode; all content is supplied.
export function PaperPreviewMixed({ viewportRef, pages, zoom, rotations, selected, scale, onSelect, onZoom, onVisiblePage, onViewport, headers, activePage, topInset, onQuestionHidden, answerLabel, beforeContent, renderSectionHeading, onScanVisibilityChange, resolveScanLayout, regionEditing }: {
  regionEditing?: PaperPreviewRegionEditing
  resolveScanLayout?:(page:PaperPreviewMixedPage,rotation:PaperPreviewRotation)=>{source:{width:number;height:number};dimensions:{width:number;height:number}}
  beforeContent?: ReactNode; renderSectionHeading?: (page:PaperPreviewMixedPage,index:number)=>ReactNode; onScanVisibilityChange?: (visible:boolean)=>void
  onQuestionHidden?: (hidden:boolean) => void; answerLabel?: string
  headers: Record<string, ReactNode>; activePage: string; topInset: number
  viewportRef: RefObject<HTMLDivElement | null>; pages: PaperPreviewMixedPage[]; zoom: PaperPreviewZoom
  rotations: Record<string, PaperPreviewRotation>; selected: string; scale: number
  onSelect: (id: string) => void; onZoom: (zoom: PaperPreviewZoom) => void
  onVisiblePage: (page: number, percent?: number) => void; onViewport: (size: { width: number; height: number }) => void
}) {
  const [viewport, setViewport] = useState({ width: 740, height: 828 })
  const wheel = useRef<(event: WheelEvent) => void>(() => {})
  const anchor = useRef<{ id: string; x: number; y: number; localX: number; localY: number } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number; editing?: boolean }>())
  const gesture = useRef({ moved: false, pinch: false, distance: 0, percent: 100 })
  const suppressClick = useRef(false)
  const cancelRegionEdit = useRef<(() => void) | null>(null)
  const editingKey = regionEditing && pages.some(page => !page.content && canEditPaperRegion(page.id, page.regions, regionEditing)) ? JSON.stringify([regionEditing.pageId, regionEditing.regionId]) : null
  const previousEditingKey = useRef(editingKey)
  useLayoutEffect(() => {
    if (previousEditingKey.current === editingKey) return
    previousEditingKey.current = editingKey
    cancelRegionEdit.current?.()
    pointers.current.clear()
    gesture.current = { moved: false, pinch: false, distance: 0, percent: 100 }
    suppressClick.current = false
  }, [editingKey])
  function visiblePage() {
    const node = viewportRef.current
    if (!node) return
    const view = node.getBoundingClientRect()
    const question=node.querySelector<HTMLElement>('[data-page-id="question"]')
    onQuestionHidden?.(!!question&&question.getBoundingClientRect().bottom<=view.top+topInset*scale)
    onScanVisibilityChange?.([...node.querySelectorAll<HTMLElement>('[data-scan-paper]')].some(p=>{const r=p.getBoundingClientRect();return r.bottom>view.top+topInset*scale&&r.top<view.bottom}))
    let best = 0, area = -1
    node.querySelectorAll<HTMLElement>('[data-review-page]').forEach((paper, index) => {
      const rect = paper.getBoundingClientRect()
      const visible = Math.max(0, Math.min(rect.bottom, view.bottom) - Math.max(rect.top, view.top + topInset * scale)) * Math.max(0, Math.min(rect.right, view.right) - Math.max(rect.left, view.left))
      if (visible > area) { area = visible; best = index }
    })
    onVisiblePage(best,Number(node.querySelector<HTMLElement>(`[data-review-page="${best}"]`)?.dataset.percent ?? 100))
  }
  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const measure = () => {
      const size = { width: positiveSize(node.clientWidth - 16 - 56,1), height: positiveSize(node.clientHeight - topInset - 8,1) }
      setViewport(size); onViewport(size)
    }
    const handle = (event: WheelEvent) => wheel.current(event)
    measure()
    const observer = new ResizeObserver(measure); observer.observe(node)
    node.addEventListener('wheel', handle, { passive: false })
    return () => { observer.disconnect(); node.removeEventListener('wheel', handle) }
  }, [viewportRef, onViewport, topInset])
  useLayoutEffect(() => {
    const request = anchor.current, node = viewportRef.current
    if (request && node) {
      const paper = node.querySelector<HTMLElement>(`[data-page-id="${request.id}"]`)
      if (paper) {
        const a = paper.getBoundingClientRect(), b = node.getBoundingClientRect()
        node.scrollLeft += (a.left - b.left + request.x * a.width) / scale - request.localX
        node.scrollTop += (a.top - b.top + request.y * a.height) / scale - request.localY
      }
      anchor.current = null
    }
    visiblePage()
  }, [zoom, viewport, rotations, scale, pages.length])
  function paperAt(x: number, y: number) {
    return [...viewportRef.current?.querySelectorAll<HTMLElement>('[data-scan-paper]') ?? []].find(node => { const rect = node.getBoundingClientRect(); return y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right })
  }
  function anchoredZoom(next: number, x: number, y: number) {
    const node = viewportRef.current, paper = paperAt(x, y)
    if (!node || !paper) return
    const rect = paper.getBoundingClientRect(), view = node.getBoundingClientRect()
    anchor.current = { id: paper.dataset.pageId!, x: (x - rect.left) / rect.width, y: (y - rect.top) / rect.height, localX: (x - view.left) / scale, localY: (y - view.top) / scale }
    onZoom(clampPaperZoom(next))
  }
  wheel.current = event => {
    if (!(event.ctrlKey || event.metaKey)) return
    event.preventDefault()
    cancelRegionEdit.current?.()
    const paper = paperAt(event.clientX, event.clientY)
    if (!paper) return
    const percent = Number(paper.dataset.percent)
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.height : 1)
    anchoredZoom(percent * Math.exp(-Math.max(-25, Math.min(25, delta)) * .01), event.clientX, event.clientY)
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const editing = !!regionEditing && !!(event.target as HTMLElement).closest?.('[data-paper-region-editor]')
    if (!editing && !(regionEditing && pointers.current.size) && (event.target as HTMLElement).closest('[data-digital-question],[data-full-score-group],button,a,input')) { suppressClick.current=false; return }
    const active = pointers.current
    if (!active.size) { suppressClick.current = false; gesture.current = { moved: false, pinch: false, distance: 0, percent: 100 } }
    active.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, editing })
    if (!editing || event.isPrimary === false) (event.target as HTMLElement).setPointerCapture?.(event.pointerId)
    if (active.size === 2) {
      cancelRegionEdit.current?.()
      const [a, b] = [...active.values()]
      gesture.current.pinch = true
      gesture.current.distance = Math.hypot(a.x - b.x, a.y - b.y)
      gesture.current.percent = Number(paperAt((a.x + b.x) / 2, (a.y + b.y) / 2)?.dataset.percent ?? 100)
      suppressClick.current = true
    }
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const active = pointers.current, previous = active.get(event.pointerId), node = viewportRef.current
    if (!previous || !node) return
    const session = gesture.current, wasMoved = session.moved
    session.moved ||= Math.hypot(event.clientX - previous.startX, event.clientY - previous.startY) > 5
    active.set(event.pointerId, { ...previous, x: event.clientX, y: event.clientY })
    if (!session.moved) return
    suppressClick.current = true; event.preventDefault()
    if (active.size === 2) {
      const [a, b] = [...active.values()]
      if (session.distance) anchoredZoom(session.percent * Math.hypot(a.x - b.x, a.y - b.y) / session.distance, (a.x + b.x) / 2, (a.y + b.y) / 2)
    } else if (!session.pinch && !previous.editing) {
      node.scrollLeft -= (event.clientX - (wasMoved ? previous.x : previous.startX)) / scale
      node.scrollTop -= (event.clientY - (wasMoved ? previous.y : previous.startY)) / scale
    }
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    if ((event.target as HTMLElement).hasPointerCapture?.(event.pointerId)) (event.target as HTMLElement).releasePointerCapture(event.pointerId)
  }
  const layouts = pages.map(page => {
    const source={width:positiveSize(page.width,794),height:positiveSize(page.height,1)}
    if(page.content)return {source,rotation:0 as PaperPreviewRotation,dimensions:{width:viewport.width,height:1},percent:100}
    const rotation = rotations[page.id] ?? 0, resolved=resolveScanLayout?.(page,rotation), dimensions = resolved?.dimensions ?? rotatedPaperDimensions(source, rotation)
    const percent = paperZoomPercent(zoom, viewport, dimensions)
    return { source:resolved?.source??source, rotation, dimensions, percent }
  })
  const columnWidth = Math.max(0,...layouts.map(({ dimensions, percent }) => dimensions.width * percent / 100))
  return <div ref={viewportRef} data-review-continuous data-zoom-mode={typeof zoom === 'number' ? 'custom' : zoom} tabIndex={0} aria-label="题目与学生作答连续画布" className="d1-continuous" style={{paddingTop:topInset}} onScroll={visiblePage} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onDragStart={event => event.preventDefault()} onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation() } }}>
    <div className="d1-paper-spread" style={{ width: columnWidth + 56 }}><div className="d1-paper-column" style={{ width: columnWidth }}>
    {beforeContent}
    {pages.map((page, index) => {
      const { source, rotation, dimensions, percent } = layouts[index]
      if(page.content)return <section key={page.id} className="shrink-0" style={{width:viewport.width}}><div data-review-page={index} data-page-id={page.id} data-percent={100}>{page.content}</div></section>
      const firstScan=pages.findIndex(p=>!p.content)===index
      const editing = canEditPaperRegion(page.id, page.regions, regionEditing)
      const visibleRegions = editing && regionEditing!.regionId !== null ? (page.regions ?? []).filter(region => region.id !== regionEditing!.regionId) : page.regions ?? []
      const viewer = <DocumentRegionViewer label={page.alt ?? `第 ${index + 1} 页`} pageLayout={{ width: source.width * percent / 100, height: source.height * percent / 100 }} pageRotation={rotation} locateOnResize={false} regions={visibleRegions} selectedId={undefined} onSelect={onSelect} background={page.imageUrl?<img src={page.imageUrl} alt={page.alt} draggable={false} className="h-full w-full object-contain" />:<div className="flex h-full items-center justify-center bg-card p-6 text-ui-body">扫描图像未提供</div>} />
      return <section key={page.id} style={{ width: dimensions.width * percent / 100 }} className="shrink-0">{renderSectionHeading?.(page,index)}{!renderSectionHeading&&firstScan&&<h2 className="text-ui-body text-muted-foreground" data-answer-section>{answerLabel}</h2>}{headers[page.id]}<div data-review-page={index} data-page-id={page.id} data-percent={percent} data-paper-size="crop" data-scan-paper className={`relative shrink-0 shadow-2xl transition-opacity duration-150 motion-reduce:transition-none ${page.id === "question" || !!page.content || activePage === page.id ? "opacity-100" : "opacity-65"} ${activePage === page.id && page.id !== "question" ? "ring-2 ring-info" : ""}`} style={{ width: dimensions.width * percent / 100, height: dimensions.height * percent / 100 }}>
        {editing ? <>{viewer}<PaperPreviewRegionEditor key={JSON.stringify([page.id, regionEditing!.regionId])} editing={regionEditing!} regions={page.regions ?? []} rotation={rotation} geometryKey={`${rotation}:${percent}:${source.width}:${source.height}:${scale}`} cancelRef={cancelRegionEdit} /></> : viewer}
      </div></section>
    })}
    </div></div>
  </div>
}
