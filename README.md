# 智能曜彩 UI Design System

完善设计规范，并逐项打磨组件的视觉、交互和动效。组件质量是主线；工程操作只服务于真实效果的实现和评审。

- 评审与交付站点：https://intelligence-prism-ui.ashrvm.chatgpt.site/
- 源码与变更记录：https://github.com/Ashrum/intelligence-prism-ui
- 正式规范在 `/foundations` 原位完善，正式组件在 `/components` 展示；不另建站外 HTML、第二套规范站或下载包。

## 站点—GitHub 工作流程

当前会话具备所需能力时，直接完成设计、实现、浏览器验证与原站发布；仅缺少某项具体能力时，才将该项交给 Work。不要让用户在会话之间反复搬运提示词。没有实际调用或发布结果时，不得声称任务已启动或站点已更新。

| 步骤 | 工作 | 完成条件 |
| --- | --- | --- |
| 1. 确定本轮修改 | 每轮聚焦一个组件或紧密相关的一组；从既有规范和真实实现中确定必要修改及取舍。记录在当前 PR，不新增报告。 | 明确改什么、保留什么、如何比较。 |
| 2. 建立站内候选 | 在当前任务分支、当前 PR 迭代；需要对照时使用临时 `/review/<component>` 路由，复用真实组件、字体、Token 和站点布局。候选样式局部隔离，不改变正式页面。沿用原站工作区及发布路径展示该候选。 | 站内临时页实际可交互；PR 记录已展示的提交与地址。只有代码提交不算发布完成。 |
| 3. 评审实际效果 | 使用相同文案、图标、密度和场景比较现状与候选；明确说明必须改变的尺寸等变量。检查比例、层级、状态、动效和组合效果，按结果修改同一候选。 | 取得真实渲染与关键交互证据；用户确认设计取舍。截图或语法检查不替代交互验收。 |
| 4. 回填并清理 | 将确认的规则原位落实到公共组件、Token、正式组件页和 Foundations 中受影响的部分；删除临时路由、专属样式、入口及不再使用的候选代码。 | 正式组件具有已确认效果；必要状态示例留在正式组件页，不依赖临时页面。 |
| 5. 同步并发布 | 完成受影响组件的必要回归，在获准合并后合并当前 PR，通过原站发布链更新同一个站点；记录正式发布对应提交。 | GitHub 正式源码与站点发布版本对应，正式页面正常，临时入口移除。 |

### 同步与审核边界

- **GitHub 记录源码和版本，站点承载实际效果。**每次可评审修改及时提交当前分支，并更新同一站点的评审内容；不积累站外副本。PR 正文分别记录“代码提交”和“已发布提交”，未取得发布证据写“未验证”。
- 优先从任务分支发布站内临时页，不为展示未经确认的候选覆盖正式组件。若现有发布链只能使用 `main`，先记录该限制并取得仅上线隔离评审页的合并授权；该合并不代表设计获批。不擅自更换托管方式。
- GitHub 推送不自动等同于原站更新。尚未验证的自动发布关系不得作为流程前提；不调用未知发布接口，不借此新增部署体系。
- ChatGPT 无法直接访问站点时，可读取相同 GitHub 提交并在可用环境渲染原代码；仅有源码时只能做源码审核。必要截图或录屏由执行端从相同版本取得并附在当前 PR，不让用户承担重复导出和搬运。
- 未经用户确认的视觉候选不自动晋升正式设计；用户确认设计并授权收口后，直接完成回填、清理和必要验证，不为每个小操作重复请示。合并及原站发布仍按已有授权执行。
- 不直接推送 `main`，不强制推送，不丢弃未说明的工作区改动。无冲突的提交变化不构成停工理由；只处理真正影响本轮任务的冲突。

### 质量与范围

坚持已确认的 B 方向和三种源色 `#4EB1D9`、`#E0438F`、`#C2F25B`。出彩来自比例、色彩、排版、状态与动效，不以厚阴影、装饰竖线或复杂材质制造差异。

每轮只验证受影响组件及必要组合：鼠标与键盘、焦点、可用状态、异步反馈、密度、Reduced Motion。复用现有构建和测试，不因无关历史问题重复全量核验或重建工具环境；未验证项目明确保留。

Local-first 迁移、固定端口、跨平台部署、Storybook 补建、Hugging Face 迁移和 MCP 排查均不是本流程的前置任务。不重搭站点、不重组工程、不升级无关依赖；已有工具需要时复用。

## 工程模板说明（保留现有运行方式）

The following starter documentation describes the existing runtime. It does not introduce a local deployment requirement or a new hosting strategy.

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with
  `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper
  module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can
  prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned
  `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build and verify the rendered development-preview metadata
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
