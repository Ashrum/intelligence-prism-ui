"use client"

import { useState } from "react"
import { BlueprintSectionHeader, BpButton, BpDimension, BpDraft, BpInferred, BpSizeBar, BpStat, BpStatStrip, BpStatus, BpUnitGrid, type BpUnitGridProps } from "../blueprint/blueprint"
import { useChartTheme } from "../charts/chart-theme"
import { BLUEPRINT_SERIES } from "@/lib/prism-next/chart-palette"
import { relativeLuminance } from "@/lib/prism-next/chart-color"

const groups: BpUnitGridProps["groups"] = [
  { id: "stable", label: "稳定保持", count: 10, fill: "done" },
  { id: "learning", label: "正在巩固", count: 3, fill: "ai" },
  { id: "verify", label: "已纠正待验证", count: 4, fill: "hatch-ai" },
  { id: "support", label: "需要支持", count: 2, fill: "todo" },
  { id: "decline", label: "近期回落", count: 8, fill: "hatch-todo" },
  { id: "observe", label: "继续观察", count: 12, fill: "quiet" },
  { id: "missing", label: "数据不足", count: 6, fill: "hatch" },
]
const points = [
  { week: "W06", actual: 76.6, expected: 74 },
  { week: "W07·1", actual: 71.9, expected: 66.8 },
  { week: "W07·2", actual: 70, expected: 70 },
  { week: "W08", actual: 76.8, expected: 75 },
  { week: "W11", actual: 70.3, expected: 72 },
  { week: "W12", actual: 74.8, expected: 72 },
  { week: "W13", actual: 76, expected: 72.1 },
]
const x = (index: number) => 30 + index * 70
const y = (value: number) => 20 + (80 - value) * 9
const ratio = (foreground: string, background: string) => ((relativeLuminance(background) + .05) / (relativeLuminance(foreground) + .05)).toFixed(2)

function DraftBody() {
  return <>
    <p>这道题全班出错 <b className="font-mono">64.4%</b>，再考仍错 <b className="font-mono text-(--brand-magenta-text)">37.5%</b>。<BpInferred>多数错误发生在把“周长固定”转成面积函数这一步</BpInferred>，而不是求顶点本身。</p>
    <p>讲评建议：先请两位同学说出自变量的取值范围，<BpInferred>再用配方法得到最大值</BpInferred>，最后对比用顶点公式的写法。</p>
  </>
}

