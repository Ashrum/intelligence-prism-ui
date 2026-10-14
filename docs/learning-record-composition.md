# 学情记录组合预查（P61）

依据 W146「组件核对与最小公开属性缺口」和旧设计 01–37 截图；本轮浏览全部图片缩略联系表，并原尺寸核对 01 学生、09 知识点、18 错题的表格。旧图的跨阶段变化、证据强度点阵不转为组件能力；按 W146 使用近期得分率、补回率、保持率、四档掌握度与明确的数据不足原因。

## 结论与公开属性映射

| 组件 | 已有公开能力 | 三页使用方式与边界 | 新增属性 |
| --- | --- | --- | --- |
| DataRecordTable | `columns[].render: (row) => ReactNode` | 学生、章、知识点、错题主表；单元格组合固定 coss Meter + 数值文字，Badge 表达宿主给定的掌握度。排序 / 勾选 / 展开可在 render 中组合公开 Button / Checkbox / Collapsible，状态由宿主管理 | 无 |
| RecordList | `rows[].description?: ReactNode`、`badges`、`status`、`onRowAction` | 明细抽屉与窄列表在 description 放指标条及掌握度 Badge；已有 progress 表达处理进度，不把它冒充三种学情率。关闭不适用的 showType/showStatus；操作仍只发意图 | 无 |
| SegmentedBar | `segments`、`total`、`legend`、`size`、`percentDecimals` | 四档人数或六状态人数的总量构成；label/value 都由宿主给出。不能把独立的得分率/补回率/保持率加成一根条，也不能用作证据强度点阵 | 无 |
| ComparisonChart | `data`、`unit`、`domain`、`horizontal`、`showValueLabels`、`dataDisclosure` | 无可比再考时展示各项实际值排名，或每周事实计数；缺测 null 留在数据披露，不补 0。完整图表不适合作表格内的小条；小条直接组合 Meter | 无 |

四档文字为“已掌握 / 基本掌握 / 待巩固 / 数据不足”，仅是外部分类事实。组件不比较预期、补回、保持阈值，不新增业务类型或分类函数。示例用中性 outline Badge 保持文字和数值单色；不用截图旧点阵推断等级或把数据不足当最低分。

## 最小组合

```tsx
// 业务端先给出 value、reason、mastery；以下只有呈现。
const rate = (value: number | null, label: string, reason: string) =>
  value === null ? <span>数据不足：{reason}</span> :
  <div className="flex min-w-28 items-center gap-2">
    <Meter value={value} min={0} max={100} aria-label={label} className="w-20 shrink-0" />
    <span className="tabular-nums text-ui-body">{value}%</span>
  </div>

<DataRecordTable rows={rows} columns={[
  { id: 'score', label: '得分率', render: row => rate(row.recent, `${row.label}：得分率`, row.reason) },
  { id: 'mastery', label: '掌握度', render: row => <Badge variant="outline">{row.mastery}</Badge> },
]} />
// 同样的 JSX 可以放进 RecordListRow.description，无须隐藏或选择其内部 DOM。
```

Meter 用于静态量值，沿用原生颜色、尺寸与可访问 min/max/value；外层只控制横向布局和宽度。零值照常显示 0% 与零长度条；没有分母/比较依据的 null 不画空条，直接显示原因。数字的舍入由宿主按口径完成，条长仍传真实值。超过合法范围的数据须由宿主校验，不默默改成有效率。

## 示例与验收入口

`/next/components/evidence-table#learning-record-properties` 同屏提供 DataRecordTable、RecordList、SegmentedBar 和 ComparisonChart 的公开组合。包含三种率、四档标记、0%、缺测说明、长中文与 MathML、“320px 容器”开关，点击“查看”只回显请求。表格保留原生横向滚动，记录列表按原组件自然换行，不缩字号。示例局部的 LearningRateCell 是演示辅助函数，不是新增目录组件或公开组件 API。

复用检索记录见 [P61 图表说明](learning-chart-properties.md#p61图例帮助与等距刻度)；本轮没有修改上述四组件的运行时 API。SSR 验证三主题事实文字、Meter 零值及缺测不画条；实际主题、窄屏、长文公式、滚动与键盘操作需在浏览器验收。

浏览器验收：按分工由 Supervisor 执行。
