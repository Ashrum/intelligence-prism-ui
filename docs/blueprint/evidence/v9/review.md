# Blueprint 第一批完善与站点文档 · 独立审查

- 日期：2026-10-15。
- 结论：**PASS WITH NOTES**。
- 审查方式：独立读取实际 diff、新增源码及生成链路；未修改实现，未启动服务，未运行全量构建。
- 范围：本地 Blueprint 第一批完善，以及 `output/sites-prism-blueprint-20261015` 的独立 guide 文档补丁。两者分别审查，不把本地第四主题实现视为站点已发布内容。

## 本地运行时审查

未发现需要返工的代码问题。

- 新增墨底焦点分隔层限定于 Blueprint，保留嵌套核心主题预览的根节点、后代排除；蓝色 outline 仍作为焦点指示，纸色分隔层提供对比。
- 禁用按钮使用原生 `disabled`；按钮、工具按钮和分段项的 hover/active 规则排除禁用项。静态卡片标题不再响应 hover。
- 容器响应式和布局调整作用于显式 `bp-*` 样板；未修改冻结 coss 源码、核心三主题令牌或依赖。
- 样板显式说明业务数据为固定示例；步骤位置来自固定快照，不再通过点击推进任务。复制成功只在 Clipboard API 实际成功后呈现，失败有独立反馈。
- 长中文与公式样例复用既有 Tabs、局部滚动 hook 和 QuestionMath，没有引入新的业务运行时。

## Guide 生成与链接审查

- 正文来自 `docs/blueprint-theme.md`，由脚本生成结构化 JSON，React 按文本节点渲染；不使用原始 HTML 注入或执行 Markdown 中的脚本。
- 链接解析拒绝危险协议、凭据 URL、本地绝对路径和 docs 目录越界；本地路径同时检查真实路径边界。脚本、JSON 和日志作为 `.txt` 证据提供，图片仅允许已支持的栅格格式。
- 生成数据记录正文 SHA-256，直接引用的证据进行逐字与散列校验；原始 Markdown 同时可下载。文档说明仅承诺正文与直接引用的证据，不承诺递归发布全部历史附件。
- 独立执行 `node --test tests/blueprint-guide.test.mjs`：审查时 **6/6 通过**。该结果对应当时文件状态；最终正文、STATUS 或资产更新后的生成检查由主线程收口，不沿用此结果声称最终生成物已复验。
- `git diff --check` 在审查时通过。`attachment.tsx` 虽曾出现在 Git 状态中，当时没有文本 diff，只有 LF/CRLF 提示；不属于本轮功能改动。

## Site 文档补丁审查

- 审查时受跟踪 diff 仅为 `components/prism-next/foundations.tsx` 和 `components/prism-next/shell.tsx` 各新增一行 guide 导航。
- 新增 guide 路由使用 `showBlueprintDemo={false}`，不展示站点尚不存在的第四主题组件演示入口。
- Site 的 `themeOptions` 仍只有 light、paper、dark；未新增第四主题样式表，布局仍只引用既有 `theme.css`。轻量 Blueprint v0.4 实验代码、主题配置和图表调色板无 diff。
- 硬编码 GitHub main 源码链接对应 `components/prism-next/blueprint/blueprint.tsx`。已确认该路径存在于父仓库 HEAD `1f575ea142c7f3b5fa0ae8a41f5c63c310067251`；未把本地存在性核对表述为远端访问或匿名权限验证。
- 发现 canonical 与 Site 的 `docs/experiments/prism-blueprint-v0.2.md` 不同：Site 增加后续 v0.2.1 指引。主线程已明确保留 Site 自有实验历史，并在 Site 单独重新生成 JSON/public，避免用 canonical 生成物覆盖站点实验记录；canonical 主文档与 STATUS 保持同步。此处记录主线程的收口方案，未再次读取最终生成物。

## 浏览器验收与剩余限制

主线程回报已补验本轮浏览器重点，包括墨底焦点、320px 首末项与局部滚动、嵌套主题隔离、guide 表格的局部横向滚动。浏览器具体操作、截图、结果与未验范围以[当前状态记录](../../STATUS.md)及本轮主线程证据为准；独立审查者没有亲自执行或重复该浏览器验收。

- 本结论覆盖代码、文档生成链路与 Site 补丁结构，不替代最终构建、全量测试、部署包核对或线上发布验证。
- 真机、读屏器、原生打印及实体打印等未由本次独立代码审查验证，不据工程断言或历史结果宣称通过。
- 后续编辑正文或直接引用的资产，须在各自基线重新生成并运行 `node scripts/sync-blueprint-guide.mjs --check`。
- Site 本轮仅发布独立 guide 及必要资源；本地第四主题完善仍须按实际验收和发布记录推进，不因文档可访问而视为已经上线。
