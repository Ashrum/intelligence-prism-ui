"use client"

import { useState } from "react"
import { ScoreReview, type ScoreReviewProps, type ScoreReviewDraft } from "../score-review"
import { Button } from "@/components/coss/button"
import { DemoSection, Feedback } from "../demo-parts"

export const scoreReviewBase: ScoreReviewProps = {
  studentName: "李华", questionLabel: "主观题 3", examNumber: "20260126", eyebrow: "MANUAL REVIEW",
  confidencePercent: 62, confidenceLabel: "低置信度", progress: { current: 1, total: 9 },
  answer: "设函数 \\(f(x)=x^2-2x-3=(x-1)^2-4\\)，由题意可得最小值为 −4。结论成立，但尚未给出取等条件的完整推导。",
  maxScore: 10, step: 1, defaultScore: 6,
  aiSuggestion: { score: 6, reason: "关键步骤正确；结论成立，但缺少完整推导。", basis: ["评分规则 R3", "参考答案步骤 2–4"] },
  requireReasonOnChange: true,
  history: [{ id: "review-1", score: 5, reason: "初次核对：待补充关键推导步骤的评分依据。", time: "2026-10-01 14:32" }],
}

export const scoreReviewFixtures: { id: string; title: string; props: Partial<ScoreReviewProps> }[] = [
  { id: "adjusted", title: "调整为 7 分 · 理由必填", props: { score: 7, reason: "" } },
  { id: "half", title: "0.5 分步长 · 非受控评分", props: { step: 0.5, defaultScore: 6.5, defaultReason: "补充了取等条件，按评分规则增加半分。" } },
  { id: "saving", title: "保存中 · 等待回执", props: { state: { kind: "saving" } } },
  { id: "failed", title: "保存失败 · 可重试", props: { state: { kind: "failed", reason: "保存服务暂时不可用，当前评分和理由仍保留。" } } },
  { id: "saved", title: "保存成功 · 审计记录", props: { state: { kind: "saved", score: 6, auditUpdated: true } } },
  { id: "unknown", title: "未提供置信度 · 独立评分面板", props: { confidencePercent: undefined, confidenceLabel: undefined, progress: undefined, history: [] } },
]

function ScoreFixture({ overrides, onIntent }: { overrides: Partial<ScoreReviewProps>; onIntent: (message: string) => void }) {
  const [score, setScore] = useState<number | null>(overrides.score ?? overrides.defaultScore ?? 6)
  const [reason, setReason] = useState(overrides.reason ?? overrides.defaultReason ?? "")
  const intent = (label: string) => (draft: ScoreReviewDraft) => onIntent(`${label}：${draft.score} 分；理由：${draft.reason || "未填写"}。等待处理回执。`)
  return <ScoreReview {...scoreReviewBase} {...overrides}
    {...(overrides.defaultScore === undefined ? { score, onScoreChange: setScore } : {})}
    reason={reason} onReasonChange={setReason}
    onAcceptAi={value => onIntent(`已接受 ${value} 分建议作为编辑草稿，尚未保存。`)}
    onSave={intent("保存请求")} onRetry={intent("重试请求")}
    onPrev={() => onIntent("请求上一题；等待调用方导航。")} onSkip={() => onIntent("请求跳过；等待调用方导航。")} />
}

