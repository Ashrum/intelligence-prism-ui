# Score Review 人工评分 v0.1 · Builder 实现

PO 批准候选 #9；目录「内容与数据」，入口 `/next/components/score-review`。独立 Review 与产品验收另行确认。

## P16 · 评分扩展（2026-10-05，PO 批准实施）

扩展示例单独位于 `/next/components/score-review/extensions`，不新增目录条目；原 `ScoreReviewDemo` 文件和输出保留。新增能力全部可选，未传／显式 undefined 时与 main `429726b` 的原始 SSR 逐字节比较，不归一化 React ID。以下是本轮契约，后文保留历史实施记录与当时的验证范围。

### 复用取舍与离线检索

本轮完整核对固定 coss NumberField、Field、RadioGroup/Radio、Label、ToggleGroup、Input、Textarea、Frame，现有 ScoreReview/QuestionInspector/ReviewMeter 与 Workspace 只读宿主。检索本仓库 `docs/score-review.md`、`docs/paper-review-design.md`、`docs/question-inspector.md` 已记录的 particles：p-number-field-1/7/9/10（范围/步长）、p-textarea-5（固定标签）、p-toggle-group-4（互斥选择）、p-frame-1、p-meter-3/4（分区与量值）。这些是历史检索记录；原临时缓存本轮不存在，未联网重新获取 registry 或 particles，不宣称读取当前官网源码。

Beautiful UI Approval Card / Recommendation Card 的既有检索缺少逐点评分、理由必填与保存回执契约。本轮沿用其历史匹配结论，选择扩展 ScoreReview 并组合固定 coss；不复制 Beautiful UI 代码。逐点区为 ScoreReview 内部结构，不导出第二个可复用组件，避免将强耦合的合计、未作答和门禁另立协议。新增逐点 NumberField 和理由 RadioGroup 均使用标准尺寸；既有总分/按钮尺寸为了旧输出兼容保持不变。没有新增 CSS、令牌、依赖或 coss 修改。

### API

| 可选属性 | 契约 |
| --- | --- |
| `points: readonly ScoreReviewPoint[]` | 每项 `{id,label,maxScore,score:number\|null,uncertain?}`，id 唯一；受控数组按原顺序呈现。传入数组即由评分点合计决定总分，不分摊原 `score` 或 AI 分数。空数组、未齐、非有限/越界/不合步长或重复 id 使合计未知并禁止保存；小数合计去除浮点尾差，不把未知当 0。 |
| `pointStep` / `onPointsChange(points)` | 步长默认继承 `step`。编辑只规范本次输入到对应评分点范围与步长，发出完整新数组；由宿主回传。不触发保存或 `onScoreChange`。总分超过 `maxScore` 显示原因并禁保存。 |
| `pointsReadOnly` | 或缺少 `onPointsChange` 时显示只读列表：存疑问号、满分对勾、其余圆点；附可访问状态及“得分 / 满分”。未知显示未提供，不推定未满分。 |
| `reasonOptions` / `selectedReasonId` / `onReasonSelect(id)` | 选项 `{id,label,isOther?}`，id 与理由文本由宿主控制。选择预置项发 id 和 `onReasonChange(label)`，唯一 Textarea 只读显示该 label；选择其他发 id 和 `onReasonChange("")`，在同一 Textarea 输入正文。不会增加第二个理由输入。 |
| `requireReasonSelection` | 宿主声明必须选有效理由，与业务是否改分无隐式关联；需同时传 `reasonOptions`。其他选项无论此开关如何，都需非空白正文。未知选项 id 禁止保存。原 `requireReason` / `requireReasonOnChange` 仍兼容。 |
| `unanswered` / `onUnansweredChange(boolean)` | 受控标记／撤销意图。true 时显示和提交 0 分并注明未作答，锁定评分点和 AI 接受；不清空原评分点或总分草稿。false 回到原草稿。点击不会自动保存或写结果。 |
| `unansweredDisabledReason` | 只禁止标记／撤销按钮，并通过文字与 aria-describedby 解释，不代替宿主保存门禁。 |
| `scoreReadOnly` | 用文字替代总分输入、移除快捷给分，保留理由和保存；原样呈现宿主总分，不按编辑步长舍入。非有限/越界值禁保存；`points` 或 `unanswered=true` 自动启用总分只读。 |
| `saveDisabledReason` | 只阻止保存/重试，包括 Ctrl/⌘+Enter；在原 gate 显示宿主原因，不再退回“保存操作未提供”。不锁理由、评分点或导航。整体锁定仍由 `disabledReason/state` 提供。 |
| `actionLabels` | `save/retry/accept/previous/skip/markUnanswered/clearUnanswered`，未提供的项沿原文或新功能默认文案。只改按钮文字，事件与快捷键不变。 |

