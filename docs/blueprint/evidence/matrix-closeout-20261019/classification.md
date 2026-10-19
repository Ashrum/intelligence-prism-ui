# BPM1d · 当前分类增量

18轮、158义务：63可自动化 / 21需目检 / 74不适用或覆盖。P87新增4自动、1目检、2覆盖/范围外；另为P76移动夹具和原生缩放各加1目检。详细判据、原文行号和来源见 [机器账本](checklist-classification.json) 与 [本轮分析](bpm1d-analysis.md)。以下为原BPM1c分类历史。

# BPM1c · 原始清单逐项分类

59 项可自动化、18 项需目检、72 项不适用或由其他检查覆盖，共149个验收义务。另将非验收正文保留在 JSON 的 sourceContext；此上下文行数不混入义务计数。旧78项交互另列，全部自动化。

所有分类均为执行计划，不是浏览器通过证据。

## P73

原始来源：`docs/blueprint/evidence/r1-20261016/browser-checklist.md`。

- **P73-prompt-extra · 可自动化**（原文行 9）：两个变体：打开模型后宿主关闭可用性，入口与菜单移除；来源/命令键盘选择；Shift+Enter；白图发送单外框。
  - 自动探针/截图准备：`prompt-extra`；路由：`/next/components/agent-components/prompt-bar`。
- **P73-native-ime · 不适用或已被其他项覆盖**（原文行 10）：中文 IME 实体候选确认需系统输入法，本轮 Chromium 自动化不等于该验收；列为范围外且不关闭原义务。
- **P73-prompt-covered · 不适用或已被其他项覆盖**（原文行 10）：模型关闭后来源/命令选择由 prompt-extra 执行；没有把 IME 伪造为键盘 Enter。
  - 对应项：`round:prompt-extra`。
- **P73-prompt-reading · 需目检**（原文行 11）：加载附件与长中文公式；核对发送、范围、材料、语音入口及附件删除的焦点边缘、换行和正文。
- **P73-prompt-focus · 可自动化**（原文行 11）：白图 2px 单 outline / offset 2px；其余主题记录原样式。
  - 自动探针/截图准备：`prompt-extra`；路由：`/next/components/agent-components/prompt-bar`。
- **P73-prompt-portals · 可自动化**（原文行 12）：逐个打开附件、模型、来源、命令、听写/语音说明，检查本地主题与根容器。
  - 自动探针/截图准备：`prompt-portals`；路由：`/next/components/agent-components/prompt-bar`。
- **P73-old-message · 不适用或已被其他项覆盖**（原文行 13）：气泡浅底及链接同主题 ring 由 P78 替代；沿 P78 当前预期复验。
  - 对应项：`round:message`。
- **P73-question-card · 可自动化**（原文行 14）：当前 Agent 总览追问单选及补充输入，仅反馈已选择、尚未执行。
  - 自动探针/截图准备：`question-card`；路由：`/next/components/agent-components#existing-agent-inputs`。
- **P73-execution · 可自动化**（原文行 15）：六态/card/inline 的展示与资格在 P84 确认夹具及正式组件页复验。
  - 自动探针/截图准备：`execution`；路由：`/next/components/agent-components/execution-confirmation`。
- **P73-shared-portals · 不适用或已被其他项覆盖**（原文行 16）：由 17 个 overlay 探针及 scoped-controls、scoped-toasts、isolation 组合核销对应浮层；无容器宿主业务分支不算通过。
  - 对应项：`group:interactions`, `group:isolation`。

## P74

原始来源：`docs/blueprint/evidence/portal-20261016/browser-checklist.md`。

- **P74-scoped-controls · 可自动化**（原文行 11）：三种外层核心 × 本轮局部主题：Select 键盘、ObjectPicker 选择、Dialog trap/初始焦点/嵌套 Esc。
  - 自动探针/截图准备：`scoped-controls`；路由：`/next/components/menu`。
- **P74-picker-covered · 不适用或已被其他项覆盖**（原文行 12）：输入高二并选中候选由 scoped-controls，实际 Portal 祖先/边界由 overlay-local-picker 检查。
  - 对应项：`round:scoped-controls`, `overlay:local-picker`。
- **P74-submenu-covered · 不适用或已被其他项覆盖**（原文行 13）：overlay-local-submenu 保留真实节点；第一次 Esc 移除/隐藏子菜单且回 submenu trigger，第二次回原 trigger。
  - 对应项：`overlay:local-submenu`。
- **P74-local-dialog-covered · 不适用或已被其他项覆盖**（原文行 14）：scoped-controls 与 overlay-local-dialog-select 覆盖初始聚焦、陷阱、两次 Esc。
  - 对应项：`round:scoped-controls`, `overlay:local-dialog-select`。
- **P74-scoped-toasts · 可自动化**（原文行 15）：三队列主题、局部卸载不搬至 body、重入不恢复；三种外层核心逐一检查。
  - 自动探针/截图准备：`scoped-toasts`；路由：`/next/components/menu`。
- **P74-unmount-covered · 不适用或已被其他项覆盖**（原文行 16）：由 scoped-toasts 同一探针执行卸载、外层/全局保留和重入。
  - 对应项：`round:scoped-toasts`。
- **P74-scoped-chart · 可自动化**（原文行 17）：两图首色随本地主题与外层核心，保留全局主题。
  - 自动探针/截图准备：`scoped-chart`；路由：`/next/components/menu`。
- **P74-portal-visual · 需目检**（原文行 18）：真实打开局部对话框、子菜单；检查长中文/公式、浮层翻转、焦点圈、阴影与纸面比例。
  - 自动探针/截图准备：`visual-portals`；路由：`/next/components/menu`。
