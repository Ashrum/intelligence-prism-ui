"use client"
import { useId, useState } from 'react'
import { Button } from '@/components/coss/button'
import { Label } from '@/components/coss/label'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/coss/select'
import type { ActivityMonitorData } from '@/components/prism-next/skeletons/ai-activity-monitor'
import type { ShellTask } from '@/components/prism-next/skeletons/workbench-model'

const scenarios = [
 {value:'mixed',label:'多个任务'}, {value:'idle',label:'空闲'}, {value:'queued',label:'排队中'},
 {value:'running',label:'运行中'}, {value:'attention',label:'需关注'}, {value:'failed',label:'失败'},
 {value:'completed',label:'AI 处理完成'}, {value:'stale',label:'状态更新中断'}, {value:'unavailable',label:'服务未接入'},
]
function grading(step: number): ShellTask {
 const done = step >= 2
 return {id:'grading-1',kind:'grading',title:'函数与导数阶段检测',context:'数学 · 高二（1）班',state:done?'completed':'running',stage:done?'批阅处理结束':'正在批阅主观题',processed:done?38:step===1?35:31,total:38,unit:'份',updatedAt:done?'10:40':step===1?'10:38':'10:36',detail:done?'整批作答已处理，7 项判断需教师复核。':'已处理部分作答，当前结果为阶段性记录。',followUp:done?'7 项判断待教师复核':undefined,steps:[{label:'接收作答与评分要求',time:'10:18',state:'done'},{label:'识别作答区域',time:'10:23',state:'done'},{label:'批阅主观题',time:done?'10:40':undefined,state:done?'done':'current'}]}
}
function parsing(step:number): ShellTask {
 const state=step===0?'queued':step>=3?'completed':'running'
 return {id:'parsing-1',kind:'parsing',title:'二次函数单元复习资料：含分段函数、图像与长中文条件的课堂练习',context:'数学 · 九年级备课资料',state,stage:state==='queued'?'等待开始解析':state==='completed'?'材料结构化处理结束':'正在识别题目结构',processed:state==='completed'?20:state==='running'?12:undefined,total:20,unit:'页',updatedAt:state==='queued'?'10:34':state==='completed'?'10:42':'10:38',detail:state==='queued'?'材料已接收，等待执行。暂无可靠的开始时间。':state==='completed'?'20 页材料已完成解析，解析结果尚未入库或发布。':'正在识别题干、公式与答案区域。已识别内容仍需完整性校验。',result:state==='completed'?'解析结果已生成 · 尚未入库':undefined,steps:[{label:'接收材料',time:'10:34',state:'done'},{label:'识别题目结构',state:state==='queued'?'waiting':state==='running'?'current':'done'},{label:'校验题目完整性',state:state==='completed'?'done':'waiting'}]}
}
function review(): ShellTask {
 return {...grading(2),id:'grading-review',title:'二次函数单元练习',context:'数学 · 九年级（1）班',processed:46,total:46,updatedAt:'10:32',steps:[{label:'接收46份作答',time:'10:22',state:'done'},{label:'完成AI批阅',time:'10:32',state:'done'}]}
}
/** Explicit fixture; no timer, network, production state or business result writes. */
export function useActivityMonitorFixture(): ActivityMonitorData {
 const [scenario,setScenario]=useState('mixed'),[step,setStep]=useState(0)
 const id=useId()
 let tasks:ShellTask[]=[]
 if(scenario==='mixed'||scenario==='stale')tasks=[grading(step),parsing(step),review()]
 if(scenario==='queued')tasks=[parsing(step)]
 if(scenario==='running')tasks=[grading(step),parsing(Math.min(step+1,3))]
 if(scenario==='attention')tasks=[{...parsing(1),state:'attention',stage:'等待补充材料',detail:'第8页图像不完整，无法继续解析该题。已识别的其他页面记录保留。',followUp:'请补充清晰的第8页',updatedAt:'10:39',steps:[{label:'接收材料',state:'done',time:'10:34'},{label:'检查图像完整性',state:'current',time:'10:39'},{label:'继续解析',state:'waiting'}]}]
 if(scenario==='failed')tasks=[{...parsing(1),state:'failed',stage:'解析未完成',detail:'材料识别失败，未生成完整结果。查看原因后可在业务任务中重试。',updatedAt:'10:39',steps:[{label:'接收材料',state:'done',time:'10:34'},{label:'识别题目结构',state:'failed',time:'10:39'},{label:'校验完整性',state:'waiting'}]}]
 if(scenario==='completed')tasks=[parsing(3),review()]
 const canAdvance=['mixed','queued','running'].includes(scenario)&&step<3
 return {tasks,availability:scenario==='unavailable'?'unavailable':'ready',freshness:scenario==='stale'?'stale':'current',sourceLabel:'演示数据 · 当前教师 · 未连接真实任务服务',footer:<div className="space-y-2">
  <Label htmlFor={id}>演示场景</Label><div className="flex flex-wrap items-center gap-2"><Select items={scenarios} value={scenario} onValueChange={value=>{if(value){setScenario(value);setStep(0)}}}><SelectTrigger id={id} aria-label="AI 活动演示场景" className="min-w-0 flex-1"><SelectValue/></SelectTrigger><SelectPopup>{scenarios.map(s=><SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectPopup></Select><Button variant="outline" size="sm" disabled={!canAdvance} onClick={()=>setStep(value=>Math.min(value+1,3))}>推进演示一步</Button></div>
  <p className="text-xs text-muted-foreground leading-5">仅改变本页示例。批阅与解析独立于 Agent 回复。</p>
 </div>}
}
