# P78 · 教师消息轻背景实现与复用记录

日期：2026-10-16。基线：P77 `eecb471`，分支 `feat/blueprint-nav-folio`。开工工作树干净；完整提交与保护散列见 [baseline.json](baseline.json)。本轮由 Supervisor 的 task-P78.md 委派，按 builder-preamble.md 分工执行。

## 来源与选择

- 正式蓝图规范 §6.1：教师消息可右对齐，以轻背景和角色区分；助手正文连续阅读。Workspace W193 报告 P-R4-01 指出固定反相气泡与该规范不符。本轮仅补组件主题能力，不修改 Workspace 或声称其已同步。
- 先检查现有 Prism `agent-message.tsx` / `agent-conversation.css`：已有 user 标记、右对齐、80% / 窄容器 88% 最大宽度、中文换行、公式/代码局部滚动、下划线链接、附件稳定 data-slot 与 currentColor。全部复用，不新建组件或 variant。
- coss 固定来源 `e937becd2d5ffb5c621eed6f8b1f223cbb6051e7`；本地目录没有 AgentMessage 对等组件。既有 Prism 已满足结构需求，本轮未联网检索最新 particles、未引入任何外部代码，保留 54 个冻结文件。
- 复核 R1 的 blueprint.css：用户气泡 / 附件已经直角；白图正文链接使用白色外环是旧墨底规则。本轮替换这条规则，PromptBar / AgentSurface 的 CI-09 白图按钮规则原样保留。

## 实现

运行时样式仅改 `app/(next)/next/blueprint.css`：

1. blueprint / blueprint-night 的 `[data-agent-message="user"]` 使用 `--secondary` 背景与 `--foreground` 正文。没有给气泡添加边框或阴影，R1 的直角不变。
2. 正文链接使用现有 `--link`；原有下划线保留。新链接选择器优先级为 `(0,3,1)`，共享 `.agent-user-message .agent-message-content :is(...)` 为 `(0,3,0)`（`:is` 的最高分支含类/属性）；新规则凭 `a` 类型选择器胜出，覆盖继承色而不靠加载顺序。
3. 两蓝图正文链接 focus-visible 使用 2px `--ring` 外环、2px 偏移、无叠加阴影；替换旧白图白色环，新增夜图同规则。没有扩展到输入器或其他夜图控件。
4. 附件文字、Paperclip 描边与边框继承正文色；不新增附件覆盖。主体 p / code / math 等继续按共享样式继承，透明背景。
5. 每条新规则均排除嵌套核心预览的根与全部后代；无伪元素、无新令牌或字号。核心三主题原墨底/反相配对与组件 API 保持。
6. 两处既有示例说明改为“蓝图轻背景 / 核心主题反相”，不改示例结构、行为或目录。

既有 `tests/agent-blueprint-r1.test.mjs` 仅将过时白色链接环预期更新为 P78 蓝色环及链接色，不降低其他 CI 覆盖。新增 `tests/blueprint-user-bubble.test.mjs` 使用真实 AgentMessage SSR 的节点、CSS 选择器解析与当前令牌，对照两蓝图、核心零增量、双向主题预览、根/后代与气泡内核心岛，并验证 17 项内存回退变异。

## 证据边界

规则探针不是浏览器 CSS 层叠、布局、视觉或焦点验收；数值对比使用真实令牌与生产规则，不是截图测量。附件 currentColor 来自真实 SSR 与未改变的组件契约。浏览器验收：按分工由 Supervisor 执行；操作见 [browser-checklist.md](browser-checklist.md)。

未修改 `.git`、未提交/推送/建 PR/发布；未联网、安装依赖、启动或重启开发服务。Builder 自测不等同独立 Review 或 PO 批准。
