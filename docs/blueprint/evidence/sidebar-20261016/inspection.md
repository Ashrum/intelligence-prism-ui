# P80 实现、复用与 Workspace 接线 · 2026-10-16

基线 `bd0c8dd20c1453c25c3eef8db0e380f548a99c56`，分支 `feat/blueprint-nav-folio`，在未合并的 P77–P79 之上继续。开工只有一份任务外未跟踪的 `docs/AI解析批阅-Agent解析到批阅-规则设计-v0.1.md`，原样保留。见 baseline.json。按 builder-preamble 不提交、不推送、不改 .git、不联网、不安装依赖、不启动/重启开发服务、不使用浏览器。

## 复用检索与取舍

1. 本地 Prism：`components/prism-next/blueprint/blueprint.tsx` 的 BpSegTabs 已具备受控单选、radiogroup / radio、aria-checked、roving tabIndex、方向键循环选择、Home / End 与局部滚动；直接复用，不新造控件。`.bp-section-folio` 的 Geist Mono / meta / muted 语言复用为目录真实元信息，但不生成 REV / SHEET。
2. 冻结 coss：`components/coss/sidebar.tsx` 的 SidebarHeader、SidebarGroupLabel、SidebarMenu、SidebarMenuItem、SidebarMenuButton、SidebarMenuAction 具有现成 data-slot。表头/主按钮没有区分业务用途的现成槽，所以用 bp-sidebar-header / meta / primary 显式选用；全宽 radio 用 bp-sidebar-segments。所有 coss 文件不变，未新增公共 API / 目录项。
3. coss ToggleGroup 是另一候选，但现有 BpSegTabs 已满足本轮指定 radio 语义与键盘行为，故不替换。particles 离线记录检索包括既有 `docs/blueprint/evidence/batch2-20261016/reuse-sources.json` 的 toggle-group、已有 input / selection particles 示例。按前置约定未联网刷新 coss particles / registry，也未打开 answer-me-with-html.com；本轮依据 PO 提供的语汇和既有源码实施，不宣称检查上游最新实现或逐像素复刻。未引用 Beautiful UI / 新增依赖。

## 实现与范围

- 运行时样式只增加 blueprint.css 的 P80 独立块；每条规则均限定两蓝图并排除嵌套非蓝图预览根与全部后代。没有新令牌、局部字号或伪元素。
- 表头薄结构线；元信息使用 Geist Mono Blueprint / text-ui-meta / muted。主按钮 primary / primary-foreground + 2px link 无模糊硬阴影，按下收回；焦点保留硬阴影与既有单外环，禁用无阴影/位移。
- 每区一个、同阶段至多一个强调主操作，遵守正式蓝图 §5.2 / §7.3。一级导航墨块强选中与目录 accent + 左墨线轻选中分工不变。
- 分组标题 link + meta、不大写/加字距；账簿行分隔放于 li 的底边，最后一项无，按钮行高/截断和更多显隐不变。轨道沿用 P76 56px / 40px 尺寸与 utilities 层 important 例外；新建无硬阴影/位移，其他线框。group 去横向 padding、40px menu 居中，为结构边线留空间。
- 新增 `components/prism-next/demos/blueprint-sidebar.tsx`，在既有 `/next/foundations/blueprint#conversation-directory` 展示。coss Sidebar 使用 collapsible=none 作为内嵌样本，用既有 data-collapsible 挂点展示轨道；它不是站点固定侧栏的响应式抽屉。固定四条样本，近期三条/归档一条，元信息由实际当前列表计算。点击新建或更多仅说明意图，不伪造创建/归档/服务成功。
- 站点自身 Sidebar 保留导航职责，只接收通用 group-label / ledger 样式，不加入会话计数或近期/归档过滤器。不新增标尺、图纸编号或行序号。
- 文档源、guide JSON 与 public 下载副本由既有生成器同步，不手改生成物。P76 历史测试仍验证 P76 块，新 P80 测试组合 P76 + P80 核对最终覆盖，没有降低旧测试。

## Workspace 接线（只读核对，未修改）

路径相对 `ole-school-workbench`，先同步本轮 blueprint.css 样式块，再由 Supervisor 另行委派业务组合与真实浏览器验证。核心三主题保持原 UI，按宿主当前主题选择蓝图组合，不据此改变业务 Store。

