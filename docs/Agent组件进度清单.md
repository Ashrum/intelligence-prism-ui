# Agent 组件进度清单

Product Owner 批准日期：2026-09-25。最后更新：2026-09-25。性质：**持续更新的进度清单**，每轮以本表汇报推进项、证据、未验证范围与下一步。

主线是完成 Workspace Agent 所需的语义组件。组件在 `intelligence-prism-ui` 开发，在 Workspace `/teacher/agent/workspace` 的 **P04 试验台轻量验证**；除非无法在 P04 验证，不为验证新建业务流程。本仓库 `/next/skeletons/agent` 是历史骨架，不作接入验收依据。业务 Store、路由、权限、持久化与执行服务留在 Workspace／宿主。

## 状态与呈现口径

| 状态 | 定义 |
| --- | --- |
| 未开始 | 尚未推进该语义组合；已有基础控件、领域组件或 Workspace 本地组合仅列为复用起点，不算完成。 |
| 组件候选 | 本仓库已有该语义的实现与测试，尚未完成 Workspace 浏览器验证；未合并候选必须注明任务分支，不表示 main 已包含。 |
| Workspace 已验证 | 已引入并在 `/teacher/agent/workspace` 浏览器验证；P04 示例验证不等于真实服务接入。当前十一项的证据来源及未核实边界见下节。 |
| 真实业务接入 | 接入真实服务；本阶段所有项均未达到。 |

按每项当前最高阶段互斥计数，不重复累计。两态声明只使用：**仅 Inline / Inline + 通用扩展容器 / Inline + 专用扩展内容 / 待定**。未开始项的语义呈现契约尚未确定，登记“待定”，不从复用控件推定支持视图。

支持视图列使用 `inline / workspace / compact` 表示实际用法。其中 03/04/17/18/21/26/27/28 的 API 是 `view="inline" / "workspace"` 加独立 `density="default" / "compact"`；compact 为紧凑密度，可与两种 view 组合，不是第三种业务态。`presentation="card" / "inline"` 只控制外框，不等于扩展态。

## 核查基线与证据

