# Attachment 附件与 Paper Card 试卷卡

本轮 PO 批准候选 #4、#5；同属“内容与数据 / Attachment 附件”，Paper Card 为学生试卷变体，不重复建立目录项。组件只呈现宿主事实、发出意图，独立 Review 与产品验收另行确认。

## 实施前复用检索

- Supervisor 在任务书提供的检索结果：coss registry / particles 仅 `p-input-5`（File input）相关，没有 attachment/file-card；Beautiful UI `attachment` 返回 404。本轮采纳该检索证据，未重新联网确认，也未复制第三方代码。
- `agent-file-input.tsx` 已有 `AgentFileItem / AgentFileStatus / AgentFileIntent`，直接复用状态、动作资格、请求与版本模型，并共享状态标签与大小格式化函数。既有 FileRow 含队列、选择、重排、查询、详情，不适合整体嵌入附件卡；旧 API 和布局保持兼容。
- `agent-media-parts` 面向媒体可用性/播放信息，`agent-capture-scan` 面向扫描会话与页面管理，均不替代上传生命周期。
- `paper-preview` 已有 PageImage 缩略图回退与纸张尺寸函数；增加薄包装 `PaperThumbnail` 共享它们，不新建第二套缩略图逻辑。
- 组合既有 coss Card / Progress / Empty / Skeleton、Prism Button / Badge / AgentStatus。布局仅使用间距、尺寸、换行、截断和滚动；不新增颜色、圆角、阴影或字号规则。

## Attachment

`item` 为 `AgentFileItem` 的 id/name/type/sizeBytes/status/processing/version/actions 子集；`size?: sm | md | lg` 默认为 md；`thumbnailUrl?` 是宿主授权的缩略图；`mediaKind?: pdf | image | document` 显式指定占位类型，省略时按 MIME 或文件后缀选择图标。`view?: AgentFileAction` 声明可选查看入口；`onAction(intent)` 发出 `{fileId,version,kind:remove|retry|view,requestId?}`。

生命周期沿用原模型：selected（默认已选择）、queued、received、uploading、uploaded、invalid、failed、unknown、removed。`processing` 是独立后续处理事实：存在时以宿主 `label` 原文作为唯一主状态，不添加前缀、不另显示“已上传”；`tone?: AgentStatusTone` 控制语义，缺省 neutral，不从文案推断。`description?` 单独展示处理说明；不会由上传完成自动推定。上传只接受有限的 0–100 进度；未知时显示“进度未确认”及无数字进度条。失败显示原因；有 processing 时仅使用 `processing.retry?: AgentFileAction & { requestId?: string }` 声明的处理重试及其请求 id，无 processing 时沿用 `status.retry` 与上传请求 id，二者不串用；unknown/removed 不开放移除或重试。缺少回调/标识或 disabledReason 时动作禁用并显示原因。

文件名中间省略保留尾部 12 个字符，完整名称在 title 和可访问名称中；短名称不拆分。大小使用既有 B/KB/MB 格式；未知不显示为零。三尺寸只改变布局间距与媒体位，不缩小文字。图片加载失败回退类型图标，不改动上传事实。

## PaperCard / PaperCardGrid

`PaperCard` 接收 `id, studentName, examNumber?, pageCount?, thumbnailUrl?, paperSize?: A4|A3, orientation?: portrait|landscape, status: {label,tone?}, reason?, selected?, onView(id)?`。调用方提供状态文字与 AgentStatusTone 语义（转换为既有 Badge 变体），不解析文字推断业务。正整数页数才视为已知；完全未知仅显示一次“考号、页数未提供”，部分已知保留另一项未知说明。纸张比例复用 paperDimensions；无图仅纸张图标与规格，aria 说明“扫描图像未接入”。已知页数角标；原因最多两行、title 和辅助技术保留全文。selected 由宿主控制，以“当前预览”Badge 和 aria-current 表达；查看按钮不自动选中或改变状态。

`PaperCardGrid` 接收 children、maxHeight（CSS 高度）、state（ready/loading/empty/error）、emptyMessage、errorMessage、onRetry、aria-label。默认空文案“尚未接收学生试卷”，支持覆盖。网格 auto-fill 最小 168px（比容器窄时收缩），maxHeight 只约束具名且可键盘聚焦的网格区域；loading/empty/error 替代原卡片；ready 的空数组或只含 null/undefined/布尔值/空字符串的条件列表显示空态。无计时器、业务 Store、持久化、权限判断或上传/扫描执行器。

## W4 可选紧凑布局与迁移

