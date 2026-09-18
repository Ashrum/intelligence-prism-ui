"use client"
import { LearningTaskList } from "@/components/prism-next/learning-components"

import { useState } from "react"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Button } from "@/components/coss/button"
import { StatusBadge } from "@/components/prism-next/status-badge"
import { Input } from "@/components/coss/input"
import { Textarea } from "@/components/coss/textarea"
import { Field, FieldLabel } from "@/components/coss/field"
import { Progress } from "@/components/coss/progress"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/coss/table"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { useLearning } from "@/components/prism-next/examples/learning-provider"
import { QuestionWorkPanel } from "@/components/prism-next/question-work-panel"
import { QuestionContent } from "@/components/prism-next/question-content"
import { compositeQuestion } from "@/components/prism-next/fixtures/question-composite-samples"
import { PointsField, QuestionSelect } from "@/components/prism-next/question-controls"
import { LearningDate, LearningEmpty, SourceNotice, futureDate } from "@/components/prism-next/learning-controls"
import { followupAttempts } from "@/components/prism-next/fixtures/followup-attempts"
import { goalSourceValid, goalStatus, taskSaveError, type Task, type Stage } from "@/lib/prism-next/learning-workflow"

const statuses = [{ value: "pending", label: "待开始" }, { value: "running", label: "进行中" }, { value: "done", label: "已完成" }, { value: "skipped", label: "已跳过" }]
const resources = [{ value: "review", label: "原题与订正依据" }, { value: "practice", label: "新情境练习" }, { value: "verification", label: "目标核验" }]

