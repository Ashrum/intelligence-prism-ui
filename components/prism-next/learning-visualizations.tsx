"use client"

import { createContext, useContext, useState, type ComponentProps } from "react"
import { DayButton } from "@daypicker/react"
import { zhCN } from "@daypicker/react/locale"
import { format, parseISO } from "date-fns"
import { CheckIcon, CircleIcon, PauseIcon, CircleAlertIcon } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { Calendar } from "@/components/coss/calendar"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { DemoSection } from "./demo-parts"
import { LearningProvider, useLearning } from "./learning-provider"
import { LearningDate, LearningEmpty } from "./learning-controls"
import { QuestionSelect, PointsField } from "./question-controls"
import { QuestionWorkPanel } from "./question-work-panel"
import { VerificationPanel } from "./learning-verification"
import { LearningWorkspace } from "./learning-workspace"
import { goalStatus, goalSourceValid, goalPasses, taskSaveError, type Task, type LearningState } from "@/lib/prism-next/learning-workflow"
import { createVisualLearningState, dailyWorkload, goalMilestones } from "@/lib/prism-next/visual-analysis-model"

export function LearningVisualizations({ view }: { view: "goal-milestones" | "workload-calendar" }) {
  const [source, setSource] = useState("example")
  const [epoch, setEpoch] = useState(0)
  const title = view === "goal-milestones" ? "距离目标，还差哪些证据" : "把学习安排放进日历"
  return <DemoSection title={title} description="图形视图与原有目标、任务使用同一套判断和编辑规则。">
    <div className="analytics-workspace q-workbench space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3"><QuestionSelect label="图形视图数据来源" value={source} onChange={setSource} items={[{ value: "example", label: "独立预置示例" }, { value: "workflow", label: "当前学习工作流" }]}/>{source === "example" && <Button variant="ghost" onClick={() => setEpoch(value => value + 1)}>恢复预置示例</Button>}</header>
      <p className="text-sm leading-6 text-muted-foreground">{source === "example" ? "预置评价、诊断和一份核验，供体验不同状态；所有修改仅在本示例内生效，不写入当前学习工作流。" : "读取当前会话的目标与任务，修改会同步到学习工作流；刷新后重置。"}</p>
      {source === "example" ? <LearningProvider key={`${view}-${epoch}`} initialState={createVisualLearningState()}><LearningVisualContent view={view}/></LearningProvider> : <LearningVisualContent key={view} view={view}/>}
    </div>
  </DemoSection>
}

function LearningVisualContent({ view }: { view: "goal-milestones" | "workload-calendar" }) {
  const { state } = useLearning()
  const [tab, setTab] = useState("visual")
  return <Tabs value={tab} onValueChange={value => setTab(String(value))}>
    <TabsList variant="underline" aria-label="学习视图"><TabsTab value="visual">{view === "goal-milestones" ? "目标里程碑" : "学习负荷日历"}</TabsTab><TabsTab value="workflow">查看关联工作流</TabsTab></TabsList>
    <TabsPanel value="visual" keepMounted><div className="mt-5 space-y-5">{view === "goal-milestones" ? <GoalMilestones active={tab === "visual"}/> : <WorkloadCalendar active={tab === "visual"}/>}<p role="status" className="min-h-5 text-sm text-muted-foreground">{state.message}</p></div></TabsPanel>
    <TabsPanel value="workflow"><LearningWorkspace initialStage={view === "goal-milestones" ? "goals" : "learning-plan"}/></TabsPanel>
  </Tabs>
}

