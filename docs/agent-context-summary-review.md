# Agent 语义组件第一组 v0.1 · 设计候选

2026-09-22。依据 [v0.2.1 批准规范](OLE_Teacher_Workspace_Agent_Component_Spec_v0.2.1_APPROVED.md)及[复用规划 v0.1.2](智能曜彩_Agent语义组件复用与设计规划_v0.1.2.md)，在原 `/next/components/agent-components#context-summary-review` 交付六项独立样本和一组最小组合。用户在首项之后授权“先做一组组件来看看效果”，本轮据此扩展候选范围。组件目录仍为 80 项；没有新增完整业务页。

## 先映射，再设计

| 规范语义 | 复用 / 补齐 | 呈现 |
| --- | --- | --- |
| 03 上下文摘要 | 保留本站版本 104 的 AgentContextSummary，组合 AgentContextList | 对象与约束、来源事实、受控版本展开 |
| 13 摘要预览 | 新增 AgentArtifactPreview；复用 Card、Badge、Button | 名称、版本、内容状态、摘要、节选及实际可用的查看入口 |
| 15 对比查看器 | 扩展 AgentChangeReview，保留原字符串接口 | 原稿 / 候选版本、完整差异、采纳范围、阻塞说明；窄容器顺序阅读 |
| 25 执行确认 | 新增 AgentExecutionConfirmation；复用 Card、Alert、Button | 一个决定区内说明动作、对象、版本与影响；提交后保留范围 |
| 26 任务进度 | AgentExecutionProgress 组合现有 AgentTaskProgress / AgentStepStatus | 整体状态独立于步骤；等待或回执不明时静态保留上次进度 |
| 27 执行结果 | 新增 AgentExecutionResult，组合 AgentArtifactPreview | 回执、已完成 / 未完成范围、版本、实际可用的后续动作 |

这些是六项语义的设计候选，不是把 42 项能力拆成 42 个新组件。`presentation="card" | "inline"` 仅控制视觉外壳，避免组合中层层套卡；它不创建规范里的 Workspace 宿主面板。对象打开与复杂详情承载交由 Workspace。

来源区分：GitHub main 核对基线为 `0001d871280b9c5a9a4aa55ac9d5eeb2c9f3c341`。候选分支 `design/agent-guided-workspace` 的 `f9f0131cf248b3d8f0e44225927223a1e5f01a43` 与站点版本 103 的 `451334514e2d44779fdbec3d3cf2203a8780df5b` 文件树相同，但提交历史不同；上下文摘要来自站点版本 104 的 `d53cab94c0470840f29deda4c6d2b40da30dd185`。本轮在这个站点基线上继续，不宣称已合入 GitHub main。当前增量坐标以站点保存版本记录为准。

## 契约与状态

- 上下文四类事实分别由宿主提供。confirmed 说明范围；absent 仅用于已确认覆盖完整且没有对应事件；unknown 与 unavailable 保持区分。查看来源不改变事实，历史标记不推定当前上下文。
- 预览不推导执行成功、下载可用或发布完成；没有 open 能力就不显示打开入口。无成果占位由调用方呈现，不伪造成果对象。
- 确认使用受控联合类型：ready / submitting / received / blocked / unknown / recorded。只有 ready 可传确认动作。blocked 可传查看变化的能力；unknown 仅提供查询原执行能力。组件不判断权限、条件有效性或幂等性。
- 进度的整体状态和步骤分别由调用方传入；不依据按钮点击、经过时间或计时器推测状态，也不推算百分比。仅整体状态为 `running` 时展示实时步骤；其余状态静态保留最后记录，将其中的 running 步骤显示为“上次进行到”，不转圈、不标记当前步骤。原 AgentTaskProgress 默认调用兼容。
- 结果接收 succeeded / partial / failed / unknown 联合类型。未知回执只接受查询入口；部分完成保留两类范围；明确失败的重试仅在宿主提供能力时显示。回调不把失败自动改写成成功。
- 对比新增可选版本标签、采纳范围、展示插槽和重新选择回调。decision 仍必传，不内置 pending 默认值。采纳和撤回只返回意图；调用方负责草稿变更、失效核验与正式保存。展示插槽不代表公式语义差异算法；DraftMathPreview 独立契约不变。

## 任务进度状态映射

