# v1.14.0 字体实施候选 · 组件复用约定

组件负责呈现数据与返回事件。统计口径、流程跳转、业务判断、存储与模拟数据由调用方负责。所有 UI 使用现有 coss 控件、语义主题和数学字体；不重新实现按钮、选择框或 Drawer。

## 源码接入

80 个组件的既有行为基线沿用 v1.13.1；本轮统一字体为实施验证候选。按需复用源文件及其直接依赖，组件示例与应用示例用于说明用法。仓库保留 `private: true`，不通过 npm 包安装。

| 接入项 | 要求 |
| --- | --- |
| 运行依赖 | 当前验证基线：React 19.2.6、Tailwind CSS 4.2.1、Base UI 1.8.0；其他版本以 `package-lock.json` 为准。React 18 / Tailwind 3 需由接入项目另行适配验证 |
| 源码与别名 | 基础组件位于 `components/coss`；组合与扩展位于 `components/prism-next`。保留其 `lib` 依赖及 `@/*` 路径映射 |
| 样式 | 以 `app/(next)/next/theme.css` 为入口，保留 `vendor/coss-animations.css` 和 `tw-animate-css`；迁移目录时同步修正相对导入路径 |
| 主题根节点 | `html` 保留 `data-ui-version="coss-v1"`；`ThemeProvider` 使用 `attribute="data-prism-theme"` 和 `light` / `paper` / `dark` 三主题，浮层与正文共享主题 |
| 上下文 | 参考 `components/prism-next/providers.tsx` 组合 Theme、Motion、Tooltip 和 Toast；ECharts 封装也依赖主题上下文 |
| 数学字体 | 同步 `public/fonts/typography-review/stix-two-math.woff2` 及该目录授权文件；更改公开路径时同步 CSS 的字体 URL |
| 数据与事件 | 从业务容器传入真实数据、受控状态和回调。`fixtures`、`demos`、`examples` 中的数据和工作流仅供参考 |

在现有项目内直接导入组件：

```tsx
import { Button } from "@/components/coss/button"
import { Card, CardHeader, CardTitle, CardPanel } from "@/components/coss/card"

export function MaterialCard({ title, onOpen }: { title: string; onOpen: () => void }) {
  return <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardPanel><Button onClick={onOpen}>打开材料</Button></CardPanel>
  </Card>
}
```

该示例在客户端组件中使用。迁入其他框架时，按实际导入替换 Next.js 的 Link、导航或图片适配；不需要带入站点 Shell、组件目录或业务演示页面。

## Workspace 适配回收 v0.1

基于 Workspace `4e0d656` 的通用适配，保持本仓 main 既有默认值与 Typography v0.2.1。以下均不接 Store、权限判定、Runtime 或持久化；示例只手动设置外部状态。

| 组件 / 属性 | 默认值 | 语义与边界 |
| --- | --- | --- |
| AgentComposer `scope?: ReactNode` | 未提供 | conversation 位于 InputGroup 顶部、材料之前；default / compact 位于标签之后、文本区之前。范围由宿主提供 |
| AgentComposer `sendDisabled?: boolean` | `false` | 禁止表单与 Ctrl/⌘+Enter 发送，仍允许编辑 |
| AgentComposer `sendDisabledReason?: string` | 未提供 | 非空原因本身即阻断发送；以 `role=status` 常驻显示，输入与发送按钮用 `aria-describedby` 关联。建议阻断时始终提供具体原因 |
| AgentComposer `readOnly?: boolean` | `false` | 透传原生只读属性，保留可阅读/复制的草稿，同时阻止发送。运行态仍禁用输入；停止动作只取决于 `running / onStop`。宿主负责约束 scope/tools/suggestions 等插槽内控件 |
| MetricSummary `density?: 'default' / 'compact'` | `default` | compact 两列、标签与数值基线排列，说明另起一行；只改变布局，保留 analytics-value 字体与外部查看回调 |
| StatusComposition `density?: 'default' / 'compact'` | `default` | compact 图例横向换行，只读条 8px、可选择条仍 32px。只读图例显示数量，完整数量和占比保留于可访问说明及 title；零值、缺测、无效值规则保持 |
| QuestionPrint `showQuestionIds?: boolean` | `true` | `false` 隐藏纸面题目标识/版本行；题目序号、内部来源版本与版次计算不变，开关变化重新分页。不是敏感信息脱敏功能 |
| Prism Badge `variant='attention'` | 原 variant 默认不变 | 映射 coss 已有 error 变体；文字应表达待人工处理，不推断任务失败。Prism 默认 size 继续为 lg |
| Prism Button `size='navigation' / 'navigation-icon'` | 原 size 默认不变 | 从 `components/prism-next/button` 导入；文字按钮最小 40px、自适应高度，图标按钮 40px，粗指针最小/固定 44px。保留 coss 原字体与事件，可与 info 变体组合 |
| Prism Button `variant='info'` | 原 variant 默认不变 | 信息色用于“引导/信息性操作”，不替代主操作（default）层级，每个操作区仍只有一个主要动作。复用既有 info 语义令牌，保留 coss 尺寸、焦点、disabled、loading 与 render 行为 |
| Prism Toolbar `variant='framed' / 'plain'` | `framed` | 从 `components/prism-next/toolbar` 导入；framed 完整复用 coss，plain 复用同一 Base UI root 和子组件，仅省略外框，保留键盘与导航语义 |

Composer 的统一发送条件为 `!running && !readOnly && !sendDisabled && !sendDisabledReason && value.trim()`；不传新属性时原渲染与行为保持。发送原因不自动解除、只读不自动改变运行状态，组件不自行决定可用范围。示例：`/next/components/agent-components#composer-adaptations`、`/next/components/metric-summary#compact-summary`、`/next/components/status-composition#compact-composition`、`/next/components/question#print-metadata`、`/next/components/badge`、`/next/components/button`、`/next/components/toolbar`。

迁移时可用本次 Prism 源码替换 Composer、data-display、QuestionPrint、Badge；QuestionWorkPanel 与当前 Workspace 源码已一致。仍须同步直接依赖、Typography 样式及新的 Agent 语义导出，不回退 main 的任务快照语义。Button / Toolbar 的调用先切换 Prism 导入，再恢复相应 coss 原文件。Button info 已获 Product Owner 2026-09-24 批准，在 Prism 适配层复用 Workspace `4e0d656` 的 `border-info/30 bg-info/10 text-info-foreground hover:bg-info/20 focus-visible:ring-info`，加载指示器沿用 info-foreground 以保持可见。主题动画相对路径继续由宿主适配。Sidebar 本地中文/兼容保护、md=768、EmptyTitle lg 尚不能直接覆盖：涉及内部能力或规范冲突，保留到独立迁移与产品决定；本轮不修改 Workspace，也不证明升级已通过。

## 对比查看器两态 v0.1

2026-09-24 设计候选，语义 15，支持 **Inline + 专用扩展内容**。检索与复用依据：当前 `AgentChangeReview` 已提供逐项比较、采用/保留及预览插槽；`32382e9:components/prism-next/agent-components.tsx` 已有组级 `AgentChangeSet`，本轮仅回收此组合与类型，扩展冲突和受控应用。没有新增目录条目、差异算法、承载骨架或 Workspace 业务类型。

从 `components/prism-next/agent-components` 导入 `AgentChangeSet`、`AgentChangeSetProps`、`AgentChangeSetItem`、`AgentChangeDecision`。

| 公开属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `view` | 必填 `'inline' / 'workspace'` | 两态内容选择；不创建面板，不改动 `presentation` 的外框语义 |
| `title / basis` | 必填 `string` | 整组标题与依据版本/来源；未知信息由宿主明确描述 |
| `items` | 必填 `readonly AgentChangeSetItem[]` | 两态使用同一受控集合；空数组显示“当前没有修改” |
| `inlineLimit` | `number`，默认 `2` | 有展开能力时展示前 N 项，加上所有关键项、冲突项，保持原顺序；有限值向下取整且至少 1，非有限值回退 2 |
| `onDecision` | 必填 `(id, decision: AgentChangeDecision) => void` | `accepted / kept` 为采用/保留意图；重新选择发出 `pending`；不变更草稿、清除冲突或保存 |
| `onRewrite` | 可选 `(id: string, value: string) => void` | 提供时显示带固定标签的受控文本区；改写后是否重置决定由宿主处理 |
| `onExpand` | 可选 `(trigger: HTMLButtonElement) => void` | 仅 inline 显示入口；不传则隐藏入口且显示全部项，避免不可达；宿主保存触发器并负责承载、焦点与返回恢复 |
| `notice` | 可选 `string` | 整组冲突/过期等事实提示，`role=status`；不自动阻断任何动作 |
| `details` | 可选 `ReactNode`，默认未提供 | 补充说明插槽，复用 coss Collapsible，入口为“说明”、默认收起；两态均可用，未提供时无入口。仅管理说明的展开，不触发业务回调；不放冲突、禁用原因或必要状态事实 |
| `disabledReason` | 可选 `string` | 非空时整组决定、重新选择、改写与应用禁用；比较与展开仍可用 |
| `apply` | 可选 `{ label: string; onApply: () => void; disabledReason?: string }` | 提供才显示动作；整组或动作的非空原因阻断应用并可访问关联。组件不按采用数量、冲突或项目禁用状态推算可应用性，不计算应用结果 |

