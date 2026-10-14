# 学情分析图表公开属性（P58 / P59）

适用组件：TrendChart、QuadrantScatterChart、PairedDotChart、MetricSummary。所有新属性可选。P59 明确修正技术脚注、百分比格式、紧凑双点行与四象限点标签；除这些返工项外，未传入新属性保留原行为。仅呈现调用方事实，不计算学情结论。组件数量、依赖、Token、coss 源码均不变。

## 复用检索

离线核对固定 coss Button / Popover / Table，以及现有 DataRecordTable、TrendChart、QuadrantScatterChart、PairedDotChart、MetricSummary、DonutChart 与 `chartToneColor`。读取本地 particles `table-particle.tsx`（p-table-3/4）、`dialog-particles.tsx` 和 `docs/polar-charts.md`、`docs/comparison-chart.md`、`docs/review-workspace.md` 中 p-meter-3/4、p-progress-1/2/3、p-frame-1、p-tabs-10、p-badge-16 的历史检索记录：这些组合支持披露、表面与基础量值，不提供逐点标注或卡片内的小走势协议。完整 DonutChart 带图例与数据表，不适合作装饰性小环。

按 Builder 前置约定未联网刷新 coss particles registry；不声称重新读取远端单项源码。这四项属于既有通用数据展示组件，Beautiful UI 的 Agent 执行组件不适用。采用已有 Recharts / ECharts、coss Popover 和现有图表色板，不复制新的第三方代码。

## TrendChart

```ts
type ChartSeries = {
  // 原 id / label / data / color 保留
  lineStyle?: 'solid' | 'dashed' // 默认 solid
  connect?: boolean            // 默认 true；false 仅画点
  connectGaps?: boolean        // 默认 false；true 跨 null 连线，connect=false 优先
  tone?: ChartTone             // 既有图表色板；color 显式指定时优先
}
type ChartPoint = {
  // 原 id / label / value 保留
  symbol?: 'circle' | 'hollow-circle' | 'diamond' // 默认 circle
  valueLabel?: string
  annotation?: string
}
```

```ts
type BasicChartProps = {
  // 其他原属性保留
  yDomain?: [number, number] | 'auto' // 优先于旧 domain；未传沿用 domain
  decimals?: 0 | 1                  // 百分比默认 0；其他单位沿用最多 3 位
}
```

`yDomain='auto'` 仅根据有限数值计算留边，忽略 null / 非有限值；55–75% 显示 40–90%。百分比数据均在 0–100 内时坐标边界限制在该区间，不截断域外事实；空数据回退 0–100%，恒定序列仍留边。Y 轴百分比刻度始终取整；值与标注坐标不四舍五入。

valueLabel 放点上方，annotation 放下方；文字始终使用正文色和既有图表字号。依据实际 plot / 数值轴位置，预留所有点的空间，再避让连线及已放置的文字；边缘文字向图内移动。plot 宽度不足 440px、文字过长或避让后放不下时不在图中放置该文字，提示框与数据表仍披露完整内容，不缩字号。提示框按点 ID 与系列 ID 取原始标注。

null 默认断线且不画点；`connectGaps=true` 跨缺位连接有效点，标签避让也计入跨缺位的线段；`connect=false` 对整个系列禁用可见连线，常态和悬停态保留同一点形。数据披露增加系列线型/是否连线、点形、原值与标注。未传 tone 时颜色沿用原系列色；`tone="neutral"` 读取既有第六色（light/paper #6B7280，dark #B6BEC9），`tone="chart-3"` 读取第三色；显式 color 优先。没有区间带属性。

组件页 `/next/components/trend-chart#learning-properties`：四次可比检测实际值 65/68/70/72%，预期 64/66/67/69%；另有一次不可比空心点、一次新情境菱形点。六个时间类别按首个系列顺序输入；实际/预期显式启用 connectGaps，预期/不可比用 neutral，新情境用 chart-3，独立点系列禁用连线。示例使用 yDomain="auto"。

## QuadrantScatterChart

```ts
type Quadrants = {
  x: number
  y: number
  labels: [string, string, string, string] // 左上、右上、左下、右下
  highlight?: {
    quadrant: 'bottom-left' | 'top-left' | 'top-right' | 'bottom-right'
    tone: ChartTone
  }
}
```

`ScatterChartProps` / `QuadrantScatterChart` 同时支持 `labelMode?: 'auto' | 'none'`（默认 auto）与 `decimals?: 0 | 1`。auto 沿用窄容器隐藏、重叠避让；估算宽度超过 110px 的名称不画截断文本，完整名称放提示框与数据表。none 在普通态、悬停态及响应式配置中均关闭点标签；保留点形、象限标题和选择意图。

ChartTone 沿用现有 `neutral | info | success | warning | destructive | chart-1 … chart-6`；由 `chartToneColor` 读取对应主题色，区域透明度 0.1，位于数据点下方。其他象限仍透明。“查看数据”内的象限说明文字标记“高亮区域”；阈值非法时沿用不画象限的行为。三主题采用各自原有色板，不增 Token。

组件页 `/next/components/quadrant-chart#learning-properties`：章为圆点、知识点为菱形，左下区域高亮；名称、阈值与优先处理文案均为外部示例事实。

## PairedDotChart