export function ScoreReviewReasonReceiptDemo() {
  const [question, setQuestion] = useState(3)
  const [score, setScore] = useState<number | null>(6)
  const [reason, setReason] = useState("")
  const [lastSaved, setLastSaved] = useState<ScoreReviewProps["lastSaved"]>()
  const [notice, setNotice] = useState("尚无保存请求。")
  return <DemoSection id="score-required-receipt" title="每次保存必填理由 · 上一题保存回执" description="当前分数等于 AI 建议仍需填写理由。回执控件载入独立预设数据，保存按钮只发出请求。切换题项后焦点移到面板标题。">
    <div className="mb-4 flex flex-wrap gap-2">
      <Button variant="outline" className="min-h-11 h-auto sm:h-auto whitespace-normal" onClick={() => setLastSaved({ score: 7, label: "主观题 2" })}>载入预设回执</Button>
      <Button variant="outline" className="min-h-11 h-auto sm:h-auto whitespace-normal" disabled={!lastSaved} onClick={() => setLastSaved(undefined)}>清除回执</Button>
      <Button variant="outline" className="min-h-11 h-auto sm:h-auto whitespace-normal" onClick={() => { setQuestion(value => value + 1); setScore(6); setReason(""); setLastSaved(undefined) }}>切换题项（焦点交接）</Button>
    </div>
    <ScoreReview {...scoreReviewBase} questionId={`student-1-question-${question}`} questionLabel={`主观题 ${question}`} progress={undefined}
      focusOnQuestionChange requireReason requireReasonOnChange={false} lastSaved={lastSaved}
      score={score} onScoreChange={setScore} reason={reason} onReasonChange={setReason}
      onAcceptAi={() => setNotice("已接受建议作为草稿，尚未保存。")}
      onSave={draft => setNotice(`保存请求：${draft.score} 分；理由：${draft.reason}。等待处理回执。`)} />
    <Feedback>{notice}</Feedback>
  </DemoSection>
}

export function ScoreReviewDemo() {
  const [notice, setNotice] = useState("尚无操作请求。")
  const [narrow, setNarrow] = useState(false)
  const [region, setRegion] = useState("answer-3")
  return <>
    <DemoSection title="李华 · 主观题 3" description="低置信度 62%。核对原始作答、AI 评分依据与教师最终评分。保存和重试只发出请求，回执状态由调用方提供。">
      <Button variant="outline" className="mb-4 h-auto sm:h-auto whitespace-normal" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 窄容器</Button>
      <div style={narrow ? { width: 320, maxWidth: "100%" } : undefined}>
        <ScoreFixture onIntent={setNotice} overrides={{
          locationNotice: "已标记第 3 题作答区域；原始笔迹图像未接入。",
          paper: {
            title: "李华 · 原卷", subtitle: "高二数学 · 第 3 题", status: { label: "待人工复核", variant: "warning" },
            pages: [{ id: "paper-1", paperSize: "A4", regions: [{ id: "answer-3", label: "第 3 题作答区域", rect: [8, 42, 84, 24] }] }],
            selectedRegionId: region, onRegionSelect: (_, next) => setRegion(next),
            information: [{ label: "学生", value: "李华" }, { label: "考号", value: "20260126" }, { label: "原始笔迹", value: "图像未接入" }], versions: [],
          },
        }} />
      </div>
      <Feedback>{notice}</Feedback>
    </DemoSection>
    <ScoreReviewReasonReceiptDemo />
    {scoreReviewFixtures.map(fixture => <DemoSection key={fixture.id} id={`score-${fixture.id}`} title={fixture.title}>
      <ScoreFixture overrides={fixture.props} onIntent={setNotice} />
      <Feedback>{notice}</Feedback>
    </DemoSection>)}
    <DemoSection title="三主题 · 320px 长中文与公式" description="浅色、暖纸、深色使用同一组语义字号与 coss 控件。">
      <div className="flex flex-wrap gap-4">{(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} data-ui-version="coss-v1" className="w-80 max-w-full p-3">
        <p className="pb-3 text-item-title">{theme === "light" ? "浅色" : theme === "paper" ? "暖纸" : "深色"}</p>
        <ScoreFixture overrides={{ questionLabel: "主观题 3：二次函数配方法的完整推导、取等条件与结论核对", step: 0.5, defaultScore: 7, defaultReason: "逐项核对学生的配方过程、最小值与取等条件，依据评分规则补计推导步骤分。" }} onIntent={setNotice} />
      </div>)}</div>
      <Feedback>{notice}</Feedback>
    </DemoSection>
  </>
}
