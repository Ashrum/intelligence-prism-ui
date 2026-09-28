# Agent 业务流程组件覆盖矩阵 v0.1

日期：2026-09-24。性质：Builder 只读源码分析与文档建议，待独立 Review；不构成组件、页面或业务验收。

## 1. 结论、基线与阅读口径

**六条故事的主要阻断同时存在于组件组合、Workspace 接入与服务层。第一组六项语义候选已在本仓 main 源码中，但 Workspace 尚未引入这些新实现。** 新 Agent 页面可承担对话目录、输入、本机消息、样例对象和统一题篮；发送仍返回“未接执行”的固定说明。历史 P04、local-start 和专业页面可提供抽取与接入素材，不能登记为新页已经跑通的业务（WPage:76–84、279–298、326–361、512–608；规划 v0.1.3 §2、§7.1）。

### 1.1 固定基线

| 对象 | 本次使用的固定坐标 | 边界 |
| --- | --- | --- |
| 本仓 main / 分析 HEAD | `8bab8c404df74f0f680a9b8154d2134a1a037411` | 本地 `main` 与分析 HEAD 相同；现有任务分支 `docs/agent-flow-coverage`；未 fetch，未核实远端此刻状态 |
| 上一指定基线 | `23a112cabefd0b9ac65f8e1f5a90ca2f2cec4f17` | 至分析 HEAD 两个提交，仅 AGENTS 与 v0.1.3 文档差异，无组件代码变化 |
| Workspace | `4e0d6566af8c3eaeb0277c0837c7073e22b6d288` | 全部读取来自 `git -C /Users/OLE/HermesWork/ole-school-workbench show 4e0d656:<path>`；未使用其当前工作树作为事实 |
| Workspace 基础 vendor 层 | `c643b478ecb1d3a158a458f39fe77edd0cc493de`，1.13.1 | Manifest:1–6，84 个文件记录；部分有本地适配 |
| Workspace 骨架增量层 | `e44ebc826399c8432a8d40ea8dfc55c60ee9142e`，0.4 candidate | Manifest:865–875，16 个记录（两层合计 98 个不同目标路径）；独立增量层，不等于基础组件整体升级 |

本仓路径均相对本仓根，Workspace 路径均相对上述固定提交的根。复核单行可使用 `git show <完整 SHA>:<path>` 后加行号。本文行号指分析基线，不指未来更新后的工作树。

### 1.2 主干、状态与计数

- 业务主干来自全场景规划 §10 故事 A–F；§15 的 22 项最低场景单列为 N01–N22，顺序一一对应。§4、§6、§7、§9、§13、§14 约束权限、来源、状态与实施边界；§18–21 是历史实施记录，不作为本次验收证据。
- 共 **104 个可追踪步骤**：A–F 45 步，最低验收补充 22 步，P04 9 步，local-start 6 步，题篮组卷 6 步，专业批阅 6 步，分析/行动/报告 5 步，JSON 导入 3 步，教程 2 步。验收补充与主干有意重叠；104 不是去重后的业务需求数或完成度分母。
- “已实现本机”表示源码中有状态流转/本机存储；“样例/固定演示”表示预置内容或 scene 推动；“部分”表示只覆盖步骤局部或仍在旧入口；“缺失”只限所核查的新页与固定实现范围。没有一项被认定为真实模型、OCR、课堂或发布服务已经接入。
- 最新接入与验证目标统一为 Workspace `/teacher/agent/workspace`。本仓 `/next/skeletons/agent` 为历史骨架。旧探索入口和专业页只提供行为参考，不能替代新页的后续接入验证。

### 1.3 两态及缺口分类

呈现列是目标需求，不是实现完成声明。依据 v0.2.1 §2.1、§4 与 v0.1.3 §7.1：Inline 负责短摘要、澄清和关键决定；Workspace 承载长内容、队列、复杂编辑或明细。仅需短确认/输入的步骤只给对话态；已经从上下文进入的完整编排/审核直接使用扩展态。`presentation="card"/"inline"`、Collapsible 的展开、原 StructuredWorkspace 的 inline/side 均不自动等于两态实现。

| 代码 | 缺口类型 | 判定边界 |
| --- | --- | --- |
| C | 组件缺失 | 通用语义组合或公开契约缺口；基础按钮/表格存在不代表语义完整；优先组合，非自动新增目录项 |
| I | 组件有但 Workspace 未引入 | 主要为第一组六项及数学草稿预览；同名旧文件不等于新组件已引入 |
| E | 两态缺扩展态 | 缺所需语义扩展内容，或已有专业内容尚未接新页同对象承载；表格会区分二者，不误派整个框架给组件库 |
| H | 宿主能力 | Store、对象版本、路由/渲染适配、权限、服务、幂等、持久化、数据口径及接入验证；组件只收外部事实、发出意图 |
| S | 规范缺口 | 权威材料明确尚未确定或存在需要收口的冲突；缺服务本身不算规范缺口 |

类型可重叠。“H”也用于本地已有但真实业务接入尚缺的步骤，不表示应删除本地实现。计数见 §6。

## 2. 证据索引与 42 项语义现状

### 2.1 文件别名

为使矩阵可阅读，后续 `别名:行号` 均展开为下表唯一文件路径；例如 `WPage:326–361` 即固定 Workspace 的 `src/features/teacher/agent-workspace-page/AgentWorkspacePage.tsx` 对应行。`P/`、`B/` 是本仓源码前缀，不是 Workspace 文件。每行“智能曜彩现状”直接给实现定位，其引入状态按 Manifest 的固定提交及同名实际源码核对。

| 别名 | 完整相对路径 |
| --- | --- |
| P/ | 本仓 `components/prism-next/` |
| B/ | 本仓 `components/coss/`（固定来源，禁止修改） |
| 全场景规划 | Workspace `docs/教师Agent页面全场景规划-20260918.md` |
| 框架 | Workspace `docs/Agent页面框架设计-v0.2-20260921.md` |
| P04 连续审阅 | Workspace `docs/P04-Agent连续流程审阅-20260920.md` |
| Structured UI 抽取与备课探索 | Workspace `docs/Agent-StructuredUI抽取与备课探索-20260920.md` |
| WPage | Workspace `src/features/teacher/agent-workspace-page/AgentWorkspacePage.tsx` |
| WModel | Workspace `src/features/teacher/agent-workspace/workspace-model.ts` |
| WResources | Workspace `src/features/teacher/agent-workspace/WorkspaceResources.tsx` |
| WShell | Workspace `src/features/teacher/agent-workspace/AgentWorkspace.tsx` |
| Session | Workspace `src/features/teacher/agent-workspace/use-session-value.ts` |
| Scenario | Workspace `src/features/teacher/agent-home/scenario-data.ts` |
| Reply | Workspace `src/features/teacher/agent-home/ReplyBody.tsx` |
| Record | Workspace `src/features/teacher/guidance/GuideRecordPreview.tsx` |
| Guide | Workspace `src/features/teacher/guidance/TeacherGuidance.tsx` |
| GuideStore | Workspace `src/features/teacher/guidance/guide-store.ts` |
| Structured | Workspace `src/components/prism-next/agent-structured.tsx` |
| Local | Workspace `src/features/teacher/agent-exploration/LocalPreparationContent.tsx` |
| LocalPreparationWorkspace | Workspace `src/features/teacher/agent-exploration/LocalPreparationWorkspace.tsx` |
| P04 | Workspace `src/features/teacher/scan/P04ExplorationContent.tsx` |
| Canvas | Workspace `src/features/teacher/scan/P04Canvas.tsx` |
| P04Model | Workspace `src/features/teacher/scan/p04-model.ts` |
| ScanWorkspace | Workspace `src/features/teacher/scan/ScanWorkspace.tsx` |
| Basket | Workspace `src/features/teacher/TeacherQuestionBasket.tsx` |
| Papers | Workspace `src/features/teacher/papers/PapersPage.tsx` |
| Import | Workspace `src/features/teacher/papers/ImportQuestions.tsx` |
| Grading | Workspace `src/features/teacher/grading/GradingPage.tsx` |
| Analysis | Workspace `src/features/teacher/analysis/AnalysisPage.tsx` |
| Actions | Workspace `src/features/teacher/analysis/Actions.tsx` |
| Reports | Workspace `src/features/teacher/analysis/Reports.tsx` |
| TeacherStore | Workspace `src/features/teacher/shared/store.tsx` |
| Manifest | Workspace `src/vendor/prism-source-manifest.json` |

### 2.2 42 项复用台账

序号取 v0.1.3 §3，对应 v0.2.1 §6.1–6.12 的原名。台账覆盖全部语义；没有明确流程需求的重型工具不提前派工。本仓目录仍为 80 项，语义别名不是新增目录项（`lib/prism-next/catalog.ts:54–64、115–132`）。第一组六项的“候选已有”表示源码已在 main，未宣称语义验收完成。

