"use client"
import { ParsingWorkspace } from "@/examples/teacher-use-cases/parsing-workspace"
import { Tabs,TabsList,TabsTab,TabsPanel } from "@/components/coss/tabs"
import { AgentComposer, AgentTaskProgress } from "@/components/prism-next/agent-components"
import { useEffect, useReducer, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Check, ChevronDown, Circle, FileText, RotateCcw, Square, X } from 'lucide-react'
import { Button } from '@/components/coss/button'
import { Badge } from '@/components/prism-next/badge'
import { Textarea } from '@/components/coss/textarea'
import { Label } from '@/components/coss/label'
import { Spinner } from '@/components/coss/spinner'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/coss/select'
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from '@/components/coss/collapsible'
import { Alert, AlertTitle, AlertDescription } from '@/components/coss/alert'
import { initialTask, taskReducer, taskSteps, reviewSuggestion, type ReviewAdoptionState } from '@/lib/prism-next/review'

const scenarios=[{value:'normal',label:'正常流程'},{value:'failure',label:'异常恢复'}]
export function AgentWorkspace({compact=false,onApply,adoptionState='absent'}:{compact?:boolean;onApply?:(notes:string)=>boolean|void;adoptionState?:ReviewAdoptionState}) {
  const [task,dispatch]=useReducer(taskReducer,initialTask)
  const [prompt,setPrompt]=useState('')
  const [scenario,setScenario]=useState('normal')
  const [details,setDetails]=useState(true)
  const [copied,setCopied]=useState('')
  useEffect(()=>{if(task.status!=='running')return;const id=setTimeout(()=>dispatch({type:'advance'}),800);return()=>clearTimeout(id)},[task.status,task.step])
  const active=task.status==='running'
  const canApply=onApply?adoptionState==='absent':task.status==='confirm'
  const adoptionMessage=onApply?(adoptionState==='saved'?'建议已保存到修订备注。':'建议已追加到备注，待保存。'):'已采用，结果保留在本次演示中。'
  const start=()=>{if(prompt.trim()){setCopied('');dispatch({type:'start',request:prompt,failure:scenario==='failure'})}}
  const retry=()=>{setScenario('normal');dispatch({type:'start',request:task.request,failure:false})}
  return <div className={compact?'space-y-5':'mx-auto max-w-3xl space-y-8'}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge variant="outline">交互演示</Badge><span className="text-ui-hint text-muted-foreground">当前材料 · 二次方程</span></div><div className="w-36"><Select items={scenarios} value={scenario} onValueChange={v=>{if(v)setScenario(v)}} disabled={active}><SelectTrigger aria-label="演示场景"><SelectValue/></SelectTrigger><SelectPopup>{scenarios.map(s=><SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectPopup></Select></div></div>
    {task.status==='idle' ? <div className={compact?'space-y-4 py-5':'space-y-5 py-12'}><FileText className="size-6 text-muted-foreground" aria-hidden/><h2 className={compact?'text-section-title':'text-section-title'}>一起完成这份材料的复核</h2><p className="max-w-lg text-ui-hint text-muted-foreground">查看任务步骤、检查结论，再决定是否采用建议。本例使用固定材料和本地演示流程。</p><div className="flex flex-wrap gap-2">{['复核公式与数字','检查结论是否完整','整理修订备注'].map(s=><Button key={s} variant="outline" size="sm" onClick={()=>setPrompt(s)}>{s}</Button>)}</div></div> : <div className="space-y-6">
      <div className="ml-auto max-w-[90%] rounded-xl bg-muted px-4 py-3 text-read-body whitespace-pre-wrap break-words">{task.request}</div>
      <Collapsible open={details} onOpenChange={setDetails}><CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-left text-ui-action focus-visible:outline-2 focus-visible:outline-ring">{active?<Spinner/>:task.status==='error'?<X className="size-4 text-destructive-foreground"/>:<FileText className="size-4"/>}<span className="flex-1">{active?'正在复核':task.status==='stopped'?'任务已停止':'复核过程'}</span><ChevronDown className={'size-4 transition-transform '+(details?'rotate-180':'')}/></CollapsibleTrigger><CollapsiblePanel><AgentTaskProgress steps={taskSteps.map((label,i)=>({id:String(i),label,state:i<task.step?"done":i===task.step&&active?"running":i===task.step&&task.status==="error"?"error":"pending"}))}/></CollapsiblePanel></Collapsible>
      <AnimatePresence mode="wait">{(task.status==='confirm'||task.status==='completed')&&<motion.div key="result" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}} className="space-y-4"><h3 className="font-semibold">公式与数字一致</h3><p className="text-read-body">对于 x² − 3x + 2 = 0，判别式为 9 − 8 = 1；代入求根公式得到 1 和 2，与材料中的数字一致。</p><div className="rounded-lg border p-4"><p className="mb-2 text-ui-hint text-muted-foreground">建议备注</p><p className="text-read-body">{reviewSuggestion}</p></div>{canApply?<div className="space-y-3">{onApply&&<p className="text-ui-hint text-muted-foreground" role="status">建议尚未加入当前备注，可继续追加。</p>}<div className="flex flex-wrap gap-2"><Button onClick={()=>{if(onApply?.(reviewSuggestion)===false)return;dispatch({type:'apply'})}}>{onApply?'追加到修订备注':'采用建议'}</Button><Button variant="ghost" onClick={()=>dispatch({type:'reset'})}>暂不采用</Button></div></div>:<p className="flex items-center gap-2 text-ui-body" role="status"><Check className="size-4 text-success-foreground"/>{adoptionMessage}</p>}<Button size="sm" variant="ghost" onClick={async()=>{try{await navigator.clipboard.writeText(reviewSuggestion);setCopied('已复制建议。')}catch{setCopied('复制未成功，可选中上方文字复制。')}}}>复制建议</Button><span className="text-ui-hint text-muted-foreground" role="status">{copied}</span></motion.div>}</AnimatePresence>
      {task.status==='error'&&<Alert variant="error"><AlertTitle>演示的校验步骤失败</AlertTitle><AlertDescription><p>这是“异常恢复”场景。已完成的步骤保留，可以重新运行正常流程。</p><Button variant="outline" size="sm" className="mt-3" onClick={retry}><RotateCcw/>重试</Button></AlertDescription></Alert>}
      {task.status==='stopped'&&<div className="space-y-3"><p className="text-ui-hint text-muted-foreground">任务已停止，没有采用任何建议。</p><Button size="sm" variant="outline" onClick={retry}>从头重试</Button></div>}
      <p className="sr-only" role="status" aria-live="polite">{active?taskSteps[task.step]:task.status==='confirm'?'复核完成，等待确认建议。':task.status==='error'?'任务失败，可以重试。':task.status==='stopped'?'任务已停止。':''}</p>
    </div>}
    <AgentComposer value={prompt} onChange={setPrompt} running={active} onSubmit={start} onStop={()=>dispatch({type:"stop"})} label="复核任务" placeholder="描述这份材料需要复核的内容…" submitLabel={task.status==="idle"?"运行演示":"重新运行"}/>

    {task.status!=='idle'&&!active&&<Button variant="ghost" size="sm" onClick={()=>{dispatch({type:'reset'});setPrompt('');setCopied('')}}>新任务</Button>}
  </div>
}

/** Existing Agent pattern route; compact reading assistant remains unchanged. */
export function AgentWorkspaceExamples(){
 return <Tabs defaultValue="parsing"><TabsList variant="underline" aria-label="Agent 工作区示例"><TabsTab value="parsing">试卷解析引导</TabsTab><TabsTab value="review">材料复核助手</TabsTab></TabsList><TabsPanel value="parsing" keepMounted className="pt-5"><ParsingWorkspace embedded/></TabsPanel><TabsPanel value="review" className="pt-5"><AgentWorkspace/></TabsPanel></Tabs>
}
