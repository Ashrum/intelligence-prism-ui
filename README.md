# 智能曜彩 UI Design System

## 当前版本：coss v1.4.0（题目多场景待评审，教材目录已通过）

本轮用户授权完成一版组件库，并要求自行验证、继续修正后发布。当前基线优先于下面保留的历史流程与旧版设计说明。

- 新版入口：`/next`；规范：`/next/foundations`；组件：`/next/components/[slug]`。
- 应用模式：`/next/reading` 材料研读编辑、`/next/agent` Agent 工作区。
- 54 项 coss 官方基础组件、2 项场景组合（Date Picker / Question）和 1 项教材目录扩展均有可操作示例。旧目录的 59 项规划是历史记录，不等同于本版交付范围。
- 浅色 / 暖纸 / 深色一起提供；语义变量同时控制背景、标题、正文、公式、图标、状态与 Portal 浮层。
- MD 浮动标签、Beautiful UI 和旧智能曜彩组件样式均不进入新版。保留 shadcn 的组件源码方式，采用 coss 视觉与 Base UI 行为；Motion 负责应用状态动效。
- Agent 借鉴任务、上下文、执行步骤、停止、失败重试、结果确认的交互结构。本版为本地演示，不调用模型，不需要 API key 或额度。采用建议追加到人工备注，超出 500 字时不改变原文。

### 组件复用顺序

新增场景先查现有项目与 coss 官方可用组件；其次基于已有组件组合或修改；只有缺乏合适基础时才全新创建。注明复用来源与必要改动，沿用已定主题和控件尺寸，不引入另一套全局视觉样式。

### v1.4 题目多场景组合

- 入口 `/next/components/question`，场景选择覆盖题库选题、试卷编排、研读讲解、推荐与替题、纸面预览、作答与复核、题目审核。
- 复用 coss Select、NumberField、Input、Textarea、Checkbox、Button、Badge、Collapsible、Sheet、Dialog、Tabs 和已通过的教材范围选择器；官方原组件及依赖保持原样。
- `QuestionRecord` 将业务题型名称与五类作答模型分开；有序材料块支持文字、图形、表格交错。`QuestionPart` 独立保存作答模型、分值、答案、解析与评分点。旧四题保留，新增判断题与共享表格下的单选＋填空＋解答复合题。
- `QuestionCard` / `QuestionContent` / `QuestionSolution` 复用于多个场景。批量勾选与试题篮独立；筛选外勾选可见且可取消。复合题整组选用，分值按小问调整，原题分值保持不变。
- 编排支持调序、替换、移除撤销和恢复原题分值；替换保留位置并使用新题默认分值。审核草稿按题目保留，待审核或暂停的题目禁止新增入篮，已入篮题目提示并阻止页面打印操作。
- 纸面版按本卷顺序与分值展示，答案版明确保留原题评分依据；不自动按比例缩放评分规则。打印样式隔离导航、工具栏、浮层和页面装饰，白底深字，与屏幕主题独立；包含解答留白。浏览器打印分页及实体打印仍待使用方最终校样。
- 复核使用人工编写的示例作答，初评分 10/16。每个评分点独立计分，改分必须说明理由，支持维持原分确认、取消草稿与作答回看；草稿跨场景保留。
- 推荐理由、作答和审核为当前页示例；刷新重置。没有新增模型调用、学生在线答题、真实评分或后端题目编辑服务。
- 本轮验证：TypeScript、构建、52 项自动检查（含全部 57 个组件路由、旧版内容保留、coss 源码一致性、试卷与评分状态约束）通过。浏览器实际检查三主题、勾选/入篮分离、本卷改分/调序/撤销、首次原分确认、改分理由校验、跨场景草稿和审核保存。

### v1.3 题目组件

