# Dialog Layout 对话框版式

PO 2026-10-04 批准新增一个 `kind: pattern` 目录项，并直接要求继续根据 COSS 和优秀对话框补全。入口 `/next/components/dialog-layout`；源码 `components/prism-next/dialog-layout.tsx`。v0.2 为本地补全候选，保留原画布版式与固定 coss 来源。

## 复用依据

- 最初 Supervisor 任务书提供检索：coss particles `p-alert-dialog-1` / `p-alert-dialog-2` 为标准 / bare footer 确认框；Beautiful UI Approval Card / Selection Actions 为内联对象操作，没有媒体栏、网格和记录单的弹层。本轮不涉及 Agent 组件，不复制 Beautiful UI 代码。
- 2026-10-04 联网复查 [COSS Dialog](https://coss.com/ui/docs/components/dialog)、[particles](https://coss.com/ui/particles?tags=dialog)、[registry](https://coss.com/ui/r/registry.json)：`p-dialog-1/2/3/4/5/6` 分别为表单、菜单触发、嵌套、关闭确认、长内容、bare footer。复用 `p-dialog-1/3/4/5` 的交互结构；没有所需媒体版式，保留现有 Prism 组合。既有 `demos/dialog-particles.tsx` 继续留在基础 Dialog 页；本轮全部增量在 Dialog Layout 完成，不改 coss 字节。
- 操作复用 coss Button / buttonVariants；单选复用 coss RadioGroup / Radio，网格项适配同文件公开的 RadioPrimitive.Root/Indicator，复用方向键机制。
- 标签复用 Prism Badge。Attachment / PaperCard 使用的 PaperThumbnail 实际定义在 `paper-preview.tsx`，是非交互缩略图，适合作为 Evidence 插槽；不嵌套可点击的 PaperCard。

### 全网参考与取舍

只采用交互与可访问性做法，不引入其他库的实现、样式或依赖。

| 官方来源 | 采用 | 取舍 |
| --- | --- | --- |
| [Base UI Dialog](https://base-ui.com/react/components/dialog) | initialFocus / finalFocus、外点控制、关闭事件取消与完成回调 | 已核对本地 1.8.0 类型，原样透传；继续由 coss 管理焦点与模态机制。 |
| [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog#close-after-asynchronous-form-submission) | 受控提交，收到成功结果后关闭 | 等待、失败、草稿由宿主决定；演示手动提供结果，不加延迟计时器。 |
| [React Aria Modal](https://react-aria.adobe.com/Modal) | 外点与键盘关闭分别控制 | disablePointerDismissal 不等于禁用 Esc；宿主在 onOpenChange 使用 details.cancel() 拦截。 |
| [Carbon Modal](https://www.carbondesignsystem.com/building-blocks/core/components/modal/guidelines#overflow-content) | 正文滚动、固定标题与操作区、明确动作名称 | 保持已有语义字号与 coss 操作尺寸，不复制 Carbon 表面或按钮。 |
| [WAI APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | 长文起始静态元素焦点、关闭回入口、危险确认优先较安全操作 | bodyLabel 为阅读正文提供键盘滚动入口；不把整篇长文绑为 aria-describedby。 |

## API

各部件从 `components/prism-next/dialog-layout` 导入；无数据获取、模型、业务 Store、权限、持久化、计时器或执行状态推断。

| 部件 | 属性与约定 |
| --- | --- |
| DialogLayout | 必填 `open: boolean`、`onOpenChange`（coss 原签名）、`title: string`、`closeLabel: string`；标题和关闭名称拒绝缺失或空白。可选 ReactNode 插槽 `eyebrow/description/media/children`。`size?: sm/md/lg/xl` 默认 md，对应 32.5/40/45/51.25rem，默认字号时约 520/640/720/820px，受视口限制。`accent?: boolean` 默认 true；`initialFocus` 原样传入 coss。 |
| 焦点与关闭 | `finalFocus` 传入 coss Popup；`onOpenChangeComplete` 与 `disablePointerDismissal` 传入 coss Root。`closeDisabled?: boolean` 默认 false，仅禁用标题区 X；关闭政策由宿主在 onOpenChange 取消事件并维持受控 open。不可把“禁用 X”当成阻止 Esc；至少提供完成、重试或退出的可达路径。 |
| 阅读正文 | `bodyLabel?: string`：提供时必须非空；正文成为有名称的 region，`tabIndex=0` 可键盘滚动；省略则不新增 Tab 停靠点。初始焦点可以指向正文顶部 `tabIndex=-1` 的静态元素。 |
| 底栏 | `footer` 优先于 `footerStart/footerEnd`，全部省略则不创建底栏。`footerLayout?: split/equal` 默认 split；split 弱操作居首、主操作组居末；equal 两等宽列，适合各放一个同 variant 的按钮。只有一个直接子节点时占满两列。正文 Form 的 id 可通过底栏 Button 的原生 form 属性关联，关闭按钮使用 DialogClose，保证统一经过 onOpenChange。 |
| DialogEvidence | 必填 `thumbnail: ReactNode/title: string`；可选 `facts: readonly ReactNode[]`、`status: {label,tone?}`。tone 为 neutral/info/success/warning/error，默认 neutral。提供 `onView` 时缩略图整体成为原生按钮并带放大角标；`viewLabel` 默认“查看大图：标题”。无回调则静态呈现。thumbnail 必须为非交互内容。 |
| DialogSection | `title: string/children`；小节与标题用唯一 ID 关联。 |
| DialogOptionTile | 原生 button 属性，必填 title/description；可选 icon、`emphasis: primary/default`（默认 default）、disabledReason。disabled 或提供原因均禁用，原因可见并关联按钮。图标仅装饰。 |
| DialogQuietActions / DialogQuietAction | Actions 接 children，提供统一边框与分隔线；Action 接原生 button 属性及 title/description，右侧箭头、coss ghost Button。 |
| DialogOptionGrid | 必填 `label: string/value: string或null/onValueChange(value: string)`；可选 disabled。`columns?: 2或3或4` 默认 3；传 children 或 `groups: {id,title,description?,children}[]`，groups 优先，空分组省略。没有子项时仅在提供 emptyText 后显示空态。宿主负责查询筛选，搜索不清除已有选择。 |
| DialogOptionGridItem | 必填唯一 value/title；可选 description、`status: {label,tone?}`、disabled、disabledReason。状态点伴随文字，选中由组的 value 决定。 |
| DialogChoiceList / DialogChoice | List 与 Grid 相同的受控 label/value/onValueChange/disabled，加 children 和 other 插槽；Choice 接 value/title/description/disabled/disabledReason。other 在单选组后，由宿主控制显隐；输入须有常驻标签。 |
| DialogRecord | `rows: readonly {label: string,value: ReactNode}[]`，dl/dt/dd 分隔行；不补零值或成功文案。 |
| DialogNotice | children、`tone?: warning/info/error` 默认 info；图标与语义色。不自动加 alert/live，动态播报由宿主提供。 |

## 可访问性与响应式

- title 通过 coss DialogTitle 与显式 aria-labelledby 作为名称；description 仅存在时关联；closeLabel 指定关闭按钮名称。
- 初始焦点、焦点约束、Esc、外部点击关闭和关闭后回焦沿用 coss；宿主应从仍挂载的可聚焦入口打开，或提供 finalFocus。onOpenChange 不代表业务成功；受控值反馈前保持旧状态。示例的六个版式入口与编辑入口均显式回焦。
- 未提交关闭使用嵌套 AlertDialog；父层取消关闭事件，继续编辑保留草稿。确认层默认聚焦继续编辑 / 保留材料；外点不关闭，Esc 只关顶层。放弃同时关闭父子弹层时两层均回原入口，避免指向卸载字段。
- 一个分组网格只有一个 radiogroup，各子组有名称和可选描述。Tab 进入单选组，方向键按 coss DOM 顺序循环并跳过禁用项，Space 选择，不按二维网格推算上下邻居。ChoiceList 同样沿用 coss。
- 桌面媒体栏宽 196px；视口小于 640px 或高度不超过 512px 时隐藏。关键对象、事实和必需查看入口应由宿主放在标题、描述或正文，media 仅作辅助上下文；媒体只放一张图和简短事实，不放长列表。宿主可用 `dialog-layout-media-fallback` 布局类在媒体隐藏时显示正文中的替代事实与查看入口，示例已覆盖。
- 正文为唯一滚动容器，外壳最高 `100dvh - 2rem`，标题与底栏保留；媒体不另建滚动条。底栏按钮可换行，equal 仍两列。网格小于 640px 为两列，小于 368px 为一列。长中文换行、不缩字，公式由宿主保留 MathML。
- 在 `data-ui-version="coss-v1"` / `data-prism-theme` 主题根下使用，portal 继承根主题；只用现有语义/品牌令牌。进出场沿用 coss，减少动效由全局规则和 popup motion-reduce 适配。

## 使用边界与画布偏差

带对象媒体、多处理方式、分组选项或记录单时用此版式；很短的编辑可直接用原始 Dialog；不可逆或危险操作的最终确认用 Alert Dialog。

结构沿用冻结画布三色细线、196px 媒体栏、头部/正文/底栏和主次关系。差异逐条记录：

1. 画布 11/12/13px 说明提升到语义 ui-hint（14px），标题用 section-title，不复制局部字距。圆角、阴影、颜色用已有令牌和 coss 外壳。
2. 缩略图为宿主插槽；示例显示 PaperThumbnail 的“扫描图像未接入”，不伪造扫描/叠纸。Badge 在图下，避免语义字号遮挡图像。
3. 三主题表面、柔光和选中态用主题令牌、品牌混色与 ring/accent，不复制每主题硬编码色值。主按钮保留标准 coss 样式，不另画渐变包边。
4. 窄/矮视口隐藏媒体、网格减少列数，长中文不做画布的单行省略；理由圆点与记录底栏高度采用标准 coss 控件。

## 示例与验证边界

七个交互锚点：`#dispose/#assign/#record/#reason/#small/#long/#form`，以及 `#references` 官方参考。页面统一标注中性示例、不连接服务；请求只显示“已触发…请求”，选项和文本只更新演示宿主草稿。移出操作需嵌套确认；取消与 Esc 保留原选择。

表单示例用必填标题和可选备注，验证失败聚焦标题；提交进入等待，标题与备注只读，X / 取消 / 外点 / Esc 均不能丢弃当前提交。宿主通过“返回失败 / 返回成功”手动提供结果：失败保留输入并可重试；成功只更新本页示例记录并回入口。无网络或计时器。未提交时取消、X、Esc 和外点共用关闭确认。

SSR 测试内联 portal 边界，检查真实 coss Popup、Title、Close 和 radio；另测正常 portal 关闭时不输出内容、焦点/关闭原签名透传、具名正文与目录注册。这不替代浏览器焦点验收。浏览器验证记录见下方交付证据；真实服务、移动设备软键盘和读屏器不在本轮本地验证范围。

## v0.2 本地交付证据 · 2026-10-04

- 数学字体与语义排版检查通过（260 个自有 TSX）；TypeScript `--noEmit` 退出码 0；vinext 构建成功；全量测试 **1292 / pass 1292 / fail 0 / skipped 0**。日志在本地 `.sites-runtime/dialog-layout-build.log` 与 `dialog-layout-tests.log`。固定 coss 文件与依赖未修改。
- 独立 Codex 只读初审为 `PASS WITH NOTES`；补齐浏览器证据并复核焦点、单槽底栏、圆角裁剪增量后，最终结论 **`PASS`**。当前仍是本地候选，不等于 Supervisor 的合并或发布验收。
- 已重新打开 `http://127.0.0.1:5173/next/components/dialog-layout`，核对七个交互示例与参考链接；最终页面无浏览器 error 日志。
- 表单实测：空标题 → “请输入材料标题。”并回错误字段；等待时 X / 取消禁用，Esc / 外点保持弹层；手动失败保留“待复核材料乙”，重试成功只更新本页记录并回入口。取消、X、Esc 与外点触发未提交确认；确认层外点保持；继续编辑保留原备注，放弃同时关闭父子弹层，最终焦点为“打开编辑材料说明”。
- 移出实测：确认默认聚焦“保留材料”；Esc 只关顶层并回“移出当前范围”；确认后父层保留，仅显示移出请求反馈。分组单选方向键跨组循环、跳过成员己；空搜索保留成员甲的选择与预告，Tab 保持在当前弹层。其他理由为空或仅空格时禁用确认，有内容后发出请求反馈。
- 视觉检查覆盖 `light/paper/dark`：默认桌面与 1280×900、390×844、320×740。媒体栏在窄屏隐藏，正文替代事实与查看入口可达；390px 为两列，320px 为一列，长中文完整换行。记录单两操作均为 150px；320px 单槽底栏按钮为 238px，占满扣除左右内边距后的空间。修复居中嵌套 Alert 的窄屏底栏穿出圆角：示例仅加 `overflow-hidden` 布局裁剪。
- 长文实测：12 段 MathML 保留；Page Down 后正文 scrollTop 从 0 到 700，标题 y=20、底栏 y=826 不变。320px 正文仍可键盘滚动，无横向滚动。844×390 矮视口的媒体隐藏、正文滚动，底栏 bottom=373 可用。临时减少动效测试中 Popup / Backdrop transition-duration 均为 `1e-05s`，正文 scroll-behavior=auto；测试后恢复默认视口、原浅色主题与正常动效设置。

截图保存在本次 Codex 附件目录 `dialog-layout-review/`：`light-desktop-form-failure.jpg`、`paper-desktop-selection.jpg`、`paper-desktop-long.jpg`、`dark-desktop-form-waiting.jpg`、`light-320-selection.jpg`、`light-390-selection.jpg`、`paper-390-record.jpg`、`paper-320-long.jpg`、`dark-390-form-waiting.jpg`、`dark-320-confirmation.jpg`、`dark-320-single-footer.jpg`、`paper-short-viewport.jpg`。浏览器视口测试不覆盖真实移动设备软键盘、读屏器或浏览器页面缩放。
