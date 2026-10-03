# Question Analysis Card 题目分析卡 · C2 契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。
入口 `/next/components/question-analysis-card`；实现 `components/prism-next/question-analysis-card.tsx`。

## 复用依据

本批通用预览组件，非 Agent 执行组件，Beautiful UI 不适用。读取 Supervisor 审核缓存 registry（579 项）及 particles `p-group-11`、`p-combobox-10`、`p-tabs-10/14`、`p-select-20`、`p-meter-3`、`p-frame-1` 源码；路径见 [第一批复用依据](review-workspace.md#复用依据)。核对固定 coss Group/Combobox/Tabs/Select/Collapsible/Meter/Frame/Tooltip/Badge 与现有 ReviewSwitcher、QuestionRail、QuestionContent、PaperPreview。采用标准控件、分组搜索、量值与折叠组合；其余提取自冻结题目预览，不复制 particles 演示数据或视觉覆盖。本轮未联网刷新上游，未复制 Beautiful UI 代码。

## 公开属性与边界

question/contentRecord 沿用 QuestionRecord；QuestionHeading/QuestionContent/QuestionSolution 渲染唯一题面，textSize="ui"。options 含外部 ratio/percent/count/high/low/correct/distractor/students；groups 为外部分组、代表图和名单；related、markedPoints、filter 与意图回调由宿主给。QuestionAnalysisDetails 提供三个页签，QuestionAnalysisSummary 承接 L1 节选按钮。

筛选、排序、统计计算、业务身份转换、权限、持久化、路由与意图回执由宿主负责。组件不导入 examples 或 Workspace 私有类型，不内置服务或计时器；没有给定的数据不作统计推断。辅助导出不另增目录条目。

## 验证

组件页提供 light/paper/dark、320px、长中文与 MathML；自动测试覆盖事实、意图及目录页。题目评审十态重构前快照与第一批试卷/旧 PaperPreview 快照保持一致，原冻结测试文件不改。
浏览器工具明确拒绝 localhost:5173（此前拒绝授权），未绕过。三主题、窄容器、实际焦点/滚动/缩放/旋转/触摸和读屏器未获本轮实测；没有真实服务验证。

## G2 · 真实数据不全（2026-10-03）

复读 Supervisor 本地缓存 registry（`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`）的 Tabs / Collapsible / Meter / Frame 条目与 particles `p-tabs-10`、`p-meter-3`、`p-frame-1`、`p-toolbar-1`，核对固定 coss Collapsible / Meter / Frame。继续扩展现有组件：Tabs 承载字段、Collapsible 承载名单、Frame 承载主体；Meter 仅表达已知值，空态沿用语义文字。无适配缺口需要新组件，不复制 particles 演示样式或数据；通用题目预览不属于 Agent 执行组件，Beautiful UI 不适用。未联网刷新上游。

| 可选属性 / 行为 | 契约 |
| --- | --- |
| `options[].highLow?: {high?: number; low?: number}` | 两组可各自缺失；只显示给定组，真实 0 仍显示。兼容旧 `high? / low?`，新字段同名值优先。全部缺失时不渲染高低组文字，不补零。 |
| 选项布局与空名单 | options 非空时只给 QuestionContent 的派生记录设置 `optionColumns: 1`，不修改宿主记录；无统计时保留原题布局。count=0 只显示数量/百分比统计，不渲染名单展开控件、空名单或高低组标签。 |
| `groups.description?: ReactNode` | 位于“作答情况”标题下。既有 errors 可传一组“答错”，correctLabel 传“答对”；答错在前，答对默认折叠，展开仍发 onIncludeCorrect。无需新增双组组件。 |
| `pointsEmptyText?: ReactNode` | Card 及 Details 都接受；q.points 为空且有文案时，显示在“评分点”标题下。Details 未传 scoring 时使用同一评分点渲染；自定义 scoring 时宿主负责内容与空态。 |
| `teaching? / archive?: AnalysisDetailItem[]` | Card 透传 Details；条目 `{label:string,value?:ReactNode,emptyText?:ReactNode}`，只有 null/undefined value 才取该项 emptyText，0 和空字符串不替换。空数组/省略不生成虚构字段。教学定位可传知识点、教材章节等；档案传编号、题型、分值、来源、版本、可用状态等，缺失值由宿主明确给“未提供”。 |

答案/解析仍来自 `question.record`；`contentRecord` 只覆盖题面。related 仍负责知识点导航，teaching 决定详情字段文字。移除组件内写死的章节、来源、版本与状态；冻结页在 `examples/question-review/question-digital-card.tsx` 显式传回原文本与原顺序，保持已有渲染。

本轮浏览器访问 `http://localhost:5173/next/components/question-analysis-card` 被工具安全策略拒绝（该地址此前被用户拒绝授权），未绕过。已提供三主题窄容器夹具与自动化证据，实际交互、视觉、焦点、滚动和读屏器留待 Supervisor 复验；不以 SSR 冒充浏览器验收。检查数字见 `/tmp/prism-comp/Report-G2.md`。
