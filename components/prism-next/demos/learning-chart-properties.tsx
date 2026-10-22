"use client"
import { useState } from "react"
import type { ChartValueFormatter, ChartValueText } from "@/lib/prism-next/chart-options"
import { SegmentedBar } from "../charts/segmented-bar"
import { BpSizeBar } from "../blueprint/blueprint"
import { Badge } from "../badge"
import { Button } from "@/components/coss/button"
import { DemoSection, Feedback } from "../demo-parts"
import { TrendChart, type ChartSeries } from "../charts/basic-charts"
import { QuadrantScatterChart } from "../charts/scatter-chart"
import { PairedDotChart, pairedDotLegendItems, type PairedMetric } from "../charts/paired-dot-chart"
import { ChartLegend } from "../charts/chart-legend"
import { MetricSummary, type MetricSummaryItem } from "../data-display"

const names=["21.1 小测","口算练习","21 章单元测","22.1 小测","应用题专项","22 章单元测"]
const weeks=[2,3,4,5,6,8]
const tickNames=["起点检测","口算练习","单元检测","阶段检测","应用专项","数学检测"]
const points=(values:(number|null)[])=>values.map((value,i)=>({id:`week-${i+2}`,label:names[i],tickLabel:[`第 ${weeks[i]} 周`,tickNames[i]] as [string,string],value}))
export const learningTrendSeries:ChartSeries[]=[
 {id:"actual",label:"实际得分率",connectGaps:true,data:points([65,null,68,70,null,72]).map((p,i)=>({...p,...(p.value===null?{}:{valueLabel:`${p.value}%`,annotation:`高于预期 ${[1,0,2,3,0,3][i]}`})}))},
 {id:"expected",label:"按题目难度推算的预期",lineStyle:"dashed",showPoints:false,connectGaps:true,tone:"neutral",data:points([64,null,66,67,null,69])},
 {id:"incomparable",label:"不可比检测",connect:false,tone:"neutral",data:points([null,66,null,null,null,null]).map(p=>({...p,symbol:"hollow-circle",...(p.value===null?{}:{valueLabel:"66%",annotation:"不可比：口径不同"})}))},
 {id:"new-context",label:"新情境检测",connect:false,tone:"chart-3",data:points([null,null,null,null,71,null]).map(p=>({...p,symbol:"diamond",...(p.value===null?{}:{valueLabel:"71%",annotation:"新情境：独立观察"})}))},
]
export const learningMetrics:MetricSummaryItem[]=[
 {id:"stable",label:"稳定保持",value:"10 / 45 人",detail:"依据四次可比检测",visual:{kind:"ring",value:10,max:45},help:"在本次统计口径下稳定保持的学生数；范围与结论由宿主提供。"},
 {id:"recovery",label:"错题补回率",value:"61%",detail:"已复查 26 道错题",visual:{kind:"ring",value:61,max:100},help:"已补回的有效作答占有复查记录作答的比例；未复查不当作零。"},
 {id:"score",label:"近期得分率",value:"72%",detail:"四次可比检测 65%、68%、70%、72%",visual:{kind:"sparkline",values:[65,null,68,70,null,72]},help:"只呈现外部传入的得分率；跳过缺测连接有效观测，缺测位置不补零。"},
 {id:"evidence",label:"有效作答",value:"1,248 次",detail:"八周数据；0 表示当周无新增",visual:{kind:"sparkline",values:[0,168,0,248,212,0,284,336]},help:"已批阅且可用于本次统计的作答数。"},
]
export const learningPairedMetrics:[PairedMetric,PairedMetric]=[{id:"error",label:"出错的学生占比",help:"分子是本题未得满分的学生数，分母是本题有有效作答的学生数；按学生去重。"},{id:"repeat",label:"再考时仍然出错",help:<><p>分子是原失分学生最近一次可比再考仍未得满分的人数，分母是原失分学生中有可比再考的人数。</p><p>两项分母不同；没有可比再考时保持缺测，不补零。</p></>}]

