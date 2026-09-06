"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { AlertCircle, Check, RefreshCw, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { componentDocuments, type ComponentDocumentSlug } from "@/components/prism/catalog"

export function ComponentDoc({ slug }: { slug: ComponentDocumentSlug }) {
  const doc = componentDocuments[slug]
  return (
    <article className="component-article">
      <header className="component-hero">
        <div className="component-eyebrow">{doc.eyebrow}</div>
        <div className="component-title-row">
          <h1>{doc.title}</h1>
          <span className="state-label state-label--completed"><span className="state-dot" aria-hidden="true" />稳定</span>
        </div>
        <p>{doc.description}</p>
      </header>

      <section className="doc-section" aria-labelledby="preview-title">
        <div className="doc-section-heading">
          <h2 id="preview-title">Preview</h2>
          <p>真实组件与交互状态，可直接键盘操作。</p>
        </div>
        <div className="component-preview">
          <ComponentPreview slug={slug} />
        </div>
      </section>

      <section className="doc-section doc-notes-grid" aria-label="使用与无障碍说明">
        <div className="doc-note">
          <h2>Usage</h2>
          <p>{doc.guidance}</p>
        </div>
        <div className="doc-note">
          <h2>Accessibility</h2>
          <p>{doc.accessibility}</p>
        </div>
      </section>
    </article>
  )
}

