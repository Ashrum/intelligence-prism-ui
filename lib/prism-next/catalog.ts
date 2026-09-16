export type ComponentEntry = { id:string; title:string; summary:string; kind?:"pattern"|"extension"; sourceUrl?:string; sourceLabel?:string }
export type ComponentGroup = { id:string; title:string; items:ComponentEntry[] }
const item = (id:string,title:string,summary:string):ComponentEntry => ({id,title,summary})
export const componentGroups:ComponentGroup[] = [
  { id:"actions",title:"操作与命令",items:[
    item("button","Button 按钮","主要、次要、危险、图标与加载操作。"),
    item("group","Group 控件组","将相关操作连为一组，保留统一尺寸。"),
    item("toggle","Toggle 切换按钮","切换单个选项的开启状态。"),
    item("toggle-group","Toggle Group 切换组","在多个格式或视图中选择。"),
    item("toolbar","Toolbar 工具栏","集中相关操作并支持方向键移动。"),
    item("command","Command 命令面板","通过搜索定位并执行命令。"),
  ]},
  { id:"forms",title:"输入与选择",items:[
    item("input","Input 输入框","固定标签、清楚的边界与三档原生尺寸。"),
    item("input-group","Input Group 输入组合","在输入项内组合单位、图标与操作。"),
    item("textarea","Textarea 多行输入","允许长内容自然增高。"),
    item("field","Field 字段","关联标签、说明和就地校验反馈。"),
    item("fieldset","Fieldset 字段组","为一组相关字段提供共同标题。"),
    item("form","Form 表单","提交、校验与错误恢复形成完整操作。"),
    item("label","Label 标签","字段身份始终清楚可见。"),
    item("select","Select 选择框","使用 coss 完整列表、选中标记和键盘行为。"),
    item("combobox","Combobox 可搜索选择","在已知选项中搜索并选择。"),
    item("autocomplete","Autocomplete 自动补全","输入自由文本并获得候选建议。"),
    item("number-field","Number Field 数字输入","步进、范围限制与数值格式化。"),
    item("checkbox","Checkbox 复选框","独立确认或多项选择。"),
    item("checkbox-group","Checkbox Group 复选组","组织相关的多选项。"),
    item("radio-group","Radio Group 单选组","直接展示互斥选项。"),
    item("switch","Switch 开关","立即开启或关闭一个功能。"),
    item("slider","Slider 滑杆","在数值范围内连续调整。"),
    item("otp-field","OTP Field 验证码","输入并粘贴连续的验证码。"),
    item("calendar","Calendar 日历","选择日期，支持月份导航。"),
    { ...item("date-picker","Date Picker 日期选择","单日、日期范围与快捷日期；由日历和弹层组合。"), kind:"pattern" },
  ]},
  { id:"navigation",title:"导航",items:[
    item("breadcrumb","Breadcrumb 面包屑","表达当前位置和上级路径。"),
    item("tabs","Tabs 标签页","切换同一对象下的相关内容。"),
    item("pagination","Pagination 分页","在明确的数据页之间移动。"),
    item("sidebar","Sidebar 侧栏","桌面导航、折叠与移动端抽屉。"),
    { ...item("tree","Tree 教材目录","完整树与弹出选择器；提供 2—5 级示例、父子联动与清楚的层级关系。"), kind:"extension", sourceUrl:"https://coss.com/origin/tree" },
  ]},
  { id:"content",title:"内容与数据",items:[
    {...item("icons","Icons 图标","搜索 41 个常用图标，统一名称、用途、尺寸与主题颜色。"),kind:"extension",sourceUrl:"https://lucide.dev/icons",sourceLabel:"Lucide"},
    { ...item("question","Question 题目","独立题面、可选详情与操作插槽；按需组合选择、编排、作答和复核。"), kind:"pattern", sourceUrl:"https://coss.com/ui", sourceLabel:"coss 基础组件" },
    {...item("answer-review-map","Document Region 文档区域","传入文档内容与区域坐标，支持缩放、选中与定位。"),kind:"pattern",sourceUrl:"https://coss.com/ui/docs/components/drawer",sourceLabel:"coss Drawer 组合"},
    item("avatar","Avatar 头像","24—96px 六档尺寸，图像缺失时显示文字回退。"),
    item("badge","Badge 标签","以文字与适量颜色表达状态。"),
    item("card","Card 卡片","内容、横向条目、指标、人物、选择与分组等常见组合。"),
    item("frame","Frame 内容框架","承载带标题、说明与底部操作的面板。"),
    item("table","Table 表格","清晰对齐文本与数值列。"),
    item("accordion","Accordion 折叠组","按需展开多项相关说明。"),
    item("collapsible","Collapsible 展开区","就地展开补充信息。"),
    item("kbd","Kbd 快捷键","为操作标注键盘快捷方式。"),
  ]},
  { id:"agent",title:"Agent",items:[
    {...item("agent-components","Agent 任务组件","独立任务输入与步骤进度，不绑定模型或演示执行器。"),kind:"pattern",sourceUrl:"https://coss.com/ui",sourceLabel:"coss 基础组件"},
  ]},
  { id:"learning",title:"评价与学习支持",items:[
    {...item("goal-milestones","Milestones 里程碑","接收节点、说明和状态，不依赖目标工作流。"),kind:"pattern",sourceUrl:"https://coss.com/ui",sourceLabel:"coss 基础组件"},
    {...item("workload-calendar","Workload 负荷日历","接收每日数值、容量与选中日期，可用于任务或资源安排。"),kind:"pattern",sourceUrl:"https://coss.com/ui/docs/components/calendar",sourceLabel:"coss Calendar / DayPicker"},

    { ...item("evaluation","Evaluation 评价","接收题目、作答与评分规则，逐项编辑并返回复核结果。"), kind:"pattern", sourceUrl:"https://coss.com/ui", sourceLabel:"coss 基础组件" },
    { ...item("diagnosis","Diagnosis 诊断","展示观察、来源、状态与证据操作，由外部提供判断。"), kind:"pattern", sourceUrl:"https://coss.com/ui", sourceLabel:"coss 基础组件" },
    { ...item("goals","Goals 目标规划","目标卡片与逐项核验字段，可独立接入不同目标流程。"), kind:"pattern", sourceUrl:"https://coss.com/ui", sourceLabel:"coss 基础组件" },
    { ...item("learning-plan","Learning Plan 学习计划","任务列表接收日期、条件、状态与操作，流程由调用方组织。"), kind:"pattern", sourceUrl:"https://coss.com/ui", sourceLabel:"coss 基础组件" },
  ]},
  { id:"analytics",title:"数据分析",items:[
    {...item("paired-dot-chart","Paired Dots 成对指标","同一刻度比较两个指标，支持缺测、边界与项目选择。"),kind:"extension",sourceUrl:"https://echarts.apache.org/examples/en/index.html",sourceLabel:"Apache ECharts"},
    {...item("quadrant-chart","Quadrant 四象限","自定义阈值、象限、分组点形和坐标范围。"),kind:"extension",sourceUrl:"https://echarts.apache.org/examples/en/index.html",sourceLabel:"Apache ECharts"},
    {...item("combo-chart","Combo 柱线组合","柱形与折线共同呈现，各系列明确绑定单位和坐标轴。"),kind:"extension",sourceUrl:"https://echarts.apache.org/examples/en/index.html",sourceLabel:"Apache ECharts"},
    {...item("evidence-matrix","Heatmap 热力矩阵","行列、单元格、标签与选择事件；区分零值与缺测。"),kind:"pattern",sourceUrl:"https://echarts.apache.org/examples/en/index.html",sourceLabel:"Apache ECharts"},
    {...item("scatter-chart","Scatter 散点图","展示两项数值的关系，接收坐标、标签与选择事件。"),kind:"extension",sourceUrl:"https://echarts.apache.org/examples/en/index.html",sourceLabel:"Apache ECharts"},
    {...item("box-plot","Box Plot 箱线图","接收五数摘要，比较不同分组的分布。"),kind:"extension",sourceUrl:"https://echarts.apache.org/examples/en/index.html",sourceLabel:"Apache ECharts"},
    {...item("metric-summary","Metric 指标摘要","显示数值、单位、有效样本和统计分母。"),kind:"pattern"},
    {...item("trend-chart","Trend 趋势","固定尺度，区分缺测和零分，保留时间断点。"),kind:"extension",sourceUrl:"https://ui.shadcn.com/docs/components/base/chart",sourceLabel:"Recharts / shadcn Chart 组合方式"},
    {...item("comparison-chart","Comparison 比较","横向或纵向比较任意分类数据，接收标签、单位和点击回调。"),kind:"extension",sourceUrl:"https://ui.shadcn.com/docs/components/base/chart",sourceLabel:"Recharts / shadcn Chart 组合方式"},
    {...item("distribution-chart","Distribution 分布","展示外部已统计的区间频数，不在组件内固定分箱规则。"),kind:"extension",sourceUrl:"https://ui.shadcn.com/docs/components/base/chart",sourceLabel:"Recharts / shadcn Chart 组合方式"},
    {...item("goal-comparison","Goal Comparison 目标对照","接收基线、当前值、目标与单位；数值进展和业务判断分离。"),kind:"pattern"},
    {...item("status-composition","Composition 状态组成","分类数量与占比并列，支持选择、缺测和六分类配色。"),kind:"pattern",sourceUrl:"https://coss.com/ui",sourceLabel:"coss 基础组件"},
    {...item("analysis-filter","Analysis Filter 分析筛选","字段定义、选项、值与变更事件由外部提供。"),kind:"pattern"},
    {...item("evidence-table","Evidence 分析证据","接收记录、列定义及查看回调，不绑定特定证据数据。"),kind:"pattern"},
  ]},
  { id:"feedback",title:"反馈与状态",items:[
    item("alert","Alert 提示","提供需要阅读的就地说明。"),
    item("empty","Empty 空状态","解释当前没有内容的原因与下一步。"),
    item("progress","Progress 进度","表达已知进度或等待状态。"),
    item("meter","Meter 度量","在范围内显示当前数值。"),
    item("skeleton","Skeleton 骨架","预留加载内容的实际结构。"),
    item("spinner","Spinner 加载指示","随操作表达短暂等待。"),
    item("toast","Toast 短时通知","非阻断地确认操作结果。"),
  ]},
  { id:"overlays",title:"浮层与菜单",items:[
    item("menu","Menu 菜单","集中对象的次要操作。"),
    item("context-menu","Context Menu 上下文菜单","为当前对象提供上下文操作。"),
    item("dialog","Dialog 对话框","完成临时、聚焦的编辑任务。"),
    item("alert-dialog","Alert Dialog 确认对话框","在有影响的操作前说明对象与结果。"),
    item("drawer","Drawer 抽屉","从屏幕边缘展开补充任务。"),
    item("sheet","Sheet 侧面板","在保留上下文时查看与编辑详情。"),
    item("popover","Popover 弹出面板","就近展开短小的设置。"),
    item("preview-card","Preview Card 预览","预览链接对象的补充信息。"),
    item("tooltip","Tooltip 工具提示","补充简短说明，支持键盘焦点。"),
  ]},
  { id:"layout",title:"布局与滚动",items:[
    item("scroll-area","Scroll Area 滚动区域","在有限空间内保留可访问的长内容。"),
    item("separator","Separator 分隔线","在必要处表达内容边界。"),
  ]},
]
export const components = componentGroups.flatMap(group=>group.items)
export function findComponent(id:string) { return components.find(item=>item.id===id) }

export const applicationExamples=[
 {id:"questions",title:"题库与打印组合",summary:"验证题卡、试题篮、组卷与打印预览的组合。"},
 {id:"evaluation",title:"学习支持流程",summary:"在一个示例内切换评价、诊断、目标与计划。"},
]
// Keep old bookmarks useful without keeping duplicate pages or navigation entries.
export const retiredExampleTargets:Record<string,string>={
 "student-analysis":"/next#group-analytics",
 "evidence-matrix":"/next/components/evidence-matrix",
 "diagnosis":"/next/examples/evaluation?stage=diagnosis",
 "goals":"/next/examples/evaluation?stage=goals",
 "learning-plan":"/next/examples/evaluation?stage=learning-plan",
 "goal-milestones":"/next/components/goal-milestones",
 "workload-calendar":"/next/components/workload-calendar",
 "answer-review-map":"/next/components/answer-review-map",
}
