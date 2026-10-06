# SegmentedBar 分段条（P22）

PO 2026-10-06 批准加入图表与分析目录。入口 `/next/components/segmented-bar`；实现 `components/prism-next/charts/segmented-bar.tsx`，可由 `analytics-components` 导入。Builder 实现，独立 Review / 浏览器验收由 Supervisor 执行。

## 用途与复用依据

表达同一个总量由哪些部分构成。比较独立类别大小用 ComparisonChart；单值进度或量值用 Progress / Meter。宿主提供分类和数值；无业务归因、阈值、执行器、持久化或内置选中状态。

复用固定 coss MeterTrack（h-2、bg-input），sm 采用现有 Progress 的 h-1.5；复用 StatusComposition 的横向分段、原生按钮与内缩焦点惯例，图例操作使用 Prism Button。既有 StatusComposition 不具备 total 余量、最小段宽及无图例的完整契约，本次按批准目录独立提供。颜色只用语义 / chart 令牌，未改 coss、依赖、全局视觉令牌。

离线复核 `docs/stepper.md`、`docs/score-review.md`、`docs/student-paper-report.md` 对 particles p-meter-3/4、p-progress-1/2/3 的历史记录：量值、分区与单值进度；临时源码缓存本轮未找到，不声称核验当前官网全部分段/堆叠实现。Beautiful UI 不适用于此通用数值图表，无其代码复制。完整记录 `/Users/OLE/HermesWork/.supervisor/prism/p22-checks/sourcing.md`；沿用任务书授权 Meter 组合回退。

## 公开 API

| 属性 | 契约 |
| --- | --- |
| `segments` | 有序只读 `{id,label,value,tone?,description?}[]`；宿主保证 id 唯一。value 为 number。 |
| `label` | 必填 string，整条可访问名称。 |
| `total?` | 默认有效数值之和；大于合计时显示轨道余量。小于合计、负值或非有限值回退有效合计，开发环境告警。 |
| `unit?` | 数值后附加单位，默认空。 |
| `valueFormatter?` | `(value: number, segment: SegmentedBarSegment) => string`；value 为规范化值，segment 是原始对象；返回数值文字，unit 由组件追加。默认固定 zh-CN 格式，最多 15 位有效数字，极小正值不舍入为零。 |
| `legend?` | `below`（默认）按输入顺序列出色点、名称、值、占比、description；`none` 只显示条。 |
| `size?` | `default`（h-2）/ `sm`（h-1.5）。 |
| `onSelect?` | `(segment: SegmentedBarSegment) => void`，回传原始条目；有回调时正值段与全部图例项是按钮，无回调时完全只读。 |

导出 `SegmentedBar`、`SegmentedBarProps`、`SegmentedBarSegment`、`SegmentedBarTone`；tone 默认 neutral，支持 info/success/warning/destructive、chart-1…chart-5。内部布局函数不是公开组件 API；不公开 minSegmentWidth。

## 数值、宽度与可访问性

- 负值 / NaN / Infinity 按 0 呈现，在开发环境挂载/无效状态变化时告警。零值不画色段，图例保留 0 / 0%；空数组或全部 0 显示轨道，可访问名称包含“无数据”。
- 缩放后求和避免大有限数相加溢出。真实占比不受最小宽度影响；占比保留 1 位小数，小于 0.1% 的正占比用 `<0.1%` 表示。
- 正值段内部宽度下限为整条 1%，超多段时上限均摊；锁定极小段后按比例重分剩余宽度（包括余量）。普通比例不变，修正时几何长度不代表精确占比，以文字为准。细分隔在每段内部绘制，不向总宽度额外添加 gap / min-width，无入场动画。
- 只读轨道为 `role=img`，aria-label 含整条 label 与每段名称、值、占比、无数据/余量说明。可选择时同样提供 img 摘要，交互轨道为其兄弟 group，避免 img 抹去后代按钮的语义。图例为 ul/li；不只用颜色承载分类含义。
- 有回调：原生 button 按 Tab 顺序聚焦；Enter / Space 原生激活 click，每次只发意图。零段只能从图例选择，legend=none 时零段没有入口。无回调：无按钮、链接、tabIndex 或其他焦点目标。

## 验证范围

单元数学、SSR、处理器与目录路由测试记录在 P22 报告及 p22-checks。浏览器验收：按分工由 Supervisor 执行。三主题、320px / 390px、实际焦点/键盘、长中文/公式、减少动态效果、触屏和读屏器不能由 SSR 通过推定。
