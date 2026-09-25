# 智能曜彩 UI Design System

进度跟踪：[Agent 组件进度清单](docs/Agent组件进度清单.md)（持续更新，每轮对照汇报）。

## 资源检索器 v0.1 · 设计候选（2026-09-26）

语义 36 `AgentResourceRetriever` 声明 **Inline + 专用扩展内容**：Inline 展示页面给出的少量推荐，Workspace 提供检索、筛选、排序及完整来源与许可；compact 只收紧间距。命中、预览、读取、Agent 本次参考与成果引用分别取页面记录，许可不自动授予操作能力，未知保持未知。

10 挑选候选对象加入集合；36 决定预览或读取资源；03 汇总上下文与来源事实；38 组织素材包；21 浏览证据链。全部检索/资源动作通过版本绑定的 `onIntent` 返回；预览插槽仅在页面声明用户已请求、目标版本匹配且内容就绪时挂载，不自动播放。重复来源和许可提升到组级，标题只出现一次，相同禁用原因合并到相关控件组。

组件页 `/next/components/agent-components#resource-retriever` 提供勾股定理图片/视频/文章/课例与教材章节页两组固定示例，含受限/未知/需确认许可、部分来源失败、总数未知、320px、长中文与公式。公开 API 见[资源检索器契约](docs/component-contracts.md#资源检索器-v01)。coss、依赖、视觉令牌及 80 项目录不变。

候选位于 `feat/agent-resource-retriever`，基于 main `5036bd1`；第 36 项登记为“组件候选”。五项验证、实际 diff、测试数字与 Workspace `7ee2bf6` 的只读轻量方案见 `.sites-runtime/resource-retriever/REPORT.md`。本轮不写 `.git`、不启动开发服务、不改 Workspace；浏览器三主题/窄容器/键盘触屏、Workspace 接入、真实服务与独立 Review 未完成。

## 建议集 v0.1 · 设计候选（2026-09-26）

语义 22 `AgentSuggestionSet` 声明 **Inline + 专用扩展内容**：Inline 呈现推荐短列表与选择，Workspace 承载独立比较、批量采纳及页面提供的调整字段。`density="compact"` 只收紧布局，保留依据、适用对象、影响／代价、确定性、限制和未确认回执；相同依据与来源分别合并到组级，建议标题只出现一次。

10 挑选题、资源或学生；22 决定做什么、为什么及对谁；21 查看证据；23 编排后续计划。选择、采纳与已创建任务分别取页面事实，所有数据操作只发版本绑定的 `onIntent`；确认选择不采纳，采纳不创建任务，驳回不取消已有任务。

组件页 `/next/components/agent-components#suggestion-set` 提供讲评后的教学建议与通用学生学习建议两组标注示例，含并列比较、调整一项、独立操作／任务记录、320px、长中文与公式。公开 API 见[建议集契约](docs/component-contracts.md#建议集-v01)。coss、依赖、视觉令牌与 80 项目录不变。

未合并候选位于 `feat/agent-suggestion-set`，基于 main `bad3435`；第 22 项登记为“组件候选”。五项验证、实际 diff、测试数字与 Workspace main `cf46ee9` 的只读轻量方案见 `.sites-runtime/suggestion-set/REPORT.md`。本轮不写 `.git`、不启动开发服务、不改 Workspace；浏览器三主题／窄容器／键盘触屏、Workspace 接入、真实服务和独立 Review 尚未完成。

## 候选选择器 v0.1 · 设计候选（2026-09-26）

语义 10 `AgentCandidatePicker` 声明 **Inline + 专用扩展内容**：Inline 呈现页面给出的少量候选；Workspace 组合 DataRecordTable、FilterBar、Checkbox 与固定标签检索，支持排序、批量选择和加载更多请求。`density="compact"` 只收紧布局，选择依据、来源、失效／受限原因与未确认事实保持可见。题目通过 QuestionCard 插槽接入，学生、知识点和资源使用通用条目。

01 选择既有对象作为上下文／目标；10 从推荐或检索结果中挑选候选、比较依据与替代来源；11 管理已选集合；14 承担打开后的对象查看。10 的选择、替换、检索、筛选、排序、加载和提交全部通过版本绑定的 `onIntent` 发出，页面持有结果与选择；组件不自行检索、过滤、排序、分页或加入题篮。已选、已提交和已在集合中分别取页面事实，总数未知不以已加载数量代替。

组件页 `/next/components/agent-components#candidate-picker` 提供候选题（QuestionCard、公式、替代题、失效／受限／已在题篮）和候选学生／知识点两组标注示例，覆盖 inline / workspace / compact、320px、长中文、加载更多、总数未知、加载错误与独立示例回执。公开 API 见[候选选择器契约](docs/component-contracts.md#候选选择器-v01)。coss、依赖、视觉令牌和 80 项目录不变。

未合并候选位于 `feat/agent-candidate-picker`，基于 main `ac27658`；第 10 项登记为“组件候选”。五项检查、实际 diff、测试数字及 Workspace main `c8cc00c` 的只读轻量验证方案见 `.sites-runtime/candidate-picker/REPORT.md`。本轮不写 `.git`、不启动开发服务、不改 Workspace；浏览器三主题／窄屏／键盘触控、Workspace 接入、真实服务与独立 Review 尚未完成。

## 参数配置器 v0.1 · 设计候选（2026-09-26）

语义 07 `AgentParameterConfig` 声明 **Inline + 专用扩展内容**：Inline 按宿主 `key` 标记展示关键参数，Workspace 展示同一列表的完整参数集。组合 NumberField、Select、RadioGroup、Switch、Input 和固定标签；compact 收紧间距，保留校验、未确认／未知、影响和锁定原因。

07 负责单值参数；08 负责范围、互斥和组合约束；25 负责执行确认。修改只发带 `baseVersion` 的 change/reset，值、校验、默认值来源与确认事实由宿主提供。只读与冻结不挂载输入；冻结消费确认当时的参数记录。可通过 25 的 `conditions` 插槽与 08 共用一张卡和一条边界提示。

组件页 `/next/components/agent-components#parameter-config` 提供组卷与批阅两组示例，覆盖两态、compact、320px、长中文、公式、校验错误、未确认、锁定和冻结。公开 API 与边界见[参数配置器契约](docs/component-contracts.md#参数配置器-v01)。coss、依赖、视觉令牌及 80 项目录不变。

候选位于 `feat/agent-parameter-config`，基于 main `1d4503b`（含 #68/#69）；第 07 项登记为“组件候选”。五项验证日志、测试数字、实际 diff 与 Workspace 轻量验证方案见 `.sites-runtime/parameter-config/REPORT.md`。本轮未写 `.git`、未启动开发服务、未改 Workspace；浏览器三主题／窄容器／键盘与读屏器、Workspace 接入及真实服务未验，待 Supervisor 独立 Review 与 PO 决定。

## 结构化内容工作区 v0.1 · 设计候选（2026-09-26）

语义 35 `AgentStructuredContent` 声明 **Inline + 专用扩展内容**：Inline 展示前两层结构、节点计数与宿主关键变化；Workspace 复用 Tree 编辑节点名称、增删、移动与嵌套，并提供折叠和拖拽。上移／下移／升级／降级按钮是触屏和键盘的等效操作；`density="compact"` 仅收紧间距，保留深层冲突、只读原因与保存事实。

35 负责内容层级，28 `AgentDocumentWorkspace` 负责长文及章节正文，12 负责编排试卷／任务顺序。目录选择不等于内容编辑；内容模型、版本、变化与保存状态由宿主维护，组件只发出携带节点及目标位置的意图。历史强制只读，内部 ID 不进入界面。不改 coss、依赖、视觉令牌或 80 项目录。

组件页 `/next/components/agent-components#structured-content` 提供五环节备课提纲（子活动、新增与移动）和仅可折叠查看的教材章节两组标注示例，覆盖 inline / workspace / compact、320px、长中文、公式、历史与深层冲突。公开 API 及 Tree 组合取舍见[结构化内容工作区契约](docs/component-contracts.md#结构化内容工作区-v01)。

候选位于 `feat/agent-structured-content`，基于 main `98c584b`；进度清单第 35 项为“组件候选”。五项验证日志、测试清单和只读核对 Workspace main `2cc32be` 的接入建议见 `.sites-runtime/structured-content/REPORT.md`。本轮未写 `.git`、未启动开发服务、未改 Workspace；浏览器三主题／实际拖拽／触屏／读屏器及真实服务未验，待 Supervisor 独立 Review。

## 成果物输出 v0.1 · 设计候选（2026-09-26）

语义 33 `AgentArtifactOutput` 声明 **Inline + 专用扩展内容**：Inline 按推荐格式快速导出，Workspace 选择格式、版式、范围与版本，承载预览、批量输出队列和只读历史。`density="compact"` 保留失败、未确认、有损／不支持原因和“基于旧版本”提示。复用 Card、Field、Select、Prism Badge / Button 与 RecordDetails；QuestionPrint 原行为作为打印预览插槽复用。

27 `AgentExecutionResult` 报告执行事实，28 `AgentDocumentWorkspace` 承载文稿阅读编辑，33 负责格式和文件交付，可按同一成果组合。生成、状态、版本与实际文件可用性均由宿主提供；只有 ready 文件、匹配版本、下载能力和回调齐备才提供下载入口。未知仅查询原请求，生成中无外部进度不显示百分比；组件不生成链接、不存文件、不显示内部 ID／原始路径。

组件页 `/next/components/agent-components#artifact-output` 提供试卷和学情报告两组标注示例，覆盖 inline / workspace / compact、320px、公式、旧版文件及未确认队列。导出／下载为明确示例动作，没有实际文件链接。公开 API 与复用边界见[成果物输出契约](docs/component-contracts.md#成果物输出-v01)。coss、依赖、视觉令牌与 80 项目录不变。

未合并候选位于 `feat/agent-artifact-output`，基于 main `538f5ca`；进度清单第 33 项为“组件候选”。五项日志、测试清单和 Workspace 本地 main `399bb75` 的只读轻量验证方案见 `.sites-runtime/artifact-output/REPORT.md`。未操作 Git 提交、未启动开发服务、未修改 Workspace；浏览器、实际打印／下载、Workspace 接线和真实服务尚未验证，待 Supervisor 独立 Review。

## 约束构建器 v0.1 · 设计候选（2026-09-26）

语义 08 `AgentConstraintBuilder` 声明 **Inline + 专用扩展内容**：Inline 查看并修改主要条件；Workspace 呈现全部分组、冲突定位、默认恢复与相对上次确认的变化。`density="compact"` 保留冲突、不可用及需重新确认提示。复用 Fieldset、Checkbox、RadioGroup、NumberField、Select、Alert，值、默认值、影响、校验与冲突均由宿主给出，不内置检查或求解。

02 确定参与对象，08 编辑执行／结果条件，25 确认执行。`AgentExecutionConfirmation.conditions` 可组合 08；关键条件变化后，由宿主同步使旧确认失效，符合 §10.4 的同一决定区组合。P04 排重／模糊页归属 08 + 25。

组件页 `/next/components/agent-components#constraint-builder` 提供 P04 处理条件与组卷约束两组标注示例，覆盖 inline / workspace / compact 和 320px：关键条件变化、确认后冻结、比例冲突、规则不可用及独立载入默认／确认记录。公开 API 和复用依据见[约束构建器契约](docs/component-contracts.md#约束构建器-v01)。coss、依赖、视觉令牌及 80 项目录不变。

未合并候选位于 `feat/agent-constraint-builder`，基于 main `641a5d7`；进度清单第 08 项为“组件候选”。五项结果、实际 diff 和只读核对 Workspace 本地 main 的轻量验证方案见 `.sites-runtime/constraint-builder/REPORT.md`。本轮不写 .git、不启动开发服务、不改 Workspace；浏览器与真实服务未验证，待 Supervisor 独立 Review。

## 内容输入 v0.1 · 设计候选（2026-09-25）

语义 06 `AgentContentInput` 声明 **Inline + 专用扩展内容**：Inline 提供轻量字段输入、字符数与限制提示；Workspace 提供长文本／结构化字段组、可选当前草稿公式预览和独立已提交版本。`density="compact"` 只收紧间距，保留常驻标签、校验失败、来源、保存未知与冲突。

Composer 输入给 Agent 的指令；06 输入任务材料／正文；28 AgentDocumentWorkspace 阅读编辑已有文稿。06 复用 Textarea、InputGroup、Field 等既有控件，值、校验、保存和 URL 抓取事实来自宿主；提交与展开仅发请求，不持久化或自动保存。Markdown 保留安全原文，不解析 HTML；URL 摘录不暗示已抓取全文。公式通过可选插槽组合 DraftMathPreview，06 本身不依赖 temml。

组件页 `/next/components/agent-components#content-input` 提供题干与答案（公式预览、一处格式失败）和讲评要点（三字段、URL 来源“未抓取全文”）两组标注示例，覆盖 inline / workspace / compact 与 320px 容器。公开 API 和复用依据见[内容输入契约](docs/component-contracts.md#内容输入-v01)。coss、依赖、视觉令牌及 80 项目录不变。

未合并候选位于 `feat/agent-content-input`，基于 main `921397f`；进度清单第 06 项为“组件候选”。五项日志、测试清单与 Workspace 本地 main `f1d8847` 的只读轻量验证方案见 `.sites-runtime/content-input/REPORT.md`。本轮未写 `.git`、未启动开发服务、未修改 Workspace；浏览器、Workspace 接线和真实服务未验证，待 Supervisor 独立 Review。

## 审核队列 v0.1 · 设计候选（2026-09-25）

语义 16 `AgentReviewQueue` 声明 **Inline + 专用扩展内容**：Inline 呈现待办计数、宿主顺序的重点条目和“下一项”；Workspace 复用 DataRecordTable、FilterBar、Checkbox 和 Badge，提供完整列表、受控筛选／排序、选择与批量动作。`density="compact"` 为独立密度，保留回执未确认、过期、他人处理中及异常原因。

16 负责“看全部、选下一项、批量”，17 `AgentItemReviewer` 负责单个对象的确认与修订；共享七值状态词表。优先级／原因、顺序、责任人、协作占用、版本、计数和进度全部来自宿主，下一项也由宿主指定。批量动作只发出绑定队列及逐项版本的请求，等待宿主逐项回传回执；混入不可操作对象时整批不可执行。他人处理中不提供打开复核、下一项或异常处置入口，组件不加锁或分派。不显示内部 ID。

组件页 `/next/components/agent-components#review-queue` 提供 P04 三题校对（回执未确认、过期）与学生作答批阅（他人处理中、批量确认后独立逐项示例回执）两组用途，覆盖 inline / workspace / compact 和 320px 容器。公开 API、复用依据与边界见[审核队列契约](docs/component-contracts.md#审核队列-v01)。目录保持 80 项，coss、依赖和视觉令牌不变。

未合并候选位于 `feat/agent-review-queue`，基于 main `36be612`；进度清单第 16 项为“组件候选”。五项日志、测试清单与 Workspace 本地 main `3413920` 的只读轻量验证方案见 `.sites-runtime/review-queue/REPORT.md`。未写 `.git`、未启动开发服务、未修改 Workspace；浏览器、Workspace 接线与真实服务尚未验证，待 Supervisor 独立 Review。

## 对象选择器 v0.1 · 设计候选（2026-09-25）

语义 01 `AgentObjectPicker` 声明 **Inline + 专用扩展内容**：Inline 快速选择推荐／最近对象并呈现已选摘要；Workspace 复用 Combobox、FilterBar、DataRecordTable 和 Checkbox，提供搜索、筛选、多选、按上限批量选择与加载更多请求。`density="compact"` 只收紧间距，不隐藏不可选原因。

01 选定“具体对象”，02 AgentScopeBuilder 组合“多维范围”；02 可在维度内复用 01。候选、允许披露的字段、选择、推荐依据／来源、搜索筛选结果与加载事实均由宿主提供，默认不做本地过滤；选择和确认不会授予权限或执行任务。跨结果选择保留，失效选择不自动删除，不显示内部长 ID。

组件页 `/next/components/agent-components#object-picker` 提供班级单选（含无权限班级）、学生多选（含已归档学生、上限 5）两组标注示例，覆盖 inline / workspace / compact、320px、长中文和状态切换。公开 API 见[对象选择器契约](docs/component-contracts.md#对象选择器-v01)。coss、依赖、视觉令牌和 80 项目录不变。

未合并候选位于 `feat/agent-object-picker`，基于 main `696061e`；进度清单第 01 项为“组件候选”。五项日志、测试清单与只读核对 Workspace 本地 main `25b431e` 的轻量接线方案见 `.sites-runtime/object-picker/REPORT.md`。本轮未写 `.git`、未启动开发服务、未修改 Workspace；浏览器与真实服务未验证，待 Supervisor 独立 Review。

## 指标摘要 v0.1 · 设计候选（2026-09-25）

语义 19 `AgentMetricSummary` 声明 **Inline + 专用扩展内容**：Inline 用既有 MetricSummary compact 展示关键 KPI、显著变化与异常依据；Workspace 提供完整分组、TrendChart 趋势、统计口径和带来源解释。`density="compact"` 为独立密度，保留缺测、样本不足、状态未确认与受限原因。

值、单位、分母/样本、数据时间/版本、变化判断、异常和来源全部由宿主提供。受限数据只显示获准披露的计数与原因；历史标“当时数据”。不计算统计、占比或结论，因此本候选不自动组合会计算进度/占比的 GoalComparison 与 StatusComposition。下钻只发版本绑定请求，可接 21 AgentEvidenceDrilldown；没有 onExpand 则没有详情入口。

组件页 `/next/components/agent-components#metric-summary` 提供班级学情与批阅进度两组固定示例，覆盖 inline / workspace / compact、320px、长中文与公式。公开 API、复用取舍与披露边界见[指标摘要契约](docs/component-contracts.md#指标摘要-v01)。目录保持 80 项，coss、依赖、视觉令牌不变。

未合并候选在 `feat/agent-metric-summary`，基于 main `cb5234d`；五项日志、测试清单和 Workspace 轻量验证建议在 `.sites-runtime/metric-summary/REPORT.md`。本轮只读核对 Workspace 本地 main `257f96c`，未接线、未启动开发服务、未写 Git。浏览器视觉/键盘和真实服务尚未验证，候选待 Supervisor 独立 Review。

## 范围构建器 v0.1 · 设计候选（2026-09-25）

语义 02 `AgentScopeBuilder` 声明 **Inline + 专用扩展内容**：Inline 汇总核心范围并提供少量微调；Workspace 编辑全部维度、显示校验与影响规模、请求重置或恢复默认。`density="compact"` 为独立密度，保留冲突、越权、不可用和重新确认提示。

维度、合法选项、受控值、校验、汇总与影响规模由宿主提供；受限维度只披露许可原因／计数。选择范围不授予权限，未指定范围不等于使用全部授权数据。确认只发请求，关键条件或版本变化后重新确认。复用 TextbookRangePicker、TextbookDirectory / Tree、FilterBar、Calendar / Popover 及既有 Card、Badge、Button、Collapsible，不新增选择控件、依赖、视觉令牌或目录条目，目录保持 80 项。

组件页 `/next/components/agent-components#scope-builder` 提供学情分析与备课资料两组固定示例，涵盖三种用法、越权班级、不可用资料目录、320px、长中文与公式。公开 API 见[范围构建器契约](docs/component-contracts.md#范围构建器-v01)。

未合并候选位于 `feat/agent-scope-builder`，基于 main `b716d7e`；第 02 项为“组件候选”。五项日志与只读核对 Workspace main 的接入方案见 `.sites-runtime/scope-builder/REPORT.md`。P04 的排重／模糊页属于执行约束，更适合 08；新页范围入口方案待确认。本轮未写 `.git`、未启动开发服务、未改 Workspace；浏览器与真实服务未验证，候选待 Supervisor 独立 Review。

## 对象查看器 v0.1 · 设计候选（2026-09-25）

语义 14 `AgentObjectViewer` 声明 **Inline + 通用扩展容器（领域内容可专用）**：Inline 呈现身份／版本、1–2 个关键分区摘要和局部展开；Workspace 提供完整分区、受控目录、版本切换和关联对象。`density="compact"` 为独立密度，保留历史只读、受限原因和敏感确认。只有宿主提供可读编号时才显示编号，不显示内部长 ID。

AgentArtifactPreview 负责成果摘要卡与打开入口；对象查看器负责打开后的通用承载。题目继续用 QuestionCard / QuestionDetails，作答用 DocumentRegionViewer 插槽；敏感答案经明确确认才挂载，受限分区只显示可披露标题和原因。动作与换版只发请求，打开对象不推断已读取／已引用；版本差异只显示宿主说明，不内置业务 Store、权限判定或持久化。

组件页 `/next/components/agent-components#object-viewer` 提供题目、学生作答两组固定示例，覆盖 inline / workspace / compact、历史换版、家长联系方式受限、320px 窄容器和数学分式。公开 API 见[对象查看器契约](docs/component-contracts.md#对象查看器-v01)。目录保持 80 项，coss、依赖和视觉令牌不变。

本轮未合并候选位于 `feat/agent-object-viewer`，基于 main `c9980c8`。五项日志、测试清单与 Workspace main 的只读轻量验证方案见 `.sites-runtime/object-viewer/REPORT.md`。未操作 `.git`、未启动开发服务、未修改 Workspace；浏览器与真实服务未验证，候选待 Supervisor 独立 Review。

## 集合篮 v0.1 · 设计候选（2026-09-25）

语义 11 `AgentCollectionBasket` 声明 **Inline + 专用扩展内容**：Inline 展示宿主数量、关键条目、分组计数和去向；Workspace 提供完整清单、领域渲染插槽、受控批量选择／动作、分组与上移／下移。`density="compact"` 是独立密度，保留失效、冲突、受限与同步失败原因。汇总、来源版本、同步和最近变化均取宿主事实，操作只发请求，不内建集合数据源、计分、保存、组卷或发布。

复用 Card、Badge、Button、Checkbox、Select、Collapsible；题目通过 QuestionCard 插槽呈现，QuestionWorkPanel 仍只承担可选 Drawer 外壳。Workspace 全局题篮 Provider、Store、班级交接与持久化保持原职责，不迁入本仓。目录仍为 80 项，coss、依赖、视觉令牌不变。

组件页 `/next/components/agent-components#collection-basket` 提供试题篮（分值汇总、下架题、公式）和备课素材包（图片／视频／文章、分组）两组标注示例，展示 inline / workspace / compact、空态和手动同步状态。公开 API 见[集合篮契约](docs/component-contracts.md#集合篮-v01)。

未合并候选位于 `feat/agent-collection-basket`，基于 main `9e6fa12`。测试、五项日志与 Workspace 轻量验证方案见 `.sites-runtime/collection-basket/REPORT.md`。未启动开发服务、未修改 Workspace 或写入 Git；组件候选待 Supervisor 独立 Review，浏览器、Workspace 接入与真实服务尚未验证。

## 文件输入 v0.1 · 设计候选（2026-09-25）

语义 04 `AgentFileInput` 声明 Inline + 专用扩展内容：少量文件选择与队列摘要、Workspace 完整队列／状态分组／批量操作／文件详情和排序；`density="compact"` 只调整布局密度。复用 coss 原生文件输入、卡片、进度和折叠组件，不新增目录条目、依赖或视觉令牌。

选择与拖入只调用 `onSelect(files)`；类型、大小、数量校验及队列状态由宿主提供。已选择（仅本机）、校验未通过、等待上传、已接收、上传中、已上传、上传失败、状态未确认、已移除分别呈现，后续处理是独立记录。无有效进度不显示百分比，已上传不推定已读取或已解析；回执不明仅允许查询原请求，批量操作也不能绕过此限制。组件不读取文件内容、不上传、不持久化文件对象。

组件与公开 API：`components/prism-next/agent-file-input.tsx`；契约见 [文件输入 v0.1](docs/component-contracts.md#文件输入-v01)。组件页 `/next/components/agent-components#file-input` 提供扫描试卷图片／PDF、备课 Word／Excel 两组标注示例，展示 inline / workspace / compact；紧凑实例置于 `AgentComposer.attachments`，`tools` 提供同队列入口。示例可做真实本机文件的元数据检查，真实上传明确未接入，不把本机材料送入预置解析结果。

状态为任务分支 `feat/agent-file-input` 上的**组件候选**，不代表 main、Workspace 浏览器验收或真实服务接入。P04 轻量验证应把“带入示例扫描材料”作为已有资料引用，真实本机文件另列且只做本机检查；接收、上传、读取与解析分开映射，详见交付报告 `.sites-runtime/file-input/REPORT.md`。

## 文档工作区 v0.1 · 设计候选（2026-09-25）

语义 28 `AgentDocumentWorkspace` 提供 Inline 摘要/节选与 Workspace 章节阅读、受控文本编辑、批注及历史版只读承载；`density="compact"` 只改变密度。查看、编辑、批注、导出四项能力及转换风险必填，未支持能力不提供可执行入口。保存状态、草稿与版本均由宿主提供，不内置持久化、格式转换或 Office／富文本编辑器。

原位示例 `/next/components/agent-components#document-workspace` 包含五环节备课提纲与 PDF 讲评材料，两组均有 inline / workspace / compact、历史版、保存状态与 320px 容器。公开 API 见[组件复用约定](docs/component-contracts.md#文档工作区-v01)，目录保持 80 项，coss、依赖和视觉令牌不变。

未合并候选位于 `feat/agent-document-workspace`，基于 main `fcc929d`。五项日志、测试与 Workspace 验证方案评估位于 `.sites-runtime/document-workspace/REPORT.md`；本轮只读核对 Workspace main `edbcbb1`，未接入或启动服务，浏览器与真实服务未验证。仍待 Supervisor 独立 Review，不自授通过结论。

## QuestionReview 状态外部化（2026-09-25）

`QuestionReview` 新增可选 `review?: AgentItemReview`，复用单项复核器的七种外部状态。确认只调用原有 `onConfirm(scores, reason)` 意图回调，不再写入 saved/record、清空理由或显示本地生成的完成记录。旧属性与类型保持兼容；未传 review 时，发出确认后仅提示“已发出确认，等待记录”。

迁移时由宿主提供 waiting/unknown/resolved 等事实，只有匹配对象、请求与版本的回执才能提供 resolved；已记录评分由受控 editor.saved 更新。五处示例通过共用的示例宿主持有状态，“确认复核”后独立点击“载入示例回执”演示提交中 → 已复核；学习工作流在示例回执到达后才生成评价版本。详见 [QuestionReview 迁移契约](docs/component-contracts.md#questionreview-状态外部化迁移2026-09-25)。

基线 main `3eb6533`，任务分支 `fix/question-review-external-status`。验证日志与 SSR 差异报告位于 `.sites-runtime/question-review/`；未启动开发服务，浏览器视觉／键盘、实体设备、读屏器、Workspace P04 接入与真实服务未验证，待 Supervisor 独立 Review。

## 单项复核器 v0.1 · 设计候选（2026-09-25）

语义 17 `AgentItemReviewer` 位于 `components/prism-next/agent-item-reviewer.tsx`，声明 **Inline + 专用扩展内容**。`view="inline" | "workspace"` 默认 inline，独立 `density="compact"` 只改变密度。Inline 呈现对象／依据版本、待复核要点、当前值摘要和快捷动作；Workspace 增加证据、受控草稿、原值对比、理由和当时复核记录。评分通过领域插槽接入。

七种复核状态只取宿主事实；点击确认仅发请求，不产生“已复核”。unknown 只查询原请求；版本变化使旧确认过期，并保留草稿与理由。复核人／时间／版本取自回执，时间未知明确未确认。QuestionReview 点击后直接写 saved／record 的旧行为已修复（本 PR），见上方状态外部化迁移说明。

组件页 `/next/components/agent-components#item-reviewer` 提供 P04 单题原稿对照、单份作答评分两组固定示例，包含 inline / workspace / compact、320px、长中文与公式。复用 VerificationFields、PointsField、AgentEvidenceDrilldown、DocumentRegionViewer 及 coss / Prism；公开属性见[单项复核器契约](docs/component-contracts.md#单项复核器-v01)。目录仍为 80 项，无新增依赖或视觉令牌。

未合并候选位于 `feat/agent-item-reviewer`，基于 main `278e7e3`。五项日志、测试清单与 P04 轻量验证方案存于 `.sites-runtime/item-reviewer/REPORT.md`；既有 checked 仅表示本地“已与原稿对照”，不作为正式复核或保存回执。不启动开发服务、不修改 Workspace、不写入 Git；浏览器视觉／交互及真实接入另行验证，候选待 Supervisor 独立 Review。

## 下钻与证据浏览 v0.1 · 设计候选（2026-09-25）

语义 21 `AgentEvidenceDrilldown` 位于 `components/prism-next/agent-evidence-drilldown.tsx`，声明 **Inline + 专用扩展内容**。`view="inline" | "workspace"` 默认 inline，`density="compact"` 是独立密度。摘要展示结论与关键证据；完整视图按“结论 → 对象 → 证据”浏览，支持面包屑、上层返回和证据预览插槽。路径由宿主控制，打开、展开和返回仅发请求。

已读取、已引用、仅检索命中、仅预览、不完整、不可用及未确认等事实分别呈现；数量与覆盖仅显示宿主提供的值，不依据点击或预览推定。历史证据保留当时版本；受限记录只显示允许披露的标题与原因，紧凑列表保留关键限制。

组件页 `/next/components/agent-components#evidence-drilldown` 提供扫描校对与学情诊断两组固定示例，覆盖 inline / workspace / compact、320px 容器、长中文及公式。复用 DiagnosisEvidenceTable 诊断入口、AgentContextList 来源行与 DocumentRegionViewer 预览；公开 API 见[下钻与证据浏览契约](docs/component-contracts.md#下钻与证据浏览-v01)。不新增依赖、视觉令牌或目录条目。

本轮未合并候选位于 `feat/agent-evidence-drilldown`（main 基线 `2f04f5a`），验证日志与 Builder 报告在 `.sites-runtime/evidence-drilldown/REPORT.md`，包含 P04 试验台轻量验证方案。未启动开发服务，未修改 Workspace 或写入 Git；浏览器视觉／键盘焦点及 Workspace 接入另行验证，候选待 Supervisor 独立 Review。

## 异常处理器 v0.1 · 设计候选（2026-09-25）

语义 18 `AgentExceptionHandler` 位于 `components/prism-next/agent-exception-handler.tsx`，声明 **Inline + 专用扩展内容**。`view="inline" | "workspace"` 默认 inline，`density="default" | "compact"` 为独立密度。摘要保留类型、影响范围、已保留内容、处置状态及选项影响；完整视图提供全部异常、原始材料预览、判定依据、当时处置记录与返回入口。

七种处置状态由外部事实提供；提交中与回执未确认不接受重复处置，只可查询原请求。已处置、已忽略和已跳过分别呈现，缺少时间明确显示未确认。动作只回传异常与动作标识；历史不随当前状态改写，组件不判断恢复资格或写入数据。

组件页 `/next/components/agent-components#exception-handler` 提供 P04 模糊页与题目冲突／缺失答案两组固定示例，含三种用法、320px 窄容器、长中文及公式。公开 API 与 P04 接入映射见[异常处理器契约](docs/component-contracts.md#异常处理器-v01)。复用现有 coss / Prism，不新增依赖、视觉令牌或目录条目。

本轮证据在分支 `feat/agent-exception-handler`（基线 `96bb21f`），验证日志与 Builder 报告在 `.sites-runtime/exception-handler/REPORT.md`。不启动开发服务、不修改 Workspace、不写入 Git；组件候选仍待 Supervisor 独立 Review 与下一步 Workspace P04 轻量验证，不能视为业务接入或验收通过。 五项均退出 0：排版 107 个 TSX、全量测试 151/151、类型检查 0 错误。浏览器安全策略阻断本地文件预览，三主题、窄容器与键盘/焦点未实看。

## 任务记录三件套两态 v0.1 · 设计候选（2026-09-24）

语义 26 `AgentExecutionProgress`、27 `AgentExecutionResult`、03 `AgentContextSummary` 补充 `view="inline" | "workspace"`（默认 inline）及独立 `density="default" | "compact"`。原 presentation 外框与默认调用输出保持；任务历史明确标“当时”并静态呈现，未知回执仅允许查询原请求，产出无打开能力不显示假入口，来源的选用/读取/Agent 本次参考/成果引用分别呈现。

`AgentStep.state` 新增 `unknown / waiting-human / waiting / partial`，复用整体进度词表与静态图形；未到达用 pending，已发生但回执不明用 unknown，明确等待回执/处理用 waiting，当前等待教师用 waiting-human，规则见[步骤状态契约](docs/component-contracts.md#步骤状态2026-09-24)，本轮验证日志位于 `.sites-runtime/step-states/`。

组件示例 `/next/components/agent-components#record-views` 含 P04 扫描整理与备课资料整理两组数据，三种用法共享事实，提供窄容器、长中文及公式示例。公开属性、默认值、职责和 P04 映射见 [组件复用约定](docs/component-contracts.md#任务记录三件套两态-v01)。执行确认仍仅 Inline；coss、依赖、视觉令牌和 80 项目录保持不变。

接入验证在 Workspace `/teacher/agent/workspace` 进行，本仓库骨架不作验收依据。本轮不启动开发服务、不修改 Workspace；SSR 快照以 main `e99813a` 固定，验证日志与 Builder 报告位于 `.sites-runtime/record-views/`。浏览器三主题、窄屏/键盘/焦点恢复、实体设备、读屏器和真实服务未验证，候选仍待 Supervisor 独立 Review。

## 对比查看器两态 v0.1 · 设计候选（2026-09-24）

语义 15 `AgentChangeSet` 从本地旧提交 `32382e9` 单独移植，组合现有 `AgentChangeReview`；保留 main 的 Workspace 回收适配。支持同源受控 `inline / workspace`、整组依据与提示、逐项冲突事实、数学预览插槽、采用/保留/重新选择及可选改写、宿主提供的应用动作。冲突项与关键项在 inline 中始终可见；采用仅记录决定意图，应用、草稿变更、版本核验与保存均由宿主负责。

2026-09-24 文案收敛：每卡最多一条边界提示，补充说明可放入默认收起的 `AgentChangeSet.details`“说明”；教师界面去除实现术语，必要状态事实保持常驻，本轮验证日志位于 `.sites-runtime/copy-density/`。

组件示例：`/next/components/agent-components#change-set-two-state`，两栏共享手动示例状态，含一项冲突和 384px 窄容器开关。公开属性与 P04 映射见 [组件复用约定](docs/component-contracts.md#对比查看器两态-v01)。目录保持 80 项，不引入旧提交的承载层或示例 reducer。

接入验证在 Workspace `/teacher/agent/workspace` 的 P04 流程进行，本仓库骨架页不作验收依据。本轮不启动开发服务、不修改 Workspace；验证日志位于 `.sites-runtime/change-set/`。浏览器三主题、窄屏交互、焦点恢复、实体设备、读屏器与真实业务接入尚未验证，仍需 Supervisor 独立 Review。

## Workspace 适配回收 v0.1（2026-09-24）

回收 Workspace 固定提交 `4e0d656` 的通用适配：AgentComposer 范围、只读与发送阻断；MetricSummary / StatusComposition 紧凑布局；QuestionPrint 题号版本行开关；Badge attention 别名。Prism 层提供 Button 导航尺寸与 Toolbar plain 组合，固定 coss 源码保持不变；QuestionWorkPanel 的相关能力已在 main。

经 Product Owner 2026-09-24 批准，Prism Button 增加可与导航尺寸组合的 `variant="info"`，复用现有信息色令牌用于引导/信息性操作，保留每个操作区唯一的 default 主动作层级。

公开 API、默认值及迁移边界见 [组件复用约定](docs/component-contracts.md#workspace-适配回收-v01)。本轮为 Builder 源码交付；逐块分类与验证日志位于 `.sites-runtime/upstream/REPORT.md`。不启动开发服务，浏览器三主题、窄容器、键盘、读屏器、真实设备与 Workspace 升级接入未验证；需 Supervisor 独立检查，不构成视觉或业务验收。

## 当前可用版本：coss v1.13.1

### Agent 导航归类 v0.1（2026-09-23）

侧栏和组件总览统一在「Agent」分类下提供「Agent 语义组件 / Agent 页面骨架 / Agent 工作区示例」三个入口。工作区标题与字号预览同步命名，骨架返回入口指向该分类。既有路径沿用；组件仍为 80 项，骨架与组合示例另计。只整理入口与名称，真实业务接入仍由 Workspace 负责。

### Agent 语义组件第一组 v0.1 · 设计候选（2026-09-22）

依据 [v0.2.1 批准规范](docs/OLE_Teacher_Workspace_Agent_Component_Spec_v0.2.1_APPROVED.md)和[复用规划 v0.1.2](docs/智能曜彩_Agent语义组件复用与设计规划_v0.1.2.md)，原位扩展 `/next/components/agent-components#context-summary-review`：上下文摘要、摘要预览、对比查看、执行确认、任务进度、执行结果，以及同一次执行的组合示例。两种用途、独立状态与 384px 窄容器可手动切换。目录仍为 80 项。两份原文已归档供实施与独立审核引用；第 7.1 节状态映射的复核与待验范围见[候选说明](docs/agent-context-summary-review.md#批准规范原文归档与任务状态复核2026-09-23)。

复用 AgentContextSummary / AgentContextList / AgentChangeReview / AgentTaskProgress 和 Prism / coss；新增受控的预览、确认、整体进度与结果组合。操作仅返回意图，提交中不会被自动当作已接收，回执不明仅查询原执行；历史步骤停止转圈并标明“上次进行到”。不接业务存储、权限判断或 Runtime，不新增完整业务页面。

本站候选源码与 GitHub 历史分开记录；本轮不宣称合入 GitHub main。交互、接口及接续验收见 [候选说明](docs/agent-context-summary-review.md) 和 [组件契约](docs/component-contracts.md)。

### Agent 引导式任务 v0.1.1 · 候选（2026-09-21）

`/next/agent` 增加「试卷解析引导」，复用已有解析流程完成材料入口、范围追问、执行、原稿核对和本机示例保存；原材料复核助手保留。`/next/components/agent-components` 原位补齐追问、材料引用、带详情的步骤和修改对照，调用方持有数据及操作，不增加组件目录分类。

参考 Beautiful UI 的交互组织，使用现有 Prism / coss 实现，不引入其源码或全局样式。三主题与字号标准不变。补充要求进入可复用指令；采用修改前校验原文，失效建议不会覆盖人工编辑，采用仅记录内容选择；核对状态见题目编辑区，保存由宿主单独处理。解析后台、OCR 和模型未接入，真实文件仍只做本地检查，后续结果为明确标注的固定示例。

v0.1.1 追加：题干与参考答案下方显示当前草稿公式预览（Temml 0.13.4 → 原生 MathML，沿用本地 STIX 字体）；Unicode 常见代数式可直接预览，复杂公式使用 `\(...\)` / `\[...\]`。中文、换行及无法解析的输入原样保留，错误显示当前输入，不复用旧公式，不改原稿和保存快照。只检查排版，不证明数学正确。公式每段最多 1000 字符、全文超过 12000 字符回退原文；不支持链接、自定义宏和颜色/字号命令。任务步骤与监视器详情统一使用既有 14px 状态徽标；本机进度恢复增加 Spinner，减少动效模式保持静态。页面标注候选版本并链接 [PR #18](https://github.com/Ashrum/intelligence-prism-ui/pull/18)，审核源码以该候选分支为准。

v0.1 初次引入验证：相关 20 项回归测试、类型检查、语义字号检查与构建通过。浏览器实际走通单题来源回看、追问补充、阶段监控、过期建议拦截、保留/采用、核对、保存和指令复用；390px 三主题检查新组件字号与关键容器，键盘可选择选项；窄屏题目与答案流程验证了局部失败重试。没有重新执行全站 93 页审计，实体设备与真实服务不在本轮范围内。

v0.1.1 定向验证：25 项相关测试通过，包含构建后公式模块原样保留与分式/根号执行检查；浏览器验证草稿更新、公式错误恢复、390px 三主题字号/状态徽标、六轮原稿/编辑切换、异常恢复和 1024px 公式预览。Vite 8 的依赖优化会破坏 Temml 词法器中的代理项转义，因此模块作为同源 ESM 资产按需加载，构建测试校验其字节；不调用第三方 CDN。

### 表现力候选 v0.1 · 三个原位样本（2026-09-21）

入口 `/next/foundations#expression-review`。在现有 [Agent 欢迎页](https://intelligence-prism-ui.ashrvm.chatgpt.site/next/skeletons/agent)、[解析入口与保存结果](https://intelligence-prism-ui.ashrvm.chatgpt.site/next/use-cases/parsing)、[分类图表](https://intelligence-prism-ui.ashrvm.chatgpt.site/next/components/status-composition) 与 [连续热力图](https://intelligence-prism-ui.ashrvm.chatgpt.site/next/components/evidence-matrix) 提供原版 / 候选对照，切换保留草稿、任务和选中项。候选在欢迎、材料入口与完成结果使用现有三色几何标记；解析入口与结果按业务区、辅助指导的顺序排列。暖纸数据色仅在两张图表示例中显式启用，不替换全局主题；品牌名称与色值、11 类字号令牌和 coss 原始源码保持不变。

热力图数值按实际插值底色选择黑/白文字，悬停仅改变边框，避免自动提亮造成对比度下降。分类标签、数量、占比、缺测说明和可键盘选择的数据表继续保留。这是局部候选验证，不重新声明全站或所有交互状态通过；色觉模拟和实体设备不在本轮已验证范围内。

### Typography v0.2.1 · 全站实施候选（2026-09-20）

字体规范入口 `/next/foundations/typography` 提供 11 个角色实样、解析阅读/编辑与状态样本、真实窄屏预览和逐页检查清单。公共字号适配与浅色辅助文字修正已落实到组件、示例和工作区；coss 原始源码保持不变。后续业务代码使用语义字号，验证构建内的字体检查阻止局部字号回流。Windows / Apple 字形与 iOS 聚焦行为仍待真机确认。详见 `docs/typography.md`。

### 教师用例与解析流程 v0.1 · 候选（2026-09-20）

原站增加 `/next/use-cases`：7 类教师主要用例，分别说明目标、输入、成果、人工决策与后续业务。首先展开 6 个解析场景；逐场景记录必要追问、异常接续与验收点。用例不计入通用组件数量。

交互入口 `/next/use-cases/parsing` 复用 WorkbenchShell 顶部导航和 Prism/coss 控件。图片/PDF 本地材料检查、扫描导入说明、页序与范围、学生作答用途分流、手动解析阶段、局部失败重试、原稿对照、逐题核对和保存可操作。跨页题缺失阻止保存；重试保留未受影响人工编辑；原稿替换保留旧稿供对照；确认结果快照与后续草稿分离。每个用例的示例进度独立保存在本机，可从工作记录继续。

这是流程验证，不接真实 OCR、扫描设备、任务服务或题库。真实文件不上传、不参与固定结果生成；本地图片可预览，PDF 只登记元数据。Word/Excel 维持 Step2 范围。多份扫描材料独立分组执行仍为规划分支；本轮以一份材料的连续流程验证为主。不会自动进入批阅、生成题目或发布成绩。


### Agent 页面骨架 v0.1 · 候选（2026-09-19）

评审入口 `/next/skeletons/agent`，分类仍为「页面骨架」，不增加组件数。`AgentPageSkeleton` 从工作台现有 Agent stage 提取消息阅读/输入布局，与 `WorkbenchShell contentLayout="workspace"` 组合；对话目录复用总骨架上下文区域。`AgentComposer` 收回工作台已有 conversation/compact 变体与材料、工具插槽，default 行为保留。对话示例由独立 reducer 管理，不接模型或业务执行服务，不改原工作台会话存储。

新对话、连续对话、历史筛选、草稿与材料接续、回复中/停止/失败恢复可以操作。搜索仅覆盖本页示例；停止后不会被迟到的演示回复覆盖。演示题篮由总骨架和 Agent 页复用同一 fixture，工作台仍传入原全局题篮。本轮只推进第2项；第3—7项未启动，标准页面尚未启动；本轮评审内容增量发布到原组件站点。

### 总骨架 v0.3 · 候选（2026-09-20）

新增独立「页面骨架」与「标准页面」分类，组件数量仍为 80。骨架目录 `/next/skeletons`，教师工作台交互评审 `/next/skeletons/workbench`；标准页面仅登记阶段，尚未开始实现。原组件、两项应用示例及业务入口保留。

- 从 `Ashrum/ole-school-workbench@02109ef194d80f128be69265b65a5d7762456a74` 的 `PreviewHeader` 和全局题篮布局提取 `WorkbenchShell`，在本仓库 `a764bf6e5fb38d427e461d7144580093efb1263e` 基线上组合现有 coss/prism 组件。
- 公共壳包含组织、五项顶部导航、可选上下文侧栏、搜索、通知、AI 活动监视器、个人菜单、三主题与独立积分/token 插槽。业务数据和路由由调用方传入，演示夹具位于 `examples/skeletons`。
- `QuestionWorkPanel` 收回工作台已有的底部方向、初始/返回焦点、标题操作、页脚及关闭按钮公开属性，默认行为保持原状。没有改写题篮编辑/发布流程。
- v0.2 空间整改：按剩余工作区宽高收纳辅助区，固定入口保持可达；随后收纳上下文目录。题篮空态与有题状态共享尺寸预留；说明减量、正文前移，保持阅读行宽。
- 第1项总骨架保留；用户已批准开始第2项 Agent 页面骨架，第3—7项未启动。源码保留任务分支与 PR；原组件站点增加独立骨架分类，既有组件和应用示例保留。

验证：两个项目类型检查和构建通过；组件复用/coss/语义共 17 项测试、工作台 13 项 ID/题篮/导航回归通过。浏览器检查 1363px 桌面，以及实际页面在 1280/820/390px iframe 视口下的响应式表现、三主题、长组织名、长中文/公式、键盘搜索、通知已读与空态、任务五状态、积分/token 三状态、题篮展开和跨路由保留。修复搜索结果的焦点落点、HashRouter 跳过链接和 Flex 宿主宽度。实体移动设备、屏幕阅读器、真实后端与多用户服务未验证；不把构建通过视为用户视觉验收。


当前 80 个组件已通过评审，作为研发接入的源码基线。包含 54 个 coss 基础组件、16 个组合组件、10 个扩展组件、3 套主题和 2 个应用示例；应用示例独立于组件，不计入组件数量。

- [组件站点](https://intelligence-prism-ui.ashrvm.chatgpt.site/next) · [基础规范](https://intelligence-prism-ui.ashrvm.chatgpt.site/next/foundations)
- [源码接入与组件约定](docs/component-contracts.md)：依赖、主题、字体、目录与数据接口。
- [AI 原生开发流程 v0.1](docs/OLE_AI_NATIVE_DEVELOPMENT_WORKFLOW_v0.1.md)：Claude Code 监督与独立审核、Codex 构建；跨设备准备见第 11 节。在另一台电脑完成本机安装与授权后，从本仓库启动并先读取该文档。
- 本版在 v1.13.0 上统一评审状态和版本号，沿用已验证的视觉、交互与组件接口。
- 交付方式为源码复用，`private: true` 保留；未发布独立 npm 包。应用示例使用演示数据，业务服务、权限和持久化由接入应用提供。

### 启动现有组件站点

使用 Node.js 22.13 或以上和 npm。现有构建脚本依赖 Bash 与 GNU 工具，请在 Linux 或 WSL2 中运行。

```bash
git clone https://github.com/Ashrum/intelligence-prism-ui.git
cd intelligence-prism-ui
npm ci
npm run dev
```

生产构建运行 `npm run build`；自动回归运行 `npm test`。源码接入目标项目时，使用 [组件复用约定](docs/component-contracts.md) 中的依赖与主题设置。

#### Windows 本地验证

在仓库根目录使用 PowerShell 和 Node.js 24（本机验证版本为 Node.js 24.14.0、npm 11.9.0），先完成 `npm ci`。现有 `npm run dev` 使用 POSIX 环境变量语法；Windows 可直接启动 Vite。若 5173 已被占用，可改用其他端口（下例为 5174；`--strictPort` 在端口被占用时直接退出）：

```powershell
$env:WRANGLER_LOG_PATH = '.wrangler/wrangler.log'
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort
```

构建和测试在另一个 PowerShell 终端运行。以下设置对应 `sites-env.sh` 的本地运行目录与环境（Windows 环境变量名称不区分大小写），保留两项构建前检查；无需新增 `build:local`，也不依赖 Bash / GNU `timeout`。Linux 的 `npm run build` / `npm test` 继续使用原有有时限的构建脚本。

```powershell
$projectRoot = (Get-Location).Path
$runtimeRoot = Join-Path $projectRoot '.sites-runtime'
'home', 'npm-cache', 'xdg-config', 'tmp', 'wrangler/logs' | ForEach-Object { New-Item -ItemType Directory -Force (Join-Path $runtimeRoot $_) | Out-Null }
$env:SITES_ENV_READY = '1'
$env:SITES_PROJECT_ROOT = $projectRoot
$env:HOME = Join-Path $runtimeRoot 'home'
$env:XDG_CONFIG_HOME = Join-Path $runtimeRoot 'xdg-config'
$env:TMPDIR = Join-Path $runtimeRoot 'tmp'
$env:WRANGLER_WRITE_LOGS = 'false'
$env:WRANGLER_LOG_PATH = Join-Path $runtimeRoot 'wrangler/logs'
$env:MINIFLARE_REGISTRY_PATH = Join-Path $runtimeRoot 'wrangler/registry'
'NPM_CONFIG_CACHE', 'npm_config_proxy', 'npm_config_http_proxy', 'npm_config_https_proxy' | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
$env:npm_config_cache = Join-Path $runtimeRoot 'npm-cache'
$env:npm_config_audit = 'false'
$env:npm_config_fund = 'false'
$env:npm_config_update_notifier = 'false'
node scripts/check-math-font.mjs
if ($LASTEXITCODE -ne 0) { throw 'Math font check failed' }
node scripts/check-typography.mjs
if ($LASTEXITCODE -ne 0) { throw 'Typography check failed' }
node node_modules/vinext/dist/cli.js build
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
node --test tests/*.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
node node_modules/typescript/bin/tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw 'Type check failed' }
```

即使 `core.autocrlf=true`，`.gitattributes` 也要求清单中的 coss 源码以 LF 检出，并禁止转换固定哈希字体的二进制字节；哈希测试仍校验原始内容。已有 CRLF 工作副本首次采用规则时，确认这些文件没有本地修改后，仅重取 `components/coss/`、`hooks/coss/use-media-query.ts` 和 `lib/coss/segmented-control.ts`。`vendor/` 的说明与清单本身没有固定字节哈希，因此不扩大规则范围。先成功构建再运行完整测试，才能覆盖服务端渲染与生产公式模块；`dist/`、`.sites-runtime/`、`.wrangler/` 和 TypeScript 增量缓存均已忽略。

以下为历史迭代记录，当前范围与状态以上述可用版本为准。

## v1.13.0 — 层级与常用组件示例完善

- 修复 Select 横向“复核状态”标签与触发器贴合的问题，显式保留 12px 水平间距。
- 弹出式教材选择器移除深层缩进上限，以递进缩进、分支线和级数标记区分层级；增加独立 2／3／4／5 级数据切换，默认教材内容及 ID 保留。
- Avatar 展示 24、32、40、48、64、96px 六档尺寸；Card 增加内容、横向条目、指标、人物、选择与分组六种组合，均复用 coss 原始组件。
- Frame 原实现符合 coss：外框 4px、面板内边距 20px，保持标准比例并补充多面板示例。80 个组件入口不变，没有新增应用页面。

## v1.12.1 — 重复页面清理

- 80 个通用组件展示页与 54 个 coss 原始组件保持完整；应用示例由 10 个收敛为 2 个：题库与打印组合、统一学习支持流程。材料研读、Agent 工作区与基础规范保留。
- 撤下学生分析整页及矩阵、里程碑、负荷日历、答卷定位的重复应用示例；诊断、目标和计划合并到学习支持流程内。旧链接跳转到对应组件、图表目录或流程阶段。
- 删除撤下页面的专用代码、演示数据模型及对应测试，修正内部入口；学习示例状态不再挂载到全站。组件接口、图表能力、主题与基础控件未变。

## v1.12.0 — 四类通用图表补齐

- 新增成对指标、四象限散点、柱线组合；完善状态组成的数量/占比、六分类色、选择与缺测。独立组件以外部数据、单位、范围、分组和回调驱动，不增加业务分析整页。
- 组件目录 80 项（54 基础 / 16 组合 / 10 扩展），应用示例仍为 10 项。54 个 coss 原始组件保持不变，延续浅色、暖纸和深色主题。
- 各图提供学习、运营、边界与缺测输入和空数据切换；支持图形点击、悬停与数据表选择。柱线明确双轴单位并保留缺测断点；四象限阈值由调用方设置；相等的成对指标保留两个形状。
- 验证：类型检查、生产构建与 56 项回归通过；使用生产样式检查三主题、双轴单位、缺测断点、相等指标和图形/数据表回调。窄屏以 390px 浏览器容器核对，真实移动设备与真实业务数据未验收。
- 入口：`/next/components/status-composition`、`paired-dot-chart`、`quadrant-chart`、`combo-chart`。接口与边界见 [组件复用约定](docs/component-contracts.md)。

## v1.11.0 — 可复用组件与应用示例分离

- 保留 54 个 coss 原始组件，组件目录共 77 项（54 基础 / 16 组合 / 7 扩展）；题库、分析和学习工作流等 10 个入口单列为应用示例，不再计入组件数量。材料研读与 Agent 工作区保留。
- QuestionCard 仅传一道题即可使用；详情、选择、操作和分值覆盖均可选。题目数据、学生作答、评分规则与教材资料从外部传入；作答控件独立，评分复核支持不同题目及没有细分 rubric 的情况。模拟题目和作答移入 fixtures，工作流移入 examples。
- 指标、趋势、比较、状态组成、目标对照、筛选与数据表改用通用数据和事件接口。诊断证据、目标卡片、核验字段、任务列表、里程碑、负荷日历、文档区域和 Agent 输入/步骤进度独立复用；原应用示例使用这些组件。
- 新增 ECharts 6.1.0，按需加载 SVG 引擎，首批封装热力矩阵、散点和箱线。现有趋势/比较继续使用 Recharts。组件不固定学情口径、不推断诊断或达标、不内置目标 80%。提供两组用途不同的数据、空态及数据表操作入口。
- 原浅色 / 暖纸 / 深色、系统字体、STIX Two Math、coss 选择框与右侧 Drawer 继续使用。里程碑、日历、文档区域和 Agent 按用途归类。
- 接口与迁移说明：[组件复用约定](docs/component-contracts.md)。入口：`/next/components/question`、`evidence-matrix`、`scatter-chart`、`box-plot`；应用：`/next/examples/questions`、`student-analysis` 等。旧分析地址自动重定向。
- 验证：类型检查、生产构建、53 项回归通过，覆盖 77 个组件入口、10 个应用示例及全部 coss 源码散列。浏览器核对外部题目复核、题卡可选详情、图表数据替换/缺测/空态、三主题、390px 窄屏、试题篮导入组卷、纸面预览与 448px 非模态 Drawer。静态生产样式夹具存在 Vinext 预取提示，不据此宣称真实部署导航已做浏览器端验收；实体打印、真实移动设备及真实业务数据未验收。
- 当前仍是组件交互演示；没有新增真实模型、学情、扫描/OCR、业务持久化或正式组件包发布。

## v1.10.0 — 四类可操作的分析视图

- 新增学习证据矩阵、目标里程碑、学习负荷日历和答卷复核定位。组件入口共 75 个：54 个原始 coss 基础组件、16 项业务组合、5 项扩展。保留原图标目录与统计图表，并在单元分析页添加四类视图入口。
- 矩阵复用 SYN-A 的 18 条合成证据，以知识项 × 轮次排列，直接区分 0/2、1/2、2/2、缺测和待复核；点击单元格筛选既有证据表及右侧 Drawer。颜色仅辅助，行头在横向滚动中保留。
- 里程碑与日历复用 learningReducer、goalStatus、goalSourceValid、VerificationPanel、LearningDate、QuestionWorkPanel。提供隔离的预置演示与当前工作流两种来源；预置演示不写入外层 Provider，也不关联 SYN-A 历史。
- 里程碑展示来源、启用和两次独立作答核验，来源或标准变化使旧核验失效。日历在原 coss Calendar / DayPicker 上扩展日格，保留键盘行为；展示预计剩余分钟、超量、任务状态，支持改期、时长、跳过理由和截止提示。暂停、未启用及失效来源不计入可执行负荷。
- 答卷定位使用明确标识的排版示意和人工区域坐标，不声称真实扫描或 OCR。支持题号与纸面联动、跨页、缩放、类型筛选、同范围下一项、识别文本修正、需补扫及撤回。只有填写依据并保存才记为处理；核对记录不修改评分，补扫仍标为待跟进。
- 验证：类型检查、生产构建及 46 项回归通过，包括全部 75 个入口和 54 个 coss 源码散列。浏览器检查了生产样式下的浅色、暖纸、深色，矩阵下钻，1/2→2/2 目标核验与焦点回返，预置示例隔离，25 分钟任务跨日改期，答卷记录保存、跨页和 150% 缩放，以及 390px 日历。真实移动设备、扫描服务、持久化和实体打印未接入本轮验证。
- 新入口：`/next/components/evidence-matrix`、`goal-milestones`、`workload-calendar`、`answer-review-map`。分析组件继续按需加载，未添加依赖或更改 coss 原始组件。

## v1.9.0 — 图标与数据分析

- 新增图标目录（41 个明确导入的 Lucide 图标），支持中文用途/英文名称检索、业务分类、尺寸对照与导入代码复制。沿用系统字色，不修改 coss 控件内部图标尺寸。
- 新增 8 类分析组件与“学生单元学习分析”组合页：指标、趋势、比较、分布、目标对照、状态组成、筛选、证据明细。共 71 个组件入口：54 个 coss 原始基础组件、12 项组合、5 项扩展。
- 图表使用现有 Recharts 3，采用 shadcn Chart 的组合思路；分析模块按需加载。坐标、网格、提示框和系列使用现有三主题 token，不增加全局 SVG/字体覆盖。54 个 coss 源文件保持原样。
- 使用独立的 SYN-A 合成记录，不补造评价工作流中的作答。得分率以有效得分/有效满分加权；待复核与缺测排除，复核零分保留。趋势缺测断开，分布区间互斥，目标数值进展不自动等于达成。
- 筛选同步图表与明细；下钻保留总览范围，支持键盘明细入口和日期排序；证据复用无背景遮罩的 coss 右侧 Drawer。切换范围关闭旧证据。另提供加载、失败恢复与无数据状态。
- 验证：41 项回归覆盖全部 71 个入口和 coss 原始源码；浏览器核对正式 CSS 下的三主题、14px/20px 选择框、448px/0.45s 右侧 Drawer、筛选下钻、图标搜索与复制。当前为组件演示，实体打印和真实移动设备另行校样。
- 入口：`/next/components/icons`、`/next/components/student-analysis`。尚未接入真实学生数据、服务端存储、统计推断或 AI 诊断；热力图、知识网络和雷达图不属于此轮范围。

## v1.8.0 — 评价与学习支持

- 新增 4 项 coss 业务组合：`/next/components/evaluation`、`diagnosis`、`goals`、`learning-plan`。目前共 54 项官方基础组件、6 项组合和 1 项教材目录扩展，61 个组件入口。四阶段共享当前会话；刷新或确认重置后恢复初始示例。
- 评价复用现有 QuestionReview、QuestionContent 与 PointsField，抽离可控编辑状态。未评分保留为空；教师确认产生不可变评价版本，不把未提交修改当作诊断依据。
- 诊断候选引用具体学生、题目版本、作答与评分点，支持确认、排除和重新复核；诊断自身保留修订号。评价或判断变化后，关联目标与任务保留，但来源需要明确复核。
- 目标保留起点、来源、可编辑标准、截止日期和状态。标准变更及来源重新确认会使旧核验失效；任务完成进度与目标达成分别计算。两份独立新作答逐项通过是本演示约定，不声称是 OLE 规定。
- 学习计划支持生成去重、添加、搜索、状态筛选、改期、调序、开始、完成和带理由跳过；复用既有 Drawer、Table、Field、Select、Number Field、Calendar 和 Progress。暂停或来源失效时阻止任务状态推进，仍可改日期及备注。
- 右侧编辑面板不遮挡原工作区；步骤切换保留草稿并隐藏非当前步骤的抽屉。新作答核验按作答 ID 保存草稿；保存被拒绝时保留面板、输入和错误提示。目标达成被更正后转为重新验证，历史记录不删除。
- 原 OLE Outline 文档当前无法公开读取。本轮依据已有题目、教材目录、评分设计及用户明确提出的四个方向实现，待原规范可访问后继续逐条核对。学生与作答均为人工编写示例，没有连接真实学情、模型评分、扫描识别或后端存储。
- 验证：类型检查、生产构建及 36 项回归通过，覆盖 61 个组件入口和 54 个 coss 源码散列。浏览器使用真实生产 SSR、CSS 与交互脚本，走通评价至目标核验流程；实测步骤切换草稿、B/C 核验草稿、暂停拦截、重复生成、跳过理由和两份独立证据判定。三主题、14px 按钮/选择框与 448px 右侧 Drawer 已检查。移动触摸、真实学生数据及实体打印不属于本轮验收。

## v1.7.4 — 旧版移除与 coss 对齐

v1.7.4：
- 按用户最新要求移除旧版页面、组件、全局样式、旧字体和 OpenUI 试验接口，清除旧版导航入口；原站首页直接跳转 `/next`。当前只保留 coss 根布局，历史实现及评审通过版本记录回溯。
- 发布产物中已复现 Select 闭合值 16px / 24px 行高、选项 14px / 20px 行高的不一致，以及深色页面默认文字仍为深灰、字体继承旧阅读字体的问题。修复后恢复 coss 桌面 14px / 20px、sm/default/lg 高度 28/32/36px；题目正文和数学排版尺寸保持不变。54 个 coss 原始组件不修改。
- 试题篮与卷面设置从 coss Sheet 改为已有的右侧 Drawer，直接复用全宽滑入、圆角、阴影、滚动和关闭行为。保持非模态、页面可操作与实时预览；宽屏内容避让与 Drawer 的 450ms 时序一致，删除试题篮 Footer 的网格覆盖，恢复 coss 响应式排列。
- 此次视觉核对使用生产构建的 SSR 页面、合并 CSS 和实际交互脚本，而非只检查开发预览。实测普通按钮 14px/20px、字重 500、默认横向内边距 11px、图文间距 8px；输入框桌面 28/32/36px 与标签间距 8px 均与官方一致。检查三主题普通文字与公式、抽屉外搜索、80mm 作答区即时更新及嵌套 Escape。旧路由 404、首页跳转和 57 条组件路由均有回归验证。移动设备手势与实体打印仍需后续实测。

上一轮 v1.7.3：
- 完成五轮有不同目标的验证：三主题视觉与布局；菜单、试题篮与纸面预览交互；跨场景草稿状态；键盘与桌面重排；构建与自动回归。第五轮 56 项检查通过，包含全部 57 条组件路由、54 个 coss 原始组件散列和旧版内容保留。
- 修复“隐藏界面”丢失来源草稿展示参数的问题：保留编排题号、整题和小问分值，以及练习的隐藏分值设置。显示界面按钮与 Esc 共用返回逻辑，恢复来源题卡的视口位置及“更多”按钮焦点。
- 五轮之后继续优化材料研读：复核建议的“未追加／已追加待保存／已保存”由实际草稿与保存的备注计算。取消或手动移除后恢复追加入口，保留复核结果；不会重复追加，超过 500 字仍保留原备注。
- 基础规范的组件范围直接使用目录数据；外壳与基础规范的版本显示统一读取配置，避免独立文案落后。

验证证据：浏览器实测三主题公式与文字、无重复的桌面更多菜单、右侧 coss Sheet 开启时搜索、示例 6 题与实际空草稿隔离、A4 794px 物理宽度、实际草稿 3 页及独立页边距、10 分与编排题号保留、练习无分值、末题返回位置与键盘焦点、嵌套 Escape，以及建议追加／取消／保存／手动移除／超限路径。窄屏断点及减少动态效果做源码核对，未替代移动设备实测；实际 PDF／实体打印仍待校样。

上一轮 v1.7.2：
- 修复刷新后直接进入纸面预览没有示例内容的问题。默认“示例试卷 · 6 题”，使用现有六种题型和同一 QuestionPrint 渲染，不修改试题篮、试卷或练习草稿。
- “预览内容”可切换示例、当前试卷与当前练习，并显示题数；从编排区点预览严格进入对应草稿。各来源的排版设置独立保留。
- 空草稿就地提供“前往组卷／组练习”和“查看示例试卷”，不会自动填入示例；继续使用已确定的 coss 右侧 Sheet。

上一轮 v1.7.1：
- 试题篮与排版设置恢复为现有 coss Sheet 的最右侧推出样式，复用 SheetPopup、Header、Panel、Footer、ScrollArea 及原有动效；删除上一版文档流面板的自定义外壳与布局。
- 使用 `modal={false}` 和 `disablePointerDismissal`。只在这两个业务 Portal 内隐藏遮罩、让视口透传指针，保留主页面操作；coss 原始组件文件不改动。
- 宽屏为右侧 Sheet 留出空间，纸面按可用宽度显示，A4 测量与实际分页不变。窄屏遵循 coss 右侧覆盖样式，查看题目详情或导入草稿时收起，关闭后立即看到设置结果。
- 保留勾选、滚动位置、排版设置与纸面定位；同一时间只打开一个工具 Sheet。题目资料编辑继续使用原 Dialog。

验证：类型检查、生产构建、18 项相关回归通过，包含 coss 源码散列、旧内容保留和全部 57 条组件路由。浏览器验证右侧推出、外部搜索、勾选保留、嵌套下拉 Escape、实时作答高度与 A4 尺寸；窄屏做源码复核，未宣称移动设备验收。实际 PDF／实体打印仍待校样。

来源：[coss Sheet](https://coss.com/ui/docs/components/sheet)、[Base UI Dialog](https://base-ui.com/react/components/dialog)。本次仅做业务组合与局部非模态适配，继续遵循“已有组件 → 修改/组合已有 → 必要时全新创建”。

上一轮 v1.7（布局已由 v1.7.1 替换）：
- 排版设置与试题篮改为文档流内的工作面板，不使用遮罩、焦点锁定或外部点击关闭。复用 coss 控件，原始组件文件保持不变。
- 桌面试题篮与主区并行搜索、选题；勾选与面板滚动位置在收起后保留。查看已有题目会在主区定位，筛选外题目使用主区详情并可返回原筛选。
- 排版设置实时更新，修改小问留白或题前换页会定位对应内容。A4 实际宽度与分页独立于面板宽度，适合宽度／100% 仅改变屏幕预览，打印恢复 100%。
- 窄内容区的排版设置在预览上方；试题篮与主区明确切换。同一时间只显示一个工作面板，题目资料编辑仍使用独立 Dialog。
- 公式继续使用原生 MathML + 本地 STIX Two Math。截图化简式实测根号内 3 与外部 1 的底部一致；未施加数字位移、未替换数学字体。补齐数学字体的字重、字形、数字特性及字距隔离，避免继承普通 UI 字体样式。

验证：类型检查、生产构建及 56 项自动检查通过。浏览器已核验试题篮勾选保留、筛选外题目往返、导入草稿、并排纸面、80 mm 留白与对应内容定位，以及 700px 内容容器的上下布局与试题篮区域切换；这不是实体移动设备验收。实际 PDF／实体打印仍待校样。

上一轮 v1.6：
- 更多菜单按当前场景去重；分组操作改为“移至其他题组”。
- 隐藏界面仅收起导航与无关控件，显示界面／Esc 返回；不扩展课堂讲解系统。
- 题目资料使用 coss Dialog 按需编辑，教材关联与资料一起提交；取消不改变原题。移除列表中常驻表单。
- 详情使用所属题目内的次级背景，正文、公式、解析步骤、评分依据采用独立阅读层级。
- A4 纵向按物理尺寸实测分页；题面与作答区、紧凑题面、配套答题纸、教师答案四种输出。逐小问留白、字号、页边距与题前换页分别跟随试卷／练习保存。
- 每页保留内容版次、页码，题目保留 ID 与资料版本；这些是演示核对标识，不是正式扫描模板协议。
- 作答回看与教师复核按小问对应学生作答和评分点，区分初评、复核中和已记录得分。

验证：类型检查、生产构建及 56 项自动检查通过；浏览器核验菜单、取消编辑、隐藏／恢复界面、三主题、逐小问作答区、排版设置返回保留与答案分页。

打印验证边界：预览分页与交互可验证；当前 Cloud Browser 不提供 PDF 导出能力，实际浏览器 PDF／实体打印仍待验收。A3 拼版及扫描识别业务接入未在此版实现。


本轮用户授权完成一版组件库，并要求自行验证、继续修正后发布。当前基线优先于下面保留的历史流程与旧版设计说明。

- 新版入口：`/next`；规范：`/next/foundations`；组件：`/next/components/[slug]`。
- 应用模式：`/next/reading` 材料研读编辑、`/next/agent` Agent 工作区。
- 54 项 coss 官方基础组件、6 项场景组合（Date Picker / Question / Evaluation / Diagnosis / Goals / Learning Plan）和 1 项教材目录扩展均有可操作示例。旧目录的 59 项规划是历史记录，不等同于本版交付范围。
- 浅色 / 暖纸 / 深色一起提供；语义变量同时控制背景、标题、正文、公式、图标、状态与 Portal 浮层。
- MD 浮动标签、Beautiful UI 和旧智能曜彩组件样式均不进入新版。保留 shadcn 的组件源码方式，采用 coss 视觉与 Base UI 行为；Motion 负责应用状态动效。
- Agent 借鉴任务、上下文、执行步骤、停止、失败重试、结果确认的交互结构。本版为本地演示，不调用模型，不需要 API key 或额度。采用建议追加到人工备注，超出 500 字时不改变原文。

### 组件复用顺序

新增场景先查现有项目与 coss 官方可用组件；其次基于已有组件组合或修改；只有缺乏合适基础时才全新创建。注明复用来源与必要改动，沿用已定主题和控件尺寸，不引入另一套全局视觉样式。

### v1.5 题目详情与独立场景工作区

- 详情使用固定的“答案与解析 / 教学定位 / 题目档案”标签页。“详情”入口名称不变；教学定位先呈现知识点、解题方法、要求与完整教材路径。仅维护场景提供“编辑教材与知识点”，直接复用原范围选择器；取消不改变关联。
- 新增 `QuestionDetails`、`QuestionActions`、`QuestionDraftSettings` 与题目元数据。工具栏和菜单使用 coss 原始 Toolbar / Menu，选择与数值输入维持其标准尺寸；没有修改 `components/coss` 或依赖。
- 批量勾选、收藏、试题篮、试卷与练习分别维护。篮中候选导入草稿后继续保留，重复导入去重；移除、换题和改分只作用于对应草稿。复合题保留共同材料与全部小问。
- 试卷和练习各自设置标题、分组、时长、分值显示及答案可见策略，练习额外设置目标。分组重命名保留题目；删除分组才将题目移至第一组。支持组内上移/下移、拖动调序、跨组调整、保存/恢复本页草稿。
- “相似题”浏览与“换题”替换分开。候选解释同方法或相关知识点，不编造相似百分比。替换保留位置和分组，采用新题默认分值；工作区撤销说明具体对象并能恢复原分值。
- 维护资料、复制为新题、纠错均为当前页面演示。档案与各场景使用同一可用状态；不可用题不能新增入篮或导入，含不可用题的草稿禁用预览/打印。打印读取所选草稿，练习可以隐藏题面分值，教师答案版保留原题依据。
- 统计、来源和课程标准缺失时如实说明；不调用 AI，不向外部发送纠错，不实现真实题库写入、学生发布或后端保存。刷新后演示状态重置。
- 验证：类型检查、生产构建及 54 项自动检查通过，覆盖 57 个组件路由、coss 原始源码、旧版内容保留、教材目录、工作区隔离和评分约束。浏览器核验三类详情、教材搜索取消、双草稿导入、调分/换题/撤销、分组重命名、调序和保存恢复；三主题的题面、菜单与弹层可读性，以及不可用原因校验、档案同步、草稿打印阻断、纠错记录均已核验。实体打印的分页仍需最终校样。

### v1.4 题目多场景组合（历史记录）

- 入口 `/next/components/question`，场景选择覆盖题库选题、试卷编排、研读讲解、推荐与替题、纸面预览、作答与复核、题目审核。
- 复用 coss Select、NumberField、Input、Textarea、Checkbox、Button、Badge、Collapsible、Sheet、Dialog、Tabs 和已通过的教材范围选择器；官方原组件及依赖保持原样。
- `QuestionRecord` 将业务题型名称与五类作答模型分开；有序材料块支持文字、图形、表格交错。`QuestionPart` 独立保存作答模型、分值、答案、解析与评分点。旧四题保留，新增判断题与共享表格下的单选＋填空＋解答复合题。
- `QuestionCard` / `QuestionContent` / `QuestionSolution` 复用于多个场景。批量勾选与试题篮独立；筛选外勾选可见且可取消。复合题整组选用，分值按小问调整，原题分值保持不变。
- 编排支持调序、替换、移除撤销和恢复原题分值；替换保留位置并使用新题默认分值。审核草稿按题目保留，待审核或暂停的题目禁止新增入篮，已入篮题目提示并阻止页面打印操作。
- 纸面版按本卷顺序与分值展示，答案版明确保留原题评分依据；不自动按比例缩放评分规则。打印样式隔离导航、工具栏、浮层和页面装饰，白底深字，与屏幕主题独立；包含解答留白。浏览器打印分页及实体打印仍待使用方最终校样。
- 复核使用人工编写的示例作答，初评分 10/16。每个评分点独立计分，改分必须说明理由，支持维持原分确认、取消草稿与作答回看；草稿跨场景保留。
- 推荐理由、作答和审核为当前页示例；刷新重置。没有新增模型调用、学生在线答题、真实评分或后端题目编辑服务。
- 本轮验证：TypeScript、构建、52 项自动检查（含全部 57 个组件路由、旧版内容保留、coss 源码一致性、试卷与评分状态约束）通过。浏览器实际检查三主题、勾选/入篮分离、本卷改分/调序/撤销、首次原分确认、改分理由校验、跨场景草稿和审核保存。

### v1.3 题目组件

- 入口 `/next/components/question`，列表选题与展开阅读复用 `QuestionContent`。复用已有 coss Checkbox、Button、Badge、Tabs、Collapsible、Popover、Dialog 以及教材范围选择器，未新增依赖或改写官方基础控件。
- 四道自编数学样例覆盖单选、多选、填空、多小问解答题。提供参考答案与完整推导，编号、分值与内容身份分离；题干、图形、选项和小问不截断。
- 整题复选在题目外层，A/B/C/D 为只读语义列表，填空为可识别的静态空位；不做学生作答、题目编辑、自动批阅或模型调用。答案与解析明确命名并就地展开。
- 选项由内容指定适合的 1/2/4 列，容器宽度不足时退为 2/1 列；复杂或长选项使用一列。公式复用 STIX Two Math 与原生 MathML；超长独立公式可局部滚动，不缩小文字挤进整行。
- 几何图为可缩放的精确坐标 SVG，并明确标注动点为示意位置；颜色继承主题前景，放大图使用原 coss Dialog。原生图与公式随浅色/暖纸/深色成套变色。
- 同题的选用、已展开答案和已应用教材/知识点关联在两种视图间保留。仅在“教材与知识点”展开后呈现完整关联，可使用已通过的弹出范围选择器修改。示例选择不持久化到服务器。
- 教材目录两种形式已由用户通过，目录与详情页标为“已通过”；保留完整树与弹出选择器，不重新改动它们的设计。题目组件状态为待评审。

### v1.2.1 弹出式范围选择

- 在原 Tree 路由组合已有 coss Dialog、Select、Tabs、Checkbox、Input Group 与 Button；不增加基础组件数量，不改控件源文件和主题。原完整树示例折叠保留，独立选择互不影响。
- 常态显示教材、目录类型及已应用范围；按教材和目录分类，保留具体名称与上级路径。完整子树压缩为“全部 N 项”，部分选择列出具体项；支持就地移除、撤销，以及定位回对应章节细调。
- 弹层内第一层章节定位，当前章内其余层级默认展开，最大浅缩进 24px。窄屏复用 coss Select 定位章节，内容在固定面板内部滚动。示例课程与知识点均包含四层。
- 完整树复选逻辑与基础树共享 `useDirectorySelection`；仅存带教材/目录范围的叶项 ID，半选由完整子树派生。搜索平铺命中的具体项并展示祖先路径；批选只基于 `matchingIds ∩ leafIds`，命中分组需进入分组再选，避免误选未命中项。
- 面板跨教材/目录暂存选择；查看已选涵盖所有来源，调整可跳回原节点。只有“应用选择”提交，取消、Escape、关闭按钮或外部关闭均丢弃本次草稿；页面已应用范围不随临时勾选变化。本地演示不持久化选择到服务器。

### v1.2 教材目录

- 复用 coss Origin 的 Tree / 复选框 / 过滤示例，以 Headless Tree 1.5.1 承担层级、键盘和父子联动；来源与 MIT 许可见 `vendor/coss-origin-tree.md`。这是适配扩展，不计入 54 项原始 coss UI 基础组件。
- 新入口 `/next/components/tree`；教材选择、课程目录/知识点目录、中文搜索、多选与跨教材已选汇总共用一个场景。
- 搜索从完整数据查找，保留命中节点的祖先，命中父节点时展示后代。导航使用真实过滤投影，键盘不会进入隐藏项。
- 多选复用原库完整树的 `propagateCheckedState`，只保存叶子 ID，父级派生全选/半选；搜索不改变父级全选范围，不清除隐藏选择。
- 教材与目录类型分别保存选择和搜索；右侧按教材及类型汇总，课程与知识点不互相推断映射。父级重复勾选去重，叶子采用带范围前缀的稳定 ID。
- 长中文标题自然换行；箭头只展开、标题只定位、复选框选择范围；方向键、Enter 与空格可操作。控件继续使用原有 coss Select、Tabs、Checkbox、Input Group、Button、Scroll Area。
- 本版仅演示目录浏览与范围选择，使用精简示例数据，不含目录编辑、拖拽、跨目录自动映射或远程搜索。

### v1.1 常用 Particles

- 在原分类页补充 15 个示例区：Select 4、Combobox 3、Date Picker 3、输入组合 1、数字范围 1、Table 1、Dialog 2。每区提供固定上游 Particle 源码链接。
- Table 使用官方同版本的 `@tanstack/react-table@9.2.4`；稳定材料 ID、筛选重置选择、跨页勾选、批量标记、分页及加载/空结果/失败重试。
- Dialog 提供长内容、模拟提交等待与失败、草稿保留重试、未保存关闭确认。示例均不调用服务器或模型 API。
- 原始基础组件文件与三套主题保持不变；新增内容只在组合层实现，不将组合数量计为基础组件数量。

### 组件与主题约定

`components/coss/` 为官方 MIT 的 `apps/ui/registry/default` 源码，固定于提交 `e937becd2d5ffb5c621eed6f8b1f223cbb6051e7`。仅转换导入路径；`vendor/coss-manifest.json` 记录每个文件的上游与本地散列以及精确导入改写。未采用仓库内 AGPL 的 `packages/ui` 代码或全局样式。

实际应用与示例放在 `components/prism-next/`，不在官方组件文件中叠加页面样式。使用 `render` 组合 Base UI/coss 组件，不用 Radix 的 `asChild` 语法代替。

```tsx
import { Input } from '@/components/coss/input'
import { Field, FieldLabel } from '@/components/coss/field'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/coss/select'

const kinds = [{ value: 'example', label: '例题讲解' }, { value: 'concept', label: '知识梳理' }]

<Field className="max-w-48">
  <FieldLabel htmlFor="material-kind">材料类型</FieldLabel>
  <Select items={kinds} defaultValue="example">
    <SelectTrigger id="material-kind"><SelectValue /></SelectTrigger>
    <SelectPopup>{kinds.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup>
  </Select>
</Field>
```

不以原生 `<select>`、静态选项或仅修改外观的自制菜单冒充 coss Select。默认根字号 16px 时，桌面 sm/default/lg 的 Input 外框、Select、Button 高度为 28/32/36px；窄屏为 32/36/40px。保持内部字号、内边距、圆角、选中标记和焦点行为；通过字段容器控制宽度。

主题定义在 `app/(next)/next/theme.css`，色值索引在 `lib/prism-next/config.ts`。浅色严格使用正文背景 `#FFFFFF`、次级背景 `#F4F5F7`、分割线 `#E3E5E9`、正文公式 `#1F2328`、次要文字 `#6B7280`、禁用色 `#B0B4BB`。交互边框独立于装饰分割线，遵从 coss 输入轮廓。不得将禁用色用于字段标签和必须阅读的说明。

主题属性设置在 html，保证挂载至 body 的浮层获得同一套变量。图标继承当前前景；公式使用本地 STIX Two Math 和 MathML。主题选择与材料示例保存到当前浏览器；保存失败保留草稿并显示错误。

### 单一 coss 实现

用户已明确要求移除旧版。旧页面、组件、全局样式及阅读字体不再参与构建，`/` 跳转 `/next`；原 `/next/...` 地址保持不变。历史源码与评审只在版本记录中保留，不重新加入当前运行时。系统字体用于界面，本地完整 STIX Two Math 用于数学公式。

### 验证与维护

- `npx tsc --noEmit`：完整类型检查。Worker 声明由当前 Wrangler 官方 runtime 生成；真实 DB 绑定仍为可选。
- `npm run build`：有界生产构建与完整 STIX 数学字体校验。
- `node --test tests/*.test.mjs`：全部 80 条组件路由、2 个应用示例、首页跳转、旧路由下线、原始 coss 散列、教材目录、题目工作区、材料校验和 Agent 状态约束。
- v1.0 实际浏览器验证：三主题正文、MathML、选择浮层；coss三档外框实测28/32/36px；键盘选择与Esc；搜索过滤；对话框取消与归档焦点回退；OTP连续输入；中文日期选择；材料保存刷新、Agent采用/停止/失败重试、页签草稿保留。
- v1.1 实际浏览器验证：深色多选删除/搜索与分组搜索；浅色 Select 说明/多选；暖纸日期范围、快捷日期和月份同步；表格跨页选择、批量标记、筛选清空选择、空结果及失败重试；弹窗未保存确认、焦点回退、失败保留原文并重试成功；长内容滚动布局；搜索清除后焦点保留和数值范围报错。
- v1.1 类型检查、生产构建和 12 项针对性回归通过；未重复无关的旧功能全量浏览器验收。受控 HTTP 预览的 vinext 客户端导航遇到 Web Crypto 安全上下文限制并回退整页导航；路由仍可打开，该限制不计为生产 HTTPS 验收。
- 窄屏布局已做源码与尺寸审查，修复顶栏、长标题、长日期和动效越界；未将其宣称为真实移动设备验收。
- 浏览器检查记录以实际操作为准；源代码检查不替代视觉确认。v1.13.1 已由用户确认评审通过；后续新增或修改按实际范围评审。


完善设计规范，并逐项打磨组件的视觉、交互和动效。组件质量是主线；工程操作只服务于真实效果的实现和评审。

- 评审与交付站点：https://intelligence-prism-ui.ashrvm.chatgpt.site/
- 源码与变更记录：https://github.com/Ashrum/intelligence-prism-ui
- 原站首页直接进入 `/next`，旧版 `/foundations`、`/components`、`/review` 已移除。

## 站点—GitHub 工作流程

当前会话具备所需能力时，直接完成设计、实现、浏览器验证与原站发布；仅缺少某项具体能力时，才将该项交给 Work。不要让用户在会话之间反复搬运提示词。没有实际调用或发布结果时，不得声称任务已启动或站点已更新。

实现、真实视觉评审和交互修正由具备原站访问能力的执行环境闭环，不绑定特定历史对话。当前环境按实际能力完成规范、设计取舍、实现与源码审核；缺少实页访问能力时继续可完成的工作，明确尚未完成的视觉评审及具体阻碍。用户直接在原站体验和确认设计，不承担截图、录屏、下载和跨会话上传。

| 步骤 | 工作 | 完成条件 |
| --- | --- | --- |
| 1. 确定本轮修改 | 每轮聚焦一个组件或紧密相关的一组；从既有规范和真实实现中确定必要修改及取舍。记录在当前 PR，不新增报告。 | 明确改什么、保留什么、如何比较。 |
| 2. 建立站内候选 | 在当前任务分支、当前 PR 迭代；需要对照时使用临时 `/review/<component>` 路由，复用真实组件、字体、Token 和站点布局。候选样式局部隔离，不改变正式页面。沿用原站工作区及发布路径展示该候选。 | 站内临时页实际可交互；PR 记录已展示的提交与地址。只有代码提交不算发布完成。 |
| 3. 评审实际效果 | 在能操作原站的执行会话中直接查看并操作同一候选；使用相同文案、图标、密度和场景比较比例、层级、状态、动效和组合效果，按实际问题原位修正。视觉判断与自动化测试结果分别记录。 | 实际浏览器评审完成，用户在原站确认设计取舍；不等待跨会话图片或视频传送，不用源码或测试计数代替视觉判断。 |
| 4. 回填并清理 | 将确认的规则原位落实到公共组件、Token、正式组件页和 Foundations 中受影响的部分；删除临时路由、专属样式、入口及不再使用的候选代码。 | 正式组件具有已确认效果；必要状态示例留在正式组件页，不依赖临时页面。 |
| 5. 同步并发布 | 完成受影响组件的必要回归，在获准合并后合并当前 PR，通过原站发布链更新同一个站点；记录正式发布对应提交。 | GitHub 正式源码与站点发布版本对应，正式页面正常，临时入口移除。 |

### 同步与审核边界

- **GitHub 记录源码和版本，站点承载实际效果。**每次可评审修改及时提交当前分支，并更新同一站点的评审内容；不积累站外副本。PR 正文分别记录“代码提交”和“已发布提交”，未取得发布证据写“未验证”。
- 优先从任务分支发布站内临时页，不为展示未经确认的候选覆盖正式组件。若现有发布链只能使用 `main`，先记录该限制并取得仅上线隔离评审页的合并授权；该合并不代表设计获批。不擅自更换托管方式。
- GitHub 推送不自动等同于原站更新。尚未验证的自动发布关系不得作为流程前提；不调用未知发布接口，不借此新增部署体系。
- **不再要求人工传递评审媒体。**截图可以作为执行环境中观察页面的内部手段或必要留证，录屏可以辅助复盘，但不作为用户必须导出、上传或复制的交付物。媒体未跨会话传递不构成停工理由；需要视觉判断时由能够直接操作原站的会话完成，不跳过视觉评审。
- 仅有源码时只能做源码审核；读取 Work 结果时注明来源，不宣称当前对话亲自看过画面。GitHub 同提交可以用于授权环境中的原代码复现，但不因此另建站点、独立 HTML 或部署方案。未经验证，不声称浏览器会话、登录态或预览权限可在聊天间共享。
- 未经用户确认的视觉候选不自动晋升正式设计；用户确认设计并授权收口后，直接完成回填、清理和必要验证，不为每个小操作重复请示。合并及原站发布仍按已有授权执行。
- 不直接推送 `main`，不强制推送，不丢弃未说明的工作区改动。无冲突的提交变化不构成停工理由；只处理真正影响本轮任务的冲突。

### 旧版质量与范围（以下视觉规则已过期）

旧版曾采用的参考图方向：近白页面、炭灰文字、白色普通卡与浅中性灰指标卡，16px Card 圆角、无阴影；静态内容以表面、对齐和间距分组，必要控件边界保留。品牌曜蓝 `#339FF2` 保持不变，主按钮使用深阶操作蓝 `#0B6FCA` 配白字，默认对比度约 5.07:1；链接和小字号操作文字使用独立深阶色。组件页以一句用途说明直接进入示例，详细规则集中于可展开的说明；侧栏显示已有规范页，完整规划与成熟度在组件总览。智绯 `#E0438F` 可用于 AI 来源侧边，必须保留来源文字并独立表达复核状态；生长荧 `#C2F25B` 保留既有证据语义。出彩来自比例、色彩、排版、状态与动效，不使用无语义装饰竖线或厚阴影。

每轮只验证受影响组件及必要组合：鼠标与键盘、焦点、可用状态、异步反馈、密度、Reduced Motion。复用现有构建和测试，不因无关历史问题重复全量核验或重建工具环境；未验证项目明确保留。

Local-first 迁移、固定端口、跨平台部署、Storybook 补建、Hugging Face 迁移和 MCP 排查均不是本流程的前置任务。不重搭站点、不重组工程、不升级无关依赖；已有工具需要时复用。

## OpenUI 研究记录

早期 `/review/openui` 试验未证明优于普通 React 组合。该页面与服务端试验接口已在 v1.7.4 移除，不属于当前可用版本；真实生成和流式服务未接入。

## 工程模板说明（保留现有运行方式）

The following starter documentation describes the existing runtime. It does not introduce a local deployment requirement or a new hosting strategy.

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with
  `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper
  module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can
  prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned
  `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build and verify the rendered development-preview metadata
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

2026-09-20：AI 活动监视器按旧版离线教师工作台重新组合，只接收本人批阅/解析任务。支持筛选、阶段详情、执行状态与后续复核分别呈现；九种显式演示场景及手动推进由共享fixture提供。快捷设置图文容器已修复。总骨架和Agent骨架本轮同步原智能曜彩站点「页面骨架」分类，不另建站点。