`AgentChangeSetItem`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `id / title` | 必填 `string` | 集合内稳定唯一 ID / 项标题；采用、保留与重新选择的可访问名称含标题 |
| `before / after / reason` | 必填 `string` | 修改前、候选内容与建议理由；before 应明确对应当前比较对象，after 为受控候选 |
| `decision` | 必填 `'pending' / 'accepted' / 'kept'` | 外部决定状态；“已采用”仅指采用选择，不代表已应用、核对或保存 |
| `scope` | 可选 `string` | 适用范围，例如题干、第 1 页 |
| `critical` | 可选 `boolean`，默认未标记 | 标记后不受 inlineLimit 截断 |
| `conflict` | 可选 `{ baseLabel: string; currentLabel: string; description?: string }` | 显示“候选基于 rN，当前为 rM”及说明；同关键项始终可见，仍可比较后采用或保留，不推断冲突解决 |
| `beforePreview / afterPreview` | 可选 `ReactNode` | 宿主数学/领域渲染；缺省使用字符串正文，保留 before/after 作为文本与改写值 |
| `disabledReason` | 可选 `string` | 非空时只禁用本项决定、重新选择与改写，不隐含整组应用策略；宿主通过 apply.disabledReason 表达应用限制 |

逐项比较沿用 `AgentChangeReview`：当 before 与 after 相同或 after 为空白时采用按钮禁用，保留仍可用；这与冲突无关。各项禁用原因常驻显示，并与相关控件关联。数学插槽的内容有效性、可访问性及字符串一致性由宿主负责。

**组件职责**：渲染依据、统计外部决定、筛选 inline 可见项、呈现冲突和禁用原因、发出带 ID 的意图。关键项与冲突项始终显示，不受 inlineLimit 截断；不提供整组采纳。改写与采用只发出意图；草稿变更、应用、保存和提交由宿主处理。无 Store、路由、持久化、执行器、权限判断或保存状态；切换 view 不发出任何业务回调。

**宿主职责与 P04 接入**：

- 将同一份 P04 候选集按“题目 ID + 字段”映射到稳定 `items.id`，标题可为“第 2 题 · 对称轴”；`before` 传当前待比较草稿，`after` 传候选或手动改写内容。保留来源/候选基准到 basis，逐项版本变化由宿主检测后传 conflict；无需为两态各建一份草稿。
- `onDecision` 仅维护采用意向；`onRewrite` 更新候选并按宿主规则撤销旧选择。组件不会替宿主写入 P04 题目或清除冲突。
- `apply.onApply` 由宿主读取当前受控选择，再核验对象、权限、版本及适用范围，应用 accepted 项并返回真实结果；保存是独立动作。无 adopted 项、执行中或宿主不允许应用时，通过 `apply.disabledReason` 给出事实原因；组件不会自行阻断冲突项的比较选择。
- `onExpand(trigger)` 打开 Workspace `/teacher/agent/workspace` 既有工作区，传同一 items 和回调、`view="workspace"`；返回与重新打开保留候选、决定和阅读位置，并恢复触发器焦点。省略 onExpand 的 inline 显示全部项。
- `beforePreview / afterPreview` 可组合既有 `DraftMathPreview`，分别传当前文本；组件不绑定数学库或题目私有结构。

独立组件示例在 `/next/components/agent-components#change-set-two-state`，数据仅位于 `demos`；手动采用、改写与应用意图不证明业务生效。真实两态验证必须在 Workspace P04 流程完成；本仓库 `/next/skeletons/agent` 为历史骨架，不作验收依据。本轮未修改 Workspace，浏览器三主题、窄容器、长中文/公式实看、键盘/读屏及接入持久化仍待验证。

## 下钻与证据浏览 v0.1

2026-09-25 设计候选，语义 **21 下钻与证据浏览**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-evidence-drilldown` 导入 `AgentEvidenceDrilldown` 及同文件公开类型。不增加 80 项目录条目；宿主接入验证入口仍为 `/teacher/agent/workspace`。

复用检索依据：`DiagnosisEvidenceTable` 已提供观察、来源、定位与查看回调，适合作为诊断入口，但没有多层证据导航；`DocumentRegionViewer` 已有受控区域与定位，作为证据预览插槽使用；`AgentContextList / AgentContextSummary` 提供来源行及独立事实呈现起点。新组合复用 AgentContextList、Card、Button、Prism Badge、Breadcrumb 与 RecordDetails；compact 沿用记录组件的可换行列表布局。原有三组件无需修改；不引入取数、权限判断、业务 Store、路由、持久化或 Workspace 私有类型。

### 公开 API

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `conclusion` | 必填 `AgentEvidenceConclusion` | `id / statement` 必填；可选 `version / snapshot / summary / evidenceCount / coverage`。id 引用宿主结论；statement 为结论陈述，summary 为依据摘要。历史快照显式传 snapshot；版本缺省显示未确认，不从对象补造 |
| `nodes` | 必填 `readonly AgentEvidenceNode[]` | 结论之下的对象／证据树。兄弟节点 ID 唯一、跨两态稳定；顺序由宿主决定，前两条可披露证据用于摘要。允许学生 → 题目 → 作答片段等多层对象 |
| `view / density` | `inline / workspace` 默认 inline；`default / compact` 默认 default | compact 是密度，可与任一 view 组合；只改变布局和间距，不改变事实、字号或能力 |
| `path` | `readonly string[]`，默认 `[]` | `[]` 是结论；各 ID 逐层选中子节点。完全受控，无内部路径副本；找不到路径时说明当前位置未提供，不回退展示其他对象或旧预览 |
| `onNavigate` | 可选 `(path, trigger: HTMLButtonElement) => void` | 只请求进入对象／证据、返回上层或面包屑层级；值更新后才改变呈现。缺省只读展示指定层级，没有假导航按钮；宿主负责焦点、滚动和两态恢复 |
| `onExpand` | 可选 `(trigger: HTMLButtonElement) => void` | 仅 inline 显示“查看证据链”；缺省隐藏入口并展示全部已提供证据摘要，避免第三条以后不可达；不创建面板或改变 path |
| `onOpen` | 可选 `(intent: AgentEvidenceOpenIntent, trigger: HTMLButtonElement) => void` | 节点还须显式提供 `openable=true` 才显示打开入口；intent 为 `{kind:'object'/'evidence', conclusionId, nodeId, path}`。不取数、不改写事实；由宿主解析身份／版本并重新核验授权 |
| `onBack` | 可选 `() => void` | workspace 的“返回原位置”；仅返回原入口，不取消、提交或改变结论。原触发器、阅读位置和焦点由宿主保存与恢复 |
| `notice / details` | 可选 `string / ReactNode` | notice 是至多一条常驻边界提示；details 复用“说明”默认收起。记录缺失、不可用、访问限制等必要事实不得放入 details |

`AgentEvidenceConclusion.coverage: AgentEvidenceCoverage` 是 `{state:'complete'/'incomplete'/'unavailable'/'unknown', description?}`。分别显示“记录覆盖完整／记录不完整／记录暂不可用／覆盖状态未确认”。证据数量与覆盖情况**仅在宿主提供时显示**，不以树中条目数充当总体数量或分母。没有传 coverage 表示没有提供覆盖说明；宿主已知存在覆盖缺口时必须显式传 incomplete，不能省略。覆盖不完整也不撤销已有匹配的读取／引用事实。

### 节点、来源与独立证据事实

| 类型 | 字段与职责 |
| --- | --- |
| `AgentEvidenceObject` | `kind:'object', id, title, type, children` 必填；可选 `access:'available', version, location, summary, openable`。type 是教师可读对象类型；对象版本与证据来源版本独立 |
| `AgentEvidenceItem` | `kind:'evidence', id, title, type, source, facts, relation` 必填；可选 `access:'available', summary, preview, previewUnavailableReason, openable`。summary 为关键摘录，workspace 选中该证据后才呈现 preview |
| `AgentEvidenceSource` | `objectId, label, location` 必填，`version / snapshot` 可选。objectId 为已有来源身份，label 为可披露名称，location 描述页／区域／题号／作答段落。snapshot 标为历史证据，显示该记录自己的“当时版本”；不从当前对象或结论回填 |
| `AgentEvidenceRestrictedNode` | `id, kind:'object'/'evidence', access:'restricted', disclosure:{label,reason}`。只传可披露标题与原因；类型不接受正文、来源、版本、事实、预览、子节点或打开能力。运行时同样忽略误传的私密字段及子树 |
| `relation` | `supports / counterexample / pending`，显示“支持／反例／待核”；全部由宿主给出，不按已引用、已读取或预览内容计算，不用成功色证明结论正确 |

`AgentEvidenceNode` 是以上对象、证据、受限节点的联合。宿主只能传入当前授权可见的数据；受限分支可披露字段也必须先经宿主处理。组件的展示分支不是最终授权检查。来源记录、结论摘要、总量、限制原因及 preview/details 同样受披露范围约束。

`facts: readonly AgentEvidenceFact[]` 是**并列的独立事实集合**，不是互斥状态机或进度链：

| `state` | 文案 | 必要条件 / 附加字段 |
| --- | --- | --- |
| `read` | 已读取 | 必填 description，说明谁读取及实际覆盖范围；不外推完整材料或模型读取 |
| `cited` | 已引用 | 必填 description、version、location，后两项是被引用成果的版本和引用位置；来源版本另见 source.version |
| `not-read / not-cited` | 未读取／未引用 | 仅宿主核实记录覆盖完整且没有相应事件时传入；组件不因 facts 为空产生否定事实 |
| `retrieval-only / preview-only` | 仅检索命中／仅预览 | 宿主明确给出的有限记录；组件不从检索数量、挂载预览或点击生成 |
| `incomplete` | 记录不完整 | 已知记录覆盖缺口，description 说明缺失范围；不推定未读取／未引用 |
| `unavailable` | 记录暂不可用 | 当前记录来源无法核验；不把不可用写成未发生 |
| `unknown` | 状态未确认 | 尚不能确认的事实；description 可说明具体未确认项 |

各事实可附独立 description、version、location；除 cited 的成果定位要求外，其余版本／定位按所描述记录提供，彼此不复制。facts 为空仅说“暂无证据事实记录”。宿主／受信任层先匹配任务、会话、执行轮次、来源及版本和成果引用位置，再传事实；组件不验证证据真伪。已引用不证明结论正确、充分或已进入本次模型上下文；点击只发意图，不生成事实。

`previewUnavailableReason` 只描述内容预览能力，有值时不挂载 preview；记录暂不可用与材料能否预览独立。preview 缺省显示“暂未提供证据预览”。preview/details 必须是当前允许披露的只读内容，可包含 DocumentRegionViewer 的区域选择、缩放等视图交互，不得绕过公开动作接入业务提交。

### 三种用法与验证边界

- **inline**：结论、版本、依据摘要、宿主给出的数量／覆盖，按输入顺序呈现关键 1–2 条证据；无展开能力时保留全部摘要。摘要之外的 incomplete、unavailable、unknown、预览不可用与权限受限信息集中在常驻“其他记录限制”，不因截断消失；宿主须将其他影响判断的关键依据保留于 summary 或前两条。
- **workspace**：同一结论、面包屑、上层与原位置返回；逐层浏览对象及证据。选中证据显示自身类型、来源／版本／定位、关系、独立事实与领域预览。path 失效不取其他对象代替，提供返回最近已有层级的请求。
- **compact**：同样事实采用可换行短列表，减少间距；两态都保留记录不完整、不可用、未确认和访问原因，不缩字。

`/next/components/agent-components#evidence-drilldown` 原位示例：扫描校对“第 2 题识别可能有误”→第 2 题→原稿第 1 页区域／识别文本；学情诊断“二次函数配方掌握不足”→学生→题目→作答片段，含反例、检索命中、历史版本与受限记录。明确标“固定示例”；DiagnosisEvidenceTable 提供诊断入口，DocumentRegionViewer 展示人工区域与公式，示例宿主控制路径及返回焦点。未新增业务页面。

