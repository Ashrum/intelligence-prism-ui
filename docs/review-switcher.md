# ReviewSwitcher · C1 组件契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。入口 `/next/components/review-switcher`，实现 `components/prism-next/review-switcher.tsx`。

## 复用依据

本批为 PO 2026-10-02 已批准的通用预览组件，不属于 Agent 执行组件，Beautiful UI 不适用。沿用并复核 [试卷冻结稿](paper-review-design.md) D7/D8 和[题目冻结稿](question-review-design.md)的检索记录。读取 Supervisor 本地缓存 registry（579 项）以及 particles `p-group-11`、`p-combobox-10/8`、`p-tabs-14/10`、`p-frame-1`、`p-meter-3`、`p-toolbar-1`，对照固定 coss Group、Combobox、Tabs、Badge、Frame、Meter、Toolbar 与既有 PaperPreview / DocumentRegionViewer。缓存路径为 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`。

采用相连导航、分组原生搜索、标准 Tabs/Badge、内容分区、量值与工具分组；不复制演示数据、计时器或局部视觉值。coss 没有完整三栏预览/成绩地图/单题反馈协议，因此从已冻结的宿主组合提取，不重新设计。连续纸张增强已有 PaperPreview，未另建目录。未联网刷新缓存，不声称本轮重新抓取上游。

## 公开 API

| 属性 | 契约 |
| --- | --- |
| `items: T[]`、`groups: {value,items:T[]}[]` | items 是相邻导航顺序，groups 是搜索分组。每个组条目必须在 items 中有同一稳定 key。 |
| `current`、`open/onOpenChange`、`onSelect(index)` | 受控当前索引与弹层。边界按钮禁用，选中只回传索引；关闭/换数据由宿主决定。空集合仍可打开查阅空结果。 |
| `itemKey`、`itemToStringLabel`、`renderItem` | 稳定身份、搜索文本、完整行内容。宿主可组合 Avatar、主副文字、量值/细条、Badge；coss Item 自带当前标记，组件不推定确认状态。 |
| `triggerRef`、`searchId` | 触发器引用用于 finalFocus；每实例固定搜索标签 ID 唯一。 |
| `labels` | navigation/previous/next/previousAria/nextAria/trigger/panel/search/empty，学生、题目或其他对象共用同一 API。 |
| `currentLabel?`、`footer?`、`className?` | 中间默认 n/N，可自定义当前标识；可插入 Kbd 帮助，className 仅布局。 |

直接使用 coss Combobox Input/List/Group/Collection/Item/Empty，原生过滤、↑↓/Enter/Esc、高亮、当前标记与关闭焦点不再自建。弹层保持冻结稿 360px、视口内夹取；不加载服务、不保存最近选择。`data-student-panel` 为兼容冻结 DOM 保留的标识，不代表组件绑定学生语义。

## 验证与边界

组件页提供三主题、320px、长中文与公式夹具；自动测试覆盖受控事实、意图与渲染。冻结页默认及六种附加状态采用重构前 SHA-256，原有 `paper-review-v1.sha256` 不变。浏览器三主题、窄容器、焦点、触摸和视觉签名由 Supervisor 验收；不声明真实服务、移动设备或读屏器已验证。
