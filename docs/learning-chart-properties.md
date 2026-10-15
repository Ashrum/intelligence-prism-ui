# 学情分析图表公开属性（P58 / P59 / P60 / P61 / P62）

适用组件：TrendChart、QuadrantScatterChart、PairedDotChart、MetricSummary。所有新属性可选。P59 明确修正技术脚注、百分比格式、紧凑双点行与四象限点标签；P60 修正图例文字、象限标题与缺测小走势，补充刻度和坐标域属性。除这些返工项外，未传入新属性保留原行为。仅呈现调用方事实，不计算学情结论。组件数量、依赖、Token、coss 源码均不变。

## 复用检索

离线核对固定 coss Button / Popover / Table，以及现有 DataRecordTable、TrendChart、QuadrantScatterChart、PairedDotChart、MetricSummary、DonutChart 与 `chartToneColor`。读取本地 particles `table-particle.tsx`（p-table-3/4）、`dialog-particles.tsx` 和 `docs/polar-charts.md`、`docs/comparison-chart.md`、`docs/review-workspace.md` 中 p-meter-3/4、p-progress-1/2/3、p-frame-1、p-tabs-10、p-badge-16 的历史检索记录：这些组合支持披露、表面与基础量值，不提供逐点标注或卡片内的小走势协议。完整 DonutChart 带图例与数据表，不适合作装饰性小环。

按 Builder 前置约定未联网刷新 coss particles registry；不声称重新读取远端单项源码。这四项属于既有通用数据展示组件，Beautiful UI 的 Agent 执行组件不适用。采用已有 Recharts / ECharts、coss Popover 和现有图表色板，不复制新的第三方代码。

## TrendChart

```ts
type ChartSeries = {
  // 原 id / label / data / color 保留
  lineStyle?: 'solid' | 'dashed' // 默认 solid
  showPoints?: boolean         // 默认 true（含 dashed）；false 不画普通点或悬停点
  connect?: boolean            // 默认 true；false 禁用连线，与 showPoints 独立
  connectGaps?: boolean        // 默认 false；true 跨 null 连线，connect=false 优先
  tone?: ChartTone             // 既有图表色板；color 显式指定时优先
}
type ChartPoint = {
  // 原 id / label / value 保留
  tickLabel?: [string, string] // 两行刻度；未传使用 label
  symbol?: 'circle' | 'hollow-circle' | 'diamond' // 默认 circle
  valueLabel?: string
  annotation?: string
}
```

```ts
type BasicChartProps = {
  // 其他原属性保留
  xTickMode?: 'auto' | 'all'     // 默认 auto；all 不抽稀刻度
  yDomain?: [number, number] | 'auto' // 优先于旧 domain；未传沿用 domain
  decimals?: 0 | 1                  // 百分比默认 0；其他单位沿用最多 3 位
}
```

`yDomain='auto'` 仅根据有限数值计算留边，忽略 null / 非有限值；55–75% 显示 50–80%（P68）。百分比数据均在 0–100 内时坐标边界限制在该区间，不截断域外事实；空数据回退 0–100%，恒定序列仍留边。Y 轴百分比刻度始终取整；值与标注坐标不四舍五入。

P60 将 W148 的 `xTickMode` 正式收回 Prism 上游。`auto` 且未传 tickLabel 时保留原刻度；`all` 展示所有类别。传入 `tickLabel` 时每个元素占一行，不自动折成第三行；未传时 label 为单行。端点预留半个刻度槽，避免右侧文字被 SVG 裁切。窄容器每行放不下时使用省略号，完整内容保留在 SVG title 与数据表；提示框保留原 label，点 ID、分类顺序与原始数值不变。多系列同 ID 的 tickLabel 取首个已提供的定义，调用方应保持一致。图例文字统一使用正文色，仅标记使用系列色。

valueLabel 放点上方，annotation 放下方；文字始终使用正文色和既有图表字号。依据实际 plot / 数值轴位置，预留所有点的空间，再避让连线及已放置的文字；边缘文字向图内移动。plot 宽度不足 440px、文字过长或避让后放不下时不在图中放置该文字，提示框与数据表仍披露完整内容，不缩字号。提示框按点 ID 与系列 ID 取原始标注。

null 默认断线且不画点；`connectGaps=true` 跨缺位连接有效点，标签避让也计入跨缺位的线段；`connect=false` 对整个系列禁用可见连线，常态和悬停态保留同一点形。数据披露增加系列线型/是否连线、点形、原值与标注。未传 tone 时颜色沿用原系列色；`tone="neutral"` 读取既有第六色（light/paper #6B7280，dark #979CA6），`tone="chart-3"` 读取第三色；显式 color 优先。没有区间带属性。

P72：`showPoints=false` 仅关闭该系列的普通点与悬停点，提示框、数据表、原始数值和标注保留；图例使用对应实线/虚线标记。`lineStyle='dashed'` 不隐式关闭点，由宿主显式传 `showPoints:false`。`connect=false` 仍禁用连线；两者同时为 false 时不画线也不画点，数值仍可通过提示框和数据表读取。单个有效值在隐藏点后可能没有可见线段。

复用依据（P72）：继续使用现有 TrendChart / ChartLegend / ChartMarker 和 Recharts 的 `dot` / `activeDot` 属性；离线核对 coss Table、particles `table-particle.tsx`（p-table-3/4）与 `docs/comparison-chart.md`、`docs/polar-charts.md` 的组合记录，均无须替换现有图表能力。按 Builder 前置约定不联网刷新；此为通用图表属性扩展，不新增组件或第三方代码。