本轮分支 `feat/agent-evidence-drilldown`，基线 main `2f04f5a`；仍是未合并组件候选。测试覆盖独立事实、受控层级、回调不改变记录、缺少展开能力、受限内容隔离、历史版本、紧凑限制及类型约束。五项结果与 P04 轻量验证方案记录于 `.sites-runtime/evidence-drilldown/REPORT.md`。不启动开发服务；浏览器三主题／窄容器／键盘焦点、Workspace 接入、真实服务、实体设备和读屏器另行验证，SSR 与回调检查不代替这些验收。

## 异常处理器 v0.1

2026-09-25 设计候选，语义 **18 异常处理器**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-exception-handler` 导入 `AgentExceptionHandler` 及下列同名类型。检索依据：`AgentExecutionProgress.exceptions` 只有只读异常记录；`AgentChangeSet` 负责修改比较；`AgentExecutionResult` 提供原请求查询边界；Workspace `8f9bb13` 的 P04TaskView 仅有本地 Alert 组合。因此组合既有 Card、Alert、Prism Badge、Button、AgentStepStatus 词表与 RecordDetails（coss Collapsible），不新增组件目录项、执行器、权限判断、Store 或 Workspace 私有类型。

### 公开属性

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `title / items` | 必填 `string / readonly AgentExceptionItem[]` | 同一业务对象的异常集合；稳定唯一项 ID 由宿主提供，空数组仅表示暂无异常记录 |
| `view` | `'inline' / 'workspace'`，默认 `inline` | 两态共用相同事实，workspace 只提供内容区，不创建浮层或路由 |
| `density` | `'default' / 'compact'`，默认 `default` | compact 为可换行短列表；不缩字、不隐藏未知、失败、影响及禁用原因；可与任一 view 组合 |
| `inlineLimit` | `number`，默认 `2` | 有展开能力时显示前 N 项及所有 critical、failed、waiting 项，保留输入顺序；有限值向下取整且至少 1，非有限值回退 2 |
| `onExpand` | 可选 `(trigger: HTMLButtonElement) => void` | inline 的“查看全部 N 项异常”；缺省不显示入口且保留全部项。存在 unknown 时同执行结果隐藏该入口并保留全部项；workspace 不显示入口 |
| `onAction` | 可选 `(intent: AgentExceptionIntent) => void` | 仅发处置或查询意图，不变更输入、状态或历史；缺省时已提供的动作仍显示为禁用，并说明当前无法执行 |
| `onBack` | 可选 `() => void` | 仅 workspace 显示“返回”；纯视图导航，包括 unknown，不能绑定处置、恢复、取消或提交。恢复任务须作为明确的处置动作另行提供 |
| `disabledReason` | 可选 `string` | 非空时阻断本组所有处置与查询，原因常驻并关联按钮；查看与返回不受影响 |
| `notice` | 可选 `string` | 整卡最多一条常驻边界提示；必要状态事实不放在这里代替状态字段 |
| `details` | 可选 `ReactNode` | 补充说明，默认收起；不放未知、失败、影响、禁用原因或其他必须即时看到的事实 |

`AgentExceptionItem`：

| 属性 | 类型 | 契约 |
| --- | --- | --- |
| `id / title` | 必填 `string` | 稳定异常 ID / 教师可读标题；按钮可访问名称包含标题 |
| `kind` | 必填 `AgentExceptionKind` | `low-confidence / conflict / missing / unparseable` 分别显示识别不确定、内容冲突、信息缺失、无法解析；不生成置信度或自动检测异常 |
| `scope / retained` | 必填 `string` | 影响范围 / 已保留部分；没有或不确定须如实描述，不由其他状态推算 |
| `basis` | 必填 `string` | workspace 的判定依据或规则说明，必要的来源与版本由宿主描述；决策关键的证据不足仍需写入常驻 description/scope |
| `disposition` | 必填 `AgentExceptionDisposition` | 见状态表；描述、状态与可用动作独立从宿主取得 |
| `critical` | 可选 `boolean` | 宿主指定关键项，始终保留于摘要；不从标题或异常类型推算优先级 |
| `disabledReason` | 可选 `string` | 与整组及动作原因合并，阻断本项所有处置与查询，不推定解决或失败 |
| `evidence` | 可选 `readonly AgentExceptionEvidence[]` | workspace 原始材料/证据列表；缺省显示暂无可核对的材料记录 |
| `history` | 可选 `readonly AgentExceptionRecord[]` | workspace 的只读当时事实，按输入顺序显示；不从当前项补字段，不追加、不覆盖 |

### 状态、动作与历史

所有 disposition 均必填 `description: string`。等待、未知和失败徽标复用 `AgentStepStatus`；处置上下文明确说明“处置提交中”“处置回执未确认”“处置失败”，不改变共享步骤词表。

| `state` | 必填补充字段 | 可选动作 | 事实语义 |
| --- | --- | --- | --- |
| `waiting-human` | 无 | `actions` | 当前等待人工决定，不能代表尚未到达的步骤 |
| `waiting` | `request: { id, label }` | `query` | 处置已提交，有明确等待事实；无普通处置动作 |
| `unknown` | `request: { id, label }` | `query` | 原处置回执未确认，不宣称失败或成功；仅查询原请求 |
| `resolved` | `resolution: { method, time? }` | `actions` | 已有处置记录；显示处置方式和时间，时间缺失显示“时间未确认”，不使用客户端时钟；不等于任务完成 |
| `failed` | 无 | `actions` | 明确处置失败；恢复/重试是否可用由宿主核验后提供，不自动添加 |
| `ignored / skipped` | `resolution: { method, time? }` | `actions` | 按宿主事实显示已忽略／已跳过与当时方式，不等于已解决或内容正确 |

`AgentExceptionAction={ id, label, impact, disabledReason? }`：前三项为必填 string。`impact` 常驻且以 `aria-describedby` 关联按钮。普通处置包括替换、跳过或恢复，只通过 `onAction({ kind:'handle', exceptionId, actionId })` 发出；原请求查询只通过 `onAction({ kind:'query', exceptionId, actionId, requestId })` 发出。组件不按按钮名称识别查询。unknown/waiting 的类型不接受 actions，运行时也忽略非类型化输入混入的 actions；未知请求 ID 时查询禁用并说明原因。普通处置与查询均有禁用事件保护，仍不能替代受信任层的权限、版本、请求归属和幂等核验。

`AgentExceptionEvidence={ id, label, location, version?, preview?, unavailableReason? }`：前三项为 string；`preview` 是宿主提供的**只读** ReactNode 插槽。不提供版本时显示“来源版本未确认”，不提供预览时显示“暂未提供材料预览”；有 unavailableReason 时优先显示原因，不渲染不可用预览。组件不加载材料、不授予访问权，也不把预览提升为已读取／已引用记录。preview/details 不得塞入处置、重试或恢复按钮绕过受控动作，尤其 unknown。

`AgentExceptionRecord={ id, state, description, scope, basis, method?, time?, request? }`：前五项必填，state 同七值状态集合，其他均为文本或上述 request。始终标“当时状态／当时范围／当时依据”，时间与处置方式只取本条记录，缺省显示未确认／未记录；无执行动作。宿主按事件匹配到原任务、轮次、对象与版本后提供快照，不把当前状态映射回旧记录。接口内 readonly 数组不等于宿主已实现历史存储。

### 三种用法与 P04 映射

- inline：异常总数＋关键项的类型、范围、已保留部分、当前处置与操作影响；提供展开才可缩略列表，未知时保留全部。原请求关联、未确认、失败和禁用原因始终可见。
- workspace：全部异常及各项的原始材料/证据定位、规则、处置、当时记录；可选返回。恢复任务是宿主明确提供的动作，不因返回或 resolved 自动恢复。
- compact：减少间距，采用可换行短列表；与 view 正交，事实和动作规则不变。

只读参考 Workspace main `8f9bb13` 的 `src/features/teacher/agent-workspace/P04TaskView.tsx` 与 `p04-task.ts`；本轮不修改 Workspace。

| P04 事实 | 建议映射 | 接入边界 |
| --- | --- | --- |
| `owner / requestId / objectId` | 宿主持有原关联；`items.id` 可组合原 requestId 与局部问题标识 | 组件不建立任务对象；`onAction` 由适配器校验所属会话、轮次、版本和 writable |
| `phase='issue'` | `kind='low-confidence'`、`state='waiting-human'`；scope 第 3 页，retained 已整理部分 | `replace / skip` 作为 actions，影响说明写明仅替换/跳过局部，映射原 `resolve` 事件 |
| `phase='issue-submitting'` | `state='waiting'`；`request.id=run.intent.id` | intent.choice 只表示已请求的方式，不能当已处置回执 |
| `phase='issue-unknown'` | `state='unknown'`；同一 request；仅 query | 查询原 intent.id；不能再次发 resolve，也不能以点击查询自动产出回执。现有“模拟原局部请求处理回执”是评审事件，不是真实查询服务；未接查询能力时省略 query 或以 disabledReason 说明 |
| `delivery` + `issueChoice='replace' / 'skip'` | 匹配原处置回执后分别 resolved / skipped，method 描述实际方式 | ready/reviewing 或输出存在本身不证明处置；P04 无处置时间，保持 time 缺省／未确认。scope.blurry='skip' 须依据明确范围及交付事实说明跳过 |
| `entries` 的当时 text / event / intentId / outputVersion / scope | 适配器仅将可确认状态的事件映射 history，保留当时范围与版本 | 现有 entries 无统一处置状态与时间，不用当前 phase 反填历史，不从自然语言记录猜测状态 |
| 原材料/页定位、当前权限与可查看能力 | evidence.location / version / preview / unavailableReason；规则写 basis | P04 当前为固定示例，不伪造 OCR、置信度、真实扫描图或真实 evidence |
| 已有右工作区与来源触发器 | onExpand 传同一 items、view=workspace；onBack 返回并恢复焦点 | 两态切换不发处置、不复制 Store；缺失失败事实不自行制造 failed |

示例入口 `/next/components/agent-components#exception-handler`：P04 第 3 页模糊，以及题目识别冲突／缺失答案；三种用法、七值手动状态、320px、长中文与公式均明确标“示例”。验证日志与报告：`.sites-runtime/exception-handler/`。五项验证均退出 0：排版 107 个 TSX，全量测试 151/151（含本项 15 项），类型检查 0 错误；详情见报告。浏览器打开本地文件预览被 URL 安全策略拒绝，三主题、窄容器、键盘/焦点未实看。组件静态与回调测试不能替代 Workspace `/teacher/agent/workspace` 接入验证；真实服务、移动设备和读屏器不在本轮验证范围。