1. `src/features/teacher/agent-home/ConversationDirectory.tsx` 当前先计算 `visible = filterConversations(...)`、`presets`，再经 `mergeConversationDirectory(visible, presets)` 得到 `entries`。当前列表条数应为最终 `entries.length`（含当前过滤下实际呈现的探索项），不是全部 conversations.length。若服务只返回分页片段，标明已加载条数，不能冒充全库总数。表头在实际拥有「对话」/收起按钮的宿主中应用 bp-sidebar-header；若表头与列表不同组件，应由已有宿主统一推导/传递计数，不建立第二份状态。
2. 主入口位于 `src/features/teacher/agent-workspace-page/AgentWorkspacePage.tsx` 的 af-directory-actions，目前先 setArchived(false)，再 select(null, true)，接线保留此处理；ConversationDirectory 的空态仍使用现有 onNew；给目录唯一主操作的 SidebarMenuButton 加 bp-sidebar-primary。现有空态「发起新对话」保持次级，不再同时强调；不把点击变成已创建回执。
3. 用 `BpSegTabs className="bp-sidebar-segments"`，label="对话范围"，items 为 recent/近期、archived/已归档；`value={archived ? 'archived' : 'recent'}`，`onValueChange={value => onArchived(value === 'archived')}`。替换 simple 分支现有「近期对话/已归档」菜单，以及非 simple 分支菜单中对应的对话范围单选组；保留分组菜单、执行状态筛选、清除筛选、原 scrollPositions 恢复键及 overlay 回调。
4. 分组标题复用 SidebarGroupLabel，只呈现真实置顶/近期分组；不能按外观自行重排 mergeConversationDirectory 的业务顺序或捏造分组。列表继续 coss MenuItem / MenuButton / MenuAction；不要修改 ah-directory-action 的显隐/菜单开合。
5. 注意非 simple 现有 TooltipTrigger 会写 data-slot="tooltip-trigger"（simple 才是 sidebar-menu-button）；接入时核对最终 DOM，在适配层保留稳定 sidebar-menu-button 槽，否则对应行样式不能命中。不得直接修改冻结 coss 或仅凭 TSX 组件名断言成功。
6. `AgentWorkspacePage.tsx` 的 af-directory-rail 已有 data-slot="sidebar" / data-collapsible="icon"，展开/新对话也已有 sidebar-menu-button 槽；只给「新对话」追加 bp-sidebar-primary，保留 Popover 触发与 finalFocus。真实 56px 轨道需要外层 sidebar 的 data-collapsible="icon" 和内部 sidebar-menu-button 挂点；40px menu 居中、新建无偏移。若 Workspace 使用自己的轨道容器/按钮，要在对应 Prism 组合层明确适配这些语义挂点，不能假定本轮样式自动接入。保留展开动作的具名按钮、当前项 aria-current、切换后焦点和搜索等原动作。

## 工程证据与返修

测试编译真实组件并 SSR，CSS 解析匹配选择器与特异性、继承 P76 轨道规则；检查两蓝图、核心零增量、嵌套核心根/后代/伪元素、radio 实际 handlers、disabled/pressed/focus 状态。非浏览器，不宣称像素布局、真实键盘事件分发或视觉验收。首轮 5/6：既有 P76 focus 规则优先于主按钮的普通状态，清掉硬阴影；补主按钮 focus-visible 定向规则后 6/6。保留 targeted-initial.log。

首轮全量 2225/2230，5 项失败均为旧无障碍测试固定两组 radio；增加目录后应是三个 BpSegTabs 具名组（页面另有 coss 原生 RadioGroup，独立于本次分段断言）。`tests/blueprint-print-a11y.test.mjs` 改为独立核对「对话范围 / 答卷状态预览 / 纵向选择样式预览」与各自选项数量 2 / 6 / 3、唯一选中项和 tab stop，不放松语义保护。首次修正的匹配范围过宽，误纳入原生 RadioGroup；随后限定 bp-seg-tabs，intermediate-* 保留该轮记录。initial-* 保留首轮五项记录；这不是既有基线失败。

最终工程结果见 engineering.json / targeted.log；变异报告见 mutations.json；保护散列见 integrity.json；实际 diff 见 scope.diff。

## 未验证范围

浏览器验收：按分工由 Supervisor 执行。没有本轮浏览器截图；Workspace 未接入，真实服务、移动真机、读屏器、实体打印未验。Builder 不自我批准。
