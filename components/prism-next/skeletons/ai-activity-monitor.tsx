"use client"

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Activity, ArrowLeft, ArrowUpRight, Check, ChevronRight, CircleAlert, CircleCheck, Clock3, FileSearch, X } from 'lucide-react'
import { Button } from '@/components/coss/button'
import { Badge } from '@/components/prism-next/badge'
import { AgentStepStatus } from '@/components/prism-next/agent-components'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/coss/empty'
import { Popover, PopoverTrigger, PopoverPopup, PopoverTitle, PopoverDescription, PopoverClose } from '@/components/coss/popover'
import { monitorCounts, monitorState, needsAttention, taskCountText, taskKindLabels, taskLabels, type ShellTask } from './workbench-model'

export type ActivityMonitorData = {
 /** Only the current user's authorized grading/parsing tasks. Filtering belongs to the application/service. */
 tasks: readonly ShellTask[]
 availability: 'ready' | 'unavailable'
 freshness: 'current' | 'stale'
 sourceLabel: string
 onOpenTask?: (id: string) => void
 footer?: ReactNode
}
const tones = { queued:'outline', running:'info', attention:'warning', failed:'error', completed:'success' } as const
type Filter = 'all' | 'processing' | 'attention' | 'completed'

/** Shared shell composition; no task scheduler, business mutation, fixture or persistence. */
export function AIActivityMonitor({ data, open, onOpenChange, triggerRef, finalFocus }: {
 data: ActivityMonitorData; open: boolean; onOpenChange: (open: boolean) => void
 triggerRef: RefObject<HTMLButtonElement | null>; finalFocus: () => HTMLButtonElement | false
}) {
 const [selectedId, setSelectedId] = useState<string | null>(null)
 const [filter, setFilter] = useState<Filter>('all')
 const [rotation, setRotation] = useState(0), [paused, setPaused] = useState(false)
 const [reduceMotion, setReduceMotion] = useState(true)
 const [resumeId, setResumeId] = useState<string | null>(null)
 const detailHeading = useRef<HTMLHeadingElement>(null)
 const listScroll = useRef(0)
 const rows = useRef(new Map<string, HTMLButtonElement>())
 const counts = monitorCounts(data.tasks), state = monitorState(data.tasks)
 const running = data.tasks.filter(t => t.state === 'running')
 const selected = data.tasks.find(t => t.id === selectedId)
 const active = data.availability === 'ready' && data.freshness === 'current' && counts.running > 0
 const shortLabel = data.availability === 'unavailable' ? '未接入' : counts.attention ? `${counts.attention} 项待处理` : counts.running ? (running.length > 1 ? (rotation % 2 ? `${taskKindLabels[running[Math.floor(rotation / 2) % running.length].kind]}进行中` : `${counts.running} 项运行中`) : `${running[0]?.kind === 'parsing' ? '解析中' : '批阅中'}`) : counts.queued ? `${counts.queued} 项排队` : counts.completed ? '处理完成' : '暂无任务'
 const summary = data.availability === 'unavailable' ? '任务服务未接入' : `${counts.running} 项运行，${counts.queued} 项排队，${counts.attention} 项待处理`
 const Icon = state === 'failed' || state === 'attention' ? CircleAlert : state === 'completed' ? CircleCheck : Activity
 const color = state === 'failed' ? 'text-destructive-foreground' : state === 'attention' ? 'text-warning-foreground' : active ? 'text-info-foreground' : state === 'completed' ? 'text-success-foreground' : 'text-muted-foreground'
 useEffect(() => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const update = () => setReduceMotion(media.matches)
  update(); media.addEventListener('change', update)
  return () => media.removeEventListener('change', update)
 }, [])
 useEffect(() => {
  if (paused || open || reduceMotion || !active || counts.attention || running.length < 2) return
  const timer = setInterval(() => setRotation(n => n + 1), 3600)
  return () => clearInterval(timer)
 }, [paused, open, reduceMotion, active, counts.attention, running.length])
 useEffect(() => { if (!open) { setSelectedId(null); setFilter('all') } }, [open])
 useEffect(() => {
  if (selectedId && open) {
   const heading = detailHeading.current
   const viewport = heading?.closest<HTMLElement>('[data-slot="popover-viewport"]')
   if (viewport) viewport.scrollTop = 0
   heading?.focus({ preventScroll:true })
  }
 }, [selectedId, open])
 useEffect(() => {
  if (resumeId && !selectedId) {
   const row = rows.current.get(resumeId)
   const viewport = row?.closest<HTMLElement>('[data-slot="popover-viewport"]')
   if (viewport) viewport.scrollTop = listScroll.current
   row?.focus({ preventScroll:true }); setResumeId(null)
  }
 }, [resumeId, selectedId])
 const filtered = data.tasks.filter(t => filter === 'all' || (filter === 'processing' && (t.state === 'running' || t.state === 'queued')) || (filter === 'attention' && needsAttention(t)) || (filter === 'completed' && t.state === 'completed'))
 const sorted = [...filtered].sort((a,b) => Number(needsAttention(b))-Number(needsAttention(a)))
 return <Popover open={open} onOpenChange={onOpenChange}>
  <PopoverTrigger render={<Button ref={triggerRef} variant="ghost" className="workbench-monitor-trigger" aria-label={`AI 活动监视器，${summary}${data.freshness === 'stale' ? '，状态暂未更新' : ''}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} />}>
   <Icon className={`${color}${active && !counts.attention ? ' ai-monitor-pulse' : ''}`} aria-hidden="true"/><span className="workbench-monitor-label ai-monitor-summary" aria-hidden="true">{shortLabel}</span>
  </PopoverTrigger>
  <PopoverPopup className="ai-monitor-popup" align="end" data-shell-overlay="monitor" finalFocus={finalFocus}>
   <div className="flex items-center justify-between gap-3"><PopoverTitle>AI 活动监视器</PopoverTitle><PopoverClose render={<Button variant="ghost" size="icon" aria-label="关闭 AI 活动监视器" />}><X/></PopoverClose></div>
   <PopoverDescription className="mt-1">我的批阅与解析任务</PopoverDescription>
   <p className="mt-2 text-ui-hint text-muted-foreground">{data.sourceLabel}</p>
   {data.freshness === 'stale' && data.availability === 'ready' && <p role="status" className="mt-3 text-ui-hint text-warning-foreground">状态暂未更新。以下为最后记录，任务是否继续执行尚未确认。</p>}
   {data.availability === 'unavailable' ? <Empty className="py-8"><EmptyHeader><EmptyTitle>任务服务未接入</EmptyTitle><EmptyDescription>当前无法获取你的批阅与解析任务。</EmptyDescription></EmptyHeader></Empty> : selected ? <section className="mt-4 space-y-4" aria-label="任务运行详情">
    <Button variant="ghost" size="sm" onClick={() => { setResumeId(selected.id); setSelectedId(null) }}><ArrowLeft/>返回活动列表</Button>
    <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{taskKindLabels[selected.kind]}</Badge><Badge variant={tones[selected.state]}>{taskLabels[selected.state]}</Badge></div><h3 ref={detailHeading} tabIndex={-1} className="text-block-title break-words outline-none">{selected.title}</h3><p className="text-ui-hint text-muted-foreground">{selected.context}</p></div>
    <div className="space-y-2"><p className="text-ui-action">{selected.stage}{taskCountText(selected) && <span className="ml-3 tabular-nums font-normal text-muted-foreground">{taskCountText(selected)}</span>}</p><p className="text-ui-hint text-muted-foreground">{selected.detail}</p>{selected.followUp && <p className="text-ui-hint text-warning-foreground">{selected.followUp}</p>}{selected.result && <p className="text-ui-body text-success-foreground">{selected.result}</p>}</div>
    <ol className="space-y-3" aria-label="任务执行阶段">{selected.steps.map((step,index) => <li key={`${index}-${step.label}`} className="flex items-start gap-3 text-ui-hint"><span className="mt-1 shrink-0" aria-hidden="true">{step.state === 'done' ? <Check className="size-4 text-success-foreground"/> : step.state === 'failed' ? <CircleAlert className="size-4 text-destructive-foreground"/> : step.state === 'current' ? <Activity className="size-4 text-info-foreground"/> : <Clock3 className="size-4 text-muted-foreground"/>}</span><div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2"><span>{step.label}</span><AgentStepStatus state={step.state==='current'?'running':step.state==='failed'?'error':step.state==='waiting'?'pending':'done'}/></div>{step.time && <span className="shrink-0 text-ui-hint text-muted-foreground tabular-nums">{step.time}</span>}</li>)}</ol>
    <p className="text-ui-hint text-muted-foreground">最近更新 · {selected.updatedAt}</p>
    {data.onOpenTask ? <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); data.onOpenTask?.(selected.id) }}>打开{taskKindLabels[selected.kind]}任务<ArrowUpRight/></Button> : <p className="text-ui-hint text-muted-foreground">演示任务暂未关联业务详情。AI 处理完成不代表已复核或已发布。</p>}
   </section> : <>
    {!!data.tasks.length && <><p className="my-4 text-ui-body tabular-nums">{counts.running} 项运行<span className="mx-2 text-muted-foreground">·</span>{counts.queued} 项排队<span className="mx-2 text-muted-foreground">·</span>{counts.attention} 项待处理</p><div role="group" aria-label="活动筛选" className="flex flex-wrap gap-1">{([{value:'all',label:'全部'}, {value:'processing',label:'处理中'}, {value:'attention',label:'需处理'}, {value:'completed',label:'已完成'}] as const).map(item => <Button key={item.value} size="sm" variant={filter === item.value ? 'secondary':'ghost'} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</Button>)}</div></>}
    {sorted.length ? <ul className="ai-monitor-list mt-3 space-y-1" aria-label="我的 AI 活动">{sorted.map(task => <li key={task.id}><Button ref={el => { if (el) rows.current.set(task.id,el); else rows.current.delete(task.id) }} variant="ghost" className="h-auto sm:h-auto w-full min-w-0 justify-start items-start gap-3 py-3 text-left whitespace-normal" aria-label={`查看${taskKindLabels[task.kind]}任务：${task.title}`} onClick={event => { listScroll.current = event.currentTarget.closest<HTMLElement>('[data-slot="popover-viewport"]')?.scrollTop ?? 0; setSelectedId(task.id) }}>
      <span className="mt-1 shrink-0 text-muted-foreground" aria-hidden="true">{task.kind === 'parsing' ? <FileSearch/> : <Activity/>}</span><span className="min-w-0 flex-1 space-y-1"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-ui-hint text-muted-foreground">{taskKindLabels[task.kind]}</span><Badge size="sm" variant={tones[task.state]}>{taskLabels[task.state]}</Badge></span><span className="block break-words font-medium leading-6">{task.title}</span><span className="block text-ui-hint text-muted-foreground">{task.context}</span><span className="block text-ui-hint text-muted-foreground">{task.followUp || task.stage}{taskCountText(task) && <span className="ml-2 tabular-nums">{taskCountText(task)}</span>}</span><span className="block text-ui-hint text-muted-foreground">更新于 {task.updatedAt}</span></span><ChevronRight className="mt-1 shrink-0 text-muted-foreground"/>
    </Button></li>)}</ul> : <Empty className="py-8"><EmptyHeader><EmptyTitle>{data.tasks.length ? '没有符合条件的任务' : '暂无正在执行的任务'}</EmptyTitle><EmptyDescription>{data.tasks.length ? '切换筛选查看其他活动。' : '你的批阅和解析任务会显示在这里。'}</EmptyDescription></EmptyHeader></Empty>}
   </>}
   {data.footer && <div className="mt-4 border-t pt-4">{data.footer}</div>}
  </PopoverPopup>
 </Popover>
}