| 序号与语义 | main 中的实现与定位 | Workspace 引入情况 | 尚缺内容/边界 |
| --- | --- | --- | --- |
| 01 对象选择器 | 基础已有：`B/combobox.tsx:21；P/data-display.tsx:26` | 引入未核实；Manifest 无此文件 | 合法对象、搜索与多选需宿主组合 |
| 02 范围构建器 | 领域已有：`P/textbook-range-picker.tsx:38–103` | 基础已引入；基础 c643b478 | 教材目录可复用；任教、课次、日期范围需组合 |
| 03 上下文摘要 | 候选已有：`P/agent-context-summary.tsx:44–96` | 新语义未引入；Manifest 无此文件 | Inline 已有；通用扩展态承载与可信四事实适配待补 |
| 04 文件输入 | 仅基础：`B/input.tsx:16；B/progress.tsx:7` | 基础已引入；基础 c643b478 | 缺文件队列、单文件替换与接收/上传/解析分离组合 |
| 05 采集扫描 | 领域已有：`P/document-region-viewer.tsx:4` | 基础已引入；基础 c643b478 | 只覆盖区域查看，采集与质量提示需组合；无 OCR |
| 06 内容输入 | 基础已有：`B/textarea.tsx:14；P/draft-math-preview.tsx:14` | 基础已引入；基础 c643b478 | Textarea 已引入；新增数学草稿预览未引入，不是数学编辑器 |
| 07 参数配置器 | 基础已有：`B/field.tsx:7–62` | 基础已引入；基础 c643b478 | 字段组合；参数校验和业务默认值外置 |
| 08 约束构建器 | 仅基础：`B/field.tsx:7–62；B/alert.tsx:25` | 基础已引入；基础 c643b478 | 缺通用约束项、冲突定位组合；规则求解外置 |
| 09 模板选择器 | 仅基础：`B/radio-group.tsx:8；B/card.tsx:8` | 基础已引入；基础 c643b478 | 模板列表与预览组合，未核实独立模板管理 |
| 10 候选选择器 | 领域已有：`P/question-card.tsx:12；P/data-display.tsx:26` | 基础已引入；基础 c643b478 | 题目选择已有；通用候选依据、失效状态需组合 |
| 11 集合篮 | 仅基础：`B/card.tsx:8；P/data-display.tsx:26` | 基础已引入；基础 c643b478 | 库中无通用受控集合篮；Workspace 题篮为抽取起点 |
| 12 结构编排器 | 仅基础：`P/learning-components.tsx:13；P/tree.tsx:8–16` | 基础已引入；基础 c643b478 | 展示列表不等于受控排序/分组编辑器 |
| 13 摘要预览 | 候选已有：`P/agent-semantic-components.tsx:35–48` | 新语义未引入；Manifest 无此文件 | Inline 摘要；打开同对象，无需独立摘要扩展态 |
| 14 对象查看器 | 领域已有：`P/question-card.tsx:12；P/question-details.tsx:18` | 基础已引入；基础 c643b478 | 题目详情可复用；其他格式由渲染器接入 |
| 15 对比查看器 | 候选已有：`P/agent-components.tsx:136–151` | 新语义未引入（同名旧文件已引入）；增量 e44ebc82 | 受控 decision 与预览插槽已有；专用扩展态及冲突契约待补 |
| 16 审核队列 | 仅基础：`P/data-display.tsx:25–26` | 基础已引入；基础 c643b478 | 缺通用队列、筛选、下一项和阻断项组合 |
| 17 单项复核器 | 领域已有：`P/question-review.tsx:12–13；P/learning-components.tsx:15` | 基础已引入；基础 c643b478 | 题目评分复核已有；通用多对象复核需组合 |
| 18 异常处理器 | 仅基础：`B/alert.tsx:25–70` | 引入未核实；Manifest 无此文件 | 缺影响范围、处置选项、保留成功部分与恢复组合 |
| 19 指标摘要 | 领域已有：`P/data-display.tsx:9–23` | 基础已引入；基础 c643b478 | 指标/目标/组成；分母与缺测由宿主提供 |
| 20 分布矩阵 | 领域已有：`P/analytics-components.tsx:2–8` | 基础已引入；基础 c643b478 | 图表已有；统一维度、缺测和下钻适配待接 |
| 21 下钻与证据浏览 | 领域已有：`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4` | 基础已引入；基础 c643b478 | 证据表/定位已有；版本和返回位置组合待补 |
| 22 建议集 | 仅基础：`B/checkbox.tsx:7；P/data-display.tsx:26` | 基础已引入；基础 c643b478 | 缺建议依据、选择/采用分离组合 |
| 23 计划构建器 | 领域已有：`P/learning-components.tsx:13；P/workload-calendar.tsx:10` | 基础已引入；基础 c643b478 | 列表和日历已有，非完整计划编辑器 |
| 24 路径与优先级 | 领域已有：`P/learning-components.tsx:16–17` | 基础已引入；基础 c643b478 | 里程碑已有，依赖/顺序编辑与计算外置 |
| 25 执行确认 | 候选已有：`P/agent-semantic-components.tsx:50–74` | 新语义未引入；Manifest 无此文件 | Inline 确认；不造扩展确认页面 |
| 26 任务进度 | 候选已有：`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117` | 新语义未引入；Manifest 无此文件 | 新整体状态未引入；旧步骤组件已引入，通用明细承载待补 |
| 27 执行结果 | 候选已有：`P/agent-semantic-components.tsx:94–112` | 新语义未引入；Manifest 无此文件 | Inline 回执已有；分对象结果明细通用扩展态待补 |
| 28 文档工作区 | 仅基础：`B/textarea.tsx:14；P/document-region-viewer.tsx:4` | 基础已引入；基础 c643b478 | 缺格式能力、版本与保存状态的通用内容承载；非完整 Word 编辑器 |
| 29 演示文稿工作区 | 无专用组件：`B/card.tsx:8` | 基础已引入；基础 c643b478 | 仅容器，幻灯片能力未核实 |
| 30 图像查看与画布 | 领域已有：`P/document-region-viewer.tsx:4` | 基础已引入；基础 c643b478 | 区域缩放/定位已有，图层裁切未核实 |
| 31 音频与转写 | 无专用组件：`B/card.tsx:8` | 基础已引入；基础 c643b478 | 仅容器，无已核实通用波形/转写编辑器 |
| 32 视频与时间轴 | 无专用组件：`B/card.tsx:8` | 基础已引入；基础 c643b478 | 仅容器，无已核实视频时间轴编辑器 |
| 33 成果物输出 | 领域已有：`P/question-print.tsx:28` | 基础已引入；基础 c643b478 | 题卷打印已有；通用输出配置/文件可用性待组合 |
| 34 图形关系工作区 | 无专用组件：`B/card.tsx:8` | 基础已引入；基础 c643b478 | 图表不等于关系图编辑器 |
| 35 结构化内容工作区 | 仅基础：`P/tree.tsx:8–16` | 基础已引入；基础 c643b478 | 目录树不等于结构化内容编辑；受控层级编辑待补 |
| 36 资源检索器 | 仅基础：`B/combobox.tsx:21；P/data-display.tsx:25–26` | 引入未核实；Manifest 无此文件 | 缺来源、许可、检索错误/分页与结果组合 |
| 37 素材提取器 | 领域已有：`P/document-region-viewer.tsx:4` | 基础已引入；基础 c643b478 | 片段定位可复用；提取/转换执行外置 |
| 38 素材包 | 仅基础：`B/card.tsx:8；P/data-display.tsx:26` | 基础已引入；基础 c643b478 | 缺跨素材分类、排序与来源组合 |
| 39 交互演示器 | 无领域组件：`B/field.tsx:7` | 基础已引入；基础 c643b478 | 仅参数容器，领域交互插件未核实 |
| 40 计算与分析工具 | 无计算组件：`P/math-content.tsx:6；P/analytics-components.tsx:2–8` | 引入未核实；Manifest 无此文件 | 数学显示/图表不证明计算能力 |
| 41 模拟器 / 虚拟实验 | 无模拟组件：`B/field.tsx:7` | 基础已引入；基础 c643b478 | 仅参数容器，领域仿真未核实 |
| 42 学科专用编辑器 | 无专用编辑器：`P/draft-math-preview.tsx:14` | 预览未引入；Manifest 无此文件 | 候选草稿显示未引入，不是公式/几何/化学编辑器 |

对 15：Manifest 虽记录了 `agent-components.tsx`，固定 Workspace 文件并没有 `AgentChangeReview`；其本地 `StructuredComparison` 是另一实现。对 26：旧 `AgentTaskProgress`/`StructuredTaskRows` 不能替代新 `AgentExecutionProgress` 的整体外部状态。06 的 Textarea 已引入，`DraftMathPreview` 未引入。无专用组件的条目中“基础已引入”仅指所列容器/基础控件。

## 3. 六条业务故事覆盖矩阵

### 3.1 故事 A：自有材料形成讲评稿

来源：全场景规划 §10 故事 A；§4、§6、§7、§9。

| 步骤 | v0.2.1 语义（v0.1.3 序号） | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| A01 添加课件或试卷材料 | 04 文件输入；06 内容输入 | 对话态：附件与输入即可 | 部分：新页无附件入口（WPage:567–597）；旧 local-start 仅提示材料未接（Local:182–190）；专业页仅 JSON 本机读取（Import:45–58） | 04 仅基础／基础已引入（`B/input.tsx:16；B/progress.tsx:7`）<br>06 基础已有／基础已引入（`B/textarea.tsx:14；P/draft-math-preview.tsx:14`） | C,H |
| A02 确认可读范围与用途，未授权时不扩展到班级数据 | 02 范围构建器；03 上下文摘要；25 执行确认 | 对话态：短范围确认 | 部分：固定范围示例（Scenario:48–74、321–339）；新页默认空范围（WPage:76–84） | 02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| A03 查看解析进度，替换损坏文件后只恢复失败部分 | 26 任务进度；18 异常处理器；04 文件输入 | 对话态：任务与单文件恢复；详情按需 | 部分：P04 预置进度及替换清晰样例（P04:339–406、574–603），非真实上传/解析 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`）<br>04 仅基础／基础已引入（`B/input.tsx:16；B/progress.tsx:7`） | C,I,H |
| A04 查看带出处的讲评草稿与材料片段 | 13 摘要预览；14 对象查看器；21 下钻与证据浏览；28 文档工作区 | 两者：摘要入口＋长稿/出处阅读 | 部分：旧本地提纲及固定来源（Local:23–38、93–140）；新页仅样例题卷/记录（WPage:512–553） | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`）<br>28 仅基础／基础已引入（`B/textarea.tsx:14；P/document-region-viewer.tsx:4`） | C,I,E,H |
| A05 编辑讲评，比较建议并保留人工修改 | 06 内容输入；15 对比查看器；28 文档工作区 | 两者：局部建议＋同稿编辑 | 部分：Local:93–127 本机受控草稿；P04Model:243–279 有样例 revision 冲突保护；新页未接 | 06 基础已有／基础已引入（`B/textarea.tsx:14；P/draft-math-preview.tsx:14`）<br>15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>28 仅基础／基础已引入（`B/textarea.tsx:14；P/document-region-viewer.tsx:4`） | C,I,E,H |
| A06 确认保存讲评成果，回看同一版本 | 25 执行确认；27 执行结果；33 成果物输出 | 对话态：确认与回执；打开已有稿 | 部分：Local:87–90 明示未正式保存；WPage:279–290 普通会话无产出索引 | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>33 领域已有／基础已引入（`P/question-print.tsx:28`） | I,H |

