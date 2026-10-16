# 三方同步 · 独立合并审查

- 日期：2026-10-15。
- 结论：**PASS WITH NOTES**。未发现需要返工的合并缺陷。
- 审查基线：本地 HEAD `74790e795ef03a621a6baf3bd1f6eeaa1673bac5`；Site MERGE_HEAD `c59c0caf0aa65d5c1b0e44b96d3516ddb4ee04c4`；共同祖先 `5ba6277b859190c8474fa70c667e882deb5a1da7`；GitHub `origin/main` 为 `1f575ea`，已核对其为本地 HEAD 的祖先。
- 审查对象：上述两侧的实际合并工作树及暂存结果。独立审查者未修改实现、未启动服务、未运行全量构建，只新增本记录。

## 合并完整性

1. `git ls-files -u` 为空，无未解决的索引冲突。
2. Site 轻量 Blueprint 实验目录、实验历史文档、来源 HTML 与 MIT 许可、`blueprint-experiment.test.mjs`，合并结果与 MERGE_HEAD 完全一致。v0.4 页面构成和既有交互得到保留，没有被第四主题覆盖。
3. 第四主题 `blueprint.css`、`theme.css`、主题注册、图表调色板、Blueprint 组件及样板、第四主题演示路由、guide 路由与侧栏入口，合并结果与本地 HEAD 完全一致。GitHub 主线主题及图表成果、本地第一批完善得到保留。
4. guide 路由和 shell 冲突保留本地主线入口，符合三方统一后同时提供第四主题与轻量页面实验的目标。guide renderer 只调整上线边界说明；仍将第四主题标为隔离实验候选。
5. JSON 和 public 下载文件从合并后的文档生成，不拼接或保留冲突中的旧散列。原 Site 实验历史中的 v0.2.1 后续指引随 Site 版本保留。
6. `components/coss/**`、`package.json` 和 `package-lock.json` 相对本地 HEAD 无 diff。实验使用 CSS Module，并以显式 `data-agent-preview` 和核心主题属性限定本地主题；详情弹层 Portal 容器仍位于实验主题范围内。交互只回报演示输入或显示固定快照，没有引入真实业务执行。

## LF 与生成资产

- `.gitattributes` 新增规则限于 guide 正文、当前状态、直接引用的文本证据、生成 JSON 和下载资产目录；没有全仓换行重写规则。
- 资产目录使用 `text=auto eol=lf`，文本固定 LF，栅格图片继续按二进制处理。
- 独立核对 **35 个文件**：正文、生成 JSON、直接引用资产及对应下载文件的工作树字节与暂存字节全部一致，差异数 **0**。
- 审查时暂存正文 SHA-256 与生成 JSON 中 `sourceSha256` 均为 `beaf6982456b744ed838f42dcab61bfac55928d03717ee312408e325e3e5fd02`。该值是本次审查快照；后续正文更新须重新生成，不将此值写成最终发布版本。

## 独立验证

| 检查 | 实际结果 |
| --- | --- |
| `node --test tests/blueprint-guide.test.mjs tests/blueprint-experiment.test.mjs` | 7/7，通过；fail 0、skipped 0 |
| `node scripts/sync-blueprint-guide.mjs --check` | 通过；67 个内容块、17 个直接资产 |
| `git diff --cached --check` | 通过 |
| Site 实验与 MERGE_HEAD 对比 | 完全一致 |
| 主线第四主题、图表及导航与 HEAD 对比 | 完全一致 |
| 冻结 coss 与依赖文件对比 | 无 diff |
| 工作树与暂存资产字节核对 | 35 个文件，0 个差异 |

以上检查对应本记录写入前的合并状态。未将前一轮 v9 测试、浏览器结果或发布状态冒充本轮结果。

## 执行授权与收口说明

用户已明确授权本次 Site、GitHub、本地同步，包含 main 合并与站点发布。在该授权范围内，本审查允许主线程推送当前任务分支、创建 PR、合入 GitHub main，并将同一 Git 提交同步至 Site 发布及本地 main；不需要因原先文档单独发布的范围再次索取同一授权。

执行前由主线程完成并记录本轮必需构建、测试和浏览器验证，处理新出现的回归；若有既有环境失败，应按仓库约定提供基线复现与明确限制，不写成全量通过。本文不单独证明这些尚由主线程收口的检查已经通过，也不构成对无关修改的授权。

- 后续修改正文、STATUS 或直接资产后，重新生成 guide 并执行 `--check`；提交前再次核对暂存下载与来源一致。
- 发布后核对 Site 部署对应 Git 提交及两条实验入口，避免只验证文档而遗漏主题和实验页面。
- 第四主题仍为候选；真机、读屏器、实体打印及完整视觉验收的既有限制继续保留。本次合并不代表这些范围已经验收。
- 最终构建、测试、浏览器及发布记录见同目录 `checks.md` 和 `docs/blueprint/STATUS.md`，以实际最终结果为准。
