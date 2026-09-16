"use client"

import { useRef, useState } from "react"
import { CircleAlertIcon } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { Skeleton } from "@/components/coss/skeleton"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/coss/empty"
import { Alert, AlertTitle, AlertDescription } from "@/components/coss/alert"
import { DemoSection } from "./demo-parts"
import { QuestionSelect } from "./question-controls"
import { AnalysisFilters, MetricSummary, TrendChart, ComparisonChart, DistributionChart, GoalComparison, StatusComposition, EvidenceTable } from "./analytics-components"
import { sampleRecords, initialFilter, filterRecords, drillRecords, type Drill } from "@/lib/prism-next/analytics-model"

type View="student-analysis"|"metric-summary"|"trend-chart"|"comparison-chart"|"distribution-chart"|"goal-comparison"|"status-composition"|"analysis-filter"|"evidence-table"
export function AnalyticsWorkspace({view="student-analysis"}:{view?:View}) {
  const [filter,setFilter]=useState(initialFilter)
  const [drill,setDrill]=useState<Drill>(null)
  const [state,setState]=useState("ready")
  const evidence=useRef<HTMLDivElement>(null)
  const records=filterRecords(sampleRecords,filter)
  const details=drillRecords(records,drill)
  const all=view==="student-analysis"||view==="analysis-filter"
  const show=(id:View)=>all||view===id
  function reset(){setFilter(initialFilter);setDrill(null);setState("ready")}
  function selectEvidence(next:Drill){setDrill(next);evidence.current?.focus({preventScroll:true});evidence.current?.scrollIntoView({block:"start"})}
  return <DemoSection title={view==="student-analysis"?"学生单元学习分析":"分析组件交互示例"} description="数学 · 函数应用；用同一组可追溯数据连接指标、图表和明细。">
    <div className="analytics-workspace q-workbench space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">合成演示数据</Badge><span className="text-sm">{filter.learner==="SYN-A"?"示例学生 A · SYN-A":"示例学生 B · SYN-EMPTY"}</span></div><QuestionSelect label="分析演示状态" value={state} onChange={setState} items={[{value:"ready",label:"正常数据"},{value:"loading",label:"演示：加载中"},{value:"error",label:"演示：加载失败"}]}/></header>
      {all && <nav aria-label="更多分析视角" className="flex flex-wrap gap-2">{[{id:"evidence-matrix",label:"证据矩阵"},{id:"goal-milestones",label:"目标里程碑"},{id:"workload-calendar",label:"负荷日历"},{id:"answer-review-map",label:"答卷定位"}].map(item=><Button key={item.id} variant="outline" size="sm" render={<a href={`/next/components/${item.id}`}/>}>{item.label}</Button>)}</nav>}
      <AnalysisFilters value={filter} onChange={next=>{setFilter(next);setDrill(null)}} onReset={reset}/>
      <p className="text-xs leading-5 text-muted-foreground">{filter.range==="all"?"2026-09-02 — 09-14 · 6 轮":"2026-09-09 — 09-14 · 3 轮"} · 统一评分标准 v1 · 每道题仅一条记录，不包含重做。得分率 = 已复核得分之和 / 对应满分之和。</p>
      {state==="loading"?<div role="status" aria-busy="true" className="space-y-4"><p className="text-sm text-muted-foreground">正在加载分析数据（状态演示）</p><div className="grid grid-cols-2 gap-4"><Skeleton className="h-28"/><Skeleton className="h-28"/></div><Skeleton className="h-60"/><Button variant="outline" onClick={()=>setState("ready")}>结束加载演示</Button></div>:state==="error"?<Alert variant="error"><CircleAlertIcon/><AlertTitle>分析数据未能加载</AlertTitle><AlertDescription><p>这是失败状态演示。筛选条件已保留。</p><Button className="w-fit" variant="outline" onClick={()=>setState("ready")}>重试</Button></AlertDescription></Alert>:!records.length?<Empty><EmptyHeader><EmptyTitle>当前范围暂无记录</EmptyTitle><EmptyDescription>没有记录不等于零分，也不能据此判断学习情况。</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={reset}>恢复示例数据</Button></EmptyContent></Empty>:<>
        {show("metric-summary")&&<MetricSummary records={records} onDrill={selectEvidence}/>}
        <div className={all?"analytics-grid":"space-y-6"}>
          {show("trend-chart")&&<TrendChart records={records} onDrill={selectEvidence}/>}
          {show("comparison-chart")&&<ComparisonChart records={records} onDrill={selectEvidence}/>}
          {show("distribution-chart")&&<DistributionChart records={records} onDrill={selectEvidence}/>}
          {show("status-composition")&&<StatusComposition records={records} onDrill={selectEvidence}/>}
          {show("goal-comparison")&&<GoalComparison records={records}/>}
          {all&&<section className="analytics-panel"><h3 className="text-sm font-semibold">从数据返回教学判断</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">本页描述样本表现。诊断需对照作答证据，目标达成需核验标准；完成练习只代表任务已执行。</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" render={<a href="/next/components/diagnosis"/>}>打开诊断组件</Button><Button variant="outline" render={<a href="/next/components/goals"/>}>打开目标规划</Button></div><p className="mt-3 text-xs leading-5 text-muted-foreground">上述入口使用各自的交互示例，不会自动把这组合成记录写入评价工作流。</p></section>}
        </div>
        <div ref={evidence} className="analytics-evidence" tabIndex={-1} aria-label="筛选后的分析证据"><p role="status" className="mb-3 text-sm text-muted-foreground">{drill?`当前明细：${drill.label} · ${details.length} 道；上方总览范围保持不变。`:"当前明细：所选范围内的全部记录。"}</p><EvidenceTable key={`${filter.learner}-${filter.topic}-${filter.range}-${drill?.kind}-${drill?.value}`} records={details} drill={drill} onClear={()=>setDrill(null)}/></div>
      </>}
    </div>
  </DemoSection>
}
export const analyticsDemos:Record<string,React.ComponentType>=Object.fromEntries((["student-analysis","metric-summary","trend-chart","comparison-chart","distribution-chart","goal-comparison","status-composition","analysis-filter","evidence-table"] as View[]).map(view=>[view,()=> <AnalyticsWorkspace view={view}/>]))