```ts
type PairedDotChartProps = {
  // 其他原属性保留
  density?: 'default' | 'compact' // 默认 default
  connectPairs?: boolean        // 默认 false
  decimals?: 0 | 1
}
type PairedRow = {
  id: string; label: string; first: number | null; second: number | null
  tag?: ReactNode               // 外部状态；compact 放名称右侧，数据表保留
}
```

compact 每行先显示完整名称和可选 tag，再放该行两点；名称自然换行，tag 在右侧、空间不足时换行，不截断或缩字号。每行图形高 100px，所有行共用同一数值范围；长名称增长的是 HTML 行高，不依赖字数估算或浏览器测量。默认仍为每行 80px、最小 230px 的原有整图。文字与点形尺寸不变。连接启用后两点放在同一行轴坐标；标签保持上/下位置与原有重叠隐藏策略，点形继续区分圆/菱形。连线仅连接两个均有效且在范围内的数值，位于数据点后方；相等值仍保留两个点；单边缺测或无效不画连线，不补零。表格与提示框保留原值，文字补充连线语义。

组件页 `/next/components/paired-dot-chart#learning-properties`：三道错题的出错/再错率，示例使用既有 Badge 显示外部状态；边界开关覆盖长名称/公式、单边缺测、同值、0/100。

## MetricSummary

```ts
type MetricSummaryItem = {
  id: string
  label: string
  value: ReactNode
  detail?: ReactNode
  visual?:
    | { kind: 'ring'; value: number; max: number }
    | { kind: 'sparkline'; values: (number | null)[] }
  help?: ReactNode
}
```

默认、compact、strip 均支持 visual/help。小图在数值右侧，尺寸与颜色由组件控制，使用现有 `--chart-1` / `--border`；启用小图的 grid 使用最小 220px 的自适应卡片列，窄容器换行。装饰 SVG 为 `aria-hidden` / `focusable=false`；旁边的数值文字和读屏专用原始数值说明承担信息。调用方仍须提供准确 value/detail，不由 visual 推断业务结论。

环形要求有限数且 `max > 0`、`0 <= value <= max`；无效值不画进度，文本说明无效，不静默截断为 0/100%。走势按原顺序和实际最小/最大值布局，null/非法值断开；孤立值与 0 保留点，恒定序列置于中线，空数组/全缺测只保留文字说明。

help 在指标名旁组合 coss Popover / Button，触发器名为“指标名：指标说明”；沿用 coss 的键盘开合、Escape 关闭与焦点返回。不给外层卡片增加点击行为，onSelect 仍是独立的“查看明细”意图。

组件页 `/next/components/metric-summary#learning-properties`：四个指标卡含两个环形和两个走势，帮助内容均使用外部提供的 ReactNode。

## 统一数据披露与数字格式（P59）

Trend、Scatter/Quadrant、PairedDot、Combo、Heatmap、BoxPlot、Donut、Radar 的分界/缺测/范围/输入顺序等技术说明统一放入默认收起的“查看数据”内；不作为可见图下注脚。真实空状态仍可见；数据异常说明与原始数据一并披露。Radar 无法绘制时保留直接可见的原表格，技术说明转为读屏专用文本。图例与外部业务标签不是技术脚注，继续显示。Comparison 的参考线图例仍保留现有公开协议；`dataDisclosure='none'` 仍提供读屏专用表格。

组件生成的百分比（unit 含 `%` 或 `％`）默认四舍五入为整数；Trend/Scatter/PairedDot 可用 `decimals={1}` 保留最多一位，`decimals={0}` 为整数，运行时非法 decimals 回退整数。表格、提示框、阈值说明、数值标签使用同一格式；Trend 百分比轴始终为整数。其他单位沿用最多三位小数。数据与坐标计算使用原数值，绝不通过四舍五入改变象限归属、连线或有效性。外部 `valueLabel` / `annotation` / `label` / 自定义 formatter / ReactNode 保留原文，由宿主负责其数字格式；MetricSummary 小图的读屏数值使用通用格式，不推测单位。

P59 离线复核上述 coss/particles 记录与本地 `table-particle.tsx` 的 Table/Badge 组合，复用既有 Prism Badge 展示示例 tag；沿用既有图表引擎与 chartToneColor，没有新组件条目、第三方代码、依赖、令牌或 coss 修改。

## 验证边界

新增测试覆盖修改前 SSR / ECharts options 字节快照、三主题配色、实际 ECharts SVG、Recharts 客户端提交与 960→320→960 尺寸更新、缺测/零值、提示框、标注避让与文本披露。注入尺寸的提交测试不模拟浏览器 CSS 排版、Popover 焦点或读屏器。

浏览器验收：按分工由 Supervisor 执行。新增 P59 回归验证跨 null 的真实 Recharts 路径、auto 轴范围、三主题中性色、原浮点坐标与格式化文本、收起说明、完整行名/tag、labelMode 及 320/800/1440 的 ECharts SVG。旧 P57/P58 原始快照不重写，按 P59 授权仅迁移说明位置和点标签策略后比较。

四页均有“320px 容器”及“长中文、公式与缺测”开关；须覆盖 light / paper / dark、桌面与窄屏、指针提示框、键盘选择、Popover 开合与焦点返回。