## 任务记录三件套两态 v0.1

2026-09-24 设计候选，覆盖语义 26 任务进度、27 执行结果、03 上下文摘要，声明 **Inline + 通用扩展容器**。紧凑密度是列表布局，不增加第三种业务呈现方式。语义 25 执行确认继续仅 Inline，本轮不改。验证入口是 Workspace `/teacher/agent/workspace`；本仓库组件页只提供示例，不以历史骨架作为接入验收依据。

检索与复用：沿用 `AgentExecutionProgress` / `AgentTaskProgress`、`AgentExecutionResult` / `AgentSemanticAction`、`AgentContextSummary` / `AgentContextList`；采用已批准 `AgentChangeSet.view` 的命名、其“说明”折叠方式以及 data-display 的 `density` 命名。`agent-record-parts.tsx` 仅收纳共用呈现属性和内部说明/展开组合，不是新组件目录项。未新增状态管理、权限服务、执行器、依赖或视觉令牌，目录仍为 80 项。

### 三组件共用的新增属性

| 属性 | 类型 / 默认值 | 职责 |
| --- | --- | --- |
| `view` | `'inline' / 'workspace'`，默认 `inline` | 两态内容；不创建浮层、路由或第二份业务对象。workspace 直接展示完整步骤及来源定位，不受局部 expanded 限制 |
| `density` | `'default' / 'compact'`，默认 `default` | compact 用可换行列表行、较小行间距，状态与说明仍为 ui-body / ui-hint；可以与两种 view 组合，不截断记录或缩小字体 |
| `onExpand` | 可选 `(trigger: HTMLButtonElement) => void`，默认未提供 | inline 的“更多”仅发出查看完整记录的意图；缺省无入口，已有事实不因缺入口被删去。workspace 不重复提供入口。执行结果 unknown 时也隐藏此入口，只允许查询原请求的业务动作 |
| `details` | 可选 `ReactNode`，默认未提供 | 默认收起的“说明”，不放未知、不可用、禁用原因、失败和未完成范围等必要事实；不触发业务动作 |

进度与结果的 `presentation='card' / 'inline'` 仍仅表示卡片外框，默认 `card`；上下文摘要沿用原有 Card 外框，没有借本轮增加同名属性。只传旧属性，或显式传 `view='inline' density='default'`，与 main `e99813a` 的 28 组 SSR 快照一致（仅归一化 React 自动 ID，所有引用关系保留）。

### AgentExecutionProgress（语义 26）

从 `agent-semantic-components` 导入组件及 `AgentExecutionProgressProps / AgentExecutionRun / AgentExecutionStage / AgentExecutionIssue`。

| 属性 | 类型 / 默认值 | 职责 |
| --- | --- | --- |
| `title / state / description / steps` | 原有必填属性 | 整体状态显式取自调用方；steps 继续使用 `readonly AgentStep[]`，不能用最后一步反推整体状态 |
| `expanded / onExpandedChange` | 原有必填 boolean / 可选回调 | 仅 inline 默认密度下控制当前步骤的局部披露；workspace / compact 直接展示步骤，切换不调用此回调 |
| `updatedAt` | 原有可选 string，默认未提供 | 调用方给出的更新时间文本；workspace 缺省显示“更新时间未确认”，不取客户端时钟 |
| `action` | 原有可选 `AgentSemanticAction` | 恢复/查询能力由调用方提供和核验，点击不改变任何状态；未知时应提供原请求查询能力 |
| `run` | 可选 `{ id: string; label: string; version?: string }`，默认未提供 | 当前轮身份、名称及版本；记录视图标明“当前状态”。workspace 缺少轮次时明确未确认；ID 作为 data-run-id 供定位 |
| `stages` | 可选 `readonly AgentExecutionStage[]`，默认未提供 | 完整阶段；每项含 `id/title/state/steps`，可选 `time/description`；时间仅展示输入，缺省“阶段时间未确认” |
| `exceptions` | 可选 `readonly AgentExecutionIssue[]`，默认未提供 | 异常与处置；每项 `id/title/description` 必填，可选 `time/resolution`。缺 resolution 显示“处置状态未确认”，不从记录出现推断已解决 |
| `history` | 可选 `readonly AgentExecutionRun[]`，默认未提供 | 每轮 `id/label/state/description/steps` 必填，可选 `version/updatedAt/stages/exceptions`。始终标记“当时状态/当时版本”，所有层级只读快照，不放执行动作 |
| `snapshot` | 可选 string，默认未提供 | 将顶层记录明确标作当时快照；即使 state=running 也不转圈，不标 aria-current。不会验证 action 的有效性，旧记录可用动作仍需调用方重新核验 |

支持层增量：`AgentStep.time?: string` 默认未提供；`AgentTaskProgress.density?: 'default' / 'compact'` 默认 default。默认输出保持原样。compact 将步骤名称、状态、时间和说明放入可换行的同一行。当前轮只有整体 `state=running` 且无 snapshot 时使用 live；阶段还要求自己的 state=running。历史轮及其阶段一律 snapshot；running 步骤文字为“上次进行到”，无 animate-spin、aria-current 或 live 标记。减少动态效果继续使用既有 motion-reduce 规则。阶段/异常/历史完整呈现，不进行自动分页、数量截断或状态合并。

#### 步骤状态（2026-09-24）

`AgentStep.state` 接受以下八值；`AgentStepStatus` 与所有消费步骤的 `AgentTaskProgress`、`AgentExecutionProgress` 当前轮、阶段及历史轮共用此契约，覆盖 inline / workspace 与 default / compact。标签复用 `lib/prism-next/agent-progress.ts` 的 `agentProgressLabels`；`done` 对应 completed，旧 `error` 保留原文“失败”以兼容原输出。

