/** Evidence snapshot: docs/Agent组件进度清单.md (2026-09-27), categories from planning v0.1.3 §3.
 * Workspace validation is recorded evidence, never a claim of real-service integration.
 * Shared historical anchors remain in supplemental examples; new individual anchors disambiguate them.
 */
export type AgentComponentStatus = "workspace-validated" | "candidate" | "not-started"
export type AgentComponentEntry = {
  number: string
  slug: string
  name: string
  componentName: string
  category: { id: string; name: string }
  status: AgentComponentStatus
  twoState: "仅 Inline" | "Inline + 通用扩展容器" | "Inline + 专用扩展内容"
  carriers: { label: string; prs: string[] }
  unverified: string[]
}

export const agentComponentStatusLabels: Record<AgentComponentStatus, string> = {
  "workspace-validated": "Workspace 已验证", candidate: "组件候选", "not-started": "未开始",
}

export const agentComponentRegistry: readonly AgentComponentEntry[] = [
  {
    "number": "01",
    "slug": "object-picker",
    "name": "对象选择器",
    "componentName": "AgentObjectPicker",
    "category": {
      "id": "6.1",
      "name": "范围与对象"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "范围面板 · 任教班级",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/57",
        "https://github.com/Ashrum/ole-school-workbench/pull/21",
        "https://github.com/Ashrum/ole-school-workbench/pull/49"
      ]
    },
    "unverified": [
      "鼠标选择路径",
      "真实服务未验证"
    ]
  },
  {
    "number": "02",
    "slug": "scope-builder",
    "name": "范围构建器",
    "componentName": "AgentScopeBuilder",
    "category": {
      "id": "6.1",
      "name": "范围与对象"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "输入区 · 班级与资料来源范围",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/52",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/53",
        "https://github.com/Ashrum/ole-school-workbench/pull/19"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "03",
    "slug": "context-summary",
    "name": "上下文摘要",
    "componentName": "AgentContextSummary",
    "category": {
      "id": "6.1",
      "name": "范围与对象"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 通用扩展容器",
    "carriers": {
      "label": "同源任务记录 · 具体位置未记录",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/33",
        "https://github.com/Ashrum/ole-school-workbench/pull/10"
      ]
    },
    "unverified": [
      "浏览器结论本轮未核实；其他范围未记录",
      "真实服务未验证"
    ]
  },
  {
    "number": "04",
    "slug": "file-input",
    "name": "文件输入",
    "componentName": "AgentFileInput",
    "category": {
      "id": "6.2",
      "name": "输入与导入"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "Agent 输入区 · 示例材料与本机文件",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/45",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/46",
        "https://github.com/Ashrum/ole-school-workbench/pull/15",
        "https://github.com/Ashrum/ole-school-workbench/pull/16"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "05",
    "slug": "capture-scan",
    "name": "采集扫描",
    "componentName": "AgentCaptureScan",
    "category": {
      "id": "6.2",
      "name": "输入与导入"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 · 四页示例页集合",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/83",
        "https://github.com/Ashrum/ole-school-workbench/pull/36",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/88",
        "https://github.com/Ashrum/ole-school-workbench/pull/44"
      ]
    },
    "unverified": [
      "三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "06",
    "slug": "content-input",
    "name": "内容输入",
    "componentName": "AgentContentInput",
    "category": {
      "id": "6.2",
      "name": "输入与导入"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 校对 · 题干输入",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/61",
        "https://github.com/Ashrum/ole-school-workbench/pull/23",
        "https://github.com/Ashrum/ole-school-workbench/pull/48"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "07",
    "slug": "parameter-config",
    "name": "参数配置器",
    "componentName": "AgentParameterConfig",
    "category": {
      "id": "6.3",
      "name": "参数配置"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "G02 批阅工作记录 · 参数预览",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/70",
        "https://github.com/Ashrum/ole-school-workbench/pull/28",
        "https://github.com/Ashrum/ole-school-workbench/pull/44"
      ]
    },
    "unverified": [
      "跨页变化提示、跨标签页、写入失败注入、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "08",
    "slug": "constraint-builder",
    "name": "约束构建器",
    "componentName": "AgentConstraintBuilder",
    "category": {
      "id": "6.3",
      "name": "参数配置"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 执行确认 · 处理条件",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/64",
        "https://github.com/Ashrum/ole-school-workbench/pull/25",
        "https://github.com/Ashrum/ole-school-workbench/pull/49"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "09",
    "slug": "template-picker",
    "name": "模板选择器",
    "componentName": "AgentTemplatePicker",
    "category": {
      "id": "6.3",
      "name": "参数配置"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "编排记录 · 试卷模板（模拟）",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/100",
        "https://github.com/Ashrum/ole-school-workbench/pull/68"
      ]
    },
    "unverified": [
      "三主题、320px、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "10",
    "slug": "candidate-picker",
    "name": "候选选择器",
    "componentName": "AgentCandidatePicker",
    "category": {
      "id": "6.4",
      "name": "选择与组合"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "Q01 示例练习 · 三题候选与本机题篮",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/72",
        "https://github.com/Ashrum/ole-school-workbench/pull/29"
      ]
    },
    "unverified": [
      "题篮移除后重选、写入部分失败、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "11",
    "slug": "collection-basket",
    "name": "集合篮",
    "componentName": "AgentCollectionBasket",
    "category": {
      "id": "6.4",
      "name": "选择与组合"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "全局题篮 · 对话摘要与右栏管理",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/48",
        "https://github.com/Ashrum/ole-school-workbench/pull/17"
      ]
    },
    "unverified": [
      "总分、清空、排序未接入",
      "真实服务未验证"
    ]
  },
  {
    "number": "12",
    "slug": "structure-arranger",
    "name": "结构编排器",
    "componentName": "AgentStructureArranger",
    "category": {
      "id": "6.4",
      "name": "选择与组合"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "编排草稿记录 · 题目顺序与分值",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/79",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/82",
        "https://github.com/Ashrum/ole-school-workbench/pull/33",
        "https://github.com/Ashrum/ole-school-workbench/pull/34",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/88",
        "https://github.com/Ashrum/ole-school-workbench/pull/44"
      ]
    },
    "unverified": [
      "三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "13",
    "slug": "artifact-preview",
    "name": "摘要预览",
    "componentName": "AgentArtifactPreview",
    "category": {
      "id": "6.5",
      "name": "预览与查看"
    },
    "status": "workspace-validated",
    "twoState": "仅 Inline",
    "carriers": {
      "label": "P04 连续流程 · 成果摘要",
      "prs": [
        "https://github.com/Ashrum/ole-school-workbench/pull/7"
      ]
    },
    "unverified": [
      "浏览器结论本轮未核实；其他范围未记录",
      "真实服务未验证"
    ]
  },
  {
    "number": "14",
    "slug": "object-viewer",
    "name": "对象查看器",
    "componentName": "AgentObjectViewer",
    "category": {
      "id": "6.5",
      "name": "预览与查看"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 通用扩展容器",
    "carriers": {
      "label": "示例练习 · 单题查看",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/50",
        "https://github.com/Ashrum/ole-school-workbench/pull/18",
        "https://github.com/Ashrum/ole-school-workbench/pull/48"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "15",
    "slug": "change-set",
    "name": "对比查看器",
    "componentName": "AgentChangeSet",
    "category": {
      "id": "6.5",
      "name": "预览与查看"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 · 修改对照",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/31",
        "https://github.com/Ashrum/ole-school-workbench/pull/8"
      ]
    },
    "unverified": [
      "浏览器结论本轮未核实；其他范围未记录",
      "真实服务未验证"
    ]
  },
  {
    "number": "16",
    "slug": "review-queue",
    "name": "审核队列",
    "componentName": "AgentReviewQueue",
    "category": {
      "id": "6.6",
      "name": "审核与修订"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 · 三题审核队列",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/59",
        "https://github.com/Ashrum/ole-school-workbench/pull/22"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "17",
    "slug": "item-reviewer",
    "name": "单项复核器",
    "componentName": "AgentItemReviewer",
    "category": {
      "id": "6.6",
      "name": "审核与修订"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 · 逐题复核",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/40",
        "https://github.com/Ashrum/ole-school-workbench/pull/13"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "18",
    "slug": "exception-handler",
    "name": "异常处理器",
    "componentName": "AgentExceptionHandler",
    "category": {
      "id": "6.6",
      "name": "审核与修订"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 试验台 · 异常处置",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/36",
        "https://github.com/Ashrum/ole-school-workbench/pull/11"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "19",
    "slug": "metric-summary",
    "name": "指标摘要",
    "componentName": "AgentMetricSummary",
    "category": {
      "id": "6.7",
      "name": "分析与诊断"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "工作记录预览 · 得分率等指标",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/55",
        "https://github.com/Ashrum/ole-school-workbench/pull/20"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "20",
    "slug": "distribution-matrix",
    "name": "分布矩阵",
    "componentName": "AgentDistributionMatrix",
    "category": {
      "id": "6.7",
      "name": "分析与诊断"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "已完成批阅记录 · 本次作答分布",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/92",
        "https://github.com/Ashrum/ole-school-workbench/pull/50"
      ]
    },
    "unverified": [
      "维度切换与比较的浏览器操作、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "21",
    "slug": "evidence-drilldown",
    "name": "下钻与证据浏览",
    "componentName": "AgentEvidenceDrilldown",
    "category": {
      "id": "6.7",
      "name": "分析与诊断"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 第 2 题 · 证据链",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/38",
        "https://github.com/Ashrum/ole-school-workbench/pull/12"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "22",
    "slug": "suggestion-set",
    "name": "建议集",
    "componentName": "AgentSuggestionSet",
    "category": {
      "id": "6.8",
      "name": "计划与建议"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "已完成批阅记录 · 教学行动建议（通用示例）",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/74",
        "https://github.com/Ashrum/ole-school-workbench/pull/30"
      ]
    },
    "unverified": [
      "比较两条、调整字段、驳回原因、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "23",
    "slug": "plan-builder",
    "name": "计划构建器",
    "componentName": "AgentPlanBuilder",
    "category": {
      "id": "6.8",
      "name": "计划与建议"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "教学行动记录 · 计划草稿",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/80",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/82",
        "https://github.com/Ashrum/ole-school-workbench/pull/35",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/88",
        "https://github.com/Ashrum/ole-school-workbench/pull/44"
      ]
    },
    "unverified": [
      "实际创建任务与去重、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "24",
    "slug": "path-priority",
    "name": "路径与优先级",
    "componentName": "AgentPathPriority",
    "category": {
      "id": "6.8",
      "name": "计划与建议"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "教学行动记录 · 跟进顺序",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/81",
        "https://github.com/Ashrum/ole-school-workbench/pull/38",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/88",
        "https://github.com/Ashrum/ole-school-workbench/pull/44"
      ]
    },
    "unverified": [
      "多条行动重排、原行动页复盘返回、三主题、窄屏、读屏器、路径持久化",
      "真实服务未验证"
    ]
  },
  {
    "number": "25",
    "slug": "execution-confirmation",
    "name": "执行确认",
    "componentName": "AgentExecutionConfirmation",
    "category": {
      "id": "6.9",
      "name": "执行与追踪"
    },
    "status": "workspace-validated",
    "twoState": "仅 Inline",
    "carriers": {
      "label": "P04 连续流程 · 执行确认",
      "prs": [
        "https://github.com/Ashrum/ole-school-workbench/pull/7"
      ]
    },
    "unverified": [
      "浏览器结论本轮未核实；其他范围未记录",
      "真实服务未验证"
    ]
  },
  {
    "number": "26",
    "slug": "execution-progress",
    "name": "任务进度",
    "componentName": "AgentExecutionProgress",
    "category": {
      "id": "6.9",
      "name": "执行与追踪"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 通用扩展容器",
    "carriers": {
      "label": "同源任务记录 · 具体位置未记录",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/33",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/34",
        "https://github.com/Ashrum/ole-school-workbench/pull/10"
      ]
    },
    "unverified": [
      "浏览器结论本轮未核实；其他范围未记录",
      "真实服务未验证"
    ]
  },
  {
    "number": "27",
    "slug": "execution-result",
    "name": "执行结果",
    "componentName": "AgentExecutionResult",
    "category": {
      "id": "6.9",
      "name": "执行与追踪"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 通用扩展容器",
    "carriers": {
      "label": "同源任务记录 · 具体位置未记录",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/33",
        "https://github.com/Ashrum/intelligence-prism-ui/pull/34",
        "https://github.com/Ashrum/ole-school-workbench/pull/10"
      ]
    },
    "unverified": [
      "浏览器结论本轮未核实；其他范围未记录",
      "真实服务未验证"
    ]
  },
  {
    "number": "28",
    "slug": "document-workspace",
    "name": "文档工作区",
    "componentName": "AgentDocumentWorkspace",
    "category": {
      "id": "6.10",
      "name": "内容与成果物"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "备课提纲对象 · 章节编辑",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/43",
        "https://github.com/Ashrum/ole-school-workbench/pull/14"
      ]
    },
    "unverified": [
      "真实服务未验证",
      "其他未验证范围未记录"
    ]
  },
  {
    "number": "29",
    "slug": "slide-workspace",
    "name": "演示文稿工作区",
    "componentName": "AgentSlideWorkspace",
    "category": {
      "id": "6.10",
      "name": "内容与成果物"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "备课提纲 · 课件（模拟）",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/104",
        "https://github.com/Ashrum/ole-school-workbench/pull/72"
      ]
    },
    "unverified": [
      "三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "30",
    "slug": "image-canvas",
    "name": "图像查看与画布",
    "componentName": "AgentImageCanvas",
    "category": {
      "id": "6.10",
      "name": "内容与成果物"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 第 1 页 · 图片查看",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/101",
        "https://github.com/Ashrum/ole-school-workbench/pull/69"
      ]
    },
    "unverified": [
      "三主题、320px、触屏框选、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "31",
    "slug": "audio-transcript",
    "name": "音频与转写",
    "componentName": "AgentAudioTranscript",
    "category": {
      "id": "6.10",
      "name": "内容与成果物"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "输入材料 · 示例课堂录音",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/105",
        "https://github.com/Ashrum/ole-school-workbench/pull/73"
      ]
    },
    "unverified": [
      "实际播放（无媒体源）、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "32",
    "slug": "video-timeline",
    "name": "视频与时间轴",
    "componentName": "AgentVideoTimeline",
    "category": {
      "id": "6.10",
      "name": "内容与成果物"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "输入材料 · 示例教学视频",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/105",
        "https://github.com/Ashrum/ole-school-workbench/pull/73"
      ]
    },
    "unverified": [
      "实际播放（无媒体源）、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "33",
    "slug": "artifact-output",
    "name": "成果物输出",
    "componentName": "AgentArtifactOutput",
    "category": {
      "id": "6.10",
      "name": "内容与成果物"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 去向与组卷页 · 打印预览",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/66",
        "https://github.com/Ashrum/ole-school-workbench/pull/26",
        "https://github.com/Ashrum/ole-school-workbench/pull/49"
      ]
    },
    "unverified": [
      "实际纸面打印",
      "真实服务未验证"
    ]
  },
  {
    "number": "34",
    "slug": "relation-graph",
    "name": "图形关系工作区",
    "componentName": "AgentRelationGraph",
    "category": {
      "id": "6.10",
      "name": "内容与成果物"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "编排记录 · 知识点覆盖（模拟）",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/103",
        "https://github.com/Ashrum/ole-school-workbench/pull/71"
      ]
    },
    "unverified": [
      "三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "35",
    "slug": "structured-content",
    "name": "结构化内容工作区",
    "componentName": "AgentStructuredContent",
    "category": {
      "id": "6.10",
      "name": "内容与成果物"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "备课提纲对象 · 正文与结构",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/68",
        "https://github.com/Ashrum/ole-school-workbench/pull/27",
        "https://github.com/Ashrum/ole-school-workbench/pull/48"
      ]
    },
    "unverified": [
      "拖拽、触屏、390/320px、200% 放大、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "36",
    "slug": "resource-retriever",
    "name": "资源检索器",
    "componentName": "AgentResourceRetriever",
    "category": {
      "id": "6.11",
      "name": "教学资源与素材"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "资源与产出 → 来源 · 本机标题查询",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/76",
        "https://github.com/Ashrum/ole-school-workbench/pull/31"
      ]
    },
    "unverified": [
      "P04 回归、会话隔离与刷新仅自动化、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "37",
    "slug": "material-extractor",
    "name": "素材提取器",
    "componentName": "AgentMaterialExtractor",
    "category": {
      "id": "6.11",
      "name": "教学资源与素材"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "备课提纲选段 → 会话素材包",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/97",
        "https://github.com/Ashrum/ole-school-workbench/pull/56"
      ]
    },
    "unverified": [
      "题干与资源来源路径、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "38",
    "slug": "material-pack",
    "name": "素材包",
    "componentName": "AgentMaterialPack",
    "category": {
      "id": "6.11",
      "name": "教学资源与素材"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "资源与产出 → 来源 · 整理素材包",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/84",
        "https://github.com/Ashrum/ole-school-workbench/pull/37",
        "https://github.com/Ashrum/ole-school-workbench/pull/44"
      ]
    },
    "unverified": [
      "三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "39",
    "slug": "interactive-demo",
    "name": "交互演示器",
    "componentName": "AgentInteractiveDemo",
    "category": {
      "id": "6.12",
      "name": "学科工具"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "备课提纲 · 课堂演示（模拟）",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/106",
        "https://github.com/Ashrum/ole-school-workbench/pull/74"
      ]
    },
    "unverified": [
      "三主题、窄屏、触控滑块、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "40",
    "slug": "calc-tool",
    "name": "计算与分析工具",
    "componentName": "AgentCalcTool",
    "category": {
      "id": "6.12",
      "name": "学科工具"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 导入批次 · 答案／解析旁计算核对（模拟）",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/102",
        "https://github.com/Ashrum/ole-school-workbench/pull/70"
      ]
    },
    "unverified": [
      "三主题、窄屏、读屏器；单选阻断与版本失效仅单测",
      "真实服务未验证"
    ]
  },
  {
    "number": "41",
    "slug": "simulation-lab",
    "name": "模拟器 / 虚拟实验",
    "componentName": "AgentSimulationLab",
    "category": {
      "id": "6.12",
      "name": "学科工具"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "备课提纲 · 课堂实验（模拟）",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/106",
        "https://github.com/Ashrum/ole-school-workbench/pull/74"
      ]
    },
    "unverified": [
      "三主题、窄屏、触控滑块、读屏器",
      "真实服务未验证"
    ]
  },
  {
    "number": "42",
    "slug": "subject-editor",
    "name": "学科专用编辑器",
    "componentName": "AgentSubjectEditor",
    "category": {
      "id": "6.12",
      "name": "学科工具"
    },
    "status": "workspace-validated",
    "twoState": "Inline + 专用扩展内容",
    "carriers": {
      "label": "P04 题干 · 编辑公式",
      "prs": [
        "https://github.com/Ashrum/intelligence-prism-ui/pull/96",
        "https://github.com/Ashrum/ole-school-workbench/pull/55",
        "https://github.com/Ashrum/ole-school-workbench/pull/53"
      ]
    },
    "unverified": [
      "提纲路径、三主题、窄屏、读屏器",
      "真实服务未验证"
    ]
  }
]

export const agentComponentCategories = Array.from(new Map(agentComponentRegistry.map(entry => [entry.category.id, entry.category])).values())

export function filterAgentComponents(query: string, status: AgentComponentStatus | "all" = "all") {
  const term = query.trim().toLocaleLowerCase()
  return agentComponentRegistry.filter(entry => (status === "all" || entry.status === status) &&
    `${entry.number} ${entry.name} ${entry.componentName}`.toLocaleLowerCase().includes(term))
}

export const agentComponentStatusCounts = {
  "workspace-validated": agentComponentRegistry.filter(entry => entry.status === "workspace-validated").length,
  candidate: agentComponentRegistry.filter(entry => entry.status === "candidate").length,
  "not-started": agentComponentRegistry.filter(entry => entry.status === "not-started").length,
}
