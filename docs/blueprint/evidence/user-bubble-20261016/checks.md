# P78 · Builder 检查记录

2026-10-16。基线 P77 `eecb471`，`feat/blueprint-nav-folio`，开工干净。结论：实施和工程检查完成，等待 Supervisor 独立 Review / 浏览器验收；不是自我批准。

| 检查 | 本轮结果 |
| --- | --- |
| `node scripts/check-math-font.mjs` | 退出 0，STIX Two Math 资源与许可通过 |
| `node scripts/check-typography.mjs` | 退出 0，311 个 owned TSX |
| `node node_modules/vinext/dist/cli.js build` | 退出 0，生产构建完成 |
| 构建后 `node --test tests/*.test.mjs` | 退出 0，2216/2216，0 失败、0 跳过 |
| `node node_modules/typescript/bin/tsc --noEmit` | 退出 0，0 错误 |
| 初始定向：P78 + R1 | 18/18 |
| 文档生成物同步后：P78 + R1 + guide + conversation | 51/51，0 失败、0 跳过 |
| 回退变异 | 17/17 检出，包含两主题各自链接对比度回退 |
| 文档收尾 | guide `--check`、最终生产构建均退出 0 |
| 保护 | 54 个 coss + theme.css / 消息 TSX / 共享对话 CSS / 依赖 / AGENTS，共 60 文件哈希不变 |
| diff 与交接 | `git diff --check` 通过；P77 当前段原样移入历史；本轮证据链接存在 |

时间、命令和退出码见 [engineering.json](engineering.json)、[finalization.json](finalization.json)。完整 [全量日志](tests.log)、[定向日志](final-targeted.log)、[对比度](contrast.json)、[变异清单](mutations.json)、[保护散列](integrity.json)、[交接核对](handoff-checks.json)独立保留。

[scope.diff](scope.diff) 包含本轮手写 CSS、两处示例说明、既有/新增测试与两份文档，不包含自动生成 guide 与复制资产、日志/证据自身。全部生成文件由 `node scripts/sync-blueprint-guide.mjs` 产生，未手改。

没有工程失败或既有失败需基线复现。全量结果对应最终运行时与测试代码；随后只更新文档/证据和 guide，再完成最终构建与 51 项相关检查，不将后续检查冒充第二次全量。

浏览器验收：按分工由 Supervisor 执行，见 [清单](browser-checklist.md)。CSS 规则探针与 SSR 不是计算样式/视觉验收。Workspace 同步、真实服务、真机、读屏器与实体打印未验。旧 Blueprint 3/3 累计浏览器矩阵仍未收口，不重置周期。
