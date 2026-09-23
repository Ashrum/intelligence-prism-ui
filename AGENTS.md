# intelligence-prism-ui · Agent 工作约定

本文件约束在本仓库工作的所有 AI Agent（Claude Code、Codex 等）。流程细节见 [docs/OLE_AI_NATIVE_DEVELOPMENT_WORKFLOW_v0.1.md](docs/OLE_AI_NATIVE_DEVELOPMENT_WORKFLOW_v0.1.md)；本文件与之冲突时，以本文件为准。

## 1. 仓库职责

- 本仓库：智能曜彩 Design System，以及 Agent 通用组件的设计、实现、交互状态、文档、组件示例和评审夹具。
- `ole-school-workbench`：Teacher Workspace 的业务组合与接入验证。未经 Product Owner 明确要求，不修改该仓库；可只读参考。
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

- GitHub `main` 是唯一基线。本地、GitHub、GPT 站点之间的同步都经过 `main`；站点只发布 `main` 上的代码。
- 每个任务从最新 `main` 开一个分支（`feat/`、`fix/`、`docs/`、`chore/` 前缀），改动经 PR 合入。
- 本地只保留一个工作树和一个进行中的任务分支；任务合并后删除该分支。
- 提交保持小而独立；合并使用 merge commit，保留各个提交。不 force-push `main`，不改写已推送的共享历史。
- 只有 Supervisor 给出 `PASS` / `PASS WITH NOTES` 并在委派中明确写明后，Codex 才能 push、建 PR、合并。
- 提交信息末尾保留协作者署名行（`Co-Authored-By: ...`），PR 描述写明改动、验证结果与未验证范围。

## 4. 规范权威顺序

1. [Agent 组件规范 v0.2.1（已批准）](docs/OLE_Teacher_Workspace_Agent_Component_Spec_v0.2.1_APPROVED.md)，以及各组件页的 Agent Spec
2. Foundations：[字体规范](docs/typography.md)、主题与语义令牌
3. [复用规划 v0.1.2](docs/智能曜彩_Agent语义组件复用与设计规划_v0.1.2.md)、[组件复用约定](docs/component-contracts.md)、Pattern 与应用示例
4. 固定版本的 coss upstream 行为
5. Agent 自行推断

后一级不得覆盖前一级。缺失的值或行为先沿用 coss；仍无定义时报告规范缺口，不从截图或偏好补造。见 [docs/agent-readable-contract.md](docs/agent-readable-contract.md)。

## 5. 设计系统硬约束

- `components/coss/**` 是固定来源的 54 个原始组件，字节受散列校验，禁止修改。需要调整时在 `components/prism-next` 组合或适配。
- 先复用：现有组件 → 组合或公开属性扩展 → 抽取 Workspace 的通用部分 → 确有稳定缺口才新增。新增前记录检索依据。
- 页面和组件 CSS 只处理布局与响应式；不重绘组件的颜色、圆角、阴影、字号、字重，不新增视觉令牌。
- 文字使用语义字号类（`text-ui-body`、`text-ui-hint`、`text-read-body`、`text-block-title` 等），不写局部字号；排版检查脚本会拦截。
- 主题保持 `light` / `paper` / `dark` 三套；根节点 `data-ui-version="coss-v1"`，主题属性 `data-prism-theme`。
- 基础表单使用常驻固定标签，不做浮动标签。
- 组件目录保持 80 项；页面骨架、应用示例与语义别名不计入组件数，不为搜索或演示另建组件条目。
- 组件只呈现外部事实并发出意图：不内置模型、执行器、业务 Store、权限判断或持久化；不用计时器、按钮点击推定执行状态；未知就显示未知。
- 动效只解释用户操作和外部状态变化，遵守减少动态效果设置。

## 6. 本地环境（Windows）

- Node.js ≥ 22.13。`npm ci` 只按 lockfile 安装；未经 Product Owner 同意不增删依赖。
- 开发服务：`$env:WRANGLER_LOG_PATH='.wrangler/wrangler.log'; node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort`。同一时间只运行一个服务，并确认它运行的是当前任务的工作树与分支。
- 构建与测试按 README「Windows 本地验证」执行：字体检查 → 排版检查 → `node node_modules/vinext/dist/cli.js build` → `node --test tests/*.test.mjs` → `node node_modules/typescript/bin/tsc --noEmit`。Linux 继续使用 `npm run build` / `npm test`。
- `.gitattributes` 保证 coss 源码以 LF 检出；不要为通过散列测试而放宽测试。

## 7. 验收标准

- 交付必须附证据：实际 diff、测试与类型检查数字、必要的浏览器验证（页面、操作路径、看到的文案或状态）。“测试通过”不能代替交互与视觉检查。
- 视觉检查覆盖相关的三主题、窄容器、长中文与公式；不以“无溢出”判定设计合格。
- 未验证的范围（真实服务、移动设备、读屏器等）必须写明，不得宣称已验证。
- 既有失败（与本次改动无关）需在干净基线上复现并说明原因，不顺手修复无关问题。

## 8. 禁止事项

未经 Product Owner 明确授权：部署或发布站点、修改远端环境、删除重要资源、大范围重构、修改冻结规范、增删依赖、改动 `ole-school-workbench`、超出任务范围的改动。

## 9. 语言

与 Product Owner 的沟通、Review 与报告使用简体中文；代码标识符、命令、文件名、API 名称与结论标签保留英文。Agent 之间的内部提示可按效果选择语言。
