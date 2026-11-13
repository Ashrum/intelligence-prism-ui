"use client"
import { useLayoutEffect, useRef, useState } from "react"
import { ArrowUp, ArrowDown, RotateCw, Scan, Minus, Plus, Maximize, Minimize } from "lucide-react"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/coss/toolbar"
import { Button } from "../button"
import { PaperPreview, PaperPreviewSurface, clampPaperZoom, paperZoomPercent, rotatedPaperDimensions, type PaperPreviewPage, type PaperPreviewRotation, type PaperPreviewZoom, type PaperPreviewLocation } from "../paper-preview"
import { DemoSection } from "../demo-parts"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"
const imageUrl = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="820"><rect width="600" height="820" fill="white"/><path d="M40 90H560M40 120H560M40 360H560M40 720H560" stroke="black"/></svg>')}`
export const continuousPreviewPages: PaperPreviewPage[] = [{ id: 'full', dimensions: { width: 600, height: 820 }, imageUrl, alt: '完整扫描纸', regions: [{ id: 'answer', label: '完整推导过程与参数条件', rect: [10,20,80,25] }] }, { id: 'crop', dimensions: { width: 600, height: 260 }, alt: '裁切作答未提供' }]
export function ContinuousPreviewFixture() {
  const viewportRef = useRef<HTMLDivElement>(null), toolbarRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<PaperPreviewZoom>('width'), [rotations, setRotations] = useState<Record<string, PaperPreviewRotation>>({}), [page, setPage] = useState(0), [selected, setSelected] = useState('answer'), [location, setLocation] = useState<PaperPreviewLocation>()
  function locate(index: number) { setLocation(previous => ({ pageId: continuousPreviewPages[index].id, request: (previous?.request ?? 0) + 1 })) }
  return <div className="grid h-[560px]"><PaperPreviewSurface viewportRef={viewportRef} toolbarRef={toolbarRef} toolbar={<Toolbar ref={toolbarRef} orientation="vertical" aria-label="试卷工具" className="d1-tools surface-floating rounded-l-none rounded-r-xl flex-col items-center"><ToolbarGroup className="flex-col"><ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="上一纸" disabled={page === 0} onClick={() => locate(page - 1)}><ArrowUp /></ToolbarButton><output className="text-ui-meta">{page + 1} / 2</output><ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="下一纸" disabled={page === 1} onClick={() => locate(page + 1)}><ArrowDown /></ToolbarButton></ToolbarGroup><ToolbarSeparator orientation="horizontal" /><ToolbarGroup className="flex-col"><ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label={zoom === 'width' ? '适合页面' : '适合宽度'} onClick={() => setZoom(zoom === 'width' ? 'page' : 'width')}><Scan /></ToolbarButton><ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="旋转当前纸" onClick={() => { const id = continuousPreviewPages[page].id; setRotations(previous => ({ ...previous, [id]: ((previous[id] ?? 0) + 90) % 360 as PaperPreviewRotation })) }}><RotateCw /></ToolbarButton></ToolbarGroup></Toolbar>}>
    <PaperPreview layout="continuous" pages={continuousPreviewPages} zoom={zoom} onZoomChange={setZoom} rotation={rotations} selectedRegionId={selected} onRegionSelect={(_, id) => { setSelected(id); setLocation(previous => ({ regionId: id, request: (previous?.request ?? 0) + 1 })) }} continuous={{ viewportRef, onVisiblePage: setPage, location, spotlight: true, gap: 16, beforeContent: <section className="space-y-3 bg-card p-4 text-ui-body"><h3 className="text-block-title">题目内容</h3><p>请完整核对参数条件、推导过程与最终结论。</p>{reviewFormula}<Button variant="outline" onClick={() => setLocation(previous => ({ regionId: 'answer', request: (previous?.request ?? 0) + 1 }))}>定位作答区域</Button></section>, renderPageHeader: (_, index) => <header className="p-2 text-ui-meta">第 {index + 1} 份作答 · 外部身份信息</header> }} />
  </PaperPreviewSurface></div>
}
export function BottomPreviewFixture() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<PaperPreviewZoom>('width')
  const [viewport, setViewport] = useState({ width: 740, height: 828 })
  const [rotations, setRotations] = useState<Record<string, PaperPreviewRotation>>({})
  const [page, setPage] = useState(0)
  const [location, setLocation] = useState<PaperPreviewLocation>()
  const [fullscreen, setFullscreen] = useState(false)
  const current = continuousPreviewPages[page]
  const percent = paperZoomPercent(zoom, viewport, rotatedPaperDimensions(current.dimensions!, rotations[current.id] ?? 0))

  useLayoutEffect(() => {
    if (viewportRef.current) viewportRef.current.style.paddingBottom = 'var(--d1-dock-clearance)'
  }, [])

  function locate(index: number) {
    setLocation(previous => ({ pageId: continuousPreviewPages[index].id, request: (previous?.request ?? 0) + 1 }))
  }

  return <div className={fullscreen ? 'fixed inset-0 z-50 grid bg-background' : 'grid h-[560px] w-full max-w-[796px]'} onKeyDown={event => { if (event.key === 'Escape') setFullscreen(false) }}>
    <PaperPreviewSurface dock="bottom" viewportRef={viewportRef} toolbarRef={toolbarRef} toolbar={
      <Toolbar ref={toolbarRef} orientation="horizontal" aria-label="底部试卷工具" className="d1-tools surface-floating">
        <ToolbarGroup>
          <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="上一页" disabled={page === 0} onClick={() => locate(page - 1)}><ArrowUp /></ToolbarButton>
          <output className="text-ui-meta" aria-label="当前页码">{page + 1} / {continuousPreviewPages.length}</output>
          <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="下一页" disabled={page === continuousPreviewPages.length - 1} onClick={() => locate(page + 1)}><ArrowDown /></ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator orientation="vertical" />
        <ToolbarGroup>
          <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="缩小" disabled={percent <= 5} onClick={() => setZoom(clampPaperZoom(percent - 10))}><Minus /></ToolbarButton>
          <output className="text-ui-meta" aria-label="缩放比例">{Math.round(percent)}%</output>
          <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="放大" disabled={percent >= 300} onClick={() => setZoom(clampPaperZoom(percent + 10))}><Plus /></ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator orientation="vertical" />
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="旋转当前纸" onClick={() => setRotations(previous => ({ ...previous, [current.id]: ((previous[current.id] ?? 0) + 90) % 360 as PaperPreviewRotation }))}><RotateCw /></ToolbarButton>
        <ToolbarSeparator orientation="vertical" />
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label={fullscreen ? '退出全屏' : '全屏'} onClick={() => setFullscreen(previous => !previous)}>{fullscreen ? <Minimize /> : <Maximize />}</ToolbarButton>
      </Toolbar>
    }>
      <PaperPreview layout="continuous" pages={continuousPreviewPages} zoom={zoom} onZoomChange={setZoom} rotation={rotations} continuous={{ viewportRef, toolbarWidth: 0, onViewport: setViewport, onVisiblePage: setPage, location }} />
    </PaperPreviewSurface>
  </div>
}

export function ContinuousPaperPreviewDemo() {
  return <>
    <DemoSection title="连续纸张 · 侧签与纸外内容" description="独立宽高、旋转与可见纸；使用 Ctrl/⌘ 滚轮或双指缩放、拖动平移，侧签跟随纸边。"><ReviewDemoThemes>{() => <ContinuousPreviewFixture />}</ReviewDemoThemes></DemoSection>
    <DemoSection title="连续纸张 · 底部横排工具条" description="纸面满宽阅读，支持翻页、缩放、旋转与全屏。按 Esc 退出全屏。">
      <BottomPreviewFixture />
      <ReviewDemoThemes>{() => <BottomPreviewFixture />}</ReviewDemoThemes>
    </DemoSection>
  </>
}
