"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Button } from "../button"
import { DemoSection } from "../demo-parts"
import type { DocumentRegion } from "../document-region-viewer"
import { PaperPreview, documentRectToPaperRegion, locatePaperTarget, paperRegionToDocumentRect, type PaperPreviewRegionChange, type PaperPreviewRotation, type PaperPreviewZoom } from "../paper-preview"
import { continuousPreviewPages } from "./paper-preview-continuous"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"

const initialRegions = (): Record<string, DocumentRegion[]> => ({
  full: [{ id: "answer-full", label: "完整推导过程、参数条件与最终结论的作答区域", rect: [10, 20, 80, 25] }],
  second: [],
})

export function RegionEditingPreviewFixture() {
  const viewport = useRef<HTMLDivElement>(null), createButton = useRef<HTMLButtonElement>(null), focusAfterCreate = useRef(false)
  const [regions, setRegions] = useState(initialRegions), [pageId, setPageId] = useState("full")
  const [mode, setMode] = useState<"create" | "adjust" | null>("adjust"), [mixed, setMixed] = useState(false)
  const [zoom, setZoom] = useState<PaperPreviewZoom>("width"), [rotation, setRotation] = useState<PaperPreviewRotation>(0)
  const [notice, setNotice] = useState("可拖动区域或八个手柄调整范围。"), [request, setRequest] = useState(0)
  const current = regions[pageId][0]
  const label = "完整推导过程、参数条件与最终结论的作答区域"
  const pages = ["full", "second"].map((id, index) => ({ ...continuousPreviewPages[0], id, alt: `示例原卷第 ${index + 1} 页`, regions: regions[id] }))
  function accept(change: PaperPreviewRegionChange) {
    const id = change.regionId ?? `answer-${change.pageId}`
    setRegions(previous => ({ ...previous, [change.pageId]: [{ id, label: change.label, rect: paperRegionToDocumentRect(change.rect) }] }))
    if (change.regionId === null) { focusAfterCreate.current = true; setMode("adjust") }
    setNotice("当前示例已更新区域，未保存到服务。")
  }
  useLayoutEffect(() => {
    if (!focusAfterCreate.current) return
    viewport.current?.querySelector<HTMLElement>("[data-editable-region]")?.focus({ preventScroll: true })
    focusAfterCreate.current = false
  }, [regions])
  useLayoutEffect(() => {
    if (mixed && request) locatePaperTarget(viewport.current, { pageId })
  }, [request]) // Only explicit page/reset actions locate; switching layout keeps its natural reading start.
  const regionEditing = mode ? { pageId, regionId: mode === "create" ? null : current?.id ?? "missing", label, onChange: accept, onCreate: accept } : undefined
  function selectPage(id: string) { setPageId(id); setMode(regions[id].length ? "adjust" : "create"); setRequest(value => value + 1) }
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2" role="group" aria-label="区域编辑操作">
      <Button ref={createButton} variant={mode === "create" ? "default" : "outline"} aria-pressed={mode === "create"} onClick={() => setMode("create")}>框选作答区域</Button>
      <Button variant="outline" disabled={!current} aria-pressed={mode === "adjust"} onClick={() => setMode("adjust")}>调整已有区域</Button>
      <Button variant="outline" disabled={mode === null} onClick={() => { setMode(null); setNotice("已退出区域编辑，可拖动平移页面。"); createButton.current?.focus() }}>退出编辑</Button>
      <Button variant="outline" onClick={() => { setRegions(initialRegions()); setPageId("full"); setMode("adjust"); setRequest(value => value + 1); setNotice("区域已重置为示例初始范围。") }}>重置区域</Button>
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="原卷查看操作">
      <Button variant="outline" aria-pressed={pageId === "full"} onClick={() => selectPage("full")}>第 1 页</Button>
      <Button variant="outline" aria-pressed={pageId === "second"} onClick={() => selectPage("second")}>第 2 页</Button>
      <Button variant="outline" onClick={() => setRotation(value => (value + 90) % 360 as PaperPreviewRotation)}>旋转 {rotation}°</Button>
      <Button variant="outline" onClick={() => setZoom(zoom === "width" ? "page" : "width")}>{zoom === "width" ? "适合页面" : "适合宽度"}</Button>
      <Button variant="outline" onClick={() => setZoom(150)}>放大至 150%</Button>
      <Button variant="outline" aria-pressed={mixed} onClick={() => setMixed(value => !value)}>数字与扫描混排</Button>
    </div>
    <p className="text-ui-hint">拖动框选，或聚焦框选区按 Enter 新建；聚焦区域后用方向键移动，Shift 加方向键调整，Esc 取消当前拖动。双指可缩放。</p>
    <div className="h-[560px] min-w-0 overflow-hidden">
      {mixed ? <PaperPreview layout="mixed" mixed={{ viewportRef: viewport, pages: [{ id: "digital", width: 600, height: 1, content: <section className="space-y-3 bg-card p-4 text-ui-body"><h3 className="text-block-title">题目内容</h3><p>数字内容不支持框选，请在下方原卷上标记完整作答范围。</p>{reviewFormula}</section> }, ...pages.map(page => ({ ...page, width: 600, height: 820 }))], zoom, rotations: { full: rotation, second: rotation }, selected: current?.id ?? "", scale: 1, activePage: pageId, topInset: 0, headers: {}, answerLabel: "示例原卷", onSelect() {}, onZoom: setZoom, onVisiblePage() {}, onViewport() {}, regionEditing }} />
        : <PaperPreview pages={pages} zoom={zoom} onZoomChange={setZoom} rotation={{ full: rotation, second: rotation }} regionEditing={regionEditing} continuous={{ viewportRef: viewport, location: { pageId, request }, renderPageHeader: (_, index) => <p className="p-2 text-ui-meta">示例原卷 · 第 {index + 1} 页</p> }} />}
    </div>
    <output aria-label="当前归一化坐标" className="block break-words text-ui-body tabular-nums">{current ? `x / y / 宽 / 高：${documentRectToPaperRegion(current.rect).map(value => value.toFixed(3)).join(" / ")}` : "当前页尚未框选作答区域"}</output>
    <p role="status" className="text-ui-hint">{notice}</p>
  </div>
}

export function RegionEditingPaperPreviewDemo() {
  return <DemoSection title="框选作答区域" description="在原卷上新建或调整范围；示例中的区域只保留在当前页面，支持两页连续阅读、旋转与数字内容混排。"><ReviewDemoThemes>{() => <RegionEditingPreviewFixture />}</ReviewDemoThemes></DemoSection>
}
