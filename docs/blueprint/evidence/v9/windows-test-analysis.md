# Windows 全量测试失败分类与基线复现

2026-10-15，Node.js v24.14.0 / Windows。当前 Git HEAD 为 `1f575ea142c7f3b5fa0ae8a41f5c63c310067251`。本记录区分日志分类、实际基线复现与本轮定向测试；没有修复历史测试，也没有把 261 项报告失败逐项验证为同一个原因。

## 当前结果

- 主线程构建后的全量日志报告 **1947 tests / 1686 pass / 261 fail / 0 skipped**。原始副本为 [full-tests-initial.log](full-tests-initial.log)，摘要、SHA-256 与失败文件分布为 [full-tests-summary.json](full-tests-summary.json)。日志中可提取 34 个失败测试文件、260 条显式 `test at` 定位；该数量含文件级失败，与 test runner 的 261 汇总口径不同，不将其伪装成逐项诊断结果。
- 当前源码的 Blueprint 定向检查 **37/37 通过，fail 0，skipped 0，退出 0**。覆盖 theme、components、charts、guide、完整 print-a11y 五个测试文件；后者包含三个既有构建路由响应、四主题 React SSR 与焦点/打印规则检查。[完整日志](targeted-blueprint-tests.log)、[命令与退出码](targeted-blueprint-checks.json)。本结果不代替真实浏览器、读屏器或实体打印验收。
- 构建与 TypeScript 的结果由主线程单独记录；此子任务没有重跑构建或全量测试。

## 基线如何隔离

使用 Git HEAD 导出到 `.sites-runtime/baseline-head-1f575ea-windows/`，没有建立新工作树、分支或 `.git`，没有修改原工作源码、测试或冻结组件。导出命令为：

```powershell
git -c core.autocrlf=false archive --format=zip --output='.sites-runtime/baseline-head-1f575ea-windows-lf.zip' HEAD
Expand-Archive -LiteralPath '.sites-runtime/baseline-head-1f575ea-windows-lf.zip' -DestinationPath '.sites-runtime/baseline-head-1f575ea-windows' -Force
New-Item -ItemType Junction -Path 'D:\WorkFile\HermesWork\intelligence-prism-ui\.sites-runtime\baseline-head-1f575ea-windows\node_modules' -Target 'D:\WorkFile\HermesWork\intelligence-prism-ui\node_modules'
```

依赖复用主线程按 lockfile 安装的当前 `node_modules`，不会将当前源码带入基线。第一次未覆盖 Git `core.autocrlf` 的 archive 会导出 CRLF；发现后重新导出 LF 基线。下表与链接日志均来自最终 LF 基线。导出退出 0，ZIP SHA-256 为 `0ca899b32f53f47a07730d056bb59fd2fec5be562b8753f0c0a5fd120c2cf7e2`。

只读探针对 Stepper 测试、review-tools 测试、Stepper TSX/CSS 和 ReviewTools TSX 共五个代表文件逐字节与 `git show HEAD:<path>` 比较，全部相同。完整路径、散列、检查脚本见 [windows-readonly-probe.json](windows-readonly-probe.json)、[windows-readonly-probe.mjs](windows-readonly-probe.mjs)。快照和 Junction 留在 Git 忽略的临时目录，未加入交付源码。

## 实际复现命令与结果

前三条在上述隔离基线目录执行；最后两条在当前仓库执行。

| 命令 | 结果 | 证据 |
| --- | --- | --- |
| `node --test --test-name-pattern='320px reveal' tests/stepper.test.mjs` | 0/1；退出 1；`globalThis.__stepper.effect is not a function` | [baseline-stepper.log](baseline-stepper.log) |
| `node --test tests/review-tools.test.mjs` | 模块载入失败；退出 1；`ERR_MODULE_NOT_FOUND`，缺少 `next/link` 的 `.js` 扩展 | [baseline-esm.log](baseline-esm.log) |
| `node --test --test-name-pattern='compact CSS is scoped' tests/stepper-compact.test.mjs` | 1/1；退出 0；原 CSS 散列断言通过 | [baseline-stepper-css.log](baseline-stepper-css.log) |
| `node docs/blueprint/evidence/v9/windows-readonly-probe.mjs` | 退出 0；记录原生 Windows 路径及 LF/CRLF 散列，不替换生产源码 | [probe JSON](windows-readonly-probe.json) |
| `node --test tests/blueprint-theme.test.mjs tests/blueprint-components.test.mjs tests/blueprint-charts.test.mjs tests/blueprint-guide.test.mjs tests/blueprint-print-a11y.test.mjs` | 37/37；退出 0 | [targeted-blueprint-tests.log](targeted-blueprint-tests.log) |

