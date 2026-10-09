# ComparisonChart 比较与分段分布

入口 `/next/components/comparison-chart`、`/next/components/distribution-chart`。实现 `components/prism-next/charts/basic-charts.tsx`；现有 Recharts 引擎，数据表复用 DataRecordTable / 固定 coss Table。

## P20 复用依据（2026-10-05）

核对固定 coss Table / Badge、既有 DataRecordTable / ComparisonChart / QuestionAnalysisPanel；检索本地 particles 示例、测试及 review-workspace / paper-review-design 文档的 p-meter-3、p-frame-1、p-tabs-10、p-badge-16 记录，提供量值/框架/标签组合但无图表参考线映射。历史 registry 缓存已不存在，未联网刷新或宣称读取单项源码。本任务为通用图表展示，Beautiful UI 不适用。沿用 Recharts 的实际 plot area 坐标，不新增组件条目、依赖、视觉令牌或复制第三方代码。

## 可选 API

`referenceLines?: { value: number; label: string; tone?: 'info' | 'success' | 'warning' | 'destructive' | 'neutral' }[]`。tone 默认 neutral，颜色来自现有语义前景令牌。域外或非有限值忽略、不报错、不扩大域；同值多线保留各自标签与表格行，线位不作偏移。标签在图下按输入顺序分行并自然换行，虚线提供同名 SVG title，不将长中文塞入有限绘图区。参考线写入图的 `aria-description` 与“查看数据”下的只读参考线表，不触发 `onSelect`。

新增可选 `data[].range?: [number, number]`，只用于宿主已分箱的数据。没有 range 时参考线使用柱长的数值轴；横条图画垂直线，竖柱图画水平线。有 range 时参考线改用分段类别轴；竖柱分布画垂直线，横条分布画水平线。`domain` 始终表示柱长/频数的数值域，`unit` 始终为柱长单位（如“人”），不会误附到分数参考值。

## 映射规则

- 无 range：有效 `domain=[min,max]` 优先，否则使用有限数据的含零范围，空/全零回退 `[0,1]`。有有效参考线时显式使用该精确域，不做 nice 扩张；超域柱形按该域裁切。位置为 `(value-min)/(max-min)`，边界 0/1 均保留。未传新属性时保持既有 Recharts 自动域与 SSR 输出。
- 分段：所有点必须提供有限、递增、按输入顺序不重叠的 `[start,end]`；每类仍占相同带宽，段内线性插值。位置为 `(段索引 + (value-start)/(end-start)) / 段数`，从类别轴起点计。
- 各段左闭右开，最后一段上界也可命中。连续十段 `[0,10)`…`[90,100]` 中：60 → `[60,70)` 左边界（60%），85 → `[80,90)` 中点（85%），90 → 末段左边界，100 → 末段右边界。不同宽度的区间仍按每段等宽、段内插值，不伪装连续等距数轴。
- 间隙中的值、域外值、NaN/Infinity 不画线；range 缺项/倒置/重叠/乱序时整组参考线忽略，不退回频数轴，避免把分数当人数。组件不解析标签、不分箱、不推断及格或优秀标准。

```tsx
<ComparisonChart label="分数段人数" horizontal={false} unit="人"
  data={bins.map(bin => ({ id: bin.id, label: bin.label, value: bin.count, range: bin.range }))}
  referenceLines={[
    { value: 60, label: '及格线', tone: 'warning' },
    { value: 85, label: '优秀线', tone: 'success' },
    { value: 90, label: '目标线', tone: 'info' },
  ]}
/>
```

组件页含三条分数参考线、横/纵数值轴、同值与长中文、light/paper/dark 的 320px 夹具。单元测试覆盖映射、方向、标签/可访问描述/表格和旧调用逐字节 SSR；浏览器验收按分工由 Supervisor 执行。

## P21 可选图内标签（2026-10-06）