### 3.2 故事 B：课表驱动的下周教学安排

来源：全场景规划 §10 故事 B；§6、§7、§9。

| 步骤 | v0.2.1 语义（v0.1.3 序号） | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| B01 识别任教班级、下周日期和课次 | 01 对象选择器；02 范围构建器；03 上下文摘要 | 对话态：消歧后保留约束 | 部分：旧双班固定场景（Scenario:77–120）；新页未接真实课表（WPage:76–84、326–361） | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | I,H |
| B02 确认授课进度，调课后只重校受影响安排 | 03 上下文摘要；07 参数配置器；25 执行确认 | 对话态：关键参数确认 | 缺失：故事 B 有定义；Scenario:77–120 为备课/检测示例，未实现真实授课进度和调课事件 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>07 基础已有／基础已引入（`B/field.tsx:7–62`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| B03 按许可检索教材与课例 | 36 资源检索器；02 范围构建器；03 上下文摘要 | 两者：结果短单＋完整筛选/出处 | 部分：Scenario:77–120 固定材料；Papers:86–109 本地题目/目录浏览，非教材课例服务 | 36 仅基础／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:25–26`）<br>02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | C,I,E,H |
| B04 形成教学安排与小测候选两项草稿 | 13 摘要预览；23 计划构建器；10 候选选择器 | 两者：分别摘要＋安排/试题编辑 | 部分：Scenario:77–105 固定双成果；Local:93–140 仅提纲；Papers:192–205 预置组卷候选 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>23 领域已有／基础已引入（`P/learning-components.tsx:13；P/workload-calendar.tsx:10`）<br>10 领域已有／基础已引入（`P/question-card.tsx:12；P/data-display.tsx:26`） | C,I,E,H |
| B05 编辑教学环节与检测题，核对两稿关联 | 12 结构编排器；15 对比查看器；35 结构化内容工作区 | 两者：局部改动摘要＋结构编辑 | 部分：Local:93–127 教学环节本机编辑；Papers:111–130 本地组卷；新页未组合 | 12 仅基础／基础已引入（`P/learning-components.tsx:13；P/tree.tsx:8–16`）<br>15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>35 仅基础／基础已引入（`P/tree.tsx:8–16`） | C,I,E,H |
| B06 分别确认建工作并保存两个成果 | 25 执行确认；27 执行结果；13 摘要预览 | 对话态：两个独立确认与回执 | 部分：Scenario:94–105 固定“保存”文案；Papers:118–126 为本地纸卷保存；无双成果事务 | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`） | I,H |
| B07 发布前重新核对最新名单、时间和版本 | 03 上下文摘要；25 执行确认 | 对话态：最终影响范围确认 | 部分：Scenario:106–120 发布前预览；真实名册与调课重验缺失 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| B08 分班查询布置回执，未知时先查原请求 | 26 任务进度；27 执行结果 | 两者：总体摘要＋分班明细 | 部分：Scenario:224–244 固定未知/部分回执；无服务查询（WPage:326–361） | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,E,H |

### 3.3 故事 C：课堂即时诊断与追问

来源：全场景规划 §10 故事 C；§7、§9。

| 步骤 | v0.2.1 语义（v0.1.3 序号） | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| C01 定位当前课次与教师可用的课堂数据 | 01 对象选择器；02 范围构建器；03 上下文摘要 | 对话态：短范围确认 | 部分：Scenario:143–160 固定课次覆盖；真实课堂来源缺失 | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | I,H |
| C02 查看预期人数、收到人数、准入范围与截止时间 | 19 指标摘要；03 上下文摘要；26 任务进度 | 两者：覆盖摘要＋缺收/冲突明细 | 部分：Scenario:143–152 预置 32/40、30 准入及 2 冲突；非实时采集 | 19 领域已有／基础已引入（`P/data-display.tsx:9–23`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`） | I,E,H |
| C03 逐条核实错误步骤和原始作答 | 16 审核队列；17 单项复核器；21 下钻与证据浏览 | 两者：待核对入口＋原作答复核 | 部分：Grading:204–220 为专业页本地评分；Scenario:143–160 仅固定课堂分析 | 16 仅基础／基础已引入（`P/data-display.tsx:25–26`）<br>17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | C,E,H |
| C04 查看短讲解与追问建议，选择要采用的项 | 22 建议集；10 候选选择器；13 摘要预览 | 对话态：短建议和选择 | 部分：Scenario:149–155 固定候选；新页无建议选择（WPage:770–816） | 22 仅基础／基础已引入（`B/checkbox.tsx:7；P/data-display.tsx:26`）<br>10 领域已有／基础已引入（`P/question-card.tsx:12；P/data-display.tsx:26`）<br>13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`） | C,I,H |
| C05 教师编辑追问内容并确认投送范围 | 06 内容输入；25 执行确认 | 对话态：短稿编辑和确认 | 缺失真实投送：Scenario:153–155 只有审阅示例；WPage:326–361 无执行器 | 06 基础已有／基础已引入（`B/textarea.tsx:14；P/draft-math-preview.tsx:14`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| C06 查询送达与后续作答，分别显示状态 | 26 任务进度；27 执行结果；19 指标摘要 | 两者：结果摘要＋学生明细 | 部分：Scenario:156–160 固定后续收集；无课堂通道、送达及作答回流 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>19 领域已有／基础已引入（`P/data-display.tsx:9–23`） | I,E,H |
| C07 迟到数据到达后更新覆盖说明，保留前次判断快照 | 03 上下文摘要；15 对比查看器；27 执行结果 | 两者：变更提示＋快照对照 | 部分：Scenario:156–160 固定迟到情景；版本化课堂快照缺失 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,E,H |

### 3.4 故事 D：复核错题到两班练习布置

来源：全场景规划 §10 故事 D；§7、§9。