- **P74-overlay-regression · 可自动化**（原文行 20）：额外五页实际可达 Popup 打开/Esc；不把初始页面 200 当操作通过。
  - 自动探针/截图准备：`overlay-regression`；路由：`/next/components/dialog-layout`。
- **P74-workspace · 不适用或已被其他项覆盖**（原文行 24,26,27,28,29,30,31）：Workspace 接线是另一仓任务，原 1–6 步全部保留，BPM1c 不实施也不宣布通过。

## P75

原始来源：`docs/blueprint/evidence/question-detail-20261016/browser-checklist.md`。

- **P75-question-details · 可自动化**（原文行 10）：正式题卡展开三 Tab、键盘选择、内容、detail 样式与按钮 ≥32px。
  - 自动探针/截图准备：`question-details`；路由：`/next/components/question`。
- **P75-question-tabs · 不适用或已被其他项覆盖**（原文行 11）：同 question-details 的三 Tab 实测。
  - 对应项：`round:question-details`。
- **P75-question-style · 不适用或已被其他项覆盖**（原文行 12）：同 question-details 采样背景/四边/padding/radius/gap，并按两蓝图/核心分支断言。
  - 对应项：`round:question-details`。
- **P75-question-coarse · 可自动化**（原文行 13）：额外 hasTouch 上下文验证 pointer:coarse 且真实 Tab 高度 ≥44px。
  - 自动探针/截图准备：`question-coarse`；路由：`/next/components/question`。
- **P75-question-spacing · 可自动化**（原文行 14）：三面板实际 gap/margin 与规定 12/16px、核心原值采样比较。
  - 自动探针/截图准备：`question-spacing`；路由：`/next/components/question`。
- **P75-question-isolation · 可自动化**（原文行 15）：题目详情根/后代/伪元素的内层样式与自身主题对照；不冒充历史像素基线。
  - 自动探针/截图准备：`question-isolation`；路由：`/next/components/question`。
- **P75-question-fixture · 可自动化**（原文行 34）：加载已有 P75 React fixture；白底 SVG naturalWidth、三核心嵌套详情；使用现有 Vite，生产服务不支持时明确报错。
  - 自动探针/截图准备：`question-fixture`；路由：`/next/components/question`。
- **P75-nested-question-covered · 不适用或已被其他项覆盖**（原文行 35）：question-fixture 挂载真实嵌套样本，question-isolation 比较详情与伪元素。
  - 对应项：`round:question-fixture`, `round:question-isolation`。
- **P75-reverse-question-covered · 不适用或已被其他项覆盖**（原文行 36）：五主题外层 × fixture 本地五主题矩阵由 question-isolation 执行。
  - 对应项：`round:question-isolation`。
- **P75-question-reading · 需目检**（原文行 37）：逐一看三面板长中文、公式、图片、短标签与焦点间距；白图白底图连续，夜图白图不反色。
  - 自动探针/截图准备：`question-fixture`；路由：`/next/components/question`。

## P76

