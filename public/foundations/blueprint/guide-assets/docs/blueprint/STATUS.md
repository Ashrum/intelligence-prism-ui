# Blueprint 主题 · 状态

> 交接状态记录。每轮更新“当前”，旧“当前”连同日期与基线移入“历史”。正文路径均为仓库相对路径。

## 当前


- 轮次：P106 · 标题右侧墨线 · 2026-10-22；基线 `0965f49268a60d7e23882a4b8139e453c606a011`（P105），分支 `feat/bp-title-rule-p106-20261022`；开工工作树干净。Builder 已实施与自测，待 Supervisor 独立 Review，不作自我批准。
- 范围：已有 BpSectionCard 新增 titleRule，BpMinor 新增 rule="border" / "ink"；仅显式启用的新属性触发 P106 样式。补标题墨线示例、guide、30 项专项及 21 组基线 SSR 快照。P104 / P105 的旧 CSS 全字节断言排除独立 P106 块，由 P106 断言保证剩余 CSS 与 0965f49 完全相同，原主题隔离与编译检查保留。
- 工程检查：数学字体通过；排版通过（323 owned TSX）；专项 30/30；相关回归 45/45；同配置生产构建成功后全量 2514/2514，失败 / 跳过 0。类型检查退出 2，仅既有 TS2306（prototype-source/main.tsx:57 的 app.js 非模块），与开工干净基线逐字一致，新增 0。lint 基线与最终均 83 errors / 142 warnings，忽略新增代码导致的原诊断行号移动后新增 0；均为退出 1，不写成全仓 lint 通过。
- 构建限制：标准 vinext 构建退出 1，写共享 node_modules/.vite-temp 遇 EPERM；已有 esbuild 将同一 vite.config.ts 打包至当前工作树临时目录后，以 Vite native loader 构建退出 0。不改配置、依赖、主 checkout 或服务。最终仅补本状态验证元数据及 guide 生成物，另做文档一致性复验，不将其冒称再次全量构建。
- 令牌与兼容：复用 --line / --line-width，theme.css 未改；白图 / 夜图 1.5px，核心三主题中性 1px。夜图对卡片底 11.62:1、对页面底 12.66:1（源码令牌计算）。默认 API / 显式关闭保持前态 SSR 字节；伪元素为空内容，不改标题名称或层级。≤760px 卡片标题独占一行、元信息与动作顺延，线可缩短至 0。局部核心主题根 / 后代 / 伪元素采用本地中性令牌，源码及 SSR 测试不等于浏览器验收。
- 周期：继承本文件已记录的 3/3 累计校准待验状态；不推定未登记的 P100–P105 已验收，不因本轮自动化通过新增已完成轮次或宣布周期收口。最近完整工程回归为本轮 P106（2514/2514，保留基线类型 / lint 与标准构建例外）；下一触发点仍为 Supervisor 累计浏览器矩阵与独立综合审查。
- 浏览器交接：`/next/foundations/blueprint#title-rules`，blueprint / blueprint-night / light / paper / dark × 1280 / 390，另核对 760 断点。检查两种密度墨线位置、长中文 / 长文件名 / 公式、任务范围说明按钮开合与焦点、默认 border 对照、嵌套 core 预览；说明按钮应显示“仅展示已选范围，不执行创建任务。”。guide 路由 `/next/foundations/blueprint/guide` 核对 P106 章节。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。无本轮浏览器截图；Workspace 接入、真实服务、真机触控、读屏器和实体打印未验。未提交、推送、创建 PR、联网、调用模型、读取凭据、启动或重启服务、发布或同步站点。

## 历史

### P99 · 2026-10-21（P106 前当前，原样保留）

- 轮次：P99 · C0 学情概览组件抽取与蓝图趋势刻度 · 2026-10-21；基线 `85c35243a90d8ac20a7b7272f54e452dfa89cb27`，分支 `feat/bp-calibration-p97-20261021`；沿用 P97/P98 工作树，开工干净。Builder 实施，不作自我批准，待 Supervisor 独立 Review。
- 范围：新增蓝图族 BpStat/BpStatStrip；扩展 BpSizeBar 无框/紧凑/隐藏行标签，BpTitleBlock tone/numeric，BpSectionCard compact，BpCallout emphasis；新增 C0 七格标题栏、四指标与 compact B 节组合。追加蓝图/夜图 yDomain=auto 整数刻度，保留 core 刻度逻辑及显式域；未更改 P98 其余绘图几何、冻结 coss、核心令牌或依赖。
- 工程检查：字体通过；排版通过（319 个 owned TSX）；相关定向 88/88（含 P99 新增 17 项、P98 的 18 组 core SVG 指纹）；生产构建成功后全量 2389/2389，失败/跳过 0。类型退出 2，仅 1 条既有 TS2306（prototype-source/main.tsx:57 的 app.js 非模块），与开工干净基线诊断逐字一致，新增 0。guide 与 diff 检查通过。标准 vinext 构建仍因共享 node_modules/.vite-temp 写入 EPERM 退出 1；按 P97 同配置临时 bundle + Vite native loader 构建退出 0，不改配置或共享依赖。
- 返工记录：首轮全量 2361/2369，失败 8，均已修复：新增图纸标题补入原精确清单；P79 字母无障碍变异更新到 cn 节点且保留失败检测；新增 CSS 放在 P97 独立尾段之前，避免旧测试按注释截取时读到未闭合片段。未删除断言或跳过测试。最终产品源码重新构建并跑全量；本状态验证元数据及 guide 生成物随后同步，单独做文档一致性复验，不宣称再次全量构建。
- 差异：大数使用现有 40px score-display（stat-display 为 24px）；标签/单位/紧凑标题分别 ui-meta 12px、ui-body 14px、item-title 14px，未造样稿局部字号。TitleBlock 沿用 P82 容器布局；未知指标不渲染单位、增量和条形，宿主非空文案与说明保留。默认 API SSR 对照本轮开工快照。
- 周期：延续 P97 记录的新周期 3/3 累计校准范围，不因 P98/P99 追加或返工重复计已验收轮次。当前仍待 Supervisor 累计浏览器回归与独立综合审查，不宣布周期收口；本轮按任务执行完整工程回归。最近完整工程回归为本轮 P99（2389/2389，保留上述类型例外与标准构建环境限制）；累计浏览器矩阵和独立综合审查仍交 Supervisor。
- 浏览器交接：`/next/foundations/blueprint#overview-calibration` 与 `#trend-calibration`，blueprint / blueprint-night / light，1280 / 390，与 C0 SHEET 01 并排；另核对容器四/二/一列、帮助按钮、依据链接/披露、未知与长文案、嵌套 core 隔离。浏览器验收：按分工由 Supervisor 执行。实际截图、焦点、读屏、真机、真实服务和 Workspace 接入未验。
- 未提交、推送、PR、启动服务、联网、调用模型、读取凭据或修改主 checkout。报告与工程日志已按委派交 Supervisor；仓内不链接本机交接路径。

### P97 · 2026-10-21（P99 前当前，原样保留）

- 轮次：P97 · 学情蓝图校准 C1 · 2026-10-21；基线 `d25e358ea972614abcebd400e0f4be74b20757ec`，分支 `feat/bp-calibration-p97-20261021`；开工工作树干净，Builder 实施与自测，待 Supervisor 独立 Review 与浏览器验收。
- 范围：Recharts 提示圆角读既有 radius-md（core 8px、蓝图 0px）；夜图 chart-6 对齐 JS；Badge 纸面描边与可选装饰 mark；BpSizeBar 千分位、display 和多行独立数值图例；ChartLegend 类别方块／斜线块，点和线语义不改；同步示例、契约、Badge Agent Spec 与 guide 生成物。复用现有 Prism 与固定 coss，无新增依赖或组件条目。
- 工程检查：数学字体退出 0、排版 317 TSX／退出 0；P97 与夜图定向 24/24；生产构建成功（退出 0，见下述环境适配）；随后全量测试 2345/2345、失败 0、跳过 0、退出 0。最终类型退出 2，仅 1 条既有 TS2306（`docs/learning-analysis/prototype-source/main.tsx:57` 引用的 `app.js` 非模块），开工干净基线已复现相同诊断，无新增。guide 同步检查与 diff 检查退出 0。
- 构建环境适配：标准 vinext 命令退出 1，Vite 尝试写共享 node_modules/.vite-temp 遇 EPERM；runner loader 退出 7（动态 import 时 module runner 已关闭）。最终用已有 esbuild 将同一份 vite.config.ts 打包到工作树 .sites-runtime/p97-vite.config.mjs，以 Vite createBuilder 的 native loader 构建成功；不改配置、共享依赖或主 checkout，不启动开发服务。dist 对应本轮产品源码。最后只补记验证元数据并同步 guide、运行文档一致性复验，不将这一步冒称重新全量构建。
- 收尾兼容性检查：Badge 仅在传 mark 时覆盖 children，未传 mark 时原样透传 render 子内容；新增 render 元素自带文本的回归断言。最终产品源码已重新构建、全量 2345/2345 与类型检查，结果同上；本条属于随后补记的验证元数据。
- 差异说明：任务所列第 7、8 色在 CSS／JS 两侧均未定义；夜图只修已有第 6 色，不造新色。白图沿用既有五个 CSS 系列桥接与六色 JS 配置，未扩张白图桥接。core 令牌、coss 源码、点／线形状保持；工程隔离断言不等于视觉验收。
- 周期：沿 P93 记录进入新周期第 3/3 轮，本轮实施尚待验收，不记为已验收或宣布周期收口。按任务执行完整工程回归；最近完整工程回归为本轮 P97（2345/2345，保留既有类型错误与标准构建环境限制）。下次触发点为 Supervisor 对本周期累计页面／主题／交互的完整浏览器回归及独立综合审查。
- 浏览器交接：`/next/foundations/blueprint#calibration`，blueprint / blueprint-night / light ×1280/390；另补 paper / dark、嵌套 core 预览、Trend / Comparison 悬停及 ECharts 提示几何。应见 65% · 177 / 272、80% · 960 / 1,200、排除／未核实 0、12,345、三态标记、类别方块／斜线块及原有空心点／菱形／线段。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。真实服务、Workbench 接入、真机、读屏器未验；未提交、推送、PR、联网、模型调用、读取凭据、启动或重启开发服务、发布站点。Builder 不自我批准。


### P93 · 2026-10-20（P97 前当前，原样保留）

- 轮次：P93 · SpaceBar 降低高度 · 2026-10-20；基线 `7f335106ec0812bbff54645b18aadbf4bd2e7d54`，分支 `feat/space-bar-height-p93-20261020`；开工工作树干净，待 Supervisor 独立 Review 与浏览器验收。
- 范围：复用现有 Prism SpaceBar，仅修改尺寸声明：桌面栏高 48→40px，space／收起侧区按钮 36→32px（展开侧区保持 32px），图标 17→16px；<600px 栏高 44px、按钮 44×44px。TSX 与蓝图覆盖无重复尺寸；五主题共用同一尺寸来源，不引入新组件或上游代码。AppBar、Token、颜色、边框、结构与交互保持原契约。
- 配套：更新尺寸断言及定向测试、Workspace 顶部区域与组件契约；同步本状态的 guide 生成物。工程检查：字体退出 0；排版 317 个 TSX、退出 0；生产构建退出 0；全量测试 2312/2312、失败 0、跳过 0、退出 0；类型退出 2，仅既有 TS2306（`docs/learning-analysis/prototype-source/main.tsx:57` 引用的 `app.js` 非模块），干净基线临时归档复现同一诊断，无新增。首轮测试 2311/2312，旧蓝图高度断言未区分窄屏，按 40/44px 契约修正后全量通过；guide 检查与 diff 检查退出 0。
- 周期：P87 后新周期第 2/3 轮实施完成，尚待验收，不记为已验收；下一已授权产品小轮为 3/3，触发完整回归与独立综合审查。本轮按任务要求执行完整工程检查，不据此重置浏览器综合验收周期。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。验收路由 `/next/use-cases/workspace-app-bar`，覆盖五主题、1280 与 390、展开／收起侧区、长标题省略及图标不挤压。真实服务、Workspace 接入、真机与读屏器未验。未提交、推送、PR、启动或重启开发服务、发布站点。


### P91 · 2026-10-20（P93 前当前，原样保留）

