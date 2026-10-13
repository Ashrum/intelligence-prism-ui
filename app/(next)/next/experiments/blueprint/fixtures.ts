import type { AgentStep } from "@/components/prism-next/agent-components"

/** Fixed v0.1 C fixture. UI controls never advance these task facts. */
export const taskSteps: readonly AgentStep[] = [
  { id: "structure", label: "试卷结构化", detail: "题目与作答已关联", state: "done" },
  { id: "grading", label: "批阅结果校验", detail: "识别分数与评分依据", state: "done" },
  { id: "evidence", label: "证据聚合与诊断", detail: "3 项证据等待复核", state: "running" },
  { id: "report", label: "生成分析报告", detail: "需教师确认后发布", state: "pending" },
]

export const taskMetrics = [
  { value: "42", label: "试题" },
  { value: "36", label: "份作答" },
  { value: "03", label: "待复核项" },
] as const

export const evidenceItems = [
  { id: "ev1", title: "函数单调性 · 评分依据", location: "试卷第 12 题 · 批阅记录" },
  { id: "ev2", title: "导数应用 · 作答缺页", location: "第 19 题 · 第 3 页" },
  { id: "ev3", title: "知识点归属 · 待确认", location: "第 27 题 · 标注候选" },
] as const

export const taskDetails = {
  task: {
    title: "任务详情",
    description: "任务目标是解释一次已批阅的函数与导数单元测试，不构建长期画像。分析结果经教师复核后，才允许形成正式报告。",
    rows: [["输入", "已批阅试卷 × 36 份"], ["分析范围", "函数与导数 · 42 道题"], ["处理状态", "证据聚合中，报告尚未确认"], ["业务责任", "教师确认最终判断"]],
  },
  history: {
    title: "任务记录",
    description: "这里展示一次静态模拟的任务记录。演示页面不包含后端执行、保存或历史版本取回。",
    rows: [["10:08", "收到本次试卷材料"], ["10:10", "试卷结构化完成"], ["10:12", "批阅结果校验完成"], ["10:14", "开始证据聚合及异常复核"]],
  },
  ev1: {
    title: "评分依据 · 待复核",
    description: "试卷第 12 题的评分依据与部分作答不完全一致，需教师查看原始批阅记录后确认。",
    rows: [["证据来源", "第 12 题 · 批阅结果"], ["候选问题", "步骤得分解释可能不足"], ["当前状态", "待教师复核"], ["影响范围", "不自动修改原始评分"]],
  },
  ev2: {
    title: "作答缺页 · 待复核",
    description: "第 19 题的第 3 页作答可能缺失，当前只能将相关证据视为不完整。",
    rows: [["证据来源", "第 19 题 · 作答图像"], ["候选问题", "第三页未关联"], ["当前状态", "等待补充材料"], ["影响范围", "该题诊断暂不确认"]],
  },
  ev3: {
    title: "知识点归属 · 待确认",
    description: "第 27 题存在两个相邻知识点候选；无法仅根据相似度直接确认最终归属。",
    rows: [["证据来源", "题目内容与标注候选"], ["候选归属", "导数应用 / 函数最值"], ["当前状态", "待人工审核"], ["影响范围", "不写入正式知识图谱"]],
  },
  report: {
    title: "学情分析报告 · 结构草案",
    description: "此处仅为报告框架准备状态。证据复核未完成，尚未生成正式报告，也未形成最终诊断。",
    rows: [["章节框架", "预置 7 / 9 个章节"], ["数据完整性", "3 个待复核项"], ["发布状态", "未确认，不可作为正式学情结论"], ["下一步", "查看证据 → 教师确认 → 继续生成"]],
  },
  source: {
    title: "数据来源与可信度",
    description: "示例数据专用于版式实验。所有数字、时间、题目与任务状态均为模拟，并非学校真实记录。",
    rows: [["输入类型", "已批阅试卷"], ["记录类型", "试题、作答、评分依据、证据候选"], ["可验证性", "仅模拟 UI 的来源展示"], ["数据持久化", "未接入"]],
  },
} as const

export type TaskDetailKey = keyof typeof taskDetails
export type BlueprintStage = "refined" | "original"
export type BlueprintTheme = "light" | "paper" | "dark"

export const originalReferenceHref = "/experiments/blueprint/OLE_Prism_Blueprint_Experiment_v0.1.html"

export const refinementNotes = {
  structure: "全宽工作纸面、共用标题基线和轻淡纵向分隔共同建立三区秩序；顶部刻度只辅助定位。",
  transition: "图框留在页面外层，内部直接使用当前智能曜彩组件。摘要以横向信息带连接页头与工作区。",
  reading: "保留 14 / 16px 语义字号，通过列宽、间距和紧凑输入变体控制密度；全部关键数字在窄屏保留。",
} as const
