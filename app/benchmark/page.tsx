"use client"

import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, ReactNode } from "react"
import {
  AlertCircle,
  ArrowRight,
  Check,
  FileCheck2,
  RefreshCw,
  Sparkles,
} from "lucide-react"

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
import { SegmentedControl } from "@/components/ui/segmented-control"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

type Density = "comfortable" | "compact"
type WorkflowState = "pending" | "completed"
type AIWorkflowState = "generating" | "review"

const buttonVariants = [
  { label: "保存设置", variant: "default" },
  { label: "暂存草稿", variant: "secondary" },
  { label: "导出记录", variant: "outline" },
  { label: "取消", variant: "ghost" },
  { label: "AI 建议", variant: "ai-soft" },
  { label: "智能分析", variant: "ai-primary" },
  { label: "删除任务", variant: "destructive" },
] as const

const stateLabels = [
  { label: "未开始", tone: "neutral" },
  { label: "信息更新", tone: "info" },
  { label: "校验通过", tone: "success" },
  { label: "需要关注", tone: "warning" },
  { label: "处理失败", tone: "danger" },
  { label: "正在处理", tone: "running" },
  { label: "等待复核", tone: "pending" },
  { label: "处理完成", tone: "completed" },
] as const

const aiLabels = ["AI 生成", "AI 推断", "AI 建议", "人工已编辑"]

