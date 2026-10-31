"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { BlueprintInlineCode, BlueprintInlineFolio } from "../blueprint/blueprint"
import { RecordList } from "../record-list"
import { TextbookDirectory, type DirectorySelections } from "../textbook-directory"
import { FilterResults } from "../facet-filter"
import { QuestionAnalysisPanel } from "../question-analysis-panel"
import { createDirectory } from "@/lib/prism-next/textbook-directory"
import { applyFilterIntent, filterSortItems, initialFilterValue } from "./fixtures/facet-filter"

const books = [{ id: "p127-linear", title: "一次函数", subject: "数学", edition: "校本", directories: {
  course: createDirectory("p127-course", [{ id: "linear", title: "一次函数的图像与性质" }]),
  knowledge: createDirectory("p127-knowledge", [{ id: "slope", title: "斜率与截距" }]),
} }]

/** Same synthetic host is used by the interactive page and the integration test. */
export function BlueprintTitleSlotsContent({ active }: { active: boolean }) {
  const [value, setValue] = useState(initialFilterValue)
  const [selections, setSelections] = useState<DirectorySelections>({})
  const code = (letter: "A" | "B") => active ? <BlueprintInlineCode active code={letter} /> : undefined
  const folio = active ? <BlueprintInlineFolio active folio={{ kind: "sheet", value: "01 / 04" }} /> : undefined
  return <div className="space-y-6">
    <h3 className="text-block-title">{code("A")}AI 批阅{active && <BlueprintInlineFolio active folio={{ kind: "sheet", value: "03 / 04" }} />}</h3>
    <RecordList titleLeading={code("A")} rows={[]} state={{ kind: "empty" }} showPrimary={false} />
    <TextbookDirectory layout="embedded" multiSelect="dialog" textbooks={books} selections={selections} onSelectionsChange={setSelections} headingLeading={code("A")} />
    <FilterResults value={value} sortItems={filterSortItems} resultCount={4} favoriteCount={0} leading={code("B")} trailing={folio} onIntent={intent => setValue(previous => applyFilterIntent(previous, intent))} />
    <QuestionAnalysisPanel layout="compact" titleLeading={code("B")} keyMetrics={[{ id: "mean", label: "平均分", value: "6.5" }, { id: "max", label: "满分", value: "10" }]} />
  </div>
}

export function BlueprintTitleSlotsDemo() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const active = mounted && (resolvedTheme === "blueprint" || resolvedTheme === "blueprint-night")
  return <section id="title-slots-p127" aria-label="现有标题与工具行插槽" className="space-y-3">
    <h2 className="text-section-title">现有标题与工具行插槽</h2>
    <p className="text-ui-hint text-muted-foreground">合成数据。切换外观查看字母与图号；排序、收藏和搜索只更新本例状态，题数为固定样例。</p>
    <BlueprintTitleSlotsContent active={active} />
  </section>
}