`ScoreReviewDraft` 保留 `{score,reason}`；仅传对应新属性时增加 `points`、`reasonOptionId`、`unanswered`，不改变旧调用的对象键。预置理由的保存文本来自选项 label；其他正文去除首尾空白。保存、重试、失败和历史仍由宿主维护。

派生／只读总分时，接受 AI 建议只发 `onAcceptAi(score)`，不伪造评分点或发 `onScoreChange`；宿主决定如何回传点值。`unanswered=true` 禁止接受建议，先撤销标记。动作名称不改变这一契约，即使宿主文案提到下一题也不会自行导航或保存。

### Workspace 接入对应（本轮只读，未迁移）

- `AiGradingReviewEditor.tsx` 评分点 section：用 `points={scoringPoints.map(p=>({id:p.id,label:p.label,maxScore:p.max,score:draft.pointScores[p.id]??null,uncertain:p.uncertain}))}`、`pointStep={0.5}`、`onPointsChange` 写回宿主 `pointScores`；AI 评分点需要静态呈现时传 `pointsReadOnly`。宿主 `aiReviewTotal/aiReviewDecision` 继续作为领域裁定，不移入组件。
- “标记为未作答” section：替换为 `unanswered/onUnansweredChange`；宿主仍记录 dirty、领域 action 和 0 分保存命令。原 `pointScoreNotice` 与纠正总分 handler 可移除，因为派生分没有输入框。
- 预置理由 ToggleGroup 与原组件理由透传：统一传 `AI_REVIEW_REASONS`（other 映射 `isOther:true`）、`selectedReasonId=draft.reasonChoice`、`onReasonSelect`、`reason=draft.otherReason`、`onReasonChange`、`requireReasonSelection=reasonRequired`；是否必须理由仍由 `aiReviewDecision` 声明。
- 原保存／重试回调不必为了禁用而撤掉：传 `saveDisabledReason=decision.error || (entry.handled&&!dirty ? '已保存；调整后可再次保存并留痕。' : undefined)`；running/stale 等整体禁用继续传 `disabledReason`。
- `navigationUnit` 的下一题／下一份语义由宿主组装 `actionLabels`；`task.review`、请求号幂等性、后继导航、持久化、脏态确认与回执继续留宿主。本轮不改 Workspace。

### 验证与移交

SSR/意图探针覆盖逐点合计与缺值、受控更新、半分/浮点、输入名称、未知只读状态、预置/其他必填、未作答保稿与撤销、门禁与快捷键、失败/保存中以及默认字节兼容。新示例提供可操作草稿、只读、保存中、失败、只禁保存、三主题 320px 长中文与公式。

浏览器验收：按分工由 Supervisor 执行。打开扩展 URL，检查逐点输入与方向键、唯一 Textarea 的预置/其他切换、未作答撤销保稿、只读外观、保存/重试及 Ctrl/⌘+Enter 门禁；覆盖 light/paper/dark、320px/390px/1440px 与长中文/公式。实际焦点、触摸、移动设备、读屏器、真实保存/模型及 Workspace 接入未验证。本节不继承历史浏览器拒绝为本轮结论。

## 实施前复用检索