export function LearningPlan({ go, active }: { go: (stage: Stage) => void; active: boolean }) {
  const { state, dispatch } = useLearning()
  const [editing, setEditing] = useState<Task | null>(null)
  const [resource, setResource] = useState<Task | null>(null)
  const [error, setError] = useState("")
  const [minutes, setMinutes] = useState<number | null>(15)
  const today = futureDate(0)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const done = state.tasks.filter(item => item.status === "done").length
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-1"><h3 className="text-base font-semibold">把目标安排进可执行的任务</h3><p className="text-sm leading-6 text-muted-foreground">任务关联目标、材料和完成条件；支持改期、调序与跳过说明。</p></div><Button variant="outline" onClick={() => go("goals")}>查看目标</Button></div>
    {!state.tasks.length ? <LearningEmpty title="先启用一个学习目标" action={<Button onClick={() => go("goals")}>前往目标规划</Button>}>从已启用的目标创建学习计划。每项任务都保留对应目标和完成条件，避免无依据地堆叠练习。</LearningEmpty> : <>
      <div className="grid items-end gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="max-w-sm space-y-2"><div className="flex justify-between text-sm"><span>任务完成</span><span className="tabular-nums">{done} / {state.tasks.length}</span></div><Progress aria-label="学习任务完成比例" value={done} max={state.tasks.length} /><p className="text-xs leading-6 text-muted-foreground">已跳过 {state.tasks.filter(item => item.status === "skipped").length} 项，不计入已完成。总预计 {state.tasks.reduce((sum, item) => sum + item.minutes, 0)} 分钟。</p></div><div className="flex flex-wrap items-end gap-3"><Field className="min-w-0 flex-1"><FieldLabel htmlFor="learning-task-search">搜索任务</FieldLabel><Input id="learning-task-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="任务名称或完成条件" /></Field><QuestionSelect label="任务状态筛选" value={filter} onChange={setFilter} items={[{ value: "all", label: "全部状态" }, ...statuses]} /></div></div>
      {state.goals.filter(goal => state.tasks.some(item => item.goalId === goal.id)).map(goal => {
        const tasks = state.tasks.filter(item => item.goalId === goal.id)
        const visible = tasks.filter(item => (filter === "all" || item.status === filter) && (item.title + item.condition).includes(query.trim()))
        const active = goal.mode === "active" && goalSourceValid(state, goal)
        return <section key={goal.id} className="space-y-4" aria-label={`${goal.id} 学习计划`}><header className="flex flex-wrap items-center justify-between gap-3 border-t pt-6"><div className="space-y-1"><h4 className="text-sm font-semibold">{goal.id} · {goal.title}</h4><p className="text-xs leading-6 text-muted-foreground">目标{goalStatus(state, goal)} · 截止 {goal.due}</p></div><Button variant="outline" disabled={!active} onClick={() => dispatch({ type: "add-task", id: goal.id, date: today })}>添加任务</Button></header>
          {!active && <SourceNotice>关联目标{goalStatus(state, goal)}。任务和完成记录仍保留，请在目标规划中处理后继续学习。</SourceNotice>}
          {!visible.length ? <p className="py-6 text-sm text-muted-foreground">当前筛选没有匹配的任务。<Button variant="ghost" size="sm" onClick={() => { setFilter("all"); setQuery("") }}>清除筛选</Button></p> : <LearningTaskList items={visible.map(task=>{
            const index = tasks.findIndex(item => item.id === task.id)
            const overdue = task.date < today && ["pending", "running"].includes(task.status)
            return {id:task.id,title:task.title,condition:task.condition,note:task.note,schedule:<><p>{task.date}</p><p className="mt-1 text-muted-foreground tabular-nums">{task.minutes} 分钟</p>{task.date>goal.due&&<p className="text-xs text-warning-foreground">晚于目标截止日</p>}</>,status:<><StatusBadge tone={task.status==="done"?"complete":task.status==="running"?"active":task.status==="skipped"?"neutral":"pending"}>{statuses.find(item=>item.value===task.status)?.label}</StatusBadge>{overdue&&<p className="mt-1 text-sm text-warning-foreground">已逾期</p>}</>,actions:<><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={!active || !!editing || !!resource} aria-controls="learning-task-resource" onClick={() => { if (task.status === "pending") dispatch({ type: "save-task", task: { ...task, status: "running" } }); setResource(task) }}>{task.status === "pending" ? "开始学习" : "查看材料"}</Button>{task.status === "running" && <Button disabled={!active || !!editing || !!resource} onClick={() => dispatch({ type: "save-task", task: { ...task, status: "done" } })}>标记完成</Button>}<Button disabled={!!editing || !!resource} variant="ghost" aria-controls="learning-task-editor" onClick={() => { setEditing({ ...task }); setMinutes(task.minutes); setError("") }}>编辑</Button></div><div className="mt-2 flex justify-end gap-1"><Button variant="ghost" size="icon-sm" aria-label={`${task.title}上移`} disabled={index === 0 || filter !== "all" || !!query} onClick={() => dispatch({ type: "move-task", id: task.id, offset: -1 })}><ArrowUpIcon /></Button><Button variant="ghost" size="icon-sm" aria-label={`${task.title}下移`} disabled={index === tasks.length - 1 || filter !== "all" || !!query} onClick={() => dispatch({ type: "move-task", id: task.id, offset: 1 })}><ArrowDownIcon /></Button></div></>}
          })}/>}
        </section>
      })}
    </>}
    <QuestionWorkPanel id="learning-task-editor" open={active && !!editing} title="编辑学习任务" description="调整任务内容、时间与状态。保存后更新，取消保留原任务。" onClose={() => setEditing(null)} footer={<><Button onClick={() => { if (!editing) return; const task = { ...editing, minutes: minutes ?? 0 }; const message = taskSaveError(state, task); if (message) { setError(message); return } dispatch({ type: "save-task", task }); setEditing(null) }}>保存任务</Button><Button variant="outline" onClick={() => setEditing(null)}>取消</Button></>}>
      {editing && <div className="space-y-6"><Field><FieldLabel htmlFor="task-title">任务名称</FieldLabel><Input id="task-title" value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></Field><Field><FieldLabel htmlFor="task-condition">完成条件</FieldLabel><Textarea id="task-condition" value={editing.condition} onChange={event => setEditing({ ...editing, condition: event.target.value })} /></Field><Field><FieldLabel htmlFor="task-date">计划日期</FieldLabel><LearningDate id="task-date" value={editing.date} onChange={date => setEditing({ ...editing, date })} /></Field><Field><FieldLabel>预计时长（分钟）</FieldLabel><PointsField label="任务时长" value={minutes} max={240} step={1} unit="分钟" onChange={setMinutes} /></Field><Field><FieldLabel>材料</FieldLabel><QuestionSelect label="任务材料" value={editing.resource} items={resources} onChange={resource => setEditing({ ...editing, resource: resource as Task["resource"] })} /></Field><Field><FieldLabel>任务状态</FieldLabel><QuestionSelect disabled={!state.goals.some(goal => goal.id === editing.goalId && goal.mode === "active" && goalSourceValid(state, goal))} label="任务状态" value={editing.status} items={statuses} onChange={status => setEditing({ ...editing, status: status as Task["status"] })} /></Field><Field><FieldLabel htmlFor="task-note">{editing.status === "skipped" ? "跳过理由（必填）" : "备注"}</FieldLabel><Textarea id="task-note" value={editing.note} onChange={event => setEditing({ ...editing, note: event.target.value })} /></Field>{error && <p role="alert" className="text-sm text-destructive-foreground">{error}</p>}</div>}
    </QuestionWorkPanel>
    <QuestionWorkPanel id="learning-task-resource" open={active && !!resource} title={resource?.title ?? "学习材料"} description={resource?.condition ?? ""} onClose={() => setResource(null)} footer={<Button variant="outline" onClick={() => setResource(null)}>返回计划</Button>}>
      {resource?.resource === "review" && <div className="space-y-5"><QuestionContent question={compositeQuestion} /><div className="rounded-lg bg-muted/50 p-4 text-base leading-7"><h4 className="mb-2 text-sm font-semibold">订正依据</h4>{compositeQuestion.parts?.map(part => <section className="mb-4 space-y-2" key={part.id}><h5 className="text-sm font-medium">第 {part.id} 问</h5>{part.explanation}</section>)}</div></div>}
      {resource?.resource === "practice" && <div className="space-y-8">{followupAttempts.map(item => <section key={item.id} className="space-y-4"><h4 className="text-sm font-semibold">{item.title} · {item.id}</h4><p className="text-base leading-7">{item.prompt}</p><p className="text-sm text-muted-foreground">可在纸面独立作答，保留过程后由教师核验。</p><Collapsible><CollapsibleTrigger render={<Button variant="outline" size="sm" />}>查看参考作答</CollapsibleTrigger><CollapsiblePanel><p className="mt-3 border-l-2 pl-4 text-base leading-7">{item.answer}</p></CollapsiblePanel></Collapsible></section>)}</div>}
      {resource?.resource === "verification" && <div className="space-y-5"><p className="text-sm leading-7">分别对照两份新作答与目标标准，记录具体依据。若仅完成练习但未复核，目标仍处于待验证。</p><Button onClick={() => { setResource(null); go("goals") }}>前往目标核验</Button></div>}
    </QuestionWorkPanel>
  </div>
}
