# 试卷预览框架 · D1 设计稿

本轮仅为 PO 定稿提供可操作页面，不冻结组件、不接入 Workspace、不增加组件目录项。路由 `/next/reviews/paper-review`；沿用独立评审夹具的全屏 Shell 旁路，在站点导航增加「设计评审」入口。主题直接复用站点 ThemePicker。

## 实现前复用核对

- 阅读固定 coss Toolbar / Group / Toggle / ToggleGroup / Tooltip / Kbd / Frame / Meter / Badge / Popover / Menu / ScrollArea / Dialog / Separator，以及 Prism PaperPreview、DocumentRegionViewer、Button、Badge。
- [particles](https://coss.com/ui/particles) 本轮可读，列出 510 项。579 项 registry 无预览器/lightbox 的结论来自 Supervisor 委派，未声称本轮重新穷举。
- 读取 Supervisor 缓存 `scratchpad/audit/particles/` 的 p-frame-1、p-meter-3、p-kbd-1、p-toggle-group-4：采用 Frame 分区、Meter 数值、Kbd 提示、受控单选组合；不复制内容、局部视觉值或依赖。
- PaperPreview canvas 已有页面受控状态、区域、旋转、拖动、捏合和缩放。直接组合；现有 canvas 仍输出工具条/区域按钮和固定高度，设计稿宿主只做布局隐藏与高度分配。
- Toolbar 用于悬浮控件的键盘分组，ToggleGroup 用于原稿/标注效果；Group 与 Popover 不再嵌套，避免额外容器。工具条按本次明确设计要求使用既有 popover 表面、rounded-full 与 shadow 类。
- Menu 承载打印/导出意图；Dialog 承载快捷键表。QuestionRail 本轮为本地组合，不是独立组件。此任务为通用文档预览组合，不实现 Agent 能力或复制 Beautiful UI 代码。

## 设计边界

- 试卷为宿主生成的 SVG 文档资产；使用既有浅色语义颜色与文档坐标，不新增 UI 令牌。纸张保留实体纸的明亮底色；外围由站点三主题驱动。SVG 文字尺寸属于扫描文档内容，不是界面字号。
- 当前最大数字语义角色是 `text-stat-display`（24/32），总分和本题得分沿用该角色；不为“超大”另造字号。
- 所有业务动作只记录“已请求”，不模拟持久化、批阅结果、打印或导出成功。

## 下一阶段组件缺口

- PaperPreview：可替换/隐藏内建工具条、容器填充高度、实际缩放百分比回调、工具条避让空间、无扫描图像文案槽、独立 region 聚光/分数边注层、选中区域定位策略及 reduced-motion 协议。
- 当前宿主 CSS 仅在 D1 范围依赖 PaperPreview DOM 结构隐藏重复工具、展开画布、为纸提供阴影；不能直接视为稳定组件契约。
- 建议 QuestionRail API：`pages[{id, number, thumbnail, quality, questions[{id, number, type, score?, maxScore?, outcome}]}]`、`selectedId/onSelect`、`filter/onFilterChange`、`onLocate`、`summary`；选中与 Enter 定位分别发出意图，状态/总数全部来自外部。

## 评审重点

1440×900 / 1920×1080 / 自适应，三主题，长中文评分原因与数学公式，键盘题目选择、纸上区域同步、原稿按住与失焦恢复、无图像、意图回执。窄容器使用「题目 / 试卷 / 本题反馈」分区切换，保持内容与底部工具可用；正式视觉验收由 Supervisor 执行。

## D1 返工 1：宿主适配

- 延用上述 coss / particles 检索与组合方案，复核 ScrollArea 的 viewport、DocumentRegionViewer 区域按钮和现有主题/数字角色；本次没有新组件、依赖或公开 API。
- 画布采用 `bg-border`：比较 `muted`、`accent`、`border` 三档现有中性令牌后，选择三主题中与面板分离最明显的 `border`；不把前景、禁用文字等语义用作大面积底色。纸用 `shadow-2xl`；两侧仍各一条分隔线。
- 主题源值（画布 / 面板 / 扫描纸）：light `#E3E5E9 / #FFFFFF / #FFFFFF`；paper `#D8D5CE / #F4F1EA / #FFFFFF`；dark `#34383E / #0F0F0F / #FFFFFF`。来源为 `theme.css` 与扫描 SVG；非浏览器 computed-style 实测。
- 宿主覆盖区域按钮的常驻边框：未选中仅 hover / focus-visible 显示细边，选中为 `ring-2 ring-info`（三主题 `#339FF2`）。保留原有聚光遮罩与 reduced-motion 规则；原稿下遮罩透明，选中环仍可用。该覆盖需与区域聚光一起在下一阶段上游化。
- 题目栏在布局完成后、选中/过滤变化及容器重显/尺寸变化时执行 `scrollIntoView({ block: 'nearest', inline: 'nearest' })`；减少动态效果时使用 `instant`，其余 `smooth`，取消过期帧与观察器。
- 满分图标/分数降为 muted，失分中性显示且保留对齐列；零分 × 保留 destructive。评分点使用共享网格列，缺失原因与名称左沿对齐。本题数字继续使用最大 `text-stat-display`，单位按字体规范采用 `text-ui-body` 并基线对齐。