- 已读取 `agent-item-reviewer.tsx`、`agent-review-queue.tsx` 与 Workspace `GradingAnswerEditor.tsx`。AgentItemReviewer 的 item/version/request/resolution 是版本化通用复核协议，draft 插槽适合业务编辑器；AgentReviewQueue 是同协议的集合视图。本次独立评分组合无需队列版本、查询或重启协议，强塞入旧组件会扩张旧契约。保持旧 API，共享 AgentMetaLine、AgentStatus、coss 表单/反馈原子；宿主仍可将评分组合接入现有复核流程。
- [Beautiful UI](https://www.beautifului.dev) 的 Approval Card 是执行前问答，Recommendation Card 是带置信信息的建议接受卡；均没有分值范围、半分步进、理由门禁与原卷定位。注册文件 `r/approval-card.json`、`r/recommendation-card.json` 本轮读取失败；未复制其代码，不将官网描述当成源码验证。
- 阅读固定 coss NumberField、Textarea、Card、Alert、Button；[particles](https://coss.com/ui/particles) 显示 510 项，在线 [registry](https://coss.com/ui/r/registry.json) 和 `p-number-field-10.json` 读取失败。只读检查既有缓存 `.../f9a352c5-7ad1-4d06-9d0d-08fc4599e165/scratchpad/coss/particles-src/` 的 p-number-field-1、p-number-field-10、p-textarea-5：采用步进组合和固定标签，不复制提交执行和等待计时器。缓存位于 `/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/`，不声称在线最新。
- 历史版本曾组合 PaperPreview / DocumentRegionViewer；R1 已移除内嵌原卷，现由独立全屏框架承载。OCR 使用 DraftMathPreview 的固定 Temml + MathML 渲染链路。AI 卡使用普通 Card 和明确 AI 标题，不铺设 AI 底色。
- 已查看 S35 同名前缀 PNG，并只读核对 5174 TeacherGradingManualReviewPage 210–233 行。Figma 只取功能，不复制色值、局部字体或布局像素。

## API 与事实边界

### 2026-10-02 P1：快捷给分与快捷键

- 本轮 registry 由 Supervisor 在线提供（coss registry 579 项，位于审核 scratchpad/audit/registry.json），Builder 读取 particles `p-number-field-7`（范围）、`p-number-field-9`（step）、`p-kbd-1`（快捷键提示）源码；复用固定 coss NumberField/Button/Kbd。Beautiful UI Approval/Recommendation Card 的既有检索不匹配评分门禁；本轮扩展已有组件，不复制上游代码。coss、依赖、令牌及组件目录不变。
- 可选 `quickScores?: readonly number[]`，缺省不渲染。过滤非有限、越界、非 step 整倍数并去重；满分端点不符合 step 也过滤。组标签“快捷给分”，按钮至少 48px，0 显示“0 分”，非零满分显示“满分 N”，aria-pressed 对应草稿。仅更新本地草稿/发 onScoreChange，不保存，受控与原编辑门禁不变。
- 可选 `shortcuts?: boolean`，默认 false。组件根 onKeyDown 处理 Ctrl/Cmd+Enter（保存或失败重试）、Alt+A（接受 AI）、Alt+左（上一题）、Alt+右（跳过），按钮内显示 coss Kbd。不挂 window，忽略组合输入、已处理事件、按键重复和额外修饰键。
- 快捷键复用按钮处理器及全部门禁：保存/重试检查理由、评分范围、回调、saving/saved、disabledReason；导航仍按原规则，saving/disabledReason 禁止，saved 可导航。未传新增属性的 DOM 与 main 8ba0cd6 快照一致，仅归一化 React 不透明 ID。
- 新增快捷操作夹具，三主题窄容器开启两项能力。自动检查覆盖过滤、草稿、受控/非受控、禁用/理由门禁和输入法；实际浏览器快捷键、读屏器交 Supervisor 验收。

2026-10-01 `fix/score-review-reason` 增量复用核对：重读固定 coss NumberField（含 Input 的公开 className）、Alert、Field/标签组合，以及既有缓存 particles 的 p-number-field-1、p-number-field-10、p-textarea-5。前两项提供步进/校验组合，后一项提供固定标签；没有本次回执与焦点交接协议。在线 [particles](https://coss.com/ui/particles) 与 [Beautiful UI](https://www.beautifului.dev) Approval Card / Recommendation Card 页面可读，registry 仍读取失败；没有复制上游代码或演示计时器。选择扩展现有 ScoreReview 的公开属性，保持 coss 原始字节不变。

从 `components/prism-next/score-review.tsx` 导出 ScoreReview、ScoreReviewProps、ScoreReviewState、ScoreReviewDraft、ScoreReviewRecord、normalizeReviewScore。

- `studentName / questionLabel / examNumber / eyebrow / progress`：宿主提供身份、可选小标及题项进度；缺失身份与考号显示「未提供」。`confidencePercent` 使用 0–100，缺失、非有限或越界值显示「置信度 未提供」；`confidenceLabel` 可显式传「低置信度」，组件不设置阈值。
- `answer`：OCR 原文，复用 DraftMathPreview；支持 `\(...\)`、`\[...\]` 公式，非公式文本保留。缺失显示「OCR 文本未提供」。组件不识别图片、不判断数学结论。
- **R1（PO 2026-10-03 批准）已移除 `paper` 属性及内嵌原卷渲染**；ScoreReview 始终只呈现评分面板。原卷迁移到独立全屏 `ReviewWorkspace` + `PaperPreview` 连续画布；评分、理由、保存回执与快捷键不变。`locationNotice` 仍仅显示宿主确认的事实，组件不自行定位或推定已取得原始笔迹。
- `maxScore` 必需且有限、非负；`step` 默认 1，必须有限且大于 0，支持 0.5。无效配置锁定评分编辑和提交，显示原因。`score` 非 undefined 时受控，null 为空；否则本地草稿从 defaultScore（默认 null）初始化。草稿钳制到 0..满分并按从 0 起的步长就近取值，满分端点可达；源 AI 分数与历史回执从不被钳制。
- `onScoreChange(number|null)` 接收规范化草稿；受控宿主须回传。`aiSuggestion` 提供 score/reason/basis；无效或不符合当前步长的 AI 分数保留原值展示但不可接受。接受建议先发 onScoreChange，再发 onAcceptAi(score)；非受控同步本地草稿，均不保存。
- `reason / defaultReason / onReasonChange` 支持受控与非受控理由；`showReason` 默认 false，`requireReasonOnChange` 默认 false。开启必填策略时总显示理由字段；比较 baselineScore（优先）或有效 AI 建议，分数不同或基准未知时要求非空白理由。返回基准分数后理由可选，不擅自清空已填写内容。
- `requireReason?: boolean` 默认 false；true 时每次保存及重试均需去除首尾空白后非空的理由，即使评分与基准相同。自动展示必填字段，按钮禁用且通过 aria-describedby 关联「请填写修改理由。」；与 requireReasonOnChange 取逻辑或。API 沿用 Workspace 适配命名与门禁语义；仅开启旧 requireReasonOnChange 时保留旧提示文案。
- 教师最终评分的 NumberFieldInput 通过公开 className 设置 `min-h-11 h-11 sm:h-11`，输入本体在基础及 sm 断点均至少 44px；多行按钮的 `sm:h-auto` 保留。
- `lastSaved?: {score:number;label?:string}` 是宿主已确认保存且审计已更新的事实，label 为可选题项标签。稳定挂载的 polite、atomic live 区域显示「[标签：]已保存 N 分，审计记录已更新」，读取回执分数而非当前草稿。它不锁定当前题项；出现、替换和清除（设 undefined）均由调用方控制，无计时器或点击推定成功。相同回执不会因草稿编辑而重挂载；连续相同文案需调用方先清除再提供。与 saved state 同时提供时只显示 lastSaved，state 的锁定规则仍有效；需分别展示上一题回执与当前题草稿时使用 ready state。缺少审计更新事实时使用原有 saved state，勿传 lastSaved。
- `questionId?: string / focusOnQuestionChange?: boolean`：开关默认 false；开启后已挂载组件的 questionId 变化且新标识非 undefined 时 focus 标题（tabIndex=-1）。首次挂载、同标识编辑、单独开启开关、标签文字变化均不抢焦点。宿主应将学生/题目/版本纳入稳定标识，使用受控评分和理由重置，保持组件实例；React key 重挂载属于首次挂载，不执行交接。不推断题目标识，不改草稿或导航。
- `state` 默认 `{kind:'ready'}`；saving 锁定编辑、接受建议、保存与前后导航；failed 显示 reason 和「重试保存」；saved 使用回执的 score，锁定编辑与重复保存。只有回执明确 `auditUpdated:true` 才显示「审计记录已更新」，否则明确审计状态未提供。`disabledReason` 锁定编辑与操作并显示原因。
- `onSave / onRetry({score,reason})` 只发当前有效草稿（理由去除首尾空白），共享同一门禁；失败后允许修改草稿再重试。重试的请求关联、幂等性与权限由宿主负责。缺少回调时对应按钮禁用；onPrev / onSkip 可选，均不自行导航。保存、审计、结果与历史不随点击推进。
- `history` 可选，提供过去的 id/score/reason/time；coss Collapsible 折叠展示，不从当前评分产生新记录。
- 宿主按复核对象身份设置 React key（学生/题目/版本变化时重新挂载）或受控重置 score/reason；保存请求的版本、权限、过期判断、离开未保存提示、审计执行与下一题选择均属于宿主。组件不导入 Workspace 类型或 Store。

## 夹具与验证

页面提供可编辑 62% 主面板、调整为 7 分的理由门禁、0.5 分非受控评分、保存中、失败重试、成功回执、未知置信度、公式作答、历史、320px 开关，以及三主题 320px 长中文。夹具动作只报告请求，不把点击变成保存成功。所有可换行的新增 coss Button 同时含 h-auto 与 sm:h-auto。

新增「每次保存必填理由 · 上一题保存回执」示例：保持基准分时验证必填门禁；独立「载入预设回执」和「清除回执」展示调用方控制；「切换题项（焦点交接）」变更标识、清除回执并重置受控草稿。保存仍只报告请求。

新增小文件测试覆盖范围钳制、步长、受控/非受控、接受建议、保存与重试理由门禁、保存中禁用、未知置信度、精确意图回调及独立评分面板/AgentItemReviewer/AgentReviewQueue 复用回归；真实构建路由测试检查所有状态、主题与禁用词。SSR 回调探针不等同 DOM 或浏览器验证。

**ESCALATE：本轮真实浏览器验收被自动审批拒绝。** Chrome 打开本地 5173 返回 browser security policy / user declined permission，未尝试绕过。三主题实际配色、320px 视觉与触控、键盘输入/焦点、公式客户端渲染、区域定位滚动与折叠交互仍待 Supervisor 浏览器验证。真实保存/审计服务、移动设备、读屏器与 Workspace 接入未验证。数字及原始日志见 `/tmp/prism-score/Report.md`、`checks/`。

本次增量验证另见 `/tmp/prism-score2/Report.md`、`checks/`：新增保存/重试强制理由、默认兼容、外部回执/清除/去重、输入本体尺寸类、焦点标识转换策略与新示例回归。焦点测试使用持久 ref/effect 探针与 focus spy，不代表真实 DOM 焦点验收；尺寸测试核对最终 SSR class，不代表浏览器实测。当前 Chrome 再次打开组件页被自动审批拒绝（user declined permission），未绕过；上述浏览器与真实服务验证缺口仍保留，待独立 Review。

## 2026-10-02 P2：Meter 适用性核对

- Supervisor 提供的本轮在线检索快照：`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/registry.json`（Builder 核对 579 项），同目录 `particles/*.json`；Builder 读取固定 coss 源码与下列对应条目，不声称重新联网获取。
- 核对 `p-meter-3/4`、固定 Meter/Progress 和 ScoreReview 当前源码：confidencePercent 通过 AgentMetaLine 呈现文字百分比，progress.current/total 也是题项文字，没有任何 Progress 组件或静态量值进度条。
- **未采用 Meter**：没有错误进度条待替换；增加条形量表会是额外展示能力，超出本轮条件性替换范围。置信度文字和题项复核进度保持原样，不把复核过程改成量值语义。组件与 demo 无 DOM/外观变化，原置信度/题项测试及夹具复用。

## P17 · 可选紧凑密度（2026-10-05）

复用检索：本轮离线复读固定 coss Frame / Collapsible / Button / Tooltip 与现有实现；对照本仓库冻结设计页记载的 particles `p-frame-1`、`p-collapsible-1`、`p-tooltip-3/4`、`p-tabs-10`。旧 `/private/tmp/claude-503/` 注册缓存未找到，以上是已记录的匹配依据，未联网刷新上游。Beautiful UI Approval Card / Recommendation Card 沿用 ScoreReview 的既有检索结论：不匹配题目标记或评分/错因/整卷统计契约。现有组件公开属性扩展足够，不新建目录条目、不复制第三方代码。

### API 与信息保留

- `density?: "default" | "compact"` 默认 default；省略、undefined 或 default 均保留旧 SSR。compact 只改布局：外 Card `gap-5 p-4 → gap-3 p-3`，AI Card `gap-2 p-4 → gap-1 p-3`，评分点/理由主区 `space-y-3 → space-y-2`，历史 `space-y-3 pt-3 → space-y-2 pt-2`。
- 身份头改为单行 flex 流，窄容器自然换行，保留 eyebrow、学生、题目、考号、置信度和进度。文字字号、字重不变，评分输入、快捷给分与操作按钮尺寸不变；原按钮内 Kbd 保留，不额外增加快捷键说明。操作说明合并为“接受建议或改分保存；人工修改保留审计记录。”，保留 gate 和回执。
- `showIdentity?: boolean` 默认 true，false 视觉隐藏身份头，保留 sr-only 标题与面板可访问名称，适合宿主顶栏已有完整身份的情况。启用 `focusOnQuestionChange` 时隐藏身份模式聚焦可见面板，其他情况仍聚焦标题；首次挂载不抢焦点。
- `standardAnswer?: string` 可选标准答案，使用现有 DraftMathPreview 公式链路；未提供时不新增区块，也不生成答案。default 模式直接呈现，compact 模式折叠呈现。
- `sectionsDefaultOpen?: Partial<Record<"answer" | "standardAnswer" | "history", boolean>>` 由宿主声明各区初始展开状态；compact 的作答、标准答案与历史缺省折叠，default 的历史沿用缺省折叠，作答/标准答案直接呈现。初始化后用户通过 coss Collapsible 切换；更新初始值不会重置现有展开状态，切换复核对象时宿主可用 key 重新挂载。折叠仅控制显示，不提交或清空草稿。
- 新区使用标准 coss Button 触发器、原生 Enter/Space、Tab 聚焦和 aria-expanded；展开时 aria-controls 对应内容 ID。compact 折叠动画遵守 reduced-motion。评分门禁、快捷键、历史和保存事实不变。

### 比较与浏览器移交

新增 `/next/components/score-review/compact`，原两个 demo 与扩展页保持不变；同一数据 default/compact 对照含长中文与公式、三主题和 320px 容器，另含宿主声明全部展开、showIdentity=false 示例。SSR 不能测高度：请在同一宽度与主题分别测 `[data-density-comparison] [data-score-review-panel]` 的高度（初始折叠、三个区全部展开各一次），记录 default/compact px 及差值；上述清单是已压缩/合并/折叠项，不作为高度实测值。

操作：Tab 到“学生原始作答 / 标准答案 / 历史记录”，Enter/Space 展开/折叠，确认焦点留在按钮、aria-expanded 更新且内容可达；核对默认折叠与宿主全开。调整为 7 分后理由门禁仍生效；输入理由，保存或 Ctrl/⌘+Enter 仅提示请求，未出现伪回执。三主题、320/390/1440px 检查身份自然换行、按钮字号尺寸、长中文/公式与 Tooltip。浏览器验收：按分工由 Supervisor 执行；真实服务、Workspace 接入、真机、读屏器与真实焦点/键盘行为未验证。
