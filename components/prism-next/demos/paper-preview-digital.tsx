"use client"
import { useId, useRef, useState } from "react"
import { Button } from "../button"
import { DemoSection } from "../demo-parts"
import { QuestionRail, type QuestionRailSection } from "../question-rail"
import { PaperPreview, type PaperPreviewMixedPage } from "../paper-preview"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"

const sections: QuestionRailSection[] = [
  { id: "choice", label: "一、选择题", layout: "cell", pages: [{ id: "choice", items: [{ id: "1", number: 1, value: "5 分", tone: "neutral", ariaLabel: "第 1 题，5 分", tooltip: "第 1 题，5 分" }] }] },
  { id: "written", label: "二、解答题", layout: "row", pages: [{ id: "written", items: [{ id: "2", number: 2, value: "12 分", tone: "neutral", ariaLabel: "第 2 题，12 分，请完整说明参数条件和推导结论", tooltip: <>长中文推导条件与公式 {reviewFormula}</> }] }] },
]
export function DigitalQuestionRailFixture() {
  const panelId = useId()
  const [selected, setSelected] = useState("1"), [showFilters, setShowFilters] = useState(false), [showOverview, setShowOverview] = useState(false)
  const [filter, setFilter] = useState("all"), [notice, setNotice] = useState("")
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2"><Button variant="outline" aria-pressed={showFilters} onClick={() => setShowFilters(!showFilters)}>显示筛选</Button><Button variant="outline" aria-pressed={showOverview} onClick={() => setShowOverview(!showOverview)}>显示概览</Button></div>
    <div className="h-96"><QuestionRail panelId={panelId} title="试卷题目" label="试卷题目栏" listLabel="选择试卷题目" sections={showFilters && filter === "written" ? sections.slice(1) : sections} selected={selected} onSelect={setSelected} onLocate={() => setNotice(`已请求定位第 ${selected} 题`)} onPage={id => setNotice(`已请求定位分节 ${id}`)}
      {...(showFilters ? { filters: [{ value: "all", label: "全部", ariaLabel: "全部题目，共 2 题" }, { value: "written", label: "解答题", ariaLabel: "解答题，共 1 题" }], filter, onFilterChange: setFilter } : {})}
      {...(showOverview ? { overview: { segments: [], text: "全卷 2 题 · 17 分", label: "试卷概览" } } : {})} /></div>
    <p role="status" className="text-ui-hint">{notice || `当前选择第 ${selected} 题；Enter 请求定位。`}</p>
  </div>
}
export function DigitalPaperPreviewFixture() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [headersVisible, setHeadersVisible] = useState(true)
  const pages: PaperPreviewMixedPage[] = sections.map((section, index) => ({ id: section.id, width: 794, height: 1, content: <article className="space-y-3 bg-card p-4 text-read-body"><p>第 {index + 1} 题：请完整说明参数条件、等价变形依据与最终推导结论。</p>{reviewFormula}</article> }))
  return <div className="space-y-3">
    <Button variant="outline" aria-pressed={headersVisible} onClick={() => setHeadersVisible(!headersVisible)}>显示分节标题与页眉</Button>
    <p className="text-ui-hint text-muted-foreground">数字卷面不提供缩放与旋转，按可用宽度阅读。</p>
    <div className="h-[520px] min-w-0 overflow-hidden"><PaperPreview layout="mixed" mixed={{ viewportRef, pages, zoom: "width", rotations: {}, selected: "", scale: 1, activePage: "choice", topInset: 0, label: "试卷连续画布", headers: headersVisible ? { choice: <p className="text-ui-hint">共 1 题 · 5 分</p>, written: <p className="text-ui-hint">共 1 题 · 12 分</p> } : {}, renderSectionHeading: headersVisible ? (_page, index) => <h2 className="text-block-title">{sections[index].label}</h2> : undefined, onSelect() {}, onZoom() {}, onVisiblePage() {}, onViewport() {} }} /></div>
  </div>
}
export function DigitalPaperPreviewDemo() {
  return <><DemoSection title="纯题目栏 · 可选筛选与概览" description="默认只显示标题和分节列表；分别打开筛选或概览，不需要批阅数据。"><ReviewDemoThemes>{() => <DigitalQuestionRailFixture />}</ReviewDemoThemes></DemoSection><DemoSection title="数字分节标题与画布名称" description="沿用 renderSectionHeading 与 headers，顺序为分节标题、页眉、数字正文；画布名称由宿主给定。"><ReviewDemoThemes>{() => <DigitalPaperPreviewFixture />}</ReviewDemoThemes></DemoSection></>
}
