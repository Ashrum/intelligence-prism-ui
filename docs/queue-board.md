# Queue Board 队列看板 v0.1 · Builder 实现

PO 批准候选 #8；目录「内容与数据」，入口 `/next/components/queue-board`。独立 Review 与产品验收另行确认。

## 复用依据与取舍

- Supervisor `/tmp/prism-queue/task.md` 已检索 coss Table、Toggle Group、Badge、Card、Empty、Skeleton、Pagination，registry 无队列看板。本轮读取固定 coss 源码；不修改 `components/coss/**`。
- 查询 [particles](https://coss.com/ui/particles)（页面显示 510 项）、[registry](https://coss.com/ui/r/registry.json) 与单项注册文件。远程 JSON / GitHub 原文读取失败；转而检查既存缓存 `scratchpad/coss/registry.json`（579 项）、`particles-src/p-table-3.tsx`、`p-toggle-group-1.tsx`，并核对仓库 `demos/table-particle.tsx` 对 p-table-3 / p-table-4 的适配。缓存根为 `/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/f9a352c5-7ad1-4d06-9d0d-08fc4599e165/`；不把缓存当成在线最新证据。
- p-table-3 是勾选表格，p-table-4 是排序/分页表格，p-toggle-group-1 是按钮组选中态。复用固定 coss Table、Toggle、Card、Empty、Skeleton 与 Prism Badge/Button；不复制上游硬编码状态色、业务数据或计时器。独立 Toggle 放入有名称的 group，由 QueueBoard 保证单选/取消，避免 ToggleGroup 连续按钮外观约束卡片网格；分页可组合现有 Pagination。
- **先评估 AgentReviewQueue**：queue/version、ItemReviewer 状态、批量资格、过期/他人处理中、inline/workspace 均围绕版本化人工复核，计数还有按视图隐藏零值行为。它不适用于任意 2–6 个业务分类；扩充会引入第二套状态与生命周期。保留旧 API，共享底层 coss Table、Button，不移植复核规则。
- **先评估 StatusComposition**：内部计算总量与占比、使用分类调色并展示比例条；本任务只显示外部计数与成功/信息/危险/警示语义。修改统计语义或增加无比例的卡片模式会扩大契约，保持原 API 与测试。
- QueueBoard 是通用内容与数据组合，不属于 Agent 语义组件，不引入 Beautiful UI 代码。Agent Spec 为站点统一机器可读说明。
- 只读核对 Figma S10/S42/S46、本机 5174 源 165–208 行、Workspace SmartGradingMonitor 与 model 的分类/操作边界；只取功能，不采用截图视觉或业务分类算法。其他仓库未修改。

## API

`QueueBoard` / `QueueBoardProps` / `QueueBoardCategory` / `QueueBoardRow` / `QueueBoardAction` 从 `components/prism-next/queue-board.tsx` 导出。

- `title / description`：默认「试卷工作区」「选择队列后预览或处理具体试卷」。
- `categories`：调用方提供 2–6 个唯一 id，label、description、count:number|null、tone:success|info|error|warning，保证互斥口径。0 始终可见；缺失/负数/非整数/非有限值显示「未提供」，不求和、不按行数回填。
- `rows`：唯一 id、name、statusId、actions；可选 examNumber、pages、paperTitle、description:ReactNode。按 statusId 筛选，不计算业务状态；未知分类 ID 显示「状态未提供」。
- `filter / defaultFilter`：filter 非 undefined 时受控，null 为全部；非受控从 defaultFilter（默认 null）初始化。再次点击当前分类取消。宿主删除已选分类时不改写选择，显示「分类未提供」，仍可选择其他分类。
- `onFilterChange(id: string | null)`：受控时调用方须回传新 filter；非受控回调可省略。
- `onRowAction(rowId, actionId)`：动作 label/id 由调用方提供，不推断导航或执行结果。
- `headerAction / onHeaderAction()`：可选 `{label, disabled?, disabledReason?}`；非 ready 隐藏，防止操作旧快照。
- `state / onRetry()`：ready 默认；loading 用 Skeleton；empty 可提供 description；error 提供 reason，重试只发意图，不自行转换状态。后三者替换筛选与表格。
- `maxHeight`：CSS maxHeight，仅限制表格区域；多行内部滚动。也可由宿主先筛选后分页，传当前页 rows，使用受控 filter 并在外部组合 Pagination。计数仍由宿主传入。

行操作 disabled=true 或非空 disabledReason 均禁止发送意图；缺少回调也禁用。原因可见并关联 title/aria-describedby；禁用但无原因时显示「当前不可操作，原因未提供」。姓名、考号和页数无事实时明确缺失，页数只接受正整数。ReactNode 由调用方保证安全和语义。

## 布局、夹具与验收边界

沿用语义字号与 Badge 四种状态色，筛选卡和行状态消费同一 category。Toggle 自带按下态和键盘交互，不添加颜色、字号或视觉令牌。网格按组件容器宽度排列 4/2/1 列，320px 一列。表格保留四列和最小 680px 宽，在有名称、可聚焦的区域局部横向滚动，maxHeight 同时约束竖向滚动；不缩字、不转卡片列表。Skeleton 在减少动态效果时禁用动画。

页面包含批阅进行中 31/5/2/2（四行）、完成 38/0/0/0（四行）、受阻「调整模板」、筛选空态、禁用原因与缺失事实、Loading/Empty/Error，以及三主题 320px 长中文/MathML。分类总量与四行节选独立；固定状态不随动作推进。

自动化覆盖筛选单选/取消、受控与非受控、aria-pressed、零值/缺失计数、行/头部/重试意图、禁用原因、空态与三状态、共享组件回归。数字与日志见 `/tmp/prism-queue/Report.md`、`checks/`。

**ESCALATE：真实浏览器视觉/交互验收受阻。** 访问本地 5173 被浏览器安全策略拒绝，理由为用户已拒绝该权限；未绕过。SSR/回调和类型测试不等于浏览器验证。三主题配色、320px 实际布局、触控/键盘滚动和读屏器待独立验证；真实服务、移动设备与分页宿主接入也未验证。

## 2026-10-02 P2：Frame、ToggleGroup 与 ScrollArea

- Supervisor 提供的本轮在线检索快照：`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/registry.json`（Builder 核对 579 项），同目录 `particles/*.json`；Builder 读取固定 coss 源码与下列对应条目，不声称重新联网获取。
- 核对 `p-frame-1/3/4`、`p-card-11`、`p-table-7/8`；采用 section 内 Frame + FrameHeader（标题与动作），筛选/替代状态使用 FramePanel，表格使用固定 Table `variant="card"`，沿用 p-table-7 的框架与表格内容分层；不复制 p-table-8 的排序、选择或依赖。
- 核对 `p-toggle-group-4` 与固定 ToggleGroup。改用 `multiple=false` 的 ToggleGroup / ToggleGroupItem，value 在单项数组与空数组间适配，coss 提供选择、取消及 roving focus；组件仅将 onValueChange 映射为原 onFilterChange(id|null)。受控/非受控、缺失分类与 count=null 文案保持。
- **未采用 outline 连续按钮外观**：其直接子项按 DOM 首尾去除中间边框与圆角，4/2/1 列换行会留下错误接缝，修补需要覆盖 coss 视觉。采用 coss 原有 default 变体和原网格断点，无视觉覆盖；解决当初为保留卡片网格而避开 ToggleGroup 的限制。多行 label/count/description、44px 触点保留。
- 核对 `p-scroll-area-4`；maxHeight 存在时 Table 容器改为 ScrollArea（scrollFade、overscrollContain），maxHeight 同步限制内部 viewport；根节点关闭 Table 默认外层横向滚动，双轴滚动统一由 viewport 承担。无 maxHeight 保留原生有名称、tabIndex=0 的横向区域。
- coss viewport 检测溢出后自动进入 Tab 顺序，原生触屏滚动由 Base UI 保留；viewport/scrollbar 过渡在 reduced-motion 下关闭。区域仍具名称，表头 scope 和四列结构不变。
- DOM/外观变化：框架、默认变体筛选组、card 表格以及限高时的 viewport/content/双轴 scrollbar。组件页已有三主题限高长文公式夹具，补充键盘与渐隐说明；实际焦点、双轴触屏滚动与三主题视觉由 Supervisor 验收。

## 2026-10-02 P3：排序意图与限高吸顶

- 复核本轮 Supervisor 的 registry 快照（579 项）及 particles `p-table-4`、`p-table-8` 的可排序表头、方向图标、aria-sort；固定 coss Table/Button/ScrollArea 足以组合。不引入 TanStack，不复制客户端排序/分页与选择列。Ant Table sorter/sticky 仅作能力对照，未复制其代码。
- 可选 `sort?: QueueBoardSort | null`，其中 `QueueBoardSort={column:"name"|"status",direction:"asc"|"desc"}`；`onSortChange?: (next: QueueBoardSort|null)=>void`。有回调才出现两个原生 Button 表头；同列循环 asc → desc → null，切另一列从 asc 开始。方向图标、th 的 aria-sort 和操作名称跟随外部 sort。
- 组件不重排行、不更新 sort；宿主处理排序后回传 rows/sort。缺回调时表头保持文字，可用外部 sort 标明当前顺序。排序夹具由 demo 宿主排序固定数据；默认不传 sort/回调保持旧 DOM。
- maxHeight 模式的 thead 在同一个 ScrollArea viewport 内 `sticky top-0`，保留表头正常流占位；用既有 bg-background 提供不透明主题表面，避免滚动行透出，不新增色值或令牌。去掉该模式 scrollFade：顶部遮罩会同时淡出吸顶表头。无 maxHeight 保留旧表头和横向滚动区域。
- 两个排序按钮至少 44px，h-auto + sm:h-auto，文案可换行，coss 自带焦点；reduced-motion 下无按钮过渡。三主题 320px 长文公式夹具开启排序。没有多选或批量操作。

检索来源为委派提供的本地快照 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/` 下的 `registry.json` / `particles/*.json`，本轮未重新联网获取。浏览器工具拒绝访问 localhost:5173，P3 的实际视觉、键盘/触屏与焦点验收未完成；自动化证据见 `/tmp/prism-audit/Report-P3.md`。
