# Score Review 人工评分 v0.1 · Builder 实现

PO 批准候选 #9；目录「内容与数据」，入口 `/next/components/score-review`。独立 Review 与产品验收另行确认。

## 实施前复用检索

- 已读取 `agent-item-reviewer.tsx`、`agent-review-queue.tsx` 与 Workspace `GradingAnswerEditor.tsx`。AgentItemReviewer 的 item/version/request/resolution 是版本化通用复核协议，draft 插槽适合业务编辑器；AgentReviewQueue 是同协议的集合视图。本次独立评分组合无需队列版本、查询或重启协议，强塞入旧组件会扩张旧契约。保持旧 API，共享 AgentMetaLine、AgentStatus、coss 表单/反馈原子；宿主仍可将评分组合接入现有复核流程。
- [Beautiful UI](https://www.beautifului.dev) 的 Approval Card 是执行前问答，Recommendation Card 是带置信信息的建议接受卡；均没有分值范围、半分步进、理由门禁与原卷定位。注册文件 `r/approval-card.json`、`r/recommendation-card.json` 本轮读取失败；未复制其代码，不将官网描述当成源码验证。
- 阅读固定 coss NumberField、Textarea、Card、Alert、Button；[particles](https://coss.com/ui/particles) 显示 510 项，在线 [registry](https://coss.com/ui/r/registry.json) 和 `p-number-field-10.json` 读取失败。只读检查既有缓存 `.../f9a352c5-7ad1-4d06-9d0d-08fc4599e165/scratchpad/coss/particles-src/` 的 p-number-field-1、p-number-field-10、p-textarea-5：采用步进组合和固定标签，不复制提交执行和等待计时器。缓存位于 `/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/`，不声称在线最新。
- 组合已合并 PaperPreview / DocumentRegionViewer；OCR 使用 DraftMathPreview 的固定 Temml + MathML 渲染链路。AI 卡使用普通 Card 和明确 AI 标题，不铺设 AI 底色。
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
- `paper?: PaperPreviewProps`：完整复用既有原卷组件和区域定位；省略时只呈现评分面板。960px 容器以上左右排列，否则原卷在上、评分在下。`locationNotice` 仅展示宿主确认的定位事实；真实宿主可传「左侧已定位原始笔迹区域」，窄容器宜使用不含方位的文案。当前页面仅有区域框，明确说明原始笔迹图像未接入，不将框选当作已获得扫描原件。
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

新增小文件测试覆盖范围钳制、步长、受控/非受控、接受建议、保存与重试理由门禁、保存中禁用、未知置信度、精确意图回调及 PaperPreview/AgentItemReviewer/AgentReviewQueue 复用回归；真实构建路由测试检查所有状态、主题与禁用词。SSR 回调探针不等同 DOM 或浏览器验证。

**ESCALATE：本轮真实浏览器验收被自动审批拒绝。** Chrome 打开本地 5173 返回 browser security policy / user declined permission，未尝试绕过。三主题实际配色、320px 视觉与触控、键盘输入/焦点、公式客户端渲染、区域定位滚动与折叠交互仍待 Supervisor 浏览器验证。真实保存/审计服务、移动设备、读屏器与 Workspace 接入未验证。数字及原始日志见 `/tmp/prism-score/Report.md`、`checks/`。

本次增量验证另见 `/tmp/prism-score2/Report.md`、`checks/`：新增保存/重试强制理由、默认兼容、外部回执/清除/去重、输入本体尺寸类、焦点标识转换策略与新示例回归。焦点测试使用持久 ref/effect 探针与 focus spy，不代表真实 DOM 焦点验收；尺寸测试核对最终 SSR class，不代表浏览器实测。当前 Chrome 再次打开组件页被自动审批拒绝（user declined permission），未绕过；上述浏览器与真实服务验证缺口仍保留，待独立 Review。

## 2026-10-02 P2：Meter 适用性核对

- Supervisor 提供的本轮在线检索快照：`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/registry.json`（Builder 核对 579 项），同目录 `particles/*.json`；Builder 读取固定 coss 源码与下列对应条目，不声称重新联网获取。
- 核对 `p-meter-3/4`、固定 Meter/Progress 和 ScoreReview 当前源码：confidencePercent 通过 AgentMetaLine 呈现文字百分比，progress.current/total 也是题项文字，没有任何 Progress 组件或静态量值进度条。
- **未采用 Meter**：没有错误进度条待替换；增加条形量表会是额外展示能力，超出本轮条件性替换范围。置信度文字和题项复核进度保持原样，不把复核过程改成量值语义。组件与 demo 无 DOM/外观变化，原置信度/题项测试及夹具复用。
