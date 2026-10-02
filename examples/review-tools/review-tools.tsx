"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/prism-next/button"
import { ThemePicker } from "@/components/prism-next/shell"
import { Popover, PopoverTrigger, PopoverPopup, PopoverTitle, PopoverDescription } from "@/components/coss/popover"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Switch } from "@/components/coss/switch"
import "./review-tools.css"

const targets = [{ value: "auto", label: "自适应" }, { value: "1440", label: "1440×900" }, { value: "1920", label: "1920×1080" }]
const storageKey = "prism-review-tools-edge-position-v2"
type Position = { x: number; y: number }
export type ReviewToolsPosition = { horizontal: "left" | "right"; vertical: "top" | "bottom"; offsetX: number; offsetY: number }
const cornerPosition: ReviewToolsPosition = { horizontal: "right", vertical: "bottom", offsetX: 24, offsetY: 24 }
const clamp = (p: Position, size: number): Position => ({ x: Math.max(0, Math.min(window.innerWidth - size, p.x)), y: Math.max(0, Math.min(window.innerHeight - size, p.y)) })
const resolvePosition = (p: ReviewToolsPosition, size: number): Position => clamp({ x: p.horizontal === "left" ? p.offsetX : window.innerWidth - size - p.offsetX, y: p.vertical === "top" ? p.offsetY : window.innerHeight - size - p.offsetY }, size)

// Review-page utility only: never register this in the design-system catalog.
export function ReviewTools({ device, onDeviceChange, missing, onMissingChange, defaultPosition = cornerPosition, onResetRailPreferences }: {
  device: string; onDeviceChange: (value: string) => void
  missing: boolean; onMissingChange: (value: boolean) => void
  defaultPosition?: ReviewToolsPosition
  onResetRailPreferences?: () => void
}) {
  const [position, setPosition] = useState<Position | null>(null)
  const [open, setOpen] = useState(false), [dragging, setDragging] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const anchor = useRef<ReviewToolsPosition | null>(null)
  const gesture = useRef<{ id: number; x: number; y: number; origin: Position; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const suppressHover = useRef(false)
  const pinned = useRef(false)
  const id = useId()

  const triggerSize = () => button.current?.offsetWidth ?? 32
  function place(point: Position) {
    const size = triggerSize()
    const next = clamp(point, size)
    const right = Math.max(0, window.innerWidth - size - next.x), bottom = Math.max(0, window.innerHeight - size - next.y)
    anchor.current = { horizontal: next.x <= right ? "left" : "right", vertical: next.y <= bottom ? "top" : "bottom", offsetX: Math.min(next.x, right), offsetY: Math.min(next.y, bottom) }
    setPosition(next)
    try { localStorage.setItem(storageKey, JSON.stringify(anchor.current)) } catch { /* Storage is optional. */ }
  }
  function resetPosition() {
    anchor.current = null
    setPosition(resolvePosition(defaultPosition, triggerSize()))
    try { localStorage.removeItem(storageKey) } catch { /* Storage is optional. */ }
  }
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) ?? "null")
      if (value && ["left", "right"].includes(value.horizontal) && ["top", "bottom"].includes(value.vertical) && Number.isFinite(value.offsetX) && value.offsetX >= 0 && Number.isFinite(value.offsetY) && value.offsetY >= 0) anchor.current = value
    } catch { /* Invalid or unavailable storage falls back to the initial corner. */ }
  }, [])
  useEffect(() => {
    // A user-chosen anchor wins; otherwise follow the host's live default.
    const resize = () => setPosition(resolvePosition(anchor.current ?? defaultPosition, triggerSize()))
    resize()
    window.addEventListener("resize", resize)
    const observer = new ResizeObserver(resize)
    if (button.current) observer.observe(button.current)
    return () => { window.removeEventListener("resize", resize); observer.disconnect() }
  }, [defaultPosition])

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
      className="review-tools-trigger rounded-full shadow-lg" aria-label="评审工具" aria-describedby={`${id}-help`}
      style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined}
      onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
      onPointerLeave={leave}
      onKeyDown={event => { suppressClick.current = false; keyboard(event) }}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation() } }}
    ><SlidersHorizontal aria-hidden="true" /></PopoverTrigger>
    <span id={`${id}-help`} className="sr-only">可拖动；方向键移动 16 像素，Shift 加方向键移动 64 像素。</span>
    <PopoverPopup className="review-tools-popup w-72 max-w-[calc(100vw-16px)]" side={side} align={align} sideOffset={8}
      initialFocus={type => type === "keyboard"} finalFocus={button}>
      <PopoverTitle className="text-block-title">评审工具</PopoverTitle>
      <PopoverDescription className="mt-2 text-ui-hint">调整评审视口、主题与扫描图像。</PopoverDescription>
      <div className="mt-4 space-y-4">
        <div className="space-y-2"><label htmlFor={`${id}-viewport`} className="text-ui-body">视口</label>
          <Select value={device} items={targets} onValueChange={value => { if (value) onDeviceChange(value) }}>
            <SelectTrigger id={`${id}-viewport`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectPopup>{targets.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup>
          </Select>
        </div>
        <div role="group" aria-labelledby={`${id}-theme`} className="space-y-2"><p id={`${id}-theme`} className="text-ui-body">主题</p><ThemePicker /></div>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-ui-body" htmlFor={`${id}-missing`}>无扫描图像<Switch id={`${id}-missing`} checked={missing} onCheckedChange={onMissingChange} /></label>
        {onResetRailPreferences && <Button variant="outline" size="default" className="w-full" onClick={onResetRailPreferences}>恢复题目栏默认</Button>}
        <Button variant="outline" className="w-full" onClick={resetPosition}>按钮归位</Button>
        <Button variant="outline" className="w-full" render={<a href="/next" />}>返回组件库</Button>
      </div>
    </PopoverPopup>
  </Popover>
}