function GoalMilestones({ active }: { active: boolean }) {
  const { state, dispatch } = useLearning()
  const [selection, setSelection] = useState("")
  const [verifying, setVerifying] = useState(false)
  const goal = state.goals.find(goal => goal.id === selection) ?? state.goals[0]
  if (!goal) return <LearningEmpty title="还没有学习目标" action={<span className="text-sm">在“查看关联工作流”中确认诊断并创建目标。</span>}>只有已创建的目标才会进入里程碑。</LearningEmpty>
  const valid = goalSourceValid(state, goal)
  const status = goalStatus(state, goal)
  const passes = valid ? goalPasses(state, goal) : 0
  const tasks = state.tasks.filter(task => task.goalId === goal.id)
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><QuestionSelect label="里程碑目标" value={goal.id} onChange={id => { setSelection(id); setVerifying(false) }} items={state.goals.map(goal => ({ value: goal.id, label: `${goal.id} · ${goal.title}` }))}/><Badge variant={status === "已达成" ? "success" : "outline"}>{status}</Badge></div>
    <div className="milestone-summary"><div><p className="text-sm text-muted-foreground">有效独立作答</p><p className="mt-2 text-3xl font-semibold tabular-nums">{passes}<span className="ml-2 text-base font-normal text-muted-foreground">/ 2 份</span></p></div><p className="text-sm leading-7">{!valid ? "来源有变化，先复核诊断与目标。" : status === "已达成" ? "两份独立作答均经人工核验，满足当前标准。" : goal.mode !== "active" ? "先启用或恢复目标，再继续核验。" : `还需 ${Math.max(0, 2 - passes)} 份独立作答满足全部标准。`}<br/><span className="text-muted-foreground">截止 {goal.due} · 标准 v{goal.version}</span></p></div>
    <ol className="goal-milestones">{goalMilestones(state, goal).map((item, index) => <li key={item.id} data-state={item.state}><span className="milestone-mark">{item.state === "met" ? <CheckIcon/> : item.state === "blocked" || item.state === "retry" ? <CircleAlertIcon/> : <CircleIcon/>}</span><div><p className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 text-sm font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p></div></li>)}</ol>
    <section className="rounded-xl border p-5"><h3 className="text-sm font-semibold">每份作答都需要满足</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7">{goal.criteria.map(item => <li key={item.id}>{item.text}</li>)}</ol><div className="mt-5 flex flex-wrap items-center gap-3"><Button disabled={!valid || goal.mode !== "active"} aria-controls="milestone-verification" onClick={() => setVerifying(true)}>核验独立作答</Button><Button variant="outline" disabled={!valid} onClick={() => dispatch({ type: "goal-mode", id: goal.id, mode: goal.mode === "active" ? "paused" : "active" })}>{goal.mode === "active" ? <><PauseIcon/>暂停目标</> : "启用目标"}</Button></div></section>
    <p className="text-sm text-muted-foreground">任务已完成 {tasks.filter(task => task.status === "done").length} / {tasks.length} 项，单独记录，不计作目标达成证据。两份作答均为人工编写的界面示例。</p>
    {verifying && <VerificationPanel key={`${goal.id}-${goal.version}`} goal={goal} active={active} panelId="milestone-verification" onClose={() => setVerifying(false)}/>}
  </>
}

const LoadContext = createContext<{ state: LearningState; capacity: number } | null>(null)
function LoadDay(props: ComponentProps<typeof DayButton>) {
  const context = useContext(LoadContext)!
  const date = format(props.day.date, "yyyy-MM-dd")
  const load = dailyWorkload(context.state, date)
  const busy = load.remaining > context.capacity
  return <DayButton {...props} data-load={busy ? "over" : load.tasks.length ? "planned" : "empty"} aria-label={`${date}，${load.tasks.length} 项任务，剩余可执行预计 ${load.remaining} 分钟${busy ? "，超出每日安排" : ""}`}><span>{props.day.date.getDate()}</span><span className="load-day-minutes" aria-hidden="true">{load.remaining ? `${load.remaining}′` : load.blocked ? "待处理" : load.tasks.length ? "已处理" : "—"}</span>{busy && <span className="load-day-flag" aria-hidden="true">!</span>}</DayButton>
}

