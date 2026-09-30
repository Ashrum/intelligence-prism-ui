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

组件页提供 6 页缺页学生卷、12 页 A3 批阅资料、带公式的区域复核、三状态、三主题和 320px 长中文夹具。不使用“示例/演示”标签，不把按钮请求当作真实扫描结果。SSR / 事件处理器检查无法验证真实焦点、键盘布局、缩放测量与视觉；需 Supervisor 浏览器复验，真实扫描服务、移动设备及读屏器未验证。
