# Workspace 顶部区域 · Prism 适配契约

依据：PO 批准的 `design-topnav/project` v5 静态设计稿及唯一数值源 `design-topnav/gen.py`，包含三层结构、Agent、组卷、其他页面、状态、宽度、手机、机构标识、曜彩和 D1–D4。实现为视觉组合件，不计入 80 项组件目录。

复用检索：`Button` 提供 coss render 组合和焦点行为，`Menu` 提供菜单键盘、开关和焦点返回，`Badge` 提供计数语义外观；`Toolbar` 的现有框架并非整栏导航，`Expression` 的斜体签名只用于开始/完成时刻；站点 `shell.tsx` 已有三色竖条。旧 `WorkbenchShell` 包含业务型导航/公共面板组织，不迁入本任务。新文件仅补三层尺寸、容器响应式和品牌资产，侧栏改为复用同形 `PrismBrandMark`。

## API

组件与相关 Props 类型均从 `components/prism-next/app-bar.tsx` 导入，同时带入 `app-bar.css`；依赖 Prism 主题及 `typography.css`。根节点保留 `data-ui-version="coss-v1"`，主题通过既有 `data-prism-theme="light|paper|dark"` 提供。

| API | 输入与职责 |
| --- | --- |
| `PrismBrandMark` | `size?:number` 为最高竖条高度，默认 20px；4px 宽、16/20/12 高、2px 间距按比例缩放，始终 `aria-hidden`。AppBar 身份区默认 22px，手机 20px；站点侧栏默认 20px，外观不变。 |
| `InstitutionWordmark` | `children:string`、`maxWidth?:CSSProperties['maxWidth']`（默认 208）；唯一品牌字体消费者，单行省略和完整 title。208 是机构区总宽，标识/间距占用后字样可用宽度会更小。 |
| `AppBar` | `identity / navigation / tools?` 三个插槽及原生 header 属性；自己的实际宽度是查询容器。全局栏 56px、底边框、background 底色，桌面左 24/右 16，手机左 16/右 8。 |
| `AppBarIdentity` | `institution / href / showWordmark?`（默认 true），支持 Button 的 `render` 以接入宿主链接；完整可访问名默认“机构名 · 回到 Agent”。不内置 Agent 路由。 |
| `AppBarNavigation` | `children` 为一级空间链接、`compact` 为手机菜单，原生 nav 属性；默认可访问名“一级导航”。两种表示用 CSS 互斥隐藏。 |
| `AppBarNavLink` | `href / icon? / hideIcon?`、Button `render` 和链接事件；`aria-current="page"` 必须由宿主传。默认 ui-action 14/20/500，当前态 600 + foreground + primary 2px 内阴影下划线；默认态悬停有 36px 高、8px 圆角的 secondary 区域，当前态保持透明；焦点 ring 与下划线可共存。 |
| `AppBarSpaceMenu` | `items:readonly AppBarSpace[] / currentId? / onSelect? / placeholder? / menuProps? / popupProps?`；条目 `{id,label,icon?,href?,render?}`。有 href/render 用 coss MenuLinkItem，否则 MenuItem 只发选择意图；不改变 currentId。未知当前空间用“切换空间”，不猜第一项。触发器 40px、16px；条目 44px、16px，当前项勾与 aria-current。 |
| `AppBarToolGroup` | `visibility="always|desktop|wide|compact|phone"`，分别为总是、≥600、≥900、<900、<600；仅在 AppBar 查询容器内使用。负责工具组的可见性与布局。 |
| `BarIconButton` | `label / children / size? / count? / countUnit?`，size 为 global（40px）或 space（36px），手机各 44px；接受其余 Button 属性。有效计数自动加入可访问名，未知不补零；调用方不要在 label 再重复计数。 |
| `IconCountBadge` | `count?:number|null`。仅显示非负安全整数（包括 0），其他值不显示。复用 Prism Badge sm + component-label，12/16/500，位于相对定位父容器右上。独立使用时宿主须在所属控件可访问名中提供计数，徽标自身 aria-hidden 防重复读出。 |
| `AppBarTeachingContext` | 顶栏 School 图标 + coss Popover；任教事实、切换意图、设置入口，完整属性见下文 PO 2026-09-29 契约。 |
| `AppBarStatusButton` | Button 属性及宿主传入的 children / aria-label；28px 高、component-label、secondary 底，仅提供状态入口外观。状态与说明不在组件中内置。 |
| `AppBarPersonalMenu` | `identity:{name,institution,detail,initials} / children / menuProps? / popupProps?`；32px 头像，手机 44px 触点；300px 菜单、身份卡、40px 菜单项。宿主组合 MenuGroup / MenuGroupLabel / MenuItem 提供栏目和行为；不内置用户、审阅项或权限。 |
| `SpaceBar` | `side?:{title,collapsed,onToggle,controls?} / sideWidth? / children / tools?`，默认 sideWidth 248px；48px 高。展开左段 secondary 底+右边框，目录 item-title；收起时只显示图标按钮。中段 min-width:0、右段放空间工具。使用 role=group 与正常 Tab 顺序，不伪装具有方向键行为的 toolbar。 |
| `SpaceBarTitle` | span 属性；默认 item-title，手机用既有 block-title 字号/行高 16/24，单行省略，可传 title 保留完整名称。 |
| `PageHead` | `title / description? / actions?` 及 div 属性；h1 section-title 20/30/600，说明 ui-hint 14/22 + muted-foreground。默认内边距 24/32/16；内容区不足 600 时 20/16/12，操作区下移整行，按钮至少 44px，字号使用既有 16px token。 |

