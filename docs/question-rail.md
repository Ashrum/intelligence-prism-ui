# QuestionRail · C1 组件契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。入口 `/next/components/question-rail`，实现 `components/prism-next/question-rail.tsx`。

## 复用依据

本批为 PO 2026-10-02 已批准的通用预览组件，不属于 Agent 执行组件，Beautiful UI 不适用。沿用并复核 [试卷冻结稿](paper-review-design.md) D7/D8 和[题目冻结稿](question-review-design.md)的检索记录。读取 Supervisor 本地缓存 registry（579 项）以及 particles `p-group-11`、`p-combobox-10/8`、`p-tabs-14/10`、`p-frame-1`、`p-meter-3`、`p-toolbar-1`，对照固定 coss Group、Combobox、Tabs、Badge、Frame、Meter、Toolbar 与既有 PaperPreview / DocumentRegionViewer。缓存路径为 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`。

采用相连导航、分组原生搜索、标准 Tabs/Badge、内容分区、量值与工具分组；不复制演示数据、计时器或局部视觉值。coss 没有完整三栏预览/成绩地图/单题反馈协议，因此从已冻结的宿主组合提取，不重新设计。连续纸张增强已有 PaperPreview，未另建目录。未联网刷新缓存，不声称本轮重新抓取上游。

## 公开 API

| 属性 | 契约 |
| --- | --- |
| `sections` | 顺序由宿主给。每段 `{id,label,range?,summary?,layout:cell或row,pages}`，每页 `{id,marker?,items}`。marker 含 label/tooltip/ariaLabel；可省略页标，适应第二批全班视图。 |
| `items` | `{id,number,tone,value,denominator?,detail?,ratio?,ariaLabel,tooltip,content?}`。tone 为 neutral/success/warning/destructive，数字文字可为 ReactNode；ratio 为已知 0–100 百分比，未提供时不画值条。无内置“学生得分”或正确率判定。 |
| `overview`、`filters`、`footer?`、`empty?` | 分布段 count/tone、概览文字、筛选值/标签/计数/ariaLabel 全为宿主事实，过滤后不重算总量。 |
| `selected/onSelect`、`filter/onFilterChange` | 受控选择和筛选；列表按宿主已过滤的 sections 展示。 |
| `onLocate`、`onPage(id)` | Enter 请求定位；页按钮保持原生 Enter。↑↓ 顺序与当前 sections 一致，触发选择并聚焦，选中项随列表/容器变化滚入可视区。 |
| `collapse?`、`sort?` | 外部收起控件与排序控件；sort 位于 listbox 外。题号 / 正确率升序 / 正确率降序由宿主排序并回传，不在组件内计算统计。 |
| `panelId`、`label?`、`title?`、`filterLabel?`、`listLabel?` | 唯一面板 ID 与可访问名称。题号格/多行按钮沿用冻结稿尺寸例外，其余 coss 标准尺寸。 |

第二批可提供知识点之外的题目数据、百分比、区分度 Tooltip 与任意顺序；知识点树和跨视角证据协议不在本批实现。

## 验证与边界

组件页提供三主题、320px、长中文与公式夹具；自动测试覆盖受控事实、意图与渲染。冻结页默认及六种附加状态采用重构前 SHA-256，原有 `paper-review-v1.sha256` 不变。浏览器三主题、窄容器、焦点、触摸和视觉签名由 Supervisor 验收；不声明真实服务、移动设备或读屏器已验证。

## C2 全班正确率呈现

同目录辅助 `QuestionRailClass` 复用现有目录项；`sections[{id,label,summary,layout,items}]` 接收已排序项目。item 沿用 QuestionRailItem，增加 `kind?` 和 `marker?`；value 为格内第二行，detail 为行内区分度文字。marker 的判断由宿主给定。overview 外部给段数与文字；sort 为外置 Select 插槽，bodyOnly 用于宿主 Tabs 与 ReviewRailList。未传新参数的 QuestionRail 行为与第一批快照不变。

## G2 · 真实数据不全（2026-10-03）

复读 Supervisor 本地缓存 registry（`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`）的 Tabs / Collapsible / Meter / Frame 条目与 particles `p-tabs-10`、`p-meter-3`、`p-frame-1`、`p-toolbar-1`，核对固定 coss Collapsible / Meter / Frame。继续扩展现有组件：Tabs 承载字段、Collapsible 承载名单、Frame 承载主体；Meter 仅表达已知值，空态沿用语义文字。无适配缺口需要新组件，不复制 particles 演示样式或数据；通用题目预览不属于 Agent 执行组件，Beautiful UI 不适用。未联网刷新上游。

全班模式 `QuestionRailClass` 的 item.value 已是 ReactNode，直接支持任意短文本，例如 `{value:'未提供', tone:'neutral', ariaLabel:'第 2 题，正确率未提供', tooltip:'正确率未提供'}`；缺少比例时省略 ratio，不传假 0。新增三主题 320px“数据不全”示例验证第二行文字，未新增 API 或修改组件实现。

本轮浏览器访问 `http://localhost:5173/next/components/question-analysis-card` 被工具安全策略拒绝（该地址此前被用户拒绝授权），未绕过。已提供三主题窄容器夹具与自动化证据，实际交互、视觉、焦点、滚动和读屏器留待 Supervisor 复验；不以 SSR 冒充浏览器验收。检查数字见 `/tmp/prism-comp/Report-G2.md`。

