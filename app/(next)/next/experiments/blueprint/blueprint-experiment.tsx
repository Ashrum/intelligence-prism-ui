"use client"

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, ChartNoAxesCombined, Check, ChevronRight, Clock3, FileText, Focus, Layers, Link2, Minimize2 } from "lucide-react"
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
import { evidenceItems, officialLicenseHref, officialStyleHref, originalReferenceHref, refinementNotes, taskDetails, taskMetrics, taskSteps, type BlueprintStage, type BlueprintTheme, type TaskDetailKey } from "./fixtures"
import styles from "./blueprint.module.css"

function ZoneHeading({ letter, title, caption, id }: { letter: string; title: string; caption: string; id: string }) {
  return <header className={styles.sheetHead}>
    <span className={cn(styles.sheetId, "text-section-title")} aria-hidden="true">{letter}</span>
    <h3 id={id} className={cn(styles.zoneTitle, "text-block-title")}>{title}</h3>
    <span className={cn(styles.zoneCaption, "text-ui-meta text-muted-foreground")} aria-hidden="true">{caption}</span>
  </header>
}

function Note({ title, children }: { title: string; children: ReactNode }) {
  return <div className={styles.reviewNote}>
    <dt className="text-ui-action">{title}</dt>
    <dd className="text-ui-hint text-muted-foreground">{children}</dd>
  </div>
}

