# Prism Blueprint v0.3 · 官网源样式移植

- 日期：2026-10-13
- 状态：页面实验，待 Product Owner 视觉审核
- 实验路由：`/next/experiments/blueprint`
- 开发基线：GPT Site 114，源码 `320480254369360ea84bc29a7314bf9119528460`
- 同步分支：`feat/prism-blueprint-v021`，沿用 Draft PR #183

后续基于真实 Paper 截图的集中精修见 [v0.4 · 主画面定调](./prism-blueprint-v0.4.md)。

## 依据与范围

Product Owner 明确要求「直接从 GitHub 的官网 Blueprint 样式改」。本轮从 Answer me with HTML 官网的真实 CSS 和页面结构改编，继续使用当前 Agent 工作区演示内容。v0.1 C 原稿保留为历史对照，官网源样式成为本轮页面构成的直接依据。

官方源已核对最新 `main`，固定到 `9a762d49927949a7df6657fbfea34f2fb1433f61`：

- [官网样式 site/src/style.css](https://github.com/QingYunA/answer-me-with-html/blob/9a762d49927949a7df6657fbfea34f2fb1433f61/site/src/style.css)
- [官网结构 site/template.html](https://github.com/QingYunA/answer-me-with-html/blob/9a762d49927949a7df6657fbfea34f2fb1433f61/site/template.html)
- [上游 MIT 许可](https://github.com/QingYunA/answer-me-with-html/blob/9a762d49927949a7df6657fbfea34f2fb1433f61/LICENSE)

改编仅作用于实验路由的 CSS Module 和页面组合，不修改基础组件、全局 Token、组件 API、依赖或组件目录。原站的全局 reset、字体规则、按钮和表单皮肤不进入 Prism。页面仍使用 Foundations 语义字号与现有三主题颜色；组件保留其圆角、边框、阴影、字重和交互。

## 前后对比与移植关系

| 部分 | v0.2.1 | v0.3 与官网源的关系 |
| --- | --- | --- |
| 总体纸面 | 淡边框、两个定位角 | 改编 `.sheet` / `.sheet::before`：1.5px 主框、1px 内框、18px 尺带 |
| 辅助定位 | 顶部稀疏刻度 | 改编 `.ruler`：只为整个工作纸面设置坐标边带；窄屏减框去尺 |
| 页面背景 | 纯色画布 | 改编官网 body 网格：40px 极淡网格，限定于实验背景 |
| 区域标题 | 浅色数字与细分隔 | 改编 `.sheet-head` / `.sheet-id`：A/B/C 反差标记、连续标题基线 |
| 底部信息 | 自由排列的处理顺序 | 改编 `.titleblock` / `.footer-block`：结构化图签承载任务与演示信息 |
| 内部组件 | 当前 coss / Prism | 继续原样组合，由外层纸面建立结构；不逐卡添加双框和尺带 |

浅色和 Paper 的图框使用现有前景色，Dark 随主题反转；原站工程蓝映射到 Prism 现有品牌与语义颜色。网格为装饰，不承载状态含义。原站营销页的大号标题和细小技术标注不直接照搬，保留当前可读字号。

CSS 注释保留上游路径、提交及改编说明。上游 MIT 原文随站点提供：`/experiments/blueprint/answer-me-with-html-LICENSE.txt`；页内提供固定版本的样式来源和许可入口。

默认 16px 根字号下，三栏最低需求为列宽 57.25rem + 间隔 4rem + 纸面内边距 4.5rem + 边框 3px，约 65.94rem。实验内容容器在 68rem 以下转两栏、52rem 以下转单栏并收起内框与尺带。按 CSS 推导，1366px 视口三栏约为 274 / 595 / 311px，1440px 约为 291 / 632 / 330px；768px 为单栏。以上为布局推导，未经浏览器实测。

## 内容与交互

固定事实继续保持：42 道题、36 份作答、39 道已关联试题、3 项待复核、第 3 / 4 步快照、7 / 9 章节框架。保持原会话、七类详情、Composer 输入反馈、专注模式、局部 Paper / Light / Dark 和 v0.1 原稿切换。不存在真实 Agent 执行、持久化、评分修改或业务发布。

延续 v0.2 / v0.2.1 的 coss（含 particles）与 Beautiful UI 复用调查。本轮无新增通用组件需求，继续复用 Card、Button、Badge、ToggleGroup、Dialog、Progress、AgentMark、AgentTaskProgress、AgentMessage、AgentComposer。

## 验证与审核

| 检查 | 结果 |
| --- | --- |
| Sites 官方 `build-site.mjs` | 退出 0，Vinext 构建完成 |
| 字体与排版 | STIX Two Math 固定资产及许可完整；292 个自有 TSX 的语义字号检查通过 |
| TypeScript | `tsc --noEmit` 退出 0，无错误 |
| 全量测试 | 1713 / 1713 通过；失败、取消、跳过均为 0 |
| 构建产物 SSR | 实验页与 `/next` 均 HTTP 200；实验独立画布、首页目录侧栏、默认 Paper、固定事实与主要入口保留 |
| 原稿完整性 | v0.1 HTML 保持 53,118 字节，SHA-256 与输入原件一致 |
| 上游许可 | 1,089 字节，公开资产及构建资产均与官方 LICENSE 逐字节一致 |
| Diff 空白检查 | `git diff --check` 通过 |

独立 Reviewer 结论：**PASS WITH NOTES**。已确认官网规则有明确对应、没有导入全局 reset / 字体 / 组件皮肤；三栏净宽与提前换栏成立，Dark 标记按现有前景 / 背景成对反转。独立核对原稿和许可字节、构建资产，以及上述构建 / 类型 / 测试日志。未发现需返修的源码阻断项。

Supervisor 接受该结论，明确授权本轮 Site 实验页发布与 Draft PR #183 增量同步；不合并 `main`。保留的视觉审核重点是 68rem / 52rem 断点附近的重排、Dark 强线条的长期舒适度、三主题实际合成、原稿 iframe 和键盘焦点 / 详情往返。

当前 managed Sites 环境未提供其技能指定的 `control-browser`，按技能约定不启动替代浏览器或预览服务器。构建、SSR、类型检查和测试不代替实际桌面、窄屏、三主题、键盘焦点与交互验收。源码 Review 通过也不代表 Product Owner 已视觉验收或已纳入正式设计规范。

按已批准的 Site-first 流程更新原 Site 的实验路由，再同步 GitHub Draft PR；保留现有访问范围，不合并 `main`。