| 步骤 | v0.2.1 语义（v0.1.3 序号） | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| D01 读取已复核错题及对应结果版本 | 02 范围构建器；03 上下文摘要；21 下钻与证据浏览 | 两者：依据摘要＋作答证据 | 部分：Analysis:29–71、Grading:223–259 支持本地结果范围/证据；新页仅 Record:25–34 摘要跳转 | 02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | I,E,H |
| D02 核对题库许可、教材范围和练习约束 | 02 范围构建器；08 约束构建器；03 上下文摘要 | 对话态：范围与条件确认 | 部分：Papers:86–109 本地教材范围；Scenario:163–180 固定外部许可/故障；真实许可缺失 | 02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>08 仅基础／基础已引入（`B/field.tsx:7–62；B/alert.tsx:25`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | C,I,H |
| D03 选择候选题，查看选题依据与可替代来源 | 10 候选选择器；36 资源检索器；21 下钻与证据浏览 | 两者：推荐短单＋完整筛选/出处 | 部分：Papers:192–205 固定前四题；题库故障替代为 Scenario:163–180 固定场景 | 10 领域已有／基础已引入（`P/question-card.tsx:12；P/data-display.tsx:26`）<br>36 仅基础／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:25–26`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | C,E,H |
| D04 将选中题加入集合并检查题型、数量 | 11 集合篮；19 指标摘要 | 两者：数量摘要＋集合清单 | 已实现本机题篮：Basket:105–133、161–173；新页接原 Provider（WPage:720–728），非云同步 | 11 仅基础／基础已引入（`B/card.tsx:8；P/data-display.tsx:26`）<br>19 领域已有／基础已引入（`P/data-display.tsx:9–23`） | C,H |
| D05 调整题序、分值、分组和整体结构 | 12 结构编排器；35 结构化内容工作区；14 对象查看器 | 扩展态：专业编排对象 | 部分：Papers:111–130 本机调序/分值；分组通用编辑未核实，新页需跳专业页 | 12 仅基础／基础已引入（`P/learning-components.tsx:13；P/tree.tsx:8–16`）<br>35 仅基础／基础已引入（`P/tree.tsx:8–16`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`） | C,E,H |
| D06 分别建立两班草稿，保留来源与人工改动 | 13 摘要预览；25 执行确认；27 执行结果 | 对话态：独立建稿确认/回执 | 部分：Basket:144–157 一次一个班级；Papers:118–126 本机保存；Scenario:77–120 仅双班预置 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,H |
| D07 确认布置对象、版本与时间 | 03 上下文摘要；25 执行确认 | 对话态：明确影响范围 | 部分：Scenario:206–221 固定发布预览；真实布置服务缺失 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| D08 按班级检查成功、失败和未知回执；只恢复失败部分 | 26 任务进度；27 执行结果；18 异常处理器 | 两者：总结果＋分班恢复明细 | 部分：Scenario:224–244 固定分班状态；无真实幂等查询与恢复 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`） | C,I,E,H |
| D09 题库故障时保留编排，改用其他来源须教师同意 | 18 异常处理器；25 执行确认；03 上下文摘要 | 对话态：单一替代决策 | 部分：Scenario:163–180 固定保留/替代路径；Papers:111–130 本机草稿可编辑，非故障服务接续 | 18 仅基础／引入未核实（`B/alert.tsx:25–70`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | C,I,H |

### 3.5 故事 E：班主任家校沟通

来源：全场景规划 §10 故事 E；§6、§7、§9。

| 步骤 | v0.2.1 语义（v0.1.3 序号） | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| E01 确认班主任职责、沟通目的和学生范围 | 01 对象选择器；02 范围构建器；03 上下文摘要 | 对话态：范围澄清 | 部分：Scenario:123–140、264–279 固定角色/家庭 A；真实班主任授权未接 | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | I,H |
| E02 取得合法学科表现与班务事实，说明缺失资料 | 36 资源检索器；03 上下文摘要；21 下钻与证据浏览 | 两者：依据摘要＋来源核对 | 部分：Scenario:264–279 固定事实；无跨学科/班务获权查询 | 36 仅基础／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:25–26`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | C,I,E,H |
| E03 按学生生成独立沟通草稿 | 13 摘要预览；28 文档工作区 | 两者：学生稿件摘要＋长稿 | 部分：Scenario:268–273 仅家庭 A 示例；新页无沟通稿渲染器 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>28 仅基础／基础已引入（`B/textarea.tsx:14；P/document-region-viewer.tsx:4`） | C,I,E,H |
| E04 逐稿核对依据、调整表述与敏感内容 | 16 审核队列；17 单项复核器；15 对比查看器；21 下钻与证据浏览 | 两者：待审摘要＋全文/依据对照 | 部分：Scenario:274–279 固定审核说明；无批量沟通稿队列 | 16 仅基础／基础已引入（`P/data-display.tsx:25–26`）<br>17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`）<br>15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | C,I,E,H |
| E05 核对收件人、内容和渠道 | 03 上下文摘要；25 执行确认 | 对话态：发送前确认 | 部分：Scenario:274–279 示例明确未外发；实际收件人/渠道验证缺失 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| E06 显式确认发送并逐人查回执 | 25 执行确认；26 任务进度；27 执行结果 | 两者：动作确认＋收件人回执明细 | 缺失服务：Scenario:279 明示发送连接器未接；新页无执行（WPage:326–361） | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,E,H |
| E07 无渠道时保存草稿或在许可内导出 | 27 执行结果；33 成果物输出 | 对话态：能力边界与输出入口 | 部分：Scenario:274–279 固定边界；通用稿件保存/授权导出缺失 | 27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>33 领域已有／基础已引入（`P/question-print.tsx:28`） | I,H |

### 3.6 故事 F：跨班教研协作

来源：全场景规划 §10 故事 F；§6、§7、§9。

| 步骤 | v0.2.1 语义（v0.1.3 序号） | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| F01 确认教研职责、团队范围和协作目的 | 01 对象选择器；02 范围构建器；03 上下文摘要 | 对话态：明确职责与范围 | 部分：Scenario:282–299 固定教研角色；实际团队授权缺失 | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | I,H |
| F02 汇集共享材料与允许使用的汇总数据 | 36 资源检索器；38 素材包；03 上下文摘要 | 两者：材料摘要＋集合核对 | 部分：Scenario:282–286 预置汇总；缺共享资源检索与许可服务 | 36 仅基础／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:25–26`）<br>38 仅基础／基础已引入（`B/card.tsx:8；P/data-display.tsx:26`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | C,I,E,H |
| F03 核对对象、试题、时间与口径可比性 | 15 对比查看器；19 指标摘要；21 下钻与证据浏览 | 两者：差异摘要＋对照证据 | 部分：Scenario:287–295 固定两卷不可比；Analysis:71 声明不推断等值，非可比性服务 | 15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>19 领域已有／基础已引入（`P/data-display.tsx:9–23`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | I,E,H |
| F04 区分事实、局限与讨论问题，编成共享草稿 | 22 建议集；28 文档工作区；35 结构化内容工作区 | 两者：问题摘要＋共享长稿 | 部分：Scenario:292–299 固定共同目标和稿件；新页无共享稿编辑器 | 22 仅基础／基础已引入（`B/checkbox.tsx:7；P/data-display.tsx:26`）<br>28 仅基础／基础已引入（`B/textarea.tsx:14；P/document-region-viewer.tsx:4`）<br>35 仅基础／基础已引入（`P/tree.tsx:8–16`） | C,E,H |
| F05 确认保存共享草稿，保持版本与范围 | 25 执行确认；27 执行结果；13 摘要预览 | 对话态：保存确认/回执 | 部分：Scenario:296–299 固定共享候选；团队草稿存储缺失 | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`） | I,H |
| F06 邀请获权同事协作并查看反馈 | 01 对象选择器；25 执行确认；26 任务进度；27 执行结果 | 两者：邀请确认＋协作者/回执清单 | 缺失：全场景 §10 故事 F 定义；Scenario:282–299 未实现真实邀请/协作 | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,E,H |
| F07 接续新反馈，对比修改并保护人工稿 | 15 对比查看器；17 单项复核器；28 文档工作区 | 两者：修改摘要＋同版本审核 | 部分：Local:93–127 可借鉴本机改稿，但无多用户反馈接续；故事 F 为规划 | 15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`）<br>28 仅基础／基础已引入（`B/textarea.tsx:14；P/document-region-viewer.tsx:4`） | C,I,E,H |
| F08 审核形成教研成果；资源入库另行批准 | 16 审核队列；17 单项复核器；25 执行确认；27 执行结果；33 成果物输出 | 两者：审核队列＋最终确认/回执 | 缺失：全场景 §10 故事 F；Scenario:296–299 停留共享候选，不等于资源入库 | 16 仅基础／基础已引入（`P/data-display.tsx:25–26`）<br>17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>33 领域已有／基础已引入（`P/question-print.tsx:28`） | C,I,E,H |

## 4. 最低验收场景补充矩阵

全场景规划 §15 第 1–22 项，顺序一一对应；重复主干用于验收追踪，不视为新增业务流程。这里登记待验证行为，不引用历史“通过”作为当前结果。

