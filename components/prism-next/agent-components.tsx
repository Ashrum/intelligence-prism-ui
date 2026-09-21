"use client"
import { useId,useRef,type ReactNode } from "react"
import { ArrowUp,Check,Circle,Square,FileText,ArrowUpRight,CircleAlert } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { Spinner } from "@/components/coss/spinner"
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/coss/input-group"
import { Radio, RadioGroup } from "@/components/coss/radio-group"
import { Card } from "@/components/coss/card"
import { Badge } from "@/components/prism-next/badge"
import { Separator } from "@/components/coss/separator"
export function AgentComposer({
  value, onChange, running = false, onSubmit, onStop, label = "任务",
  placeholder = "描述需要完成的任务…", submitLabel = "运行", maxLength = 1000,
  variant = "default", footerNote, context, suggestions, tools, attachments, toolbarLayout = "responsive", toolbarSeparator = false, inputSize = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  running?: boolean;
  onSubmit: () => void;
  onStop?: () => void;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  maxLength?: number;
  variant?: "default" | "compact" | "conversation";
  footerNote?: ReactNode;
  context?: ReactNode;
  suggestions?: ReactNode;
  tools?: ReactNode;
  attachments?: ReactNode;
  toolbarLayout?: "responsive" | "inline";
  toolbarSeparator?: boolean;
  inputSize?: "default" | "compact";
}) {
  const id = useId();
  const compact = variant === "compact";
  const stop = () => { onStop?.(); requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: true })); };
  const submit = () => { if (!running && value.trim()) onSubmit(); };
  if (variant === "conversation") {
    return <form className="relative min-w-0 space-y-3" onSubmit={event => { event.preventDefault(); submit(); }}>
      <Label htmlFor={id} className="sr-only">{label}</Label>
      <InputGroup className="@container/agent-composer">
        {attachments && <InputGroupAddon align="block-start" className="min-w-0 flex-wrap">{attachments}</InputGroupAddon>}
        <InputGroupTextarea
          id={id}
          value={value}
          onChange={event => onChange(event.target.value)}
          disabled={running}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={inputSize === "compact" ? 2 : 4}
          className={inputSize === "compact" ? "[&>textarea]:min-h-16 [&>textarea]:max-h-40 [&>textarea]:overflow-y-auto" : "[&>textarea]:min-h-28 [&>textarea]:max-h-60 [&>textarea]:overflow-y-auto"}
          onKeyDown={event => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {toolbarSeparator && <div className="w-full px-3 pb-3"><Separator /></div>}
        <InputGroupAddon align="block-end" className={toolbarLayout === "inline" ? "min-w-0 flex-row items-center gap-2" : "min-w-0 flex-col items-stretch gap-2 @min-[420px]/agent-composer:flex-row @min-[420px]/agent-composer:items-center"}>
          {tools && <div className={toolbarLayout === "inline" ? "flex min-w-0 max-w-full flex-1 items-center gap-1" : "flex min-w-0 max-w-full items-center gap-1 @min-[420px]/agent-composer:flex-1"}>{tools}</div>}
          <div className="ml-auto flex min-w-0 max-w-full items-center justify-end gap-2">
            {context}
            {running
              ? <Button type="button" variant="outline" size="icon" aria-label="停止" disabled={!onStop} onClick={stop}><Square aria-hidden="true" /></Button>
              : <Button type="submit" size="icon" aria-label={submitLabel} disabled={!value.trim()}><ArrowUp aria-hidden="true" /></Button>}
          </div>
        </InputGroupAddon>
      </InputGroup>
      <div className="min-w-0 text-ui-hint text-muted-foreground">{footerNote ?? <>{value.length} / {maxLength} · Ctrl / ⌘ + Enter</>}</div>
      {suggestions}
    </form>;
  }
  return <form className={compact ? "relative space-y-2" : "relative space-y-3"} onSubmit={event => { event.preventDefault(); submit(); }}>
    <Label htmlFor={id} className={compact ? "sr-only" : undefined}>{label}</Label>
    <Textarea
      id={id}
      value={value}
      onChange={event => onChange(event.target.value)}
      disabled={running}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={compact ? 2 : undefined}
      className={compact ? "[&>textarea]:min-h-12" : undefined}
      onKeyDown={event => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
          event.preventDefault();
          submit();
        }
      }}
    />
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 text-ui-hint text-muted-foreground">{footerNote ?? <>{value.length} / {maxLength} · Ctrl / ⌘ + Enter</>}</div>
      <div className="flex shrink-0 items-center gap-2">
        {context}
        {running
          ? <Button type="button" variant="outline" size={compact ? "icon" : "default"} aria-label={compact ? "停止" : undefined} disabled={!onStop} onClick={stop}><Square aria-hidden="true" />{!compact && "停止"}</Button>
          : <Button type="submit" size={compact ? "icon" : "default"} aria-label={compact ? submitLabel : undefined} disabled={!value.trim()}><ArrowUp aria-hidden="true" />{!compact && submitLabel}</Button>}
      </div>
    </div>
    {suggestions}
  </form>;
}
export type AgentStep = {id:string;label:string;state:"done"|"running"|"pending"|"error";detail?:string}
export function AgentTaskProgress({steps,actions}:{steps:AgentStep[];actions?:ReactNode}) {
 return <div><ol aria-label="任务执行步骤" className="space-y-4 py-3">{steps.map(step=><li key={step.id} aria-current={step.state==='running'?'step':undefined} className="flex items-start gap-3">
  <span aria-hidden="true" className="mt-1 shrink-0">{step.state==='done'?<Check className="size-4 text-success-foreground"/>:step.state==='running'?<Spinner/>:step.state==='error'?<CircleAlert className="size-4 text-destructive-foreground"/>:<Circle className="size-4 text-muted-foreground"/>}</span>
  <div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-x-4 gap-y-1"><span className="text-ui-action">{step.label}</span><span className={step.state==='error'?'text-ui-hint text-destructive-foreground':'text-ui-hint text-muted-foreground'}>{{done:'已完成',running:'进行中',pending:'待开始',error:'失败'}[step.state]}</span></div>{step.detail&&<p className="mt-1 text-ui-hint text-muted-foreground">{step.detail}</p>}</div>
 </li>)}</ol>{actions}</div>
}

