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

## D1 返工 2：连续阅读与高度压缩（PO 2026-10-02）

- 复用核对：重新读取 coss Toolbar / ToggleGroup / Frame 与 PaperPreview、DocumentRegionViewer 源码，沿用前述 particles p-frame-1、p-toggle-group-4 等检索依据。Toolbar 已提供 vertical orientation；ToggleGroup 默认样式需由宿主补 `flex-col` 布局。PaperPreview 仅渲染当前页，不适合用两个独立滚动容器拼接；改为复用 DocumentRegionViewer 的 `pageLayout` / `pageRotation`，在本地 `ContinuousPaperCanvas` 组合中统一滚动与手势，不改任何公开 API。
- 默认适合宽度；两页始终同时挂载、间隔 16px、没有页间标题条。按视口内可见面积选出当前页；页码导航只滚动到页首，题目选择独立管理并居中定位，避免手动滚动被选中题目反向拉回。选中环与聚光继续沿用 D1 返工 1 的宿主覆盖。
- 画布右侧为 72px 固定槽，与纸的滚动区分别占据网格列；竖排工具条在槽内居中，矮视口可在槽内滚动，无底部工具条区域。扫描区四边留白 8px（左右合计 16px），两种适合模式都从扣除工具槽后的滚动区尺寸计算；数值缩放、按页旋转、拖动平移、Ctrl/Cmd+滚轮及双指缩放均由宿主管理。手势缩放锚点按设备框 scale 换算，避免缩放后的评审框坐标偏移。
- 顶栏 56px 不变；题目栏头 56px，页分组按钮 44px，末尾扫描说明随列表滚动；检查器头 56px，「下一道错题」用带 Tooltip / Kbd / 全称 aria-label 的图标按钮。窄容器标题允许省略，完整题号与题型保留在 title 中。
- `0` 切换适合宽度 / 适合页面；`F` 与沉浸开关隐藏顶栏和两侧栏，画布占满框架、工具槽保留，`Esc` / 再按 `F` 退出。沉浸直接切换布局；定位滚动在 reduced-motion 下为 instant，聚光沿用 motion-reduce。

### 源码尺寸计算（非浏览器实测）

以未旋转 A4 纸（793.7008 × 1122.5197 CSS px）、设备框内部尺寸、覆盖式滚动条计算；不计设备框缩小显示的 scale（D3 已移除外层评审控制条）。若系统使用占位式滚动条，运行时通过 clientWidth 自动进一步扣除实际占位。

| 框架 | 左栏 / 画布 / 右栏 | 默认纸宽与比例 | 适合页面纸宽与比例 | 顶栏 / 题目栏头 / 检查器头 |
| --- | --- | --- | --- | --- |
| 1440×900 | 232 / 828 / 380px | 828−72−16 = 740px；93.23% | 可用高 828px；585.45px；73.76% | 56 / 56 / 56px |
| 1920×1080 | 264 / 1236 / 420px | 1236−72−16 = 1148px；144.64% | 可用高 1008px；712.73px；89.80% | 56 / 56 / 56px |

### 组件缺口清单增量

- PaperPreview：**连续滚动模式**（多页同时挂载、可见面积主导页回调、页首导航、跨页区域定位）、独立工具槽/适合尺寸协议、连续画布的平移/缩放锚点、每页旋转状态；现阶段本地宿主组合不能视为已完成上游化。
- QuestionRail：增加 `onPageLocate(pageId)` 意图；页分组紧凑头、滚动末尾说明，以及紧凑筛选头的布局选项。
- 框架沉浸状态与宿主顶栏插槽需在定稿后的框架组件阶段提炼；本轮不注册新组件。

### 下一阶段冻结要求

套用到已有流程顶栏的页面时，本框架顶栏内容必须并入宿主顶栏；框架顶栏须做成可由宿主接管的插槽，全页不得出现两行顶栏。本条为 PO 本次明确要求，不代表本设计稿已经冻结或已完成 Workspace 接入。


