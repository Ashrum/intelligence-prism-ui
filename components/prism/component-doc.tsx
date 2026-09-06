"use client"

import { useEffect, useRef, useState } from "react"
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

  if (slug === "button") return <ButtonExamples />

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
  { variant: "primary", label: "保存设置", busy: "保存中" },
  { variant: "secondary", label: "暂存草稿", busy: "暂存中" },
  { variant: "outline", label: "导出记录", busy: "导出中" },
  { variant: "ghost", label: "轻操作", busy: "处理中" },
  { variant: "ai-soft", label: "AI 建议", busy: "生成中" },
  { variant: "ai-primary", label: "智能分析", busy: "分析中" },
  { variant: "destructive", label: "删除任务", busy: "删除中" },
] as const

function ButtonExamples() {
  const [density, setDensity] = useState("comfortable")
  const [reduceMotion, setReduceMotion] = useState(false)
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState("点击按钮体验真实状态；所有操作仅为演示。")
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const pending = timers.current
    return () => { for (const timer of pending.values()) clearTimeout(timer); pending.clear() }
  }, [])

  function run(id: string) {
    if (timers.current.has(id)) return
    timers.current.set(id, setTimeout(() => {
      timers.current.delete(id)
      setRunning((previous) => ({ ...previous, [id]: false }))
      setMessage("演示完成，可重新操作。")
    }, 1800))
    setRunning((previous) => ({ ...previous, [id]: true }))
    setMessage("正在处理；再次点击或按 Enter 不会重复启动。")
  }

  function reset() {
    for (const timer of timers.current.values()) clearTimeout(timer)
    timers.current.clear()
    setRunning({})
    setMessage("演示已重置。")
  }

  return (
    <div className="preview-stack" data-density={density} data-motion={reduceMotion ? "reduce" : "system"}>
      <div className="button-matrix">
        <label>密度 <select value={density} onChange={(event) => setDensity(event.currentTarget.value)} aria-label="Button 密度"><option value="comfortable">舒适 · 36px</option><option value="compact">紧凑 · 32px</option></select></label>
        <label><input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.currentTarget.checked)} />减少动效</label>
        <Button variant="ghost" onClick={reset}>重置演示</Button>
      </div>
      <p className="preview-result" role="status">{message}</p>
      <h3>变体与真实交互</h3>
      <div className="button-matrix">
        {buttonExamples.map((item) => (
          <Button key={item.variant} variant={item.variant} loading={!!running[item.variant]} loadingLabel={item.busy} onClick={() => run(item.variant)}>
            {item.variant.startsWith("ai-") && <Sparkles aria-hidden="true" />}{item.label}
          </Button>
        ))}
      </div>
      <div className="button-matrix">
        <Button variant="outline" size="icon" aria-label="刷新教育证据" loading={!!running.icon} loadingLabel="正在刷新" onClick={() => run("icon")}><RefreshCw aria-hidden="true" /></Button>
        <Button loading loadingLabel="提交中">提交记录</Button>
        <Button disabled>暂无权限</Button>
        <Button asChild variant="link"><a href="/foundations/motion">查看动效规范</a></Button>
      </div>
      <h3>等待文案回退</h3>
      <p>未传、空字符串和纯空白都保留原文案；自定义等待文案按需预留宽度。异步按钮从空闲态传入 loading=false，不在点击后才添加此属性。</p>
      <div className="button-matrix">
        {[undefined, "", "   "].map((label, index) => (
          <Button key={index} variant="outline" loading={!!running[`fallback-${index}`]} loadingLabel={label} onClick={() => run(`fallback-${index}`)}>{["未传文案", "空字符串", "纯空白"][index]}</Button>
        ))}
        <Button variant="ai-primary" loading={!!running.layout} loadingLabel="正在生成分析" onClick={() => run("layout")}><Sparkles aria-hidden="true" />智能分析</Button>
        <Button variant="outline" onClick={reset}>相邻操作</Button>
      </div>
      <h3>尺寸与使用边界</h3>
      <div className="button-matrix"><Button size="xs" variant="outline">24px</Button><Button size="sm" variant="outline">32px</Button><Button variant="outline">随密度</Button><Button size="lg" variant="outline">40px</Button></div>
      <p>默认 36px，紧凑 32px；文字 14px、图标 16px、圆角 8px。24px 仅用于具有足够间距的紧凑辅助操作。普通按钮不预留异步文案；纯图标按钮始终保持正方形并提供可访问名称。</p>
      <p>主要操作用曜蓝，次操作使用中性表面；AI 操作使用智绯，等待时不变色。Hover 为 120ms，Pressed 为 80ms，仅改变颜色或边框，不位移、不加阴影。键盘焦点为 2px 外框加 2px 间隔；Loading 保留焦点并阻止重复激活，Disabled 使用原生禁用。</p>
      <p>尊重系统减少动效偏好；开关只提供额外减少选项，不能覆盖系统偏好重新开启动画。表单提交显式使用 type="submit"；导航使用 asChild 与真实链接。</p>
      <pre><code>{'<Button variant="ai-primary" loading={isRunning} loadingLabel="分析中" onClick={handleRun}>智能分析</Button>'}</code></pre>
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
