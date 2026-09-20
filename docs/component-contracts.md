# v1.13.1 组件复用约定

组件负责呈现数据与返回事件。统计口径、流程跳转、业务判断、存储与模拟数据由调用方负责。所有 UI 使用现有 coss 控件、语义主题和数学字体；不重新实现按钮、选择框或 Drawer。

## 源码接入

本版 80 个组件已通过评审，可作为研发接入基线。按需复用源文件及其直接依赖，组件示例与应用示例用于说明用法。仓库保留 `private: true`，不通过 npm 包安装。

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

## Agent 可读性与规范权威

跨 Agent 使用时以站点根目录 `/llms.txt` 为发现入口，并遵循 `docs/agent-readable-contract.md`。组件页 Agent Spec、Foundations、Pattern / 应用示例、固定 coss upstream、Agent inference 依次构成权威顺序；后一级不得覆盖前一级。

基础 Form / Field / Input / Textarea / Select 统一采用**常驻固定标签**。Floating label 不属于基础输入组件契约；若未来需要，只能作为单独评审的 Specialized Pattern 引入。缺失视觉值先复用固定 coss 行为，仍无定义时报告规范缺口，不从截图或模型偏好补造。

## 常用展示约定

- Avatar：通过 `className` 使用 24、32、40、48、64、96px 六档示例，默认 32px；保留图像失败时的文字回退。
- Card：内容操作、横向条目、指标、人物、选择与分组由同一套 Card 子组件组合，不新增六套独立组件。
- Frame：保留 coss 默认外框内边距 4px、面板内部 20px；多面板之间间隔 4px。
- 教材目录：外部 `createDirectory` 数据支持递归层级，2—5 级示例位于独立 `directory-depth` fixture。选择以叶节点为准，父级勾选包含全部下级，取消不提交草稿。

### 实心信息色徽标

`components/prism-next/badge` 复用固定来源的 coss Badge，并增加 `variant="info-solid"`；原有变体、尺寸和 render/ARIA 属性继续透传。coss 原始源码及其来源校验保持不变。

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
| HeatmapChart | 行列定义、单元格值/标签、选中 ID | `onSelect(id)` |
| ScatterChart / QuadrantScatterChart | x/y、分组与点形、范围、可选点大小；四象限额外传分界值与四个名称 | `onSelect(id)` |
| PairedDotChart | 两个指标定义、每行两个值、同一单位与范围 | `onSelect(rowId, metricId?)` |
| ComboChart | 分类、一个或两个坐标轴、绑定轴的柱/线系列 | `onSelect(categoryId, seriesId?)` |
| BoxPlotChart | 下须、Q1、中位数、Q3、上须 | `onSelect(id)` |
| MetricSummary | 标签、数值、说明 | 可选查看回调 |
| GoalComparison | 基线、当前、目标、单位、状态插槽 | 不推断目标达成 |
| StatusComposition | 分类、数量、可选颜色、单位与受控选中 ID | `onSelect(id)` |
| FilterBar | 字段定义、选项、当前值 | 值变更 / 重置 |
| DataRecordTable | 任意记录、列渲染函数 | 选中记录 ID |

新增复杂图形采用按需加载的 ECharts 6.1.0 SVG 引擎。原有趋势与比较继续使用 Recharts；没有同时引入第二套新引擎。图表提供数据表作为文字和键盘操作入口。缺测用 null 保留，零值不等于缺测；非法箱线摘要明确提示并不绘制。分箱、统计方法、达标判定和学情结论在组件外处理。

现有能力包含热力矩阵、散点、箱线、成对指标、四象限和柱线组合；雷达、桑基、网络、树图等尚未封装，按真实复用需求继续添加。

## 四类图表的约束

- 状态组成的数量必须非负且有限；null 不进入分母，非法值提示并排除。零值仍保留图例，合计为零不造出占比。图例显示数量和占比，第六类有独立中性色。微小分段也可通过图例选择。
- 成对指标只比较同单位、同尺度的数据。圆点和菱形上下错开 6px，横坐标仍是原值，因此相等/接近值可区分。单侧缺测不隐藏另一侧；越界点不绘制并提示。过长名称在图中截断，提示框与数据表保留全文。
- 四象限 `labels` 顺序为左上、右上、左下、右下；阈值必须在坐标范围内。边界点保留原坐标，重叠点不通过移动位置伪造数值，数据表可逐项选择。窄屏收起常驻点标签和象限内文字，外部象限说明仍可读；恢复宽度后标签恢复。未匹配分组、缺测和越界均显式说明。
- 柱线各系列以 `axisId` 绑定轴，按类别 ID 对齐数据；缺测不补零，线段不跨越缺测连接。左右轴各自明确单位，工具提示和数据表保持对应单位；不同轴的高度不可直接比较大小。无效域自动回退有效数据范围并提示。类别外的数据不影响轴范围。
- SVG 图形提供悬停详情与点击事件；数据表提供完整数值与键盘选择入口。从数据表选择时事件第二参数为空，因为选择的是整行。组件不内置“查看学生/错题/批阅”等导航。
- 独立示例入口：`status-composition`、`paired-dot-chart`、`quadrant-chart`、`combo-chart`。每个提供学习、运营、边界与缺测三组输入，以及空态；不新增分析整页。

## 学习、文档与 Agent

- `DiagnosisEvidenceTable`：外部观察、来源、定位、状态、操作。
- `LearningGoalCard` / `VerificationFields`：目标容器与受控逐项核验字段。
- `LearningTaskList` / `MilestoneList`：外部任务与阶段状态。
- `WorkloadCalendar`：日期索引数值、容量、单位、选中日期和月份。日历不生成任务。
- `DocumentRegionViewer`：文档内容、百分比区域坐标、缩放与选择。不提供扫描识别或 OCR。
- `AgentComposer` / `AgentTaskProgress`：受控输入、提交/停止事件与外部步骤状态。不连接模型或模拟执行器。

应用示例中的题库状态、学习 reducer、合成证据、模拟任务与人工扫描区域均不放入这些复用组件。当前仍是本地交互演示，不含真实业务服务和持久化。


## 页面骨架：WorkbenchShell v0.2（Candidate）

组合路径：组件库 → 页面骨架 → 标准页面 → Demo / Website。骨架源码是唯一维护源，接入项目沿用按需复制源码与来源清单，不再还原独立设计稿。当前实现总骨架与第2项 Agent 页面骨架候选，第3—7项未启动。

| 输入 | 责任 |
| --- | --- |
| organization / user | 当前组织标识、名称、摘要与当前身份；无跨组织切换 |
| navigation / activeId / onNavigate / onPersonal | 导航数据、当前位置和路由回调；骨架不生成业务页面 |
| search | 外部查询、结果、加载/错误状态、来源与范围说明、选择回调；本轮夹具仅含五入口与一材料 |
| notifications | 记录、未读、逐条与全部已读回调；不改任务或业务成果状态 |
| monitor | 显式后台任务状态和独立连接状态；不会从对话结束推断完成 |
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

**以下是规划，尚未实现任务模型调整。** 名称已统一为「AI 活动监视器」。当前已实现的通用 monitor 接口继续标为演示，后续按下列边界替换：

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
