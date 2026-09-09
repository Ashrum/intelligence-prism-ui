"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { RefreshCw, Sparkles } from "lucide-react"

import { StateLabel } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardWorkbench } from "@/components/prism/card-patterns"
import { ClassroomObservationForm } from "@/components/prism/classroom-observation-form"
import { EvidencePerspective, LabelsExamples, LearningAnalysisExample } from "@/components/prism/control-examples"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { TabsExamples, TabsUsageNotes } from "@/components/prism/tabs-examples"
import { SelectExamples } from "@/components/prism/select-examples"
import { DialogExamples } from "@/components/prism/dialog-examples"
import { ChoiceControlsExamples } from "@/components/prism/choice-controls"
import { componentDocuments, componentDocumentStatus, statusLabels, type ComponentDocumentSlug } from "@/components/prism/catalog"

export function ComponentDoc({ slug }: { slug: ComponentDocumentSlug }) {
  const doc = componentDocuments[slug]
  const status = componentDocumentStatus(slug)
  return (
    <article className="component-article">
      <header className="component-hero">
        <div className="component-title-row">
          <h1>{doc.title}</h1>
          <StateLabel tone={status === "stable" ? "completed" : "pending"}>{statusLabels[status]}</StateLabel>
        </div>
        <p>{doc.description}</p>
      </header>

      <section className="doc-section" aria-labelledby="preview-title">
        <h2 id="preview-title" className="sr-only">{doc.title} 示例</h2>
        <div className="component-preview">
          <ComponentPreview slug={slug} />
        </div>
      </section>

      <details className="doc-guidance">
        <summary>使用与无障碍说明</summary>
        <div className="doc-notes-grid">
        <div className="doc-note">
          <h2>{slug === "input-field" ? "组成与职责" : "使用规则"}</h2>
          <p>{doc.guidance}</p>
          {slug === "input-field" && <p>浮动标签保留字段身份；错误时标签、边框、光标与图标联动。舒适 56px／紧凑 48px，输入字号 16px；长内容自然增高。</p>}
        </div>
        <div className="doc-note">
          <h2>{slug === "input-field" ? "语义与操作保障" : "无障碍与交互"}</h2>
          <p>{doc.accessibility}</p>
        </div>
        {slug === "tabs" && <TabsUsageNotes />}
        {slug === "input-field" && <div className="field-behavior-note">
          <h2>此场景的处理规则</h2>
          <table className="field-behavior-table"><thead><tr><th scope="col">时刻</th><th scope="col">处理与保留</th></tr></thead><tbody>
            <tr><th scope="row">开始输入</th><td>未访问的字段不提前报错。标签持续标识字段，单位和约束保持就近。</td></tr>
            <tr><th scope="row">离开字段或应用</th><td>按字段约束校验；错误在原位置替换帮助，保留已填内容。应用失败时聚焦首个错误。</td></tr>
            <tr><th scope="row">修正内容</th><td>已访问字段的反馈随修改更新。中文输入法确认期间不提交，Enter 仍可用于多行换行。</td></tr>
            <tr><th scope="row">应用成功</th><td>更新本页结果，输入与结果采用同一确认值。字段合法与记录已应用分别表达。</td></tr>
            <tr><th scope="row">继续修改</th><td>保留上次已应用记录，标明修改尚未应用；可撤回修改。重新应用才更新结果，重置示例才清空记录。</td></tr>
          </tbody></table>
        </div>}
        </div>
      </details>
    </article>
  )
}

function ComponentPreview({ slug }: { slug: ComponentDocumentSlug }) {
  if (slug === "button") {
    return <ButtonPreview />
  }

  if (slug === "tabs") return <TabsExamples />
  if (slug === "segmented-control") return <SegmentedPreview />

  if (slug === "card") return <CardWorkbench showDensityControl />

  if (slug === "input-field") return <ClassroomObservationForm />
  if (slug === "select") return <SelectExamples />
  if (slug === "dialog") return <DialogExamples />
  if (slug === "choice-controls") return <ChoiceControlsExamples />

  return <div className="preview-stack"><LabelsExamples /><LearningAnalysisExample /></div>
}

