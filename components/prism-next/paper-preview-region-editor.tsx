"use client"

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react"
import type { DocumentRegion } from "./document-region-viewer"
import type { PaperPreviewRotation } from "./paper-preview"
import { clampPaperRegion, createPaperRegion, documentRectToPaperRegion, keyboardPaperRegion, movePaperRegion, paperRegionPoint, paperRegionViewRect, resizePaperRegion, type PaperRegionHandle, type PaperRegionPoint, type PaperRegionRect } from "./paper-preview-region-geometry"

/** Normalized coordinates relative to the unrotated page, independent of zoom. */
export type PaperPreviewRegionChange = { pageId: string; regionId: string | null; label: string; rect: PaperRegionRect }
export type PaperPreviewRegionEditing = {
  pageId: string; regionId: string | null; label: string; minSize?: number
  onChange: (change: PaperPreviewRegionChange) => void
  onCreate?: (change: PaperPreviewRegionChange) => void
}
export function canEditPaperRegion(pageId: string, regions: readonly DocumentRegion[] | undefined, editing?: PaperPreviewRegionEditing) {
  return !!editing && editing.pageId === pageId && (editing.regionId === null ? !!editing.onCreate : !!regions?.some(region => region.id === editing.regionId))
}

const handles: { name: PaperRegionHandle; x: number; y: number; cursor: string }[] = [
  { name: "nw", x: 0, y: 0, cursor: "nwse-resize" }, { name: "n", x: .5, y: 0, cursor: "ns-resize" },
  { name: "ne", x: 1, y: 0, cursor: "nesw-resize" }, { name: "e", x: 1, y: .5, cursor: "ew-resize" },
  { name: "se", x: 1, y: 1, cursor: "nwse-resize" }, { name: "s", x: .5, y: 1, cursor: "ns-resize" },
  { name: "sw", x: 0, y: 1, cursor: "nesw-resize" }, { name: "w", x: 0, y: .5, cursor: "ew-resize" },
]
type Drag = { pointerId: number; start: PaperRegionPoint; client: PaperRegionPoint; rect: PaperRegionRect | null; handle?: PaperRegionHandle; moved: boolean }

