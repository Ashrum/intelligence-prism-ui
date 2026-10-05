"use client"

import { useLayoutEffect, useRef, useState, type PointerEvent, type RefObject, type ReactNode } from "react"
import { PaperPreviewRegionEditor, canEditPaperRegion, type PaperPreviewRegionEditing } from "./paper-preview-region-editor"
import { DocumentRegionViewer } from "@/components/prism-next/document-region-viewer"
import { clampPaperZoom, paperDimensions, paperZoomPercent, rotatedPaperDimensions, type PaperPreviewPage, type PaperPreviewRotation, type PaperPreviewZoom } from "@/components/prism-next/paper-preview"

import "./review-workspace.css"
export type PaperPreviewLocation = { pageId?: string; regionId?: string; request?: number; focus?: boolean }
export type PaperPreviewContinuousProps = {
  regionEditing?: PaperPreviewRegionEditing
  viewportRef: RefObject<HTMLDivElement | null>; pages: readonly PaperPreviewPage[]; zoom: PaperPreviewZoom
  rotations: Record<string, PaperPreviewRotation>; selected?: string; scale?: number
  onSelect?: (id: string, pageId: string) => void; onZoom: (zoom: PaperPreviewZoom) => void
  onVisiblePage?: (page: number) => void; onViewport?: (size: { width: number; height: number }) => void
  gap?: number; toolbarWidth?: number; beforeContent?: ReactNode
  renderPageHeader?: (page: PaperPreviewPage, index: number) => ReactNode
  spotlight?: boolean; original?: boolean; emptyImageText?: ReactNode; location?: PaperPreviewLocation
}
/** Explicit requests only: manual scrolling never changes the selected region. */
export function locatePaperTarget(node: HTMLDivElement | null, target: PaperPreviewLocation, scale = 1) {
  if (!node) return
  const paper = target.regionId ? [...node.querySelectorAll<HTMLElement>('[data-region]')].find(region => region.dataset.region === target.regionId)
    : [...node.querySelectorAll<HTMLElement>('[data-page-id]')].find(paper => paper.dataset.pageId === target.pageId)
  if (!paper) return
  const a = paper.getBoundingClientRect(), b = node.getBoundingClientRect(), factor = scale > 0 ? scale : 1
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  node.scrollTo(target.regionId ? { left: node.scrollLeft + (a.left + a.width / 2 - b.left - b.width / 2) / factor, top: node.scrollTop + (a.top + a.height / 2 - b.top - b.height / 2) / factor, behavior } : { top: node.scrollTop + (a.top - b.top) / factor - 8, behavior })
  if (target.focus) node.focus({ preventScroll: true })
}
/** One scroll viewport, independent sheet sizes/rotations and gesture anchors. */
export function PaperPreviewContinuous({ viewportRef, pages, zoom, rotations, selected, scale = 1, onSelect, onZoom, onVisiblePage, onViewport, gap, toolbarWidth = 56, beforeContent, renderPageHeader, spotlight = false, original = false, emptyImageText = "扫描图像未提供", location, regionEditing }: PaperPreviewContinuousProps) {
  const [viewport, setViewport] = useState({ width: 740, height: 828 })
  const wheel = useRef<(event: WheelEvent) => void>(() => {})
  const anchor = useRef<{ id: string; x: number; y: number; localX: number; localY: number } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number; editing?: boolean }>())
  const gesture = useRef({ moved: false, pinch: false, distance: 0, percent: 100 })
  const suppressClick = useRef(false)
  const cancelRegionEdit = useRef<(() => void) | null>(null)
  const editingKey = regionEditing && pages.some(page => canEditPaperRegion(page.id, page.regions, regionEditing)) ? JSON.stringify([regionEditing.pageId, regionEditing.regionId]) : null
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
    let best = 0, area = -1
    node.querySelectorAll<HTMLElement>('[data-review-page]').forEach((paper, index) => {
      const rect = paper.getBoundingClientRect()
      const visible = Math.max(0, Math.min(rect.bottom, view.bottom) - Math.max(rect.top, view.top)) * Math.max(0, Math.min(rect.right, view.right) - Math.max(rect.left, view.left))
      if (visible > area) { area = visible; best = index }
    })
    onVisiblePage?.(best)
  }
  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const measure = () => {
      const size = { width: Math.max(1, node.clientWidth - 16 - toolbarWidth), height: Math.max(1, node.clientHeight - 16) }
      setViewport(size); onViewport?.(size)
    }
    const handle = (event: WheelEvent) => wheel.current(event)
    measure()
    const observer = new ResizeObserver(measure); observer.observe(node)
    node.addEventListener('wheel', handle, { passive: false })
    return () => { observer.disconnect(); node.removeEventListener('wheel', handle) }
  }, [viewportRef, onViewport, toolbarWidth])
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
  }, [zoom, viewport, rotations, scale])
  useLayoutEffect(() => {
    if (!location) return
    const request = requestAnimationFrame(() => locatePaperTarget(viewportRef.current, location, scale))
    return () => cancelAnimationFrame(request)
  }, [location?.pageId, location?.regionId, location?.request, location?.focus, viewportRef, scale])
  function paperAt(x: number, y: number) {
    return [...viewportRef.current?.querySelectorAll<HTMLElement>('[data-review-page]') ?? []].find(node => { const rect = node.getBoundingClientRect(); return y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right })
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
    const source = page.dimensions ?? paperDimensions(page.paperSize, page.orientation)
    const rotation = rotations[page.id] ?? 0, dimensions = rotatedPaperDimensions(source, rotation)
    const percent = paperZoomPercent(zoom, viewport, dimensions)
    return { source, rotation, dimensions, percent }
  })
  const columnWidth = Math.max(0, ...layouts.map(({ dimensions, percent }) => dimensions.width * percent / 100))
  return <div ref={viewportRef} data-review-continuous data-zoom-mode={typeof zoom === 'number' ? 'custom' : zoom} tabIndex={0} aria-label="连续试卷画布" className="d1-continuous" onScroll={visiblePage} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onDragStart={event => event.preventDefault()} onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation() } }}>
    <div className="d1-paper-spread" style={{ width: columnWidth + toolbarWidth }}><div className="d1-paper-column" style={{ width: columnWidth, ...(gap === undefined ? {} : { gap }) }}>
    {beforeContent}
    {pages.map((page, index) => {
      const { source, rotation, dimensions, percent } = layouts[index]
      const header = renderPageHeader?.(page, index)
      const editing = canEditPaperRegion(page.id, page.regions, regionEditing)
      const visibleRegions = editing && regionEditing!.regionId !== null ? (page.regions ?? []).filter(region => region.id !== regionEditing!.regionId) : page.regions ?? []
      const viewer = <DocumentRegionViewer label={`第 ${index + 1} 页`} pageLayout={{ width: source.width * percent / 100, height: source.height * percent / 100 }} pageRotation={rotation} locateOnResize={false} regions={spotlight ? visibleRegions.map(region => ({ ...region, content: <span aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-white/65 transition-opacity duration-200 motion-reduce:transition-none ${selected === region.id || original ? 'opacity-0' : 'opacity-100'}`} /> })) : visibleRegions} selectedId={selected} onSelect={onSelect ? id => onSelect(id, page.id) : undefined} background={page.imageUrl ? <img src={page.imageUrl} alt={page.alt} draggable={false} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center bg-card p-6 text-ui-body">{emptyImageText}</div>} />
      const paper = <div key={page.id} data-review-page={index} data-page-id={page.id} data-percent={percent} data-paper-size={page.paperSize ?? "A4"} className="relative mx-auto shrink-0" style={{ width: dimensions.width * percent / 100, height: dimensions.height * percent / 100 }}>
        {editing ? <>{viewer}<PaperPreviewRegionEditor key={JSON.stringify([page.id, regionEditing!.regionId])} editing={regionEditing!} regions={page.regions ?? []} rotation={rotation} geometryKey={`${rotation}:${percent}:${source.width}:${source.height}:${scale}`} cancelRef={cancelRegionEdit} /></> : viewer}
      </div>
      return header == null ? paper : <section key={page.id}>{header}{paper}</section>
    })}
    </div></div>
  </div>
}