| 步骤 | 对应语义 | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| N01 多个合法对象时补充范围并保留原约束 | 01 对象选择器；02 范围构建器；08 约束构建器 | 对话态 | 部分：Reply:43–67 有本地澄清按钮；新页 WPage:770–800 未复用 | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>08 仅基础／基础已引入（`B/field.tsx:7–62；B/alert.tsx:25`） | C,H |
| N02 一般讨论或只附材料时保持最小数据范围 | 03 上下文摘要；25 执行确认 | 对话态 | 部分：Scenario:48–74 固定边界；WPage:76–84 空范围，未实现真实数据授权 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| N03 分别查看模型、数据、写工具可用性并选择下一步 | 03 上下文摘要；18 异常处理器 | 对话态 | 部分：Reply:45–50 区分来源/模型限制；Scenario:321–339 固定 AI 许可；新页未接 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`） | C,I,H |
| N04 名单、课表或职责变化后重新确认受影响操作 | 03 上下文摘要；25 执行确认 | 对话态 | 部分：Import:69–73 本机任教变更重验；Scenario:301–319 为撤权固定情景 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| N05 识别课堂不足、迟到、重复和未匹配项，再决定纳入 | 19 指标摘要；18 异常处理器；17 单项复核器 | 两者：摘要＋例外明细 | 部分：Scenario:143–160 固定课堂情景；Grading:165–200 本地例外处理 | 19 领域已有／基础已引入（`P/data-display.tsx:9–23`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`）<br>17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`） | C,E,H |
| N06 对照冲突版本或统计口径，决定采用哪份 | 15 对比查看器；03 上下文摘要；21 下钻与证据浏览 | 两者：冲突摘要＋依据对照 | 部分：P04Model:243–279 样例 revision 保护；Scenario:282–299 固定不可比数据 | 15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | I,E,H |
| N07 复合请求部分失败时只恢复失败项 | 26 任务进度；27 执行结果；18 异常处理器 | 两者：总体摘要＋逐项恢复 | 部分：Scenario:224–244 分班固定回执；P04Model:281–339 保存/入篮预演 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`） | C,I,E,H |
| N08 区分回复、保存、发布、送达和作答完成 | 13 摘要预览；26 任务进度；27 执行结果 | 对话态：独立事实标签；已有详情按需打开 | 部分：Grading:247–251 区分本地结果/发布；Scenario:224–244 固定回执；新页 WPage:291–298 仅消息状态 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,H |
| N09 发布超时先查原请求，再按班级恢复 | 27 执行结果；18 异常处理器；25 执行确认 | 两者：未知提示＋分班明细 | 部分：Scenario:224–244 固定查询/重试文案，无真实请求状态 | 27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | C,I,E,H |
| N10 停止当前处理；已发生的外部动作另行撤回 | 26 任务进度；25 执行确认；27 执行结果 | 对话态：停止与撤回分别确认 | 部分：Papers:199–205 只停止本地候选；新页未执行外部动作（WPage:326–361）；撤回未实现 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,H |
| N11 重新打开撤权历史时核对标题、摘要、正文可见范围 | 03 上下文摘要；18 异常处理器；14 对象查看器 | 两者：限制说明＋获权内容 | 部分：WPage:236–278 只过滤关联记录；770–800 直接呈现历史正文/引用；Scenario:301–319 历史策略未定 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`） | C,I,H,S |
| N12 切换职责或组织时重新选择合法工作范围 | 01 对象选择器；02 范围构建器；03 上下文摘要 | 对话态：重新确认范围 | 部分：Scenario:123–140 固定职责；真实跨组织授权未接，不能沿用多角色并集 | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | I,H |
| N13 第三方材料含越权指令时保持授权边界并反馈 | 18 异常处理器；03 上下文摘要 | 对话态：材料风险反馈 | 缺失：全场景 §15.13；新页没有解析/模型执行链（WPage:326–361），防注入服务未核实 | 18 仅基础／引入未核实（`B/alert.tsx:25–70`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | C,I,H |
| N14 新建议到达时比较并保留教师人工修改 | 15 对比查看器；06 内容输入 | 两者：变更摘要＋同稿对比 | 部分：P04Model:243–279、Canvas:445–474 样例冲突；Local:93–127 局部采纳，未接真实异步 | 15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>06 基础已有／基础已引入（`B/textarea.tsx:14；P/draft-math-preview.tsx:14`） | I,E,H |
| N15 桌面及 390/320px、长中文公式、三主题、键盘与减少动效下继续同一工作 | 14 对象查看器；11 集合篮；28 文档工作区 | 两者：同对象切换与可达操作 | 部分：WPage:89–110、720–728 有响应式宿主；框架 §13–18 有历史检查；本次没有浏览器验证 | 14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>11 仅基础／基础已引入（`B/card.tsx:8；P/data-display.tsx:26`）<br>28 仅基础／基础已引入（`B/textarea.tsx:14；P/document-region-viewer.tsx:4`） | C,E,H |
| N16 兼容旧会话/业务数据并恢复本机草稿，清楚说明后台/跨设备边界 | 03 上下文摘要；13 摘要预览；27 执行结果 | 对话态：历史摘要及状态；原对象按需打开 | 部分：WPage:139–213；Session:3–19 仅运行内 Map；TeacherStore:6–10 本机 localStorage，非后台/跨设备 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,H |
| N17 分别从示例与自有材料启动，不混用成果 | 04 文件输入；13 摘要预览 | 对话态：两个独立起点 | 部分：WPage:801–816 有示例和新对话；自有材料上传缺失；Import:45–58 仅专业页 JSON | 04 仅基础／基础已引入（`B/input.tsx:16；B/progress.tsx:7`）<br>13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`） | C,I,H |
| N18 从教程打开内容时隐藏任务浮层/边缘入口，关闭后恢复原步骤；手动收起与后续导航优先 | 13 摘要预览；14 对象查看器 | 两者：教程入口＋教程内容 | 已实现本机教程组合：Guide:51–207；教程示例 Guide:209–230；新页挂接/恢复仍需浏览器复验 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`） | I,H |
| N19 后台/运营消息到达时继续编辑，按需打开单一辅助区 | 26 任务进度；13 摘要预览 | 对话态：轻提示；详情由既有容器打开 | 部分：WModel:17–66 迟到/编辑仲裁，WPage:682–728 单右栏；真实后台/运营来源未接 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`） | I,H |
| N20 保留旧教材可用性、区分旧作答时效；上传失败保材料/步骤，重试不重复建任务 | 03 上下文摘要；04 文件输入；18 异常处理器 | 对话态：时效说明与重试 | 部分：Import:45–58 有读取序号防迟到，不能等同上传幂等；Scenario:143–160 固定数据时效 | 03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>04 仅基础／基础已引入（`B/input.tsx:16；B/progress.tsx:7`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`） | C,I,H |
| N21 不接受教程/运营建议时不计待办；跳过、冷却、到期和已完成退出不丢业务工作 | 22 建议集；24 路径与优先级 | 对话态：建议与待办区分 | 部分：Papers:199–205 可不采纳；建议冷却与到期策略未实现（全场景 §15.21） | 22 仅基础／基础已引入（`B/checkbox.tsx:7；P/data-display.tsx:26`）<br>24 领域已有／基础已引入（`P/learning-components.tsx:16–17`） | C,H |
| N22 分别查看示例、真实工作和运营计数，不把点击当完成 | 19 指标摘要；27 执行结果 | 对话态：分别统计 | 缺失完整计量：Scenario:7 声明固定数据；WPage:598–608 预置步骤；全场景 §15.22 尚需事件口径/服务 | 19 领域已有／基础已引入（`P/data-display.tsx:9–23`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,H |

## 5. 其他已实现局部与探索流程

只有 Q 的题目/题篮已直接接到新页。P、L 是历史探索；G、R、J 是专业页本地能力，新页最多提供记录预览/跳转；T 是本机教程。分开登记可避免将专业页完成度等同于 Agent 连续流程完成度。

### 5.1 P04：扫描整理、题目校对与批阅复核探索

来源：P04 连续审阅文档全文；ScanWorkspace:5–14；框架 §13。历史 scenario=scan-paper，不是新页已接入流程。

| 步骤 | 对应语义 | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| P01 带入扫描材料 | 04 文件输入；05 采集扫描 | 对话态：材料输入 | 部分：P04:520–543 预置四页示例，明确不实际上传 | 04 仅基础／基础已引入（`B/input.tsx:16；B/progress.tsx:7`）<br>05 领域已有／基础已引入（`P/document-region-viewer.tsx:4`） | C,H |
| P02 确认处理页范围并排除重复页 | 02 范围构建器；03 上下文摘要；25 执行确认 | 对话态：三页范围确认 | 部分：P04:552–572 固定 4 页去 1 页，按钮切 scene | 02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| P03 查看整理步骤和暂停/停止状态 | 26 任务进度 | 两者：摘要＋步骤明细 | 部分：P04:339–406、574–603 按 scene 推导，非后台进度 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`） | I,E,H |
| P04 处理模糊页，保留已完成部分 | 18 异常处理器；05 采集扫描；27 执行结果 | 对话态：单项恢复 | 部分：P04:574–603 切清晰样例；无重传/OCR | 18 仅基础／引入未核实（`B/alert.tsx:25–70`）<br>05 领域已有／基础已引入（`P/document-region-viewer.tsx:4`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | C,I,H |
| P05 打开校对稿，定位原稿与题目 | 13 摘要预览；14 对象查看器；30 图像查看与画布 | 两者：成果摘要＋页/题对象 | 已实现样例交互：P04:473–499、605–645；Canvas:392–444 固定原稿，非 OCR 结果 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>30 领域已有／基础已引入（`P/document-region-viewer.tsx:4`） | I,E,H |
| P06 逐题编辑题干，核对答案、评分点与批阅建议 | 16 审核队列；17 单项复核器；06 内容输入；21 下钻与证据浏览 | 扩展态：队列＋题目/原稿复核 | 已实现本机样例：Canvas:367–444、478–499；QuestionReview 的分数与说明受控，非正式成绩 | 16 仅基础／基础已引入（`P/data-display.tsx:25–26`）<br>17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`）<br>06 基础已有／基础已引入（`B/textarea.tsx:14；P/draft-math-preview.tsx:14`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | C,H |
| P07 比较新候选，冲突时保留手改或明确采纳 | 15 对比查看器；17 单项复核器 | 两者：候选提示＋具体差异 | 已实现样例冲突保护：P04Model:243–279、Canvas:445–474；库组件未接 | 15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`） | I,E,H |
| P08 预演保存失败、同版本重试与入篮失败恢复 | 25 执行确认；27 执行结果；18 异常处理器 | 两者：结果摘要＋去向明细 | 部分：P04Model:281–339、Canvas:504–550；成功保存和入篮均预演，不写真实题篮 | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`） | C,I,E,H |
| P09 离开再返回并找回固定成果版本 | 13 摘要预览；14 对象查看器；03 上下文摘要 | 两者：历史入口＋同对象 | 已实现运行内样例：ScanWorkspace:20–27、Session:3–19；刷新/服务持久化不在此能力内 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | I,E,H |

### 5.2 local-start：无学校数据的通用备课探索

来源：Structured UI 抽取与备课探索文档全文；LocalPreparationWorkspace:4–11。历史 scenario=local-start，未接新页。

| 步骤 | 对应语义 | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| L01 提出教学目标并确认没有班级学情依据 | 06 内容输入；03 上下文摘要 | 对话态：输入与依据说明 | 已实现固定演示：Local:23–38、182–190；发送只给示例说明 | 06 基础已有／基础已引入（`B/textarea.tsx:14；P/draft-math-preview.tsx:14`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | I,H |
| L02 查看提纲准备进度 | 26 任务进度 | 对话态：简单任务步骤 | 部分：Local:152–167 固定步骤，无模型执行 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`） | I,H |
| L03 打开教学草稿并选择教学环节 | 13 摘要预览；28 文档工作区；35 结构化内容工作区 | 两者：摘要＋同份提纲 | 已实现本机样例：Local:50–59、93–114；原始五环节固定 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>28 仅基础／基础已引入（`B/textarea.tsx:14；P/document-region-viewer.tsx:4`）<br>35 仅基础／基础已引入（`P/tree.tsx:8–16`） | C,I,E,H |
| L04 输入局部修改，与建议并排核对 | 06 内容输入；15 对比查看器 | 两者：局部请求＋对照编辑 | 已实现本机样例：Local:104–112；Structured:75–76 两列不等于统一差异组件 | 06 基础已有／基础已引入（`B/textarea.tsx:14；P/draft-math-preview.tsx:14`）<br>15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`） | I,E,H |
| L05 采用或保留人工稿，区分改稿和正式保存 | 15 对比查看器；25 执行确认；27 执行结果 | 两者：决定摘要＋同稿编辑 | 部分：Local:67–90、113–127；仅更新本页提纲和样例版本，无正式保存 | 15 候选已有／新语义未引入（同名旧文件已引入）（`P/agent-components.tsx:136–151`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,E,H |
| L06 返回原对话重新打开成果 | 13 摘要预览；14 对象查看器；03 上下文摘要 | 两者：历史入口＋原稿 | 已实现运行内样例：LocalPreparationWorkspace:14–18、Local:129–140、Session:3–19 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`） | I,E,H |

### 5.3 题篮组卷：新页选题到专业页编排

来源：WPage:449–476、720–768；Basket:105–173；Papers:111–148。新页接入局部，编排/保存仍在专业页。