/** Controlled clarification only. Selecting a choice never starts or saves a task. */
export function AgentQuestionCard({question,description,options,value,onValueChange,children,disabled=false}:{
 question:string;description?:string;options:readonly {value:string;label:string;description?:string;disabled?:boolean}[];
 value:string;onValueChange:(value:string)=>void;children?:ReactNode;disabled?:boolean;
}) {
 const id=useId()
 return <Card className="gap-4 p-5" aria-labelledby={id}><div><p className="mb-2 text-ui-hint text-info-foreground">需要你确认</p><h3 id={id} className="text-block-title">{question}</h3>{description&&<p className="mt-2 text-ui-hint text-muted-foreground">{description}</p>}</div>
  <RadioGroup aria-labelledby={id} value={value} disabled={disabled} onValueChange={v=>typeof v==='string'&&onValueChange(v)}>{options.map((option,index)=><div key={option.value} className="flex items-start gap-3"><Radio id={`${id}-${index}`} value={option.value} disabled={option.disabled} className="mt-1"/><Label htmlFor={`${id}-${index}`} className="flex min-w-0 flex-1 flex-col items-start gap-1"><span className="text-ui-action">{option.label}</span>{option.description&&<span className="text-ui-hint font-normal text-muted-foreground">{option.description}</span>}</Label></div>)}</RadioGroup>{children}
 </Card>
}

export type AgentContextItem = {id:string;title:string;location:string;description?:string;status?:ReactNode}
export function AgentContextList({label='本次使用的材料',items,onInspect}:{label?:string;items:readonly AgentContextItem[];onInspect?:(id:string)=>void}) {
 const id=useId()
 return <section aria-labelledby={id} className="space-y-3"><h3 id={id} className="text-block-title">{label}</h3>{items.length?<ul className="space-y-2">{items.map(item=><li key={item.id} className="flex min-w-0 items-start gap-3 rounded-lg bg-secondary p-4"><FileText className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true"/><div className="min-w-0 flex-1"><p className="break-words text-item-title">{item.title}</p><p className="mt-1 text-ui-hint text-muted-foreground">{item.location}</p>{item.description&&<p className="mt-1 text-ui-hint text-muted-foreground">{item.description}</p>}{item.status&&<div className="mt-2">{item.status}</div>}{onInspect&&<Button variant="ghost" size="sm" className="mt-2" aria-label={`查看材料：${item.title}`} onClick={()=>onInspect(item.id)}>查看原稿<ArrowUpRight/></Button>}</div></li>)}</ul>:<p className="text-ui-hint text-muted-foreground">尚未引用材料。</p>}</section>
}

export type AgentChangeDecision = 'pending'|'accepted'|'kept'
/** Proposals are caller-owned. This component never edits content or persists it. */
export function AgentChangeReview({title,before,after,reason,decision,onDecision,disabled=false,disabledReason}:{
 title:string;before:string;after:string;reason:string;decision:AgentChangeDecision;
 onDecision:(decision:'accepted'|'kept')=>void;disabled?:boolean;disabledReason?:string;
}) {
 const id=useId(),heading=useRef<HTMLHeadingElement>(null)
 const choose=(value:'accepted'|'kept')=>{onDecision(value);requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}))}
 return <Card aria-labelledby={id} className="@container gap-4 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 ref={heading} tabIndex={-1} id={id} className="text-block-title outline-none">{title}</h3><Badge size="lg" variant={decision==='pending'?'warning':'outline'}>{decision==='pending'?'待决定':decision==='accepted'?'已采用 · 尚需核对':'已保留原文'}</Badge></div><p className="text-ui-hint text-muted-foreground">{reason}</p>
 <div className="grid min-w-0 gap-4 @min-[560px]:grid-cols-2"><section className="min-w-0"><h4 className="mb-2 text-ui-action">修改前</h4><p className="whitespace-pre-wrap break-words text-read-body">{before}</p></section><section className="min-w-0 rounded-lg bg-secondary p-4"><h4 className="mb-2 text-ui-action">建议内容</h4><p className="whitespace-pre-wrap break-words text-read-body">{after}</p></section></div>
 {decision==='pending'&&<div className="flex flex-wrap gap-2"><Button disabled={disabled||before===after||!after.trim()} onClick={()=>choose('accepted')}>采用这项修改</Button><Button variant="outline" disabled={disabled} onClick={()=>choose('kept')}>保留原文</Button></div>}{disabledReason&&<p role="status" className="text-ui-hint text-warning-foreground">{disabledReason}</p>}
 </Card>
}
