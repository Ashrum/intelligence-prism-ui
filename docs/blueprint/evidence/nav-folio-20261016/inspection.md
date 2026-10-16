# P77 · 实现、复用与边界

- 2026-10-16；分支 `feat/blueprint-nav-folio`，基线 main `7ad8dbc2146324ed2999febaf35e6417084f03d7` 的实际完整值以 [baseline.json](baseline.json) 为准；开工工作树干净。依据 Supervisor `task-P77.md`、`builder-preamble.md`，不提交 / 推送 / 启动服务 / 发布。
- 复用核对：已有 `components/prism-next/app-bar.tsx` / `app-bar.css`、Prism Button 适配、固定 coss Button 的 ghost / focus / before 钩子、BlueprintSectionHeader / BlueprintSheet 及 `.bp-section-folio` 已满足结构需要。继续组合现有实现，无需新增组件或 particles；按前置约定不联网，未刷新在线 registry，未复制第三方代码。
- 导航仅修改 `app/(next)/next/blueprint.css` 的既有 P76 块：两蓝图家族一级链接 36px 居中，当前项 primary / primary-foreground 实块，hover 保持，删除下划线；非当前 hover 为 accent。图标继承 currentColor。导航容器两端各 4px，为纸面上的 2px ring + 2px offset 外环留空间。关闭伪元素焦点与 shadow，只有一套 outline；夜图沿用现有 ring 配色。SpaceBar、侧栏和核心三主题规则不改。
- 新规则最终目标均保留两蓝图家族限定和嵌套核心预览根 / 后代排除，包含伪元素。导航两种样式加载顺序、初始 / hover / focus 规则、核心零增量和嵌套隔离由解析 CSS 探针检查；不称为浏览器 computedStyle、像素、布局或键盘验收。
- API：导出 `BlueprintFolio`，kind 增加 rev；Sheet 接收 folio，显式值优先于 sheetNo（含空值）。Header / Sheet 增加 `folioAriaHidden?: boolean`，默认可读；仅宿主确认标题区已有同等信息时传 true。空白值不渲染；数字序列补零、vN 规范为 NN，其余旧标签保留。组件不读取业务版本 / 保存状态，不计算业务优先级。
- 示例：`components/prism-next/demos/blueprint.tsx` 复用既有 `artifactOutputExamples.paper.output` ready 文件（v2）与 `continuousPreviewPages` 两份作答。REV 02、可切换的 SHEET 01 / 02 → 02 / 02、无 folio 三种情况均在 `/next/foundations/blueprint#artifact-folio`；原 SECTION 和 sheetNo 示例仍保留。夹具是明确的演示事实，不是学校真实记录。
- 既有测试变更：`tests/blueprint-shell-nav.test.mjs` 将 P76 下划线断言更新为 P77 实块 / 36px / 外环留白，保留侧栏 / SpaceBar / 核心隔离和所有原保护项，新增墨块与 ring 对比度检查；回退变异从旧下划线令牌变异改为恢复完整旧下划线并补测高度、留白、hover 覆盖、焦点偏移。`tests/blueprint-components.test.mjs` 仅增加新示例 SSR 文案断言。`tests/blueprint-print-a11y.test.mjs` 首轮固定断言 4 个 Sheet 因新增两个示例失败；改为独立列举六个区域标题并核对 aria-labelledby，增加两处 aria-hidden folio 与夜图覆盖，未放宽为仅数量相等。新增 `tests/blueprint-folio.test.mjs` 验证三种 kind、补零、旧标签、大编号、空白、sheetNo 兼容 / 优先、读屏默认与显式隐藏，以及 9 个真实源代码变异后的 SSR 检出。
- 五项工程检查和实际数字见 [engineering.json](engineering.json)，源码与文档改动见 [scope.diff](scope.diff)。保护文件哈希见 [integrity.json](integrity.json)。没有浏览器截图；浏览器验收：按分工由 Supervisor 执行。真实 Workspace 接线、学校数据、真机、读屏器未验。

## Workspace 后续接线位置（只读调查，未修改）

1. `src/features/teacher/agent-workspace-page/WorkspaceArtifactSurface.tsx` 当前仅将 facts.name 传给 BlueprintSheet；应传入宿主计算的 folio 与 folioAriaHidden。
2. `src/features/teacher/agent-workspace-page/workspace-artifact.ts` 当前 WorkspaceArtifactFacts 只有 name/version/review/save；在 `p04ArtifactFacts`、`preparationArtifactFacts`、`recordArtifactFacts` 的真实来源处补充序列、已保存版本事实。不要解析 save 的显示文案猜保存状态，也不要因有 vN 字符串就断言草稿已保存。
3. `modules/scan/objects.tsx`、`modules/preparation/objects.tsx`、`modules/records/objects.tsx` 和实际分页宿主共享当前页 / 总页数；分页变更时标题同步事实，不在 Prism 内建 Store。注册出口为 `workspace-object-registry.tsx`。
4. 真实序列优先 SHEET；否则真实已保存版本 REV；都无则省略。版本信息已在 WorkspaceArtifactSurface 的版本栏可读，REV 可隐藏；SHEET 只有标题区存在等价分页信息才隐藏，正文深处的页码不足以自动判定。未保存草稿不显示 REV。
5. 同步 Prism 组件与蓝图 CSS 后，Workspace 单独验收五主题、分页切换、历史版本、未保存草稿、缺失序列、同时存在序列 / 版本。此报告不声称 Workspace 已接入。
