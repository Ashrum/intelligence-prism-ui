"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { AgentImageCanvas, type AgentCanvasImage, type AgentImageCanvasIntent, type AgentImageCapabilities } from "../agent-image-canvas"
import { Button } from "../button"

// Original schematic assets, not real scans or student work. No external resources.
function sheet(page: number, kind: "scan" | "answer" | "illustration" = "scan") {
  const content = kind === "illustration"
    ? '<path d="M80 320L300 80L460 320Z" fill="none" stroke="#354658" stroke-width="4"/><circle cx="300" cy="230" r="80" fill="none" stroke="#354658" stroke-width="3"/>'
    : `<g transform="${page === 2 ? "rotate(4 300 420)" : "translate(0 0)"}" ${page === 3 ? 'filter="url(#blur)"' : ""}><text x="60" y="85" font-size="26">${kind === "answer" ? "学生作答（模拟）" : `扫描示意 · 第 ${page} 页`}</text><path d="M60 110H540M60 230H540M60 420H540M60 610H540" stroke="#8995a0"/><text x="65" y="185" font-size="22">1. y = (1/2)x²</text><text x="65" y="310" font-size="22">2. a² + b² = c²</text><path d="M80 360L210 270L330 370L440 290" fill="none" stroke="#354658" stroke-width="3"/><text x="65" y="505" font-size="22">3. 说明推理过程</text></g>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${kind === "illustration" ? 400 : 840}" viewBox="0 0 600 ${kind === "illustration" ? 400 : 840}"><defs><filter id="blur"><feGaussianBlur stdDeviation="2.5"/></filter></defs><rect width="100%" height="100%" fill="#fff"/><g fill="#233140" font-family="sans-serif">${content}</g></svg>`)}`
}
const base = { width: 600, height: 840, version: { id: "example-v1", label: "示例第一版" }, source: { label: "人工绘制示意图", openable: true }, availability: { state: "available" } as const }
export const imageCanvasExamples: readonly AgentCanvasImage[] = [
  ...[1, 2, 3, 4].map(page => ({ ...base, id: `scan-${page}`, name: `扫描第 ${page} 页${page === 2 ? "（倾斜）" : page === 3 ? "（模糊）" : ""}`, src: sheet(page), alt: `模拟试卷第 ${page} 页，${page === 2 ? "页面倾斜" : page === 3 ? "文字模糊" : "含公式与答题横线"}`,
    regions: page === 1 ? [
      { id: "example-a", label: "第 1 题：函数表达式与作答区域", rect: [10, 16, 80, 12] as [number, number, number, number], source: "example" as const },
      { id: "example-b", label: "第 2 题：勾股定理推理与辅助图形区域", rect: [10, 31, 80, 19] as [number, number, number, number], source: "example" as const },
    ] : [],
  })),
  { ...base, id: "answer", name: "学生作答图（模拟）", src: sheet(1, "answer"), alt: "模拟学生作答，包含函数式、折线与推理横线。", regions: [{ id: "answer-area", label: "第 1 题作答区", rect: [10, 15, 80, 13], source: "teacher" }] },
  { ...base, id: "illustration", name: "教学插图（说明待补）", height: 400, src: sheet(1, "illustration"), alt: null },
  { ...base, id: "unavailable", name: "待补充的截图", src: undefined, alt: "课堂课件截图", availability: { state: "unavailable", reason: "原图片暂不可用，请补充来源。" } },
]
export const imageCanvasCapabilities: AgentImageCapabilities = { view: { supported: true }, zoom: { supported: true }, annotate: { supported: true }, crop: { supported: false, reason: "当前未连接裁切工具，可继续查看和标注。" }, compose: { supported: true } }

export function AgentImageCanvasDemo() {
  const [images, setImages] = useState(imageCanvasExamples)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(images[0].id)
  const [comparisonIds, setComparisonIds] = useState<readonly string[]>([])
  const [view, setView] = useState<"inline" | "workspace">("inline")
  const [compact, setCompact] = useState(false), [narrow, setNarrow] = useState(false), [crop, setCrop] = useState(false)
  const [feedback, setFeedback] = useState("全部为模拟图片，刷新后还原。")
  const panel = useRef<HTMLDivElement>(null)
  const nextRegion = useRef(0), previousView = useRef(view)
  useLayoutEffect(() => {
    if (previousView.current === view) return
    previousView.current = view
    if (view === "workspace") (panel.current?.querySelector<HTMLElement>(".review-sheet-viewport") ?? panel.current)?.focus()
    else [...panel.current?.querySelectorAll<HTMLButtonElement>("button") ?? []].find(button => button.textContent === "查看大图")?.focus()
  }, [view])
  const onIntent = (intent: AgentImageCanvasIntent) => {
    if (intent.imageSetId !== "example-images" || intent.version !== "example-v1") return
    if (intent.type === "select-image") setSelectedImageId(intent.imageId)
    if (intent.type === "compare") setComparisonIds(intent.images.map(item => item.imageId))
    if (intent.type === "annotate-create" || intent.type === "annotate-update" || intent.type === "annotate-delete") {
      const createdId = `example-region-${++nextRegion.current}`
      setImages(items => items.map(item => item.id !== intent.imageId ? item : { ...item, regions: intent.type === "annotate-create"
        ? [...(item.regions ?? []), { ...intent.region, id: createdId }]
        : intent.type === "annotate-update" ? (item.regions ?? []).map(region => region.id === intent.regionId ? { ...region, rect: intent.rect, label: intent.label, source: "teacher" } : region)
          : (item.regions ?? []).filter(region => region.id !== intent.regionId) }))
      setFeedback("已调整本次示例标注，原图保持不变；尚未保存。")
    }
    if (intent.type === "crop-request") setFeedback("已请求裁切；示例不会生成新图片。")
    if (intent.type === "open-source") setFeedback("来源为本页人工绘制的示意图，没有外部原稿。")
  }
  return <section id="image-canvas" className="min-w-0 space-y-5 py-6">
    <h2 className="text-section-title">图像查看与画布</h2>
    <p className="text-ui-body">四页扫描、学生作答、教学插图与不可用截图。只用于演示查看与范围选择。</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" aria-pressed={compact} onClick={() => setCompact(value => !value)}>紧凑密度</Button>
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
      <Button type="button" variant="outline" aria-pressed={crop} onClick={() => setCrop(value => !value)}>演示裁切范围选择</Button>
    </div>
    <p role="status" className="text-ui-hint">{feedback}</p>
    <div ref={panel} tabIndex={-1} aria-label="图片材料示例" className={narrow ? "min-w-0 w-full max-w-[320px]" : "min-w-0"}>
      <AgentImageCanvas title="图片材料（模拟）" imageSet={{ id: "example-images", version: "example-v1" }} images={images} selectedImageId={selectedImageId} comparisonIds={comparisonIds}
        capabilities={{ ...imageCanvasCapabilities, crop: crop ? { supported: true } : imageCanvasCapabilities.crop }} view={view} density={compact ? "compact" : "default"} onIntent={onIntent}
        onExpand={() => setView("workspace")} onBack={() => setView("inline")}
        details={<p>倾斜、模糊与区域均为人工示例，不表示识别结果。并列比较不会合成图片；示例标注仅在本次页面中保留。</p>} />
    </div>
  </section>
}