export default function Home() {
  const [density, setDensity] = useState<Density>("comfortable")
  const [pageTab, setPageTab] = useState("overview")
  const [perspective, setPerspective] = useState("student")
  const [evidenceTitle, setEvidenceTitle] = useState("")
  const [showError, setShowError] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [workflowState, setWorkflowState] =
    useState<WorkflowState>("pending")
  const [aiWorkflowState, setAIWorkflowState] =
    useState<AIWorkflowState>("generating")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buttonSize = density === "compact" ? "compact" : "default"
  const iconButtonSize = density === "compact" ? "icon-sm" : "icon"

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleEvidenceTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value
    setEvidenceTitle(nextValue)
    if (nextValue.trim()) setShowError(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowError(!evidenceTitle.trim())
  }

  const handleRun = () => {
    if (isRunning) return
    setIsRunning(true)
    setWorkflowState("pending")
    setAIWorkflowState("generating")
    timerRef.current = setTimeout(() => {
      setWorkflowState("completed")
      setAIWorkflowState("review")
      setIsRunning(false)
    }, 900)
  }

  return (
    <div className="benchmark-shell" data-density={density}>
      <header className="benchmark-header">
        <div className="benchmark-heading">
          <div className="benchmark-kicker">
            <span className="growth-signal" aria-hidden="true" />
            Phase 1 · 基准组件
          </div>
          <h1>智能曜彩｜基础组件基准</h1>
          <p>在同一教育产品页面中检验语义、密度、中文长内容与关键交互状态。</p>
        </div>

        <div className="density-control">
          <span className="control-caption" id="density-label">界面密度</span>
          <SegmentedControl
            label="界面密度"
            value={density}
            onValueChange={(value) => setDensity(value as Density)}
            items={[
              ["comfortable", "舒适"],
              ["compact", "紧凑"],
            ]}
            size="sm"
          />
        </div>
      </header>

      <main id="main-content" className="benchmark-main" tabIndex={-1}>
        <section className="benchmark-section" aria-labelledby="navigation-title">
          <SectionHeading
            id="navigation-title"
            title="导航与视角控制"
            description="页面分组、局部时间范围与即时视角选择保持不同语义。"
            aside={<StateLabel tone="running">数据持续更新</StateLabel>}
          />

          <div className="navigation-grid">
            <div className="navigation-primary">
              <span className="control-caption">页面内容</span>
              <Tabs value={pageTab} onValueChange={setPageTab} activationMode="manual">
                <TabsList variant="line" aria-label="基础组件基准页面">
                  <TabsTrigger value="overview">概览</TabsTrigger>
                  <TabsTrigger value="evidence">教育证据</TabsTrigger>
                  <TabsTrigger value="records">处理记录</TabsTrigger>
                </TabsList>
                <div className="page-tab-content">
                  <TabsContent value="overview">今日汇总 128 份教育证据，6 项等待人工复核。</TabsContent>
                  <TabsContent value="evidence">证据来源覆盖课堂观察、作业表现与阶段测评。</TabsContent>
                  <TabsContent value="records">最近一次批量处理于 14:32 完成，未发现异常记录。</TabsContent>
                </div>
              </Tabs>
            </div>

            <div className="navigation-secondary">
              <div className="control-group">
                <span className="control-caption">统计周期</span>
                <Tabs defaultValue="today">
                  <TabsList aria-label="教育证据统计周期">
                    <TabsTrigger value="today">今日</TabsTrigger>
                    <TabsTrigger value="week">本周</TabsTrigger>
                    <TabsTrigger value="month">本月</TabsTrigger>
                  </TabsList>
                  <TabsContent value="today" className="surface-tab-note">128 份</TabsContent>
                  <TabsContent value="week" className="surface-tab-note">816 份</TabsContent>
                  <TabsContent value="month" className="surface-tab-note">3,240 份</TabsContent>
                </Tabs>
              </div>

              <div className="control-group">
                <span className="control-caption">查看视角</span>
                <SegmentedControl
                  label="查看视角"
                  value={perspective}
                  onValueChange={setPerspective}
                  items={[
                    ["student", "学生视角"],
                    ["question", "题目视角"],
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="benchmark-section" aria-labelledby="button-title">
          <SectionHeading
            id="button-title"
            title="Button"
            description="曜蓝承担主要操作，智绯仅用于明确的 AI 行为。"
            aside={<MetaBadge tone="outline">8 种操作</MetaBadge>}
          />
          <div className="button-matrix">
            {buttonVariants.map(({ label, variant }) => (
              <Button key={variant} type="button" variant={variant} size={buttonSize}>
                {variant.startsWith("ai-") && <Sparkles aria-hidden="true" />}
                {label}
              </Button>
            ))}
            <Button asChild variant="link">
              <a href="#form-demo">查看表单规范 <ArrowRight aria-hidden="true" /></a>
            </Button>
            <Button type="button" variant="outline" size={iconButtonSize} aria-label="刷新教育证据"><RefreshCw aria-hidden="true" /></Button>
            <Button type="button" size={buttonSize} loading loadingLabel="提交中">提交</Button>
            <Button type="button" size={buttonSize} disabled>暂无权限</Button>
          </div>
        </section>

        <section className="benchmark-section" aria-labelledby="card-title">
          <SectionHeading
            id="card-title"
            title="Card"
            description="默认无阴影，以边框、轻表面和语义标签建立层级。"
            aside={<MetaBadge tone="knowledge">教育证据</MetaBadge>}
          />
          <div className="card-matrix">
            <Card className="prism-card">
              <CardHeader className="prism-card-header">
                <div className="card-title-row">
                  <CardTitle>教育证据日报</CardTitle>
                  <MetaBadge>今日</MetaBadge>
                </div>
                <CardDescription>汇总课堂观察、作业表现与阶段测评产生的有效证据。</CardDescription>
              </CardHeader>
              <CardContent className="prism-card-content">
                <div className="metric-row"><strong>128</strong><span>份有效证据</span></div>
              </CardContent>
              <CardFooter className="prism-card-footer">
                <StateLabel tone="success">数据正常</StateLabel>
              </CardFooter>
            </Card>

            <Card className="prism-card prism-card--selected">
              <CardHeader className="prism-card-header">
                <div className="card-title-row">
                  <CardTitle>九年级数学批阅</CardTitle>
                  <Check aria-hidden="true" className="knowledge-icon" />
                </div>
                <CardDescription>已选择本任务，用于查看学生作答与错因证据。</CardDescription>
              </CardHeader>
              <CardContent className="prism-card-content">
                <div className="metric-row"><strong>6</strong><span>项等待人工复核</span></div>
              </CardContent>
              <CardFooter className="prism-card-footer card-footer-between">
                <StateLabel tone="pending">等待复核</StateLabel>
                <span className="growth-copy"><span aria-hidden="true" />近 7 日 +6.4%</span>
              </CardFooter>
            </Card>

            <Card className="prism-card prism-card--ai">
              <CardHeader className="prism-card-header">
                <div className="card-title-row">
                  <CardTitle>学习表现摘要</CardTitle>
                  <AILabel>AI 生成</AILabel>
                </div>
                <CardDescription>基于近 30 天教育证据生成，提交前仍需教师确认。</CardDescription>
              </CardHeader>
              <CardContent className="prism-card-content">
                <p className="ai-summary">方程建模能力稳步提升，几何证明中的条件引用仍需加强。</p>
              </CardContent>
              <CardFooter className="prism-card-footer">
                <span className="status-swap" role="status" aria-live="polite">
                  <StateLabel tone={aiWorkflowState === "review" ? "pending" : "running"}>
                    {aiWorkflowState === "review" ? "待人工确认" : "生成中"}
                  </StateLabel>
                </span>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="benchmark-section" id="form-demo" aria-labelledby="form-title">
          <SectionHeading
            id="form-title"
            title="Input / Field"
            description="标签、说明、错误与输入状态保持清楚关联。"
            aside={<MetaBadge>表单基线</MetaBadge>}
          />
          <form className="form-layout" onSubmit={handleSubmit} noValidate>
            <div className="form-primary">
              <Field
                id="evidence-title"
                label="证据记录标题"
                description="标题将展示给任课教师，建议包含年级、学科和证据来源。"
                error={showError ? "请输入证据记录标题，不能只填写空格或使用无法识别的简称。" : undefined}
              >
                <Input
                  id="evidence-title"
                  value={evidenceTitle}
                  onChange={handleEvidenceTitleChange}
                  placeholder="例如：九年级数学函数单元课堂观察"
                  aria-invalid={showError}
                  aria-describedby={showError ? "evidence-title-description evidence-title-error" : "evidence-title-description"}
                  className="prism-input"
                />
              </Field>
              <Button type="submit" size={buttonSize}>校验并保存</Button>
            </div>

            <div className="form-state-fields">
              <Field id="evidence-source" label="证据来源" description="只读信息仍可聚焦与复制。">
                <Input id="evidence-source" value="课堂观察记录" readOnly aria-describedby="evidence-source-description" className="prism-input prism-input--readonly" />
              </Field>
              <Field id="review-id" label="区域审核编号" description="当前阶段不可编辑。" disabled>
                <Input id="review-id" value="提交后自动生成" disabled aria-describedby="review-id-description" className="prism-input" />
              </Field>
            </div>
          </form>
        </section>

        <section className="benchmark-section" aria-labelledby="labels-title">
          <SectionHeading
            id="labels-title"
            title="Badge 与语义标签"
            description="元数据、运行状态与 AI 来源采用不同的视觉和语言。"
          />
          <div className="labels-layout">
            <div className="label-group">
              <h3>静态元数据</h3>
              <div className="label-list">
                <MetaBadge>九年级</MetaBadge>
                <MetaBadge tone="knowledge">数学</MetaBadge>
                <MetaBadge tone="outline">课堂证据</MetaBadge>
              </div>
            </div>
            <div className="label-group label-group-wide">
              <h3>处理状态</h3>
              <div className="label-list">
                {stateLabels.map(({ label, tone }) => <StateLabel key={tone} tone={tone}>{label}</StateLabel>)}
              </div>
            </div>
            <div className="label-group">
              <h3>AI 来源</h3>
              <div className="label-list">
                {aiLabels.map((label) => <AILabel key={label}>{label}</AILabel>)}
              </div>
            </div>
          </div>
        </section>

        <section className="workflow-section" aria-labelledby="workflow-title">
          <div className="workflow-copy">
            <div className="workflow-icon" aria-hidden="true"><FileCheck2 /></div>
            <div>
              <h2 id="workflow-title">交互状态验证</h2>
              <p>启动处理后，任务完成状态与 AI 人工确认状态将同步更新。</p>
            </div>
          </div>
          <div className="workflow-actions">
            <span className="status-swap" role="status" aria-live="polite">
              <StateLabel tone={workflowState === "completed" ? "completed" : "pending"}>
                {workflowState === "completed" ? "已完成" : "待处理"}
              </StateLabel>
            </span>
            <Button type="button" size={buttonSize} onClick={handleRun} loading={isRunning} loadingLabel="处理中">
              <Sparkles aria-hidden="true" />开始处理
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionHeading({ id, title, description, aside }: { id: string; title: string; description: string; aside?: ReactNode }) {
  return (
    <div className="section-heading">
      <div><h2 id={id}>{title}</h2><p>{description}</p></div>
      {aside}
    </div>
  )
}

function Field({ id, label, description, error, disabled, children }: { id: string; label: string; description: string; error?: string; disabled?: boolean; children: ReactNode }) {
  return (
    <div className="prism-field" data-disabled={disabled || undefined} data-invalid={Boolean(error) || undefined}>
      <Label htmlFor={id} className="field-label">{label}</Label>
      {children}
      <p id={`${id}-description`} className="field-description">{description}</p>
      {error && <p id={`${id}-error`} className="field-error"><AlertCircle aria-hidden="true" />{error}</p>}
    </div>
  )
}

function MetaBadge({ tone = "neutral", children }: { tone?: "neutral" | "knowledge" | "outline"; children: ReactNode }) {
  return <Badge variant="outline" className={`meta-badge meta-badge--${tone}`}>{children}</Badge>
}

function StateLabel({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`state-label state-label--${tone}`} data-state={tone}><span className="state-dot" aria-hidden="true" />{children}</span>
}

function AILabel({ children }: { children: ReactNode }) {
  return <span className="ai-label"><Sparkles aria-hidden="true" />{children}</span>
}
