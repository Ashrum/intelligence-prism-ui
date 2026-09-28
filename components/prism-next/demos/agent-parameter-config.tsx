"use client"

import { useRef, useState } from "react"
import { Button } from "../button"
import { AgentParameterConfig, type AgentParameterConfigProps, type AgentParameterDefinition, type AgentParameterIntent } from "../agent-parameter-config"
import { AgentConstraintBuilder } from "../agent-constraint-builder"
import { AgentExecutionConfirmation, type AgentConfirmationState } from "../agent-semantic-components"

const provided = { state: "provided" } as const
export const parameterExamples: Record<"paper" | "grading", { title: string; parameters: readonly AgentParameterDefinition[] }> = {
  paper: {
    title: "组卷参数（示例）",
    parameters: [
      { id: "count", type: "number", label: "题量", key: true, value: 24, unit: "题", min: 1, max: 20, step: 1,
        constraintSource: "范围与步长来自本次练习要求。", default: { value: 12, source: "函数单元练习模板" }, status: provided,
        validation: [{ level: "error", message: "本次练习最多安排 20 题，请核对题量。" }], impact: "题量影响练习的阅读与作答负担。" },
      { id: "duration", type: "number", label: "时长", key: true, value: 40, unit: "分钟", min: 10, max: 90, step: 5,
        default: { value: 40, source: "本节课时安排" }, status: provided, validation: [{ level: "hint", message: "请预留讲评时间。" }] },
      { id: "difficulty", type: "select", label: "难度", key: true, value: "balanced", default: { value: "balanced", source: "教师选用的练习模板" },
        options: [{ value: "basic", label: "基础巩固" }, { value: "balanced", label: "兼顾基础理解与综合运用，适合单元复习中的分层练习" }],
        status: provided, validation: [] },
      { id: "scoring", type: "radio", label: "分值方式", key: false, value: "by-question", default: { value: "by-question", source: "当前试卷设置" },
        options: [{ value: "by-question", label: "保留逐题分值" }, { value: "equal", label: "各题等分" }], status: provided, validation: [] },
      { id: "answers", type: "switch", label: "附参考答案", key: false, value: true, default: { value: false, source: "学生练习版模板" }, status: provided, validation: [] },
      { id: "title", type: "text-short", label: "卷名", key: false, value: "函数单元复习：结合图像说明变化规律，并保留必要的推理过程与单位", status: provided, validation: [] },
    ],
  },
  grading: {
    title: "批阅参数（示例）",
    parameters: [
      { id: "paper-size", type: "select", label: "纸张", key: true, value: "a4", default: { value: "a4", source: "当前纸质批阅任务" },
        options: [{ value: "a4", label: "A4" }, { value: "a3", label: "A3" }, { value: "custom", label: "自定义纸张", disabledReason: "当前样例不支持自定义尺寸。" }],
        status: provided, validation: [{ level: "warning", message: "请核对纸张设置与原卷是否一致。" }] },
      { id: "identity", type: "radio", label: "身份方式", key: true, value: "student-number", default: { value: "student-number", source: "答题卡模板" },
        options: [{ value: "student-number", label: "学号匹配" }, { value: "name", label: "姓名匹配" }], status: provided, validation: [],
        lockedReason: "本批答题卡已按学号印制，身份方式暂不可修改。" },
      { id: "expected", type: "number", label: "预期人数", key: true, value: null, unit: "人", min: 1, max: 60, step: 1,
        status: { state: "unconfirmed", reason: "最新班级名单尚未核对，请确认预期人数。" }, validation: [], impact: "预期人数用于核对接收情况，不代表已收到答卷。" },
      { id: "annotation", type: "switch", label: "保留批注", key: false, value: true, status: provided, validation: [] },
      { id: "group-name", type: "text-short", label: "批次名称", key: false, value: null,
        status: { state: "unknown", reason: "暂未取得该批次名称。" }, validation: [] },
    ],
  },
}

