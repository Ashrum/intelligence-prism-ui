"use client"

import { useState } from "react"
import { BpButton, BpConclusion, BpMark, BpSegTabs, BpSizeBar, BpStat, BpStatStrip, BpStatus } from "../blueprint/blueprint"
import { BpFocusBlock, BpObjectPane, BpObjectRef, BpResultRow } from "../blueprint/work"

const scores = [71.6, 78.2, 80, 65, 77.8, 84.4, 74.4, 82.2, 82.2, 71.1, 80, 75.6]

export function BlueprintAgentPageDemo() {
  const [open, setOpen] = useState(true)
  const [focused, setFocused] = useState(false)
  const [section, setSection] = useState("analysis")
  const [notice, setNotice] = useState("")
  const openResult = () => { setOpen(true); setFocused(false) }
  return <section id="agent-conversation-pane" className="space-y-4" aria-label="Agent 对话与右栏">
    <h2 className="text-section-title">Agent 对话与右栏</h2>
    <p className="text-ui-meta text-muted-foreground">示例 · 合成数据</p>
    <div className={focused ? "grid min-w-0" : "grid min-w-0 gap-6 xl:grid-cols-2"}>
      {!focused && <div className="min-w-0 space-y-6">
        <p className="text-ui-body">这次考得怎么样</p>
        <BpFocusBlock title="要查哪一次测评？" actions={<><BpButton variant="primary" onClick={openResult}>查最近一次</BpButton><button type="button" className="text-ui-action text-(--link)" onClick={() => setNotice("作为新诉求")}>不查了，作为新诉求</button></>}>
          你没说时间；目前只能查最近一次。
        </BpFocusBlock>
        <p className="text-ui-body">最近一次</p>
        <BpConclusion>得分率 76.0%，比本校高 <BpMark>1.8 个百分点</BpMark>；9 道题值得全班讲评。</BpConclusion>
        <BpResultRow refCode={<BpObjectRef code="R1" label="批阅结果 · 数学 · 间隔复查" current={open} onOpen={openResult} />} title="批阅结果 · 数学 · 间隔复查" current={open}
          meta={<><span>九年级（1）班 · 45 / 45 份 · 结果 v1</span><BpStatus tone="done">已发布</BpStatus></>}
          action={<BpButton variant="primary" onClick={openResult}>{open ? "已在右栏" : "打开批阅结果"}</BpButton>} />
        <p className="text-ui-body">出三道选择题</p>
        <BpConclusion>组卷要在组卷页完成；你说的条件已经带上。</BpConclusion>
        <p className="text-ui-body">题型 选择题 · 数量 三道 · 依据 <BpObjectRef code="R1" label="间隔复查 · 结果 v1" onOpen={openResult} /> 间隔复查 · 结果 v1</p>
        <BpButton variant="primary" onClick={() => setNotice("去组卷（示例：未接入组卷页）")}>去组卷</BpButton>
        <p className="text-ui-meta text-muted-foreground">本轮未执行，也未在组卷页创建任何内容 ｜ 原型 · 合成数据</p>
        {notice && <p role="status" className="text-ui-body">{notice}</p>}
      </div>}
      {open && <div className="h-[720px] min-w-0">
        <BpObjectPane refCode={<BpObjectRef code="R1" label="批阅 · 数学 · 间隔复查" current />} title="批阅 · 数学 · 间隔复查"
          onClose={() => { setOpen(false); setFocused(false) }} onExpand={() => setFocused(!focused)} expanded={focused} grid
          meta={<><span>九年级（1）班 · 45 / 45 份已批 · 结果 v1</span><BpStatus tone="done">已发布</BpStatus><BpStatus tone="neutral">0 项待处理</BpStatus></>}
          tabs={<BpSegTabs label="批阅任务" value={section} onValueChange={setSection} items={[{ value: "analysis", label: "分析" }, { value: "source", label: "批阅信息" }]} />}
          footer={<><BpButton variant="primary" onClick={() => setNotice("查看完整学情（示例：未接入）")}>查看完整学情</BpButton><button type="button" className="text-ui-action text-(--link)" onClick={() => { setFocused(false); setNotice("准备下一次学习") }}>准备下一次学习</button><button type="button" aria-label="结果说明" title="依据批阅结果 v1，示例 · 合成数据">?</button></>}>
          {section === "analysis" ? <div className="space-y-5">
            <BpConclusion>第 4 题失分最多（得分率 65.0%）；全班平均 45.6 / 60，得分率 76.0%。</BpConclusion>
            <BpStatStrip frame="none"><BpStat size="metric" label="有效" value="45" unit="份" /><BpStat size="metric" label="最高" value="60" /><BpStat size="metric" label="最低" value="27" /><BpStat size="metric" label="中位" value="47" /></BpStatStrip>
            <h3 className="text-block-title">各题得分率</h3>
            <BpSizeBar framed={false} legend={false} rows={scores.map((score, index) => ({ id: String(index + 1), label: `第 ${index + 1} 题`, total: 100, unit: "%", display: `${score.toFixed(1)}%`, segments: [{ id: "score", label: "得分", value: score, fill: [0, 3, 9].includes(index) ? "todo" : "accent" }, { id: "loss", label: "失分", value: 100 - score, fill: "hatch" }] }))} />
          </div> : <p>依据：批阅结果 v1 · 2026-10-24 · 45 份有效作答 ｜ 规则计算 ｜ 原型 · 合成数据</p>}
        </BpObjectPane>
      </div>}
    </div>
    {[480, 390].map(width => <div key={width} className="h-64 max-w-full" style={{ width }}>
      <BpObjectPane refCode={<BpObjectRef code="R1" label="批阅结果" current />}
        title="批阅 · 数学 · 间隔复查（九年级（1）班）" meta={`nav 示例 · ${width}px · 合成数据`}
        position={{ current: 1, total: 3, onNext: () => setNotice("下一项（示例）") }}
        nav={<BpButton size="sm" aria-label="跳转到右栏层级" onClick={() => setNotice("层级导航（示例：由宿主提供菜单）")}>层级 ▾</BpButton>}
        onExpand={() => setNotice("专注查看（示例）")} onClose={() => setNotice("关闭右栏（示例）")}>
        <p>标题行包含对象位置、层级导航、专注与关闭。</p>
      </BpObjectPane>
    </div>)}
    <div className="h-64 min-w-0">
      <BpObjectPane title="任务执行详情" meta="示例 · 合成数据">
        <p>宿主没有关闭时不出关闭按钮。</p>
      </BpObjectPane>
    </div>
  </section>
}
