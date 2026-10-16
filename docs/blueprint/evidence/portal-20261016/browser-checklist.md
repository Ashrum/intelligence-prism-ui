# 交给 Supervisor 的浏览器验收清单

日期：2026-10-16；基线 `e750a963d53da4a3bba1cf53500616ebff4b16d2` + P74 工作树 diff。Builder 未启动/重启服务、未打开浏览器。请使用 Supervisor 自己核对过分支/工作树的服务。

主夹具 URL：`http://127.0.0.1:5173/next/components/menu#portal-scope`（若 Supervisor 使用其他端口，仅替换端口）。已有 Menu 页下方“嵌套主题与浮层容器”，无新增目录项。

矩阵：全局核心 light / paper / dark；夹具“外层核心主题”逐项 light / paper / dark × “局部主题” blueprint / blueprint-night；**1280×900 与 320×900**。补全局 blueprint / blueprint-night 内局部核心三主题的反向预览，检查根、后代和伪元素隔离。截图/实测请登记当前 diff、主题、视口、路由与日期；工程记录不是视觉证据。

| 操作路径 | 预期与需记录事项 |
| --- | --- |
| 局部“材料类型”Select → 方向键、Enter / Escape | 原 coss 行为；打开的真实 Portal 在该预览 `[data-portal-scope-target]` 内，继承局部主题；选项读得全，关闭后回到触发器；外层保留核心主题 |
| “搜索班级”AgentObjectPicker → 输入“高二” → 打开候选列表 | Combobox 真实浮层同主题，长中文候选可读；选择结果受控、Escape 返回输入，不因容器改变被裁切或失去焦点 |
| “局部材料操作” → “材料示例子菜单” | 主/子菜单均在正确主题中；键盘方向键进入/退出、Escape 逐层关闭、回焦与右侧/窄屏翻转正常；记录真实 DOM 层级与裁切情况，不根据父触发器外观判断 |
| “局部对话框” → 初始材料标题 → 内部“对话框材料类型”Select → Escape → 关闭 | Dialog 初始聚焦标题输入；内部 Select 与 Dialog 同主题；首个 Escape 先关闭 Select，随后关闭 Dialog 并回到“局部对话框”；Tab/Shift+Tab 焦点限制正常，长中文和 MathML 清晰，320px 可操作 |
| “触发局部通知”“触发外层通知”“触发全局通知”分别打开 | 局部、外层、全局三个队列归属不同主题；检查实际 toast-portal/viewport，不混用 singleton；可分别“关闭局部/外层通知” |
| 局部通知存在时“离开局部预览”→触发外层/全局通知→“进入局部预览” | 局部容器和通知卸载，不把存量 Toast 搬到 body，不在重入时恢复；外层和全局通知仍可见且归属不变 |
| 两张“材料数量 · 固定示例”图表，反复切局部主题 | 内图系列首色 blueprint `#1D5FBF`，夜图 `#86C5FF`；外图 light/paper `#1E88E5`、dark `#62ACED`；轴线/Tooltip 同局部主题，数据不变；无全局主题跳变 |
| 320px 与 1280px、长中文、公式、Tab/Escape、系统减少动态效果 | 目视可读性、组件比例、开合定位、页面滚动与焦点圈；不只记录“无溢出”。没有新增动画或以按钮推定业务完成 |

额外回归路由：`/next/components/dialog-layout`、`/next/components/record-list`、`/next/components/tree`、`/next/components/evidence-matrix`、`/next/components/box-plot`。在无 scope 的核心三主题中打开相关 Popup，保持原行为；W188 24 处完整静态清单见 [call-sites.json](call-sites.json)。未实际到达的业务分支逐项标记未测。

## 下一轮 Workspace 接线

本轮未修改 `ole-school-workbench`。以下以该仓 `src/` 为根：

1. 固定本轮通过 Review 后的 Prism commit，同步新增 `components/prism-next/prism-scope.tsx`、`scoped-overlays.tsx`、30 个清单文件、`providers.tsx`、三个图表主题/渲染文件，并同步 `lib/prism-next/config.ts`、`chart-palette.ts`、`heatmap-labels.ts` 的局部蓝图/夜图类型、色板和披露逻辑；更新 `vendor/prism-source-manifest.json` 的 commit/blob/SHA-256，依赖保持锁定。当前 Workspace `PrismTheme` / `themePalette` 只有核心三主题，chart-palette / heatmap-labels 也没有 night 分支；仅拷本轮 diff 会导致局部主题类型/配置不齐。Prism `Providers` 的全主题配置与 Workspace 仅三核心主题的既有差异须保留为已登记宿主适配，检查 `components/prism-next/skeletons/workbench-shell.tsx` 的 themeOptions 消费；保留核心主题筛选，或在已登记 config 适配中分开局部主题类型与全局入口，不让全局出现 Blueprint 入口。
2. `components/AgentWorkspaceTheme.tsx`：在已有局部根和 target 内用 `PrismScopeProvider portalContainer={container} theme={agentWorkspaceTheme(resolvedTheme ?? theme)}` 包住消费者，保留 target 在消费者之前；现有 `AgentPortalContainer` / `useAgentPortalProps` 可继续供 28 处宿主透传使用。边界仍限精确 Agent 路由，不改 AppBar/global next-themes。
3. `features/teacher/agent-workspace-page/ComposerTools.tsx`、`features/teacher/papers/DraftPaperInspector.tsx`：仅将 `MenuSubPopup` 改用 Prism 适配层；其他 Menu 原语仍用 coss。现有父菜单显式目标保留，验证子菜单父继承与显式覆盖。
4. Toast：`components/AgentWorkspaceTheme.tsx` 内建立页级独立 manager + scoped `ToastProvider`。`features/teacher/shared/operation-toast.ts` 当前硬绑定全局 singleton，需补显式来源/manager 注入，默认保持全局；Agent 的调用方与 `features/teacher/shared/RoutedTeacherProvider.tsx`（命令通知链）按实际 React 所有者传递来源，不能只包 Provider 就声称现有通知已局部化。异步通知归属在操作发起时捕获，切页后不按“当前路由”重定向。
5. `components/AppShell.tsx` 及其外层题篮 Provider 的 Dialog/消费者：已有显式容器保留；React 所有者在 Agent scope 外时，为弹窗内容显式补相同 scope/theme，避免内部图表仍读全局。全站 AppBar、工作记录、批阅等继续原全局 Provider/manager。
6. 更新 `tests/agent-blueprint-r2.test.ts` 和来源审计，复验 Agent→工作记录/批阅→Agent、AppBar 来源通知、存量/迟到通知、18+24 处实际可达分支，以及 Blueprint Night。

浏览器验收：按分工由 Supervisor 执行。真实 Workspace 接线、服务、真机、触控、读屏、实体打印与全站视觉回归不在 Builder 本轮完成声明中。
