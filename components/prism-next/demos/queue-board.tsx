"use client"

import { useState } from "react"
import { QueueBoard, type QueueBoardCategory, type QueueBoardProps, type QueueBoardRow } from "../queue-board"
import { DemoSection, Feedback } from "../demo-parts"

export const queueBoardCategories: QueueBoardCategory[] = [
  { id: "completed", label: "已完成", count: 31, tone: "success", description: "可预览批阅结果" },
  { id: "waiting", label: "等待批阅", count: 5, tone: "info", description: "查看排队与预计时间" },
  { id: "error", label: "异常", count: 2, tone: "error", description: "查看识别或批阅异常" },
  { id: "review", label: "需教师处理", count: 2, tone: "warning", description: "立即进入人工复核" },
]
export const queueBoardRows: QueueBoardRow[] = [
  { id: "paper-1", name: "张雨桐", examNumber: "20260118", pages: 2, statusId: "completed", description: "94% 置信度 · 14:32", actions: [{ id: "preview", label: "预览试卷" }] },
  { id: "paper-2", name: "周可欣", examNumber: "20260123", pages: 2, statusId: "waiting", description: "队列 2 / 5 · 预计 3 分钟", actions: [{ id: "original", label: "预览原卷" }] },
  { id: "paper-3", name: "陈思远", examNumber: "20260122", pages: 2, statusId: "error", description: "姓名区域识别失败", actions: [{ id: "exception", label: "打开异常" }] },
  { id: "paper-4", name: "李华", examNumber: "20260126", pages: 2, statusId: "review", description: "低置信度 62% · 主观题 3", actions: [{ id: "review", label: "立即复核" }] },
]
export const queueBoardBase: QueueBoardProps = {
  categories: queueBoardCategories, rows: queueBoardRows, headerAction: { label: "查看当前批阅结果" }, maxHeight: 360,
}
const completed: QueueBoardProps = {
  ...queueBoardBase, categories: queueBoardCategories.map(category => ({ ...category, count: category.id === "completed" ? 38 : 0 })),
  rows: queueBoardRows.map(row => ({ ...row, statusId: "completed", description: "批阅完成 · 结果待发布", actions: [{ id: "preview", label: "预览试卷" }] })),
}
export const queueBoardFixtures: { id: string; label: string; props: QueueBoardProps }[] = [
  { id: "progress", label: "批阅进行中", props: queueBoardBase },
  { id: "completed", label: "批阅完成", props: completed },
  { id: "blocked", label: "批阅受阻", props: { ...queueBoardBase, rows: queueBoardRows.map(row => row.statusId === "error" ? { ...row, description: "答题区域无法匹配，请调整试卷模板", actions: [{ id: "template", label: "调整模板" }] } : row) } },
  { id: "filtered-empty", label: "筛选空态", props: { ...completed, defaultFilter: "waiting" } },
  { id: "disabled", label: "行操作禁用与缺失事实", props: { ...queueBoardBase, rows: [{ id: "paper-unknown", name: "学生未提供", statusId: "waiting", actions: [{ id: "original", label: "预览原卷", disabled: true, disabledReason: "原卷文件尚未提供，请等待资料接收完成" }] }] } },
  { id: "loading", label: "加载中", props: { ...queueBoardBase, state: { kind: "loading" } } },
  { id: "empty", label: "整体空态", props: { ...queueBoardBase, state: { kind: "empty", description: "请先接收学生试卷" } } },
  { id: "error", label: "加载失败", props: { ...queueBoardBase, state: { kind: "error", reason: "暂时无法取得队列，请重新加载" } } },
]
function QueueFixture({ props, controlled = false }: { props: QueueBoardProps; controlled?: boolean }) {
  const [filter, setFilter] = useState<string | null>(props.defaultFilter ?? null)
  const [feedback, setFeedback] = useState("尚未发出处理请求")
  return <div className="min-w-0 space-y-3"><QueueBoard {...props} filter={controlled ? filter : undefined}
    onFilterChange={next => { setFilter(next); setFeedback(`已切换：${props.categories.find(category => category.id === next)?.label || "全部队列"}`) }}
    onRowAction={(rowId, actionId) => setFeedback(`已发出请求：${rowId} / ${actionId}；等待调用方处理`)}
    onHeaderAction={() => setFeedback("已发出查看当前批阅结果请求")}
    onRetry={() => setFeedback("已发出重新加载请求；等待调用方回执")} /><Feedback>{feedback}</Feedback></div>
}
export function QueueBoardDemo() {
  return <>
    <p className="text-ui-hint">固定输入：分类总量由调用方提供，表格仅展示其中四份试卷；点击操作只记录请求。选择状态卡再次点击可取消筛选。</p>
    {queueBoardFixtures.map(({ id, label, props }) => <DemoSection key={id} id={`queue-${id}`} title={label}><QueueFixture props={props} controlled={id === "progress"} /></DemoSection>)}
    <DemoSection id="queue-themes" title="三主题 · 320px · 长中文与公式" description="状态卡按容器宽度排列；表格保留四列，可在组件内部横向滚动，操作列位于最右侧。">
      <div className="flex flex-wrap items-start gap-4">{(["light", "paper", "dark"] as const).map(theme => <section key={theme} aria-label={`${theme} 320px`} data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="w-80 max-w-full space-y-3 p-3">
        <h3 className="text-item-title">{theme} · 320px</h3><QueueFixture props={{ ...queueBoardBase, maxHeight: 280, rows: queueBoardRows.map(row => ({ ...row, paperTitle: "高二数学期中考试主观题评分依据与学生原始作答完整核对资料", description: <><span>{row.description} · 请核对完整解题过程与评分依据</span><p className="text-ui-hint">题目公式：<math><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn></math></p></> })) }} />
      </section>)}</div>
    </DemoSection>
  </>
}
