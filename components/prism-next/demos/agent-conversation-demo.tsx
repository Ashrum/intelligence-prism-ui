"use client"
import { Kbd, KbdGroup } from "@/components/coss/kbd"
import { Field, FieldLabel } from "@/components/coss/field"
import { useId, useState } from "react"
import { Button } from "@/components/coss/button"
import { MenuItem } from "@/components/coss/menu"
import { Card } from "@/components/coss/card"
import { QuestionSelect } from "../question-controls"
import { AgentPromptBar, type AgentPromptBarProps, type AgentPromptIntent } from "../agent-prompt-bar"
import { AgentMark, agentMarkLabels, type AgentMarkState } from "../agent-mark"
import { AgentMessage, AgentMessageAttachment } from "../agent-message"
import { AgentVoiceStatus, dictationLabels, voiceModeLabels, type AgentDictation, type AgentVoiceMode } from "../agent-voice"
import { agentConversationCompositions } from "@/lib/prism-next/agent-conversation-compositions"
import { themeOptions } from "@/lib/prism-next/config"

const sources = [{ id: "bank", label: "题库", description: "可选的题目来源" }, { id: "classes", label: "任教班级", description: "当前教师的班级范围" }, { id: "records", label: "工作记录", description: "以往任务的记录" }]
const commands = ["出题", "组卷", "批阅", "学情", "备课"].map(label => ({ id: label, label: `/${label}`, description: `提出${label}请求` }))
const models = [{ id: "local-rule", label: "本机规则", description: "示例能力选项" }]
const fixtures = { sources, commands, models, modelId: "local-rule" }
const noService = { state: "not-connected" } as const