组件页 `/next/components/trend-chart#learning-properties`：四次可比检测实际值 65/68/70/72%，预期 64/66/67/69%；另有一次不可比空心点、一次新情境菱形点。六个时间类别按首个系列顺序输入；实际/预期显式启用 connectGaps，预期显式传 showPoints=false；预期/不可比用 neutral，新情境用 chart-3，独立点系列禁用连线。示例使用 yDomain="auto"、xTickMode="all" 与两行 tickLabel（第 2 周 / 起点检测至第 8 周 / 数学检测）。

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

P60：`ScatterChartProps.xDomain?: [number, number] | 'auto'` 与 `yDomain?: [number, number] | 'auto'`。auto 复用 TrendChart 的有限数据留边与整刻度算法；x/y 分别按 xUnit/unit 判断百分比，百分比 auto 轴使用整数刻度，不受 decimals=1 影响。显式范围、未传属性时的旧行为保留；不把分界阈值强行纳入数据域，阈值落在域外时沿用未绘制象限的提示。象限标题固定在各自外角（左上、右上、左下、右下），高亮标题取 highlight.tone 的主题色，其他标题取次要文字色；440px 以下仍隐藏图内标题，数据披露保留完整说明。

`ScatterChartProps` / `QuadrantScatterChart` 同时支持 `labelMode?: 'auto' | 'none'`（默认 auto）与 `decimals?: 0 | 1`。auto 沿用窄容器隐藏、重叠避让；估算宽度超过 110px 的名称不画截断文本，完整名称放提示框与数据表。none 在普通态、悬停态及响应式配置中均关闭点标签；保留点形、象限标题和选择意图。

