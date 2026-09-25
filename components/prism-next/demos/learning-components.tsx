"use client"
import { useId,useState } from "react"
import Link from "next/link"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/prism-next/badge"
import { DemoSection } from "../demo-parts"
import { QuestionSelect } from "../question-controls"
import { QuestionWorkPanel } from "../question-work-panel"
import { QuestionReviewDemo, QuestionReviewExample } from "./question-review"
import { DiagnosisEvidenceTable,LearningGoalCard,LearningTaskList,VerificationFields,MilestoneList,type CriterionResult } from "../learning-components"
import { WorkloadCalendar } from "../workload-calendar"
import { DocumentRegionViewer } from "../document-region-viewer"
import { AgentPatternsDemo } from "./agent-patterns"
import { AgentChangeSetDemo } from "./agent-change-set"
import { AgentSemanticGroupDemo } from "./agent-semantic-group"
import { AgentRecordViewsDemo } from "./agent-record-views"
import { AgentExceptionHandlerDemo } from "./agent-exception-handler"
import { AgentEvidenceDrilldownDemo } from "./agent-evidence-drilldown"
import { AgentItemReviewerDemo } from "./agent-item-reviewer"
import { AgentComposer,AgentTaskProgress } from "../agent-components"
import type { QuestionRecord } from "../question-content"
const shortQuestion:QuestionRecord={id:"EX-READ-1",title:"信息提取",kind:"简答题",points:5,response:"long",stem:"阅读记录：图书馆周二开放至 18:00。请写出开放日与结束时间。",answer:"周二，18:00。",explanation:"从记录中提取日期与时间。"}
export function LearningComponentDemo({kind}:{kind:string}){const panelId=useId();const [second,setSecond]=useState(false),[selected,setSelected]=useState<string>(),[results,setResults]=useState<Record<string,CriterionResult|undefined>>({}),[note,setNote]=useState(""),[date,setDate]=useState(new Date(2026,8,16)),[month,setMonth]=useState(new Date(2026,8,1)),[prompt,setPrompt]=useState(""),[running,setRunning]=useState(false),[notice,setNotice]=useState("");const title=second?"说明判断依据":"明确数量与单位";const criteria=[{id:"evidence",text:second?"引用材料中的具体事实":"说明数值所代表的含义"},{id:"reason",text:second?"解释事实与结论的关系":"准确标明单位与范围"}];const target=kind==="agent-components"?"/next/agent":["evaluation","diagnosis","goals","learning-plan"].includes(kind)?`/next/examples/evaluation?stage=${kind}`:undefined
return <>{kind==="agent-components"&&<div className="mb-12"><AgentItemReviewerDemo/><AgentEvidenceDrilldownDemo/><AgentExceptionHandlerDemo/><AgentRecordViewsDemo/><AgentChangeSetDemo/><AgentSemanticGroupDemo/></div>}<DemoSection title={kind==="agent-components"?"既有输入与引导组件":"可独立使用的业务组件"} description="展示数据、状态与操作由外部传入；这里的实例不连接学习工作流。"><div className="mb-6 flex flex-wrap gap-3"><Button variant="outline" onClick={()=>{setSecond(!second);setResults({});setNote("");setSelected(undefined)}}>切换另一组数据</Button>{target&&<Button variant="ghost" render={<Link href={target}/>}>查看应用示例</Button>}</div>
{kind==="evaluation"&&(second?<QuestionReviewExample key="short" question={shortQuestion} attempts={{"1":"周二，下午六点。"}} initialScores={{score:4}} learner="样本 B"/>:<QuestionReviewDemo key="math"/>)}
{kind==="diagnosis"&&<DiagnosisEvidenceTable items={[{id:"observation-1",title,observation:"需要根据现有证据进一步核对。",source:second?"阅读记录 B":"作答记录 A",location:second?"信息提取":"数量关系",status:<Badge variant="outline">待确认</Badge>}]} onInspect={setSelected}/>}
{kind==="goals"&&<LearningGoalCard id={second?"goal-b":"goal-a"} title={title} status={<Badge variant="outline">待核验</Badge>} source={second?"来源：阅读记录 B":"来源：作答记录 A"} actions={<Button variant="outline" onClick={()=>setSelected("goal")}>查看依据</Button>}><VerificationFields criteria={criteria} results={results} note={note} onResultsChange={setResults} onNoteChange={setNote}/></LearningGoalCard>}
{kind==="learning-plan"&&<LearningTaskList items={[{id:"task-1",title,condition:"完成后保留过程记录。",schedule:second?"2026-09-18 · 20 分钟":"2026-09-16 · 15 分钟",status:<Badge variant="outline">待开始</Badge>,actions:<Button onClick={()=>setNotice("外部收到开始任务的请求。")}>开始</Button>} ]}/>}
{kind==="goal-milestones"&&<MilestoneList items={[{id:"prepare",title:"确定范围",detail:second?"阅读材料 B":"测评材料 A",state:"met"},{id:"verify",title,detail:"等待新的独立证据",state:"active"},{id:"review",title:"复核结果",detail:"按明确标准核对",state:"pending"}]}/>}
{kind==="workload-calendar"&&<div className="max-w-xl"><WorkloadCalendar days={{"2026-09-16":{value:second?35:55,hasItems:true},"2026-09-18":{value:second?60:20,hasItems:true}}} capacity={45} selected={date} onSelect={value=>{setDate(value);setNotice(`已选择 ${value.toLocaleDateString("zh-CN")}`)}} month={month} onMonthChange={setMonth}/></div>}
{kind==="answer-review-map"&&<div className="max-w-2xl"><DocumentRegionViewer label="文档区域组件示例" selectedId={selected} onSelect={setSelected} header={<><p>{second?"阅读记录":"数学答卷"}</p><span>两个独立区域</span></>} regions={[{id:"region-1",label:"区域一",rect:[8,20,84,20],content:<p>{second?"第一段材料内容":"第一题作答内容"}</p>},{id:"region-2",label:"区域二",rect:[8,48,84,25],content:<p>{second?"第二段材料内容":"第二题作答内容"}</p>}]}/></div>}
{kind==="agent-components"&&<div className="max-w-2xl space-y-5"><AgentTaskProgress steps={[{id:"read",label:second?"读取记录":"检查材料",state:"done"},{id:"process",label:second?"整理事实":"核对公式",state:running?"running":"pending"}]}/><AgentComposer value={prompt} onChange={setPrompt} running={running} onSubmit={()=>{setRunning(true);setNotice("已收到任务请求；由外部执行器处理。")}} onStop={()=>{setRunning(false);setNotice("已收到停止请求。")}}/><AgentPatternsDemo key={String(second)} alternate={second}/></div>}
<p role="status" className="mt-5 min-h-5 text-ui-hint text-muted-foreground">{notice||selected&&`选中：${selected}`}</p>{kind!=="answer-review-map"&&<QuestionWorkPanel id={panelId} open={!!selected} onClose={()=>setSelected(undefined)} title="来源依据" description={title}><p className="text-ui-hint">这是调用方提供的内容。组件只返回所选记录 ID，展示位置与后续处理由外部决定。</p></QuestionWorkPanel>}</DemoSection></>}