沿用上述 coss（含 p-input-5）与 Beautiful UI 复用记录，继续组合 PaperThumbnail、Card、Button、Badge，不新增组件目录项。2026-10-02 补查 [particles](https://coss.com/ui/particles) 可读取索引简介；[registry](https://coss.com/ui/r/registry.json)、Beautiful UI attachment / stepper 注册文件访问失败，未声称重新确认 404 或完整名单，未复制上游代码。

- `PaperCard.compact?: boolean` 默认 false。true 时左侧为 80px 宽缩略页，保持 A4/A3 与横竖版比例；缩略页是原生按钮，点击、Enter/Space 与“查看”同发 `onView(id)`，无回调或空 id 时禁用；卡片背景不绑定点击。
- compact 姓名、状态 Badge 均在卡内；考号与页数只列已知事实，用 ` · ` 分隔，均未知时整行省略。默认非紧凑模式保留既有未知说明与页数角标。
- 无扫描图像仍复用 PaperThumbnail 的图形与规格占位，可访问名称为“扫描图像未接入”，不新增可见长句；加载失败沿用“图像加载失败”。原因单独一段、最多两行省略，title 保留全文。
- `placeholder?: boolean` 默认 false，显式启用虚线边框与既有 `bg-muted` 弱化背景；不由状态文案推断未交，不自动添加姓名前缀或改变动作。
- `viewLabel?: string` 默认“查看”，`resolveLabel?: string` 默认“处理”，`onResolve(id)?` 显式提供才显示独立处理动作。两者仅发意图，不推定扫描异常或改变选中。姓名/状态/处置文案由宿主提供。
- `PaperCardGrid.compact?: boolean` 默认 false，紧凑列最小 172px，默认仍 168px；`className?` 仅供布局。Grid 不隐式设置子卡 compact。
- 动作使用 coss / Prism Button 的键盘与焦点行为；多行同时设置 h-auto / sm:h-auto，目标至少 44px，紧凑文字动作至少 48px。新增三主题 320px、长中文、有图/无图、A3 横版与占位示例。

Workspace 同步时删除本地 onClick 卡片代理、扫描异常自动标记/边框、姓名“未交”前缀与推断文案；按业务显式传入 viewLabel、resolveLabel、onResolve、placeholder。缩略页始终表示查看意图；需要不同的未交处置流程时使用 onResolve，不把缩略页接到处置动作。

## 2026-10-02 P2：PaperCardGrid ScrollArea

- Supervisor 提供的本轮在线检索快照：`/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/registry.json`（Builder 核对 579 项），同目录 `particles/*.json`；Builder 读取固定 coss 源码与下列对应条目，不声称重新联网获取。
- 核对 `p-scroll-area-4` 与固定 ScrollArea，采用既有 scrollFade/overscrollContain；仅 maxHeight 存在时将 grid 外层改为渲染 section 的 ScrollArea，最大高度传入根与 viewport，卡片网格/状态内容置于 content。无 maxHeight 保留自然高度 section。
- coss 内部 viewport 检测溢出后提供 Tab 入口，键盘与触屏通过实际滚动节点工作；区域保留 aria-label，内层 p-1 保留卡片焦点环空间；viewport 与 scrollbar 关闭 reduced-motion 过渡。
- DOM/外观变化仅限限高 PaperCardGrid：新增 viewport/content/双轴 scrollbar 和渐隐边缘。PaperCard 本体、Attachment 上传 Progress、回调及 PaperPreview 原生视口均不改；后者的手势和锚点依赖原生滚动。
- 三主题、320px、compact 与限高夹具继续覆盖该路径，demo 增加渐隐说明。实际键盘/触屏滚动、三主题外观交 Supervisor；不据 SSR 声称完成浏览器验收。

## 2026-10-03 P10：纸面呈现 sheet

复用依据：Supervisor 已检索 coss particles 注册索引 `p-card-1…11`，均无缩略图/媒体卡片；Beautiful UI 无学生试卷类卡片。本轮采用该记录，Builder 未重新联网。扩展既有 PaperCard，不新增目录项或复制上游代码。复用 PaperThumbnail 的图像、加载失败和缺图回退、paperDimensions 的 A4/A3 横竖比例、Prism Badge / Button 与 coss ScrollArea；等待接收使用静态虚线纸位，不使用 Skeleton。Grid 的 loading 继续沿用既有 Skeleton。

- `PaperCard.variant?: "card" | "sheet"`，默认 `card`。原默认与 compact 的 DOM、样式和回调不变；`sheet` 优先于 compact。sheet 无普通外层卡片底色与可见边框，纸面居中，下方一行姓名 `text-item-title`、一行必要信息 `text-ui-hint`；非 placeholder 缺姓名沿用“姓名未提供”，长姓名 title 保留全文；无姓名 placeholder 见 Fix3。
- 非 placeholder：整张纸面是 `type="button"` 的原生按钮，点击、Enter、Space 发出 `onView(id)`，可访问名称为“查看/放大：{姓名}的试卷”。缺 onView 或空 id 禁用，不另渲染“查看”按钮。有效 `pageCount > 1` 时显示一层错位纸边；比例保留，缺图/失败沿用 PaperThumbnail；不强改深色主题内的扫描图颜色。
- `status.tone="success"` 仅在纸面右上显示成功色圆形勾标；未提供 tone 不推定 success。显式 neutral/info 及未提供 onResolve 的 warning 在左上以既有 Badge 显示 `status.label`，无勾标。必要信息只含已知考号、正整数页数，用 ` · ` 分隔，均未知则不显示。
- `placeholder=true` 优先于 tone：静态虚线空纸位；有姓名时姓名次要色，信息行显示宿主 `status.label`。有 onResolve 时纸位为原生按钮，发出 `onResolve(id)`，名称“{resolveLabel}：{姓名}”；无 onResolve 为不可聚焦、不可点击的纸位。不显示图像、勾标、叠纸或其他按钮，不调用 onView。无姓名时名称及信息区见 Fix3。
- 非 placeholder 且 `tone="error"`：纸面错误色描边、左上实底状态 Badge，整体错误色细边与卡片底色；信息行仅显示 reason，单行省略、title 与辅助技术保留全文，使用 `text-destructive-foreground`。有 onResolve 时另提供标准 `outline / sm` 处置按钮，缺 id 禁用，不覆盖 coss 高度。
- `selected` 由宿主控制：纸面 ring 与 `aria-current="true"` 表达当前项；状态全文由辅助文本提供，纸面按钮通过 aria-describedby 关联状态及错误原因。两档纸面标签均容纳 5 个汉字（14px 字号不变）：水平内边距 2px、左侧外伸 6px、最大宽度为纸宽减 8px，右侧保留 14px 勾标位置；更长标签单行省略并以 title 保留全文。处置按钮保留完整可访问名称。点击不会自行选中、推进接收或处置状态。sheet 无动画，Badge / 处置按钮过渡沿用 150ms 并关闭 reduced-motion 过渡。
- `PaperCardGrid.variant?: "card" | "sheet"`、`density?: "comfortable" | "dense"`；density 仅 sheet 生效。comfortable 最小列宽 160px、行/列间距 8/12px、纸宽 108px，信息行完整显示“考号 20260118 · 1 页”；dense 最小列宽 112px、行/列间距 4/8px、纸宽 84px，卡片水平内边距 2px，信息行视觉省略“考号”前缀，完整显示“20260118 · 2 页”，读屏仍保留“考号”，title 保留完整信息；更长信息单行省略。宽度不超容器；dense 仅以直接 sheet 子卡的布局选择器调整纸宽、留白与前缀的 sr-only 呈现，不注入任何子卡属性，等待状态与错误原因不受影响。宿主需分别指定 Grid 与 PaperCard 的 variant。maxHeight、ScrollArea、ready/loading/empty/error 行为不变。

选用：`card` 用于完整信息与独立查看按钮，`card + compact` 用于横向缩略页和动作并排，`sheet` 用于学生试卷接收的纸面浏览。原 compact 的“缩略页始终查看”约定保持；sheet 等待接收纸位明确使用 onResolve。

画布适配：沿用 108/84px 纸宽与 4px 叠纸；按 P10 Fix1 扩大 comfortable 列宽至 160px，dense 收紧水平留白与标签内边距，以保留必要信息。圆角、阴影、颜色改用现有语义令牌，标签不照搬 11px、信息不照搬 13px，处置按钮用 coss sm，不复刻固定 28px。dense 的“考号”前缀仅供读屏；不引入画布 compact 中间档 96px 纸宽/124px 列宽。无 onResolve 的等待纸位不可交互。深色缺图纸位保持组件主题底色，不强制画布的浅色纸面。

夹具入口 `/next/components/attachment`：comfortable 全状态与 dense 24 份，三主题各含 320px 窄容器和限高滚动，覆盖单/多页、可/不可处置等待、扫描异常、未知学生待处理、已排除、选中、A3 横向、缺图、长姓名/原因与样张公式。真实键盘、焦点、主题视觉与滚动验收由 Supervisor 执行。

## 2026-10-03 P10 Fix2：三种需处置形态

沿用 P10 的 coss particles `p-card-1…11` / Beautiful UI 检索依据及既有 PaperThumbnail、Badge、Button 组合，仅扩展 sheet 呈现，不新增属性或组件；card / compact 不变。

| 形态 | 显式条件 | 纸面与信息 | 处置入口 |
| --- | --- | --- | --- |
| 等待接收 | `placeholder=true`，优先于 tone | 中性虚线空纸位；信息行显示 status.label | 提供 onResolve 时点纸位处置，否则不可交互 |
| 待处理 | 非 placeholder，`tone="warning"` 且提供 onResolve | 警示色虚线纸边与外框、卡片底色；左上实底 status.label、右上圆形 `?`；信息行优先 reason，无 reason 回退已知考号/页数 | 纸面查看；下方 `outline / sm` 按钮显示 resolveLabel，发出 onResolve(id) |
| 异常 | 非 placeholder，`tone="error"` | 错误色实线纸边与外框、实底状态标签；信息行仅显示 reason | 纸面查看；提供 onResolve 才显示独立处置按钮 |

待处理代表试卷已收到但需教师处理，如 `status.label="未知学生"`、`reason="姓名与考号未识别"`、`resolveLabel="指定学生"`；组件不通过文案推断状态。warning 无 onResolve 仍仅呈现普通语气标签，无 `?` 或处置按钮。
待处理原因单行省略、title 保留全文；纸面与处置按钮的 aria-describedby 同时关联状态与完整 reason（存在时），`?` 为 aria-hidden。使用既有 `warning-foreground` / `background` / `card` 令牌适配 light、paper、dark，无局部色值；标准 sm 按钮不覆盖高度。comfortable 与 dense 均含未知学生夹具。

## 2026-10-03 P10 Fix3：无姓名骨架

`slotLabel?: string` 仅在 `variant="sheet"`、`placeholder=true` 且 `studentName.trim()` 为空时生效。虚线纸位保持 paperDimensions 比例，中央可选装饰序号；未传或为空则纸位留空。下方两条静态骨架条上长下短，aria-hidden，不渲染姓名或可见状态行。卡片及可交互纸位名称为“等待接收的试卷位 {slotLabel}”（无序号时无末尾空格），aria-describedby 保留宿主 status.label。仅提供 onResolve 才渲染原生按钮，空 id 禁用；无回调不可交互、不可聚焦。有姓名 placeholder、非 placeholder、card / compact 均忽略 slotLabel，保持既有输出。

复用沿用 P10 的 coss（含 particles p-card-1…11）/ Beautiful UI 检索记录；已检查 coss Skeleton，其默认 animate-skeleton 与渐变不适合静态纸位，因此用原生 span、既有 bg-border / bg-muted 和 rounded-full 呈现 56×10 / 36×8 的两条骨架，不复制或修改上游组件。无动画、计时器或状态推定。

装饰性序号按 PO Fix3 设计参考作为 aria-hidden、不可聚焦的 SVG 图形内字，108 单位画布、36 单位字号、300 字重、currentColor 继承 muted-foreground，随纸宽缩放（comfortable 约 36px / dense 约 28px，纸边框会略减实际值）。这是图形内字的局部例外，排版检查仅允许 attachment.tsx 中 data-paper-slot-glyph 的该固定声明，不扩展界面字号或新建令牌。与画布差异：虚线沿用原组件令牌与不透明度；短骨架用 muted 令牌，不复制画布 border 的 70% 透明度。

夹具：comfortable 与 dense 各增 4/5/6 三个纸位，三主题 320px 夹具同步覆盖；另有“未知学生待处理卡 + 无姓名骨架”并排组。4/5 无回调，6 提供处置回调且点击只更新请求反馈。

## 2026-10-03 P10 Fix4：纸面状态标签实底

沿用 P10 的 coss particles / Beautiful UI 检索记录，继续复用 Prism / coss Badge、PaperThumbnail。sheet 的 neutral / info / 无 onResolve 的 warning 标签均使用 `bg-card dark:bg-card` 不透明底色，文字保留对应语气；error 与待处理保留既有语气实底及 `text-background`。覆盖 coss 的深色半透明背景，缩略图内容不再参与标签文字对比度；无新增令牌、组件或上游修改，card / compact 保持不变。

comfortable、dense 与三主题 320px 网格增加 `sheet-info-image` / `sheet-warning-image` 两张有图夹具（林知夏“正在核对”、许书禾“待确认”，均无 onResolve），复用既有白底公式 SVG 样张，并保留原缺图夹具；这些图像是说明性样张，不是真实学生扫描记录。
