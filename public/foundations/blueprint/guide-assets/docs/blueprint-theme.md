# Foundations · 蓝图与夜图

2026-10-13 新增，候选状态。视觉语言参照 answer-me-with-html 站点的 blueprint 主题（MIT）：直角、1.5px 墨线、双线图框与坐标标尺、墨底字母块、偏移硬阴影。实现位于 `app/(next)/next/theme.css`（颜色令牌）、`app/(next)/next/blueprint.css`（几何与 `bp-*` 样式）及 [React 封装](../components/prism-next/blueprint/blueprint.tsx)。演示页为 `/next/foundations/blueprint`，从侧栏「蓝图组件」进入。


## 智能批阅 · P102（2026-10-22）

设计状态：候选实现，依据 PO 2026-10-22 批准的智能批阅 Version 5 样稿及 D2–D4；工程准入：未开始。Builder 自测不等同于 Supervisor Review、浏览器验收或 PO 批准。示例入口：`/next/foundations/blueprint#grading-p102`。

### D2 · 阶段身份色例外

仅在智能批阅内，曜青绿 `#C2F25B` 表示收卷阶段、曜蓝 `#339FF2` 表示 AI 批阅阶段、曜紫红 `#E0438F` 表示教师复核阶段。允许用途限于阶段细条、动效轨迹（含到达 / 批完描边）、当前作答聚焦框（P103 明确包括复核原件）和来源确为 AI 的 3px 来源条；均须配文字。答卷右上角标按冻结样稿标示复核入口，待处理文字仍用语义警告色。品牌三色不用于正文、标签文字、按钮底色、大面积底色、语义成功 / 警告 / 错误或进度填充。原 10/16 规则其余内容不变。P102 当轮不新建 AI 来源条组件、不改变既有来源判定。PO 2026-10-25 的 P118 决定覆盖该旧范围限定：授权 ScoreReview 显式 AI 来源呈现（3px 三色装饰条并配文字），不新增独立组件或内部来源判定。

| 新增扩展令牌 | 蓝图 / 夜图 | light / paper / dark 回退 | 用途 |
| --- | --- | --- | --- |
| `--bp-phase-receive` | `#C2F25B` | `var(--line)` | 当前收卷阶段条、光束、到达描边 |
| `--bp-phase-ai` | `#339FF2` | `var(--line)` | 当前 AI 阶段条、扫描线、批完描边 |
| `--bp-phase-review` | `#E0438F` | `var(--line)` | 当前复核阶段条、角标、当前作答聚焦框 |
| `--bp-paper-waiting` | `#8B929E` | `var(--border)` | 等待答卷虚线 |

所有令牌在根与显式 `data-agent-preview` 主题边界重置。新增样式只作用于显式 `bp-*` 类；不改原组件、coss、核心主题已有令牌值。嵌套核心主题回退中性，伪元素同样读取当地令牌，不继承外层品牌阶段色。

对纸面的计算对比度（非浏览器验收）：蓝图青绿 / 蓝 / 紫红为 1.30 / 2.84 / 3.91；夜图为 13.15 / 6.01 / 4.37。浅色青绿和蓝色不满足独立非文本信息 3:1，不承担独立信息，光束附墨线描边；编号、当前 / 完成 / 未开始文字和状态文字保留。等待虚线为 3.13 / 5.46，警告文字为 5.54 / 9.04，成功标记为 7.09 / 9.80（蓝图 / 夜图）。阶段色不是文字色，不宣称其达到正文 4.5:1。

### D3 · 动效与状态边界

| 动效 | 时长与曲线 | 触发及静态结果 |
| --- | --- | --- |
| 阶段条展开 | 380ms `cubic-bezier(.2,.8,.2,1)`，`scaleX` 从左展开 | 宿主改变 current；不使用宽度动画、不推进阶段 |
| 新答卷落位 | 320ms `cubic-bezier(.2,.8,.2,1)` | received 且 fresh；到达位移 / 缩放只执行一次 |
| 到达 / 批完描边淡出 | 600ms `ease-out` | received 青绿；graded / review 曜蓝，遵循冻结 Flow 样稿 `.fresh-*`，为 D3 一次性位移动效 ≤400ms 之外的描边淡出 |
| 当前作答聚焦框收拢 | 180ms `ease-out`，outline-offset 10px → 3px | focused 为真，2px 紫红轮廓保留；不移动键盘焦点 |
| 接收光束 | 1.6s `linear` 往复，3px + 墨线 | active 为真；按任务往复要求使用 alternate，样稿原为单向循环 |
| 答卷扫描线 | 2.4s `linear`，2px | active 为真；位置与淡入淡出沿用样稿 |

`prefers-reduced-motion: reduce` 初始及运行中生效：取消全部新增动画，轨迹与闪边隐藏，文字、语义标记、阶段细条与静态聚焦框保留。示例的「减少动态效果对照」只降低当前夹具的动效，不保存设置，也不能覆盖系统减少动态效果。无计时器、内部执行器或自动推进；动画结束不产生任何业务结果。

### 三组件 API 与复用边界

| 组件 | API | 边界 |
| --- | --- | --- |
| `BpSteps` | `variant?: "chips" / "bars"`，默认 chips；`steps: { id, label, meta?, tone?: "ink" / "receive" / "ai" / "review" }[]`；沿用 `current`（0 起始）、`label`、`status`、`className`、`children` | 扩展原组件；不传 variant 或传 chips 保留旧 SSR 字节；meta / tone 只在 bars 使用。done = current 之前，当前为 `aria-current="step"`，meta 直接可读；未提供 tone 用 ink。宿主只在真实线性流程中提供 current。 |
| `BpScanTrace` | `kind: "beam" / "line"`、`active: boolean`、`tone: "receive" / "ai"`、`className?` | active=false 返回 null；装饰 `aria-hidden`、不截获指针；宿主容器须 position:relative、明确尺寸与裁切，并提供可读进行中状态。 |
| `BpPaperSlot` | `state: "waiting" / "received" / "grading" / "graded" / "review"`、`name: string`、`code: string`、`detail: string`；`fresh?`、`focused?`、`href?`、`onSelect?`、`className?` | 无障碍名称为姓名 + 宿主状态文字。href 为链接且优先于 onSelect；仅 onSelect 为原生按钮；否则为静态 group。grading 内嵌扫描线，graded 显示语义成功 ✓；review 文字用 warning-foreground。fresh 仅在 received / graded / review 生效，宿主在真实事件后设一次，新事件前复位；重挂载前清除历史 fresh，组件不消费事件。focused 只表达当前作答，不暗示权限或移动焦点。 |

复用检索（离线）：原 `BpSteps` 已有线性阶段语义，直接扩展；Prism `Stepper` 的可导航 / 受阻等语义不替代本轮只读阶段条；`BpCard` / `BpFrameCard` / `PaperPreview` / `AgentCaptureScan` 为不同粒度，未找到五态答卷位或纯装饰轨迹。固定 coss Button / Card / Progress 与本地 selection / dialog / input particles、历史 p-tabs-1 检索记录未提供本任务几何；不新增第三方代码、不联网刷新注册表。D4 已批准补齐蓝图族，不增权威组件目录条目。

示例以按钮模拟到达、开始批阅、批完、待处理回执和进入复核，并可停止 / 恢复接收、选择答卷、重置。默认 12 个答卷位含五态，窄容器两列；只更改当前夹具数据。工作台业务接入、真实回执与生产服务不在 P102 范围。浏览器验收：按分工由 Supervisor 执行，覆盖蓝图 / 夜图 / light × 1280 / 390、系统动态减少动效、键盘与嵌套主题。

## 蓝图主题只换视觉 · P107（2026-10-22）

主题适配只换视觉、不改结构。适配既有组件的主题样式不得含 padding、margin、gap、width、height、min-height、display、position、overflow 等几何属性，也不得修改组件 TSX 结构。允许圆角、阴影、背景、墨线颜色 / 样式 / 粗细、文字颜色和编号字体等视觉属性；既有显式 `bp-*` 组件自身布局不等于主题覆盖。本节为后续适配约束，历史几何规则先列清单交审，不据此批量改写。PO 已接受的墨线粗细累积与标签指示条隐藏保留。

| 修复项 | 选择器与处理 | 组件站复核入口 |
| --- | --- | --- |
| V1 FramePanel | `[data-slot="frame-panel"]` 本体与伪元素直角、无柔和投影；已有边框使用 `--line-width` / `--line` | [Frame](/next/components/frame) |
| V2 题卡 | `article.prism-question[data-question-level="L2"]` 直角，以 `0 0 0 var(--line-width) var(--line)` 硬描边替代原 ring + 柔和投影，不新增占位边框；含 QuestionAnalysisCard 同族。L1 / L3 保持原阅读结构 | [题卡](/next/components/question)、[题目分析卡](/next/components/question-analysis-card) |
| V3 操作按钮 | `[data-slot="toolbar-button"]` 去除柔和投影及伪元素投影；保留现有 ring 层。`.bg-primary` 主行动采用既有 `--shadow-offset`，hover 用 `--shadow-offset-sm`；pressed / active / disabled 去掉硬投影，不添加位移 | [题卡](/next/components/question)、[Toolbar](/next/components/toolbar) |
| V4b 纸面小图 | `[data-paper-sheet-media] .rounded-sm` 覆盖 sheet 纸面、叠页、缩略图裁切层及点击层，直角并去除柔和投影；保留当前预览 ring 和键盘焦点 ring，不改成功 / 待处理圆形标记及外卡状态 | [附件](/next/components/attachment) |
| V6 题目详情 | `.question-detail-region` 仅保留纸面背景、虚线边、直角及夜图墨线；删除 padding、tabs gap、答案和资料 margin、网格 row-gap、mt-5 覆盖、fine pointer min-height，恢复组件原有间距与触控尺寸 | [题卡详情](/next/components/question) |

以上规则限定 blueprint / blueprint-night，并排除嵌套核心预览根、后代与伪元素；light / paper / dark 样式与令牌保持。V4 外卡状态桥接及 V5 页面选中样式不属于本单的 V4b 修复，不以本单宣称解决。

复用检索（离线）：核对已有 Prism QuestionCard / QuestionAnalysisCard / PaperCard、固定 coss FramePanel / Toolbar / Button 及 P105 card-frame 规则，现有 slot / data 属性已足够；不新增组件、依赖、令牌或上游代码，无需引入 particles，未联网刷新 registry。`tests/p107-reskin-gaps.test.mjs` 覆盖实际组件 SSR 选择器、主题隔离、视觉白名单、V6 几何删除与基线 CSS 一致性。浏览器验收按分工由 Supervisor 执行，覆盖两蓝图、核心三主题、嵌套预览、1280 / 390 和 hover / focus / pressed / selected 状态；静态测试不是视觉验收。

## 蓝图复查收尾 · P105（2026-10-22）

本轮仅修正 blueprint / blueprint-night 的四处样式遗漏；核心 light / paper / dark 的组件源码、SSR 与主题令牌保持不变。规则逐个排除嵌套核心预览根节点、后代及伪元素，不改冻结 coss，不新增组件、依赖或视觉令牌。

