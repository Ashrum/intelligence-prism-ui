"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { ArrowDown, ArrowUp, ChevronRight, CircleAlert, Pause, RotateCcw, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/coss/alert"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Frame, FrameFooter, FrameHeader } from "@/components/coss/frame"
import { ScrollArea } from "@/components/coss/scroll-area"
import { Badge } from "../badge"
import { Button } from "../button"
import { DemoSection, Feedback } from "../demo-parts"
import { DraftMathPreview } from "../draft-math-preview"
import { ErrorCauseReview, type ErrorCauseReviewValue } from "../error-cause-review"
import { QuestionInspector, type QuestionInspectorProps } from "../question-inspector"
import { ScoreReview, type ScoreReviewDraft, type ScoreReviewPoint } from "../score-review"
import { StudentPaperReport } from "../student-paper-report"

export const gradingFunctionAreaStates = [
  { id: "loss", title: "① AI 已批完 · 有失分" },
  { id: "full", title: "② AI 已批完 · 全对" },
  { id: "confirm", title: "③ 待你确认" },
  { id: "edit", title: "④ 改分中" },
  { id: "manual", title: "⑤ 待你批阅" },
  { id: "edited", title: "⑥ 你已修改" },
  { id: "paused", title: "⑦ 暂停 / 等待重新批阅" },
  { id: "report", title: "⑧ 没选题 · 整卷报告" },
] as const
export type GradingFunctionAreaState = typeof gradingFunctionAreaStates[number]["id"]

const points: readonly ScoreReviewPoint[] = [
  { id: "expression", label: "求出抛物线解析式", maxScore: 3, score: 3 },
  { id: "vertex", label: "配方得到顶点坐标", maxScore: 4, score: 2 },
  { id: "conclusion", label: "写出对称轴与结论", maxScore: 3, score: 1 },
]
const editedPoints = points.map(point => point.id === "vertex" ? { ...point, score: 4 } : point)
const categories = [{ id: "calculation", label: "计算错误" }, { id: "expression", label: "表达不规范" }, { id: "other", label: "其他", isOther: true }]
const originalCause: ErrorCauseReviewValue = { category: "calculation", explanation: "配方时把 −4x 写成 +4x，顶点坐标随之出错。" }
const editedCause: ErrorCauseReviewValue = { category: "expression", explanation: "结论没有写出对称轴方程。" }
const answer = "学生写出 \\(y=x^2-4x+3\\)，配方步骤书写不清，末行写出顶点与对称轴结论。"
const standardAnswer = "配方得 \\(y=(x-2)^2-1\\)，顶点为 \\((2,-1)\\)，对称轴为 \\(x=2\\)。请核对配方的符号处理及最终结论。"
const history = [{ id: "ai", score: 6, reason: "AI 批阅：配方过程需要核对。", time: "2026-10-05 09:20" }]
const sectionLabels = { answer: "学生作答文字", standardAnswer: "标准答案与解析", history: "修改记录" }
const reasonOptions = [{ id: "missed", label: "作答步骤正确，AI 漏判" }, { id: "readable", label: "书写可以辨认" }, { id: "recalculate", label: "按评分点重新核算" }, { id: "other", label: "其他", isOther: true }]

function Detail({ title, children }: { title: string; children: ReactNode }) {
  return <Collapsible defaultOpen={false}>
    <CollapsibleTrigger render={<Button variant="ghost" className="w-full justify-between" />}>
      {title}<ChevronRight aria-hidden="true" />
    </CollapsibleTrigger>
    <CollapsiblePanel className="motion-reduce:transition-none"><div className="space-y-2 px-3 py-2 text-ui-body">{children}</div></CollapsiblePanel>
  </Collapsible>
}

function Details({ full = false, edited = false, paused = false }: { full?: boolean; edited?: boolean; paused?: boolean }) {
  return <div data-function-area-details className="space-y-1">
    <Detail title="标准答案与解析"><DraftMathPreview label="标准答案与解析" value={full ? "标准答案为 B。根据题干条件逐项排除其余选项。" : standardAnswer} notice={null} showHelp={false} /></Detail>
    {!full && !paused && <Detail title="学生作答文字"><DraftMathPreview label="学生作答文字" value={answer} notice={null} showHelp={false} /></Detail>}
    <Detail title="修改记录">
      {!full && <p>{paused ? "原 AI 批阅：6 分 · 因重新批阅失效" : "AI 批阅：6 分 · 2026-10-05 09:20"}</p>}
      {edited && <p>陈老师：6 → 8 分 · 作答步骤正确，AI 漏判 · 2026-10-05 09:25</p>}
      {full && <p>本题 AI 批阅：3 分；没有教师修改记录。</p>}
    </Detail>
  </div>
}