function ComponentPreview({ slug }: { slug: ComponentDocumentSlug }) {
  const [segment, setSegment] = useState("student")
  const [title, setTitle] = useState("")

  if (slug === "button") {
    return <ButtonPreview />
  }

  if (slug === "tabs") {
    return (
      <div className="preview-grid-two">
        <div>
          <div className="control-caption">Page</div>
          <Tabs defaultValue="overview" className="page-tabs">
            <TabsList variant="line" className="page-tabs-list" aria-label="教育证据页面">
              <TabsTrigger value="overview" className="page-tabs-trigger">概览</TabsTrigger>
              <TabsTrigger value="evidence" className="page-tabs-trigger">教育证据</TabsTrigger>
              <TabsTrigger value="records" className="page-tabs-trigger">处理记录</TabsTrigger>
            </TabsList>
            <div className="page-tab-content">
              <TabsContent value="overview">今日汇总 128 份教育证据。</TabsContent>
              <TabsContent value="evidence">覆盖课堂观察、作业表现与阶段测评。</TabsContent>
              <TabsContent value="records">最近一次处理于 14:32 完成。</TabsContent>
            </div>
          </Tabs>
        </div>
        <div>
          <div className="control-caption">Surface</div>
          <Tabs defaultValue="today" className="surface-tabs">
            <TabsList className="surface-tabs-list" aria-label="统计周期">
              <TabsTrigger value="today" className="surface-tabs-trigger">今日</TabsTrigger>
              <TabsTrigger value="week" className="surface-tabs-trigger">本周</TabsTrigger>
              <TabsTrigger value="month" className="surface-tabs-trigger">本月</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="surface-tab-note">128 份</TabsContent>
            <TabsContent value="week" className="surface-tab-note">816 份</TabsContent>
            <TabsContent value="month" className="surface-tab-note">3,240 份</TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  if (slug === "segmented-control") {
    return (
      <div className="preview-stack">
        <SegmentedControl label="查看视角" value={segment} onValueChange={setSegment} items={[["student", "学生视角"], ["question", "题目视角"]]} />
        <p className="preview-result" role="status">当前选择：{segment === "student" ? "学生视角" : "题目视角"}</p>
      </div>
    )
  }

  if (slug === "card") {
    return (
      <div className="card-matrix">
        <DemoCard title="教育证据日报" description="汇总课堂观察、作业表现与阶段测评。" value="128" footer={<StateLabel tone="success">数据正常</StateLabel>} />
        <DemoCard selected title="九年级数学批阅" description="查看学生作答与诊断证据。" value="6" footer={<StateLabel tone="pending">等待复核</StateLabel>} />
        <DemoCard ai title="学习表现摘要" description="基于近 30 天教育证据生成。" value="AI" footer={<AILabel>AI 生成</AILabel>} />
      </div>
    )
  }

  if (slug === "input-field") {
    const invalid = !title.trim()
    return (
      <div className="form-primary component-form-demo">
        <div className="prism-field" data-invalid={invalid || undefined}>
          <Label htmlFor="component-evidence-title" className="field-label">证据记录标题</Label>
          <Input id="component-evidence-title" value={title} onChange={(event) => setTitle(event.currentTarget.value)} placeholder="例如：九年级数学课堂观察" aria-invalid={invalid} aria-describedby={invalid ? "component-description component-error" : "component-description"} className="prism-input" />
          <p id="component-description" className="field-description">建议包含年级、学科和证据来源。</p>
          {invalid && <p id="component-error" className="field-error"><AlertCircle aria-hidden="true" />请输入证据记录标题。</p>}
        </div>
        <div className="preview-grid-two">
          <Input value="课堂观察记录" readOnly aria-label="只读示例" className="prism-input prism-input--readonly" />
          <Input value="当前不可编辑" disabled aria-label="禁用示例" className="prism-input" />
        </div>
      </div>
    )
  }

  return (
    <div className="labels-layout docs-labels-layout">
      <div className="label-group"><h3>Badge</h3><div className="label-list"><MetaBadge>九年级</MetaBadge><MetaBadge tone="knowledge">数学</MetaBadge><MetaBadge tone="outline">课堂证据</MetaBadge></div></div>
      <div className="label-group"><h3>State Label</h3><div className="label-list"><StateLabel tone="running">正在处理</StateLabel><StateLabel tone="success">校验通过</StateLabel><StateLabel tone="warning">需要关注</StateLabel><StateLabel tone="danger">处理失败</StateLabel></div></div>
      <div className="label-group"><h3>AI Label</h3><div className="label-list"><AILabel>AI 生成</AILabel><AILabel>AI 推断</AILabel><AILabel>人工已编辑</AILabel></div></div>
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
  const [status, setStatus] = useState("选择任一异步示例，验证等待状态与布局稳定性。")
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
    setStatus(`${label}：正在处理；处理函数调用 ${count} 次。`)
    timers.current.set(id, setTimeout(() => {
      timers.current.delete(id)
      setRunning((previous) => ({ ...previous, [id]: false }))
      setStatus(`${label}：处理完成；处理函数共调用 ${count} 次。`)
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
        <div className="button-matrix" data-demo="loading-boundaries">
          <Button type="button" variant="ai-primary" loading={Boolean(running.valid)} loadingLabel="正在生成分析" onClick={() => run("valid", "有效等待文案")}>
            <Sparkles aria-hidden="true" />智能分析
          </Button>
          <Button type="button" loading={Boolean(running.omitted)} onClick={() => run("omitted", "未传等待文案")}>未传等待文案</Button>
          <Button type="button" variant="outline" loading={Boolean(running.empty)} loadingLabel="" onClick={() => run("empty", "空字符串等待文案")}>空字符串等待文案</Button>
          <Button type="button" variant="ai-primary" loading={Boolean(running.blank)} loadingLabel="   " onClick={() => run("blank", "纯空白等待文案")}><Sparkles aria-hidden="true" />纯空白等待文案</Button>
          <Button type="button" variant="secondary" loading={Boolean(running.duplicate)} loadingLabel="正在验证" onClick={() => run("duplicate", "重复触发防护")}>快速双击验证</Button>
          <Button type="button" variant="secondary" data-demo="ordinary-button">普通按钮</Button>
        </div>
        <div className="button-matrix" data-demo="layout-stability">
          <Button type="button" loading={Boolean(running.layout)} loadingLabel="正在保存较长的设置" onClick={() => run("layout", "布局稳定性")}>保存设置</Button>
          <Button type="button" variant="outline">相邻操作</Button>
        </div>
        <p className="preview-result" role="status" aria-live="polite">{status}</p>
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

function SegmentedControl({ label, value, onValueChange, items }: { label: string; value: string; onValueChange: (value: string) => void; items: readonly (readonly [string, string])[] }) {
  return <RadioGroup aria-label={label} value={value} onValueChange={onValueChange} className="segmented-control segmented-control--md">{items.map(([itemValue, itemLabel]) => <Label key={itemValue} className="segmented-item-label"><RadioGroupItem value={itemValue} aria-label={itemLabel} className="segmented-item" /><span>{itemLabel}</span></Label>)}</RadioGroup>
}

function DemoCard({ title, description, value, footer, selected, ai }: { title: string; description: string; value: string; footer: React.ReactNode; selected?: boolean; ai?: boolean }) {
  return <Card className={`prism-card ${selected ? "prism-card--selected" : ""} ${ai ? "prism-card--ai" : ""}`}><CardHeader className="prism-card-header"><div className="card-title-row"><CardTitle>{title}{selected && <span className="sr-only">，已选择</span>}</CardTitle>{selected && <Check className="knowledge-icon" aria-hidden="true" />}</div><CardDescription>{description}</CardDescription></CardHeader><CardContent className="prism-card-content"><div className="metric-row"><strong>{value}</strong><span>{value === "AI" ? "需人工确认" : "份记录"}</span></div></CardContent><CardFooter className="prism-card-footer">{footer}</CardFooter></Card>
}

function MetaBadge({ tone = "neutral", children }: { tone?: "neutral" | "knowledge" | "outline"; children: React.ReactNode }) {
  return <Badge variant="outline" className={`meta-badge meta-badge--${tone}`}>{children}</Badge>
}

function StateLabel({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`state-label state-label--${tone}`} data-state={tone}><span className="state-dot" aria-hidden="true" />{children}</span>
}

function AILabel({ children }: { children: React.ReactNode }) {
  return <span className="ai-label"><Sparkles aria-hidden="true" />{children}</span>
}
