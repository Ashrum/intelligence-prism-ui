# P74 · 范围与复用取舍

日期：2026-10-16。Prism 来源/工作基线 `e750a963d53da4a3bba1cf53500616ebff4b16d2`，分支 `fix/agent-portal-container`，开工工作树干净。任务来自 Supervisor `task-P74.md`，已完整读取 `builder-preamble.md` 和仓库 `AGENTS.md`；浏览器验收、提交、推送、PR 由 Supervisor 执行。

## 已核对来源

- Workspace `docs/Agent蓝图R2来源与Portal交接-20261016.md`、Supervisor `W188-Report.md`，其中 18 处 Agent + 24 处依赖 Popup 清单全部纳入。来源文档记录 Workspace 开工 `c229c159`，任务说明 R2 已合入 `c10728d`；不把开工报告当作当前验收。
- 本仓规范 §5 与 CI-11：宿主传递主题边界，共享控件补具体接口缺口。没有从截图推定行为，没有引入 Workspace Store/路由/私有类型。
- 先核对现有 Prism `Providers`、PromptBar/Voice 内部根容器、局部预览 demo、`QuestionSelect`、`DialogLayout`、`useChartTheme`；现有上下文不提供统一容器与局部图表色板。
- 固定 coss Select / Combobox / Menu / Dialog / Popover / Tooltip / Drawer / Toast：均有容器透传，唯 `MenuSubPopup` 公开类型遗漏。复用这些组件的结构、语义类、交互和 API，不改其字节。
- coss particles 本地接入 `demos/selection-particles.tsx`（Select / Combobox）与 `demos/dialog-particles.tsx`（Dialog）：仍调用对应 coss Popup，没有宿主 scope 机制；不复制这些演示或增设交互组件。按非交互前置约定未联网刷新 registry。没有需要引入 Beautiful UI 或新依赖的视觉/行为缺口。
- 本地安装 Base UI 1.8.0：`node_modules/@base-ui/react/floating-ui-react/components/FloatingPortal.mjs` 的 `useFloatingPortalNode` 在 layout effect 中解析显式 container/ref → 父 Portal → body；**显式 null 会等待，不参与回退**。`utils/FloatingPortalLite.mjs` 与 Toast Portal 复用同一解析函数。父 Portal 可以继承，但独立 inline 组件没有父 Portal 保证。

## 方案取舍

采用 `PrismScopeProvider` + `scoped-overlays` 适配层。仅替换清单中的 Popup import，保持各 Agent 公共 API 不变；上下文同时提供局部 `theme` 给图表。相较逐组件加 18 个 prop，它保留统一宿主入口；相较修改 coss 或 DOM 全局观察，它符合冻结来源并避免隐式 DOM/SSR 主题推测。未启用 scope 时保留原始 props 和 Base UI 继承/body 默认。

本轮实际范围为 30 文件的 43 个调用：18 Agent + 24 静态依赖 + `QuestionWorkPanel` 旧 Drawer 1 处。Drawer 在 Agent managed 路径不挂载，仍使用同一机制补齐，不声称它在本轮 Workspace 首屏可达。逐项列于 [call-sites.json](call-sites.json)。没有遗漏 24 处中的任何一项；它们的真实业务可达性仍须 Workspace 后续验证。

保留已有显式内部目标的 PromptBar、Voice、紧凑分析 Popover；既有 Blueprint foundation/batch demo 也保持显式容器。其余全仓 coss 直接调用没有自动迁移，避免扩大 CI-11 范围。

扩充图表到 `advanced-charts.tsx`、`echart.tsx`：两者实际绕过 `useChartTheme`，只改 hook 会遗留形状/连续色阶及轴线/Tooltip/decals 取全局主题。统一入口后保持 `chart-palette.ts` 原文。没有 CSS、主题令牌、字号、目录或依赖改动。

既有测试夹具随新增真实 Context 合法化：P57/P58 在 React render 内读取 hook；heatmap-tooltip 的 controller-only 无 scope 主机补默认 Context hook，业务断言不变。新测试另独立覆盖真实 Context 与 Portal 挂载。测试中的定位/开合/焦点原语是探针，不当作真实浏览器操作。

首轮全量的 9 个失败是三组旧夹具仍按 coss Popup 身份/函数名取节点：agent-visual-batch1 1 项、facet-filter 3 项、review-p17 5 项。改为从实际适配层导出对应组件并按身份匹配，保留全部原断言；P17 的旧基线 bundle 仍导出旧 coss 类型。新增夹具 SSR 断言确保 ObjectPicker 处于 workspace 模式并确实显示 Combobox。没有将此次新增失败标成既有失败或删除测试。
