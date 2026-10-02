# Knowledge Rail 知识点栏 · C2 契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。
入口 `/next/components/knowledge-rail`；实现 `components/prism-next/knowledge-rail.tsx`。

## 复用依据

本批通用预览组件，非 Agent 执行组件，Beautiful UI 不适用。读取 Supervisor 审核缓存 registry（579 项）及 particles `p-group-11`、`p-combobox-10`、`p-tabs-10/14`、`p-select-20`、`p-meter-3`、`p-frame-1` 源码；路径见 [第一批复用依据](review-workspace.md#复用依据)。核对固定 coss Group/Combobox/Tabs/Select/Collapsible/Meter/Frame/Tooltip/Badge 与现有 ReviewSwitcher、QuestionRail、QuestionContent、PaperPreview。采用标准控件、分组搜索、量值与折叠组合；其余提取自冻结题目预览，不复制 particles 演示数据或视觉覆盖。本轮未联网刷新上游，未复制 Beautiful UI 代码。

## 公开属性与边界

sections/selected/onSelect/onEvidence；filter 插槽由 ReviewRailFilter 组合。bodyOnly 用于宿主 Tabs；ReviewRailList 负责 ↑↓、Enter、滚入可视区。名称、secondary、status、evidence.label、rate 均来自宿主。

筛选、排序、统计计算、业务身份转换、权限、持久化、路由与意图回执由宿主负责。组件不导入 examples 或 Workspace 私有类型，不内置服务或计时器；没有给定的数据不作统计推断。辅助导出不另增目录条目。

## 验证

组件页提供 light/paper/dark、320px、长中文与 MathML；自动测试覆盖事实、意图及目录页。题目评审十态重构前快照与第一批试卷/旧 PaperPreview 快照保持一致，原冻结测试文件不改。
浏览器工具明确拒绝 localhost:5173（此前拒绝授权），未绕过。三主题、窄容器、实际焦点/滚动/缩放/旋转/触摸和读屏器未获本轮实测；没有真实服务验证。

## G2 · 真实数据不全（2026-10-03）

复读 Supervisor 本地缓存 registry（`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`）的 Tabs / Collapsible / Meter / Frame 条目与 particles `p-tabs-10`、`p-meter-3`、`p-frame-1`、`p-toolbar-1`，核对固定 coss Collapsible / Meter / Frame。继续扩展现有组件：Tabs 承载字段、Collapsible 承载名单、Frame 承载主体；Meter 仅表达已知值，空态沿用语义文字。无适配缺口需要新组件，不复制 particles 演示样式或数据；通用题目预览不属于 Agent 执行组件，Beautiful UI 不适用。未联网刷新上游。

- `KnowledgeRailItem.rate?: number | null`；缺失、null 或非有限值时不画 ThinBar、不写 0%，原样显示可选 `rateEmptyText?: ReactNode`；已知 0 仍显示值条和 0%。
- `emptyText?: ReactNode`：所有 section.items 均为空时给出宿主整栏说明；普通模式覆盖既有“没有符合筛选的条目”，bodyOnly 模式也支持。未传新属性的普通模式保留原提示；bodyOnly 保留原空 DOM。
- 证据仍完全由宿主提供，组件不生成知识点关联或统计。示例包含未知得分率及“本卷题目尚未关联知识点”。

本轮浏览器访问 `http://localhost:5173/next/components/question-analysis-card` 被工具安全策略拒绝（该地址此前被用户拒绝授权），未绕过。已提供三主题窄容器夹具与自动化证据，实际交互、视觉、焦点、滚动和读屏器留待 Supervisor 复验；不以 SSR 冒充浏览器验收。检查数字见 `/tmp/prism-comp/Report-G2.md`。
