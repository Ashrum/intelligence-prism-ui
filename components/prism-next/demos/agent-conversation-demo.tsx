"use client"
import { useId, useState } from "react"
import { Button } from "@/components/coss/button"
import { Label } from "@/components/coss/label"
import { Card } from "@/components/coss/card"
import { QuestionSelect } from "../question-controls"
import { AgentPromptBar, type AgentPromptBarProps, type AgentPromptIntent } from "../agent-prompt-bar"
import { AgentMark, agentMarkLabels, type AgentMarkState } from "../agent-mark"
import { AgentMessage, AgentMessageAttachment } from "../agent-message"
import { AgentVoiceStatus, dictationLabels, voiceModeLabels, type AgentDictation, type AgentVoiceMode } from "../agent-voice"
import { agentConversationCompositions } from "@/lib/prism-next/agent-conversation-compositions"

const sources = [{ id: "bank", label: "题库", description: "可选的题目来源" }, { id: "classes", label: "任教班级", description: "当前教师的班级范围" }, { id: "records", label: "工作记录", description: "以往任务的记录" }]
const commands = ["出题", "组卷", "批阅", "学情", "备课"].map(label => ({ id: label, label: `/${label}`, description: `提出${label}请求` }))
const models = [{ id: "astra", label: "GPT-6 Astra 轻度", description: "示例能力选项" }, { id: "teaching", label: "教学助手", description: "示例能力选项" }]
const fixtures = { sources, commands, models, modelId: "astra" }
const noService = { state: "not-connected" } as const