离线检索固定 coss 54 项（无 Chart 原始组件）、Table / Badge、particles 的 p-meter-3/4、p-frame-1、p-badge-16、p-tabs-10 本地记录；未找到柱顶或参考线图内标签实现。沿用 Recharts LabelList / Rectangle / usePlotArea 与 Prism 参考线层，不复制第三方代码。远端 registry 未联网刷新，检索记录在 Supervisor 的 `p21-checks/sourcing.md`。

| 属性 | 默认 | 约定 |
| --- | --- | --- |
| `showValueLabels?: boolean` | `false` | 在柱末端显示值；正值为柱顶/柱右，负值为柱底/柱左。零值显示，null/非有限值不显示。开启后仅调整绘图留白，不改变数值轴 domain 或参考线含义。 |
| `valueLabelFormatter?: (value: number, datum: ComparisonChartPoint) => string` | tooltip 的 `${value}${unit}` | 仅在开启标签时调用，传入原始 datum；空串隐藏该项标签（包括 0）。不改变 tooltip、表格、数值或位置，不解析回调文本。 |
| `referenceLabelPlacement?: 'legend' \| 'plot'` | `'legend'` | plot 在绘图区上方专用标注带显示“名称 数值”，颜色与线一致；移除下方重复图例，空间不足则回退图例，保留 SVG title、aria-description 与参考线数据表。 |
| `dataDisclosure?: 'details' \| 'none'` | `'details'` | none 不渲染可见 details，以 sr-only 只读表保留完整原始值及参考线，不留下隐藏按钮；宿主须提供可见数据入口及所需键盘选择操作。 |

- 图内文字直接沿用刻度的字体样式，不新增视觉令牌、动画或主题判断。默认 API（包括 P20 参考线）保持逐字节 SSR。
- `plot` 的纵向与横向图统一使用绘图区上方的专用标注带，位于数值轴最大刻度、类目刻度和柱末端标签之上。按实际容器宽度换行、按文本包围盒逐行避让；行高沿用刻度字号的 1.5 倍（18px），上下各留 6px，碰撞移至下一可用行并增加带高。右侧容纳不下时文字翻到线左侧；完整名称保留在 title/说明/表格。垂直参考线从标注带顶部延伸到绘图区底部，参考值映射与数值域不变。
- 标注带优先占用高度，绘图区相应收缩；数值标签的原有留白保留在标注带下方，越域柱值标签也不能进入标注带。不增加虚假数值轴最大值，刻度仍对应原 domain。
- 确定降级：可用绘图区高度为 `height - 原 top 留白 - 原 bottom 留白 - XAxis 高度 30px`；扣除完整标注带后若不足 24px（两倍刻度字号），或绘图区宽度不足 24px，则整组参考标签回到原图下图例，取消专用带，虚线、可访问说明及表格保留。开启 showValueLabels 的非负数据原 top/bottom 为 30/6px；120px、140px 图高也遵循此规则，密集或长名称必要时回退，不裁切文字。容器尺寸变化会重新判断并可恢复标注带。
- `range` 在本组件中是**类别分段**，并非误差范围；当前没有 ErrorBar 或误差区间 API。柱值标签从实际柱末端定位，不将 range 当作柱值/误差位置，也不增设误差条语义。将来若支持误差条，其端点避让需另立契约。
- 横向为完整数值文本预留右侧留白；极长 formatter 文本宜由宿主缩短或提供足够容器宽度，不能靠缩字号容纳。参考线 unit 规则保持 P20：range 分段线不附频数单位。

```tsx
<ComparisonChart label="分段分布" data={bins} horizontal={false} unit="人"
  showValueLabels referenceLines={references} referenceLabelPlacement="plot"
  dataDisclosure="none" />
// 宿主另提供可见数据入口；可选 valueLabelFormatter={(value, datum) => `${value}`}
```

两组件页的 `#plot-labels` 提供 140px 纵向十柱矮图（40/60/85 三线），横向十柱四线保留 0 值、85/90 相邻线及长中文名称。横向示例展示 dataDisclosure=none 与宿主可见表格入口。
