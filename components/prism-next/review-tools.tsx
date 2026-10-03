"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/prism-next/button"
import { Popover, PopoverTrigger, PopoverPopup, PopoverTitle, PopoverDescription } from "@/components/coss/popover"
import "./review-tools.css"

type Position = { x: number; y: number }
export type ReviewToolsPosition = { horizontal: "left" | "right"; vertical: "top" | "bottom"; offsetX: number; offsetY: number }
const cornerPosition: ReviewToolsPosition = { horizontal: "right", vertical: "bottom", offsetX: 24, offsetY: 24 }
const clamp = (p: Position, size: number): Position => ({ x: Math.max(0, Math.min(window.innerWidth - size, p.x)), y: Math.max(0, Math.min(window.innerHeight - size, p.y)) })
const resolvePosition = (p: ReviewToolsPosition, size: number): Position => clamp({ x: p.horizontal === "left" ? p.offsetX : window.innerWidth - size - p.offsetX, y: p.vertical === "top" ? p.offsetY : window.innerHeight - size - p.offsetY }, size)

export type ReviewToolsGroup = { id: string; title: ReactNode; children: ReactNode }
export type ReviewToolsProps = {
  title?: string
  description?: ReactNode
  groups?: readonly ReviewToolsGroup[]
  children?: ReactNode
  footer?: ReactNode
  /** undefined: uncontrolled; null: controlled, following the host default. */
  position?: ReviewToolsPosition | null
  defaultPosition?: ReviewToolsPosition | (() => ReviewToolsPosition)
  onPositionChange?: (position: ReviewToolsPosition | null, details: { reason: "move" | "reset" }) => void
}

/** UI state only. Storage, environment gating and all panel actions belong to the host. */
export function ReviewTools({ title = "评审工具", description, groups = [], children, footer,
  position: controlledPosition, defaultPosition = cornerPosition, onPositionChange,
}: ReviewToolsProps) {
  const [position, setPosition] = useState<Position | null>(null)
  const [open, setOpen] = useState(false), [dragging, setDragging] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const anchor = useRef<ReviewToolsPosition | null>(null)
  const gesture = useRef<{ id: number; x: number; y: number; origin: Position; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const suppressHover = useRef(false)
  const pinned = useRef(false)
  const id = useId()

  const triggerSize = () => button.current?.offsetWidth ?? 56
  const getDefault = () => typeof defaultPosition === "function" ? defaultPosition() : defaultPosition
  const chosen = controlledPosition !== undefined ? controlledPosition : anchor.current
  function place(point: Position) {
    const size = triggerSize()
    const next = clamp(point, size)
    const right = Math.max(0, window.innerWidth - size - next.x), bottom = Math.max(0, window.innerHeight - size - next.y)
    const edge: ReviewToolsPosition = { horizontal: next.x <= right ? "left" : "right", vertical: next.y <= bottom ? "top" : "bottom", offsetX: Math.min(next.x, right), offsetY: Math.min(next.y, bottom) }
    if (controlledPosition === undefined) { anchor.current = edge; setPosition(next) }
    onPositionChange?.(edge, { reason: "move" })
  }
  function resetPosition() {
    if (controlledPosition === undefined) {
      anchor.current = null
      setPosition(resolvePosition(getDefault(), triggerSize()))
    }
    onPositionChange?.(null, { reason: "reset" })
  }
  useEffect(() => {
    // Resize only clamps the projection; it never overwrites the requested edge offsets.
    const resize = () => setPosition(resolvePosition((controlledPosition !== undefined ? controlledPosition : anchor.current) ?? getDefault(), triggerSize()))
    resize()
    window.addEventListener("resize", resize)
    const observer = new ResizeObserver(resize)
    if (button.current) observer.observe(button.current)
    return () => { window.removeEventListener("resize", resize); observer.disconnect() }
  }, [chosen, defaultPosition])

  function down(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || gesture.current) return
    suppressClick.current = false
    const rect = event.currentTarget.getBoundingClientRect()
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: { x: rect.left, y: rect.top }, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current
    if (!active || active.id !== event.pointerId) return
    const dx = event.clientX - active.x, dy = event.clientY - active.y
    if (!active.moved && Math.hypot(dx, dy) <= 5) return
    active.moved = true; suppressClick.current = true; suppressHover.current = true
    pinned.current = false; setDragging(true); setOpen(false)
    place({ x: active.origin.x + dx, y: active.origin.y + dy })
  }
  function end(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current?.id !== event.pointerId) return
    gesture.current = null; setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  function leave(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    // Capture/layout boundary events are not a physical exit if the pointer is still on the button.
    if (suppressHover.current && event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom) return
    suppressClick.current = false; suppressHover.current = false
  }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
    const vectors: Record<string, Position> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
    const vector = vectors[event.key]
    if (!vector || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault(); event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect(), step = event.shiftKey ? 64 : 16
    place({ x: rect.left + vector.x * step, y: rect.top + vector.y * step })
  }

  const side = position && position.y < window.innerHeight / 2 ? "bottom" : "top"
  const align = position && position.x < window.innerWidth / 2 ? "start" : "end"
  return <Popover open={open} onOpenChange={(value, details) => {
    if (value && (dragging || suppressClick.current)) { details.cancel(); return }
    if (value && details.reason === "trigger-hover" && suppressHover.current) { details.cancel(); return }
    // Base UI allows a long hover's first click to close. Review tools instead pin it.
    if (details.reason === "trigger-press") {
      const next = !pinned.current
      pinned.current = next
      if (next !== value) details.cancel()
      setOpen(next)
      return
    }
    if (pinned.current && details.reason === "trigger-hover") { details.cancel(); return }
    if (!value) pinned.current = false
    setOpen(value)
  }}>
    <PopoverTrigger ref={button} openOnHover={!dragging} delay={0} closeDelay={250}
      render={<Button variant="ghost" size="icon" />}
      className="review-tools-trigger rounded-full shadow-lg" aria-label={title} aria-describedby={`${id}-help`}
      style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined}
      onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
      onPointerLeave={leave}
      onKeyDown={event => { suppressClick.current = false; keyboard(event) }}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation() } }}
    ><SlidersHorizontal aria-hidden="true" /></PopoverTrigger>
    <span id={`${id}-help`} className="sr-only">可拖动；方向键移动 16 像素，Shift 加方向键移动 64 像素。</span>
    <PopoverPopup className="review-tools-popup w-72 max-w-[calc(100vw-16px)]" side={side} align={align} sideOffset={8}
      initialFocus={type => type === "keyboard"} finalFocus={button}>
      <PopoverTitle className="text-block-title">{title}</PopoverTitle>
      {description && <PopoverDescription className="mt-2 text-ui-hint">{description}</PopoverDescription>}
      <div className="mt-4 space-y-4">
        {groups.map((group, index) => <section key={group.id} role="group" aria-labelledby={`${id}-group-${index}`} className="space-y-2">
          <h3 id={`${id}-group-${index}`} className="text-item-title">{group.title}</h3>
          {group.children}
        </section>)}
        {children}
        <Button variant="outline" className="w-full" onClick={resetPosition}>按钮归位</Button>
        {footer}
      </div>
    </PopoverPopup>
  </Popover>
}
