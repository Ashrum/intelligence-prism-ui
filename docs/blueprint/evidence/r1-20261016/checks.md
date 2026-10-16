# P73 · R1 组件侧检查记录

日期：2026-10-16。分支 `feat/agent-blueprint-r1`；开工基线 `5644554aa6920fdbffdcbd1fdac617c20af1cc2e`。开工工作树干净，遵循 Supervisor 的 P73 委派及 Builder 前置约定。Builder 不作独立 Review 或 PO 批准结论。

## 逐项现状 → 处置 → 证据

| 项目 | 现状（修改前） | 处置 | 证据及边界 |
| --- | --- | --- | --- |
| CI-01 | Menu 总渲染，空 models 仅 disabled；学校未开放时仍留入口。 | 增加 `showModelSelector?: boolean = true`。false 条件卸载整个模型 Menu；关闭可用性清理 modelOpen，token 判断不再受隐藏菜单抑制。保留 required models、草稿、modelId、意图及旧默认。 | SSR 覆盖 Rounded / Pill × 空 / 有模型、默认 / true / false；实际回调探针验证开→隐藏→再开放和来源输入恢复。[专项](targeted-tests.log)、[变异](mutations.json)。新 prop 名称由 CMP 接口审阅确认。 |
| CI-07 | 固定「需要你确认」混淆普通澄清与执行授权。 | 选择任务允许的中性默认方案，改为规范 M04 已给出的「补充一个信息」。不再添加额外文案 prop；具体 question / description / children 已由宿主控制。 | SSR 验证中性提示、受控选中项、说明及补充插槽保留，渲染不触发回调；原文案回退变异被检出。 |
| CI-08 | 用户气泡 rounded-xl，附件 rounded-md；既有蓝图通用清单不覆盖这两个目标。 | 复用 `data-agent-message="user"`；附件增加 `data-slot="agent-message-attachment"` 稳定挂点。仅 blueprint.css 增加蓝图家族隔离规则，不改原 class、不调整核心主题。 | SSR 校验挂点 / 原 class；实际 CSS 选择器解析后覆盖五种全局及 25 种嵌套组合、核心预览根 / 后代排除；半径与挂点回退均被检出。这不等同真实浏览器圆角测量。 |
| CI-09 | coss 按钮的 focus-visible:ring-2 与蓝图 outline 同时存在；PromptBar 发送和 ExecutionConfirmation 主动作处于浅底。用户气泡背景 foreground，正文链接落墨底而仍取得蓝色 outline。 | 仅白图 PromptBar / AgentSurface 按钮清除 box-shadow ring，使用现有 ring 的 2px 蓝色 outline / 2px offset；墨底用户正文链接使用现有 primary-foreground 白色单框。发送及确认卡已有内边距，未凭猜测改布局；实际裁切留浏览器验收。 | 从实际 Button SSR 读取 bg-primary / focus-visible:ring-2；解析本轮 CSS 检查单框、非焦点不生效、五主题 / 嵌套排除。白图两条规则、预览排除变异均被检出。§5.4 明确不含夜图焦点；未扩展为全部 Agent 控件适配。 |
| CI-11 | coss 五类 Popup 都转发 portalProps；PromptBar 三个 Popup 与语音说明已绑定外层 root。其他内置 Popup 部分未传容器，默认 body，不自然继承局部预览主题。 | 未发现共享 coss 原语承载能力缺口，按 CI-11 不预设全库重构。保留当前实现，列出 R2 须处理的实际调用点。 | 对五类真实 Popup 函数检查 container 引用与主题属性原样传递；PromptBar 探针检查 root 一致且不在裁切表面。五种丢参变异及 PromptBar 丢容器变异均失败。[Portal 清单](portal-audit.md)。真实挂载 / 定位 / 主题需 Supervisor 浏览器核查。 |

## 复用检索与范围

