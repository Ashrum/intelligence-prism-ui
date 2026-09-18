"use client"
import { useId,type ReactNode } from "react"
import { ArrowUp,Square } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { Spinner } from "@/components/coss/spinner"
import { StatusBadge } from "./status-badge"
export function AgentComposer({value,onChange,running=false,onSubmit,onStop,label="任务",placeholder="描述需要完成的任务…",submitLabel="运行",maxLength=1000}:{value:string;onChange:(value:string)=>void;running?:boolean;onSubmit:()=>void;onStop?:()=>void;label?:string;placeholder?:string;submitLabel?:string;maxLength?:number}){const id=useId();const submit=()=>{if(!running&&value.trim())onSubmit()};return <form className="space-y-3" onSubmit={e=>{e.preventDefault();submit()}}><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} onChange={e=>onChange(e.target.value)} disabled={running} placeholder={placeholder} maxLength={maxLength} onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)&&!e.nativeEvent.isComposing){e.preventDefault();submit()}}}/><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-[.8125rem] text-muted-foreground">{value.length} / {maxLength} · Ctrl / ⌘ + Enter</span>{running?<Button type="button" variant="outline" disabled={!onStop} onClick={onStop}><Square/>停止</Button>:<Button type="submit" disabled={!value.trim()}><ArrowUp/>{submitLabel}</Button>}</div></form>}
export function AgentTaskProgress({steps,actions}:{steps:{id:string;label:string;state:"done"|"running"|"pending"|"error"}[];actions?:ReactNode}) {
 return <div><ol className="space-y-3 py-4 text-sm">{steps.map(step=><li key={step.id} aria-current={step.state==="running"?"step":undefined} className="flex flex-wrap items-start justify-between gap-2 py-1">
  <span className={"flex min-w-0 flex-1 items-start gap-2 leading-7 "+(step.state==="pending"?"text-muted-foreground":"")}>{step.state==="running"&&<Spinner className="mt-1.5 shrink-0 text-(--brand-blue-ink)"/>}{step.label}</span>
  <StatusBadge tone={step.state==="done"?"complete":step.state==="running"?"active":step.state==="error"?"error":"neutral"}>{{done:"已完成",running:"进行中",pending:"待开始",error:"失败"}[step.state]}</StatusBadge>
 </li>)}</ol>{actions}</div>
}
