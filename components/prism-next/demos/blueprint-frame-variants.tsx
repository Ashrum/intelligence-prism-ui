"use client"

import { useState } from "react"
import { themeOptions, type PrismTheme } from "@/lib/prism-next/config"
import { BpMinor, BpSectionCard, BpSegTabs, BpSizeBar, BpStat, BpStatStrip, BpTitleBlock, type BpFrame, type BpSizeBarProps } from "../blueprint/blueprint"

const rows: BpSizeBarProps["rows"] = [
  { id: "equation", label: "一元二次方程的根与系数关系及其在实际问题中的应用", total: 40, unit: "人", display: "28 / 40", segments: [{ id: "mastered", label: "已掌握", value: 28, fill: "ink" }] },
  { id: "geometry", label: "相似三角形的判定与性质（长中文知识点）", total: 40, unit: "人", display: "21 / 40", segments: [{ id: "mastered", label: "已掌握", value: 21, fill: "ink" }] },
  { id: "short", label: "函数 x²", total: 40, unit: "人", display: "0 / 40", segments: [{ id: "mastered", label: "已掌握", value: 0, fill: "ink" }] },
]

/** Synthetic component composition; choices only change this preview. */
export function BlueprintFrameVariantsDemo() {
  const [theme, setTheme] = useState<PrismTheme>("blueprint")
  const [frame, setFrame] = useState<BpFrame>("subtle")
  const [labelWidth, setLabelWidth] = useState<"default" | "wide">("wide")
  const [section, setSection] = useState("overview")
  const [activeRowId, setActiveRowId] = useState("equation")
  return <div className="space-y-6">
    <BpSegTabs label="框线与名称示例主题" value={theme} onValueChange={value => setTheme(value as PrismTheme)} items={themeOptions.map(option => ({ ...option }))} />
    <section id="frame-variants" aria-label="框线层级" className="space-y-4">
      <BpMinor label="框线层级" />
      <p className="text-ui-hint text-muted-foreground">合成数据。蓝图与夜图可选细框或无框，分组最多两层框；核心三主题保留原外观。</p>
      <BpSegTabs label="框线层级预览" value={frame} onValueChange={value => setFrame(value as BpFrame)} items={[{ value: "default", label: "默认框" }, { value: "subtle", label: "细框" }, { value: "none", label: "无框" }]} />
      <div data-agent-preview data-prism-theme={theme} className="min-w-0 space-y-4 bg-background p-4 text-foreground">
        <BpTitleBlock frame={frame} items={[{ id: "class", label: "班级", value: "高一（2）班" }, { id: "subject", label: "学科", value: "数学" }, { id: "scope", label: "范围", value: "方程与几何综合复习" }]} />
        <BpSegTabs frame={frame} label="示例报告分区" value={section} onValueChange={setSection} items={[{ value: "overview", label: "学情概览" }, { value: "knowledge", label: "知识点表现" }]} />
        <BpSectionCard frame={frame} title={section === "overview" ? "学情概览" : "知识点表现"} density="compact">
          <BpStatStrip frame={frame}><BpStat label="已提交" value={40} unit="人" /><BpStat label="待复核" value={3} unit="份" /></BpStatStrip>
        </BpSectionCard>
        <BpSectionCard frame="none" title="嵌套核心主题隔离" density="compact">
          <div className="space-y-4">{(["light", "paper", "dark"] as const).map(core => <div key={core} data-agent-preview data-prism-theme={core} className="min-w-0 bg-background p-3 text-foreground">
            <BpTitleBlock frame="none" items={[{ id: "theme", label: "局部主题", value: core }, { id: "expected", label: "外观", value: "保留原框与分隔" }]} />
          </div>)}</div>
        </BpSectionCard>
      </div>
    </section>
    <section id="sizebar-label-width" aria-label="名称列宽" className="space-y-4">
      <BpMinor label="名称列宽" />
      <p className="text-ui-hint text-muted-foreground">合成数据。宽名称列占行宽 40%，至少 120px；过长时中间省略，悬停和可访问名称保留全称。窄容器中条形换到下一行。</p>
      <BpSegTabs label="名称列宽预览" value={labelWidth} onValueChange={value => setLabelWidth(value as "default" | "wide")} items={[{ value: "default", label: "默认名称列" }, { value: "wide", label: "宽名称列" }]} />
      <div data-agent-preview data-prism-theme={theme} className="min-w-0 space-y-4 bg-background p-4 text-foreground">
        <BpSizeBar rows={rows} labelWidth={labelWidth} framed={false} legend={false} onRowActivate={setActiveRowId} activeRowId={activeRowId} />
        <p role="status" className="text-ui-hint">当前选中：{rows.find(row => row.id === activeRowId)?.label}</p>
        <div className="w-full max-w-80"><BpSizeBar rows={rows} labelWidth={labelWidth} size="sm" legend={false} /></div>
      </div>
    </section>
  </div>
}
