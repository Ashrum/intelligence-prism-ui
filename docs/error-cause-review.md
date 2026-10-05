# ErrorCauseReview · 错因核对契约

2026-10-05 · P16 · PO 已批准新增目录；实现与自测不代表独立 Review 通过。入口 `/next/components/error-cause-review`，实现 `components/prism-next/error-cause-review.tsx`。

## 复用依据与取舍

- 本轮查阅本机固定 coss Frame / FramePanel、RadioGroup / Radio、Input、Textarea、Button，以及 Prism Badge / Button、QuestionInspector、ReviewMeter。用 Frame 承接只读事实，标准 Radio 做单选，一句说明沿用宿主的 Input，常驻标签；不为这一短属性使用长内容 Textarea。没有覆盖基础控件尺寸、颜色、圆角、阴影或字号。
- [ScoreReview](score-review.md) 已记录 coss particles `p-number-field-1`、`p-number-field-10` 的步进组合与 `p-textarea-5` 固定标签，[QuestionInspector](question-inspector.md) 已记录 `p-frame-1` 与 `p-toolbar-1` 的分区/操作组合。数字步进不匹配错因；固定标签、分区与标准按钮适用，但没有分类、草稿、保存回执及失效历史的完整契约。本轮尝试定位这些文档指向的 Supervisor 缓存，其目录已不存在；沿用仓库已有检索记录，没有声称再次读到缓存源码或联网刷新。
- Beautiful UI Approval Card / Recommendation Card 的现有检索记录见 ScoreReview 文档：前者承接执行前问答，后者承接建议接受，均不包含本任务的分类单选、说明必填、独立草稿与失效历史。没有复制 Beautiful UI 代码。QuestionInspector 是只读检查器、ScoreReview 处理分数与评分理由，向两者塞入错因编辑会混合不同事实和保存意图，因此按本次授权新增 ErrorCauseReview，由宿主在补充区组合。

## 公开 API

| 属性 | 契约 |
| --- | --- |
| `categories` | `{id,label,isOther?}[]`；ID 唯一，文案和顺序由宿主给定。`label` 支持 ReactNode / MathML；只有显式 `isOther` 才触发说明必填，不按汉字猜测。 |
| `value` | `{category,explanation}` 或 `null`，代表已保存事实；未知分类仍保留宿主 ID，不擅自映射到其他分类。 |
| `editing?`、`draft?` | 完全受控的编辑状态和独立草稿。默认只读。宿主收到 `onEdit` 后准备草稿并打开编辑；取消后由宿主恢复。编辑时草稿缺失，输入和保存不可用并说明原因。 |
| `onEdit?`、`onChange?`、`onSave?`、`onCancel?` | 仅发出修改、草稿变化、保存和取消意图。`onChange` / `onSave` 收到完整 `{category,explanation}`，不裁剪正文空白。缺少操作回调时对应操作禁用。 |
| `state?` | `{kind:'ready'}`（默认）、`{kind:'saving',message?}`、`{kind:'failed',reason}`、`{kind:'saved',message}`。不从按钮点击生成成功或保存中状态。saving 锁定编辑、保存、取消；failed 不重置草稿，显示原因和“重试保存”，仍走 `onSave`。 |
| `disabledReason?`、`saveDisabledReason?` | 前者禁止进入/修改/保存，后者只禁止保存；取消在非 saving 状态仍可用。原因可见并通过 `aria-describedby` 关联动作。宿主负责脏值、冲突、权限、版本、必需业务条件及幂等操作门禁。 |
| `history?` | `{id,category,explanation?,operator?,time?:{label,dateTime?},status?}[]`，全部只读。独立保存分类文案，避免分类表变化改写历史；`status` 原样显示“因重新批阅失效”等宿主事实，不自行判断失效。 |
| `title?`、`missingText?` | 默认“错因”“未提供”。空说明和缺少当前事实使用缺省文案。 |
| `editLabel?`、`hideEditAction?` | 默认“修改”、false。可改入口文案或隐藏组件内入口，宿主用自己的动作行控制 `editing`；隐藏时不显示仅针对入口的禁用原因（包括缺少 `onEdit`），编辑态的草稿、修改及保存门禁照常生效。 |

分类必须来自本次 `categories`；未选择或未知 ID 显示“请选择有效的错因分类。”并禁止保存。选中 `isOther` 且说明为空/纯空白时，Input 保持固定“说明 · 必填”标签，使用 required / aria-invalid 和关联说明并禁止保存。普通类别允许空说明；是否需要更多业务理由由宿主判断。保存或失败不会清空、修剪或提交草稿到 `value`。回执与历史均独立于当前输入。

编辑状态从 false 变为 true 时，尝试聚焦当前选中的可用单选项（否则首个）；退出编辑时返回组件内修改按钮。使用 `hideEditAction` 时内部没有可返回的入口，宿主负责退出编辑后把焦点交回自己的动作行。首次挂载不会抢焦点。真实键盘、焦点和读屏器表现由 Supervisor 浏览器验收。

## Workspace 接入对应关系

