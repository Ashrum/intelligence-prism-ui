"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { BlueprintSheet, BpCallout, BpSizeBar, BpStat, BpStatStrip, BpTitleBlock, BpTool } from "../blueprint/blueprint"
import { BlueprintTrendDemo } from "./blueprint-trend"

/** Frozen C0 SHEET 01 facts, supplied by this demo host; no business-rate calculations. */
export function BlueprintOverviewDemo() {
  const [showHelp, setShowHelp] = useState(false)
  return <section id="overview-calibration" aria-label="学情概览组合" className="space-y-3">
    <h2 className="text-section-title">学情概览组合</h2>
    <p className="text-ui-hint text-muted-foreground">C0 SHEET 01 合成数据；指标与结论由示例宿主传入。</p>
    <BlueprintSheet letter="A" sheetNo="01 / 05" title="概览 · 九年级（1）班数学" rulers>
      <div className="space-y-5">
        <BpTitleBlock items={[
          { id: "students", label: "学生", value: "45 人", numeric: true },
          { id: "tasks", label: "批阅任务", value: "6 次", numeric: true },
          { id: "answers", label: "作答", value: "2,436 次", numeric: true },
          { id: "period", label: "时间", value: "08/01–10/21", numeric: true },
          { id: "cutoff", label: "数据截至", value: "2026-10-21", numeric: true },
          { id: "excluded", label: "未纳入", value: "截止后 1 份", tone: "warn" },
          { id: "roster", label: "名册", value: "按当前班级近似" },
        ]} />
        <BpCallout emphasis title="近期表现高于预期 1 个百分点；此前失分的内容，再考时补回了 65%。" action={<a className="text-ui-action text-(--link) underline" href="#overview-evidence">看依据 →</a>}>
          依据 5 次可比批阅任务、19 道有再考记录的错题。结论按规则得出，不是 AI 判断。
        </BpCallout>
        <BpStatStrip aria-label="学情概览四指标">
          <BpStat label="近期得分率" code="MET03" value={75} unit="%" delta={{ text: "+1 pp 高于预期" }} caption="1,684 / 2,250 分"
            help={<BpTool iconOnly aria-label="近期得分率说明" aria-expanded={showHelp} aria-controls="overview-score-help" onClick={() => setShowHelp(value => !value)}><Info className="size-4" aria-hidden="true" /></BpTool>} />
          <BpStat label="补回率" code="MET07" value={65} unit="%">
            <BpSizeBar framed={false} size="sm" hideRowLabel rows={[{ id: "recovery", label: "补回率", unit: "项次", display: "", segments: [
              { id: "recovered", label: "补回", value: 177, fill: "accent" },
              { id: "unrecovered", label: "未补回", value: 95, fill: "ink" },
              { id: "excluded", label: "排除", value: 17, fill: "hatch" },
            ] }]} />
          </BpStat>
          <BpStat label="保持率" code="MET08" value={76} unit="%">
            <BpSizeBar framed={false} size="sm" hideRowLabel rows={[{ id: "retention", label: "保持率", unit: "项次", display: "", segments: [
              { id: "retained", label: "仍满分", value: 626, fill: "accent" },
              { id: "unretained", label: "未保持", value: 197, fill: "ink" },
              { id: "excluded", label: "排除", value: 43, fill: "hatch" },
            ] }]} />
          </BpStat>
          <BpStat label="需要优先处理" code="RULE" value={10} unit="人" caption="2 个知识点 · 按关注规则筛出" />
        </BpStatStrip>
        <p id="overview-score-help" hidden={!showHelp} className="text-ui-hint text-muted-foreground">近期得分率：1,684 / 2,250 分；75% 与 +1 pp 为宿主传入的格式化事实，组件不计算指标或推断结论。</p>
        <BlueprintTrendDemo />
        <details id="overview-evidence" className="text-ui-hint">
          <summary>查看合成数据依据</summary>
          <p>5 次可比批阅任务；19 道有再考记录的错题。补回 177 项次、未补回 95 项次、排除 17 项次；仍满分 626 项次、未保持 197 项次、排除 43 项次。</p>
        </details>
      </div>
    </BlueprintSheet>
    <details className="text-ui-hint">
      <summary>查看未知态与长文案夹具</summary>
      <BpStatStrip aria-label="不可用指标">
        <BpStat label="尚未积累足够可比作答记录的知识点补回率" code="MET07" value="数据不足" state="insufficient" caption="等待更多可比作答记录；不以 0 代替缺失。" />
        <BpStat label="跨任务保持率" code="MET08" value="尚未提供统计结果" state="unknown" />
      </BpStatStrip>
    </details>
  </section>
}