原始来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md`。

- **P76-site-sidebar · 可自动化**（原文行 9）：桌面切换与 Ctrl+B，320 抽屉 trap/Esc 回焦。
  - 自动探针/截图准备：`site-sidebar`；路由：`/next`。
- **P76-sidebar-page · 可自动化**（原文行 10）：正式 Sidebar 页面开关和键盘捷径。
  - 自动探针/截图准备：`site-sidebar`；路由：`/next/components/sidebar`。
- **P76-shell · 可自动化**（原文行 12）：挂载原 ShellNavFixture，AppBar/SpaceBar 高度与菜单、图标轨、移动抽屉，保存实测。
  - 自动探针/截图准备：`shell`；路由：`/next/use-cases/workspace-app-bar`。
- **P76-appbar-current · 不适用或已被其他项覆盖**（原文行 11）：一级导航下划线预期已由 P77 实块替代，使用 shell-nav-state；其他 AppBar 高度/SpaceBar 由 shell。
  - 对应项：`round:shell`, `round:shell-nav-state`。
- **P76-shell-nav-state · 可自动化**（原文行 17）：顶栏链接选中、hover/focus、个人/空间菜单开合及回焦。
  - 自动探针/截图准备：`shell-nav-state`；路由：`/next/use-cases/workspace-app-bar`。
- **P76-old-nav-focus · 不适用或已被其他项覆盖**（原文行 16）：一级导航 offset -4px/底线已由 P77 的 offset 2px 实块替代；不把旧规范再断言。
  - 对应项：`round:shell-nav-state`。
- **P76-shell-sidebar-style · 可自动化**（原文行 18）：当前/非当前 hover/focus、sidebar 背景/边界、2px inset 和单焦点采样。
  - 自动探针/截图准备：`shell-nav-state`；路由：`/next/use-cases/workspace-app-bar`。
- **P76-rail-covered · 不适用或已被其他项覆盖**（原文行 19）：shell 探针测实际图标轨和 40px 按钮。
  - 对应项：`round:shell`。
- **P76-shell-contrast · 可自动化**（原文行 20）：当前项最终 computed 前景/背景 ≥4.5、线条对比度 ≥3。
  - 自动探针/截图准备：`shell-nav-state`；路由：`/next/use-cases/workspace-app-bar`。
- **P76-shell-isolation · 可自动化**（原文行 21）：原 ShellNavFixture 渲染后复制的根/后代/伪元素，五种外层与本主题自身对照；没有历史环境像素复现。
  - 自动探针/截图准备：`shell-isolation`；路由：`/next/use-cases/workspace-app-bar`。
- **P76-shell-reading · 需目检**（原文行 22）：导航不能挤压阅读区；桌面首末焦点边界，320 compact 菜单和抽屉，数字角标与身份层次。
  - 自动探针/截图准备：`shell-nav-state`；路由：`/next/use-cases/workspace-app-bar`。
- **P76-workspace · 不适用或已被其他项覆盖**（原文行 26）：全站/Agent 主题接线属于 Workspace 后续任务，本仓无接入通过声明。

## P77

原始来源：`docs/blueprint/evidence/nav-folio-20261016/browser-checklist.md`。

- **P77-appbar-selected · 可自动化**（原文行 9）：一级导航按 P77 现行实块、36px、单 2px offset2 焦点；键盘切换意图。
  - 自动探针/截图准备：`shell-nav-state`；路由：`/next/use-cases/workspace-app-bar`。
- **P77-compact-covered · 不适用或已被其他项覆盖**（原文行 10）：shell + shell-nav-state 覆盖 compact 空间菜单和抽屉，窄屏不要求出现桌面链接。
  - 对应项：`round:shell`, `round:shell-nav-state`。
- **P77-folio · 可自动化**（原文行 11）：REV/SHEET 顺序、前后禁用、标题可访问名、菜单 Esc 回焦，挂载 folio 优先级/空值 fixture。
  - 自动探针/截图准备：`folio`；路由：`/next/foundations/blueprint`。
- **P77-empty-folio · 不适用或已被其他项覆盖**（原文行 12）：folio 的 API fixture 核对显式空值与未传值，没有残留前缀。
  - 对应项：`round:folio`。
- **P77-folio-reading · 需目检**（原文行 12）：长中文标题自然换行、folio 右对齐且不挤正文，REV/SECTION/SHEET 层次与字体回退。
  - 自动探针/截图准备：`folio`；路由：`/next/foundations/blueprint`。
- **P77-matrix-covered · 不适用或已被其他项覆盖**（原文行 13）：当前矩阵 5×3；nested-styles 和 shell-isolation 复核隔离，字体另有 font。
  - 对应项：`round:shell-isolation`, `probe:font`。
- **P77-folio-api-covered · 不适用或已被其他项覆盖**（原文行 17）：folio 临时 React fixture 覆盖 sheetNo/folio 优先级、空值、aria-hidden 与标题保留；真实读屏不在本轮。
  - 对应项：`round:folio`。

## P78

原始来源：`docs/blueprint/evidence/user-bubble-20261016/browser-checklist.md`。

- **P78-message · 可自动化**（原文行 13）：两蓝图气泡实色/直角、链接焦点/对比与 Enter 锚点定位、文本 Range 选择。
  - 自动探针/截图准备：`message`；路由：`/next/components/agent-components/agent-message`。
- **P78-message-reading · 需目检**（原文行 14）：附件图标边框、长中文与公式/代码局部滚动、链接换行 focus 环无裁切；不能只看无横溢。
  - 自动探针/截图准备：`message`；路由：`/next/components/agent-components/agent-message`。
- **P78-link-covered · 不适用或已被其他项覆盖**（原文行 15）：message 采样焦点与实际合成对比；焦点裁切和各状态可读性仍见目检。
  - 对应项：`round:message`。
- **P78-message-action-covered · 不适用或已被其他项覆盖**（原文行 16）：message 核对锚点与选择文本；系统剪贴板/实体触屏属于未验范围。
  - 对应项：`round:message`。
- **P78-message-isolation · 可自动化**（原文行 17）：渲染消息根本身匹配 user、嵌套根/后代/伪元素对照，包括两蓝图互嵌。
  - 自动探针/截图准备：`nested-styles`；路由：`/next/components/agent-components/agent-message`。
- **P78-reverse-message · 不适用或已被其他项覆盖**（原文行 18）：nested-styles 每种 inner 对五种 outer，颜色取自身令牌。
  - 对应项：`round:nested-styles`。

## P79

原始来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md`。

- **P79-frame-covered · 不适用或已被其他项覆盖**（原文行 7）：cards-folio 执行原件下一页、缺图及禁用；card-return 补回原图。
  - 对应项：`probe:cards-folio`, `round:card-return`。
- **P79-card-return · 可自动化**（原文行 8）：Section Enter/Space 与展开说明、原件首末来回；A/B 实际顺序。
  - 自动探针/截图准备：`card-return`；路由：`/next/foundations/blueprint`。
- **P79-cards-reading · 需目检**（原文行 9,6）：长中文和连续英文文件名注入后，标题/状态/meta/操作换行，A/B 方形、公式与两种密度的阅读比例。
  - 自动探针/截图准备：`visual-cards`；路由：`/next/foundations/blueprint`。
- **P79-card-options · 可自动化**（原文行 10,6）：五 tone 带真实文字/装饰图标；省略 status/letter/meta/action 不留槽；Codebox 可横向滚动。
  - 自动探针/截图准备：`card-options`；路由：`/next/foundations/blueprint`。
- **P79-omitted-covered · 不适用或已被其他项覆盖**（原文行 11）：card-options 的真实 React fixture 逐项省略可选槽并保留代码滚动。
  - 对应项：`round:card-options`。
- **P79-card-tones · 需目检**（原文行 10）：五状态小色块边界、文字与标题可辨；不足3:1填充依靠边界的设计需目检。
  - 自动探针/截图准备：`card-options`；路由：`/next/foundations/blueprint`。
- **P79-cards-isolation · 可自动化**（原文行 12）：显式 bp-* 卡片与普通 coss 的 nested-styles 根/后代/伪元素对照。
  - 自动探针/截图准备：`nested-styles`；路由：`/next/foundations/blueprint`。
- **P79-workspace · 不适用或已被其他项覆盖**（原文行 13）：Workspace 接入另行验证，不在 BPM1c 修改范围。

## P82