- `StudentPaperInspector.tsx` 的 `StudentPaperCauseEditor` 只替换视图：`cause` → `value`，宿主 `draft` / `editing` → 同名属性，`change` → `onChange`，`save` → `onSave`，`cancel` → `onCancel`。`onEdit` 继续由宿主保存基准值、创建 operation ID 并打开编辑。业务命令 `task.reviewCause`、dirty、原始版本、stale 和幂等处理继续留在 Workspace。
- `ai-error-causes.ts` 的分类表由宿主映射成 `categories`；“其他”显式提供 `isOther:true`。宿主原 `blocked` 可传 `disabledReason`，无改动/业务校验门禁传 `saveDisabledReason`；保存结果映射成 `state`，失败时保持 `draft` 原值。
- `InvalidatedGradingHistory` 中错因历史映射成 `history`；失效状态使用 `status`，操作人和时间保真映射。评分历史仍由原评分协议承接，不搬进此组件。组件没有 Workspace 私有类型、Store、Runtime、持久化或内置分类业务表。

## 交给 Supervisor 的浏览器验收清单

URL：`/next/components/error-cause-review`。逐项覆盖 light / paper / dark；组件页已有 320px 容器（内容宽度更窄）、长中文和 MathML 标签/历史。

1. “修改”后焦点到当前分类，键盘选择“其他”，空说明显示必填/校验原因且不能保存；填入说明可发出保存请求，未收到回执时仍保持编辑和原始事实。
2. 改动后取消，原错因不变，焦点返回“修改”；重复进入不会复用已取消草稿。
3. 失败夹具保留说明并显示“重试保存”；保存中全部编辑和动作不可用，显示“正在保存错因…”；禁止修改夹具显示宿主原因。
4. 核对历史失效文案、时间和长公式；窄容器下分类标签换行、操作可达，三主题均沿用标准控件与语义文字。无数据显示“未提供”，保存回执只显示宿主消息。

未验证范围：浏览器验收：按分工由 Supervisor 执行；真实服务、真实移动设备和读屏器未验证。自动化仅覆盖 SSR 结构、受控回调、门禁和状态事实，不代表视觉签名或实际保存服务验收。

## P17 · 可选紧凑密度（2026-10-05）

复用检索：本轮离线复读固定 coss Frame / Collapsible / Button / Tooltip 与现有实现；对照本仓库冻结设计页记载的 particles `p-frame-1`、`p-collapsible-1`、`p-tooltip-3/4`、`p-tabs-10`。旧 `/private/tmp/claude-503/` 注册缓存未找到，以上是已记录的匹配依据，未联网刷新上游。Beautiful UI Approval Card / Recommendation Card 沿用 ScoreReview 的既有检索结论：不匹配题目标记或评分/错因/整卷统计契约。现有组件公开属性扩展足够，不新建目录条目、不复制第三方代码。

`density?: "default" | "compact"`，默认 default。compact 将外层、编辑分类区和历史间距从 `space-y-3` 调为 `space-y-2`；只读 FramePanel 从默认 p-5 调为 p-3。分类、说明、历史、状态、门禁、字号和控件尺寸均不改变，不折叠任何信息。省略或 default 的 SSR 与 main a30c077 逐字节一致。

新示例 `/next/components/error-cause-review/compact` 提供同一数据 default/compact、三主题、320px、长中文/公式和可编辑草稿，原 demo 输出不变。浏览器操作“修改”→“其他”→留空/填写说明→保存/取消，检查必填门禁、焦点交接、取消保留原事实、保存只显示请求；三主题 × 320/390/1440px 比对尺寸与完整内容。浏览器验收：按分工由 Supervisor 执行。

## P18 · 修改入口组合（2026-10-05）

本轮复读固定 coss Button / Frame 与 Prism Button、现有 ErrorCauseReview；对照本页及 QuestionInspector / ScoreReview 记载的 particles `p-frame-1`、`p-toolbar-1`、`p-textarea-5` 和 Beautiful UI Approval Card / Recommendation Card 检索记录。按钮文案与可见性可由原组件可选属性表达，不需要新增组件或替换基础控件；未联网刷新、未复制第三方代码。

宿主外置入口时用 `<ErrorCauseReview hideEditAction editing={editing} draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} {...facts} />`；无需提供 `onEdit`。隐藏入口仅改变只读态动作呈现，不允许跳过 `disabledReason`、`saveDisabledReason`、必填说明、saving 与缺少回调门禁；保存/取消仍只发意图。`editLabel="修改错因"` 可用于保留内部入口的组合。两属性省略、undefined 或显式默认值保持 main 4669a62 原有 SSR 字节与 demo 输出。

Supervisor 补充验收：新“批阅功能栏八种状态”示例中外部“修改错因”→当前分类焦点→取消/保存请求→宿主焦点返回；确认只出现一个修改错因入口且无“修改操作未提供”残留。覆盖 light / paper / dark、380×844，既有 320px 长中文/公式夹具继续回归。浏览器验收：按分工由 Supervisor 执行。
