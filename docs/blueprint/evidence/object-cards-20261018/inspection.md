# P85 · 对象卡片复用、范围与盘点

日期 2026-10-18，main 基线 `21560ebca1e4e8b45fe57125b8fdb619bece113c`，任务分支 `fix/blueprint-object-card-ink`，开工工作树干净。

## 取舍与检索

采用任务方案 (b)。已有 Prism `BpFrameCard` 的 frame / head / title / status / dot / actions 已满足视觉要求；先核对其 TSX 和 P79 CSS，再核对两个 Agent 组件的实际 DOM。冻结 coss Card 只有普通卡片骨架；沿用其语义与行为，不修改原件。particles 沿用 [P79 的离线检索记录](../cards-20261016/inspection.md)：本地已有 particles 中无 Card / p-card，未联网刷新 registry，未引入第三方代码。既有 Prism 规则足够，无新增组件、令牌、字号或依赖。

没有选择 (a)，因为引入随主题变动的 JSX 封装会改变 SSR / ID / DOM 与焦点顺序，且现有 Agent 预览仅设 DOM 主题，不自动建立主题 React context。CSS 方案直接使用现有主题边界，涵盖嵌套预览。P85 新增块复制既有 BpFrameCard 的适用声明，专项测试逐项与 P79 真实规则比较，防止两份规则漂移。

现有 `[data-slot="card"][data-agent-arranger-view]` / `[data-slot="card"][data-agent-relation-view]` 是稳定根锚点。标题、状态和顶层操作容器为 bp-* 规则的 CSS 别名，**没有真的增加 bp-* class 或将操作移动到标题栏**；这是方案 (b) 保留核心 SSR 字节与交互顺序的具体选择。操作容器复用 `bp-card-actions` 规则；两者原有正文后操作保持，内层逐题操作不套对象级规则。

编排标题右侧仍是 `structure.snapshot !== undefined` 决定的当前 / 历史身份，保存状态不移入身份栏。关系图无整体状态，不补造状态。现有 aria-hidden SVG 适配为 10px 装饰方点，文字保持；无新增 live region、计时器或业务判断。

## 宽度核对

两个根 Card 没有外侧 margin。编排默认 p-5 / compact p-3，关系图默认 p-4 / compact p-3；这不是卡片外框缩窄的来源，但使原先标题位于框内。本轮外框按宿主内容盒 100% 展开，仅标题抵消相应 20 / 16 / 12px 内边距并使用 P79 的 12px 标题内边距，正文密度保持。保留根 padding 是为了让关系图 ResizeObserver 的 contentRect 与既有窄容器判断一致。

只读核对 Workspace `RecordStructureArranger.tsx` / `RecordRelationGraph.tsx`：组件密度为 compact，关系图与编排在宿主组合层排列。宿主侧图纸 / 包裹容器宽度另行处理，本轮不修改 Workspace，也不使用跨出 Card 的外层负边距。真实几何对齐待 Supervisor 浏览器确认。

## 独立对象卡片盘点

依据本仓库 Agent 目录与运行时源码；“候选”表示可承载独立成果，不等于已在当前 Workspace 成果图纸展示。另只读核对 Workspace 的 RecordStructureArranger、RecordRelationGraph、FormalPaperView、RecordFrozenReport、RecordPlanBuilder 等实际调用点。以下逐项说明，未列为本轮处理的组件均未改。

