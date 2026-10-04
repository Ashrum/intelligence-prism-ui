# Paper Preview 试卷预览

入口 `/next/components/paper-preview`。R1 实现待 Supervisor 独立 Review；退役已获 PO 2026-10-03 批准。

## 全屏接入与迁移

旧单页布局、`PaperPreviewDialog` 和 `ScoreReview.paper` 已移除。预览一份试卷使用独立全屏 `ReviewWorkspace` + `PaperPreview` 连续模式，遵循[全屏规则](paper-review-design.md#下一阶段冻结要求)。按委派记录，Workspace PR #115–#117 已完成迁移；本轮不修改 Workspace。

- 将 `PaperPreview` 放入全屏框架的 canvas；可用 `PaperPreviewSurface` 承载侧签。省略 layout 即连续模式，也可显式传 `layout="continuous"`。推荐宿主传 `zoom="width"` 并响应 `onZoomChange`。
- 页面跳转改用 `continuous.location={pageId, request}`；当前可见页由 `continuous.onVisiblePage(index)` 回传。区域点击沿用 `selectedRegionId/onRegionSelect(pageId,regionId)`，重复定位递增 request。
- 标题、身份、状态、信息、扫描版本、操作与关闭由宿主放入框架插槽；旋转由宿主更新 `rotation` 字典。组件不执行导航、扫描、恢复、保存或持久化。
- `ScoreReview` 只显示评分面板；原卷交给框架画布，定位提示仍须由宿主提供事实。
- mixed 用法：`<PaperPreview layout="mixed" mixed={mixedProps} />`；mixed 内提供完整 pages、缩放、旋转与回调，外层不再接受无效的重复参数。

## 删除的公开 API（Workspace 同步清单）

- 导出：`PaperPreviewDialog`、`PaperPreviewVersion`、`PaperPreviewAction`、`clampPaperPage`、`stepPaperZoom`、`paperZoomAnchor`（后三者仅供旧单页使用）。
- PaperPreview：`layout="single"`、`variant`（default/canvas）、`title`、`subtitle`、`status`、`page`、`defaultPage`、`onPageChange`、`onRotationChange`、`state`、`errorMessage`、`onRetry`、`information`、`informationSlot`、`versions`、`onSetCurrentVersion`、`actions`、`onAction`、`hasPrev`、`hasNext`、`onPrev`、`onNext`、`onClose`。
- 弹窗专属：`open`、`onOpenChange`、`triggerLabel`、`returnFocus`；PaperPreviewPage：`quality`、`anomaly`（仅旧单页呈现，现由宿主声明并显示）。
- ScoreReview：`paper`。混排分支只接受 `layout/mixed`，不再接受以前被忽略的外层连续模式属性。
- 保留：`PaperThumbnail`（Attachment 使用）、`PaperPreviewPage.thumbnailUrl`、`paperDimensions`、`clampPaperZoom`、`paperZoomPercent`、`rotatedPaperDimensions`，以及下列连续／混排导出。

## 连续模式事实边界

`pages` 是完整有序页槽，含缺图占位；每纸支持 id/imageUrl/thumbnailUrl/alt/paperSize/orientation/dimensions/regions。缺图默认显示“扫描图像未提供”；无页面返回空画布，不伪造图像。加载、错误、异常和版本提示由宿主承载，连续引擎没有旧单页的图像失败重试面板。

`zoom/defaultZoom/onZoomChange` 支持 page/width/百分比，默认 page，数值限 5%–300%；非受控缩放保存在入口，受控等待宿主回传。`rotation` 是按页的外部查看角度字典，`defaultRotation` 提供初始值。无内置旋转按钮或旋转意图回调。连续引擎的拖动、Ctrl/⌘ 滚轮、双指缩放保持原行为；旧单页的键盘、双击与双指轻点处理器已移除，框架快捷键由宿主管理。

区域百分比坐标沿用 DocumentRegionViewer，尺寸/旋转不改写源事实。选中和显式定位独立于滚动；DocumentRegionViewer 的原有独立用法不变。coss、依赖、视觉令牌和组件目录数量不变。

R1 复用判断：本轮是删除旧路径，不新增或改造基础控件；沿用已存在的 ReviewWorkspace、PaperPreviewContinuous/Mixed、Surface 与固定 coss Toolbar/DocumentRegionViewer 组合。已有 coss particles（p-toolbar-1、p-frame-1 等）及 Beautiful UI 的历史检索如下，不声称重新联网检索或复制上游代码。

## C1 连续模式与贴纸侧签（2026-10-02）

R1 保留连续与混排引擎、侧签及两份评审页的冻结渲染；旧单页与弹窗快照随退役移除。

复用检索：依据 [冻结稿](paper-review-design.md) D7/D8 和 [题目稿](question-review-design.md)，复核 Supervisor 579 项 registry 缓存与 p-toolbar-1、p-frame-1、p-meter-3、p-group-11、p-combobox-10/8、p-tabs-14/10；连续画布复用 DocumentRegionViewer 坐标和旋转，侧签复用 coss Toolbar。无对应完整连续预览粒子，增强已有 PaperPreview，不新建目录；通用文档组件不涉及 Beautiful UI。未重新联网获取。

| 属性 / 导出 | 契约 |
| --- | --- |
| `layout?: "continuous"` 或 `layout: "mixed"` | 默认连续画布；预览一份试卷须组合全屏 ReviewWorkspace；不注入文档导航、缩略图或工具条。mixed 分支必须传 mixed，不再传无用的外层 pages。 |
| `PaperPreviewPage.dimensions?` | 每纸独立 `{width,height}`（有限正 CSS px）；否则按既有 paperSize/orientation 计算。 |
| `zoom`、`onZoomChange`、`rotation` | 沿用 width/page/5–300 数值缩放和每纸旋转字典；连续模式 defaultZoom=page 保持不变，冻结宿主显式传 width。提供 onZoomChange 时由宿主回传受控值。 |
| `continuous.viewportRef`、`scale?=1` | 共享滚动视口引用与评审框变换比例，手势转换使用逻辑坐标。 |
| `continuous.onVisiblePage?`、`onViewport?` | 按可见面积报告零基纸索引，以及扣左右留白和工具条后的可用尺寸；滚动不改变 selectedRegionId。 |
| `continuous.gap?`、`toolbarWidth?=56` | 纸间距默认 CSS 16px；为纸列右缘侧签预留宽度。 |
| `continuous.beforeContent?`、`renderPageHeader?(page,index)` | 纸列前置内容、每纸外部页眉。插槽不参与纸张缩放与旋转；未传不增加 wrapper。可供第二批题目卡和学生身份使用。 |
| `continuous.location?` | `{pageId?,regionId?,request?,focus?}`，显式请求定位；同目标重复请求增加 request。regionId 优先，居中区域；pageId 定位纸顶。reduced-motion 用 instant，其余 smooth。 |
| `continuous.spotlight?`、`original?` | 可选区域聚光；原稿取消遮罩，选中环由 Surface 保留。未开聚光保持调用方 regions.content。 |
| `continuous.emptyImageText?` | 单纸无图文案，默认“扫描图像未提供”；不会虚构图像或数据。 |
| `PaperPreviewContinuous` | 同目录低层导出，可直接受控组合；完整 props 见源码，包括 pages/zoom/rotations/selected/onSelect/onZoom。 |
| `locatePaperTarget(viewport, target, scale?)` | 现有宿主定位迁移工具，与 location 同协议；不创建业务状态。 |
| `PaperPreviewSurface` | 包含 canvas、paper host、侧签壳；children 为画布，toolbar 为 coss Toolbar 插槽，toolbarRef 指向工具条，viewportRef 指向滚动视口。canvasRef、overlay、scale、layoutKey 可选。 |
| `Surface.missing?`、`emptyImageText?`、`emptyImageDetail?` | 替换整幅画布的无扫描占位，文字/页码由宿主给。 |
| `Surface.bottomInset?=0` | 宿主声明底部浮层避让（屏幕 CSS px）；冻结评审宿主传 88。组件不认识 ReviewTools。 |
| `dockPaperToolbar` | 纯函数，贴合最宽纸右缘，超宽夹取；可从 paper-preview-layout.ts 单独导入。 |

侧签观察纸/画布/工具尺寸与滚动，布局更新按外部内容重测；高度不足时内部滚动。拖动平移、Ctrl/⌘+滚轮与双指缩放沿用冻结锚点逻辑，点击与拖动分离，不设置计时器。Surface 的选中环和纸面视觉完全沿用冻结组合，CSS 不增加视觉令牌。`d1-*` 保留以确保冻结输出稳定。

纸外页眉与前置内容是第二批接口预留；题目卡的吸顶摘要、学生筛选避让和知识点证据组合未在本批接入。连续模式暂无图像加载失败重试状态（无 URL 占位已支持）；真实扫描服务未接入。浏览器几何、三主题窄屏、触控和焦点验证交 Supervisor，不把 SSR/处理器测试当作浏览器验收。

## C2 数字内容与裁切扫描混排

`PaperPreview layout="mixed" mixed={...}` 或同目录 `PaperPreviewMixed` 使用同一引擎；mixed 中 pages 为 `{id,width,height,content?,imageUrl?,alt?,regions?}`。数字 content 按容器宽布局，不参与扫描缩放/旋转；每张扫描使用独立尺寸。`beforeContent` 是纸列前置插槽，`headers` 为纸外身份，`renderSectionHeading` 为分段标题；`PaperPreviewGroup` 提供受控满分组折叠，是否加入其后纸张由宿主决定。

`topInset` 为浮动控制条实测高度 + 16，参与顶部 padding、fit-page 和可见页判定；`onQuestionHidden` 由完整 question 内容底边判定，`onScanVisibilityChange` 报告扫描纸是否可见。`activePage` 只控制外部选中事实，`onVisiblePage(index,percent)` 回传观测；显示选生由宿主选择是否跟随。`resolveScanLayout` 可适配来源裁切坐标，默认取各纸宽高与外部旋转。

PaperPreviewSurface 可选 `scanOnly/topInset`，仅吸附当前可见扫描纸右缘，没有扫描纸时回到画布侧边（不隐藏工具，保持冻结行为）。题目宿主仍用同样几何协议；无扫描夹具由宿主提供等高图像。连续与混排冻结快照不变；辅助导出不新增目录条目。

## P15 可选作答区域编辑（PO 2026-10-04 批准）

本节为实现候选，待 Supervisor 独立 Review。`regionEditing` 默认关闭；未传时保持原有 DOM 输出、区域呈现、缩放、平移与捏合行为，不改变两份冻结评审页。组件只发出区域变更意图，宿主持有 `pages[].regions`，决定区域身份、接受变更和退出编辑；没有保存、解析、裁切图像或持久化行为。

### 属性与坐标

连续模式在 `PaperPreview` 顶层传 `regionEditing`；mixed 模式传 `mixed.regionEditing`。低层 `PaperPreviewContinuous` / `PaperPreviewMixed` 同样接受此属性。

```ts
type PaperPreviewRegionChange = {
  pageId: string
  regionId: string | null
  label: string
  rect: [number, number, number, number]
}

regionEditing?: {
  pageId: string
  regionId: string | null
  label: string
  minSize?: number // 默认 0.02，即页面宽、高的 2%
  onChange: (change: PaperPreviewRegionChange) => void
  onCreate?: (change: PaperPreviewRegionChange) => void
}
```

| 属性 / 导出 | 契约 |
| --- | --- |
| `pageId` | 只启用指定页面，其他页面仍按既有方式浏览。mixed 的数字 `content` 页不挂载编辑层。 |
| `regionId` | `null` 表示新建；仅存在 `onCreate` 时开启框选。非空 ID 必须匹配该页已有区域，才显示调整框与八个手柄；不猜测或补造缺失区域。 |
| `label` | 宿主提供的可读区域名称，用于编辑区可访问名与回调，不把内部 ID 当作名称。 |
| `minSize` | 归一化最小宽、高，默认 `0.02`；移动和调整均约束在页面内。 |
| `onChange` / `onCreate` | 分别请求调整已有区域 / 新建区域；拖动结束仅发一次，回调不是保存成功。新建回调的 `regionId` 为 `null`，宿主分配正式 ID 并回传区域。 |
| `documentRectToPaperRegion` | 将既有 `DocumentRegion.rect` 的 0–100 百分比转换为编辑 API 的 0–1 矩形。 |
| `paperRegionToDocumentRect` | 将编辑 API 的 0–1 矩形转换为既有 `DocumentRegion.rect` 的 0–100 百分比，供宿主回写 `pages[].regions`。 |

编辑回调的 `rect=[x,y,width,height]` 相对于**未旋转页面**，四项使用 0–1 归一化坐标；页面缩放、滚动位置和 0/90/180/270° 查看旋转不改变此来源坐标。既有 `regions` 仍为 0–100 百分比，不能直接把回调的 `rect` 放入其中。任务草案将两者描述为相同口径，本实现明确分开并提供转换，不修改已有区域语义；这是 API 口径澄清。

### 手势、键盘与受控更新

- 新建时在指定页面按下并拖动画框；调整时拖动框内部移动，拖动四角或四边手柄改变大小。单指编辑优先于页面平移；调整框外仍可拖动平移。
- 调整态由编辑层替换目标区域原有的定位按钮、边框与自定义区域覆盖内容，避免拖动中出现两个目标框；图像及其他区域保留，退出后恢复原呈现。显式区域定位仍可找到编辑框。
- 拖动期间只显示临时草稿；`pointerup` 提交一次意图。`Esc`、`pointercancel` 或丢失指针捕获丢弃草稿，不发回调，显示宿主原区域。组件等待宿主回传接受后的区域，不把临时草稿当作已保存事实。
- 第二指加入时取消当前草稿，把双指交还既有捏合缩放；Ctrl/⌘+滚轮先取消草稿，再按既有锚点缩放，避免一个手势同时改区域与页面。pointer events 覆盖鼠标、触笔和触屏；真实设备表现交 Supervisor 验收。
- 调整区是单一可聚焦 `group`，使用可访问名称及 `aria-describedby` 关联操作说明。八个手柄仅是指针命中区，`aria-hidden`，不增加八个 Tab 停止位。
- 聚焦调整区后，方向键按**屏幕方向**移动，每次为页面比例 `0.005`（0.5%）；Shift+方向键调整屏幕右边或下边，按查看旋转映射到来源边，遵守页面边界与最小尺寸。键盘处理只在编辑区，不注册全局 keydown，也不接管框架快捷键。
- 新建区可聚焦，Enter/Space 请求在页面中心建立默认宽、高各 20% 的矩形，并遵守最小尺寸；这是拖动画框的键盘替代路径。
- 宿主移除 `regionEditing` 即退出框选/调整；组件不自行切换业务阶段。mixed 数字内容页不支持区域编辑，不能用数字内容的 DOM 尺寸推定原卷坐标。

组件页增加「框选作答区域」示例：宿主管理新建、调整、退出与重置，显示当前 0–1 坐标；示例接受的变更只保存在当前页面内存。浏览器验收应覆盖 `/next/components/paper-preview` 的鼠标新建、八手柄与框内拖动、退出/重置、缩放及四种旋转、双指中断与缩放、键盘移动/调整/创建及 Esc 取消，并核对 light/paper/dark、320px、长中文与公式。编辑描边、手柄和填充只用既有品牌/语义令牌；不新增视觉令牌或动效。浏览器验收按分工由 Supervisor 执行，SSR 与纯函数测试不代替该验收。

### P15 离线复用依据

本轮遵循 Builder 不联网约定，实际核对本地固定 coss 54 项、现有 particles 适配及上述历史记录；不声称重新抓取或穷举最新上游。

| 来源 | 核对内容与取舍 |
| --- | --- |
| coss | `vendor/coss-manifest.json` 与现有 Button / Card / Toolbar / Slider / ScrollArea；本地没有二维裁剪、框选或八手柄组件。标准操作继续复用 Prism / coss Button，不修改固定源码。 |
| coss particles | 核对本地 `demos/selection-particles.tsx`，其 `p-select-6/18/7/21` 和 `p-combobox-9/8/18` 是选项选择，并非矩形框选；复读冻结文档的 `p-toolbar-1` / `p-frame-1` 等组合记录。历史 registry 缓存本轮不可用，现有证据未提供可复用的区域编辑器，不据此断言完整上游不存在。 |
| Beautiful UI | 复读本页 Context Cards 历史记录及 `docs/dialog-layout.md` 中 Approval Card / Selection Actions 记录；这些是内容卡片与内联对象操作，现有证据没有裁剪或八手柄实现。本轮未联网验证完整注册表、未复制 Beautiful UI 代码。 |
| 既有 Prism | 复用 DocumentRegionViewer 的页面百分比、旋转与区域呈现，扩展 PaperPreview 的连续/mixed 扫描画布。AgentImageCanvas 的 `agentImageRectFromPoints` 只有单图百分比两点框选，缺少旋转、八手柄和连续画布；沿用其边界校验与意图原则，不引入 Agent 能力、业务状态或图像裁切服务。 |

## 历史复用检索与取舍（退役前记录）

| 来源 | 实际查阅 | 匹配情况与选择 |
| --- | --- | --- |
| coss 官方 | https://coss.com/ui/docs/components/dialog；https://coss.com/ui/particles | Dialog 文档有焦点管理、滚动与关闭结构；particles 页可读取 510 条总数，但未返回条目内容。 |
| coss 注册文件 | https://coss.com/ui/r/registry.json；https://coss.com/ui/r/p-dialog-1.json | 未能联网检索文件内容：web 访问失败，shell 请求的本地代理 127.0.0.1:7897 不可达。不得据此断言不存在 lightbox/carousel/zoom。 |
| 本地固定 coss | `vendor/coss-manifest.json`，54 项；Dialog、Sheet、ScrollArea、Button、Card、Skeleton、Empty | 没有本地 image viewer/lightbox/carousel/zoom 专项。选 Sheet 全屏承载，原生局部滚动与百分比缩放；不修改 coss。 |
| 本地 particles 适配 | `demos/dialog-particles.tsx` 的 p-dialog-5（长内容与固定操作区）、p-dialog-4（提交关闭） | 可参考承载结构，不引入提交、计时器或业务状态。在线注册索引及完整 510 条检索仍缺失，ESCALATE。 |
| Beautiful UI | https://www.beautifului.dev 首页 21 类目录；https://www.beautifului.dev/r/context-cards.json | 首页 Context Cards 是检索内容块（含文件来源），未见独立文件/图像 lightbox；注册文件未能联网检索，ESCALATE，不断言完整注册表无匹配。未复制其代码。 |
| 本仓库 | DocumentRegionViewer / answer-review-map | 复用区域坐标、选中与定位；兼容扩展 pageLayout，使外层承担纸张几何与滚动，使用 coss Card / Prism Button 表面。旧调用保留原行为。 |
| 本仓库 | AgentObjectViewer、AgentCaptureScan、AgentImageCanvas、AgentFileInput | 分别侧重对象身份、采集事实、图像编辑意图与附件输入；不具备试卷多页/异常/扫描版本完整组合，故新建 PaperPreview 组合，保留职责边界。 |
| Workspace（只读） | SmartGradingPaperPreview.tsx | 参考 fit 转手动前测量实际宽度；不导入任务、Submission、Store 或持久化。 |
| Figma（只读） | S17 / S18 / S19 / S26 / S34 / S35 六张本地截图 | 只提取页面、缩略图、版本、异常和答题区域结构；不复刻视觉或搬入复核评分业务。 |
