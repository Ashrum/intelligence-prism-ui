# ReviewWorkspace · C1 组件契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。入口 `/next/components/review-workspace`，实现 `components/prism-next/review-workspace.tsx`。

## 全屏接入规则（2026-10-03，PO 批准）

遵循[全屏规则（2026-10-03，PO 批准）](paper-review-design.md#下一阶段冻结要求)：预览框架始终独占整个视口，是独立的全屏视图；不嵌入应用外壳、流程外壳（步骤条、任务名行、底部状态条）或任何页面内容区块，也不与宿主顶栏合并。其他页面通过入口打开它，“返回”回到来源页面。`topbar` 是框架自己的顶栏，应始终提供；属性仅为兼容保留可选，类型与实现不变。沉浸状态仍可隐藏框架顶栏，不改变全屏接入规则。

## 复用依据

本批为 PO 2026-10-02 已批准的通用预览组件，不属于 Agent 执行组件，Beautiful UI 不适用。沿用并复核 [试卷冻结稿](paper-review-design.md) D7/D8 和[题目冻结稿](question-review-design.md)的检索记录。读取 Supervisor 本地缓存 registry（579 项）以及 particles `p-group-11`、`p-combobox-10/8`、`p-tabs-14/10`、`p-frame-1`、`p-meter-3`、`p-toolbar-1`，对照固定 coss Group、Combobox、Tabs、Badge、Frame、Meter、Toolbar 与既有 PaperPreview / DocumentRegionViewer。缓存路径为 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`。

采用相连导航、分组原生搜索、标准 Tabs/Badge、内容分区、量值与工具分组；不复制演示数据、计时器或局部视觉值。coss 没有完整三栏预览/成绩地图/单题反馈协议，因此从已冻结的宿主组合提取，不重新设计。连续纸张增强已有 PaperPreview，未另建目录。未联网刷新缓存，不声称本轮重新抓取上游。

## 公开 API

| 属性 / 导出 | 契约 |
| --- | --- |
| `label`、`topbar?`、`rail`、`canvas`、`inspector`、`children?` | 具名框架与原样插槽。topbar 为框架自己的完整顶栏节点，应始终提供；属性仅为兼容保留可选，不由宿主顶栏接管。children 可放意图回执。 |
| `open/onOpenChange`、`immersive` | 受控题目栏和沉浸。窄分区请求展开时发 open=true；组件不持久化、不推定用户偏好。 |
| `pane/onPaneChange`、`panes?` | 默认 rail/canvas/inspector 三分区，标签可由宿主给；窄容器沿用冻结布局。 |
| `shortcuts?`、`shortcutsDisabled?`、`onShortcut?` | 条目 `{key,intent,repeat?,disabled?}`，key 为小写。只发 intent；跳过输入、组合输入法、菜单、Dialog、外部 listbox、Tabs 原生导航与题目栏 ↑↓/Enter。 |
| `ready?=true`、`animate?=false`、`frameRef?`、`mobileNavRef?`、`device?`、`style?` | 布局测量、首次准备与评审设备框适配；不内置评审工具。`onBlurOutside` 发离开框架意图，宿主释放临时原稿状态。 |
| `ReviewWorkspaceShortcuts` | 同目录辅助导出，受控 `open/onOpenChange`、`entries: [按键,说明][]`、可选 description；coss Dialog。 |
| `PAPER_REVIEW_BEST_WIDTH`、`railBand(width)`、`railCollapsedForWidth(width, preferences)` | 1440 逻辑宽度分档；`{best?:boolean,compact?:boolean}` 表示折叠偏好。只算结果，不读写存储。可从 `.ts` 布局工具单独导入。 |

框架宽度过渡与 reduced-motion 使用原 CSS。宿主负责量取容器宽度、两档存储、焦点回到展开/收起按钮、沉浸后焦点、临时原稿的 keyup/blur/visibility 释放。`d1-*` 是冻结稿保留的布局类名，不是新视觉令牌。

## 验证与边界

组件页提供三主题、320px、长中文与公式夹具；自动测试覆盖受控事实、意图与渲染。冻结页默认及六种附加状态采用重构前 SHA-256，原有 `paper-review-v1.sha256` 不变。浏览器三主题、窄容器、焦点、触摸和视觉签名由 Supervisor 验收；不声明真实服务、移动设备或读屏器已验证。