| 步骤 | 对应语义 | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| Q01 查看题目并选入全局题篮 | 10 候选选择器；14 对象查看器；11 集合篮 | 两者：题卡动作＋题篮清单 | 已实现本机：WPage:449–476；Basket:105–133 成功 dispatch 后反馈 | 10 领域已有／基础已引入（`P/question-card.tsx:12；P/data-display.tsx:26`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>11 仅基础／基础已引入（`B/card.tsx:8；P/data-display.tsx:26`） | C,H |
| Q02 检查题篮内容、题型数量并移除或清空 | 11 集合篮；19 指标摘要 | 扩展态：已有统一题篮 | 已实现本机：Basket:135–142、161–173；复用一个 Provider | 11 仅基础／基础已引入（`B/card.tsx:8；P/data-display.tsx:26`）<br>19 领域已有／基础已引入（`P/data-display.tsx:9–23`） | C,H |
| Q03 选择班级和卷名，交接到编排草稿 | 01 对象选择器；07 参数配置器；25 执行确认；27 执行结果 | 对话态：短确认与交接回执 | 已实现本机：Basket:144–157 派生 draft 后跳专业页，不清空题篮；非布置 | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>07 基础已有／基础已引入（`B/field.tsx:7–62`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,H |
| Q04 在专业页调整顺序、分值和题目 | 12 结构编排器；35 结构化内容工作区；14 对象查看器 | 扩展态：编排对象 | 已实现本机：Papers:111–130；Agent 新页未内嵌此编辑器 | 12 仅基础／基础已引入（`P/learning-components.tsx:13；P/tree.tsx:8–16`）<br>35 仅基础／基础已引入（`P/tree.tsx:8–16`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`） | C,E,H |
| Q05 保存草稿或正式试卷版本 | 25 执行确认；27 执行结果；13 摘要预览 | 对话态：动作和版本回执 | 已实现本机：Papers:118–126；TeacherStore:28–41 持久化成功才更新，不是服务存储 | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`） | I,H |
| Q06 预览打印、下载 TXT 或创建纸质批阅任务 | 14 对象查看器；33 成果物输出；25 执行确认 | 两者：版本摘要＋打印内容 | 已实现本机：Papers:134–148；下载/建任务可选，不等于分班布置/送达 | 14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>33 领域已有／基础已引入（`P/question-print.tsx:28`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |

### 5.4 纸质批阅专业页：创建、复核、版本与发布

来源：Grading:72–260；新页 Record:25–34 仅摘要和跳转。与 P04 预演不同，为本地状态流转。

| 步骤 | 对应语义 | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| G01 从正式试卷或外部试卷样例创建任务 | 01 对象选择器；07 参数配置器；25 执行确认 | 对话态：选对象并确认 | 已实现本机：Grading:72–98；外部试卷为预置样例，不支持真实上传 | 01 基础已有／引入未核实（`B/combobox.tsx:21；P/data-display.tsx:26`）<br>07 基础已有／基础已引入（`B/field.tsx:7–62`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| G02 设置纸张、身份方式与预期人数，确认批阅依据 | 07 参数配置器；08 约束构建器；25 执行确认 | 对话态：参数与依据确认 | 已实现本机：Grading:124–163；准备与接收示例分开，OCR 未接 | 07 基础已有／基础已引入（`B/field.tsx:7–62`）<br>08 仅基础／基础已引入（`B/field.tsx:7–62；B/alert.tsx:25`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | C,I,H |
| G03 接收预置答卷，查看进度和学生匹配异常 | 26 任务进度；16 审核队列；18 异常处理器 | 两者：进度摘要＋队列 | 已实现本机演示：Grading:165–200；补扫修复也是样例 | 26 候选已有／新语义未引入（`P/agent-semantic-components.tsx:76–93；P/agent-components.tsx:107–117`）<br>16 仅基础／基础已引入（`P/data-display.tsx:25–26`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`） | C,I,E,H |
| G04 逐份核对评分与理由，完成复核再固化结果 | 17 单项复核器；21 下钻与证据浏览；25 执行确认 | 扩展态：作答证据和评分表单 | 已实现本机：Grading:199–220；task.review 更新本地，不代表模型评分正确 | 17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | I,H |
| G05 切换结果版本、查看统计和原作答证据 | 13 摘要预览；14 对象查看器；19 指标摘要；21 下钻与证据浏览 | 两者：结果摘要＋证据详情 | 已实现本机：Grading:223–259；Record:25–34 可跳转指定结果分析 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>19 领域已有／基础已引入（`P/data-display.tsx:9–23`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | I,E,H |
| G06 确认本地发布或下载结果，并保留历史版本 | 25 执行确认；27 执行结果；33 成果物输出 | 对话态：明确本地发布与下载 | 部分：Grading:245–252 标记“已发布（本地）”；无真实学生端回执 | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>33 领域已有／基础已引入（`P/question-print.tsx:28`） | I,H |

### 5.5 学情分析、教学行动与专题报告

来源：Analysis:29–114；Actions:28–64；Reports:28–111。新页仅工作记录预览/跳转。

| 步骤 | 对应语义 | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| R01 选择任务、时间和结果版本，查看范围与排除项 | 02 范围构建器；03 上下文摘要；19 指标摘要 | 两者：范围摘要＋完整筛选 | 已实现本机：Analysis:29–71；不把历史结果称实时学情 | 02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>03 候选已有／新语义未引入（`P/agent-context-summary.tsx:44–96`）<br>19 领域已有／基础已引入（`P/data-display.tsx:9–23`） | I,E,H |
| R02 浏览班级/学生/题目表现并下钻作答证据 | 19 指标摘要；20 分布矩阵；21 下钻与证据浏览 | 扩展态：分析/证据对象 | 已实现本机表格与指标：Analysis:73–114；库图表可复用，不表示新页已接完整分析 | 19 领域已有／基础已引入（`P/data-display.tsx:9–23`）<br>20 领域已有／基础已引入（`P/analytics-components.tsx:2–8`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | H,E |
| R03 建立教学行动，编辑目标、对象和后续安排 | 22 建议集；23 计划构建器；25 执行确认 | 两者：建议摘要＋行动编辑 | 已实现本机：Actions:28–34；行动创建为本地命令，无自动执行教学 | 22 仅基础／基础已引入（`B/checkbox.tsx:7；P/data-display.tsx:26`）<br>23 领域已有／基础已引入（`P/learning-components.tsx:13；P/workload-calendar.tsx:10`）<br>25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`） | C,I,E,H |
| R04 复盘行动并决定关闭、延长或新建后续行动 | 17 单项复核器；24 路径与优先级；27 执行结果 | 扩展态：行动记录与复盘 | 已实现本机：Actions:40–64；后续结果由本地数据支撑，非真实教学成效验收 | 17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`）<br>24 领域已有／基础已引入（`P/learning-components.tsx:16–17`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,H |
| R05 生成冻结报告，预览、下载或打印 | 13 摘要预览；28 文档工作区；33 成果物输出；27 执行结果 | 两者：摘要＋冻结报告 | 已实现本机：Reports:53–79、101–111；新页仅 Record:17–39，非完整报表编辑 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>28 仅基础／基础已引入（`B/textarea.tsx:14；P/document-region-viewer.tsx:4`）<br>33 领域已有／基础已引入（`P/question-print.tsx:28`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | C,I,E,H |

### 5.6 结构化题目导入：真实本机文件读取的有限入口

来源：Import:20–90；与上传 PDF/扫描 OCR 明确分开；专业页能力未接入新页。

| 步骤 | 对应语义 | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| J01 选择或粘贴 JSON，校验格式与任教范围 | 04 文件输入；06 内容输入；02 范围构建器；18 异常处理器 | 扩展态：导入表单与错误定位 | 已实现本机读取：Import:45–67；只限九年级数学、1–30 题、1 MB，不支持 PDF/图片/OCR | 04 仅基础／基础已引入（`B/input.tsx:16；B/progress.tsx:7`）<br>06 基础已有／基础已引入（`B/textarea.tsx:14；P/draft-math-preview.tsx:14`）<br>02 领域已有／基础已引入（`P/textbook-range-picker.tsx:38–103`）<br>18 仅基础／引入未核实（`B/alert.tsx:25–70`） | C,H |
| J02 逐题核对题干、答案、解析和知识点 | 16 审核队列；17 单项复核器；14 对象查看器 | 扩展态：队列与题目详情 | 已实现本机：Import:23–34、69–78、80–90；全部核对后才能入库 | 16 仅基础／基础已引入（`P/data-display.tsx:25–26`）<br>17 领域已有／基础已引入（`P/question-review.tsx:12–13；P/learning-components.tsx:15`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`） | C,H |
| J03 确认入本地题库并查看保存数量 | 25 执行确认；27 执行结果 | 对话态：提交确认和结果 | 已实现本机：Import:69–78；TeacherStore:28–41；非云题库服务 | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`） | I,H |

### 5.7 教程与示例体验

来源：全场景 §18–21；Guide:209–230；GuideStore:7–8。教程完成不等于真实业务完成。

| 步骤 | 对应语义 | 需要的呈现 | Workspace 现状与定位 | 智能曜彩 main 现状与引入 | 缺口类型 |
| --- | --- | --- | --- | --- | --- |
| T01 打开示例材料并核对题目与依据 | 13 摘要预览；14 对象查看器；21 下钻与证据浏览 | 两者：入口＋教程内容 | 已实现本机固定教程：Guide:209–230；新页集成和返回焦点本次未验证 | 13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`）<br>14 领域已有／基础已引入（`P/question-card.tsx:12；P/question-details.tsx:18`）<br>21 领域已有／基础已引入（`P/learning-components.tsx:9–10；P/document-region-viewer.tsx:4`） | I,H |
| T02 保存教程提纲，再返回原工作 | 25 执行确认；27 执行结果；13 摘要预览 | 对话态：示例保存状态 | 部分：Guide:209–230、GuideStore:7–8 本机示例存储；与真实成果计数分离待服务接入 | 25 候选已有／新语义未引入（`P/agent-semantic-components.tsx:50–74`）<br>27 候选已有／新语义未引入（`P/agent-semantic-components.tsx:94–112`）<br>13 候选已有／新语义未引入（`P/agent-semantic-components.tsx:35–48`） | I,H |

## 6. 按组件缺口聚合与优先级

### 6.1 统计方法

每个步骤同一语义只计一次；“流程数”统计 A–F、P、L、Q、G、R、J、T 共 13 组，N 为跨流程验收补充，不另计一个流程。步骤命中数包含 N；它表示需求复用密度，不表示组件数量、开发成本或已完成比例。优先级同时考虑阻断端到端的程度、可复用范围与已有候选，不能只按次数排序。

| 缺口类型 | 涉及步骤数（可重叠） |
| --- | --- |
| C 组件缺失/语义组合不足 | 47 |
| I 组件有但未引入 | 86 |
| E 两态扩展内容或新页承载未接 | 46 |
| H 宿主/服务/接入验证 | 104 |
| S 规范缺口 | 1 |

