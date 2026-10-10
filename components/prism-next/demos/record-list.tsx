"use client"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Badge } from "../badge"
import { RecordList, type RecordListProps, type RecordListRow, type RecordListFilter } from "../record-list"
import { DemoSection, Feedback } from "../demo-parts"

export const recordTabs = [
  { id: "mine", label: "需要我处理", count: 7 }, { id: "processing", label: "系统处理中", count: 3 },
  { id: "completed", label: "已完成", count: 18 }, { id: "all", label: "全部记录", count: 28 },
]
const menu = [{ id: "details", label: "查看批阅配置" }, { id: "history", label: "查看操作记录" }]
const row = (id: string, type: string, name: string, metadata: string, description: string, status: string, label: string,
  tab: string, tone: "warning" | "neutral" | "info" | "success", progress?: number): RecordListRow =>
  ({ id, type, name, metadata, description, status: { label: status, tone }, action: { id: "open", label }, tabIds: [tab, "all"], menu, progress })
export const recordRows: RecordListRow[] = [
  row("linear", "作业", "一元二次方程复习作业", "九年级 3 班 · 46 份", "L2 定向复核 · 7 项 · 影响 5 名学生 / 4 题", "待复核", "继续处理", "mine", "warning", 72),
  row("midterm", "试卷", "期中模拟试卷", "九年级 1、2 班 · 92 份", "L3 匹配待确认 · 3 份 · 总分未决", "匹配待确认", "确认匹配", "mine", "neutral"),
  row("pythagoras", "练习", "勾股定理练习", "八年级 3 班 · 44 份", "L1 抽样核验 · 3 份答卷", "待抽样", "开始抽样", "mine", "info"),
  row("circle", "作业", "圆的性质课后作业", "九年级 4 班 · 45 份", "评分规则缺失 · 2 题 · 影响 45 份答卷", "规则待补充", "补充规则", "mine", "warning"),
  row("correction", "试卷", "平行四边形试卷 · 更正 V2", "九年级 2 班 · 42 份", "已重新打开 · 1 项 · 影响 1 名学生总分", "更正中", "继续更正", "mine", "neutral"),
  row("fraction-review", "练习", "分式方程错题再练", "八年级 1 班 · 48 份", "L2 定向复核 · 2 项 · 影响 2 名学生", "待复核", "继续处理", "mine", "warning"),
  row("similar-review", "作业", "相似三角形证明作业", "九年级 2 班 · 42 份", "L2 推导步骤核对 · 1 项 · 影响 1 名学生", "待复核", "继续处理", "mine", "warning"),
  row("quadratic", "练习", "二次函数练习", "九年级 1、2 班 · 92 份", "主观题评分 · 55 / 92 份 · 60%", "系统处理中", "查看进度", "processing", "info", 60),
  row("graph", "作业", "函数图像课后作业", "九年级 4 班 · 45 份", "一致性校验 · 42 / 45 份 · 93%", "系统处理中", "查看进度", "processing", "info", 93),
  row("fraction", "练习", "分式方程专项练习", "八年级 2 班 · 46 份", "逐题批阅 · 18 / 46 份 · 39%", "系统处理中", "查看进度", "processing", "info", 39),
  ...["平行四边形试卷", "相似三角形课后作业", "有理数复习作业", "整式加减课堂练习", "一元一次方程单元检测", "不等式应用练习", "实数运算课后作业", "平面直角坐标系检测", "二元一次方程组练习", "数据收集与整理作业", "三角形全等单元检测", "轴对称课堂练习", "一次函数综合作业", "反比例函数单元检测", "概率初步课堂练习", "圆周角定理作业", "锐角三角函数检测", "投影与视图课堂练习"].map((name, index) =>
    row(`completed-${index + 1}`, ["试卷", "作业", "练习"][index % 3], name, `${index % 2 ? "八" : "九"}年级 ${index % 4 + 1} 班 · ${42 + index % 5} 份`,
      `${42 + index % 5} / ${42 + index % 5} 份已最终化${index === 1 ? " · 教师修正 3 项" : ""}`, index < 6 ? "未发布" : "已发布", "查看结果", "completed", "success", 100)),
]
const baseFilters: RecordListFilter[] = [
  { id: "type", label: "记录类型", value: "all", options: [{ value: "all", label: "全部类型" }, ...["作业", "试卷", "练习"].map(value => ({ value, label: value }))] },
  { id: "class", label: "班级", value: "all", options: [{ value: "all", label: "全部班级" }, { value: "九年级", label: "九年级" }, { value: "八年级", label: "八年级" }] },
  { id: "status", label: "待处理原因或结果状态", value: "all", options: [{ value: "all", label: "全部状态" }, ...["待复核", "匹配待确认", "待抽样", "规则待补充", "更正中", "系统处理中", "未发布", "已发布"].map(value => ({ value, label: value }))] },
  { id: "publish", label: "发布状态", value: "all", options: [{ value: "all", label: "全部发布状态" }, { value: "未发布", label: "未发布" }, { value: "已发布", label: "已发布" }] },
  { id: "time", label: "批阅时间", value: "all", options: [{ value: "all", label: "全部时间" }, { value: "2026-10-01", label: "2026 年 10 月 1 日" }, { value: "2026-09-30", label: "2026 年 9 月 30 日" }] },
]
export const recordBase: RecordListProps = { tabs: recordTabs, rows: recordRows.slice(0, 5), filters: baseFilters,
  summary: { label: "7 项待处理 · 7 个批阅批次需要处理 · 影响 12 名学生", tone: "warning" }, pagination: { page: 1, pages: [1, 2], label: "第 1 页 · 共 7 条记录" } }