编码前核读已有 Prism `AgentPromptBar`、`AgentQuestionCard`、`AgentMessage`、`AgentSurface`、`AgentExecutionConfirmation`、`AgentVoiceButtons`，它们已匹配本轮需求，只做局部适配。核读固定 coss `Button` / `InputGroup` / `Menu` / `Popover` / `Select` / `Dialog` / `Tooltip` 的真实源码与 props；沿用既有组合与前期已登记的 `p-input-group-28/29/23` 来源，不新增粒子实现。无新组件缺口，不引入外部代码或依赖；本次离线执行没有把官网最新实现说成已接入。

运行时范围：`components/prism-next/agent-prompt-bar.tsx`、`agent-components.tsx`、`agent-message.tsx`、`demos/agent-conversation-demo.tsx`、`app/(next)/next/blueprint.css`。新增 `tests/agent-blueprint-r1.test.mjs`；单独修改既有 `tests/blueprint-night.test.mjs` 的全规则隔离检查：增加只允许 Agent 焦点三种声明的白图专用分支，保留原有共用 / 夜图断言，补强主题根及五主题预览根 / 后代验证，未豁免或过滤新增规则。文档更新 `docs/component-contracts.md`、`docs/blueprint/STATUS.md`，STATUS 的既有 guide 下载副本与资产散列通过生成脚本同步。没有新增目录条目、视觉令牌、字号、依赖或进度状态枚举；未改 Workspace、冻结 coss 或冻结正式规范。

## 工程证据

- [开工基线及复现](baseline.json)、[复现日志](baseline-reproduction.log)：新增测试对修改前运行时代码为 11 项 / 3 通过 / 8 失败，退出码 1；这不是旧测试集的回归失败。
- [专项日志](targeted-tests.log)：本轮 11 项加既有对话 27 项、夜图 12 项，50/50，退出码 0。
- [变异结果](mutations.json) / [简要日志](mutations.log) / [复现脚本](mutations.mjs)：15/15 检出。只替换 esbuild 内存源码或 CSS 读取，不修改工作源码或冻结 coss 字节。另对修改的既有隔离测试执行 2 个内存变异（移除白图排除、误用夜图主题根），见[旧测试变异证据](boundary-test-mutations.json)。第一次变异暴露测试在重新开放前编辑草稿，掩盖 modelOpen 清理；已改为立即重开检查，15/15 最终检出。
- 首轮全量为 2168 项 / 2167 通过 / 1 失败，TypeScript 1 错误；[原始记录](engineering-first-run.json)。失败是旧隔离测试尚不接受规范明确的白图专用规则，以及示例 readonly 主题列表传给可变数组。分别补强受限白图测试分支、在调用处复制主题数组后复跑，不将其记为既有失败。
- [五项完整工程记录](engineering.json)：记录实际命令、起止时间、退出码与测试数字，五项最终均退出 0：数学字体及许可通过，语义字号 308 个 owned TSX 通过，生产构建成功，全量 2168/2168（0 失败、0 跳过），TypeScript 0 错误。未沿用历史 2157 项结论。
- [范围 diff](scope.diff)、[保护范围核对](integrity.json)：已归档实际测试 / 运行时 / 文档 diff；HEAD / 分支不变，54 个冻结 coss 文件、theme.css、依赖、目录及冻结规范逐字节保持开工基线，旧当前原文完整移入历史。

## 未验证范围

构建保留现有代理环境提示及大 chunk 提示，未新增依赖或改变构建配置；这些提示不影响退出码。状态和 guide 下载副本回填后的最终构建 / guide 同步 / 文档专项结果见[收尾记录](finalization.json)。

浏览器验收：按分工由 Supervisor 执行。见[浏览器检查清单](browser-checklist.md)。无本轮浏览器截图，未启动或重启开发服务；SSR、选择器模型和回调探针不冒充真实焦点 / 挂载 / 视觉验收。真实服务、Workspace 接入、真机、读屏器、实体打印、夜图焦点专项与其余 Agent 组件整体蓝图适配未验。

上一 Blueprint 周期 3/3 的累计浏览器矩阵仍未收口；本轮工程检查不能重置该状态。Supervisor 独立 Review 和 CMP 新 prop 命名审阅待执行，本记录不是 Builder 自我批准。
