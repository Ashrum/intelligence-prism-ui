"use client"

import { useState, type ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "../button"
import { TrendChart } from "../charts/basic-charts"
import { CockpitCell, CockpitStrip, CockpitTag } from "../cockpit-strip"
import { Feedback } from "../demo-parts"
import { PrismScopeProvider } from "../prism-scope"
import { QueueList, type QueueListItem } from "../queue-list"
import { TextureStack } from "../texture-stack"

const completed = [
  { id: "9-1", label: "九年级(1)班", shortLabel: "九(1)班", value: 6, color: "var(--chromatic-class-1)" },
  { id: "9-2", label: "九年级(2)班", shortLabel: "九(2)班", value: 6, color: "var(--chromatic-class-2)" },
  { id: "8-7", label: "八年级(7)班", shortLabel: "八(7)班", value: 4, color: "var(--chromatic-class-3)" },
]

const trend = [
  { id: "2026-09-08", label: "2026-09-08 开学摸底测验", value: 72.1, valueLabel: "72.1/100" },
  { id: "2026-09-19", label: "2026-09-19 一元二次方程根与系数", value: 88.2, valueLabel: "44.1/50" },
  { id: "2026-09-28", label: "2026-09-28 二次函数图像与性质", value: 82.4, valueLabel: "41.2/50" },
  { id: "2026-10-10", label: "2026-10-10 巩固检测", value: 70.3, valueLabel: "39.4/56" },
  { id: "2026-10-17", label: "2026-10-17 新情境应用", value: 74.8, valueLabel: "37.4/50" },
  { id: "2026-10-24", label: "2026-10-24 间隔复查", value: 76.0, valueLabel: "45.6/60" },
]

const pending: Omit<QueueListItem, "href" | "onAction">[] = [
  {
    id: "p-1",
    title: "二模·二次函数巩固练习",
    tag: { label: "待复核", tone: "pink" },
    meta: { className: "九年级(2)班", detail: "应交 30 份，已批 28 份，待复核 13 处，异常 1 份，未交 1 份" },
    date: "2026-09-16", waitDays: 64, overdue: true, actionLabel: "进入复核",
  },
  {
    id: "p-2",
    title: "一次函数单元诊断卷",
    tag: { label: "原卷缺页", tone: "pink" },
    meta: { className: "八年级(7)班", detail: "原卷缺少第 2 页，补扫后方可启动 AI 批阅" },
    date: "2026-10-28", waitDays: 22, overdue: false, actionLabel: "补扫缺页",
  },
  {
    id: "p-3",
    title: "平行四边形性质随堂测",
    tag: { label: "识别失败", tone: "pink" },
    meta: { className: "八年级(7)班", detail: "3 份答卷图像模糊导致识别失败，请重新上传清晰扫描件" },
    date: "2026-10-28", waitDays: 22, overdue: false, actionLabel: "重传答卷",
  },
  {
    id: "p-4",
    title: "一次函数·阶段巩固",
    tag: { label: "扫描未完成", tone: "sky" },
    meta: { className: "八年级(7)班", detail: "当前已扫 19/20 份，尚缺 1 份答卷未录入" },
    date: "2026-10-28", waitDays: 22, overdue: false, actionLabel: "继续扫描",
  },
]

function Gr4Widths({ id, title, children }: {
  id: string
  title: string
  children: ReactNode
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)
  return <section id={id} className="prism-demo-section">
    <header><h2>{title}</h2></header>
    <div data-agent-preview data-ui-version="coss-v1" data-prism-theme="light" className="min-w-0 space-y-4">
      <PrismScopeProvider theme="light" portalContainer={portalContainer}>
        <div aria-label="1100px 宿主" role="group" className="w-[1100px] max-w-full">{children}</div>
        <div aria-label="390px 宿主" role="group" className="w-[390px] max-w-full">{children}</div>
        <div ref={setPortalContainer} />
      </PrismScopeProvider>
    </div>
  </section>
}

export function GradingCockpitDemo() {
  const [notice, setNotice] = useState("")
  return <>
    <Gr4Widths id="grading-cockpit-strip" title="批阅指标带">
      <CockpitStrip>
        <CockpitCell label="待我处理" value={4} unit="份" emphasis
          aside={<Button variant="outline" className="h-8" onClick={() => setNotice("已请求依次处理")}>
            依次处理<ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>}
          footer={<div className="flex flex-wrap gap-2">
            <CockpitTag icon="alert" label="原卷/识别异常" count={2} />
            <CockpitTag icon="plus" label="扫描未完成" count={1} />
            <CockpitTag icon="check" label="待复核" count={1} />
          </div>} />
        <CockpitCell label="本学期已完成" value={16} unit="份" aside="我任教的 3 个班"
          footer={<TextureStack segments={completed} />} />
        <CockpitCell label="近期得分率走势" unit={null} aside="九(1)班"
          value={<div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 flex-[1_1_130px]">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-metric-display">76.0%</span>
                <span className="text-ui-meta font-semibold text-success-foreground">较上次 +1.2 百分点</span>
              </div>
              <div className="mt-2 text-ui-meta text-muted-foreground">最近：间隔复查 · 45.6/60 · 2026-10-24</div>
            </div>
            <div className="w-[144px] max-w-full shrink-0">
              <TrendChart variant="spark" label="九(1)班近期得分率走势" unit="%"
                series={[{ id: "9-1", label: "九(1)班", data: trend }]} />
            </div>
          </div>} />
      </CockpitStrip>
    </Gr4Widths>
    <Feedback>{notice}</Feedback>
  </>
}

export function GradingQueueDemo() {
  const [notice, setNotice] = useState("")
  return <>
    <Gr4Widths id="grading-queue-list" title="待我处理队列">
      <QueueList items={pending.map(item => ({
        ...item, onAction: () => setNotice(`已请求${item.actionLabel} · ${item.title}`),
      }))} emptyText="当前筛选条件下暂无待我处理任务" />
    </Gr4Widths>
    <Feedback>{notice}</Feedback>
  </>
}