function RecordFixture({ initialTab = "mine", initialSearch = "", filtered = false, longContent = false, externalNavigation = false, overrides = {} }: {
  initialTab?: string; initialSearch?: string; filtered?: boolean; longContent?: boolean; externalNavigation?: boolean; overrides?: Partial<RecordListProps>
}) {
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState(initialSearch)
  const [values, setValues] = useState<Record<string, string>>(filtered ? { class: "九年级", status: "待复核" } : {})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [notice, setNotice] = useState("尚无操作请求。")
  const filters = baseFilters.map(filter => ({ ...filter, value: values[filter.id] ?? "all" }))
  const activeFilters = filters.filter(filter => filter.value !== "all").map(filter => `${filter.label}：${filter.options.find(option => option.value === filter.value)?.label}`)
  const matches = recordRows.filter((row, index) => row.tabIds?.includes(tab)
    && `${row.name} ${row.metadata}`.includes(search.trim())
    && filters.every(filter => filter.value === "all" || (filter.id === "type" ? row.type === filter.value
      : filter.id === "class" ? row.metadata.includes(filter.value)
      : filter.id === "time" ? (index < 10 ? "2026-10-01" : "2026-09-30") === filter.value : row.status?.label === filter.value)))
  const summary = search || activeFilters.length ? { label: `当前条件找到 ${matches.length} 条记录`, tone: "info" as const }
    : tab === "mine" ? recordBase.summary : { label: tab === "processing" ? "系统处理中 3 · 3 个批阅批次正在处理中 · 共 183 份答卷" : tab === "completed" ? "18 个批阅批次已完成 · 12 个已发布" : "全部记录 28 · 当前权限范围内的 28 个持久批阅记录", tone: "info" as const }
  const pageRows = matches.slice((page - 1) * pageSize, page * pageSize).map(row => longContent && row.id === "linear" ? { ...row,
    name: "一元二次方程与二次函数综合复习：配方法的完整推导、取等条件与结论核对",
    description: <span>核对最小值与取等条件：<math aria-label="f(x) 等于 x 的平方减二 x 减三"><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>−</mo><mn>3</mn></math></span>,
  } : row)
  return <>
    {externalNavigation && <nav aria-label="外部记录导航" className="mb-4 flex flex-wrap gap-2">
      {recordTabs.map(item => <Button key={item.id} variant="outline" aria-pressed={tab === item.id}
        size="default"
        onClick={() => { setTab(item.id); setPage(1) }}>{item.label}</Button>)}
    </nav>}
    <RecordList {...recordBase} tabs={externalNavigation ? undefined : recordTabs} tab={externalNavigation ? undefined : tab} search={search} filters={filters} activeFilters={activeFilters} rows={pageRows} summary={summary}
      state={matches.length ? { kind: "ready" } : { kind: "search-empty" }}
      pagination={{ page, pageSize: { value: pageSize, options: [5, 10, 20] }, pages: Array.from({ length: Math.ceil(matches.length / pageSize) }, (_, i) => i + 1), label: `第 ${page} 页 · 共 ${matches.length} 条记录` }}
      onTabChange={next => { setTab(next); setPage(1) }} onSearch={next => { setSearch(next); setPage(1) }}
      onFilterChange={(id, value) => { setValues({ ...values, [id]: value }); setPage(1) }} onClearFilters={() => { setValues({}); setPage(1) }} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); setNotice(`宿主已改为每页 ${size} 条并回到第 1 页`) }}
      onRowAction={(id, action) => setNotice(`记录 ${id}：请求 ${action}，等待调用方导航。`)}
      onRowMenu={(id, action) => setNotice(`记录 ${id}：请求 ${action}，等待调用方处理。`)}
      onPrimary={() => setNotice("已请求开始 AI 批阅，等待调用方导航。")}
      onRetry={() => setNotice("已请求重新加载，等待数据回执。")} {...overrides} />
    <Feedback>{notice}</Feedback>
  </>
}