基线机器可读命令和退出码：[baseline-windows-checks.json](baseline-windows-checks.json)。初始全量日志没有单独保存进程退出码，因此摘要保留 `null`，不由失败数量推填退出码。

## 根因分类

### 1. 路径分隔符导致测试替换器失效

Stepper 的 esbuild `onLoad` 使用 `/prism-next\/stepper\.tsx$/`；`tests/p58-chart-harness.mjs` 使用 `/\/charts\/echart\.tsx$/`。探针实际读取到 `D:\…\components\prism-next\stepper.tsx` 和 `D:\…\charts\echart.tsx`，原过滤器均不匹配；仅将探针中的路径字符串规范化为 `/` 后匹配。探针没有修改测试或生产代码。

这解释了 Stepper 的 effect 未被捕获；P61/P64 等共用图表 harness 的 `charts` 为空，随后读取 `charts[0].option` 报错。Stepper 代表失败已在精确 LF HEAD 基线复现，不能用统一 LF 解决。

其他已读到相同模式的测试包括 Agent ImageCanvas、SlideWorkspace、TemplatePicker、FacetFilter、DialogLayout。`material-intake-fix1.test.mjs` 的 `path.includes('/demos/')` 在 Windows 将演示文件误判为组件，保留原 `useState` 导入后又注入同名声明，日志因此报告重复声明。

P16 历史基线替换器同样使用 POSIX 路径过滤器；P18 用 `path.relative()` 的 Windows `\` 路径去查 Git `/` 路径集合。两者会漏掉历史源码替换，导致“executed main matches captured main snapshot”失败。此处已核对源码和失败链，没有逐个重跑其所有快照。

### 2. CRLF 造成字节散列和行尾正则差异

当前 Stepper CSS 前段原始 SHA-256 为 `52a8636e3168a102ad78fcfedd45adb27338f303e030754c7d968783dd5ee7e3`；仅在内存中将 CRLF 转 LF 后为 `a2dd8ab3eed77b950d57cc98b86a4239b130d0be6a9f892a9b746127e0dca897`，与 Git HEAD 和既有断言完全一致。LF 基线中该测试实际 1/1 通过。原工作源码没有因本次分类被改写。

`question-presentation.test.mjs` 的修订标题提取也使用行尾严格匹配，当前 CRLF 文档提取为空；这项根据源码和日志分类，未单独做基线执行。因此不能把所有失败简单归为 CRLF，也不能声称全部散列失败都已确认。

### 3. ESM 入口扩展名

日志中 ReviewTools、PaperReview、QuestionReview 与冻结快照测试缺失 `next/link` 的 `.js` 扩展。Node 输出明确建议 `next/link.js`。`review-tools.test.mjs` 已在精确 LF HEAD 基线原样复现同一错误，与 Blueprint 新增文件无关。

### 4. 虚拟 TypeScript 文件路径

`data-station.test.mjs` 构造混合分隔符的虚拟路径，并在 `host.getSourceFile` 中用 `name === path` 精确比较；TypeScript 将请求正规化为 `/` 后无法匹配，日志报 `TS6053` 虚拟文件不存在。这项已检查 harness，未另行修改或执行修复。

## 结论与限制

本轮 Blueprint 与站点文档定向检查通过；Stepper 与 ESM 两个代表性失败在本轮改动之前的精确 HEAD 基线复现，且 CRLF 散列差异有独立通过证据。已有证据支持将这些代表失败记录为环境/测试 harness 兼容问题。

没有逐项证明全部 261 个失败均与本轮无关；没有修改历史测试、降低断言或修复无关业务代码。后续若处理全量验证，应单独收敛 Windows 路径、ESM 入口和行尾约定，并在修复后重新运行完整测试；本轮保留失败事实，不宣称全量通过。