- 入口 `/next/components/question`，列表选题与展开阅读复用 `QuestionContent`。复用已有 coss Checkbox、Button、Badge、Tabs、Collapsible、Popover、Dialog 以及教材范围选择器，未新增依赖或改写官方基础控件。
- 四道自编数学样例覆盖单选、多选、填空、多小问解答题。提供参考答案与完整推导，编号、分值与内容身份分离；题干、图形、选项和小问不截断。
- 整题复选在题目外层，A/B/C/D 为只读语义列表，填空为可识别的静态空位；不做学生作答、题目编辑、自动批阅或模型调用。答案与解析明确命名并就地展开。
- 选项由内容指定适合的 1/2/4 列，容器宽度不足时退为 2/1 列；复杂或长选项使用一列。公式复用 STIX Two Math 与原生 MathML；超长独立公式可局部滚动，不缩小文字挤进整行。
- 几何图为可缩放的精确坐标 SVG，并明确标注动点为示意位置；颜色继承主题前景，放大图使用原 coss Dialog。原生图与公式随浅色/暖纸/深色成套变色。
- 同题的选用、已展开答案和已应用教材/知识点关联在两种视图间保留。仅在“教材与知识点”展开后呈现完整关联，可使用已通过的弹出范围选择器修改。示例选择不持久化到服务器。
- 教材目录两种形式已由用户通过，目录与详情页标为“已通过”；保留完整树与弹出选择器，不重新改动它们的设计。题目组件状态为待评审。

### v1.2.1 弹出式范围选择

- 在原 Tree 路由组合已有 coss Dialog、Select、Tabs、Checkbox、Input Group 与 Button；不增加基础组件数量，不改控件源文件和主题。原完整树示例折叠保留，独立选择互不影响。
- 常态显示教材、目录类型及已应用范围；按教材和目录分类，保留具体名称与上级路径。完整子树压缩为“全部 N 项”，部分选择列出具体项；支持就地移除、撤销，以及定位回对应章节细调。
- 弹层内第一层章节定位，当前章内其余层级默认展开，最大浅缩进 24px。窄屏复用 coss Select 定位章节，内容在固定面板内部滚动。示例课程与知识点均包含四层。
- 完整树复选逻辑与基础树共享 `useDirectorySelection`；仅存带教材/目录范围的叶项 ID，半选由完整子树派生。搜索平铺命中的具体项并展示祖先路径；批选只基于 `matchingIds ∩ leafIds`，命中分组需进入分组再选，避免误选未命中项。
- 面板跨教材/目录暂存选择；查看已选涵盖所有来源，调整可跳回原节点。只有“应用选择”提交，取消、Escape、关闭按钮或外部关闭均丢弃本次草稿；页面已应用范围不随临时勾选变化。本地演示不持久化选择到服务器。

### v1.2 教材目录

- 复用 coss Origin 的 Tree / 复选框 / 过滤示例，以 Headless Tree 1.5.1 承担层级、键盘和父子联动；来源与 MIT 许可见 `vendor/coss-origin-tree.md`。这是适配扩展，不计入 54 项原始 coss UI 基础组件。
- 新入口 `/next/components/tree`；教材选择、课程目录/知识点目录、中文搜索、多选与跨教材已选汇总共用一个场景。
- 搜索从完整数据查找，保留命中节点的祖先，命中父节点时展示后代。导航使用真实过滤投影，键盘不会进入隐藏项。
- 多选复用原库完整树的 `propagateCheckedState`，只保存叶子 ID，父级派生全选/半选；搜索不改变父级全选范围，不清除隐藏选择。
- 教材与目录类型分别保存选择和搜索；右侧按教材及类型汇总，课程与知识点不互相推断映射。父级重复勾选去重，叶子采用带范围前缀的稳定 ID。
- 长中文标题自然换行；箭头只展开、标题只定位、复选框选择范围；方向键、Enter 与空格可操作。控件继续使用原有 coss Select、Tabs、Checkbox、Input Group、Button、Scroll Area。
- 本版仅演示目录浏览与范围选择，使用精简示例数据，不含目录编辑、拖拽、跨目录自动映射或远程搜索。