| 组件 | 同一规则的适用判断与本轮决定 |
| --- | --- |
| AgentStructureArranger | 已有独立编排身份和标题，当前 Workspace 实际使用；本轮处理。 |
| AgentRelationGraph | 已有独立图及版本，当前 Workspace 实际使用；本轮处理，右侧无状态。 |
| AgentArtifactPreview | 独立成果预览，FormalPaperView 实际使用；原则适用，暂不处理。与执行组件共享 AgentSurface，不能用共享 surface 选择器一并重绘；需单独锚点和 inline 范围，待 PO 确认下一轮。 |
| AgentArtifactOutput | FormalPaperView / RecordFrozenReport 的输出配置与输出记录混合；只读输出对象适用，整个生成表单是否套对象标题待 PO 决定，暂不处理。 |
| AgentStructuredContent | 独立结构对象，原则适用；头部还含第二个保存状态与能力说明，需明确主状态选择，待 PO 决定，暂不处理。 |
| AgentPlanBuilder | RecordPlanBuilder 实际使用；计划对象原则适用，但确认、执行与保存状态有多个层次，待 PO 决定主状态后另轮处理。 |
| AgentObjectViewer | 独立对象完整查看适用；已有 minimal 呈现用于宿主嵌入，统一加外框会重复框线。待 PO 确认 full / minimal 的范围。 |
| AgentDocumentWorkspace | 文档是独立对象，原则适用；编辑区域、版本与工具条需一并设计验收，暂不扩大，待 PO 决定。 |
| AgentSlideWorkspace | 文稿是独立对象，原则适用；分页、演讲稿与保存事实并存，待 PO 决定标题状态后另轮处理。 |
| AgentImageCanvas | 图像是独立对象，原则适用；标题、画布与工具区尺度另需验收，暂不处理，待 PO 决定。 |
| AgentAudioTranscript | 音频及转写为独立媒体对象候选；播放、转写、保存状态不能合并推断，待 PO 决定。 |
| AgentVideoTimeline | 视频及片段是独立媒体对象候选；同样需区分播放 / 处理 / 保存，待 PO 决定。 |
| AgentMaterialPack | 独立素材包，原则适用；已有标题编辑和集合版本，待 PO 决定只读包与编辑包适用范围。 |
| AgentInteractiveDemo | 独立可交互演示候选；预览 / 运行 / 参数是工具行为，是否归入成果对象待 PO 决定。 |
| AgentCalcTool | 计算工具及输出候选；不将输入工具整体等同已产出的成果，待 PO 决定外框层级。 |
| AgentSimulationLab | 仿真工具及结果候选；不把运行态等同成果状态，待 PO 决定。 |
| AgentSubjectEditor | 学科内容对象候选；嵌入式编辑与独立成果边界需确认，待 PO 决定。 |
| AgentCollectionBasket | 候选集合 / 输入工作集，AgentWell 呈现；不自动视为已产出的独立成果，本轮不处理。 |
| AgentMaterialExtractor | 材料提取操作面板，标题是操作任务而非独立成果对象；本轮不处理。 |
| AgentExecutionConfirmation | 行动确认，不是对象，不套墨线对象标题。 |
| AgentExecutionProgress | 执行进展，不是对象，不套墨线对象标题。 |
| AgentExecutionResult | 执行回执，可包含成果，但回执本身不是成果对象；保留执行语义。 |
| AgentMetricSummary / AgentDistributionMatrix / AgentEvidenceDrilldown | 分析内容、矩阵和证据片段由宿主报告组合，不自动给每片段加对象外框。若未来独立版本化为报告，再由 PO 定义对象层。 |
| AgentSuggestionSet / AgentPathPriority | 建议与优先级片段，不自动当作独立固化成果；本轮不处理。 |
| AgentObjectPicker / AgentScopeBuilder / AgentContextSummary | 输入范围与上下文，不套成果对象标题。 |
| AgentFileInput / AgentCaptureScan / AgentContentInput | 输入采集，不套成果对象标题；独立原件预览可另用现有 BpFrameCard。 |
| AgentParameterConfig / AgentConstraintBuilder / AgentTemplatePicker / AgentCandidatePicker | 参数、约束与选择器，不套成果对象标题。 |
| AgentChangeSet / AgentReviewQueue / AgentItemReviewer / AgentExceptionHandler | 变更审核及异常流程，不批量改成成果对象卡。 |
| AgentResourceRetriever | 检索工作区，不套成果对象标题；其选中资源的独立预览另看 ObjectViewer。 |
| BpFrameCard | 已具有所需标题 / 状态 / actions；直接复用，无需修改。 |
| BpSectionCard | 同一对象里的大题 / 分节，不属于独立对象；保持分节标题。 |
| PaperPreview / QuestionSummaryRow / QuestionContent | 内容呈现层，不增加第二重对象外框；已有独立对象卡包裹时保持原内容。 |