export function BlueprintDraftingDemo() {
  const { theme } = useChartTheme()
  const [selected, setSelected] = useState<string[]>([])
  return <section id="drafting" aria-label="v2.1 制图元素与颜色（合成数据）" className="min-w-0 space-y-8">
    <BlueprintSectionHeader title="v2.1 制图元素与颜色" description="合成数据，演示尺寸线、分行直标与展开全班构成、双段错题条与草稿确认两态。" />
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="min-w-0 space-y-3">
        <h3 className="border-b border-(--line) pb-2 text-block-title">班级得分率与预期</h3>
        <p className="text-ui-meta text-muted-foreground">■ 实际　┄ 按难度推算的预期</p>
        <svg viewBox="0 0 550 190" className="h-auto w-full" role="img" aria-label="班级得分率与预期，7 个观测点。W13 实际 76.0%，预期 72.1%，高于预期 3.9 个百分点，参照号 ①。">
          {[65, 70, 75, 80].map(value => <g key={value}>
            <line x1="30" x2="450" y1={y(value)} y2={y(value)} stroke="var(--border)" />
            <text x="4" y={y(value) + 4} className="text-ui-meta" fill="var(--muted-foreground)">{value}</text>
          </g>)}
          <polyline points={points.map((point, index) => `${x(index)},${y(point.expected)}`).join(" ")} fill="none" stroke="var(--muted-foreground)" strokeDasharray="5 4" />
          <polyline points={points.map((point, index) => `${x(index)},${y(point.actual)}`).join(" ")} fill="none" stroke="var(--brand-blue-text)" strokeWidth="2" />
          {points.map((point, index) => <g key={point.week}>
            <rect x={x(index) - 3} y={y(point.actual) - 3} width="6" height="6" fill="var(--brand-blue-text)" />
            <text x={x(index)} y="179" textAnchor="middle" className="text-ui-meta" fill="var(--muted-foreground)">{point.week}</text>
          </g>)}
          <BpDimension orientation="vertical" at={470} from={y(76)} to={y(72.1)} leaderFrom={454} label="+3.9" refNo="①" tone="up" />
        </svg>
      </section>
      <BpStatStrip frame="none">
        <BpStat label="近期得分率" value="76.0" unit="%" layout="inline" caption="得分 2,051 / 2,700 分 · 预期 72.1%">
          <svg viewBox="0 0 240 66" className="h-auto w-full" role="img" aria-label="预期 72.1% → 实际 76.0%，高于预期 3.9 个百分点。">
            <rect y="4" width="240" height="8" fill="var(--muted)" />
            <rect y="4" width="182.4" height="8" fill="var(--brand-blue-text)" />
            <line x1="173.04" x2="173.04" y1="0" y2="16" stroke="var(--foreground)" />
            <BpDimension orientation="horizontal" at={28} from={173.04} to={182.4} leaderFrom={14} tick={6} label="+3.9" tone="up" />
          </svg>
        </BpStat>
      </BpStatStrip>
    </div>
    <section className="min-w-0 space-y-3" aria-label="指标格示例（合成数据）">
      <h3 className="text-block-title">指标格 · 示例</h3>
      <BpStatStrip frame="none">
        <BpStat size="metric" label="得分率" value="76.0" unit="%" caption="本校 74.2% · 有效 45 人">
          <BpSizeBar size="xs" framed={false} legend={false} rows={[
            { id: "score", label: "得分构成", total: 100, unit: "%", display: "", segments: [
              { id: "earned", label: "得分", value: 76, fill: "ink" },
              { id: "lost", label: "失分", value: 24, fill: "hatch" },
            ] },
          ]} />
        </BpStat>
        <BpStat size="metric" label="可找回失分" value={92} unit="分" caption="讲评 9 · 个别 3" />
        <BpStat size="metric" label="巩固率" value={0} state="unknown" unit="%" caption="等待巩固记录" />
        <BpStat size="metric" label="有效人数" value={45} unit="人" caption="有效 45 / 全班 45 人" />
      </BpStatStrip>
    </section>
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
      <section className="min-w-0 space-y-3">
        <h3 className="border-b border-(--line) pb-2 text-block-title">学生学习进展 · 分行直标</h3>
        <ul className="space-y-3 text-ui-body">
          <li className="flex items-baseline justify-between gap-3 border-l-[3px] border-(--brand-magenta-text) pl-3 text-(--brand-magenta-text)"><span>需要支持</span><span className="shrink-0 font-mono">2 人</span></li>
          <li className="flex items-baseline justify-between gap-3 border-l-[3px] border-(--brand-magenta-text) pl-3 text-(--brand-magenta-text)"><span>近期回落</span><span className="shrink-0 font-mono">8 人</span></li>
          <li className="flex items-baseline justify-between gap-3 pl-[15px] text-muted-foreground"><span>数据不足</span><span className="shrink-0 font-mono">6 人</span></li>
        </ul>
        <details>
          <summary className="cursor-pointer text-ui-action">全班构成 · 45 人</summary>
          <div className="mt-3"><BpUnitGrid label="学生学习进展" groups={groups} /></div>
        </details>
        <p className="text-ui-meta text-muted-foreground">一个面板默认只用一种斜纹；需要看全班构成时再展开。</p>
        <section className="min-w-0 space-y-3" aria-label="全班构成点选示例">
          <h4 className="text-block-title">点选分组</h4>
          <BpUnitGrid label="学生学习进展 · 点选分组"
            groups={groups.map(group => ({ ...group, muted: selected.length > 0 && !selected.includes(group.id) }))}
            selected={selected}
            onSelect={id => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])} />
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-ui-meta" aria-live="polite">{selected.length ? `已选：${groups.filter(group => selected.includes(group.id)).map(group => group.label).join("、")}` : "未筛选"}</p>
            <BpButton onClick={() => setSelected([])} disabled={selected.length === 0}>清除</BpButton>
          </div>
        </section>
        <section className="min-w-0 space-y-3" aria-label="优先关注静态示例">
          <h4 className="text-block-title">优先关注 · 10 人</h4>
          <BpUnitGrid label="优先关注需要支持与近期回落的学生"
            groups={groups.map(group => ({ ...group, muted: group.id !== "support" && group.id !== "decline" }))} />
        </section>
      </section>
      <section className="min-w-0 space-y-3">
        <h3 className="border-b border-(--line) pb-2 text-block-title">出错最多的题</h3>
        <BpSizeBar layout="stacked" framed={false} legend={false} rows={[
          { id: "area", label: "矩形面积最大值", total: 100, unit: "%", display: "37.5%", displayTone: "todo", segments: [
            { id: "recovered", label: "出错（其余）", value: 40.2, fill: "ai" },
            { id: "still", label: "按仍错率折算的再考仍错", value: 24.2, fill: "hatch-todo" },
          ] },
          { id: "vertex", label: "开口方向与最值", total: 100, unit: "%", display: "20.0%", displayTone: "todo", segments: [
            { id: "recovered", label: "出错（其余）", value: 44.5, fill: "ai" },
            { id: "still", label: "按仍错率折算的再考仍错", value: 11.1, fill: "hatch-todo" },
          ] },
          { id: "axis", label: "与 x 轴的交点", total: 100, unit: "%", display: "批阅不足 3 次", displayTone: "muted", segments: [
            { id: "error", label: "出错，再考不可比", value: 51.3, fill: "ai" },
          ] },
        ]} />
        <p className="text-ui-meta text-muted-foreground">条长＝出错率（29/45、25/45、20/39）；右侧＝可比再考中仍错（6/16、2/10）；紫红斜纹＝条长 × 右侧比例。可比再考不足时写原因，不着紫红。</p>
      </section>
    </div>
    <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <BpDraft state="draft" title="矩形面积最大值：先列式，再找顶点" meta="讲评稿 · 九年级（1）班 · 二次函数"
        note="蓝色下划线＝AI 依据批阅记录推断的部分，请核对。"
        actions={<><BpButton variant="primary" disabled>确认使用</BpButton><BpButton disabled>修改</BpButton><BpButton disabled>不用</BpButton></>}>
        <DraftBody />
      </BpDraft>
      <BpDraft state="confirmed" title="矩形面积最大值：先列式，再找顶点" meta="讲评稿 · 九年级（1）班 · 二次函数"
        provenance={[{ label: "来源", value: "AI 草稿 · 依据 2 次批阅" }, { label: "确认", value: "王建国 · 11-06" }]}>
        <DraftBody />
      </BpDraft>
    </div>
    <section className="space-y-3" aria-label="四档状态写法">
      <h3 className="text-block-title">状态</h3>
      <ul className="flex flex-wrap gap-4 text-ui-body">
        <li><BpStatus tone="error">错误</BpStatus></li>
        <li><BpStatus tone="attention">需处理</BpStatus></li>
        <li><BpStatus tone="done">完成</BpStatus></li>
        <li><BpStatus tone="neutral">待定</BpStatus></li>
        <li><BpStatus tone="neutral" inactive>已失效</BpStatus></li>
      </ul>
      <p className="border-l-[3px] border-(--brand-magenta-text) pl-3 text-ui-body">待你确认这份讲评稿</p>
    </section>
    {theme === "blueprint" && <section className="space-y-3" aria-label="图表四色及对比度">
      <h3 className="text-block-title">图表四色</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {BLUEPRINT_SERIES.map((color, index) => <li key={color} className="flex min-w-0 items-start gap-3 text-ui-meta">
          <span aria-hidden="true" className="size-5 shrink-0" style={{ background: color }} />
          <span>{["曜蓝", "曜紫红", "曜青绿", "灰蓝"][index]} <code>{color}</code><br />白底 {ratio(color, "#FFFFFF")} · 纸底 {ratio(color, "#F6F6F3")}</span>
        </li>)}
      </ul>
    </section>}
  </section>
}
