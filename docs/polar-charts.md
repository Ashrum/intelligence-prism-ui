# 环形图、雷达图与紧凑矩阵（P57）

PO 2026-10-13 批准为试卷分析新增两个图表目录条目：`/next/components/donut-chart`、`/next/components/radar-chart`。从 `components/prism-next/analytics-components` 或对应 `charts/*` 文件导入。均只呈现外部数据，不含业务统计、结论、Store、导航、执行器或持久化。

## 复用依据

已读取 basic-charts、advanced-charts、combo-chart、scatter-chart、paired-dot-chart、segmented-bar、chart-theme、echart-engine、echart 及其契约与测试。沿用现有按需 ECharts SVG 引擎，增加 PieChart / RadarChart / RadarComponent 注册；React 只在 effect 中初始化引擎，复用 ResizeObserver 和 `animation:false`，包括减少动态效果场景。已有 Recharts 图表保持原实现。

读取固定 coss Button/Table/Frame 与本地 particles p-table-3/4 组合；复核 SegmentedBar、ComparisonChart 文档中 p-meter-3/4、p-progress-1/2/3、p-frame-1、p-tabs-10、p-badge-16 的历史检索记录。基础控件和量值组合可承接图例、数据表，不能提供环形/雷达坐标。两项属于通用数值图表，Beautiful UI 不适用。本轮按 Builder 前置约定离线工作，未刷新远端注册索引或宣称阅读在线单项源码；无上游新代码复制、coss 修改、依赖或视觉令牌增加。

颜色仅从 `useChartTheme()` 返回的既有六色色板及表面/文字色取得。light / paper / dark 沿用既有映射；`ChartTone` 为 `neutral | info | success | warning | destructive | chart-1…chart-6`，分别映射现有色板的第 6 / 1 / 3 / 4 / 2 色及直接编号。未传 tone 时按输入的正值分段或系列顺序分配颜色；文字与数字不用分类颜色。

## DonutChart

| 属性 | 契约 |
| --- | --- |
| `label: string` | 必填，图形、图例和数据区域的可访问名称。 |
| `segments: readonly DonutSegment[]` | `{ id, label, value, tone? }`，ID 唯一；value 为有限非负数。 |
| `centerText?: string` / `centerSubtext?: string` | 调用方提供主文字/副文字，如 `120` / `总分`；组件不计算或推断中心总量。 |
| `legend?: 'below' \| 'right'` | 默认 below；right 在容器至少 480px 时位于右侧，更窄时回到下方列表。 |
| `height?: number` | 绘图区高度，默认 180；图例、摘要和数据表在绘图区外。非法高度回退默认。 |
| `valueFormatter?: (value, originalSegment) => string` | 图例、悬停和数据表使用同一格式化结果；零值也调用；非法值显示“无效值”。 |
| `onSelect?: (id: string) => void` | 扇区、图例点击只发原始 ID；不内置选中状态或图例开关。图例是键盘可操作的 Button；无回调则呈现普通文字。 |

最多六个非零分段逐一着色，更多时提示先合并“其他”，保留全部图例和数据表，不自动合并或丢弃项目。零值不画扇区、图例仍可选择；负值或非有限值不画并明确提示。空数组/全零显示“暂无可绘制的环形数据”。默认图内无外侧标签，300×180 绘图区内不让分类文字挤占环形；中心文字沿用 `text-stat-display` / `text-ui-hint`，长文字截断、原生 title 与可访问文字保留全文。

```tsx
<DonutChart label="试卷分值组成" segments={segments}
  centerText="120" centerSubtext="总分" legend="below"
  valueFormatter={value => `${value} 分`} onSelect={requestDetails} />
```

## RadarChart

| 属性 | 契约 |
| --- | --- |
| `label: string` | 必填，图形与数据表区域名称。 |
| `axes: readonly RadarAxis[]` | `{ id, label, max? }`，3–8 个轴、ID 唯一。每轴下限 0。 |
| `series: readonly RadarSeries[]` | `{ id, label, values: number[], tone? }`，1–2 组，ID 唯一；values 顺序和长度对应 axes。 |
| `height?: number` | 默认 280；非法高度回退默认。 |

显式 max 必须是正的有限数值；省略时使用该轴所有有限非负数据的最大值，至少 1。跨测评对比宜由调用方提供一致上限。长度不匹配、负值、非有限值或超出轴上限的整组不绘制并提示，不补零、不截断到上限；另一组有效数据仍可显示。全零是有效数据。

轴少于三个时直接显示数据表，由调用方决定其他图形；超过八轴、超过两组或上限无效也不静默切片，改为表格和说明。无有效数据时显示“暂无有效雷达数据，请核对数据表。”，具体原因放入读屏专用说明。长轴名在现有 12px 图表刻度排版中截断至 64px，悬停保留完整轴名，表格提供无需悬停的全文。小容器缩小图形半径、保留字号；恢复宽度后半径恢复。两组分别以实线圆点/虚线菱形呈现，文字始终单色。

```tsx
<RadarChart label="能力维度对照"
  axes={axes.map(axis => ({ ...axis, max: 100 }))}
  series={[{ id: 'current', label: '本次', values: [72, 64, 83, 58, 69] }]} />
```

## HeatmapChart.compact

入口 `/next/components/evidence-matrix#compact-heatmap`。已有热力矩阵默认就显示格内数值；新增 `compact?: boolean`（默认 false）只调整网格边距和轴标签截断，适合约 300px 宽的 3×3／5×3 小矩阵。未传/false 的 SSR 与配置保持一致。完整行列名称可通过悬停与原数据表读取；零值、缺测、外部选中 ID、格式/色阶和选择回调保留原契约。

```tsx
<HeatmapChart compact height={240} label="能力与题目层级"
  rows={rows} columns={columns} cells={cells} onSelect={requestDetails} />
```

## 验证边界

纯函数配置、三主题取色、SSR 文本/数据替代、回调意图、默认兼容与实际 ECharts SVG 几何由自动化测试覆盖。测试使用 P56 `createTestRuntime` 独占目录并只清理自己的产物。SVG 几何测试不是浏览器视觉验收。浏览器验收：按分工由 Supervisor 执行；需检查 light / paper / dark、300px/宽容器、长中文与公式、悬停、键盘图例、主题与宽度恢复、减少动态效果。真实移动设备、读屏器与外部服务未验证。

## P59 数据披露调整

Donut / Radar / Heatmap 的技术说明移入默认收起的“查看数据”；空态仍直接显示，Radar 无法绘制时的表格仍直接显示，技术说明使用读屏专用文本。数值格式规则见 [学情分析图表公开属性](learning-chart-properties.md)。图例、数值事实和图形计算不变。