原始来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md`。

- **P82-route · 不适用或已被其他项覆盖**（原文行 6）：路由/区域定位由 facts 与 facts-extra 行携带。
  - 对应项：`probe:facts`, `round:facts-extra`。
- **P82-facts-matrix · 不适用或已被其他项覆盖**（原文行 7）：facts 已实现两组件 × 6 内容宽度 × 4 项数；facts-extra 补同视口独立容器。
  - 对应项：`probe:facts`, `round:facts-extra`。
- **P82-facts-counts · 不适用或已被其他项覆盖**（原文行 8）：facts 已实现 2/3/4/5；facts-extra 在截图前保留奇数长文本 DOM。
  - 对应项：`probe:facts`, `round:facts-extra`。
- **P82-facts-lines · 需目检**（原文行 9）：查看奇数3/5项与长文本：无双线/半格线，末项满行、第二/四项无多余右线，字号未缩小。
  - 自动探针/截图准备：`facts-extra`；路由：`/next/foundations/blueprint`。
- **P82-facts-extra · 可自动化**（原文行 10）：独立容器 280/640 与长文本/连续数字，检查实际 dl/子项宽度，奇数夹具现场截图。
  - 自动探针/截图准备：`facts-extra`；路由：`/next/foundations/blueprint`。
- **P82-facts-flow · 需目检**（原文行 11）：原页面流与新增容器的 mt-5、邻接内容、标题块框线；代表窄屏用任务指定320，390补充自动几何记录。
- **P82-facts-390 · 可自动化**（原文行 11）：额外390px实际页面流文档宽度与事实容器可见；截图仍仅5个代表组合。
  - 自动探针/截图准备：`facts-390`；路由：`/next/foundations/blueprint`。

## P83

原始来源：`docs/blueprint/evidence/agent-mark-glyph-20261017/browser-checklist.md`。

- **P83-glyph-matrix · 不适用或已被其他项覆盖**（原文行 5）：mark-motion 已包含全部三变体、六态及5×3。
  - 对应项：`probe:mark-motion`。
- **P83-glyph-api · 可自动化**（原文行 6）：真实React大小切换、13px网格、custom label、glyph不显示耗时；loading恢复计时。
  - 自动探针/截图准备：`glyph-api`；路由：`/next/components/agent-components/agent-mark`。
- **P83-glyph-colors · 可自动化**（原文行 7）：六态运行/静态、状态颜色、Dots蓝图直角与核心圆点；固定loading/inline样例计数与文字。
  - 自动探针/截图准备：`glyph-colors`；路由：`/next/components/agent-components/agent-mark`。
- **P83-motion-covered · 不适用或已被其他项覆盖**（原文行 8）：mark-motion 首次 reduce 导航、运行中往返变更均执行；每个 glyph 九点。
  - 对应项：`probe:mark-motion`。
- **P83-glyph-aria · 不适用或已被其他项覆盖**（原文行 9）：glyph-api/mark-motion 检查 role/name/隐藏点阵与无live；AX树由 glyph-colors 读取，真实读屏另验。
  - 对应项：`round:glyph-api`, `round:glyph-colors`。
- **P83-old-glyph-covered · 不适用或已被其他项覆盖**（原文行 10）：glyph-colors 对原 loading/inline 数量及 1分5秒核对；不是再用接口文档替代实测。
  - 对应项：`round:glyph-colors`。
- **P83-glyph-isolation · 可自动化**（原文行 11）：实际渲染点阵在五外层的根/后代/伪元素隔离对照。
  - 自动探针/截图准备：`nested-styles`；路由：`/next/components/agent-components/agent-mark`。
- **P83-glyph-switch · 不适用或已被其他项覆盖**（原文行 12）：glyph-api 临时 React 宿主切换 inline→glyph→loading；无真实执行状态接入声明。
  - 对应项：`round:glyph-api`。
- **P83-glyph-reading · 需目检**（原文行 6）：行首16px槽/13px图形与长中文并排；三变体各状态可辨，reduce九点完整。

## P84

原始来源：`docs/blueprint/evidence/r9-20261018/browser-checklist.md`。

- **P84-material-states · 可自动化**（原文行 11）：九态逐项核对文件显示身份、版本、请求名、常驻检查，动作仅意图不改变记录。
  - 自动探针/截图准备：`material-states`；路由：`/next/foundations/blueprint`。
- **P84-material-policy · 可自动化**（原文行 12）：本机选择限制和服务四项尚未核验分开；本机文件选择反馈与未发起上传、重试禁用说明。
  - 自动探针/截图准备：`material-policy`；路由：`/next/foundations/blueprint`。
- **P84-material-actions · 不适用或已被其他项覆盖**（原文行 13）：material-states 每态动作与回执边界；material-policy核对原生选择和禁用原因。
  - 对应项：`round:material-states`, `round:material-policy`。
- **P84-confirmation-states · 可自动化**（原文行 14）：六短标签、ready资格、unknown查询、future时态与只读记录。
  - 自动探针/截图准备：`confirmation-states`；路由：`/next/foundations/blueprint`。
- **P84-basket · 可自动化**（原文行 15）：版本行常驻、MathML、打开全文/关闭并回焦。
  - 自动探针/截图准备：`basket`；路由：`/next/foundations/blueprint`。
- **P84-title-menu · 不适用或已被其他项覆盖**（原文行 16）：由 folio 记录真实菜单、Esc、标题独立及folio事实。
  - 对应项：`round:folio`。
- **P84-old-agent-calls · 可自动化**（原文行 20）：当前既有公开示例 file/confirmation/basket 多呈现切换、非空内容及可用按钮采样；交互另由材料/确认/篮子探针检查，不宣称历史SSR字节通过。
  - 自动探针/截图准备：`old-agent-calls`；路由：`/next/components/agent-components`。
- **P84-portal-isolation · 不适用或已被其他项覆盖**（原文行 21）：scoped-controls/overlay + nested-styles/isolation 已覆盖同主题Portal与样式隔离。
  - 对应项：`round:scoped-controls`, `group:isolation`。
- **P84-title-actions · 可自动化**（原文行 22）：标题操作正常/hover/focus/disabled与reduce首次/动态；四项事实由facts。
  - 自动探针/截图准备：`title-actions`；路由：`/next/foundations/blueprint`。
- **P84-workspace-reading · 需目检**（原文行 15）：材料策略行、确认六态与题篮版本行/全文的视觉层级、公式与窄容器，不被裁切或操作挤压。
  - 自动探针/截图准备：`visual-workspace`；路由：`/next/foundations/blueprint`。
- **P84-workspace · 不适用或已被其他项覆盖**（原文行 26）：R9/W207 宿主同步与阶段审计是另仓后续任务；不移植业务验收到本仓静态页。

## P85/P85b/P85c

原始来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md`。

