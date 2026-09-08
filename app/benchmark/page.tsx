"use client"

import { useState } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardWorkbench, CommonCardExamples } from "@/components/prism/card-patterns"
import { ClassroomObservationForm } from "@/components/prism/classroom-observation-form"
import { EvidencePerspective, LabelsExamples, LearningAnalysisExample } from "@/components/prism/control-examples"
import { PageTabsExample } from "@/components/prism/tabs-examples"
import { SegmentedControl } from "@/components/ui/segmented-control"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

type Density = "comfortable" | "compact"

const buttonVariants = [
  { label: "保存设置", variant: "default" },
  { label: "暂存草稿", variant: "secondary" },
  { label: "导出记录", variant: "outline" },
  { label: "取消", variant: "ghost" },
  { label: "AI 建议", variant: "ai-soft" },
  { label: "智能分析", variant: "ai-primary" },
  { label: "删除任务", variant: "destructive" },
] as const

export default function Home() {
  const [density, setDensity] = useState<Density>("comfortable")
  const buttonSize = density === "compact" ? "compact" : "default"
  const iconButtonSize = density === "compact" ? "icon-sm" : "icon"

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
          <p><Link href="/review/reading-review" className="text-primary no-underline">交互语言候选：结论复核 →</Link></p>
        </div>

        <div className="density-control">
          <span className="control-caption" id="density-label">界面密度</span>
          <SegmentedControl
            label="界面密度"
            className="tf-density"
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
            aside={<Badge variant="outline">示例数据</Badge>}
          />

          <div className="navigation-grid">
            <div className="navigation-primary">
              <PageTabsExample density={density} />
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

            </div>
          </div>
          <EvidencePerspective />
        </section>

        <section className="benchmark-section" aria-labelledby="button-title">
          <SectionHeading
            id="button-title"
            title="Button"
            description="曜蓝承担主要操作，智绯仅用于明确的 AI 行为。"
            aside={<Badge variant="outline">8 种操作</Badge>}
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
          <LearningAnalysisExample compact={density === "compact"} />
        </section>

        <section className="benchmark-section" aria-labelledby="card-title">
          <SectionHeading
            id="card-title"
            title="Card"
            description="对象身份与范围保持可见；选择、展开、重试与编辑各自表达清楚。"
            aside={<Badge>教育证据</Badge>}
          />
          <CardWorkbench density={density} />
          <details className="common-card-disclosure"><summary>查看常见 Card 样式</summary><CommonCardExamples density={density} /></details>
        </section>

        <section className="benchmark-section" id="form-demo" aria-labelledby="form-title">
          <SectionHeading
            id="form-title"
            title="Input / Field"
            description="浮动标签、前后缀、错误与输入状态保持清楚关联。"
            aside={<Badge>表单基线</Badge>}
          />
          <ClassroomObservationForm density={density} />
        </section>

        <section className="benchmark-section" aria-labelledby="labels-title">
          <SectionHeading
            id="labels-title"
            title="Badge 与语义标签"
            description="元数据、运行状态与 AI 来源采用不同的视觉和语言。"
          />
          <LabelsExamples />
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