| 值 | 标签 | Badge variant | 步骤行图形 | 外部事实 |
| --- | --- | --- | --- | --- |
| `pending` | 待开始 | secondary | Circle | 步骤尚未到达或开始；未来步骤只能用 pending |
| `running` | 进行中 | info | Spinner | 当前有可信的运行事实；live 时才转动 |
| `done` | 已完成 | success | Check | 明确完成本步骤，不推定整个任务完成 |
| `error` | 失败 | error | CircleAlert | 明确失败，不能用来代替回执不明 |
| `unknown` | 状态未确认 | warning | CircleHelp | 已提交或已发生，但回执缺失、超时或当前状态无法确认 |
| `waiting-human` | 待人工处理 | warning | CircleAlert | 当前明确等待教师处理，不标记尚未到达的人工步骤 |
| `waiting` | 等待处理 | warning | Clock3 | 有明确的等待回执或等待处理事实；具体内容由 detail 描述，不推定已接收或已运行 |
| `partial` | 部分完成 | warning | CircleAlert | 明确仅完成部分范围，detail 保留已完成与未完成范围 |

已发生但尚无回执的步骤依据事实使用 unknown / waiting，不回退 pending；回执不明用 unknown，只有明确的等待事实才用 waiting。点击确认不构成运行或完成证据。组件仅展示传入状态，宿主负责到达判断、请求关联和原请求查询；整体状态仍独立提供，不从步骤推算。

`snapshot` 保留所有非 running 状态的原标签、Badge 与静态图形；running 仍显示“上次进行到”、outline 与 Circle。新增四值在 live / snapshot 均无动效且不设置 aria-current。状态文字与步骤图形同时呈现，图形对读屏隐藏，含义不只靠颜色。

旧四值的独立 Badge、步骤列表、阶段/历史以及两态两密度输出以 main `0a19ff7` 的 25 组 SSR 快照对比；仅归一化 React 自动 ID，保留引用关系。`/next/components/agent-components#record-views` 的 P04 固定示例包含上述新增状态与旧 running 快照；示例不证明真实回执或业务接入。

### AgentExecutionResult（语义 27）

从 `agent-semantic-components` 导入组件及 `AgentExecutionResultProps / AgentExecutionReceipt / AgentExecutionOutput`。

| 属性 | 类型 / 默认值 | 职责 |
| --- | --- | --- |
| `title / description / receipt` | 原有必填属性 | receipt.status 为 succeeded / partial / failed / unknown；前三者必填 completed / remaining 字符串列表，保持外部回执事实；unknown 不推算范围 |
| `receipt.record` | 新增可选 `{ request: string; run: string; version?: string; receivedAt?: string }`，默认未提供 | 完整回执关联；版本/时间缺失分别显示未确认。收到时间不等于执行完成时间 |
| `facts / children` | 原有可选字段，默认 [] / 未提供 | 补充回执事实与只读内容插槽；children 中不得另塞执行、重试、打开等动作绕过 unknown 约束，补充说明迁至 details |
| `outputs` | 可选 `readonly AgentExecutionOutput[]`，默认未提供 | 每项 `id/title/version/status` 必填，`open?: AgentSemanticAction`；版本与内容状态原样呈现，文件存在不改变 receipt.status |
| `outputs[].open` | 默认未提供 | 只在非 unknown 回执显示真实能力；未提供则“暂不可打开”且无假入口；disabledReason 保留为可访问关联的禁用原因；可打开能力不证明发布或保存 |
| `failures` | 可选 `readonly AgentExecutionIssue[]`，默认未提供 | 明确失败明细与处置事实。空列表只说“暂无失败明细”，不代表已核实没有失败 |

unknown 在所有密度/两态只呈现 `receipt.query` 提供的原请求查询动作；忽略非类型化调用误传的 next/secondary，抑制所有产出 open 与 onExpand。其余三种回执保留原 next/secondary 能力。query 的实际目标、参数和幂等核验由调用方保证，组件不靠按钮名称识别合法请求。产出名称、版本、内容状态和暂不可打开提示仍显示，不能因有产出改称已成功。

### AgentContextSummary（语义 03）

从 `agent-context-summary` 导入组件及 `AgentContextSummaryProps / AgentContextSource / AgentContextFact`。

| 属性 | 类型 / 默认值 | 职责 |
| --- | --- | --- |
| `title / scope / sources / expanded` | 原有必填属性 | 同一任务、范围与来源集合；workspace / compact 展示全部来源和 source.details，不受 expanded 控制；inline 原局部版本披露保持 |
| `onExpandedChange / onInspect / notice / snapshot` | 原有可选字段 | 查看只发出来源 ID；缺 onInspect 或 inspectable=false 无入口。notice 为一条边界/必要事实提示，snapshot 区分历史依据 |
| `sources[].version` | 可选 string，默认未提供 | 来源版本；记录视图缺省标“来源版本未确认”，不解析 location 文本补造版本。location 继续表示来源定位 |
| `sources[].selection` | 原三值外增加 `unavailable` | selected / not-selected / unknown / unavailable 分别表示本次选用、未选用、选用状态未确认、记录暂不可用；只描述选用事实 |
| `sources[].selectionDetail` | 可选 `{ description?: string; version?: string; location?: string }`，默认未提供 | 选用记录自身的范围和版本定位，不改变 selection |
| `sources[].read/context/citation` | 原有必填 `AgentContextFact` | 四事实中的另外三项，独立接受 confirmed / absent / unknown / unavailable；confirmed 仍必填 description |
| `AgentContextFact.version/location` | 新增可选 string，默认未提供 | 每项事实各自对应的版本和定位；不在三项间复制。citation.version/location 应指向成果版本和引用位置，来源版本另见 source.version 或 details |
| `sources[].details/inspectable` | 原有可选字段 | details 可补任务、执行、证据记录与引用来源版本；inspectable 只控制查看能力，不改变任何证据事实 |

四事实分别显示 **选用 / 读取 / Agent 本次参考 / 成果引用**。记录覆盖不完整且无匹配有效事件用 unknown；记录来源无法核验用 unavailable；只有覆盖完整且没有对应事件才用 absent。匹配任务、来源、版本、执行与成果定位是适配器职责，组件不认证证据。本机读取、历史读取、已选用或查看材料都不推定本次参考；引用不推定读取或结论正确。

### 三态信息结构与接入验证

- inline：保留原标题、状态、范围及局部步骤/版本披露；新增回执、产出、异常与历史同源呈现，关键未知/不可用事实常驻。
- workspace：完整当前执行、阶段步骤、时间说明、异常处置、当时轮次；完整回执和产出失败明细；全部来源四事实及版本定位。这里只提供内容区，外壳、焦点/返回/专注仍归 Workspace。
- compact：同样输入采用一项一行的可换行列表，不缩字、不截断、不把未知合并为失败或完成；可选“更多”由调用方接至完整记录。

`/next/components/agent-components#record-views` 提供 P04 扫描整理与备课资料整理两组明确标注的固定示例；选择记录类型后并排查看三种用法，含 320px 窄容器、长中文及打开示例中的公式。点击查询仅记录请求，不产生新回执。示例、正文和交互控件均在 demos；没有引入 Workspace 私有类型。

Workspace 适配建议（只读核对 `ole-school-workbench` main `a2962e9`，本轮未修改）：

| P04 / Workspace 事实 | 组件输入 | 缺口与边界 |
| --- | --- | --- |
| `P04Runtime.runs[owner]`、`P04Run.requestId/objectId` | 当前轮 run.id/label/version；先前轮映射 history；通过原任务/轮次/对象保留关联 | 组件不挑当前轮、不排序，不把旧轮覆写为新轮；label/version 由适配器明确提供 |
| `p04Progress(run)` 的 state/description/steps | AgentExecutionProgress 的同名输入；time/stages/exceptions 可从已有执行事实追加 | 当前 P04Run 没有 updatedAt、阶段时间或可信耗时，保持缺省/未确认；不读客户端时间，不把步骤 done 当整体 completed |
| `run.phase/scopeReceipt/intent/entries/issueChoice` | 经原适配器确定 receipt 与 exceptions 的描述、处置和关联；requestId 对应 receipt.record.request | scopeReceipt 是范围确认回执，不能作为保存/发布成功回执；ready/reviewing 仍需核对，entries 叙述不自动提升为完整审计或已解决 |
| `P04Output.id/title/version/reason`、`p04Target/resolveP04Target` | outputs 的身份、名称、版本及外部内容状态；有效目标+实际 onOpen 能力时提供 open | reason 是说明，不自动变成执行状态；snapshot 由既有查看器承接，旧版保持当时内容；产出数量不证明保存、入库或导出完成 |
| `p04ContextSources(run)` | sources 原样提供 selection/read/context/citation；补 source.version 及各项实际定位 | 当前示例选用为 selected，另三项全 unknown；不因有校对稿而改为已引用；保留 fixture 标注 |
| `WorkspaceResources.coverage`、`ReadEvidence`、`CitationEvidence` | 适配器匹配 owner/source/version/run/output 后，分别形成 read 与 citation 的 fact/description/version/location | coverage=unknown 且缺匹配事件仍 unknown，unavailable 保持不可用；现有数据没有本次参考证据，context 保持 unknown，不由 read 推算 |
| 同一组 task/run/output/source 视图数据 | 浮层 `view='inline' density='compact'`；完整记录 `view='workspace'` | 打开/收起只改变视图；复用原单一右栏、Popover、会话归属与焦点返回，不新增 Store、路由或持久化 |

