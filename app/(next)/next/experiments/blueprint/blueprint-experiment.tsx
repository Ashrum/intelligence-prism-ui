"use client"

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react"
import { ArrowDown, ArrowRight, ArrowUpRight, ChartNoAxesCombined, Check, ChevronRight, Clock3, FileText, Focus, Layers, Link2, Minimize2 } from "lucide-react"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardPanel, CardTitle } from "@/components/coss/card"
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from "@/components/coss/dialog"
import { Progress } from "@/components/coss/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { AgentComposer, AgentTaskProgress } from "@/components/prism-next/agent-components"
import { AgentMark } from "@/components/prism-next/agent-mark"
import { AgentMessage } from "@/components/prism-next/agent-message"
import { Badge } from "@/components/prism-next/badge"
import { Button } from "@/components/prism-next/button"
import { cn } from "@/lib/utils"
import { comparisonNotes, evidenceItems, taskDetails, taskMetrics, taskSteps, type BlueprintVersion, type TaskDetailKey } from "./fixtures"
import styles from "./blueprint.module.css"

function ZoneHeading({ number, title, caption, id }: { number: string; title: string; caption: string; id: string }) {
  return <header className={styles.zoneHeading}>
    <span className="text-ui-meta tabular-nums text-muted-foreground" aria-hidden="true">{number}</span>
    <h3 id={id} className="text-block-title">{title}</h3>
    <span className={cn(styles.zoneCaption, "text-ui-meta text-muted-foreground")} aria-hidden="true">{caption}</span>
  </header>
}

function Note({ title, children }: { title: string; children: ReactNode }) {
  return <div className={styles.reviewNote}>
    <dt className="text-ui-action">{title}</dt>
    <dd className="text-ui-hint text-muted-foreground">{children}</dd>
  </div>
}