### 6.2 建议优先处理的前 10 项

下表把同一“执行事实链”的三个语义合为一项，其命中数按并集去重。其余均为单语义；实际源码与引入证据见 §2.2、对应矩阵行。

| 次序 / 建议优先级 | 组件缺口 | 覆盖步骤 / 流程数 | 当前缺什么 | 理由与边界 |
| --- | --- | --- | --- | --- |
| 1 / P0 | 25 执行确认；26 任务进度；27 执行结果 | 49 / 13 | 引入；26/27 的通用扩展明细 | 保存、发布、恢复的端到端状态必须先可信；候选已在 main，服务事实仍由宿主提供 |
| 2 / P0 | 03 上下文摘要 | 31 / 9 | 引入＋通用扩展态适配 | 所有来源/职责/版本核对复用；四事实不可由点击推断 |
| 3 / P0 | 13 摘要预览 | 21 / 12 | 引入及对象/版本打开适配 | 连接对话到同一成果；本身只需 Inline，不新增空洞扩展态 |
| 4 / P0 | 15 对比查看器 | 11 / 7 | 引入＋专用扩展态、冲突/草稿契约 | 保护人工改稿，是 P04 与 local-start 可共用且已有状态素材的首试点 |
| 5 / P1 | 18 异常处理器 | 14 / 5 | Inline 恢复组合＋复杂项扩展明细 | 跨材料、课堂、题库、发布恢复，保留成功部分；异常识别/重试执行外置 |
| 6 / P1 | 21 下钻与证据浏览 | 13 / 9 | 已有领域组件的两态组合与定位返回 | 解释判断且支持复核；证据签发、版本与授权不是 UI 能力 |
| 7 / P1 | 17 单项复核器 | 10 / 7 | 扩展已有 QuestionReview 到非评分审核组合 | 覆盖题目、沟通稿、教研与行动，不重造评分控件 |
| 8 / P1 | 28 文档工作区 | 8 / 5 | 受控长稿承载、能力/保存/版本呈现 | A/E/F/L/R 共用；不承诺完整 Word 编辑或格式转换 |
| 9 / P1 | 04 文件输入 | 6 / 3 | Inline 文件队列、错误与替换恢复 | A 与真实 P04 起点阻断；先定义上传/解析分别状态，上传服务外置 |
| 10 / P1 | 11 集合篮 | 4 / 2 | 受控集合摘要与扩展清单抽取 | Q/D 与材料集合复用；保留唯一 TeacherQuestionBasket Provider，不迁业务 Store |

### 6.3 全语义需求频度与后续候选

为了不让优先表掩盖高频已有组件，完整频度如下。14 对象查看器和 19 指标摘要频度较高，但已有题目查看、指标等实现，先做新页渲染器/数据适配；不据此新造通用组件。12/35 的编排编辑、16 审核队列、22 建议集、36 检索组合进入后续具体任务收敛。

| 语义 | 步骤命中数 | 流程数（不含 N） |
| --- | --- | --- |
| 03 上下文摘要 | 31 | 9 |
| 25 执行确认 | 31 | 13 |
| 27 执行结果 | 28 | 13 |
| 13 摘要预览 | 21 | 12 |
| 14 对象查看器 | 14 | 8 |
| 18 异常处理器 | 14 | 5 |
| 26 任务进度 | 14 | 9 |
| 02 范围构建器 | 13 | 9 |
| 21 下钻与证据浏览 | 13 | 9 |
| 15 对比查看器 | 11 | 7 |
| 17 单项复核器 | 10 | 7 |
| 19 指标摘要 | 10 | 6 |
| 01 对象选择器 | 9 | 6 |
| 06 内容输入 | 8 | 5 |
| 28 文档工作区 | 8 | 5 |
| 04 文件输入 | 6 | 3 |
| 16 审核队列 | 6 | 6 |
| 33 成果物输出 | 6 | 6 |
| 35 结构化内容工作区 | 5 | 5 |
| 07 参数配置器 | 4 | 3 |
| 10 候选选择器 | 4 | 4 |
| 11 集合篮 | 4 | 2 |
| 22 建议集 | 4 | 3 |
| 36 资源检索器 | 4 | 4 |
| 08 约束构建器 | 3 | 2 |
| 12 结构编排器 | 3 | 3 |
| 05 采集扫描 | 2 | 1 |
| 23 计划构建器 | 2 | 2 |
| 24 路径与优先级 | 2 | 1 |
| 20 分布矩阵 | 1 | 1 |
| 30 图像查看与画布 | 1 | 1 |
| 38 素材包 | 1 | 1 |
| 09 模板选择器 | 0 | 0 |
| 29 演示文稿工作区 | 0 | 0 |
| 31 音频与转写 | 0 | 0 |
| 32 视频与时间轴 | 0 | 0 |
| 34 图形关系工作区 | 0 | 0 |
| 37 素材提取器 | 0 | 0 |
| 39 交互演示器 | 0 | 0 |
| 40 计算与分析工具 | 0 | 0 |
| 41 模拟器 / 虚拟实验 | 0 | 0 |
| 42 学科专用编辑器 | 0 | 0 |

未在本轮主干形成独立步骤需求的语义：09 模板选择器、29 演示文稿工作区、31 音频与转写、32 视频与时间轴、34 图形关系工作区、37 素材提取器、39 交互演示器、40 计算与分析工具、41 模拟器 / 虚拟实验、42 学科专用编辑器。这些仍保留 42 项映射；有真实场景后再定义呈现，不把一般文字生成推定为幻灯片、音视频、计算或学科专用编辑。语音输入属于 Composer 输入方式，不等于 31 音频成果；实时语音对话能力尚待规范定义（v0.1.3 §8）。

## 7. Workspace 引入版本滞后与迁移边界

### 7.1 差距

Manifest 基础层固定 `c643b478ecb1d3a158a458f39fe77edd0cc493de`，骨架增量层固定 `e44ebc826399c8432a8d40ea8dfc55c60ee9142e`。本地 Git 图确认二者均为分析 HEAD 的祖先；`git rev-list --count <sha>..HEAD` 分别为 58、50（包含 merge 历史，不等于 58/50 项功能缺口）。从 `23a112c` 到 HEAD 只有两次文档提交。因此组件差距应按具体文件/API 判断，不能以提交数推定升级成本。

Manifest 基础层记录 `agent-components.tsx`（527–536），增量层再次记录其带本地修改版本（939–946）。它没有 `agent-context-summary.tsx`、`agent-semantic-components.tsx`、`draft-math-preview.tsx`。固定 Workspace `agent-components.tsx` 未导出新 `AgentContextList / AgentQuestionCard / AgentChangeReview`；本地 `agent-structured.tsx` 也未成为上游 vendor 实现。

### 7.2 第一组六项是否可引入

| 语义 | 源码可用性 | 接入判断 | 迁移要点 |
| --- | --- | --- | --- |
| 03 上下文摘要 | main 候选已有，未引入 | 可作为下一批受控适配候选 | 四事实分别映射；旧 used/available/excluded 不足；unknown 不得改为“未读取/未引用” |
| 13 摘要预览 | main 候选已有，未引入 | 可优先引入 Inline | 身份/版本与打开动作由宿主给；无可用对象时不伪造打开能力 |
| 15 对比查看器 | main 候选已有，未引入 | 可做新页首个两态试点 | `decision` 必传；草稿、采纳范围、冲突由外部拥有；不能直接以旧两列 ReactNode 替换了事 |
| 25 执行确认 | main 候选已有，未引入 | 可引入 Inline | ready/submitting/received/recorded/blocked/unknown 与宿主事实逐项映射；旧 resolved 布尔不能表达 |
| 26 任务进度 | main 候选已有，旧步骤版已引入 | 可引入外部整体状态和步骤适配 | `AgentExecutionProgress` 与 `AgentTaskProgress` 各司其职；snapshot 不冒充 live |
| 27 执行结果 | main 候选已有，未引入 | 可引入 Inline 与通用明细组合 | 未知只查原请求；部分完成分开成功/剩余；重试可用性不能由 UI 自定 |

“可引入”仅指存在可供接入的源码与契约，未完成 Workspace 编译、依赖闭包、三主题和浏览器验证，不是已批准合并或无破坏升级结论。

### 7.3 已发现的兼容风险

1. **不能直接覆盖 Composer 文件。** Manifest:856、939–946 记录 Workspace 增加 `scope / sendDisabled / sendDisabledReason / readOnly`。本仓 `P/agent-components.tsx:13–106` 尚无这些参数；WPage:567–597 使用只读和发送阻断。整文件覆盖会造成类型/行为回退。需保留薄适配或按独立任务回收公开属性。
2. **同名进度组件状态语义变化。** 本仓 `P/agent-components.tsx:107–117` 引入 `activity` 的 live/snapshot 表达；旧 scene 固定步骤不能直接映射 live。新整体任务状态来源不能取“最后一条 assistant 消息已完成”（WPage:291–298）。
3. **旧 Structured UI 无一一等价替换。** `Structured:11、25–40` 的来源三态、43–51 的 resolved、64–68 自由状态、75–76 两列对比，分别缺四事实、确认状态、可信结果和受控决定。接口转换须显式保留未知与示例边界。
4. **基础组件也有本地差异。** `MetricSummary density="compact"` 已被 Record:34 使用，Manifest:858 登记了密度适配；本仓 `P/data-display.tsx:9` 无 density 参数。不能借第一组六项迁移整批覆盖基础文件。
5. **依赖闭包和样式范围仍需专门核对。** `AgentContextSummary` 依赖新 ContextList；数学预览需其 CSS、解析工具及已有数学依赖。逐文件登记固定 SHA/散列和本地适配；不增加依赖、不修改 coss。本次没有执行完整升级或编译演练。

## 8. 宿主与服务缺口：不可派成组件库实现

