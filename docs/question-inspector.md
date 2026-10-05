# QuestionInspector · C1 组件契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。入口 `/next/components/question-inspector`，实现 `components/prism-next/question-inspector.tsx`。

## 复用依据

本批为 PO 2026-10-02 已批准的通用预览组件，不属于 Agent 执行组件，Beautiful UI 不适用。沿用并复核 [试卷冻结稿](paper-review-design.md) D7/D8 和[题目冻结稿](question-review-design.md)的检索记录。读取 Supervisor 本地缓存 registry（579 项）以及 particles `p-group-11`、`p-combobox-10/8`、`p-tabs-14/10`、`p-frame-1`、`p-meter-3`、`p-toolbar-1`，对照固定 coss Group、Combobox、Tabs、Badge、Frame、Meter、Toolbar 与既有 PaperPreview / DocumentRegionViewer。缓存路径为 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`。

采用相连导航、分组原生搜索、标准 Tabs/Badge、内容分区、量值与工具分组；不复制演示数据、计时器或局部视觉值。coss 没有完整三栏预览/成绩地图/单题反馈协议，因此从已冻结的宿主组合提取，不重新设计。连续纸张增强已有 PaperPreview，未另建目录。未联网刷新缓存，不声称本轮重新抓取上游。

## 公开 API

| 属性 | 契约 |
| --- | --- |
| `title`、`status`、`navigation` | 完整题号/题型标题与外部状态，previous/next/nextWrong 能力布尔值。 |
| `score` | `{value:number或null,max,text,denominator,judgement}`。文字原样显示；已知有限数值才显示 Meter，未知不当作零分。 |
| `points` | `{id,label,value,reason?,tone,status}`，原因含前缀也由宿主给；不从得分反算结论。 |
| `pointsEmptyText?`、`comparisonEmptyText?` | 对应数组为空且提供属性时，在该区标题下显示宿主文本；未传保持原 DOM，不自动推断“未提供”。 |
| `evidence`、`confidence?`、`knowledge` | AI 依据、置信度与标签；缺置信度显示“未提供”。唯一 AI 三色线沿用冻结令牌。 |
| `comparison` | `{id,label,text,value:number或null,max,ariaLabel}[]`；宿主负责班级人数、比例和计算口径。 |
| `actions`、`onIntent?` | `{id,label,primary?,disabled?,disabledReason?}[]`，宿主最多提供一个 primary；无回调或禁用时不可操作。点击仅发 ID，状态、得分不改变。实际禁用（显式 disabled 或缺 onIntent）且有非空 disabledReason 时，在动作区下方逐条显示“动作名：原因”，使用 text-ui-hint / muted 并以实例唯一 ID 的 aria-describedby 关联对应按钮；启用动作不显示原因。 |
| `onStep(delta)`、`onWrong`、`extraLink?` | 相邻题/下一错题意图；额外链接完全由宿主决定，不内置路由。 |
| `showEvidence?`、`showConfidence?`、`showKnowledge?`、`showComparison?` | 默认均为 true。false 移除对应内容及其标题；AI 依据整块隐藏时，块内置信度一并隐藏。仅隐藏置信度时，AI 依据仍在。隐藏班级对比同时移除其 extraLink 和空态文字。 |
| `density?` | `"default" \| "compact"`，默认 default；compact 只压缩主体、评分点列表、依据、班级对比和动作行间距/内边距，保留字号角色和标准控件尺寸。 |
| `scoreSource?`、`afterScore?` | ReactNode 插槽；来源放得分同行右侧，与原 judgement Badge 并列且可换行。afterScore 放数字行之后、得分 Meter 之前；原分、来源和理由完全由宿主传入。 |
| `afterPoints?`、`footer?` | afterPoints 放评分点之后、AI 依据/知识点之前。footer 为底部动作插槽，提供时替代旧 actions，不重复渲染；undefined/null/false 视为未提供。插槽自行提供按钮回调及禁用事实。 |

Frame/Header/Footer、ScrollArea scrollFade、Meter、Badge 和标准按钮保持冻结结构；text-score-display 仅用于本题得分。单个学生单题反馈，不承担全班分析的业务计算或教师评分保存。第二批可在外层组合全班分析并复用本组件。

## 验证与边界

组件页提供三主题、320px、长中文与公式夹具；自动测试覆盖受控事实、意图与渲染。冻结页默认及六种附加状态采用重构前 SHA-256，原有 `paper-review-v1.sha256` 不变。浏览器三主题、窄容器、焦点、触摸和视觉签名由 Supervisor 验收；不声明真实服务、移动设备或读屏器已验证。

## G1 · 数据不全的兼容扩展（2026-10-03）

复读本地缓存 registry 的 Button、Frame、Field 与 particles `p-frame-1` / `p-toolbar-1` 源码，以及固定 coss Button / Frame 和 Prism Button。继续用现有 Frame 分区与标准 Button，说明文字复用语义 `text-ui-hint` 和 `text-muted-foreground`；无需新组件或按钮尺寸覆盖。未联网刷新缓存；此为通用预览组件，Beautiful UI 不适用。

同类检查：evidence 与 knowledge 的“未提供”仍由宿主以内容传入，confidence 仍默认“未提供”；comparison 的条目 text 原样显示，未知数值不画 Meter。空 comparison 数组确有空标题，因此新增可选 comparisonEmptyText；两个数组本身仍为必传，未传新属性时保持原 DOM。组件页新增三主题 320px“数据不全”示例，包含评分点/班级对比空态与两条禁用原因；原长中文与公式夹具保留。

## G2 · 真实数据不全（2026-10-03）

复读 Supervisor 本地缓存 registry（`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`）的 Tabs / Collapsible / Meter / Frame 条目与 particles `p-tabs-10`、`p-meter-3`、`p-frame-1`、`p-toolbar-1`，核对固定 coss Collapsible / Meter / Frame。继续扩展现有组件：Tabs 承载字段、Collapsible 承载名单、Frame 承载主体；Meter 仅表达已知值，空态沿用语义文字。无适配缺口需要新组件，不复制 particles 演示样式或数据；通用题目预览不属于 Agent 执行组件，Beautiful UI 不适用。未联网刷新上游。

`bodyOnly?: boolean` 默认为 false。true 时仅输出原主体和班级对比区，不含头部标题/状态/导航、底部动作、aside、Frame 或内层 ScrollArea；主体不自建滚动区。宿主提供“当前作答”标题与语义容器，在同一 Frame / ScrollArea 内先组合 QuestionAnalysisPanel，再放 QuestionInspector bodyOnly。extraLink 仍由宿主决定，若不需要跳转应省略。原 required props 保持兼容，bodyOnly 时导航与动作属性不参与渲染；此模式不发导航/动作意图。

组件页保留 G1 空态与禁用原因示例，新增三主题 320px“数据不全 · 当前作答共用滚动区”，含长中文及 MathML；宿主只有一个 ScrollArea，默认完整模式 DOM 不变。

本轮浏览器访问 `http://localhost:5173/next/components/question-analysis-card` 被工具安全策略拒绝（该地址此前被用户拒绝授权），未绕过。已提供三主题窄容器夹具与自动化证据，实际交互、视觉、焦点、滚动和读屏器留待 Supervisor 复验；不以 SSR 冒充浏览器验收。检查数字见 `/tmp/prism-comp/Report-G2.md`。