## 评审工具约定

PO 2026-10-02 对所有评审页的长期要求：评审控制使用可拖动的浮动圆形按钮，取消顶部评审控制条、返回箭头及标题行；浏览器 `<title>` 保留页面名称。自适应框架占满 `100dvh`，1440×900 / 1920×1080 为保持比例、居中缩小的设备框。

- 共用位置：`examples/review-tools/review-tools.tsx`；仅供评审页组合，接收受控视口与无图像状态，不进入组件目录，也不修改任何产品组件的公开 API。
- 复用依据：本轮读取本地固定 coss Popover / Select / Switch、Prism Button / ThemePicker 及 Base UI 1.8.0 的 Popover trigger 源码；Popover 自带 hover、点击保持、safe polygon、焦点与碰撞避让，直接组合。复查 [particles](https://coss.com/ui/particles) 页面（510 项）；尝试 registry、p-popover-1、p-popover-2 注册文件，网页工具不可访问，命令行也因本地代理连接失败，未声称已读取单项源码。已有 Popover 满足面板需求，拖动与位置记忆放在评审工具宿主。本工具不属于 Agent 组件，不引入 Beautiful UI。
- 按钮固定定位，56px 圆形，初始右下内缩 24px；调节图标、白色图标、`aria-label="评审工具"`。三主题统一 `#F04A1A`，仅在 `.review-tools-trigger` 自身定义 `--review-accent`，不写入主题令牌或产品界面；hover / 按下分别同色加深，键盘焦点有清晰外环。此颜色及形状为 PO 对评审工具的明确授权。
- 鼠标指向或点击打开 coss Popover；hover 离开延迟 250ms 收起，点击打开保持至再次点击、Esc 或点外部；触屏点击、Tab / Enter / Space 可用，Esc 关闭后返回按钮。复用 coss 弹层与 hover / click 事件；宿主补充点击保持标记，使悬停超过上游 500ms 阈值后的首次点击也保持打开。
- 面板标题“评审工具”；常驻视口标签与自适应 / 1440×900 / 1920×1080 选择，站点 ThemePicker 同步浅色 / 纸张 / 深色主题，“无扫描图像”开关，“按钮归位”动作与“返回组件库”链接。触控行高至少 44px。
- 鼠标 / 触摸 / 笔使用 Pointer Events 拖动，超过 5px 才开始，捕获指针并抑制拖动后的点击/弹出；取消与捕获丢失均清理手势。按钮聚焦时方向键每次移动 16px，Shift 加方向键每次 64px。
- 按钮按最近的水平边与垂直边保存偏移，`localStorage` 新键 `prism-review-tools-edge-position-v2` 使旧绝对坐标失效；仅用户拖动或键盘移动写入。初始化与 resize 按边缘恢复并夹取显示，不改锚点或存储；“按钮归位”回到右下各 24px 并清除新键。存储读写/删除均 try/catch，非法边缘或偏移退回默认位置。弹层依据按钮所在半屏选择上/下及起/末对齐，并复用 Popover 碰撞避让与可用高度滚动；减少动态效果时按钮、面板、定位器禁用过渡。
- 本节替代 D1 初稿的顶部评审控制描述；既有试卷内部顶栏、连续阅读、沉浸和工具槽要求延续。正式浏览器视觉验收由 Supervisor 执行。

## D1 返工 4

沿用已记录的 coss / particles 复用依据，复核固定 ToggleGroup / Toggle 与既有 Button：题目栏头部左右 12px 留白，去掉独立摘要，数量并入“全部 20 / 错题 4”，辅助名称保留完整含义；归位动作复用 outline Button。不新增组件、视觉令牌、依赖或公开 API。

## D1 返工 5

- 复用核对：沿用上述 coss / particles 依据，复读固定 coss Popover 与现有 ReviewTools；默认位置与拖动后悬停门控属于评审宿主适配，无需新组件或上游变更。
- ReviewTools 增加可选 `defaultPosition`（水平边、垂直边及偏移），缺省仍为右下 24px；未手动移动时跟随宿主更新，已有用户位置优先，归位清除存储并跟随最新默认位置。本条替代前文固定右下角归位的说明。
- 本页通过工具槽实际 DOM 边界计算默认位置：56px 按钮水平居中、距画布底 16px；ResizeObserver 与布局状态覆盖三栏变化、设备框缩放和沉浸。槽底独立预留 88 个屏幕 CSS px，工具条在上方单独滚动；设备框缩小时槽宽至少保持屏幕 72px，防止按钮越界覆盖纸面或检查器。窄屏切换到题目/反馈而隐藏画布时，按钮放到分区导航右侧预留区域，重新显示画布后回到槽底。
- 拖动开始后单独抑制 hover 打开，松手仍保留该标记，直到指针离开按钮；下一次进入才可悬停打开。键盘与明确点击仍可打开，拖动生成的 click 继续拦截。

## D2 · 艺术升级与学生跳转（PO 2026-10-02）

本节取代前文 D1 的 24px 主分数和两侧分隔线描述；工具条最终布局以后文 D7 返工为准。既有功能语义保留，唯一新增入口为学生跳转面板及 G / [ / ] 快捷键。三项 Foundations 增补已获 PO 明确授权；不改 coss 原件、组件公开 API、目录注册、依赖或浮动评审工具。

### 实施前检索与取舍

- 本轮读取 Supervisor 缓存 registry（579 项）及 particles：p-group-11、p-combobox-10/8、p-select-20、p-popover-3、p-toolbar-1、p-tooltip-3/4、p-avatar-2、p-badge-16、p-kbd-1、p-scroll-area-4、p-meter-3/4；同时读固定 coss Group、Popover、Input、Avatar、Toolbar、Tooltip、ToggleGroup、Frame、Meter、ScrollArea。采用相连按钮、弹层内搜索、状态分组、头像副标题、圆点徽标、Kbd、ScrollArea scrollFade、Meter 与原生弹层动效。
- 搜索面板采用 Group + Popover + Input + 受控 listbox 的宿主组合，保持上一位/下一位和任意选人共用 `changeStudent`；不新建目录组件。参考组合语义，不复制注册项的演示数据、计时器、外部图片或视觉值。Beautiful UI 不适用：此处是通用文档预览宿主，不是 Agent 组件。
- Linear 键盘切换器、Figma UI3 居中画布/悬浮工具/固定侧栏、Gradescope 提交导航仅沿用任务书指定设计参照，未读取或复制其实现，不声称本轮做过外部站点对照。

### A · 学生跳转

中间 1 / 6 为 Popover 触发器；360px 面板内常驻姓名/考号标签、搜索、待复核/已确认分组。行至少 56px，含 coss 首字头像、姓名、考号、右对齐总分、40×4px 比例条、状态徽标与当前选中标记。无结果为「没有匹配的学生」。输入保持焦点，aria-activedescendant 跟踪 ↑↓ 高亮，Enter 跳转；Esc 沿用 coss 关闭与 finalFocus。G 打开（沉浸时先恢复顶栏，确保弹层定位与 Esc 返回触发器），[/] 上下位，快捷键表已登记；输入/菜单/组合输入法保留自身键盘行为。

六个固定记录总分 118/124/127/130/133/150，状态交替；第一份题目事实保持原值，其余记录从同一评分点结构生成一致的题目总分与纸面分数。确认状态来自记录；选择或点击不推定确认。切换共享查看状态，只有错题筛选下的当前题已达满分时改选下一份中的错题；全满分显示「没有错题」，下一错题安全停留。

### B1–B8 · 实现说明

1. `text-score-display`（40/44/600，tabular-nums）只用于顶栏总分和本题得分；分母 ui-body 基线对齐。学生名 section-title，题号/分区 block-title，正文 ui-body，低优先级信息 ui-meta + muted。字体页增加角色实样。
2. 竖排 Toolbar 分为翻页 / 视图 / 图层三组，D6 按 PO 要求恢复单列；沉浸与快捷键进入组末更多 Menu，F / ? 不变。工具槽 72px（缩放时至少 72 屏幕 px），56px 工具条，触控至少 44px；采用 coss 动画 Tooltip。
3. 看片台保留 bg-border，纸保留 shadow-2xl，工具条/菜单/学生面板/提示/快捷键弹窗使用正式 `surface-floating`；两侧栏无分隔线，顶栏保留细线。材质提供不透明回退。
4. 满分 success / 部分 warning / 零分 destructive 仅点和细条使用；AI 判定依据是设计稿唯一 `--brand-ai-gradient`，顶部 2px 细线与中性 AI 图标/文字。教师确认采用中性圆点徽标；颜色不代替文字状态。
5. 题目栏按选择题 1–12 / 填空题 13–16 / 解答题 17–20 分段；段内保留可定位页标，去掉逐行重复题型，保留键盘选择、失分数字、状态点与新增比例条。
6. 检查器保留 Frame/Header/Footer，内部使用无描边内容分区，评分点清单、缩进缺失原因；AI 用独立 bg-muted；班级对比两列量值条和数字；底部动作前用 ScrollArea 原生 scrollFade。
7. 顶栏首字 Avatar + 姓名 + 主分数 + 外部确认状态，学生导航使用相连 Group。
8. 选题蓝环 160ms；定位延用 smooth / reduced-motion instant；学生变化用 Web Animations API 180ms 淡入且清理取消，不重挂载画布，不使用计时器。弹层/提示沿用 coss 动效，减少动态效果时直接切换。

### 验证边界

三项规范定义、登记、SSR 与宿主事件由自动测试覆盖。浏览器工具拒绝本次 localhost:5173 访问，不能实测工具条高度、焦点返回、三主题合成材质、窄屏长中文/公式与触摸效果；这些由 Supervisor 正式视觉验收。无真实服务、移动设备、读屏器验证。源码高度核算不能替代浏览器测量；详见 `/tmp/prism-review/Report-D2.md` 与 `d2-checks/` 日志。


## D6 · D2 返工 1：恢复单列工具条（PO 2026-10-02）

- 复用核对：复读固定 coss Toolbar / ToggleGroup / Toggle、Prism Button，以及 Supervisor 缓存 particles p-toolbar-1、p-tooltip-4。继续用原有 Toolbar 分组与横分隔线，ToggleGroup 使用 vertical + flex-col；仅改宿主布局，不改 coss、公开 API、依赖、快捷键或评审工具。
- 排列：上一页 → 页码 → 下一页 ｜ 放大 → 比例 → 缩小 → 适合切换 → 旋转 ｜ 标注效果 → 扫描原稿 → 标注层 → 更多。三组单列，更多仍提供沉浸和快捷键表；surface-floating 材质、既有 shadow-lg、Tooltip + Kbd 保留。取消双列设计，不设工具条高度上限。
- 工具槽恢复 `max(72, 72 / scale)` px，工具条 56px；保留底部 `88 / scale` px 预留，评审按钮默认仍水平居中、距画布底 16 屏幕 px。适合宽度沿用滚动区 clientWidth 扣左右各 8px；不改变缩放语义。
- 默认根字号、scale=1、覆盖式滚动条下，源码工具条高度为 **508px**：10×44px 按钮 + 2×18px 文本 + ToggleGroup 间距 2px + 两分隔线含边距 2×5px + 六个直接布局项之间 5×2px + 上下 padding 8px + 边框 2px。窄于 650px 时沿用零外层 gap，为 498px；更矮容器仍由槽内滚动兜底。

| 框架 | 画布宽 × 高 | 工具条高 / 槽内可用高（扣底部预留与上下 padding） | 默认试卷宽 / 比例 | 工具条底 / 评审按钮顶 / 净间隔 |
| --- | --- | --- | --- | --- |
| 1440×900 | 828×844px | 508 / 740px | 828−72−16 = 740px / 93.23% | 688 / 828 / 140px |
| 1280×800 | 668×744px | 508 / 640px | 668−72−16 = 580px / 73.08% | 638 / 728 / 90px |

以上坐标相对于框架顶边；工具条居中于扣除底部 88px 后的槽内区域。两个目标尺寸均能完整容纳且不与默认评审按钮重叠，因此无需把旋转移入更多。占位式滚动条会由 clientWidth 进一步扣除；设备框缩小显示时按已有 scale 规则预留屏幕空间。这里是源码计算，不是浏览器实测。自动检查与 diff 证据见 `/tmp/prism-review/Report-D2-fix1.md`；三主题、窄屏、长中文/公式和实际交互视觉验收按任务书由 Supervisor 执行。

## D7 · D2 返工 2：答题卡成绩地图、收起与贴纸侧签（PO 2026-10-02）

本节替代 D2 / D6 的逐行小题、独立工具槽、工具条更多菜单与评审按钮槽底定位；保持评分事实、选择/定位/筛选、学生跳转、连续画布与其他快捷键语义。本轮仅设计稿宿主、文档和测试；不写 `.git`，不改 coss 原件、依赖、Foundations、共享组件公开 API、目录或 ReviewTools 实现。

### 检索与取舍

复读固定 coss ToggleGroup / Toggle、Tooltip、Badge、Meter、Separator、ScrollArea、Toolbar、Button，并检查 Sidebar 的 offcanvas 受控收起及宽度过渡约定。复读 Supervisor 缓存 particles `p-toggle-group-4`、`p-toolbar-1`、`p-meter-3`、`p-scroll-area-4`：沿用受控筛选、ToolbarButton + Toggle、分组发丝线、量值与滚动原语。Sidebar 自带站点级上下文、移动弹层和持久化约定，与评审框三栏宿主不匹配，因此只复用收起语义，不嵌入第二个应用侧栏。组合分段概览及按钮内 4px 得分条需要保留 Button/listbox 语义，沿用已有宿主 ScoreBar 的比例计算，未嵌入交互式 Meter 或新建组件。题号格浅色状态、选中环和工具条侧签形状是 D7 的明确视觉授权；基础控件的内部状态样式保持 coss。此任务为文档预览宿主，Beautiful UI 不适用；纸质答题卡和 Gradescope 仅为任务指定设计参照，未声称读取其外站实现。

### A · 答题卡成绩地图

- 56px 单行头保留全部/错题筛选并加入 44px 收起按钮；40px 概览按夹具统计分段。首份实际 **16 满分 / 2 部分 / 2 零分**，不是任务中的 16/1/3 示例；第 19 题 3/18 与所有原始数据保持不变。
- 选择题 12 格、填空题 4 格，四列、格至少 44px，横纵间隔 4px。满分只用 muted 中性表面；部分/零分用 warning/destructive 的 10% 混合，hover 为 20%。Tooltip 提供题号与完整分数，aria-label 含题型和状态；选中为蓝环+shadow-sm，键盘焦点增加外侧 outline，所有格按题号进入 Tab 序列。
- 解答题四行各至少 52px，题号、弹性 4px 比例条、64px 右对齐分数/失分列。满分条用中性 foreground。段间 16px；小计根据全段夹具求和，首份为 55/60、18/24、45/66，不随错题筛选改变分母。
- 每页首个可见题型组有发丝线与 44px 页标按钮；去掉缩略图与可见“清晰”，清晰信息保留在 Tooltip/aria-label。筛选后首题型为空时，页标转交该页仍可见的首题型；末尾扫描说明保留。当前夹具没有模糊事实，不臆造 warning；无图像仍显示质量未提供。↑↓ 仍按题号选择，Enter 定位；Tab 聚焦另一题后 Enter 先选择该题再定位，页标 Enter 保留原生页定位。选中变化仍滚入可视区，收起后的 inert 栏不触发滚动。

### B · 收起与焦点

- `T` 与按钮共用宿主 `railCollapsed`，宽度/透明度过渡 160ms，reduced-motion 直接切换。收起后释放整栏宽度、设置 inert/visibility，画布左上出现“题目 · 错 N”；收起焦点转到展开按钮，展开转回收起按钮。窄屏展开同时显示题目分区；点击原题目分区也可恢复。
- `prism-paper-review-rail-collapsed` 只存布尔字符串，读取/写入均 try/catch，失败不影响渲染。F 隐藏外框时不改此状态，沉浸期间 T 不改变隐藏偏好；退出恢复原状态。

### C / D · 四组侧签与右缘定位

- 四组为翻页｜缩放/适合/旋转｜版本/标注层｜沉浸。沉浸为显式 Toggle，Tooltip + F、按下态保留；快捷键表移入顶栏更多菜单，在打印/导出后以 Separator 分开，? 不变。
- 移除独立 72px 槽。连续内容列取两页实际宽度的最大值，右侧只预留工具条自身 56px；整体居中。适合宽度按画布 clientWidth − 8 − 56 − 8；适合页面和手动缩放保持整列与工具条一同居中。每页旋转后的布局仍独立计算。
- ResizeObserver 观察画布、各纸页及工具条，scroll 事件更新纸面右缘；`dockPaperToolbar` 使用未缩放的画布局部坐标，贴合最宽页右缘，超宽时夹取到右侧内缩 8px。竖向在可视区居中，矮画布预留评审按钮空间并允许工具条内部滚动，不隐藏操作。不使用计时器。
- 侧签贴纸侧直角、外侧 rounded-xl，surface-floating 三主题材质，单层左边框形成 1px 接缝；外层沿用 shadow-lg，通过宿主裁剪去掉左/上阴影。评审按钮默认改为画布右下各内缩 16 屏幕 px，既有手动位置优先；画布隐藏时仍使用移动分区导航预留区域。
- **组件缺口增量**：上游 PaperPreview 需要“工具条吸附试卷边缘”定位协议，覆盖连续页最宽列、适合尺寸扣除、旋转/缩放/滚动后的右缘测量、超宽夹取、沉浸与栏宽变化、极矮视口避让。这里仍是宿主组合，未完成上游化。

### 源码尺寸与验证边界

默认 16px 根字号、scale=1、覆盖式滚动条：题目栏总内容 **732px** = 头56 + 概览40 + 列表上下16 + 段间32 + 三段标题66 + 两页标88 + 选择格140 + 填空格44 + 解答行220 + 页尾30。1440×900 下可用844px，源码计算无需滚动；1280×800 可用744px，源码计算同样无需滚动（余量12px）。232px 栏内左右各12px、格宽49px；放大系统字体时交由滚动兜底，不缩字。

工具条源码高 **515px**（十个44px按钮、两个18px输出、ToggleGroup间隔2px、三分隔15px、六处外间隔12px、上下padding8px、边框2px）；窄于650px时外 gap=0，为503px。

| 框架 | 画布宽×高 | 适合宽度纸宽/比例 | 工具条底 / 评审按钮顶 / 净距（框架坐标） |
| --- | --- | --- | --- |
| 1440×900 | 828×844 | 756px / 95.25% | 735.5 / 828 / 92.5px |
| 1280×800 | 668×744 | 596px / 75.09% | 685.5 / 728 / 42.5px |

三主题题号文字合成对比按源值计算：light 最低6.93:1、paper最低6.08:1、dark最低8.40:1，覆盖中性格和失分格正常/hover；未冒充浏览器合成实测。浏览器 localhost 访问被权限策略拒绝，本轮未进行实际三主题、窄屏、长中文/公式、焦点返回或触摸视觉验收；由 Supervisor 继续执行。无真实服务、移动设备和读屏器验证。自动检查、实际 diff 与数字见 `/tmp/prism-review/Report-D2-fix2.md` 和 `d2-checks/fix2/`。