/** Explicit fixture loading, not validation or a business default inside the component. */
export function availableParameterExample(purpose: keyof typeof parameterExamples): readonly AgentParameterDefinition[] {
  return parameterExamples[purpose].parameters.map(parameter => ({ ...parameter,
    value: parameter.id === "count" ? 12 : parameter.id === "expected" ? 36 : parameter.id === "group-name" ? "函数练习批阅" : parameter.value,
    status: provided, validation: [],
  }) as AgentParameterDefinition)
}

export function ParameterConfigExample({ purpose, narrow }: { purpose: keyof typeof parameterExamples; narrow: boolean }) {
  const example = parameterExamples[purpose]
  const [parameters, setParameters] = useState(example.parameters), [revision, setRevision] = useState(1)
  const [snapshot, setSnapshot] = useState<{ parameters: readonly AgentParameterDefinition[]; baseVersion: string; versionLabel: string; constraint: boolean }>()
  const [readOnly, setReadOnly] = useState(false), [constraint, setConstraint] = useState(true)
  const [resetRequested, setResetRequested] = useState(false), [requestedVersion, setRequestedVersion] = useState<string>()
  const [feedback, setFeedback] = useState("尚未确认；此处只演示参数配置。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const currentVersion = `example-${purpose}-${revision}`
  const baseVersion = snapshot?.baseVersion ?? currentVersion
  const currentParameters = snapshot?.parameters ?? parameters
  const onIntent = (intent: AgentParameterIntent) => {
    if (snapshot || readOnly || intent.baseVersion !== currentVersion) return
    if (intent.type === "reset") { setResetRequested(true); setFeedback("已请求恢复默认，当前参数尚未替换。"); return }
    setParameters(items => items.map(parameter => parameter.id === intent.parameterId ? { ...parameter, value: intent.value } as AgentParameterDefinition : parameter))
    setRevision(value => value + 1); setRequestedVersion(undefined); setResetRequested(false)
    setFeedback("参数已调整（示例），校验与确认结果尚未更新。")
  }
  const common: AgentParameterConfigProps = {
    title: example.title, baseVersion, parameters: currentParameters, onIntent,
    frozen: snapshot ? { versionLabel: snapshot.versionLabel, reason: "本次参数已确认，当前显示确认时的值。" } : undefined,
    readOnlyReason: readOnly ? "当前以只读方式查看参数。" : undefined,
    reset: {},
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    details: <p>展开与返回使用同一份参数。输入不会自动清除示例校验；可分别载入已核对参数和确认记录。刷新后还原。</p>,
  }
  const needsCheck = parameters.some(parameter => parameter.status.state !== "provided" || parameter.validation.some(result => result.level === "error"))
  const confirmation: AgentConfirmationState = snapshot ? { state: "recorded", description: "已载入示例确认记录，尚未执行任务。" }
    : requestedVersion === currentVersion ? { state: "unknown", description: "确认结果未收到，当前参数仍未确认。" }
    : needsCheck || readOnly ? { state: "blocked", description: readOnly ? "当前只读，请返回可编辑状态后核对。" : "请核对错误与未确认参数。" }
    : { state: "ready", confirm: { label: "确认本次要求（示例）", onAction: () => { setRequestedVersion(currentVersion); setFeedback("已请求确认，等待示例确认记录。") } } }
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例，三个视图共用一份参数；不连接组卷、OCR 或批阅服务。</p>
    <div className="flex min-w-0 flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={!!snapshot || readOnly} onClick={() => {
        setParameters(availableParameterExample(purpose)); setRevision(value => value + 1); setRequestedVersion(undefined); setResetRequested(false)
        setFeedback("已载入可用参数示例，请核对本次要求。")
      }}>载入可用参数示例</Button>
      <Button type="button" variant="outline" disabled={requestedVersion !== currentVersion || !!snapshot || readOnly} onClick={() => {
        if (requestedVersion !== currentVersion || snapshot || readOnly) return
        setSnapshot({ parameters, baseVersion: currentVersion, versionLabel: `参数 v${revision}`, constraint }); setFeedback("已载入确认记录；显示确认时的参数。")
      }}>载入示例确认记录</Button>
      <Button type="button" variant="outline" onClick={() => {
        setSnapshot({ parameters: availableParameterExample(purpose), baseVersion: `fixed-${purpose}`, versionLabel: "固定示例版", constraint: true })
        setFeedback("正在查看固定冻结示例；当前草稿仍保留。")
      }}>查看固定冻结示例</Button>
      <Button type="button" variant="outline" disabled={!snapshot} onClick={() => { setSnapshot(undefined); setFeedback("已返回当前参数草稿；确认状态以本次要求为准。") }}>返回当前参数</Button>
      <Button type="button" variant="outline" aria-pressed={readOnly} onClick={() => setReadOnly(value => !value)}>只读查看示例</Button>
      <Button type="button" variant="outline" disabled={!resetRequested || !!snapshot || readOnly} onClick={() => {
        if (!resetRequested || snapshot || readOnly) return
        setParameters(items => items.map(parameter => parameter.default ? { ...parameter, value: parameter.default.value } as AgentParameterDefinition : parameter))
        setRevision(value => value + 1); setRequestedVersion(undefined); setResetRequested(false); setFeedback("已载入默认参数示例，请重新核对。")
      }}>载入默认参数示例</Button>
    </div>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    <p className="text-ui-hint">示例内容：函数 <math className="prism-math" aria-label="y 等于二分之一 x 的平方"><mi>y</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><msup><mi>x</mi><mn>2</mn></msup></math> 的图像与性质。</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "关键参数"], ["workspace", "default", "完整参数集"], ["inline", "compact", "参数与约束共同确认"],
    ] as const).map(([view, density, label]) => <section key={`${view}-${density}`} aria-label={label} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      {density === "compact" ? <AgentExecutionConfirmation title={purpose === "paper" ? "确认出卷要求（示例）" : "确认批阅要求（示例）"}
        target={purpose === "paper" ? "函数单元练习" : "函数练习答题卡"} version={snapshot?.versionLabel ?? `参数 v${revision}`} confirmation={confirmation}
        effects={[purpose === "paper" ? "按本次参数与约束准备候选试题。" : "按本次纸张和身份设置准备接收答卷。"]}
        conditions={<div className="min-w-0 space-y-5">
          <AgentParameterConfig {...common} density="compact" presentation="inline" notice={null} />
          <AgentConstraintBuilder title="处理约束" basis={{ objectId: `example-${purpose}`, version: baseVersion }} density="compact" presentation="inline"
            groups={[{ id: "rules", label: "处理规则", items: [{ id: "retain-source", type: "required", label: "必须保留来源", critical: true,
              value: snapshot?.constraint ?? constraint, defaultValue: true, validation: { state: "valid" } }] }]}
            reconfirmation={{ required: false }} disabledReason={snapshot || readOnly ? "当前处理约束仅供查看。" : undefined}
            onValueChange={change => { if (snapshot || readOnly || change.version !== currentVersion || change.type !== "required") return; setConstraint(change.value); setRevision(value => value + 1); setRequestedVersion(undefined); setResetRequested(false); setFeedback("处理约束已调整（示例），请重新核对本次要求。") }} />
          <p className="text-ui-hint text-muted-foreground">参数与约束共同确认，修改不代表已确认或执行。</p>
        </div>} /> : <AgentParameterConfig {...common} view={view} density={density} />}
    </section>)}</div>
  </div>
}

export function AgentParameterConfigDemo() {
  const [purpose, setPurpose] = useState<keyof typeof parameterExamples>("paper"), [narrow, setNarrow] = useState(false)
  return <section id="parameter-config" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">参数配置器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["paper", "grading"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"}
      aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "paper" ? "组卷参数示例" : "批阅参数示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <ParameterConfigExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