/** Page-only composition; the comparison changes wrappers, never component variants. */
export function BlueprintExperiment() {
  const [version, setVersion] = useState<BlueprintVersion>("v02")
  const [focused, setFocused] = useState(false)
  const [detailKey, setDetailKey] = useState<TaskDetailKey | null>(null)
  const [draft, setDraft] = useState("")
  const [feedback, setFeedback] = useState<{ serial: number; text: string } | null>(null)
  const detailTrigger = useRef<HTMLButtonElement | null>(null)
  const focusTrigger = useRef<HTMLButtonElement | null>(null)
  const id = useId()
  const notes = comparisonNotes[version]
  const detail = detailKey ? taskDetails[detailKey] : null

  useEffect(() => {
    if (!focused || detailKey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      setFocused(false)
      focusTrigger.current?.focus({ preventScroll: true })
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [focused, detailKey])

  function inspect(key: TaskDetailKey, event: MouseEvent<HTMLButtonElement>) {
    detailTrigger.current = event.currentTarget
    setDetailKey(key)
  }

  function sendDemoMessage() {
    if (!draft.trim()) return
    setFeedback(previous => ({ serial: (previous?.serial ?? 0) + 1, text: "演示模式：已捕获输入，但未调用真实 Agent。" }))
    setDraft("")
  }

  return <div className={styles.experiment} data-blueprint-experiment="v0.2" data-focused={focused}>
    <header className={styles.labHeading} hidden={focused}>
      <div>
        <p className="text-ui-hint text-info-foreground">页面设计语言实验 / 02</p>
        <h1 className="mt-2 text-page-title">Prism Blueprint</h1>
        <p className="mt-3 text-read-body text-muted-foreground">硬秩序 × 软组件</p>
      </div>
      <p className={cn(styles.labDescription, "text-ui-hint text-muted-foreground")}>C · 轻量 Blueprint。以图框、对齐和留白组织页面，保留智能曜彩组件的柔和形态。</p>
    </header>

    <section aria-label="实验对照工具" className={styles.reviewToolbar}>
      <div className={styles.versionControls}>
        <span id={`${id}-comparison`} className="text-ui-action">结构对照</span>
        <ToggleGroup
          aria-labelledby={`${id}-comparison`}
          value={[version]}
          onValueChange={values => {
            const next = values[0]
            if (next === "v01" || next === "v02") setVersion(next)
          }}
          className="max-w-full flex-wrap"
        >
          <ToggleGroupItem value="v01">v0.1 C · 结构复现</ToggleGroupItem>
          <ToggleGroupItem value="v02">v0.2 · 精修</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Button ref={focusTrigger} variant="outline" aria-pressed={focused} onClick={() => setFocused(value => !value)}>
        {focused ? <Minimize2 aria-hidden="true" /> : <Focus aria-hidden="true" />}
        {focused ? "退出专注" : "专注查看"}
      </Button>
    </section>

    <div className={styles.comparisonCaption} aria-live="polite">
      <p className="text-ui-hint text-muted-foreground">{notes.description}</p>
      {!focused && <p className="text-ui-meta text-muted-foreground">同数据 · 同组件 · 主题沿用站点右上角切换</p>}
    </div>

    <section className={styles.sheet} data-version={version} aria-labelledby={`${id}-task-title`}>
      <div className={styles.axisRail} aria-hidden="true">
        {["00", "12", "24", "36", "48", "60", "72", "84", "96"].map(mark => <span className="text-ui-meta tabular-nums" key={mark}>{mark}</span>)}
      </div>
      <div className={styles.cornerMarks} aria-hidden="true"><i /><i /><i /><i /></div>
      <div className={styles.sheetBody}>
        <header className={styles.sheetHeading}>
          <div className={styles.taskTitle}>
            <p className={cn(styles.sheetLabel, "text-ui-meta text-muted-foreground")}>教学任务 / 试卷分析与诊断 <span className="tabular-nums">WK-042</span></p>
            <div className={styles.titleRow}>
              <h2 id={`${id}-task-title`} className="text-section-title">高二数学 · 单元试卷分析</h2>
              <Badge variant="info">执行中 · 模拟</Badge>
            </div>
            <p className="text-ui-hint text-muted-foreground">高二（3）班 · 函数与导数单元 · 2026.10.13 <span className={styles.taskVersion}>任务版本 V1</span></p>
          </div>
          <div className={styles.taskActions}>
            <Button variant="outline" onClick={event => inspect("history", event)}><Clock3 aria-hidden="true" />任务记录</Button>
            <Button onClick={event => inspect("task", event)}><Layers aria-hidden="true" />查看任务</Button>
          </div>
        </header>

        <div className={styles.summaryWrap}>
          <Card className={styles.summaryLayout}>
            <div className={styles.summaryText}>
              <AgentMark state="idle" label="AI 辅助任务" />
              <h3 className="text-block-title">为本次考试生成可信的学情诊断</h3>
              <p className="text-ui-hint text-muted-foreground">从批阅结果追溯证据，识别薄弱知识点，形成可供教师复核的分析报告。</p>
            </div>
            <dl className={styles.summaryMetrics}>
              {taskMetrics.map(metric => <div key={metric.label} className={styles.summaryMetric}>
                <dt className="text-ui-hint text-muted-foreground">{metric.label}</dt>
                <dd className="text-stat-display tabular-nums">{metric.value}</dd>
              </div>)}
            </dl>
          </Card>
        </div>

        <nav className={styles.regionLinks} aria-label="跳转到工作区域">
          <Button variant="ghost" render={<a href="#blueprint-process" />}>任务进程<ArrowDown aria-hidden="true" /></Button>
          <Button variant="ghost" render={<a href="#blueprint-activity" />}>执行记录<ArrowDown aria-hidden="true" /></Button>
          <Button variant="ghost" render={<a href="#blueprint-evidence" />}>证据与产出<ArrowDown aria-hidden="true" /></Button>
        </nav>

        <div className={styles.workGrid}>
          <section id="blueprint-process" className={cn(styles.zone, styles.processZone)} aria-labelledby={`${id}-process`}>
            <ZoneHeading number="01" title="任务进程" caption="Process" id={`${id}-process`} />
            <div className={styles.stack}>
              <Card>
                <CardHeader>
                  <CardTitle render={<h4 />}>分析流程</CardTitle>
                  <CardDescription>基于已批阅试卷 · 示例数据<span className="mt-1 block">固定演示快照 · 第 3 / 4 步</span></CardDescription>
                  <CardAction><span className="text-ui-meta text-muted-foreground">P1–P4</span></CardAction>
                </CardHeader>
                <CardPanel>
                  <AgentTaskProgress steps={taskSteps} activity="snapshot" />
                </CardPanel>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle render={<h4 />}><span className="flex items-center gap-2"><ChartNoAxesCombined aria-hidden="true" className="size-4" />当前处理摘要</span></CardTitle>
                </CardHeader>
                <CardPanel>
                  <dl className={styles.processingMetrics}>
                    <div><dt className="text-ui-hint text-muted-foreground">已关联题目</dt><dd className="mt-1 text-stat-display tabular-nums">39</dd></div>
                    <div><dt className="text-ui-hint text-muted-foreground">异常候选</dt><dd className="mt-1 text-stat-display tabular-nums">03</dd></div>
                  </dl>
                </CardPanel>
              </Card>
            </div>
          </section>

          <section id="blueprint-activity" className={cn(styles.zone, styles.activityZone)} aria-labelledby={`${id}-activity`}>
            <ZoneHeading number="02" title="Agent 执行记录" caption="Activity" id={`${id}-activity`} />
            <Card>
              <CardHeader>
                <CardTitle render={<h4 />}>任务会话</CardTitle>
                <CardDescription>过程记录与待确认事项</CardDescription>
                <CardAction><Badge variant="info">分析中</Badge></CardAction>
              </CardHeader>
              <CardPanel>
                <div className={styles.conversation}>
                  <p className="text-ui-meta text-muted-foreground">10:14 · 本次任务</p>
                  <AgentMessage speaker="agent" details={<div className="flex flex-wrap gap-2">
                    <Badge variant="success"><Check aria-hidden="true" />试卷结构化</Badge>
                    <Badge variant="success"><Check aria-hidden="true" />批阅校验</Badge>
                    <Badge variant="info"><ArrowUpRight aria-hidden="true" />证据聚合</Badge>
                  </div>}>
                    <p>已完成试卷结构化与批阅校验。当前从 <strong>39 道已关联试题</strong> 中聚合诊断证据，其中 <strong>3 项存在待复核问题</strong>，暂不形成最终诊断。</p>
                  </AgentMessage>
                  <AgentMessage speaker="user"><p>先给我看需要复核的部分。</p></AgentMessage>
                  <AgentMessage speaker="agent">
                    <p>已整理待复核候选：<strong>函数单调性评分依据</strong>、<strong>导数应用题作答缺页</strong>及<strong>一道题的知识点归属</strong>。请先查看右侧证据，再决定是否采纳。</p>
                  </AgentMessage>
                  <div className={styles.sourceNote}>
                    <span className={styles.aiSourceLine} aria-hidden="true" />
                    <p className="text-ui-hint text-muted-foreground"><span className="text-ui-action text-foreground">AI 来源说明</span>　来自本次已批阅试卷及已关联的作答记录；未经教师确认的结果仅作为候选。</p>
                  </div>
                  <AgentComposer
                    value={draft}
                    onChange={setDraft}
                    onSubmit={sendDemoMessage}
                    label="发送给 Agent 的演示消息"
                    placeholder="向 Agent 提出进一步要求（演示模式）"
                    submitLabel="发送演示消息"
                    maxLength={160}
                    footerNote={`${draft.length} / 160`}
                  />
                  <div role="status" aria-live="polite" aria-atomic="true">
                    <p key={feedback?.serial ?? 0} className="text-ui-hint text-muted-foreground">{feedback?.text ?? "仅体验输入反馈，未连接 Agent。"}</p>
                  </div>
                </div>
              </CardPanel>
            </Card>
          </section>

          <section id="blueprint-evidence" className={cn(styles.zone, styles.evidenceZone)} aria-labelledby={`${id}-evidence`}>
            <ZoneHeading number="03" title="证据与产出" caption="Evidence" id={`${id}-evidence`} />
            <div className={cn(styles.stack, styles.evidenceStack)}>
              <Card>
                <CardHeader>
                  <CardTitle render={<h4 />}>待复核证据</CardTitle>
                  <CardDescription>3 项候选 · 均有来源定位</CardDescription>
                  <CardAction><Badge variant="warning">待处理</Badge></CardAction>
                </CardHeader>
                <CardPanel>
                  <ul className={styles.evidenceList}>
                    {evidenceItems.map(item => <li key={item.id}>
                      <Button variant="ghost" className="h-auto w-full justify-start whitespace-normal py-3" onClick={event => inspect(item.id, event)}>
                        <FileText aria-hidden="true" className="size-4 shrink-0 self-start" />
                        <span className="min-w-0 flex-1 space-y-1 text-left">
                          <span className="block break-words text-item-title">{item.title}</span>
                          <span className="block break-words text-ui-hint text-muted-foreground">{item.location}</span>
                        </span>
                        <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
                      </Button>
                    </li>)}
                  </ul>
                </CardPanel>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle render={<h4 />}>分析报告结构</CardTitle>
                  <CardDescription>框架准备 · 诊断尚未确认</CardDescription>
                </CardHeader>
                <CardPanel>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">结构草案</Badge><span className="text-ui-action">章节框架已预置</span></div>
                    <div className="flex items-center justify-between gap-3"><span className="text-ui-hint">章节骨架</span><span className="text-ui-body tabular-nums">7 / 9</span></div>
                    <Progress value={7} max={9} aria-label="章节框架预置数量" getAriaValueText={() => "9 个章节已预置 7 个，诊断尚未确认"} />
                  </div>
                </CardPanel>
                <CardFooter className="flex-wrap gap-2">
                  <Button variant="outline" onClick={event => inspect("report", event)}><FileText aria-hidden="true" />查看报告结构</Button>
                  <Button variant="ghost" onClick={event => inspect("source", event)}>来源</Button>
                </CardFooter>
              </Card>
            </div>
          </section>
        </div>

        <footer className={styles.flowFooter}>
          <span className="flex items-center gap-2 text-ui-hint"><Link2 aria-hidden="true" className="size-4" />任务证据链</span>
          <ol className={styles.flowSteps} aria-label="处理顺序：输入、批阅、证据、诊断、报告">
            {["Input", "Grading", "Evidence", "Diagnosis", "Output"].map((step, index) => <li key={step} className="flex items-center gap-2 text-ui-meta text-muted-foreground"><span lang="en">{step}</span>{index < 4 && <ArrowRight className="size-3" aria-hidden="true" />}</li>)}
          </ol>
          <span className="text-ui-meta text-muted-foreground">模拟数据 · 未连接业务 Runtime</span>
        </footer>
      </div>
    </section>

    <section className={styles.reviewNotes} aria-label="页面精修观察" hidden={focused}>
      <div className={styles.reviewHeading}><h2 className="text-block-title">精修观察</h2><p className="text-ui-hint text-muted-foreground">{notes.label}</p></div>
      <dl className={styles.noteGrid}>
        <Note title="空间秩序">{notes.structure}</Note>
        <Note title="组件衔接">{notes.transition}</Note>
        <Note title="阅读舒适度">{notes.reading}</Note>
      </dl>
    </section>

    <Dialog open={detail !== null} onOpenChange={open => { if (!open) setDetailKey(null) }}>
      <DialogPopup finalFocus={detailTrigger} closeProps={{ "aria-label": "关闭详情" }}>
        {detail && <>
          <DialogHeader>
            <DialogTitle>{detail.title}</DialogTitle>
            <DialogDescription>{detail.description}</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <dl className={styles.detailRows}>{detail.rows.map(([label, value]) => <div key={label} className={styles.detailRow}><dt className="text-ui-hint text-muted-foreground">{label}</dt><dd className="text-ui-body">{value}</dd></div>)}</dl>
          </DialogPanel>
          <DialogFooter variant="bare"><DialogClose render={<Button />}>返回实验页面</DialogClose></DialogFooter>
        </>}
      </DialogPopup>
    </Dialog>
  </div>
}