## P17 · 可选题目图标标记（2026-10-05）

复用检索：本轮离线复读固定 coss Frame / Collapsible / Button / Tooltip 与现有实现；对照本仓库冻结设计页记载的 particles `p-frame-1`、`p-collapsible-1`、`p-tooltip-3/4`、`p-tabs-10`。旧 `/private/tmp/claude-503/` 注册缓存未找到，以上是已记录的匹配依据，未联网刷新上游。Beautiful UI Approval Card / Recommendation Card 沿用 ScoreReview 的既有检索结论：不匹配题目标记或评分/错因/整卷统计契约。现有组件公开属性扩展足够，不新建目录条目、不复制第三方代码。

### 题目图标标记

`QuestionRailItem.marker?: QuestionRailMarker`，类型为 `{ icon: ReactNode; ariaLabel: string; tooltip?: ReactNode; tone?: ReviewTone }`。宿主传非交互图标（如 lucide CircleAlert/CircleHelp）和非空 ariaLabel；无内置待办判定。图标绝对定位在题目按钮右上角，10px 容器，颜色沿用 neutral / success / warning / destructive 语义文字令牌；不改变按钮大小、网格间隔、题号或得分。cell 和 row 都支持。ariaLabel 追加到题目可访问名称；tooltip 追加到原题提示，缺省采用标记 ariaLabel，不在格内增加状态文字；图标 aria-hidden 避免重复朗读。

`QuestionRailClassSection.items` 使用 `Omit<QuestionRailItem, "marker"> & {kind?: ReactNode; marker?: boolean | QuestionRailMarker}`：旧 `marker: true` 仍只表示原 cell 的 info 圆点，原 aria/tooltip 不变；对象值启用新图标，cell/row 均支持，两者互斥。页级 `pages[].marker` 仍是页码定位协议，与题目级标记无关。省略标记时两种栏 SSR 与 main a30c077 逐字节一致。

新示例 `/next/components/question-rail/extensions`；原 demo 输出保持不变。浏览器检查两种栏 × cell/row × light/paper/dark × 320/390/1440px，悬停或聚焦显示题目提示及完整标记说明；↑↓ 选题、Enter 定位只发请求，图标不消失。复核长中文/公式提示、图标不遮题号和得分、格子尺寸与原例相同。浏览器验收：按分工由 Supervisor 执行。