接入测试仍需在 Workspace `/teacher/agent/workspace` 完成：资源浮层→完整记录→返回、会话切换与历史版本回看、未知查询、来源不可用、三主题/窄容器/键盘/焦点恢复。当前 P04 的保存与去向回执仍 unknown，没有真实服务；本候选不把静态示例或 SSR 测试当成业务验收。

## Agent 可读性与规范权威

跨 Agent 使用时以站点根目录 `/llms.txt` 为发现入口，并遵循 `docs/agent-readable-contract.md`。组件页 Agent Spec、Foundations、Pattern / 应用示例、固定 coss upstream、Agent inference 依次构成权威顺序；后一级不得覆盖前一级。

基础 Form / Field / Input / Textarea / Select 统一采用**常驻固定标签**。Floating label 不属于基础输入组件契约；若未来需要，只能作为单独评审的 Specialized Pattern 引入。缺失视觉值先复用固定 coss 行为，仍无定义时报告规范缺口，不从截图或模型偏好补造。

## 常用展示约定

- Avatar：通过 `className` 使用 24、32、40、48、64、96px 六档示例，默认 32px；保留图像失败时的文字回退。
- Card：内容操作、横向条目、指标、人物、选择与分组由同一套 Card 子组件组合，不新增六套独立组件。
- Frame：保留 coss 默认外框内边距 4px、面板内部 20px；多面板之间间隔 4px。
- 教材目录：外部 `createDirectory` 数据支持递归层级，2—5 级示例位于独立 `directory-depth` fixture。选择以叶节点为准，父级勾选包含全部下级，取消不提交草稿。

### 实心信息色徽标

`components/prism-next/badge` 复用固定来源的 coss Badge，并增加 `variant="info-solid"`；变体和 render/ARIA 属性继续透传；Prism 默认采用 lg，状态文字统一为 14/20，短标签例外见字体规范。coss 原始源码及其来源校验保持不变。

```tsx
import { Badge } from "@/components/prism-next/badge"

<Button variant="outline" aria-label={`查看已选材料，${count} 项`}>
  已选材料
  <Badge variant="info-solid" size="sm" aria-hidden="true">{count}</Badge>
</Button>
```

- 彩色承载于气泡背景，内容采用对比中性色；浅色、暖纸、深色使用现有信息色与背景令牌。
- `info` 保持浅底信息呈现，`info-solid` 只提高信息强调程度，不推断待办、错误、类别或完成状态。
- 数量、零值是否展示、是否采用 `99+` 以及入口行为由调用方决定。组件不添加自动动画或存储。
- 数量与含义须由可访问名称共同表达；在已提供完整名称的按钮内，可隐藏重复的数字读屏内容。
- 组件示例位于 `/next/components/badge`，同时展示浅底／实心、0／2／100 及描边入口组合。

## 代码与导航分层

| 层级 | 目录 / 入口 | 内容 |
| --- | --- | --- |
| 基础组件 | `components/coss` | 54 个固定来源的 coss 原始组件 |
| 可复用组件 | `components/prism-next`、`charts` | 数据、可选插槽、受控状态与事件接口 |
| 组件示例 | `demos`、`/next/components/[slug]` | 单个组件的最小使用与不同输入对照 |
| 页面骨架 | `components/prism-next/skeletons`、`/next/skeletons` | 可复用公共外壳与布局，不计入组件数量 |
| 标准页面 | `/next/pages` | 独立分类；当前未启动，不预建业务页面 |
| 应用示例 | `examples`、`/next/examples/[slug]` | 题库与打印组合、统一学习支持流程，不计入组件数量 |
| 示例数据 | `fixtures` | 人工题目、作答、评分和关联资料 |

`/next/reading` 和 `/next/agent` 保留原入口。80 个组件展示页保持完整，应用示例仅保留 `questions` 与 `evaluation` 两个入口。评价、诊断、目标和计划在同一示例内切换；旧阶段地址跳转至对应 `stage`，学习状态限定在该示例内。

学生分析整页撤下，旧分析地址跳转到图表目录。矩阵、里程碑、负荷日历和文档区域的重复应用示例撤下，旧链接跳转到对应通用组件。日历、里程碑和文档区域仍按用途分类。

## 题目

```tsx
<QuestionCard question={question} />
<QuestionCard
  question={question}
  checked={selected}
  onCheckedChange={setSelected}
  actions={actions}
  details={details}
/>
```

- `QuestionRecord` 只定义题面、选项、小问与可选答案。题卡不负责试题篮、选题筛选、组卷、题目保存或统计。
- `details` 是可选内容插槽。未传入时没有详情按钮；展开可在内部维护，或由 `detailsOpen` / `onDetailsOpenChange` 控制。
- `QuestionDetails` 单独接收资料、教材定义、关联目录与允许的标签页。限制标签页会阻止相应面板渲染。敏感答案仍应由服务端从题目载荷中移除；UI 隐藏不是权限控制。
- `QuestionActions` 仅显示实际传入回调的操作。是否进入试题篮、移动、替换与删除由容器决定。
- `QuestionResponse` 接收题型、选项、`value` / `onChange`，只收集作答，不自动判分。
- `QuestionReview` 接收 `question`、`attempts`（按小问 ID）、`initialScores`（按评分点 ID）。可提供 `editor` 与 `onEditorChange` 成对控制草稿；否则内部维护。确认通过 `onConfirm` 返回结果。
- 没有细分 rubric 时：已有小问分值使用 `${part.id}-score`；没有小问分值回退整题 `score`。不擅自平均分配分值。未提供初评的评分点保持待评分。更换被复核对象时使用 `key={question.id}` 重建独立编辑草稿。

## 图表与分析

| 组件 | 输入 | 返回 |
| --- | --- | --- |
| TrendChart | 任意数值序列、标签、单位、可选数值范围 | `onSelect(id)` |
| ComparisonChart | 分类与数值、横/纵方向、单位 | `onSelect(id)` |
| HeatmapChart | 行列定义、单元格值/标签、选中 ID、可选 sequentialColors | `onSelect(id)` |
| ScatterChart / QuadrantScatterChart | x/y、分组与点形、范围、可选点大小；四象限额外传分界值与四个名称 | `onSelect(id)` |
| PairedDotChart | 两个指标定义、每行两个值、同一单位与范围 | `onSelect(rowId, metricId?)` |
| ComboChart | 分类、一个或两个坐标轴、绑定轴的柱/线系列 | `onSelect(categoryId, seriesId?)` |
| BoxPlotChart | 下须、Q1、中位数、Q3、上须 | `onSelect(id)` |
| MetricSummary | 标签、数值、说明、density | 可选查看回调 |
| GoalComparison | 基线、当前、目标、单位、状态插槽 | 不推断目标达成 |
| StatusComposition | 分类、数量、可选颜色、单位与受控选中 ID | `onSelect(id)` |
| FilterBar | 字段定义、选项、当前值 | 值变更 / 重置 |
| DataRecordTable | 任意记录、列渲染函数 | 选中记录 ID |

新增复杂图形采用按需加载的 ECharts 6.1.0 SVG 引擎。原有趋势与比较继续使用 Recharts；没有同时引入第二套新引擎。图表提供数据表作为文字和键盘操作入口。缺测用 null 保留，零值不等于缺测；非法箱线摘要明确提示并不绘制。分箱、统计方法、达标判定和学情结论在组件外处理。

`HeatmapChart.sequentialColors?: readonly [string, string, string]` 接收按低—中—高排列的三个六位 HEX 实色（`#RRGGBB`）。不接受 CSS 变量、短 HEX、透明色或颜色函数；非法输入回退原主题色阶。前景按实际 RGB 插值色选择黑/白，悬停继承原填色，仅改变边框。零值、缺测、数据表和受控选择行为不变。暖纸候选仅由演示页显式传入，不替换全局主题。

现有能力包含热力矩阵、散点、箱线、成对指标、四象限和柱线组合；雷达、桑基、网络、树图等尚未封装，按真实复用需求继续添加。

## 四类图表的约束

- 状态组成的数量必须非负且有限；null 不进入分母，非法值提示并排除。零值仍保留图例，合计为零不造出占比。图例显示数量和占比，第六类有独立中性色。微小分段也可通过图例选择。
- 成对指标只比较同单位、同尺度的数据。圆点和菱形上下错开 6px，横坐标仍是原值，因此相等/接近值可区分。单侧缺测不隐藏另一侧；越界点不绘制并提示。过长名称在图中截断，提示框与数据表保留全文。
- 四象限 `labels` 顺序为左上、右上、左下、右下；阈值必须在坐标范围内。边界点保留原坐标，重叠点不通过移动位置伪造数值，数据表可逐项选择。窄屏收起常驻点标签和象限内文字，外部象限说明仍可读；恢复宽度后标签恢复。未匹配分组、缺测和越界均显式说明。
- 柱线各系列以 `axisId` 绑定轴，按类别 ID 对齐数据；缺测不补零，线段不跨越缺测连接。左右轴各自明确单位，工具提示和数据表保持对应单位；不同轴的高度不可直接比较大小。无效域自动回退有效数据范围并提示。类别外的数据不影响轴范围。
- SVG 图形提供悬停详情与点击事件；数据表提供完整数值与键盘选择入口。从数据表选择时事件第二参数为空，因为选择的是整行。组件不内置“查看学生/错题/批阅”等导航。
- 独立示例入口：`status-composition`、`paired-dot-chart`、`quadrant-chart`、`combo-chart`。每个提供学习、运营、边界与缺测三组输入，以及空态；不新增分析整页。