type ControlDensity = "comfortable" | "compact"

function DensitySelector({ value, onChange }: { value: ControlDensity; onChange: (value: ControlDensity) => void }) {
  return <div className="control-preview-toolbar"><span>界面密度</span><SegmentedControl label="界面密度" size="sm" value={value} onValueChange={(value) => onChange(value as ControlDensity)} items={[["comfortable", "舒适 · 36px"], ["compact", "紧凑 · 32px"]]} /></div>
}

function SegmentedPreview() {
  const [density, setDensity] = useState<ControlDensity>("comfortable")
  return (
    <div className="preview-stack component-control-preview" data-density={density}>
      <DensitySelector value={density} onChange={setDensity} />
      <EvidencePerspective />
      <div className="control-boundary">
        <span className="control-caption">长标签、数量与禁用项 · 304px 容器</span>
        <div className="control-narrow">
          <SegmentedControl label="证据组织方式" defaultValue="learner" items={[
            { value: "learner", label: "按学生成长证据组织", count: 36 },
            { value: "knowledge", label: "按题目与知识点组织", count: 128 },
            { value: "class", label: "班级视角", disabled: true },
          ]} />
        </div>
      </div>
    </div>
  )
}

const buttonExamples = [
  { variant: "default", label: "保存设置" },
  { variant: "secondary", label: "暂存草稿" },
  { variant: "outline", label: "导出记录" },
  { variant: "ghost", label: "取消" },
  { variant: "ai-soft", label: "AI 建议" },
  { variant: "ai-primary", label: "智能分析" },
  { variant: "destructive", label: "删除任务" },
] as const

