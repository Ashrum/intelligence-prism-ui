"use client"

import { useRef, useState } from "react"
import { AgentFileInput, agentFileStatusLabels, type AgentFileStatus } from "../agent-file-input"
import { AgentExecutionConfirmation, type AgentConfirmationState } from "../agent-semantic-components"
import { AgentCollectionBasket } from "../agent-collection-basket"
import { BlueprintSectionHeader, BpSegTabs } from "../blueprint/blueprint"
import { Button } from "../button"
import { QuestionMath } from "../question-content"

const request = { id: "upload-request-12", label: "周测材料上传" }
const materialStates: AgentFileStatus[] = [
  { state: "selected" }, { state: "invalid", validation: "size", reason: "文件超过本机选择上限，请重新选择。" },
  { state: "queued" }, { state: "received", request }, { state: "uploading", request, progress: 42 },
  { state: "uploaded", uploadedAt: "2026-10-18 09:30" },
  { state: "failed", request, reason: "上传失败，原请求未完成。", retry: {} },
  { state: "unknown", request, reason: "上传回执未确认，请查询原请求。", query: {} }, { state: "removed" },
]
const confirmationLabels = { ready: "待确认", submitting: "提交中", received: "已接收", recorded: "已记录", blocked: "暂不可确认", unknown: "待核对" }
const confirmationDescriptions = {
  submitting: "正在提交当前范围的确认请求。", received: "原确认请求已接收，尚未取得完成回执。",
  recorded: "本次确认记录已保存，成果执行结果单独核对。", blocked: "当前版本尚未完成必要核对。", unknown: "确认回执未取得，请查询原请求。",
}

/** Controls select fixed records or emit intent; no action manufactures a receipt. */
export function AgentWorkspacePatternsDemo() {
  const [material, setMaterial] = useState("selected")
  const [confirmation, setConfirmation] = useState<AgentConfirmationState["state"]>("recorded")
  const [readOnly, setReadOnly] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [questionOpen, setQuestionOpen] = useState(false)
  const questionTrigger = useRef<HTMLButtonElement | null>(null)
  const status = materialStates.find(value => value.state === material) ?? materialStates[0]
  const confirmationFact: AgentConfirmationState = readOnly && confirmation === "ready"
    ? { state: "blocked", description: "归档记录只读，请恢复对话后重新核对资格。" }
    : confirmation === "ready" ? { state: "ready", confirm: { label: "确认这 2 份作答", onAction: () => setFeedback("已发出确认意图，等待原请求回执。") } }
      : confirmation === "unknown" ? { state: "unknown", description: confirmationDescriptions.unknown,
        query: { label: "查询原请求", disabledReason: readOnly ? "归档记录只读" : undefined, onAction: () => setFeedback("已请求查询原确认，确认状态保持待核对。") } }
        : { state: confirmation, description: confirmationDescriptions[confirmation] }
  const stem = <p>求函数 <QuestionMath label="y 等于 x 平方减二 x 加三"><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>3</mn></QuestionMath> 的最小值，并说明取值时的自变量。</p>
  return <section id="workspace-contracts" aria-label="Agent 工作区稳定交互" className="min-w-0 space-y-6">
    <BlueprintSectionHeader title="Agent 工作区稳定交互" description="材料、确认和题目版本分别呈现外部事实；操作等待对应回执。" />
    <section aria-label="材料身份与上传策略" className="min-w-0 space-y-3">
      <BpSegTabs label="材料记录状态" value={material} onValueChange={setMaterial} items={materialStates.map(value => ({ value: value.state, label: agentFileStatusLabels[value.state] }))} />
      <AgentFileInput title="本次材料" view="workspace"
        items={[{ id: "material-12", name: "source.pdf", displayName: "九年级（2）班周测原卷.pdf", version: "material_v12", versionLabel: "V12", requestName: "周测材料上传",
          type: "PDF", sizeBytes: 1048576, source: { kind: "local", label: "本机材料" }, status,
          actions: { remove: { label: "移除此引用", description: "不会取消上传或删除原件" } },
          detailsPlacement: "inline", details: <p className="text-ui-hint">页数与安全检查尚未核验，暂不能用于正式处理。</p>,
          preview: <p className="text-ui-hint">原卷第一页尚未取得预览。</p> }]}
        limits={{ selection: { accept: ".pdf,.png,.jpg", acceptLabel: "PDF、PNG、JPG", maxFileSize: 20 * 1024 * 1024, maxFiles: 4 } }}
        capabilities={{ select: { status: "supported" }, upload: { status: "unsupported", reason: "当前入口未连接上传服务。" }, drop: { status: "unsupported", reason: "请使用选择文件。" } }}
        onSelect={files => setFeedback(`已收到 ${files.length} 份本机选择；未发起上传。`)}
        onAction={intent => setFeedback(intent.kind === "query" ? "已发出原上传请求查询意图，等待回执。" : "已发出移除引用意图，等待队列更新；不会取消上传或删除原件。")} />
    </section>
    <section aria-label="确认六态" className="min-w-0 space-y-3">
      <BpSegTabs label="确认记录状态" value={confirmation} onValueChange={value => setConfirmation(value as AgentConfirmationState["state"])}
        items={Object.entries(confirmationLabels).map(([value, label]) => ({ value, label }))} />
      <Button variant="outline" size="sm" aria-pressed={readOnly} onClick={() => setReadOnly(value => !value)}>只读记录</Button>
      <AgentExecutionConfirmation title="确认本次可复核成果" target="作答 01、02" version="V2"
        effects={["保留当前修订与来源定位", "不会纳入仍未完成的作答 03、04"]}
        confirmation={confirmationFact} stateLabels={confirmationLabels} effectTense={readOnly ? "neutral" : "by-state"} />
    </section>
    <AgentCollectionBasket collection={{ id: "basket-1", title: "试题篮", type: "题目", source: "本次检索" }}
      summary={{ count: 1, unit: "题" }} sync={{ state: "local" }} itemPresentation="summary"
      items={[{ id: "question-1", title: "二次函数最值", type: "解答题", version: "question_v2", source: "本次检索", versionSummary: "题目版本 V2 · 入篮版本未锁定" }]}
      renderSummary={() => ({ content: stem })} onOpenItem={(_, trigger) => { questionTrigger.current = trigger; setQuestionOpen(true) }} />
    {questionOpen && <section aria-label="题目全文" className="space-y-2 text-read-body">{stem}<Button variant="outline" size="sm" onClick={() => { setQuestionOpen(false); questionTrigger.current?.focus() }}>关闭题目全文</Button></section>}
    {feedback && <p role="status" className="break-words text-ui-hint">{feedback}</p>}
  </section>
}