ChartTone 沿用现有 `neutral | info | success | warning | destructive | chart-1 … chart-6`；由 `chartToneColor` 读取对应主题色，区域透明度 light/paper 为 0.1、dark 为 0.16，位于数据点下方。其他象限仍透明。“查看数据”内的象限说明文字标记“高亮区域”；阈值非法时沿用不画象限的行为。三主题采用 P69 曜彩图表色板，详见 [Foundations 色板](foundation-tokens.md#p69-曜彩图表色板)。

组件页 `/next/components/quadrant-chart#learning-properties`：章为圆点、知识点为菱形，xDomain/yDomain 使用 auto，数据集中在 60–90%，左下区域高亮；名称、阈值与优先处理文案均为外部示例事实。

## PairedDotChart

```ts
type PairedDotChartProps = {
  // 其他原属性保留
  density?: 'default' | 'compact' // 默认 default
  connectPairs?: boolean        // compact / inline 默认 true，其他默认 false
  decimals?: 0 | 1
}
type PairedRow = {
  id: string; label: string; first: number | null; second: number | null
  tag?: ReactNode               // 外部状态；compact 放名称右侧，数据表保留
}
```

compact 每行先显示完整名称和可选 tag，再放该行两点；名称自然换行，tag 在右侧、空间不足时换行，不截断或缩字号。P62 每行图形高 48px，百分比未指定 domain 时共用 0–100 细轨道，不画逐行坐标刻度；其他单位沿用全体有效值推导范围，显式 domain 优先；长名称增长的是 HTML 行高，不依赖字数估算或浏览器测量。默认仍为每行 80px、最小 230px 的原有整图。文字与点形尺寸不变。连接启用后两点放在同一行轴坐标；默认密度的标签保持上/下位置；compact 两项数值均在点上方，保留原有重叠隐藏策略，点形继续区分圆/菱形。连线仅连接两个均有效且在范围内的数值，位于数据点后方；相等值仍保留两个点；单边缺测或无效不画连线，不补零。表格与提示框保留原值，文字补充连线语义。

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

环形要求有限数且 `max > 0`、`0 <= value <= max`；无效值不画进度，文本说明无效，不静默截断为 0/100%。走势按原顺序和实际最小/最大值布局，P60 跳过 null/非法值后连线，仍使用原数组索引作为横坐标，不补零、不生成缺测数值；孤立值与 0 保留点，恒定序列置于中线，空数组/全缺测只保留文字说明。

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

## P60 上游归并与回归

离线核对 Workspace `scripts/prism-w148-adaptations.json` 和对应 `basic-charts.tsx`、`segmented-bar.tsx`；复核本地 coss `meter.tsx`、particles 的既有 p-meter-3/4 与 p-progress-1/2/3 记录。复用上述既有引擎与格式函数，不联网、不引入第三方源码。Workspace 本次只读，后续由 Supervisor 同步 Prism 字节并清理适配补丁。

`SegmentedBar.percentDecimals?: 0 | 1` 默认 1，0 为整数占比；所有占比文字（图例、选择按钮、aria 摘要、余量）统一处理，valueFormatter 和原始比例/宽度不受影响。详见 `docs/segmented-bar.md`，示例 `/next/components/segmented-bar` 的“整数占比”。

图例统一核查：Trend 的 Recharts Legend 由 formatter 显式设为正文色；Scatter、PairedDot、Combo、Comparison、Radar、Donut、SegmentedBar 已使用 HTML 图例且系列色只赋予标记，Heatmap 的连续刻度使用统一次要文字色，BoxPlot 无系列图例。P60 测试覆盖三主题、320/800/1440 宽度的真实引擎输出及注入尺寸的客户端提交；不等同于浏览器视觉验收。旧快照保留，仅在比较时迁移 P60 授权的象限标签位置/颜色。

## P61：图例帮助与等距刻度

`PairedMetric.help?: ReactNode`（`PairedDotChart.metrics` 的各项）在原生图例文字旁显示“?”，复用固定 coss Button / Popover；可访问名称为“指标名：指标说明”。两项可独立省略，未传 / null 不增加节点；帮助按钮不发出 `onSelect`，默认和 compact 密度均支持。键盘 Enter / Space 开合、Escape 关闭与关闭后焦点返回由 coss Popover 管理；真实浏览器验收交 Supervisor。宿主传入准确的分子分母说明，不隐藏原生图例再复制一套。

```tsx
<PairedDotChart label="错题：出错与再错" data={rows} unit="%" metrics={[
  { id: 'error', label: '出错的学生占比', help: '未得满分学生数 / 有有效作答学生数，按学生去重。' },
  { id: 'repeat', label: '再考时仍然出错', help: <p>原失分学生最近一次可比再考仍失分人数 / 原失分学生中有可比再考的人数。</p> },
]} />
```

`TrendChart.yDomain="auto"` 与 `QuadrantScatterChart.xDomain/yDomain="auto"` 共用内部范围与步长计算。P61 的通用算法先留边，再按 1/2/5 × 10 的幂选等距步长并向外对齐两端；非百分比仍按此算法，可保留小数刻度。百分比现按下方 P68 规则取 3–5 条刻度，数据都在 0–100 时仍限制在该区间。48–83% 现对应 20、40、60、80、100%，每段等长。ECharts 显式设置 interval，Recharts 显式设置 ticks 并保留全部 Y 轴刻度。上下界都是刻度；空、单点、恒定、负值仍有有效范围。原始值、象限阈值、提示框精度均不改。未传 auto 或显式数组域不增加刻度覆盖，不修改其原行为。

复用检索：本轮读取固定 coss Popover / Button / Meter / Progress、既有 MetricSummary.help、DataRecordTable、RecordList、SegmentedBar、ComparisonChart 与 Prism Badge，读取本地 particles `table-particle.tsx` 的 p-table-3/4，复核本页及 SegmentedBar / RecordList / ComparisonChart 文档中 p-meter-3/4、p-progress-1/2/3、p-table-5/8 与 p-badge-16 的历史记录。量值条、标签、表格插槽已满足需求；图例帮助直接沿用 MetricSummary 的组合。按前置约定离线，未刷新远端 registry；通用数据组件不适用 Beautiful UI 执行组件，没有新第三方源码。

示例仍在 `/next/components/paired-dot-chart#learning-properties`（两项分母帮助），以及 trend-chart / quadrant-chart 的同名锚点（auto 刻度）。表格与列表预查及可运行组合见 [学情记录组合](learning-record-composition.md)。

## P62：嵌入卡片公开属性

### 统一披露

`dataDisclosure?: 'visible' | 'hidden'` 已覆盖 TrendChart、ComparisonChart（含分布图）、ScatterChart / QuadrantScatterChart、PairedDotChart、ComboChart、HeatmapChart、BoxPlotChart、DonutChart、RadarChart 和 SegmentedBar。

- hidden：移除展开控件，将完整数据、缺测说明与标注放进 `sr-only` region。表格不使用 display:none、hidden、aria-hidden，也不留在收起的 details 中。表内选择按钮移除，避免键盘聚焦不可见控件；图形、图例和宿主可见操作仍保留原回调。
- visible：原有图表保留默认收起的“查看数据”。省略属性保留 P61 默认输出；SegmentedBar 过去没有展开表，省略仍保持原状，显式 visible 才增加表。
- Comparison 保留 `details` / `none` 兼容别名，分别等价 visible / hidden；未传仍为 details。Trend 旧 `showData=false` 单独使用时行为不变；显式 dataDisclosure 优先，因此 hidden 即使搭配 showData=false 也保留读屏表。
- Radar 无法绘制时仍显示空状态；hidden 将原替代表也视觉隐藏，visible / 未传沿用直接可见的无效数据替代表。

### 卡片形态

```ts
// PairedDotChart
 density?: 'default' | 'compact'
 connectPairs?: boolean // default 密度默认 false；compact 默认 true，显式 false 可关闭
// 行属性名沿用 data[].tag: ReactNode（任务书的 items[].tag 对应现有 data）

// ComparisonChart
 variant?: 'default' | 'spark'
 height?: number

// MetricSummary
 layout?: 'row' | 'grid' | 'strip'

// ScatterChart / QuadrantScatterChart
 labelIds?: string[]

// ChartPoint：已支持，无须新增协议
 annotation?: string // 例如“高于预期 2”
```

Paired compact：名称与 tag 在第一行完整换行；第二行是共用比例的细轨道、两个点、有效值之间连线及点上方数值，不画 0 / 50 / 100 的轴。图形高 48px（包括标签空间），保持圆/菱形区分，使用既有主题 border / muted 色。单边缺测只留另一个点，同值保留原坐标与两点，拥挤数值由引擎避让后隐藏到提示框/表；不补零、不伪造偏移值。default 密度及其刻度不变。

Comparison spark：未传 horizontal 时默认竖柱；移除 y 轴和坐标网格，保留底线；P65 起 x 刻度按可用宽度等距抽稀并保留首尾，默认高度 120px、柱宽 24px、小圆角，height 仍可控制。null / 无效 / 已知 0 在对应类别底部显示细灰线，title 与数据表保留“缺测”和 0 的区别；全缺测也保留所有位置。未更改数据来制造最小柱高。显式 horizontal=true 时沿用横柱呈现；spark 面向竖柱。默认 variant 与现有参考线/选择协议不变。

MetricSummary：省略 layout 沿用旧自适应布局；显式 grid 切换为两列、有内部细分隔线的概览网格，四项组成 2×2。row 为旧 strip 的兼容入口，strip 保留。grid 使用标签 ui-body、数值 stat-display、说明 ui-hint；单位用现有 value: ReactNode 插入 `text-ui-body`，不从字符串拆分或猜测单位。环形盒为 56×56，走势为 72×40；网格宽度不足 440px 时，小图排在说明下方保持可读，仍保留两列、字号不缩小。数值少于两个有效点不输出 polyline：单点（含 0）只画一个点，全缺测不画点。装饰 SVG 继续 aria-hidden，原始数据文字可读。

labelIds 是标签白名单，未传沿用既有 auto 行为；空数组不显示点标签；未知 ID 忽略。非白名单点在普通和悬停状态都不出现标签，仍有完整提示框及数据表；不会删除点或改变选择 ID。labelMode=none 优先。白名单仍服从既有 110px 名称宽度与 440px 窄图隐藏规则、引擎 hideOverlap 避让；缩回宽图恢复白名单。annotation 的短文不修改，继续在点下方避让，空间不足时完整保留在提示框和数据表。

### 画布组合与复用依据

新增评审夹具 `LearningOverviewCards`（不是组件目录条目）复用固定 coss Card / Button / Popover、Prism Badge / DataRecordTable / SegmentedBar 和现有图表，在以下组件页的 `#embedded-cards` 展示同一组合：trend-chart、metric-summary、quadrant-chart、paired-dot-chart、comparison-chart、distribution-chart。

组合包含画布四个指标：近期得分率 72%、补回率 61%、保持率 78%、需要优先处理 9 人 · 2 个知识点；班级得分率与预期、课程聚焦（72/70、59/48、64/56、55/38），以及学生学习进展、三道错题（60/47、57/41、49/33）和批阅积累八周柱图。默认没有图表展开件，宿主详情按钮仅回显意图；不接 Store、路由、权限、持久化或模型。开关覆盖 320px、长中文/公式、单点 0、同值、端点和缺测、披露切换。

本次离线检索：读取本地固定 Card、Popover 及现有 DataRecordTable、MetricSummary、各图表；核对 `demos/table-particle.tsx` 的 Table/Badge/Frame 组合与本页记录的 coss particles p-table-3/4、p-meter-3/4、p-progress-1/2/3。披露复用已有表格与 sr-only 模式；绘图复用 Recharts / ECharts，无需新基础控件。按 Builder 前置约定未联网刷新 registry；此任务为通用数据分析图表，未引入 Beautiful UI 的 Agent 执行组件或第三方代码。coss、依赖、Token、目录数量不变。

P62 自动回归包含 P61 默认 SSR/options 字节快照、所有披露路径、真实 ECharts 三主题多宽度与缩回恢复、真实 Recharts 客户端小柱图/空值/全缺测、指标网格与小图边界。仅 P58 已授权 compact 高度/新增轨道断言随本轮呈现调整，旧原始快照不改。浏览器验收：按分工由 Supervisor 执行。

## P63：图例位置

以下六项统一增加 `legendPosition?: 'bottom' | 'top-left' | 'none'`：`TrendChart`（`BasicChartProps`）、`ComparisonChart`（`ComparisonChartProps`）、`ComboChart`（`ComboChartProps`）、`ScatterChart` / `QuadrantScatterChart`（共用 `ScatterChartProps`）、`PairedDotChart`（`PairedDotChartProps`）。未传时保留原有行为，不统一改成 bottom。

| 组件 | 省略属性 | top-left / bottom | none |
| --- | --- | --- | --- |
| TrendChart | 多系列图例在底部，单系列不显示 | 绘图区上方左对齐 / 底部；显式选用时单系列也显示 | 移除图例，释放图内图例空间 |
| ComparisonChart | 有效参考线标签在下方；`referenceLabelPlacement='plot'` 时沿用图内标签及窄屏回退 | 将有效参考线图例置于绘图区上方左侧 / 下方；显式位置可与 plot 标签同时使用 | 不显示参考线图例；plot 标签与参考线本身保留 |
| ComboChart | 上方左对齐，系列名附坐标轴及单位 | 上方左对齐 / 绘图下方、数据披露之前 | 移除系列图例 |
| ScatterChart / QuadrantScatterChart | 有 groups 时上方左对齐 | 上方左对齐 / 绘图下方、数据披露之前；未提供 groups 不补造分组 | 移除点形图例，保留象限说明 |
| PairedDotChart | 上方左对齐，含可选指标帮助 | 上方左对齐 / 整组绘图下方；default 与 compact 密度均适用 | 移除图例及其帮助按钮，宿主负责展示必要口径说明 |

图例文字沿用单色正文，标记保留现有主题色、显式调用方颜色及形状；不更改数据、轴、缺测、点标签、提示框或选择意图。`none` 不等于 `dataDisclosure='hidden'`，数据表和已有的可访问披露保持原配置。ComparisonChart 无有效参考线时不补造柱系列图例；none 不删除参考线数据表。

```tsx
<TrendChart label="班级得分率与预期" series={series} legendPosition="top-left" />
<QuadrantScatterChart {...quadrantProps} legendPosition="none" />
<PairedDotChart {...pairedProps} legendPosition="bottom" />
```

六个组件页的 `#legend-position` 提供默认位置、上方左对齐、底部、隐藏图例四个按钮，以及 320px 容器、长中文与公式切换。默认展示 top-left；隐藏时由示例宿主提供说明。示例属于既有组件页评审夹具，不增加组件目录条目。

复用依据：离线核对既有六个图表的 Recharts Legend / HTML 图例、固定 coss Button 与 Popover，以及本地 `demos/table-particle.tsx` 的 p-table-3/4 和本文已有的 particles 历史记录。基础控件与 Table / Frame 组合不提供图表图例定位；直接复用现有 Legend 和图例节点，仅调整公开属性和节点位置。通用数据分析图表不适用 Beautiful UI 的 Agent 执行组件；按 Builder 前置约定未联网刷新 registry，没有新增第三方代码、依赖、视觉令牌或 coss 改动。

验证：`tests/p63-charts.test.mjs` 使用修改前从 `6ddecd2` 捕获的三主题快照，验证省略属性时 HTML 与 ECharts 配置一致，并检查节点顺序、隐藏图例后的披露与选择、Comparison plot 标签以及 PairedDot 帮助。`tests/p63-charts-client.test.mjs` 用真实 Recharts 和注入尺寸的 DOM 检查图例动态切换、单色文字、彩色标记和绘图区避让；此测试不是浏览器视觉、布局或键盘验收。浏览器验收按分工由 Supervisor 执行。

## P64：卡片标题行图例

P64 将 P63 六个图表的图例统一提取为公开 `ChartLegend`；它是现有图例的可复用导出，不新增组件目录条目。`analytics-components.tsx` 和各图表源模块提供以下导出：

```ts
type ChartLegendMarker = 'line' | 'dashed-line' | 'dot' | 'hollow-dot'
  | 'diamond' | 'triangle' | 'square' | 'bar'
type ChartLegendItem = {
  id: string
  label: string
  marker: ChartLegendMarker
  color?: string
  tone?: ChartTone
  help?: ReactNode
}
type ChartLegendProps = {
  items: readonly ChartLegendItem[]
  align?: 'left' | 'center' | 'right' // 默认 left
  label?: string // 默认“图例”，列表的可访问名称
  className?: string // 宿主布局插槽
}
trendLegendItems(series: readonly ChartSeries[]): ChartLegendItem[]
comparisonLegendItems(props: Pick<ComparisonChartProps,
  'data' | 'domain' | 'referenceLines' | 'unit'>): ChartLegendItem[]
comboLegendItems(series: readonly ComboSeries[], axes: readonly ComboAxis[]): ChartLegendItem[]
scatterLegendItems(groups?: readonly ScatterGroup[]): ChartLegendItem[]
quadrantLegendItems(groups?: readonly ScatterGroup[]): ChartLegendItem[] // 同 scatter
pairedDotLegendItems(metrics: readonly PairedMetric[]): ChartLegendItem[]
```

以上辅助函数是纯 props 转换，不需要宿主读取主题或复制色板；图例跟随同一主题提供器。`color` 优先于 `tone`；Trend 未指定二者时保持原有 `--chart-1` 至 `--chart-5`，其余图表保持各自既有色板槽位。仅标记带色，文字统一正文色、使用语义字号；列表横排可换行，右对齐不反转输入顺序。空 items 不生成空列表。图例标记为装饰 SVG，不增加键盘焦点；指标帮助复用 coss Popover，按钮可访问名称仍为“指标名：指标说明”。

`trendLegendItems` 用实线 / 虚线表示连接系列，用实心圆 / 空心圆 / 菱形表示 `connect=false` 的系列。一个仅画点的系列若有多种有效点形，按首次出现顺序拆为多个图例项，ID 为 `系列ID:点形`，名称附“圆点 / 空心圆 / 菱形”；0 是有效值，缺测与非有限值不参与点形选择。全缺测系列沿用首点声明的点形，无点时使用圆点。TrendDot 和图例使用同一个 `ChartMarker` SVG 绘制函数，普通点与悬停点只改变坐标和半径。Scatter 保留三角 / 方形，Combo 保留柱形，避免将既有图形语义改成圆点。

Comparison 的辅助函数沿用绘图的参考线有效性、域范围筛选和分段轴格式；不补造柱系列图例。Combo 保留左右轴及单位说明；PairedDot 保留 `help`，宿主移动图例后不用复制帮助内容。Donut / Radar / SegmentedBar 的独立选择图例不在本轮位置协议范围内。

### 卡片标题行图例示例

```tsx
import { Card } from '@/components/coss/card'
import { ChartLegend, TrendChart, trendLegendItems } from '@/components/prism-next/analytics-components'

<Card className="min-w-0 gap-3 p-4">
  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
    <h3 className="text-block-title">班级得分率与预期</h3>
    <ChartLegend items={trendLegendItems(series)} align="right" className="ml-auto flex-1 basis-64" />
  </div>
  <TrendChart label="班级得分率与预期" series={series} legendPosition="none" />
</Card>
```

图例属于整张卡片标题行右侧，窄容器不足时自然换行；不会绝对定位到绘图区。宿主同时保留数据披露。标题行与图表应处于同一主题边界内。

`legendPosition='top-left'` 保留，但 Trend 现在同其他图表一样，将图例放在绘图容器之前的普通文档流；图例换成多行会增加组件整体高度，不侵入绘图区。底部与默认多系列图例也改为绘图容器之后的普通文档流，`height` 代表绘图容器高度，不包括图例和数据披露。默认单系列仍不显示；显式 top-left / bottom 显示单系列；none 不显示内部图例。此处替代 P63 的 Recharts 内部图例定位说明，其余数据、坐标域、缺测、选择回调和披露协议不变。

六个组件页（trend-chart、comparison-chart、combo-chart、scatter-chart、quadrant-chart、paired-dot-chart）的 `#legend-position` 默认展示“卡片标题行图例”，支持切换原有四种位置、320px 容器和长中文与公式。Trend 页的 `#embedded-cards` 也同步为标题右侧图例，覆盖实线、虚线、空心圆和菱形。

### 本轮复用与验证边界

离线读取既有 Recharts Legend、Scatter / Combo / PairedDot / Comparison HTML 图例、TrendDot、固定 coss Card，以及本地 particles `demos/table-particle.tsx` 的 Table / Frame 组合；复核本页已有 p-table-3/4、p-meter-3/4、p-progress-1/2/3 记录。基础控件和 particles 不提供图表系列映射，故提取已有 HTML 图例和 PairedDot 帮助组合，共享 TrendDot 标记绘制；没有另建第二套图例。按 Builder 前置约定未联网刷新 registry；通用图表不涉及 Beautiful UI Agent 执行组件，无新第三方代码、依赖、Token 或 coss 修改。

P21 的旧 SHA-256 继续保留：仅将当前参考线图例的包装节点还原为旧结构，标签文字和标记颜色仍取实际渲染输出，再核对原散列。P58 / P62 / P63 冻结快照保持原文件；比较时仅排除本轮明确替换的图例子树，其余 HTML 和 ECharts 配置仍逐字比较。P60 / P61 的图例与帮助断言改查公开图例输入。`tests/p64-charts.test.mjs` 独立检查各 helper 的形状、颜色、内容、筛选、显式色覆盖、空输入、混合点形、标题行、帮助和与实际曲线 / 点形的一致性；P63 客户端测试检查 320 / 1280 注入尺寸下实时切换后的 DOM 顺序与绘图容器兄弟关系。这些测试不执行浏览器布局、视觉或键盘验收；实际结果和数字见本轮 P64 报告，浏览器验收按分工由 Supervisor 执行。


## P65：图表视觉细节

- **ComparisonChart spark**：使用实际 plot 宽度选择等距索引步长，保留首尾类别，文字之间至少 8px；resize 时重新计算。只抽稀刻度文字，所有柱、0 / 缺测占位及提示框、数据表保持完整。首尾名称过长时截短并保留 SVG title，不缩字号；显式横向与 default 分支不变。
- **TrendChart**：数值标签与注释使用 `var(--card)`、4px 背景描边（先描边后填字），保留既有点/线避让。P65 曾仅在百分比自动域按数据跨度选择 5/10 个百分点步长；此历史规则由下方 P68 的 3–5 条刻度规则替代。显式域与非百分比自动域不变。
- **QuadrantScatterChart**：内部引擎按实际宽高预留全部点形（包括未指定标签的点）、象限标题，再按右、上、左、下候选位置放置文字。宽度超过 110px、超出绘图区或四个候选均碰撞时不画标签，悬停也不重新画出冲突标签；提示框、数据表仍保留全名。440px 及以下仍不画图内标签。更新数据与容器宽高时重新布局，分组间共用障碍集合。
- **PairedDotChart**：新增 `maxTrackWidth?: number`，默认不限；正有限值以 CSS px 限制 compact 每行画布（包含两侧数值留边）的最大宽度，右侧留白，窄容器继续收缩。名称/状态按画布内轨道两端对齐。非正、NaN、Infinity 视为不限；default 密度不受此属性影响。两项图例保持横排，各项文字可在项内折行，帮助按钮保留。
- **dataDisclosure="hidden"**：所有图表仅输出读屏可读的只读数据区域，不产生可见 details/summary 或隐藏选择按钮。此属性必须由宿主显式传入，默认 visible 未改变。只读检查 Workspace `src/features/teacher/analysis/LearningMistakes.tsx` 的“出错与再错” PairedDotChart 发现漏传；组件库不修改该仓库，Supervisor 接入时补传 hidden，并按卡片宽度选择 maxTrackWidth。

示例：`/next/components/paired-dot-chart#learning-properties` 使用 `maxTrackWidth={420}`；`/next/components/quadrant-chart#learning-properties` 加入相邻“函数与方程”点；学情概览卡片中的 spark 使用 13 个周类别，供窄容器抽稀验收。

## P66 / P67：成对指标单行布局与数值列

本轮离线复查现有 PairedDotChart、ChartLegend / ChartMarker、EChart、DataRecordTable、固定 coss Button / Popover / Table，以及本地 particles `demos/table-particle.tsx`（p-table-3/4）和 `demos/dialog-particles.tsx`（p-dialog-5）。表格与弹窗组合不提供双点轨道，故扩展既有 PairedDotChart 并复用图例标记；未新增组件、依赖、颜色或字号令牌。按 Builder 前置约定不联网刷新 registry；本项为通用数据图表，未引入 Beautiful UI 的 Agent 组件。

```tsx
type PairedDotChartProps = {
  // 其他属性沿用
  rowLayout?: 'stacked' | 'inline' // 默认 stacked，原输出不变
  labelWidth?: number            // inline 名称列宽度，单位 px；默认 9em
}
type PairedRow = {
  // 原 id / label / first / second / tag 保留；通过 data 数组传入
  meta?: ReactNode               // 调用方提供的人数、样本量等补充信息
}

const metrics: [PairedMetric, PairedMetric] = [
    { id: 'error', label: '出错率', help: '未得满分人数 / 有效作答人数。' },
    { id: 'repeat', label: '再错率', help: '原失分学生中再考仍失分人数 / 可比再考人数。' },
  ]
<div className="flex flex-wrap items-start justify-between gap-3">
  <h3 className="text-block-title">错题：出错与再错</h3>
  <ChartLegend items={pairedDotLegendItems(metrics)} align="right" className="ml-auto" />
</div>
<PairedDotChart label="错题：出错与再错" rowLayout="inline" density="compact"
  legendPosition="none" unit="%" dataDisclosure="hidden" metrics={metrics} data={[
    { id: 'q1', label: '一元二次方程', first: 71, second: 25, meta: '36 / 51 人' },
    { id: 'q2', label: '根与系数', first: 60, second: null },
  ]} />
```

- `inline` 在容器宽度 ≥360px 时依次排列名称（可带一枚 tag）、轨道和两列数值，常规短内容每行 36px。所有行通过共享 Grid 列对齐，轨道共用数值域；名称单行省略，完整名称留在名称提示（有 meta 时为 coss Tooltip）、图表提示框和数据表中，读屏可读完整文本。
- 两项数值各占一列，两列等宽、右对齐、使用等宽数字；不显示指标名称或分隔点。以圆点 / 菱形前缀区分，颜色复用指标显式 color 或现有主题图表色；数字和文字为正文色。图上与悬停态不标数。缺测项不画点、数值显示 `—`，读屏读作“缺测”；只连接两个有效且在域内的点。数据披露继续保留缺测、无效和域外提示，不把缺测补零。
- `labelWidth` 仅接受正有限数，其他值回退 9em；它是名称列的期望宽度，空间不足时允许收缩。`maxTrackWidth` 在 inline 中仅限制中间画布的最大宽度，不限制整行；不传时轨道利用剩余空间。两项属性均不影响默认布局。
- `inline` 可配合两种 density，均采用 36px 轨道；`connectPairs` 默认开启，显式 false 仍关闭。未显式传 domain 的百分比轨道使用 0–100；其他单位仍按所有行数据共用比例。
- 使用命名 CSS 容器查询，容器 <360px 时同一行内容自动按名称（含可选 tag）→ 轨道 → 两列数值上下排列，名称完整换行。此回退保留 inline 的独立数值区与 36px 轨道；显式 `rowLayout="stacked"` 才使用原来的布局（compact 画布 48px、数值位于点上方）。没有重复图形或基于视口的 JS 猜测。长 tag 或临界宽度允许增加行高，保证内容可读，不强裁为 36px。
- **P67 图例契约**：inline 不生成图例行或列头行，任何 `legendPosition` 值均不在图内输出图例；数值前的圆点 / 菱形始终保留，包括 `legendPosition="none"`。宿主在卡片标题行右侧使用 `ChartLegend items={pairedDotLegendItems(metrics)}`，沿用指标名称、颜色和 `metrics[].help`。stacked 的图例位置行为保持不变。
- **P67 补充信息**：inline 的 `meta?: ReactNode` 仅在名称悬停 / 键盘聚焦的 coss Tooltip 和该行读屏文本中出现，不占数值列，也不出现在可见披露表中。Tooltip 直接接收原 ReactNode，不猜测或扁平化其文字；两项皆缺测时仍可查看。未传 meta 不增加焦点入口。`tag` 仍由宿主提供，名称后只渲染一个 tag 插槽，不推断状态；长标签允许换行。compact stacked 的 meta 仍在名称行显示，stacked 数据表仍保留补充信息列。
- `dataDisclosure`、原始 `onSelect(rowId, metricId?)` 与 selectedId 继续有效；数值读屏名称始终保留对应的指标名，缺值读作“缺测”。未新增公开属性。

验收入口：`/next/components/paired-dot-chart#learning-properties` 默认启用 inline，支持“单行布局”“320px 容器”“360px 容器”“名称列 180px”“隐藏数据披露”“长中文、公式与缺测”“保留一位小数”开关。`#embedded-cards` 的“错题：出错与再错”卡片也显式启用 inline。CSS 响应式、主题视觉、键盘帮助和焦点返回由 Supervisor 做真实浏览器验收，Builder 的 SSR / SVG 测试不替代该验收。

复用依据：离线读取固定 coss Card、现有 ChartLegend / ChartDataDisclosure / EChart / Comparison / Trend / Scatter / PairedDot 与 `comparisonTextWidth`、本地 particles `table-particle.tsx`（p-table-3/4）及本文历史 p-meter / p-progress 检索记录。基础控件/量值条没有坐标碰撞布局，故适配现有 Recharts / ECharts。按前置约定未联网刷新 registry；本任务为通用图表，Beautiful UI 的 Agent 执行组件不适用。没有新增第三方源码、依赖、Token、组件条目或 coss 修改。

P67 复用核对：离线读取固定 coss Tooltip / Card / Button / Popover / Table、现有 ChartLegend / ChartMarker / PairedDotChart，以及本地 particles 的 p-table-3/4、p-dialog-5。表格组合不提供成对轨道，继续适配现有图表；补充信息直接复用 Tooltip，支持 ReactNode 与键盘聚焦。按 Builder 前置约定未联网刷新 registry；通用图表无需引入 Beautiful UI Agent 执行组件。未增加组件条目、依赖或视觉令牌。P66 测试只更新获授权的 inline 图例、meta 和名称提示断言；既有 stacked、数值域、缺测、选择与四主题 SVG 断言保留。


## P68：自动百分比域的刻度数量

TrendChart、ScatterChart / QuadrantScatterChart 的百分比 auto 轴共用 `chartAutoScale`。依次尝试 5、10、20、25 个百分点，按有效数据最小/最大值各留半档后向外对齐到该步长的整数倍；选择能容纳 3–5 条刻度的最小步长。上下界本身也是刻度，Trend 不隐藏其中任意一条。缺测和非有限数值不参与计算，不改写原始坐标或精度；各散点轴独立使用其单位和数据。

| 原始范围 | 跨度 | 步长 | 刻度 |
| --- | --- | --- | --- |
| 60–65% | 5 | 5 | 55、60、65、70 |
| 64–72% | 8 | 5 | 60、65、70、75 |
| 55–75% | 20 | 10 | 50、60、70、80 |
| 30–70% | 40 | 20 | 20、40、60、80 |
| 15–85% | 70 | 25 | 0、25、50、75、100 |

边界沿用既有百分比契约：当有效值全在 0–100 内时，留白会被 0/100 截止，因此边界侧可能不足半档；例如 0–100% 使用 0/25/50/75/100。靠边恒定序列向区间内部补足至少 3 条刻度，空数据回退同样的 5 条刻度。严格要求每侧至少半档、最多 5 条且步长最多 25 无法覆盖 0–100 数据，这一规格冲突已列入 P68 报告待确认，不宣称边界情形满足严格半档要求。域外百分比事实不截断：候选步长不能覆盖时保留既有通用刻度算法，可能超过 5 条，同列待确认范围。

非百分比自动轴、未选 auto 的旧域、显式域、数据披露、主题颜色和交互保持原行为。P59/P60/P61/P65 的旧 auto 刻度预期按 P68 更新，保留坐标、间距、标签、默认域和显式域断言；未重写默认快照。

复用核对：读取既有 `chart-options.ts`、Trend / Scatter 的 Recharts / ECharts 接线，以及本地 particles `table-particle.tsx`（p-table-3/4）和本文已有量值组合记录。表格组合不提供数值坐标域，故修正现有共享函数；不引入新组件或第三方代码。按前置约定未联网刷新 registry；本任务为通用图表，不适用 Beautiful UI Agent 执行组件。


## P69 曜彩与图形尺寸（2026-10-15）

浅色 / 纸色与深色默认系列、形状、连续色阶统一见 [Foundations](foundation-tokens.md#p69-曜彩图表色板)。Recharts 核心主题从五色循环补齐为六色，与 ECharts 及 ChartLegend 对齐；显式 color / colors 与 tone 优先级保持。Blueprint / Blueprint Night 的色板及覆盖保留，夜图不跟随本轮核心 dark 更新。

Trend 普通点与自定义点、Scatter 默认点、Combo 折线点、Radar 点形及 ChartLegend 默认标记半径为 6.5px（ECharts symbolSize=13），Trend 悬停半径 8px；主数据线和成对点连接线为 2.5px；PairedDot 的点保持半径 6px（symbolSize=12），细轨道、轴线和象限分界仍是辅助线。BoxPlot 默认轮廓 2.5px，选中 3px。显式 Scatter size 保留原有上下界；inline 数值旁的辅助标记保留 r=3。象限 highlight 浅色/纸色采用对应 tone 的 10% 叠加，深色采用 16%，标题和点仍为完整系列色。

复用依据：读取现有 chart-palette / chart-theme / ChartLegend、固定 coss Table / Button / Popover 引用和本地 particles `demos/table-particle.tsx`（p-table-3/4），并复核本文、comparison-chart、polar-charts 的 p-meter-3/4、p-progress-1/2/3、p-frame-1 等记录。基础量值和表格组合不提供分类色或绘图尺寸，因此直接适配现有 ECharts / Recharts 图表。按 Builder 前置约定未联网刷新 registry；本任务为通用图表，不适用 Beautiful UI Agent 组件。未复制第三方代码、修改 coss 或增删依赖；只补齐图表第六色桥接。

旧 P57/P58/P62/P63 快照文件保持原样；比较时仅迁移获准的图表颜色、热图文字对比色和图形尺寸。Blueprint Night 的冻结三主题哈希及“夜图等于核心 dark”断言与 P69 授权不兼容，交由 Supervisor 分线协调，不修改该测试或它的证据。