| 项目 | 修正与边界 | 组件站对照入口 |
| --- | --- | --- |
| 描边触发器微投影 | 复用 `border-input` 与稳定 `data-slot`，补齐 Combobox / Collapsible，并覆盖 Select、Menu、Popover、Tooltip、Dialog / AlertDialog / Sheet 的触发或关闭控件、Toast action、Toolbar button/link。静态态及伪元素无微投影；聚焦保留既有 ring / outline，移除柔和 shadow 层。主行动与 P104 浮层硬阴影不变 | [Select](/next/components/select#p105-triggers)、[Collapsible](/next/components/collapsible#p105-triggers) |
| 教材封面 | `textbook-cover` 改用 `--card` 实色纸面、1px `--line` 墨线、0 圆角；书脊细线及底部 AI 渐变细线改用 `--line`，文字、尺寸与切换教材行为不变 | [教材目录](/next/components/tree#p105-cover) |
| 题目栏分值条 | 题目行 `data-question-layout="row"` 的细条、全卷概览细条及其填充段均为直角；比例、色彩和状态标记保持宿主提供的既有值 | [题目栏](/next/components/question-rail#p105-rail) |
| 卡片框投影 | Card / CardFrame 静态无投影，子控件聚焦不恢复微投影；自身焦点 ring 保留，原 0 圆角与 1.5px 外框不变，可交互 `bp-card` 悬停硬阴影仍生效 | [Card](/next/components/card#p105-cards) |

上述入口增加两蓝图主题的同构合成数据；既有核心主题示例保留。触发器样例同时展示 `buttonVariants` 直接提供外观的原始 Collapsible slot 与 `render={<Button />}` 组合，避免只验证其中一种 DOM 输出。题目栏包含 80% 的实际行内填充与全卷概览，CardFrame 包含可聚焦按钮以复核焦点状态。

复用检索（离线）：核对已有 Prism TextbookDirectory / QuestionRail、固定 coss Button / Select / Collapsible / Card / CardFrame、已有蓝图主行动 / 卡片 / P104 浮层规则，以及本地 Select / Combobox particles 示例。本次使用已有组件与 slot 的 CSS 适配即可，不引入新 particles 或第三方代码；未联网刷新 registry。工程覆盖见 `tests/p105-bp-polish.test.mjs`，包括生产选择器 AST 的主题与嵌套隔离、硬阴影级联、P104 基线 CSS 与核心三主题实际组件 SSR 对照。静态与 SSR 检查不等同于视觉验收；浏览器验收按分工由 Supervisor 在 1280 / 390 执行，工作台同步清单随 Builder 报告交接。

## 原件预览浮动控件 · P104（2026-10-22）

原件预览的学生控制条、纸边工具坞，以及原件画布内的 toolbar / combobox-trigger / collapsible-trigger，在 blueprint / blueprint-night 下统一为 0 圆角、1px `--line` 墨线边与 `--popover` 实色纸面。硬阴影沿用现有 Popover / Select 的 `6px 6px 0 rgb(22 24 29 / 6%)`，夜图沿用 `6px 6px 0 rgba(0,0,0,.3)`，模糊半径为 0。工具坞承担外层边与阴影，内部滚动 toolbar 不重复绘制边与阴影；焦点轮廓沿用现有规则。

`surface-floating` 同族全部适配：学生切换面板的 Combobox 包装 span、学生刻度 / 题目栏 / 复核与分析工具提示、快捷键 Dialog、连续纸张工具条和 Foundations 材质样本。`--surface-floating-background:var(--popover)` 与 `--surface-floating-blur:0px` 仅在命中的浮动表面就地覆盖，`backdrop-filter`（含 WebKit）为 none，不改 theme.css 中核心三主题的 92% / 12px 材质。所有覆盖均限制两蓝图主题并排除嵌套核心预览根及后代；伪元素同样排除，去除残余圆角和装饰阴影。打印不保留新浮动阴影。普通页面的 Toolbar / Combobox / Collapsible 不因此改成浮层。

组件站对照入口：[原件预览浮动控件](/next/components/paper-preview#p104-floating)，包含 blueprint / blueprint-night / light 三份同构合成数据，复用现有学生控制条、连续原件预览、满分作答披露与快捷键表。打开「选择学生」、搜索 / 选择学生、切换「适合页面 / 适合宽度」、旋转当前纸、展开「满分 2 人」、打开「快捷键」，检查纸面、边线、硬阴影和焦点；窄屏保留控制条横向滚动与工具坞滚动。原有三主题示例仍保留用于嵌套隔离对照。

复用检索（离线）：已有 Prism StudentControlBar / PaperPreviewSurface / ReviewSwitcher / ReviewWorkspaceShortcuts 提供完整结构和行为；固定 coss Toolbar / Combobox / Collapsible 及已有 Popover / Select 蓝图规则提供稳定 data-slot 与硬阴影参考，本地 particles 无需引入新组合。未联网刷新 particles / registry，未引入第三方代码、新依赖、组件条目或视觉令牌。只新增主题 CSS 与示例组合，复用组件 TSX / API / 行为不变；Workspace 同步清单由交接报告提供，本轮未接入 Workspace。

浏览器验收：按分工由 Supervisor 执行，覆盖蓝图 / 夜图 / light × 1280 / 390，并复核 paper / dark 嵌套预览、浮层 portal 主题继承、键盘焦点、长中文与公式。自动化 CSS 选择器与 SSR 检查不等于浏览器视觉验收。

## 标题墨线 · P106（2026-10-22）

在 P105 `0965f49` 基线上扩展已有 `BpSectionCard` 与 `BpMinor`，不新增组件条目。成组标题、成果内分节标题可使用 ink；正文内部的次级小标题仍用 border，避免所有标题同等强调。

| 用法 | 输出与适用范围 |
| --- | --- |
| `<BpSectionCard titleRule title="任务范围">…</BpSectionCard>` | section 输出 `data-title-rule=""`；标题文字之后以空 `::after` 填充至 meta / action 之前，default 与 compact 密度均支持 |
| `<BpMinor rule="ink" label="任务设置" />` | 标题输出 `data-rule="ink"`；既有装饰线切换为结构墨线 |
| `<BpMinor rule="border">评分说明</BpMinor>` | 默认行为，保持 1px / `--border`；省略 rule 结果相同 |

墨线统一使用已有 `--line-width` / `--line`：白图 1.5px / `#1D2026`、夜图 1.5px / `#C9D6E8`。选择结构线宽而非固定 1px，是为了与章节结构墨线保持层级一致，区分正文内的次级细线。核心 light / paper / dark 的显式 bp 组件沿用已有中性回退 `--line:var(--border)`、1px；不改 theme.css 或任何既有令牌值。预览根会重新声明这些令牌，嵌套核心预览的根、后代与伪元素均使用本地回退，不继承外层白图 / 夜图墨色。

卡片标题墨线以 flex 填充，桌面最小 24px，垂直居中；≤760px 标题先独占一行，meta / action 随后自然换行，装饰线可缩短至 0，将空间让给文字。长中文与长文件名自然换行，不缩字、不省略、不裁切。空伪元素无可读内容，不改变标题的可访问名称、层级或按钮顺序。未传新参数时 DOM / SSR 与 `0965f49` 的前态快照逐字节一致；`titleRule={false}` 与 `rule="border"` 同样保留默认输出。

夜图源码令牌计算对比度：墨线与卡片底 `#0D1C31` 为 **11.62:1**，与页面底 `#081322` 为 **12.66:1**（sRGB 相对亮度计算；数值检查不是浏览器目检）。线仅作装饰，不代替信息文本。

示例：[标题墨线](/next/foundations/blueprint#title-rules)，含两种密度、meta / 可操作说明按钮、默认 border、长中文与公式、嵌套核心三主题。浏览器验收由 Supervisor 执行，覆盖白图 / 夜图 / 核心三主题、1280 / 390 及 760 断点。

复用检索（离线）：现有 BpMinor 已有 flex 伪元素细线，BpSectionCard 已有标题 / meta / action 插槽，足以完成本次增量；依照先复用 Prism 的顺序，不另造组件，不引入外部实现或依赖，也未联网刷新 coss registry。

## 复核原件聚焦 · P103（2026-10-22）

设计状态：候选实现，依据 PO 2026-10-22 对复核原件聚焦能力的决定；工程准入：未开始。扩展现有 `BpFrameCard`，不新增组件目录条目。示例入口：`/next/foundations/blueprint#frame-focus-p103`；按钮标明「演示事件，产品中由真实选中驱动」。Builder 自测不等同于 Supervisor Review、浏览器验收或 PO 批准。

| API | 表现与边界 |
| --- | --- |
| `focus?: "review"` | 宿主确认当前作答时传入，section 输出 `data-focus="review"`。2px outline、offset 3px，复用 `--bp-phase-review` 与 BpPaperSlot 的 180ms `ease-out` 收拢；取消 focus 即移除聚焦框。不移动键盘焦点。 |
| `swapKey?: string / number` | 宿主传作答身份（如 submissionId + questionId）；身份变化时仅重挂 `.bp-card-body` 内容层，执行一次 180ms `ease-out` 横移淡入：translateX 8px → 0、opacity 0 → 1。首次挂载及水合不播，同一身份重渲染不重播，A → B → A 每次切换均生效；不传则无切换动画。 |

内容层重挂会重置其子树局部状态；需跨作答保留的数据由宿主管理。标题、section 和标题栏 actions 保持挂载。省略两个新属性时，SSR 与 `1384f8c` 的固定前态快照逐字一致，既有 section 标题关联和状态文字结构不改。聚焦框仅为视觉补充，可访问性由宿主的 `aria-current` / 标题文字承担，组件不新增读屏文案、不推断当前作答、不由点击产生业务状态。

令牌沿用 P102：蓝图与夜图 `--bp-phase-review: #E0438F`，核心 light / paper / dark 为 `var(--line)`；根和每个显式主题预览边界均重置，嵌套核心预览不继承外层品牌色。无新增令牌、无核心令牌值修改、无通用组件视觉覆盖。夜图聚焦框对纸面 `#0D1C31` 为 4.37:1、对背景 `#081322` 为 4.77:1；蓝图对纸面为 3.91:1（计算值，非浏览器验收）。

`prefers-reduced-motion: reduce` 初始及运行中均取消横移、淡入和轮廓收拢，内容和 outline 直接出现；示例的减少动态效果开关也覆盖本轮动效，不能覆盖系统减少动态效果。无计时器、动画结束回调、内部执行器或自动推进。

复用检索（离线）：已有 `BpFrameCard` 满足原件 section / header / body 结构，`BpPaperSlot` 已提供同令牌和同曲线聚焦写法，直接复用；固定 coss Card / Button 与本地 particles 无需替换现有卡片，不新增第三方实现。本轮只扩展呈现能力；Workspace 同步、真实作答接入与服务验证另行执行。浏览器验收：按分工由 Supervisor 执行，覆盖蓝图 / 夜图 / light × 1280 / 390、减少动态效果与嵌套主题。

## 图纸坐标、图形标注与入口行 · P87（2026-10-19）

来源：Workspace《入口与 Intro 页面规划设计》v0.6（2026-10-19）§3.3、§6.3 C、§6.4，以及同日入口与 Intro 视觉稿。只提炼已获认可的标尺追踪、瞄准框 / 引线标签和单目标入口行；不移入页面轨道、光束、转场或角色文案。入口为 `/next/foundations/blueprint#entry-annotations`，图纸 E / SHEET 05 / 05。

| 组件 | 参数与用途 | 边界 |
| --- | --- | --- |
| `BlueprintSheet` | 新增 `rulerTracking?: boolean = false`；`rulerMark?: { column: number; row: number }`（或 null） | 列 0–7、行 0–3；显式 mark 优先于指针，`null` 清空并关闭追踪，`undefined` 允许追踪；越界 / 非整数 mark 不显示。不传新参数保持 main f472fa6 的 SSR 原样。 |
| `BpTargetLock` | `x`、`y` 为宿主 viewBox 坐标；`size = 32` 为四角框总宽；`active`；`halo = false` | 在宿主 SVG 内输出 `g`；激活时 380ms 从 2.4 倍 / 45° 收拢。可选虚线环 7s 一周；仅呈现外部激活事实。 |
| `BpDiagramCallout` | `x`、`y`；`viewBox: [width, height]`；`direction: ne / nw / se / sw`；`code?`、`label`、`meta?`、`active` | HTML 百分比定位、32px 斜线与水平段、自然换行的墨底标签和标签外等宽元信息；code 使用 Geist Mono Blueprint。 |
| `BpEntryRow` | `code?`、`icon?`、`title`、`description?`、`actionLabel`、`emphasis?`、`href?` / `target?` / `onSelect?` 与对应原生属性 | 有 href 为 a，否则 button type=button；onClick 先运行，未 preventDefault 时再发 onSelect。原生 hover / focus / ref / disabled / download 等属性按元素透传。 |

图纸按自身边界等分 8 列 × 4 行，细指针移动时四边同一坐标同步 `data-active`；触摸不追踪，离开清除指针状态。标尺始终 `aria-hidden`，沿用现有 max-width:760px 隐藏规则，没有新增过渡。宿主控制外部节点时，负责把节点在整张图纸的位置换成坐标；本页按真实节点边界测量，并在图纸 / SVG 尺寸变化后重新计算。

标注容器必须 `position:relative`，HTML 覆盖层与 SVG 的实际 viewBox 画面同宽高（避免 preserveAspectRatio 留白造成偏移）；width / height 必须为正、x / y 在范围内。调用方选择留白充足的方向；长文字自然换行，组件不猜测避障或业务关系。两种图形标注均 `aria-hidden`、不接收指针，**只复述页面上已有的文字，不能作为唯一信息来源**。本页节点关系与当前坐标另有可读图注，名称和说明保留在入口行中。

入口行的可访问名称由 title、description 和 actionLabel 对应的 `aria-labelledby` 组成，code、装饰图标和箭头隐藏；文本参数使用 string，icon 只允许无交互装饰内容，不放按钮、链接或可聚焦元素。行最小高度 68px，换行自然增高；小于 760px 动作移到说明下方；同组用留白和悬停浅底区分，**不画行间分割线**。焦点保留 2px ring；emphasis 的动作文字加粗，在蓝图主题使用 link 色；分组继续使用 `BpMinor`。

样式集中在 blueprint.css 的 P87 区块，新增组件均显式 `bp-*` 选用。核心主题用 foreground / accent / head-bg / head-fg 等现有中性令牌；仅两蓝图的强调色规则带主题及嵌套非蓝图预览排除选择器，不修改普通组件、theme.css 或依赖，不新增 Token。CSS `prefers-reduced-motion` 在初始与运行中生效：取消收拢、光环循环和箭头位移，保留静态框及标尺反白；无计时器、自动状态推进或延迟操作。

复用检索（离线）：已有 BlueprintSheet / BpMinor / BpCard 提供纸面、标题和整卡目标，但没有图形锁定、HTML 引线及无分割入口行；固定 coss Button / Card 与本地 particles（selection、input、table）提供控件组合，没有上述标注契约。因此扩展 Sheet，新增三种 bp 呈现导出。受运行约定限制，未联网刷新 coss registry / particles，不声称检索最新远端；未复制第三方实现。沿用已有 bp 呈现件登记方式：本节 API 表和 blueprint 模块导出为入口，不增加正式 catalog 的独立组件页，也不重复写死总数。

工程验证见 [当前状态](blueprint/STATUS.md)；SSR 与事件探针不是实际浏览器验收。浏览器验收：按分工由 Supervisor 执行；须覆盖 blueprint / light、320 / 1280、鼠标 / 键盘、受控 null、动态减少动效及嵌套核心预览。

## 夜图恢复 · 2026-10-16

用户批准接续原 BPv9 夜图交接，以已合入警告色修复的 main `7737245` 为基线。`blueprint-night` 位于主题菜单「蓝图」之后，共用蓝图几何、当前通用组件适配与编辑式排版；保留 `prism-v1-theme` 存储键。next-themes 不再猜测自定义主题的原生色系，各主题由原有 CSS `color-scheme` 声明控制。当前四主题令牌（包括白图警告色 `#995909`）、核心曜彩图表配色和冻结 coss 原始字节不变。

夜图采用既有 BP.dark 映射：画布 `#081322`、纸面 `#0D1C31`、正文 `#E6EDF7`、次要文字 `#A9B8CC`、交互蓝 `#6EA8FF`、结构线 `#C9D6E8`；成功与警告填充缺少独立设计值，沿原交接回退到 `#62BD89` / `#E8A33D`，前景分别为 `#7FD6A0` / `#F0B14A`。白图与夜图的共享规则排除核心主题预览；夜图专属阴影也排除白图预览。预览边界重新计算 radius / muted 别名，沿用当前 main 的隔离修复。

夜图图表继续采用交接时的独立回退系列 `#86C5FF / #F296C2 / #99DFB4 / #F4CC86 / #BDACED / #B6BEC9`，箱线图为 `#86C5FF / #F296C2 / #365B7B`，连续色阶为 `secondary → #76A9D2 → #1769AA`。测试分别锁定夜图与 P69 核心深色的预期值，不再断言二者相同。图表仍从 `chart-palette.ts` 读取颜色，CSS 图表令牌与其桥接；提示框沿用直角、墨线和强调蓝硬阴影。

**已知设计缺口保留：** 夜图普通分隔色 `#23385A` 对画布 / 纸面约 1.58 / 1.45:1，只能作为弱分隔，结构与控件使用 `--line`。沿用白图的白色半透明图案在夜图浅色系列上的对比度不足 3:1；夜图图表色与图案尚待设计确认，不能据此宣称黑白打印已通过。Recharts 仍主要靠颜色区分系列。实体打印、真机与读屏器验收继续单列。热力图窄于 400px 且可见数据披露可用时隐藏格内数字；数据披露隐藏时保留数字，原三核心主题不改变。

通用描边按钮、Badge 与未选中 Toggle 在夜图中使用纸面，悬停使用现有 accent；输入表面使用设计稿的 `#0A1729`。这避免 `dark:bg-input/*` 把浅色结构墨线混成浅底。实色危险按钮使用夜图深墨文字（Badge 在 P97 改为纸面与语义描边，见下节），加载态保留透明文字与可见加载图标。所有修正限于夜图并排除嵌套白图与核心预览；冻结 coss 仍不改。浏览器实测普通描边悬停为 `#E6EDF7` / `#16305A`，实色危险按钮为 `#081322` / `#FF7070`。

当前验证与合并记录见 [STATUS](blueprint/STATUS.md)。 本轮[工程记录](blueprint/evidence/night-20261016/engineering.json)、[浏览器记录](blueprint/evidence/night-20261016/browser.json)、[检查边界](blueprint/evidence/night-20261016/checks.md)与[独立代码审查](blueprint/evidence/night-20261016/review.md)单独归档；可查看[夜图控件](blueprint/screens/night-20261016/blueprint-night-1280-controls.jpg)和[窄屏对话框](blueprint/screens/night-20261016/blueprint-night-320-dialog.jpg)。原 stash / 补丁保留；历史 `evidence/v9/` 属于另一轮，不以旧夜图日志覆盖或冒充本次结果。

## 对象卡片与成果分节 · P79（2026-10-16）

两种显式选用的 `bp-*` 呈现组件位于 `components/prism-next/blueprint/blueprint.tsx`，不登记为正式组件目录条目。五主题（light / paper / dark / blueprint / blueprint-night）读取当前位置的既有令牌；不新增令牌、字号、阴影或运行状态，不修改普通 coss / Prism 组件。

| 组件 | 使用场景 | 边界 |
| --- | --- | --- |
| `BpFrameCard` | 一个可独立识别的对象被整体框住阅读：原件、文件、打印或导出预览、外部来源片段 | 墨色标题栏写对象名；不用于消息气泡、输入器或普通列表项 |
| `BpSectionCard` | 成果内有先后或编号意义的分节：试卷大题、任务详情的范围 / 阶段 / 异常、复核分组 | 字母必须对应真实分节顺序；不在对话消息流逐条使用，不嵌套 SHEET 标尺 |
| `BlueprintSheet` | 整张成果图纸的外框与标尺 | 负责成果面层级；不为每个内部小节重复画图纸 |
| `BpPaneHead` | 轻量面板头 | 只提供头部，不负责整卡外框、语义标题或内容区 |

`BpFrameCard` 接收 `title: ReactNode`、可选 `status: { tone: "success" / "warning" / "danger" / "info" / "neutral"; label: ReactNode }`、`actions`、`headingLevel`、`children`、`className` 与普通 section 属性。标题栏使用 header，默认 h3，支持 h2–h6；默认通过稳定唯一 id 的 `aria-labelledby` 关联标题，宿主可显式覆盖。状态必须提供可见文字，只写真实可得事实（如“已解除同步”“第 3 / 3 页”“加载失败”），未知就省略；不写无依据的 live、耗时。省略 status 时不输出状态容器或色块；组件不主动建立 live region，也不从点击推定执行状态。

`BpSectionCard` 接收 `letter?: string`、`title`、`meta?: ReactNode`、`action?: ReactNode`、`headingLevel`、`children`、`className` 与普通 section 属性。标题同样默认 h3 / 支持 h2–h6；字母属于可读标题，不设 aria-hidden；未提供或空白 letter 不渲染字母块。meta 使用等宽语义元信息字号，仅写真实文件名、页码或计数；action 为调用方提供可访问名的图标按钮槽。需要代码时直接嵌现有 `BpCodebox`，不另造代码块。

整卡直角、无阴影、1.5px 外框；分节表头下方同宽结构线，正文留白。Frame 标题栏使用 `--primary` / `--primary-foreground`；方块用 success / warning / destructive / info，neutral 用 primary-foreground，并用 primary-foreground 描边确保反相标题栏上边界可辨。语义色填充本身不保证在五主题都达 3:1，状态由文字完整披露；对比数值与浏览器边界见本轮证据。核心主题的 `--line` / `--head-bg` / `--head-fg` 沿现有中性回退；嵌套预览就地读取令牌，不沿蓝图祖先强制重绘。表头、操作槽可换行，标题与元信息可收缩并断长词；320px 的实际布局、焦点与视觉由 Supervisor 验收。

示例入口 `/next/foundations/blueprint#object-section-cards`：原件使用现有两份扫描夹具；按钮切换夹具序号，缺图显示“未提供原图”，不假称网络加载失败；试卷实际包含 A 选择题和 B 填空题，计数对应页面内容。图标按钮可展开选择题作答说明。完整 [实现与复用记录](blueprint/evidence/cards-20261016/inspection.md)、[浏览器验收清单](blueprint/evidence/cards-20261016/browser-checklist.md) 与 [当前状态](blueprint/STATUS.md) 分开记录。浏览器验收：按分工由 Supervisor 执行；本轮未修改或验收 Workspace 接入。

## 教师消息轻背景 · P78（2026-10-16）

按蓝图 §6.1 与 Workspace W193 的 P-R4-01，blueprint / blueprint-night 的教师气泡改用既有 `--secondary` 轻背景与 `--foreground` 正文，保留右对齐和直角，不加气泡边框/阴影。白图为 `#F3F5F8` / `#16181D`，夜图为 `#12253F` / `#E6EDF7`；夜图的“轻背景”指既有次级表面层级。附件文字、图标及现有边框继承正文色。正文链接保留下划线并使用 `--link`；旧 R1 白色链接焦点环改为两蓝图统一的 2px `--ring` 外环、2px offset、无叠环。

核心 light / paper / dark 保留原 foreground 底 / background 反相文字与圆角；每条新规则排除嵌套核心预览根与后代。AgentMessage API、附件组件、共享布局、主题令牌、冻结 coss 和依赖不变，不新增 variant 或组件。此项不调整 PromptBar / AgentSurface 的既有焦点规则。

正文与附件对气泡：白图 **16.259790:1**、夜图 **13.083512:1**；链接与焦点对气泡：白图 **5.587005:1**、夜图 **6.392999:1**。焦点对相邻 card / background 均 ≥4.5:1，见 [令牌与规则数值](blueprint/evidence/user-bubble-20261016/contrast.json)。这是工程计算，未代替浏览器测量。Builder 五项工程检查通过，全量 **2216/2216**，定向 **18/18**，回退变异 **17/17**；[实现与复用记录](blueprint/evidence/user-bubble-20261016/inspection.md)、[浏览器交接清单](blueprint/evidence/user-bubble-20261016/browser-checklist.md)与 [STATUS](blueprint/STATUS.md)保留证据边界。浏览器验收：按分工由 Supervisor 执行；组件站结果不表示 Workspace 已同步或真实服务已接入。

## 顶栏与侧栏蓝图适配 · P76 / P77（2026-10-16）

blueprint / blueprint-night 下，AppBar、SpaceBar 与组件站顶栏改用 card 纸面和结构底线；SpaceBar 展开左段使用 `--sidebar`，与侧栏同底（核心三主题等同 `--secondary`），收起态仍透明，父级 card 底不覆盖子元素背景；P77 将一级当前项加强为 36px 高直角实块，使用 `--primary` 底与 `--primary-foreground` 文字 / 图标；悬停保持实块，去掉 P76 下划线。非当前项悬停仍为 accent 直角底。身份、图标、空间切换与空间 / 个人菜单项直角，空间触发器采用 card + 1px border；数字角标保持原样。Sidebar 选中为 accent + foreground + 左侧 inset 2px 墨线，悬停 secondary；分组标题仅改 muted-foreground，保留语义字号。56px 折叠图标轨的按钮为 40×40，保持左墨线；Tabs / Toggle 原选中态不变。

导航运行时适配限于 blueprint.css；核心三主题、嵌套核心预览根 / 后代 / 伪元素、主题令牌和冻结 coss 保持。一级导航使用强选中以便快速定位当前工作空间；密集侧栏继续 accent + 左墨线轻选中，SpaceBar 不变。AppBar 56px / SpaceBar 48px 和断点不变。P77 选择纸面上的单一 2px `--ring` 外环、偏移 2px；白图为蓝色，夜图沿用已有夜图 ring。36px 导航项垂直居中，导航滚动容器两端各留 4px，容纳外环并避免首末项裁切；伪元素不再画第二道焦点框，box-shadow 不叠环。实际裁切、焦点与相邻背景仍须 Supervisor 浏览器复核。

P76 历史基线为 P75 提交 780c2ef；P77 基线为 main 7ad8dbc，分支 feat/blueprint-nav-folio。Builder 提供实现与 SSR / CSS 规则测试，工程结果见状态记录；独立 Review 与浏览器验收交 Supervisor。组件站与真实 Workspace 接线分别验收，不从组件实现推断已接入。参见[复用与实现说明](blueprint/evidence/shell-nav-20261016/inspection.md)、[浏览器清单与接线要求](blueprint/evidence/shell-nav-20261016/browser-checklist.md)及[当前状态](blueprint/STATUS.md)。

## OLE Agent 前端规范 · 正式版（2026-10-16）

[下载 OLE Agent 前端界面设计规范 · 蓝图 v1.0](OLE_Agent_Frontend_Blueprint_v1.0.md)。这是教师工作台的正式设计基线，包含首期教师端Token用量、M01—M89映射、CI-01—CI-16及AT01—AT32；组件主题实现与已验边界仍以本页各项证据为准。

**设计定稿；实施准入未通过。** 本轮发布文档并同步组件仓规则，不宣称已修复输入器、接通服务或通过真实批阅链路。路径A仍是待服务签认的目标脚本。正文只维护上述单文件，本站提供生成的同源副本；[GitHub 原文](https://github.com/Ashrum/intelligence-prism-ui/blob/main/docs/OLE_Agent_Frontend_Blueprint_v1.0.md) 可追溯后续变更。

### 主行动按钮悬停修复 · 2026-10-15

用户指出“预览主行动”悬停时文字不可读。根因是通用 hover 浅底覆盖 primary 墨底，但文字仍为白色；现已在 primary hover 中成对保留主题前景底色与卡片文字色。蓝图下默认、悬停、键盘焦点与按下均为17.76:1，四主题 × 320/1280px复验通过。原有按钮未取消，仍位于“按钮与标签页”；顶部补充了直达入口，保留新增通用组件与原样板。见 [修前测量](blueprint/evidence/hover-20261015/before.json)、[修后测量](blueprint/evidence/hover-20261015/browser-results.json)、[桌面截图](blueprint/screens/hover-20261015/blueprint-1280-hover-after.png)、[窄屏截图](blueprint/screens/hover-20261015/blueprint-320-hover-after.png)、[检查与审查](blueprint/evidence/hover-20261015/checks.md) 和 [全量失败集合对照](blueprint/evidence/hover-20261015/failure-delta.json)。本轮修复不改变第四主题候选状态。

### 标尺密度微调 · 2026-10-15

按用户“降低宽度、减小字号，具体数据由你决策并实施”的授权，第四主题的外侧标尺带从 18px 收至 14px（约减少22%），坐标数字从 12px 收至 10px（约减少17%）。四边厚度、端点偏移与内框共用同一尺寸，保持工程图纸的连续结构；40px 内容侧内距、标题与 SHEET 编号不缩小，让标尺退到辅助层级。采用 rem，根字号放大25%时标尺带与数字分别变为17.5px与12.5px。

10px 仅为本次明确授权的 aria-hidden 装饰坐标例外，不新增公共字号令牌、不改变 ui-meta 或图表刻度。规则限定 blueprint，并排除嵌套核心主题预览；760px 媒体或容器断点继续隐藏标尺。Chrome 实测四主题 320px / 1280px，页面无横向溢出，蓝图默认及放大后的坐标无裁切。见 [本轮测量](blueprint/evidence/ruler-20261015/browser-results.json)、[调整前](blueprint/screens/ruler-20261015/blueprint-1280-before.png) 与 [调整后](blueprint/screens/ruler-20261015/blueprint-1280-after.png)；当前检查和限制见 [状态记录](blueprint/STATUS.md)。

## 完善路线与当前执行（更新于 2026-10-16）

用户已在本会话批准执行完善规划，并要求本文件记录到智能曜彩站点。既有样板、通用组件两批及主行动悬停修复保留各自证据；2026-10-16 用户进一步批准蓝图编辑式排版、Geist Mono 子集与每 3 个已完成小轮进行完整回归的新节奏，当前范围见下方。Agent 业务页面与布局仍暂缓，本轮不扩展其正式规范的实施范围。此次批准不等于所有页面的视觉验收已完成。

| 阶段 | 目标 | 完成依据 |
| --- | --- | --- |
| 1 · 视觉规则 | 明确网格、双框、编号、标题、留白及主要行动的适用位置；当前校准编辑式章节 / 小节与有限字体使用 | 现有蓝图样板的前后对照与本轮字体、标题及窄屏专项 |
| 2 · 组件状态 | 保留两批已验范围；第二批包括 InputGroup、Combobox、ToggleGroup、Progress、Menu、Popover、Tooltip、Toast、AlertDialog、Sheet、Skeleton、Empty | 每轮按实际样例记录键盘、鼠标、窄屏和主题隔离结果，逐项区分通过与未验 |
| 3 · 密集内容 | 检查列表、图表、小图例、连续色阶及打印 | 可读性、零值与缺测、灰度和原生打印证据 |
| 4 · 教师场景（暂缓） | 待通用组件收敛后，再规划 Agent、试卷阅读和学情报告的主题密度 | 当前不改 Agent 业务布局；后续沿用既有业务流程进行独立场景评审 |
| 5 · 发布候选 | 收敛主题隔离、核心主题回归与剩余限制 | 独立 Review、视觉确认、发布版本及可追溯证据 |

每批保持第四主题、核心三主题及轻量 Blueprint 页面实验的既有边界；不修改冻结 coss 源码、不增加依赖、不把示例中的按钮点击解释为真实业务执行。具体实现、验证与剩余问题统一记录在 [蓝图当前状态](blueprint/STATUS.md)，本表不代替验收结论。

站点记录采用本 Markdown 生成的安全阅读视图及原文下载，避免另写一份摘要作为第二份规范。v117 文档发布时，Site 轻量页面实验与 GitHub 第四主题基线不同；随后用户授权三方同步，统一源码并保留两条实验线。上线状态以实际发布记录为准。

### 成果标题 folio · P77（2026-10-16）

folio 只呈现真实定位事实，由宿主选择，不由组件根据点击、数组猜测业务顺序或生成版本：

- 有真实序列（题目分页、原件页码、作答份数等当前项 / 总数）时用 `SHEET 03 / 03`，数字至少两位补零，不截断三位及以上数值。
- 无序列但有真实已保存版本时用 `REV 01`，来源为版本号 vN；未保存草稿不显示 REV。
- 同时有序列和版本时只显示 SHEET（位置优先）；都没有则省略 folio。普通章节编号仍用 SECTION，不把章节序号当作成果页码。
- `value` 是宿主给定的事实字符串；组件只去首尾空白、为纯数字或数字序列补零，并将 REV 的 vN 规范为 NN。非数字旧标签保持可读，不从任意 ID / 版本描述中提取数字。缺省或空白 value 不输出元素或前缀。
- folio 采用现有 `.bp-section-folio`：Geist Mono Blueprint、`text-ui-meta` 对应语义字号、muted-foreground、右对齐与窄屏换行。没有新增字号或令牌。
- 是否 `aria-hidden` 由“标题区是否已有同等可读信息”决定：版本栏、标题说明或分页器已完整呈现时传 `folioAriaHidden={true}`；否则省略或传 false，保留读屏信息。组件不分析 ReactNode、不自动隐藏，也不隐藏标题或其他元信息。

[蓝图示例页](/next/foundations/blueprint#artifact-folio) 复用现有 `artifactOutputExamples.paper.output` 的 ready 文件版本（v2 → REV 02）及 `continuousPreviewPages` 的两份作答（SHEET 01 / 02，可切到 02 / 02）；标题说明重复完整定位信息，因此这两处 folio 显式对读屏隐藏。第三例没有序列 / 已保存版本，不显示 folio。均为现有演示夹具事实，不称为真实学校记录。实现 / 复用与未验边界见[本轮说明](blueprint/evidence/nav-folio-20261016/inspection.md)，[浏览器清单](blueprint/evidence/nav-folio-20261016/browser-checklist.md)。

### 编辑式排版与 Geist Mono 子集 · 2026-10-16

用户批准本轮实施，开工基线为 `9b5ac0c389abb5fb232b0356a920a60706d86e27`、Site v123，分支 `feat/blueprint-editorial-type`。本轮实施完成、定向检查通过，计为新检查周期的第 1/3 轮，发布以最终部署记录为准；只改既有蓝图章节 Header、`BpMinor` 与有限字体呈现，不新建规划文档或组件目录项，不改 Agent 业务布局、核心三主题普通组件及冻结 coss。

章节标题使用现有 20/30 语义角色，中文小节为 16/24，小节索引、folio 和图注编号为 12px 元信息。章节章号保留默认 48×48 墨底纸色块，使用既有 `stat-display` 24px / 32px、真实 500 字重；长代码仍可随内容增高。标题组间隔 12px，章节保留 `--line-width` / `--line` 结构墨线，`BpMinor` 使用 1px `--border` 细线。普通章节标记 SECTION，SHEET 保留给真实图纸，不能将所有区块包装成图纸语义。窄屏 folio 可以换行，标题使用正常中文断行，不缩字或隐藏有意义编号。

现有蓝图封装中的 `BlueprintSectionHeader` 仅呈现章节头，不生成图框或标尺；props 为 `title: ReactNode`、可选 `description`、`code: string`、`folio: { kind: "sheet" 或 "section" 或 "rev"; value: string }`、`headingId`、`headingLevel: 2 或 3`（默认 2）及普通 header HTML props。code 是有意义的可读章号，不设 aria-hidden；folio 按显式 kind 输出 SHEET / SECTION / REV，不推断业务类型；Header / Sheet 都支持 `folioAriaHidden?: boolean`，默认可读。`BlueprintSheet` 的 letter / sheetNo / rulers / headingLevel 和 section props 保持兼容，新增同类型可选 folio；两者同时传入时以 folio 为准，包括显式空 value（不回退旧 sheetNo）。内部组合 Header，原装饰标尺继续 aria-hidden。`BpMinor` 新增可选 code、label 和 headingLevel（2–6，默认 3）；label 未提供时回退 children，id / className 继续透传，不自动拆解历史文本。`BpFigCap` 继续输出段落，不升为章节标题。这些为现有展示封装的组合调整，不新增目录条目。

Geist Mono 采用本地 WOFF2 子集，只用于章号、小节索引、folio、图注编号和英文短标签；中文 UI、正文及数学内容继续沿用现有 UI 栈和 STIX Two Math，不切换公共 `font-mono` 或整页字体。来源固定为 [vercel/geist-font 1.4.2](https://github.com/vercel/geist-font/tree/4d655731f83507f0258ce5541c297b6553d5d081)，提交 `4d655731f83507f0258ce5541c297b6553d5d081`，许可为 [OFL-1.1](https://raw.githubusercontent.com/vercel/geist-font/4d655731f83507f0258ce5541c297b6553d5d081/OFL.txt)。许可副本、来源和生成清单随资源保存在 `public/fonts/blueprint/`，未增加 npm 依赖。

| 字重 / 本地文件 | 字节数 | SHA-256 |
| --- | --- | --- |
| 400 · `geist-mono-latin-400.woff2` | 10768 | `be4d974db167fbe4d7ebd11dcee64b98dc269aa7db72f815f79725e33dd961c5` |
| 500 · `geist-mono-latin-500.woff2` | 11048 | `15be64e881aeec1fd90c34e9c895cbc54fbd479a632763b67f52df910cd45e1c` |

两份产物均为实际 204 个码点、321 个 glyph；字符范围为 `U+0020-007E, U+00A0-00AC, U+00AE-00FF, U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2030, U+2032-2033, U+20AC`。这是实际保留字符，不声明未覆盖字形。OFL 副本 SHA-256 为 `1781d2806a07d91c4edf4740b88449fab7d0eadad53f7c351b94cd4d4eb8c00f`；两份 WOFF2 和许可的本地散列已核对。`scripts/subset-blueprint-mono.py` 固定上游源散列，使用 fontTools 4.60.1 / Brotli 1.1.0，可通过 `--check` 在内存重建并核对产物字节；该复现检查已由 Builder 执行通过。生成的 `blueprint-fonts.css` 从 theme 同级导入，CSS family 为 `Geist Mono Blueprint`，400 / 500 静态字重、normal、`font-display: swap` 与实际 unicode-range；有限选择器回退到既有 `var(--font-mono)`，不全局替换字体。

每轮针对受影响内容、交互和代表窄屏进行验证；每累计完成 3 个已授权小轮做完整回归和独立综合审查，在 [状态记录](blueprint/STATUS.md) 维护计数与下一触发点。共享令牌、基础交互或跨组件规则等高风险变化按实际影响提前扩大检查。本轮首次字体单列缺字、失败回退、混排与布局专项，未运行全量工程测试或上轮完整组件交互矩阵，也不复用第二批通过数字。每次发布仍须生产构建和独立轻量 diff / 关键证据审查；最终生产构建在文档及 guide 冻结后执行，结果记入 PR 和最终部署记录，不为回填本文重复构建。

[本轮工程记录](blueprint/evidence/editorial-20261016/engineering.json)显示 TypeScript 0 错误、语义字号 308 个 owned TSX 通过、现有组件 / API 定向测试 10/10 通过，字体资源检查及 Python 3.12.14 / fontTools 4.60.1 / Brotli 1.1.0 的 `--check` 字节复现通过。记录时间为结果汇总时间，不当作各命令开始时间。首次二层 CSS 导入曾导致开发页 500，已改为 theme 同级导入；重启唯一开发服务后恢复 200，最终浏览器记录来自修复后的页面。

[浏览器专项](blueprint/evidence/editorial-20261016/browser.json)覆盖 Chrome 的 1280×960 / 320×960 桌面视口模拟：6 个章节 Header、18 个分节标题和所有 folio 均保留；20/30、16/24、12/18 与章号块 24/32 / 500 的实际计算值符合角色。Chrome 实际字体查询确认 folio 命中 GeistMono-Regular、分节索引命中 GeistMono-Medium，中文标题使用系统中文字体，MathML 的数学字形使用 STIX Two Math；不只凭 CSS 声明判断字体加载。两份 Geist 字体在正常会话均为 loaded；在隔离上下文阻断这两份 WOFF2 后均为 error，320px 仍保留完整页序与可读文本，页面 scrollWidth 为 320。浏览器缓存计时中的 0 字节不是文件大小，资源大小以上表本地字节为准。

[改动前样本](blueprint/evidence/editorial-20261016/before.json)与修后记录中的四主题普通 body / Input 属性逐项相等；InputGroup 整组仍有 2px 蓝色焦点线，内部输入不产生第二道 outline。该回归仅覆盖所记录属性和操作，不外推为全站像素一致。人工查看[桌面图纸标题](blueprint/screens/editorial-20261016/blueprint-1280-actions.png)、[窄屏图纸标题](blueprint/screens/editorial-20261016/blueprint-320-actions.png)、[桌面章节](blueprint/screens/editorial-20261016/blueprint-1280-second-batch.png)、[窄屏章节](blueprint/screens/editorial-20261016/blueprint-320-second-batch.png)和[字体失败回退](blueprint/screens/editorial-20261016/blueprint-320-fallback.png)，确认中文与索引层级、分组线和窄屏 folio 换行；不只以无横溢判断视觉通过。

具体过程与边界见[定向检查记录](blueprint/evidence/editorial-20261016/checks.md)。本轮[独立轻量审查](blueprint/evidence/editorial-20261016/review.md)结论为 PASS WITH NOTES；guide 同步校验与最终生产构建仍是发布门槛，构建及发布结果以最终记录为准。本轮未验真机、读屏器、原生缩放、实体打印及所有语言字形，不将桌面模拟或有限字形样本等同于这些场景的认证。下次普通小轮序号为 2/3，第 3 个完成小轮须做完整回归与独立综合审查。

### 通用基础组件第二批与配色规则 · 2026-10-16

用户于 2026-10-16 批准本轮实施。开工基线为 `2865942bb755efaa516a0f6f4252cdf79b4b1969`，对应 Site v121；任务分支 `feat/blueprint-common-batch-two`。配色决策原位记入下方「颜色令牌」及 [AI 来源与悬浮材质](foundation-tokens.md)，第二批限定以下 12 类既有组件，保留第一批及原蓝图样板入口，不扩展 Agent 业务布局。

| 组别 | 本轮组件 | 适配重点与操作边界 |
| --- | --- | --- |
| 输入、选择与进度 | InputGroup、Combobox、ToggleGroup、Progress | 复用已有输入表面与受控状态；检查组合输入单一外框、错误 / 禁用 / 焦点、搜索候选与无结果、选择与按下态、已知数值和未知进度的区别；不由点击或计时器推定真实任务完成 |
| 菜单与轻浮层 | Menu、Popover、Tooltip、Toast | 纸墨表面、状态文字、真实触发器和关闭；键盘展开 / 导航 / Escape、焦点返回、Tooltip 键盘可达、Toast 可关闭及实际主题宿主；不把提示样例写成真实保存回执 |
| 确认、侧栏与缺内容 | AlertDialog、Sheet、Skeleton、Empty | 确认与取消意图、焦点限制与返回、侧栏滚动和窄屏、明确加载占位与空状态；减少动态效果按真实样例核对，不让 Skeleton 自动变成完成事实或把 Empty 当成权限判断 |

#### 第二批复用与实现边界

本轮沿用固定 coss `e937becd2d5ffb5c621eed6f8b1f223cbb6051e7`。已离线核对 `components/coss/` 中上述 12 类对应文件的公开结构、`data-slot` 与 Portal 支持，以及本地 `demos/actions.tsx`、`demos/overlays.tsx`、`demos/feedback.tsx` 的既有组合。输入和搜索复核本地 `demos/input-particles.tsx` 的 p-input-group-22，以及 `demos/selection-particles.tsx` 的 p-combobox-9 / 8 / 18；确认与关闭返回复核 `demos/dialog-particles.tsx` 的 p-dialog-4 / 5 组合。沿用原语、常驻标签与弹层结构，不移植这些旧演示中的模拟保存计时器或业务完成文案。

历史 `.sites-runtime/easyui-research-20261005/coss-registry.json` 在当前机器仍不存在。本轮实施另行下载并阅读全文的官方 particles 为 p-input-group-22、p-combobox-1 / 2、p-toggle-group-1、p-progress-2、p-menu-1 / 3、p-popover-1、p-tooltip-1、p-toast-2、p-alert-dialog-1、p-sheet-1、p-skeleton-1 和 p-empty-1；[复用来源记录](blueprint/evidence/batch2-20261016/reuse-sources.json) 保留来源 URL、依赖与已读文件散列，不据此声称穷举完整最新注册表。实际只借用组合结构，复用现有 coss、Prism Button 与 QuestionMath；拒绝复制演示计时器、远程 avatar 或任务成功事实。Toast 沿用现有私有 manager 属性，Sheet 复用 QuestionMath 呈现真实 MathML，浮层容器归属本样例。现有原语能承载本轮样例，采用主题隔离的外层适配，不新增组件目录条目或公共 API。此轮不新增 Agent 执行组件，不扩大 Beautiful UI 的适用范围。

只允许蓝图范围内的几何、语义配色使用与对照夹具调整；不修改冻结 coss、既有公共令牌名称 / 数值、品牌原色、业务源码或依赖，不全仓重命名 `--brand-ai-gradient`。已有教材装饰与 AI 来源用法的命名差异仅作兼容说明，具体语义见下方配色分工。公共颜色、品牌标识、教材业务及核心三主题的既有行为不以文档更新为由改变。

#### 第二批样例与已验范围

样例位于 `/next/foundations/blueprint#common-components-two`。[第二批交互记录](blueprint/evidence/batch2-20261016/interactions.json) 的 47 项检查通过，包含 12 类样例存在与 ID 唯一性；下表只记录实际展示和操作的状态，不表示所有变体、内容与输入方式均已覆盖。

| 组件 | 当前样例与实际检查 | 覆盖边界 |
| --- | --- | --- |
| InputGroup | 关键词清除并返回输入；空值时清除按钮禁用；页码错误 / 非整数 / 有效整数；只读、禁用与整组焦点 | 内输入 border 为 0，错误外框保留红色；系统剪贴板与所有 addon 排列未逐项验收 |
| Combobox | 清除、无结果、真实选中值；输入文本不等于完成选择；键盘选择解除错误；Escape 返回、禁用输入 | 当前为单选本地候选，不扩为远程加载、多选或全部禁用选项组合 |
| ToggleGroup | 单选键盘操作、多选切换及禁用项 | 保留真实按下状态；不代表所有尺寸、方向或极长标签组合已验 |
| Progress | 0%、40%、100% 与未知四个固定快照；未知没有 aria-valuenow，保留“未提供进度” | 仅明确标注的快照，未接入任务执行；蓝图轨道与填充测得对比度约 16.26:1，不据此宣称全站对比度审计完成 |
| Menu | 禁用项、复选项、单选项、键盘操作与 Escape 返回焦点 | 操作只更新本页反馈；未验全部子菜单或定位组合 |
| Popover | 初始焦点、取消保留旧值、应用本页备注并返回焦点 | 不产生保存服务回执；未扩验多层嵌套弹层 |
| Tooltip | 可访问描述、键盘触发与 Escape 关闭 | 补充说明不替代常驻标签；没有据 DOM 属性声称读屏器实测完成 |
| Toast | 三类本页通知、局部 manager 无全局重复、关闭指定通知和全部通知 | 不推定真实任务成功或失败；未穷举全部通知堆叠与超时组合 |
| AlertDialog | 初始焦点位于取消、焦点限制、取消保留备注、确认本页变更及关闭返回 | 仅清除可逆的本页演示备注，不删除真实材料 |
| Sheet | 初始焦点、Escape 返回、320px 面板内长内容滚动；样例包含 QuestionMath 真实 MathML | 未作真机、读屏器或所有公式排版的完整验收 |
| Skeleton | aria-busy、减少动态效果时三个占位动画均为 none、手动切换固定内容 | 不运行模拟加载计时器，不把切换视为真实请求完成 |
| Empty | 切换固定材料样例并恢复空状态 | 不创建或上传材料，不推定权限或数据服务状态 |

#### 第二批实施结果与证据边界

[第二批矩阵](blueprint/evidence/batch2-20261016/matrix.json) 的 223 项检查通过：四主题 × 320px / 768px / 1280px 共 12 个布局检查、11 个主题与浮层情景、6 组双向主题比较，记录内对应计算属性全部相等。检查真正的 Portal 宿主和通知节点，包含全局蓝图内的核心主题预览与核心主题内显式蓝图预览；不只根据触发器推定浮层主题。结论限定本轮样例、所测属性和宽度，不代表全站逐像素回归。

矩阵曾发现局部预览沿用外层已计算的派生值：coss 部分工具类读取 `--radius-lg` / `--radius-md` / `--color-muted`，只切换局部基础令牌仍会继承外层结果。修复仅在涉及 Blueprint 的真实 `data-agent-preview` 主题边界重新绑定这三个既有别名，使其使用该边界自己的 radius / muted；蓝图内核心预览也恢复自身值，普通核心全局主题不受这段规则影响。夹具另外显式使用 `text-foreground`。这不是新增公共令牌、改动品牌色或放宽几何覆盖到核心主题；修后以上双向比较和首批浮层回归均相等。

用户追加的 InputGroup 聚焦蓝框只包中间输入区问题已修复并[实测焦点](blueprint/evidence/batch2-20261016/focus.json)：旧会话中焦点外框包住 439px 整组，而非 386px / 411px 的内部输入；外层为 2px 蓝色 outline、2px offset，内层 outline 与 shadow 均为 none。错误状态仍保留 `rgb(198, 40, 40)` 红边；正常、错误、只读三类通过，清除按钮有独立焦点，且获焦时不同时绘制整组焦点。见[正常整组焦点](blueprint/screens/batch2-20261016/batch2-input-group-valid-focus.png)与[错误整组焦点](blueprint/screens/batch2-20261016/batch2-input-group-error-focus.png)。这些数值保留为原会话测量，最终环境与页面宽度另以下方干净会话为准，不扩写为全部 InputGroup 变体已验。

[正式组件页复验](blueprint/evidence/batch2-20261016/routes.json) 覆盖第二批 12 页 × 320px / 1280px 共 24 次访问，全部返回 200、存在真实样例且无页面横向溢出；具体交互仍以上方夹具记录为准。同份旧会话记录中的 320px InputGroup 整组为 246.67px，保持 2px 蓝色焦点线、内输入 outline / shadow 为 none。

独立 Review 对旧窄屏截图底部滚动条提出复核后，另用[全新浏览器会话](blueprint/evidence/batch2-20261016/fresh-focus.json)检查 1280px / 320px：innerWidth、文档 clientWidth / scrollWidth、body clientWidth / scrollWidth 均等于相应视口；html / body 的 zoom 为 1、DPR 为 1、visualViewport.scale 为 1。干净会话整组宽度分别为 446.5px / 246px，均保留完整 2px 蓝色焦点线；窄屏仅存在既有 Tabs 的局部横向滚动，没有文档级横向溢出。[窄屏截图](blueprint/screens/batch2-20261016/blueprint-320-input-group-focus.png)已替换为本次结果，不将旧会话尺寸当作干净会话测量。

本轮另行复跑[首批 31 项交互](blueprint/evidence/batch2-20261016/first-interactions.json)，全部通过。[原样板按钮回归](blueprint/evidence/batch2-20261016/first-hover.json) 覆盖四主题 × 320px / 1280px 共 8 个情景，原 8 个按钮均保留，蓝图主要行动的前景 / 背景对比度仍为 17.76:1。[首批矩阵](blueprint/evidence/batch2-20261016/first-matrix.json) 包含 12 个布局、8 个真实浮层情景，嵌套预览比较全部相等；CSS `zoom: 2` 检查通过，但不等于浏览器原生 200% 缩放已验。以上均为本轮重新运行，不借用旧轮结果代替当前回归。

核心三主题 Progress 的[修改前](blueprint/evidence/batch2-20261016/core-before.json)、[修改后](blueprint/evidence/batch2-20261016/core-after.json)和[逐项对照](blueprint/evidence/batch2-20261016/core-comparison.json)记录一致；蓝图填充与轨道由[修前](blueprint/evidence/batch2-20261016/before.json)的约 1.09:1 提升到 16.26:1。这里只报告具体轨道 / 填充的计算样式与对比度，不据有限样本宣称所有核心组件视觉均已验。

代表截图：[输入与进度](blueprint/screens/batch2-20261016/blueprint-1280-inputs.png)、[菜单与反馈](blueprint/screens/batch2-20261016/blueprint-1280-menus-and-feedback.png)、[确认与占位](blueprint/screens/batch2-20261016/blueprint-1280-dialogs-and-placeholders.png)、[Sheet 窄屏](blueprint/screens/batch2-20261016/global-blueprint-320-sheet.png)、[局部通知](blueprint/screens/batch2-20261016/global-blueprint-1280-toast.png)、[蓝图内深色 Combobox](blueprint/screens/batch2-20261016/global-blueprint-local-dark-1280-combobox.png)、[深色内蓝图 Popover](blueprint/screens/batch2-20261016/global-dark-local-blueprint-1280-popover.png)。品牌标识与教材装饰保留既有颜色和语义边界，不把品牌三色改成任务状态；未修改教材业务源码，亦不据文档澄清声称教材业务流程已经重新验收。

数学字体、语义字号（308 个 owned TSX）、生产构建与 TypeScript 已在运行时代码最后修订后通过；生成物同步后再次生产构建通过，Blueprint 专项最终 39/39 通过。全量首次在 Windows 沙箱内运行得到 1923 项 / 1661 通过 / 262 失败，其中额外一项为 symlink EPERM；正常权限复跑为 1949 项 / 1688 通过 / 261 失败。随后修复预览别名并更新文档，规范生成物尚未同步时的 [release 中间结果](blueprint/evidence/batch2-20261016/release-failure-delta.json) 曾为 1949 项 / 1686 通过 / 263 失败，新增两项仅为 guide 完整字节与源散列不一致。最终重新生成、构建并复跑全量后恢复为 1949 项 / 1688 通过 / 261 既有失败，两项生成物失败已消除；[最终失败集合对照](blueprint/evidence/batch2-20261016/complete-failure-delta.json) 的 new 与 removed 均为空，与上一轮悬停修复的失败描述集合相同，不声称全量通过。[工程命令、时间与退出码](blueprint/evidence/batch2-20261016/engineering.json)、[本轮检查与审查](blueprint/evidence/batch2-20261016/checks.md)及[当前状态](blueprint/STATUS.md)记录具体依据；最终结果回填后的变更仅为说明与证据，规范及下载资源重新生成并校验。

[独立 Review](blueprint/evidence/batch2-20261016/review.md) 最终结论为 PASS WITH NOTES，正式放行；源码、浏览器与工程收口条件已满足，发布提交 SHA、PR 与 Site 版本仍以实际合并和发布终态为准。真机、读屏器、实体打印、原生 200% 缩放、全站像素回归及未展示的状态组合未验；数学内容只覆盖本轮 Sheet 的样例，不据此扩展到全部公式和 Agent 业务场景。第四主题继续保持候选状态。

### 通用基础组件首批 · 2026-10-15

本轮开工基线为 `55f25df36af5a8aaaa2374fed0427d9379b501e2`，对应 Site v119。范围限定上述 12 类现有组件在第四主题下的适配和对照夹具，不新增组件目录条目、公共 API、依赖或业务流程。原始 coss 的状态、键盘、焦点管理与受控属性继续承担交互；展示夹具只管理输入、选择、弹层开合等可逆演示状态，不产生保存、批阅、发布或 Agent 执行事实。

设计边界沿用现有主题令牌和语义字号：直角、结构墨线与次级分隔线按层级使用，选中状态仍由真实属性驱动；Radio 保留圆形识别。硬阴影用于少量主要行动和浮层，静态 Card、普通 Badge 与说明 Alert 不因主题适配变成可点击对象。输入标签常驻，错误同时保留文字与状态标识；只读与禁用分别表达，不能仅靠文字变淡说明原因。蓝色焦点在墨底上的分隔层沿用既有规则，不删除 coss 的焦点机制。

所有既有组件的视觉覆盖限定在 `[data-prism-theme="blueprint"]`，排除嵌套核心主题预览的根、后代和伪元素。核心三主题的令牌、默认外观与交互保持原意；轻量 Blueprint v0.4 仍沿用原 coss / Prism 外观。Dialog、Select 的 Portal 需要单独核对真实挂载位置和主题，不能用触发器的主题推定浮层已隔离。装饰标尺维持上一轮授权的 14px / 10px，不扩散其局部字号例外。

#### 复用依据（本轮离线核对）

固定 coss 来源为 `e937becd2d5ffb5c621eed6f8b1f223cbb6051e7`，以 `lib/prism-next/config.ts` 与 `vendor/coss-manifest.json` 记录为准。本轮读取 `components/coss/` 下的 `button.tsx`、`input.tsx`、`textarea.tsx`、`select.tsx`、`checkbox.tsx`、`radio-group.tsx`、`switch.tsx`、`tabs.tsx`、`card.tsx`、`badge.tsx`、`alert.tsx`、`dialog.tsx`，以及既有 `components/prism-next/badge.tsx` 语义适配和 forms / navigation / feedback 示例。这些原语已提供当前所需状态与结构，无需重建基础组件。

| 实际核对的本地材料 | 可复用内容 | 本轮取舍 |
| --- | --- | --- |
| `demos/selection-particles.tsx`：p-select-6 / 18 / 7 / 21 | 分组、带说明的选项、多选摘要、随内容确定宽度 | 复用既有 Select 结构，首批只验证所展示的单选状态、长中文、禁用项及浮层；不据已有多选示例声称全部 Select 用法完成验收 |
| `demos/dialog-particles.tsx`：p-dialog-5 / 4 | 长内容与固定操作区、受控开合及关闭返回 | 沿用 Dialog Header / Panel / Footer 与真实焦点管理；不复制 p-dialog-4 本地演示的模拟保存计时器、失败开关或业务结果文案 |
| `demos/input-particles.tsx`：p-input-group-22 | 常驻标签、输入与清除按钮组合、清除后返回输入 | 作为本地输入组合参考；InputGroup 不扩入本轮 12 类范围，不新增搜索或业务筛选能力 |
| [v7 particles 检索摘要](blueprint/evidence/v7/reuse.json) 与 [v8 工程记录](blueprint/evidence/v8/inspection.md) | 历史 p-tabs-1…15 元信息与 Tabs 组合判断 | 当前机器的历史 registry / p-tabs-1 缓存路径均不存在；本轮只复核已归档摘要，实际实现复用当前 coss Tabs 及 `demos/navigation.tsx` 的局部滚动方式 |

本轮未联网刷新 coss / particles 注册表，未声称读取不可用缓存中的完整源码或穷举最新上游；没有复制新第三方代码。任务为既有通用基础组件的主题适配，不涉及 Agent 执行组件新增，Beautiful UI 的 Agent 组件检索不适用于本轮。

#### 首批样例与已验范围

样例位于 `/next/foundations/blueprint#common-components`。本轮 [交互记录](blueprint/evidence/common-20261015/interactions.json) 的 31 项检查全部通过；这是所列样例的操作证据，不表示 12 类组件的全部变体、状态组合或所有内容类型均已验收。下表按当前实际样例和已做操作记录，未覆盖项继续保留。

| 组件 | 当前样例 | 本轮已验与覆盖边界 |
| --- | --- | --- |
| Button | 主要、描边次要、ghost、图标、危险描边、禁用和固定加载 | 图标操作产生本页说明，禁用及加载不可用；没有真实任务调用。没有逐个穷举全部尺寸及 hover / pressed 组合 |
| Input | 有效值、必填错误、只读、禁用 | 输入非空值解除错误，错误外框为红色；焦点落在单一外层 2px 外框，内层没有重复外框；只读与禁用属性已核对。未单独验系统剪贴板复制 |
| Textarea | 中文多行、必填错误、只读、禁用 | 非空输入解除错误，单一外层焦点与只读 / 禁用已核对；本轮文字样例未加入真实 MathML |
| Select | 单选、必填错误、禁用触发器及禁用选项、较长中文选项 | 键盘选择与校验、禁用项不可选、Escape 关闭和返回焦点已验；真实 Portal 挂在样例容器内。未扩验多选与全部定位组合 |
| Checkbox | 可选、已选禁用、部分选中禁用、已选只读错误 | Space 可切换；已选错误样例的红色边框与 indicator 内描边已测，保留错误说明。部分选中样例为固定禁用事实，不声称已验可交互半选转换 |
| RadioGroup | 个人 / 团队单选、全校禁用、长中文标签 | 方向键选择并跳过禁用项；维持单选与圆形识别。不产生真实权限变更 |
| Switch | 开 / 关、固定禁用 | 键盘切换与文字反馈已验；开为墨底、关为次级底并有轮廓，状态位置保留。未将背景采样称作完整对比度审计 |
| Tabs | 分段式与下划线式、长标签、禁用项 | 两种样式的键盘切换已验；禁用项可获焦点但不能激活，这是当前 Base UI 行为。320px 末项外侧焦点曾贴近裁切边缘，本夹具改为内侧 2px 蓝线加纸色隔离，已完成稳定焦点测量和目视复验；不要求禁用 Tab 跳过焦点 |
| Card | 静态 Card 与 CardFrame、名称和类型说明 | 卡片无 button 角色；Dialog 更新仅反映到本页卡片。当前正文为文字，未据此验收卡片内真实公式或交互卡片 |
| Badge | outline、info、success、warning、error 五种固定状态 | 五种状态文字存在并保持语义色；未扩验交互 Badge、所有尺寸或超长标签 |
| Alert | 信息、成功、警告、错误四种固定说明 | 标题与文案存在；固定状态使用 note，不宣告真实业务完成。未扩验动态实时播报和带操作 Alert |
| Dialog | 材料名称与类型编辑、校验、取消 / 关闭及本页保存 | 初始焦点、错误后聚焦、焦点限制、内 Select 的 Escape、关闭返回及本页卡片更新已验；底部圆角已修正。当前两字段样例不代表长正文滚动、真实公式和所有嵌套 Dialog 均通过 |

#### 实施结果与证据边界

本轮按实际着色面修正 Input / Textarea 的外层边框与单一焦点、Select 弹层内部表面、Checkbox indicator、Switch 关闭状态、CardFrame 裁切、下划线 Tabs 与 Dialog 底部几何。错误与危险语义边框保留对应颜色；选中 Checkbox 的错误指示增加红色内描边。适配仅在蓝图主题生效；未修改冻结 coss、依赖或核心主题令牌。起点测量见 [before.json](blueprint/evidence/common-20261015/before.json)。

[四主题矩阵](blueprint/evidence/common-20261015/matrix.json) 覆盖 light / paper / dark / blueprint × 320px / 768px / 1280px，12 组均显示 12 类样例且无页面横向溢出。Dialog 与其内部 Select 真实挂载在同一主题容器中：三核心全局主题与全局蓝图内对应核心预览的圆角、背景、文字、边框和投影逐项相等；全局 light 内显式 blueprint 的反向对照也相等。此结论限定记录中的浮层样例与计算属性，不是全组件像素回归或所有 Portal 宿主组合的保证。

[正式路由复验](blueprint/evidence/common-20261015/routes.json) 另检查 12 类组件页及 InputGroup 回归页，在 320px / 1280px 共 26 次访问均返回 200，页面宽度与视口一致；InputGroup 内部无样式输入继续为 border 0，Dialog 页的路由采样不替代上方实际开合检查。文件同时记录已选错误 Checkbox 和 Dialog 底部方角。Select 在打印媒介下的投影为 none，仅属于该属性检查，未完成原生打印预览或实体打印。

Tabs 以 [final-focus.json](blueprint/evidence/common-20261015/final-focus.json) 的稳定采样为最终焦点依据，替代路由记录中尚在投影过渡的快照：激活与 focus-visible 均为 true，蓝色 outline 为 2px、offset 为 −3px、纸色内描边为 4px；320px 页面无横溢，[最终截图](blueprint/screens/common-20261015/blueprint-320-tabs.png) 已目视复验。

代表截图：[蓝图桌面](blueprint/screens/common-20261015/blueprint-1280-foundations.png)、[蓝图 768px](blueprint/screens/common-20261015/blueprint-768-foundations.png)、[蓝图 320px](blueprint/screens/common-20261015/blueprint-320-foundations.png)、[已选 Checkbox 错误](blueprint/screens/common-20261015/blueprint-checkbox-error.png)、[Dialog 底部](blueprint/screens/common-20261015/blueprint-dialog-footer.png)、[蓝图内 dark 浮层](blueprint/screens/common-20261015/portal-blueprint-global-local-dark.png)、[light 内蓝图浮层](blueprint/screens/common-20261015/portal-light-global-local-blueprint.png)。

CSS `zoom: 2` 下已采集[放大截图](blueprint/screens/common-20261015/blueprint-css-zoom-200.png)，测量未出现页面横向溢出；这不是浏览器原生 200% 缩放。尝试 Ctrl++ 后 viewport / DPR 均未改变，因此原生缩放仍未验证。本轮未加入真实 MathML 公式内容，也未完成已选错误 Radio、真机、读屏器、完整对比度审计、长内容 Dialog、实体打印、全站像素回归及 Agent 业务场景；不把既往样板的公式结果转记为本轮通过。

工程检查已运行：数学字体、语义字号（307 个 owned TSX）、生产构建与 TypeScript 通过。全量初跑为 1949 项 / 1686 通过 / 263 失败，其中 2 项是规范源文档更新后尚未同步生成物，其余 261 项与标尺轮既有失败描述相同；Blueprint 初跑为 39 项 / 37 通过 / 2 项同类生成物失败，不写成全部通过。同步生成物后，Blueprint 专项 39/39 通过，最终全量为 1949 项 / 1688 通过 / 261 失败，与标尺基线失败集合一致；构建、类型、字体和字号检查通过。独立 Review 为 PASS WITH NOTES，无阻断。详见 [本轮检查](blueprint/evidence/common-20261015/checks.md)、[失败集合对照](blueprint/evidence/common-20261015/final-failure-delta.json)、[审查记录](blueprint/evidence/common-20261015/review.md) 与 [当前状态](blueprint/STATUS.md)；发布版本以部署记录为准。

### Site、GitHub 与本地同步（2026-10-15）

将 Site v117 的轻量 Blueprint v0.4、来源许可及实验历史合入 GitHub 主线，同时保留主线第四主题、图表更新及本地第一批完善。规范页恢复第四主题示例入口，两种蓝图实验各自沿用原有范围；核心三主题与冻结 coss 保持原样。规范直接引用的文本与下载快照固定 LF，避免 Windows 检出换行使来源散列失效。合并验证及发布边界记录在 [当前状态](blueprint/STATUS.md)。本次同步不将候选主题升级为正式验收完成。

### 第一批结果与剩余验收

已完成样板容器布局、章节字号、禁用反馈、墨底焦点分隔、静态卡片语义及长中文与公式阅读。四主题在 320px / 1280px 均无页面横向溢出；主行动和墨底链接的键盘焦点、分段 Home / End、Tabs 手动激活及局部公式滚动已经浏览器验证。构建、类型检查与 37 项 Blueprint / 文档定向测试通过；全量 1947 项中仍有 261 项失败，代表性 Windows 路径与 ESM 问题在未修改的 HEAD 基线复现。详见 [浏览器测量](blueprint/evidence/v9/browser-results.json) 与 [Windows 测试分析](blueprint/evidence/v9/windows-test-analysis.md)。

代表截图：[桌面样板](blueprint/screens/v9/blueprint-1280.png)、[主行动焦点](blueprint/screens/v9/primary-focus-320.png)、[墨底链接焦点](blueprint/screens/v9/pane-focus-320.png)、[长文与公式](blueprint/screens/v9/reading-320.png)。本轮只完成第一批；真机、读屏器、原生/实体打印、全部密集数据与真实教师场景仍按阶段3—5继续验证，第四主题保留候选状态。

## 原始参考风格提炼（2026-10-15）

本节保留来源核对阶段的事实与接入建议，不替代既有验收记录。该阶段只补文档与证据，没有修改运行时代码、主题令牌、组件 API 或站点；后续完善执行见上方路线与当前状态记录。

### 来源及三层边界

- 在线参考：[Answer me with HTML 中文官网](https://answer-me-with-html.com/zh/)，2026-10-15 采集。官网部署提交未知，不能把线上页面直接等同于仓库 HEAD。
- 源码固定在 [`99de9e56d5ca24e16604c8437f07e1b0c5e2af71`](https://github.com/QingYunA/answer-me-with-html/tree/99de9e56d5ca24e16604c8437f07e1b0c5e2af71)。[MIT 许可](https://github.com/QingYunA/answer-me-with-html/blob/99de9e56d5ca24e16604c8437f07e1b0c5e2af71/LICENSE)已核对；若后续复用实质源码须保留版权及许可声明。
- **官网呈现层**：[site/src/style.css](https://github.com/QingYunA/answer-me-with-html/blob/99de9e56d5ca24e16604c8437f07e1b0c5e2af71/site/src/style.css)。本轮分析的网格背景、主按钮硬阴影、官网卡片、导航与响应式主要来自这一层。
- **生成文档主题层**：[src/themes/blueprint.js](https://github.com/QingYunA/answer-me-with-html/blob/99de9e56d5ca24e16604c8437f07e1b0c5e2af71/src/themes/blueprint.js)。它定义明暗令牌、0px 圆角、1.5px 通用线宽、`--shadow: none`、双框和标尺；文档外框自身明确为 1px。不能把官网所有表现归为这一主题模块的能力。
- **智能曜彩接入层**：当前本地基线 `1f575ea`，按本文件记录的第四主题适配；[轻量 Blueprint 页面实验](experiments/prism-blueprint-v0.2.md)是另一条路线，保留原 coss / Prism 外观。两者不共用“所有组件直角化”的结论。

### 令牌与排版提炼

上方来源中的官网基础配色与下方现有令牌表大体一致；需要额外保留以下差异，避免从相同色值反推相同语义。

| 项目 | 原始证据 | 智能曜彩应用原则 |
| --- | --- | --- |
| 成功色 | 官网及生成主题 `--ok` 与强调蓝相同 | 保留当前独立成功绿；强调蓝、AI 来源与正确性不能互相代替 |
| 三级文字 | 官网亮色 `--ink-3: #6b7280`；生成主题为 `#8b929e` | 不把三级文字无条件映射成禁用色；现有 `--disabled-foreground` 的语义单独审查 |
| 深色 | 原站深色背景 `#081322`、纸面 `#0d1c31`、强调 `#6ea8ff` | 该来源核对轮仅记录事实；夜图后续按独立授权接入，不改核心 dark |
| 结构线 | 官网通用 `--bw: 1.5px`，内框 1px | 保留结构线与次级分隔线层级；浏览器像素取整见证据说明 |
| 正文字体 | 官网系统无衬线栈，中文含 PingFang SC、Microsoft YaHei 等；正文 16px / 1.6 | 延续 Prism 字体与语义字号；字体栈不等于当前机器实际命中的字体 |
| 标题比例 | 官网中文 hero 为 `clamp(32px,4.6vw,62px)` / 1.16；区块标题为 `clamp(26px,3.4vw,40px)` / 1.1 | 保留“主标题—区块标题—技术元信息”的层级关系，不把营销页大标题尺寸复制进教师工具栏 |
| 技术元信息 | 标尺、编号、小标题使用等宽字；小标题大写、字距 0.08em | 等宽用于编号和技术元信息；中文正文维持阅读字体，不采用原站 10px 标尺作为正文尺寸 |

### 几何与布局规律

| 规律 | 来源确认 | 接入判断 |
| --- | --- | --- |
| 页面底与纸面分离 | 官网 body 为 40px 双向细网格，sheet 为不透明纸面 | 网格表达纸面外的坐标环境；不在每个内容容器重复铺设 |
| 双框与坐标 | 官网 sheet 外框、18px 内缩细框、四边标尺，字母块与 SHEET 编号 | 适合章节或较大工作区域；不递归套在每张卡片上，避免结构线争夺注意力 |
| 宽度与留白 | 官网最大内容宽度 1320px；主要内距 `clamp(18px,4vw,56px)` | 提炼为受限阅读宽度和随容器调整的留白；本地侧栏布局应以可用内容宽度判断，不能照搬浏览器宽度 |
| 视觉重心 | 官网 hero 为主文案与 360px 信息栏两列，1024px 以下改单列 | 对应本地“主要工作区＋辅助信息”，具体列宽由任务阅读需求决定 |
| 低层级内容 | 卡片默认以边框、标题条、间距组织；可交互卡片 hover 才上浮并出现硬阴影 | 不给所有静态卡片添加投影或悬停暗示；装饰不能伪装可点击能力 |
| 窄屏减法 | 760px 以下隐藏内框、标尺及部分序号；sheet 去左右边框，保留内容 | 先去装饰、再重排；任务数量、异常、当前步骤等业务事实不能当作装饰隐藏 |

“网格表达坐标环境”“不递归套框”等为本轮对源码和截图的设计归纳，不是上游 API 契约。轻量页面实验仅借用比例、对齐、分区编号与局部图框，不据此重绘原组件。

### 交互状态与动效

| 状态 | 官网源码 / 本轮观测 | 使用边界 |
| --- | --- | --- |
| 主行动默认 | 墨底纸色文字、4px 4px 0 强调色硬阴影；实测一致 | 用于少量主要行动，不能把全部按钮升级为同等强调 |
| 主行动 hover | 阴影变 2px 2px 0，元素移动 2px / 2px；实测一致 | 表达按压反馈；不是任务执行或成功状态 |
| 普通按钮 / 工具 hover | 普通按钮填充次级底色；工具按钮墨底反白 | 保留本地 variant、键盘行为和组件状态契约 |
| 分段选择 | `aria-selected` 或 `aria-checked` 命中时墨底纸色文字，焦点线向内偏移 | 视觉状态应由真实受控值驱动，不能从颜色推断选择值 |
| 键盘焦点 | 官网 2px 强调色 outline、2px offset；主行动焦点环已抽查 | 不删除 coss 焦点机制；本轮不是完整键盘或读屏器验收 |
| 禁用 | 官网编辑器行动区域有局部禁用样式，并无据此确认的全站统一协议 | 不臆造通用禁用规则；沿用 Prism 原协议，按组件补测 |
| 减少动态效果 | CSS 将动画及过渡压至 0.001ms，关闭部分装饰；实测按钮 transition 为 `1e-06s` | 原站注释明确 hero 打字循环仍保留，不能据此宣称完全静态或完全无障碍；本地不引入营销页循环演示 |

### 证据与验收范围

使用隔离 Chrome / Playwright CLI 采集中文首页，视口为 1280×960、390×960，各含 light / dark。采集脚本与返回值保存在 [计算样式 JSON](blueprint/evidence/source-audit-20261015/computed-styles.json)、[采集脚本](blueprint/evidence/source-audit-20261015/probe.js)、[状态采集脚本](blueprint/evidence/source-audit-20261015/states.js)、[状态日志](blueprint/evidence/source-audit-20261015/states.log)。本轮直接采集相关元素的真实计算样式，未安装 Dembrandt 或 Design DNA MCP。

| 观测 | 结果 |
| --- | --- |
| 四组页面宽度 | document scrollWidth 均等于视口宽度；仅说明此次首页测量无横向溢出 |
| 标尺 | 1280px 为 flex；390px 为 none |
| 中文 hero 字号 | 1280px 为 58.88px；390px 为 32px |
| 外框计算值 | 本环境返回 1px，虽然源码 `--bw` 为 1.5px；保留二者，不把声明值写成实测 1.5px。像素取整与环境差异需在目标环境复查 |
| 焦点样本 | 捕获到 2px 蓝色焦点环；采样未等待 hover 退出后的变换完成，日志内 transform 不作为焦点位移规则 |

截图：[亮色桌面](blueprint/screens/source-audit-20261015/light-1280.png)、[亮色窄屏](blueprint/screens/source-audit-20261015/light-390.png)、[深色桌面](blueprint/screens/source-audit-20261015/dark-1280.png)、[深色窄屏](blueprint/screens/source-audit-20261015/dark-390.png)。均为视口截图，不是全页；动态演示内容可能处于不同时间点，不用于内容差异比较。

尚未完成：全站所有状态、生成文档实例的浏览器核对、真实手机、打印、读屏器、完整对比度审计。没有把本次参考站测量当成智能曜彩或教师工作台验收；本轮未运行产品构建或测试。

下一轮接入评审以三项为输入：现有语义令牌映射、结构装饰的适用位置、受影响组件的状态清单。优先核对三级文字与禁用色、框线密度、容器断点及静态卡片的交互暗示；本节不预先批准对应运行时代码变更。

## 与核心三主题的边界

| 约定 | 说明 |
| --- | --- |
| 可选，不进矩阵 | `themeOptions` 含核心三主题、蓝图与夜图；`coreThemes = light / paper / dark` 明确核心矩阵；现有演示与测试中的三主题数组保持原意，不批量改写。 |
| 只追加令牌块 | 蓝图块与 paper/dark 同级、同特异性，置于 dark 之后；三套核心令牌值不变。 |
| 显式声明全部角色 | 状态色、图表色、AI 来源、悬浮材质全部在蓝图块内重写，不继承 `:root`。 |
| 几何只在蓝图生效 | 现有组件的几何覆盖限定蓝图主题，并排除显式的其他主题预览；`bp-*` 是主动采用类名后才生效的呈现样式。几何规则未分层，活动标签的选择器与已有文字样式保持同等优先级。 |
| 不改 coss | 只按 `data-slot` 覆盖；coss 固定源码保持逐字节不变。 |
| 深色变体 | 夜图使用独立值 `blueprint-night`，`dark:` 同时匹配其根和后代；显式 light / paper / 白图预览根及后代仍排除，原四主题匹配结果不变。 |

## 颜色令牌

### 配色与品牌分工（用户批准 2026-10-16）

蓝图延续纸色背景、墨色正文 / 结构和 `#1D5FBF` 交互蓝。主要行动仍使用成对的墨底与纸色文字，hover、focus-visible、pressed 不能只替换背景而留下不相配的前景；颜色取自既有语义令牌，不另建第二套蓝色色板。

| 用途 | 既有规则 | 不能由外观推断的含义 |
| --- | --- | --- |
| 纸面与结构 | `background` / `card` / `popover` 承载内容；`foreground` / `heading` / `line` 形成文字和图框层级 | 墨底、网格或硬阴影不表示正在执行或已完成 |
| 交互与信息 | 链接、焦点及信息色沿用 `#1D5FBF`；选中背景和前景配对，选中值由真实属性决定 | 交互蓝不是品牌原色的替代值，也不是正确性或成功状态 |
| 成功、警告与错误 | 保留各自 `success` / `warning` / `destructive` 及 foreground 配对，状态仍有可读文字 | 成功绿不改为强调蓝或品牌青柠；不靠颜色单独宣布业务结果 |
| 品牌标识与原色 | 保留 `--brand-blue: #339FF2`、`--brand-magenta: #E0438F`、`--brand-green: #C2F25B` 与现有品牌标识 | 品牌三色不成为普通按钮、正文、大面积表面或进度的默认配色 |
| AI 来源 | `--brand-ai-gradient` 仍映射既有品牌三色；用于来源时配中性可读的 AI 文字，并有调用方提供的真实来源依据 | 渐变本身不证明内容由 AI 生成、已经核验、正确或完成 |
| 既有教材品牌装饰 | 教材封面细条及现有 DialogLayout 装饰复用同一渐变，保留当前实现与命名兼容 | `brand-ai-gradient` 的历史变量名不赋予教材或对话框 AI 来源语义；不补造 AI 标签或生成事实 |

这次批准确定语义使用边界，保持公共令牌、品牌资产和既有业务行为不变。教材细条是既有非语义装饰的兼容用法，不由此扩大新的渐变使用范围；新内容若声称 AI 来源，必须按来源事实和可读标签呈现。基础规则与兼容说明同步维护于 `docs/foundation-tokens.md` 和 `docs/component-contracts.md` 的原有段落，不新增规划副本或全仓重命名。

| 角色 | 令牌 | 值 |
| --- | --- | --- |
| 正文背景 | `--background` | #F6F6F3（叠 40px 网格 `--grid` rgba(29,32,38,.055)） |
| 浮层表面 / 卡片 | `--card` `--popover` | #FFFFFF |
| 次级背景 | `--secondary` `--muted` | #F3F5F8 |
| 分隔线 | `--border` | #D6DAE1 |
| 墨线（新增） | `--line` | #1D2026 |
| 正文 / 标题 | `--foreground` `--heading` | #16181D |
| 次要文字 | `--muted-foreground` | #4B5260 |
| 禁用文字 | `--disabled-foreground` | #8B929E |
| 链接 / 焦点 / 信息 | `--link` `--ring` `--info-foreground` | #1D5FBF |
| 强调底 | `--accent` | #E4ECF8 |
| 错误 | `--destructive-foreground` | #C62828 |
| 警告 | `--warning-foreground` | #995909 |
| 成功 | `--success-foreground` | #216440（沿用智能曜彩绿色，不随参照站点并入蓝色） |

## 新增扩展令牌

三套核心主题在 `:root` 中有中性回退值，因此 `bp-*` 组件放在任何主题里都可以读。

| 令牌 | 核心主题回退 | 蓝图 |
| --- | --- | --- |
| `--line` | `var(--border)` | #1D2026 |
| `--line-width` | 1px | 1.5px |
| `--head-bg` / `--head-fg` | primary / primary-foreground | #16181D / #FFFFFF |
| `--grid` / `--grid-strong` | transparent | .055 / .09 墨色 |
| `--shadow-offset` / `-sm` | none | 4px 4px 0 / 2px 2px 0 #1D5FBF |
| `--code-bg` | `var(--secondary)` | #F3F5F8 |
| `--accent-ink` | primary-foreground | #FFFFFF |

## 五条几何规则

1. 直角：控件、卡片、徽标、浮层与品牌标识圆角归零；Radio 保持圆形。
2. 两级线：结构 1.5px `--line`，内部分隔 1px `--border`，虚线只用于分组。
3. 图纸：页面铺 40px 网格；区块用 `bp-sheet`。蓝图主题的内框与四边 `bp-ruler` 标尺统一为 14px（0.875rem），装饰坐标为 10px（0.625rem）/ 1 行高；三套核心主题中显式使用该组件时保留 18px / 12px。
4. 编号：区块以 `bp-sheet-id` 墨底字母开头，右上角标 `bp-sheet-no`；表头、小标题用等宽大写。
5. 硬阴影：主要行动与浮层用不模糊的偏移阴影，替代 coss 柔和投影。

## 首期 `bp-*` React 封装（不计入组件目录）

`bp-sheet` / `bp-ruler` / `bp-section-header` / `bp-section-code` / `bp-section-folio` · `bp-btn`（primary / danger / sm）· `bp-tool` · `bp-seg-tabs`（水平 / 垂直）· `bp-steps` · `bp-card` / `bp-card-note` · `bp-pane-head` · `bp-minor` / `bp-fig-cap` · `bp-size-bar` · `bp-metric` · `bp-facts` · `bp-titleblock` · `bp-callout` / `bp-error` · `bp-annot` · `bp-codebox` · `bp-toast`。章节头类名已按 2026-10-16 编辑式排版更新，旧 `bp-sheet-head` / `bp-sheet-id` / `bp-sheet-no` 不作为现行使用入口。

职责：coss 组件继续承担表单与操作；`bp-*` 只用于页面级呈现，两者不重名、不互相替换。

## 待验与已知限制

- 首期 `bp-*` 已有 React 封装及演示页；不登记组件目录，v3 接入时目录为 103 项。演示中的业务动作按钮、卡片内容为外观示例，不连接批阅、发布或保存服务。
- 320px 的 Tabs 示例存在横向溢出：本次浏览器抽查中蓝图页面宽 342px，浅色对照宽 339px。基础规范页宽 320px，色值表使用局部横向滚动。保留既有示例的窄屏问题，本轮不扩展为 Tabs 重构。 **v7（2026-10-14）已在 Prism 示例布局处理**：Tabs 标签行改为单行局部横向滚动，水平 `bp-seg-tabs` 同步保持单行，并补充选中项 / 焦点项滚动可见。上句保留为历史原文；修复后实际页面宽度、四主题视觉及 Toast 隔离测量待 Supervisor 浏览器验收，见 [v7 当前状态](blueprint/STATUS.md)。
- v4 已接入专用图表配色，见下方记录。Recharts 趋势、比较尚无图案，ECharts 无填充的折线与散点不使用面积图案；散点分组使用调用方提供的点形。实体黑白打印效果未验。
- 蓝图下默认热力图示例在 320px 页面中的格内文字拥挤；本轮只更改配色，未更改网格布局。并行新增的 `compact` 热力图不属于本轮验收范围。
- 尚未遍历所有组件、复杂嵌套预览与跨预览的 Portal 浮层，触摸、减少动态效果和打印也未做完整浏览器验收。不据令牌定义宣称通过对比度认证。

## 首次本地接入适配

按补丁映射将 `app/next/next/` 写入 `app/(next)/next/`，保持当前工作树与分支。README 追加第四主题说明；未新增 React 组件或组件目录条目。

- 固定字号改为既有语义字号令牌，字号检查保持原规则。
- 蓝图几何排除其他主题预览边界；基础规范主题卡使用真实主题属性。
- 去阴影规则避开具有焦点的控件或控件组，保留 coss 键盘焦点环。
- 修正实际 `tab-indicator` 插槽名及活动标签样式优先级；透明边框的 ghost、link 等按钮保留原边框语义。

## 首次本地验证（2026-10-13）

基于本地 `feat/reading-width-and-row-toggle` 分支、接入前提交 `4c7bdfe` 完成自测；未提交、推送、合并或发布站点。

- 数学字体检查与字号检查通过（290 个自有 TSX）；未放宽原检查规则。
- TypeScript 检查与 vinext 构建通过。
- 完整测试 1730/1730 通过，含补丁新增的 5 项蓝图主题测试；无失败或跳过。
- 与接入前提交逐项比较，原有 light / paper / dark 的 54 / 26 / 39 项令牌值均未改变；coss 源码无修改。
- 浏览器抽查基础规范与 Tabs：主题菜单含四项；蓝图可切换且导航后保持；蓝图和深色页面内的四张主题卡保持各自的颜色、圆角与线宽。蓝图控件为 0px 圆角与 1.5px 墨线，其他三个主题预览按钮仍为 10px 圆角、1px 线宽。
- 键盘抽查：Tab 可到达蓝图选择框，焦点环保留；Enter 打开菜单、Escape 关闭后焦点返回触发器。Tabs 可用方向键移动焦点、Enter 切换面板，选中项为白字墨底。

日志和截图保存在本地忽略目录 `.sites-runtime/blueprint-port/`。以上为接入自测与局部浏览器抽查，不代表全组件视觉验收或独立评审通过。

## v2 → v3 接入与验证（2026-10-13）

先应用 `Blueprint theme components ported.zip` 中的 v2，再应用 `Blueprint theme components ported2.zip` 中的 v3。路径 `app/next/next/` 映射为 `app/(next)/next/`；保留首次接入的主题隔离、焦点修正与基础规范底部排版修复。

### 本轮内容

- v2：网格铺到 `sidebar-inset`；提高演示与数据面板墨线优先级；既有 `DemoSection` 自动显示字母与 `SHEET` 序号、双线内框和刻度。760px 以下隐藏内框、刻度及序号，无需改动 `DemoSection`。
- v3：新增 React 封装、四组组件演示和侧栏入口；组件目录及原有计数测试保持不变。
- 分段选择遵循受控单选组协议。方向键切换并跳过禁用项，Home/End 跳转，首尾循环；传入无效或禁用选中值时，首个可用项仍可通过 Tab 到达，不擅自回写选中值。没有可用项时不创建 Tab 停留点。
- 步骤条、构成条、指标和批注带有可访问状态或数值文字；当时 `BlueprintSheet` 的标尺和字母装饰标记为 `aria-hidden`。2026-10-16 编辑式排版调整后，仅装饰标尺继续隐藏，有意义的章号 code 正常可读；本段旧行为不代表现行 API。实际读屏器体验仍待专门验证。

### 接入中修正

- `.bp-minor` 和 `.bp-facts` 不再用 margin 简写覆盖调用方的间距类。
- 窄屏构成条占整行，图例取消桌面缩进；桌面指标列按内容分配宽度，数值与单位不拆行。
- 演示增加禁用分段项，并补充无效选中值、禁用选中值、全禁用及空列表的键盘入口回归测试。
- 复制示例改为复制当前演示链接，等待剪贴板写入成功再显示完成；失败显示重试，不用计时器伪造结果。

### 验证结果

| 检查 | 结果 |
| --- | --- |
| `blueprint-theme` + `blueprint-components` | 12/12 通过（原 5 项主题测试、补丁 6 项、追加 1 项回归） |
| 全量测试 | 1737/1737 通过；失败、跳过均为 0 |
| 字号检查 | 293 个自有 TSX 通过，未放宽规则 |
| 数学字体、TypeScript、vinext 构建 | 全部通过 |
| 四主题 × 1280px / 320px | 8 组均已检查；页面及四组演示区块无横向溢出，窄屏标尺收起 |
| 键盘 | 横向与纵向方向键、Home/End、首尾循环、禁用项跳过正常；每组一个可用 Tab 入口 |
| 复制示例 | 浏览器实际写入后显示「已复制链接」；失败分支未做浏览器故障注入 |
| v2 原页面回归 | `/next/foundations` 确认内容区网格、1.5px 墨线、A/B 与 SHEET 编号；320px 收起框线和刻度 |
| 控制台 | 演示页检查期间未捕获 error |

截图、构建与测试日志以及 `browser-checks.json` 保存在本地忽略目录 `.sites-runtime/blueprint-v3/`。未提交、推送、合并或发布。以上为 Builder 自测；当时未验的图表数据序列配色在下方 v4 记录中更新，Tabs 窄屏问题和未完成的全组件验收范围继续保留。

## v4 图表配色接入与验证（2026-10-13）

按 `patch-v4/README.md` 应用 6 个文件，并手动适配 `config.ts`、`theme.css` 和 `blueprint.css`。沿用现有 ECharts / Recharts，未改 coss、依赖、组件目录或业务逻辑；保留 BP-05 网格与投影分隔线修复。

- `chart-palette.ts` 集中提供主题系列色、箱线图形色与默认连续色阶。蓝图第 1 系列为 #1D5FBF，第 2 系列为 #16181D，第 3–6 系列为 #B8266E / #2B8050 / #A57013 / #6B7280；调用方显式颜色仍优先。
- ECharts 第 1 系列实色，后五系列依次为两种方向斜线、点阵、横线、竖线。用临时浏览器夹具验证六系列柱形与堆叠面积图，夹具入口已从 `public/` 移除，源文件与截图保留在忽略目录。
- 箱线图普通线条 #16181D，选中线条 #1D5FBF，填充 #E4ECF8。热力图使用 #F3F5F8 → #88AADD → #1D5FBF，继续区分缺测与零值。
- 轴线使用 `palette.line`，网格线仍使用 `border`；Recharts 只覆盖原本已显示的轴线，不强制开启隐藏的轴线。
- 提示框为直角、1.5px 墨线与 6px 硬阴影。浏览器发现 ECharts 6.1 的 `richText` 内部固定 1px，忽略配置的 `borderWidth`；已在蓝图 CSS 中对带硬阴影与墨线的 SVG 提示框补充适配。SVG 先画描边再画填充，所以用 3px 描边得到外侧可见的 1.5px 边框，保留富文本渲染方式。

### 自测与浏览器证据

- v4 初次接入时：相关 29/29、全量 1743/1743 通过，TypeScript、数学字体、字号检查与构建通过。收尾独立复跑新增的 `blueprint-charts` 6/6 通过。
- 配色测试逐项核对核心主题系列色、形状色与连续色阶；蓝图系列色在白底和页面底色上均超过 3:1，1001 个连续色阶采样的数值标签均超过 4.5:1，亮度单调。
- 1280px：实际检查六系列柱形、面积、箱线、热力、分组散点、趋势、比较；确认箱线选择回调与蓝色选中态、热力图缺测标识、散点圆形/菱形，以及两种引擎的提示框。
- 四主题回归：六系列柱形/面积夹具与正式趋势页检查通过；核心三主题没有生成蓝图图案。Recharts 核心主题仍为 8px 圆角、1px 边框、无新增阴影；蓝图为 0px / 1.5px / 6px 硬阴影。
- 320px：检查箱线、分组散点、趋势和热力图；默认热力图标签拥挤已如实保留，不据页面无溢出宣称布局验收通过。未做真实打印、移动设备或读屏器验收。
- 浏览器检查期间未捕获 console error。测试日志、图案夹具、截图、`browser-checks.json` 和 v4 范围 diff 位于 `.sites-runtime/blueprint-v4/`。

### 并行工作树说明

收尾时同一工作树另有环形图、雷达图、紧凑热力图及记录列表改动，目录从 103 增至 105。这些改动均保留，不归入 v4 交付。最后一次全量检查为 1761/1766，5 项目录数量断言失败，均为 `105 !== 103`：`blueprint-components`、`dialog-layout`、`facet-filter`、`grading-review-components-route`、`segmented-bar`。类型、构建和字号检查（296 个自有 TSX）仍通过；因此本次不能把当前混合工作树称为全量通过。目录数量断言需随并行组件扩展一起更新。

本轮仅更新本地文件；未提交、推送、合并或发布。以上均为 Builder 自测，不是独立 Review 结论。


### 事实栏与标题块的容器布局（P82 · 2026-10-17）

`BpFacts` / `BpTitleBlock` 各自增加无视觉样式的 `bp-fact-container` 外层，使用具名 inline-size container query；`className` 继续传给内部 `dl`，dt/dd 内容与顺序不变。若宿主依赖直接子节点选择器，需注意新增外层。

- 容器内容宽度 ≤480px：固定两列，4 项为 2×2，3 / 5 项的末项跨满整行，2 项保持一行。超过 480px：所有项等宽单行。480px 来自原标题块 160px 最小单元 ×3，以开始容纳第三个完整单元为宽布局分界，不依赖视口或页面侧栏。
- 轨道使用 `minmax(0,1fr)`，单元 `min-width:0` / `overflow-wrap:anywhere`，长中文及连续数字可换行；既有数值字号和 tabular-nums 不变。事实栏仅内部列右侧画线，标题块沿用右/下单向分隔线，无叠加边框。
- 五主题（light / paper / dark / blueprint / blueprint-night）共用显式 bp-* 布局，普通组件不受影响。基线事实栏实际为固定两列、标题块为 auto-fit 160px，并非五主题已有独立窄屏规则；本轮按统一目标修正。
- 工程声明级网格检查不能代替实际 scrollWidth 与视觉检查；浏览器验收按分工由 Supervisor 执行。证据目录：`docs/blueprint/evidence/facts-narrow-20261017/`。

## 学情校准组件补齐（P97 · 2026-10-21）

设计状态：候选；工程准入：未开始。基线 `d25e358`。这是组件层实现与自测，不代表学情页面已接入或 Supervisor 已验收。

复用检索（离线）：Prism Badge / BpSizeBar / ChartLegend / chart-palette 与固定 coss Badge 已匹配，无需新增组件体系、依赖或上游代码。coss 源码保持；未联网检索 particles 最新实现。

- 悬停提示：Recharts Trend / Comparison 读取 `max(0px, var(--radius-md))`，core 保持 8px，白图与夜图为 0，与 ECharts 的 0px 几何一致。既有蓝图提示框 1.5px 描边规则保留。
- 色板：夜图第六色补为 `#B6BEC9`。夜图 CSS 与 JS 当前均定义 6 色，1–6 全量一致；7、8 两侧均未定义，本轮不新增。白图保留既有 1–5 CSS 桥接与 JS 6 色的边界。
- 状态标签：蓝图和夜图统一直角、1.5px 描边、card 纸面；语义色限于文字／边框／符号。Prism Badge 的可选 `mark` 为 ok / warn / no，显示 ✓ / ! / ✗；符号为装饰，文字状态仍必需，`variant` 独立选择。core 隐藏该符号且保留原外观，嵌套 core 根及其后代排除。
- 比例条：`BpSizeBar.rows[].display` 可给出完整汇总文字，如 `65% · 177 / 272`。未传 display 时仍为分段合计及单位；合计、图例与无障碍名称统一千分位。`total` 仍只决定宽度分母。`legendValues` 单行默认 true、多行默认 false；多行传 true 时每行独立列出所有分段与数值，重复 id 不串行合并，0 仍写出且不绘制宽度。`legend=false` 不影响可读名称中的值。合格使用 ink，排除／未核实使用 hatch，其他使用 quiet，业务分类由宿主给定。
- 共享图例：area / bar / segment 为类别，蓝图与夜图下方形；hatch 为斜线块。点类（包括不可比空心点、新情境菱形）和线类保持语义形状；不会自动把未声明语义的 dot 改为类别。显式颜色继续优先。新增 area / segment 在 core 退回既有圆点类别样式。

示例：[学情比例与状态样例](/next/foundations/blueprint#calibration)。包含 65% · 177 / 272、80% · 960 / 1,200、排除／未核实 0、记录数 12,345、三态标签与点／线／类别对照。完整 API 见 [组件契约](component-contracts.md)。工程检查见 [当前状态](blueprint/STATUS.md)；浏览器验收：按分工由 Supervisor 执行，覆盖 blueprint / blueprint-night / light，1280 / 390，并补 paper / dark 与嵌套 core 隔离回归。


## P99 · C0 学情概览组件抽取

设计状态：组件实现待 Supervisor 独立 Review；工程准入：未开始。本轮依批准扩展蓝图族，未改冻结 coss、core 令牌、依赖或 Workspace。推荐用于 blueprint / night；核心三主题中的显式 bp 组件使用既有中性令牌回退。

新增 `BpStat` / `BpStatStrip`，扩展 `BpSizeBar` 的 framed/size/hideRowLabel、标题项 tone/numeric、分节 density 和 Callout emphasis。完整 props、复用取舍、未知态规则及布局边界见[组件契约](component-contracts.md)。这些 bp 呈现封装不新增目录条目，不替代 MetricSummary。

示例 `/next/foundations/blueprint#overview-calibration` 组合 C0 SHEET 01 的七格标题栏、6px 强调 Callout、75%（+1 pp、1,684 / 2,250 分）、65%（177 / 95 / 17）、76%（626 / 197 / 43）、10 人及 compact B 节。保留 `#trend-calibration` 锚点，趋势图改为自动域，蓝图/夜图刻度应为 65 / 70 / 75 / 80。标题块沿用 P82 容器窄屏两列与奇数尾项铺满。

指标条按自身容器 ≥960 / 480–959 / <480px 排四/二/一列，末行填满；统计值使用已有 40px score-display 及等宽 700，单位为 ui-body 14px、标签 ui-meta 12px、紧凑标题 item-title 14px。与样稿约 15/11/16px 的差异是沿用正式语义字号，未新增字号令牌。未知/数据不足显示宿主文案，隐藏数值附属单位、增量与条形，保留说明与帮助。展开“查看未知态与长文案夹具”可核对。

验证边界：SSR/API、容器 CSS AST 与网格占位计算、P98 core SVG 指纹均为工程证据，不能当作视觉通过。浏览器验收：按分工由 Supervisor 执行；在 blueprint / blueprint-night / light 的 1280 / 390 与样稿并排，另检查窄容器两列、帮助展开、依据链接、未知态、长文案及 core 嵌套预览。独立 Review、浏览器验收与 PO 批准另行记录。


### P118 · PO 2026-10-25 来源呈现授权

设计状态：候选实现；工程准入：未开始。PO 授权 `ScoreReview.source`，宿主确认 `kind: "ai"` 时显示「来源 · AI 批阅」及实际版本；缺失写「来源 · AI 批阅 · 版本未提供」。D2 装饰条只在 blueprint / blueprint-night 显示，顺序为曜蓝 → 曜紫红 → 曜青绿，沿用三项阶段令牌；核心三主题只显示文字。未传属性时五主题输出不变。此授权不扩大到非批阅来源、文字、按钮、状态着色。完整契约见 [component-contracts.md](component-contracts.md)。

同轮修正四步 `BpSteps bars`：自身容器宽度 316px 至不足 648px 时 2×2，低于 316px 单列，648px 起四列；其他步数及 chips 不变。蓝图批阅演示以最大 500px 容器展示 2×2，并提供带合成版本的 ScoreReview；ScoreReview 原有演示提供缺失版本情形。实际主题、窄屏与交互验收由 Supervisor 执行。

## P122 · 框线层级与名称列宽（候选）

设计状态：候选；工程准入：未开始。基于 `7e814d22f0ab4efbd98bc2047a50124dd4f89100`，本轮补充 C0 K3/K5 所需的组件参数，不表示工作台已接入或浏览器已验收。

| 组件与可选参数 | 蓝图 / 夜图行为 |
| --- | --- |
| `BpStatStrip frame="subtle"` / `frame="none"` | subtle 使用 `1px solid var(--border)` 次级外框；none 无外框；格间 1px 分隔保持。 |
| `BpTitleBlock frame="subtle"` / `frame="none"` | subtle 外框 1px；none 去外框与单元格投影，用 `1px solid var(--line)` 保留内部分隔。自身窄容器两列与奇数末格跨满不变，外缘不补线。 |
| `BpSegTabs frame="subtle"` / `frame="none"` | subtle 外框 1px；none 无外框；选中态、内部分隔与横/纵键盘操作保持。 |
| `BpSectionCard frame="subtle"` / `frame="none"` | subtle 外框与表头线 1px；none 无外框、表头线仍 1px。selected 的显式选中投影和 density/titleRule 插槽保持独立。 |
| `BpSizeBar labelWidth="wide"` | 名称占行宽 40%，最小 120px；单行中间省略，最多保留末尾 4 个完整字素，短名称完整显示。title 与可访问名称包含全称；不改变数值、行意图或外部选中状态。 |

所有 frame 默认 `"default"`，labelWidth 默认 `"default"`。省略、undefined、显式 default 不输出新属性、不改基线 DOM；CSS 仅追加可选规则，原有 CSS 与主题 Token 原样保留。只有 StatStrip subtle 外框使用既有 `--border` 次级色，其余线沿用 `--line`，细线为已有 1px 规格；默认仍用原 `--line-width` / 1.5px。样式限定 blueprint / blueprint-night，排除嵌套核心预览根及后代，light / paper / dark 保留原外观。

wide 的自身容器 ≤420px 或视口 ≤760px 时，名称与汇总一行、条形下一行跨满，名称仍至少 40% / 120px；图例去原固定左缩进。hideRowLabel 或 xs 优先隐藏名称，宽列不生效。宿主组合负责最多两层框；不要通过组件参数推定业务状态。

复用检索（离线）：现有五个 Blueprint 呈现组件、Attachment 的前段省略/保留尾段和既有分段选择滚动足以实现；固定 coss Frame/Card/Tabs/Button 不需修改。未引入 particles 或第三方代码、依赖、新 Token、组件目录项，未联网刷新上游。新增 `BpFrame`、`BpStatStripProps`、`BpTitleBlockProps` 与已扩展的 Props 均从原 blueprint 模块直接导出，完整说明见[组件契约](component-contracts.md)。

演示入口：[框线层级](/next/foundations/blueprint#frame-variants)、[名称列宽](/next/foundations/blueprint#sizebar-label-width)。演示提供五主题、三档框线、两档列宽，长中文、公式文本、零值、行激活和嵌套核心主题；320px 小图用于检查桌面中的窄容器。默认字节对照、静态选择器/声明与实际演示控件路径由单测检查；浏览器计算样式与视觉、390/1280、悬停、键盘与读屏交 Supervisor 验收。Builder 不自我批准。
