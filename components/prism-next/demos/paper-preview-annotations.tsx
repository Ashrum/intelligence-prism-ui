"use client"

import { useState } from "react"
import { Button } from "../button"
import { DemoSection } from "../demo-parts"
import { PaperPreview, PaperAnnotationLayer, PaperAnnotationCalibration, paperDimensions, type PaperAnnotation, type PaperPreviewRotation, type PaperPreviewZoom } from "../paper-preview"
import { ReviewDemoThemes } from "./review-workspace-fixtures"

export const annotationDemoFacts: PaperAnnotation[] = [
  { id: "1", page: 1, rect: { x: .08, y: .18, width: .65, height: .10 }, mark: "correct", score: { earned: 5, full: 5 } },
  { id: "2", page: 1, rect: { x: .08, y: .36, width: .65, height: .10 }, mark: "partial", score: { earned: 4, full: 5 }, note: "未说明 x² + y² = 1 的适用条件，请补充参数范围。" },
  { id: "3", page: 1, rect: { x: .08, y: .54, width: .40, height: .10 }, mark: "wrong", score: { earned: 2, full: 5 }, note: "移项时遗漏负号，后续推导不成立。请逐步检查每一个等价变形，说明分母不为零的条件，再验证最终结论是否符合原题定义域。该长中文说明用于演示三行省略和完整错因查看，不代表真实学生作答。" },
  { id: "4", page: 1, rect: { x: .08, y: .74, width: .65, height: .10 }, mark: "blank", score: { earned: 0, full: 5 }, note: "本题未作答。" },
]
const total = { earned: 86, full: 100, page: 1 } as const
const questions = ["1. 计算：2 + 3 = ____", "2. 写出 x² + y² = 1 的参数条件。", "3. 解方程并说明等价变形的依据。", "4. 证明题：请写出完整推导过程。"]
function scanImage(width: number, height: number) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 800 ${800 * height / width}"><rect width="100%" height="100%" fill="white"/><g fill="#1F2328" font-family="sans-serif"><text x="64" y="70" font-size="22">原卷示意 · 数学练习</text>${questions.map((text, i) => `<text x="64" y="${[.18,.36,.54,.74][i] * 800 * height / width + 18}" font-size="16">${text}</text><text x="80" y="${[.18,.36,.54,.74][i] * 800 * height / width + 52}" font-size="16">${["5", "x = cos t，y = sin t", "x = −2", ""][i]}</text>`).join("")}</g></svg>`)}`
}
export function AnnotationPreviewFixture() {
  const [visible, setVisible] = useState(true), [view, setView] = useState<"scan" | "layer" | "calibration">("scan")
  const [size, setSize] = useState<"A4" | "A3">("A4"), [landscape, setLandscape] = useState(false)
  const [rotation, setRotation] = useState<PaperPreviewRotation>(0), [zoom, setZoom] = useState<PaperPreviewZoom>("width")
  const [offset, setOffset] = useState(false), [left, setLeft] = useState(false)
  const dimensions = paperDimensions(size, landscape ? "landscape" : "portrait")
  const pageSize = { width: (landscape ? (size === "A4" ? 297 : 420) : (size === "A4" ? 210 : 297)), height: (landscape ? (size === "A4" ? 210 : 297) : (size === "A4" ? 297 : 420)) }
  const paperTotal = { ...total, anchor: left ? "top-left" as const : "top-right" as const }
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2" role="group" aria-label="批阅图层演示">
      <Button variant="outline" aria-pressed={visible} onClick={() => setVisible(v => !v)}>批阅图层{visible ? "：显示" : "：隐藏"}</Button>
      {([['scan', '原卷与图层'], ['layer', '仅图层'], ['calibration', '校准页']] as const).map(([id, label]) => <Button key={id} variant="outline" aria-pressed={view === id} onClick={() => setView(id)}>{label}</Button>)}
      <Button variant="outline" onClick={() => setSize(v => v === "A4" ? "A3" : "A4")}>{size}</Button>
      <Button variant="outline" onClick={() => setLandscape(v => !v)}>{landscape ? "横向" : "纵向"}</Button>
      <Button variant="outline" onClick={() => setZoom(v => v === "width" ? 100 : "width")}>{zoom === "width" ? "适合宽度" : "100%"}</Button>
      <Button variant="outline" onClick={() => setRotation(v => (v + 90) % 360 as PaperPreviewRotation)}>旋转 {rotation}°</Button>
      <Button variant="outline" aria-pressed={offset} onClick={() => setOffset(v => !v)}>套打偏移{offset ? "：右 2 / 下 3 mm" : "：0 mm"}</Button>
      <Button variant="outline" onClick={() => setLeft(v => !v)}>总分{left ? "左上" : "右上"}</Button>
    </div>
    <p className="text-ui-hint">示意原卷与批阅事实。错因最多显示三行，悬停或聚焦可读全文。套打偏移仅作用于独立图层和校准页。</p>
    {view === "scan" ? <div className="grid h-[600px]"><PaperPreview pages={[{ id: "annotated-scan", dimensions, imageUrl: scanImage(dimensions.width, dimensions.height), alt: "数学原卷示意，含四题与示例作答" }]} zoom={zoom} onZoomChange={setZoom} rotation={{ "annotated-scan": rotation }} annotations={annotationDemoFacts} annotationsVisible={visible} paperTotal={paperTotal} /></div>
      : <div className="overflow-auto"><div className="relative bg-white" style={{ width: zoom === "width" ? "100%" : `${pageSize.width}mm`, aspectRatio: `${pageSize.width} / ${pageSize.height}` }}>
        {view === "layer" ? <PaperAnnotationLayer annotations={annotationDemoFacts} annotationsVisible={visible} paperTotal={paperTotal} page={1} pageSize={pageSize} offset={offset ? { x: 2, y: 3 } : undefined} style={{ width: "100%", height: "100%" }} /> : <PaperAnnotationCalibration pageSize={pageSize} offset={offset ? { x: 2, y: 3 } : undefined} style={{ width: "100%", height: "100%" }} />}
      </div></div>}
    <p className="text-ui-meta">白纸为示例宿主背景，导出的图层自身透明。仅图层/校准页由宿主独立排版打印，纸型一致、100% 实际大小、零页边距、关闭页眉页脚；先校准再套打。</p>
  </div>
}
export function AnnotationPaperPreviewDemo() {
  return <DemoSection title="原卷批阅图层与套打校准" description="四种判定、题目得分、完整错因与外部总分；复用同一绘制入口，不计算评分。">
    <AnnotationPreviewFixture />
    <ReviewDemoThemes>{() => <AnnotationPreviewFixture />}</ReviewDemoThemes>
  </DemoSection>
}