以上待 PO 项不阻塞已授权两个组件，也不代表自动批准后续批量适配。

## 验证边界

专项含基线 16 个默认调用 × 核心三主题 = 48 组 SSR 字节摘要比对；五主题 × 无外层及五种外层 × 16 调用 = 480 组 CSS/SSR 规则探针，检查标题、状态、操作、宽度规则、内部 Card 排除和伪元素。13 项回退变异。探针不模拟浏览器层叠、像素布局或键盘焦点。

浏览器验收：按分工由 Supervisor 执行。没有本轮截图；Workspace 同步、真实服务、真机、读屏器和实体打印未验。当前工程命令与退出码见 [engineering.json](engineering.json)，Builder 不自我批准。

## 收尾生成物

STATUS 回填后全量中有 2 项 guide 字节检查失败（2247/2249）；不是既有失败。使用 `node scripts/sync-blueprint-guide.mjs` 同步必要的 blueprint-guide.json 与 public STATUS 下载副本，再重建并重跑五项。原始失败保留为 pre-guide-tests.log / pre-guide-engineering.json；最终 engineering.json 为修复后结果。未修改 guide 的源规范或既有测试。

## P85b · 2026-10-18 增量

复用现有 P85 选择器和 `.bp-card-body { padding:20px }`，无新增组件或来源。默认标题到正文布局间距统一为 20px；compact 采用编排卡原内边距 12/20 的比例，统一 12px。关系图默认水平 padding 16px 保持，不用其 12/16 比例另造一套正文节奏。

编排卡标题行用 `margin-block-end` 覆盖原 space-y-2 的标题后边距；关系图标题是 flex 子项，用 `calc(目标间距 - var(--spacing) * 原 gap 倍数)` 抵消已有父级 gap。没有修改父级 gap，因此后续正文行距、内容块间距与 ResizeObserver 内容盒均保持。margin 使用逻辑属性，覆盖原标题 margin:0 与 Tailwind space-y 的同轴边距。所有选择器保留两蓝图作用域和嵌套非蓝图预览排除。

专项使用真实 SSR 的标题层级与父级 gap 类校验间距算式，在 4px / 6px spacing 尺度下检查 default / compact 的两组件一致；新增四项逐组件、逐密度回退变异。工程探针不是浏览器测量；可见字形上沿受字体行盒影响，需 Supervisor 按清单量取元素布局间距并视觉复验。历史 P85 检查记录见 p85-engineering.json / p85-targeted.json / p85-mutations.json，本轮记录见 engineering.json / targeted.json / mutations.json。

## P85c · 空列表原因与修复

`AgentRelationGraph` 的标题后 ul 是能力说明列表（id 后缀 `-abilities`）。遍历 view/filter/edit-node/edit-edge/layout：supported=true 时只有非空 trim 后 reason 入列；supported=false 时使用 reason 或“暂不支持。”；相同原因合并能力名称。全部能力支持且无说明时输出空 ul。它是 Card 的直接 flex 子项，高度为零仍多产生一个 gap。

复用现有 P85 CSS 作用域和隔离选择器，以 `> h3 + ul:empty` 精确隐藏空列表；不新增组件、不改 TSX，也不改变有内容时的行为。default 修复前正文行盒间距为 4 + 16 × 2 = 36px，修复后为 4 + 16 = 20px；compact 修复前 0 + 12 × 2 = 24px，修复后 12px。编排对应 20 / 12px，差值均 0。有内容的列表第一行仍为 20 / 12px。

这里计算的是标题条底边到首行行盒顶边，非字体墨迹顶边。若沿用 Supervisor compact 实测约 3px 的字体内部偏移，修复后文字顶边约 15px，default 约 23px；这仅是条件推估，不是 Builder 浏览器实测。实际距离及 ≤4px 门槛交 Supervisor 按 Range 测量。
