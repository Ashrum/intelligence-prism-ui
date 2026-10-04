"use client"

import { useState } from "react"
import { DemoSection } from "../demo-parts"
import { ErrorCauseReview, type ErrorCauseReviewProps, type ErrorCauseReviewValue } from "../error-cause-review"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"

export const errorCauseReviewCategories = [
  { id: "concept", label: "概念理解错误" },
  { id: "method", label: "方法选择错误" },
  { id: "calculation", label: "计算错误" },
  { id: "incomplete", label: <>步骤不完整 · 需核对 {reviewFormula} 的推导条件</> },
  { id: "other", label: "其他", isOther: true },
]
export const errorCauseReviewValue: ErrorCauseReviewValue = {
  category: "incomplete",
  explanation: "作答已经列出关系式，但没有说明参数取值约束与最终结论之间的逻辑联系，请对照完整题干逐步核对。",
}
export const errorCauseReviewHistory: ErrorCauseReviewProps["history"] = [{
  id: "cause-1", category: "方法选择错误", explanation: <>未明确 {reviewFormula} 的适用条件。</>,
  operator: "王老师", time: { label: "2026-10-05 09:30", dateTime: "2026-10-05T09:30:00+08:00" },
  status: "因重新批阅失效；此记录仅保留当时的处理依据。",
}]

/** Host fixture owns the editable draft; a save intention never fabricates a receipt. */
export function ErrorCauseReviewFixture() {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(errorCauseReviewValue)
  const [notice, setNotice] = useState("")
  return <><ErrorCauseReview categories={errorCauseReviewCategories} value={errorCauseReviewValue}
    editing={editing} draft={draft} history={errorCauseReviewHistory}
    onEdit={() => { setDraft(errorCauseReviewValue); setEditing(true); setNotice("") }}
    onChange={setDraft} onCancel={() => { setEditing(false); setNotice("已取消编辑，保留原错因。") }}
    onSave={next => setNotice(`已请求保存：${next.explanation || "说明未提供"}；等待宿主回执。`)} />
    <p role="status" className="text-ui-hint text-muted-foreground">{notice || "分类、说明和修改记录均由宿主提供。"}</p></>
}

function ErrorCauseReviewSnapshot({ variant }: { variant: "required" | "saving" | "failed" | "disabled" | "missing" | "saved" }) {
  const [draft, setDraft] = useState<ErrorCauseReviewValue>({ category: "other", explanation: variant === "required" ? "" : "对照原卷后，仍需补充说明等价变形的适用条件。" })
  const [notice, setNotice] = useState("")
  const editing = ["required", "saving", "failed"].includes(variant)
  return <><ErrorCauseReview categories={errorCauseReviewCategories}
    value={variant === "missing" ? null : errorCauseReviewValue} editing={editing} draft={draft}
    state={variant === "saving" ? { kind: "saving" } : variant === "failed" ? { kind: "failed", reason: "连接中断；当前输入已保留，请核对后重试。" } : variant === "saved" ? { kind: "saved", message: "错因已保存，修改记录已保留。" } : { kind: "ready" }}
    disabledReason={variant === "disabled" ? "本次批阅已关闭，当前错因仅供查看。" : undefined}
    history={variant === "disabled" ? errorCauseReviewHistory : undefined}
    onEdit={() => setNotice("已请求进入编辑。")}
    onChange={setDraft} onSave={() => setNotice("已请求保存，等待宿主回执。")}
    onCancel={() => setNotice("已请求取消编辑。")}/>
    {notice && <p role="status" className="text-ui-hint">{notice}</p>}</>
}

export function ErrorCauseReviewDemo() {
  return <>
    <DemoSection title="错因核对 · 长中文、公式与历史" description="修改后选择分类并填写说明；保存仅发出意图，宿主决定保存结果与退出编辑。"><ReviewDemoThemes>{() => <ErrorCauseReviewFixture />}</ReviewDemoThemes></DemoSection>
    <DemoSection title="其他 · 说明必填" description="空说明不能保存；常驻标签与错误说明保持可见。"><ReviewDemoThemes>{() => <ErrorCauseReviewSnapshot variant="required" />}</ReviewDemoThemes></DemoSection>
    <DemoSection title="保存失败 · 保留输入" description="失败回执由宿主提供；修改输入后可以重试，组件不自行清空草稿。"><ReviewDemoThemes>{() => <ErrorCauseReviewSnapshot variant="failed" />}</ReviewDemoThemes></DemoSection>
    <DemoSection title="正在保存" description="保存中停用分类、说明、保存与取消操作。"><ReviewDemoThemes>{() => <ErrorCauseReviewSnapshot variant="saving" />}</ReviewDemoThemes></DemoSection>
    <DemoSection title="禁止修改 · 历史失效" description="禁用原因与历史状态均按宿主事实展示。"><ReviewDemoThemes>{() => <ErrorCauseReviewSnapshot variant="disabled" />}</ReviewDemoThemes></DemoSection>
    <DemoSection title="数据未提供与保存回执" description="缺少错因不补造结论；完成文案只来自保存回执。"><ReviewDemoThemes>{() => <div className="space-y-6"><ErrorCauseReviewSnapshot variant="missing" /><ErrorCauseReviewSnapshot variant="saved" /></div>}</ReviewDemoThemes></DemoSection>
  </>
}
