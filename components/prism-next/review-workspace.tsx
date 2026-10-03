"use client"
import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogHeader, DialogPanel } from "@/components/coss/dialog"
import { Kbd } from "@/components/coss/kbd"
import "./review-workspace.css"
export { PAPER_REVIEW_BEST_WIDTH, railBand, railCollapsedForWidth, type RailPreferences } from "./review-workspace-layout"
export type ReviewShortcut = { key: string; intent: string; repeat?: boolean; disabled?: boolean }
export type ReviewWorkspaceProps = {
  label: string; topbar?: ReactNode; rail?: ReactNode; canvas: ReactNode; inspector: ReactNode; children?: ReactNode
  open?: boolean; onOpenChange?: (open: boolean) => void; immersive: boolean
  pane: string; onPaneChange: (pane: string) => void
  panes?: { value: string; label: string }[]; ready?: boolean; animate?: boolean
  shortcuts?: ReviewShortcut[]; shortcutsDisabled?: boolean; onShortcut?: (intent: string) => void; onBlurOutside?: () => void
  frameRef?: RefObject<HTMLElement | null>; mobileNavRef?: RefObject<HTMLElement | null>
  device?: string; style?: CSSProperties
}
/** Keyboard ownership stops at inputs, portals and native tab/list navigation. */
export function reviewWorkspaceShortcut(event: KeyboardEvent, shortcuts: ReviewShortcut[], disabled = false): string | undefined {
  const target = event.target as HTMLElement
  if (disabled || event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="menu"]') || (target.closest('[role="listbox"]') && !target.closest('[data-review-rail]'))) return
  if (target.closest('[role=tablist]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '].includes(event.key)) return
  if (target.closest('[data-review-rail] [role="listbox"]') && ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return
  const binding = shortcuts.find(binding => binding.key === event.key.toLowerCase())
  if (!binding || binding.disabled) return
  event.preventDefault(); event.stopPropagation()
  return !event.repeat || binding.repeat ? binding.intent : undefined
}
export function ReviewWorkspace({ label, topbar, rail, canvas, inspector, children, open, onOpenChange, immersive, pane, onPaneChange, panes = [{ value: 'rail', label: '题目' }, { value: 'canvas', label: '试卷' }, { value: 'inspector', label: '本题反馈' }], ready = true, animate = false, shortcuts = [], shortcutsDisabled, onShortcut, onBlurOutside, frameRef, mobileNavRef, device, style }: ReviewWorkspaceProps) {
  const hasRail = rail != null && rail !== false
  const visiblePanes = hasRail ? panes : panes.filter(item => item.value !== 'rail')
  const activePane = !hasRail && pane === 'rail' ? 'canvas' : pane
  const activeShortcuts = hasRail ? shortcuts : shortcuts.filter(binding => binding.key !== 't')
  return <section ref={frameRef} aria-label={label} tabIndex={-1} className="d1-frame bg-background" data-device={device} data-mobile-pane={activePane} data-no-rail={hasRail ? undefined : true} data-immersive={immersive} data-rail-collapsed={!open} data-rail-ready={ready} data-rail-animate={animate} style={style} onKeyDownCapture={event => { const intent = reviewWorkspaceShortcut(event, activeShortcuts, shortcutsDisabled); if (intent) onShortcut?.(intent) }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onBlurOutside?.() }}>
    {topbar}
    <nav ref={mobileNavRef} className="d1-mobile-nav border-b px-3" aria-label="预览分区"><ToggleGroup value={[activePane]} onValueChange={value => { if (value.length) { if (value[0] === 'rail' && !hasRail) return; if (value[0] === 'rail' && !open) onOpenChange?.(true); else onPaneChange(value[0]) } }}>{visiblePanes.map(({ value, label }) => <ToggleGroupItem key={value} value={value}>{label}</ToggleGroupItem>)}</ToggleGroup></nav>
    <div className="d1-columns">{hasRail && <div className="d1-rail-shell" inert={!open}>{rail}</div>}{canvas}{inspector}</div>
    {children}
  </section>
}
export type ReviewWorkspaceShortcutsProps = { open: boolean; onOpenChange: (open: boolean) => void; entries: readonly (readonly string[])[]; description?: string }
export function ReviewWorkspaceShortcuts({ open, onOpenChange, entries, description = "焦点在试卷预览框架内时可用；输入框与菜单保留自身按键行为。" }: ReviewWorkspaceShortcutsProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogPopup className="surface-floating motion-reduce:transition-none" closeProps={{ 'aria-label': '关闭快捷键表', className: 'absolute end-2 top-2' }}><DialogHeader><DialogTitle>快捷键</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogPanel><dl className="space-y-3">{entries.map(([key, label]) => <div key={key} className="flex items-center justify-between gap-4 text-ui-body"><dt>{label}</dt><dd><Kbd>{key}</Kbd></dd></div>)}</dl></DialogPanel></DialogPopup></Dialog>
}