const descriptions:Record<string,string>={
 "trend-chart":"lineStyle='dashed' 显示预期虚线，showPoints=false 关闭普通点与悬停点；connect=false 仅画点。逐点 symbol 区分空心圆与菱形，valueLabel 在上、annotation 在下；避让后放不下时保留在提示框与数据表，不缩小字号。connectGaps=true 跨缺测连线；yDomain=auto 按有效数据留边，百分比轴显示 3–5 条刻度，从 5/10/20/25 个百分点中取最小可用步长；标注以卡片表面色描边；xTickMode=all 展示全部刻度，tickLabel 固定两行。",
 "quadrant-chart":"quadrants.highlight 接收 quadrant 与 ChartTone；仅强调调用方指定的区域，沿用图表主题色；xDomain/yDomain=auto 自动留边，百分比轴显示 3–5 条等距刻度，两端落在刻度上，象限标题位于外角。标签按右、上、左、下避让所有点和已放置文字，放不下则隐藏。labelMode=none 可隐藏图上点标签；完整名称始终保留在提示框和数据表。",
 "paired-dot-chart":"rowLayout='inline' 将名称、共用比例轨道和两列纯数值放在同一行；数值列等宽、右对齐，圆点 / 菱形与卡片标题右侧的图例对应。图内没有图例行或列头行。名称默认 9em，labelWidth 可指定 px；meta 仅进入名称的悬停 / 焦点提示与读屏，tag 可选并放在名称后。容器不足 360px 时上下排列，名称完整换行；默认 stacked 保留原布局。",
 "metric-summary":"items[].visual 可传 ring 的 value/max 或 sparkline 的 values；装饰图形对读屏隐藏，文本披露原始数值。items[].help 在指标名旁提供 coss Popover，支持键盘与关闭后焦点返回。",
}
export function LearningChartProperties({kind}:{kind:string}){
 const [narrow,setNarrow]=useState(false),[edge,setEdge]=useState(false),[labels,setLabels]=useState(true),[precision,setPrecision]=useState(false),[notice,setNotice]=useState("选择结果由外部接收。")
 const [inline,setInline]=useState(true),[hidden,setHidden]=useState(false),[boundary,setBoundary]=useState(false),[wideLabel,setWideLabel]=useState(false)
 const select=(id:string,metric?:string)=>setNotice(`请求查看：${id}${metric?` · ${metric}`:""}`)
 return <><DemoSection id="learning-properties" title="学情分析公开属性" description={descriptions[kind]}>
  <div className="mb-4 flex flex-wrap gap-2"><Button variant="outline" aria-pressed={narrow} onClick={()=>setNarrow(!narrow)}>320px 容器</Button><Button variant="outline" aria-pressed={edge} onClick={()=>setEdge(!edge)}>长中文、公式与缺测</Button>{kind!=="metric-summary"&&<Button variant="outline" aria-pressed={precision} onClick={()=>setPrecision(!precision)}>保留一位小数</Button>}{kind==="paired-dot-chart"&&<><Button variant="outline" aria-pressed={inline} onClick={()=>setInline(!inline)}>单行布局</Button><Button variant="outline" aria-pressed={hidden} onClick={()=>setHidden(!hidden)}>隐藏数据披露</Button><Button variant="outline" aria-pressed={boundary} onClick={()=>{setBoundary(!boundary);setNarrow(false)}}>360px 容器</Button><Button variant="outline" aria-pressed={wideLabel} onClick={()=>setWideLabel(!wideLabel)}>名称列 180px</Button></>}{kind==="quadrant-chart"&&<Button variant="outline" aria-pressed={!labels} onClick={()=>setLabels(!labels)}>隐藏点标签</Button>}</div>
  <div className="@container min-w-0 max-w-full" style={{width:narrow?320:kind==="paired-dot-chart"&&boundary?360:960}}>
   {kind==="trend-chart"&&<TrendChart label="班级得分率与预期" yDomain="auto" xTickMode="all" decimals={precision?1:0} unit="%" height={320} onSelect={select} series={edge?learningTrendSeries.map(s=>({...s,data:s.data.map(p=>({...p,annotation:p.annotation?`${p.annotation}；请结合题目难度与公式 x² + y² = 1 的适用范围核对，不直接比较跨口径分数。`:undefined}))})):learningTrendSeries}/>}
   {kind==="quadrant-chart"&&<QuadrantScatterChart label="课程与知识点聚焦" labelMode={labels?"auto":"none"} decimals={precision?1:0} xLabel="近期得分率" yLabel="补回率" xUnit="%" unit="%" xDomain="auto" yDomain="auto" quadrants={{x:70.46929824561403,y:75.204,labels:["得分低 · 补得快","得分高 · 补得快","优先处理","得分高 · 补得慢"],highlight:{quadrant:"bottom-left",tone:"destructive"}}} groups={[{id:"chapter",label:"章",symbol:"circle"},{id:"knowledge",label:"知识点",symbol:"diamond"}]} data={[
    {id:"chapter-21",label:"第二十一章 一元二次方程",x:82,y:85,group:"chapter"},{id:"chapter-22",label:"第二十二章 二次函数",x:69.46929824561403,y:68.222,group:"chapter"},
    {id:"roots",label:edge?"根与系数的关系：x₁ + x₂ = −b/a，需要结合完整答题证据解释":"根与系数的关系",x:64,y:edge?null:76,group:"knowledge"},{id:"application",label:"二次函数的应用",x:62,y:63,group:"knowledge"},
    {id:"functions",label:"函数与方程",x:64,y:63,group:"knowledge"},
   ]} onSelect={select}/>}
   {kind==="paired-dot-chart"&&<div className="min-w-0 space-y-3"><div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><h3 className="text-block-title">错题：出错与再错</h3><ChartLegend items={pairedDotLegendItems(learningPairedMetrics)} align="right" className="ml-auto"/></div><PairedDotChart legendPosition="none" label="错题：出错与再错" rowLayout={inline?"inline":"stacked"} labelWidth={wideLabel?180:undefined} dataDisclosure={hidden?"hidden":"visible"} density="compact" maxTrackWidth={420} decimals={precision?1:0} connectPairs domain={[0,100]} unit="%" metrics={learningPairedMetrics} data={[
    {id:"Q15",label:edge?"Q15 一元二次方程 x² − 3x + 2 = 0 的完整解题过程":"Q15 一元二次方程",meta:"有效作答 51 人",tag:<Badge variant="warning">继续巩固</Badge>,first:52.46929824561403,second:edge?null:44.222},
    {id:"Q7",label:"Q7 根与系数",tag:<Badge variant="success">已有改善</Badge>,first:45,second:edge?45:33},{id:"Q12",label:"Q12 二次函数应用",first:edge?0:36,second:edge?100:25},
   ]} onSelect={select}/></div>}
   {kind==="metric-summary"&&<MetricSummary items={edge?learningMetrics.map((item,i)=>({...item,label:i===0?"需要结合长中文口径与公式 x² + y² = 1 解释的指标":item.label,visual:i===2?{kind:"sparkline",values:[null,0,null]}:item.visual})):learningMetrics} onSelect={select}/>}
  </div><Feedback>{notice}</Feedback>
 </DemoSection><HostChartFormatDemo kind={kind}/></>
}

