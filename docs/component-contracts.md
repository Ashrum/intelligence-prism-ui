# v1.11 组件复用约定

组件负责呈现数据与返回事件。统计口径、流程跳转、业务判断、存储与模拟数据由调用方负责。所有 UI 使用现有 coss 控件、语义主题和数学字体；不重新实现按钮、选择框或 Drawer。

## 代码与导航分层

| 层级 | 目录 / 入口 | 内容 |
| --- | --- | --- |
| 基础组件 | `components/coss` | 54 个固定来源的 coss 原始组件 |
| 可复用组件 | `components/prism-next`、`charts` | 数据、可选插槽、受控状态与事件接口 |
| 组件示例 | `demos`、`/next/components/[slug]` | 单个组件的最小使用与不同输入对照 |
| 应用示例 | `examples`、`/next/examples/[slug]` | 题库、组卷、分析和学习工作流，不计入组件数量 |
| 示例数据 | `fixtures` | 人工题目、作答、评分和关联资料 |

`/next/reading` 和 `/next/agent` 保留为应用示例入口。旧 `/next/components/student-analysis` 重定向至应用示例。日历、里程碑和文档区域不再归入图表分类。

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
| ScatterChart | x/y、标签、可选点大小 | `onSelect(id)` |
| BoxPlotChart | 下须、Q1、中位数、Q3、上须 | `onSelect(id)` |
| MetricSummary | 标签、数值、说明 | 可选查看回调 |
| GoalComparison | 基线、当前、目标、单位、状态插槽 | 不推断目标达成 |
| StatusComposition | 分类、数量、可选颜色 | 可选选择回调 |
| FilterBar | 字段定义、选项、当前值 | 值变更 / 重置 |
| DataRecordTable | 任意记录、列渲染函数 | 选中记录 ID |

新增复杂图形采用按需加载的 ECharts 6.1.0 SVG 引擎。原有趋势与比较继续使用 Recharts；没有同时引入第二套新引擎。图表提供数据表作为文字和键盘操作入口。缺测用 null 保留，零值不等于缺测；非法箱线摘要明确提示并不绘制。分箱、统计方法、达标判定和学情结论在组件外处理。

首批能力仅为热力矩阵、散点与箱线；雷达、桑基、网络、树图等尚未封装，按真实复用需求继续添加。

## 学习、文档与 Agent

- `DiagnosisEvidenceTable`：外部观察、来源、定位、状态、操作。
- `LearningGoalCard` / `VerificationFields`：目标容器与受控逐项核验字段。
- `LearningTaskList` / `MilestoneList`：外部任务与阶段状态。
- `WorkloadCalendar`：日期索引数值、容量、单位、选中日期和月份。日历不生成任务。
- `DocumentRegionViewer`：文档内容、百分比区域坐标、缩放与选择。不提供扫描识别或 OCR。
- `AgentComposer` / `AgentTaskProgress`：受控输入、提交/停止事件与外部步骤状态。不连接模型或模拟执行器。

应用示例中的题库状态、学习 reducer、合成证据、模拟任务与人工扫描区域均不放入这些复用组件。当前仍是本地交互演示，不含真实业务服务和持久化。
