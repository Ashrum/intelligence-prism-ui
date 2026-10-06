# Question Analysis Panel 本题分析面板 · C2 契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。
入口 `/next/components/question-analysis-panel`；实现 `components/prism-next/question-analysis-panel.tsx`。

## 复用依据

本批通用预览组件，非 Agent 执行组件，Beautiful UI 不适用。读取 Supervisor 审核缓存 registry（579 项）及 particles `p-group-11`、`p-combobox-10`、`p-tabs-10/14`、`p-select-20`、`p-meter-3`、`p-frame-1` 源码；路径见 [第一批复用依据](review-workspace.md#复用依据)。核对固定 coss Group/Combobox/Tabs/Select/Collapsible/Meter/Frame/Tooltip/Badge 与现有 ReviewSwitcher、QuestionRail、QuestionContent、PaperPreview。采用标准控件、分组搜索、量值与折叠组合；其余提取自冻结题目预览，不复制 particles 演示数据或视觉覆盖。本轮未联网刷新上游，未复制 Beautiful UI 代码。

## 公开属性与边界

statistics 已格式化的 mean/sd/d/discrimination/fullRate/zeroRate；distribution、pending、insight、errorAnswers 或 errorAnswersSlot、reasons、related 是外部事实。knowledge 有值时替换为专题、Meter、影响人数、证据量/清单和提醒；onKnowledge/onEvidence 仅发意图。

筛选、排序、统计计算、业务身份转换、权限、持久化、路由与意图回执由宿主负责。组件不导入 examples 或 Workspace 私有类型，不内置服务或计时器；没有给定的数据不作统计推断。辅助导出不另增目录条目。

## 验证

组件页提供 light/paper/dark、320px、长中文与 MathML；自动测试覆盖事实、意图及目录页。题目评审十态重构前快照与第一批试卷/旧 PaperPreview 快照保持一致，原冻结测试文件不改。
浏览器工具明确拒绝 localhost:5173（此前拒绝授权），未绕过。三主题、窄容器、实际焦点/滚动/缩放/旋转/触摸和读屏器未获本轮实测；没有真实服务验证。

## G2 · 真实数据不全（2026-10-03）

复读 Supervisor 本地缓存 registry（`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`）的 Tabs / Collapsible / Meter / Frame 条目与 particles `p-tabs-10`、`p-meter-3`、`p-frame-1`、`p-toolbar-1`，核对固定 coss Collapsible / Meter / Frame。继续扩展现有组件：Tabs 承载字段、Collapsible 承载名单、Frame 承载主体；Meter 仅表达已知值，空态沿用语义文字。无适配缺口需要新组件，不复制 particles 演示样式或数据；通用题目预览不属于 Agent 执行组件，Beautiful UI 不适用。未联网刷新上游。

| 可选属性 / 行为 | 契约 |
| --- | --- |
| `reasonsEmptyText / relatedEmptyText / evidenceEmptyText?: ReactNode` | 仅对应数组为空且提供文本时，分别出现在“主要失分原因”“关联知识点”“证据清单”标题下。证据清单空态在 knowledge 视图出现。 |
| `knowledge.rate?: number 或 null`、`rateEmptyText?: ReactNode` | 缺失、null 或非有限数值不画 Meter，显示宿主 rateEmptyText；已知 0 正常画 0% Meter。 |
| `knowledge.volumeText?: ReactNode` | 宿主传完整证据量文本，例如“12 分 · 1 道证据题”或“证据量未提供”，组件不加“分”、题数或其他单位。旧 volume 属性可省略，保留为原样内容回退，宿主需自行格式化。冻结页显式传原字符串。 |
| `statistics` | 全部值已是 ReactNode，可直接传“未提供”。fullRate/zeroRate 的数字或数字字符串保持既有百分号；非数字文案与已带 % 的字符串原样显示，不产生“未提供%”或重复百分号。 |

空态不是推断结果；reasons/related/evidence 数组仍由宿主必传，其他已知统计仍按原规则显示。

本轮浏览器访问 `http://localhost:5173/next/components/question-analysis-card` 被工具安全策略拒绝（该地址此前被用户拒绝授权），未绕过。已提供三主题窄容器夹具与自动化证据，实际交互、视觉、焦点、滚动和读屏器留待 Supervisor 复验；不以 SSR 冒充浏览器验收。检查数字见 `/tmp/prism-comp/Report-G2.md`。

## P20 · 自定义影响标签与补充统计（2026-10-05）

复用检索见 [ComparisonChart P20 记录](comparison-chart.md#p20-复用依据2026-10-05)：沿用已有统计 dl/dt/dd、语义字号与固定 coss Badge；不新增组件、视觉令牌、依赖或业务推断。

- `affectedLabel?: string`：仅替换知识点概况“受影响”，默认仍为“受影响”；不改既有人数/总人数格式。
- `supplementaryMetrics?: { label: string; value: ReactNode; hint?: ReactNode }[]`：题目视图追加在原四项统计之后，保留原顺序、样式及两列布局；知识点视图在证据量之后、状态与证据清单之前追加同样的统计布局。新增项允许换行，hint 沿用 text-ui-hint / muted 角色；0、未知文字和公式都原样显示，不计算任何指标。
- 未传属性或传空列表均不新增 DOM；原调用与 main SSR 逐字节一致。组件页新增三主题 320px 夹具，按钮切换题目/知识点，两者都可查看处理、错误影响、证据强度与本校差距及长中文/公式。

## P23 · 精简版式（2026-10-06）

`layout="compact"` 用于 320–400px 分析栏：结论 → 最多三个关键数 → 分布 → 对比 → 错因 → 可展开行 → 错误作答/知识点/操作区。只展示宿主已提供的事实；不计算错误率、不判断处理方式、不排序或挑选参照。省略 layout 或 `layout="detailed"` 时仍走原实现，旧六态 SSR 逐字节保持。

### 复用与画布适配

复读固定 coss Popover / Collapsible / Meter / Tooltip / Badge / Alert，及 SegmentedBar、ComparisonChart。离线检索 `.sites-runtime/easyui-research-20261005/coss-registry.json` 的 `p-popover-1/2/3/4`、`p-collapsible-1`、`p-meter-1/2/3/4`；读取缓存 `coss-source/p-popover-3.tsx`，采用 Trigger render Button / Popup / Title 组合。meter/collapsible 的 particles 单项源码不在缓存，仅核对其元信息与固定组件源码/本地组合，不声称本轮已读其远端源码；未联网。通用组件不适用 Beautiful UI，不复制第三方代码。

分段直接用 SegmentedBar；人数条用 coss Meter；对比在本组件内部组合居中零线、语义色条和可见数值。ComparisonChart 的完整数轴/图例/数据表布局不适合该密度，不修改其行为、不增公共图表条目。Alert 使用 `role="group"` 承载普通结论，无警报或 live region；Badge 保持标准变体。长说明用 Popover，不用 Tooltip 独占承载。

画布中的局部 12/13/15/18px 字号、硬编码颜色、卡片阴影与圆角改用已有控件/语义字号；关键数为 `text-stat-display`，辅助文案为 ui-hint/meta。外框由宿主容器提供。SegmentedBar 保留既有纵向图例与占比。零差值无假最小条；比较条使用统一对称尺度，不照搬画布的固定缩放与最小 3% 条宽。

### 属性

公开 `QuestionAnalysisPanelProps` 为 `QuestionAnalysisPanelDetailedProps | QuestionAnalysisPanelCompactProps` 判别联合。旧属性类型保留，新增 compact 分支中的旧属性均可省略；原 `distribution: number[]` 仅 detailed 必填。旧 fixture 可使用 `QuestionAnalysisPanelDetailedProps` 精确标注，compact 宿主使用 `QuestionAnalysisPanelCompactProps`。

| compact 属性 | 约定 |
| --- | --- |
| `layout: 'compact'`、`title?: string` | title 默认“本题分析”。 |
| `verdict?: { label: string; tone: 'neutral' \| 'info' \| 'success' \| 'warning' \| 'destructive'; summary: ReactNode }` | 一枚处理徽标与一句外部结论；不提供则不显示。 |
| `keyMetrics?: { id: string; label: string; value: ReactNode; hint?: ReactNode; badge?: ReactNode }[]` | 按原顺序首层最多 3 个；余项自动进入说明。null/undefined 值显示“未提供”，0 保留。id 须唯一。 |
| `distribution?: { kind: 'options'; title: string; aside?: ReactNode; options: { id: string; label: string; count: number \| null; correct?: boolean; emphasis?: boolean }[]; legend?: ReactNode }` | 选项逐行显示；correct 用 success 色并显示“正确”，优先于 emphasis。emphasis 用 destructive 色；其他用 chart-1。legend 文字由宿主提供，不按颜色猜正确选项。 |
| `distribution?: { kind: 'segments'; title: string; aside?: ReactNode; segments: readonly SegmentedBarSegment[] }` | SegmentedBar 默认图例，单位“人”；分段须为已知非负有限值，缺测用 options/null 或 distributionSlot 显示，不能伪造零。 |
| `distributionSlot?: ReactNode` | 位于结构化分布之后的自定义分布插槽，可单独使用。 |
| `comparisons?: { title: string; unit?: string; items: { id: string; label: string; value: number \| null; source?: ReactNode; date?: ReactNode }[]; maxVisible?: number }` | 默认首 3 项，余项与每条来源/日期进入说明；有余项显示“另有 n 个参照”。不从名称挑选参照。 |
| `causes?: { title: string; items: { id: string; label: string; count: number \| null }[]; maxVisible?: number }` | 默认 4 行，最多 4 行，其余进入“更多错因”折叠行；未传 causes 时可沿用旧 reasons。 |
| `disclosures?: { id: string; label: string; meta?: ReactNode; content: ReactNode }[]` | 按顺序提供默认收起的 coss Collapsible 行；meta 例如“4 组”。 |
| `notes?: { title?: string; sections: { id: string; heading: string; content: ReactNode }[] }` | 说明标题默认“说明”；宿主 sections 在前，组件自动追加剩余统计、参照说明、旧补充说明。全部为空时不显示触发。 |
| `actions?: ReactNode` | 尾部操作插槽，业务事件完全由宿主提供。 |

`maxVisible` 取非负整数，小数向下取整，非法值回退默认；0 表示全部折叠。人数条按同组最大人数缩放，对比按全部参照最大绝对值（至少 1）共用 ±尺度；这些计算只决定绘图几何，不产生统计结论。0 保留可见数字且不画假条；null/非有限值显示“未提供”，不画条；负人数视为无效缺测。正比较值加 `+`，负值保留 `-`；单位在区块标题旁、可访问名称和说明的隐藏条目中显示。

### 旧统计迁移与去重

- `statistics` 在 compact 中进入说明，除非被 keyMetrics 采用；规范 id 为 `mean / sd / d / fullRate / zeroRate`。`mean` 继承 `max` 的“满分”hint；`d` 继承 `discrimination` 的 badge。百分号处理保持已有规则。
- `supplementaryMetrics` 可新增 `id?: string`，省略时以 label 为身份；原 detailed 渲染不变。keyMetrics 的 id 与旧统计身份相同，**或 label 完全相同**，即采用该项；关键项的 value/label 优先，未提供的 hint/badge 继承。不要将不同口径统计标记为同 id 或同 label；条目身份须唯一。
- 所有 keyMetrics（包括第 4 个以后的项）先去重，首 3 个在首层、其余仅在说明，未采用的旧统计追加其后。组件不解析 ReactNode 或按数值猜同一统计。
- 可见参照的来源/日期仅在说明中出现，并保留范围名以识别；数值不重复。折叠参照在说明中同时有值/单位/来源/日期，缺元信息标“未提供”。
- 旧 `distribution: number[]` 若随 props 展开传给 compact，仅在说明中原顺序呈现，不猜题型标签；应改传 options/segments。显式传入的旧 insight/pending 也进入说明。
- `errorAnswersSlot` 在 compact 对全部题型可用，显式 null 隐藏且不回退；未传时沿用 errorAnswers。related/onKnowledge、空态文案及 knowledge/onEvidence 在尾部保持可用；knowledge 的 rate、证据量与未知值沿用原契约。旧 affected/rate/kind 不推导新图表或结论。

```tsx
<QuestionAnalysisPanel layout="compact"
  verdict={{ label: '课堂讲评', tone: 'info', summary: '主要失分点为计算错误。' }}
  keyMetrics={[{ id: 'mean', label: '平均分', value: '6.6', hint: '满分 10' }]}
  comparisons={{ title: '得分率对比', unit: '百分点', items: references }}
  disclosures={[{ id: 'errors', label: '常见错误作答', meta: '4 组', content: errorGroups }]}
  notes={{ sections: [{ id: 'method', heading: '统计口径', content: methodText }] }} />
```

### 可访问性与验收入口

人数 Meter 与对比条有“名称 + 数值”可访问名称，正确项同时显示文字，数值与正负号始终可见。说明按钮、折叠按钮使用 coss/Prism 原生 Button；Enter/Space 打开，Popover 的 Esc/回焦点沿用 coss，展开行补充 Esc 收起并回自身触发点。Portal 留在实例主题容器，减少动态沿用全局规则及 motion-reduce。

组件页 `/next/components/question-analysis-panel#compact` 有选择题、解答题、缺数据三组 light/paper/dark 的 320px 夹具；展开解答题的“常见错误作答 · 4 组”可见长中文与 MathML。缺数据例没有结论、参照和说明按钮。SSR/处理器检查不替代浏览器验收，真实视觉/键盘/焦点/滚动由 Supervisor 执行。
