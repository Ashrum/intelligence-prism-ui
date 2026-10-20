# intelligence-prism-ui · Agent 工作约定

本文件约束在本仓库工作的所有 AI Agent（Claude Code、Codex 等）。流程细节见 [docs/OLE_AI_NATIVE_DEVELOPMENT_WORKFLOW_v0.1.md](docs/OLE_AI_NATIVE_DEVELOPMENT_WORKFLOW_v0.1.md)；本文件与之冲突时，以本文件为准。

## 1. 仓库职责

- 本仓库：智能曜彩 Design System，以及 Agent 通用组件的设计、实现、交互状态、文档、组件示例和评审夹具。
- `ole-school-workbench`：Teacher Workspace 的业务组合与接入验证；Agent 组件以 Workspace `/teacher/agent/workspace` 的真实流程为接入与验证依据，本仓库 `/next/skeletons/agent` 为历史骨架，不作为组件验收依据。经 Product Owner 2026-09-24 授权，可按同一流程（任务分支、Supervisor 委派 Builder 实现、独立 Review、Product Owner 确认后合并）修改 Workspace 以接入和验证组件；Workspace 的业务行为仍不搬进本仓库。
- 不为让演示可用而把 Workspace 的业务行为（Store、路由、持久化、权限、Runtime）搬进本仓库，也不在运行时代码中引入 Workspace 私有类型。

## 2. 角色

| 角色 | 职责 |
| --- | --- |
| Product Owner（人） | 产品方向、冻结规范、设计方向、高影响决策；GPT 站点发布 |
| Claude Code（Supervisor / Reviewer） | 收敛 Scope 与验收标准，委派 Codex，独立 Review，给出结论并做增量复验 |
| Codex（唯一 Builder） | 由 Supervisor 派出；调查、实现、自测、浏览器验证、按 Review 意见返工 |

- 本地仓库只接受 Supervisor 派出的 Codex 修改代码。其他 Agent（含 GPT 站点侧）只做产品设计、站点发布和文档，不直接改本地仓库。
- Builder 不自我批准。Review 结论只有 `PASS`、`PASS WITH NOTES`、`REWORK`、`ESCALATE`。
- 产品方向变化、冻结规范冲突、重大架构选择、不可逆操作、证据不足以判断的问题，一律 `ESCALATE` 给 Product Owner。

## 3. 基线、分支与合并

**Blueprint 页面风格实验线特例（Product Owner 2026-10-13）**：本次合并 PR #182 并完成 GitHub → 现有 GPT Site 同步后，该实验线以 GPT Site 源码和页面为主要迭代、预览与审核基线，再将确认后的改动同步回 GitHub。此范围内允许 Site 侧修改实验页面，不受“先 main 后站点”的顺序限制；GitHub 同步仍使用任务分支与 PR。该特例仅适用于 Blueprint 页面风格实验及相关说明，不改变其他组件开发线，也不自动授权调整基础组件、Token 或 API。

- GitHub `main` 是唯一基线。本地、GitHub、GPT 站点之间的同步都经过 `main`；站点只发布 `main` 上的代码。
- 每个任务从最新 `main` 开一个分支（`feat/`、`fix/`、`docs/`、`chore/` 前缀），改动经 PR 合入。
- 本地只保留一个工作树和一个进行中的任务分支；任务合并后删除该分支。
- 提交保持小而独立；合并使用 merge commit，保留各个提交。不 force-push `main`，不改写已推送的共享历史。
- 只有 Supervisor 给出 `PASS` / `PASS WITH NOTES` 并在委派中明确写明后，Codex 才能 push、建 PR、合并。
- 提交信息末尾保留协作者署名行（`Co-Authored-By: ...`），PR 描述写明改动、验证结果与未验证范围。

## 4. 规范权威顺序

