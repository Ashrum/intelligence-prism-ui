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