- **P85-P85b-P85c-object-geometry · 可自动化**（原文行 9）：两卡墨线外框/标题铺满/状态点/操作位置，对齐现有图纸内容盒。
  - 自动探针/截图准备：`object-geometry`；路由：`/next/foundations/blueprint`。
- **P85-P85b-P85c-object-expand · 可自动化**（原文行 10）：两卡展开到 workspace、返回 inline，事实与保存未知不因展开改变。
  - 自动探针/截图准备：`object-expand`；路由：`/next/foundations/blueprint`。
- **P85-P85b-P85c-arranger-interactions · 可自动化**（原文行 11）：正式编排页展开返回、分组/上移下移/确认资格与既有状态示例。
  - 自动探针/截图准备：`arranger-interactions`；路由：`/next/components/agent-components/structure-arranger`。
- **P85-P85b-P85c-relation-interactions · 可自动化**（原文行 12）：正式关系图页窄容器列表、展开/筛选/节点/来源和返回。
  - 自动探针/截图准备：`relation-interactions`；路由：`/next/components/agent-components/relation-graph`。
- **P85-P85b-P85c-objects-isolation · 可自动化**（原文行 16）：当前渲染对象根/标题/状态/操作及伪元素独立主题对照。
  - 自动探针/截图准备：`nested-styles`；路由：`/next/foundations/blueprint`。
- **P85-P85b-P85c-historical-core · 不适用或已被其他项覆盖**（原文行 17）：旧基线没有运行中的可比较浏览器环境；保留原历史证据，不将当前同主题隔离比对叫历史视觉回归。
- **P85-P85b-P85c-objects-focus · 需目检**（原文行 18）：对象卡片 Tab 顺序、标题无伪按钮、焦点圈完整，长中文与公式、操作换行保持自然。
  - 自动探针/截图准备：`object-expand`；路由：`/next/foundations/blueprint`。
- **P85-P85b-P85c-objects-reading · 需目检**（原文行 19）：与 BpFrameCard 比较墨底标题/正文留白、状态边界、图纸左右对齐及320长标题；default/compact分别看。
  - 自动探针/截图准备：`object-geometry`；路由：`/next/foundations/blueprint`。
- **P85-P85b-P85c-workspace · 不适用或已被其他项覆盖**（原文行 24）：Workspace来源同步和R10宿主宽度属于后续另仓任务，保留未验。
- **P85-P85b-P85c-object-spacing-matrix · 可自动化**（原文行 30）：default/compact、current/historical、available/unavailable、inline/workspace的标题到正文几何。
  - 自动探针/截图准备：`object-spacing-matrix`；路由：`/next/foundations/blueprint`。
- **P85-P85b-P85c-range-method · 不适用或已被其他项覆盖**（原文行 36）：object-spacing-matrix 对真实首个可见文本Range测量；旧 object-spacing 仅观察记录不当通过。
  - 对应项：`round:object-spacing-matrix`。
- **P85-P85b-P85c-empty-list · 不适用或已被其他项覆盖**（原文行 37）：object-spacing-matrix 包含空ul display及首文字Range；两卡同density差≤4。
  - 对应项：`round:object-spacing-matrix`。
- **P85-P85b-P85c-object-capabilities · 可自动化**（原文行 38）：真实组件React夹具生成supported+reason/unsupported/无说明，核对列表显示与首行顺序。
  - 自动探针/截图准备：`object-capabilities`；路由：`/next/foundations/blueprint`。
- **P85-P85b-P85c-not-ssr · 不适用或已被其他项覆盖**（原文行 39）：20/12是历史SSR推算，不做实际文字Range绝对值断言；只断言相同density两卡差≤4。

## 首批

原始来源：`docs/blueprint/evidence/common-20261015/checks.md`。

- **首批-legacy-first · 不适用或已被其他项覆盖**（原文行 8）：31项逐一绑定 legacy first-interactions.json-1..31，5×3自动执行。
  - 对应项：`legacy:first`。
- **首批-old-matrix · 不适用或已被其他项覆盖**（原文行 9）：当前matrix/isolation/overlay扩展为5×3，旧四主题数字只保留出处。
  - 对应项：`group:matrix`, `group:isolation`, `group:interactions`。
- **首批-common-extras · 可自动化**（原文行 10）：Checked-invalid Checkbox indicator destructive inset、DialogFooter方角与unstyled InputGroup。
  - 自动探针/截图准备：`common-extras`；路由：`/next/foundations/blueprint`。
- **首批-tabs-focus · 不适用或已被其他项覆盖**（原文行 11）：legacy首批31检查真实scrollport聚焦范围；纸面focus环的视觉由基础控件目检。
  - 对应项：`legacy:first-interactions.json-31`。