规范依据：[v0.2.1 批准原文 §7.1](https://github.com/Ashrum/intelligence-prism-ui/blob/481f54ff40ca1e5df42be1ab12ddd4a31168e2b2/docs/OLE_Teacher_Workspace_Agent_Component_Spec_v0.2.1_APPROVED.md#71-全局任务状态) 已取得并核对，原件归档于 PR #21，尚未合入当前分支所基于的 main。此前“缺少原文”的记录已解除。该节要求统一呈现排队、运行、暂停、等待人工、完成、失败、降级和重试，映射既有执行契约；显示状态支持与执行来源接入分别登记，不在前端建立另一套业务状态真相。

`AgentProgressState` 与标签由 `lib/prism-next/agent-progress.ts` 统一提供：

| 展示态 | 标签 | 展示态 | 标签 |
| --- | --- | --- | --- |
| `pending` | 待开始 | `running` | 进行中 |
| `waiting` | 等待处理 | `unknown` | 状态未确认 |
| `completed` | 已完成 | `partial` | 部分完成 |
| `failed` | 执行失败 | `queued` | 排队中 |
| `paused` | 已暂停 | `waiting-human` | 待人工处理 |
| `degraded` | 已降级 | `retrying` | 重试中 |

`mapAgentProgressState` 运行时只适配本仓库的两个契约：

| 来源 | 契约文件 | 源状态 → 展示态 |
| --- | --- | --- |
| `shell` | `components/prism-next/skeletons/workbench-model.ts` · `TaskState` | `idle` → `null`；`queued` → `queued`；`running` → `running`；`attention` → `waiting`；`failed` → `failed`；`completed` → `completed` |
| `review` | `lib/prism-next/review.ts` · `TaskStatus` | `idle` → `null`；`running` → `running`；`confirm` → `waiting-human`；`completed` → `completed`；`stopped` → `null`；`error` → `failed` |

以下 Workspace 词汇仅为**接入方适配参考，非组件依赖**；由接入方实现，不纳入组件库运行时类型或映射：

| 来源 | ole-school-workbench 源文件 | 源状态 → 建议展示态 |
| --- | --- | --- |
| `teacher-agent` | `ole-school-workbench/src/features/teacher/shared/model.ts` · `AgentTask.status` | `DRAFT` → `pending`；`READY` / `INSUFFICIENT` → `waiting-human`；`STOPPED` / `ADOPTED` / `REJECTED` → `null` |
| `conversation` | `ole-school-workbench/src/features/teacher/agent-home/conversation-directory.ts` · `ConversationStatus` | `running` → `running`；`waiting` → `waiting-human`；`completed` → `completed`；`stopped` → `null` |

`null` 表示由宿主处理空闲、已停止或业务决定，不表示 `unknown`（执行回执未确认）。停止是终态，所有 `stopped` / `STOPPED` 均映射为 `null`，不能呈现为可恢复的暂停；参见 `examples/agent-workspace.tsx` 的“任务已停止，没有采用任何建议”及“从头重试”。对话状态是聚合摘要，不能用来推断每项任务的执行回执；采纳 / 不采纳也不等于执行成功 / 失败。

`paused`（已暂停）、`degraded`（已降级）、`retrying`（重试中）均支持作为调用方显式传入的显示状态，但**既有执行状态来源未接入**：当前 `shell` / `review` 契约没有对应状态，以上来源适配保持不变，不虚构任何源状态映射。显示“重试中”不代表组件发起重试，也不能由点击重试按钮直接推断。后续接入须由宿主从可信执行状态取得这些事实；示例样本不构成执行来源。

## 确认、进度与结果的最小组合

示例选择器手动提供 15 种组合样本，供逐项查看同一次执行可能出现的事实，不模拟自动流转。新增排队、暂停、降级、重试中四种样本；“待人工处理”明确传入 `waiting-human`，不使用通用 `waiting`。组件仍仅显示调用方提供的状态，没有自动执行、轮询、业务 Store 或权限引擎；选择样本和点击业务动作不等于执行状态已变化。独立确认及组合确认按钮只反馈操作意图，不自动切换为 submitting；状态由宿主传参或示例选择器显式改变。

| 外部事实 | 当前决定区 | 过程 / 结果 |
| --- | --- | --- |
| 条件齐备 | 完整影响与单个确认动作 | 不伪造进度 |
| 提交中 | 保留范围，移除提交动作 | 尚未收到接收回执，步骤待开始 |
| 已接收 | 保留范围与接收状态 | 不推定已开始 |
| 排队中（`queued`） | 保留已接收范围 | 静态显示待开始步骤，不推定已运行 |
| 执行中 | 当时范围可展开 | 当前阶段与步骤由回执提供 |
| 已暂停（`paused`） | 保留当时范围 | 静态保留最后步骤；执行来源未接入 |
| 待人工处理（`waiting-human`） | 待核对入口优先 | 已完成部分保留，上次步骤不转圈 |
| 已降级（`degraded`） | 显示调用方提供的降级说明 | 静态保留最后步骤；执行来源未接入 |
| 重试中（`retrying`） | 显示调用方提供的重试事实 | 静态保留最后步骤；执行来源未接入，不由重试按钮推断 |
| 原稿更新 / 当前只读 | 阻塞原因直接可见，无确认动作 | 不创建执行结果 |
| 回执未确认 | 只提供查询原执行入口 | 结果未知优先；保留最后步骤；不重复提交 |
| 完成 / 部分完成 | 对应成果及可用动作优先 | 成功 / 未完成范围同时保留，过程和确认可展开 |
| 明确失败 | 失败事实及宿主提供的恢复入口 | 重试意图不自动改变失败回执 |

## 评审与接续

| 检查范围 | 谁验收 | 本轮状态 |
| --- | --- | --- |
| 视觉、契约、独立交互、主题、容器适配 | 智能曜彩设计评审 | 组件候选待用户视觉评审；实现检查见下文 |
| 宿主承载、真实版本、草稿与焦点接续、能力撤回 | Workspace 维护者 | 待接入验收；不以模拟状态代替签收 |
| 可信回执、真实文件和引用证据、存储、权限、并发与幂等 | Workspace / Runtime 与业务服务维护者 | 真实服务待验 |

组件评审通过不会自动升级为宿主或真实服务通过。共享源码及 props 契约后，由 Workspace 提供实际约束和接入适配；本轮不修改 Workspace、业务存储或 Runtime。

## 验证记录

### 本次 §7.1 显示状态补齐（2026-09-23）

- 在 `fix/agent-self-audit-v0.1` 独立工作目录完成类型检查：`node node_modules/typescript/bin/tsc --noEmit --incremental false`。
- 相关 16 项回归通过：`agent-progress` 4 项、`agent-semantics` 6 项、`catalog-search` 6 项。覆盖既有来源映射不变、不把源状态虚构为暂停／降级／重试中、全部显示标签、非 running 步骤快照、未知回执及相关语义目录入口。
- 本地 `5174` 预览实际切换排队、暂停、等待人工、降级、重试中五种进度样本：标签正确；排队三步均待开始；其余四种保留上次步骤；均无运行旋转图标或当前步骤声明。暂停、降级、重试中明确显示“执行状态来源未接入”。
- 组合示例实际点击确认后保留待确认状态；失败结果点击重试后保留失败事实，仅显示意图反馈。随后通过状态选择器显式传入“重试中”，不出现成功结果；384px 容器的 `scrollWidth` 与 `clientWidth` 均为 384，无横向溢出。
- 本次为显示状态和样本验证，未执行生产构建或发布站点。真实执行来源、任务／执行轮次归属和迟到回调隔离仍属宿主与 Runtime 接入待验。

### 历史候选验证

以下保留第一组候选已有的验证范围，不作为本次新增状态的全量验收。

4 项组件契约测试覆盖任意业务对象、缺查看能力、非 ready 无提交、未知结果仅查询、部分完成保留两类范围、历史步骤无持续动画；既有 Agent 与组件复用 13 项回归通过。类型与语义字号检查通过。

浏览器检查覆盖浅色、暖纸、深色及 384px 容器，两种用途，缺查看能力、采纳 / 重新选择、过期阻塞、提交中、未知回执查询、等待处理、部分成果查看与弹层焦点返回。检查到的正文为 16px、决策与状态文字为 14px；窄容器无横向溢出，等待 / 未知步骤无运行动画。确认和采纳后的焦点落到保留的标题，来源 / 成果弹层返回原查看按钮。未把此范围宣称为完整无障碍或全站审计。

最终构建、发布结果以站点保存版本与本轮交付记录为准。真实移动设备、读屏器、200% 缩放、真实授权与执行不在本轮已验证范围。

## 批准规范原文归档与任务状态复核（2026-09-23）

本次将用户提供的两份原文完整放入 `docs/`，保留原文件名、内容和行号。规范与规划仍分别代表批准设计基线和复用计划，不因入库而升级为实现验收。上方既有实施、测试和站点记录保留其当时范围。

| 原文 | 行数 | SHA-256 |
| --- | --- | --- |
| [Agent 组件规范 v0.2.1 Approved](OLE_Teacher_Workspace_Agent_Component_Spec_v0.2.1_APPROVED.md) | 649 | `43f8ff09829c884585e80bd541a38fd986104923f3ff945160dbe8346efdcd04` |
| [Agent 语义组件复用与设计规划 v0.1.2](智能曜彩_Agent语义组件复用与设计规划_v0.1.2.md) | 400 | `0948cc26c10c327ab6b38f3a08b3184c0ba0faae6fe8b9b52a068b902b4b423c` |

**核对对象**：本地自审修复分支 `fix/agent-self-audit-v0.1` 的固定提交 `3b1c8915f7c6b525852630732be791db5da20c43`。下述源码路径与行号均指该提交；不代表文档分支或 GitHub main 已包含修复。文档分支以 `main@5228affd221d20aff6d3b20bd1a5364e42dd5e38` 为基线，仅归档原文和复核记录，不带入自审分支代码。

**原文依据**：批准规范第 7.1 节 L336–342，尤其 L338 列明排队、运行、暂停、等待人工、完成、失败、降级、重试；L340 要求未知状态明确呈现、收起不停止任务且离线不推定失败；L342 要求更新关联任务与执行轮次。第 8.1 节 L381–405 明确 Runtime 与授权服务执行、界面消费真实回执；第 10.3 节 L494–500 区分历史事实和当前工作卡。附录 A 不冻结字段名或 Schema，不能由前端杜撰一套运行时状态。

| 第 7.1 节状态 | 自审修复提交的实际支持 | 核对结论 |
| --- | --- | --- |
| 排队 | `AgentProgressState.queued`；`shell.queued → queued` | 展示词汇和已有源映射具备；示例未覆盖 |
| 运行 | `running`；shell 与 review 的 running 均有映射 | 展示词汇和已有源映射具备 |
| 暂停 | `paused` 展示标签；当前两个源契约没有暂停输入 | 规范确实要求暂停；只有展示支持，不等于真实暂停能力 |
| 等待人工 | `waiting-human`；`review.confirm → waiting-human` | 适配已区分；示例仍把“待人工处理”映射为通用 `waiting`，需对齐 |
| 完成 | `completed`；shell 与 review 均有映射 | 展示词汇和已有源映射具备 |
| 失败 | `failed`；shell.failed 与 review.error 均有映射 | 展示词汇和已有源映射具备 |
| 降级 | 无 `degraded` 展示态与映射，测试断言该标签不存在 | 尚未覆盖规范要求；不能用 partial 或 failed 替代 |
| 重试 | 失败结果可发出宿主提供的重试意图；无 `retrying` 展示态与映射 | 重试入口不等于执行中的重试状态，覆盖仍不完整 |

源码证据：`lib/prism-next/agent-progress.ts:4–29`、`components/prism-next/agent-semantic-components.tsx:76–110`、`components/prism-next/demos/agent-semantic-group.tsx:29–34,60–66,114–119,131`；测试声明见 `tests/agent-progress.test.mjs:5–27` 和 `tests/agent-semantics.test.mjs:74–86`。词汇适配函数目前仅由测试调用，尚未接入实际调用方。`review.stopped → null` 保持停止事实由宿主处理，不把停止误称为暂停或回执未知。

**结论：部分对齐，不能据现有测试宣布第 7.1 节完整通过。** 原文缺失已经解除，早期“规范原文待取得”的记录应视为历史条件；“规范列出暂停”的归因已核实。降级与重试状态的展示缺口仍存在，排队／暂停／等待人工的示例与适配接入也待补齐。后续应沿用权威任务执行契约确定语义和映射；没有来源状态时标明未接入，不通过前端计时器或重试按钮猜测执行事实，也不以测试断言“不支持”替代规范验收。

任务与执行轮次的归属、旧回调隔离、收起后的后台连续性、离线与未知状态、历史／当前卡片标识仍需宿主和 Runtime 接入验收；手动演示与纯词汇适配无法证明这些已完成。组件继续消费受控数据，不要求为一次文档核对改造为状态管理服务。

本轮验证仅包含原文版本／行数／SHA-256、Git 文件对象一致性、文档链接与差异检查，以及固定提交的源码和测试声明阅读；未重跑应用测试、未修改组件行为、未发布站点。