键盘逻辑继续由原生链接/Button/coss Menu 提供，未自写 keydown。所有开关/折叠只是界面状态或回调；没有执行器、计时器、模型、路由、Store、权限或持久化。减少动态效果时关闭顶部组合件内的过渡/动画；通用弹层仍沿用既有 Prism 全局减少动态效果规则。

## 宽度规则与容器责任

采用具名 CSS 容器查询，不用 viewport 媒体查询或 JS 测量来决定顶部导航密度。AppBar、SpaceBar、PageHead 分别建立自己的 inline-size 查询容器，宿主只需使它们填满实际可用区域；PageHead 跟随扣除目录后的内容宽度。这样左右栏挤占、嵌套预览及一个页面内的不同宽度实例都独立适配，无首屏测量闪动。1180/900/600 为设计源的 CSS px 断点，文字继续使用 rem 语义角色，不随宽度缩字。

接近 600px 边界或用户放大字体时，若文字导航总宽大于剩余空间，沿用字体规范“空间不足时换行或滚动，不缩字”的规则，导航内部横向滚动，保持通知与个人入口可达；Tab 可依次聚焦原生链接。常规四档布局不改变断点，焦点环绘在链接内部，避免被滚动边界裁掉。

| 实际容器宽度 | Prism 全局栏 | 宿主的组合责任 |
| --- | --- | --- |
| ≥1180 | 208px 机构区：标识+字样；空间带图标 | 左栏展开，SpaceBar.sideWidth 与实际左栏一致；全局演示入口可见 |
| 900–1179 | 40px 机构区：仅标识；空间带图标 | 将 side.collapsed 设 true；任教上下文保留顶栏图标入口 |
| 600–899 | 仅标识；空间仅文字；wide 工具隐藏 | 演示入口移至个人菜单；任教上下文保留顶栏图标入口 |
| <600 | 36px 机构区+当前空间菜单；desktop 工具隐藏 | 全局保留任教上下文/通知/头像；空间栏只留目录按钮、中段、更多和最右试题篮；页头操作下移 |

Prism 不猜左栏的打开状态。`side.collapsed`、目录显隐与窄屏目录面板由宿主使用同一布局事实同步传入；onToggle 是请求，aria-expanded 根据 collapsed 显示。菜单 Portal 默认进入 document.body；应用主题在根节点时可直接使用。局部三主题预览应通过 popupProps.portalProps.container 将弹层放入对应主题边界，且放在 overflow scroller 之外；门户中的工具组若不在 AppBar 容器内，宿主须自行传入可见项，不依赖 AppBarToolGroup 查询。

## 视觉与业务边界

Prism 拥有尺寸、语义字号、颜色/边框/圆角/焦点/当前态和响应式表现。宿主拥有空间列表、当前空间、机构身份、任教范围数据、目录/左右栏状态、通知数、试题篮数、演示状态、路由和操作回调；组件只展示这些事实。任教上下文按下文 2026-09-29 决策统一放顶栏；试题篮固定最右（D4），由宿主组合保证。

