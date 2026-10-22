"use client"

import { useId, useState } from "react"
import { Button, buttonVariants } from "@/components/coss/button"
import { Card, CardFrame, CardFrameHeader, CardFrameTitle, CardPanel } from "@/components/coss/card"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { Select, SelectTrigger, SelectValue, SelectItem } from "@/components/coss/select"
import { SelectPopup } from "@/components/prism-next/scoped-overlays"
import { TooltipProvider } from "@/components/coss/tooltip"
import { TextbookDirectory } from "@/components/prism-next/textbook-directory"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { QuestionRail } from "@/components/prism-next/question-rail"
import { DemoSection } from "@/components/prism-next/demo-parts"
import { reviewRailFixture } from "./review-workspace-fixtures"

type PolishKind = "cover" | "rail" | "triggers" | "cards"

function TriggerFixture() {
  const id = useId()
  const [value, setValue] = useState("example")
  return <div className="space-y-4">
    <div className="space-y-2">
      <label htmlFor={id} className="text-ui-action">材料类型</label>
      <Select value={value} onValueChange={next => { if (next) setValue(next) }} items={[{ value: "example", label: "例题讲解" }, { value: "concept", label: "知识梳理" }]}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectPopup><SelectItem value="example">例题讲解</SelectItem><SelectItem value="concept">知识梳理</SelectItem></SelectPopup>
      </Select>
    </div>
    <Collapsible>
      <CollapsibleTrigger className={buttonVariants({ variant: "outline" })}>展开推导说明</CollapsibleTrigger>
      <CollapsiblePanel><p className="pt-3 text-ui-body">先配方，再核对等价条件。</p></CollapsiblePanel>
    </Collapsible>
    <Collapsible>
      <CollapsibleTrigger render={<Button variant="outline" />}>展开阅读提示</CollapsibleTrigger>
      <CollapsiblePanel><p className="pt-3 text-ui-body">对照题目条件阅读完整推导。</p></CollapsiblePanel>
    </Collapsible>
  </div>
}

function RailFixture() {
  const id = useId()
  const [selected, setSelected] = useState("4")
  const [filter, setFilter] = useState("all")
  const sections = reviewRailFixture.sections.map(section => ({ ...section, pages: section.pages.map(page => ({ ...page, items: page.items.filter(item => filter === "all" || ["2", "3"].includes(item.id)) })) }))
  return <div className="h-[520px]"><QuestionRail {...reviewRailFixture} sections={sections} filter={filter} onFilterChange={setFilter} panelId={id} selected={selected} onSelect={setSelected} onLocate={() => {}} onPage={() => {}} /></div>
}

function CardFixture() {
  return <CardFrame><CardFrameHeader><CardFrameTitle>本周材料</CardFrameTitle></CardFrameHeader><Card><CardPanel className="space-y-3"><p className="text-ui-body">函数的单调性</p><Button variant="outline">查看材料</Button></CardPanel></Card></CardFrame>
}

/** Explicit Blueprint fixtures; existing core-theme examples stay in place. */
export function BlueprintPolishDemo({ kind }: { kind: PolishKind }) {
  const titles = { cover: "教材纸面封面", rail: "直角分值条", triggers: "描边触发器", cards: "无投影卡片框" }
  return <DemoSection id={`p105-${kind}`} title={`蓝图 / 夜图 · ${titles[kind]}`} description="合成数据对照；用键盘与鼠标检查静态、聚焦和展开状态。">
    <TooltipProvider><div className="flex flex-wrap items-start gap-4">
      {(["blueprint", "blueprint-night"] as const).map(theme => <section key={theme} data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="w-80 max-w-full min-w-0 space-y-3 bg-background p-3 text-foreground">
        <h3 className="text-item-title">{theme}</h3>
        {kind === "cover" && <TextbookDirectory layout="header" textbooks={textbooks} />}
        {kind === "rail" && <RailFixture />}
        {kind === "triggers" && <TriggerFixture />}
        {kind === "cards" && <CardFixture />}
      </section>)}
    </div></TooltipProvider>
  </DemoSection>
}
