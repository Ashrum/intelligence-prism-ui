# 学情分析图表公开属性（P58）

适用组件：TrendChart、QuadrantScatterChart、PairedDotChart、MetricSummary。所有新属性可选；未传入时保留原有输出。仅呈现调用方事实，不计算学情结论。组件数量、依赖、Token、coss 源码均不变。

## 复用检索

离线核对固定 coss Button / Popover / Table，以及现有 DataRecordTable、TrendChart、QuadrantScatterChart、PairedDotChart、MetricSummary、DonutChart 与 `chartToneColor`。读取本地 particles `table-particle.tsx`（p-table-3/4）、`dialog-particles.tsx` 和 `docs/polar-charts.md`、`docs/comparison-chart.md`、`docs/review-workspace.md` 中 p-meter-3/4、p-progress-1/2/3、p-frame-1、p-tabs-10、p-badge-16 的历史检索记录：这些组合支持披露、表面与基础量值，不提供逐点标注或卡片内的小走势协议。完整 DonutChart 带图例与数据表，不适合作装饰性小环。

按 Builder 前置约定未联网刷新 coss particles registry；不声称重新读取远端单项源码。这四项属于既有通用数据展示组件，Beautiful UI 的 Agent 执行组件不适用。采用已有 Recharts / ECharts、coss Popover 和现有图表色板，不复制新的第三方代码。

## TrendChart

```ts
type ChartSeries = {
  // 原 id / label / data / color 保留
  lineStyle?: 'solid' | 'dashed' // 默认 solid
  connect?: boolean            // 默认 true；false 仅画点
}
type ChartPoint = {
  // 原 id / label / value 保留
  symbol?: 'circle' | 'hollow-circle' | 'diamond' // 默认 circle
  valueLabel?: string
  annotation?: string
}
```

valueLabel 放点上方，annotation 放下方；文字始终使用正文色和既有图表字号。依据实际 plot / 数值轴位置，预留所有点的空间，再避让连线及已放置的文字；边缘文字向图内移动。plot 宽度不足 440px、文字过长或避让后放不下时不在图中放置该文字，提示框与数据表仍披露完整内容，不缩字号。提示框按点 ID 与系列 ID 取原始标注。

null 仍断线且不画点；`connect=false` 对整个系列禁用可见连线，常态和悬停态保留同一点形。数据披露增加系列线型/是否连线、点形、原值与标注。颜色沿用原系列色。没有区间带属性。

组件页 `/next/components/trend-chart#learning-properties`：四次可比检测实际值 65/68/70/72%，预期 64/66/67/69%；另有一次不可比空心点、一次新情境菱形点。六个时间类别按首个系列顺序输入；缺测位置不擅自跨越。

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

ChartTone 沿用现有 `neutral | info | success | warning | destructive | chart-1 … chart-6`；由 `chartToneColor` 读取对应主题色，区域透明度 0.1，位于数据点下方。其他象限仍透明。现有象限说明文字标记“高亮区域”；阈值非法时沿用不画象限的行为。三主题采用各自原有色板，不增 Token。

组件页 `/next/components/quadrant-chart#learning-properties`：章为圆点、知识点为菱形，左下区域高亮；名称、阈值与优先处理文案均为外部示例事实。

## PairedDotChart

```ts
type PairedDotChartProps = {
  // 其他原属性保留
  density?: 'default' | 'compact' // 默认 default
  connectPairs?: boolean        // 默认 false
}
```

compact 使用每行 52px、上下共 75px、最小 150px 的图高；三行图高 231px。默认仍为每行 80px、最小 230px。文字与点形尺寸不变。连接启用后两点放在同一行轴坐标；标签保持上/下位置与原有重叠隐藏策略，点形继续区分圆/菱形。连线仅连接两个均有效且在范围内的数值，位于数据点后方；相等值仍保留两个点；单边缺测或无效不画连线，不补零。表格与提示框保留原值，文字补充连线语义。

组件页 `/next/components/paired-dot-chart#learning-properties`：三道错题的出错/再错率，边界开关覆盖单边缺测、同值、0/100。

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

## 验证边界

新增测试覆盖修改前 SSR / ECharts options 字节快照、三主题配色、实际 ECharts SVG、Recharts 客户端提交与 960→320→960 尺寸更新、缺测/零值、提示框、标注避让与文本披露。注入尺寸的提交测试不模拟浏览器 CSS 排版、Popover 焦点或读屏器。

浏览器验收：按分工由 Supervisor 执行。四页均有“320px 容器”及“长中文、公式与缺测”开关；须覆盖 light / paper / dark、桌面与窄屏、指针提示框、键盘选择、Popover 开合与焦点返回。
