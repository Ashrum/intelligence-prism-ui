import type { FilterDimension, ResourceFilterIntent, ResourceFilterValue } from "../resource-filter-types"

export type FilterScale = "current" | "future"
const dimension = (id: string, label: string, mode: FilterDimension["mode"], labels: string[], common = false): FilterDimension => ({
  id, label, mode, common,
  options: labels.map((label, index) => ({ id: `${id}-${index}`, label, ...(index === 1 ? {} : { count: index === 2 ? 0 : 128 - index * 9 }) })),
})

export function filterFixture(scale: FilterScale, counts = true): FilterDimension[] {
  const type = dimension("type", "题型", "multiple", ["单选题", "多选题", "判断题", "填空题", "解答题", "计算题", "证明题", "作图题", "实验探究题", "阅读理解题", "材料分析题", "跨学科综合实践与开放性探究题"].slice(0, scale === "current" ? 4 : 12), true)
  const difficulty = dimension("difficulty", "难度", "single", ["基础", "巩固", "提升"], true)
  difficulty.options = difficulty.options.map((option, index) => ({ ...option, count: [68, 42, 18][index], tone: (["success", "info", "warning"] as const)[index] }))
  difficulty.description = "基础：直接运用概念；巩固：组合运用方法；提升：综合推理与迁移。"
  const source = dimension("source", "来源", "multiple", ["校本", "个人", "区域共享", "教材配套", "教研共同体", "公开试卷", "出版社资源", "高校合作", "第三方题库", "跨区域联合教研与课题研究资源库（公开授权）"].slice(0, scale === "current" ? 2 : 10))
  const dimensions = scale === "current" ? [type, difficulty, source] : [
    type, difficulty,
    dimension("scenario", "使用场景", "multiple", ["课前预习", "课堂练习", "课后作业", "单元复习", "阶段检测", "学情诊断", "分层辅导", "综合实践"]),
    source,
    dimension("year", "年份", "single", ["2026", "2025", "2024", "2023", "2022", "2021"]),
    dimension("region", "地区", "multiple", ["全国", "北京", "上海", "广东", "江苏", "浙江", "山东", "四川"]),
  ]
  return counts ? dimensions : dimensions.map(item => ({ ...item, options: item.options.map(({ count: _count, ...option }) => option) }))
}

export const filterSortItems = [
  { id: "relevance", label: "综合" }, { id: "latest", label: "最新" }, { id: "popular", label: "热门" }, { id: "difficulty", label: "难度" },
]
export function initialFilterValue(): ResourceFilterValue {
  return { filters: {}, sort: "relevance", favoritesOnly: false, search: "" }
}

/** Exploration host only: no matching engine, requests or fabricated query counts. */
export function applyFilterIntent(value: ResourceFilterValue, intent: ResourceFilterIntent): ResourceFilterValue {
  switch (intent.type) {
    case "filter": return { ...value, filters: { ...value.filters, [intent.dimensionId]: intent.values } }
    case "sort": return { ...value, sort: intent.value }
    case "favorites": return { ...value, favoritesOnly: intent.value }
    case "search": return { ...value, search: intent.value }
    case "reset": return initialFilterValue()
  }
}

/** Preselected review fixture; reset still clears every filter. */
export function previewFilterValue(scale: FilterScale): ResourceFilterValue {
  return { ...initialFilterValue(), filters: {
    type: ["type-0", "type-3"], difficulty: ["difficulty-1"],
    ...(scale === "future" ? { scenario: ["scenario-1"] } : {}),
  } }
}
