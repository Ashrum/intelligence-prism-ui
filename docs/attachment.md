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

生命周期沿用原模型：selected（默认已选择）、queued、received、uploading、uploaded、invalid、failed、unknown、removed。`processing` 是独立后续处理事实，显式显示“正在处理”及调用方标签；不会由上传完成自动推定。上传只接受有限的 0–100 进度；未知时显示“进度未确认”及无数字进度条。失败显示原因，只有 `status.retry` 才展示重试，关联原请求 id；unknown/removed 不开放移除或重试。缺少回调/标识或 disabledReason 时动作禁用并显示原因。

文件名中间省略保留尾部 12 个字符，完整名称在 title 和可访问名称中；短名称不拆分。大小使用既有 B/KB/MB 格式；未知不显示为零。三尺寸只改变布局间距与媒体位，不缩小文字。图片加载失败回退类型图标，不改动上传事实。

## PaperCard / PaperCardGrid

`PaperCard` 接收 `id, studentName, examNumber?, pageCount?, thumbnailUrl?, paperSize?: A4|A3, orientation?: portrait|landscape, status: {label,tone?}, reason?, selected?, onView(id)?`。调用方提供状态文字与 AgentStatusTone 语义（转换为既有 Badge 变体），不解析文字推断业务。正整数页数才视为已知；完全未知仅显示一次“考号、页数未提供”，部分已知保留另一项未知说明。纸张比例复用 paperDimensions；无图仅纸张图标与规格，aria 说明“扫描图像未接入”。已知页数角标；原因最多两行、title 和辅助技术保留全文。selected 由宿主控制，以“当前预览”Badge 和 aria-current 表达；查看按钮不自动选中或改变状态。

`PaperCardGrid` 接收 children、maxHeight（CSS 高度）、state（ready/loading/empty/error）、emptyMessage、errorMessage、onRetry、aria-label。默认空文案“尚未接收学生试卷”，支持覆盖。网格 auto-fill 最小 168px（比容器窄时收缩），maxHeight 只约束具名且可键盘聚焦的网格区域；loading/empty/error 替代原卡片。无计时器、业务 Store、持久化、权限判断或上传/扫描执行器。