- **首批-common-visual · 需目检**（原文行 13）：首批表单无效态、只读/禁用、单外框、Tabs两变体与真实Dialog焦点：层级清楚、焦点未裁切。
  - 自动探针/截图准备：`visual-common`；路由：`/next/foundations/blueprint`。
- **首批-print-zoom · 可自动化**（原文行 24）：CSS zoom2与print media的真实投影；不等于原生缩放或实体打印。
  - 自动探针/截图准备：`print-zoom`；路由：`/next/foundations/blueprint`。

## 第二批

原始来源：`docs/blueprint/evidence/batch2-20261016/checks.md`。

- **第二批-group-focus-covered · 不适用或已被其他项覆盖**（原文行 19）：legacy第二批5的invalid表面、group-focus的整组/readonly/clear focus全部自动。
  - 对应项：`legacy:interactions.json-5`, `round:group-focus`。
- **第二批-group-focus · 可自动化**（原文行 19,8）：编辑/只读/无效整组与独立清除焦点；蓝图外2px、内outline/shadow均无。
  - 自动探针/截图准备：`group-focus`；路由：`/next/foundations/blueprint`。
- **第二批-legacy-second · 不适用或已被其他项覆盖**（原文行 20,9）：47项逐一绑定 legacy interactions.json-1..47，5×3自动执行。
  - 对应项：`legacy:second`。
- **第二批-current-matrix · 不适用或已被其他项覆盖**（原文行 21,10）：旧223不能替代当前结果；matrix/isolation/overlay在当前版本测。
  - 对应项：`group:matrix`, `group:isolation`。
- **第二批-first-regression · 不适用或已被其他项覆盖**（原文行 22）：同首批31探针与print-zoom，避免重复手工义务。
  - 对应项：`legacy:first`, `round:print-zoom`。
- **第二批-buttons-covered · 不适用或已被其他项覆盖**（原文行 23）：common-controls采样hover/pressed/keyboard，disabled/loading由旧交互3；button-states补reduce。
  - 对应项：`probe:common-controls`, `round:button-states`。
- **第二批-button-states · 可自动化**（原文行 23）：八个原bp按钮与首批按钮 normal/hover/pressed/keyboard/disabled/reduce实际样式、白图主色对比。
  - 自动探针/截图准备：`button-states`；路由：`/next/foundations/blueprint`。
- **第二批-routes · 不适用或已被其他项覆盖**（原文行 24）：matrix 43路由当前实际布局与页面内容检查覆盖原12页。
  - 对应项：`group:matrix`。
- **第二批-historical-progress · 不适用或已被其他项覆盖**（原文行 25）：旧修改前后记录仅历史；legacy progress测当前值，不能复造旧页面计算样式。
- **第二批-clean-context · 不适用或已被其他项覆盖**（原文行 27）：每项全新context，浏览器zoom默认1；legacy tabs/Sheet及matrix都测document scrollWidth。
  - 对应项：`group:matrix`, `legacy:first-interactions.json-31`。
- **第二批-batch-two-visual · 需目检**（原文行 31）：InputGroup整组焦点、Combobox候选/菜单/Toast、Sheet长文公式、Skeleton/Empty层次；按实际打开状态截图查看。
  - 自动探针/截图准备：`visual-batch-two`；路由：`/next/foundations/blueprint`。

## 编辑式排版与字体

原始来源：`docs/blueprint/evidence/editorial-20261016/checks.md`。

- **编辑式排版与字体-editorial · 可自动化**（原文行 11）：CDP实际字形字体、章节索引/folio/MathML字体与尺寸；不只查font-family。
  - 自动探针/截图准备：`editorial`；路由：`/next/foundations/blueprint`。
- **编辑式排版与字体-heading-covered · 不适用或已被其他项覆盖**（原文行 10）：editorial当前计数/尺寸与字体检查；不冻结会随示例增加的旧总数。
  - 对应项：`round:editorial`。
- **编辑式排版与字体-fallback-covered · 不适用或已被其他项覆盖**（原文行 12）：font探针已有隔离上下文阻断，新增断言error/无溢出，目检回退字形。
  - 对应项：`probe:font`。
- **编辑式排版与字体-historical-font · 不适用或已被其他项覆盖**（原文行 13）：旧前后body/Input样式属于历史比较；当前core隔离由isolation，整组焦点由group-focus复验。
  - 对应项：`group:isolation`, `round:group-focus`。
- **编辑式排版与字体-editorial-reading · 需目检**（原文行 24）：章节/中文/编号/横线层级，窄屏folio换行；加载失败后无缺字遮挡且正文仍可读。
  - 自动探针/截图准备：`visual-fonts`；路由：`/next/foundations/blueprint`。

## BPW1

原始来源：`tests/blueprint-theme.test.mjs`。

- **BPW1-ink-pairs · 可自动化**（原文行 48）：读取实际最终令牌颜色核对前景/背景、次要字、链接、主按钮、危险/成功/警告文字 ≥4.5。
  - 自动探针/截图准备：`ink-pairs`；路由：`/next/foundations/blueprint`。
- **BPW1-warning-composite · 可自动化**（原文行 70）：实际Badge透明背景逐祖先合成，文字对比≥4.5。
  - 自动探针/截图准备：`warning-composite`；路由：`/next/foundations/blueprint`。
- **BPW1-warning-surfaces · 不适用或已被其他项覆盖**（原文行 63）：现有contrast与ink-pairs补muted覆盖全部支持表面。
  - 对应项：`probe:contrast`, `round:ink-pairs`。
