"use client"

import { useState } from "react"
import { ScoreReview, type ScoreReviewPoint, type ScoreReviewProps, type ScoreReviewDraft } from "../score-review"
import { scoreReviewBase } from "./score-review"
import { DemoSection, Feedback } from "../demo-parts"

const initialPoints: readonly ScoreReviewPoint[] = [
  { id: "method", label: "配方步骤与等价变形", maxScore: 4, score: 4 },
  { id: "condition", label: "完整推导取等条件并说明定义域对最终结论的限制", maxScore: 4, score: 2.5, uncertain: true },
  { id: "conclusion", label: "核对最小值与最终结论", maxScore: 2, score: null },
]
const reasonOptions = [{ id: "missed", label: "作答步骤正确，AI 漏判" }, { id: "recalculate", label: "按评分点重新核算" }, { id: "other", label: "其他", isOther: true }]

function ExtensionFixture({ overrides = {} }: { overrides?: Partial<ScoreReviewProps> }) {
  const { points: startingPoints, selectedReasonId: startingReasonId, reason: startingReason, unanswered: startingUnanswered, ...presentation } = overrides
  const [points, setPoints] = useState<readonly ScoreReviewPoint[]>(startingPoints ?? initialPoints)
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(startingReasonId ?? null)
  const [reason, setReason] = useState(startingReason ?? "")
  const [unanswered, setUnanswered] = useState(startingUnanswered ?? false)
  const [notice, setNotice] = useState("等待核对评分点。")
  const saveIntent = (draft: ScoreReviewDraft) => setNotice(`已请求保存 ${draft.score} 分${draft.unanswered ? "，未作答" : ""}；${draft.reason}。等待处理回执。`)
  return <>
    <ScoreReview {...scoreReviewBase} requireReasonOnChange={false} points={points} onPointsChange={setPoints} pointStep={0.5}
      unanswered={unanswered} onUnansweredChange={setUnanswered} reasonOptions={reasonOptions} selectedReasonId={selectedReasonId}
      onReasonSelect={setSelectedReasonId} requireReasonSelection reason={reason} onReasonChange={setReason}
      shortcuts actionLabels={{ save: "保存并看下一份", retry: "重试并看下一份", accept: "采纳 6 分 · 下一题", skip: "稍后处理" }}
      onAcceptAi={value => setNotice(`已请求采纳 ${value} 分建议；等待调用方确认评分点及后继操作。`)}
      onSave={saveIntent} onRetry={saveIntent} onSkip={() => setNotice("已请求稍后处理；等待调用方导航。")}
      {...presentation} />
    <Feedback>{notice}</Feedback>
  </>
}

/** Separate route preserves the exact existing ScoreReviewDemo output. */
export function ScoreReviewExtensionsDemo() {
  return <>
    <DemoSection title="逐点评分 · 预置理由 · 未作答" description="逐点给分后显示合计；选择其他理由须填写说明。标记和撤销未作答保留逐点草稿，保存只发出请求。">
      <ExtensionFixture />
    </DemoSection>
    <DemoSection title="只读评分点 · 满分、存疑与未得满分" description="只读评分点保留来源分数与存疑标记，总分没有可编辑外观。">
      <ExtensionFixture overrides={{ pointsReadOnly: true, points: initialPoints.map(point => ({ ...point, score: point.score ?? 0 })), selectedReasonId: "recalculate" }} />
    </DemoSection>
    <DemoSection title="保存中 · 禁用评分操作"><ExtensionFixture overrides={{ state: { kind: "saving" } }} /></DemoSection>
    <DemoSection title="失败重试 · 保留评分点与其他理由"><ExtensionFixture overrides={{ state: { kind: "failed", reason: "保存服务暂时不可用，输入已保留。" }, points: initialPoints.map(point => ({ ...point, score: point.score ?? 1 })), selectedReasonId: "other", reason: "已逐项核对原始作答中的取等条件，补计结论分。" }} /></DemoSection>
    <DemoSection title="只禁保存 · 可继续修改"><ExtensionFixture overrides={{ saveDisabledReason: "已保存；调整后可再次保存并留痕。", unansweredDisabledReason: "作答证据正在核对，暂不可标记未作答。" }} /></DemoSection>
    <DemoSection title="总分只读 · 宿主提供合计"><ScoreReview {...scoreReviewBase} requireReasonOnChange={false} score={6.5} scoreReadOnly saveDisabledReason="总分来源正在更新，暂不可保存。" /></DemoSection>
    <DemoSection title="三主题 · 320px 长中文与公式" description="主题使用同一组语义字号与标准 coss 控件；公式沿用原作答预览。">
      <div className="flex flex-wrap gap-4">{(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} data-ui-version="coss-v1" className="w-80 max-w-full p-3">
        <p className="pb-3 text-item-title">{theme === "light" ? "浅色" : theme === "paper" ? "暖纸" : "深色"}</p>
        <ExtensionFixture overrides={{ questionLabel: "主观题 3：二次函数配方法、完整推导、取等条件与结论核对" }} />
      </div>)}</div>
    </DemoSection>
  </>
}