// Demonstration only. Production consumers supply their own versioned formatter.
function demoDecimal(value:number):[bigint,bigint]{
 const [mantissa,exponent="0"]=String(Math.abs(value)).split("e"),[whole,fraction=""]=mantissa.split(".")
 const power=Number(exponent)-fraction.length,digits=BigInt(whole+fraction)*(value<0?-BigInt(1):BigInt(1))
 return power>=0?[digits*BigInt(10)**BigInt(power),BigInt(1)]:[digits,BigInt(10)**BigInt(-power)]
}
function demoRatio(numerator:number,denominator:number,unit:string,percent=false):ChartValueText{
 if(!Number.isFinite(numerator)||!Number.isFinite(denominator)||denominator<=0)return {text:"—",ariaText:"—，分母为零或数值无效"}
 const [n,nd]=demoDecimal(numerator),[d,dd]=demoDecimal(denominator),raw=n*dd*(percent?BigInt(100):BigInt(1)),base=nd*d
 const magnitude=(raw<BigInt(0)?-raw:raw)*BigInt(10),rounded=magnitude/base+(magnitude%base*BigInt(2)>=base?BigInt(1):BigInt(0))
 const number=`${raw<BigInt(0)&&rounded!==BigInt(0)?"−":""}${rounded/BigInt(10)}.${rounded%BigInt(10)}`
 const endpoint=unit==="%"&&raw>BigInt(0)&&raw<BigInt(100)*base&&rounded===BigInt(1000)
 return {text:`${number}${unit}${endpoint?"（四舍五入）":""}`}
}
export const demoHostValueFormatter:ChartValueFormatter=(value,ctx)=>value==null
 ?{text:"—",ariaText:"—，尚无可比再考记录"}:demoRatio(value,1,ctx.unit)