function ButtonPreview() {
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [pressStatus, setPressStatus] = useState("尚未按下按钮。")
  const [submitCount, setSubmitCount] = useState(0)
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkCounts, setLinkCounts] = useState({ child: 0, button: 0 })
  const [linkTag, setLinkTag] = useState("未挂载")
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const activationCounts = useRef(new Map<string, number>())
  const captureLinkRef = useCallback((node: HTMLButtonElement | null) => {
    setLinkTag(node?.tagName ?? "未挂载")
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
    }
  }, [])

  function run(id: string, label: string) {
    if (timers.current.has(id)) return
    const count = (activationCounts.current.get(id) ?? 0) + 1
    activationCounts.current.set(id, count)
    setRunning((previous) => ({ ...previous, [id]: true }))
    setStatuses((previous) => ({ ...previous, [id]: `${label}：正在处理；处理函数调用 ${count} 次。` }))
    timers.current.set(id, setTimeout(() => {
      timers.current.delete(id)
      setRunning((previous) => ({ ...previous, [id]: false }))
      setStatuses((previous) => ({ ...previous, [id]: `${label}：处理完成；处理函数共调用 ${count} 次。` }))
    }, 1800))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitCount((count) => count + 1)
  }

  function recordPress(event: React.PointerEvent<HTMLButtonElement>, variant: string) {
    const rect = event.currentTarget.getBoundingClientRect()
    setPressStatus(`${variant}：Pressed ${event.currentTarget.matches(":active") ? "已触发" : "未触发"}；宽度 ${Math.round(rect.width)}px。`)
  }

  return (
    <div className="preview-stack button-doc-preview" id="button-behavior">
      <LearningAnalysisExample />
      <div className="button-demo-group">
        <div className="control-caption">七种操作层级</div>
        <div className="button-matrix">
          {buttonExamples.map(({ variant, label }) => (
            <Button key={variant} type="button" variant={variant} data-demo-variant={variant} onPointerDown={(event) => recordPress(event, variant)}>
              {variant.startsWith("ai-") && <Sparkles aria-hidden="true" />}
              {label}
            </Button>
          ))}
        </div>
        <p className="preview-result" role="status" data-demo="pressed-status">{pressStatus}</p>
      </div>

      <div className="button-demo-group">
        <div className="control-caption">尺寸与原生状态</div>
        <div className="button-matrix">
          <Button type="button">舒适 · 36px</Button>
          <Button type="button" size="compact">紧凑 · 32px</Button>
          <Button type="button" variant="outline" size="icon" aria-label="刷新教育证据"><RefreshCw aria-hidden="true" /></Button>
          <Button type="button" disabled>暂无权限</Button>
          <form onSubmit={handleSubmit} className="button-inline-form">
            <Button type="submit" variant="outline">原生表单提交</Button>
          </form>
        </div>
        <p className="preview-result" role="status">原生表单提交次数：{submitCount}</p>
      </div>

      <div className="button-demo-group">
        <div className="control-caption">Loading 与等待文案边界</div>
        <p className="button-demo-note">有效等待文案与处理指示从空闲时预留空间；未传、空字符串或纯空白时保留原内容。普通按钮不额外占位。</p>
        <div className="button-async-examples" data-demo="loading-boundaries">
          {([
            { id: "valid", label: "智能分析", description: "有效等待文案", variant: "ai-primary", loadingLabel: "正在生成分析" },
            { id: "omitted", label: "未传等待文案", description: "未传等待文案", variant: "default" },
            { id: "empty", label: "空字符串等待文案", description: "空字符串等待文案", variant: "outline", loadingLabel: "" },
            { id: "blank", label: "纯空白等待文案", description: "纯空白等待文案", variant: "ai-primary", loadingLabel: "   " },
            { id: "duplicate", label: "快速双击验证", description: "重复触发防护", variant: "secondary", loadingLabel: "正在验证" },
          ] as const).map((example) => <div className="button-async-example" key={example.id}>
            <Button type="button" variant={example.variant} loading={Boolean(running[example.id])} {...("loadingLabel" in example ? { loadingLabel: example.loadingLabel } : {})} onClick={() => run(example.id, example.description)}>
              {example.variant.startsWith("ai-") && <Sparkles aria-hidden="true" />}{example.label}
            </Button>
            <p className="preview-result" role="status" data-demo={`status-${example.id}`}>{statuses[example.id] ?? "未开始"}</p>
          </div>)}
          <Button type="button" variant="secondary" data-demo="ordinary-button">普通按钮</Button>
        </div>
        <div className="button-matrix" data-demo="layout-stability">
          <Button type="button" loading={Boolean(running.layout)} loadingLabel="正在保存较长的设置" onClick={() => run("layout", "布局稳定性")}>保存设置</Button>
          <Button type="button" variant="outline">相邻操作</Button>
        </div>
        <p className="preview-result" role="status" data-demo="status-layout">{statuses.layout ?? "点击保存设置，查看等待文案对相邻操作的位置影响。"}</p>
      </div>

      <div className="button-demo-group" id="button-contract-target">
        <div className="control-caption">asChild 链接语义与事件</div>
        <div className="button-matrix">
          <Button
            asChild
            variant="link"
            loading={linkLoading}
            loadingLabel="导航准备中"
            ref={captureLinkRef}
            onClick={() => setLinkCounts((counts) => ({ ...counts, button: counts.button + 1 }))}
          >
            <a href="#button-contract-target" onClick={() => setLinkCounts((counts) => ({ ...counts, child: counts.child + 1 }))}>查看 Button 行为合同</a>
          </Button>
          <Button type="button" variant="outline" size="compact" onClick={() => setLinkLoading((value) => !value)}>{linkLoading ? "结束链接处理" : "模拟链接处理"}</Button>
        </div>
        <p className="preview-result" role="status">链接根元素：{linkTag}；子事件 {linkCounts.child} 次；Button 事件 {linkCounts.button} 次。</p>
      </div>
    </div>
  )
}