/** Internal editing layer. Only a gesture draft is local; commits wait for host facts. */
export function PaperPreviewRegionEditor({ editing, regions, rotation, geometryKey, cancelRef }: {
  editing: PaperPreviewRegionEditing; regions: readonly DocumentRegion[]; rotation: PaperPreviewRotation
  geometryKey: string; cancelRef: RefObject<(() => void) | null>
}) {
  const description = useId(), root = useRef<HTMLDivElement>(null), area = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null), [draft, setDraft] = useState<PaperRegionRect | null>(null)
  const creating = editing.regionId === null
  const region = regions.find(item => item.id === editing.regionId)
  const rect = region ? documentRectToPaperRegion(region.rect) : null
  const shown = draft ?? rect, view = shown ? paperRegionViewRect(shown, rotation) : null
  function cancel() { drag.current = null; setDraft(null) }
  useLayoutEffect(() => { cancelRef.current = cancel; return () => { cancelRef.current = null } }, [cancelRef])
  // A host update or view transform invalidates an in-flight pointer baseline.
  useLayoutEffect(cancel, [geometryKey, editing.pageId, editing.regionId, editing.minSize, rect?.[0], rect?.[1], rect?.[2], rect?.[3]])
  function point(event: PointerEvent<HTMLDivElement>) {
    const bounds = root.current?.getBoundingClientRect()
    return bounds ? paperRegionPoint({ x: event.clientX, y: event.clientY }, bounds, rotation) : null
  }
  function value(event: PointerEvent<HTMLDivElement>, session: Drag) {
    const current = point(event)
    if (!current) return null
    const delta = { x: current.x - session.start.x, y: current.y - session.start.y }
    return session.rect ? session.handle ? resizePaperRegion(session.rect, session.handle, delta, editing.minSize) : movePaperRegion(session.rect, delta, editing.minSize) : createPaperRegion(session.start, current, editing.minSize)
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if ((event.pointerType === "mouse" && event.button !== 0) || event.isPrimary === false) return
    const start = point(event)
    if (!start) return
    const hit = (event.target as HTMLElement).closest<HTMLElement>("[data-region-handle]")?.dataset.regionHandle as PaperRegionHandle | undefined
    drag.current = { pointerId: event.pointerId, start, client: { x: event.clientX, y: event.clientY }, rect, handle: hit, moved: false }
    event.preventDefault()
    ;(creating ? root.current : area.current)?.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    // Bubble into the canvas pointer tracker: a second pointer can cancel and pinch.
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const session = drag.current
    if (!session || session.pointerId !== event.pointerId) return
    session.moved ||= Math.hypot(event.clientX - session.client.x, event.clientY - session.client.y) > 5
    if (session.moved) { event.preventDefault(); setDraft(value(event, session)) }
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const session = drag.current
    if (!session || session.pointerId !== event.pointerId) return
    const changed = session.moved || Math.hypot(event.clientX - session.client.x, event.clientY - session.client.y) > 5
    const next = changed ? value(event, session) : null
    cancel()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (next) commit(next)
  }
  function commit(next: PaperRegionRect) {
    const change = { pageId: editing.pageId, regionId: editing.regionId, label: editing.label, rect: next }
    if (creating) editing.onCreate?.(change)
    else editing.onChange(change)
  }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); return }
    if (drag.current) { if (event.key.startsWith("Arrow")) { event.preventDefault(); event.stopPropagation() } return }
    if (creating && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault(); event.stopPropagation()
      const [, , width, height] = clampPaperRegion([0, 0, .2, .2], editing.minSize)
      commit([(1 - width) / 2, (1 - height) / 2, width, height]); return
    }
    const next = rect && keyboardPaperRegion(rect, event.key, event.shiftKey, rotation, editing.minSize)
    if (next) { event.preventDefault(); event.stopPropagation(); commit(next) }
  }
  return <div ref={root} data-paper-region-editor={creating ? "create" : "adjust"} role={creating ? "group" : undefined} tabIndex={creating ? 0 : undefined} aria-label={creating ? `${editing.label}，框选作答区域` : undefined} aria-describedby={creating ? description : undefined}
    className={`absolute inset-0 z-10 touch-none select-none ${creating ? "cursor-crosshair focus-visible:outline-2 focus-visible:outline-ring" : "pointer-events-none"}`}
    onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={cancel} onKeyDown={key}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) cancel() }} onClick={event => event.stopPropagation()}>
    <span id={description} className="sr-only">{creating ? "在页面上拖动框选；按 Enter 或空格在页面中央新建区域。" : "拖动区域移动，拖动四角或四边手柄调整；方向键按页面比例移动 0.5%，Shift 加方向键调整屏幕右边或下边。"}按 Esc 取消当前拖动；双指或 Ctrl/⌘ 滚轮取消拖动并缩放。退出编辑使用页面的退出操作。</span>
    {view && <div ref={area} data-editable-region={editing.regionId ?? undefined} data-region={editing.regionId ?? undefined} role={creating ? undefined : "group"} tabIndex={creating ? undefined : 0} aria-label={creating ? undefined : `${editing.label}，调整作答区域`} aria-describedby={creating ? undefined : description}
      className={`absolute border-2 border-primary bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${creating ? "pointer-events-none" : "pointer-events-auto cursor-move"}`}
      style={{ left: `${view[0] * 100}%`, top: `${view[1] * 100}%`, width: `${view[2] * 100}%`, height: `${view[3] * 100}%` }}>
      {!creating && handles.map(handle => {
        // Place source handles through the same rotation as the region; their cursor follows the screen edge.
        const position = paperRegionViewRect([handle.x, handle.y, 0, 0], rotation)
        const screenHandle = handles.find(item => item.x === position[0] && item.y === position[1])!
        return <span key={handle.name} data-region-handle={handle.name} aria-hidden="true" className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center" style={{ left: `${position[0] * 100}%`, top: `${position[1] * 100}%`, cursor: screenHandle.cursor }}><span className="size-2 border border-primary bg-background" /></span>
      })}
    </div>}
  </div>
}
