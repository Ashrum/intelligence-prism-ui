"use client"

import { useRef, useState } from "react"
import { BpButton, BpConclusion, BpMark, BpProvenance, BpRef, BpSectionCard, BpSidePeek, BpSizeBar, BpStat, BpStatStrip, BpWorkBody, BpWorkHeader, BpWorkTabs } from "../blueprint/blueprint"

/** Synthetic presentation data. The two supplied records occupy positions 5 and 6. */
export function BlueprintWorkDemo() {
  const headerRef = useRef<HTMLElement>(null)
  const [record, setRecord] = useState(0)
  const [tab, setTab] = useState("overview")
  const [peekOpen, setPeekOpen] = useState(false)
  const className = `九年级（${record + 1}）班`
  const provenance = <BpProvenance items={[
    { label: "数据截至", value: <span className="font-mono">2026-10-24 16:00</span> },
    { label: "依据", value: "45 份有效答卷 · 12 题" },
    { label: "得出", value: "规则计算 · 合成数据" },
    { label: "版本", value: "结果 v1 · 示例" },
  ]} />
  const evidence = <BpSectionCard frame="none" title="题目丢分 · 按全班失分率" action={
    <BpSidePeek title="第 4 题" open={peekOpen} onOpenChange={setPeekOpen} headerRef={headerRef}
      trigger={<BpButton>查看第 4 题 →</BpButton>}
      position={{ index: 4, total: 12, prevLabel: "上一题", nextLabel: "下一题" }}
      footer={<BpButton variant="primary" onClick={() => setPeekOpen(false)}>完成查看</BpButton>}>
      <p className="text-block-title">一元二次方程 · 公式法</p>
      <p className="mt-4 text-ui-body">解答题，满分 8 分。全班失分率 35.0%，共丢 126 分。</p>
      <p className="mt-4 text-ui-body">求解方程 x² − 3x + 2 = 0，并写出判别式与计算过程。</p>
      <BpProvenance className="mt-6" items={[{ label: "来源", value: "合成题目与批阅记录" }, { label: "依据", value: "45 份有效答卷" }]} />
    </BpSidePeek>
  }>
    <div id="work-evidence-loss" className="space-y-3">
      <p className="text-ui-meta">② 课堂讲评 9 题，可找回 92 分。</p>
      <BpSizeBar framed={false} legend={false} rows={[
        { id: "question-4", label: "第 4 题 · 公式法", total: 100, unit: "%", display: "35.0%", segments: [{ id: "loss", label: "失分率", value: 35, fill: "hatch-todo" }] },
        { id: "question-10", label: "第 10 题 · 单选", total: 100, unit: "%", display: "28.9%", segments: [{ id: "loss", label: "失分率", value: 28.9, fill: "hatch-todo" }] },
        { id: "question-1", label: "第 1 题 · 解答", total: 100, unit: "%", display: "28.4%", segments: [{ id: "loss", label: "失分率", value: 28.4, fill: "hatch-todo" }] },
      ]} />
    </div>
    <p id="work-evidence-score" className="mt-6 text-ui-body">① 本班得分率 76.0%，本校 74.2%，高 1.8 个百分点。</p>
  </BpSectionCard>
  const overview = <>
    <div className="bp-work-demo-summary">
      <div className="bp-work-demo-summary-copy">
        <BpConclusion>本班得分率 <BpMark>76.0%</BpMark><BpRef href="#work-evidence-score">①</BpRef>，比本校高 1.8 个百分点；9 道题值得讲评，讲透能找回 <BpMark>92 分</BpMark><BpRef href="#work-evidence-loss">②</BpRef>。</BpConclusion>
        <p className="mt-3 text-ui-meta text-muted-foreground">① 见得分率对照　② 见题目丢分</p>
      </div>
      {provenance}
    </div>
    <BpStatStrip frame="none" aria-label="本次批阅指标">
      <BpStat label="得分率" value="76.0" unit="%" caption="本校 74.2% · +1.8 个百分点 · 本校第 1">
        <BpSizeBar framed={false} size="xs" legend={false} marker={{ value: 74.2, label: "本校" }} rows={[
          { id: "score", label: "得分率", total: 100, unit: "%", segments: [
            { id: "earned", label: "得分", value: 76, fill: "accent" },
            { id: "lost", label: "失分", value: 24, fill: "hatch" },
          ] },
        ]} />
      </BpStat>
      <BpStat label="平均分" value="45.6" unit="/ 60" caption="45 人分布 · 每段人数 2 / 8 / 4 / 9 / 10 / 12">
        <div role="img" aria-label="分数分布：24 分段 2 人，30 分段 8 人，36 分段 4 人，42 分段 9 人，48 分段 10 人，54 分段 12 人" className="flex h-[26px] items-end gap-1">
          {[2, 8, 4, 9, 10, 12].map((count, index) => <span key={index} aria-hidden="true" className="bp-fill-accent min-w-0 flex-1" style={{ height: `${count / 12 * 100}%` }} />)}
        </div>
      </BpStat>
      <BpStat label="有效答卷" value="45" unit="/ 45 份" caption="预计 45 份全部收到并批完">
        <BpSizeBar framed={false} size="xs" legend={false} rows={[
          { id: "answers", label: "有效答卷", total: 45, unit: "份", segments: [{ id: "complete", label: "已批完", value: 45, fill: "done" }] },
        ]} />
      </BpStat>
      <BpStat label="可找回的失分" value="92" unit="分" readout={{ text: "讲评 9 · 个别 3", tone: "warn" }} caption="课堂讲评 9 题 · 个别解决 3 题 · 重新教 0">
        <BpSizeBar framed={false} size="xs" legend={false} rows={[
          { id: "recovery", label: "讲评 9 · 个别 3", total: 12, unit: "题", segments: [
            { id: "class", label: "讲评", value: 9, fill: "hatch-todo" },
            { id: "individual", label: "个别", value: 3, fill: "hatch" },
          ] },
        ]} />
      </BpStat>
    </BpStatStrip>
    <div className="bp-work-demo-evidence">{evidence}</div>
  </>
  return <section id="work-frame" aria-label="工作框架组件示例" className="bp-work-demo space-y-3">
    <h2 className="text-section-title">工作框架组件</h2>
    <p className="text-ui-meta text-muted-foreground">合成数据，提供第 5、6 条记录与第 4 题预览。</p>
    <div className="bp-work-demo-canvas">
      <BpWorkHeader ref={headerRef} back={{ label: "智能批阅", href: "#work-frame" }} title="数学 · 间隔复查" meta={className}
        status={<span className="bp-work-demo-done">● 批阅完成</span>}
        position={{ index: record + 5, total: 20, onPrev: record === 1 ? () => setRecord(0) : undefined, onNext: record === 0 ? () => setRecord(1) : undefined, prevLabel: "上一次批阅", nextLabel: "下一次批阅" }}
        secondary={[<BpButton key="target" disabled title="示例未接入目标线设置">设置目标线</BpButton>]}
        primary={{ children: "导出成绩单", disabled: true, title: "示例未接入成绩导出" }} />
      <BpWorkBody>
        <BpWorkTabs label="这次批阅的部分" value={tab} onValueChange={value => setTab(String(value))} items={[
          { value: "overview", label: "概览", content: overview },
          { value: "questions", label: "题目与知识点", count: 12, content: <div className="py-6">{evidence}</div> },
          { value: "students", label: "学生", count: 45, content: <p className="py-6 text-ui-body">{className}共 45 人，45 份有效答卷全部收到并批完。</p> },
          { value: "provenance", label: "批阅信息", content: <div className="py-6">{provenance}</div> },
        ]} />
      </BpWorkBody>
    </div>
  </section>
}