## 学习、文档与 Agent

### 界面文案原则

Product Owner 2026-09-24 批准：每张卡最多一条常驻边界提示，其余补充说明放入默认收起的 Collapsible“说明”；已有的版本与定位、步骤折叠继续承载各自详情。优先删除重复解释，不为所有组件统一增加插槽；AgentChangeSet、任务记录三件套、异常处理器及下钻与证据浏览提供 `details?: ReactNode`。

组件自带文案及调用方提供的教师界面文案使用简短教师语言，不出现“意图”“宿主”“回调”“受控”等实现术语；组件职责与实现约束写入契约文档，开发者接入文档不受教师界面文案规则限制。

“回执未确认”“状态未确认”“示例”、冲突版本、禁用原因、部分完成与未完成范围等影响判断的必要事实必须常驻，不计作可删减的解释性边界提示，也不得移入折叠说明。缩短文案不改变状态来源、动作可用性、统计或可访问关联。

AgentContextSummary 的选用、读取、Agent 本次参考与成果引用分别记录，查看来源不会改变这些记录。界面名称“Agent 本次参考”对应 v0.2.1 §10.2 中“进入本次模型上下文”的独立事实（`context`），不从选用、读取或查看推定该事实。四值语义不变：`confirmed` 显示外部提供的已参考事实及具体范围，`absent` 为“未参考”（记录覆盖完整且无对应事件），`unknown` 为“状态未确认”，`unavailable` 为“记录暂不可用”。来源版本与定位沿用已有折叠区；删除重复的卡底职责解释。

- `DiagnosisEvidenceTable`：外部观察、来源、定位、状态、操作；可作为 AgentEvidenceDrilldown 的诊断入口，证据树与导航由宿主提供。
- `LearningGoalCard` / `VerificationFields`：目标容器与受控逐项核验字段。
- `LearningTaskList` / `MilestoneList`：外部任务与阶段状态。
- `WorkloadCalendar`：日期索引数值、容量、单位、选中日期和月份。日历不生成任务。
- `DocumentRegionViewer`：文档内容、百分比区域坐标、缩放与选择。不提供扫描识别或 OCR；可放入 AgentEvidenceDrilldown.preview，定位或预览不改变证据事实。
- `AgentComposer` / `AgentTaskProgress`：受控输入、提交/停止事件与外部步骤状态。步骤可带 `detail`；`AgentStepStatus` 在两个 Agent 子流程及监视器详情中复用 14px 状态徽标，图标、状态文字及颜色共同表达。不连接模型或模拟执行器。
- `AgentQuestionCard`：`question / description / options / value / onValueChange / children / disabled`。选项用 RadioGroup；补充输入通过 children 组合。选中不等于执行或最终保存。
- `AgentContextList`：`items: {id,title,location,description?,status?}[]`，可选 `onInspect(id)`。来源、版本与页码由调用方提供，组件不检索、不读取文件。
- `AgentChangeReview`：`title / before / after / reason / decision / onDecision`，可传 `disabled / disabledReason`。新增可选 `beforeLabel / afterLabel / scope / beforePreview / afterPreview / onResetDecision`；原字符串调用兼容，预览插槽不代表领域差异算法。`decision` 必传；采纳、保留与重新选择只返回意图。调用方核验原文，负责草稿变更、撤销旧核对状态和独立保存。
- `DraftMathPreview`：`value / label?`，仅从当前草稿派生排版，题干与答案复用；不读原稿、不改变输入、不写库。Temml 0.13.4 作为同源原样 ESM 资产按需加载（避免构建优化改写词法器转义）；以 `throwOnError / strict` 开启、`trust` 关闭及展开/大小限额生成 MathML，沿用 Prism Math（STIX）与 `read-body`；正文经过 React 转义，只有渲染器生成的 MathML 可注入。默认识别保守的 Unicode 代数片段，复杂公式要求明确 `\(...\)` / `\[...\]` 标记；无法解析时显示当前原文与 14px 说明。渲染成功不等于数学正确；没有同步原稿或自动确认行为。

第一组 Agent 语义候选（2026-09-22，见 `docs/agent-context-summary-review.md`）：

| 组件 | 输入及回调 | 边界 |
| --- | --- | --- |
| AgentContextSummary | `title / scope / sources / expanded / onExpandedChange? / onInspect? / notice? / snapshot?` | 复用 AgentContextList；来源事实独立，不检索或认证证据 |
| AgentArtifactPreview | `title / version / status / summary / facts? / children? / open? / notice? / snapshot?` | 对象预览不证明执行或发布；缺 open 则没有打开入口 |
| AgentExecutionConfirmation | `title / target / version / effects / confirmation` | ready 才有 confirm；submitting / received / recorded 为记录；blocked 可有 review；unknown 可有 query |
| AgentExecutionProgress | `title / state / description / steps / expanded / onExpandedChange? / updatedAt? / action?` | 复用 AgentTaskProgress；非 running 使用快照呈现，不自行判断进度 |
| AgentExecutionResult | `title / description / receipt / facts? / children?` | succeeded / partial / failed 接收 completed / remaining 及可选 next / secondary；unknown 仅可有 query |

上表保留第一组原有输入；三件套新增 view / density / details、记录字段和职责边界见本文「任务记录三件套两态 v0.1」。

