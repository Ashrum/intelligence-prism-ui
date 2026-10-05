# Question Analysis Panel 本题分析面板 · C2 契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。
入口 `/next/components/question-analysis-panel`；实现 `components/prism-next/question-analysis-panel.tsx`。

## 复用依据

本批通用预览组件，非 Agent 执行组件，Beautiful UI 不适用。读取 Supervisor 审核缓存 registry（579 项）及 particles `p-group-11`、`p-combobox-10`、`p-tabs-10/14`、`p-select-20`、`p-meter-3`、`p-frame-1` 源码；路径见 [第一批复用依据](review-workspace.md#复用依据)。核对固定 coss Group/Combobox/Tabs/Select/Collapsible/Meter/Frame/Tooltip/Badge 与现有 ReviewSwitcher、QuestionRail、QuestionContent、PaperPreview。采用标准控件、分组搜索、量值与折叠组合；其余提取自冻结题目预览，不复制 particles 演示数据或视觉覆盖。本轮未联网刷新上游，未复制 Beautiful UI 代码。

## 公开属性与边界

statistics 已格式化的 mean/sd/d/discrimination/fullRate/zeroRate；distribution、pending、insight、errorAnswers 或 errorAnswersSlot、reasons、related 是外部事实。knowledge 有值时替换为专题、Meter、影响人数、证据量/清单和提醒；onKnowledge/onEvidence 仅发意图。

筛选、排序、统计计算、业务身份转换、权限、持久化、路由与意图回执由宿主负责。组件不导入 examples 或 Workspace 私有类型，不内置服务或计时器；没有给定的数据不作统计推断。辅助导出不另增目录条目。

## 验证

组件页提供 light/paper/dark、320px、长中文与 MathML；自动测试覆盖事实、意图及目录页。题目评审十态重构前快照与第一批试卷/旧 PaperPreview 快照保持一致，原冻结测试文件不改。
浏览器工具明确拒绝 localhost:5173（此前拒绝授权），未绕过。三主题、窄容器、实际焦点/滚动/缩放/旋转/触摸和读屏器未获本轮实测；没有真实服务验证。

## G2 · 真实数据不全（2026-10-03）

复读 Supervisor 本地缓存 registry（`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`）的 Tabs / Collapsible / Meter / Frame 条目与 particles `p-tabs-10`、`p-meter-3`、`p-frame-1`、`p-toolbar-1`，核对固定 coss Collapsible / Meter / Frame。继续扩展现有组件：Tabs 承载字段、Collapsible 承载名单、Frame 承载主体；Meter 仅表达已知值，空态沿用语义文字。无适配缺口需要新组件，不复制 particles 演示样式或数据；通用题目预览不属于 Agent 执行组件，Beautiful UI 不适用。未联网刷新上游。

| 可选属性 / 行为 | 契约 |
| --- | --- |
| `reasonsEmptyText / relatedEmptyText / evidenceEmptyText?: ReactNode` | 仅对应数组为空且提供文本时，分别出现在“主要失分原因”“关联知识点”“证据清单”标题下。证据清单空态在 knowledge 视图出现。 |
| `knowledge.rate?: number 或 null`、`rateEmptyText?: ReactNode` | 缺失、null 或非有限数值不画 Meter，显示宿主 rateEmptyText；已知 0 正常画 0% Meter。 |
| `knowledge.volumeText?: ReactNode` | 宿主传完整证据量文本，例如“12 分 · 1 道证据题”或“证据量未提供”，组件不加“分”、题数或其他单位。旧 volume 属性可省略，保留为原样内容回退，宿主需自行格式化。冻结页显式传原字符串。 |
| `statistics` | 全部值已是 ReactNode，可直接传“未提供”。fullRate/zeroRate 的数字或数字字符串保持既有百分号；非数字文案与已带 % 的字符串原样显示，不产生“未提供%”或重复百分号。 |

空态不是推断结果；reasons/related/evidence 数组仍由宿主必传，其他已知统计仍按原规则显示。

本轮浏览器访问 `http://localhost:5173/next/components/question-analysis-card` 被工具安全策略拒绝（该地址此前被用户拒绝授权），未绕过。已提供三主题窄容器夹具与自动化证据，实际交互、视觉、焦点、滚动和读屏器留待 Supervisor 复验；不以 SSR 冒充浏览器验收。检查数字见 `/tmp/prism-comp/Report-G2.md`。

## P20 · 自定义影响标签与补充统计（2026-10-05）

复用检索见 [ComparisonChart P20 记录](comparison-chart.md#p20-复用依据2026-10-05)：沿用已有统计 dl/dt/dd、语义字号与固定 coss Badge；不新增组件、视觉令牌、依赖或业务推断。

- `affectedLabel?: string`：仅替换知识点概况“受影响”，默认仍为“受影响”；不改既有人数/总人数格式。
- `supplementaryMetrics?: { label: string; value: ReactNode; hint?: ReactNode }[]`：题目视图追加在原四项统计之后，保留原顺序、样式及两列布局；知识点视图在证据量之后、状态与证据清单之前追加同样的统计布局。新增项允许换行，hint 沿用 text-ui-hint / muted 角色；0、未知文字和公式都原样显示，不计算任何指标。
- 未传属性或传空列表均不新增 DOM；原调用与 main SSR 逐字节一致。组件页新增三主题 320px 夹具，按钮切换题目/知识点，两者都可查看处理、错误影响、证据强度与本校差距及长中文/公式。