/** Isolated page composition. Local themes never write the site's theme preference. */
export function BlueprintExperiment() {
  const [stage, setStage] = useState<BlueprintStage>("refined")
  const [theme, setTheme] = useState<BlueprintTheme>("paper")
  const [focused, setFocused] = useState(false)
  const [detailKey, setDetailKey] = useState<TaskDetailKey | null>(null)
  const [draft, setDraft] = useState("")
  const [feedback, setFeedback] = useState<{ serial: number; text: string } | null>(null)
  const detailTrigger = useRef<HTMLButtonElement | null>(null)
  const focusTrigger = useRef<HTMLButtonElement | null>(null)
  const themeScope = useRef<HTMLDivElement | null>(null)
  const id = useId()
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

  return <div ref={themeScope} data-agent-preview data-prism-theme={theme} className={cn(styles.themeScope, "bg-background text-foreground")} data-blueprint-experiment="v0.3" data-focused={focused}>
    <a className="prism-skip" href="#blueprint-main">跳到主要内容</a>
    <header className={styles.experimentBar}>
      <div className={styles.barContents}>
        <div className={styles.barIdentity}>
          <Button variant="ghost" render={<Link href="/next" />}><ArrowLeft aria-hidden="true" />返回组件库</Button>
          <span className="text-ui-meta text-muted-foreground">Prism Blueprint · v0.3</span>
        </div>
        <div className={styles.barControls}>
          <div className={styles.themeControls}>
            <span id={`${id}-theme`} className="text-ui-hint text-muted-foreground">精修版主题</span>
            <ToggleGroup
              aria-labelledby={`${id}-theme`}
              value={[theme]}
              disabled={stage === "original"}
              onValueChange={values => {
                const next = values[0]
                if (next === "light" || next === "paper" || next === "dark") setTheme(next)
              }}
            >
              <ToggleGroupItem value="light">Light</ToggleGroupItem>
              <ToggleGroupItem value="paper">Paper</ToggleGroupItem>
              <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button ref={focusTrigger} variant="outline" aria-pressed={focused} aria-label={focused ? "退出专注" : "专注查看精修版"} onClick={() => {
            setStage("refined")
            setFocused(value => !value)
          }}>
            {focused ? <Minimize2 aria-hidden="true" /> : <Focus aria-hidden="true" />}
            {focused ? "退出专注" : "专注查看"}
          </Button>
        </div>
      </div>
    </header>

    <main id="blueprint-main" tabIndex={-1} className={styles.experiment} aria-label="Prism Blueprint 页面风格实验">
      <div className={styles.reviewArea} hidden={focused}>
        <header className={styles.labHeading}>
          <div className={styles.labTitle}>
            <h1 className="text-page-title">Prism Blueprint</h1>
            <p className="text-ui-hint text-muted-foreground">C · 轻量 Blueprint / 硬秩序 × 软组件</p>
          </div>
          <p className={cn(styles.labDescription, "text-ui-hint text-muted-foreground")}>直接移植 Answer me with HTML 官网的图纸结构，衔接智能曜彩现有组件。</p>
        </header>

        <section aria-label="实验对照工具" className={styles.reviewToolbar}>
          <div className={styles.versionControls}>
            <span id={`${id}-comparison`} className="text-ui-action">页面对照</span>
            <ToggleGroup
              aria-labelledby={`${id}-comparison`}
              value={[stage]}
              onValueChange={values => {
                const next = values[0]
                if (next === "original" || next === "refined") setStage(next)
              }}
              className="max-w-full flex-wrap"
            >
              <ToggleGroupItem value="refined">v0.3 · 官网源样式</ToggleGroupItem>
              <ToggleGroupItem value="original">v0.1 · 原始 HTML</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button variant="ghost" render={<a href={originalReferenceHref} target="_blank" rel="noopener noreferrer" />}>新窗口打开原稿<ArrowUpRight aria-hidden="true" /></Button>
        </section>

        <div className={styles.comparisonCaption} aria-live="polite">
          <p className="text-ui-hint text-muted-foreground">{stage === "original"
            ? "原稿按原样提供，默认 C / Paper；主题在原稿内切换，仅有 Light、Paper，无 Dark。"
            : "精修版默认 Paper；本页主题独立切换，不改变组件库的主题偏好。"}</p>
          <p className="text-ui-meta text-muted-foreground">同宽容器切换；原稿含自身导航与内边距，实际工作纸面宽度、字体及组件不同。</p>
        </div>
      </div>

    <section className={styles.originalStage} aria-label="v0.1 原始 HTML 对照" hidden={stage !== "original"}>
      {stage === "original" && <iframe
        title="v0.1 原始实验 HTML，默认 C · 轻量 Blueprint / Paper"
        src={originalReferenceHref}
        className={styles.referenceFrame}
        sandbox="allow-scripts"
      />}
    </section>

    <section className={styles.sheet} data-version="v0.3" hidden={stage !== "refined"} aria-labelledby={`${id}-task-title`}>
      {/* The official site's decorative sheet rulers use 1–8 across and A–D down. */}
      {[styles.rulerTop, styles.rulerBottom].map(side => <div className={cn(styles.ruler, side)} key={side} aria-hidden="true">
        {["1", "2", "3", "4", "5", "6", "7", "8"].map(mark => <span className="text-ui-meta tabular-nums" key={mark}>{mark}</span>)}
      </div>)}
      {[styles.rulerLeft, styles.rulerRight].map(side => <div className={cn(styles.ruler, side)} key={side} aria-hidden="true">
        {["A", "B", "C", "D"].map(mark => <span className="text-ui-meta" key={mark}>{mark}</span>)}
      </div>)}
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
              <div className={styles.summaryTitle}>
                <AgentMark state="idle" label="AI 辅助任务" />
                <h3 className="text-block-title">为本次考试生成可信的学情诊断</h3>
              </div>
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
            <ZoneHeading letter="A" title="任务进程" caption="Process" id={`${id}-process`} />
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
            <ZoneHeading letter="B" title="Agent 执行记录" caption="Activity" id={`${id}-activity`} />
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
                  <div className={styles.composerGroup} role="group" aria-labelledby={`${id}-composer-label`}>
                    {/* AgentComposer owns its input id and matching accessible label. */}
                    <p id={`${id}-composer-label`} className="text-ui-action">发送给 Agent 的演示消息</p>
                    <AgentComposer
                      value={draft}
                      onChange={setDraft}
                      onSubmit={sendDemoMessage}
                      label="发送给 Agent 的演示消息"
                      placeholder="向 Agent 提出进一步要求（演示模式）"
                      submitLabel="发送演示消息"
                      variant="conversation"
                      inputSize="compact"
                      toolbarLayout="inline"
                      maxLength={160}
                      footerNote={<div className={styles.composerFoot}>
                        <span className="tabular-nums">{draft.length} / 160</span>
                        <span role="status" aria-live="polite" aria-atomic="true"><span key={feedback?.serial ?? 0}>{feedback?.text ?? "仅体验输入反馈，未连接 Agent。"}</span></span>
                      </div>}
                    />
                  </div>
                </div>
              </CardPanel>
            </Card>
          </section>

          <section id="blueprint-evidence" className={cn(styles.zone, styles.evidenceZone)} aria-labelledby={`${id}-evidence`}>
            <ZoneHeading letter="C" title="证据与产出" caption="Evidence" id={`${id}-evidence`} />
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

        <footer className={styles.sheetFooter}>
          <dl className={styles.titleblock} aria-label="工作纸面图签">
            <div className={styles.titleblockMain}>
              <dt className="flex items-center gap-2 text-ui-hint"><Link2 aria-hidden="true" className="size-4" />任务证据链</dt>
              <dd className={styles.titleblockFlow}>
                <ol className={styles.flowSteps} aria-label="处理顺序：输入、批阅、证据、诊断、报告">
                  {["Input", "Grading", "Evidence", "Diagnosis", "Output"].map((step, index) => <li key={step} className="flex items-center gap-2 text-ui-meta text-muted-foreground"><span lang="en">{step}</span>{index < 4 && <ArrowRight className="size-3" aria-hidden="true" />}</li>)}
                </ol>
                <p className="text-ui-meta text-muted-foreground">模拟数据 · 未连接业务 Runtime</p>
              </dd>
            </div>
            <div className={styles.titleblockCell}><dt className="text-ui-meta text-muted-foreground">任务编号</dt><dd className="text-ui-action tabular-nums">WK-042</dd></div>
            <div className={styles.titleblockCell}><dt className="text-ui-meta text-muted-foreground">页面修订</dt><dd className="text-ui-action">Prism Blueprint v0.3</dd></div>
            <div className={styles.titleblockCell}><dt className="text-ui-meta text-muted-foreground">任务版本</dt><dd className="text-ui-action">V1</dd></div>
            <div className={styles.titleblockCell}><dt className="text-ui-meta text-muted-foreground">固定演示快照</dt><dd className="text-ui-action tabular-nums">第 3 / 4 步</dd></div>
          </dl>
          <div className={styles.sourceFooter}>
            <span className="text-ui-meta text-muted-foreground">页面结构改编自 Answer me with HTML</span>
            <div className={styles.sourceLinks}>
              <Button variant="link" render={<a href={officialStyleHref} target="_blank" rel="noopener noreferrer" />}>样式来源<ArrowUpRight aria-hidden="true" /></Button>
              <Button variant="link" render={<a href={officialLicenseHref} target="_blank" rel="noopener noreferrer" />}>MIT 许可</Button>
            </div>
          </div>
        </footer>
      </div>
    </section>

    <section className={styles.reviewNotes} aria-label="页面精修观察" hidden={focused || stage === "original"}>
      <div className={styles.reviewHeading}><h2 className="text-block-title">精修观察</h2><p className="text-ui-hint text-muted-foreground">v0.3 · 官网源样式移植</p></div>
      <dl className={styles.noteGrid}>
        <Note title="空间秩序">{refinementNotes.structure}</Note>
        <Note title="组件衔接">{refinementNotes.transition}</Note>
        <Note title="阅读舒适度">{refinementNotes.reading}</Note>
      </dl>
    </section>
    </main>

    <Dialog open={detail !== null} onOpenChange={open => { if (!open) setDetailKey(null) }}>
      <DialogPopup portalProps={{ container: themeScope }} finalFocus={detailTrigger} closeProps={{ "aria-label": "关闭详情" }}>
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