`AgentExecutionProgress.state` 由调用方显式提供，统一类型与标签见 `lib/prism-next/agent-progress.ts`。按照 v0.2.1 §7.1 补充 `degraded`（已降级）和 `retrying`（重试中）；两者与 `paused`（已暂停）均为仅显示状态，**既有执行状态来源未接入**。`shell` / `review` 来源适配保持不变，不为这些显示状态虚构源状态；接入依据与对应关系见 [任务进度状态映射](agent-context-summary-review.md#任务进度状态映射)。

组件不依据计时器、经过时间、确认或重试按钮点击推测状态。仅整体状态为 `running` 时展示实时步骤，其他状态静态保留最后步骤记录。示例选择器提供 15 种手动组合样本，“待人工处理”使用 `waiting-human`，并提供 `queued` / `paused` / `degraded` / `retrying` 样本；这些样本只展示外部输入，不表示已经接入执行服务或自动流转。

后四项位于 `agent-semantic-components.tsx`，均可传 `presentation="card" | "inline"`，只控制外壳，不创建宿主面板。`AgentSemanticAction={label,onAction,disabledReason?}` 表示宿主提供的能力，回调仅为意图；条件、权限、有效版本、回执与恢复范围由宿主核验。新增 `AgentTaskProgress.activity="live" | "snapshot"`，默认 live 兼容；snapshot 将 running 步骤标作“上次进行到”，不转圈、不设置当前步骤。

引导式任务 v0.1.1 参考 [Beautiful UI](https://www.beautifului.dev/) 的 Approval Card / Context Cards / Task Rows / Diff Table 交互组织，以既有 Prism / coss 原位组合实现；未复制其源代码、引入依赖或第二套样式。独立样本在 `/next/components/agent-components`，完整流程在 `/next/agent` 的「试卷解析引导」。后者直接复用 `ParsingWorkspace embedded` 与原解析 reducer、校验、原稿和本机示例记录；`/next/use-cases/parsing` 同步使用这组组件。原材料复核助手与阅读页 compact 用法保留。

补充要求最多 500 字，保存在解析示例并写入任务指令；固定示例不根据自由文本生成内容。排版建议仅演示条件与问题分段，采用仅记录内容选择，核对状态见题目编辑区；若题干已被人工修改，旧建议不能覆盖。任务指令可在任意已添加材料的阶段展开，保存后直接展示；编辑复用副本不会修改当前任务。

应用示例中的题库状态、学习 reducer、合成证据、模拟任务与人工扫描区域均不放入这些复用组件。当前仍是本地交互演示，不含真实业务服务和持久化。


## 页面骨架：WorkbenchShell v0.3（Candidate）

组合路径：组件库 → 页面骨架 → 标准页面 → Demo / Website。骨架源码是唯一维护源，接入项目沿用按需复制源码与来源清单，不再还原独立设计稿。当前实现总骨架与第2项 Agent 页面骨架候选，第3—7项未启动。

| 输入 | 责任 |
| --- | --- |
| organization / user | 当前组织标识、名称、摘要与当前身份；无跨组织切换 |
| navigation / activeId / onNavigate / onPersonal | 导航数据、当前位置和路由回调；骨架不生成业务页面 |
| search | 外部查询、结果、加载/错误状态、来源与范围说明、选择回调；本轮夹具仅含五入口与一材料 |
| notifications | 记录、未读、逐条与全部已读回调；不改任务或业务成果状态 |
| monitor | 当前用户已授权的批阅/解析任务、availability、freshness、来源说明与可选 onOpenTask；不会从对话结束推断完成 |
| usage | 积分与 token 分别提供个人/组织/待确认归属，以及启用/未启用/不可用；未知数据不能显示 0 |
| context / auxiliary / auxiliaryLabel / children | 可选上下文侧栏、辅助区及其名称、主内容。context.content 可用 render function 接收目录关闭回调；辅助区只渲染一份，受控值由应用保存 |
| basket | 接收已有题篮的 open、position、empty，以预留布局空间。题篮状态、业务和浮层由应用拥有 |

骨架只使用现有组件 variant/size、主题令牌与字体，CSS 限于布局、区域尺寸及响应式。ThemeProvider 继续使用 `prism-v1-theme`；浅色、暖纸、深色应用到正文和 portal。搜索为模态 Dialog，通知/状态为 Popover，个人菜单为 Menu；同一时间只展开一个公共面板，关闭返回相应触发器，搜索选中结果后进入主内容。跳过链接不改写 HashRouter。顶部固定，主内容及桌面上下文分别滚动；中小屏收纳一级导航和上下文目录；题篮右侧/底部预留空间。

接入时同步整个 `components/prism-next/skeletons` 目录及其直接 coss/prism/lib 依赖。演示页 `examples/skeletons/workbench-review` 只用于评审，不作为生产数据源。工作台通过同源副本与薄适配器接入原 `TeacherQuestionBasketProvider`，保留原业务路由和持久化语义。


v0.2 空间规则：辅助区根据扣除上下文与题篮后的实际工作区测量；宽度不足1120px或高度不足640px时收纳到同一公共面板体系，入口保留在主内容滚动区之外。外壳不足1100px时再收纳上下文；关闭辅助面板保留阅读位置并返回入口焦点。设置改变引发收纳时自动接续面板，避免正在操作的控件消失。

题篮面板使用 `workbench-basket-panel workbench-basket-right` 或 `workbench-basket-bottom`，空态同时加 `workbench-basket-empty`；外壳传入相同的 `basket.empty`。两处由同一CSS变量声明尺寸，避免页面预留与portal尺寸脱节。空态右侧20rem/底部min(36dvh,19rem)，有题右侧clamp(18rem,32vw,26rem)/底部min(46dvh,24rem)。这些尺寸仅供使用该骨架的接入页选择，不自动重写既有业务外壳。

设计验收包含组件、色彩、用户体验、艺术表达、空间利用率。空间子项必须检查主区有效宽高、首屏内容、留白与密度、同时展开的收纳顺序、操作距离及滚动、桌面/中屏/窄屏/低高度视口；“无溢出”不是设计通过的充分条件。


## AgentPageSkeleton v0.1（Candidate）

组合：`WorkbenchShell contentLayout="workspace"` → `AgentPageSkeleton` → `AgentComposer` / 消息内容。沿用原工作台 Agent stage 的新对话和连续对话结构；不会创建一套平行导航。`contentLayout` 默认仍为 document，workspace 模式把消息滚动与输入区留给内容骨架管理。

| 输入 | 责任 |
| --- | --- |
| title / meta / actions | 当前对话标题、摘要与页面操作；允许长中文自然换行 |
| expression | 默认 `default`；`candidate` 仅用于表现评审，配合 `expression.css`，不改变对话数据或消息状态 |
| empty / welcome / suggestions | 新对话内容与可编辑示例；示例填入不自动发送 |
| messages / composer / notice | 消息、输入与反馈插槽；应用持有状态、草稿、材料快照、发送和停止回调 |

目录通过总骨架 context 接入。正文最大阅读区 760px；连续对话的消息区独立滚动，输入区在视口内保留，短高度改为整体可滚动以免裁切。页级样式只控制布局。消息不等于后台任务，回复结束不修改全局任务监视器状态。

`AgentComposer` 收回既有工作台的 default / compact / conversation 变体、tools / attachments / context / suggestions / footerNote 插槽及工具栏布局；使用现有 InputGroup 与 Textarea，不定义另一套输入皮肤。空白禁发、组合输入保护、Ctrl/⌘+Enter、运行时停止继续由组件提供，主动停止后焦点回到输入。

`examples/skeletons/agent-review` 为两仓同源评审 fixture；固定回复、材料与历史仅保留本页会话，刷新恢复初始示例。真实会话存储、模型接入、任务调度及业务成果由后续应用适配，不能把此 fixture 用作生产实现。`review-basket` 只共享演示题篮；工作台传入已有题篮适配。

AgentComposer 的 `inputSize="compact"` 缩短连续对话输入区，默认尺寸保持；最大输入高度仍由组件限定。workspace 模式的底部题篮为 min(36dvh,19rem)，与总骨架 document 模式分别保留空间。低高度时题篮入口有独立底部预留，避免覆盖发送按钮。

### 2026-09-20 快捷设置修复与 AI 活动监视器规划

快捷设置的主题选项使用纵向图文，但只设置 `h-auto`，被 Button 的 `sm:h-8` 覆盖：桌面实测容器高34px，图标在顶部外溢5px。组合层补全 `sm:h-auto`，文字置于可换行容器，网格按最小可读宽度自动收纳。保留现有 Button 外观、主题令牌和 `prism-v1-theme` 保存方式，不修改 coss 基础组件。

用户指定的旧版依据是 `ole-demo-site-offline-2026-08-20.html` 内的 `#/teacher`，而非新仓库的首页 AI 卡片或早期概念图。已实际打开并查看监视器、AI 运行活动页及三个任务示例；上传文件 SHA-256 为 `fd28c244c31e05d312a046c615cf4ad5e9f79c75b572f1e9ce19544a164c7414`。参考文件仅用于本地只读核对，不收进源码或发布产物。

旧版监视器约216×80px，位于导航下方、试题篮上方，包含名称、LIVE、弱波形、呼吸点和每3.6秒轮换的摘要；支持减少动态效果。点击进入 AI 运行活动，通过选择器查看需处理、进行中、排队中三个固定示例，详情含任务依据、进度、运行轨迹和业务成果。旧版常驻摘要来自固定演示数据，不随详情选择同步；不能把它当成真实实时任务源。

**2026-09-20 已按以下边界完成 WorkbenchShell v0.3 实现。** `AIActivityMonitor` 属于骨架组合，不计入组件数量；两评审页共享 `useActivityMonitorFixture`，演示数据不进入复用骨架。

- 范围：当前组织内属于当前用户的批阅、解析任务，跨本人的任教班级汇总；应用传入已授权记录，不增加组织管理或全校监控。
- 结构：沿用顶部公共区域的轻量入口，显示运行摘要与任务数；展开同一个活动面板查看任务。保留旧版简洁的状态文字与弱运行信号，不把216×80px侧栏卡片搬进顶栏，不另建业务详情页。
- 状态：空闲、排队、运行中、需关注、失败、AI处理完成；同屏区分执行状态与业务后续（如「批阅完成 · 7项待复核」），AI处理完成不等于教师复核或发布完成。
- 任务行：类型、标题、班级/学科、当前阶段、可信的已处理/总数、最近更新时间、必要的查看/处理入口。无可靠进度时只显示阶段，不造百分比或预计完成时间。解析与批阅各自使用明确阶段。
- 汇总：需处理事项优先提示，同时保留仍在运行的数量；空闲显示「暂无正在执行的批阅或解析任务」。未接入与任务为空分别表达。
- 动效：只在实际运行时显示轻微活动反馈；有多个运行任务才轮换，悬停/键盘焦点停留时暂停，减少动态效果时静态显示。轮换不重复播报读屏，不让提示文字挤动一级导航。
- 连接：正常连接不占醒目位置；刷新失败仅说明「状态暂未更新」并保留最后更新时间，不把连接断开推断为任务失败。通知只承接完成/失败等必要事件，不重复常驻执行进展。
- 详情：面板只呈现进度与接续入口，成果、复核、教学洞察由既有业务页承接；回调未接入时明确演示边界，不伪造跳转或重试成功。
- 审核：组件、色彩、用户体验、艺术表达、空间利用率。重点复核长标题、多个并发任务、窄屏、题篮展开、浮层互斥和焦点返回，不扩大第3—7项实施范围。

本次快捷设置已实看1363px桌面、1024×768、390×844、320×568；浅色/暖纸/深色清晰，图标与文字均在各自按钮边界内。320px放大根字体至200%时选项自动单列，可滚动并用键盘选择；Enter切换、刷新保留深色、Escape返回桌面设置入口/窄屏头像入口均已核对。此项局部布局检查不代替整站视觉验收。

### AI 活动监视器 v0.3 实现验证

`ShellTask` 包含批阅/解析类型、当前阶段、任教范围、最近更新时间、可选已处理/总数、执行轨迹，以及独立的 followUp/result。已处理与总数必须为有效整数；缺测不补零。完成但待复核的任务同时进入已完成与需处理筛选。`availability` 区分未接入与空态；`freshness=stale` 保留最后记录，不推断任务失败。详情回调由应用提供，fixture 没有真实业务回调。

轻量入口保留旧版弱活动信号与3.6秒轮换；只在多个任务运行且无优先待办时轮换，焦点/悬停/展开/减少动态时暂停。面板最大420px宽、680px高，窄屏留出视口边距，以单一滚动层承载长列表和详情；详情从顶部阅读，返回列表恢复滚动位置与原任务焦点。主题选项保留本节前述容器修复。

实际检查六类执行状态、多个并发任务、状态中断与未接入、筛选、演示推进、详情及返回焦点。受管 Chromium 目视桌面1363×936、中屏1024×768、390×844、320×568；浅色/暖纸/深色、长中文、题篮展开与公共浮层切换纳入复核。类型、构建与定向回归结果在工作台既有骨架验证记录登记。未做实体移动设备、屏幕阅读器、跨浏览器或真实服务验证；本轮仍待用户站点评审。

## Typography v0.2.1

参见 [字体规范](typography.md) 和站内 `/next/foundations/typography`。迁入时必须同时包含 `typography.css`；公共角色样式与控件适配属于 Prism 层，不修改固定 coss 源码。