function FunctionAreaHeader({ mode, request }: { mode: GradingFunctionAreaState; request: (message: string) => void }) {
  const status = mode === "confirm" ? "待你确认" : mode === "edit" ? "修改评分" : mode === "manual" ? "待你批阅" : mode === "paused" ? "暂停" : mode === "full" ? "全对" : "部分对"
  return <FrameHeader className="shrink-0 flex-row flex-wrap items-center gap-2 px-3 py-2">
    <h3 className="text-block-title">{mode === "full" ? "第 3 题 · 单选题" : mode === "paused" ? "第 17 题 · 解答题" : "第 21 题 · 解答题"}</h3>
    <Badge variant={mode === "full" ? "success" : mode === "manual" ? "error" : mode === "edit" ? "info" : "warning"}>{status}</Badge>
    <div className="ml-auto flex items-center">
      <Button variant="ghost" onClick={() => request("已请求查看整卷报告。")}>整卷</Button>
      <Button variant="ghost" size="icon" aria-label="上一题" onClick={() => request("已请求上一题。")}><ArrowUp /></Button>
      <Button variant="ghost" size="icon" aria-label="下一题" onClick={() => request("已请求下一题。")}><ArrowDown /></Button>
    </div>
  </FrameHeader>
}

/** The local host owns UI drafts only. Intent feedback never changes saved facts or generates receipts. */
export function GradingFunctionAreaBoard({ initialState }: { initialState: GradingFunctionAreaState }) {
  const [mode, setMode] = useState(initialState)
  const [returnMode, setReturnMode] = useState<GradingFunctionAreaState>(initialState === "edit" ? "loss" : initialState)
  const [draftPoints, setDraftPoints] = useState<readonly ScoreReviewPoint[]>(initialState === "manual" ? points.map(point => ({ ...point, score: null })) : initialState === "edited" || initialState === "edit" ? editedPoints : points)
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(initialState === "edit" ? "missed" : null)
  const [reason, setReason] = useState("")
  const [unanswered, setUnanswered] = useState(false)
  const [causeEditing, setCauseEditing] = useState(false)
  const cause = initialState === "edited" ? editedCause : originalCause
  const [causeDraft, setCauseDraft] = useState(cause)
  const [notice, setNotice] = useState("")
  const panelRef = useRef<HTMLDivElement>(null)
  const causeEditRef = useRef<HTMLButtonElement>(null)
  const previousMode = useRef(mode)
  const previousCauseEditing = useRef(causeEditing)
  useEffect(() => {
    if (previousMode.current !== mode) panelRef.current?.focus()
    previousMode.current = mode
  }, [mode])
  useEffect(() => {
    if (previousCauseEditing.current && !causeEditing) causeEditRef.current?.focus()
    previousCauseEditing.current = causeEditing
  }, [causeEditing])
  const request = (message: string) => setNotice(`${message}等待宿主处理；当前事实保持不变。`)
  const beginEdit = () => {
    setReturnMode(mode)
    setDraftPoints(mode === "full" ? [{ id: "choice", label: "选项判断", score: 3, maxScore: 3 }] : mode === "edited" ? editedPoints : points)
    setSelectedReasonId(null); setReason(""); setUnanswered(false); setMode("edit")
  }
  const cancelEdit = () => { setMode(returnMode); setNotice("已取消评分草稿，原评分与修改记录保持不变。") }
  const full = mode === "full" || mode === "edit" && returnMode === "full"
  const currentScore = full ? 3 : initialState === "edited" ? 8 : 6
  const maxScore = full ? 3 : 10
  const save = (draft: ScoreReviewDraft) => request(`已请求${mode === "confirm" ? "采纳" : "保存"} ${draft.score} 分。`)
  const edited = mode === "edited"
  const displayedPoints = edited ? editedPoints : points
  const inspectorPoints: QuestionInspectorProps["points"] = full ? [] : displayedPoints.map(point => ({
    id: point.id, label: point.label, value: `${point.score} / ${point.maxScore}`,
    tone: point.score === point.maxScore ? "success" : "warning", status: point.score === point.maxScore ? "满分" : "未得满分",
  }))
  const scoreTotal = unanswered ? 0 : draftPoints.every(point => point.score !== null) ? draftPoints.reduce((total, point) => total + (point.score ?? 0), 0) : null
  const boardTitle = gradingFunctionAreaStates.find(state => state.id === initialState)!.title
  const editingScore = mode === "confirm" || mode === "edit" || mode === "manual"
  return <div className="min-w-0" data-function-area-fixture={initialState}>
    <p className="mb-3 text-block-title">{boardTitle}</p>
    <Frame ref={panelRef} role="region" tabIndex={-1} aria-label={`批阅功能栏 · ${gradingFunctionAreaStates.find(state => state.id === mode)!.title}`} data-function-area-board={initialState} data-function-area-mode={mode} className="h-[844px] w-[380px] max-w-full overflow-hidden">
      {mode !== "report" && <FunctionAreaHeader mode={mode} request={request} />}
      {mode === "loss" || mode === "full" || mode === "edited" ? <div className="min-h-0 flex-1 overflow-hidden">
        <QuestionInspector bodyOnly density="compact" title={full ? "第 3 题" : "第 21 题"} status={full ? "全对" : "部分对"}
          navigation={{ previous: true, next: true, nextWrong: true }} actions={[]} onStep={() => {}} onWrong={() => {}}
          score={{ value: full ? 3 : edited ? 8 : 6, max: maxScore, text: full ? 3 : edited ? 8 : 6, denominator: `/ ${maxScore} 分`, judgement: full ? "全对" : "部分对" }}
          scoreSource={edited ? <Badge variant="info">你已修改</Badge> : <span className="inline-flex items-center gap-1 text-ui-hint"><Sparkles className="size-4" aria-hidden="true" />AI 批阅</span>}
          afterScore={edited ? <p className="text-ui-hint">原 AI 批阅 6 分 · 作答步骤正确，AI 漏判</p> : undefined}
          points={inspectorPoints} pointsEmptyText="未提供" evidence={null} knowledge={[]} comparison={[]}
          showEvidence={false} showConfidence={false} showKnowledge={false} showComparison={false}
          afterPoints={<div className="space-y-4">
            {full ? <section aria-label="作答" className="space-y-2"><h4 className="text-block-title">作答</h4><p className="text-ui-body">学生作答：B</p><p className="text-ui-body">标准答案：B</p></section> : <ErrorCauseReview density="compact" editLabel="修改错因" hideEditAction categories={categories} value={cause} editing={causeEditing} draft={causeDraft}
              onChange={setCauseDraft} onCancel={() => { setCauseEditing(false); setCauseDraft(cause); setNotice("已取消错因草稿，原错因保持不变。") }} onSave={() => request("已请求保存错因。")} />}
            <Details full={full} edited={edited} />
          </div>}
          footer={<div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={beginEdit}>修改评分</Button>
            {!full && <Button ref={causeEditRef} variant="outline" disabled={causeEditing} onClick={() => { setCauseDraft(cause); setCauseEditing(true) }}>修改错因</Button>}
            <Button variant="ghost" onClick={() => request("已请求重新 AI 批阅。")}><RotateCcw />重新 AI 批阅</Button>
          </div>} />
      </div> : null}
      {editingScore && <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
        {mode === "manual" && <Alert variant="error" className="shrink-0"><CircleAlert aria-hidden="true" /><AlertDescription className="text-ui-body">AI 没能批阅这份作答：这一页的扫描图像太模糊，无法辨认。请对照答卷给分。</AlertDescription></Alert>}
        <ScoreReview density="compact" mode={mode} showIdentity={false} showConfidence={false} showBasis={false} instruction={false}
          studentName="张同学" questionLabel={full ? "第 3 题 · 单选题" : "第 21 题 · 解答题"} maxScore={maxScore}
          aiSuggestion={{ score: 6, reason: "第二步的配方过程书写不清，AI 不能确定是否得到了正确的顶点坐标。" }}
          points={mode === "confirm" ? points.map(point => ({ ...point, uncertain: point.id === "vertex" })) : draftPoints}
          onPointsChange={setDraftPoints} baselineScore={currentScore} requireReasonOnChange={false}
          scoreContext={mode === "edit" ? `原 ${currentScore} 分` : undefined}
          showReason={mode === "edit"} reasonOptions={mode === "edit" ? reasonOptions : undefined}
          requireReasonSelection={mode === "edit"} selectedReasonId={selectedReasonId} onReasonSelect={setSelectedReasonId} reason={reason} onReasonChange={setReason}
          unanswered={mode === "confirm" ? undefined : unanswered} onUnansweredChange={mode === "confirm" ? undefined : setUnanswered}
          saveDisabledReason={mode === "manual" && scoreTotal === null ? "请给全评分点。" : undefined}
          answer={mode === "manual" ? undefined : full ? "B" : answer} standardAnswer={full ? "标准答案为 B。" : standardAnswer}
          history={mode === "confirm" ? history : undefined} sectionsPlacement="bottom" sectionLabels={sectionLabels}
          sectionsDefaultOpen={{ answer: false, standardAnswer: false, history: false }}
          actionLabels={{ save: mode === "confirm" ? "采纳 6 分 · 下一题" : mode === "manual" ? "保存 · 下一题" : `保存 ${scoreTotal ?? "—"} 分` }}
          onEdit={beginEdit} onCancel={cancelEdit} onSave={save} onRetry={save} />
      </div>}
      {mode === "paused" && <div data-function-area-scroll className="min-h-0 flex-1 overflow-hidden"><ScrollArea overscrollContain scrollFade><div className="space-y-4 p-3">
        <Alert variant="warning"><Pause aria-hidden="true" /><AlertTitle className="text-block-title">本题暂停批阅</AlertTitle><AlertDescription className="text-ui-body">这道题的作答区域没能确定，全班 45 份都还没有批阅。核对解析后继续。<Button onClick={() => request("已请求核对解析。")}>核对解析</Button></AlertDescription></Alert>
        <Alert variant="info"><RotateCcw aria-hidden="true" /><AlertTitle className="text-block-title">正在重新 AI 批阅</AlertTitle><AlertDescription className="text-ui-body"><p className="text-ui-hint">另一种外部状态 · 等待重新批阅时</p>完成后把需要处理的交给你。原来的结果保留在修改记录里。</AlertDescription></Alert>
        <Details paused />
      </div></ScrollArea></div>}
      {mode === "report" && <>
        <div data-function-area-scroll className="min-h-0 flex-1 overflow-hidden"><ScrollArea overscrollContain scrollFade>
          <StudentPaperReport density="compact" studentName="张同学" status="待处理 2 题" score={78} maxScore={100}
            counts={{ full: 14, partial: 4, wrong: 2, unanswered: 0 }} complete={false} provided={20}
            coverageText="已批 20 题 · 另有 2 题待处理，分数会变化" pendingCount={2} totalLost={18}
            causes={[
              { id: "calculation", category: "计算错误", count: 3, lost: 9, meter: { value: 9, max: 9, label: "计算错误失 9 分，分布上限 9 分" } },
              { id: "steps", category: "步骤不完整", count: 2, lost: 6, meter: { value: 6, max: 9, label: "步骤不完整失 6 分，分布上限 9 分" } },
              { id: "reading", category: "审题错误", count: 1, lost: 3, meter: { value: 3, max: 9, label: "审题错误失 3 分，分布上限 9 分" } },
            ]}
            analysis="基础题全部正确。失分集中在解答题的配方与求最值：思路正确，但配方时符号出错。建议练习配方法的符号处理。"
            analysisSource="AI 整卷分析 · 已提供的 20 题" onFirstPending={() => request("已请求定位第一道待办题。")} />
        </ScrollArea></div>
        <FrameFooter className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-3"><span className="text-ui-hint">AI 分析仅供参考</span><Button variant="ghost" onClick={() => request("已请求重新 AI 批阅整卷。")}><RotateCcw />重新 AI 批阅整卷</Button></FrameFooter>
      </>}
    </Frame>
    <Feedback>{notice || "静态事实夹具；保存、采纳、定位和重新批阅只记录请求，不产生服务回执。"}</Feedback>
  </div>
}

export function GradingFunctionAreaDemo() {
  return <>
    <Alert><CircleAlert aria-hidden="true" /><AlertDescription className="text-ui-body">每栏宽 380px、高 844px；三主题使用同一组事实。查看态可进入本地评分或错因草稿，保存只记录请求；⑥为独立的已保存事实夹具。</AlertDescription></Alert>
    {(["light", "paper", "dark"] as const).map(theme => <DemoSection key={theme} title={`${theme === "light" ? "浅色" : theme === "paper" ? "暖纸" : "深色"} · 批阅功能栏八种状态`}>
      <div data-agent-preview data-prism-theme={theme} data-ui-version="coss-v1" className="flex flex-wrap items-start gap-6 p-3">
        {gradingFunctionAreaStates.map(state => <GradingFunctionAreaBoard key={state.id} initialState={state.id} />)}
      </div>
    </DemoSection>)}
  </>
}