### v1.1 常用 Particles

- 在原分类页补充 15 个示例区：Select 4、Combobox 3、Date Picker 3、输入组合 1、数字范围 1、Table 1、Dialog 2。每区提供固定上游 Particle 源码链接。
- Table 使用官方同版本的 `@tanstack/react-table@9.2.4`；稳定材料 ID、筛选重置选择、跨页勾选、批量标记、分页及加载/空结果/失败重试。
- Dialog 提供长内容、模拟提交等待与失败、草稿保留重试、未保存关闭确认。示例均不调用服务器或模型 API。
- 原始基础组件文件与三套主题保持不变；新增内容只在组合层实现，不将组合数量计为基础组件数量。

### 组件与主题约定

`components/coss/` 为官方 MIT 的 `apps/ui/registry/default` 源码，固定于提交 `e937becd2d5ffb5c621eed6f8b1f223cbb6051e7`。仅转换导入路径；`vendor/coss-manifest.json` 记录每个文件的上游与本地散列以及精确导入改写。未采用仓库内 AGPL 的 `packages/ui` 代码或全局样式。

实际应用与示例放在 `components/prism-next/`，不在官方组件文件中叠加页面样式。使用 `render` 组合 Base UI/coss 组件，不用 Radix 的 `asChild` 语法代替。

```tsx
import { Input } from '@/components/coss/input'
import { Field, FieldLabel } from '@/components/coss/field'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/coss/select'

const kinds = [{ value: 'example', label: '例题讲解' }, { value: 'concept', label: '知识梳理' }]

<Field className="max-w-48">
  <FieldLabel htmlFor="material-kind">材料类型</FieldLabel>
  <Select items={kinds} defaultValue="example">
    <SelectTrigger id="material-kind"><SelectValue /></SelectTrigger>
    <SelectPopup>{kinds.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup>
  </Select>
</Field>
```

不以原生 `<select>`、静态选项或仅修改外观的自制菜单冒充 coss Select。默认根字号 16px 时，桌面 sm/default/lg 的 Input 外框、Select、Button 高度为 28/32/36px；窄屏为 32/36/40px。保持内部字号、内边距、圆角、选中标记和焦点行为；通过字段容器控制宽度。

主题定义在 `app/(next)/next/theme.css`，色值索引在 `lib/prism-next/config.ts`。浅色严格使用正文背景 `#FFFFFF`、次级背景 `#F4F5F7`、分割线 `#E3E5E9`、正文公式 `#1F2328`、次要文字 `#6B7280`、禁用色 `#B0B4BB`。交互边框独立于装饰分割线，遵从 coss 输入轮廓。不得将禁用色用于字段标签和必须阅读的说明。

主题属性设置在 html，保证挂载至 body 的浮层获得同一套变量。图标继承当前前景；公式使用本地 STIX Two Math 和 MathML。主题选择与材料示例保存到当前浏览器；保存失败保留草稿并显示错误。

### 旧版保留与隔离

原有页面、示例、评审代码整体迁入 `app/(legacy)`，URL 保持不变，统一显示“旧版设计 · 已过期”。页面内容与旧评审文件通过逐字节比较保持不变。旧组件与字体资源保留；历史成熟度只作为历史记录。

新旧两套根布局分别加载 CSS，不共享旧版全局 input/button/svg 规则。跨版本入口使用原生链接；不要将旧全局样式导入新版，也不要在用户决定删除前移除旧内容。

### 验证与维护