## P18 · 批阅功能栏（2026-10-05）

本次扩展仍为通用查看组件。复读固定 coss Frame / FrameFooter / ScrollArea 和 Prism Badge / Button，沿用上文冻结稿记录的 particles `p-frame-1`、`p-scroll-area-4`、`p-toolbar-1` 的分区、单一滚动与标准动作组合。旧 Supervisor 缓存路径本轮已不存在，因此不声称重新读取或联网刷新 particles；未复制新上游代码、演示样式或 Beautiful UI。既有原语已满足需求，无需新增目录组件。

`bodyOnly` 未提供 footer 时继续仅输出内容片段，宿主可把它和分析区放在同一个 ScrollArea。显式提供 footer 时，bodyOnly 改为填满宿主高度的 flex 容器：一个正文 ScrollArea，footer 是其外部兄弟且不收缩；没有标题、导航或 Frame。宿主必须给定可用高度，且不再包裹第二个滚动区。完整模式原有正文 ScrollArea 与头部仍保留，footer 替代底部 actions。默认属性未改变任何现有示例输出。

查看态接入组合：`bodyOnly density="compact" showEvidence={false} showConfidence={false} showKnowledge={false} showComparison={false}`；用 scoreSource 显示真实来源，用 afterScore 显示已知原分/理由，afterPoints 组合 ErrorCauseReview 与宿主折叠资料，footer 放修改评分、修改错因、重新批阅的标准按钮。score.judgement、得分 Meter 和评分点标题继续按既有协议呈现；没有新增隐藏它们的 API，也不从总分推算点分或错因。

自动测试覆盖四类可见性、插槽顺序、两种外壳的单一滚动/底部兄弟结构、标准按钮尺寸保持以及显式默认值兼容；主任务另与 main 做逐字节 SSR 和冻结页回归。浏览器验收：按分工由 Supervisor 执行，覆盖新八状态示例 light/paper/dark × 380×844 与窄宽、长中文/公式、正文滚动时动作常驻、来源换行与键盘可达；不把源码结构断言当作实际滚动或视觉验收。
