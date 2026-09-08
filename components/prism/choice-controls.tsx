"use client"

import { useId, useRef, useState } from "react"
import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function ChoiceCheckbox({ className, ...props }: ComponentProps<typeof Checkbox>) {
  return <Checkbox className={cn("prism-choice-checkbox", className)} {...props} />
}

export function ChoiceRadioItem({ className, ...props }: ComponentProps<typeof RadioGroupItem>) {
  return <RadioGroupItem className={cn("prism-choice-radio", className)} {...props} />
}

export function ChoiceSwitch({ className, ...props }: ComponentProps<typeof Switch>) {
  return <Switch className={cn("prism-choice-switch", className)} {...props} />
}

const evidenceOptions = [
  { value: "classroom", label: "课堂观察", description: "课堂中的表达、推理与参与。" },
  { value: "homework", label: "作业表现", description: "保留作答过程与教师反馈。" },
  { value: "assessment", label: "阶段测评", description: "观察同一阶段的学习变化。" },
] as const
const orderOptions = [
  { value: "pending", label: "待复核优先", description: "先查看需要教师判断的记录。" },
  { value: "recent", label: "最近更新优先", description: "按更新时间从近到远排列。" },
  { value: "student", label: "按学生顺序", description: "按姓名顺序逐一查看。" },
] as const
type Density = "comfortable" | "compact"

export function ChoiceControlsExamples() {
  const [density, setDensity] = useState<Density>("comfortable")
  return <div className="preview-stack choice-examples" data-density={density}>
    <div className="control-preview-toolbar"><span>界面密度</span><SegmentedControl label="选择控件界面密度" size="sm" value={density} onValueChange={value => setDensity(value as Density)} items={[["comfortable", "舒适"], ["compact", "紧凑"]]} /></div>
    <CheckboxExample density={density} />
    <RadioExample density={density} />
    <SwitchExample />
  </div>
}

function CheckboxExample({ density }: { density: Density }) {
  const id = useId()
  const [draft, setDraft] = useState<string[]>(["classroom"])
  const [applied, setApplied] = useState<string[]>(["classroom"])
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const masterRef = useRef<HTMLButtonElement>(null)
  const applyRef = useRef<HTMLButtonElement>(null)
  const changed = evidenceOptions.some(option => draft.includes(option.value) !== applied.includes(option.value))
  const allState = draft.length === evidenceOptions.length ? true : draft.length > 0 ? "indeterminate" : false
  const selectionState = allState === "indeterminate" ? "部分选中" : allState ? "全部选中" : "未选择"
  const summary = evidenceOptions.filter(option => applied.includes(option.value)).map(option => option.label).join("、")

  function update(values: string[]) { setDraft(values); setError(""); setFeedback("") }

  return <section id="checkbox" className="choice-example" aria-labelledby={`${id}-title`}>
    <header className="choice-heading"><span className="control-caption">Checkbox · 可多选</span><h3 id={`${id}-title`}>纳入的学习证据</h3><p>九年级 1 班 · 数学。至少选择一种，再应用到当前范围。</p></header>
    <form noValidate onSubmit={event => {
      event.preventDefault()
      if (!draft.length) { setError("请至少选择一种学习证据。"); setFeedback(""); masterRef.current?.focus(); return }
      setApplied([...draft]); setError(""); setFeedback("学习证据范围已更新。")
    }}>
      <fieldset className="choice-fieldset" aria-describedby={`${id}-help`}>
        <legend className="sr-only">学习证据类型，至少选择一种</legend>
        <div className="choice-master">
          <div className="choice-row">
            <ChoiceCheckbox ref={masterRef} id={`${id}-all`} checked={allState} aria-controls={evidenceOptions.map(option => `${id}-${option.value}`).join(" ")} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} onCheckedChange={checked => update(checked === true ? evidenceOptions.map(option => option.value) : [])} />
            <label htmlFor={`${id}-all`} className="choice-copy"><span>全选可用类型</span></label>
          </div>
          <span className="choice-count">{selectionState} · {draft.length} / {evidenceOptions.length}</span>
        </div>
        <div className="choice-list">
          {evidenceOptions.map(option => <div className="choice-row" key={option.value}>
            <ChoiceCheckbox id={`${id}-${option.value}`} name="evidence" value={option.value} checked={draft.includes(option.value)} aria-labelledby={`${id}-${option.value}-label`} aria-describedby={`${id}-${option.value}-description`} onCheckedChange={checked => update(checked === true ? [...draft, option.value] : draft.filter(value => value !== option.value))} />
            <label htmlFor={`${id}-${option.value}`} className="choice-copy"><span id={`${id}-${option.value}-label`}>{option.label}</span><small id={`${id}-${option.value}-description`}>{option.description}</small></label>
          </div>)}
          <div className="choice-row" data-disabled="true">
            <ChoiceCheckbox id={`${id}-archive`} disabled checked={false} aria-labelledby={`${id}-archive-label`} aria-describedby={`${id}-archive-description`} />
            <label htmlFor={`${id}-archive`} className="choice-copy"><span id={`${id}-archive-label`}>历史归档 <em>不可用</em></span><small id={`${id}-archive-description`}>上学期归档尚未开放，不计入全选范围。</small></label>
          </div>
        </div>
        <p id={`${id}-help`} className="choice-help" data-error={Boolean(error)} role={error ? "alert" : undefined}>{error || "全选只影响这三种可用类型。"}</p>
      </fieldset>
      <div className="selection-actions"><Button ref={applyRef} type="submit" size={density === "compact" ? "sm" : "default"}>应用范围</Button><Button type="button" variant="outline" size={density === "compact" ? "sm" : "default"} disabled={!changed && !error} onClick={() => { setDraft([...applied]); setError(""); setFeedback("已恢复上次应用的范围。"); applyRef.current?.focus() }}>撤回修改</Button></div>
    </form>
    <div className="choice-result"><span>当前范围</span><strong>{summary}</strong><p>{changed ? "修改尚未应用，当前范围保持不变。" : "与当前选择一致。"}</p></div>
    <p className="control-feedback" role="status">{feedback}</p>
  </section>
}

