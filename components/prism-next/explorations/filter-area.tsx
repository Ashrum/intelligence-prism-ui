"use client"

import { useEffect, useState } from "react"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { ResourceFilterArea } from "./resource-filter-area"
import { applyFilterIntent, filterFixture, filterSortItems, previewFilterValue, type FilterScale } from "./fixtures/resource-filter-fixture"
import type { ResourceFilterAreaProps, ResourceFilterIntent } from "./resource-filter-types"

const variants = [
  { id: "A", title: "分面行", description: "逐行看见维度与候选，更多展开，多选确认。" },
  { id: "B", title: "筛选条 + 弹层", description: "常驻维度按钮，选项按需打开，控制纵向占用。" },
  { id: "C", title: "常用在外、其余进面板", description: "题型与难度常驻，其余通过全部筛选访问。" },
] as const

function Choices({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <div className="space-y-2"><p className="text-ui-action">{label}</p><ToggleGroup multiple={false} value={[value]} aria-label={label} className="flex-wrap" onValueChange={values => { if (values[0]) onChange(values[0]) }}>
    {options.map(option => <ToggleGroupItem key={option} value={option}>{option}</ToggleGroupItem>)}
  </ToggleGroup></div>
}

function Comparison({ variant, width, dimensions, sortItems, scale }: Pick<ResourceFilterAreaProps, "dimensions" | "sortItems"> & { variant: typeof variants[number]; width: number; scale: FilterScale }) {
  const [value, setValue] = useState(() => previewFilterValue(scale))
  const [intents, setIntents] = useState<ResourceFilterIntent[]>([])
  useEffect(() => {
    setValue(previous => sortItems.some(item => item.id === previous.sort) ? previous : { ...previous, sort: "relevance" })
  }, [sortItems])
  const onIntent = (intent: ResourceFilterIntent) => {
    setIntents(previous => [...previous.slice(-7), intent])
    setValue(previous => applyFilterIntent(previous, intent))
  }
  // The reduced sort set includes the same default; a hidden current sort is reset by the host.
  const presentedValue = sortItems.some(item => item.id === value.sort) ? value : { ...value, sort: "relevance" }
  return <section id={`filter-${variant.id}`} className="min-w-0 scroll-mt-4 space-y-3" aria-label={`${variant.id} 版${variant.title}`}>
    <div><div className="flex flex-wrap items-center gap-4"><h2 className="text-block-title">{variant.id} · {variant.title}</h2><nav aria-label={`${variant.id} 版跳转`} className="flex gap-3 text-ui-hint">{variants.map(item => <a key={item.id} href={`#filter-${item.id}`} className="underline">跳到 {item.id}</a>)}</nav></div><p className="text-ui-hint">{variant.description}</p></div>
    <div className="max-w-full" style={{ width }} data-exploration-width={width}>
      <ResourceFilterArea variant={variant.id} dimensions={dimensions} sortItems={sortItems} value={presentedValue} resultCount={128} favoriteCount={23} onIntent={onIntent} />
    </div>
    <div className="max-w-full space-y-2 text-ui-hint" style={{ width }}>
      <p role="status">宿主收到：{intents.length ? JSON.stringify(intents.at(-1)) : "尚无意图"}</p>
      <details><summary>当前筛选状态与最近意图</summary><pre className="mt-2 whitespace-pre-wrap break-all text-ui-hint">{JSON.stringify({ value: presentedValue, intents }, null, 2)}</pre></details>
    </div>
  </section>
}

export function FilterAreaExploration() {
  const [width, setWidth] = useState("720")
  const [scale, setScale] = useState<FilterScale>("future")
  const [counts, setCounts] = useState(true)
  const [sortSet, setSortSet] = useState("综合 / 最新 / 热门 / 难度")
  const dimensions = filterFixture(scale, counts)
  const sortItems = sortSet === "综合 / 最新" ? filterSortItems.slice(0, 2) : filterSortItems
  return <div className="space-y-8">
    <div className="flex flex-wrap items-end gap-4">
      <Choices label="容器宽度（px）" value={width} options={["520", "720", "960"]} onChange={setWidth} />
      <Choices label="数据规模" value={scale === "current" ? "现在的规模" : "将来的规模"} options={["现在的规模", "将来的规模"]} onChange={value => setScale(value === "现在的规模" ? "current" : "future")} />
      <Choices label="排序项集合" value={sortSet} options={["综合 / 最新", "综合 / 最新 / 热门 / 难度"]} onChange={setSortSet} />
      <Toggle pressed={counts} onPressedChange={setCounts}>提供选项数量</Toggle>
    </div>
    <p className="text-ui-hint">三版共用组件示例数据，各自记录选择。切换规模会重置；其余开关保留筛选。128 题与收藏 23 题为固定夹具事实，不随操作模拟查询结果。选项包含 0 与未提供数量；取消数量开关后组件不推定可用性。所选宽度就是筛选区宽度，窄窗口以实际可用宽度为准。</p>
    <div className="space-y-10">{variants.map(variant => <Comparison key={`${scale}:${variant.id}`} variant={variant} scale={scale} width={Number(width)} dimensions={dimensions} sortItems={sortItems} />)}</div>
  </div>
}
