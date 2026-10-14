"use client"
import { useState } from "react"
import { Badge } from "../badge"
import { Button } from "@/components/coss/button"
import { DemoSection, Feedback } from "../demo-parts"
import { TrendChart, type ChartSeries } from "../charts/basic-charts"
import { QuadrantScatterChart } from "../charts/scatter-chart"
import { PairedDotChart } from "../charts/paired-dot-chart"
import { MetricSummary, type MetricSummaryItem } from "../data-display"

const names=["21.1 小测","口算练习","21 章单元测","22.1 小测","应用题专项","22 章单元测"]
const points=(values:(number|null)[])=>values.map((value,i)=>({id:`week-${i+2}`,label:names[i],value}))
export const learningTrendSeries:ChartSeries[]=[
 {id:"actual",label:"实际得分率",connectGaps:true,data:points([65,null,68,70,null,72]).map((p,i)=>({...p,...(p.value===null?{}:{valueLabel:`${p.value}%`,annotation:`高于预期 ${[1,0,2,3,0,3][i]}`})}))},
 {id:"expected",label:"按题目难度推算的预期",lineStyle:"dashed",connectGaps:true,tone:"neutral",data:points([64,null,66,67,null,69])},
 {id:"incomparable",label:"不可比检测",connect:false,tone:"neutral",data:points([null,66,null,null,null,null]).map(p=>({...p,symbol:"hollow-circle",...(p.value===null?{}:{valueLabel:"66%",annotation:"不可比：口径不同"})}))},
 {id:"new-context",label:"新情境检测",connect:false,tone:"chart-3",data:points([null,null,null,null,71,null]).map(p=>({...p,symbol:"diamond",...(p.value===null?{}:{valueLabel:"71%",annotation:"新情境：独立观察"})}))},
]
export const learningMetrics:MetricSummaryItem[]=[
 {id:"stable",label:"稳定保持",value:"10 / 45 人",detail:"依据四次可比检测",visual:{kind:"ring",value:10,max:45},help:"在本次统计口径下稳定保持的学生数；范围与结论由宿主提供。"},
 {id:"recovery",label:"错题补回率",value:"61%",detail:"已复查 26 道错题",visual:{kind:"ring",value:61,max:100},help:"已补回的有效作答占有复查记录作答的比例；未复查不当作零。"},
 {id:"score",label:"近期得分率",value:"72%",detail:"四次可比检测 65%、68%、70%、72%",visual:{kind:"sparkline",values:[65,null,68,70,null,72]},help:"只呈现外部传入的得分率；缺测处保留断点。"},
 {id:"evidence",label:"有效作答",value:"1,248 次",detail:"八周数据；0 表示当周无新增",visual:{kind:"sparkline",values:[0,168,0,248,212,0,284,336]},help:"已批阅且可用于本次统计的作答数。"},
]
const descriptions:Record<string,string>={
 "trend-chart":"lineStyle='dashed' 显示预期虚线；connect=false 仅画点。逐点 symbol 区分空心圆与菱形，valueLabel 在上、annotation 在下；避让后放不下时保留在提示框与数据表，不缩小字号。connectGaps=true 跨缺测连线；yDomain=auto 按有效数据留边。",
 "quadrant-chart":"quadrants.highlight 接收 quadrant 与 ChartTone；仅强调调用方指定的区域，沿用图表主题色。labelMode=none 可隐藏图上点标签；完整名称始终保留在提示框和数据表。",
 "paired-dot-chart":"density='compact' 将完整名称放在两点上方，tag 展示外部状态；connectPairs=true 连接同一题的两个有效值。缺一个值时保留另一个点，不补 0；相等值仍由点形和上下数值区分。",
 "metric-summary":"items[].visual 可传 ring 的 value/max 或 sparkline 的 values；装饰图形对读屏隐藏，文本披露原始数值。items[].help 在指标名旁提供 coss Popover，支持键盘与关闭后焦点返回。",
}
export function LearningChartProperties({kind}:{kind:string}){
 const [narrow,setNarrow]=useState(false),[edge,setEdge]=useState(false),[labels,setLabels]=useState(true),[precision,setPrecision]=useState(false),[notice,setNotice]=useState("选择结果由外部接收。")
 const select=(id:string,metric?:string)=>setNotice(`请求查看：${id}${metric?` · ${metric}`:""}`)
 return <DemoSection id="learning-properties" title="学情分析公开属性" description={descriptions[kind]}>
  <div className="mb-4 flex flex-wrap gap-2"><Button variant="outline" aria-pressed={narrow} onClick={()=>setNarrow(!narrow)}>320px 容器</Button><Button variant="outline" aria-pressed={edge} onClick={()=>setEdge(!edge)}>长中文、公式与缺测</Button>{kind!=="metric-summary"&&<Button variant="outline" aria-pressed={precision} onClick={()=>setPrecision(!precision)}>保留一位小数</Button>}{kind==="quadrant-chart"&&<Button variant="outline" aria-pressed={!labels} onClick={()=>setLabels(!labels)}>隐藏点标签</Button>}</div>
  <div className="@container min-w-0 max-w-full" style={{width:narrow?320:960}}>
   {kind==="trend-chart"&&<TrendChart label="班级得分率与预期" yDomain="auto" decimals={precision?1:0} unit="%" height={320} onSelect={select} series={edge?learningTrendSeries.map(s=>({...s,data:s.data.map(p=>({...p,annotation:p.annotation?`${p.annotation}；请结合题目难度与公式 x² + y² = 1 的适用范围核对，不直接比较跨口径分数。`:undefined}))})):learningTrendSeries}/>}
   {kind==="quadrant-chart"&&<QuadrantScatterChart label="课程与知识点聚焦" labelMode={labels?"auto":"none"} decimals={precision?1:0} xLabel="近期得分率" yLabel="补回率" xUnit="%" unit="%" xDomain={[50,90]} yDomain={[0,100]} quadrants={{x:70.46929824561403,y:61.204,labels:["得分低 · 补得快","得分高 · 补得快","优先处理","得分高 · 补得慢"],highlight:{quadrant:"bottom-left",tone:"destructive"}}} groups={[{id:"chapter",label:"章",symbol:"circle"},{id:"knowledge",label:"知识点",symbol:"diamond"}]} data={[
    {id:"chapter-21",label:"第二十一章 一元二次方程",x:72,y:70,group:"chapter"},{id:"chapter-22",label:"第二十二章 二次函数",x:59.46929824561403,y:48.222,group:"chapter"},
    {id:"roots",label:edge?"根与系数的关系：x₁ + x₂ = −b/a，需要结合完整答题证据解释":"根与系数的关系",x:64,y:edge?null:56,group:"knowledge"},{id:"application",label:"二次函数的应用",x:55,y:38,group:"knowledge"},
   ]} onSelect={select}/>}
   {kind==="paired-dot-chart"&&<PairedDotChart label="错题：出错与再错" density="compact" decimals={precision?1:0} connectPairs domain={[0,100]} unit="%" metrics={[{id:"error",label:"出错的学生占比"},{id:"repeat",label:"再考时仍然出错"}]} data={[
    {id:"Q15",label:edge?"Q15 一元二次方程 x² − 3x + 2 = 0 的完整解题过程":"Q15 一元二次方程",tag:<Badge variant="warning">继续巩固</Badge>,first:52.46929824561403,second:edge?null:44.222},
    {id:"Q7",label:"Q7 根与系数",tag:<Badge variant="success">已有改善</Badge>,first:45,second:edge?45:33},{id:"Q12",label:"Q12 二次函数应用",first:edge?0:36,second:edge?100:25},
   ]} onSelect={select}/>}
   {kind==="metric-summary"&&<MetricSummary items={edge?learningMetrics.map((item,i)=>({...item,label:i===0?"需要结合长中文口径与公式 x² + y² = 1 解释的指标":item.label,visual:i===2?{kind:"sparkline",values:[null,0,null]}:item.visual})):learningMetrics} onSelect={select}/>}
  </div><Feedback>{notice}</Feedback>
 </DemoSection>
}
