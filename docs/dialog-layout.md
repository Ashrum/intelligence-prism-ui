# Dialog Layout 对话框版式

PO 2026-10-04 批准新增一个 `kind: pattern` 目录项。入口 `/next/components/dialog-layout`；源码 `components/prism-next/dialog-layout.tsx`。当前为 Builder 候选，独立 Review 与浏览器验收由 Supervisor 执行。

## 复用依据

- Supervisor 任务书提供检索：coss particles `p-alert-dialog-1` / `p-alert-dialog-2` 为基础确认框；Beautiful UI Approval Card / Selection Actions 为内联对象操作，没有媒体栏、网格和记录单的弹层。本轮未重复联网、未复制 Beautiful UI 代码。
- 本地核对 `coss/dialog.tsx`、`alert-dialog.tsx` 和 `demos/dialog-particles.tsx`：已有 `p-dialog-4` / `p-dialog-5` 编辑与固定操作区示例，没有所需媒体版式。沿用 DialogPopup、Title、Description、Close，不改 coss 字节。
- 操作复用 coss Button / buttonVariants；单选复用 coss RadioGroup / Radio，网格项适配同文件公开的 RadioPrimitive.Root/Indicator，复用方向键机制。
- 标签复用 Prism Badge。Attachment / PaperCard 使用的 PaperThumbnail 实际定义在 `paper-preview.tsx`，是非交互缩略图，适合作为 Evidence 插槽；不嵌套可点击的 PaperCard。

## API

各部件从 `components/prism-next/dialog-layout` 导入；无数据获取、模型、业务 Store、权限、持久化、计时器或执行状态推断。

| 部件 | 属性与约定 |
| --- | --- |
| DialogLayout | 必填 `open: boolean`、`onOpenChange`（coss 原签名）、`title: string`、`closeLabel: string`；标题和关闭名称拒绝缺失或空白。可选 ReactNode 插槽 `eyebrow/description/media/children`。`size?: sm/md/lg/xl` 默认 md，对应 32.5/40/45/51.25rem，默认字号时约 520/640/720/820px，受视口限制。`accent?: boolean` 默认 true；`initialFocus` 原样传入 coss。 |
| 底栏 | `footer` 优先于 `footerStart/footerEnd`，全部省略则不创建底栏。`footerLayout?: split/equal` 默认 split；split 弱操作居首、主操作组居末；equal 两等宽列，适合各放一个同 variant 的按钮。自定义 footer 在 equal 模式应提供两个直接子节点。 |
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
- 初始焦点、焦点约束、Esc、外部点击关闭和关闭后回焦沿用 coss；宿主应从仍挂载的可聚焦入口打开。onOpenChange 不代表业务成功；受控值反馈前保持旧状态。
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

六个锚点：`#dispose/#assign/#record/#reason/#small/#long`。页面统一标注中性示例、不连接服务；请求只显示“已触发…请求”，选项和文本只更新演示宿主草稿。

SSR 测试内联 portal 边界，检查真实 coss Popup、Title、Close 和 radio；另测正常 portal 关闭时不输出内容。这不替代浏览器焦点验收。三主题、320/390px/桌面、长中文/公式、键盘/焦点、缩放与滚动交给 Supervisor。
