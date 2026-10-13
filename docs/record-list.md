# Record List 记录列表 v0.1 · Builder 实现

PO 批准候选 #10；目录「内容与数据」，入口 `/next/components/record-list`。独立 Review 与产品验收另行确认。

## 实施前复用检索

- 已读取固定 coss Tabs、Input、Select、Menu、Card、Pagination、Empty、Skeleton、Progress、Badge。组合基础控件，不改 `components/coss/**`。
- [coss particles](https://coss.com/ui/particles) 本轮可读，页面列出 510 项；[registry](https://coss.com/ui/r/registry.json) 与 `p-table-8.json` 在线读取失败。只读检查既有缓存 `/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/f9a352c5-7ad1-4d06-9d0d-08fc4599e165/scratchpad/coss/particles-src/` 的 p-table-5（状态点、表格）和 p-table-8（分页、选择、排序）。沿用状态文字与分页组合思路，不复制硬编码颜色，不增添 TanStack 依赖；卡片行适应 320px，与多列数据表职责不同。
- [Beautiful UI](https://www.beautifului.dev) 的 Records Table 是 CRM 网格，Filter Table 是表格筛选，Task Rows 是执行状态行；在线 `r/records-table.json`、`r/filter-table.json` 读取失败。只读检查同一 scratchpad 下 `beautifului/records-table.json`：固定 CRM 列、AI 属性计算、计时更新和独立 CSS 不匹配本任务的通用事实卡片行。不复制代码，不引入其令牌或执行状态。
- 评估 QueueBoard：学生试卷异常队列与多列表格，不能承载本次批次记录目录；保留旧契约。评估 analysis-filter 对应的 data-display FilterBar：依赖 QuestionSelect，未开放本任务要求的 44px 菜单项与触点布局；不为一个列表扩展旧接口。直接组合 coss Select，使用同样的固定标签模式。
- 复用 AgentStatus 的语义色与文字，通过 Circle 图标呈现状态点；不另建状态组件。agent-record-parts 提供详情折叠与工作区展开，不含本任务的状态、筛选原子，不强行套用。
- 已查看“批阅记录 ／ …”全部 9 张 PNG；只读核对 5174 TeacherGradingRecordsPage、Workspace GradingList.tsx 与 list-model.ts。Figma 仅取功能，业务分类、路由与 sessionStorage 不迁入。

## API 与事实边界

导出 `RecordList`、`RecordListProps`、`RecordListTab`、`RecordListRow`、`RecordListAction`、`RecordListFilter`、`RecordListStatus`、`RecordListState`。

- `actionVariant?: 'ghost' | 'outline' | 'primary'`：列表级行主操作样式，默认 `ghost`；`primary` 映射固定 coss Button 的 `default`，`outline` 原样复用。只作用于行主操作，不改变页头/空态主操作、Toggle 或更多菜单。
- `actionAlign?: 'start' | 'center'`：默认 `start`；`center` 将完整操作区（状态、标记、开关、主操作、菜单和禁用说明）在行内垂直居中。窄容器继续按原规则换行，操作区位于内容下方。省略两项或显式传默认值，SSR 输出均保持原样。

- 标题、说明、主操作文案均可覆盖。默认批阅记录，可用于组卷或工作记录；复用时同时覆盖 searchLabel/searchPlaceholder 和首次空状态说明。
- `showHeader?: boolean` 默认 `true`；`false` 时不渲染整个 FrameHeader（标题、说明、页头主操作），根 section 改用 `title` 作为 `aria-label`，行列表的名称保留。首次空状态的主操作仍由 `showPrimary` 控制；需要一起移除时同时设置 `showPrimary={false}`。
- `showSearch?: boolean` 默认 `true`；`false` 时不渲染内置搜索与筛选控件行。tabs、summary、分页、已选条件摘要与清除操作、各状态反馈保持原行为；宿主负责外部搜索与筛选。
- `showPrimary?: boolean` 默认 `true`；显式设为 `false` 时页头与首次空状态均不渲染列表主操作按钮，不留占位或空操作区，空状态标题与说明、行主操作和菜单仍保留；省略 `onPrimary` 仍只禁用可见按钮，用法见组件页 `/next/components/record-list#record-no-primary`。
- `tabs?: {id,label,count}[]` 由宿主提供，count 非负整数，零保留，null/无效显示「未提供」。`tab` 未提供时使用 `defaultTab` 或首项；受控模式只有新 props 改变选中项。传入非空 tabs 时，ID 唯一且 tab/defaultTab 须属于 tabs；切换对象时宿主应 key/remount 或控制 tab。
- 不传 `tabs` 或传 `[]` 时不渲染 Tabs、TabList 或 TabPanel，直接呈现内容。不传 `tab` 时忽略 `tabIds`（包括空数组），完整显示宿主页面，`defaultTab` 不参与过滤；显式传 `tab` 时仍按 `tabIds` 过滤，未标分类的行继续显示。外部导航负责筛选后分页，组件不会发出 Tab 切换意图。组件页「外部导航驱动、无内部 Tab」展示此用法。
- `rows` 是宿主当前查询页面；可选 `tabIds` 是宿主显式分类，支持非受控 Tab；省略时当前页面全部呈现。分类文本不参与推导。宿主应先筛选、再分页，切换目录或查询时更新 rows、summary、page；计数不得从当前页面倒推。
- 行提供 type/name/metadata、可选 description ReactNode、status `{label,tone}`、可选 0–100 progress。缺失身份显示「未提供」，缺失状态显示「状态未知」；非法或未知进度不画条。description 可组合现有公式呈现，组件不识别或解释公式。
- `showType?: boolean`、`showStatus?: boolean` 均默认 `true`。同质列表可显式传 `false`，对整张列表移除类型小标题或行状态（无占位）；不是按行缺值自动隐藏。保持显示时，空类型仍为「类型未提供」，缺失或空状态仍为「状态未知」。列表 summary、进度、description 中的「已收藏」Badge、主操作、更多菜单与行背景点击不受影响；操作可访问名称仍由动作文案与记录名称组成。行 type 仍为必填字符串，本次不改变行数据契约。
- `search`、`filters[{id,label,value,options}]`、`activeFilters: string[]`、`summary{label,tone}` 全部由宿主提供。过滤项、发布状态与时间选项无内置业务含义；组件不执行搜索。activeFilters 用于已选条件摘要，`onClearFilters()` 由宿主决定重置哪些条件；清除搜索调用 `onSearch("")`。
- `pagination{page,pages,label}` 接收宿主页码窗口，组件不算页数。页码按钮发出 `onPageChange(page)`，当前页保留 aria-current。大数据使用紧凑页码窗口，分页规则归宿主。
- 意图：`onTabChange(id)`、`onSearch(query)`、`onFilterChange(id,value)`、`onRowAction(rowId,actionId)`、`onRowMenu(rowId,actionId)`、`onPageChange(page)`、`onPrimary()`、`onRetry()`、`onClearFilters()`。无回调的操作禁用；search 无回调时只读。行主操作可给 disabledReason，禁用整行快捷点击并显示原因；菜单项可给 disabledReason。
- 行背景点击与可聚焦的主操作按钮调用同一个意图；FramePanel 不以 Button 包裹整行，内部按钮与 Portal 菜单阻止冒泡，不出现嵌套按钮，也不抢夺内部控件键盘行为。
- `state` 默认 ready；ready + activeFilters 为 Filtered；search-empty 为搜索无结果；empty 为首次空；error 带 reason 与 retry；loading 呈现 Skeleton。隐去非 ready 的记录与分页，不把旧结果当作新回执；首次空不显示搜索工具栏。

## 页面、无障碍与验证边界

组件页含四个目录，28 条中文夹具（7 需处理、3 处理中、18 完成），五项筛选、分页和意图回显；夹具仅管理视图，不执行实际批阅。图中固定“12 页”未沿用，页数依据本夹具数据提供。系统处理中 183 份是 92+45+46，已完成 12 个已发布与 6 个未发布与夹具一致。

使用共享 AgentStatus 语义色与可见状态文字，Circle 是状态点；关键文字使用语义 ui-hint。coss Tabs 管理 roving focus 与 TabPanel 关联；coss Menu/Select 管理弹层焦点、Escape 和选择。固定标签、coss 默认尺寸（仅触屏补足 44px 点击目标）、容器断点 720px、减少动态效果沿用既有机制。页面提供三主题、1366px 宽区与 320px 长中文/MathML；不新增视觉令牌。

浏览器尝试打开 `http://localhost:5173/next/components/score-review` 时被权限审核拒绝（工具返回用户拒绝该访问），未绕过。**ESCALATE：新路由的真实键盘交互、Portal 焦点返回、三主题/1366/320px 视觉与触点尺寸尚未浏览器验收**。SSR 和回调测试不能替代这些验收。真实服务、移动设备与读屏器未验证；其他仓库只读，未修改 `.git`，未提交/推送/发布。

## 可选 tabs 适配依据

本次按 `/tmp/prism-score2/record-list-adaptation.diff` 原样上游化五处改动。复核上文 coss Tabs、particles p-table-5/p-table-8 与 Beautiful UI Records Table/Filter Table/Task Rows 的既有检索取舍；本次仅扩展已有 RecordList 的可选属性，不引入新组件或上游代码。传非空 tabs 的既有路径保持不变。

## 2026-10-02 P2：Frame 复用

- Supervisor 提供的本轮在线检索快照：`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/registry.json`（Builder 核对 579 项），同目录 `particles/*.json`；Builder 读取固定 coss 源码与下列对应条目，不声称重新联网获取。
- 核对 `p-frame-1/3/4`、`p-card-11`、`p-table-7/8` 和固定 Frame/Card；采用 section 内 Frame + FrameHeader 承载标题及主操作，每个记录行由 Card 改为 FramePanel。FramePanel 是普通 div，能保留列表 li、背景点击和按钮/Portal 冒泡隔离；因此卡片行无需保留 Card。
- 未采用 card-style Table：当前每条记录是适应 320px 的完整事实与动作块，没有固定列头；套表格会改变列表语义与窄容器行为。沿用 p-table-7 的框架/内容分层，不移植其多列数据结构。
- DOM/外观变化：新增 Frame 框架与 FrameHeader，记录行使用 FramePanel 的默认边框、圆角、背景和阴影；只适配 padding、溢出裁剪和布局。Tabs、搜索、分页、Progress、点击与菜单语义不变；既有 Beautiful UI 检索取舍继续适用，不复制上游代码。
- demo 文案同步；原三主题、1366px、320px、长中文/公式与菜单夹具复用。浏览器视觉、Portal 焦点与移动触控交 Supervisor 验收。

## 2026-10-02 P3：每页条数与计数评估

- 复核 Supervisor registry 快照（579 项）、particles `p-pagination-3` 与 `p-tabs-10`，以及固定 Select/Pagination/Tabs。p-pagination-3 实际是“结果范围 Select + 上/下一页”，并非每页条数控件；采用其 Select 与分页组合思路，保留本组件已有受控页码窗口，不复制其本地页数推算，不根据当前页补造上一页/下一页边界。
- `pagination.pageSize?: {value:number;options:readonly number[];label?:string}`，配合顶层 `onPageSizeChange?: (size:number)=>void`。默认固定标签“每页条数”，值显示“N 条”；宿主提供唯一正整数选项和值。没有 pageSize 不渲染；有 pageSize 而无回调则禁用。仅允许选项内正整数发意图；null 不触发。
- 不在组件内切片、重置页码或刷新数据；宿主更新 pageSize/page/rows/summary，是否回到首页由宿主决定。demo 明确在宿主执行每页 5/10/20 条与回到第 1 页。触点至少 44px，保留三主题窄容器与长中文公式夹具。
- p-tabs-10 用 outline Badge 表达计数；现状 TabsTab 中已有 tabular-nums 文字计数，标签与数字可读且零/未知有明确文字，符合 coss children 用法。按委派允许保留文字计数，避免无必要的默认 DOM 与视觉变化；不引入 Badge。

检索来源为委派提供的本地快照 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/` 下的 `registry.json` / `particles/*.json`，本轮未重新联网获取。浏览器工具拒绝访问 localhost:5173，P3 的实际视觉、键盘/触屏与焦点验收未完成；自动化证据见 `/tmp/prism-audit/Report-P3.md`。

## 2026-10-07 P30：恢复 coss 标准尺寸

- Input / SelectTrigger / 操作与分页 Button 使用默认 size，更多操作使用 icon；移除无条件 h-auto、min-h-11、min-w-11。默认桌面输入外框、触发器与按钮为 32px；小于 sm 时为 36px。按钮长文单行省略但保留完整可访问文字，行名称与说明仍换行，固定标签 gap-2 与筛选 gap-3 不变。
- Button 与 SelectTrigger 沿用 coss pointer-coarse 伪元素扩展；Input 内部输入框、SelectItem、MenuItem 与 TabsTab 仅在 pointer-coarse 下补 min-h-11，TabsTab 同时补 min-w-11。Input 的内部目标高至少 44px，边框外高 46px，文字垂直居中。选项可按内容换行，不强制桌面 44px。
- 本轮复核固定 coss Input/Button/Select/Menu/Tabs/Pagination 与本地 input-particles 的 p-input-group-22 标准尺寸组合，并复核上文 p-table-5/8、Beautiful UI 的既有取舍；沙箱不联网，未声称重新获取注册文件。继续组合已有控件，无新增组件或依赖。
- 浏览器验收：按分工由 Supervisor 执行；三主题、320px/1366px、长中文/公式、键盘焦点与粗指针点击区域见 P30 报告清单。

## P48：同质列表省略类型与状态

组件页 `/next/components/record-list#record-homogeneous` 的「我的试卷」使用以下组合，所有行均为正式试卷。省略两个重复字段，保留已收藏 Badge、长中文与公式、行主操作及下载菜单；点击仅回显意图。提供 320px 容器开关，主题沿用页面的 light / paper / dark 切换。

```tsx
<RecordList
  title="我的试卷"
  description="已保存的正式试卷，可查看或下载。"
  primaryLabel="新建试卷"
  searchLabel="搜索试卷"
  searchPlaceholder="搜索试卷名称"
  rows={rows}
  showType={false}
  showStatus={false}
  onRowAction={onRowAction}
  onRowMenu={onRowMenu}
/>
```

复用依据：本轮离线读取固定 coss Frame / Button / Badge、既有 Prism Badge / RecordList，以及本地 table-particle 的 p-table-3/4 组合；对照本页已有 p-table-5/8、p-frame-1/3/4、Beautiful UI Records Table / Filter Table / Task Rows 的检索记录。现有事实行与意图接口已覆盖需求，仅缺列表级显示开关，因此扩展原组件，不增加组件条目或复制第三方代码；未联网刷新注册文件。默认输出与既有断言保持不变，浏览器验收按分工由 Supervisor 执行。

## P49：省略列表主操作

复用依据：离线复核固定 coss Button / Frame / Empty、既有 RecordList 和本地 table-particle（p-table-3/4）的操作与空状态组合，并对照上文 p-table-5/8、p-frame-1/3/4 及 Beautiful UI Records Table / Filter Table / Task Rows 的既有检索记录；现有组件仅缺列表级显示开关，沿用 P48 风格扩展公开属性，不复制上游代码、不新增组件或依赖，未联网刷新注册文件。组件页新增有记录与首次空两种 `showPrimary={false}` 用法，并提供 320px 容器开关、长中文与公式；浏览器验收按分工由 Supervisor 执行。

## P50：省略完整页头与内置搜索行

组件页 `/next/components/record-list#record-optional-regions` 提供 `showHeader={false} showSearch={false}` 试卷列表，可独立恢复两个区域并切换 320px 容器。保留 tabs、共 2 份试卷摘要、分页、长中文/公式、行主操作和更多菜单；外部页面负责自己的标题与筛选，省略属性不触发任何业务意图。未传属性保持原输出。复核固定 coss Frame / ToggleGroup 以及现有 Input / Select / Empty 组合、本地 particles p-table-3/4 的工具栏和内容分区，并沿用本页 Beautiful UI Records Table / Filter Table / Task Rows 的既有评估；仅扩展原组件，不新增条目或依赖，未联网刷新注册文件。

## P51：标题类别与操作侧事实标记

`RecordListRow.tag?: string` 在标题同一换行容器内、标题之前呈现中性的 coss `Badge variant="outline"`。`badges?: readonly string[]` 按输入顺序在操作侧、行主操作之前呈现 coss `Badge variant="secondary"`；它们是宿主提供的独立事实，与 `type/status` 无关，`showType={false}` / `showStatus={false}` 也不隐藏标记。

```tsx
const row: RecordListRow = {
  id: "paper-1", type: "正式试卷", name: "一元二次方程单元复习",
  metadata: "九年级数学 · 20 题", tag: "专题复习",
  badges: ["已收藏", "本班用过"],
  action: { id: "open", label: "查看试卷" },
}
```

缺省、空字符串/纯空白 tag、缺省/空数组 badges 均不增加输出；标记文字去首尾空白，空白数组项省略。有标记的 li、主操作和更多菜单可访问名称包含类别、原名称与事实标记；无标记保留旧名称与 DOM。标记在窄容器自然换行，单个长标记也可换行，主操作不被标记压缩。组件不推断收藏、使用记录或状态，点击仍只发既有意图。

组件页 `/next/components/record-list#record-tags` 包含双标记、长中文标记与标题、MathML、320px 开关和“显示行状态”开关。复用检索：本地 coss Badge/Frame/Button、table-particle 的 p-table-3/4，及本页已有 Beautiful UI Records Table/Filter Table/Task Rows 与 p-table-5/8 检索记录。现有行结构能承接两个属性，不引入第二套列表或第三方代码；本轮离线复核，未刷新在线注册索引。浏览器验收：按分工由 Supervisor 执行。

## P54：行开关型次要操作

`RecordListRow.toggle?: { id: string; label: string; pressedLabel?: string; pressed: boolean; icon?: 'star' | 'bookmark' }` 复用固定 coss `Toggle size="default"`，放在事实 Badge 后、行主操作之前。默认 star，可选 bookmark；不覆盖颜色、尺寸、圆角或按下样式。

```tsx
const row: RecordListRow = {
  id: 'paper-1', type: '试卷', name: '二次函数单元复习', metadata: '九年级数学',
  action: { id: 'open', label: '查看试卷' },
  toggle: { id: 'favorite', label: '收藏', pressedLabel: '取消收藏', pressed: false, icon: 'star' },
}
<RecordList rows={[row]} onRowAction={(rowId, actionId) => requestAction(rowId, actionId)} />
```

- `pressed` 完全由宿主提供；激活仅发出 `onRowAction(row.id, toggle.id)`。组件不改变收藏事实、不持久化、不从 Badge 或状态文案反推 pressed。主操作的 disabledReason 不禁用独立开关；缺少 onRowAction 时开关禁用。
- 可访问名称为“当前动作文案：记录身份”。未按下用 label，按下用 pressedLabel，未提供 pressedLabel 时沿用 label；身份包含已有 tag/name/badges，图标 aria-hidden。沿用 coss Toggle 的 aria-pressed、原生按钮键盘与标准触点机制。
- 点击阻止冒泡，行背景仍只发主操作意图。无 toggle 时 SSR 字节完全不变。menu 未提供或为空数组时不渲染更多按钮（既有行为，本次补回归断言）。

`/next/components/record-list#record-toggle` 展示 star / bookmark、未按下 / 已按下、长中文与 MathML、三主题 320px。默认宿主在本页内存回填收藏事实，关闭“宿主回填收藏事实”后点击只回显意图、pressed 保持不变；不是远端保存成功的回执。两行分别省略 menu、提供空 menu，没有更多按钮。

复用检索：实际读取固定 coss Toggle/Button/Frame、RecordList、本地 table-particle 的 p-table-3/4，复核本页 particles p-table-5/8、p-frame-1/3/4 与 Beautiful UI Records Table / Filter Table / Task Rows 历史取舍。表格选择与执行状态行不适用单行受控收藏开关；coss Toggle 已完整提供所需基本控件，在现有列表扩展公开属性即可。不新增组件或依赖、不复制第三方代码；未联网刷新上游。浏览器验收：按分工由 Supervisor 执行。


## P57：行主操作样式与对齐

`/next/components/record-list#record-actions` 可切换 ghost / outline / primary、操作区垂直居中和 320px 容器，包含长中文、MathML、事实标记与更多菜单。两项属性是列表级设置，点击只保留原有意图，禁用原因和冒泡隔离不变。

```tsx
<RecordList rows={rows} actionVariant="primary" actionAlign="center"
  onRowAction={requestAction} />
```

复用检索：固定 coss Button 的 ghost/outline/default 与 FramePanel 原行布局、本地 particles p-table-3/4；复核本页 p-table-5/8、p-frame-1/3/4 和 Beautiful UI Records Table / Filter Table / Task Rows 的历史取舍。现有组件足以扩展，不创建另一套按钮样式或列表，不增依赖、令牌或复制第三方代码。按 Builder 前置约定离线复核，未刷新上游 registry。浏览器验收：按分工由 Supervisor 执行。
