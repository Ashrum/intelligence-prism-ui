# Paper Preview 试卷预览 v0.1 · 组件候选

PO 2026-09-30 批准新增目录项，目录为 81 项。入口 `/next/components/paper-preview`；仅 Builder 实现，独立 Review 与浏览器验收由 Supervisor 完成。

## 复用检索与取舍

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

## API 与行为契约

- `PaperPreview` 内嵌；`PaperPreviewDialog` 复用 coss Sheet 的全屏容器、Esc、焦点陷阱和触发器焦点返回。`open/onOpenChange` 可受控，`triggerLabel` 命名内置触发器，`returnFocus` 可指定返回元素；关闭发 `onClose`。受控打开状态须由调用方响应 `onOpenChange`。
- `pages` 是调用方提供的完整有序页槽（包含缺页占位）；`page/defaultPage` 从 0 开始，`onPageChange(index)`。越界展示值钳制，不改写调用方事实、不自动发事件。文档/版本改变时宿主可用 React key 重置非受控视图。
- 每页有 `id/imageUrl?/thumbnailUrl?/alt?/paperSize?/orientation?/quality?/anomaly?/regions?`。缺图显示“扫描图像未接入”；纸张默认 A4 纵向（可 A3/横向），比例采用毫米尺寸；100% 以 96 CSS px/in 换算，不宣称物理打印大小。缩略图无 URL 同样占位，不造扫描图。
- `zoom/defaultZoom/onZoomChange` 值为 `"page" | "width" | number`，number 为百分比，默认 `page`。页面/宽度适配随 ResizeObserver 调整；所有比例限定 5%–300%。± 从实际 DOM 宽度换算的比例连续乘 .8 / 1.25，不从 100% 跳变；事件只因用户选择发出。
- 键盘左右键仅在扫描画布中翻页，不抢信息栏、输入或组合键；首尾禁用按钮。缩放后画布局部滚动；窄于 52rem 的组件容器将信息栏下移。
- `regions` 沿用 DocumentRegion 的百分比 `[left,top,width,height]`（相对整页）；宿主保证坐标有效。`selectedRegionId/onRegionSelect(pageId,regionId)` 控制定位；框线、文字标签和下方区域按钮同时提供定位入口。只呈现已有框，不创建新标注。
- `DocumentRegionViewer.pageLayout={width,height}` 单位 CSS px；启用时使用主题化 Card / Button 与外部尺寸，不附加旧 viewport、固定最小宽度或 50% 下限。未传此属性的原调用不变。pageLayout 模式省略 `onSelect` 时区域按钮禁用。
- `title/subtitle/status`、`information[{label,value}]/informationSlot` 由调用方提供。未知标题、副标题、状态、键值和版本显示“未提供”；页面未提供质量时不推定正常。`anomaly` 同时在主预览和缩略图呈现文字。
- `versions` 是外部事实；历史版仅 validated 与 restorable 都为 true 且存在 `onSetCurrentVersion(id)` 时可操作。点击仅发请求，不把历史版标为当前、不伪造校验或恢复成功。
- `actions[{id,label,primary?,disabled?}]/onAction(id)`；`hasPrev/hasNext/onPrev/onNext` 默认边界禁用。业务操作均不切换外部状态。缺少回调的动作禁用。
- `state=ready|loading|empty|error`；Loading 复用 Skeleton，Empty 显示无页面，Error 有错误文字和 `onRetry` 意图。图片网络失败独立显示“图像加载失败”，重试重新挂载图像并通知宿主；URL/页身份变化重置图片错误。
- 不内置服务、上传/扫描执行器、Store、路由、权限或持久化；数据与插槽必须由宿主完成访问控制。未知不推断。动效沿用 coss 及全站减少动效适配。

## 验收范围

### 2026-10-02 P1：旋转与手势