- `npx tsc --noEmit`：完整类型检查。Worker 声明由当前 Wrangler 官方 runtime 生成；真实 DB 绑定仍为可选。
- `npm run build`：保留原有有界构建和旧字体校验。
- `node --test tests/*.test.mjs`：旧功能回归、全部 57 条组件、组合与扩展路由、新旧根隔离、原始 coss 散列、旧内容保留、材料校验和 Agent 状态约束。
- 旧测试各使用独立 Vite 缓存，避免清空开发预览的依赖缓存。
- v1.0 实际浏览器验证：三主题正文、MathML、选择浮层；coss三档外框实测28/32/36px；键盘选择与Esc；搜索过滤；对话框取消与归档焦点回退；OTP连续输入；中文日期选择；材料保存刷新、Agent采用/停止/失败重试、页签草稿保留。
- v1.1 实际浏览器验证：深色多选删除/搜索与分组搜索；浅色 Select 说明/多选；暖纸日期范围、快捷日期和月份同步；表格跨页选择、批量标记、筛选清空选择、空结果及失败重试；弹窗未保存确认、焦点回退、失败保留原文并重试成功；长内容滚动布局；搜索清除后焦点保留和数值范围报错。
- v1.1 类型检查、生产构建和 12 项针对性回归通过；未重复无关的旧功能全量浏览器验收。受控 HTTP 预览的 vinext 客户端导航遇到 Web Crypto 安全上下文限制并回退整页导航；路由仍可打开，该限制不计为生产 HTTPS 验收。
- 窄屏布局已做源码与尺寸审查，修复顶栏、长标题、长日期和动效越界；未将其宣称为真实移动设备验收。
- 浏览器检查记录以实际操作为准；源代码检查不替代视觉确认。设计状态保留“待评审”，不把自动化通过写成用户批准。


完善设计规范，并逐项打磨组件的视觉、交互和动效。组件质量是主线；工程操作只服务于真实效果的实现和评审。

- 评审与交付站点：https://intelligence-prism-ui.ashrvm.chatgpt.site/
- 源码与变更记录：https://github.com/Ashrum/intelligence-prism-ui
- 新版在原站 `/next` 展示；`/foundations` 与 `/components` 保留为已过期的旧版。

## 站点—GitHub 工作流程

当前会话具备所需能力时，直接完成设计、实现、浏览器验证与原站发布；仅缺少某项具体能力时，才将该项交给 Work。不要让用户在会话之间反复搬运提示词。没有实际调用或发布结果时，不得声称任务已启动或站点已更新。

实现、真实视觉评审和交互修正由具备原站访问能力的执行环境闭环，不绑定特定历史对话。当前环境按实际能力完成规范、设计取舍、实现与源码审核；缺少实页访问能力时继续可完成的工作，明确尚未完成的视觉评审及具体阻碍。用户直接在原站体验和确认设计，不承担截图、录屏、下载和跨会话上传。

| 步骤 | 工作 | 完成条件 |
| --- | --- | --- |
| 1. 确定本轮修改 | 每轮聚焦一个组件或紧密相关的一组；从既有规范和真实实现中确定必要修改及取舍。记录在当前 PR，不新增报告。 | 明确改什么、保留什么、如何比较。 |
| 2. 建立站内候选 | 在当前任务分支、当前 PR 迭代；需要对照时使用临时 `/review/<component>` 路由，复用真实组件、字体、Token 和站点布局。候选样式局部隔离，不改变正式页面。沿用原站工作区及发布路径展示该候选。 | 站内临时页实际可交互；PR 记录已展示的提交与地址。只有代码提交不算发布完成。 |
| 3. 评审实际效果 | 在能操作原站的执行会话中直接查看并操作同一候选；使用相同文案、图标、密度和场景比较比例、层级、状态、动效和组合效果，按实际问题原位修正。视觉判断与自动化测试结果分别记录。 | 实际浏览器评审完成，用户在原站确认设计取舍；不等待跨会话图片或视频传送，不用源码或测试计数代替视觉判断。 |
| 4. 回填并清理 | 将确认的规则原位落实到公共组件、Token、正式组件页和 Foundations 中受影响的部分；删除临时路由、专属样式、入口及不再使用的候选代码。 | 正式组件具有已确认效果；必要状态示例留在正式组件页，不依赖临时页面。 |
| 5. 同步并发布 | 完成受影响组件的必要回归，在获准合并后合并当前 PR，通过原站发布链更新同一个站点；记录正式发布对应提交。 | GitHub 正式源码与站点发布版本对应，正式页面正常，临时入口移除。 |

