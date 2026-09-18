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

## 常用展示约定

- Avatar：通过 `className` 使用 24、32、40、48、64、96px 六档示例，默认 32px；保留图像失败时的文字回退。
- Card：内容操作、横向条目、指标、人物、选择与分组由同一套 Card 子组件组合，不新增六套独立组件。
- Frame：保留 coss 默认外框内边距 4px、面板内部 20px；多面板之间间隔 4px。
- 教材目录：外部 `createDirectory` 数据支持递归层级，2—5 级示例位于独立 `directory-depth` fixture。选择以叶节点为准，父级勾选包含全部下级，取消不提交草稿。

### 外部交互参考：beUI

- **入口与定位**：[beUI](https://beui.dev/) 作为 Motion Interaction / Advanced Interaction Inspiration 外部参考，用于后续 Motion 与 AI Interaction Language 的设计验证。
- **重点观察**：状态转换、内容出现与消失的节奏、操作反馈、内容展开及组件形态变化；可关注 Button 状态反馈、Dialog 进入、Card 展开、Empty State 和 Notification / Toast 等场景的表现。官方参考：[Motion Guide](https://beui.dev/docs/motion-patterns)、[Agent Loading States](https://beui.dev/components/agents/loading-states)。
- **AI 状态表达**：可借鉴其界面表达，研究批阅、诊断、学习路径生成和数据刷新过程的反馈。阶段、进度和结果须由调用方的真实状态驱动；这些是智能曜彩的设计参考场景，不代表 beUI 已提供相应业务能力。
- **使用边界**：仅作交互灵感，不直接复制组件，不作为基础组件、Design Token 或组件规范来源；基础实现继续遵循现有 coss / Base UI 与主题约定，不因纳入参考而新增运行依赖。
- **取舍原则**：保持克制、高信息密度和长时间使用舒适性，尊重减少动态效果设置；避免炫技动画、Landing Page 风格、过度弹性及无语义的发光或渐变装饰。基础交互保持稳定，关键 AI 场景的动态反馈以帮助理解状态为准。

## 代码与导航分层

| 层级 | 目录 / 入口 | 内容 |
| --- | --- | --- |
| 基础组件 | `components/coss` | 54 个固定来源的 coss 原始组件 |
| 可复用组件 | `components/prism-next`、`charts` | 数据、可选插槽、受控状态与事件接口 |
| 组件示例 | `demos`、`/next/components/[slug]` | 单个组件的最小使用与不同输入对照 |
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

- `kind` 保留外部业务名称；题型颜色由已识别 `response` 决定：`single / multiple / fill / boolean` 为蓝，`long` 为紫红。小问缺少类型时继承明确父级；全部已知且包含多种作答模型时整题为青绿，未明确类型回退中性。颜色不代表评分政策。
- `QuestionRecord` 只定义题面、选项、小问与可选答案。题卡不负责试题篮、选题筛选、组卷、题目保存或统计。
- 独立展示、题库和组卷共用参考题卡：8px 细边框、题型与分值在上、标题在下，16px 标题、15px 正文（1.75 行高）、14px 选项与小问。题卡宽度由容器决定，内部不设最大宽度；选项按容器宽度换列，宽屏几何材料可并排。列表用 24px 间距；不再提供 `variant`、`reading` 外观分支。`number` 与勾选控件位于题头，不预留左栏。打印正文颜色和段距独立。
- 试题篮仍复用 `QuestionCard`，由 `.q-basket-list` 容器排列为序号左栏、标题在上、标签与题干在下；题间以留白区分，题卡本身不另加外框。题篮不提供详情或跨区域定位，详情保留在完整题卡中。常规高度下统计与操作位于滚动列表之外，短窗口改为整篮滚动。
- `compact` 只显示题干，省略选项、附图、材料块与小问；所有场景均自然换行，避免裁切公式。完整题面与材料通过调用方的详情入口访问。
- `headerActions` 是标题右侧操作插槽，`actions` / `secondaryActions` 位于底部；三者均提供 coss Toolbar 上下文，可传入 `ToolbarButton`。`selectionDisabled` 和 `selectionLabel` 分别控制选择禁用和可访问名称。
- `actions` 区域的默认实心按钮使用统一蓝底白字；操作数量与行为仍由调用方提供，至多保留一个主操作。面板底部可用 `q-primary-action` 复用同一颜色。类型色独立于成功/错误状态，不复用 destructive 等状态变体。
- `showPoints` 控制总分及小问分值显示，隐藏分值仍保留题型；`displayPoints` / `displayPartPoints` 仅覆盖当前展示，不修改传入原题。
- `details` 是可选内容插槽。未传入时没有详情按钮；展开可在内部维护，或由 `detailsOpen` / `onDetailsOpenChange` 控制。
- 答案解析中的独立公式与说明文字左对齐，长公式在原区域内横向滚动；行内公式和公式内部对齐不改动。打印答案沿用左对齐规则。
- `QuestionDetails` 单独接收资料、教材定义、关联目录与允许的标签页。限制标签页会阻止相应面板渲染。敏感答案仍应由服务端从题目载荷中移除；UI 隐藏不是权限控制。
- `QuestionActions` 将相似题及次常用操作收进更多菜单；仅显示实际传入回调的操作。是否进入试题篮、移动、替换与删除由容器决定。
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


## 智能曜彩业务状态（v1.21）

`StatusBadge` 位于 `components/prism-next/status-badge.tsx`，组合现有 coss Badge，不新增目录组件。调用方显式传入 `tone` 和状态文字，不从标签文案推测状态。

| tone | 用途 | 色彩 |
| --- | --- | --- |
| pending | 等待人工处理、复核、验证 | 曜紫红 |
| active | 正在执行 | 曜蓝 |
| complete | 已完成、已更新、已保存 | 曜青绿 |
| neutral | 草稿、暂停、排除、尚未进入的步骤 | 中性 |
| warning | 来源失效、逾期、评分差异 | 琥珀 |
| error | 校验或执行失败 | 独立红色 |

所有状态提供文字与图标，颜色为辅助。使用 `--brand-{blue,magenta,lime}-{ink,surface}` 三主题配色；原 `--q-*` 同名角色保留为别名。仅真实运行显示 Spinner，不为状态装饰增加闪烁。题型仍使用色点身份；图表分类继续由数据定义，不能自动套成三类。

`DataRecordTable` 列可传 `numeric: true`（右对齐与等宽数字）或 `align`；`rowLabel(row)` 提供查看按钮的可读名称。以上均为兼容性可选参数。`MilestoneList` 按自身容器宽度选择横/竖排列，并用可见状态文字及 `aria-current="step"` 标识当前节点。
