"use client"

import { useState } from "react"
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
    return (
      <div className="preview-stack">
        <div className="button-matrix">
          <PrismButton tone="primary">保存设置</PrismButton>
          <PrismButton tone="secondary">暂存草稿</PrismButton>
          <PrismButton tone="outline">导出记录</PrismButton>
          <PrismButton tone="ghost">取消</PrismButton>
          <PrismButton tone="ai-soft"><Sparkles aria-hidden="true" />AI 建议</PrismButton>
          <PrismButton tone="ai-primary">智能分析</PrismButton>
          <PrismButton tone="destructive">删除任务</PrismButton>
        </div>
        <div className="button-matrix">
          <PrismButton tone="outline" iconLabel="刷新教育证据"><RefreshCw aria-hidden="true" /></PrismButton>
          <PrismButton tone="primary" loading>提交中</PrismButton>
          <PrismButton tone="primary" disabled>暂无权限</PrismButton>
        </div>
      </div>
    )
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

function PrismButton({ tone, loading, iconLabel, children, ...props }: React.ComponentProps<typeof Button> & { tone: string; loading?: boolean; iconLabel?: string }) {
  return <Button {...props} className={`prism-button prism-button--${tone} ${iconLabel ? "prism-button--icon" : ""}`} disabled={props.disabled || loading} data-loading={loading || undefined} aria-busy={loading || undefined} aria-label={iconLabel ?? props["aria-label"]}>{loading && <span className="loading-mark" aria-hidden="true" />}{children}</Button>
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
