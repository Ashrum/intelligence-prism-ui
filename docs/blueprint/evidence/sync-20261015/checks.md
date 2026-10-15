# Site / GitHub / 本地同步验证

2026-10-15，Windows / Node.js 24.14.0。输入：GitHub main `1f575ea`、Site v117 `c59c0ca`、本地第一批完善 `74790e7`；共同祖先 `5ba6277`。

## 合并范围

- Site v0.4 实验四个运行文件、版本说明、MIT 许可及对应测试与 Site 输入逐文件相同。
- GitHub 第四主题、图表、核心主题、54 个冻结 coss、依赖保持各自已有实现；本地第一批完善完整保留。
- guide 路由和侧栏保留第四主题入口；生成 JSON 与下载内容依据合并后的源文档重新生成，消除两端文档差异。
- 新增 LF 约定仅覆盖规范直接文本及下载快照。使用暂存树、`core.autocrlf=true` 导出 37 个所需文件，在独立目录执行 `sync-blueprint-guide.mjs --check` 通过，来源与下载字节一致。
- 独立审查：[PASS WITH NOTES](review.md)，在本次用户授权内允许 push、PR、merge 与相同提交发布。

## 本轮实际结果

| 检查 | 结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 通过，退出 0 |
| `node scripts/check-typography.mjs` | 306 个 owned TSX 通过，退出 0 |
| `node node_modules/vinext/dist/cli.js build` | 通过，退出 0；[日志](build.log) |
| `node node_modules/typescript/bin/tsc --noEmit` | 无诊断，退出 0；[日志](tsc.log) |
| Blueprint theme/components/charts/guide/print-a11y/experiment 六份测试 | 38/38 通过，退出 0；[日志](targeted-tests.log) |
| `node --test tests/*.test.mjs` | 1948 项，1687 通过、261 失败、0 skipped，退出 1；[日志](full-tests-unsandboxed.log) |
| `node scripts/sync-blueprint-guide.mjs --check` | 通过，正文与 17 个直接资产一致 |
| `git diff --check --cached` | 通过 |

首次沙箱全量测试有额外 AgentConversation 模块加载失败：临时测试目录建立 node_modules 链接被 EPERM 阻止，计数为1922/1660/262。在允许该操作的环境复跑同一命令后为上表结果。与 v9 日志的失败描述集合对比没有新增或移除项，见 [failure-delta.json](failure-delta.json)；原 Windows 路径、CRLF、ESM 代表基线复现依据仍见 [v9 分析](../v9/windows-test-analysis.md)。没有宣称全部261项已逐一证明或修复。

## 浏览器

真实 Chrome / Playwright，本次统一源码，桌面视口模拟 320×800 与1280×960。

- `/next/experiments/blueprint`、`/next/foundations/blueprint`、`/next/foundations/blueprint/guide` 均返回200、页面scrollWidth等于视口；全局蓝图下轻量实验保留独立Paper预览、圆角原控件及v0.4结构。
- 全局主题选项包含浅色、暖纸、深色、蓝图；规范相关导航同时包含第四主题示例与轻量实验；17个直接证据下载均200。
- 页面错误事件为0；截图已目视检查桌面与窄屏的轻量实验布局。截图在 `docs/blueprint/screens/sync-20261015/`，[测量](browser-results.json)、[脚本](browser-qa.js)。
- 本次不重复已验的 v9 键盘细节；没有新增真机、读屏器、实体打印、全站像素回归证据。候选状态保留。

发布时以合入 GitHub main 的精确提交快进 Site 源仓库并重新构建；最终提交、版本与部署状态以会话终态和原生 Site 发布记录为准。