1. [OLE Agent 前端界面设计规范 · 蓝图 v1.0](docs/OLE_Agent_Frontend_Blueprint_v1.0.md) 的目标交互、组件来源与实施门禁；现有 API 是否已支持仍须核对源码与组件契约，不以目标设计冒充已实现。
2. [Agent 组件规范 v0.2.1（已批准）](docs/OLE_Teacher_Workspace_Agent_Component_Spec_v0.2.1_APPROVED.md)，以及各组件页的 Agent Spec
3. Foundations：[字体规范](docs/typography.md)、主题与语义令牌
4. [复用规划 v0.1.3](docs/智能曜彩_Agent语义组件复用与设计规划_v0.1.3.md)、[组件复用约定](docs/component-contracts.md)、[题目呈现章程 v0.1](docs/question-presentation-charter.md)、Pattern 与应用示例
5. 固定版本的 coss upstream 行为
6. Agent 自行推断

后一级不得覆盖前一级。缺失的值或行为先沿用 coss；仍无定义时报告规范缺口，不从截图或偏好补造。见 [docs/agent-readable-contract.md](docs/agent-readable-contract.md)。

## 5. 设计系统硬约束

- `components/coss/**` 是固定来源的 54 个原始组件，字节受散列校验，禁止修改。需要调整时在 `components/prism-next` 组合或适配。
- 复用顺序已按用户2026-10-16正式版发布指令同步（来源取舍见规范 §11.6）：
  - 先复用已有智能曜彩／Prism组件，再检索 coss（含 particles），然后做必要的 Prism 组合与适配；仍有稳定缺口才新建。
  - Beautiful UI 为可选来源与局部效果参考，不再强制优先检索，不因本次调整重写已验收实现。引用其代码须核对具体许可、保留 MIT 声明，并去掉演示计时器与自动播放。
  - coss 检索包含 [particles](https://coss.com/ui/particles)；[注册索引](https://coss.com/ui/r/registry.json)，单项 `https://coss.com/ui/r/p-<name>.json`。适配在 `components/prism-next` 完成，冻结的 `components/coss/**` 原始字节不变；官方最新实现不视为已接入。
  - 新增／改造前记录检索条目、匹配情况与取舍。Open WebUI、Open-ClaudeCode 等客户端只作交互研究，不整体引入运行时或替换前端框架。
- 页面和组件 CSS 只处理布局与响应式；不重绘组件的颜色、圆角、阴影、字号、字重，不新增视觉令牌。 Blueprint 的有限例外见 §10；其余范围继续遵守本条。
- 文字使用语义字号类（`text-ui-body`、`text-ui-hint`、`text-read-body`、`text-block-title` 等），不写局部字号；排版检查脚本会拦截。
- 核心主题保持 `light` / `paper` / `dark` 三套；`blueprint` 为隔离的第四套实验主题，例外边界与生效条件见 §10。根节点 `data-ui-version="coss-v1"`，主题属性 `data-prism-theme`。
- 基础表单使用常驻固定标签，不做浮动标签。
- 组件目录可扩充，新增组件须经 Product Owner 认可（PO 2026-09-30）；页面骨架、应用示例与语义别名不计入组件数，不为搜索或演示另建组件条目。
- 组件只呈现外部事实并发出意图：不内置模型、执行器、业务 Store、权限判断或持久化；不用计时器、按钮点击推定执行状态；未知就显示未知。
- 动效按正式规范 §5.5：简单反馈用 CSS，复杂过渡按需用现有 Motion，合格既有 glimm 保留；同节点同属性不得竞争。P0 统一响应系统 `prefers-reduced-motion` 的初始值和运行中变化，Motion 装饰循环／扫光也须显式停用；不以动画推定业务状态。

## 6. 本地环境

通用要求：Node.js ≥ 22.13。依赖用 `npm ci` 按 lockfile 安装；未经 Product Owner 同意不增删依赖。同一时间只运行一个开发服务，并确认它运行的是当前任务的工作树与分支。

### 6.1 通用验证路径（所有系统）

以下命令只调用 `node`，Windows、macOS、Linux 均可执行，作为标准验证入口。实际执行范围按变更风险和验收要求选择；Blueprint 小轮按 §10.2 的已批准节奏执行，不把本清单解释为每轮都必须运行全量：

1. `node scripts/check-math-font.mjs`
2. `node scripts/check-typography.mjs`
3. `node node_modules/vinext/dist/cli.js build`
4. `node --test tests/*.test.mjs`
5. `node node_modules/typescript/bin/tsc --noEmit`

构建前的环境变量与运行目录设置见 README「Windows 本地验证」；macOS/Linux 以 POSIX shell 设置同名变量。先构建再跑全量测试，服务端渲染测试依赖 `dist/`。

### 6.2 macOS / Linux

- 开发服务：`npm run dev`（默认 5173）。
- `npm run build` / `npm test` 依赖 GNU `timeout`。macOS 默认没有；未安装时改用 6.1 通用路径。
- `npm run install:ci` 依赖 Linux `flock`，macOS 上不要使用，直接 `npm ci`。
- 2026-09-24 实测：macOS 27.0（build 26A428），Node.js v24.14.0、npm 11.9.0；使用 6.1 通用路径 + POSIX 环境变量，数学字体检查通过、排版检查通过（100 个 TSX 文件）、构建成功、测试通过（tests 88 / pass 88 / fail 0 / skipped 0）、类型检查通过（0 错误），五项退出码均为 0。

### 6.3 Windows

- 开发服务：`$env:WRANGLER_LOG_PATH='.wrangler/wrangler.log'; node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort`。
- 构建与测试按 README「Windows 本地验证」执行（即 6.1 加 PowerShell 环境设置）。`npm run dev` / `build` / `test` 的 POSIX 写法在 Windows 上不可用。
- `.gitattributes` 保证 coss 源码以 LF 检出；不要为通过散列测试而放宽测试。

### 6.4 换机检查清单

仓库规则随仓库走，以下本机配置不会同步，在新机器上逐项完成：

1. 安装并登录 Claude Code 与 Codex CLI；用一个只读任务验证 `codex exec` 可用。
2. 在用户级 `~/.claude/settings.json` 的 `permissions.allow` 加入 `Bash(codex exec:*)`，由 Product Owner 本人确认。
3. 从 `intelligence-prism-ui` 仓库目录启动 Claude Code，使 `CLAUDE.md` / `AGENTS.md` 自动加载；上一台机器上的 Claude 本地记忆不会随之迁移，以本文件为准。
4. `git fetch` 后切到最新 `main`，`npm ci`，按 6.1 完成一次全量验证。
5. 可选：安装 `gh` CLI 以便直接查看 PR 状态。

切换机器前，把进行中的工作推送到任务分支或提交 PR；本地未推送的改动不会出现在另一台机器上。同一时间只在一台机器上派出 Builder。

## 7. 验收标准

- 交付必须附证据：实际 diff、测试与类型检查数字、必要的浏览器验证（页面、操作路径、看到的文案或状态）。“测试通过”不能代替交互与视觉检查。
- 视觉检查覆盖相关的三主题、窄容器、长中文与公式；不以“无溢出”判定设计合格。
- 未验证的范围（真实服务、移动设备、读屏器等）必须写明，不得宣称已验证。
- 既有失败（与本次改动无关）需在干净基线上复现并说明原因，不顺手修复无关问题。

## 8. 禁止事项

未经 Product Owner 明确授权：部署或发布站点、修改远端环境、删除重要资源、大范围重构、修改冻结规范、增删依赖、超出已授权接入验证范围改动 `ole-school-workbench`、超出任务范围的改动。

## 9. 语言

与 Product Owner 的沟通、Review 与报告使用简体中文；代码标识符、命令、文件名、API 名称与结论标签保留英文。Agent 之间的内部提示可按效果选择语言。

## 10. Blueprint 主题与交接（隔离实验线）

本节须经 Product Owner 明确批准后生效；批准记录由 Supervisor 填入 `docs/blueprint/STATUS.md`，不得预填授权人或日期。它将已获单轮授权的蓝图接入约束明确化，不追溯否定此前授权，也不自动批准未来产品方案、全局 Token 或 API 变更。§3 的 2026-10-13 GPT Site 实验线特例继续有效，角色、评审、GitHub 合并与发布权限仍按 §2、§3、§8 执行。

### 10.1 范围与隔离

- 蓝图实现集中在 `app/(next)/next/blueprint.css`、`theme.css` 的蓝图令牌块、`lib/prism-next/chart-palette.ts`、`components/prism-next/blueprint/**`、蓝图演示页与对应文档、测试。主题注册、预览隔离、导航及共享图表适配的必要改动，须逐项列在当轮交接清单；仅允许接入本主题，不据此扩展到其他页面、基础组件或 API 设计。
- §5 的视觉重绘限制仅对已授权的蓝图主题适配放宽。相对当轮记录的基线，核心三主题已有令牌值、默认视觉与交互保持不变，并提供受影响范围的回归证据；不要求 React/HTML 源文本逐字相同。`components/coss/**` 原始源码仍按 §5 保持字节不变。
- 改变既有组件外观的规则必须限定在 `[data-prism-theme="blueprint"]` 范围，排除嵌套非蓝图预览的根节点及其全部后代，并检查伪元素。可沿用 `:not(:where([data-agent-preview][data-prism-theme]:not([data-prism-theme="blueprint"]), [data-agent-preview][data-prism-theme]:not([data-prism-theme="blueprint"]) *))`。禁止无主题限定的全局视觉覆盖。
- 新增蓝图组件类使用 `bp-` 前缀。这些显式选用的类允许在核心三主题使用中性令牌回退；不因加载样式而改变普通 coss / Prism 组件。既有组件的蓝图适配可以定位现有稳定类名或 `data-slot`，但必须遵守上一条隔离要求，不修改 coss 源码、不全局重定义已有类。
- `theme.css` 允许为显式选用的 `bp-*` 组件补充必要的中性回退令牌；已有核心令牌值不得改变。新增令牌逐项说明用途及回退，不以此授权无关全局视觉令牌。字号继续使用既有语义字号，不新增局部字号或字号令牌。
- 图表的默认系列色、形状色和连续色阶以 `lib/prism-next/chart-palette.ts` 为统一来源。Recharts 可通过 `theme.css` 的 `--chart-*` 令牌桥接，并测试与调色板一致；轴线、提示框沿用既有语义令牌。组件内不得新增默认主题配色字面量；调用方显式传入的颜色仍按既有 API 生效。新增蓝图分支不得改变核心三主题的默认配色和配置。

### 10.2 验证与数量约定

- 用户于 2026-10-16 批准 Blueprint 小轮检查节奏：每轮检查本次受影响的内容、交互和代表窄屏，按影响范围复核蓝图生效、核心主题回归及嵌套预览隔离；实际浏览器至少包含相关页面的代表窄屏与桌面状态。记录实际通过、失败和未验范围，不把源码断言、SSR 或“无溢出”当作视觉验收。
- 每累计完成 3 个已授权小轮，执行完整回归（全量工程测试及累计改动涉及的主题、页面与交互矩阵）和独立综合审查；在 `docs/blueprint/STATUS.md` 记录本轮序号、完成状态、最近完整回归与下次触发点。第 3 轮收口后开始下一周期，不按提交次数、重试次数或同轮返工重复计数。编辑式排版与 Geist Mono 子集轮为新周期第 1/3 轮，未完成前不得记为已验收。
- 共享令牌、基础交互、跨组件规则等高风险变化须按实际影响提前扩大回归；必要时提前执行完整回归与独立综合审查，并记录原因及计数处理，不等第 3 轮才处理风险。首次引入字体单独检查缺字、加载失败回退、布局与代表窄屏；首次字体本身不自动触发全站全量。
- 每轮发布前仍需针对当前 diff、关键证据和冻结边界的独立轻量审查；第 3 轮的综合审查不替代该门槛，也不取消既有 Supervisor 放行要求。发布仍需生产构建，构建通过不自动扩大为全站浏览器验收或全量测试结论。
- 纯文档与规则补丁检查 diff、链接和证据真实性；不得沿用旧结果声称当前构建或全量通过。如运行全量测试，仍按 §6.1 先构建，测试使用对应源码的 `dist/`。
- 组件目录数量以权威目录为准，避免在多处测试中重复写死总数。断言需能发现独立错误，例如重复 ID、必需条目缺失、目录与独立生成的路由或导航不一致，以及蓝图示例误登记为组件；不得用同一数组与自身派生长度比较来替代有效测试。54 个冻结 coss 文件、固定业务数量等有明确契约的断言继续保留。既有测试改动单独列入范围，不借交接规范降低校验强度。

### 10.3 设计与实施交接

- 设计侧提供 `patch-vN/`，包含逐文件清单、来源基线、diff / 手动适配片段及验收清单；按 §2 不直接修改本地仓库。§3 已授权的 GPT Site 页面实验继续执行，从 Site 回传时标明 Site 版本及对应 Git 基线。
- 优先提供 unified diff。应用前核对目标路径、基线和未提交改动，先执行 `git apply --check`；仅在基线 blob 可用、索引与目标文件状态适合且相关改动已核对时使用 `git apply --3way`。冲突只暂停受影响文件并记录差异；有依据的本地适配须明确记录，禁止猜测覆盖或回滚他人改动。
- Builder 每轮更新 `docs/blueprint/STATUS.md` 的“当前”，将原段落连同日期与基线移入“历史”。写明本轮范围、工作树状态、实际测试命令与结果、浏览器证据、偏差、未验限制和待 PO 决定项。历史结果与当前复验分开；Builder 自测不等同于 Supervisor Review 或 PO 批准。
- 截图存入 `docs/blueprint/screens/vN/`，命名为 `<主题>-<视口宽度>-<内容>.<实际格式>`，例如 `blueprint-1280-patterns.jpg`；新截图优先 PNG，但扩展名必须匹配实际编码。证据索引记录主题、视口宽高、路由或夹具、日期与基线。报告正文使用仓库相对路径，Markdown 链接按文档位置解析。
- `.sites-runtime/` 用作临时运行目录。需要交接的证据复制到 `docs/blueprint/`，核对内容与引用后再处理旧副本；不让历史链接失效，不把未复制的临时文件写成仓库已有证据。空目录不作为交付，至少提供实际证据或说明文件。

## 11. 设计线与工程线

- 双线规则见 [OLE 设计线与工程线 v1.0](https://github.com/Ashrum/open-learning-engine/blob/main/docs/governance/OLE_DESIGN_AND_ENGINEERING_TRACKS_v1.0.md)。设计线快速迭代交互、用户体验、功能构成与演进方向，工程只做到设计和粗略验证；工程线负责生产研发，另行规划。
- 设计文档头部分列「设计状态」（候选 / 设计正式版 vX.Y / 历史记录）与「工程准入」（未开始 / 工程线进行中 / 已准入）。工程准入由工程线维护，不阻塞设计转正；设计正式版不代表生产准入。
- 本仓组件文档和蓝图类文档此后转正须满足四条标准：决策清零；以 Mock / 合成数据可体验页面完成粗略验证，且 Supervisor 浏览器验收通过（桌面 1280 与窄屏 390，主题按适用范围）；Schema、迁移、压测、流量准入等工程内容移入工程线交接附录或工程线文档；登记版本、内容指纹、PO 批准人与日期，并同步 GitHub 与 Outline。
- 浏览器验收仍由 Supervisor 负责，Builder 实施与自测不等同于独立 Review、浏览器验收或 PO 批准。正式版后续修改按版本修订，不退回候选。
- 历史文档只改状态标签，文件留在原位置，由 README 导航区分现行与历史；本节不自动修改既有文档的批准状态或版本号。