| 缺口 | 影响流程 | 证据与分工 |
| --- | --- | --- |
| 任务分派、模型执行、工具调用与真实流式状态 | 全部新页业务 | WPage:326–361 固定 localReply；由 Workspace/Runtime 接入，组件只展示外部状态 |
| 真实文件上传、解析、OCR、页质量与重试去重 | A/P/J 边界 | P04:520–603 预置样例；Import:45–58 仅 JSON 本机读取；上传服务与幂等不放组件 |
| 任教/课表/名册/角色目的、第三方 AI 使用许可与撤权 | B–F、N01–04/11–13 | Scenario:123–140、301–339 固定演示；全场景 §6、§7、§9；由授权服务给合法对象和限制 |
| 课堂接收、匹配、迟到快照与统计准入 | C、N05/06/20 | Scenario:143–160 固定覆盖；真实采集和快照由业务数据层承担 |
| 对象版本、草稿 revision、冲突与业务存储 | A/B/D/E/F/P/L/Q | Session:3–19 运行内 Map；TeacherStore:6–41 本机持久化；P04Model:243–339 样例冲突/保存预演；不能移入组件状态 |
| 发布/家校发送/协作邀请、幂等查询、分对象恢复、撤回 | B–F、N07–10 | Scenario:206–244、264–299 固定回执；Grading:248 本地发布；需获权连接器及可信 receipt |
| 读取、上下文使用与引用证据签发/匹配 | 所有用材料步骤 | WModel:140–165、WResources:11–26；UI 非可信验证器，由服务给版本、run、成果定位 |
| 题库检索、来源许可、候选排序及编排规则 | B/D/Q | Papers:192–205 固定候选前四题；组件不自行决定题库替换或生成正确性 |
| 运营/示例/真实工作计量、建议冷却与到期 | N19/21/22、T | 全场景 §13–15、§18–21；GuideStore:7–8 本机教程；业务事件口径与调度外置 |
| 新页业务对象注册、路由、同对象两态和状态恢复 | 全部扩展态步骤 | WPage:434–553 仅列有限渲染分支；应由 Workspace 持有，通用组件仅提供可组合内容 |

## 9. AgentWorkspacePage 页面框架问题清单

以下是静态源码发现或明确待接入项，不称为浏览器重现。框架 §13 以后已有历史整改记录；不把旧 SA01–04 或题篮历史缺陷直接当作本次新缺陷。

| 编号 | 观察与影响 | 证据定位 | 建议归属 |
| --- | --- | --- | --- |
| FW01 | 发送只记录输入并立即返回固定未接执行说明，A–F 不会分派到业务步骤；输入区也未接材料/范围插槽 | WPage:76–84、326–361、567–597 | 宿主接入：建立请求/能力适配，先打通受控材料/范围起点 |
| FW02 | 新页普通消息只渲染正文和链接，未挂旧 ReplyBody 的 needs-input/limited/no-results 等结构化追问操作 | WPage:770–800；Reply:26–71 | 页面消息渲染器：恢复明确状态及可操作澄清，保留原约束 |
| FW03 | 非 sample 的 outputs 恒为空；任务阶段取最后消息，multiStep=false，不能承载真实任务/成果索引 | WPage:257–298、598–608 | 宿主状态适配：独立 task/run/output；不得由回复完成推任务成功 |
| FW04 | 对象分支只覆盖 sample-sheet、sample-source、question、record、external.body；P04/local-start/沟通稿/共享稿尚未接入；外部对象内容通过 ReactNode 传递 | WPage:300–311、434–553 | Workspace 渲染/路由适配：同一对象引用和草稿 owner，避免复制业务 Store |
| FW05 | panelId / recordId 不携带固定版本。Record 选择最新 paper/ACTIVE result，单题也读取当前 questions；历史入口不能据此保证回到历史同一版 | WModel:69–81；WPage:434–443；Record:17–27、35–37 | 宿主版本契约：明确“当前”与“固定版本”；这里是静态风险，未模拟更新复现 |
| FW06 | 对象页头仅提供标题/描述和样例版本等局部信息，缺各类对象一致的保存状态、未保存变更和真实能力映射 | WPage:478–506；Local:67–90；v0.1.3 §7.1 | 通用呈现契约＋宿主传值；保存动作和状态保持外部事实 |
| FW07 | 读取证据只要求 sourceVersion 非空，未比对目标版；引用无 sourceVersion/runId；详细模型上下文固定未知 | WModel:140–165；WResources:20–24 | 服务证据模型＋呈现适配；不能把前端字段存在当验真 |
| FW08 | 来源清单过滤 active 任教关联，但普通历史正文/引用标题直接显示；撤权后的历史可见规则尚未形成统一呈现门禁 | WPage:236–278、770–800；Scenario:301–319；全场景 §15.11 | 产品授权策略＋宿主；这里只指出缺统一策略，不宣称已验证越权泄露 |
| FW09 | 示例选择/备注使用运行内 Map，external.body 也不是可持久对象引用；刷新恢复能力与对话 localStorage 不同 | WPage:139–184、300–311；Session:3–19；框架 §13.4 恢复范围 | 宿主明确恢复范围；真实成果不得靠样例 Map 保存。现有“刷新重置”本身是已声明边界 |
| FW10 | 空对象反馈条件同时检查 record/question/external；question 在非 question panel 可回退 selectedQuestion，可能遮掉失效目标提示 | WPage:438–443、554–561 | 静态推断待浏览器复现；按当前 panel 类型判断空态与失效，不依据无关残留对象 |

文档层另需收口：框架早期 §7.8 的外部点击关闭资源浮层、§8.1 的题篮共存描述，与后续单右栏及驻留 Popover 修订记录有历史差异。应以固定代码和最后批准段落逐项收口；本任务不改该文档，也不把历史规则视为新功能要求。涉及变更后的最终权威条款未核实，后续由 Supervisor/PO 确认。

## 10. 建议的下一个组件及新页验证路径

优先做 **15 对比查看器** 的同对象两态试点，同时接入已有 **03 上下文摘要、13 摘要预览**。这是三项语义组件，不是新增三个目录项；25/26/27 候选的引入与服务事实适配按 §6 的 P0 并行收敛任务范围，不能用它们推定真实执行已通。

| 组件 | 对应流程/步骤 | 后续在 Workspace 新页的具体验证路径 | 必须观察的结果 |
| --- | --- | --- | --- |
| 15 对比查看器 | A05、P07、L04–05 | 在 `/teacher/agent/workspace` 经获准适配载入 P04 同一校对对象；手改一题→送入针对旧 revision 的候选→在 Inline 看差异摘要→打开扩展对照→选择保留手改/采纳指定范围→退出返回原对话；再以 local-start 同一教学环节复用 | 不复制草稿；冲突明确；decision 外部受控；公式与长中文可读；切换会话/返回不丢选择和草稿；采纳不等于保存或发布 |
| 03 上下文摘要 | A02/A04、D01、FW03 | 新页选一个获权材料对象→从摘要打开详细来源→依次输入 selected、read、context、citation 的已确认/未知/不可用外部记录→切换另一会话再返回 | 四事实独立；版本/run/output 不匹配不能标已引用；打开材料不自动改读取/上下文；详细态只展开必要信息 |
| 13 摘要预览 | A04/A06、P05/P09、L03/L06 | 新页对话中显示同一成果摘要→打开右栏对象→进入/退出专注→切题篮再返回→离开工作记录页再回原会话→打开固定成果版本；另给无打开能力状态 | 摘要与扩展对象身份/版本一致；无对象不显示可用打开动作；已有输入、阅读位置和题篮状态保持；摘要不推定保存成功 |

这些是待执行的接入验证方案。当前固定新页没有 P04/local-start 业务渲染器，不能直接声称按路径现已可完成。先在 Workspace 任务中接入必要适配，再在同一路由验证；历史 `scenario=scan-paper` / `scenario=local-start` 只作数据和行为参考。本轮只写文档，未操作这些路径。

共同验证条件：三主题、320/390px 窄容器、长中文与公式、键盘及减少动态效果；逐项检查聚焦、返回恢复、失效对象、只读/冲突、失败/未知。字段由受控夹具提供时标“夹具”，真实服务联调另列；不以按钮点击模拟执行成功。对象/版本/草稿/采纳状态及焦点/滚动的所有权参考 v0.2.1 §4、§8 与 v0.1.3 §7.1，仍归宿主。

## 11. 未核实项、交付边界与检查

### 11.1 未核实项

1. 远端 GitHub 此刻 main、站点保存/发布版本与本地 HEAD 的实时一致性：未联网核验。本文只保证本地固定 Git 对象与读取定位。
2. 任意浏览器运行结果、截图、三主题、320/390px、长中文/公式、键盘、读屏器、真实移动设备和减少动态效果：本轮未验证；文档内历史记录未转为本次结论。
3. 真实模型、OCR、文件上传、题库许可、课表/名册、课堂采集、家校发送、发布回执、协作、跨设备与后端存储：未联调，不宣称真实接入。JSON 读取/本地保存是源码可核对的有限能力。
4. 第一组六项整体迁入后的依赖闭包、Workspace 编译和破坏性差异全量：未演练；§7 只列已发现风险，不是完整兼容性保证。
5. FW05 历史版本回开、FW08 撤权历史呈现、FW10 失效对象空态：静态风险，未浏览器复现；权限最终策略和历史文档冲突需收口。
6. 完整 Word/PPT、音视频编辑、关系图、计算/仿真、学科工具及实时语音对话：无本轮已核实实现，不由基础组件名称推定支持。

### 11.2 交付与检查范围

本任务只新建本文并修改本仓 AGENTS.md 的 §1 Workspace 职责和 §8 授权范围措辞；未修改组件、测试、v0.1.3、v0.2.1 或 Workspace 文件，未运行 Git 写命令，未提交/推送/建 PR。检查结果：`node scripts/check-typography.mjs` 退出码 0，100 个自有 TSX 文件语义字号检查通过；`git diff --check` 退出码 0，无空白错误。新增文档另做行尾空白、表格列数、104 个步骤 ID、42 项台账与文件行号范围核对。源码构建/测试未运行，不属于这次文档变更的验证结论。