function WorkloadCalendar({ active }: { active: boolean }) {
  const { state, dispatch } = useLearning()
  const [selected, setSelected] = useState(() => parseISO(state.tasks.find(task => task.status === "running")?.date ?? state.tasks[0]?.date ?? "2026-09-16"))
  const [month, setMonth] = useState(selected)
  const [capacity, setCapacity] = useState(45)
  const [editing, setEditing] = useState<Task | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState("")
  const [minutes, setMinutes] = useState<number | null>(15)
  const date = format(selected, "yyyy-MM-dd")
  const load = dailyWorkload(state, date)
  const [notice, setNotice] = useState("")
  const editGoal = state.goals.find(goal => goal.id === editing?.goalId)
  function save() {
    if (!editing) return
    const task = { ...editing, minutes: minutes ?? 0 }
    const message = taskSaveError(state, task)
    if (message) { setError(message); return }
    const before = state.tasks.find(item => item.id === task.id)
    dispatch({ type: "save-task", task }); setPanelOpen(false); setSelected(parseISO(task.date)); setMonth(parseISO(task.date))
    setNotice(before?.date !== task.date ? `已将“${task.title}”从 ${before?.date} 移至 ${task.date}，两天负荷已更新。` : `已更新“${task.title}”的安排。`)
  }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">日历数字 = 剩余可执行任务的预计分钟</p><QuestionSelect label="每日可安排时间" value={String(capacity)} onChange={value => setCapacity(Number(value))} items={[30, 45, 60, 90].map(value => ({ value: String(value), label: `每日可安排 ${value} 分钟` }))}/></div>
    <div className="workload-layout"><section className="min-w-0"><LoadContext value={{ state, capacity }}><Calendar mode="single" required locale={zhCN} weekStartsOn={1} className="workload-calendar" month={month} onMonthChange={setMonth} selected={selected} onSelect={setSelected} components={{ DayButton: LoadDay }}/></LoadContext><p className="mt-4 text-xs leading-6 text-muted-foreground">“!” 表示超出可安排时间；已完成、跳过及暂停任务不计入剩余负荷。预计时长不代表实际学习用时。</p></section>
      <section className="min-w-0 space-y-4" aria-label="当日学习安排"><header className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-base font-semibold">{format(selected, "M 月 d 日")}</h3><Badge variant={load.remaining > capacity ? "warning" : "outline"}>{load.remaining > capacity ? `超出 ${load.remaining - capacity} 分钟` : `${load.remaining} / ${capacity} 分钟`}</Badge></header><p className="text-xs leading-6 text-muted-foreground">{load.tasks.length} 项 · 已完成 {load.done} · 已跳过 {load.skipped} · 暂不可执行 {load.blocked}</p>
      {load.tasks.length ? <ul className="space-y-3">{load.tasks.map(task => { const goal = state.goals.find(goal => goal.id === task.goalId)!; const blocked = goal.mode !== "active" || !goalSourceValid(state, goal); return <li key={task.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline">{{ pending: "待开始", running: "进行中", done: "已完成", skipped: "已跳过" }[task.status]}</Badge><span className="text-sm tabular-nums">预计 {task.minutes} 分钟</span></div><h4 className="mt-3 text-sm font-medium leading-6">{task.title}</h4><p className="mt-2 text-xs leading-6 text-muted-foreground">{task.goalId} · 目标截止 {goal.due}</p>{blocked && <p className="text-sm text-warning-foreground">目标{goalStatus(state, goal)}，当前不可执行。</p>}{task.date > goal.due && <p className="text-sm text-warning-foreground">安排晚于目标截止日期。</p>}<div className="mt-3"><Button variant="outline" size="sm" aria-controls={`load-edit-${task.id}`} onClick={() => { setEditing({ ...task }); setMinutes(task.minutes); setError(""); setPanelOpen(true) }}>查看与调整</Button></div></li> })}</ul> : <p className="rounded-xl border border-dashed p-6 text-sm leading-6 text-muted-foreground">当天没有学习安排。{state.tasks.length ? "可以从其他日期移入任务。" : "请在关联工作流中启用目标并创建计划。"}</p>}
      </section></div>
    <p role="status" className="text-sm">{notice}</p>
    <QuestionWorkPanel id={`load-edit-${editing?.id ?? "none"}`} open={active && panelOpen} title="调整学习安排" description="改期与时长同步更新日历；关闭不保存本次修改。" onClose={() => setPanelOpen(false)} footer={<><Button onClick={save}>保存安排</Button><Button variant="outline" onClick={() => setPanelOpen(false)}>取消</Button></>}>
      {editing && <div className="space-y-5"><h3 className="text-base font-semibold leading-7">{editing.title}</h3><p className="text-sm leading-7 text-muted-foreground">{editGoal?.title} · 截止 {editGoal?.due}</p><section><h4 className="text-sm font-medium">完成条件</h4><p className="mt-2 text-sm leading-7">{editing.condition}</p></section><Field><FieldLabel htmlFor="load-date">计划日期</FieldLabel><LearningDate id="load-date" value={editing.date} onChange={date => setEditing({ ...editing, date })}/></Field><Field><FieldLabel>预计时长（分钟）</FieldLabel><PointsField label="任务预计时长" value={minutes} onChange={setMinutes} max={240} step={5} unit="分钟"/></Field><Field><FieldLabel>任务状态</FieldLabel><QuestionSelect label="日历任务状态" value={editing.status} onChange={status => setEditing({ ...editing, status: status as Task["status"] })} items={[{ value: "pending", label: "待开始" }, { value: "running", label: "进行中" }, { value: "done", label: "已完成" }, { value: "skipped", label: "已跳过" }]}/></Field><Field><FieldLabel htmlFor="load-note">备注 / 跳过理由</FieldLabel><Textarea id="load-note" value={editing.note} onChange={event => setEditing({ ...editing, note: event.target.value })}/></Field>{editGoal && editing.date > editGoal.due && <p className="text-sm text-warning-foreground">此日期晚于目标截止日，请确认安排。</p>}{error && <p role="alert" className="text-sm text-destructive-foreground">{error}</p>}</div>}
    </QuestionWorkPanel>
  </>
}