- 2026-09-25 语义 04 按 Product Owner 本轮交接更新为 Workspace 已验证：本仓 [Prism #45](https://github.com/Ashrum/intelligence-prism-ui/pull/45)（`7bf305b`）、[Prism #46](https://github.com/Ashrum/intelligence-prism-ui/pull/46)（`01fae8e`，compact 单行）；[Workspace #15](https://github.com/Ashrum/ole-school-workbench/pull/15)、[Workspace #16](https://github.com/Ashrum/ole-school-workbench/pull/16)，Agent 输入区：示例材料为已有资料、本机文件仅检查、上传未接入。支持 inline / workspace / compact，两态声明为 Inline + 专用扩展内容。本轮仅更新文档，不产生新的浏览器复验或真实服务接入结论。

- 2026-09-25 语义 28 按 Product Owner 本轮交接更新为 Workspace 已验证：本仓 [Prism #43](https://github.com/Ashrum/intelligence-prism-ui/pull/43)（`48b4b9d`）；[Workspace #14](https://github.com/Ashrum/ole-school-workbench/pull/14)，备课提纲对象：章节编辑、切章／放大／收起／会话往返保持、历史只读。支持 inline / workspace / compact，两态声明为 Inline + 专用扩展内容。本轮仅更新文档，不产生新的浏览器复验或真实服务接入结论。

- 2026-09-25 语义 17 按 Product Owner 本轮交接更新为 Workspace 已验证：本仓 [Prism #40](https://github.com/Ashrum/intelligence-prism-ui/pull/40)（`9b71c78`）；[Workspace #13](https://github.com/Ashrum/ole-school-workbench/pull/13)，P04 逐题复核：待复核→提交中→回执未确认→编辑后过期→重新复核→已复核。支持 inline / workspace / compact，两态声明为 Inline + 专用扩展内容。本轮仅更新文档，不产生新的浏览器复验或真实服务接入结论。备注：QuestionReview 已外部状态化（[Prism #42](https://github.com/Ashrum/intelligence-prism-ui/pull/42)），并已在 Workspace 迁移（[Workspace #14](https://github.com/Ashrum/ole-school-workbench/pull/14)）。

- 2026-09-25 语义 21 按 Product Owner 本轮交接更新为 Workspace 已验证：本仓 [Prism #38](https://github.com/Ashrum/intelligence-prism-ui/pull/38)（`1dee5ec`）；[Workspace #12](https://github.com/Ashrum/ole-school-workbench/pull/12)，P04 第 2 题下钻：对话结论 → 证据链逐层导航与返回。本轮仅更新文档，不产生新的浏览器复验或真实服务接入结论。

- 2026-09-25 语义 18 按 Product Owner 本轮交接更新为 Workspace 已验证：本仓 [Prism #36](https://github.com/Ashrum/intelligence-prism-ui/pull/36)（`49e44e5`）；[Workspace #11](https://github.com/Ashrum/ole-school-workbench/pull/11)（`dce7e78`），P04 试验台浏览器验证覆盖待处理／提交中／回执未确认／已处置。本轮仅更新文档，不产生新的浏览器复验或真实服务接入结论；下列六项核查仍为此前记录。

- 编号、十二族及复用起点：[覆盖矩阵 v0.1 §2.2、§6](Agent业务流程组件覆盖矩阵_v0.1.md)、[复用规划 v0.1.3 §3、§7.1](智能曜彩_Agent语义组件复用与设计规划_v0.1.3.md)。覆盖矩阵是 2026-09-24 的旧基线，不能沿用其中六项“新语义未引入”的历史状态。
- 当前 API：[组件复用约定](component-contracts.md)，重点为“对比查看器两态 v0.1”“任务记录三件套两态 v0.1”及步骤状态契约。
- 本地任务分支 `docs/agent-component-tracker`，HEAD 与 main 均为 `fc257dae0be5af83a4f282875de3fb595b6b88fa`。本地 Workspace 固定核查提交为 `8f9bb13`（PR #10 合并），来源 manifest 和 P04 呈现代码可核对引入情况。
- **六项“Workspace 已验证”按本次 Product Owner 交接登记。** 本轮已核实实现、测试文件、视图契约及两仓本地合并提交；浏览器验证结论未独立核实。Workspace 的[固定接入记录](https://github.com/Ashrum/ole-school-workbench/blob/8f9bb13/docs/P04独立工作区接入-20260924.md)仍保留 Builder 的“Supervisor 浏览器复验待执行”等历史措辞，不能单凭合并提交认定浏览器通过。GitHub PR 正文读取被沙箱网络限制阻断，PR 正文／评审结论与远端实时状态均为**未核实**；后续补录 Supervisor 的具体验证记录，不把本次文档核查写成浏览器复验。
- 六项测试源码在 main 可核对：`tests/agent-semantics.test.mjs`、`tests/agent-change-set.test.mjs`、`tests/agent-record-views.test.mjs`、`tests/agent-step-states.test.mjs`。本轮未重跑这些测试，不产生新的组件测试或视觉通过结论。

### PR #26–#34 核对索引

以下 PR 编号和提交关系由 `git log --oneline main` 核实；链接按已核实的 origin 仓库地址列出。

| PR | main 合并提交 | 对清单的影响 |
| --- | --- | --- |
| [Prism #26](https://github.com/Ashrum/intelligence-prism-ui/pull/26) | `23a112c` | 回退题卡层级调整，不作为新增语义完成。 |
| [Prism #27](https://github.com/Ashrum/intelligence-prism-ui/pull/27) | `8bab8c4` | 复用规划 v0.1.3；42 项名称、族及两态建议来源。 |
| [Prism #28](https://github.com/Ashrum/intelligence-prism-ui/pull/28) | `ecfd1fd` | 覆盖矩阵；42 项复用起点与 P0/P1 顺序来源。 |
| [Prism #29](https://github.com/Ashrum/intelligence-prism-ui/pull/29) | `e0aef37` | 回收 Workspace 通用适配；Composer 等基础支持，不新增语义完成项。 |
| [Prism #30](https://github.com/Ashrum/intelligence-prism-ui/pull/30) | `760ab12` | Button info variant；不是语义组件完成项。 |
| [Prism #31](https://github.com/Ashrum/intelligence-prism-ui/pull/31) | `fe29283` | 15 AgentChangeSet 两态实现。 |
| [Prism #32](https://github.com/Ashrum/intelligence-prism-ui/pull/32) | `e99813a` | 教师文案与每卡提示密度收敛；不新增语义完成项。 |
| [Prism #33](https://github.com/Ashrum/intelligence-prism-ui/pull/33) | `0a19ff7` | 03/26/27 的 inline、workspace 与 compact 用法。 |
| [Prism #34](https://github.com/Ashrum/intelligence-prism-ui/pull/34) | `fc257da` | 步骤 unknown / waiting-human / waiting / partial；不单独新增语义项。 |

Workspace 引入证据：[Workspace #7](https://github.com/Ashrum/ole-school-workbench/pull/7)（`eae616a`，P04 连续流程，含 13/25）、[Workspace #8](https://github.com/Ashrum/ole-school-workbench/pull/8)（`e020976`，15 两态）、[Workspace #10](https://github.com/Ashrum/ole-school-workbench/pull/10)（`8f9bb13`，03/26/27 三处同源记录，vendor 同步至 Prism `fc257da`）。执行确认的 #7 指 Workspace PR，不是 Prism PR。

## 42 项语义进度

路径前缀：`P/` = 本仓 `components/prism-next/`；`B/` = 本仓 `components/coss/`；`W/` = `ole-school-workbench/`。未开始项“实现组件名与文件”列均为**现有复用起点**，不代表完整语义已实现。其证据中的“矩阵 #28”指上表 Prism PR #28（`ecfd1fd`），文件存在性按本仓 `fc257da` 核对；Workspace 局部组合按 `8f9bb13` 核对。优先级沿用覆盖矩阵 §6；未列入前十项的语义不自行补造 P2 等级。

| 序号 | 族 | 语义名 | 实现组件名与文件 | 两态声明 | 支持的视图（inline/workspace/compact） | 状态 | 证据（PR 链接或提交） | 覆盖矩阵优先级 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 范围与对象 | 对象选择器 | 复用起点：Combobox（B/combobox.tsx）、DataRecordTable（P/data-display.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 对象身份、受控选中与搜索状态；对象和合法候选由宿主提供 |
| 02 | 范围与对象 | 范围构建器 | 复用起点：TextbookRangePicker（P/textbook-range-picker.tsx）、Tree（P/tree.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 教材范围已有实现；其他范围用受控字段组合，不内置权限和跨班规则 |
| 03 | 范围与对象 | 上下文摘要 | AgentContextSummary（P/agent-context-summary.tsx） | Inline + 通用扩展容器 | inline / workspace / compact | Workspace 已验证 | [Prism #33](https://github.com/Ashrum/intelligence-prism-ui/pull/33)；[Workspace #10](https://github.com/Ashrum/ole-school-workbench/pull/10)；浏览器结论按 PO 交接，本轮未核实 | P0 · 第 2 项 | 保持四事实独立；随 18/21 验证来源、版本和返回路径。 |
| 04 | 输入与导入 | 文件输入 | AgentFileInput（P/agent-file-input.tsx）；复用 Input / Button / Card / Progress / Collapsible | Inline + 专用扩展内容 | inline / workspace / compact | Workspace 已验证 | [Prism #45](https://github.com/Ashrum/intelligence-prism-ui/pull/45)（`7bf305b`）；[Prism #46](https://github.com/Ashrum/intelligence-prism-ui/pull/46)（`01fae8e`，compact 单行）；[Workspace #15](https://github.com/Ashrum/ole-school-workbench/pull/15)、[Workspace #16](https://github.com/Ashrum/ole-school-workbench/pull/16)；Agent 输入区：示例材料为已有资料、本机文件仅检查、上传未接入 | P1 · 第 9 项 | 下一步：11 集合篮；真实服务未验证。 |
| 05 | 输入与导入 | 采集扫描 | 复用起点：DocumentRegionViewer（P/document-region-viewer.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 可复用页预览和质检呈现；设备采集、OCR、质量判定不属于组件 |
| 06 | 输入与导入 | 内容输入 | 复用起点：Textarea（B/textarea.tsx）、DraftMathPreview（P/draft-math-preview.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 输入仍由宿主持有；可组合当前草稿的公式排版预览，失败保留当前原文；AgentComposer 仅用于指令，不冒充完整编辑器 |
| 07 | 参数配置 | 参数配置器 | 复用起点：Field（B/field.tsx）、Select（B/select.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 直接组合现有字段；关键参数与完整参数的同源呈现，校验结果从外部输入 |
| 08 | 参数配置 | 约束构建器 | 复用起点：Fieldset（B/fieldset.tsx）、Alert（B/alert.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 展示约束项、条件和冲突定位；复杂规则求解交给宿主／规则层 |
| 09 | 参数配置 | 模板选择器 | 复用起点：Card（B/card.tsx）、RadioGroup（B/radio-group.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 外部模板列表、选择和预览；模板存储及管理由宿主承担 |
| 10 | 选择与组合 | 候选选择器 | 复用起点：QuestionCard（P/question-card.tsx）、DataRecordTable / FilterBar（P/data-display.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 支持通用条目渲染与选择事件；检索、排序口径和分页数据外置 |
| 11 | 选择与组合 | 集合篮 | 复用起点：Card（B/card.tsx）、DataRecordTable（P/data-display.tsx）；Workspace TeacherQuestionBasket（W/src/features/teacher/TeacherQuestionBasket.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da`；Workspace `8f9bb13` | P1 · 第 10 项 | 下一批第 6 项：抽取受控集合摘要与完整清单；保留唯一 TeacherQuestionBasket Provider。 |
| 12 | 选择与组合 | 结构编排器 | 复用起点：LearningTaskList（P/learning-components.tsx）、Tree（P/tree.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 当前没有完整通用层级编辑器；先考虑受控排序／分组及上移下移，不搬入组卷模型 |
| 13 | 预览与查看 | 摘要预览 | AgentArtifactPreview（P/agent-semantic-components.tsx） | 仅 Inline | inline | Workspace 已验证 | [Workspace #7](https://github.com/Ashrum/ole-school-workbench/pull/7)；浏览器结论按 PO 交接，本轮未核实 | P0 · 第 3 项 | 随下一批核对同一成果身份与版本、可打开能力；不另建摘要扩展页。 |
| 14 | 预览与查看 | 对象查看器 | 复用起点：QuestionCard（P/question-card.tsx）、QuestionDetails（P/question-details.tsx）、DocumentRegionViewer（P/document-region-viewer.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 通用承载与领域渲染器组合；详情、答案及敏感字段由宿主按权限提供 |
| 15 | 预览与查看 | 对比查看器 | AgentChangeSet（P/agent-components.tsx），组合 AgentChangeReview | Inline + 专用扩展内容 | inline / workspace | Workspace 已验证 | [Prism #31](https://github.com/Ashrum/intelligence-prism-ui/pull/31)；[Workspace #8](https://github.com/Ashrum/ole-school-workbench/pull/8)；浏览器结论按 PO 交接，本轮未核实 | P0 · 第 4 项 | 随 18/17 增量核对冲突、采纳意图与同源草稿；采纳不等于保存。 |
| 16 | 审核与修订 | 审核队列 | 复用起点：DataRecordTable / FilterBar（P/data-display.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 外部待审条目与状态、受控选择和下一项；审核优先级、锁和分派外置 |
| 17 | 审核与修订 | 单项复核器 | AgentItemReviewer（P/agent-item-reviewer.tsx）；复用 VerificationFields / PointsField，证据与对照插槽 | Inline + 专用扩展内容 | inline / workspace / compact | Workspace 已验证 | [Prism #40](https://github.com/Ashrum/intelligence-prism-ui/pull/40)（`9b71c78`）；[Workspace #13](https://github.com/Ashrum/ole-school-workbench/pull/13)；P04 逐题复核：待复核→提交中→回执未确认→编辑后过期→重新复核→已复核 | P1 · 第 7 项 | 下一步：11 集合篮；真实服务未验证。备注：QuestionReview 已外部状态化（[Prism #42](https://github.com/Ashrum/intelligence-prism-ui/pull/42)），并已在 Workspace 迁移（[Workspace #14](https://github.com/Ashrum/ole-school-workbench/pull/14)）。 |
| 18 | 审核与修订 | 异常处理器 | AgentExceptionHandler（P/agent-exception-handler.tsx），复用 Alert / Card / Badge / Button / Collapsible / AgentStepStatus | Inline + 专用扩展内容 | inline / workspace / compact | Workspace 已验证 | [Prism #36](https://github.com/Ashrum/intelligence-prism-ui/pull/36)（`49e44e5`）；[Workspace #11](https://github.com/Ashrum/ole-school-workbench/pull/11)（`dce7e78`）；P04 试验台浏览器验证：待处理／提交中／回执未确认／已处置 | P1 · 第 5 项 | 下一步：11 集合篮；真实服务未验证。 |
| 19 | 分析与诊断 | 指标摘要 | 复用起点：MetricSummary / GoalComparison / StatusComposition（P/data-display.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 优先直接复用，补语义映射说明；统计值、分母、缺测和结论不在组件内生成 |
| 20 | 分析与诊断 | 分布矩阵 | 复用起点：HeatmapChart / ScatterChart / BoxPlotChart（P/analytics-components.tsx 导出） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 直接复用图形与数据表；数据维度、阈值和选择回调由宿主决定 |
| 21 | 分析与诊断 | 下钻与证据浏览 | AgentEvidenceDrilldown（P/agent-evidence-drilldown.tsx）；复用 AgentContextList，DiagnosisEvidenceTable 入口与 DocumentRegionViewer 预览 | Inline + 专用扩展内容 | inline / workspace / compact | Workspace 已验证 | [Prism #38](https://github.com/Ashrum/intelligence-prism-ui/pull/38)（`1dee5ec`）；[Workspace #12](https://github.com/Ashrum/ole-school-workbench/pull/12)；P04 第 2 题下钻：对话结论 → 证据链逐层导航与返回 | P1 · 第 6 项 | 下一步：11 集合篮；真实服务未验证。 |
| 22 | 计划与建议 | 建议集 | 复用起点：Card（B/card.tsx）、Checkbox（B/checkbox.tsx）、DataRecordTable（P/data-display.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 建议依据、选择、调整与采纳事件；不以勾选推定教学任务已创建 |
| 23 | 计划与建议 | 计划构建器 | 复用起点：LearningTaskList / MilestoneList（P/learning-components.tsx）、WorkloadCalendar（P/workload-calendar.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 受控任务、日期和编辑；列表／日历不等于自动排程或完整计划引擎 |
| 24 | 计划与建议 | 路径与优先级 | 复用起点：MilestoneList（P/learning-components.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 顺序、依赖和阻塞的显示与受控调整；路径计算外置，不预建关系图编辑器 |
| 25 | 执行与追踪 | 执行确认 | AgentExecutionConfirmation（P/agent-semantic-components.tsx） | 仅 Inline | inline | Workspace 已验证 | [Workspace #7](https://github.com/Ashrum/ole-school-workbench/pull/7)；浏览器结论按 PO 交接，本轮未核实 | P0 · 第 1 项（执行事实链） | 保持确认范围与原请求关联，核对未知回执不重复提交。 |
| 26 | 执行与追踪 | 任务进度 | AgentExecutionProgress（P/agent-semantic-components.tsx）＋ AgentTaskProgress 步骤（P/agent-components.tsx） | Inline + 通用扩展容器 | inline / workspace / compact | Workspace 已验证 | [Prism #33](https://github.com/Ashrum/intelligence-prism-ui/pull/33)、[Prism #34](https://github.com/Ashrum/intelligence-prism-ui/pull/34)；[Workspace #10](https://github.com/Ashrum/ole-school-workbench/pull/10)；浏览器结论按 PO 交接，本轮未核实 | P0 · 第 1 项（执行事实链） | 随 18 验证整体／阶段／步骤的等待、未知、部分完成及历史快照。 |
| 27 | 执行与追踪 | 执行结果 | AgentExecutionResult（P/agent-semantic-components.tsx） | Inline + 通用扩展容器 | inline / workspace / compact | Workspace 已验证 | [Prism #33](https://github.com/Ashrum/intelligence-prism-ui/pull/33)、[Prism #34](https://github.com/Ashrum/intelligence-prism-ui/pull/34)；[Workspace #10](https://github.com/Ashrum/ole-school-workbench/pull/10)；浏览器结论按 PO 交接，本轮未核实 | P0 · 第 1 项（执行事实链） | 随 18 验证成功／剩余范围与失败明细；unknown 仅查询原请求。 |
| 28 | 内容与成果物 | 文档工作区 | AgentDocumentWorkspace（P/agent-document-workspace.tsx）；复用 Card / Field / Textarea / Badge / Collapsible，接受宿主数学内容 | Inline + 专用扩展内容 | inline / workspace / compact | Workspace 已验证 | [Prism #43](https://github.com/Ashrum/intelligence-prism-ui/pull/43)（`48b4b9d`）；[Workspace #14](https://github.com/Ashrum/ole-school-workbench/pull/14)，备课提纲对象：章节编辑、切章／放大／收起／会话往返保持、历史只读 | P1 · 第 8 项 | 下一步：11 集合篮；真实服务未验证。 |
| 29 | 内容与成果物 | 演示文稿工作区 | 复用起点：Card（B/card.tsx）；通用幻灯片编辑器未核实 | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 未核实有通用幻灯片编辑器；先定义缩略、版本与能力承载，编辑／生成由适配器提供 |
| 30 | 内容与成果物 | 图像查看与画布 | 复用起点：DocumentRegionViewer（P/document-region-viewer.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 可复用查看和定位；裁切、组合、图层与图像生成不能推定已支持 |
| 31 | 内容与成果物 | 音频与转写 | 复用起点：Card（B/card.tsx）；通用波形／转写编辑器未核实 | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 未核实有通用波形／转写编辑器；播放、转写、编辑能力分别声明 |
| 32 | 内容与成果物 | 视频与时间轴 | 复用起点：Card（B/card.tsx）；通用视频时间轴编辑器未核实 | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 未核实有通用时间轴编辑器；播放、字幕和剪辑分别由适配器承担 |
| 33 | 内容与成果物 | 成果物输出 | 复用起点：QuestionPrint（P/question-print.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 题卷打印按原有能力复用；其他格式配置、导出请求和文件可用性按外部能力声明，不伪造下载 |
| 34 | 内容与成果物 | 图形关系工作区 | 复用起点：Card（B/card.tsx）；通用节点／连线编辑器未核实 | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 未核实有通用节点／连线编辑器；图表引擎不等于关系编辑能力，不引入统一 AST |
| 35 | 内容与成果物 | 结构化内容工作区 | 复用起点：Tree（P/tree.tsx）、Collapsible（B/collapsible.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 目录选择不等于内容编辑；需要时补受控层级编辑，内容模型由对应适配器维护 |
| 36 | 教学资源与素材 | 资源检索器 | 复用起点：Combobox（B/combobox.tsx）、DataRecordTable / FilterBar（P/data-display.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 外部检索结果、来源、可用性和使用限制；命中、预览、读取分开 |
| 37 | 教学资源与素材 | 素材提取器 | 复用起点：DocumentRegionViewer（P/document-region-viewer.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 选择片段和来源定位可复用；提取、裁剪、转换服务不在组件内实现 |
| 38 | 教学资源与素材 | 素材包 | 复用起点：Card（B/card.tsx）、DataRecordTable（P/data-display.tsx） | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；后续按需求收敛 | 组合分类、排序和来源引用；沿用资产身份，不另造一套资料库 |
| 39 | 学科工具 | 交互演示器 | 复用起点：Field（B/field.tsx）；领域交互插件未核实 | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 领域演示由插件／适配器提供，按移动端可靠能力声明支持范围 |
| 40 | 学科工具 | 计算与分析工具 | 复用起点：MathContent（P/math-content.tsx）、图表（P/analytics-components.tsx 导出）；计算引擎未核实 | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 现有数学渲染与图表不等于计算器；计算、单位规则和过程来源外置 |
| 41 | 学科工具 | 模拟器 / 虚拟实验 | 复用起点：Field（B/field.tsx）；领域仿真未核实 | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 未核实有领域模拟能力；不在本批自研仿真，先登记输入／结果／能力边界 |
| 42 | 学科工具 | 学科专用编辑器 | 复用起点：MathContent（P/math-content.tsx）、DraftMathPreview（P/draft-math-preview.tsx）；专用编辑器未核实 | 待定 | 未核实（语义未开始） | 未开始 | 矩阵 #28（`ecfd1fd`）；本仓 `fc257da` | 未列前十；0 步骤，按需再定 | 公式显示或草稿预览不等于公式、几何或化学编辑，更不等于计算与正确性校验；按后续专用工具实际能力接入 |

## 非语义但已有的 Agent 组件

以下是输入或支撑组件，不另计入 42 项语义状态；“非语义”仅指不单独占本表的语义编号。文件均为 `P/agent-components.tsx`。

| 组件 | 用途与边界 | 可核对证据 |
| --- | --- | --- |
| AgentComposer | 指令输入、发送／停止意图、范围、只读和发送阻断；不等于 06 完整内容编辑器。 | 本仓 `fc257da`；Prism #29（`e0aef37`）；组件复用约定“Workspace 适配回收 v0.1”。 |
| AgentQuestionCard（追问） | 受控追问选项与选择回调；与学科题目 QuestionCard 区分。 | 本仓 `fc257da` 导出与组件复用约定“Agent 组件”。 |
| AgentContextList | 来源条目及查看意图；03 的复用层，不自行认证来源或四事实。 | 本仓 `fc257da`；03 AgentContextSummary 源码调用。 |
| AgentTaskProgress | 步骤序列、live/snapshot 与 compact 密度；26 的步骤支撑，不替代整体执行状态。 | Prism #33、#34（`0a19ff7`、`fc257da`）；步骤状态契约。 |
| AgentStepStatus | 步骤图标与状态文字，八值状态及历史快照呈现；不推断任务状态。 | Prism #34（`fc257da`）；`tests/agent-step-states.test.mjs`。 |

## 汇总与下一批

| 当前状态 | 项数 | 序号 |
| --- | --- | --- |
| 未开始 | 31 | 除 03、04、13、15、17、18、21、25、26、27、28 外的各项 |
| 组件候选 | 0 | 无 |
| Workspace 已验证 | 11 | 03、04、13、15、17、18、21、25、26、27、28；浏览器证据独立核实边界见上文 |
| 真实业务接入 | 0 | 本阶段均未达到 |
| 合计 | 42 | 不包含上节五个支撑组件 |

下一步：**11 集合篮**。优先在 P04 既有对象与受控事实下完成轻量验证；若某项确实无法在 P04 验证，先记录缺口与所需最小验证范围，再由 Supervisor 收敛任务。18 已完成 P04 试验台浏览器验证，证据见本仓 PR #36（`49e44e5`）及 Workspace PR #11（`dce7e78`）。

每轮更新对应行的实现文件、两态／视图、最高已达状态、PR／提交及下一步，同时更新汇总。Workspace 验证应补录路径、操作、实际文案／状态、三主题、窄容器、长中文与公式、返回恢复及未验证范围；缺失证据写“未核实”。示例回执、静态测试、运行内恢复均不升级为真实服务接入。