export const homogeneousRecordRows: RecordListRow[] = [
  { id: "paper-algebra", type: "正式试卷", name: "一元二次方程与二次函数综合复习：配方法的完整推导、取等条件与结论核对", metadata: "九年级数学 · 20 题 · 满分 100 分",
    description: <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">已收藏</Badge><span>函数关系：<math aria-label="y 等于 x 的平方"><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup></math></span></div>,
    status: { label: "已保存", tone: "success" }, action: { id: "open", label: "查看试卷" }, menu: [{ id: "download", label: "下载试卷" }] },
  { id: "paper-geometry", type: "正式试卷", name: "相似三角形单元检测", metadata: "九年级数学 · 18 题 · 满分 100 分",
    status: { label: "已保存", tone: "success" }, action: { id: "open", label: "查看试卷" }, menu: [{ id: "download", label: "下载试卷" }] },
]

function HomogeneousRecordFixture() {
  const [notice, setNotice] = useState("尚无操作请求。")
  const [narrow, setNarrow] = useState(false)
  return <>
    <Button variant="outline" className="mb-4" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 同质列表</Button>
    <div style={narrow ? { width: 320, maxWidth: "100%" } : undefined}>
      <RecordList title="我的试卷" description="已保存的正式试卷，可查看或下载。" primaryLabel="新建试卷"
        searchLabel="搜索试卷" searchPlaceholder="搜索试卷名称" rows={homogeneousRecordRows} showType={false} showStatus={false}
        onPrimary={() => setNotice("已请求新建试卷，等待调用方导航。")}
        onRowAction={(id, action) => setNotice(`记录 ${id}：请求 ${action}，等待调用方导航。`)}
        onRowMenu={(id, action) => setNotice(`记录 ${id}：请求 ${action}，等待调用方处理。`)} />
    </div>
    <Feedback>{notice}</Feedback>
  </>
}

export function RecordListDemo() {
  const [narrow, setNarrow] = useState(false)
  return <>
    <DemoSection title="批阅记录 · 四个状态目录" description="控件使用 coss 标准尺寸，触屏点击目标至少 44px；标题与记录分区呈现；按外部分类查看记录，计数、摘要、进度和操作回执均由调用方提供。">
      <Button variant="outline" className="mb-4" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 窄容器</Button>
      <div style={narrow ? { width: 320, maxWidth: "100%" } : undefined}><RecordFixture /></div>
    </DemoSection>
    <DemoSection id="record-external-navigation" title="外部导航驱动、无内部 Tab" description="宿主导航先筛选、再分页；列表不传 tabs 与 tab，完整呈现当前页记录。">
      <RecordFixture externalNavigation />
    </DemoSection>
    <DemoSection id="record-homogeneous" title="同质列表 · 省略类型与状态" description="调用方为整张列表显式设置 showType=false、showStatus=false；已收藏标记、主操作与更多菜单保留。默认仍显示类型与状态，缺值仍显示未知。">
      <HomogeneousRecordFixture />
    </DemoSection>
    <DemoSection id="record-processing" title="系统处理中 · 3 个批阅批次"><RecordFixture initialTab="processing" /></DemoSection>
    <DemoSection id="record-completed" title="已完成 · 发布状态"><RecordFixture initialTab="completed" /></DemoSection>
    <DemoSection id="record-all" title="全部记录 · 28 个批阅批次"><RecordFixture initialTab="all" /></DemoSection>
    <DemoSection id="record-filtered" title="筛选中 · 九年级待复核"><RecordFixture filtered /></DemoSection>
    <DemoSection id="record-search-empty" title="搜索无结果"><RecordFixture initialSearch="不存在的批阅名称" /></DemoSection>
    <DemoSection id="record-empty" title="首次使用 · 暂无记录"><RecordFixture overrides={{ rows: [], tabs: recordTabs.map(tab => ({ ...tab, count: 0 })), state: { kind: "empty" } }} /></DemoSection>
    <DemoSection id="record-error" title="加载失败 · 可重试"><RecordFixture overrides={{ state: { kind: "error", reason: "批阅记录加载失败，当前结果可能不完整。请重试。" } }} /></DemoSection>
    <DemoSection id="record-loading" title="加载中"><RecordFixture overrides={{ state: { kind: "loading" } }} /></DemoSection>
    <DemoSection id="record-wide" title="1366px 宽容器" description="本区域保留 1366px 宽度，可横向滚动检查完整布局。">
      <div className="overflow-x-auto" role="region" aria-label="1366px 记录列表预览" tabIndex={0}><div className="w-[1366px]"><RecordFixture /></div></div>
    </DemoSection>
    <DemoSection id="record-themes" title="三主题 · 320px 长中文与公式">
      <div className="flex flex-wrap items-start gap-4">{(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} data-ui-version="coss-v1" className="w-80 max-w-full p-3">
        <p className="pb-3 text-item-title">{theme === "light" ? "浅色" : theme === "paper" ? "暖纸" : "深色"}</p>
        <RecordFixture longContent externalNavigation />
      </div>)}</div>
    </DemoSection>
  </>
}