D1 仅豁免机构字样，见 [字体规范](typography.md#品牌字样)。D2 同一全局栏只能有一个环境入口：≥900 在全局工具区，<900 移到个人菜单“演示与审阅”分组；Page Map 属同组，正式环境由宿主隐藏整组和环境入口；对象级“示例对话”继续保留，页面级“本地业务演示”由 Workspace 侧移除。

**原型阶段修订（2026-09-28，PO 批准）**：仅适用于未接入真实服务、全部为本机规则与预置数据的原型阶段。此阶段 Workspace 界面不逐项标注“示例／预置／演示”，组件保留 `visual.sample`、示例小签等标注能力，由 Workspace 停止传入相应标注属性。接入真实服务或混入真实数据后，恢复逐项标注；真实与示例混排时必须标注。本修订仅调整原型标注策略，不改变读取、引用、保存、提交等事实及状态的判定，不免除“节选”标记。原条文保留，恢复条件满足后继续适用。

D2 原型适用方式：所有宽度均不显示顶栏“演示环境”，不保留空工具组或占位；`AppBarStatusButton` 能力保留。原 `ModelDemoSettings` 的模型状态、回答模式等入口统一放入个人菜单“演示与审阅”分组，功能不变。接入真实服务或混入真实数据后恢复逐项标注，并按环境适用原 D2 入口规则。上文宽度表及下文验收入口中的旧演示入口记录保留作历史依据，原型阶段以本修订为准；Prism 组件和示例代码本次不修改。

曜彩三原色仅用于机构标识、Expression 已有的开始/完成时刻签名，以及组件内已有语义。导航当前态用 primary、焦点用 ring；顶栏、文字与图标不借用 brand 色。未新增颜色令牌；除 D1 一个品牌字体角色外，不新增文字角色。菜单阴影沿用 coss，设计图中的局部 rgba 阴影不硬编码。个人菜单字样按 D1 统一 17px，源图中的 14px / 700 不扩散为另一项字体豁免。

## 示例与验收入口

`/next/use-cases/workspace-app-bar`，从应用示例侧栏和 `/next/use-cases` 可到达。四个宽度按钮控制固定尺寸容器，同时展示 light/paper/dark 各两套 Agent/组卷组合；可切换长机构名、导航空间、对话标题、任教班级、目录、个人菜单。示例宿主的基础数值和文案取自设计稿，任教上下文增加本次评审夹具；普通业务按钮仅展示静态说明弹窗，不执行组卷、搜索、保存或通知处理。

示例个人菜单身份卡与“演示与审阅”组可直接打开；宽≥900 的环境说明只保留工具区一处，较窄时只保留个人菜单一处。设计图 Agent/手机局部绘制顺序与 D4 不一致，本实现遵循已批准 D4，所有组合均把试题篮排最右。

需要独立浏览器复验：四档容器宽度×三主题、长机构名、导航 hover/current/focus 共存、Tab/Enter/方向键/Escape 与焦点返回、当前菜单项勾、窄屏操作整行、计数可读性、用户放大字体。自动测试不能替代这些视觉与交互验收，也未验证 Workspace 真实路由、业务服务、实体移动设备或读屏器。

## PO 2026-09-29：统一任教上下文入口

任教上下文由顶栏图标入口统一承载，页面第二排不再重复班级名称、教材版本及“任教与教材”入口；取代 D3 中任教范围位于中段的旧规则。对话标题等空间信息仍归 SpaceBar。所有宽度仅显示 `School` 图标，复用 `BarIconButton` global，与搜索、通知、设置同处工具区、同尺寸；不要放入会隐藏的 desktop/wide 工具组。

复用检索：已查本次提供的 coss `INDEX.tsv`，并阅读本地 particles 源码 `p-popover-1`（Popover 内组合标题、表单、按钮）与 `p-menu-4`（MenuRadioGroup 单选）。采用前者的 Popover 组合模式：面板包含当前班级、只读教材与设置操作，适合正常 Tab 顺序浏览事实；Menu 更适合纯操作/单选菜单。复用 coss Popover/Title 与现有 Prism Button/BarIconButton，不复制粒子业务示例。本次为通用 App Bar 扩展，不增加 Agent 专用组件、Beautiful UI 代码或目录条目；外观延续 coss/Prism，不添加令牌。

`AppBarTeachingContext`（同文件导出）宿主接入属性：

| 属性 | 契约 |
| --- | --- |
| `summary: string` | 宿主当前摘要；按钮可访问名严格为“任教班级与教材：{summary}”，不显示摘要文字。 |
| `items: readonly {id:string; label:string}[]` | 可切换任教关系，label 包含班级与学科；id 唯一。 |
| `currentId?: string | null` | 宿主确认的当前关系；未匹配时使用 status，不默认第一项。 |
| `status: string` | 无关系、载入失败或当前关系未知时的宿主状态文案。空列表仍显示教材事实和设置入口。 |
| `textbook: string` | 只读教材版本/册次或宿主提供的未知状态；组件不按班级自行推算。 |
| `onSelect(id)` | 仅发出选择意图；当前态和教材须由宿主回传，选择后保持面板以展示确认事实。 |
| `settings` | `{href, onSelect?}` 原生链接，或 `{onSelect}` 按钮；文案固定“任教与教材设置”。 |
| `popoverProps / popupProps` | coss 原属性；支持受控开关及 `popupProps.portalProps.container` 局部主题门户。 |

列表使用带 `aria-pressed` 的选择按钮组，当前项勾选；Tab/Shift+Tab 遍历，Enter/Space 激活，Escape 关闭并返回触发器，开关及焦点管理复用 coss。触屏 pointer-coarse 下全局图标按钮至少 44×44px，列表与设置按钮所有模式至少 44px 高。长中文换行，列表超过 240px 内滚动；不覆盖颜色、圆角、阴影或字号。

示例 `/next/use-cases/workspace-app-bar` 的三主题和四宽度均接入该入口；“已配置任教 / 无任教关系 / 长任教与教材”覆盖选择、空状态、长中文和公式文本。示例中的选择仅更新夹具状态，设置打开说明对话框。Workspace 接入应在应用顶层传入上述事实和回调，并移除各业务页重复任教区域；本次不修改 Workspace。