export const demoHostShareFormatter=(numerator:number,denominator:number)=>demoRatio(numerator,denominator,"%",true)
const hostFormatValues=[70,57.5,99.975,null]
const hostFormatNames=["整值","23/40","3999/4000","尚无记录"]
export function HostChartFormatDemo({kind}:{kind:string}){
 return <DemoSection id="host-chart-format" title="宿主格式回调" description="合成数据：同一宿主回调提供固定一位小数、端点说明与缺值原因；刻度保持原格式，图形仍使用原始值。">
  {kind==="trend-chart"&&<TrendChart label="宿主格式趋势" unit="%" formatValue={demoHostValueFormatter} series={[{id:"rate",label:"观测比例",data:hostFormatValues.map((value,index)=>({id:String(index),label:hostFormatNames[index],value,...(value===null?{}:{valueLabel:demoHostValueFormatter(value,{unit:"%"}).text})}))}]}/>}
  {kind==="quadrant-chart"&&<QuadrantScatterChart label="宿主格式象限" xLabel="得分率" yLabel="补回率" xUnit="%" unit="%" xDomain={[0,100]} yDomain={[0,100]} formatValue={demoHostValueFormatter} formatThreshold={(value)=>({text:`${Math.round(value??0)}%`})} quadrants={{x:70,y:60,labels:["左上","右上","左下","右下"]}} data={hostFormatValues.map((value,index)=>({id:String(index),label:hostFormatNames[index],x:value,y:value}))}/>}
  {kind==="paired-dot-chart"&&<PairedDotChart label="宿主格式双点" unit="%" rowLayout="inline" formatValue={demoHostValueFormatter} metrics={[{id:"first",label:"首次"},{id:"second",label:"再次"}]} data={hostFormatValues.map((value,index)=>({id:String(index),label:hostFormatNames[index],first:value,second:value}))}/>}
  {kind==="metric-summary"&&<div className="space-y-4">
   <MetricSummary items={[{id:"rate",label:"近期得分率",value:"70.0%",visual:{kind:"sparkline",unit:"%",values:hostFormatValues,formatValue:demoHostValueFormatter}}]}/>
   <SegmentedBar label="宿主份额：23/40" total={40} dataDisclosure="visible" segments={[{id:"sample",label:"已观察",value:23}]} shareFormatter={demoHostShareFormatter}/>
   <SegmentedBar label="宿主份额：3999/4000" total={4000} dataDisclosure="visible" segments={[{id:"sample",label:"已观察",value:3999}]} shareFormatter={demoHostShareFormatter}/>
   <BpSizeBar rows={[{id:"rate",label:"近期比例",total:100,unit:"%",display:"70.0%",segments:[{id:"actual",label:"实际",value:70,fill:"ink"}]}]} marker={{value:99.975,label:"参考"}} formatValue={demoHostValueFormatter}/>
  </div>}
 </DemoSection>
}