export function AgentPromptBarPreview() {
  const [value, setValue] = useState("")
  return <div className="space-y-3"><AgentPromptBar {...fixtures} value={value} onValueChange={setValue} onIntent={() => {}} dictation={noService} voice={noService} sendDisabledReason="任务服务未接入" /><a className="prism-link text-ui-action" href="/next/components/agent-components/prompt-bar">打开输入框与语音示例</a></div>
}
function ConversationSample() {
  const sourceId = useId()
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle")
  const [action, setAction] = useState("尚未操作")
  const sampleText = "可以先核对范围和题目条件，再决定练习题的数量。"
  const copy = async () => {
    try { await navigator.clipboard.writeText(sampleText); setCopyState("copied") }
    catch { setCopyState("error") }
  }
  return <div className="space-y-6" data-conversation-sample>
    <AgentMessage speaker="user" bodyRole="read-body" attachments={<AgentMessageAttachment>函数单元复习材料与课堂练习.pdf</AgentMessageAttachment>}>
      <p>请为高二三班准备一份函数单元复习练习，保留原题条件与出处，并说明每道题的解题依据。较长的中文会在气泡内自然换行。</p>
      <p>请核对公式：<math aria-label="x 等于负 b 加减根号 b 平方减四 a c，除以二 a"><mrow><mi>x</mi><mo>=</mo><mfrac><mrow><mo>−</mo><mi>b</mi><mo>±</mo><msqrt><mrow><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi></mrow></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></mrow></math></p>
      <pre><code>{'const discriminant = b ** 2 - 4 * a * c;'}</code></pre>
      <p><a href={`#${sourceId}`}>查看材料说明</a></p>
    </AgentMessage>
    <AgentMessage speaker="agent" bodyRole="read-body" timestamp={{ dateTime: "2026-10-20T15:59:30+08:00", now: "2026-10-20T16:00:00+08:00" }} copyAction={{ state: copyState, onCopy: copy }}
      moreActions={<MenuItem onClick={() => setAction("已选择查看回答详情（示例）")}>查看回答详情</MenuItem>}
      details={<p className="text-ui-hint text-muted-foreground">范围：高二三班 · 材料：1 份 · 待你确认</p>}>
      <p>可以先核对范围和题目条件，再决定练习题的数量。以下是可供确认的材料摘要。</p>
      <Card className="mt-3 gap-2 p-4"><p className="text-item-title">函数单元复习材料</p><p className="text-ui-hint text-muted-foreground">此处演示业务卡片插槽，尚未读取材料。</p></Card>
    </AgentMessage>
    <AgentMessage speaker="user" bodyRole="read-body">保留解答过程，安排 5 道题。</AgentMessage>
    <AgentMessage speaker="agent" bodyRole="read-body" isLast actions={<Button type="button" variant="ghost" size="sm" onClick={() => setAction("已选择打开材料摘要（示例）")}>打开材料摘要</Button>}
      persistentActions={<Button type="button" variant="outline" size="sm" onClick={() => setAction("已选择核对原请求（示例）")}>核对原请求</Button>}
      moreActions={<MenuItem onClick={() => setAction("已选择查看最后一条详情（示例）")}>查看详情</MenuItem>}>收到。这里展示对话排版，未执行出题任务。</AgentMessage>
    <p role="status" className="text-ui-hint">消息操作：{action}</p>
    <p className="text-ui-hint">上方历史回答的复制与更多入口在桌面悬停或键盘入焦时显示，触屏常驻；最后一条操作及“核对原请求”始终可见。复制成功后显示“已复制”；系统不允许复制时显示失败。</p>
    <p id={sourceId} className="text-ui-hint text-muted-foreground">材料说明：本页使用固定中文与公式夹具，链接不提交任务。</p>
  </div>
}
function MarkSamples() {
  return <div className="space-y-6"><div className="flex flex-wrap gap-6">{(["Drive", "Orbit", "Dots"] as const).map(variant => <div key={variant} className="space-y-2"><p className="text-item-title">{variant}</p><AgentMark state="thinking" variant={variant} size="loading" label="正在整理题目" /></div>)}</div>
    <div className="flex flex-wrap gap-5">{(Object.keys(agentMarkLabels) as AgentMarkState[]).map(state => <AgentMark key={state} state={state} label={agentMarkLabels[state]} />)}</div>
    <div className="space-y-2">
      <p className="text-item-title">列表行首状态位 · glyph</p>
      {(["Drive", "Orbit", "Dots"] as const).map(variant => <div key={variant} className="space-y-2">{(Object.keys(agentMarkLabels) as AgentMarkState[]).map(state => <div key={state} className="flex items-center gap-2"><AgentMark size="glyph" state={state} variant={variant} startedAt={0} /><span className="text-ui-body">{variant} · {agentMarkLabels[state]}</span></div>)}</div>)}
      <p className="text-ui-hint text-muted-foreground">固定 16px 状态位内为 13px 点阵；图形提供可访问名称，不播报状态变化、不显示耗时。</p>
    </div>
    <AgentMark state="working" size="loading" label="正在核对材料" startedAt={0} endedAt={65000} />
    <p className="text-ui-hint text-muted-foreground">默认前景色，Drive 为默认动画，Orbit / Dots 为可选变体；上方 1 分 5 秒来自固定起止时间。无开始时间不显示用时，减少动态效果时点阵和文字静止。</p>
  </div>
}
export function AgentConversationDemo({ section = "prompt-bar" }: { section?: "prompt-bar" | "agent-mark" | "agent-message" }) {
  const id = useId()
  const [theme, setTheme] = useState("light"), [width, setWidth] = useState("auto")
  const [variant, setVariant] = useState<AgentPromptBarProps["variant"]>("Rounded")
  const [value, setValue] = useState(""), [modelId, setModelId] = useState("local-rule")
  const [compact, setCompact] = useState(false), [expandable, setExpandable] = useState(false)
  const [primaryAction, setPrimaryAction] = useState<AgentPromptBarProps["primaryAction"]>()
  const [statusHint, setStatusHint] = useState(false), [minimalTools, setMinimalTools] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(true)
  const [blocked, setBlocked] = useState(false), [announceDisabledReason, setAnnounceDisabledReason] = useState(true)
  const [dictation, setDictation] = useState<AgentDictation["state"]>("not-connected")
  const [voice, setVoice] = useState<AgentVoiceMode["state"]>("not-connected")
  const [privacy, setPrivacy] = useState(false), [attachments, setAttachments] = useState(false)
  const [intent, setIntent] = useState("尚未操作")
  const [startedAt, setStartedAt] = useState<number>()
  const [level, setLevel] = useState<number>()
  const onIntent = (next: AgentPromptIntent) => {
    setIntent(JSON.stringify(next))
    if (next.type === "select-model") setModelId(next.id)
    if (next.type === "remove-attachment") setAttachments(false)
    // A request is logged, never turned into a recognition or execution receipt.
  }
  const dictationFact: AgentDictation = { state: dictation, startedAt, level, interim: dictation === "recognizing" ? "请为高二三班准备" : undefined, final: dictation === "inserted" ? "请为高二三班准备函数练习。" : undefined, reason: dictation === "error" ? "宿主返回：网络连接中断" : undefined }
  return <div className="space-y-6" data-agent-conversation-demo={section}>
    <nav aria-label="Agent 对话组合" className="flex flex-wrap gap-4">{agentConversationCompositions.map(item => <a key={item.slug} className="prism-link text-ui-action" href={`/next/components/agent-components/${item.slug}`} aria-current={section === item.slug ? "page" : undefined}>{item.name}</a>)}</nav>
    <p className="text-ui-hint">组件评审示例。语音状态由下方控件明确切换，未连接麦克风、识别或对话服务。</p>
    {section === "prompt-bar" && <p className="text-ui-hint text-muted-foreground">听写中点击状态、麦克风或按 <Kbd>Esc</Kbd> 仅发停止请求；用时依据宿主 startedAt，无开始时间不计时。interim 在输入框内以次要色预览，最终结果由宿主更新 value。电平未知时均衡条仅提示活动，减少动效时固定为三条中等高度，占位微光停止。</p>}
    <div className="flex flex-wrap items-end gap-4">
      <Field><FieldLabel htmlFor={`${id}-theme`}>预览主题</FieldLabel><QuestionSelect id={`${id}-theme`} label="预览主题" value={theme} onChange={setTheme} items={[...themeOptions]} /></Field>
      <Field><FieldLabel htmlFor={`${id}-width`}>预览宽度</FieldLabel><QuestionSelect id={`${id}-width`} label="预览宽度" value={width} onChange={setWidth} items={[{ value: "auto", label: "自适应" }, { value: "320", label: "320 px" }, { value: "390", label: "390 px" }]} /></Field>
      {section === "prompt-bar" && <>
        <Field><FieldLabel htmlFor={`${id}-variant`}>输入框变体</FieldLabel><QuestionSelect id={`${id}-variant`} label="输入框变体" value={variant!} onChange={v => setVariant(v as typeof variant)} items={[{ value: "Rounded", label: "Rounded" }, { value: "Pill", label: "Pill" }]} /></Field>
        <Field><FieldLabel htmlFor={`${id}-dictation`}>听写状态</FieldLabel><QuestionSelect id={`${id}-dictation`} label="听写状态" value={dictation} onChange={v => { setDictation(v as typeof dictation); if (v === "inserted") setValue("请为高二三班准备函数练习。"); }} items={Object.entries(dictationLabels).map(([value, label]) => ({ value, label }))} /></Field>
        <Field><FieldLabel htmlFor={`${id}-voice`}>语音对话状态</FieldLabel><QuestionSelect id={`${id}-voice`} label="语音对话状态" value={voice} onChange={v => setVoice(v as typeof voice)} items={Object.entries(voiceModeLabels).map(([value, label]) => ({ value, label }))} /></Field>
      </>}
    </div>
    {section === "prompt-bar" && <div className="flex flex-wrap gap-2" aria-label="输入夹具">
      <Button variant="outline" size="sm" onClick={() => { setCompact(true); setExpandable(true); setPrimaryAction("send"); setValue(""); setMinimalTools(true); setShowModelSelector(false); setBlocked(false); setStatusHint(false); setAttachments(false); setDictation("not-connected"); setVoice("not-connected"); setPrivacy(false) }}>P92 紧凑空态</Button>
      <Button variant="outline" size="sm" aria-pressed={compact} onClick={() => setCompact(!compact)}>紧凑密度：{compact ? "开启" : "关闭"}</Button>
      <Button variant="outline" size="sm" aria-pressed={expandable} onClick={() => setExpandable(!expandable)}>展开编辑：{expandable ? "开启" : "关闭"}</Button>
      <Button variant="outline" size="sm" onClick={() => { setCompact(true); setExpandable(true); setValue(Array.from({ length: 12 }, (_, i) => `${i + 1}. 请核对二次函数 f(x) = ax² + bx + c，保留原题条件、完整推导过程与材料出处。`).join("\n")) }}>P92 超长草稿</Button>
      <Button variant="outline" size="sm" onClick={() => setPrimaryAction("send")}>发送夹具</Button>
      <Button variant="outline" size="sm" onClick={() => setPrimaryAction("stop")}>停止夹具</Button>
      <Button variant="outline" size="sm" onClick={() => setPrimaryAction("stopping")}>正在请求停止夹具</Button>
      <Button variant="outline" size="sm" aria-pressed={statusHint} onClick={() => setStatusHint(!statusHint)}>单条状态提示</Button>
      <Button variant="outline" size="sm" onClick={() => { setCompact(false); setExpandable(false); setPrimaryAction(undefined); setStatusHint(false); setMinimalTools(false) }}>还原默认 API</Button>
      <Button variant="outline" size="sm" onClick={() => setValue("")}>空输入</Button><Button variant="outline" size="sm" onClick={() => setValue("请整理高二三班的函数单元复习练习，保留原题条件与出处。")}>载入草稿</Button>
      <Button variant="outline" size="sm" onClick={() => setValue("@")}>打开来源示例</Button><Button variant="outline" size="sm" onClick={() => setValue("/")}>打开命令示例</Button>
      <Button variant="outline" size="sm" onClick={() => setStartedAt(Date.now() - 5000)}>传入开始时间（5 秒前）</Button><Button variant="outline" size="sm" onClick={() => setStartedAt(undefined)}>清除开始时间</Button>
      <Button variant="outline" size="sm" onClick={() => setLevel(level === undefined ? .25 : level === .25 ? .85 : undefined)}>电平：{level === undefined ? "未知" : level === .25 ? "低" : "高"}</Button>
      <Button variant="outline" size="sm" onClick={() => setValue("请核对二次函数 f(x) = ax² + bx + c 的判别式 Δ = b² − 4ac，并为高二三班整理一份保留原题条件、完整推导过程与材料出处的函数单元复习练习。")}>长中文与公式草稿</Button>
      <Button variant="outline" size="sm" aria-pressed={attachments} onClick={() => setAttachments(!attachments)}>附件夹具</Button><Button variant="outline" size="sm" aria-pressed={privacy} onClick={() => setPrivacy(!privacy)}>隐私说明夹具</Button>
      <Button variant="outline" size="sm" aria-pressed={blocked} onClick={() => setBlocked(!blocked)}>禁用原因夹具：{blocked ? "有" : "无"}</Button>
      <Button variant="outline" size="sm" aria-pressed={announceDisabledReason} onClick={() => setAnnounceDisabledReason(!announceDisabledReason)}>原因播报：{announceDisabledReason ? "开启" : "关闭（宿主已提示）"}</Button>
      <Button variant="outline" size="sm" aria-pressed={showModelSelector} onClick={() => setShowModelSelector(!showModelSelector)}>模型入口：{showModelSelector ? "显示" : "隐藏"}</Button>
    </div>}
    <div data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} data-preview-width={width} className="mx-auto min-w-0 max-w-full rounded-xl border bg-background p-4 text-foreground" style={{ width: width === "auto" ? "100%" : Number(width) }}>
      {section === "prompt-bar" ? <AgentPromptBar {...fixtures} value={value} onValueChange={setValue} onIntent={onIntent} variant={variant}
        density={compact ? "compact" : undefined} expandable={expandable} primaryAction={primaryAction}
        statusHint={statusHint ? { message: "连接中断，请核对这次请求", tone: "error", action: { label: "核对原请求", onClick: () => setIntent("核对原请求意图（示例）") }, details: "当前服务状态由此夹具提供，草稿仍可编辑。未连接真实任务服务，不自动发送或重试。" } : undefined} modelId={modelId} showModelSelector={showModelSelector} sendDisabledReason={blocked ? "暂时无法连接服务，草稿仍可编辑；连接恢复后可提交。" : undefined} announceDisabledReason={announceDisabledReason} dictation={dictationFact} voice={{ state: voice }} attachments={attachments ? [{ id: "material", label: "函数单元复习材料.pdf" }] : []}
        privacy={{ open: privacy, description: "启用后，录音可能交给宿主配置的识别服务处理。请确认服务提供方及保存方式。此示例不录音。" }}
        contextActions={minimalTools ? undefined : <><Button type="button" variant="ghost" size="sm" onClick={() => setIntent("范围入口意图")}>范围</Button><Button type="button" variant="ghost" size="sm" onClick={() => setIntent("材料入口意图")}>材料</Button><Button type="button" variant="ghost" size="sm" onClick={() => setIntent("题篮入口意图")}>题篮</Button></>} />
        : section === "agent-mark" ? <MarkSamples /> : <ConversationSample />}
    </div>
    {section === "prompt-bar" && <><p role="status" className="break-all text-ui-hint">最近意图：{intent}</p><p className="text-ui-hint">P92 停止/正在请求停止由夹具按钮分别传入；点击输入器停止仅记录意图，不伪造服务回执。再次测试停止时先切发送夹具，再切停止夹具。展开编辑只改变当前编辑区高度，发送仍需明确操作。</p><details><summary className="cursor-pointer text-ui-action">全部语音状态样本</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{Object.keys(dictationLabels).map(state => <Card key={state} className="p-4"><AgentVoiceStatus dictation={{ state: state as AgentDictation["state"], reason: state === "error" ? "宿主报告连接中断" : undefined }} voice={noService} onIntent={onIntent} /></Card>)}{Object.keys(voiceModeLabels).map(state => <Card key={state} className="p-4"><AgentVoiceStatus dictation={noService} voice={{ state: state as AgentVoiceMode["state"] }} onIntent={onIntent} /></Card>)}<Card className="p-4"><AgentVoiceStatus dictation={{ state: "listening", level: .6 }} voice={noService} onIntent={onIntent} /></Card></div></details></>}
    <details><summary className="cursor-pointer text-ui-action">接口与验收边界</summary><div className="mt-3 space-y-2 text-ui-hint"><p>输入框：value / onValueChange、sources、commands、models / modelId、showModelSelector、attachments、contextActions、dictation、voice、privacy、onIntent。showModelSelector 默认 true，false 时不渲染模型入口；学校是否开放由宿主提供。所有执行状态均来自宿主；提交后是否清空由宿主决定。消息标签仅供读屏；语音不可用原因由按钮描述提供，点击后临时弹出，失败与权限拒绝仍明确显示。</p><p>AgentMark：state、variant、size、label、startedAt、endedAt。AgentMessage：speaker、children、attachments、details；P92 可选 bodyRole、actions、moreActions、persistentActions、isLast、actionsVisibility、copyAction。教师消息在蓝图与夜图使用轻背景，核心三主题保留反相文字背景对；业务卡片放在 Agent 内容区。</p><p>键盘检查：<KbdGroup><Kbd>@</Kbd><Kbd>↑↓</Kbd><Kbd>Enter</Kbd><Kbd>Esc</Kbd></KbdGroup>；中文输入法确认不发送；<KbdGroup><Kbd>Shift</Kbd><Kbd>Enter</Kbd></KbdGroup> 换行。减少动态效果冻结点阵与扫光，WebGL 不可用时保留全部输入功能。</p><p>此处是语义组合与评审夹具，不增加 80 项基础组件或 42 项业务语义目录。Workspace 接入、真实服务、真机移动设备与读屏器另行验证。</p></div></details>
  </div>
}
