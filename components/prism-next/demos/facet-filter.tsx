"use client"

import { DemoSection } from "@/components/prism-next/demo-parts"
import { useState } from "react"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { FacetFilter } from "../facet-filter"
import { applyFilterIntent, filterFixture, filterSortItems, previewFilterValue, type FilterScale } from "./fixtures/facet-filter"
import type { FacetFilterProps, FacetFilterIntent } from "@/components/prism-next/facet-filter-types"

function Choices({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <div className="space-y-2"><p className="text-ui-action">{label}</p><ToggleGroup multiple={false} value={[value]} aria-label={label} className="flex-wrap" onValueChange={values => { if (values[0]) onChange(values[0]) }}>
    {options.map(option => <ToggleGroupItem key={option} value={option}>{option}</ToggleGroupItem>)}
  </ToggleGroup></div>
}

function FilterPreview({ width, dimensions, sortItems, scale }: Pick<FacetFilterProps, "dimensions" | "sortItems"> & { width: number; scale: FilterScale }) {
  const [value, setValue] = useState(() => previewFilterValue(scale))
  const [intents, setIntents] = useState<FacetFilterIntent[]>([])
  const onIntent = (intent: FacetFilterIntent) => {
    setIntents(previous => [...previous.slice(-7), intent])
    setValue(previous => applyFilterIntent(previous, intent))
  }
  return <section id="filter-C" className="min-w-0 scroll-mt-4 space-y-3" aria-label="常用在外、其余进面板">
    <div><h2 className="text-block-title">常用在外、其余进面板</h2><p className="text-ui-hint">题型与难度常驻，其余通过全部筛选访问。</p></div>
    <div className="max-w-full" style={{ width }} data-demo-width={width}>
      <FacetFilter dimensions={dimensions} sortItems={sortItems} value={value} resultCount={128} favoriteCount={23} onIntent={onIntent} />
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
  const [counts, setCounts] = useState(true)
  const dimensions = filterFixture(scale, counts)
  const sortItems = filterSortItems
  return <DemoSection title="常用维度与全部筛选" description="宿主提供受控值与题数；可切换规模、宽度，在页面顶部切换三主题。"><div className="space-y-8">
    <div className="flex flex-wrap items-end gap-4">
      <Choices label="容器宽度（px）" value={width} options={["520", "720", "960"]} onChange={setWidth} />
      <Choices label="数据规模" value={scale === "current" ? "现在的规模" : "将来的规模"} options={["现在的规模", "将来的规模"]} onChange={value => setScale(value === "现在的规模" ? "current" : "future")} />
      <Toggle pressed={counts} onPressedChange={setCounts}>提供选项数量</Toggle>
    </div>
    <p className="text-ui-hint">使用组件示例数据。切换规模会重置；其余开关保留筛选。128 题与收藏 23 题为固定夹具事实，不随操作模拟查询结果。选项包含 0 与未提供数量；取消数量开关后组件不推定可用性。所选宽度就是筛选区宽度，窄窗口以实际可用宽度为准。</p>
    <FilterPreview key={scale} scale={scale} width={Number(width)} dimensions={dimensions} sortItems={sortItems} />
  </div></DemoSection>
}