function RadioExample({ density }: { density: Density }) {
  const id = useId()
  const [draft, setDraft] = useState("")
  const [applied, setApplied] = useState("")
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const firstRef = useRef<HTMLButtonElement>(null)
  const applyRef = useRef<HTMLButtonElement>(null)
  const summary = orderOptions.find(option => option.value === applied)

  return <section id="radio-group" className="choice-example" aria-labelledby={`${id}-title`}>
    <header className="choice-heading"><span className="control-caption">Radio Group · 只能选一项</span><h3 id={`${id}-title`}>复核顺序</h3><p>一次查看同一组记录。选好顺序，再应用到本页。</p></header>
    <form noValidate onSubmit={event => {
      event.preventDefault()
      if (!draft) { setError("请选择一种复核顺序。"); setFeedback(""); firstRef.current?.focus(); return }
      setApplied(draft); setError(""); setFeedback("复核顺序已更新。")
    }}>
      <RadioGroup className="choice-list" name="review-order" value={draft} onValueChange={value => { setDraft(value); setError(""); setFeedback("") }} required aria-labelledby={`${id}-title`} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`}>
        {orderOptions.map((option, index) => <div className="choice-row" key={option.value}>
          <ChoiceRadioItem ref={index === 0 ? firstRef : undefined} id={`${id}-${option.value}`} value={option.value} aria-invalid={Boolean(error)} aria-labelledby={`${id}-${option.value}-label`} aria-describedby={`${id}-${option.value}-description`} />
          <label htmlFor={`${id}-${option.value}`} className="choice-copy"><span id={`${id}-${option.value}-label`}>{option.label}</span><small id={`${id}-${option.value}-description`}>{option.description}</small></label>
        </div>)}
        <div className="choice-row" data-disabled="true">
          <ChoiceRadioItem id={`${id}-cross-class`} value="cross-class" disabled aria-labelledby={`${id}-cross-class-label`} aria-describedby={`${id}-cross-class-description`} />
          <label htmlFor={`${id}-cross-class`} className="choice-copy"><span id={`${id}-cross-class-label`}>跨班级排列 <em>不可用</em></span><small id={`${id}-cross-class-description`}>当前范围只有九年级 1 班。</small></label>
        </div>
      </RadioGroup>
      <p id={`${id}-help`} className="choice-help" data-error={Boolean(error)} role={error ? "alert" : undefined}>{error || "方向键移动并选中，应用后才更新当前顺序。"}</p>
      <div className="selection-actions"><Button ref={applyRef} type="submit" size={density === "compact" ? "sm" : "default"}>应用顺序</Button><Button type="button" variant="outline" size={density === "compact" ? "sm" : "default"} disabled={draft === applied && !error} onClick={() => { setDraft(applied); setError(""); setFeedback("已撤回顺序修改。"); applyRef.current?.focus() }}>撤回修改</Button></div>
    </form>
    <div className="choice-result"><span>当前顺序</span><strong>{summary?.label || "尚未应用"}</strong><p>{draft !== applied ? "修改尚未应用，当前顺序保持不变。" : summary?.description || "选择后应用，结果会保留在本页。"}</p></div>
    <p className="control-feedback" role="status">{feedback}</p>
  </section>
}

function SwitchExample() {
  const id = useId()
  const [details, setDetails] = useState(false)
  const [readingFont, setReadingFont] = useState(true)
  const [feedback, setFeedback] = useState("")

  return <section id="switch" className="choice-example" aria-labelledby={`${id}-title`}>
    <header className="choice-heading"><span className="control-caption">Switch · 立即生效</span><h3 id={`${id}-title`}>阅读选项</h3><p>调整下方记录的阅读方式，无需应用，仅在本页生效。</p></header>
    <div className="choice-list">
      <div className="choice-row choice-row--switch">
        <label htmlFor={`${id}-details`} className="choice-copy"><span id={`${id}-details-label`}>显示详细依据</span><small id={`${id}-details-description`}>在正文下方展开完整的课堂观察。</small></label>
        <span className="choice-switch-state" aria-hidden="true">{details ? "已开启" : "已关闭"}</span>
        <ChoiceSwitch id={`${id}-details`} checked={details} aria-labelledby={`${id}-details-label`} aria-describedby={`${id}-details-description`} aria-controls={`${id}-evidence`} onCheckedChange={checked => { setDetails(checked); setFeedback(checked ? "详细依据已展开。" : "详细依据已收起，记录与来源保留。") }} />
      </div>
      <div className="choice-row choice-row--switch">
        <label htmlFor={`${id}-font`} className="choice-copy"><span id={`${id}-font-label`}>使用阅读字体</span><small id={`${id}-font-description`}>切换正文的字体，内容保持不变。</small></label>
        <span className="choice-switch-state" aria-hidden="true">{readingFont ? "已开启" : "已关闭"}</span>
        <ChoiceSwitch id={`${id}-font`} checked={readingFont} aria-labelledby={`${id}-font-label`} aria-describedby={`${id}-font-description`} onCheckedChange={checked => { setReadingFont(checked); setFeedback(checked ? "已使用阅读字体。" : "已使用界面字体。") }} />
      </div>
      <div className="choice-row choice-row--switch" data-disabled="true">
        <label htmlFor={`${id}-sync`} className="choice-copy"><span id={`${id}-sync-label`}>跨设备同步 <em>不可用</em></span><small id={`${id}-sync-description`}>本页示例未连接账户，无法同步到其他设备。</small></label>
        <span className="choice-switch-state" aria-hidden="true">已关闭</span>
        <ChoiceSwitch id={`${id}-sync`} disabled checked={false} aria-labelledby={`${id}-sync-label`} aria-describedby={`${id}-sync-description`} />
      </div>
    </div>
    <article className="choice-reading-preview" aria-labelledby={`${id}-record-title`}>
      <div className="choice-reading-identity"><h4 id={`${id}-record-title`}>分式运算复核</h4><span>课堂观察 · 九年级 1 班 · 数学</span></div>
      <div className="choice-reading-body" data-reading-font={readingFont}>
        <p>能说明通分步骤，但需要补充对分母取值的检查。</p>
        <div id={`${id}-evidence`} hidden={!details}><p>课堂记录：能独立写出公分母，并解释分子同时乘以相同因式的原因；在约分后，尚未主动说明原分母不能为零。</p></div>
      </div>
    </article>
    <p className="control-feedback" role="status">{feedback}</p>
  </section>
}