- 本轮 registry 由 Supervisor 在线提供（`https://coss.com/ui/r/registry.json`，审核缓存 579 项），Builder 读取缓存核对，无专用 lightbox/image viewer/dropzone。缓存位于 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`。复核 coss Button/Card/Sheet；Ant Design Image 只沿用 Supervisor 的能力对照，不复制代码。既有 Beautiful UI Context Cards 是来源内容块，无法承担纸张几何，选择在现有组件内适配原生 Pointer/Wheel，不增加依赖。
- 可选 `rotation?: Record<string, 0|90|180|270>`、`defaultRotation?`、`onRotationChange?(pageId, degrees)`。受控时等待宿主回传；非受控按页 ID 保存查看角度。默认零度，工具栏明确新增 44px 左/右旋转按钮，canvas 同样保留；缩略图不旋转。
- 90/270 度交换纸张宽高，fit 基于旋转包围盒；图像与百分比区域层一起变换。DocumentRegionViewer 可选 `pageRotation` 默认 0、`locateOnResize` 默认 true；PaperPreview 关闭尺寸变化自动定位，避免覆盖缩放锚点，显式区域定位仍保留。
- 放大溢出后鼠标/笔按住拖动平移，5px 阈值；单指触摸交给浏览器原生滚动，组件不拦截或自定义平移。拖动或双指操作后的指针点击不触发区域，键盘点击与局部滚动保留。Ctrl/Cmd+滚轮（含 ctrl+wheel 触控板捏合）使用局部非 passive 监听，普通滚轮不拦截；deltaMode 换算后的每事件有效 delta 限在 ±25，系数 0.01，单次最多放大约 1.28 倍，小 delta 保持连续。双指间距缩放保持自定义，范围 5%–300%，全部经 onZoomChange。指针/双指中心的纸张归一化坐标用于锚点恢复，受控模式等待宿主返回请求值。
- 双击、300ms 内位移不超过 5px 的双指轻点切换 page/100；取消手势不触发轻点，pointercancel / lostpointercapture 清理对应指针，全部结束后清理双指状态和锚点。视口 `touch-action:pan-x pan-y`，允许单指原生滚动；不设置 overscroll-behavior 限制，滚动到边界可继续滚动外层页面。浏览器接管手势时服从 pointercancel；双指捏合/轻点需在真实触屏上复验。键盘 +/=、-、0、R、Shift+R，左右翻页保留，输入区与组合输入忽略。无新增动画/计时器，轻点只比较事件时间戳。
- 默认 DOM 与 main 8ba0cd6 快照比较，仅排除本任务授权新增的旋转按钮和键盘说明，并归一化 React 不透明 ID。零度区域结构保持不变。新增固定 A3 横版测试图、A4、regions 夹具，三主题 320px 展示旋转状态。
- 几何、锚点、受控/非受控、键盘、Pointer/Wheel 处理器由自动测试覆盖；浏览器视觉、真实触屏/触控板捏合、读屏器交 Supervisor 补验。coss、依赖、令牌和目录项不变。

组件页提供 6 页缺页学生卷、12 页 A3 批阅资料、带公式的区域复核、三状态、三主题和 320px 长中文夹具。不使用“示例/演示”标签，不把按钮请求当作真实扫描结果。SSR / 事件处理器检查无法验证真实焦点、键盘布局、缩放测量与视觉；需 Supervisor 浏览器复验，真实扫描服务、移动设备及读屏器未验证。

## C1 连续模式与贴纸侧签（2026-10-02）

本轮增强已有目录组件；不传新属性时旧 `PaperPreview` 和 Dialog 的默认 DOM 与事件路径保持。重构前冻结 default/canvas/missing/empty/loading/error 六种旧调用，另保留既有手势、版本与状态测试。

复用检索：依据 [冻结稿](paper-review-design.md) D7/D8 和 [题目稿](question-review-design.md)，复核 Supervisor 579 项 registry 缓存与 p-toolbar-1、p-frame-1、p-meter-3、p-group-11、p-combobox-10/8、p-tabs-14/10；连续画布复用 DocumentRegionViewer 坐标和旋转，侧签复用 coss Toolbar。无对应完整连续预览粒子，增强已有 PaperPreview，不新建目录；通用文档组件不涉及 Beautiful UI。未重新联网获取。

| 属性 / 导出 | 契约 |
| --- | --- |
| `layout?: single或continuous` | 默认原单页实现；continuous 返回连续画布，不注入旧的文档导航、缩略图或工具条。 |
| `PaperPreviewPage.dimensions?` | 每纸独立 `{width,height}`（有限正 CSS px）；否则按既有 paperSize/orientation 计算。 |
| `zoom`、`onZoomChange`、`rotation` | 沿用 width/page/5–300 数值缩放和每纸旋转字典；连续模式默认也沿用旧 defaultZoom=page，冻结宿主显式传 width。提供 onZoomChange 时由宿主回传受控值。 |
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
