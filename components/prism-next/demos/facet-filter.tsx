"use client"

import { DemoSection } from "@/components/prism-next/demo-parts"
import { useState } from "react"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { DifficultyMix, difficultySwatches } from "../difficulty-mix"
import { initialFilterValue } from "./fixtures/facet-filter"
import { FacetFilter } from "../facet-filter"
import { applyFilterIntent, filterFixture, filterSortItems, previewFilterValue, type FilterScale } from "./fixtures/facet-filter"
import type { FacetFilterProps, FacetFilterIntent } from "@/components/prism-next/facet-filter-types"

function Choices({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <div className="space-y-2"><p className="text-ui-action">{label}</p><ToggleGroup multiple={false} value={[value]} aria-label={label} className="flex-wrap" onValueChange={values => { if (values[0]) onChange(values[0]) }}>
    {options.map(option => <ToggleGroupItem key={option} value={option}>{option}</ToggleGroupItem>)}
  </ToggleGroup></div>
}

function FilterPreview({ width, dimensions, sortItems, scale, showFavorites, countUnit, results, collapsible }: Pick<FacetFilterProps, "dimensions" | "sortItems" | "showFavorites" | "countUnit" | "results" | "collapsible"> & { width: number; scale: FilterScale }) {
  const [value, setValue] = useState(() => previewFilterValue(scale))
  const [intents, setIntents] = useState<FacetFilterIntent[]>([])
  const onIntent = (intent: FacetFilterIntent) => {
    setIntents(previous => [...previous.slice(-7), intent])
    setValue(previous => applyFilterIntent(previous, intent))
  }
  return <section id="filter-C" className="min-w-0 scroll-mt-4 space-y-3" aria-label="常用在外、其余进面板">
    <div><h2 className="text-block-title">常用在外、其余进面板</h2><p className="text-ui-hint">最多三个常用维度常驻；有剩余维度时提供全部筛选入口。</p></div>
    <div className="max-w-full" style={{ width }} data-demo-width={width}>
      <FacetFilter results={results} collapsible={collapsible} countUnit={countUnit} showFavorites={showFavorites} dimensions={dimensions} sortItems={sortItems} value={value} resultCount={128} favoriteCount={23} onIntent={onIntent} />
    </div>
    <div className="max-w-full space-y-2 text-ui-hint" style={{ width }}>
      <p role="status">宿主收到：{intents.length ? JSON.stringify(intents.at(-1)) : "尚无意图"}</p>
      <details><summary>当前筛选状态与最近意图</summary><pre className="mt-2 whitespace-pre-wrap break-all text-ui-hint">{JSON.stringify({ value, intents }, null, 2)}</pre></details>
    </div>
  </section>
}

export function FacetFilterDemo() {
  const [width, setWidth] = useState("720")
  const [scale, setScale] = useState<FilterScale>("future")
  const [countUnit, setCountUnit] = useState("题")
  const [counts, setCounts] = useState(true)
  const [showFavorites, setShowFavorites] = useState(true)
  const [embedded, setEmbedded] = useState(false)
  const [allCommon, setAllCommon] = useState(false)
  const dimensions = filterFixture(scale, counts).map(dimension => allCommon ? { ...dimension, common: true } : dimension)
  const sortItems = filterSortItems
  return <DemoSection title="常用维度与全部筛选" description="宿主提供受控值与题数；可切换规模、宽度，在页面顶部切换三主题。"><div className="space-y-8">
    <div className="flex flex-wrap items-end gap-4">
      <Choices label="容器宽度（px）" value={width} options={["520", "720", "960"]} onChange={setWidth} />
      <Choices label="数据规模" value={scale === "current" ? "现在的规模" : "将来的规模"} options={["现在的规模", "将来的规模"]} onChange={value => setScale(value === "现在的规模" ? "current" : "future")} />
      <Choices label="计数单位" value={countUnit} options={["题", "份试卷"]} onChange={setCountUnit} />
      <Toggle pressed={showFavorites} onPressedChange={setShowFavorites}>显示收藏开关</Toggle>
      <Toggle pressed={allCommon} onPressedChange={setAllCommon}>所有维度标为常用</Toggle>
      <Toggle pressed={embedded} onPressedChange={setEmbedded}>嵌入抽屉（不带结果栏、不可收起）</Toggle>
      <Toggle pressed={counts} onPressedChange={setCounts}>提供选项数量</Toggle>
    </div>
    <p className="text-ui-hint">使用组件示例数据。切换规模会重置；其余开关保留筛选。128 {countUnit}与收藏 23 {countUnit}为固定夹具事实，不随操作模拟查询结果。选项包含 0 与未提供数量；取消数量开关后组件不推定可用性。所选宽度就是筛选区宽度，窄窗口以实际可用宽度为准。</p>
    <p className="text-ui-hint">countUnit 默认“题”；选择“份试卷”后，结果数与选项可访问名称使用试卷单位。数量仍由宿主提供。</p>
    <ResourcePanelExample />
    <FilterPreview results={!embedded} collapsible={!embedded} countUnit={countUnit} showFavorites={showFavorites} key={scale} scale={scale} width={Number(width)} dimensions={dimensions} sortItems={sortItems} />
  </div></DemoSection>
}

function ResourcePanelExample() {
  const [value, setValue] = useState(initialFilterValue)
  const dimensions: FacetFilterProps["dimensions"] = [
    { id: "type", label: "类型", mode: "single", options: [{ id: "practice", label: "同步练习", count: 29 }, { id: "unit", label: "单元测试", count: 5 }, { id: "advanced", label: "单元提升卷", count: 5 }] },
    { id: "difficulty", label: "难度", mode: "single", options: [{ id: "basic", label: "基础", count: 21, swatch: difficultySwatches.basic }, { id: "consolidate", label: "巩固", count: 18, swatch: difficultySwatches.consolidate }, { id: "advance", label: "提升", count: 0, swatch: difficultySwatches.advance }] },
    { id: "source", label: "来源", mode: "single", options: [{ id: "school", label: "本校", count: 39 }, { id: "joint", label: "联考", count: 0 }, { id: "institute", label: "教研院", count: 0 }, { id: "exam", label: "考试中心", count: 0 }] },
    { id: "year", label: "年份", mode: "single", options: [{ id: "2026", label: "2026", count: 39 }, { id: "2025", label: "2025", count: 0 }, { id: "2024", label: "2024", count: 0 }] },
    { id: "region", label: "地区", mode: "single", options: ["东澜市", "临江市", "云岫市", "启明区"].map(label => ({ id: label, label, count: 0 })) },
  ]
  return <section className="space-y-3" aria-label="试卷筛选面板">
    <h2 className="text-block-title">试卷筛选面板</h2>
    <FacetFilter appearance="panel" dimensions={dimensions} value={value} sortItems={[]} results={false} countUnit="份试卷" onIntent={intent => setValue(previous => applyFilterIntent(previous, intent))} />
    <h3 className="text-item-title">难度构成</h3>
    <DifficultyMix basic={5} consolidate={5} advance={2} />
    <DifficultyMix basic={0} consolidate={10} advance={2} />
    <DifficultyMix basic={0} consolidate={0} advance={0} />
    <a className="text-ui-body underline" href="/next/components/difficulty-mix">查看 DifficultyMix 契约与示例</a>
  </section>
}
