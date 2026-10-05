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
