# P74 · 检查记录

日期：2026-10-16。基线 `e750a963d53da4a3bba1cf53500616ebff4b16d2`，分支 `fix/agent-portal-container`。Builder 实施与工程自测完成，待 Supervisor 独立 Review；此文不是 Review 放行或 PO 批准。

## 工程结果

完整原始记录为 [engineering.json](engineering.json)。使用仓库本地 `.sites-runtime` 下的 XDG / npm / TMP / Wrangler 目录，`HOME` 保持不变；没有联网、安装依赖或监听服务。以下五项按序执行，测试使用对应源码生产构建的 `dist/`。

| 命令 | 实际结果 | 退出码 / 日志 |
| --- | --- | --- |
| `node scripts/check-math-font.mjs` | STIX Two Math 完整固定字体及许可通过 | 0 / [字体](math-font.log) |
| `node scripts/check-typography.mjs` | 311 个 owned TSX 通过 | 0 / [排版](typography.log) |
| `node node_modules/vinext/dist/cli.js build` | 生产构建通过 | 0 / [构建](build.log) |
| `node --test tests/*.test.mjs` | **2184 tests / 2184 pass / 0 fail / 0 skipped / 0 cancelled** | 0 / [全量](full-tests.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 个错误 | 0 / [类型](types.log) |

修改旧夹具后的定向复验为 **86/86**，命令 `node --test tests/agent-visual-batch1.test.mjs tests/facet-filter.test.mjs tests/review-p17.test.mjs tests/portal-chart-options.test.mjs tests/portal-scope.test.mjs`，退出 0，[日志](focused.log)。最终工程结果以上述全量记录为准。Status/guide 与证据回填后再同步生成物、构建、全量核对，见 [收尾记录](finalization.json)。

构建保留 vinext 对未知路由分类的提示；没有启动生产服务器。类型检查成功时日志为空，退出码见 JSON，不把空日志本身当证据。

## 新增覆盖

新增 **16 项**：`portal-scope.test.mjs` 12 项、`portal-chart-options.test.mjs` 4 项。

- 独立 W188 清单锁定 18 + 24 + 1 处 JSX 的实际 import 绑定；每个绑定对应适配器均在真实 React Context 和已安装 Base UI 的 Portal transport 下检查 scoped 目标与缺省 body。
- 显式 element / ref / null 优先级、portal 属性保留、缺省 props 对象不变、等待目标、首次 ref 挂载顺序、容器变更/卸载清理；子菜单偏移与实际父 Portal 继承。
- Providers 受控 Toast 容器和原全局 singleton；真实 Base UI Toast Provider/manager 的局部与全局队列隔离、离页丢弃和迟到事件不重放。
- 全局/局部五主题及空嵌套 scope 的 hook 结果；热力图连续色阶、箱线形状色、环形图系列色与核心三主题完整 options 等价；既有显式颜色覆盖、零值与缺测保持；真实 EChart wrapper 的局部轴线/Tooltip/decals 与连续主题更新不重建实例。
- 浏览器夹具的 SSR 确实含 AgentObjectPicker workspace Combobox 和所需通知/菜单/Dialog/图表入口；不是仅声明按钮名称。

测试中的 DOM 为 commit-only 最小实现，浮层开合/定位/焦点原语使用探针；真实 Context、coss 的容器透传、Base UI 的 append/remove 与 Toast store 被执行。它证明工程接线，**不证明真实浏览器样式、焦点、开合、定位或裁切**。图表 ECharts 引擎输出使用探针，完整 option / lifecycle 检查不代替可视化验收。

内存回退变异 **48/48 被检出**：43 个独立调用绑定回退、4 个容器/显式优先级/子菜单/Toast 回退、1 个局部主题回退；[明细](mutations.json)。没有为制造失败覆盖生产源码，也没有跳过失败测试。

## 首轮失败与修复

[首轮全量](initial-full-tests.log) 为 **2183 / 2174 通过 / 9 失败**，退出 1；其他四项通过，见 [首轮命令](initial-engineering.json)。9 项均由新增适配层改变浅层测试匹配对象而引入：AgentSourceChip 1 项按函数名寻找 PopoverPopup；FacetFilter 3 项未内联适配后的 Popup；P17 5 项仍匹配原 coss TooltipPopup。修正为导出并匹配实际适配器身份，P17 历史 baseline bundle 继续使用原 coss 类型；全部原业务/ARIA/回调断言保留。

六个既有测试文件/夹具的调整范围：`agent-visual-batch1.test.mjs`、`facet-filter-harness.mjs`、`review-p17-harness.mjs` 适配 Popup 身份；`p57-chart-harness.mjs`、`p58-chart-harness.mjs` 将 hook 放到 React render 内；`heatmap-tooltip.test.mjs` 的 controller-only 主机补无 scope 的默认 Context hooks。真实 Context 覆盖在新测试中单独完成。

准备新测试时还修正了测试主机自身：esbuild 虚拟模块补 resolveDir，Base UI 需在存在 document 时加载其客户端 layout effect；DonutSegment 没有显式 color API，颜色覆盖用例改用真实支持 `color` 的 ComboSeries。浏览器夹具需显式 `view="workspace"` 才显示搜索 Combobox，已补 SSR 防回退。以上不冒充既有产品缺陷。

## 冻结边界与 diff

[boundaries.json](boundaries.json) 逐字节比对 **54/54 coss** 及 8 个保护文件（依赖、theme / blueprint CSS、chart-palette / config / catalog、冻结规范），合计 **62/62 原文不变**。30 个迁移文件移除 import 后的 TypeScript AST **30/30 与基线一致**；实际 JSX、props、状态与回调未改。

完整运行时/测试/契约/Status/生成物 diff 见 [implementation.patch](implementation.patch)；补充证据文件在本目录，清单/hash 见 [changed-files.json](changed-files.json)。patch 包含新增源码/测试，不只是 `git diff` 的已跟踪文件。`git diff --check`、反向 `git apply --check` 和新增文档相对链接检查记录于 [收尾记录](finalization.json)。

## 未验证范围

浏览器验收：按分工由 Supervisor 执行。[具体 URL、操作与 Workspace 接线](browser-checklist.md)。本轮不宣称视觉、主题计算样式、真实焦点/Escape、窄屏定位、触控、读屏、实体打印或 Workspace 接线验收通过。没有新增浏览器截图，没有改动 `ole-school-workbench`；组件通过后仍须固定来源同步与宿主验收。