### 同步与审核边界

- **GitHub 记录源码和版本，站点承载实际效果。**每次可评审修改及时提交当前分支，并更新同一站点的评审内容；不积累站外副本。PR 正文分别记录“代码提交”和“已发布提交”，未取得发布证据写“未验证”。
- 优先从任务分支发布站内临时页，不为展示未经确认的候选覆盖正式组件。若现有发布链只能使用 `main`，先记录该限制并取得仅上线隔离评审页的合并授权；该合并不代表设计获批。不擅自更换托管方式。
- GitHub 推送不自动等同于原站更新。尚未验证的自动发布关系不得作为流程前提；不调用未知发布接口，不借此新增部署体系。
- **不再要求人工传递评审媒体。**截图可以作为执行环境中观察页面的内部手段或必要留证，录屏可以辅助复盘，但不作为用户必须导出、上传或复制的交付物。媒体未跨会话传递不构成停工理由；需要视觉判断时由能够直接操作原站的会话完成，不跳过视觉评审。
- 仅有源码时只能做源码审核；读取 Work 结果时注明来源，不宣称当前对话亲自看过画面。GitHub 同提交可以用于授权环境中的原代码复现，但不因此另建站点、独立 HTML 或部署方案。未经验证，不声称浏览器会话、登录态或预览权限可在聊天间共享。
- 未经用户确认的视觉候选不自动晋升正式设计；用户确认设计并授权收口后，直接完成回填、清理和必要验证，不为每个小操作重复请示。合并及原站发布仍按已有授权执行。
- 不直接推送 `main`，不强制推送，不丢弃未说明的工作区改动。无冲突的提交变化不构成停工理由；只处理真正影响本轮任务的冲突。

### 旧版质量与范围（以下视觉规则已过期）

旧版曾采用的参考图方向：近白页面、炭灰文字、白色普通卡与浅中性灰指标卡，16px Card 圆角、无阴影；静态内容以表面、对齐和间距分组，必要控件边界保留。品牌曜蓝 `#339FF2` 保持不变，主按钮使用深阶操作蓝 `#0B6FCA` 配白字，默认对比度约 5.07:1；链接和小字号操作文字使用独立深阶色。组件页以一句用途说明直接进入示例，详细规则集中于可展开的说明；侧栏显示已有规范页，完整规划与成熟度在组件总览。智绯 `#E0438F` 可用于 AI 来源侧边，必须保留来源文字并独立表达复核状态；生长荧 `#C2F25B` 保留既有证据语义。出彩来自比例、色彩、排版、状态与动效，不使用无语义装饰竖线或厚阴影。

每轮只验证受影响组件及必要组合：鼠标与键盘、焦点、可用状态、异步反馈、密度、Reduced Motion。复用现有构建和测试，不因无关历史问题重复全量核验或重建工具环境；未验证项目明确保留。

Local-first 迁移、固定端口、跨平台部署、Storybook 补建、Hugging Face 迁移和 MCP 排查均不是本流程的前置任务。不重搭站点、不重组工程、不升级无关依赖；已有工具需要时复用。

## OpenUI 研究范围

`/review/openui` 当前只用预置样例比较 OpenUI 受控组合与普通 React 组件，检查草稿、人工复核和失败回退。页面不请求模型接口，不需要登录或 API 额度；已有服务端接入代码仅保留供后续使用，当前不继续联调。

已确认组件可复用，状态保护由本站管理。三个预设任务的排列也可用普通 React 实现，目前未证明 OpenUI 在阅读效率、维护成本或自动编排上的优势。因此保留为可选试点，暂不纳入默认组件体系；真实生成和流式体验不属于本轮验收条件。

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