- 轮次：P91 · 设计线阶段 0-P：双线规则入仓与合并状态补记 · 2026-10-20；基线 `28cc2de08000ff17808d58d9aac78e9908f9d546`，分支 `docs/design-track-p91-20261020`；开工工作树干净。本轮为文档轮，待 Supervisor 独立 Review。
- 范围：仅 `AGENTS.md` 新增 §11 双线规则、`README.md` Agent 文档导航新增规则入口及本状态轮换；不改既有文档批准状态或版本号。跨仓规则入口暂指向 main，待 O2 合并后由 Supervisor 固定 SHA。
- 合并补记：P89 [#212](https://github.com/Ashrum/intelligence-prism-ui/pull/212) 已合并（main `9667ef9`）并同步至 Workbench（W225）；P90 [#213](https://github.com/Ashrum/intelligence-prism-ui/pull/213) README 导航已合并（main `28cc2de`）。合并由本地 Git 历史核对，W225 同步事实依据本轮 Supervisor 交接；P89 浏览器验收结论未在本仓库登记。
- 检查：`node --test tests/blueprint-guide.test.mjs`：6 项、通过 4、失败 2、跳过 0，退出 1；STATUS 更新导致 guide JSON 与公开证据副本过期，按任务要求停止实施，未修改测试或越界同步生成物。`git diff --check` 退出 0；diff 仅含上述三个文件，新增链接均为任务指定的跨仓规则入口与 PR 链接，无新增或修改仓内相对链接；P89 原当前及更早历史已逐字核对保留。不沿用历史构建或全量测试结果。
- 周期：保持 P87 新周期 1/3，本轮为文档轮，不计产品小轮；下一个已授权产品小轮续计 2/3，至 3/3 触发完整回归与独立综合审查，高风险提前触发。最近完整工程回归仍为 P89（历史记录，含既有类型例外），本轮不刷新该结论。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。未执行构建、全量测试、类型、排版或字体检查；未验证真实服务、Workspace 接入、真机与读屏器、OLE 规则远端可用性。未提交、推送、PR、启动或重启服务、发布站点；不处理 PR #183。

### P89 · 2026-10-20（P91 前当前，原样保留）

- 轮次：P89 · SpaceBar 展开左段侧栏语义底修复 · 2026-10-20；基线 `b69f141db48dde40e7f1de3e3dfdda59396b912a`，分支 `fix/space-bar-side-sidebar-token`；开工工作树干净。本轮为缺陷修复小轮，Builder 实施与工程自测完成，待 Supervisor 独立 Review。
- 范围：仅 SpaceBar 左段背景从 `--secondary` 改用 `--sidebar`，同步顶部区域说明、蓝图说明及 guide 生成物，新增 CSS AST 令牌解析/收起态断言。复用现有 Prism SpaceBar 和现有令牌，无新增组件或来源依赖；coss、令牌定义、AppBar、边框、尺寸、断点均不改。
- 静态解析：light `#F4F5F7`、paper `#EAE6DF`、dark `#202328`，sidebar 均等于 secondary；blueprint `#FFFFFF`、blueprint-night `#0D1C31`，sidebar 均等于 card。蓝图规则仅设置父级 SpaceBar 的 card 背景，子元素自身背景不继承该值；收起态仍透明。这是源码解析结果，不是浏览器计算样式实测。
- 工程：`node scripts/check-math-font.mjs` 通过；`node scripts/check-typography.mjs` 通过（317 TSX）；`node node_modules/vinext/dist/cli.js build` 退出 0；`node --test tests/*.test.mjs` 2278/2278，失败/跳过 0；`node node_modules/typescript/bin/tsc --noEmit` 退出 2，仅任务允许的既有 TS2306（干净基线已复现，无新增诊断）。回退背景为 secondary 后定向测试 0/1，退出 1；恢复后全量通过。guide 按 `node scripts/sync-blueprint-guide.mjs` 同步，`--check` 复核。
- 周期：沿用 BPM1f 的 P87 新周期 1/3；本轮为缺陷修复，不新增已验收产品轮次。下一个已授权产品小轮续计 2/3，至 3/3 触发完整回归与独立综合审查；最近完整工程回归为 P89，上述类型例外保留。旧周期收口及例外原文移入历史，不冒称当前浏览器复验通过。
- 浏览器交接：`/next/use-cases/workspace-app-bar`，1280 与 390 宽度，五主题展开/收起、标题与侧栏同底及嵌套核心预览隔离；现有示例仅提供核心三主题，蓝图需 Supervisor 在独立夹具/预览根设置主题，不能只切外层主题。390 下按钮打开抽屉，不改变原交互。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。真实服务、Workspace W224 同步/接入、真机与读屏器未验。未提交、推送、PR、启动或重启服务、发布站点；Builder 不自我批准。

### BPM1f · 2026-10-20（P89 前当前，原样保留）

- 轮次：BPM1f · 补齐矩阵证据并记录旧周期收口 · 2026-10-20；分支 `docs/blueprint-matrix-closeout-2`，HEAD `031ea44`；Supervisor 已发起合并 main `0bcfa51`（P88 #210）。本轮仅解决 STATUS 文本冲突和补本目录证据，保留已有合并文件；未 git add，索引合并状态交 Supervisor 处理。
- 决定：PO 2026-10-20：“补齐矩阵证据并把旧周期记为收口（例外写明）”。Supervisor 据此判定旧 Blueprint 周期 **3/3 累计浏览器矩阵收口**；Builder 仅记录此决定，不作自我批准。
- 最终自动结果（均 Supervisor 2026-10-19 实测）：matrix **645/645 自动项**；isolation **150/150（P88 后）**；interactions **1500/1500**；per-round **975 pass、20 observed、0 fail，116 项待目检**。matrix 另有 645 条原始 pending-visual；不改机器目检状态为自动通过。[完整来源、逐类结论与例外](evidence/matrix-closeout-20261019/checks.md)。
- isolation 来源：Supervisor 指定的 `isolation-after-P88.json` 原字节，P88 工作树、产品代码等同 main `0bcfa51`，日期 2026-10-19；JSON 的 baseline 仍是 manifest 固定值 `c2dd2239`，真实运行基线及散列另记[来源记录](evidence/matrix-closeout-20261019/bpm1f-provenance.json)。修复前 18 个严格失败组合原字节[归档](evidence/matrix-closeout-20261019/bpm1f-isolation-before-P88.json.gz)，其余三组未冒称 P88 后重跑。
- 缺陷：P87 注释组件“自身为蓝图预览根 + 外层核心主题”时强调色失效，已由 P88（#210）修复。已排除误报：动画进行中采样、焦点 guard 异步回焦、coarse 上下文、核心主题 reduced-motion 契约、子菜单两次 Esc、浮层入场动画、P87 标尺在 760px 以下隐藏。依据 Supervisor《BPM1-handoff-20261019.md》及各轮报告；仓库诊断见上述汇总与 BPM1d/BPM1e 分析，不把真实强调色缺陷归入动画误报。
- Supervisor 目检（2026-10-19，截图对照图）：P78 长中文/公式/代码局部滚动/链接焦点/附件通过；P79 超长英文文件名换行与 A/B 方块通过；P87 锁定框/标签/入口行高亮对应、夜图标签反白通过；P85 墨底标题/关系列表通过；第二批 InputGroup 焦点/无效/只读/禁用通过；编辑式排版、Agent 组件总览、结构编排器、蓝图示例页五主题 × 320/1280 布局抽查通过。其余目检类别逐类映射到自动探针与交互组 1500/1500，见[目检记录](evidence/matrix-closeout-20261019/manual-review.md)，不声称全部 116 项逐组合目检通过。
- 例外：原生 200% 浏览器缩放未验，320 CSS zoom2 溢出属超出原 1280 验收范围的观察，转后续设备/可访问专项；P76 历史 ShellNavFixture 无 openMobile 接线、移动抽屉未验，Workspace 真实移动导航在矩阵外；P73 蓝图/夜图“长中文与公式＋附件”阅读态截图准备失败，仅浅色预览实测通过，蓝图/夜图以布局矩阵截图与自动探针为证据，后续专项补拍；P74/第二批浮层专项打开态截图未生成，由交互组与 Supervisor 手工复核覆盖打开/主题/越界/回焦，后续补拍。
- 继续保留的例外：夜图分隔线 1.58 / 1.45:1、浅色系列白色图案不足 3:1，归后续夜图可访问性/配色专项；真机、读屏器、IME 引擎、实体打印未验，归后续设备/可访问/打印专项；截图按 PO 决定只留本机、不入库，由 Supervisor 保管。上述范围外项、替代证据与已知限制已按此次 PO 决定明示，**不阻塞旧周期收口**，不等同相关专项通过。
- 周期计数：旧周期 3/3 收口；新周期从旧周期之后下一个已授权产品小轮计 1/3。该小轮 P87 已在旧周期收口前实施，本次追记 **P87 为新周期 1/3**；P88 是 P87 同轮缺陷修复，按 §10.2 不另计数。BPM1d/e/f 为累计验收返工/文档补证，也不计新轮。下一个已授权产品小轮续计 2/3，至 3/3 触发完整回归与独立综合审查，高风险提前触发；不得再把 P87 重复计为未来 1/3。
- 最近完整工程回归：P88 **2277/2277**（历史工程结果；类型检查退出 2，1 条既有 TS2306、无新增诊断）。本轮仅离线文档/证据校验，实际命令与退出码见[validation.json](evidence/matrix-closeout-20261019/validation.json)，不沿用历史结果宣称 BPM1f 构建或全量测试通过。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行；Builder 本轮未跑浏览器。真实服务、Workspace 接入及上述设备专项未验；不提交/推送/PR，不启动/重启服务，不改依赖或发布站点。P88 与矩阵线历史原文完整保留在下方；两侧共同的 P87 记录正文及更早历史相同，沿用 BPM1d 侧标题，P88 侧原标题及全本另存[合并来源](evidence/matrix-closeout-20261019/bpm1f-before-status-main.txt)。


### P88 · 2026-10-19（BPM1f 前 main 当前，原样保留）

- 轮次：P88 · P87 标注组件自身主题根强调色修复 · 2026-10-19；基线 `c2dd2239b97963e12f7cf7cb3924328958e68a68`，分支 `fix/blueprint-p87-self-root`；开工工作树干净。本轮属于缺陷修复小轮。
- 范围与取舍：复用 P87 既有样式及 CSS AST 测试，只为 `.bp-target-lock`、`.bp-diagram-callout` 补充自身带 `blueprint` / `blueprint-night` 的 `color:var(--link)` 规则，沿用非蓝图预览根及全部后代排除条件。无需新增组件或外部来源；`.bp-entry-row[data-emphasis]` 自身为主题根时，其 action 已是后代，现有规则有效，新增回归断言而不改该规则。核心三主题中普通组件、coss、令牌、组件 API、依赖和矩阵证据 / 截图不改。
- 工程：数学字体检查退出 0；排版检查 317 TSX、退出 0；生产构建退出 0；构建后全量测试 **2277/2277，fail / skipped 均 0**、退出 0；`tsc --noEmit` 退出 2，仅任务允许的既有 1 条 TS2306（learning-analysis/prototype-source/main.tsx:57，app.js 非模块）。修改前在干净基线执行 `tsc --noEmit --incremental false` 已复现同一诊断，候选日志逐字相同，无新增类型错误；未人工读取或修改该工作线源码。
- 专项与变异：entry-annotations **15/15**，新增 3 项覆盖两种蓝图自身根 / 后代命中、嵌套核心预览根 / 深层后代 / 再嵌套蓝图根排除、核心外层普通组件排除和入口 action 回归。删除新增变体后，运行同一自身根正向断言确实失败（退出 1）；恢复 CSS 原字节。AST 只证明选择器匹配边界，不代替浏览器计算样式。guide 随本状态同步，最终同步校验及文档相关复验另记于本轮报告。
- 周期：P88 Builder 实施与工程自测完成，尚未记为已验收；继承旧周期 3/3 累计浏览器矩阵待收口，不新增已完成轮、不重置周期、不宣布矩阵收口。最近完整工程回归为本轮（2277/2277，类型检查保留上述基线问题）；下一触发点仍为 Supervisor 的 isolation 复验、累计浏览器收口与独立综合审查。
- 交接：`/next/foundations` isolation 组，外层 light / paper / dark × 内层 blueprint / blueprint-night × 320 / 768 / 1280（高 900），共 18 个原失败组合全部复验。reduced-motion 下等待稳定后，自身为预览根的两个标注组件 `color` 应与同内层主题对照一致并解析为 `--link`；同时复核核心内层隔离、普通组件、bp-sheet 后代和入口 action。`/next/foundations/blueprint#entry-annotations` 补看桌面 / 窄屏节点与标注强调色。本轮未生成浏览器截图。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。未验真实服务、Workspace、真机、读屏器或打印；未提交、推送、创建 PR、启动或重启服务、发布或同步站点。Builder 自测不等同 Supervisor Review 或 PO 批准。

### BPM1e · 2026-10-19（BPM1f 前矩阵线当前，原样保留）

- 轮次：BPM1e · 剩余四类探针修正 · 2026-10-19；基线 `c2dd2239b97963e12f7cf7cb3924328958e68a68`，分支 `docs/blueprint-matrix-closeout-2`；开工已有 BPM1d 修改与 Supervisor 重跑证据。
- 范围：仅本轮 evidence 和本状态；P87 隔离先稳定动画并保留属性/两侧值/来源，P74 真实候选打开与选中，320 标尺隐藏/无反白残留，320 CSS zoom2 依原验收1280范围改为未来重跑的观察项。产品源码、CSS、测试与依赖不变。[逐类结论及交接](evidence/matrix-closeout-20261019/bpm1e-analysis.md)。
- 当前浏览器实测为 BPM1d Supervisor 重跑：matrix 645通过 /645待目检；isolation 132通过 /18错误；interactions 1500/1500；per-round 955通过 /15观察 /116待目检 /20错误 /5失败。四组结果与截图索引原字节保留并[归档](evidence/matrix-closeout-20261019/bpm1d-supervisor-run.json.gz)，未改写为 BPM1e 通过。
- 风险：P87 旧比较不含 transform/opacity，动画不能直接解释旧失败；514行主题祖先选择器可能漏掉自身为蓝图预览根的 target-lock/callout，记录为源码支持的疑似缺陷，待稳定后的两侧值复核，未修改样式。
- Builder 离线验证：11个脚本语法、原12/12与新增6/6合成检查、fixture定向类型0诊断、离线计划4051行、validate 22/22静态检查（16条子命令退出0）。[实际命令与数字](evidence/matrix-closeout-20261019/validation.json)；本轮无生产构建/全量测试或浏览器执行。
- 交接：仅 isolation、per-round 使用 `--replace` 重跑，再 validate；matrix/interactions 不必因本轮重跑。原生200%缩放、18个隔离差异重点组合及URL/操作/预期/宽度见[浏览器清单](evidence/matrix-closeout-20261019/bpm1e-analysis.md)。既有截图不改，本轮无新截图。
- 周期：同轮自动化返工；旧周期3/3累计浏览器矩阵与独立综合审查仍待收口，P87未验收，不新增完成轮、不重置周期、不宣布收口。Builder 自测不等同 Supervisor Review 或 PO 批准。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。真实服务、Workspace、原生IME/缩放、真机、读屏器与实体打印未验。无提交/推送/PR、联网/依赖安装、服务启动/重启、部署/站点同步。


### BPM1d · 2026-10-19（BPM1e 前当前，原样保留）

- 轮次：BPM1d · 误报探针修正与 P87 纳入累计矩阵 · 2026-10-19；基线 `c2dd2239b97963e12f7cf7cb3924328958e68a68`，分支 `docs/blueprint-matrix-closeout-2`；开工工作树干净。
- 范围：仅本轮 evidence 与本状态；修正焦点哨兵等待、coarse采样、核心reduce契约、子菜单定位/两次Esc、Toast、Sheet、Switch、Sidebar断点/slot、编排未知文案、定点键盘入焦与按钮采样；CSS zoom保留失败门槛并补诊断，移动ShellNavFixture能力缺口转目检。产品源码、CSS、工程测试、依赖与冻结coss不改。[逐类结论与依据](evidence/matrix-closeout-20261019/bpm1d-analysis.md)。
- 当前浏览器实测仍为BPM1c Supervisor结果：interactions 1376通过 /64失败 /60错误；per-round 821通过 /57失败 /57错误 /85待目检 /15观察；四组结果/索引原字节保留并[归档](evidence/matrix-closeout-20261019/bpm1c-supervisor-run.json.gz)，不改写为修正后通过。
- 计划：18轮来源、158项义务，63可自动化 /21需目检 /74不适用或覆盖；per-round 1111行，interactions1500，matrix1290，isolation150。P87新增60自动行、6代表目检行及75隔离行；原Foundations Blueprint布局15组合重跑含图纸E。P87包含blueprint/light×320/1280，非代表组合不宣称视觉通过。[本轮目检计划](evidence/matrix-closeout-20261019/manual-review-plan.md)。
- Builder离线验证：语法检查、`--plan`、12/12项合成时序/策略检查、fixture定向类型0诊断、`validate.mjs`20/20静态检查（14条子命令退出0）；实际退出码、数字和证据散列以[validation.json](evidence/matrix-closeout-20261019/validation.json)为准。无本轮生产构建/全量工程测试或浏览器结果，不沿用P87历史工程数字。
- 交接：Supervisor使用`--replace`重跑interactions、per-round、matrix、isolation四组，再执行validate与目检；具体URL、操作、预期文案、主题/宽度及CSS投影/移动夹具复核点见[交接清单](evidence/matrix-closeout-20261019/bpm1d-analysis.md)。截图按既有PO决定仅留本机；本轮Builder无新截图。
- 周期：同轮自动化返工，旧周期3/3累计浏览器矩阵和独立综合审查仍待收口；P87保持未验收，不新增完成轮、不重置周期、不宣布收口。Builder自测不等同Supervisor Review或PO批准。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。真实服务、Workspace、原生IME/缩放、真机触控、读屏器与实体打印未验。无提交、推送、PR、联网、依赖安装、服务启动/重启、部署或站点同步。


### P87 · 2026-10-19（BPM1d 前当前，原样保留）

- 轮次：P87 · 图纸坐标追踪、图形标注与入口行 · 2026-10-19；基线 `f472fa64e1761e85e26416a09e9fc333ba202d03`，分支 `feat/blueprint-entry-annotations`；开工工作树干净。
- 范围：BlueprintSheet 可选 rulerTracking / rulerMark；新增 BpTargetLock、BpDiagramCallout、BpEntryRow；blueprint.css 的 P87 隔离样式、图纸 E、API 文档与同源 guide 生成物、新专项测试及 main SSR 夹具。既有 blueprint-components / blueprint-print-a11y 测试更新图纸总数与标题期望；blueprint-theme / blueprint-night 改用或沿用 CSS AST 区分 bp 关键帧，全部普通选择器隔离断言保持；不改组件目录总数、冻结 coss、theme.css、依赖或 Workspace。
- 实现与来源：[组件 API 与离线复用取舍](../blueprint-theme.md)。三种 bp 呈现导出沿用本模块登记，不另建正式 catalog 页面。SSR 默认路径四组与 main 逐字节一致，受控 null 优先级回退变异被捕获。
- 工程：`node scripts/check-math-font.mjs` 退出 0；`node scripts/check-typography.mjs` 317 TSX、退出 0；`node node_modules/vinext/dist/cli.js build` 退出 0；构建后 `node --test tests/*.test.mjs` 2274/2274（fail / skipped 均 0）、退出 0；`node node_modules/typescript/bin/tsc --noEmit` 退出 2，仅 1 条既有 TS2306（learning-analysis/prototype-source/main.tsx:57，app.js 非模块）。在 f472fa6 的 TypeScript / JSON 源码基线上以 `--incremental false` 同样复现此 1 条，未查看或修改该工作线内容；恢复候选输入字节后诊断一致。专项 12/12（含 1 个受控 null 优先级回退变异），受影响定向 55/55；guide 同步 / 校验与 diff 检查通过。
- 周期：P87 为新的已授权 Blueprint 小轮，Builder 实施与工程自测完成，尚未记为已验收；继承旧周期 3/3 累计浏览器矩阵待收口，不重置周期、不新增已完成轮、不宣布收口。最近完整工程回归为本轮（测试 2274/2274；类型检查保留上述基线问题），本轮无新增浏览器验收结论；下一触发点仍为累计浏览器收口与独立综合审查。
- 交接：`/next/foundations/blueprint#entry-annotations`，blueprint / light × 320 / 1280。检查图纸空白处细指针四边同步反白、离开清除；三行 hover / Tab focus 对应节点框、标签和图纸坐标；链接跳转与两按钮内容；68px 行高、窄屏动作换行、无行分割线；动态 reduced-motion 停装饰动画但保留静态高亮；嵌套核心预览不被蓝图强调规则覆盖。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。Workspace 接入、真实服务、真机触控、读屏器与打印未验；无本轮浏览器截图。不提交、推送、创建 PR、启动或重启服务、部署或同步站点。Builder 自测不等同 Supervisor Review 或 PO 批准。


### BPM1c · 2026-10-19（P87 前当前，原样保留）

- 轮次：BPM1c · 自动探针迁移与逐项分类 · 2026-10-19；基线 `19309411a5b936b0b06e7fd63ac8e39f03551337`，分支 `docs/blueprint-matrix-closeout`。在已有 BPM1/BPM1b 证据、截图与 STATUS 改动上继续；没有改源码、样式、工程测试或依赖。
- 范围：78 项历史交互逐项注册自动探针，计划 5 主题 × 320/768/1280 共 1170 行；修正 local-submenu 为真实节点移除/隐藏条件等待，保留两次 Esc 与回焦断言。17 份原始清单拆为 **59 可自动化 / 18 需目检 / 72 不适用或已有覆盖**，共149个义务；原文与行号见[逐项分类](evidence/matrix-closeout-20261019/classification.md)及[机器账本](evidence/matrix-closeout-20261019/checklist-classification.json)。非验收来源/历史正文单列，不混入义务计数。
- 计划：interactions 1500 行，其中1170行旧交互现在都有执行函数；per-round由整份清单占位改成885行自动检查、90行代表组合目检、60行既有附加探针，共1035行。目检限 blueprint / blueprint-night × 320/1280，加 light × 1280；[目检清单](evidence/matrix-closeout-20261019/manual-review.md)写明路由、状态、内容与待生成截图路径。截图由 Supervisor 重跑生成，Builder未创建本轮浏览器截图。
- 当前实测仍为 Supervisor 的 BPM1b 重跑：matrix 645 pass +645待目检；isolation 75 pass；interactions 315 pass /15 error /1170待执行；per-round 30 pass /30 observed /255待执行。[原重跑归档](evidence/matrix-closeout-20261019/bpm1b-supervisor-run.json.gz)与原 JSON 保留，不把脚本完成改写成实测通过。离线 `--plan` 只写独立计划和未运行的目检索引。
- Builder 验证：`node --check`、离线计划、脚本/账本/证据校验、临时React夹具定向类型检查，实际数字与退出码见[validation.json](evidence/matrix-closeout-20261019/validation.json)。未运行生产构建或全量工程测试；首次夹具定向类型检查漏载仓库 MathML ambient声明，修正校验入口后复验，不修改产品类型。
- 交接：Supervisor 使用 `--run --group=interactions --replace` 与 `--run --group=per-round --replace`；matrix/isolation不因本轮脚本补充重跑，既有645项阅读目检未自动核销。重跑后执行validate并逐项目检；详细命令、截图索引和限制见[交接说明](evidence/matrix-closeout-20261019/checks.md)。
- 周期：仍为旧周期3/3累计浏览器矩阵待收口；本轮为同轮自动化返工，**不新增完成轮、不重置周期、不宣布收口**。Builder自测不等于Supervisor Review或PO批准。
- 截图入库：PO 2026-10-19 决定 `docs/blueprint/screens/matrix-closeout-20261019/`（2190 张 PNG，约 2.3 GB）不提交到仓库，只留在 Supervisor 本机；证据 JSON 与清单中的截图路径指向该本机目录，仓库内不可直接打开。本次合并只入库 STATUS 与 evidence 目录，作为中途记录，不代表矩阵已收口。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行。新增探针尚未浏览器试跑；Vite临时fixture、CDP字形与新版定位器需本轮实际运行核实。Workspace、真实服务、原生IME/缩放、真机触控、读屏器与实体打印未验；历史基线像素对照不以当前CSS隔离替代。无提交、推送、PR、服务启动、发布或站点同步。

### BPM1b · 2026-10-19（BPM1c 前当前，原样保留）

- 轮次：BPM1b · 测量脚本修正与截图改名 · 2026-10-19；基线 `19309411a5b936b0b06e7fd63ac8e39f03551337`，分支 `docs/blueprint-matrix-closeout`。开工已有 BPM1 证据/截图目录及 STATUS 改动，保留全部实测判断。
- 范围：仅当前矩阵证据目录、对应截图目录和本状态。修正浮层动画后测量、Combobox 定位、子菜单两次 Esc、input 严格定位、核心主题线条观察策略与 mark-motion 稳定采样；645 张布局 PNG 改为可读路由名并更新引用，图片字节不变。源码、样式、测试、冻结 coss、Token、依赖不改。[修正说明与重跑清单](evidence/matrix-closeout-20261019/checks.md)、[改名映射](evidence/matrix-closeout-20261019/screenshot-renames.json)。
- Supervisor 首轮实测：matrix 自动 645/645 通过、645 待目检；isolation 75/75 通过；interactions 239 通过、31 失败、60 错误、1170 待验；per-round 21 通过、9 失败、255 待验、30 观察。Supervisor 经真实浏览器排查将本次列出的失败/错误归因为脚本问题；mark-motion 为 dark/320 单次过早采样，其余为可重复的测量/定位/断言问题。原始状态保留在 JSON 与[首轮归档](evidence/matrix-closeout-20261019/first-browser-run.json.gz)，本轮未改写为通过。
- 待重跑：Supervisor 使用 `--run --group=interactions --replace` 与 `--run --group=per-round --replace`；matrix/isolation 无需因本次修正重跑，阅读目检、旧交互与逐轮完整义务仍待逐项核销。稳定性超时记「未稳定」并保留实值，不能通过；核心线条只观察，夜图普通 border 1.584249 / 1.453912 保留已知限制。
- Builder 离线验证：脚本语法、`--plan`、8 项合成时序/策略/命名检查及 `validate.mjs` 已通过；实际命令、数字与退出码见[本轮验证](evidence/matrix-closeout-20261019/validation.json)。645 张改名图片 SHA-256 不变、1440 张分组索引 PNG 与引用已核对，离线计划保留 8 个实测结果/索引文件字节。没有本轮浏览器运行、生产构建或全量工程结果。
- 周期：仍为旧周期第 3/3 轮累计浏览器矩阵待收口；BPM1b 是同轮脚本返工，**不新增完成轮、不重置周期、不宣布收口**。须由 Supervisor 完成重跑、目检与独立综合审查。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行；真机、读屏器、IME、实体打印、原生缩放、真实服务和 Workspace 接入未验。未提交、推送、发布或同步站点；Builder 自测不等同 Supervisor Review 或 PO 批准。


### BPM1 · 2026-10-19（BPM1b 前当前，原样保留）

- 轮次：BPM1 · 旧周期累计浏览器矩阵执行交接 · 2026-10-19；基线 `19309411a5b936b0b06e7fd63ac8e39f03551337`，分支 `docs/blueprint-matrix-closeout`；开工工作树干净。
- 范围：只新增测量脚本、计划 JSON、来源/路由索引、检查说明与本状态记录；源码、样式、测试、冻结 coss、Token、依赖不改。23 份输入覆盖 17 个轮次组，逐份保留原清单行号；P86 依据当前源码与现有测试补齐，P85/b/c 共用清单保留增量条款。[执行交接](evidence/matrix-closeout-20261019/checks.md)、[来源与矩阵](evidence/matrix-closeout-20261019/manifest.json)、[路由索引](evidence/matrix-closeout-20261019/route-index.md)。
- 累计矩阵：43 路由 × 5 外层主题 × 320/768/1280 共 645 布局场景；布局/阅读 1290 条、交互 1500 条、Foundations 嵌套隔离 75 条、逐轮与附加测量 315 条，合计 3180 条均为待验占位（pass=null、measured=null），**不是实测通过数量**。78 条历史交互义务与逐轮完整清单继续待逐项核销，不用组合探针自动判整轮通过。
- 实际执行：Builder 完成离线准备、脚本语法与证据静态校验，实际命令、数字和退出码见[验证记录](evidence/matrix-closeout-20261019/validation.json)；没有运行浏览器、连接 localhost、启动/重启开发服务或生成截图。没有本轮生产构建/全量测试结果，不沿用历史工程通过数字。本轮按前置分工交给 Supervisor 运行浏览器脚本与目检。
- 静态偏差：P73 的既有输入示例现位于 Agent 总览锚点，旧独立路由不在当前语义注册项中；Blueprint 实验页局部主题仅核心三套，两蓝图外层保留 paper 局部，不算局部五主题通过。P78/P77/P85c 对旧气泡、导航、间距预期的替代关系详见交接说明。以上不是浏览器实测缺陷，不改源码或旧清单。
- 周期：沿用旧周期第 3/3 轮累计浏览器矩阵待收口；本轮只作执行交接，**不新增完成轮、不重置周期、不宣布收口**。是否满足收口条件，须由 Supervisor 完成实际矩阵、目检与独立综合审查后复核决定。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行；真机、读屏器、IME、实体打印、原生缩放、真实服务和 Workspace 接入未验。夜图分隔线及浅色系列白图案保留已知限制，当前实值仍待测。未提交、推送、发布或同步站点；未改授权范围外的 guide 生成物。Builder 静态检查不等同 Supervisor Review 或 PO 批准。


### P85c · 2026-10-18（BPM1 前当前，原样保留）

- 轮次：P85c · 关系图空能力列表间距修复 · 2026-10-18；沿用 `fix/blueprint-object-card-ink` 与 main 基线 `21560ebca1e4e8b45fe57125b8fdb619bece113c`，在 P85 / P85b 未提交改动上继续。
- 范围：仅 P85 CSS 块隐藏关系图标题紧邻的空能力说明列表，保留有内容列表与嵌套核心主题预览；组件 TSX 未改。[增量 diff](evidence/object-cards-20261018/p85c.diff)。
- 工程：本轮五项全套、专项和回退变异的实际结果见[工程记录](evidence/object-cards-20261018/engineering.json)、[变异记录](evidence/object-cards-20261018/mutations.json)。P85b 结果另存为 p85b-*，不充当当前证据。
- 间距：SSR 兄弟节点遍历推算 default 两卡均 20px、compact 均 12px，差值 0；这是标题底边至正文行盒顶边，实际文字顶边须浏览器测量。[推算明细](evidence/object-cards-20261018/p85c-spacing.json)、[浏览器清单](evidence/object-cards-20261018/browser-checklist.md)、[同步清单](evidence/object-cards-20261018/workspace-sync.json)。
- 周期与未验：继承旧周期 3/3 累计浏览器矩阵待收口，不新增完成轮、不重置周期。浏览器验收：按分工由 Supervisor 执行。真实服务、Workspace、真机、读屏器、打印未验；无本轮截图，未提交、推送或启动服务。Builder 自测不等同独立 Review 或 PO 批准。


### P85b · 2026-10-18（P85c 前记录，工程证据另存 p85b-*）

- 轮次：P85b · 对象卡片标题与正文间距统一 · 2026-10-18；分支 `fix/blueprint-object-card-ink`，main 基线 `21560ebca1e4e8b45fe57125b8fdb619bece113c`；在 P85 未提交改动上继续，不另计已完成小轮。
- 范围：运行时仅修改 `blueprint.css` 的 P85 块；两蓝图标题到正文默认 20px，与 `.bp-card-body` 上内边距对齐，compact 按 12/20 比例取 12px。编排标题覆盖自身 space-y 下边距，关系图标题扣除原父级 gap；其余正文间距、横向内边距与测量语义保持。[取舍](evidence/object-cards-20261018/inspection.md)。
- 工程：本轮五项全套、专项及回退变异的实际命令、数字、退出码见[工程记录](evidence/object-cards-20261018/engineering.json)、[专项记录](evidence/object-cards-20261018/targeted.json)、[变异](evidence/object-cards-20261018/mutations.json)。旧 P85 结果已另存，不能代替本轮复验。[累计 diff](evidence/object-cards-20261018/scope.diff)、[P85b 增量](evidence/object-cards-20261018/p85b.diff)。
- 保护：组件 TSX、核心三主题、coss、Token、依赖不改，嵌套预览排除沿用 P85。[Workspace 同步清单](evidence/object-cards-20261018/workspace-sync.json)更新 CSS blob / SHA-256，尚未同步 Workspace。
- 周期与未验：Builder 自测不等同独立 Review 或 PO 批准；继承旧周期 3/3 累计浏览器矩阵待收口状态，不新增完成轮、不重置周期。浏览器验收：按分工由 Supervisor 执行，见[待验清单](evidence/object-cards-20261018/browser-checklist.md)。无本轮截图；真实服务、Workspace、真机、读屏器和打印未验。未提交、推送或启动服务。


### P85 · 2026-10-18（P85b 前记录，旧工程证据另存）

- 轮次：P85 · 成果图纸对象卡片墨线标题 · 2026-10-18；分支 `fix/blueprint-object-card-ink`，main 基线 `21560ebca1e4e8b45fe57125b8fdb619bece113c`，开工工作树干净。[基线](evidence/object-cards-20261018/baseline.json)。
- 范围：仅两蓝图作用域的 AgentStructureArranger / AgentRelationGraph 外框、标题、状态与操作容器样式，以及现有图纸内示例、契约、专项测试与证据。选择方案 (b)：原 DOM 为 bp-frame-card / status / actions 的 CSS 别名；操作仍在正文后，核心默认输出不变，关系图无整体状态不补造。[取舍与逐项盘点](evidence/object-cards-20261018/inspection.md)。
- 宽度：外框 100% 且无组件外侧水平留白；标题仅抵消自身 20 / 16 / 12px 内边距，正文密度与关系图 ResizeObserver 内容盒语义保持。Workspace 宿主图纸宽度另行处理。[同步清单](evidence/object-cards-20261018/workspace-sync.json) 仅一个变更 CSS，附两个未改 TSX 的前置 blob / SHA-256；未实际同步 Workspace。
- 工程：AGENTS §6.1 五项退出码均 0；数学字体通过，排版 **313** 个 owned TSX 通过，生产构建通过；先构建后全量 **2249/2249，0 失败 / 0 跳过**，TypeScript **0 错误**。专项 **5/5**，48 组核心 SSR 字节摘要与基线一致，480 组 CSS / SSR 主题组合，**13/13** 回退变异检出。[实际命令](evidence/object-cards-20261018/p85-engineering.json)、[专项日志](evidence/object-cards-20261018/p85-targeted.log)、[变异](evidence/object-cards-20261018/p85-mutations.json)、[实际 diff](evidence/object-cards-20261018/p85-scope.diff)。初次专项的选择器测试探针漏处理 :has 的 scope AST，已修正探针，非运行时失败；STATUS 回填后一度有 2 项 guide 字节检查失败，已通过现有生成器同步必要索引与下载副本；没有修改既有测试。
- 保护：冻结 coss、核心主题 Token、两个目标 TSX、BpFrameCard、目录、依赖与 AGENTS 字节保持，blueprint.css 除 P85 新增块外与基线一致。[散列核对](evidence/object-cards-20261018/integrity.json)。未读取 / 修改其他解析批阅文档工作线，无提交、推送、.git 写入、依赖安装、联网、服务或站点操作。
- 周期：Builder 实施与工程自测完成，待 Supervisor 独立 Review / 浏览器验收；不自我批准。继承 P84 的旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不新增已完成轮、不重置周期；最近完整工程回归为本轮 2249/2249，下次触发点仍为旧周期累计浏览器收口与独立综合审查。
- 未验与待审阅：浏览器验收：按分工由 Supervisor 执行。[清单](evidence/object-cards-20261018/browser-checklist.md) 覆盖相关三路由、五主题 × 1280 / 320、嵌套核心预览、状态事实、原操作顺序与卡片宽度。无本轮截图；真实服务、Workspace 接入、真机、读屏器、打印未验。其他独立对象是否同轮式适配列为待 PO 决定，未扩大本轮范围。

### P84 · R9 稳定交互接口提炼 · 2026-10-18（原当前，原样保留）

- 轮次：P84 · R9 稳定交互接口提炼 · 2026-10-18；分支 `feat/agent-r9-extract`，main 基线 `433969ab29679669c78fde816dfec96c4db31cfb`，开工工作树干净。[基线](evidence/r9-20261018/baseline.json)。
- 范围：文件可读身份／移除文案与说明／本机选择和服务策略／可选常驻事实；确认六态短标签与时态；题篮版本摘要；Sheet 标题操作插槽。新增可操作蓝图内容，契约记录任务详情、停止与 E 部分结果、确认／结果、用量、依据与九态模式；四个运行时文件待 W207 按 [清单](evidence/r9-20261018/workspace-sync.json) 同步。coss、CSS、Token、字号、依赖和目录不变。
- 兼容：修改前核对四个 main blob，66 组既有调用 SSR 原始字节（含 ID）一致。保留旧 limits 类型的默认泛型，既有 MaterialIntake 无需修改；新增接口均须宿主主动启用。服务策略缺值不从本机上限补造，显示名不改动作身份，文案配置不改变资格。
- 工程：AGENTS §6.1 五项退出码均 0；数学字体／许可通过，排版 **312** 个 owned TSX 通过，生产构建通过；先构建后全量 **2244/2244，0 失败／0 跳过**，TypeScript **0 错误**。专项 116/116，新增 11 项中含 66 组旧输出逐字快照、25 组主题嵌套 SSR、13 项独立回退变异全部检出。[实际命令与退出码](evidence/r9-20261018/engineering.json)、[全量日志](evidence/r9-20261018/tests.log)、[实际 diff](evidence/r9-20261018/scope.diff)。首次全量因新增两个状态选择器触发 5 项旧数量断言失败；现改为独立核对四个具名 BpSegTabs 的唯一选中项，未放宽校验。P84 测试修正及检查迭代见交付报告。
- 保护：54 个冻结 coss 文件及 CSS／Token／字号／目录／依赖／AGENTS 共 61 文件与基线字节一致，Workspace 工作树保持干净，4 个同步 blob 已核对。[散列核对](evidence/r9-20261018/integrity.json)。
- 周期：本轮属于 Workspace R9 组件收口，Builder 实施与工程自测完成，最近完整工程回归为本轮 2244/2244；不等同 Supervisor Review／PO 批准。继承旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不新增已完成轮或重置周期；独立综合审查及浏览器收口仍由 Supervisor 执行。
- 未验与待审阅：浏览器验收：按分工由 Supervisor 执行。[清单](evidence/r9-20261018/browser-checklist.md) 覆盖五主题 × 1280 / 320、嵌套隔离、新旧接口与动作焦点。没有本轮截图，Workspace 尚未接线，真实服务、真机和读屏器未验。无新增 PO 决策项，不提交、推送、改 `.git`、联网、启动／重启服务或发布。


### P83 · AgentMark 列表行首 glyph · 2026-10-17（原当前，原样保留）

- 轮次：P83 · AgentMark 列表行首 glyph · 2026-10-17；分支 `feat/agent-mark-glyph`，基线 `bb85dd96270a421db5fa5626a1dda17c97e1e8e7`，开工工作树干净。[基线](evidence/agent-mark-glyph-20261017/baseline.json)。
- 范围：AgentMark 新增 glyph（16px 固定槽 / 13px 点阵），role=img + aria-label，无文字、live region、耗时和计时器；仅运行态动画，两蓝图 glyph 直角。复用现有 foreground / warning / destructive 及 reduce 媒体规则；既有 inline/loading 行为保留。组件页必要示例和契约同步。[复用与实现](evidence/agent-mark-glyph-20261017/inspection.md)、[实际 diff](evidence/agent-mark-glyph-20261017/scope.diff)。
- 工程：AGENTS §6.1 五项退出码均 0；数学字体/许可通过、排版 **311** 个 owned TSX 通过、生产构建通过、先构建后全量 **2233/2233，0 失败 / 0 跳过**、TypeScript **0 错误**。专项 **5/5**；72 组 inline/loading SSR 与基线逐字一致，9 项内存回退变异检出。[实际命令与退出码](evidence/agent-mark-glyph-20261017/engineering.json)、[专项日志](evidence/agent-mark-glyph-20261017/targeted.log)。
- 保护：54 个 coss 文件以及 theme.css / package.json / package-lock.json 共 57 文件与 HEAD 字节一致。[散列](evidence/agent-mark-glyph-20261017/integrity.json)。无提交、推送、发布、依赖安装或开发服务操作。
- 周期：Builder 实施和工程检查完成，待 Supervisor 独立 Review 与浏览器验收，未记为已验收。继承 P82 的旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不重置或新增完成轮；最近完整工程回归为本轮 2233/2233，下一触发点仍为旧周期累计浏览器收口，Workspace R3 / R6 / R9 保持。
- 未验与待审阅：浏览器验收：按分工由 Supervisor 执行。[清单](evidence/agent-mark-glyph-20261017/browser-checklist.md) 含五主题 × 1280 / 320、三变体六状态、reduce 初始/动态切换、accessibility tree、嵌套预览与既有尺寸回归。CSS/SSR/Effect 探针不代表真实浏览器已验；Workspace 接入、真实服务、真机、读屏器未验。无新增 PO 决策项，Builder 不自我批准。

### P82 · 事实栏 / 标题块窄容器两列 · 2026-10-17（原当前，原样保留）

- 轮次：P82 · 事实栏 / 标题块窄容器两列 · 2026-10-17；分支 `fix/blueprint-facts-narrow`，基线 `2f9c77644571c9475341f240cebe8e6248d7e62b`，开工工作树干净。[基线](evidence/facts-narrow-20261017/baseline.json)。
- 范围：BpFacts / BpTitleBlock 新增独立查询容器，≤480px 两列、奇数末项跨满；>480px 等宽单行。五主题共用布局，颜色、字号、Token 不变；原事实栏固定两列与原标题块 auto-fit 按本轮目标统一。两份指定文档及 guide 必要生成物同步。[实现与取舍](evidence/facts-narrow-20261017/inspection.md)、[实际 diff](evidence/facts-narrow-20261017/scope.diff)。
- 工程：AGENTS §6.1 五项退出码均 0；数学字体/许可通过、排版 311 个 owned TSX 通过、生产构建通过、先构建后全量 **2228/2228，0 失败 / 0 跳过**、TypeScript **0 错误**。专项 **4/4**，**9/9** 内存回退变异检出。初轮 2 项作用域测试失败已通过选择器改写修复，未修改既有测试。[工程记录](evidence/facts-narrow-20261017/engineering.json)、[专项](evidence/facts-narrow-20261017/targeted.log)。
- 保护：54 个 coss 文件及 theme.css / package.json / package-lock.json / catalog.ts 共 58 文件与 HEAD 字节一致。[散列](evidence/facts-narrow-20261017/integrity.json)。无提交、推送、发布、依赖安装或开发服务操作。
- 周期：Builder 实施与工程检查完成，待 Supervisor 独立 Review 和浏览器验收，未记为已验收。继承 P79 所记旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不重置或新增已完成轮；最近完整工程回归为本轮 2228/2228，下一触发点仍为旧周期累计浏览器收口，Workspace R3 / R6 / R9 约定保持。
- 未验与待审阅：浏览器验收：按分工由 Supervisor 执行。[交接清单](evidence/facts-narrow-20261017/browser-checklist.md) 含五主题、组件内容宽 280 / 360 / 640 / 1000 与 480 / 481 临界值、2 / 3 / 4 / 5 项、长中文和数值、真实 scrollWidth 与格线。CSS/SSR/轨道计算不代表视觉或实际像素溢出已验。新增外层对宿主直接子节点选择器的影响已写契约；真实服务、Workspace 接入、真机和读屏器未验。无新增 PO 决策项，Builder 不自我批准。

### P79 · 墨色标题栏卡片与字母分节卡片 · 2026-10-16（原当前，原样保留）

- 轮次：P79 · 墨色标题栏卡片与字母分节卡片 · 2026-10-16；分支 `feat/blueprint-nav-folio`，基线 P78 `8270cced893de48b202a772b6db0c42c13988dc0`（P77 / P78 尚未合并），开工工作树干净。[基线](evidence/cards-20261016/baseline.json)。
- 授权与分工：Supervisor `task-P79.md` / `builder-preamble.md`；PO 明确要求新增两种 bp-* 呈现组件，不计入正式目录。不提交、推送、修改 .git、联网、安装依赖、启动 / 重启服务或发布。浏览器验收：按分工由 Supervisor 执行。
- 范围：BpFrameCard / BpSectionCard、blueprint.css 中显式 bp-* 规则、原件与 A/B 试卷分节示例、使用契约与新增专项测试。核心主题中性回退，直角无阴影，1.5px 外框，语义 heading / 状态文字 / 具名 action；不新增 Token 或字号，普通组件、54 个冻结 coss、catalog 与依赖不变。[复用与接入位置](evidence/cards-20261016/inspection.md)、[保护散列](evidence/cards-20261016/integrity.json)、[实际 diff](evidence/cards-20261016/scope.diff)。
- 工程：五项检查均退出 0；数学字体 / 许可通过，语义字号 **311** 个 owned TSX 通过，生产构建成功，先构建后全量 **2224/2224，0 失败 / 0 跳过**，TypeScript **0 错误**。新增卡片专项 **8/8**，**13** 项内存回退变异被检出。首轮 types 发现示例图片尺寸可选属性的 2 条诊断，已用可选访问修复并重跑五项；initial-* 保留首轮原始结果。[工程记录](evidence/cards-20261016/engineering.json)、[专项日志](evidence/cards-20261016/targeted.log)、[变异记录](evidence/cards-20261016/mutations.json)。最终文档 / 状态回填后的 guide、构建与专项复核另见 [收尾检查](evidence/cards-20261016/finalization.json)。
- 样式证据：SSR / CSS 解析覆盖五主题、25 种嵌套主题组合、普通元素零增量、无 letter / status、BpCodebox 组合与长文本换行约束。五主题标题栏文字与色块边界对比度最低 **13.716118:1**；部分填充低于 3:1（最低 **1.815483:1**），使用 1px 高对比描边与完整文字识别，不宣称填充均通过。[数值](evidence/cards-20261016/contrast.json)。源级断言不是浏览器像素布局 / 键盘 / 视觉验收。
- 周期：Builder 实施与工程检查完成，待 Supervisor 独立 Review 和浏览器验收，未记为已验收。继承旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不重置或另计完成轮；本轮按任务全量工程回归，最近完整工程为本轮 2224/2224；下次触发点仍为旧周期累计浏览器收口，Workspace R3 / R6 / R9 约定保持。
- 未验与待审阅：浏览器验收：按分工由 Supervisor 执行。五主题 × 1280 / 320、action 键盘与焦点、状态色块 / 文字及嵌套预览见 [浏览器清单](evidence/cards-20261016/browser-checklist.md)。本轮无浏览器截图；Workspace 仅只读定位文件，未接入；真实服务、真机、读屏器、实体打印未验。无新增 PO 决策待定项，Builder 不自我批准。


### P78 · 教师消息气泡轻背景 · 2026-10-16（原当前，原样保留）

- 轮次：P78 · 教师消息气泡轻背景 · 2026-10-16；分支 `feat/blueprint-nav-folio`，基线为 P77 `eecb471`（位于 main `7ad8dbc` 之上），开工工作树干净。[基线](evidence/user-bubble-20261016/baseline.json)。
- 授权与分工：Supervisor `task-P78.md` / `builder-preamble.md`，对应 Workspace W193 的 P-R4-01 与蓝图 §6.1；不提交、推送、修改 `.git`、联网、安装依赖、启动/重启服务或发布。浏览器验收：按分工由 Supervisor 执行。
- 范围：仅 blueprint.css 的两蓝图用户气泡使用 secondary / foreground，正文链接使用 link、焦点使用 2px ring 外环与 2px offset；保留直角、不加气泡边框或阴影。附件文字/图标/现有边框继承前景。两处示例说明同步；组件 API、核心三主题、字号、令牌、依赖与 54 个冻结 coss 不变。[实现与复用](evidence/user-bubble-20261016/inspection.md)、[保护散列](evidence/user-bubble-20261016/integrity.json)、[实际 diff](evidence/user-bubble-20261016/scope.diff)。
- 工程：五项检查均退出 0，数学字体/许可通过、排版 **311** 个 owned TSX 通过、生产构建成功、先构建后全量 **2216/2216，0 失败 / 0 跳过**、TypeScript **0 错误**。定向 **18/18**；17 个内存回退变异均被检出。[工程记录](evidence/user-bubble-20261016/engineering.json)、[定向日志](evidence/user-bubble-20261016/targeted-initial.log)、[变异](evidence/user-bubble-20261016/mutations.json)。文档/状态回填后的生成物、构建与文档专项复核见 [finalization.json](evidence/user-bubble-20261016/finalization.json)。
- 对比度与隔离：白图文字/附件为 **16.259790:1**，链接/焦点对气泡 **5.587005:1**；夜图分别 **13.083512:1**、**6.392999:1**。焦点对 card/background 也逐项 ≥4.5:1。[数值](evidence/user-bubble-20261016/contrast.json)。实际 SSR / CSS 规则测试覆盖两蓝图、核心零增量、嵌套核心根/后代及核心岛，保留助手正文；这些不等同浏览器视觉/层叠/焦点验收。
- 周期：Builder 实施与工程检查完成，待 Supervisor 独立 Review 和浏览器验收，未记为已验收。继承旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不重置或另计完成轮。本轮按任务全量工程回归；最近完整工程回归为本轮 2216/2216，下一触发点仍是旧周期累计浏览器收口，Workspace R3 / R6 / R9 约定不变。
- 未验与待审阅：浏览器验收：按分工由 Supervisor 执行。五主题 × 1280 / 320、链接焦点、附件/公式/长中文及嵌套预览详见 [浏览器清单](evidence/user-bubble-20261016/browser-checklist.md)。无本轮浏览器截图；Workspace 未同步接入，真实服务、真机、读屏器、实体打印未验。无新增 PO 决策待定项，Builder 不自我批准。


### P77 · 顶部导航选中态加强与成果 folio · 2026-10-16（原当前，原样保留）

- 轮次：P77 · 顶部导航选中态加强与成果 folio · 2026-10-16；分支 `feat/blueprint-nav-folio`，main 基线 `7ad8dbc2146324ed2999febaf35e6417084f03d7`，开工工作树干净。[基线](evidence/nav-folio-20261016/baseline.json)。
- 授权与分工：Supervisor `task-P77.md` / `builder-preamble.md`；Builder 实施与工程自测，不提交、推送、修改 `.git`、联网、安装依赖、启动 / 重启服务或发布。浏览器验收：按分工由 Supervisor 执行。
- 范围：两蓝图一级导航 36px primary / primary-foreground 直角实块，hover 保持、去掉下划线；单一 2px ring 外环 / 2px offset，滚动容器两端 4px 留白。SpaceBar / 侧栏不变。Header / Sheet 增加 REV、显式 folio、空值省略、补零与 folioAriaHidden；保留 sheetNo 并让显式 folio 优先。既有文件版本与作答页夹具补 REV / SHEET / 无 folio 样例；加入逻辑与读屏规则写入规范和契约。[实现 / 复用 / Workspace 接线](evidence/nav-folio-20261016/inspection.md)。
- 工程：五项最终均退出 0：字体检查通过、排版 **311** 个 owned TSX 通过、生产构建通过、先构建后全量 **2209/2209，0 失败 / 0 跳过**、TypeScript **0 错误**。定向 **38/38**；导航 19 个与 folio 9 个回退变异均检出。首轮全量 2204/2208，4 项失败均为新增两 Sheet 后旧固定 4 个的断言；现已独立核对六个区域标题 / aria-labelledby、两处 folio 隐藏及夜图覆盖，不是既有失败。[命令与时间](evidence/nav-folio-20261016/engineering.json)、[定向日志](evidence/nav-folio-20261016/targeted.log)、[初轮日志](evidence/nav-folio-20261016/initial-tests.log)、[实际 diff](evidence/nav-folio-20261016/scope.diff)。文档 / 状态回填后的生成物与构建检查另记 [finalization.json](evidence/nav-folio-20261016/finalization.json)。
- 保护与对比度：54 个冻结 coss 文件、theme.css、AppBar 原 TSX / CSS、依赖与 AGENTS 共 60 文件逐一哈希相同。[保护核对](evidence/nav-folio-20261016/integrity.json)。两蓝图 primary 文字对比度分别 17.758837 / 15.819093:1，ring 对 card 为 6.102091 / 7.093761:1；解析规则与理论数值不冒充浏览器验收。
- 周期：Builder 实施 / 工程检查完成，待 Supervisor 独立 Review 与浏览器验收，未记为已验收。继承旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不重置或另计完成轮。本轮按任务提前全量工程回归，最近完整工程回归为本轮 2209/2209；下一触发点仍是旧周期累计浏览器收口，Workspace R3 / R6 / R9 约定不变。
- 未验与待审阅：浏览器验收：按分工由 Supervisor 执行。没有本轮截图；五主题 × 1280 / 320、首末导航项焦点 / hover、folio 换行 / 切页 / 可读性、嵌套核心预览隔离见 [浏览器清单](evidence/nav-folio-20261016/browser-checklist.md)。Workspace 仅只读定位接线，未修改 / 集成；真机、读屏器、真实学校数据、实体打印未验。Builder 不自我批准，无新增 PO 决策待定项。


### P76 · 顶部导航与左侧目录 · 2026-10-16（原当前，原样保留）

- 轮次：P76 · 顶部导航与左侧目录 · 2026-10-16；分支 `feat/blueprint-shell-nav`，基线 `780c2ef0cb14e378fd72f21194ee7f2835d7e045`，开工工作树干净；叠加于未合并 P75。[基线](evidence/shell-nav-20261016/baseline.json)。
- 授权与分工：Supervisor `task-P76.md` / `builder-preamble.md`；Builder 实施与工程自测，浏览器交 Supervisor；不提交、推送、改 `.git`、联网、安装依赖、启动或重启服务、发布。
- 范围：运行时仅 `blueprint.css`，两蓝图 AppBar / SpaceBar / 本站顶栏 card + 结构底线，导航 foreground 下划线和 accent 直角悬停；Sidebar accent / foreground / 左侧 inset 2px，56px 轨道与 40px 按钮。核心主题、嵌套核心根/后代/伪元素、数字角标、Tabs/Toggle、字号、令牌、冻结 coss 和依赖保持。文档和既有 guide 生成物同步。[实现与取舍](evidence/shell-nav-20261016/inspection.md)、[保护核对](evidence/shell-nav-20261016/integrity.json)。
- 工程：新增专项 10/10，与既有主题检查合计 19/19；15/15 专项及 5/5 层边界内存变异检出；包含真实 SSR、真实 Tailwind important 工具类编译、CSS 特异性 / 层与两种加载顺序、嵌套隔离。五项最终均退出 0：数学字体通过、排版 311 个 owned TSX 通过、生产构建通过、先构建后全量 **2202/2202，0 失败 / 0 跳过**、TypeScript 0 错误。[工程命令与时间](evidence/shell-nav-20261016/engineering.json)、[实际 diff](evidence/shell-nav-20261016/scope.diff)。首轮 2201/2202 的唯一失败为旧断言禁止所有 layer；已收紧为精确尺寸规则例外，并验证 5 个违规变异，不是基线失败。状态回填后的文档 / 夹具类型 / 构建复核另记[收尾记录](evidence/shell-nav-20261016/finalization.json)。
- 对比度与焦点：foreground/accent 蓝图 14.927942:1、夜图 11.106881:1，满足文字 ≥4.5 / 选中线 ≥3；不新增令牌。选中线独立于单 outline；仅顶栏一级导航因横向裁切使用 −4px outline-offset，其他控件 +2px，交 Supervisor 复核。
- 周期：Builder 实施 / 工程检查不等同 Supervisor Review / PO 批准，未计为已验收；继承 P75 所记旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不重置旧周期。按任务提前执行全量工程回归，最近完整工程回归为本轮 2202/2202，累计完整浏览器仍待收口；Workspace R3 / R6 / R9 触发约定不变。
- 浏览器与未验：浏览器验收：按分工由 Supervisor 执行。没有本轮截图；五主题 × 1280 / 320、菜单、焦点、56 图标轨、核心嵌套及 Workspace AppBar 主题 / Portal 接线见[清单](evidence/shell-nav-20261016/browser-checklist.md)。`fixture.tsx` 为评审夹具，未注册路由；实际浏览器挂载、Workspace 接入、真机、读屏、实体打印未验。
- 待审阅：Supervisor 独立 Review、焦点内移的局部适配与实际浏览器验收；无新产品方向、公共 API 或令牌决策。

### P75 · 题目详情虚线纸面与间距 · 2026-10-16（原当前，原样保留）

- 轮次：P75 · 题目详情虚线纸面与间距 · 2026-10-16；基线 `ab14ab4a59ef593e9d29061c892256d5e233bc3d`，分支 `feat/blueprint-question-detail`，开工工作树干净。[基线](evidence/question-detail-20261016/baseline.json)。
- 授权与分工：Supervisor `task-P75.md` + `builder-preamble.md`。Builder 仅实施与工程自测；未提交、推送、修改 `.git`、联网、安装依赖、管理开发服务或发布。
- 范围：运行时仅 `app/(next)/next/blueprint.css`，复用 `.question-detail-region` / Tabs data-slot / `.question-solution`；两蓝图详情为 card 纸面、1px 虚线、直角、12px padding，压缩 Tabs 和三个面板间距。fine Tab 至少 32px，coarse 沿用原 44px 规则。夜图 border/card 1.453912:1，按授权改用既有 line，达到 11.622496:1；白图仍用既有 border。核心主题、组件结构/API、字号、令牌值、冻结 coss、依赖均未改。[实现与复用记录](evidence/question-detail-20261016/inspection.md)。
- 工程：新增测试 8/8，内存变异 14/14 检出；真实 SSR + CSS 选择器/规则探针覆盖两蓝图与嵌套核心预览根/后代，不能替代真实 computedStyle。五项全套均退出 0：数学字体通过、排版 311 个 owned TSX 通过、生产构建通过、先构建后全量 **2192/2192，0 失败 / 0 跳过**、TypeScript 0 错误。[命令与时间](evidence/question-detail-20261016/engineering.json)、[实际 diff](evidence/question-detail-20261016/scope.diff)、[保护核对](evidence/question-detail-20261016/integrity.json)。
- 验收夹具：证据目录新增真实 QuestionCard / QuestionDetails 交互夹具，白底图复用原 CoordinateDiagram；不登记目录或新增产品路由。夹具 bundle / SSR 通过，实际浏览器挂载未执行。
- 周期：P75 是局部蓝图详情修正，Builder 实施/工程检查完成，待 Supervisor 独立 Review 与浏览器验收，尚未记为已验收。继承 P74 所记旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不重置旧周期或另计已完成轮；本轮按任务提前执行全套工程回归，最近完整工程回归为本轮 2192/2192，累计完整浏览器仍待收口。Workspace R3 / R6 / R9 触发约定保持。
- 浏览器与未验：浏览器验收：按分工由 Supervisor 执行。五主题 × 1280 / 320、真实三 Tab / coarse 高度、白底图、核心嵌套及 computedStyle 前后对比见[浏览器清单](evidence/question-detail-20261016/browser-checklist.md)。没有本轮截图；视觉、真实键盘/焦点/触屏、读屏器、实体打印和 Workspace 真实接入未验。
- 待审阅：本轮无新增产品方向或令牌待 PO 决定；Builder 工程完成不等同 Supervisor Review / PO 批准。


### P74 · Agent 浮层容器契约补齐 · 2026-10-16（原当前，原样保留）


- 轮次：P74 · Agent 浮层容器契约补齐（R2 后续 / CI-11）· 2026-10-16；开工基线 `e750a963d53da4a3bba1cf53500616ebff4b16d2`，分支 `fix/agent-portal-container`，开工工作树干净。[基线](evidence/portal-20261016/baseline.json)。
- 授权与分工：Supervisor `task-P74.md` + `builder-preamble.md`；Builder 实现与工程自测，浏览器由 Supervisor 执行。未提交、推送、修改 `.git`、联网、安装依赖、管理开发服务或发布。
- 范围：统一 `PrismScopeProvider` + `scoped-overlays`，补齐 18 处 Agent / 24 处静态依赖 / 1 处旧 Drawer；公开子菜单容器契约、Providers 受控 Toast 入口和局部图表主题。只替换相关 Popup import，不给 18 个业务组件逐一加 prop；热力图、箱线图及 ECharts 渲染层同用局部主题。现有 Menu 页增加嵌套复验夹具。详见[复用取舍](evidence/portal-20261016/inspection.md)、[调用清单](evidence/portal-20261016/call-sites.json)及[新契约](../component-contracts.md)。
- 兼容边界：显式目标优先，未提供 scope 保留原始父 Portal / body 默认；null 等待、未附着 ref 回退严格沿用 Base UI。Toast 容器按整队列控制，Agent 页内通知须独立 manager，AppBar/其他页仍全局；离页局部队列卸载。核心主题令牌、默认色板和配置、冻结 coss、目录与依赖不改，新增 API 不写 DOM 主题或持久化。
- 工程：新增 16 项测试；含旧夹具修复的定向复验 86/86 通过；43 处绑定回退 + 4 个挂载透传/优先级回退 + 1 个局部图表回退，共 48/48 内存变异检出。真实 React Context / Base UI Portal append/remove 与队列隔离是工程证据，原语定位/焦点仍为探针。本轮五项工程检查退出码均为 0：数学字体/许可通过、排版 311 个 TSX 通过、生产构建通过、先构建后全量 **2184/2184，0 失败 / 0 跳过**、TypeScript 0 错误。实际命令、日志与初轮 9 项夹具失败的修复见[工程 JSON](evidence/portal-20261016/engineering.json)及[检查记录](evidence/portal-20261016/checks.md)，不沿用 P73 结果。
- 周期：P74 属 Workspace R2 后续组件契约修复；共享适配与图表变更按任务提前执行全量工程回归。Builder 自测不等同 Supervisor Review / PO 批准，Builder 实施/工程检查完成，尚未记为已验收；最近完整工程回归为本轮 2184/2184，最近完整浏览器矩阵仍为历史记录；继承 P73 所记旧 Blueprint 3/3 累计浏览器矩阵未收口状态，不重置旧周期，Workspace R3 / R6 / R9 的累计触发仍保留。
- 浏览器与限制：浏览器验收：按分工由 Supervisor 执行。没有本轮浏览器截图，不宣称视觉、真实键盘/焦点、定位或裁切通过；1280 / 320、核心/蓝图双向嵌套、Toast 离页和图表操作见[浏览器清单与 Workspace 接线](evidence/portal-20261016/browser-checklist.md)。Workspace 固定来源同步/实际接线、真实服务、真机/触控、读屏、实体打印和全站视觉未验。
- 待审阅：统一入口命名与容器/Toast 归属契约由 Supervisor 独立 Review；后续 Workspace 同步按其任务执行。本轮没有需要 Builder 自行决定的新产品方向、视觉令牌或业务规则。


### P73 · Agent 蓝图 S0 / R1 组件铺路 · 2026-10-16（原当前，原样保留）

- 轮次：P73 · Agent 蓝图 S0 / R1 组件铺路 · 2026-10-16；开工基线 `5644554aa6920fdbffdcbd1fdac617c20af1cc2e`（PR #195 merge），分支 `feat/agent-blueprint-r1`，开工工作树干净。[基线记录](evidence/r1-20261016/baseline.json)。
- 授权：Supervisor `task-P73.md`，按 `builder-preamble.md` 分工实现、自测并交接；不写 `.git`、不提交 / 推送 / 发布、不联网或启动服务，浏览器由 Supervisor 执行。
- 范围：CI-01 增加兼容默认值的 `showModelSelector?: boolean`；CI-07 默认提示改为「补充一个信息」；CI-08 为附件补稳定 data-slot，在蓝图家族内归零消息 / 附件圆角；CI-09 仅修白图 PromptBar / AgentSurface 按钮叠环和墨底消息链接。五主题 / 320px / 模型显隐及墨底链接复用现有对话示例。运行时、测试、文档 diff 与保护范围见[检查记录](evidence/r1-20261016/checks.md)。
- CI-11：固定 Menu / Popover / Select / Dialog / Tooltip 已能传递 `portalProps.container`，PromptBar 已接外层根容器，不新增共享封装。其他未传容器的 Agent 浮层保留 body 默认值；局部主题传递归 Workspace R2，详见[Portal 调用清单](evidence/r1-20261016/portal-audit.md)。这不是全部浮层主题已通过的结论。
- 定向证据：新增 11 项测试在修改前为 3 通过 / 8 失败；实现后连同既有对话 / 夜图测试 50/50 通过。新增测试 15/15 内存变异被检出，修改的既有隔离测试 2/2 内存变异被检出，冻结 coss 未写入；[变异明细](evidence/r1-20261016/mutations.json)。本轮五项完整工程检查均退出 0：`node scripts/check-math-font.mjs` 字体 / 许可通过；`node scripts/check-typography.mjs` 308 个 TSX 通过；`node node_modules/vinext/dist/cli.js build` 成功；先构建后 `node --test tests/*.test.mjs` 为 **2168/2168，0 失败、0 跳过**；`node node_modules/typescript/bin/tsc --noEmit` 0 错误。[命令与日志](evidence/r1-20261016/engineering.json)。状态及 guide 回填后的同步 / 构建 / 文档专项核对另记[收尾记录](evidence/r1-20261016/finalization.json)，不冒充浏览器验收。
- 检查周期：Workspace 规划 S0 第 R1 轮，Builder 实施 / 自测不等同 Supervisor Review 或 PO 批准，尚未记为已验收。继承上一当前的 Blueprint 3/3 累计浏览器矩阵未收口状态，**不重置旧周期**。本轮按 P73 完成全套工程检查；R3 / R6 / R9 仍按 Workspace 规划触发累计完整回归，旧周期累计浏览器范围由 Supervisor 补齐或 PO 调整。
- 浏览器与限制：浏览器验收：按分工由 Supervisor 执行。无本轮浏览器截图；选择器测试、SSR 与回调探针不证明布局、焦点裁切或真实 Portal 挂载。五主题 × 1280 / 320、嵌套双向预览、模型有 / 无、澄清、圆角、焦点及浮层路径见[交接清单](evidence/r1-20261016/browser-checklist.md)。真实服务、Workspace 接入、真机、读屏器、实体打印及全部 Agent 组件整体适配未验；夜图焦点按 §5.4 留待其专项。
- 待审阅：CMP 接口审阅确认 `showModelSelector` 命名；Supervisor 独立 Review 与浏览器验收。没有新增产品规则、依赖、组件目录条目、令牌、字号或状态枚举。


### 夜图补丁恢复 · 2026-10-16（原当前，原样保留）

- 轮次：夜图补丁恢复 · 2026-10-16；基线 `773724595ab36d0574252da8503821d93eb9c6a1`，分支 `feat/blueprint-night`。用户确认警告色修复已收尾并允许合并，已先合并 PR #194；下方 BPW1 原记录完整保留为历史。
- 授权与范围：接续 BPv9 交接、按最新 main 处理冲突、更新夜图配色测试、自测并同步合并。增加 `blueprint-night`，复用现有蓝图几何和本轮 main 的通用组件 / 编辑式排版；必要接入包括主题注册、Providers 的原生色系、Foundations 预览、图表与热力图；不新增组件目录条目。
- 冲突处理：原补丁与新 main 不直接兼容，先保留当前 201 条 CSS 规则，再扩展家族选择器与预览排除；适配 diff 经 `git apply --check` 后应用。夜图图表固定为交接时的独立回退色板，不覆盖 P69 核心深色；白图警告前景仍为 `#995909`。原 stash / 补丁保留，旧 `evidence/v9/` 不覆盖；来源与实际 stash 父提交修正见[检查记录](evidence/night-20261016/checks.md)。
- 本轮修复：独立审查检出原补丁的描边悬停 / 危险文字对比度问题；夜图适配改用既有 card / accent / code-bg 表面，实色危险使用深墨文字，加载标签保持透明。真实 coss variants 与 render 触发器测试覆盖默认、hover、pressed、loading、Toggle 选中保留和非夜图隔离；不改冻结 coss、依赖、核心与白图原有令牌、正式规范。
- 本轮工程：数学字体及许可通过；语义字号 308 个 owned TSX 通过；生产构建成功；全量 **2157/2157，0 失败、0 跳过**；TypeScript 0 错误；guide 同步校验通过。命令、时间与退出码见[本轮工程记录](evidence/night-20261016/engineering.json)。最终状态回填只更新文档 / 证据与 guide，随后执行同步检查、文档专项与最终构建；结果另附同目录，不以历史测试数字代替。
- 本轮浏览器：[记录](evidence/night-20261016/browser.json)覆盖蓝图示例五主题 × 1280 / 320px、Foundations 五种外层 × 五种嵌套预览、夜图 Tabs 双视口、320px Dialog Escape 焦点返回、真实按钮悬停 / 危险前景及热力图点按 0 与数据表。主题切换及持久化、color-scheme、长中文和所测结构可读；读屏文案说明窄屏隐藏数字，数据表保留缺测。实际操作与[截图索引](evidence/night-20261016/checks.md)区分于源码断言和 SSR。
- 审查：独立只读代码 Review 返工后为 [PASS WITH NOTES](evidence/night-20261016/review.md)，没有代码阻断；它不是 Claude Supervisor 的产品 / 浏览器验收。用户本轮已授权合并，实际 PR 与合并提交以最终 GitHub 记录为准；本轮未发布 GPT Site。
- 检查周期：本轮为当前周期第 3/3 轮，工程完整回归与独立代码综合审查完成；本次浏览器是上述受影响代表矩阵，未重跑此前所有组件 / 浮层的累计完整交互矩阵，因此**不将累计浏览器完整回归记为完成、不重置周期**。下一轮收口须补齐累计浏览器矩阵或由 PO 调整边界；同轮修复不另计数。
- 保留限制：夜图普通分隔线在画布 / 纸面约 1.58 / 1.45:1，结构控件应使用高对比 `--line`；夜图浅色系列上的白色图案不足 3:1，夜图色板 / 连续色阶 / 图案仍按原交接回退，待设计确认。Recharts 仍主要靠颜色区分系列。热力图隐藏披露例外仅单元 / SSR 验证；DOM 主题预览不证明 React 图表 Context 隔离；实体打印、真机、读屏器、原生缩放、全站像素与全图表视觉矩阵未验。

### BPW1 · 蓝图警告前景色对比度 · 2026-10-16（原当前，原样保留）

- 轮次：BPW1 · 蓝图警告前景色对比度 · 2026-10-16；开工基线 `c5d236339d1d811df06982c753f3a29ecc786e51`，分支 `fix/blueprint-warning-contrast`；开工工作树干净。
- 授权与范围：按 Supervisor 委派 `task-BPW1.md`，仅将蓝图 `--warning-foreground` 从 `#A8620A` 调为 `#995909`；补充 `tests/blueprint-theme.test.mjs`，更新主题正文及既有 guide 生成物。核心三主题、`--warning`、其他令牌、组件源码、冻结 coss、依赖及冻结正式规范和其 public 副本均不改。
- 检查周期：本轮为当前周期 2/3，Builder 实施与全套工程检查完成，待 Supervisor 独立 Review / 浏览器验收，尚未计为已验收；上一轮已完成 1/3。按本轮任务要求执行全套工程检查，未据此重置周期；第 3 个完成轮仍须完整回归及独立综合审查。
- 选值：沿原琥珀 / 赭色方向等比例降低 sRGB 通道后取整，`#995909`；最差组合为 warning-foreground/accent，计算值 4.660886:1，白字/card 对该填充为 5.544764:1。保持警告与错误红 / 正文墨色的色相或亮度差异，真实视觉辨识交 Supervisor 验收。
- 本轮工程：按序运行 `node scripts/check-math-font.mjs`（固定字体与许可通过）、`node scripts/check-typography.mjs`（308 个 TSX 文件通过）、`node node_modules/vinext/dist/cli.js build`（成功）、`node --test tests/*.test.mjs`（2145 项 / 2145 通过 / 0 失败 / 0 跳过）、`node node_modules/typescript/bin/tsc --noEmit`（0 错误），退出码均为 0。另运行 `node scripts/sync-blueprint-guide.mjs` 及 `--check`（131 块 / 85 项资源），主题专项 9/9；内存变异确认恢复旧蓝图值会使表面 / Badge 对比度测试失败，三核心主题各自偏移均被契约检出。测试从实际 CSS 令牌计算五种表面、三种 8% Badge 合成底与两种反白标签；核心 warning-foreground 契约直接取自当前 main，light/paper 为 `#895509`，dark 为 `#F4CC86`。
- 偏差与审查：无组件新增或改造，本轮复用现有令牌、coss Badge 的 `bg-warning/8` 和既有主题测试；不引入外部实现。冻结规范仍保留旧值，按委派不修改；本次全量测试未因该已知差异失败，未放宽既有断言；冻结规范值与实现的同步仍须另行授权。Builder 自测不等同于 Supervisor Review 或 PO 批准；不提交、推送或发布。
- 未验证范围：浏览器验收：按分工由 Supervisor 执行；本轮未调用浏览器、未启动 / 重启开发服务，无新增截图；真机、读屏器与实体打印未验。四主题 × 320 / 1280px 的检查路径见本轮外部报告 `BPW1-Report.md`。
- 最近完整工程回归：本轮 BPW1 为 2145/2145 通过；最近完整浏览器矩阵仍为下方通用组件第二批的历史证据。本次工程通过不替代浏览器矩阵或第 3 轮独立综合审查；此前 1949 项 / 1688 通过 / 261 既有失败仅保留为历史。


### 蓝图编辑式排版与 Geist Mono 子集 · 2026-10-16（原当前，原样保留）

- 轮次：蓝图编辑式排版与 Geist Mono 子集 · 2026-10-16；开工基线 `9b5ac0c389abb5fb232b0356a920a60706d86e27`，Site v123，分支 `feat/blueprint-editorial-type`；开工工作树干净。
- 授权：用户批准编辑式章节 / 小节排版、有限 Geist Mono 本地子集及每 3 个已完成小轮做完整回归与独立综合审查。本轮只作用于现有蓝图展示，不扩展 Agent 业务正式规范的实施范围。
- 检查周期：本轮实施完成、定向检查通过，累计 1/3；下次普通小轮为 2/3，第 3 个完成轮收口时必须进行完整回归及独立综合审查。计数按已完成的授权小轮，不按提交 / 重试 / 同轮返工递增；高风险提前扩大检查时另记原因与计数处理。
- 排版决定：章节 20/30、中文小节 16/24、小节索引 / folio / 图注编号 12px，使用既有语义角色；章号保留默认 48×48 墨底块与 stat-display 24px / 500 字形。标题组间隔 12px，小节线 1px，章节沿用结构墨线。普通章节用 SECTION，真实图纸才用 SHEET，窄屏 folio 换行，中文不缩字。
- 字体实值：Geist Mono 官方 1.4.2，固定提交 `4d655731f83507f0258ce5541c297b6553d5d081`，OFL-1.1；本地 400 / 500 WOFF2 分别 10768 / 11048 字节，每份 204 码点、321 glyph。family 为 Geist Mono Blueprint，swap，回退既有 font-mono；仅用于章号 / 索引 / folio / 英文短标签，中文 UI 与 STIX 数学路径不变。两份资源及许可 SHA-256 已核对，完整实值见主题正文与 public/fonts/blueprint/manifest.json；Builder 的子集 --check 字节复现通过。
- API：既有封装增加 BlueprintSectionHeader 的显式 code / folio kind，Sheet 原 props 保持兼容，只有 Sheet 生成框线 / 标尺；BpMinor 增加可选 code / label / headingLevel，label 缺省回退 children，id / className 保留；BpFigCap 仍为段落。API 已按源码及本轮定向测试核对。
- 实现与文档：唯一 Builder 调整既有章节 Header / BpMinor / 字体；本轮原位更新 AGENTS、开发工作流、typography、component-contracts、本主题正文与状态。冻结 coss、核心主题、公共字号角色、品牌原色及业务布局保持原边界，不增目录条目或规划副本。
- 本轮工程：[专项记录](evidence/editorial-20261016/engineering.json) 为 TypeScript 0 错误、Typography 308 文件、组件 / API 10/10、字体资源检查及子集字节复现通过；其时间为结果汇总时间。按已批准 1/3 节奏，本轮未运行全量工程测试或上轮完整组件交互矩阵。
- 本轮浏览器：[browser.json](evidence/editorial-20261016/browser.json) 覆盖 1280px / 320px，6 个章节 Header、18 个分节标题，所有 folio 可见，尺寸和窄屏换行符合角色；Chrome 实际字体查询确认 Regular / Medium、中文系统字与 STIX 数学字形按用途命中。正常两字体 loaded，隔离上下文阻断两文件后为 error，320px 回退仍可读且无页面横溢；四主题普通 body / Input 与[改动前](evidence/editorial-20261016/before.json)属性相等，InputGroup 整组焦点保持。人工截图核对及精确边界见[定向检查](evidence/editorial-20261016/checks.md)。
- 偏差处理：首次字体 CSS 二层导入造成开发页 500，已改 theme 同级导入并重启唯一服务后恢复 200；最终证据来自修复后的页面。没有以缓存中的 0 字节资源计时冒充字体文件体积。
- 审查与发布：[独立轻量 Review](evidence/editorial-20261016/review.md) 结论为 PASS WITH NOTES；guide 同步校验与最终生产构建仍是发布门槛。生产构建在文档与 guide 冻结后执行，结果记入 PR / 最终部署记录，不为回填本文重复构建；不预写构建、提交或 Site 发布成功，第三轮综合审查不替代当轮门槛。
- 历史基线与限制：最近完整回归记录为通用组件第二批的 1949 项 / 1688 通过 / 261 既有失败，无新增失败，见下方历史及对应证据；该结果不转记为本轮通过。真机、读屏器、实体打印、原生缩放及所有语言 / 状态组合不得在未实测时宣称通过。

### 蓝图配色规则与通用组件第二批 · 2026-10-16（原当前，原样保留）

- 轮次：蓝图配色规则与通用组件第二批 · 2026-10-16；开工基线 `2865942bb755efaa516a0f6f4252cdf79b4b1969`，Site v121；任务分支 `feat/blueprint-common-batch-two`，开工工作树干净。
- 授权：用户于 2026-10-16 批准蓝图配色规则和第二批 12 类实施。范围为 InputGroup、Combobox、ToggleGroup、Progress；Menu、Popover、Tooltip、Toast；AlertDialog、Sheet、Skeleton、Empty。保留首批和原蓝图样板，Agent 业务页面与布局继续暂缓。
- 配色决定：延续纸墨与 `#1D5FBF` 交互蓝，保留成功 / 警告 / 错误的独立语义及前景背景配对；品牌原色 `#339FF2` / `#E0438F` / `#C2F25B` 与品牌标识保持不变。AI 来源需真实来源依据与可读标识，品牌渐变不表达正确性、进度或完成。
- 兼容澄清：既有教材封面及 DialogLayout 装饰复用 `--brand-ai-gradient`，变量名不赋予教材或对话框 AI 来源语义。仅原位澄清 `docs/foundation-tokens.md`、`docs/component-contracts.md` 与 `docs/blueprint-theme.md`，不改业务源码、公共令牌 / API、不全仓重命名，不扩展新渐变装饰范围。
- 实现边界：复用固定 coss 与 Prism，只在蓝图范围调整样例相关几何和语义配色使用，几何覆盖继续排除嵌套核心预览根、后代及伪元素；浮层核对真正 Portal 宿主。针对矩阵发现的派生值继承问题，仅在涉及 Blueprint 的真实预览边界重绑既有 `--radius-lg` / `--radius-md` / `--color-muted`，使核心预览恢复自身令牌，夹具补 `text-foreground`；不新增公共令牌或改变普通核心全局主题。冻结 coss、品牌资产、依赖、组件目录与轻量 Blueprint v0.4 保持原边界。
- 复用依据：已核对 12 类固定 coss 及 actions / overlays / feedback、本地 input / selection / dialog particles。另下载并阅读全文的官方 particles 共 14 项，来源 URL、依赖与文件散列见[复用记录](evidence/batch2-20261016/reuse-sources.json)，不发布上游全文。实际复用 coss、Prism Button / QuestionMath 与组合结构，Toast 沿用现有私有 manager 属性，Sheet 使用真实 MathML；不复制演示计时器、远程 avatar 或任务成功事实。历史 registry 缓存仍不存在，不声称穷举完整上游；此轮不新增 Agent 执行组件或公共 API。
- 第二批浏览器：[交互](evidence/batch2-20261016/interactions.json) 47/47；[矩阵](evidence/batch2-20261016/matrix.json) 223/223，包含四主题 × 320px / 768px / 1280px 共 12 组布局、11 个真实浮层情景、6 组双向局部主题比较，记录内对应属性全部相等。覆盖所展示的输入、选择、错误、禁用、键盘、焦点、通知、确认取消、Sheet 长内容与减少动态效果；不称全部状态已验。
- InputGroup 追加修复：[焦点实测](evidence/batch2-20261016/focus.json) 正常 / 错误 / 只读三类与独立清除按钮通过；旧会话 1280px 整组 439px、内部 386px / 411px，外层 2px 蓝色 outline / 2px offset，内层 outline / shadow 为 none，错误红边保留。[旧会话 320px 复验](evidence/batch2-20261016/routes.json) 整组 246.67px，焦点包住完整组合；旧尺寸不冒充干净环境结果。
- 干净浏览器复验：[fresh-focus.json](evidence/batch2-20261016/fresh-focus.json) 的 1280px / 320px 下，innerWidth、文档和 body 的 clientWidth / scrollWidth 均等于视口；html / body zoom 为 1、DPR 为 1、visualViewport.scale 为 1。整组分别为 446.5px / 246px，保持完整 2px 蓝色焦点线；仅既有 Tabs 局部横向滚动，无文档级横溢。320px 截图已替换为本次证据。
- 第一批与原样板回归：[首批交互](evidence/batch2-20261016/first-interactions.json) 31/31；[首批矩阵](evidence/batch2-20261016/first-matrix.json) 12 组布局与 8 个真实浮层，局部比较全部相等，CSS zoom 2 通过。[原按钮](evidence/batch2-20261016/first-hover.json) 四主题 × 320px / 1280px 共 8 情景通过，8 个原按钮均保留，蓝图主行动对比度 17.76:1。核心三主题 Progress [修改前后](evidence/batch2-20261016/core-comparison.json)完全一致。
- 正式路由：[第二批 12 页 × 320px / 1280px](evidence/batch2-20261016/routes.json) 共 24 次访问返回 200、真实样例存在且无页面横向溢出；具体交互以夹具记录为准，截图索引见[检查记录](evidence/batch2-20261016/checks.md)。
- 工程检查：数学字体、语义字号（308 个 owned TSX）、TypeScript 与最终生产构建通过，Blueprint 专项最终 39/39。全量首次 Windows 沙箱为 1923 / 1661 / 262，额外失败为 symlink EPERM；正常权限复跑为 1949 / 1688 / 261。随后 release 中间结果为 1949 / 1686 / 263，[新增两项](evidence/batch2-20261016/release-failure-delta.json)仅因文档生成物未同步。最终生成后重新构建并复跑为 1949 项 / 1688 通过 / 261 既有失败，两项生成物失败已消除，[最终失败描述集合](evidence/batch2-20261016/complete-failure-delta.json)与上一轮 hover 相同，new=[]、removed=[]；不声称全量通过。[命令、时间与退出码](evidence/batch2-20261016/engineering.json)已归档。
- 审查与当前进度：[独立 Review](evidence/batch2-20261016/review.md) 最终结论为 PASS WITH NOTES，正式放行；源码、浏览器与最终工程条件已满足。最终结果回填仅改说明与证据，规范 guide 和下载资源重新生成并检查 hash。发布提交 SHA、PR 与 Site 版本以实际合并和发布终态为准，不预写发布成功。
- 未验：真机、读屏器、实体打印、原生 200% 缩放、全站像素回归与未展示的状态组合；CSS zoom 2 不代替原生缩放。未知进度不补为 0，Toast / Empty / Skeleton 不制造业务事实；Sheet 真实 MathML 样例不等于全部公式与 Agent 业务场景已验收。第四主题保持候选状态。


### 主行动按钮悬停可读性修复 · 2026-10-15（原当前，原样保留）

- 轮次：主行动按钮悬停可读性修复 · 2026-10-15；基线main / 本地 / Site v120均为 `6cbbe50532495b7c1ca0b9d6b7bee9ed54e8b919`。
- 用户问题：悬停文字不清楚，以及原蓝图按钮是否被取消。原样例未删除，仅被新增基础组件下推；在顶部补两项导航入口。
- 实现：仅修正blueprint.css现有primary hover背景/文字成对令牌，demos/blueprint.tsx补锚点。原主/次/小/危险/禁用样例完整保留；不改coss、API、依赖或核心令牌。
- 浏览器：四主题×320/1280，primary默认/hover/hover加焦点/按下均可读；蓝图17.76:1，其他主题最低13.92:1。次要/危险hover、禁用与减少动态效果通过定向检查；入口实际跳转成功。见 [浏览器测量](evidence/hover-20261015/browser-results.json)。
- 工程检查：构建、类型、数学字体、307文件字号通过；Blueprint39/39；全量1949/1688通过/261既有失败，无新增或消失。见 [验收和独立审查](evidence/hover-20261015/checks.md)。
- 独立Review：PASS WITH NOTES，无阻断。规范原位更新并重新生成；PR合入后用同一main提交发布Site，最终SHA与版本以部署记录及会话终态为准。
- 限制：只验本组按钮及导航；全站布局、真机、读屏器和原生缩放不在本轮完成声明中。

### 通用基础组件 Blueprint 首批 · 2026-10-15（原当前，原样保留）

- 轮次：通用基础组件 Blueprint 首批 · 2026-10-15；开工基线 `55f25df36af5a8aaaa2374fed0427d9379b501e2`，Site v119。开工工作树干净。
- 授权：用户在本会话明确“同意。批准，开始实施”。首批限定 Button、Input、Textarea、Select、Checkbox、RadioGroup、Switch、Tabs、Card、Badge、Alert、Dialog 共 12 类现有通用组件；Agent 业务页面与布局暂缓。
- 实施范围：`app/(next)/next/blueprint.css` 的主题适配，`components/prism-next/blueprint-foundation-demo.tsx` 对照夹具及现有蓝图示例页接入，本文件和 `docs/blueprint-theme.md`、规范生成物及直接证据；`.gitattributes` 为本轮证据限定 LF。不新增组件目录、公共 API、依赖或业务流程；冻结 coss 与核心三主题保持原意，轻量 Blueprint v0.4 不扩入第四主题适配。
- 设计边界：沿用现有语义字号与主题令牌，区分结构线、次级分隔线、静态表面和真实操作；Radio 保留圆形。只读、禁用、加载、错误分别表达；选中态由真实属性驱动。墨底焦点保留分隔层，标尺保留上一轮 14px / 10px 及其限定例外。
- 复用核对：已读取固定 coss `e937becd2d5ffb5c621eed6f8b1f223cbb6051e7` 的 12 类源码及 Prism Badge 适配；读取本地 `selection-particles.tsx`（p-select-6 / 18 / 7 / 21）、`dialog-particles.tsx`（p-dialog-5 / 4）、`input-particles.tsx`（p-input-group-22）和 forms / navigation / feedback 组合。历史 registry 与 p-tabs-1 缓存当前不存在，只复核 [v7 已归档检索摘要](evidence/v7/reuse.json) 和 [v8 记录](evidence/v8/inspection.md)，未联网刷新或复制新第三方代码。通用基础组件主题适配不涉及 Beautiful UI 的 Agent 执行组件新增。
- 交互边界：复用 coss / Base UI 的键盘、焦点、受控状态与 Portal；夹具只管理可逆输入、选中、开合状态，不复制模拟保存计时器或产生业务完成回执。
- 已实现修正：Input / Textarea 外层边框、单一焦点与错误色；Select 实际弹层表面；Checkbox indicator 方角与已选错误红色内描边；Switch 关闭状态；CardFrame 裁切；下划线 Tabs；Dialog 底部方角。320px 下本样例激活 Tab 的外侧焦点靠近裁切边缘，已限定在基础组件夹具内改为内侧 2px 蓝线加纸色隔离；[稳定采样](evidence/common-20261015/final-focus.json) 确认 active / focus-visible 均为 true、outline 2px、offset −3px、纸色 inset 4px，最终截图已目视复验。此记录替代路由快照中尚未结束的投影过渡值。
- 真实交互：[31 项检查](evidence/common-20261015/interactions.json) 全部通过，涵盖输入校验及错误清除、只读 / 禁用、Select 键盘 / Escape、Checkbox / RadioGroup / Switch、两种 Tabs、Dialog 初始焦点 / 校验聚焦 / 内 Select 关闭 / 焦点限制 / 关闭返回、本页卡片更新及静态状态文字。禁用 Tabs 可获焦点但不能激活，沿用实际 Base UI 行为；不写成所有禁用项均跳过焦点。没有以这 31 项宣称所有变体和状态组合通过。
- 四主题矩阵：[matrix.json](evidence/common-20261015/matrix.json) 中 light / paper / dark / blueprint × 320px / 768px / 1280px 共 12 组均展示 12 类样例，无页面横向溢出。Dialog 和内部 Select 挂在同一主题容器内；三个核心全局主题与全局蓝图内对应核心预览的 radius / background / color / border / shadow 逐项相等；全局 light 内显式蓝图的反向对照相等。结论限定这些浮层和属性，不外推到所有 Portal 宿主或全站像素。
- 正式路由：[routes.json](evidence/common-20261015/routes.json) 记录 12 类组件页及 InputGroup 回归页 × 320px / 1280px，共 26 次访问均为 200 且无页面横溢；InputGroup 内部无样式控件保持 border 0，并追加 Checkbox 错误内描边和 Dialog 底部方角测量。Dialog 开合行为以上述真实交互为据，不能仅从路由 HTML 推定已验。
- 打印与缩放：Select 打印媒介投影检查为 none；未做原生打印预览或实体输出。CSS `zoom: 2` 截图及测量无页面横溢，但 Ctrl++ 未改变 viewport / DPR，原生浏览器 200% 缩放仍未验证。
- 工程初跑：math-font 通过，typography 307 个 owned TSX 通过，生产构建与 TypeScript 通过。全量 1949 项 / 1686 通过 / 263 失败：其中 2 项为规范更新后尚未同步生成物；其余 261 项与标尺轮既有失败描述相同。Blueprint 初跑 39 项 / 37 通过 / 2 项同类生成物失败；同步后复跑：数学字体、307 文件字号、生产构建、TypeScript 均通过，Blueprint 39/39 通过；全量 1949 / 1688 通过 / 261 失败 / 0 skipped，与标尺基线失败描述集合完全一致，无新增或消失，详见 [检查记录](evidence/common-20261015/checks.md) 和 [失败集合对照](evidence/common-20261015/final-failure-delta.json)。不宣称全量通过。
- 文档与证据：范围、复用依据、当前实际样例和未验边界已原位更新；[起点测量](evidence/common-20261015/before.json) 及截图目录 `docs/blueprint/screens/common-20261015/` 已保存。规范 JSON 与下载资产已同步。[独立审查](evidence/common-20261015/review.md) PASS WITH NOTES，无阻断。按已授权流程合并 PR 后，以同一 main 提交构建并发布 Site；最终 SHA 与版本以部署记录和会话终态为准，不在自身源码中预填未来发布信息。
- 未验范围：真实 MathML 公式、系统剪贴板复制、长正文 Dialog、已选错误 Radio、全部变体 / 状态组合、原生 200% 缩放、真机、读屏器、完整对比度审计、实体打印、全站像素回归及 Agent 业务场景。历史 v9 与标尺轮结果不当作本轮验证，第四主题继续为候选。


### 外侧标尺密度微调 · 2026-10-15（原当前，原样保留）

- 轮次：外侧标尺密度微调 · 2026-10-15；基线 GitHub main / 本地 / Site v118 均为 a36acadade4068a21f5bc9a0336d9714a812450f。开工工作树干净。
- 授权：用户明确要求降低外侧标尺宽度、减小字号，并授权自行决定数据与实施；本轮仅以此允许装饰坐标的局部10px字号例外。
- 运行时范围：blueprint.css。蓝图标尺18→14px，数字12→10px / 行高1，内框及四边同步；rem随根字号缩放。正文、内容留白、核心主题、冻结coss与依赖保持不变。字号检查仅新增完整选择器、aria-hidden、文件路径和精确声明的单条例外，并由独立最小仓库执行测试证明其他局部字号与失去隔离的规则仍被拒绝。
- 真实浏览器：四主题 × 320/1280px；蓝图1280的标尺14/10px，320隐藏；核心三主题与双层核心预览保留18/12px；根字号放大25%后为17.5/12.5px，数字无裁切。见 [测量](evidence/ruler-20261015/browser-results.json) 与 docs/blueprint/screens/ruler-20261015/。
- 文档：原位更新蓝图规范、当前状态并重新生成站点正文及证据下载。检查结果见 [本轮验证](evidence/ruler-20261015/checks.md)。发布按任务PR合入main后将同一提交同步到Site；最终版本以部署记录和会话终态为准。
- 独立审查：PASS WITH NOTES，无阻断；[审查记录](evidence/ruler-20261015/review.md)。构建、类型、字号与39项蓝图测试通过；全量1949项中1688通过、261失败，失败集合与输入基线一致。
- 未验范围：真机、读屏器、实体打印及全站像素回归。本轮是已批准的装饰调整，不改变第四主题候选状态。

### 三方同步 · 2026-10-15（原当前，原样保留）

- 轮次：三方同步 · 2026-10-15。用户明确要求将 Site、GitHub 与本地同步。
- 输入基线：GitHub main 1f575ea；Site v117 / c59c0ca；本地第一批完善 74790e7。共同祖先为 5ba6277。
- 合并范围：保留 GitHub 第四主题与图表更新，导入 Site 轻量 Blueprint v0.4、MIT 许可和实验历史，同时保存本地第一批完善、规范全文与证据。
- 冲突处理：保留第四主题侧栏和规范页示例入口；生成的 JSON 与实验说明下载文件从合并后的源文档重新生成。两条蓝图实验不互相替换。
- 跨系统一致性：仅将规范直接引用文本及下载快照限定 LF，避免 Windows CRLF 改变来源 SHA-256；没有修改冻结 coss 或依赖。
- 同步流程：任务分支经 PR 合入 GitHub main，再由相同 Git 提交更新 Site 并发布，本地回到 main。发布结果以会话终态与 Site 部署记录为准。
- 本轮实际检查、结果和限制见 [同步验证](evidence/sync-20261015/checks.md)。历史 v9 结果保留，不作为本轮全量测试通过依据。
- 第四主题仍为候选；真机、读屏器、实体打印等未验范围继续保留。

### v9 · 来源提炼后第一批完善与站点规范入口 · 2026-10-15（原当前，原样保留）

- 轮次：v9 · 来源提炼后的第一批完善与站点规范阅读入口。
- 日期 / 基线：2026-10-15，GitHub main 1f575ea；工作分支 docs/blueprint-source-audit-20261015。用户在本会话明确批准执行，并要求将《Foundations · 第四主题「蓝图」》记录到智能曜彩站点。
- 本轮范围：现有样板的容器布局、标题层级、禁用态、墨底焦点分隔层、静态卡片与示例动作语义、长中文与公式阅读；规范原文生成站内页面、目录和直接证据下载。冻结 coss、依赖和核心三主题 Token 未改。
- 站点边界：以线上 v116 的 Site 源码为基线，仅添加规范页面及导航。Site 现有三主题和轻量 Blueprint v0.4 保留；GitHub 第四主题运行时修改仍在本地工作分支，不能从文档发布推断主题已经部署。
- GitHub 工作分支尚未提交或推送；Site 文档发布由独立 Site 源码流程保存。上线版本和地址以会话发布结果为准。

### 实现与浏览器验收

- 标题采用章节语义字号；两列与双框按内容容器宽度重排，320px 去除外层装饰，长标签可换行。
- 禁用按钮、工具和分段项不产生悬停/按压动作反馈；固定数据明确标注为样例，移除模拟业务推进，静态卡片不伪装可点击。
- 蓝图墨底主行动、选择项及面板链接采用 2px 白纸色分隔层与 2px 蓝色外框；真实键盘焦点稳定后计算值与截图一致。
- Chrome 桌面视口模拟：light/paper/dark/blueprint × 320×800、1280×960，页面 scrollWidth 均等于 viewport。并非真机或全站像素回归。
- Home/End 到首项「全部」和末项「异常」，焦点外框均留在滚动边界内；禁用「主行动不可用」按下前后的背景、文字、边框、投影和位移一致。
- Tabs 方向键只移动焦点，Enter 才激活；长公式自身 248px/327px 横滚；规范表格自身 280px/512px 横滚，页面仍为320px。
- 双层核心预览 DOM/CSS 夹具的字体、颜色、圆角和外框与单层对应预览一致；未据此声称 React Theme Context 或读屏器通过。
- 浏览器记录：[browser-results.json](evidence/v9/browser-results.json)；截图目录 docs/blueprint/screens/v9/。独立代码审查为 PASS WITH NOTES，无阻断问题；上述浏览器复验补齐其主要待验项。

### 验证与限制

| 检查 | 本轮结果 |
| --- | --- |
| 字体与语义字号 | math-font 通过；306 个 owned TSX 通过。Windows CRLF 导致的 attachment 例外匹配先恢复该文件 Git LF，内容 diff 为空 |
| Vinext build | 通过；见 [build.log](evidence/v9/build.log) |
| TypeScript --noEmit | 通过；见 [tsc.log](evidence/v9/tsc.log) |
| Blueprint 与规范页定向测试 | 37/37 通过；见 [实际运行记录](evidence/v9/targeted-blueprint-checks.json) 及 [测试日志](evidence/v9/targeted-blueprint-tests.log) |
| 全量测试 | 1947 项，1686 通过、261 失败；不得引用历史 2034/2034 作为本轮结果 |
| 失败调查 | Windows 路径过滤、CRLF 字节、ESM 子路径及虚拟文件匹配问题；代表性 HEAD 基线复现见 [分析](evidence/v9/windows-test-analysis.md)。未逐项解决261项失败 |
| 文档安全同步 | 来源hash、资源字节、路径边界与恶意协议检查通过；最终发布源需再运行 sync --check |

本轮完成第一批，整体仍为候选状态。后续按规范的阶段3—5继续检查密集数据、打印与真实教师场景。真机、触摸、读屏器、实体打印、全站像素回归及全部历史测试的Windows适配未完成；本轮不据此批准第四主题全站发布。

### v8 · 打印图案密度与可访问性工程检查 · 2026-10-14（原当前，原样保留）

- 轮次：v8 · 打印图案密度与可访问性工程检查；Builder 实现与自测完成；Supervisor 浏览器验收结论 `PASS WITH NOTES`。
- 日期 / 基线：2026-10-14，`feat/learning-charts` · `efe001ff6eaf3b228c41e5873fe22b9e3c4587ea`（含 BPv6 / BPv7）。授权依据：Supervisor `task-BPv8.md` 记录 PO 指示继续第 3 项“实体黑白打印时的图案密度、真机、读屏器验收”；本环境只做工程检查。
- 工作树：开工干净，沿用当前分支；未提交、推送、联网、创建 PR、启动服务或发布。其他 P 系列图表、coss、AGENTS、核心三主题 Token、依赖及既有测试均未改；[保护核对](evidence/v8/integrity.json)。
- 运行时范围：`app/(next)/next/blueprint.css`、`lib/prism-next/chart-palette.ts`；新增 `tests/blueprint-print-a11y.test.mjs`；本文与 `docs/blueprint/evidence/v8/`。[实际 diff](evidence/v8/scope.diff)。
- 原“当前”正文连同日期、基线、Supervisor 记录原样移入历史；开工快照见 [status-before.txt](evidence/v8/status-before.txt)。

### 修复与工程检查

- 打印仅作用于 blueprint 并排除嵌套核心预览根、后代及伪元素：清除 body / 预览根 / SidebarInset / 卡片缩略图网格和已知硬投影（含 ECharts SVG filter）；保留边框墨线与 TitleBlock 结构分隔线，数据纹理请求 exact 打印。
- 六系列保留实底、−45° / +45° 斜线（2px 线 / 4px 间隙）、2.4px 点径 / 8px 点阵、横 / 竖条纹（3px / 3px）。仅把图案白色 alpha 统一提高到 .8，图案/默认底色比值从部分不足 3:1 提高为 11.61、4.31、3.76、3.33、3.76:1。色相相近灰度用纹理方向和密度补充；不声称实体打印已能辨认。
- 蓝图焦点统一为既有 #1D5FBF、2px 外框、外偏移 2px；分段控件加 4px 留白避免外框紧贴滚动裁切边缘。核心三主题保持原样；浏览器复验仍须检查首末项及横向滚动。
- 四主题实际 React SSR 检查 Blueprint 具名 section、radio、步骤、数值替代文本、反馈角色，Tabs 关联面板及禁用态，热力图 details/table/零值/缺测。只替换 useTheme 值，未替换 EChart 或控件。三个正式路由由本轮构建 worker.fetch 返回 200；SSR 无真实主题切换或键盘证据。
- 蓝图正文 / 次要 / 链接在 #F6F6F3 上分别 16.40 / 7.25 / 5.64:1，在白卡片上 17.76 / 7.85 / 6.10:1；焦点分别 5.64 / 6.10:1，墨线亦 ≥3:1。四主题正文类令牌均 ≥4.5、焦点 ≥3；详见 [令牌计算](evidence/v8/contrast.json)。
- 完整线距、角度、点密度、灰度亮度差、离线 coss / particles 检索依据、SSR 解释与局限见 [工程检查](evidence/v8/inspection.md)；[同底灰六纹理 SVG](evidence/v8/six-textures-equal-grey.svg) 是 ECharts SSR 夹具，不是浏览器或打印截图。
- 偏差：没有设计 patch，按任务手动适配；不联网刷新 registry。没有修改共享表格语义、三核心主题或 P 系列实现。Builder 自测不等同于 Review / PO 批准。

### 本轮验证

按 §6.1 顺序，先构建后全量测试；README 对应运行目录变量位于 `.sites-runtime/`，保留进程 HOME。所有结果来自本轮代码，[命令与退出码](evidence/v8/checks.json)。

| 命令 | 实际结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 字体与许可通过，退出 0；[日志](evidence/v8/math-font.log) |
| `node scripts/check-typography.mjs` | 304 个 owned TSX 通过，退出 0；[日志](evidence/v8/typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 构建成功，退出 0；既有 chunk 大小、静态路由分类提示；[日志](evidence/v8/build.log) |
| `node --test tests/*.test.mjs` | 2034/2034，fail 0，skipped 0，退出 0；[日志](evidence/v8/full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 条诊断，退出 0；[日志](evidence/v8/tsc.log) |
| `node --test tests/blueprint-print-a11y.test.mjs` | 11/11，fail 0，skipped 0，退出 0；[日志](evidence/v8/targeted-tests.log) |
| 浏览器证据 | 见下方「Supervisor 浏览器验收」 |

### Supervisor 浏览器验收（2026-10-14，5173，`/next/foundations/blueprint`）

- 打印模拟方法：把页面全部 `@media print` 规则（共 28 条）取出，作为无 media 条件的样式注入后再读取计算样式。这不是浏览器原生的打印预览。
- 通过（blueprint）：body 背景从 40px 网格渐变变为 none；bp-* 元素的非 none 投影从 2 个变为 0；`.bp-btn` 墨线仍为 1.5px。
- 通过（light，1280 iframe）：注入打印规则前后，前 3000 个元素的背景、投影、外框、边框计算值完全一致，核心主题打印输出不变。
- 未验：浏览器原生打印预览与灰度预览、六系列纹理的实际打印辨识、实体打印、真机、读屏器；焦点环裁切、Home / End 仅靠 Builder 的 SSR 检查。
- 本轮附带的屏幕变化：蓝图六系列纹理的白色 alpha 统一为 .8，影响蓝图屏幕显示，不只影响打印。
- 待 PO / 设计决定（来自 Builder 报告）：蓝色焦点环在墨底上对比度约 2.91:1，是否加分隔层；BpSizeBar 纯色填充是否另配图案。

### 交给 Supervisor 的浏览器验收清单

使用已运行服务，以下基址为 `http://localhost:5173`。light / paper / dark / blueprint × 320×800、1280×960；截图记录主题、视口、路由、日期与上述基线，存入 `docs/blueprint/screens/v8/`，本轮未预建空目录。

1. `/next/foundations/blueprint`：Tab 到按钮、图标工具、卡片、“替换本页”及链接；蓝图浅底上的焦点为 2px #1D5FBF，偏移 2px。检查墨底面板上的焦点可见性（见待定项）。`#actions` 方向键 / Home / End 移动“答卷状态”，跳过“已锁定”；末项“异常”说明为“当前：4 份未提交或扫描失败”，首末项外框不得被横向滚动容器裁掉。补验长中文和公式。
2. `/next/components/tabs`：键盘聚焦“内容”，→“材料信息”→“历史记录”，Enter / Space 激活；显示“当前为初始示例版本，尚无修订记录。”；禁用项不激活，焦点滚动可见，320px 仅标签行横滚。三核心主题原焦点与视觉保持不变。
3. `/next/components/evidence-matrix#compact-heatmap`：点第一格保留“运算求解 · 基础”“0”，第二行第三列显示“推理论证 · 综合”“缺测”；蓝图窄容器隐藏格内数值但保留提示和完整数据。Tab 展开“查看数据与选择项目”，进入“查看”按钮，核对按键意图及行名，不把内部 ID 当作已通过读屏体验。
4. **打印模拟（emulate print media）**：上述 3 页在 blueprint 应无 40px 页面网格、20px 缩略图网格及偏移硬投影；1.5px 墨线、数据图案、TitleBlock 内分隔线保留。检查背景图形开 / 关、灰度预览及 100% 缩放；核心三主题打印前后对照开工基线，不应受到本轮覆盖。
5. 同底灰六纹理夹具 [SVG](evidence/v8/six-textures-equal-grey.svg)：在浏览器打开，再对照实际 ECharts 六系列柱 / 面积（可用 v4 归档夹具临时挂载，需记录路由）；仅凭实底、斜线方向、点阵、横竖纹应可对应系列。小图例、窄柱、薄面积须另验，不以此文件代替当前真实图表集成验收。
6. 嵌套预览：全局 blueprint 内放 light / paper / dark 预览根，含按钮、卡片、伪元素；screen / print 各检查核心根与后代的背景、投影、焦点不被蓝图规则覆盖。反向核心主题内的显式 blueprint 预览也检查。此项只验证 CSS，既有 next-themes Context 不随 DOM 属性变更的图表限制保留。

### 未验证范围与待决定

- 浏览器验收：按分工由 Supervisor 执行。**真机、读屏器、实体打印未验**；本轮无浏览器截图，不能用 SSR / CSS 源码断言代替视觉或交互验收。
- 待 PO / 设计决定：固定蓝色焦点在墨底 #16181D 上仅约 2.91:1，深色表面是否采用分隔层；共享 DataRecordTable 内部 ID 操作名及选择状态的语义约定；若要覆盖 BpSizeBar 多个纯色填充，须另定纹理映射。未擅自扩展本轮实现。
- 六系列纹理结论只适用于既有 ECharts 填充图案；不覆盖 Recharts 无纹理图、无填充折线 / 散点、热力图连续色阶、调用方自定义色、透明面积及小图例的实体可读性。

### v7 · Tabs 320px 横向溢出 · 2026-10-14（原当前，原样保留）

- 轮次：v7 · Tabs 320px 横向溢出；Builder 实现与自测完成，Supervisor 浏览器验收结论 `PASS WITH NOTES`（见下方「Supervisor 浏览器验收」）。
- 日期 / 基线：2026-10-14，`feat/learning-charts` · `46303a46304955276af030c5059613096ef3be3f`（含 BPv6 `190f15d` 与 P64）。授权依据：`task-BPv7.md` 记录 PO 指示“继续做第 2 项 Tabs 溢出”。
- 工作树：开工干净，沿用当前分支，不提交、推送、建 PR、启动服务或发布。P64、固定 coss、AGENTS、核心三主题 Token、依赖和既有测试均未改；[保护核对](evidence/v7/integrity.json)。
- 范围：`components/prism-next/demos/navigation.tsx`、`components/prism-next/blueprint/blueprint.tsx`、内部布局 hook `components/prism-next/use-horizontal-choice-scroll.ts`、`app/(next)/next/blueprint.css`；新增 `tests/tabs-overflow.test.mjs`；本文、`docs/blueprint-theme.md` 与 `docs/blueprint/evidence/v7/`。[实际运行时 / 测试 diff](evidence/v7/scope.diff)。

### 根因、修复与边界

- 正式路由 `/next/components/tabs` 的第一组四个 coss Tab 使用 w-fit / shrink-0 / whitespace-nowrap，示例区没有滚动边界。Supervisor 修复前记录 light scrollWidth=339、末项“已锁定”right=337，历史 blueprint=342；这是标签行溢出，非面板内容。代码行号、[前](evidence/v7/tabs-before.html) / [后](evidence/v7/tabs-after.html) SSR 与完整定位见 [inspection.md](evidence/v7/inspection.md)。
- 两组 Tabs 只增加局部滚动包装，面板留在外侧，核心视觉与尺寸保留。内部 hook 在焦点、选中值、容器 / 标签尺寸变化时调整局部 scrollLeft，不移动页面或主动聚焦；方向键只聚焦、Enter / Space 激活仍由 coss / Base UI 控制。
- 两个 Agent 示例已有局部滚动包装，SSR 确认后保留原文件。bp-seg-tabs 原为换行，水平版本改为单行滚动；纵向布局及 radio 方向键选择契约保留。仅修改显式 bp-* 布局，不新增普通控件视觉覆盖、目录条目、Token、字号或依赖。
- 离线检索 coss 缓存 registry 的 tabs / p-tabs-1…15 描述，读取 p-tabs-1 源码；无已确认的现成滚动组合，沿用本地 Agent 示例外层滚动方式。未联网刷新，没有复制第三方代码；[检索摘要](evidence/v7/reuse.json)。
- Toast：源码和构建 CSS 为 fixed / right inset / 合法 calc 宽度，未确认它独立计入页面溢出；SSR 无法测量客户端 Portal。没有据假设覆盖 Toast，待 Supervisor 做临时隐藏前后 scrollWidth 对比。
- 偏差：无设计 patch，按任务手动适配；只读离线检索代替联网，浏览器按前置约定交 Supervisor。没有新增待 PO 决定项。Builder 自测不是 Review 或视觉验收结论。

### 本轮验证

按 §6.1 顺序，构建后全量测试；README 对应运行目录变量位于 `.sites-runtime/`，保留进程 HOME。以下为最终代码的本轮结果，[命令 / 退出码](evidence/v7/checks.json)。

| 命令 | 实际结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 完整字体与许可通过，退出 0；[日志](evidence/v7/math-font.log) |
| `node scripts/check-typography.mjs` | 304 个 owned TSX 通过，退出 0；[日志](evidence/v7/typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 构建成功，退出 0；保留 chunk 大小与静态路由分类提示；[日志](evidence/v7/build.log) |
| `node --test tests/*.test.mjs` | 2023/2023，fail 0，skipped 0，退出 0；[日志](evidence/v7/full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 条诊断，退出 0；[日志](evidence/v7/tsc.log) |
| `node --test tests/tabs-overflow.test.mjs` | 7/7，fail 0，skipped 0，退出 0；[日志](evidence/v7/targeted-tests.log) |

新增测试覆盖真实组件 SSR、两个 Agent 示例现有结构、Blueprint 横纵语义、局部滚动计算、长标签开头及宽容器无操作，并用构建 worker.fetch 验证正式路由 HTTP 200；不是源码正则或 SSR 替代视觉验收。初始测试 harness 的 next/link ESM 后缀、glimm CJS 导入问题已按既有测试的 ESM alias 方式修正；无最终失败需要干净基线复现。未修改既有断言。

### Supervisor 浏览器验收（2026-10-14，5173，浏览器面板 Viewport 模拟 320×800）

- 通过：`/next/components/tabs` 在 blueprint / light / paper / dark 下 `documentElement.scrollWidth` 均为 320（修复前 light 为 339）；临时隐藏 `toast-viewport` 前后都是 320，Toast 不造成横向溢出。
- 通过（blueprint）：焦点在「内容」时按两次 → 移到「历史记录」，局部滚动容器 scrollLeft = 22.5，该项完整可见；按 Enter 后 aria-selected=true。
- 通过：`/next/foundations/blueprint`（blueprint、light）和 `/next/components/agent-components`（blueprint、dark）在 320 下 scrollWidth 都是 320，其余越界元素都在局部滚动容器内。
- 未验：1280 像素级回归（≥640px 默认视觉只有 SSR 对比）、触摸横滚、Home / End、禁用项「已锁定」、嵌套预览、真机与读屏器。没有截图存档。

### 交给 Supervisor 的浏览器验收清单

使用 Supervisor 已运行服务（以下以 `http://localhost:5173` 为例），四主题 light / paper / dark / blueprint × 320×800 / 1280×960；宽屏另对照 ≥640px 原视觉。

1. `/next/components/tabs`：320px 时 `document.documentElement.scrollWidth` 应为 **320**，1280px 时应为 1280。两组保持单行，只有标签行可横滚，面板自然换行。横滚看“已锁定”，禁用状态不变；无第二行控件。页面宽度是待验期望，不是 Builder 实测。
2. Tab 进入“内容”，ArrowRight 到“材料信息”再到“历史记录”：焦点标签自动进入可见区，未按 Enter / Space 前不切面板；Enter 显示“当前为初始示例版本，尚无修订记录。”；Space 切换同样生效。检查禁用“已锁定”不能激活、左右回移及 Home / End、焦点环、下划线指示器、触摸横滚。
3. `/next/foundations/blueprint#actions`：水平“答卷状态”单行局部滚动，方向键按 radio 原语义选择，跳过禁用项；End 到“异常”，说明显示“当前：4 份未提交或扫描失败”。纵向“页面主题”布局不变。选末项后 1280→320 收窄应滚动可见；加入长中文 / 公式标签，单项过长时可滚动阅读且字号不缩小。
4. `/next/components/agent-components#context-summary-review`：展开“从任务依据到执行结果”的全部示例，已有七项标签局部滚动；`/next/components/agent-components/artifact-preview`：呈现与说明标签键盘移动可见、hash 切换回归。全局 blueprint 下预览区分别设置 light / paper / dark、320px，检查嵌套主题及滚动边界；不把已有预览固定宽度的局部滚动记作页面溢出。
5. Toast：记录内外视口宽度、scrollX、toast-viewport rect 与 computed inset / right / width；临时隐藏后还原 Toast，并比较页面 scrollWidth，应都为 320。若隐藏前超宽、隐藏后恢复，记录独立缺陷交 Prism 层修复。附实际主题、尺寸、路由、日期与基线截图。

### 未验证范围

浏览器验收：按分工由 Supervisor 执行。四主题真实像素、焦点 / 键盘 / 触摸交互、Toast 实际滚动贡献、移动设备、读屏器及全站视觉未验；本轮没有截图。核心三主题 ≥640px 默认视觉保持的判断目前基于 diff / SSR，不能记为浏览器通过。


### v6-R1 · Supervisor 返工与复验 · 2026-10-14（原当前，原样保留）

- 轮次：v6-R1 · Supervisor REWORK 返工；Builder 实现与自测完成；Supervisor 修复后复验结论 `PASS WITH NOTES`（见下方「修复后复验」）。
- 日期 / 基线：2026-10-14，`feat/learning-charts` · `7c2783346081ed23fd70ebb9414f0e879745a60c` + 原 v5 文档与未提交 v6。按 `task-BPv6-R1.md` 执行；原 PO “仅蓝图主题（推荐）”授权范围保持不变。
- 工作树：沿用现有分支及未提交改动，不提交、推送、创建 PR、发布或启动服务。AGENTS、v4/v5 归档与截图、冻结 coss 字节未变；P63 已提交内容未改动。本轮增量见 [scope.diff](evidence/v6-r1/scope.diff)，保护检查见 [integrity.json](evidence/v6-r1/integrity.json)。
- 范围：`components/prism-next/charts/echart.tsx`、`advanced-charts.tsx`、`components/prism-next/demos/polar-charts.tsx`、`lib/prism-next/chart-item-tooltip.ts`、`chart-description.ts`、`heatmap-labels.ts`、`tsconfig.json`、`tests/heatmap-tooltip.test.mjs`、`tests/heatmap-narrow.test.mjs`，以及本文与 `docs/blueprint/evidence/v6-r1/`。
- 本轮没有继续修改 v6 的 P57/P62 测试适配；没有新增组件、依赖、视觉令牌、字号或 CSS。HeatmapChart 公开属性不变，内部 EChart 新增默认关闭的 `preserveItemTooltip` 开关。

### 修复与影响

- 失败 1：热力图点按时先记录 seriesIndex / 稳定 item ID，再发出原选择意图。setOption 完成后，若该 ID 仍在该系列中，重新定位 dataIndex 并 dispatchAction showTip；支持宿主重渲染、selectedId 边框更新及数据重排，不缓存旧数值。项目删除则不恢复；hideTip、移开、悬停另一项、点空白或图外均清除记录，图外/空白点按主动 hideTip。无新增计时器，不重挂载实例。
- 恢复仅由 HeatmapChart 显式开启，四主题一致。其余 EChart 调用方仍执行原 setOption，不恢复提示框、不派发额外显示/隐藏 action；新增监听对未开启的调用方不改变交互。图表实例和 document 监听随卸载清理。
- 失败 2：确认 EChart 原规则为 label 后无条件追加“。完整数值及缺测说明见下方数据表。”。现统一规范 label 尾部标点；热力图窄屏只添加“窄屏下格内数值已隐藏，点按格子查看数值”，数据表指引由包装层追加一次。其余 EChart 的说明内容不变，仅去除重复尾部标点；label 改变也会更新说明。
- 失败 3：compact 示例改成“核心主题保留格内数值；蓝图主题在窄容器下隐藏格内数值，可点按查看。零值与缺测均保留在提示框和数据表中。”，沿用 DemoSection 的语义字号。
- v5 归档修正：`tsconfig.json` 的 exclude 仅增加 `docs/**/evidence/**`，避免历史夹具被作为运行时代码编译；不改 `docs/blueprint/evidence/v4/fixture.tsx`，不关闭任何运行时代码类型检查。
- 离线复用：沿用现有 HeatmapChart / EChart 与 ECharts dispatchAction；复核 `docs/polar-charts.md`、`docs/learning-chart-properties.md` 的 coss / particles p-table-3/4 记录，基础控件组合不处理引擎更新生命周期。未新增第三方代码、未联网刷新 registry；通用图表修复不涉及 Beautiful UI Agent 组件。
- 偏差：直接按 Review 手动修复，没有设计 diff 可应用。未采用仅 memo option 的方案，因为实际 selectedId 改变仍须重绘。主题取值与嵌套 DOM 预览的 Context 限制沿用 v6，未扩大范围修复。

### 本轮验证

按 §6.1 顺序执行，先构建后全量测试；使用 `.sites-runtime/` 环境目录并保留进程 HOME。实际命令和退出码见 [checks.json](evidence/v6-r1/checks.json)。

| 命令 | 实际结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 字体与许可通过，退出 0；[日志](evidence/v6-r1/math-font.log) |
| `node scripts/check-typography.mjs` | 303 个 owned TSX 通过，退出 0；[日志](evidence/v6-r1/typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 构建成功，退出 0；保留 chunk 大小、路由静态分类提示；[日志](evidence/v6-r1/build.log) |
| `node --test tests/*.test.mjs` | 1992/1992，fail 0，skipped 0，退出 0；[日志](evidence/v6-r1/full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 条诊断，退出 0；[日志](evidence/v6-r1/tsc.log) |

新增 12 项行为测试，用真实 EChart 组件与 effects、受控 hooks / 引擎事件验证恢复调用、重复点按、四主题、零值/缺测、数据重排/删除、选中样式更新、清除后不复活、默认关闭路径、卸载清理和描述拼接；补充既有 Heatmap SSR 接线断言。定向 `node --test tests/heatmap-tooltip.test.mjs tests/heatmap-narrow.test.mjs` 34/34；全量已包含这些测试。受控事件测试不等于真实浏览器点按证据。

### Supervisor 浏览器验收

以下原样转录 Supervisor 在修复前的结果（2026-10-14，5173，`/next/components/evidence-matrix`），不是本轮修复后的结果：

- 通过：蓝图 320 下两张热力图都是 hidden，格内无数字；dark / paper 320 下都是 shown；蓝图 1280 下宽 552px 的矩阵 shown、300px 的 compact 矩阵 hidden；容器宽度 380→450→380 时 hidden→shown→hidden，ECharts 实例未变，没有重新挂载；悬停时提示框显示「运算求解 · 基础」。
- **失败 1（阻塞）**：蓝图 320 下点按 compact 矩阵的格子，选择意图正常（status 显示「请求查看：row-0-column-0；等待调用方处理。」），但提示框不出现，或出现后立即消失；点同一格也一样。推测：onSelect → 宿主重渲染 → HeatmapChart 生成新 option → EChart setOption 时隐藏了提示框。触屏设备只能点按，因此不满足「点按格子能显示提示框」。
- **失败 2**：窄屏读屏描述出现双句号：「……点按格子或查看下方数据表。。完整数值及缺测说明见下方数据表。」原因是 EChart 包装层会在描述后追加句子。修正后不能出现重复标点，也不能重复「数据表」的指引；请先确认 EChart 追加的具体规则。
- **失败 3**：`components/prism-next/demos/polar-charts.tsx` 的 compact 演示文案仍写「保留格内数值」，与蓝图窄容器下的行为不符。改成按主题如实描述的中性文案，例如核心主题保留、蓝图窄容器隐藏并可点按查看，用语义字号，不新增组件。


本轮已实现上述三项修复。

#### 修复后复验（Supervisor，2026-10-14，同一路由，浏览器面板 Viewport 模拟 320×800）

- 通过：蓝图主题 compact 矩阵窄屏说明为「能力与题目层级。窄屏下格内数值已隐藏，点按格子查看数值。完整数值及缺测说明见下方数据表。」，没有双句号。
- 通过：蓝图主题点按第一格后约 1.2 秒，提示框仍显示「运算求解 · 基础」「0」，status 为「请求查看：row-0-column-0；等待调用方处理。」；点按第二行第三列，显示「推理论证 · 综合」「缺测」；点图外空白处后，提示框消失。
- 通过：dark 主题 320 下 compact 矩阵为 shown；点按第一格后，提示框保持显示「运算求解 · 基础」。compact 文案已改为按主题说明。
- 未复验：light / paper 下的点按；1280 下的点按；其他 EChart 图表的悬停回归（只有测试覆盖）；数据重排或删除；键盘操作数据表；长中文与公式。本轮没有截图存档，`docs/blueprint/screens/v6/` 待补。
- Supervisor 结论：`PASS WITH NOTES`。

### 交给 Supervisor 的浏览器验收清单

- URL：`http://localhost:5173/next/components/evidence-matrix` 及 `#compact-heatmap`；用已运行服务。四主题 light / paper / dark / blueprint × 320×800、1280×960 均检查悬停和点按；触屏模拟中不要以悬停代替点按。
- compact 第一格：点按后保持“运算求解 · 基础”与“0”；status 为“请求查看：row-0-column-0；等待调用方处理。”；重复点同一格仍显示。点第二行第三列显示“推理论证 · 综合”与“缺测”。点击别格更新对应行列和值；点图外/空白或移开后隐藏，之后宿主更新不能恢复已取消的提示。
- 回归普通热力图及 compact 3×3 / 5×3，补验调用方同步更新 selectedId、数据重排/删除；仍有效 ID 跟随当前数值，失效 ID 不恢复。其他 EChart 图表保留原悬停、选中和更新行为。
- 容器 380→450→380：blueprint hidden→shown→hidden，核心主题始终 shown，实例不变。1280 下普通容器 552px 为 shown、compact 300px 在 blueprint 为 hidden；320 下两张 blueprint 均 hidden，核心三主题均 shown。
- 窄屏说明应为“能力与题目层级。窄屏下格内数值已隐藏，点按格子查看数值。完整数值及缺测说明见下方数据表。”，无双句号、数据表指引仅一次；宽容器与核心主题无窄屏说明。compact 文案按主题如实说明。
- 覆盖三核心主题回归、长中文/公式、键盘展开数据表与选择；嵌套 DOM 主题仍按现有 provider 取值，不能记作新增局部图表主题隔离。

### 未验证范围

浏览器验收：按分工由 Supervisor 执行。真实移动设备、读屏器、实体打印和全组件视觉未验；本轮未生成截图。Builder 自测不等同于 Supervisor Review 或 PO 批准，无新增产品决定待 PO。


### v6 · 320px 热力图方案 B · 2026-10-14（原当前，原样保留）

- 轮次：v6 · 320px 热力图方案 B，仅蓝图主题；Builder 实现与自测完成，待 Supervisor 独立 Review。
- 批准依据：Product Owner 2026-10-14 在 Claude Code 会话中原话：“仅蓝图主题（推荐）”；Supervisor `task-BPv6.md` 记录方案 B：容器宽度小于 400px 隐藏数字，核心三主题仍显示；四主题均显式使用 `triggerOn:"mousemove|click"`。
- 日期 / 基线：2026-10-14，`feat/learning-charts` · `7c2783346081ed23fd70ebb9414f0e879745a60c`。未切分支、提交、推送、合并或发布；未联网刷新远端。
- 工作树：开始时已有 `AGENTS.md` 修改与未跟踪 `docs/blueprint/`，P63 已在 HEAD，无额外未提交运行时改动。原 v5 文件除本文更新外保持不动，AGENTS 散列与开工快照一致；本轮增量见 [scope.diff](evidence/v6/scope.diff)。
- 运行时范围：`lib/prism-next/heatmap-labels.ts`、`components/prism-next/charts/advanced-charts.tsx`。无 coss、CSS、Token、局部字号、依赖、目录或公开组件 API 改动。
- 测试范围：新增 `tests/heatmap-narrow.test.mjs`；另精确适配 `tests/p57-charts.test.mjs` / `tests/p62-charts.test.mjs` 的历史快照期望，只加入 shown 标记与提示框触发值，原快照文件及其余比较不变。
- 文档证据范围：本文及 `docs/blueprint/evidence/v6/`；旧“当前”的日期、基线、验证段移至历史。按任务要求删除两条过时的未批准/待决定表述，完整输入原文另存 [status-before.txt](evidence/v6/status-before.txt)。

### 实现、取舍与偏差

- `git apply --check` 与 `git apply` 均退出 0；采用设计补丁后按任务收窄为 blueprint，未用 `--3way`。主题取现有 `useTheme().theme`，与 `chartShapeColors` / `chartSequentialDefault` 一致。
- 只有 blueprint + 可见数据披露 + 已知宽度 <400px 隐藏格内标签；`hidden` 披露和未知宽度保留标签。ResizeObserver 直接使用 contentRect.width，避免 399.5px 被舍入到 400px；observer 缺失时沿用未知宽度。
- 宽度只更新 state / option 与可访问描述，无 width key 或条件 EChart 替换；EChart 原有空依赖初始化 effect 保持不动。外层标记 shown/hidden，只有隐藏时追加“窄屏下格内数值已隐藏，点按格子或查看下方数据表。”。
- 核心主题行为变化：热力图显式设为悬停/点按触发；本地 ECharts 6.1 默认其实还含 mousewheel，本轮显式排除滚轮。其 TooltipView 使用字符串包含判断，支持该组合，但类型联合遗漏这一组合，因此仅对 triggerOn 做局部类型兼容，不修改引擎或依赖。
- 嵌套预览限制：仅设置 `[data-agent-preview][data-prism-theme]` 不会改变 next-themes Context。全局 blueprint 内的 light/paper/dark DOM 预览仍按 blueprint 判断标签，且图表配色也取全局 blueprint；反向同理。未新增 DOM 探测或修复既有主题机制，真实浏览器复验交 Supervisor。
- 复用依据（离线）：读取固定 coss Table、本地 particles `table-particle.tsx`（p-table-3/4）及 `docs/polar-charts.md` / `docs/learning-chart-properties.md` 的历史记录。表格组合承接数值披露，不提供热力图标注，沿用 HeatmapChart / EChart / ChartDataDisclosure；通用图表不适用 Beautiful UI Agent 组件。未刷新远端 registry、未复制第三方代码。

### 本轮验证（上述 HEAD + 原 v5 + v6 工作树）

运行环境沿用 README 本地验证目录变量（`.sites-runtime/` 下 XDG / TMP / Wrangler / npm），保持进程原 HOME；未启动服务。实际命令、退出码见 [checks.json](evidence/v6/checks.json)。

| 命令 / 检查 | 实际结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 完整字体与许可校验通过，退出 0；[日志](evidence/v6/math-font.log) |
| `node scripts/check-typography.mjs` | 303 个 owned TSX 文件通过，退出 0；[日志](evidence/v6/typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 构建成功，退出 0；有 chunk 大小与路由静态分类提示；[日志](evidence/v6/build.log) |
| `node --test tests/*.test.mjs`（构建后） | 1980/1980，fail 0，skipped 0，退出 0；[日志](evidence/v6/full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 退出 2，4 条既有归档夹具错误，本轮运行时代码 0 条；[日志](evidence/v6/tsc.log) |
| `node --test tests/heatmap-narrow.test.mjs tests/p57-charts.test.mjs tests/p62-charts.test.mjs tests/blueprint-*.test.mjs` | 121/121，fail 0，skipped 0；含新增 22 项纯函数 / SSR / 少量接线检查；[日志](evidence/v6/targeted-tests.log) |
| 干净基线核对 | `git archive HEAD` 导出到临时验证快照（无 .git、无新分支/工作树），共享既有 node_modules；`tsc --noEmit --incremental false` 干净 HEAD 退出 0；加入原 v5 文档后退出 2，同样 4 条诊断且与当前日志逐字节一致；[记录](evidence/v6/baseline-checks.json)、[干净 HEAD](evidence/v6/tsc-head-clean.log)、[HEAD 加 v5](evidence/v6/tsc-head-plus-v5.log) |
| 首轮与修正 | 首轮 1974/1980，6 项 P62 旧快照不符；tsc 5 条（本轮 triggerOn 类型 1 + 既有夹具 4），已修正本轮原因。初始日志保留为 `initial-*`，不记作当前结果 |
| 浏览器证据 | 待 Supervisor 验收 |

### 交给 Supervisor 的浏览器验收清单

- URL：`http://localhost:5173/next/components/evidence-matrix`（以 Supervisor 已运行服务端口为准）。四主题分别覆盖 1280×960 / 320×800：普通矩阵在实际容器 ≥400px 时均有数字，320px 下仅 blueprint 隐藏；核心三主题数字、颜色、布局保持现状。
- 同一路由 `#compact-heatmap`：来源 `demos/polar-charts.tsx`，300px compact 矩阵在 blueprint 无数字，在核心主题有数字；1280 / 320 均检查，切换 3×3 / 5×3 后仍正确，零值和缺测在数据表与提示框保留。
- 四主题悬停与点按单元格：提示框显示完整行/列/值或“缺测”，点击选择仍发既有 ID 意图；展开“查看数据与选择项目”，键盘进入表格操作并核对长中文/公式标签可读性。
- 容器 420→380→420 拖动（不是只看视口数字）：blueprint 标签 shown→hidden→shown；核心主题一直 shown。检查 ECharts 实例身份不变、无 dispose/init，数据/选择不丢；宽度改变不能当作已完成浏览器验收。
- blueprint 窄容器的 role=img / 可访问描述才出现窄屏提示；宽容器、核心主题、`dataDisclosure="hidden"` 均不出现。后两种调用模式及未知宽度需要 Supervisor 临时夹具。
- 嵌套 DOM 主题夹具复验：外层全局 blueprint、内层三核心主题，在 320px 图表仍取 provider 的 blueprint 标签策略及配色；记录此既有限制，勿将 CSS 隔离误记为图表 Context 隔离。

### 未验范围与待办

- 浏览器验收：按分工由 Supervisor 执行。真实移动设备、读屏器、黑白打印、全组件视觉未验；不生成或预填 v6 截图。
- 原 v5 `docs/blueprint/evidence/v4/fixture.tsx` 被 tsconfig 的 `**/*.tsx` 纳入，产生 4 条类型错误；不改历史夹具或放宽全局检查，交 Supervisor 单独处理。
- compact 演示现有描述“保留格内数值”没有主题限定，本轮未扩大范围修改演示文案；请 Supervisor 记录后续文案修正。
- Builder 自测不等同于 Supervisor Review / PO 批准；本轮不预填 Review 结论，无新增产品选择待 PO 决定。


### v5 · 交接规则与证据归档 · 2026-10-14（原当前）

> 原验证与基线保留；两条旧待批准表述已按 v6 任务移除，完整原文见上方快照。

- 轮次：v5 交接规则与证据归档，已由 Claude Code（Supervisor）应用到本地工作树。
- 批准依据：Product Owner 2026-10-14 原话——经 Codex 转交：“批准 v5 修订版，由 Claude Code 应用，完成后验证并更新 STATUS.md。”；Product Owner 随后在 Claude Code 会话中直接确认：“批准应用 Blueprint v5 修订版到 intelligence-prism-ui”。批准对象是审核修订包 `Blueprint-v5-reviewed-20261014.zip`（SHA-256 `72016e6b…83044`）；修订包与原始草案的完整散列分别记于 [docs/blueprint/evidence/v5/codex-verification-20261014.json](evidence/v5/codex-verification-20261014.json)。原始草案的散列不作为修订包标识。
- 应用日期：2026-10-14。
- 实际分支 / HEAD：`feat/learning-charts` · `6ddecd27eb76f7e3694855df4ef42f904d03ead6`（未切换分支）。改动为该分支上的未提交改动：`AGENTS.md`（§5 两处说明、新增 §10）与新增 `docs/blueprint/`；与同分支的图表提交（P58–P62）无文件交集。本轮未提交、未推送、未合并、未发布。
- 应用前基线：`AGENTS.md` SHA-256 `0a12c47b…ace86`，与 `review-baseline.json` 一致；应用后 `edff5266…5f7eb`，与包内 `AGENTS.proposed.md` 逐字节相同。§3 的 2026-10-13 GPT Site 实验线特例保持不变；`.sites-runtime/` 原历史证据保留未动。
- Review 与复核：批准补丁由 Claude Code（Supervisor）应用并核对；Codex 随后独立核对规则、改动范围、54 个 coss 文件字节、截图散列、链接及本轮测试日志，结果均符合本次文档交接范围。详见 [复核记录](evidence/v5/codex-verification-20261014.json)。Codex 本次只补充此状态与复核记录，未修改生效规则或运行时。

### 本轮验证（2026-10-14，上述 HEAD + 本轮未提交改动）

| 检查 | 结果 |
| --- | --- |
| `git apply --check` / `git apply` | 均退出 0，无冲突，未使用 `--3way` |
| 改动范围 | `git status` 仅 `AGENTS.md` 与 `docs/blueprint/`；`components/coss/**` 与 HEAD 相同；无运行时代码、样式、依赖、测试或组件目录改动 |
| `docs/blueprint/` 与修订包 | `diff -r` 完全一致（本行所在 STATUS、新增测试日志与 Codex 复核记录除外） |
| 18 张历史截图 | 文件头均为 JPEG（`FFD8FF`）；与 `screens/v4/manifest.json` 记录的 SHA-256 18/18 一致；与 `.sites-runtime/` 原文件 18/18 字节相同 |
| 相对链接 | `AGENTS.md` 与 `docs/blueprint/**/*.md` 的仓库相对链接全部可解析 |
| `node --test tests/blueprint-theme.test.mjs tests/blueprint-components.test.mjs tests/blueprint-charts.test.mjs` | 18/18 通过，fail 0，退出码 0。日志：[evidence/v5/apply-tests-20261014.log](evidence/v5/apply-tests-20261014.log) |
| 全量测试、构建、类型、字号检查 | 本轮未运行（纯规则 / 文档归档，按 §10.2 不沿用旧结果） |
| 浏览器、打印、读屏器 | 本轮未运行；`screens/v4/` 是 2026-10-13 历史截图，不是当前视图 |

### 继续保留的限制与待决定

- 实体黑白打印、真实移动设备、读屏器与全组件视觉验收未做。
- 目录数量断言中的重复 105 常量待日后以独立有效的目录完整性断言收敛（§10.2），本轮未改测试。


### v5 · 修订候选技术核对 · 2026-10-14（应用前）

- 轮次：v5 交接规则技术核对，待 Product Owner 确认后由 Claude Code 应用。
- 核对日期：2026-10-14。
- 观察基线：`feat/learning-charts` · `6ddecd27eb76f7e3694855df4ef42f904d03ead6`；该快照的工作树干净；审核期间并行图表工作已形成 P62 提交。本轮未 fetch，未判定远端同步状态。
- 规则授权：待 Product Owner 明确确认；不预填授权日期。
- 应用状态：候选补丁已整理，尚未应用到生效的 `AGENTS.md`。应用时更新此行，并记录批准依据、应用提交及独立 Review 结果。
- 范围：§5 两处说明、§10、本文与证据归档；无运行时代码、依赖或组件目录改动。

#### 当时验证

| 检查 | 结果与范围 |
| --- | --- |
| `node --test tests/blueprint-theme.test.mjs tests/blueprint-components.test.mjs tests/blueprint-charts.test.mjs` | 18/18 通过，退出码 0；在 `2abc127` 与当时未提交图表改动的工作树上执行；之后观察到 P62 提交，不代表新 HEAD 全量或候选规则已验收 |
| v4 旧目录失败核对 | 5 处断言当前源码已为 105；不再将旧的 `105 !== 103` 写成当前失败；未据此推定全量通过 |
| 当前全量、构建、类型与字号检查 | 本次规则审核未重跑；历史结果见下方 |
| 当前浏览器与打印检查 | 本次未重跑；迁移的图片是 2026-10-13 证据，不是当前视图 |

本轮测试摘要：[docs/blueprint/evidence/v5/review-checks.json](evidence/v5/review-checks.json)。

#### 当时偏差、限制与待办

- 原包的 `feat/blueprint-theme · 未提交` 不符合当前基线。v4 相关文件已在 `a86d6fa` 中进入提交历史；本次审核期间另有图表工作形成 P62 提交，不归入本补丁。
- v4 的 1761/1766 属于 2026-10-13 并行改动期间的历史结果；保留记录，不覆盖成当前通过或失败。
- `bp-*` 显式组件的跨主题中性回退，与蓝图对既有组件的隔离覆盖分别约束；核心三主题的已有令牌值与默认行为继续保持。
- 目录数量断言仍有重复的 105 常量；未来以独立有效的目录完整性断言收敛，不在本轮修改测试或降低契约要求。
- 320px 默认热力图文字拥挤仍是待复验限制；本轮没有决定隐藏格内数字，也未改运行时。

#### 当时待 Product Owner 决定

- 是否批准本候选 §5 / §10 的有限例外与交接约定；由 Claude Code 应用并记录批准依据。
- 320px 热力图的交互与布局方案尚未选定；`<400px 隐藏格内数字` 仅为原包提案，不列为已批准实施项。


### v4 · 图表配色 · 2026-10-13

历史来源：[docs/blueprint-theme.md](../blueprint-theme.md) 的 v4 接入记录及此次复制的原始日志；不是当前提交的重新验收。v4 文件后来已进入提交 `a86d6fa`，不能再概括为“未提交”。

**v4 范围**：`lib/prism-next/chart-palette.ts`、`components/prism-next/charts/chart-theme.ts`、`components/prism-next/charts/echart.tsx`、`components/prism-next/charts/advanced-charts.tsx`、`lib/prism-next/chart-options.ts`、`tests/blueprint-charts.test.mjs`，以及手动适配的 `lib/prism-next/config.ts`、`app/(next)/next/theme.css`、`app/(next)/next/blueprint.css`。范围 diff：[docs/blueprint/evidence/v4/v4-scope.diff](evidence/v4/v4-scope.diff)。

| 当时检查 | 历史结果 |
| --- | --- |
| 首次相关测试 / 全量 | 29/29、1743/1743 |
| 收尾新增图表测试 | 6/6 |
| 混合工作树最后全量 | 1761/1766；目录扩展到 105 后，5 处仍断言 103 |
| 数学字体、字号、构建、TypeScript | 当时记录为通过；不作为当前复验结论 |

原全量日志：[初次 1743/1743](evidence/v4/tests.log)、[混合工作树 1761/1766](evidence/v4/final-tests.log)。

**已记录的浏览器观察**：四主题 1280px 的六系列柱形/面积夹具和正式趋势页；蓝图箱线选中态、热力图、散点、比较及提示框；320px 局部抽查。箱线验证的是墨线、填充和蓝色选中态，不能记成已验多系列图案。柱形/面积有图案；Recharts 趋势/比较、ECharts 无填充折线没有对应填充图案；分组散点使用调用方点形。

**继续保留的限制**：320px 默认热力图文字拥挤；实体黑白打印、真实移动设备、读屏器及全组件视觉验收未做。v4 之外的既有 Tabs 窄屏问题与并行 compact 热力图范围，仍以历史文档为准。

**实现偏差**：ECharts 6.1 富文本提示框忽略配置的 1.5px 边框，v4 已加隔离的 SVG 描边适配；选中箱线和提示框均留有历史截图。

截图索引：[docs/blueprint/screens/v4/README.md](screens/v4/README.md)；18 张图片字节保持不变，扩展名由误标 `.png` 修为实际的 `.jpg`。原临时文件保留，未移动或删除。夹具源文件与浏览器记录一并归档到 `docs/blueprint/evidence/v4/`；夹具入口已移除，图片不能当作当前线上路由的截图。