export function AgentPromptBarPreview() {
  const [value, setValue] = useState("")
  return <div className="space-y-3"><AgentPromptBar {...fixtures} value={value} onValueChange={setValue} onIntent={() => {}} dictation={noService} voice={noService} sendDisabledReason="任务服务未接入" /><a className="prism-link text-ui-action" href="/next/components/agent-components/prompt-bar">打开输入框与语音示例</a></div>
}
function ConversationSample() {
  return <div className="space-y-6" data-conversation-sample>
    <AgentMessage speaker="user" attachments={<AgentMessageAttachment>函数单元复习材料与课堂练习.pdf</AgentMessageAttachment>}>
      <p>请为高二三班准备一份函数单元复习练习，保留原题条件与出处，并说明每道题的解题依据。较长的中文会在气泡内自然换行。</p>
      <p>请核对公式：<math aria-label="x 等于负 b 加减根号 b 平方减四 a c，除以二 a"><mrow><mi>x</mi><mo>=</mo><mfrac><mrow><mo>−</mo><mi>b</mi><mo>±</mo><msqrt><mrow><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi></mrow></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></mrow></math></p>
      <pre><code>{'const discriminant = b ** 2 - 4 * a * c;'}</code></pre>
    </AgentMessage>
    <AgentMessage speaker="agent" details={<p className="text-ui-hint text-muted-foreground">范围：高二三班 · 材料：1 份 · 待你确认</p>}>
      <p>可以先核对范围和题目条件，再决定练习题的数量。以下是可供确认的材料摘要。</p>
      <Card className="mt-3 gap-2 p-4"><p className="text-item-title">函数单元复习材料</p><p className="text-ui-hint text-muted-foreground">此处演示业务卡片插槽，尚未读取材料。</p></Card>
    </AgentMessage>
    <AgentMessage speaker="user">保留解答过程，安排 5 道题。</AgentMessage>
    <AgentMessage speaker="agent">收到。这里展示对话排版，未执行出题任务。</AgentMessage>
  </div>
}
function MarkSamples() {
  return <div className="space-y-6"><div className="flex flex-wrap gap-6">{(["Orbit", "Drive", "Dots"] as const).map(variant => <div key={variant} className="space-y-2"><p className="text-item-title">{variant}</p><AgentMark state="thinking" variant={variant} size="loading" label="正在整理题目" /></div>)}</div>
    <div className="flex flex-wrap gap-5">{(Object.keys(agentMarkLabels) as AgentMarkState[]).map(state => <AgentMark key={state} state={state} label={agentMarkLabels[state]} />)}</div>
    <AgentMark state="working" size="loading" label="正在核对材料" startedAt={0} endedAt={65000} />
    <p className="text-ui-hint text-muted-foreground">默认前景色，Orbit 为默认动画；上方 1 分 5 秒来自固定起止时间。无开始时间不显示用时，减少动态效果时点阵和文字静止。</p>
  </div>
}
export function AgentConversationDemo({ section = "prompt-bar" }: { section?: "prompt-bar" | "agent-mark" | "agent-message" }) {
  const id = useId()
  const [theme, setTheme] = useState("light"), [width, setWidth] = useState("auto")
  const [variant, setVariant] = useState<AgentPromptBarProps["variant"]>("Rounded")
  const [value, setValue] = useState(""), [modelId, setModelId] = useState("astra")
  const [dictation, setDictation] = useState<AgentDictation["state"]>("not-connected")
  const [voice, setVoice] = useState<AgentVoiceMode["state"]>("not-connected")
  const [privacy, setPrivacy] = useState(false), [attachments, setAttachments] = useState(false)
  const [intent, setIntent] = useState("尚未操作")
  const onIntent = (next: AgentPromptIntent) => {
    setIntent(JSON.stringify(next))
    if (next.type === "select-model") setModelId(next.id)
    if (next.type === "remove-attachment") setAttachments(false)
    // A request is logged, never turned into a recognition or execution receipt.
  }
  const dictationFact: AgentDictation = { state: dictation, interim: dictation === "recognizing" ? "请为高二三班准备" : undefined, final: dictation === "inserted" ? "请为高二三班准备函数练习。" : undefined, reason: dictation === "error" ? "宿主返回：网络连接中断" : undefined }
  return <div className="space-y-6" data-agent-conversation-demo={section}>
    <nav aria-label="Agent 对话组合" className="flex flex-wrap gap-4">{agentConversationCompositions.map(item => <a key={item.slug} className="prism-link text-ui-action" href={`/next/components/agent-components/${item.slug}`} aria-current={section === item.slug ? "page" : undefined}>{item.name}</a>)}</nav>
    <p className="text-ui-hint">组件评审示例。语音状态由下方控件明确切换，未连接麦克风、识别或对话服务。</p>
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2"><Label htmlFor={`${id}-theme`}>预览主题</Label><QuestionSelect id={`${id}-theme`} label="预览主题" value={theme} onChange={setTheme} items={[{ value: "light", label: "浅色" }, { value: "paper", label: "暖纸" }, { value: "dark", label: "深色" }]} /></div>
      <div className="space-y-2"><Label htmlFor={`${id}-width`}>预览宽度</Label><QuestionSelect id={`${id}-width`} label="预览宽度" value={width} onChange={setWidth} items={[{ value: "auto", label: "自适应" }, { value: "390", label: "390 px" }]} /></div>
      {section === "prompt-bar" && <>
        <div className="space-y-2"><Label htmlFor={`${id}-variant`}>输入框变体</Label><QuestionSelect id={`${id}-variant`} label="输入框变体" value={variant!} onChange={v => setVariant(v as typeof variant)} items={[{ value: "Rounded", label: "Rounded" }, { value: "Pill", label: "Pill" }]} /></div>
        <div className="space-y-2"><Label htmlFor={`${id}-dictation`}>听写状态</Label><QuestionSelect id={`${id}-dictation`} label="听写状态" value={dictation} onChange={v => setDictation(v as typeof dictation)} items={Object.entries(dictationLabels).map(([value, label]) => ({ value, label }))} /></div>
        <div className="space-y-2"><Label htmlFor={`${id}-voice`}>语音对话状态</Label><QuestionSelect id={`${id}-voice`} label="语音对话状态" value={voice} onChange={v => setVoice(v as typeof voice)} items={Object.entries(voiceModeLabels).map(([value, label]) => ({ value, label }))} /></div>
      </>}
    </div>
    {section === "prompt-bar" && <div className="flex flex-wrap gap-2" aria-label="输入夹具">
      <Button variant="outline" size="sm" onClick={() => setValue("")}>空输入</Button><Button variant="outline" size="sm" onClick={() => setValue("请整理高二三班的函数单元复习练习，保留原题条件与出处。")}>载入草稿</Button>
      <Button variant="outline" size="sm" onClick={() => setValue("@")}>打开来源示例</Button><Button variant="outline" size="sm" onClick={() => setValue("/")}>打开命令示例</Button>
      <Button variant="outline" size="sm" aria-pressed={attachments} onClick={() => setAttachments(!attachments)}>附件夹具</Button><Button variant="outline" size="sm" aria-pressed={privacy} onClick={() => setPrivacy(!privacy)}>隐私说明夹具</Button>
    </div>}
    <div data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} data-preview-width={width} className="mx-auto min-w-0 max-w-full rounded-xl border bg-background p-4 text-foreground" style={{ width: width === "390" ? 390 : "100%" }}>
      {section === "prompt-bar" ? <AgentPromptBar {...fixtures} value={value} onValueChange={setValue} onIntent={onIntent} variant={variant} modelId={modelId} dictation={dictationFact} voice={{ state: voice }} attachments={attachments ? [{ id: "material", label: "函数单元复习材料.pdf" }] : []}
        privacy={{ open: privacy, description: "启用后，录音可能交给宿主配置的识别服务处理。请确认服务提供方及保存方式。此示例不录音。" }}
        contextActions={<><Button type="button" variant="ghost" size="sm" onClick={() => setIntent("范围入口意图")}>范围</Button><Button type="button" variant="ghost" size="sm" onClick={() => setIntent("材料入口意图")}>材料</Button><Button type="button" variant="ghost" size="sm" onClick={() => setIntent("题篮入口意图")}>题篮</Button></>} />
        : section === "agent-mark" ? <MarkSamples /> : <ConversationSample />}
    </div>
    {section === "prompt-bar" && <><p role="status" className="break-all text-ui-hint">最近意图：{intent}</p><details><summary className="cursor-pointer text-ui-action">全部语音状态样本</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{Object.keys(dictationLabels).map(state => <Card key={state} className="p-4"><AgentVoiceStatus dictation={{ state: state as AgentDictation["state"], reason: state === "error" ? "宿主报告连接中断" : undefined }} voice={noService} onIntent={onIntent} /></Card>)}{Object.keys(voiceModeLabels).map(state => <Card key={state} className="p-4"><AgentVoiceStatus dictation={noService} voice={{ state: state as AgentVoiceMode["state"] }} onIntent={onIntent} /></Card>)}<Card className="p-4"><AgentVoiceStatus dictation={{ state: "listening", level: .6 }} voice={noService} onIntent={onIntent} /></Card></div></details></>}
    <details><summary className="cursor-pointer text-ui-action">接口与验收边界</summary><div className="mt-3 space-y-2 text-ui-hint"><p>输入框：value / onValueChange、sources、commands、models / modelId、attachments、contextActions、dictation、voice、privacy、onIntent。所有执行状态均来自宿主；提交后是否清空由宿主决定。</p><p>AgentMark：state、variant、size、label、startedAt、endedAt。AgentMessage：speaker、children、attachments、details。使用反相文字背景对，业务卡片放在 Agent 内容区。</p><p>键盘检查：@ / 菜单 ↑↓、Enter、Esc；中文输入法确认不发送；Shift + Enter 换行。减少动态效果冻结点阵与扫光，WebGL 不可用时保留全部输入功能。</p><p>此处是语义组合与评审夹具，不增加 80 项基础组件或 42 项业务语义目录。Workspace 接入、真实服务、真机移动设备与读屏器另行验证。</p></div></details>
  </div>
}