- **BPW1-warning-white · 不适用或已被其他项覆盖**（原文行 81）：ink-pairs测primary-foreground/card对warning-foreground填充。
  - 对应项：`round:ink-pairs`。
- **BPW1-core-warning · 不适用或已被其他项覆盖**（原文行 53）：静态固定色契约由原测试负责，本任务不改/不冒称重跑；浏览器warning由contrast测。
  - 对应项：`probe:contrast`。
- **BPW1-css-contract · 不适用或已被其他项覆盖**（原文行 88）：原postcss作用域/变异测试是工程测试，本轮禁改测试且不调用全量；浏览器隔离对应isolation/nested-styles。
  - 对应项：`group:isolation`, `round:nested-styles`。
- **BPW1-token-declarations · 不适用或已被其他项覆盖**（原文行 29）：声明枚举为源码契约；浏览器无法证明未使用令牌均显式声明，原测试保留，当前样式由isolation检查。
  - 对应项：`group:isolation`。
- **BPW1-theme-registration · 不适用或已被其他项覆盖**（原文行 21）：当前已五主题，第四套历史命名不表示夜图不应存在；theme选择由每次open验证。
  - 对应项：`group:matrix`。
- **BPW1-core-tokens · 不适用或已被其他项覆盖**（原文行 38）：原静态源码固定色断言保留；当前三主题最终颜色及隔离由contrast/isolation覆盖。
  - 对应项：`probe:contrast`, `group:isolation`。

## 夜图

原始来源：`docs/blueprint/evidence/night-20261016/checks.md`。

- **夜图-night-layout · 不适用或已被其他项覆盖**（原文行 12）：当前matrix五主题×三宽度，以及contrast覆盖正文/警告；原截图不冒充当前验收。
  - 对应项：`group:matrix`, `probe:contrast`。
- **夜图-night-isolation · 不适用或已被其他项覆盖**（原文行 13）：当前isolation 5×5×3覆盖根/子孙/伪元素，未声称React Context业务接线。
  - 对应项：`group:isolation`。
- **夜图-night-buttons · 可自动化**（原文行 14）：夜图hover和实底危险按钮最终色；确认取消保持备注。
  - 自动探针/截图准备：`night-buttons`；路由：`/next/foundations/blueprint`。
- **夜图-night-dialog · 不适用或已被其他项覆盖**（原文行 15）：legacy dialog初始/陷阱/最终焦点与overlay边界覆盖；视觉见common-visual。
  - 对应项：`legacy:first-interactions.json-23`, `overlay:dialog`。
- **夜图-formal-tabs · 可自动化**（原文行 16,41,45）：正式Tabs手动激活、disabled可聚焦不能激活、可局部滚动。
  - 自动探针/截图准备：`formal-tabs`；路由：`/next/components/tabs`。
- **夜图-seg-tabs · 可自动化**（原文行 16）：蓝图自有分段End选异常、已锁定禁用。
  - 自动探针/截图准备：`seg-tabs`；路由：`/next/foundations/blueprint`。
- **夜图-heatmap · 可自动化**（原文行 17,39,44）：实际宽度决定格内数字/ARIA说明、数据表保留0与缺测。
  - 自动探针/截图准备：`heatmap`；路由：`/next/components/evidence-matrix`。
- **夜图-heatmap-reading · 需目检**（原文行 17）：热图图形、零值真实tooltip、数据表缺测；数字隐去后仍能找到格子，图案/墨线/硬阴影可辨。
  - 自动探针/截图准备：`heatmap-zero`；路由：`/next/components/evidence-matrix`。
- **夜图-heatmap-zero · 可自动化**（原文行 17）：在紧凑图找到零值格真实坐标点按，校验tooltip含0并截取打开状态。
  - 自动探针/截图准备：`heatmap-zero`；路由：`/next/components/evidence-matrix`。
- **夜图-console · 不适用或已被其他项覆盖**（原文行 18）：所有新execute记录pageerror及console error；旧空error声明不会继承为当前。
- **夜图-known-limitations · 不适用或已被其他项覆盖**（原文行 24）：夜图普通border及浅色系列白图案是已登记限制；本轮不改阈值、不伪装成视觉通过。

## P86

原始来源：`tests/agent-prompt-disabled-announce.test.mjs`。

- **P86-prompt-api · 可自动化**（原文行 25）：临时真实React夹具：两变体 × 开关播报，原因可见关联、草稿可编辑、空原因无描述。
  - 自动探针/截图准备：`prompt-api`；路由：`/next/components/agent-components/prompt-bar`。
- **P86-prompt-empty-covered · 不适用或已被其他项覆盖**（原文行 38）：prompt-api在真实DOM切空原因，prompt-states含现有页面两变体。
  - 对应项：`round:prompt-api`, `probe:prompt-states`。
- **P86-ssr-snapshots · 不适用或已被其他项覆盖**（原文行 50）：SSR字节与main固定hash属于原工程测试；本轮无构建/全量，不用浏览器声称等价SSR。

## 78 项历史交互映射

每项在 legacy-probes.mjs 中以原证据文件名与原数组的1起始序号注册；名称、detail来自原始证据，所有条目覆盖5主题×3宽度。样式中的原蓝图色值按同主题令牌检查；三核心主题保持既有上游焦点与颜色，不硬套蓝图2px单环要求。

