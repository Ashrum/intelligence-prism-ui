"use client"
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { FileImage } from "lucide-react"
import { dockPaperToolbar } from "./paper-preview-layout"
import "./review-workspace.css"
export type PaperPreviewSurfaceProps = {
  children: ReactNode; toolbar: ReactNode; overlay?: ReactNode; scale?: number; layoutKey?: unknown
  viewportRef: RefObject<HTMLDivElement | null>; canvasRef?: RefObject<HTMLElement | null>; toolbarRef: RefObject<HTMLDivElement | null>
  scanOnly?:boolean; topInset?:number; bottomInset?: number; missing?: boolean; emptyImageText?: ReactNode; emptyImageDetail?: ReactNode
}
/** Paper-edge side tab: observes paper geometry, clamps overwide sheets, no timers. */
export function PaperPreviewSurface({ children, toolbar: tools, overlay, scale = 1, layoutKey, viewportRef, canvasRef, toolbarRef: toolbar, scanOnly=false, topInset=0, bottomInset = 0, missing = false, emptyImageText = "扫描图像未提供", emptyImageDetail }: PaperPreviewSurfaceProps) {
  const localCanvas = useRef<HTMLElement>(null), canvasArea = canvasRef ?? localCanvas
  const [dockPosition, setDockPosition] = useState({ left: 0, top: 8, maxHeight: 600 })
  useLayoutEffect(() => {
    const area = canvasArea.current, node = viewportRef.current, bar = toolbar.current
    if (!area || !bar) return
    const measure = () => {
      const bounds = area.getBoundingClientRect(), factor = scale || 1
      const papers = [...area.querySelectorAll<HTMLElement>(scanOnly?'[data-scan-paper]':'[data-review-page], [data-missing-paper]')].filter(paper=>!scanOnly||(()=>{const r=paper.getBoundingClientRect();return r.bottom>bounds.top+topInset*factor&&r.top<bounds.bottom})())
      const right = papers.length ? Math.max(...papers.map(paper => paper.getBoundingClientRect().right)) : bounds.right - 64 * factor
      const size = dockPaperToolbar({ canvasWidth: area.clientWidth, paperRight: (right - bounds.left) / factor, toolbarWidth: bar.offsetWidth })
      const height = area.clientHeight, maxHeight = Math.max(44, height - bottomInset / factor - 16)
      const top = Math.max(8, Math.min((height - bar.offsetHeight) / 2, height - bottomInset / factor - 8 - bar.offsetHeight))
      setDockPosition(previous => previous.left === size.left && previous.top === top && previous.maxHeight === maxHeight ? previous : { left: size.left, top, maxHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(area); observer.observe(bar)
    area.querySelectorAll<HTMLElement>('[data-review-page], [data-missing-paper]').forEach(paper => observer.observe(paper))
    node?.addEventListener('scroll', measure, { passive: true })
    return () => { observer.disconnect(); node?.removeEventListener('scroll', measure) }
  }, [scale, layoutKey, missing, children, bottomInset, topInset, scanOnly])
  return <section ref={canvasArea} aria-label="试卷画布" data-review-canvas className="d1-canvas bg-border">
    {overlay}
    <div className="d1-paper-host min-h-0 min-w-0 [&_[data-paper-size]]:shadow-2xl [&_[data-region]>button]:border-0! [&_[data-region]>button]:ring-offset-0! [&_[data-region]>button[aria-pressed=false]:hover]:border! [&_[data-region]>button[aria-pressed=false]:hover]:border-info! [&_[data-region]>button[aria-pressed=false]:focus-visible]:ring-1! [&_[data-region]>button[aria-pressed=false]:focus-visible]:ring-info! [&_[data-region]>button[aria-pressed=true]]:ring-2! [&_[data-region]>button[aria-pressed=true]]:ring-info!">
      {missing ? <div className="flex h-full items-center justify-center p-2 pr-16"><div data-missing-paper className="flex aspect-[210/297] h-full max-h-full max-w-full flex-col items-center justify-center gap-4 bg-card p-6 shadow-2xl"><FileImage className="size-10 text-muted-foreground" /><p className="text-ui-body">{emptyImageText}</p><p className="text-ui-hint text-muted-foreground">{emptyImageDetail}</p></div></div> : children}
    </div>
    <div className="d1-tool-dock rounded-r-xl shadow-lg" style={dockPosition}><div className="d1-tool-scroll">{tools}</div></div>
  </section>
}