- `first-interactions.json-1`：12 component samples
- `first-interactions.json-2`：icon action feedback
- `first-interactions.json-3`：disabled and static loading
- `first-interactions.json-4`：材料名称 · 必填校验 invalid surface；原实测 detail：`{"invalid": "true", "border": "rgb(198, 40, 40)", "inner": "0px"}`
- `first-interactions.json-5`：材料名称 · 必填校验 clears invalid
- `first-interactions.json-6`：材料名称 · 必填校验 one focus outline；原实测 detail：`{"outline": "2px", "inner": "none"}`
- `first-interactions.json-7`：修改理由 · 必填校验 invalid surface；原实测 detail：`{"invalid": "true", "border": "rgb(198, 40, 40)", "inner": "0px"}`
- `first-interactions.json-8`：修改理由 · 必填校验 clears invalid
- `first-interactions.json-9`：修改理由 · 必填校验 one focus outline；原实测 detail：`{"outline": "2px", "inner": "none"}`
- `first-interactions.json-10`：readonly inputs
- `first-interactions.json-11`：disabled input textarea select
- `first-interactions.json-12`：disabled select option
- `first-interactions.json-13`：select keyboard and validation
- `first-interactions.json-14`：select escape focus
- `first-interactions.json-15`：checkbox space
- `first-interactions.json-16`：radio keyboard
- `first-interactions.json-17`：radio skips disabled
- `first-interactions.json-18`：switch keyboard and contrast；原实测 detail：`{"on": "rgb(22, 24, 29)", "off": "rgb(243, 245, 248)"}`
- `first-interactions.json-19`：基础组件材料预览 keyboard
- `first-interactions.json-20`：基础组件材料预览 disabled cannot activate
- `first-interactions.json-21`：基础组件补充信息 keyboard
- `first-interactions.json-22`：基础组件补充信息 disabled cannot activate
- `first-interactions.json-23`：dialog initial focus
- `first-interactions.json-24`：dialog invalid and focuses field
- `first-interactions.json-25`：nested escape retains dialog focus
- `first-interactions.json-26`：dialog focus trapped
- `first-interactions.json-27`：dialog final focus
- `first-interactions.json-28`：save updates local card
- `first-interactions.json-29`：static card has no button role
- `first-interactions.json-30`：badge text and 4 alerts
- `first-interactions.json-31`：320 tabs focus fits scrollport；原实测 detail：`{"left": 104, "right": 283.3333435058594, "parentLeft": 36.66666793823242, "parentRight": 283.3333396911621, "scrollWidth": 320, "width": 320}`
- `interactions.json-1`：12 second batch samples
- `interactions.json-2`：unique IDs；原实测 detail：`[]`
- `interactions.json-3`：input group clear and focus
- `interactions.json-4`：empty clear disabled
- `interactions.json-5`：input group invalid outer surface；原实测 detail：`{"invalid": "true", "inner": "0px", "outer": "rgb(198, 40, 40)"}`
- `interactions.json-6`：invalid integer remains invalid
- `interactions.json-7`：valid integer clears invalid
- `interactions.json-8`：group readonly and disabled
- `interactions.json-9`：combobox clear
- `interactions.json-10`：combobox empty result
- `interactions.json-11`：combobox chosen value
- `interactions.json-12`：typed text is not selection
- `interactions.json-13`：keyboard option selection clears error
- `interactions.json-14`：combobox Escape focus
- `interactions.json-15`：disabled combobox
- `interactions.json-16`：single toggle keyboard
- `interactions.json-17`：multiple toggle selection
- `interactions.json-18`：disabled toggles
- `interactions.json-19`：0 middle 100 and unknown progress；原实测 detail：`[{"now": "0", "text": "0%"}, {"now": "40", "text": "40%"}, {"now": "100", "text": "100%"}, {"now": null, "text": "未提供进度"}]`
- `interactions.json-20`：progress fill contrast；原实测 detail：`{"track": {"bg": "rgb(243, 245, 248)", "color": "rgb(22, 24, 29)", "border": "rgb(214, 218, 225)", "width": "0px", "radius": "0px", "outline": "oklab(0.501092 -0.0323436 -0.161344 / 0.5) none 2.66667px", "focus": false}, "fill": {"bg": "rgb(22, 24, 29)", "color": "rgb(22, 24, 29)", "border": "rgb(214, 218, 225)", "width": "0px", "radius": "0px", "outline": "oklab(0.501092 -0.0323436 -0.161344 / 0.5) none 2.66667px", "focus": false}, "contrast": 16.259790213604944}`
- `interactions.json-21`：menu disabled item
- `interactions.json-22`：menu checkbox state
- `interactions.json-23`：menu radio state
- `interactions.json-24`：menu Escape returns focus
- `interactions.json-25`：menu keyboard action
- `interactions.json-26`：popover initial focus
- `interactions.json-27`：popover cancel preserves value
- `interactions.json-28`：popover apply and return focus
- `interactions.json-29`：tooltip accessible description
- `interactions.json-30`：keyboard tooltip
- `interactions.json-31`：tooltip Escape
- `interactions.json-32`：three local notifications
- `interactions.json-33`：no global toast duplicate；原实测 detail：`{"count": 1, "allLocal": true}`
- `interactions.json-34`：toast action closes chosen item
- `interactions.json-35`：toast close all
- `interactions.json-36`：alert cancel initial focus
- `interactions.json-37`：alert focus contained
- `interactions.json-38`：alert cancel retains note
- `interactions.json-39`：confirm local change and final focus
- `interactions.json-40`：sheet initial focus
- `interactions.json-41`：sheet Escape return
- `interactions.json-42`：narrow sheet and internal scroll；原实测 detail：`{"left": 48, "right": 304.66668701171875, "width": 320, "scrollWidth": 320, "panelHeight": 589, "panelScroll": 2115}`
- `interactions.json-43`：skeleton busy state
- `interactions.json-44`：reduced motion skeleton；原实测 detail：`["none", "none", "none"]`
- `interactions.json-45`：skeleton manual content switch
- `interactions.json-46`：empty switches fixed content
- `interactions.json-47`：empty restores
