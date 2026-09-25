# v1.14.0 字体实施候选 · 组件复用约定

组件负责呈现数据与返回事件。统计口径、流程跳转、业务判断、存储与模拟数据由调用方负责。所有 UI 使用现有 coss 控件、语义主题和数学字体；不重新实现按钮、选择框或 Drawer。

## 源码接入

80 个组件的既有行为基线沿用 v1.13.1；本轮统一字体为实施验证候选。按需复用源文件及其直接依赖，组件示例与应用示例用于说明用法。仓库保留 `private: true`，不通过 npm 包安装。

| 接入项 | 要求 |
| --- | --- |
| 运行依赖 | 当前验证基线：React 19.2.6、Tailwind CSS 4.2.1、Base UI 1.8.0；其他版本以 `package-lock.json` 为准。React 18 / Tailwind 3 需由接入项目另行适配验证 |
| 源码与别名 | 基础组件位于 `components/coss`；组合与扩展位于 `components/prism-next`。保留其 `lib` 依赖及 `@/*` 路径映射 |
| 样式 | 以 `app/(next)/next/theme.css` 为入口，保留 `vendor/coss-animations.css` 和 `tw-animate-css`；迁移目录时同步修正相对导入路径 |
| 主题根节点 | `html` 保留 `data-ui-version="coss-v1"`；`ThemeProvider` 使用 `attribute="data-prism-theme"` 和 `light` / `paper` / `dark` 三主题，浮层与正文共享主题 |
| 上下文 | 参考 `components/prism-next/providers.tsx` 组合 Theme、Motion、Tooltip 和 Toast；ECharts 封装也依赖主题上下文 |
| 数学字体 | 同步 `public/fonts/typography-review/stix-two-math.woff2` 及该目录授权文件；更改公开路径时同步 CSS 的字体 URL |
| 数据与事件 | 从业务容器传入真实数据、受控状态和回调。`fixtures`、`demos`、`examples` 中的数据和工作流仅供参考 |

在现有项目内直接导入组件：

```tsx
import { Button } from "@/components/coss/button"
import { Card, CardHeader, CardTitle, CardPanel } from "@/components/coss/card"

export function MaterialCard({ title, onOpen }: { title: string; onOpen: () => void }) {
  return <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardPanel><Button onClick={onOpen}>打开材料</Button></CardPanel>
  </Card>
}
```

该示例在客户端组件中使用。迁入其他框架时，按实际导入替换 Next.js 的 Link、导航或图片适配；不需要带入站点 Shell、组件目录或业务演示页面。

## Workspace 适配回收 v0.1

基于 Workspace `4e0d656` 的通用适配，保持本仓 main 既有默认值与 Typography v0.2.1。以下均不接 Store、权限判定、Runtime 或持久化；示例只手动设置外部状态。

| 组件 / 属性 | 默认值 | 语义与边界 |
| --- | --- | --- |
| AgentComposer `scope?: ReactNode` | 未提供 | conversation 位于 InputGroup 顶部、材料之前；default / compact 位于标签之后、文本区之前。范围由宿主提供 |
| AgentComposer `sendDisabled?: boolean` | `false` | 禁止表单与 Ctrl/⌘+Enter 发送，仍允许编辑 |
| AgentComposer `sendDisabledReason?: string` | 未提供 | 非空原因本身即阻断发送；以 `role=status` 常驻显示，输入与发送按钮用 `aria-describedby` 关联。建议阻断时始终提供具体原因 |
| AgentComposer `readOnly?: boolean` | `false` | 透传原生只读属性，保留可阅读/复制的草稿，同时阻止发送。运行态仍禁用输入；停止动作只取决于 `running / onStop`。宿主负责约束 scope/tools/suggestions 等插槽内控件 |
| MetricSummary `density?: 'default' / 'compact'` | `default` | compact 两列、标签与数值基线排列，说明另起一行；只改变布局，保留 analytics-value 字体与外部查看回调 |
| StatusComposition `density?: 'default' / 'compact'` | `default` | compact 图例横向换行，只读条 8px、可选择条仍 32px。只读图例显示数量，完整数量和占比保留于可访问说明及 title；零值、缺测、无效值规则保持 |
| QuestionPrint `showQuestionIds?: boolean` | `true` | `false` 隐藏纸面题目标识/版本行；题目序号、内部来源版本与版次计算不变，开关变化重新分页。不是敏感信息脱敏功能 |
| Prism Badge `variant='attention'` | 原 variant 默认不变 | 映射 coss 已有 error 变体；文字应表达待人工处理，不推断任务失败。Prism 默认 size 继续为 lg |
| Prism Button `size='navigation' / 'navigation-icon'` | 原 size 默认不变 | 从 `components/prism-next/button` 导入；文字按钮最小 40px、自适应高度，图标按钮 40px，粗指针最小/固定 44px。保留 coss 原字体与事件，可与 info 变体组合 |
| Prism Button `variant='info'` | 原 variant 默认不变 | 信息色用于“引导/信息性操作”，不替代主操作（default）层级，每个操作区仍只有一个主要动作。复用既有 info 语义令牌，保留 coss 尺寸、焦点、disabled、loading 与 render 行为 |
| Prism Toolbar `variant='framed' / 'plain'` | `framed` | 从 `components/prism-next/toolbar` 导入；framed 完整复用 coss，plain 复用同一 Base UI root 和子组件，仅省略外框，保留键盘与导航语义 |

Composer 的统一发送条件为 `!running && !readOnly && !sendDisabled && !sendDisabledReason && value.trim()`；不传新属性时原渲染与行为保持。发送原因不自动解除、只读不自动改变运行状态，组件不自行决定可用范围。示例：`/next/components/agent-components#composer-adaptations`、`/next/components/metric-summary#compact-summary`、`/next/components/status-composition#compact-composition`、`/next/components/question#print-metadata`、`/next/components/badge`、`/next/components/button`、`/next/components/toolbar`。

迁移时可用本次 Prism 源码替换 Composer、data-display、QuestionPrint、Badge；QuestionWorkPanel 与当前 Workspace 源码已一致。仍须同步直接依赖、Typography 样式及新的 Agent 语义导出，不回退 main 的任务快照语义。Button / Toolbar 的调用先切换 Prism 导入，再恢复相应 coss 原文件。Button info 已获 Product Owner 2026-09-24 批准，在 Prism 适配层复用 Workspace `4e0d656` 的 `border-info/30 bg-info/10 text-info-foreground hover:bg-info/20 focus-visible:ring-info`，加载指示器沿用 info-foreground 以保持可见。主题动画相对路径继续由宿主适配。Sidebar 本地中文/兼容保护、md=768、EmptyTitle lg 尚不能直接覆盖：涉及内部能力或规范冲突，保留到独立迁移与产品决定；本轮不修改 Workspace，也不证明升级已通过。

## 成果物输出 v0.1

2026-09-26 设计候选，语义 **33 成果物输出**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-artifact-output` 导入 `AgentArtifactOutput` 及同文件公开类型；不新增 80 项组件目录条目。

### 复用检索与 27 / 28 / QuestionPrint 边界

- **27 AgentExecutionResult 报告执行事实；33 负责格式、版式、范围、版本与文件交付，可以组合。** 27 的 `outputs/open` 只提供成果入口，没有输出配置；其成功回执不证明已经存在可下载文件。组合仍保持各自状态，不能在 27 的 unknown 内容插槽里放执行动作绕过原请求查询约束。
- **28 AgentDocumentWorkspace 承载已有文稿的阅读、编辑与批注。** 其 export 能力可请求打开 33；文稿保存、预览成功和格式支持都不能生成下载事实。两者引用同一成果身份与版本，不复制正文或引入统一 AST。
- `QuestionPrint` 已有受控纸面设置、真实浏览器测量分页及 `window.print()`，没有通用文件生成／下载回执契约。通过 33 的 `preview` 插槽复用，保留原行为；“打印 / 保存 PDF”是浏览器打印能力，不是导出服务已生成 PDF。打印预览比例的百分比与文件生成进度无关。
- 外框、固定标签、选项、状态、动作与说明复用 Card、Field / FieldLabel、Select、Prism Badge / Button、RecordDetails（coss Collapsible）。没有可复用的通用格式／版本／文件交付组合，因此增加本语义实现；不改 coss、依赖、视觉令牌、目录，不引入 Workspace 私有类型、业务 Store、路由、生成器或持久化。

### 公开 API

`AgentArtifactOutputProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `artifact` | 必填 `AgentOutputArtifact={id,title,version}` | 当前成果身份；`AgentArtifactVersion={id,label}` 分开保存内部引用与可读版本。id 只用于事件和比较，不作为文案或 DOM 标识 |
| `formats` | 必填 `readonly AgentArtifactFormat[]` | `{id,label,support}`：supported；lossy **必填 risk**；unsupported **必填 reason**。有损风险／不支持原因始终可见，不支持或有损说明缺失时不能生成 |
| `layouts / ranges / versions` | 必填 `readonly AgentArtifactOption[]` | `{id,label,disabledReason?}`；选项为宿主已授权可披露数据。versions 的 id 对应成果版本。disabledReason 存在即不可选；空值有明确兜底提示 |
| `value` | 必填 `AgentArtifactOutputOptions` | `{formatId,layoutId,rangeId,versionId}`，每项 `string / null`。不选第一项、不回填失效选择；Select 只使用本地序号为 DOM 值，内部引用不进入属性或可读标签 |
| `recommendedFormatId` | 可选 string，默认未提供 | Inline 快速导出使用此格式，加上受控版式／范围／版本；不修改 value.formatId。缺推荐或不支持则没有快速生成动作，不自行推荐 PDF |
| `output` | 必填 `AgentArtifactOutputRecord` | 当前输出记录；结构与状态见下表。记录上的格式、版式、范围与版本是当次事实，与当前选择独立，切换选项不能改写旧请求／文件 |
| `queue / history` | 可选 `readonly AgentArtifactOutputRecord[]` | queue 为同一成果的多文件输出队列，原顺序完整显示，不派发批量执行。history 全部为当时只读快照，无生成／查询／下载动作。缺省不推断无记录；显式 `[]` 显示暂无记录 |
| `onValueChange / onGenerate` | 可选 `(intent:AgentArtifactGenerateIntent)=>void` | `{artifactId,currentVersionId,options}`，复制四项值后返回。前者只请求更新选项，后者只请求生成；回调返回值、点击与布局变化不更新任务或文件状态。缺前者只读；缺后者无生成入口 |
| `generateDisabledReason` | 可选 string，默认未提供 | 存在即阻断生成并显示原因（包括空字符串）；不禁止单独调整合法选项。选择不完整／不可用同样阻断生成 |
| `onQuery` | 可选 `(intent:AgentArtifactQueryIntent)=>void` | `{artifactId,recordId,versionId,request:{id,runId}}`，只查询对应 unknown 记录的原请求，不拼装新请求／轮次；缺原关联或能力无入口并说明暂不可查询 |
| `onDownload` | 可选 `(intent:AgentArtifactDownloadIntent)=>void` | `{artifactId,recordId,versionId,fileId}`；只有 ready、关联匹配的 file、file.download 与本回调均存在才显示下载入口。此组件不接收 href 或原始存储路径；宿主复用已有文件下载动作，点击时重新核验实际文件与当前权限 |
| `view / density` | `inline / workspace` 默认 inline；`default / compact` 默认 default | compact 为密度，可与两种 view 组合；不增加第三种业务态，不隐藏失败／未知／不可用／旧版本提示 |
| `preview` | 可选 ReactNode，默认未提供 | 只在 workspace 挂载，内容与所选版本／范围的映射由宿主负责。可组合 QuestionPrint；unknown、关联不明、当前 expired/forbidden 不挂载，不能通过插槽绕过动作限制 |
| `onExpand / onBack` | 可选 `(trigger:HTMLButtonElement)=>void` / `()=>void` | Inline “更多输出选项”仅在有 onExpand 且无当前 unknown 时显示；workspace 可返回原位置。只发视图请求，焦点、位置与单一右栏由宿主维护 |
| `notice / details` | 可选 string / ReactNode | 每卡最多一条常驻边界提示；其他补充解释进默认收起“说明”。details 必须被动，不放执行按钮；风险、失败、未确认、旧版和禁用原因不可折叠隐藏 |

`AgentArtifactOutputRecord={id,artifactId,title,version,format,layout,range,status}`：version 为 `{id,label}`，format/layout/range 为当时可读文本。所有记录、文件、选项、标签和插槽必须已经过宿主的当前披露授权；组件的关联检查只是防误操作，不是授权或自动脱敏服务。跨成果批次由宿主按成果／权限分组组合本组件，不能把别的成果塞进当前卡片。

| `AgentArtifactOutputStatus` 分支 | 必填及可选字段 | 呈现与动作 |
| --- | --- | --- |
| idle | `description?` | 未开始。格式／选项有效且 onGenerate 可用时发出生成请求，不把本状态解释为请求已接收 |
| generating | `request:{id,runId}`、`progress?`、`description?` | 生成中。无进度不显示百分比；只显示外部传入的有限 0–100 数值，不裁剪或推算。100% 不转换为 ready |
| ready | `file:AgentArtifactOutputFile`、`description?` | 宿主声明已生成可下载；下载入口另须匹配文件、能力与处理回调，缺失时明确暂未提供可用入口，不生成链接 |
| failed | `reason` | 生成失败；允许在宿主明确给出 onGenerate 时按当前选择请求生成，不自动重试或清除失败事实 |
| unknown | `request:{id,runId}`、`reason`、`query?:AgentArtifactOutputAction` | 状态未确认。当前 output 或 queue 任一 unknown 都阻断该卡选项编辑、生成、下载、展开与预览，只允许查询各 unknown 原请求；纯返回与被动说明不受影响 |
| expired / forbidden | `reason` | 已过期／无权下载。没有文件入口，不显示误传的 file，不生成；后续允许操作须由宿主更新事实 |

`AgentArtifactOutputFile={id,name,version,sizeBytes?,generatedAt?,download?}`；`AgentArtifactOutputAction={label,disabledReason?}`。download 的提供同时意味着宿主已确认实际文件当前可访问，不能只从模型文本、预览或历史记录自动构造。file.version 必须与该输出记录版本相同才可下载；与当前成果版本不同仍可在合法能力下下载，但明确显示“基于旧版本”，请求仍使用文件对应版本。历史列表自身不提供下载；宿主若需要交付历史文件，须单独取得当前授权与可用性后作为当前可操作记录提供。

name 仅为可读文件名；包含路径分隔符或换行时不显示原值，而提示“文件名称未确认”。大小／生成时间缺失分别标未确认，不读取客户端时钟。原始存储路径没有公共字段；内部长 ID、请求／轮次／文件 ID、内部版本 ID 不输出到正文或 DOM 属性，允许披露的 title/label/reason 由宿主负责。空／重复选项 ID、空成果引用、错归属或重复当前记录 ID 阻断编辑／生成／文件操作。生成中也冻结配置与生成；独立 ready 文件的下载不从其他项进度推定。宿主仍须在服务层核验对象、版本、权限、幂等和迟到回执，组件不实施这些服务。

### 三种用法与验证边界

- **inline**：成果与当前版本 → 推荐格式及本次版式／范围／版本 → 可用快速导出 → 当前输出与下载入口 → 传入队列／历史的状态记录 → 更多输出选项。保留所有传入记录，缺展开入口也不会丢失失败或旧版事实。
- **workspace**：同源四项受控选择与风险 → 当前输出 → 宿主预览 → 完整批量队列 → 历史输出记录（只读） → 返回原位置。展开和返回不提交、不生成文件、不另建外壳。
- **compact**：可换行标题／状态行与较小间距；仍显示失败、未知、权限限制、有损风险、旧版及对应版本，不截断长中文或缩小字号。

`/next/components/agent-components#artifact-output` 提供试卷导出（PDF 支持、Word 有损、QuestionPrint、v1 历史文件）与学情报告导出（PDF 生成中无进度、Excel 不支持、附页状态未确认）两组标注示例，均有 inline / workspace / compact 与 320px 容器。打印仍使用 QuestionPrint 原行为；生成、查询、下载仅写示例反馈，没有实际文件链接。主状态通过独立示例按钮载入，不由导出点击推进；选项改变不重标已有文件或请求。

未合并候选 `feat/agent-artifact-output`，main 基线 `538f5ca`。测试、五项日志及 Workspace 本地 main `399bb75` 的只读轻量验证方案见 `.sites-runtime/artifact-output/REPORT.md`。本轮不启动开发服务、不操作 Git 提交、不修改 Workspace。浏览器三主题、窄容器视觉、键盘／焦点恢复、实际打印与下载、Workspace 接线、移动设备／读屏器和真实服务未验证；候选待 Supervisor 独立 Review。

## 内容输入 v0.1

2026-09-25 设计候选，语义 **06 内容输入**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-content-input` 导入 `AgentContentInput` 及同文件公开类型；沿用现有 Agent 组件页，不新增目录条目。

### 复用检索与职责边界

- `Textarea` 提供长文本受控编辑；`InputGroup` 组合字符数与格式身份；`Field / FieldLabel` 保留常驻固定标签；Card、Prism Badge / Button 和 RecordDetails 提供既有外框、状态、动作与说明。组件不新增 CSS 或视觉令牌，阅读／编辑使用 `text-read-body`，完整工作区正文宽度最多 40em。
- **AgentComposer 输入给 Agent 的指令**，例如“按以下材料生成讲评”；**06 输入任务材料／正文**，例如题干、参考答案、讲评要点、粘贴文章。06 不继承 Composer 的发送／停止、空白禁发或快捷键规则，不以正文提交假装发送指令。
- **28 AgentDocumentWorkspace 负责已有文稿的阅读、章节编辑、批注与历史**；06 负责把材料输入任务。已有提纲不因含 Textarea 就改归 06。P04 校对题干可在 17 的受控编辑插槽中组合 06，但复核动作、回执和依据保护继续归 17／宿主。
- `DraftMathPreview` 可作当前草稿预览；06 本身不导入它、Temml 或数学解析器，非数学接入无该依赖。预览失败继续显示当前原文，不修改字段、校验、保存或提交事实。
- 沿用 28 的安全字符串边界：Markdown 以原文输入，段落／列表等允许范围由宿主的 `limits.format` 与 `validation` 描述；不解析 HTML、嵌入、脚本、Markdown 链接，不自动清洗或改写正文。这里是安全文本编辑能力，不声称已实现富文本或 Markdown 渲染器。来源 URL 也仅作转义文字展示，不导航或抓取。

### 公开 API

`AgentContentInputProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `title / inputId` | 必填 `string / string` | title 为可读材料名称；inputId 引用宿主已有任务材料，不显示为教师文案或 DOM ID，不建立新权威对象。所属任务、会话、请求轮次由宿主闭包关联 |
| `content` | 必填 `AgentContentInputContent` | 单个 `AgentContentField`，或 `{type:'structured',fields:readonly AgentContentField[]}`。保持给定字段顺序，两态显示同一受控字段，不截断或自动从旧版初始化 |
| `baseVersion / draftVersion` | 可选 `string` | 宿主给定基准版／草稿版，适用时传入；缺省不推断。新材料可以没有基准版，已有材料的版本合法性由宿主提交前重验 |
| `save` | 可选 `AgentContentSave` | `{state,description?,autoSave?}`；state 为 `unsaved / saved-draft / submitted / conflict / unknown`，文案为未保存／已保存草稿／已提交／冲突／状态未确认。缺省 unknown；`autoSave` 只展示明确提供的自动保存事实文字，不调度保存 |
| `validation` | 可选 `AgentContentValidation` | 整份材料的宿主结果；字段结果另见下表。输入、展开、预览或点击均不清除或生成检查结果 |
| `conflict` | 可选 `{baseVersion,currentVersion,description}` | 冲突版本与原因常驻，输入仍保留可编辑；此项存在或 save.state 为 conflict 时阻断提交，等待宿主核对／更新。组件不提供覆盖写入或自行合并 |
| `submitted` | 可选 `{version,fields:readonly {label,value}[]}` | 独立的已提交快照；两态均标明版本，workspace 另列只读原文，绝不用于初始化／覆盖当前草稿。省略时不伪造已提交版 |
| `renderPreview` | 可选 `(field:AgentContentDraftValue)=>ReactNode` | 仅 workspace 对每个当前字段调用，参数为 `{id,label,type,value}` 的值快照。可返回 null；被动、已获准披露的内容，不引入提交旁路。组合 DraftMathPreview 时保持失败原文；预览带边界说明时不再重复 notice |
| `readOnlyReason / describedBy` | 可选 `string / string` | 整份材料只读原因常驻，阻断字段修改与提交；describedBy 接收外部已存在的说明 ID，例如 17 的状态说明。缺字段 onChange 也只读 |
| `onSubmit / submitLabel / submitDisabledReason` | 可选回调 / 默认“提交内容” / 可选原因 | 发出 `AgentContentSubmitIntent={inputId,baseVersion?,draftVersion?,fields:readonly {id,label,type,value}[]}`；内容快照不含回调，不能通过改写请求载荷回写输入。缺 onSubmit 无入口。禁用原因常驻且处理器也阻断；缺输入身份、字段空 ID 或重复 ID 同样阻断 |
| `view / density` | `inline / workspace` 默认 inline；`default / compact` 默认 default | compact 仅密度，不是第三种业务态；可与两种 view 组合 |
| `onExpand / onBack` | 可选 `(trigger:HTMLButtonElement)=>void / ()=>void` | Inline 仅有 onExpand 时显示“展开编辑”；workspace 可返回原位置。只改变宿主呈现，不保存／提交／清空；返回焦点和草稿恢复由宿主负责 |
| `notice / details` | 可选 `string / ReactNode` | 最多一条常驻边界提示；补充说明放默认收起的“说明”，不是藏错误的入口 |

`AgentContentField` 与辅助类型：

| 字段 | 类型与语义 |
| --- | --- |
| `id / label / type / value` | 均必填；id 在材料内唯一稳定，label 始终可见。type 为 `text / markdown / url-excerpt`；value 是完整受控字符串，空字符串也保留 |
| `onChange?` | `(value:string)=>void`，原样回传当前输入，不 trim、清洗、截断、合并或持久化；缺省为只读。每字段独立回调方便宿主接入已有 reducer |
| `placeholder? / description?` | 可选占位与字段说明；placeholder 不替代常驻标签 |
| `limits?` | `{maxLength?:number,format?:string}`，仅展示宿主约定的非负字符上限与格式要求；字符数按当前值 Unicode code point 计数（不是字形簇）。不写原生 maxLength／pattern／required，不据长度或格式计算有效性，超限输入仍完整保留；其他长度口径由宿主在 description／validation 说明 |
| `validation?` | `{state:'invalid',message:string}` 或 `{state:'valid'/'unknown',message?:string}`；只有 invalid 设置 aria-invalid 并公告失败。缺省不显示校验通过；输入后仍保持所传结果，直到宿主替换 |
| `source?` | 粘贴为 `{kind:'paste',label}`；URL 为 `{kind:'url',label,url,fetch?:{state,description?}}`。来源由宿主提供，不从剪贴板、输入内容或 URL 猜测；使用粘贴来源时必须标清实际出处，不能冒充原文读取 |
| `source.fetch.state` | `not-fetched / fetching / excerpt / full / failed / unknown`；分别显示未抓取全文／正在抓取·全文尚未确认／已取得摘录·未抓取全文／已抓取全文／抓取失败／全文抓取状态未确认。仅显式 full 才显示全文事实；缺 fetch 或 URL 摘录缺 source 均不升级事实 |
| `readOnlyReason?` | 此字段的只读原因，常驻并与控件关联；字段和全局只读保护均在事件处理器中生效 |

限制／校验是事实显示，不自行制定业务提交规则。需因 invalid、等待回执、保存状态不明或权限等阻断提交时，宿主传 `submitDisabledReason`；unknown 保存状态本身可能是新材料缺记录，不被推定成一次正在提交的请求。冲突保护遵循 §8.2：有冲突事实时不提交。宿主负责当前身份、权限、版本、格式校验、原请求核对及幂等，不以回调返回值或 Promise 成功当作保存回执。不持久化、不自动保存、不内置离开拦截；未可靠保存时的离开选择与恢复依 §8.3 由宿主实现。

### 三种用法与验证边界

- **inline**：材料名称、当前草稿与保存事实 → 单字段／少量字段、字符数、限制、校验与来源 → 提交请求 → 可选展开。所有传入字段均保留；宿主按轻量用途控制字段数量。
- **workspace**：同源长文本编辑与结构化字段组 → 可选当前草稿预览 → 独立已提交版本只读内容 → 提交／返回。编辑、预览与阅读使用 16/28，长中文换行，正文最多 40em。
- **compact**：收紧间距，完整保留标签、格式失败、来源／抓取未知、冲突版本和禁用原因；不折叠关键判断信息、不缩小字号。

`/next/components/agent-components#content-input` 有题干与答案（当前公式预览＋一处外部格式失败）、讲评要点（三字段“目标／活动／检查”，含 URL 摘录“未抓取全文”）两组固定示例。每组展示 inline / workspace / compact、320px 开关、共享草稿及手动保存状态；点击提交只显示请求反馈。公式预览中的解析错误与宿主格式校验分别呈现。

未合并组件候选在 `feat/agent-content-input`，基于 main `921397f`；测试、五项日志及 Workspace 本地 main `f1d8847` 的只读核对与两种公式方案见 `.sites-runtime/content-input/REPORT.md`。本轮不写 `.git`、不启动开发服务、不修改 Workspace。SSR／回调／解析检查不等于浏览器视觉、键盘、读屏器、Workspace 接线或真实服务验收，待 Supervisor 独立 Review。

## 对比查看器两态 v0.1

2026-09-24 设计候选，语义 15，支持 **Inline + 专用扩展内容**。检索与复用依据：当前 `AgentChangeReview` 已提供逐项比较、采用/保留及预览插槽；`32382e9:components/prism-next/agent-components.tsx` 已有组级 `AgentChangeSet`，本轮仅回收此组合与类型，扩展冲突和受控应用。没有新增目录条目、差异算法、承载骨架或 Workspace 业务类型。

从 `components/prism-next/agent-components` 导入 `AgentChangeSet`、`AgentChangeSetProps`、`AgentChangeSetItem`、`AgentChangeDecision`。

| 公开属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `view` | 必填 `'inline' / 'workspace'` | 两态内容选择；不创建面板，不改动 `presentation` 的外框语义 |
| `title / basis` | 必填 `string` | 整组标题与依据版本/来源；未知信息由宿主明确描述 |
| `items` | 必填 `readonly AgentChangeSetItem[]` | 两态使用同一受控集合；空数组显示“当前没有修改” |
| `inlineLimit` | `number`，默认 `2` | 有展开能力时展示前 N 项，加上所有关键项、冲突项，保持原顺序；有限值向下取整且至少 1，非有限值回退 2 |
| `onDecision` | 必填 `(id, decision: AgentChangeDecision) => void` | `accepted / kept` 为采用/保留意图；重新选择发出 `pending`；不变更草稿、清除冲突或保存 |
| `onRewrite` | 可选 `(id: string, value: string) => void` | 提供时显示带固定标签的受控文本区；改写后是否重置决定由宿主处理 |
| `onExpand` | 可选 `(trigger: HTMLButtonElement) => void` | 仅 inline 显示入口；不传则隐藏入口且显示全部项，避免不可达；宿主保存触发器并负责承载、焦点与返回恢复 |
| `notice` | 可选 `string` | 整组冲突/过期等事实提示，`role=status`；不自动阻断任何动作 |
| `details` | 可选 `ReactNode`，默认未提供 | 补充说明插槽，复用 coss Collapsible，入口为“说明”、默认收起；两态均可用，未提供时无入口。仅管理说明的展开，不触发业务回调；不放冲突、禁用原因或必要状态事实 |
| `disabledReason` | 可选 `string` | 非空时整组决定、重新选择、改写与应用禁用；比较与展开仍可用 |
| `apply` | 可选 `{ label: string; onApply: () => void; disabledReason?: string }` | 提供才显示动作；整组或动作的非空原因阻断应用并可访问关联。组件不按采用数量、冲突或项目禁用状态推算可应用性，不计算应用结果 |

`AgentChangeSetItem`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `id / title` | 必填 `string` | 集合内稳定唯一 ID / 项标题；采用、保留与重新选择的可访问名称含标题 |
| `before / after / reason` | 必填 `string` | 修改前、候选内容与建议理由；before 应明确对应当前比较对象，after 为受控候选 |
| `decision` | 必填 `'pending' / 'accepted' / 'kept'` | 外部决定状态；“已采用”仅指采用选择，不代表已应用、核对或保存 |
| `scope` | 可选 `string` | 适用范围，例如题干、第 1 页 |
| `critical` | 可选 `boolean`，默认未标记 | 标记后不受 inlineLimit 截断 |
| `conflict` | 可选 `{ baseLabel: string; currentLabel: string; description?: string }` | 显示“候选基于 rN，当前为 rM”及说明；同关键项始终可见，仍可比较后采用或保留，不推断冲突解决 |
| `beforePreview / afterPreview` | 可选 `ReactNode` | 宿主数学/领域渲染；缺省使用字符串正文，保留 before/after 作为文本与改写值 |
| `disabledReason` | 可选 `string` | 非空时只禁用本项决定、重新选择与改写，不隐含整组应用策略；宿主通过 apply.disabledReason 表达应用限制 |

逐项比较沿用 `AgentChangeReview`：当 before 与 after 相同或 after 为空白时采用按钮禁用，保留仍可用；这与冲突无关。各项禁用原因常驻显示，并与相关控件关联。数学插槽的内容有效性、可访问性及字符串一致性由宿主负责。

**组件职责**：渲染依据、统计外部决定、筛选 inline 可见项、呈现冲突和禁用原因、发出带 ID 的意图。关键项与冲突项始终显示，不受 inlineLimit 截断；不提供整组采纳。改写与采用只发出意图；草稿变更、应用、保存和提交由宿主处理。无 Store、路由、持久化、执行器、权限判断或保存状态；切换 view 不发出任何业务回调。

**宿主职责与 P04 接入**：

- 将同一份 P04 候选集按“题目 ID + 字段”映射到稳定 `items.id`，标题可为“第 2 题 · 对称轴”；`before` 传当前待比较草稿，`after` 传候选或手动改写内容。保留来源/候选基准到 basis，逐项版本变化由宿主检测后传 conflict；无需为两态各建一份草稿。
- `onDecision` 仅维护采用意向；`onRewrite` 更新候选并按宿主规则撤销旧选择。组件不会替宿主写入 P04 题目或清除冲突。
- `apply.onApply` 由宿主读取当前受控选择，再核验对象、权限、版本及适用范围，应用 accepted 项并返回真实结果；保存是独立动作。无 adopted 项、执行中或宿主不允许应用时，通过 `apply.disabledReason` 给出事实原因；组件不会自行阻断冲突项的比较选择。
- `onExpand(trigger)` 打开 Workspace `/teacher/agent/workspace` 既有工作区，传同一 items 和回调、`view="workspace"`；返回与重新打开保留候选、决定和阅读位置，并恢复触发器焦点。省略 onExpand 的 inline 显示全部项。
- `beforePreview / afterPreview` 可组合既有 `DraftMathPreview`，分别传当前文本；组件不绑定数学库或题目私有结构。

独立组件示例在 `/next/components/agent-components#change-set-two-state`，数据仅位于 `demos`；手动采用、改写与应用意图不证明业务生效。真实两态验证必须在 Workspace P04 流程完成；本仓库 `/next/skeletons/agent` 为历史骨架，不作验收依据。本轮未修改 Workspace，浏览器三主题、窄容器、长中文/公式实看、键盘/读屏及接入持久化仍待验证。

## 对象选择器 v0.1

2026-09-25 设计候选，语义 **01 对象选择器**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-object-picker` 导入 `AgentObjectPicker` 与同文件公开类型。不新增组件目录条目，目录保持 80 项。

### 复用检索与 01 / 02 边界

- 已核对 Combobox、Checkbox、DataRecordTable、FilterBar 和 AgentScopeBuilder。Combobox 支持受控查询与关闭默认过滤；Checkbox 提供原生键盘多选；DataRecordTable 的列渲染可组合选择控件；FilterBar 已有常驻固定标签。这些基础能力缺少跨对象类型的可用状态、推荐依据、跨结果选择及上限组合，因此补语义组合，不重造控件。
- **01 选定具体对象**（某班级、学生、教师、课程或任务）；**02 组合多维范围**（班级＋章节＋时间等）。02 可在 `renderEditor / renderInlineEditor` 内复用 01 作为某一维度的选择器，01 不接管范围汇总、校验、版本或确认。02 的 inline compact 仍只显示其范围摘要，不挂载编辑器。
- Workspace 表格只使用 DataRecordTable 的 `rows / columns`，在列内复用选择控件；不启用原有“查看记录 ID”的 `onSelect`，避免将查看混为选择或显示内部 ID。外框和辅助呈现复用 Card、Prism Badge/Button、Label、RecordDetails（coss Collapsible）。
- 选择不授予权限。候选、可见名称／辅助信息／原因、推荐、已选对象、搜索结果及加载事实全部由宿主给出；组件没有权限服务、模型、取数、业务 Store、路由、持久化或执行器。

### 公开 API

`AgentObjectPickerProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `title / objectType` | 必填 string / `{id,label}` | 可读标题和对象类型；类型 id 是宿主已有标识，缺失时禁用选择／移除／确认。label 为教师语言，不从 id 推导 |
| `selection` | 必填 `AgentObjectSelection` | `{mode:'single'}` 或 `{mode:'multiple',max?:number}`；单选直接请求替换，多选勾选／取消。max 为非负整数，0 不可新增；缺省无本地数量上限，非法上限禁止新增与确认；不截断现有选择 |
| `candidates` | 必填 `readonly AgentObjectCandidate[]` | 当前已获权结果，稳定唯一 id 与显示顺序由宿主提供；重复／空 id 不可选择。不选推荐默认值、不缓存结果 |
| `selectedIds / onSelectionChange?` | 必填只读 ID 数组 / `(ids:readonly string[])=>void` | 完全受控；请求新数组后等待宿主更新。单选传一个 id，多选仅增减目标；搜索、筛选、换页与 view 切换不改写选择。缺回调仅可查看选择 |
| `selectedCandidates?` | `readonly AgentObjectCandidate[]`，默认 [] | 当前页以外已选对象的**当前获权事实**；同 id 优先取 candidates，以避免旧摘要覆盖新失权结果。缺记录用通用“对象暂不可确认”，不显示 id，不悄悄移除。失效项仍可经已选摘要“移除”发请求 |
| `searchValue / onSearchChange?` | 必填 string / `(value:string)=>void` | workspace 固定标签 Combobox；只转发用户输入，保留空白，不转发选择项后产生的自动填充／清空。输入值及结果都由宿主更新；缺回调只读并说明搜索暂不可用 |
| `filters?` | `{fields:FilterField[],value:Record<string,string>,onChange?}` | workspace 复用 FilterBar，值变化只回调；不自动重置、发起请求或筛选。缺回调显示只读字段标签和值 |
| `filtering?` | 默认 host；`{mode:'host'}` 或 `{mode:'local',matches(candidate,query):boolean}` | 仅显式 local 时对当前 candidates 调用宿主提供的纯匹配函数；query 为 `{search,filters}`。不加载其他记录、不修改选中数组。restricted 项先投影到披露壳再交给 matcher。Combobox 始终 `filter={null}`，避免偷偷做第二层匹配 |
| `result` | 必填 `AgentObjectPickerResult` | `ready`、`loading(message?)`、`empty(message)`、`error(message)`；后三者不挂载旧候选选择控件，但保留已选摘要。loading/error 阻断确认；empty 不否定已选且有当前合法事实的对象。ready 的空结果只显示当前没有候选，不声称整个学校无对象 |
| `view / density` | inline/workspace 默认 inline；default/compact 默认 default | 两态与密度正交，compact 只调整间距，不缩字、不藏不可选原因，非第三态 |
| `inlineLimit / onExpand?` | 默认 3 / `(trigger:HTMLButtonElement)=>void` | 有展开能力时按宿主顺序取前 N 个有完整推荐依据或 recent 标记的快捷项，另保留所有已选和不可选结果。有限 N 取整且至少 1，非有限回退 3。缺 onExpand 无“更多选择”，保留所有已给出的结果；不猜测最近使用或任意挑默认项 |
| `loadMore?` | `{onLoad:()=>void,loading?:boolean,disabledReason?:string}` | 只在 workspace 提供“加载更多”请求；loading／原因及整组 loading/error 禁用且再次保护。不递增页码或推定加载完成；收到新 candidates 才呈现新结果 |
| `onConfirm? / confirmDisabledReason?` | `(ids:readonly string[])=>void` / string | 可选“确认选择”；只传当前数组副本，不生成确认、授权、保存、读取或执行事实。无选择、重复、失效、单选超量、多选超限、缺对象类型及 loading/error 阻断确认，原因常驻关联 |
| `disabledReason?` | string | 限制新增、取消、移除、批量和确认，原因常驻且处理器保护；搜索、筛选、查看、展开和返回仍属可用视图操作 |
| `onBack? / notice? / details?` | 可选函数 / string / ReactNode | 返回原位置只导航；notice 默认“选择对象不会授予访问权限。”，可替换成一条提示；补充说明进入默认收起的 details，不收纳关键不可选原因 |

`AgentObjectCandidate` 分支：

| 分支 | 字段 | 呈现 |
| --- | --- | --- |
| 可选 | `id,name,status:'available',description?,recent?,recommendation?` | 名称、辅助信息及宿主给定的最近使用／推荐，可选择 |
| 已归档 / 不可用 | 上述公共字段，`status:'archived'/'unavailable',reason` | 状态及原因始终保留；不允许新增，已选引用可移除 |
| 无权限 | `id,status:'restricted',disclosure:{name,reason}` | 只呈现允许披露的名称／原因；类型不接收私密 name、description、recent、recommendation，运行时也忽略误传字段，候选列表和已选摘要均遵守 |

`recommendation: AgentObjectRecommendation={reason,source}` 必须同时非空才标“推荐”，并常驻显示依据和来源。缺失来源／依据时显示“推荐依据未提供，暂不标为推荐”，不展示无来源推荐文案、不从 recent 或排序制造依据。IDs 只用于 React key 和请求关联，不作为可见文案、隐藏业务属性或标签回退；Combobox 内使用局部序号关联当前候选。

Workspace 批量范围是**当前展示结果中的可选项**，不代表全服务结果。新增部分加上已有选择超过上限时整批禁用，提示逐项选择，不任意截断选择前几人；“取消本页选择”保留页外项。已归档、失权、不可用、未解析、重复或超过上限的现有选择不被悄悄删除，确认被阻断，由用户移除／重选、宿主更新事实。

宿主先过滤所有输入、选中摘要和 details，失权时同步更新 `candidates / selectedCandidates`；不可见对象连披露壳也不得传入。组件不是任意文本脱敏器，选择和前端禁用都不是授权凭据。宿主收到意图后重新核对当前身份、对象、可用状态、上限、会话／版本与明确任务范围；异步搜索结果与旧组件回调的归属保护继续由宿主承担。

### 三种用法与验证边界

- **inline default**：对象类型与选择模式 → 已选摘要及失效原因 → 少量推荐／最近项（依据来源常驻）和不可选原因 → 可选确认与更多选择。单选直接选择，多选勾选。
- **workspace**：同一选择 → 固定标签搜索、筛选 → 当前页批量操作、DataRecordTable 完整结果与原因 → 可选加载更多、确认与返回。分页／搜索不创建第二份选择。
- **compact**：可与任一 view 组合，只减少 padding 和间距；长中文换行，全部不可选／失效／上限原因保持常驻，不使用省略或折叠隐藏。

组件页 `/next/components/agent-components#object-picker` 两组固定示例：班级单选（含一个只披露原因的无权限班级）；学生多选（已归档／不可用学生、上限 5、加载更多）。各有 inline / workspace / compact、320px 窄容器、长中文与说明内数学分式；三处共用受控选择、搜索与筛选。确认仅显示请求反馈，loading/empty/error 由独立示例控件手动指定。

任务分支 `feat/agent-object-picker`，基于 main `696061e`；仍为未合并**组件候选**。测试、五项日志与 Workspace 本地 main `25b431e` 的只读轻量接线方案见 `.sites-runtime/object-picker/REPORT.md`。不启动开发服务，不改 Workspace 或 `.git`。SSR、原生控件语义与回调测试不等于浏览器键盘／三主题／窄容器视觉、读屏器、Workspace 接入或真实服务验收，候选待 Supervisor 独立 Review。

## 指标摘要 v0.1

语义 19 `AgentMetricSummary`（`components/prism-next/agent-metric-summary.tsx`）声明 **Inline + 专用扩展内容**；为 Agent 场景组合既有指标展示，不新增目录条目。`view="inline" | "workspace"` 默认 inline；`density="default" | "compact"` 默认 default，compact 是独立密度，可与两态组合。

### 复用检索与取舍

- `MetricSummary` 已支持任意数值/单位节点、说明和 compact 排列；本组件的每项 KPI 都由它呈现，未另写指标控件。窄容器仅以布局类将列数重排为一列，保留 `analytics-value` 和语义字号。
- `GoalComparison` 内部由 baseline/current/target 计算进度，`StatusComposition` 内部求总量及占比。本次“不计算统计值”的契约不能直接消费这些派生结果，因此不改两者、不复制其算法；比较基准与变化作为外部已给定文字交给 MetricSummary 的说明区。日后确需目标进度或状态占比，须先给出宿主数值及独立适配设计。
- Workspace 趋势复用 `charts/basic-charts.tsx` 的 `TrendChart`，原样传序列、单位、范围；沿用其数据表、null 缺测断点与关闭动画行为。不从趋势生成结论、拟合、差值或显著性。
- Card、Button、Prism Badge、Collapsible、RecordDetails 继续复用。无依赖、视觉令牌、目录条目、业务 Store、权限服务、路由、执行器或持久化变更。

### 公开 API

| 属性 / 类型 | 含义 |
| --- | --- |
| `title: string` | 允许披露的卡片名称；整个范围受限时不渲染此标题，改用通用“指标摘要” |
| `record: {id, version, dataTime?, snapshot?}` | 既有记录引用、可读数据版本、宿主时间；snapshot 标“当时数据”，否则“当前状态”；不取客户端时间、不补最新数据 |
| `scope: AgentMetricScope` | `available` 带与 02 一致的 `summary` 和可选 `restricted: {count?,reason}`；`restricted` 仅带 `disclosure: {count?,reason}`。空摘要显示“未指定”，不扩成全部授权数据 |
| `groups: readonly AgentMetricGroup[]` | `{id,label,items,sample?,record?}`；可选 `sample={size:string,denominator?:string}`、`record={dataTime?:string,version?:string}` 显式声明组级共享事实；不统计或自动推断 |
| `AgentMetricAvailableItem` | `id/access:"available"/label/reading/method` 必填；可选 `key/sampleSize/denominator/dataTime/version/baseline/change/trend/statements`。key 由宿主挑选少量 KPI；sampleSize、denominator、baseline 是已格式化的可读文字 |
| `reading: AgentMetricReading` | `available` 带 `value:string|number`、可选 unit；原样保留精度、零值和负值，不格式化或重新计算。`missing/insufficient/unknown` 只带 reason，显示“—”及缺测/样本不足/状态未确认，不允许 value/unit；运行时也忽略误传值、单位、变化和趋势 |
| 受限指标 | `{id,access:"restricted",disclosure:{count?,reason}}`，只渲染允许的计数和原因，不渲染误传名称、指标、口径、版本、趋势、解释或动作 |
| `change: {text,direction?,significance?,basis}` | direction=`increase/decrease/unchanged/unknown`；significance=`significant/not-significant/unknown`；直接映射文字，不用正负号、差值、阈值或趋势判断。不传就不生成判断 |
| `AgentMetricBasis` | `{state:"available",id,label}` 或 `{state:"unavailable",reason}`。变化和每项异常都必须给依据；可用引用配 onDrilldown 才有“查看依据”，不可用或无回调明确显示暂不可查看 |
| `trend: {label,series,unit?,domain?,note?}` | ChartSeries[] 原样传给 TrendChart，保留 null 与零；note 是宿主提供的覆盖/缺测说明。仅 Workspace 且 reading=available 渲染 |
| `statements: {kind,text,source}[]` | kind=`explanation/conclusion/recommendation`，text 为宿主允许的只读 ReactNode；来源非空才显示正文，未提供来源时显示“来源未提供，暂不展示”。组件不因数值变化生成解释、结论或建议 |
| `anomalies: AgentMetricAnomaly[]` | 可用项 `{id,access:"available",text,basis}`；受限项 `{id,access:"restricted",disclosure}`。所有异常在两态两密度常驻，不根据指标识别异常 |
| `onDrilldown(intent, trigger)?` | 指标：`{recordId,version,kind:"metric",metricId,metricVersion}`；变化依据增加 `kind:"change",basisId`；异常依据：`{recordId,version,kind:"anomaly",anomalyId,basisId}`。record version 与指标版本分别保留，可接 21 AgentEvidenceDrilldown |
| `onExpand(trigger)? / onBack?` | Inline“查看指标详情”与 Workspace“返回原位置”；仅导航请求，不自行创建面板。缺 onExpand 没有入口且保留全部 KPI 摘要 |
| `notice? / details?` | 每卡最多一条常驻边界提示；补充说明复用默认收起的 RecordDetails，不收纳缺测、样本不足、状态未确认、显著变化、异常或受限事实 |

IDs 只作 key 与请求关联，不作为可见文字、隐藏 DOM 数据或回退标签。指标样本／分母未给时继承 group.sample；版本／时间按指标 → group.record → 顶层 record 取第一个非 undefined 值。仍缺失时，时间／版本显示未确认，样本／分母显示未提供；显式空版本不回退，并阻断下钻。历史调用必须传入完整的当时 record、指标与序列；不能拿当前值配一个旧标题冒充历史。

**2026-09-25 文案密度规则**：只对显式 group.sample / group.record 合并，不检测多个指标是否相同。共享字段在分组标题后常驻一次；指标未传或与组值严格相等时省略该字段，不同部分逐项显示（包括不同分母、样本不足和未知原因）。没有声明的字段仍按原规则逐项显示。无新字段时，包括单指标独立调用，原 SSR 不变。inline 仅在显式声明共享字段时使用分组布局；无可见指标的组不展示共享信息，全受限组不展示 sample/record。共享字段必须已允许披露。回调结构不变：metricVersion 使用有效指标版本，recordId/version 仍取顶层记录；历史共享字段也须为当时事实。

Workspace 可这样传入已确认的共享信息（示意，items 为原指标列表）：

```tsx
groups={[{
  id: "review", label: "复核数量", items,
  sample: { size: "26 份答卷", denominator: "26 份答卷" },
  record: { dataTime: "2026-09-25 11:30", version: "批阅示例 v2" },
}]}
```

只共享样本时省略 sample.denominator；不同指标继续传各自 denominator。指标自身 sampleSize / dataTime / version 可覆盖组值。未明确共享关系时保留旧调用，不补造样本、时间或版本。

宿主在传入前核验范围、版本和当前有效授权。所有分组标题、摘要、计数、异常、statements、趋势与 details 均须已允许披露；UI 受限分支只呈现授权结果，不充当权限判定器。整卡 scope=restricted 时连标题、记录版本、所有插槽与展开入口都不挂载；历史同样遵守。部分受限条目只有披露壳，禁止夹带可用字段。查看回调不认证已读取、已引用、模型使用、复核或保存事实。

### 三种用法与验证边界

| 用法 | 信息结构 |
| --- | --- |
| inline / default | MetricSummary compact 显示宿主标 key 的 KPI，加全部受限、缺测、样本不足、未知、显著变化、变化判断未确认及变化依据不可用的指标；所有异常常驻且有依据信息。口径与解释在逐项 Collapsible 中；趋势留在 Workspace |
| workspace / default | 全部分组、KPI、口径、带来源解释/结论/建议、宿主趋势及数据表；各允许指标可发下钻请求；保留返回入口 |
| 任一 view / compact | 仅减少卡片间距与 padding，不缩字、不截断、不藏关键事实；Workspace 同样保留完整分组和趋势。非第三种业务态 |

有 onExpand 却未标 key 且无关键事实时，Inline 明确“暂未指定关键指标”，不任意挑选数据；没有 onExpand 时全部摘要仍可读。下钻需要非空记录 ID、记录版本、指标 ID/版本或依据 ID，缺能力不造空按钮；历史允许只读的版本绑定下钻，权限与来源查询由宿主重新核验。

组件页 `/next/components/agent-components#metric-summary` 有班级学情与批阅进度两组固定示例，各覆盖 inline / workspace / compact、320px、长中文、数学、缺测、样本不足、显著下降和状态未确认。点击依据由示例宿主打开 21 的只读示例记录，记录不改写；示例可切换历史呈现。不新增分析业务流程或目录入口。

任务分支 `feat/agent-metric-summary`，main 基线 `cb5234d`。测试覆盖外部值原样显示、缺测与不确定性、变化判定、受限分支、只发请求、历史与紧凑密度。五项日志、SSR 样本与 Workspace main 只读接线建议见 `.sites-runtime/metric-summary/REPORT.md`。未启动开发服务；浏览器三主题、键盘/焦点、窄容器视觉、实体设备、读屏器和真实业务接入均未验证，仍待 Supervisor 独立 Review。

## 约束构建器 v0.1

2026-09-26 设计候选，语义 **08 约束构建器**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-constraint-builder` 导入 `AgentConstraintBuilder` 及同文件公开类型。未合并候选在 `feat/agent-constraint-builder`，基于 main `641a5d7`；不新增目录条目。

### 复用检索与 02 / 08 / 25 边界

- 已核对 AgentScopeBuilder、AgentExecutionConfirmation、Fieldset、Checkbox、RadioGroup、NumberField、Select、Alert 与 QuestionSelect / PointsField。02 缺少条件类型和冲突定位语义；25 负责确认，不是条件编辑器。QuestionSelect 丢弃 null、PointsField 默认限值并舍入，不适合不改写受控条件。因此 08 直接组合 coss 表单控件及 Card、Prism Badge / Button、RecordDetails，不新增控件、依赖、样式或视觉令牌。
- **02 回答哪些对象参与；08 回答执行或结果必须满足哪些条件；25 负责确认执行。** 08 不拥有确认按钮、执行状态或回执；值、默认值、校验、冲突及定位、影响、变化摘要和需重新确认的事实均来自宿主。冲突检查、比例求和、规则求解、权限及版本核验外置。
- PO 2026-09-25 已决定 P04「处理范围」中的排重／模糊页归属 **08 + 25**，不用于扩展 02 的范围语义。覆盖矩阵旧 P02→02 映射由此备注更正，矩阵原文不改。
- 按 v0.2.1 §10.4，25 新增可选 `conditions?: ReactNode` 条件区插槽；08 以 `presentation="inline"` 放入同一确认卡。未传插槽时保持原呈现和确认状态集合。组合只改变呈现：关键条件变化后，宿主同步更新 08 的 `reconfirmation` 和 25 的 `confirmation`，旧确认不授权新条件；08 不读取或改写 25 的状态。

### 公开 API

`AgentConstraintBuilderProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `title / basis` | 必填 string / `AgentConstraintTarget={objectId,version}` | 可读标题与既有对象／草稿版本引用；引用只用于事件，不作为界面文案或 DOM 标识。缺引用、空／重复条件 ID 阻断编辑和恢复默认 |
| `groups` | 必填 `readonly AgentConstraintGroup[]` | `{id,label,description?,items}`；分组、条目顺序和值受控，不创建内部草稿或业务副本。ID 稳定且唯一 |
| `reconfirmation` | 必填 `{required:false}` 或 `{required:true,reason:string}` | 仅展示宿主给出的重新确认事实；false 不表示已确认，true 不由 critical 标记、差异、版本或点击自动生成／清除 |
| `changes` | 可选 `readonly {id,label,description}[]` | 相对上次确认的变化，由宿主给出，workspace 展示；缺省为“暂未提供变化记录”，空数组为“没有条件变化”，不通过默认值推算 |
| `view / density` | inline/workspace 默认 inline；default/compact 默认 default | compact 为密度，非第三业务态；不缩字或折叠关键问题 |
| `presentation` | card/inline 默认 card | 仅控制外框；inline 可嵌入 25 的 conditions，不等于 workspace |
| `onValueChange` | 可选 `(change:AgentConstraintChange)=>void` | 返回 `{objectId,version,constraintId,type,value}`，type/value 类型关联。只发送新值，返回值与 Promise 不改变任何事实；缺回调控件禁用 |
| `onRestoreDefaults` | 可选 `(target:AgentConstraintTarget)=>void` | workspace 才显示“恢复默认”；仅发送当前对象／版本，不把 defaultValue 写入 value，不重置校验／确认 |
| `onLocateConflict` | 可选 `(request:AgentConstraintLocateRequest)=>void` | workspace 才显示定位按钮；返回 `{objectId,version,constraintId,target}`，只发出定位请求，不滚动、打开对象、执行或求解 |
| `onExpand / onBack` | 可选 `(trigger:HTMLButtonElement)=>void` / `()=>void` | inline 的“调整全部条件”缺 onExpand 无入口；workspace 可返回原位置。宿主保持同一份值、版本、焦点与阅读位置；08 不创建外壳 |
| `disabledReason` | 可选 string | 阻断所有条件编辑及恢复默认；原因常驻，处理器再次保护。展开、返回和只读定位不受影响；最终授权仍由宿主负责 |
| `notice / details` | 可选 string / ReactNode | 最多一条常驻边界提示，补充解释放默认收起的“说明”。组合时避免与 25 重复边界说明；关键冲突、不可用和需重新确认始终可见 |

`AgentConstraintItem` 共同字段：`id / label / critical / validation` 必填，`description / impact / disabledReason` 可选。`critical` 表示宿主指定的主要／关键条件，用于 Inline 选择；不自动使确认失效。影响文案原样展示，例如“排除第 4 页重复页”，组件不推算处理规模。默认值必填但只用于 workspace 展示，绝不传入控件的 defaultValue。

| `type` | 受控值与默认值 | 复用与边界 |
| --- | --- | --- |
| `toggle / required / forbidden` | `value / defaultValue: boolean` | Checkbox；true 表示该条约束启用，false 表示关闭。must／禁止不是访问授权或控件的 HTML required |
| `ratio` | `number \| null`；可选 `step` | NumberField，显示 % 单位；不补 0、不硬限 0–100、不计算比例合计或自动归一化 |
| `bounds` | `AgentConstraintBounds={min:number\|null,max:number\|null}`；可选 `unit / step` | 两个有固定标签的 NumberField；更新一端生成新值，保留另一端，不交换上下限、不舍入，不做跨字段判断 |
| `rule` | `string \| null`；必填 `options:readonly AgentConstraintOption[]`；`control?:select\|radio` 默认 select | Select 或 RadioGroup；option 为 `{value,label,disabledReason?}`。不可选原因保持可见，事件不接受未提供／禁用选项；未知现值不回退到默认项，不显示内部值代号 |

`AgentConstraintValidation`：`{state:"valid",reason?}` / `{state:"conflict",reason,targets:readonly AgentConstraintLocation[]}` / `{state:"unavailable",reason}`。结果必传；即使数值看起来矛盾，也不覆盖宿主给出的 valid 或补造冲突。conflict 仍可编辑以修正；unavailable 禁用该项，不移除当前值。单项 disabledReason 只限制该项。

`AgentConstraintLocation={objectId,version,label,location,anchor?}`；前两项及 anchor 为定位引用，界面只显示可读 label/location。组件不生成目标对象、不解释 anchor。宿主先过滤所有标签、选项、原因、影响、目标和插槽，防止无权内容进入界面；组件不是文本脱敏器。编辑／恢复／定位处理时，宿主重新核对当前对象、版本、任务归属与可用能力。

### 三种用法与验证边界

- **inline**：主要条件（critical）快捷编辑；非主要的冲突／不可用／禁用条件与不可选规则也保留。无 onExpand 时保留全部条件，避免无从访问隐藏项。所有问题集中在一块常驻 Alert 内，各行保留状态并以 aria-describedby 关联原因；只收起补充说明，不把关键问题放进 details。
- **workspace**：完整分组、类型与默认值、全部条件编辑、常驻冲突列表／外部定位、恢复默认、相对上次确认的变化、返回入口。
- **compact**：按行减少间距，保留原控件字号、固定标签、冲突及不可用的原因和定位文字、影响与重新确认事实；workspace + compact 仍保留完整分区。

组件页 `/next/components/agent-components#constraint-builder` 提供 P04 处理条件与函数单元组卷两组标注示例，各有 inline / workspace / compact 和 320px 入口。Inline 复用 25 的条件区；三个视图共用一份示例值，确认、默认恢复请求与独立载入示例结果分开。P04 初始模糊页条件不同于上次确认，需重新确认；载入示例确认后冻结，显式进入调整后再次改关键条件会失效。组卷提供题量范围、三项难度比例、禁止重复知识点、必须保留来源及两种枚举控件；一处“难度比例合计不为 100%”与一处规则不可用均由示例宿主提供，可手动切换，输入变化不自动清除。

本轮不启动开发服务、不改 Workspace、不写 .git。五项日志、测试清单、实际 diff 与 Workspace 本地 main 的只读接线方案见 `.sites-runtime/constraint-builder/REPORT.md`。SSR／回调测试不是浏览器、Workspace、真实服务或独立 Review 的通过结论。

## 范围构建器 v0.1

2026-09-25 设计候选，语义 **02 范围构建器**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-scope-builder` 导入 `AgentScopeBuilder` 及同文件公开类型。02 组合多维范围；01 AgentObjectPicker 选定具体对象，可在 02 的维度编辑插槽中复用。范围汇总、跨维度校验、版本和确认仍由 02 消费宿主事实，不交给 01。执行方式、必须／禁止条件由 08 AgentConstraintBuilder 编辑，执行确认由 25 承担；P04 的排重／模糊页属于 08 + 25（见上节）。范围选择不授予权限，未指定范围不等于使用全部授权数据。

### 复用检索与控件边界

- 已检索 TextbookRangePicker、TextbookDirectory / Tree、FilterBar、日期选择示例及 Agent 语义组合；已有控件覆盖字段选择，缺口是跨维度的范围校验、汇总与确认。因此只补通用呈现契约，不增加组件目录条目。
- 外框与提示复用 Card、Prism Badge / Button、RecordDetails（coss Collapsible）。编辑插槽接入已有选择控件，不在组件内新增选择器、取数、跨班规则或日期计算。
- TextbookRangePicker 的 `selections / onSelectionsChange` 承载已应用的叶节点选择，弹层仍是既有待应用草稿；取消不提交，应用选择不等于 Agent 范围确认。适配器将函数式更新解析到当前值，跨对象／版本变化时使旧弹层草稿失效。
- TextbookDirectory 组合 Tree 与外部目录数据；父级选择映射叶节点，不扩展为权限引擎。FilterBar 接收字段／选项／当前值并返回变更；日期选择复用 Calendar + Popover + 常驻 Label，合法日期与校验由宿主提供。
- 学情分析示例的章节用 TextbookRangePicker，备课章节用 TextbookDirectory / Tree；班级、教材、资源和时间快捷项用 FilterBar，完整时间范围用 Calendar。示例数据只在 demos，不导入 Workspace 私有类型，不改控件原实现。

### 公开 API

`AgentScopeBuilderProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `title / scope` | 必填 string / `AgentScopeTarget={scopeId,version}` | 可读标题及宿主已有范围／草稿版本引用，不建立新权威对象。引用只用于事件，不显示或写入 DOM；缺标识禁用编辑、确认、重置及默认恢复 |
| `dimensions` | 必填 `readonly AgentScopeDimension[]` | 完整受控维度清单，稳定唯一 ID 和顺序由宿主给出。没有内部初值、缓存、业务副本、值归一化或自动全选 |
| `summary / impact` | 必填 string/null / 可选 string | 已获准披露的可读范围摘要；summary 空白/null 显示“尚未指定范围”。impact 只在提供时显示，不根据选项、维度或可见条数推算规模 |
| `exclusions` | 可选 `readonly AgentScopeExclusion[]` | 只有 `{reason,count?}`，计数是允许披露的非负整数，0 保留。只显示原因／计数，不接受对象明细，不补造数量 |
| `confirmation` | 必填 `AgentScopeConfirmation` | unconfirmed 可带 reason；confirmed 必带其 version，可带 reason；changed 必带 reason。点击不改变状态；关键条件变化时宿主传 changed，已确认版本与当前 scope.version 不符时同样提示需重新确认 |
| `view / density` | inline/workspace 默认 inline；default/compact 默认 default | inline + compact 使用单行摘要（窄容器最多两行，展开详情后不限制高度）；workspace + compact 仍只收紧间距。字号不变，问题标记常驻，原因可一键展开 |
| `onValueChange` | 可选 `(change:AgentScopeChange)=>void` | 返回 `{scopeId,version,dimensionId,value:unknown}`；新值含 undefined、空值均原样发出，由适配器按 dimensionId 匹配类型、核验和更新。缺接收器不挂载编辑插槽 |
| `onConfirm` | 可选 `(target:AgentScopeTarget)=>void` | 仅请求确认当前范围，不启动任务或生成回执；缺回调无按钮。空摘要／空维度、缺引用、非有效校验或禁用原因均阻断确认，不在组件内求解冲突或判定必填值 |
| `onReset / onRestoreDefaults` | 可选 `(target)=>void` | 仅 workspace 显示重置／恢复默认，只发送当前版本的请求。组件不清空、不选默认项、不修改确认事实；宿主提供新值、校验和确认状态 |
| `onExpand / onBack` | 可选 `(trigger:HTMLButtonElement)=>void` / `()=>void` | inline default 的“调整完整范围”、inline compact 的“调整”缺回调无入口；workspace 可返回原位置。宿主保持同一值／版本、焦点与阅读位置；不创建外壳。compact 的本地只读详情入口始终存在，与 onExpand 独立 |
| `disabledReason / confirmDisabledReason` | 可选 string | 前者阻断全部编辑、确认、重置及默认恢复；后者只阻断确认。default / workspace 原因常驻关联，处理器再次保护；inline compact 标记常驻、原因可展开且在入口可访问名称中可读。查看、展开与返回不受影响 |
| `notice / details` | 可选 string / ReactNode | notice 缺省为“未指定的范围不自动使用全部可用对象。”；宿主可替换为一条边界提示，不在各维度 reason 或 details 重复。default / workspace 提示常驻，校验、范围变化、排除／不可用及禁用原因仍常驻；inline compact 的提示和原因统一放入本地折叠详情，问题及重新确认标记常驻，详见下文 |

`AgentScopeDimension` 共同字段为必填 `id / label / required` 与可选 `core`。label 是获准披露的维度名，不能塞入无权对象名称；required 只呈现必填身份，必填缺失由宿主传 conflict。

| 分支 | 输入 | 呈现与保护 |
| --- | --- | --- |
| `AgentScopeAvailableDimension` | `access:'available', source:{label,options:unknown}, value:unknown, summary:string/null, validation:{state:'valid'/'conflict'/'unavailable',reason}, disabledReason?, renderEditor?, renderInlineEditor?` | value/options 是不透明领域数据；summary 空白/null 表示未指定，非空表示宿主声明有选定值，宿主须保持其与 value 一致，组件不遍历 value 判断领域空值。只有 validation.state=valid 且 summary 非空才显示“有效”；valid + 未指定显示中性“未指定”，不显示该条 valid reason（包括重复边界说明），不改变校验事实或确认门槛。conflict / unavailable 始终保留警示和原因，即使未指定。workspace 显示来源；conflict 仍可编辑以纠正，unavailable 不挂载编辑控件 |
| `AgentScopeRestrictedDimension` | `access:'restricted', validation:{state:'out-of-scope',reason,count?}` 及共同字段 | 只接收允许披露的维度标签、原因和可选计数。类型禁止 value/source/summary/编辑插槽，运行时也忽略误传内容；非类型化 access 与 out-of-scope 矛盾时同样不挂载私密内容 |

`AgentScopeEditor={value,options,onChange,controlId,labelledBy,describedBy}` 是编辑插槽参数。仅在可访问、非 unavailable、无禁用原因且有 onValueChange 时调用；inline default 只调用显式轻量 `renderInlineEditor`，workspace 调用 `renderEditor`。inline compact 及其本地详情均只读，不挂载编辑插槽或确认按钮；确认与编辑须通过 onExpand 接至完整视图。控件须受控、保留常驻固定标签与说明关联，不通过插槽旁路执行。原生控件关联 controlId/describedBy；FilterBar 等自带标签的组合由外层有名 group 关联校验说明。

宿主先过滤对象、选项及全部元信息、汇总、排除说明、details 和插槽；组件不是任意文本脱敏器，不能先传原始无权数据再靠 CSS 隐藏。关键值、合法选项或权限变化时，同步范围版本、校验、摘要／规模及确认事实。确认处理重新核验归属、版本、当前授权与明确任务范围；过期请求不能生效。confirmed 的显示还要求当前版本匹配且无确认阻断，旧确认不能掩盖校验失败。历史／只读范围通过 disabledReason 限制，持久化、恢复、执行、权限及真实回执仍归宿主／受信任服务。

### 三种用法与验证边界

- **inline default**：摘要、明确提供的规模和排除说明 → 核心维度及全部问题／禁用维度 → 少量快捷编辑 → 确认、调整完整范围。无 onExpand 保留全部摘要，仍只提供显式轻量编辑。
- **workspace**：同一汇总及确认事实 → 所有维度、来源、逐项编辑和校验 → 确认、重置、默认恢复及返回；不新建任务或第二份草稿。
- **inline compact**：默认仅一行“范围：各维度标签与简短 summary／未指定”＋整体确认 Badge＋可选“调整”。只使用获准摘要，受限维度仅显示标签与“超出授权范围”；不读取其 value/source/summary。长摘要单行省略，可展开查看全文；窄容器将摘要与状态／操作分为最多两行，不缩字、不裁切状态或操作。
- 整体 Badge 来自必填 confirmation：待确认／已确认／需重确认；仍执行版本和确认阻断保护，不从值的存在或按钮点击制造确认事实。未提供 confirmation 不属于当前公开 API 的有效调用。
- 冲突、越权、不可用、维度禁用汇总为常驻“N 项需处理”；N 是问题维度数，同一维度只计一次，绝非无权对象数。只有全局编辑／确认受限时标“需处理”；只有排除说明时标“有排除项”。摘要按钮的可访问名称包含问题、禁用与排除原因；一键可展开的 keepMounted 详情承载所有维度、完整原因、明确提供的规模／排除计数、确认说明及边界提示，即使没有 onExpand 也可访问。
- **workspace compact**：保持原分区、来源、编辑及操作结构，仅减少间距；未指定状态和单条边界提示的语义修正同 default。

组件页 `/next/components/agent-components#scope-builder`：学情分析（班级＋章节＋时间，含一个只披露原因／数量的越权班级）；备课资料（教材版本＋章节＋资源类型，初始资料目录不可用）。每组 inline / workspace / compact 共用选择，compact 放入 AgentComposer 的 scope 插槽，附选填未指定维度；提供 320px、长中文和分式。手动载入可用范围后可请求确认，独立“载入示例确认记录”才显示已确认，修改后需重新确认；重置／默认也经独立示例载入。没有依据的新组合不显示影响规模。

历史实现记录：`feat/agent-scope-builder` 基于 main `b716d7e` 开发，现已随 PR #52 合入本轮基线 `6ae642f`。五项日志、测试及 Workspace main `a09071d` 的只读方案见 `.sites-runtime/scope-builder/REPORT.md`。当前 P04Scope 只有 deduplicate/blurry，更适合 08；新页“对话信息→关联范围”是只读展示，尚无编辑入口，接线决定见报告。本轮不写 `.git`、不启动开发服务、不改 Workspace。SSR／回调测试不代替浏览器三主题、窄容器、键盘／读屏、Workspace 或真实服务验证。

### compact 修正的 SSR 差异（main 6ae642f → fix/scope-builder-compact）

- inline compact：移除可见标题、状态段落、汇总区、逐维度卡片、轻量编辑、常驻边界提示及底部确认操作，替换为摘要行；整体状态缩为 Badge，新增常驻问题计数及默认关闭的本地 Collapsible（keepMounted）。原因、规模与排除事实仍在 SSR DOM 内，展开后可读；其存在于 HTML 不代表默认可见。
- inline default / workspace default / workspace compact：保留 header、汇总、维度顺序／筛选、来源、编辑、details 和动作结构。已有值且校验有效、有问题、禁用、过期确认等输入在提供 notice 时 SSR 与基线一致。
- 三种完整呈现仅有两类语义差异：valid + 未指定维度的“有效”改为“未指定”、重复 valid reason 不渲染，原说明 ID 移至值段落以保留编辑器关联；缺 notice 时补一条默认边界提示，显式 notice 原样保留。
- 组件页：compact 示例进入 AgentComposer.scope，增加选填未指定维度，边界提示集中到 notice。此处为示例 SSR 变化，不声称 Workspace 已接入或浏览器高度已验收。
- 本轮五项日志、SSR 前后输出与差异报告见 `.sites-runtime/scope-builder-compact/`；未启动开发服务，未修改 Workspace。

## 对象查看器 v0.1

2026-09-25 设计候选，语义 **14 对象查看器**，声明 **Inline + 通用扩展容器（领域内容可专用）**。从 `components/prism-next/agent-object-viewer` 导入 `AgentObjectViewer` 与同文件公开类型。不新增组件目录条目；80 项目录、coss、依赖与视觉令牌保持不变。

### 复用检索与领域边界

- `AgentArtifactPreview`（13）是成果摘要卡与打开入口；`AgentObjectViewer`（14）是**打开后的对象呈现**。前者的 `open.onAction` 由宿主接至后者所在的既有工作区，不给摘要预览补造独立 Workspace。
- `QuestionCard / QuestionDetails` 已提供题面、数学内容和详情分类，`DocumentRegionViewer` 已提供文档区域与定位；它们不承担跨领域对象的身份、版本、授权结果和统一分区。新增组合只补这些共同职责，内容以插槽接入，不导入领域模型或 Workspace 私有类型。
- 外框、按钮、标记、局部展开与“说明”复用 Card、Button、Prism Badge、coss Collapsible / RecordDetails。工作区的面板、专注、滚动恢复、路由、Store、权限检查和持久化仍由宿主承担；不引入第二套外壳。

### 公开 API

`AgentObjectViewerProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `object` | 必填 `AgentObjectIdentity` | `{id,type,name,displayId?}`；id 为不透明业务引用，type/name 为允许披露的教师语言。只有显式 displayId 才显示“编号”；不回退显示内部 ID，不写入 DOM 属性 |
| `version` | 必填 `AgentObjectVersion` | `{id,label,state:'current'/'historical',currentLabel?,difference?}`；id 只作关联，label 是可读版本。历史常驻“历史版本（只读）／当时版本”；currentLabel 仅为宿主提供的当前版本名。difference 是宿主的差异说明，缺省不猜测变更或声称没有差异 |
| `access` | 必填 `AgentObjectAccess` | available 分支必填 scope，可选 readOnlyReason；restricted 分支必填 reason。作用是呈现当前授权结果，不是权限判定 |
| `source` | 可选 string | 可读来源；缺失显示“来源未确认”，不从名称、版本或关联对象推断 |
| `sections` | 必填 `readonly AgentObjectSection[]` | 分区顺序与内容均由宿主提供，见下表。空数组只说“暂未提供对象内容” |
| `view / density` | inline / workspace 默认 inline；default / compact 默认 default | 两态与密度正交。compact 只调整留白，保留阅读字号、历史、受限原因和需确认提示，不形成第三种业务态 |
| `inlineLimit` | `1 / 2`，默认 2 | 按提供顺序常驻前 1–2 条具有 summary 的非敏感、可访问分区摘要；运行时非 1 值回退 2。所有分区仍有局部入口，不因缺 onExpand 变得不可达 |
| `activeSection` | 必填 `string / null` | 受控分区选择；workspace 目录标记选中项，不自选第一项、不维护副本。无匹配项明确不可定位；目录不自动确认敏感内容 |
| `onNavigate` | 可选 `(sectionId, trigger:HTMLButtonElement)=>void` | 只发导航请求，activeSection 更新后才滚动定位；缺省是静态目录。按钮通过生成的锚点关联分区，不将内部 ID 放入 HTML；定位不生成读取事实 |
| `versions / onVersionChange` | 可选 `readonly AgentObjectVersionOption[] / (intent,trigger)=>void` | option={id,label,state,disabledReason?}；仅 workspace 且有接收器时呈现。请求包含 `{objectId,versionId,targetVersionId}`，不改版本或内容；宿主取得当前授权的所选内容后更新 version/sections。当前选项不重复发请求 |
| `actions / onAction` | 可选 `readonly AgentObjectAction[] / (intent,trigger)=>void` | action={id,kind,label,disabledReason?}，kind 只接受 add-to-collection / review / drilldown。请求包含 `{objectId,versionId,actionId,kind}`；缺回调、未知种类或空 action.id 无入口，不解释按钮文案或执行脚本 |
| `relations / onOpenRelation` | 可选 `readonly AgentObjectRelation[] / (intent,trigger)=>void` | relation={id,relationship,name,openable?}；workspace 展示已获权的关联对象。仅 openable 且有接收器时可打开，请求为 `{objectId,versionId,relatedObjectId}`；无能力仍为可读关系 |
| `onExpand` | 可选 `(trigger:HTMLButtonElement)=>void` | inline 的“查看完整”，缺省无入口；不切 view、不新建面板、不读对象。宿主保持同一对象／版本并恢复原触发器焦点 |
| `onBack` | 可选 `()=>void` | workspace 返回原位置，仅视图导航；不保存、提交、取消任务或撤销操作 |
| `notice / details` | 可选 `string / ReactNode` | notice 至多一条常驻边界提示，details 默认收起“说明”；历史只读、受限原因、敏感确认、动作禁用和版本差异不移入说明 |

### 分区、权限与敏感确认

| 分支 | 输入 | 呈现与保护 |
| --- | --- | --- |
| 可访问分区 | `AgentObjectContentSection={id,title,access?:'available',summary?,content,sensitive?:{reason}}` | summary/content 是只读 ReactNode 插槽，正文字符串按文本转义。workspace 普通分区直接挂载 content；inline 使用独立 Collapsible 快速展开，默认收起 |
| 敏感分区 | 上述 sensitive 存在 | reason 常驻且关联“确认查看…”按钮；**summary 永不挂载**，content 只有明确确认展开后挂载。目录定位、“查看完整”和展开其他分区均不代替确认；不使用 keepMounted 或浏览器查找自动展开。确认只是局部披露，不是权限授权 |
| 受限分区 | `AgentObjectRestrictedSection={id,access:'restricted',disclosure:{label,reason}}` | 只接受当前允许披露的标题与原因；不接受正文、摘要、敏感内容或动作。运行时同样忽略误传的私密字段，不调用或挂载领域渲染器；所有密度常驻原因 |

对象／版本引用、当前／历史状态、可见范围变化会重建局部展开区；分区变为受限或敏感策略变化也会重建。敏感确认不随对象或版本复用，收起后再次打开仍使用明确的确认入口；不持久化确认。整体 access=restricted 时，只保留获准披露的身份／版本、受限原因与可选返回；不挂载来源、差异、分区、关联对象、notice/details、版本切换、展开或操作。

历史版本和 access.readOnlyReason 阻断加入集合及复核入口，仍可查看、切换获权版本、定位和下钻证据；全部插槽必须遵守只读边界，不得内嵌写操作绕过外部动作。缺对象或版本 id 时明确未确认并隐藏对象动作、版本请求、关联打开及完整查看；普通分区阅读仍可呈现。动作／版本的 disabledReason 常驻、可访问关联且事件处理再次保护。

宿主须先过滤所有内容与元信息，包含名称、可读编号、历史版本、差异、来源、关系、摘要和 details；不能先把无权访问的数据放进插槽再依赖 UI 隐藏。历史读取也按**当前**权限检查。id 与 label 分离不是任意文本脱敏器，宿主不得把内部长 ID 当作 name、displayId 或版本 label。`QuestionDetails` 的 archive 页会直接显示题目 ID：此示例只提供 answer 页，真实接入须省略不适用页或由宿主提供经过核准的可读档案内容，不能仅靠外壳隐藏。

查看器不接收或产生“已读取／已引用”状态，不从打开、定位、确认、版本变化或回调返回推断这些事实；需要证据时经 drilldown 接至既有 `AgentEvidenceDrilldown`。写入、复核、加入集合等请求由宿主重新校验权限、版本、对象归属和实际能力，组件不更新成果、集合、状态或历史。

### 三种用法与验证边界

- **inline**：对象身份、当前／当时版本、来源与可见范围 → 1–2 个关键摘要 → 全部分区的局部展开／敏感确认／受限原因 → 可用动作与“查看完整”。
- **workspace**：同一身份与事实 → 受控版本选项 → 分区目录与完整内容 → 关联对象 → 可用动作与返回；不自行管理外部容器。
- **compact**：上述内容保持，仅缩减间距并允许换行；历史只读、权限和敏感确认不隐藏。可用于 inline 或 workspace。

组件页 `/next/components/agent-components#object-viewer` 两组标注固定示例：题目通过 QuestionCard 与答案专用 QuestionDetails 插槽组合，答案需确认；学生作答通过 DocumentRegionViewer 展示人工区域，“家长联系方式”受限并说明原因。三处用法共用版本与目录选择；版本按钮先请求，独立“载入请求的示例版本”才替换示例数据，提供 320px、长中文和数学分式。不连接题库、OCR、作答或复核服务。

未合并候选：`feat/agent-object-viewer`，基于 main `c9980c8`。五项日志、测试清单和只读核对 Workspace main 的轻量验证方案见 `.sites-runtime/object-viewer/REPORT.md`。本轮不启动开发服务，不修改 Workspace 或 `.git`；SSR／回调检查不等于浏览器、Workspace 接入、读屏或真实服务验收。等待 Supervisor 独立 Review。

## 集合篮 v0.1

2026-09-25 设计候选，语义 **11 集合篮**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-collection-basket` 导入 `AgentCollectionBasket` 及同文件公开类型；不增加 80 项组件目录。用于暂存已选题目、素材、资源、学生等，不创建第二份集合数据源。

### 复用检索与外壳关系

- `QuestionWorkPanel` 只组合 coss 非模态 Drawer，负责开关、焦点和滚动接续；没有条目、分组、汇总或集合操作契约。集合篮提供内容，可放入它的 `children`，不重复实现 Drawer。Workspace 已有单右栏时直接挂集合篮内容，不再套 QuestionWorkPanel。
- `TeacherQuestionBasket.tsx` 和 `shared/basket-context.ts` 只读核对 Workspace main `125f2b286d6028a12a963b58667875d1d7ca773c`。题篮已有数量、题型、分值、移除与空态呈现；Provider、Store、计分、班级交接、持久化、路由和发布均留宿主，没有整文件迁入。当前 Context 暴露 body/renderBody/footer、toggle/show/change，没有暴露完整条目与总分快照，接入不能假定已有通用数据 API。
- `DataRecordTable` 提供表格列和单记录选择，未覆盖受控批量选择、集合身份、同步事实和失效条目处理；`AgentContextList` 主要承担来源事实列表。此候选组合 Card、Prism Badge/Button、Checkbox、Label、Select 与 RecordDetails（coss Collapsible），列表为语义化 ol/li，未重造基础控件。
- `QuestionCard` 保留题目内容职责，通过 `renderItem` 渲染摘要；通用组件不导入题目或 Workspace 私有类型，不接题目评分编辑。排序与分组仅为平面集合管理，不扩展为语义 12 的层级／试卷结构编辑器，也不宣称实现完整语义 38 素材包管理。

### 公开 API

`AgentCollectionBasketProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `collection` | 必填 `AgentCollectionIdentity` | `{id,title,type,version?,source?,snapshot?}`。引用已有集合身份；缺版本明确未确认。snapshot 存在（包括空串）标历史、所有集合操作与选择只读；不从当前集合回填历史内容 |
| `items` | 必填 `readonly AgentCollectionItem[]` | 稳定唯一 ID、宿主顺序、已授权内容；两态共用同一输入。不另建条目缓存或内部业务副本 |
| `summary` | 必填 `AgentCollectionSummary` | `{count:number|null,unit?:string,fields?:AgentCollectionField[]}`；count 的 null 显示未确认，零保留，unit 默认项。`fields={label,value:string|number}` 可传宿主计算的总分等；组件不从 items 重算数量或分数，不用可见条数替代总量 |
| `groups` | 可选 `readonly AgentCollectionGroup[]` | `{id,label,count:number|null}`；组 ID 唯一。计数仅显示宿主值；不根据列表推算。按分组查看保留各组内输入顺序，未分组、未知分组与受限条目各自保留，不静默丢弃 |
| `sync` | 可选 `AgentCollectionSync`，默认 unknown | local / synced / failed / unknown 分别呈现本页暂存／已同步／同步失败／状态未确认。failed 必填 description，其余可选。可带 action 请求检查同步等；点击不改变同步事实。没有时间、动画或回调返回值推断 |
| `changes` | 可选 `readonly AgentCollectionChange[]` | `{id,kind:'added'/'removed',description}`；仅显示宿主给出的当时变化，加入与移除不由点击或数组差异生成，也不自动消失。描述须经宿主披露检查 |
| `view / density` | inline / workspace 默认 inline；default / compact 默认 default | 两态及独立密度；compact 仅调整间距，不隐藏失效、冲突、受限、同步失败、未知与禁用原因，不缩字 |
| `inlineLimit / onExpand` | 默认 3 / 可选 `(trigger:HTMLButtonElement)=>void` | 有 onExpand 时前 N 项加所有失效／冲突／受限项，保持原顺序；非有限 N 回退 3，其余向下取整至少 1。缺回调无“管理全部”入口且保留全部项。workspace 不重复显示入口；展开不操作集合 |
| `groupBy / onGroupByChange` | none / group 默认 none；可选回调 | workspace 的受控列表排列方式；只改变呈现。分组视图禁用排序并说明“请切回集合顺序后调整”，避免组内视觉次序误当集合顺序 |
| `selectedIds / onSelectionChange` | 只读 ID 数组默认 [] / 可选回调 | workspace 批量选择、全选可选条目、清除选择；不修改集合。失效选中 ID 不被悄悄过滤，批量动作整批阻断并可清除选择；跨两态连续性由宿主持有 |
| `clear / destinations` | 可选 action / 只读 action 数组 | action 为 `{id,label,disabledReason?}`；clear 仅 workspace，去向两态显示、第一项主操作。缺能力无入口；给出的能力但缺 onAction 显示禁用原因。集合级动作目标为全部传入 items，宿主必须提供完整目标清单并核验，不能把服务总量中未提供的 ID 算进影响范围 |
| `batchActions` | 可选 `readonly AgentCollectionBatchAction[]` | `{id,label,itemIds,disabledReason?}`，workspace 专用。明确目标须非空、无重复、均存在且可选，并与 selectedIds 集合完全相符；否则整批禁用，不缩减范围。有效回调保留 action.itemIds 的顺序与每项输入版本 |
| `onAction` | 可选 `(intent,trigger?:HTMLElement)=>void` | 类型化动作请求，见下文；不执行保存、组卷或发布。按钮传触发器，分组选择传 Select 触发器（未挂载时可缺省）；宿主负责完成后的焦点接续 |
| `renderItem` | 可选 `(item:AgentCollectionEntry,{density})=>ReactNode` | 只在 workspace 调用，受限条目绝不调用。用于 QuestionCard 摘要等当前授权的只读领域内容；不得放旁路写操作或未授权元数据。完整题干沿用阅读字号 |
| `onBack / notice / details / emptyText` | 均可选 | 返回原位置只导航；最多一条常驻边界提示；补充说明默认收起；空态默认“集合中还没有条目”。关键事实不能移入 details |

### 条目、权限与动作

`AgentCollectionEntry={id,title,type,access?:'available',source?,version?,groupId?,summary?,fields?,issue?,selectable?,actions?}`。source、version 缺省各自未确认；不从内容或集合版本补值。`issue={state:'invalid'/'conflict',reason}` 由宿主标记下架、版本变化等，原因常驻；是否仍可移除、分组、选中或用于其他操作由宿主明确给出，组件不自行解决冲突。`selectable={disabledReason?}` 明确提供才有选择控件。

`AgentCollectionRestrictedEntry={id,access:'restricted',disclosure:{label,reason},actions?:{remove?,resolve?}}` 只接受可披露名称、原因与明确可用的移除／处理动作。不会读取误传的 title/source/version/summary/fields/groupId/issue/selectable/move/group，也不挂载 renderItem。受限条目的版本不传出。集合标题、总量、分组、最近变化与 details 同样必须由宿主事先按当前权限处理；此分支只呈现授权结果，不是服务端授权。

条目 `actions`：remove 为 `{disabledReason?}`；move 分别声明 up/down 能力，始终提供文字按钮与既有 navigation 触控尺寸，不依赖拖拽或悬停；group 为 `{options:[{id:string|null,label}],disabledReason?}`，null 请求取消分组；resolve 是宿主注册的 action 数组。不存在的能力不补造。控件禁用原因常驻并以 aria-describedby 关联，处理函数也阻断；首尾排序按传入全列表判断，回传实际相邻 ID。宿主提供 move 能力时须考虑被交换的相邻项权限。

所有 `AgentCollectionIntent` 共含 `{collectionId,collectionVersion?}`，其分支为：

| kind | 其余字段 | 含义 |
| --- | --- | --- |
| remove | itemId, version? | 请求移除此引用，非删除源对象 |
| move | itemId, version?, direction:'up'/'down', adjacentId | 请求与指定相邻项调整顺序，不改变输入数组 |
| group | itemId, version?, groupId:string/null | 请求移至宿主选项中的分组，不改本地分组值 |
| resolve | itemId, version?, actionId | 请求查看替代项、核对版本、申请查看等明确能力 |
| clear / destination / batch | actionId, targets:readonly `{itemId,version?}`[] | 对明确目标范围请求操作；用于组卷／练习不等于已经创建试卷或布置任务 |
| sync | actionId | 请求宿主核对同步，不创建保存结果 |

集合级、批量及 resolve 的业务含义由受控 actionId 注册映射；组件不根据按钮名称识别“移除”或“发布”。宿主必须在提供这些能力时核对每项权限、有效版本、可用动作、影响范围与必要确认，不能用批量／清空绕过单项限制；收到请求时重新核验身份、版本与并发。按钮是否禁用不代替授权，当前快照不代表未来版本仍可写。组件没有 Store、Provider、路由、持久化、计分、班级交接、执行器或计时器。

### 三种用法与验证边界

- Inline：集合身份／版本 → 宿主数量、汇总及分组计数 → 同步与最近变化事实 → 前 N 项及全部问题项 → 主去向与“管理全部”。缺 onExpand 时清单保持可达。
- Workspace：同一事实 → 集合顺序／分组呈现 → 受控选择与批量动作 → 全清单、领域插槽、移除、处理、分组和上移／下移 → 去向、清空与可选返回；无第二套工作区外壳。
- Compact：与任一 view 组合，只收紧间距；同步失败、失效与受限原因仍在折叠区外。

组件页 `/next/components/agent-components#collection-basket` 原位示例：试题篮含宿主分值汇总、一项下架题、QuestionCard 数学摘要；备课素材包含图片／视频／文章和两组。三处使用同一示例列表与选择，提供 320px、四种手动同步记录、空集合和独立载入示例变化；示例宿主可以更新本页条目和汇总，组件本身只发请求。无真实题库、同步或去向服务，不复制 Workspace 数据源。

本轮任务分支 `feat/agent-collection-basket`，main 基线 `9e6fa12`，状态为**组件候选**；测试与五项日志、Workspace 只接呈现的轻量验证方案见 `.sites-runtime/collection-basket/REPORT.md`。不启动开发服务，不修改 Workspace 或 Git；浏览器三主题、窄容器、键盘焦点／触控、读屏器、Workspace 接入和真实服务分别待验，不用 SSR 或回调测试代替。

## 文件输入 v0.1

语义 04 `AgentFileInput`，两态声明为 **Inline + 专用扩展内容**。源码 `components/prism-next/agent-file-input.tsx`，示例 `/next/components/agent-components#file-input`。本轮为 `feat/agent-file-input` 组件候选；不等于 Workspace 或真实服务验收。

### 复用检索与职责

已检索 coss Input／Button／Card／Progress／Collapsible、AgentComposer 插槽和 `examples/teacher-use-cases/parsing-workspace.tsx:59` 的 `readFiles`。Input 的 `nativeInput` 保留原生 `<input type="file">`；Prism Button 的 navigation 尺寸复用已有触屏目标。现有解析示例按扩展名和大小检查、图片建立临时预览、PDF 仅登记元数据，包含示例状态与本机保存，因此不整体迁入。缺口是可跨场景使用的受控文件队列、动作和独立事实呈现，不新增目录条目或上传服务。

### 公开 API

从 `@/components/prism-next/agent-file-input` 导入组件及 `AgentFileInputProps / AgentFileItem / AgentFileStatus / AgentFileCapabilities / AgentFileLimits / AgentFileAction / AgentFileRequest / AgentFileIntent / AgentFileBatchAction / AgentFileBatchIntent`。

| 属性 | 约定 |
| --- | --- |
| `title / items` | 标题与只读受控队列；条目 `id` 唯一且稳定。宿主只提供当前获权可见的文件名、类型、来源、元数据与内容 |
| `limits` | 必填 `{accept,acceptLabel,maxFileSize,maxFiles}`；大小单位字节，大小／数量为正值。`accept` 是原生选择器提示，`acceptLabel` 是可读类型说明；两者须一致，不是内容安全校验 |
| `capabilities` | 必填 `select:{status:'supported',reason?}`、`upload`、`drop`。后两者为 `supported`（可选 reason）或 `limited / unsupported`（必填 reason）；上传 unsupported 显示“未接入”。宿主按设备声明拖放能力，触屏始终可用原生选择入口 |
| `onSelect(files: File[])` | 选择／拖入后唯一回调；完整交付所选文件，不截断超量文件、不判定合法、不读取内容。空选择不回调，原生 input 值立即清空。不得把接到此事件视为上传、读取或解析回执 |
| `selectionDisabledReason?` | 阻止选择及拖入并显示关联原因；不会禁用独立的原请求查询。宿主按当前权限决定 |
| `onAction?(intent)` | 移除、替换、重试、查询、排序意图。`fileId / version?` 指向传入条目；`kind='move'` 附 `direction:'up'/'down' / adjacentId`；retry 附原 `requestId?`；query 必带原 `requestId`。不修改列表、版本或执行事实 |
| `view / density` | `inline / workspace` 默认 inline；`default / compact` 默认 default。inline compact 使用单行队列；workspace 的两种密度维持原呈现。compact 不改变字号、事实或动作规则，不是第三种业务态 |
| `inlineLimit / onExpand?` | 默认 3 项；非有限值回退 3、其他值取整且至少 1。有 onExpand 且超限时提供“管理全部”，传出触发按钮供恢复焦点。校验失败、上传失败、unknown 永不因阈值隐藏；无 onExpand 则显示完整列表且无展开入口 |
| `groupBy / onGroupByChange?` | 默认 `none` 即外部数组顺序；workspace 支持 `status` 分组，并保留每组内原顺序。回调只请求呈现变化。分组时排序按钮显示“请切回文件顺序后调整” |
| `batchActions / onBatchAction?` | Workspace 专用。动作 `{id,label,kind:'remove'/'upload'/'retry',fileIds,disabledReason?}`，宿主明确目标集合；回调原样返回 `{id,kind,fileIds}`，不静默缩减目标集合 |
| `onBack? / notice? / details?` | 返回只导航；一条可选常驻边界提示；其余解释进入默认收起的“说明”。default 与 workspace 的失败、未知、能力限制及禁用原因始终可见；inline compact 的披露方式见下文 |

### 条目与状态

`AgentFileItem={id,name,type,sizeBytes?,source:{kind:'local'/'existing',label?},version?,status,processing?,actions?,details?,preview?}`。条目没有 File 字段，组件不把文件对象放入状态、全局缓存或存储。未知名称／类型／大小／版本／时间显示未确认；不从扩展名、当前时间或查看动作补造外部事实。

| `status.state` | 专属字段与呈现 |
| --- | --- |
| `selected` | 本机文件显示“已选择（仅本机）”；已有资料引用显示“已选择（已有资料）”。不能映射为已接收或已上传；状态分组统称“已选择” |
| `invalid` | 校验未通过；必填 `validation:'type'/'size'/'count'` 和 `reason` |
| `queued` | 等待上传；不能推定请求已接收 |
| `received` | 已接收；必填 `request:{id,label}`，仅确认对应原请求接收 |
| `uploading` | 上传中；必填 request。仅 `progress` 为 0–100 有限数时显示百分比，缺省或越界显示“进度未确认”；100% 也不会转成已上传 |
| `uploaded` | 已上传；上传时间取 `uploadedAt?`，版本取条目的 `version?`；未知分别显示未确认 |
| `failed` | 上传失败；必填 reason；可带原 request 及 `retry:{disabledReason?}`，仅宿主显式给出重试能力才有入口 |
| `unknown` | 状态未确认；必填 reason 与原 request；只可带 `query:{disabledReason?}`。即使非类型化输入注入 remove／replace／move／retry，也不呈现；原请求 ID 为空时禁止查询 |
| `removed` | 已移除记录，不自动从外部队列删除，不提供变更动作 |

`processing:{label,description?}` 是可选独立后续处理事实；不由上传完成、进度或预览派生。`actions:{remove?,replace?,move?}` 每项为 `{disabledReason?}`，仅代表宿主提供该能力；缺 onAction 的声明动作显示不可用原因并在处理函数中阻断。替换回调请求宿主打开替换流程，不自行读取或覆盖旧文件。

Workspace 每条记录可展开文件详情，`preview` 与条目 `details` 是只呈现的授权内容插槽；没有预览则说明未提供，不建立 Blob URL。全局 `details` 是补充说明。插槽不得插入绕过 unknown 限制的业务操作或隐私内容。

排序通过始终可见的“上移／下移”按钮完成，键盘和触屏均可操作；首尾／不可用原因关联到按钮。移动会带出相邻 ID，宿主需核对当前队列版本；禁止跨 unknown 相邻项悄悄改变其顺序。状态分组仅改变视图，不改变权威队列。

批量动作只识别上述三类；目标为空、缺失、重复、含 unknown 或 removed 时整批不可执行。上传只允许 selected／queued，重试只允许有 retry 能力且无禁用原因的 failed；unsupported 上传同时阻断上传与重试。单项明确禁用的移除不能被批量动作绕过。动作范围、权限、版本、幂等、失败恢复及是否可保留本机文件均由宿主／服务核验，组件禁用不能替代受信任检查。

### 三种用法与 Composer 组合

- Inline：固定标签的选择入口、能力／限制、少量文件和关键异常；超阈值时展开同一队列。
- Workspace：完整队列、状态分组、宿主给出的批量动作、可折叠文件详情与排序；返回不提交、不取消、不保存。
- Compact（仅 inline）：每个文件默认一行，呈现文件名详情入口、状态 Badge 和获授权的移除图标按钮。名称可截断，`title` 与可访问名称保留全文；移除按钮的可访问名称含文件名。文件详情入口通过原生按钮响应键盘，展开关联的 Collapsible 后显示完整名称、类型、大小、来源、校验／失败／未确认原因及其余可用动作。异常状态文字始终可见，原因同时出现在详情入口的可访问名称中，一键展开可读；移除禁用原因同样可展开，并关联到移除按钮。unknown 仍只有查询原请求，不因紧凑布局获得移除等能力。
- Compact 能力说明：只保留一条最关键的常驻提示，优先显示选择禁用原因，否则显示外部声明的上传能力；不自行推定已执行本机校验。选择、上传、拖放的详细能力与原因、类型／大小／数量限制、notice 和 details 合并到默认收起的“说明”。原生文件 input、常驻标签、键盘入口与完整 aria-describedby 关联保留，说明面板保持挂载。使用既有 Input sm、Button sm／icon-sm，不新增字号或视觉令牌。
- default inline 及 workspace 两种密度的 SSR 输出，以 main `7bf305b` 的九组夹具（完整状态、禁用与分组、空队列）作字节一致性回归。

`AgentComposer variant="conversation"` 的 `attachments` 放 `<AgentFileInput density="compact" ... />`，`tools` 放打开同队列的按钮／既有资料入口。当前 default／compact Composer 分支不渲染 attachments/tools，不应宣称这两个分支已支持文件插槽；需要时在 Composer 外并列组合。示例已实际使用 conversation 组合，AgentFileInput 没有嵌套 form，所有队列按钮均为 `type="button"`；Composer 发送不自动触发上传。Composer 的 readOnly／running 不会自动约束插槽，宿主须同步选择限制及动作能力。

扫描图片／PDF 示例含本机选择、大小失败、已有资料选用与已移除；备课 Word／Excel 示例含明确失败、回执不明、等待上传、未知／已知进度与上传后独立解析记录。两组均展示三种用法及 320px 窄容器，并明确“示例不实际上传”。示例宿主 `checkExampleFiles` 只检查名称后缀、大小和数量；不接扫描、OCR、文件内容读取、真实上传、全局缓存或持久化。Word／Excel 的输入候选不扩大原解析流程 Step1 的读取、编辑或转换能力。

## 文档工作区 v0.1

2026-09-25 设计候选，语义 **28 文档工作区**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-document-workspace` 导入 `AgentDocumentWorkspace` 及同文件公开类型；不新增 80 项组件目录条目。范围为教案、讲评稿、提纲、报告等长稿的阅读、章节编辑与批注承载，不包含 Office／富文本编辑器、文件解析或格式转换。

其 export 快速操作可由宿主打开 33 AgentArtifactOutput 的输出配置，保持同一成果身份与版本；28 的保存／阅读事实不替代 33 的文件可用性。详见“成果物输出 v0.1”。

### 复用检索与格式边界

- `DocumentRegionViewer` 复用范围是页区域、缩放和定位，不提供文稿章节、编辑、保存和批注契约；需要原稿区域时可由宿主放入章节 `content`，不强制将长文装成页图。
- `ReadingWorkspace` 含 `localStorage` 和本地草稿管理，不能整页迁入；`Tree` 是基于外部树实例的通用选择控件，本项仅需带嵌套列表的章节导航，不复制树引擎或结构编辑能力。
- 外框、字段、输入、状态和披露复用 Card、Field / FieldLabel、Textarea、Button、Prism Badge、Collapsible / RecordDetails；目录支持方向键移动焦点与 Enter/Space 激活。只调整布局和间距；采用既有 48rem 容器断点，窄容器目录可展开。
- 未发现现有 Markdown 解析依赖。字符串一律按纯文本由 React 转义，以 `text-read-body`、保留换行和最多 40em 阅读宽度呈现；不解析 HTML 或 Markdown。Markdown、Word、PDF 等已处理内容由宿主传入 ReactNode，不新增解析依赖或统一 AST。数学可组合 MathContent 中的 RootFormula、MathML 或 DraftMathPreview；组件不会转换或验证公式。

### 公开 API

`AgentDocumentWorkspaceProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `document` | 必填 `AgentDocument` | `{id,title,version,format,contentScope,source?,snapshot?,currentVersion?}`；字符串均由宿主提供。contentScope 明示全文或已提供的局部范围；版本不从内容/保存状态推导。snapshot **存在即历史**（包括空字符串），标“历史版本（只读）／当时版本”；currentVersion 仅按需说明当前版，不回填当时事实 |
| `capabilities` | 必填 `AgentDocumentCapabilities` | 查看 view、编辑 edit、批注 annotate、导出 export 四项均须声明；模型见下表。格式支持不等于授权，服务端仍须重新核验 |
| `sections` | 必填 `readonly AgentDocumentSection[]` | `{id,title,content:ReactNode,children?}`，递归标题树；ID 在整份文档中唯一、跨两态稳定。空数组明确未提供章节；宿主仅传当前允许披露的内容 |
| `activeSection / onNavigate` | 必填 `string / null`；可选 `(sectionId,trigger:HTMLButtonElement)=>void` | 受控当前章节；点击目录或批注定位只发请求，收到新 activeSection 才更新选中并滚动到该章。不自动选第一项；失效 ID 提示重新选择，不替换成其他章。缺回调目录只读；方向键/Home/End 仅移动焦点 |
| `view / density` | `inline / workspace` 默认 inline；`default / compact` 默认 default | compact 仅改变间距与换行，可与两种 view 组合，不是第三种业务态 |
| `preview` | 可选 `AgentDocumentPreview={kind:'summary'/'excerpt',range,content}` | Inline 的摘要或节选及宿主给定范围；不从完整正文自动截取、不根据摘要/打开/滚动生成已读取或已引用记录 |
| `draft` | 可选 `AgentDocumentDraft` | `{baseVersion,values:Readonly<Record<sectionId,string/undefined>>,onChange,readOnlyReason?}`。仅 workspace 当前选中章使用 Textarea；值缺省则明确未提供，不从阅读内容初始化副本；空字符串可编辑。readOnlyReason 或缺基准版本时保留输入且只读 |
| `save` | 可选 `AgentDocumentSave={state,description?}` | 五值 `unsaved / saved-draft / submitted / conflict / unknown` 分别呈现未保存／已保存草稿／已提交／冲突／状态未确认；缺省 unknown。历史显示所传的当时保存状态，不从当前状态补值，不读时钟 |
| `annotations` | 可选 `readonly AgentDocumentAnnotation[]` | `{id,version,anchor:{sectionId,paragraph?},author,time?,state,content:string}`。state 为 open/resolved/unknown（待处理／已处理／状态未确认）；时间缺失未确认，记录不被自动追加或更改。逐条保留版本、章节/段落、作者、时间和状态；只有版本匹配且章节存在才提供定位 |
| `onAddAnnotation` | 可选 `(intent:AgentDocumentAnnotationIntent)=>void` | workspace 当前章节的新增批注请求 `{documentId,version,sectionId}`；不打开内置编辑器、不生成批注。段落标识由宿主批注界面收集；已存在批注可传 paragraph。缺能力或回调、历史版本、无当前章节时不显示入口 |
| `quickActions / onAction` | 可选 `readonly AgentDocumentAction[]` / `(intent)=>void` | 动作为 `{id,label,capability,disabledReason?}`；四类能力白名单，unsupported、未声明能力或缺 onAction 时无入口。回传 `{documentId,version,actionId,capability}`，不执行任意脚本或 URL；禁用原因常驻并关联按钮，处理器也阻断 |
| `onExpand / onBack` | 可选 `(trigger:HTMLButtonElement)=>void` / `()=>void` | Inline “打开文档”只在可查看、身份/版本完整且传回调时显示；workspace 可选返回原位置。均为视图请求，不提交、保存、丢弃、取消或生成读取事实 |
| `notice / details` | 可选 `string / ReactNode` | 至多一条常驻边界提示；其余补充说明默认收起“说明”。能力限制、有损风险、未确认、冲突与禁用原因不得移入 details |

`draft.onChange` 接收 `AgentDocumentChange={documentId,version,baseVersion,sectionId,value}`，保留空格、换行与空文本；组件不持有任何草稿副本、不持久化、不改写原输入。宿主同步 `values` 与对应阅读 `content`；阅读内容不会被组件假定为最新草稿。保存/提交操作可由明确的 quickAction 请求，但无内置保存实现、回执推导或自动提交。冲突为宿主事实，组件仍可编辑已有草稿；宿主需要锁定时传 readOnlyReason。权限、版本并发校验与最终写入始终由受信任层完成。

### 必填能力声明

每一项 `AgentDocumentCapability` 都含 `status` 与 `conversion`：

| 字段 | 取值 | 呈现与边界 |
| --- | --- | --- |
| `status` | supported | 可选 reason；只有对应回调和内容实际可用时才显示操作 |
| `status` | limited / unsupported | **必填 reason**，全部密度常驻；limited 只开放明确支持的范围，unsupported 没有可执行入口 |
| `conversion` | `{state:'none'}` | 宿主明确声明该能力不涉及有损转换；不能以字段缺失代替 |
| `conversion` | `{state:'lossy'/'unknown',description:string}` | 必填风险说明，常驻“转换风险／转换风险未确认”；不因 compact 隐藏 |

`view=unsupported` 不渲染摘要、章节、草稿、批注内容及任何快速动作或展开入口，仍保留可披露身份、能力说明与返回。`edit=unsupported` 不渲染章节编辑；`annotate=unsupported` 不显示新增批注，既有获权批注仍可阅读；`export=unsupported` 不显示相应快速操作。历史版本强制不渲染 draft，不显示编辑/批注动作；仍可导航、查看和请求按当时版本导出。所有 ReactNode 插槽必须是当前授权且符合该版本只读边界的内容，不能用插槽内的写操作绕过能力限制。

### 三种用法与验证边界

- **inline**：身份／版本／格式、内容范围、保存事实与能力摘要 → 宿主给定范围的摘要或节选 → 实际可用快速操作 → 打开文档。
- **workspace**：同一文档元信息与能力 → 完整标题树和提供范围内的全部正文 → 当前章节的受控纯文本编辑 → 带版本/锚点的批注清单与新增请求 → 可选返回。历史版仅展示当时内容；不另建 Drawer、业务路由或版本存储。
- **compact**：仍保留范围、能力限制、有损风险、保存未知/冲突和操作禁用原因；仅收紧布局，不截断长中文、不缩小阅读字号。

示例入口 `/next/components/agent-components#document-workspace`：可编辑的五环节备课提纲，以及仅阅读的 PDF 讲评材料（仅有指定页摘录、批注 limited、导出 unsupported）。二者均提供 inline / workspace / compact、历史版开关、五类保存状态与 320px 容器。公式由示例宿主渲染，点击不制造读取/引用或保存完成记录。

未合并候选分支 `feat/agent-document-workspace`，main 基线 `fcc929d`。测试、五项日志及 Workspace main `edbcbb1` 的只读验证方案评估见 `.sites-runtime/document-workspace/REPORT.md`。P04 已有三道题的校对稿与历史快照，可提供全文阅读的局部验证；没有自然的教案/讲评长稿，不能将逐题编辑冒充完整长文工作。完整验证建议在既有 `/teacher/agent/workspace` 只接入 local-start 五环节提纲的对象渲染与原有宿主草稿；不新增业务流程或格式适配器，具体接入范围待 Supervisor 收敛。不启动开发服务、不修改 Workspace；浏览器三主题、窄容器、键盘焦点、移动设备、读屏器和真实服务未验证，候选待独立 Review。

## 审核队列 v0.1

2026-09-25 设计候选，语义 **16 审核队列**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-review-queue` 导入 `AgentReviewQueue` 及同文件公开类型。16 管理集合呈现、“下一项”及批量请求；17 AgentItemReviewer 处理单个对象的证据、确认与修订；18 AgentExceptionHandler 接收异常查看／处理请求。不新增目录条目或业务权威对象。

### 复用检索与 16 / 17 配对

- 已核对 DataRecordTable、FilterBar、Badge、Checkbox、AgentObjectPicker、AgentItemReviewer。前四项提供表格、固定标签筛选、状态与选择；01 的对象候选／推荐语义不等于审核队列；17 只有单项复核。因此补集合层组合，不另造表格、选择控件、状态词表或业务 Store。
- Workspace 用 DataRecordTable 的 `rows / columns`，在列内组合选择框、身份、状态和具名动作。**不传其 `onSelect`**，避免基础表格的“查看内部 ID”按钮。窄容器保留可聚焦、具名的局部横向滚动区，长中文按列换行，文字不缩小。
- `AgentReviewQueueItem` 直接复用 `AgentItemReviewTarget`、`AgentItemReview`；`agentItemReviewLabels` 从 17 导出，共享“待复核 / 已编辑未提交 / 复核提交中 / 回执未确认 / 已复核 / 已退回 / 失败 / 已过期”的七值词表（“已退回 / 失败”为同一标签）。组件不读取或执行 `review.actions / query`，这些留给 17；打开不会确认、修订或查询。
- 优先级、排序、下一项、责任人、协作占用及版本变化均为宿主事实。`processingByOther` 的存在表示他人正在处理，不从责任人名称推断；禁用 UI 不是协作锁或权限校验。

### 公开 API

`AgentReviewQueueProps`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `title / queue / items` | 必填；`queue={id,version,snapshot?}`；`items: readonly AgentReviewQueueItem[]` | 已授权、按宿主顺序的当前结果或历史快照；内部 ID 只用于 key／回调，不进入 DOM、文案、可访问名称或缺名兜底 |
| `counts?` | `Readonly<Partial<Record<AgentItemReviewState,number>>>` | 只显示传入值；inline 或 compact 隐藏精确的 0，workspace/default 保留 0。非零及无效值（显示未确认）常驻；缺项不补 0。未传／空对象显示“状态计数未提供”，全零被省略不误报缺失。不从条目推算 |
| `progress?` | `{reviewed:number,total:number}` | 仅传入时显示“已复核 12/40”等原值，不计算百分比或从条目补分母。计数／进度值不是非负整数时显示“未确认” |
| `view / density` | `inline / workspace` 默认 inline；`default / compact` 默认 default | 两种业务呈现与独立密度；compact 收紧间距并省略零值计数，不隐藏非零计数、未知、过期、草稿、协作、冲突和异常事实 |
| `inlineLimit?` | number，默认 3 | 有 onExpand 时显示宿主顺序前 N 项，加全部关键状态／异常／禁用／版本变化／他人处理条目，以及当前选择和下一项；N 归一到正整数。缺 onExpand 显示全部输入项 |
| `nextItemId? / onNext?` | ID；`(target,trigger)=>void` | 只打开宿主指定的下一项，不自行找首个待复核或按优先级计算。两者均有才呈现按钮；目标缺失／不可打开则禁用并解释，不跳到另一对象 |
| `onOpen?` | `(target,trigger)=>void` | 条目 `openable=true` 才有“打开复核”；交给 17；可以打开未知／过期对象进行查询／重新复核，队列自身不重提请求 |
| `onInspectException?` | `(target & {exceptionId},trigger)=>void` | 可关联 18；只发具名异常查看请求，不识别或处置异常 |
| `filters?` | `AgentReviewQueueFilters={fields:FilterField[],value:Record<string,string>,onChange?}` | Workspace 复用 FilterBar；只回调新值，不过滤 items、不改 counts、不重置选择。缺回调显示固定标签和可读选项值 |
| `sort?` | `{field:FilterField,value:string,onChange?}` | Workspace 同样复用 FilterBar；只返回选项值，不运行比较器或修改输入顺序；缺回调只读 |
| `selectedIds? / onSelectionChange?` | readonly string[] 默认 []；`(ids)=>void` | Workspace 受控批量选择；仅可选择有匹配批量能力且状态允许的条目。无回调只读。筛选外选择或重复选择仍保留，整批操作被阻断，可恢复筛选或显式清空 |
| `batchActions? / onBatchAction?` | readonly `AgentReviewQueueBatchAction[]` 默认 []；`(intent)=>void` | Workspace 仅呈现宿主动作。缺回调、未选、能力不匹配、任一条目不可操作均禁用**整批**，不偷偷跳过部分对象；返回值／Promise 不当回执 |
| `disabledReason?` | string | 原因常驻，阻断选择及对象／批量动作；筛选、排序与展开／返回独立 |
| `onExpand? / onBack?` | `(trigger:HTMLButtonElement)=>void` / `()=>void` | Inline 的“进入审核队列”与 Workspace 的返回；纯呈现导航。缺 onExpand 无入口，Workspace 不重复入口；宿主负责相同对象、草稿、选择、滚动与焦点恢复 |
| `notice? / details?` | string / ReactNode | notice 最多一条常驻边界提示；details 是默认收起“说明”，只收纳补充解释；必要状态与原因不能移入其中 |

`AgentReviewQueueItem` 在 `AgentItemReviewTarget={id,title,version}` 上增加：

| 字段 | 契约 |
| --- | --- |
| `displayNumber?:string / typeLabel:string` | 可读编号与类型；无可读名称／编号显示“未命名对象”，不以内部 ID 兜底 |
| `review:AgentItemReview` | 17 的原始外部状态、说明及相应事实。队列呈现状态和说明，详细原请求／回执由 17 展开 |
| `priority?:{label,reason}` | 优先级及理由由宿主提供；不比较等级、不生成推荐原因、不改变顺序 |
| `assignee?:string` | 可披露的责任人；缺省“未提供”，不自动分派当前用户 |
| `processingByOther?:{name,description?}` | 他人处理事实及说明常驻；选择不可用，不呈现该项打开复核、“下一项”或异常入口；原有选择不自动移除，混选时整批禁用 |
| `versionChange?:{currentVersion?,description?}` | 传入表示旧依据已过期；保留原 version。若原状态是 waiting / unknown，**同时保留已过期与在途／未知状态**；不自动换版本或重建请求 |
| `exceptions?:readonly {id,label,description?}[]` | 常驻异常标记与原因，ID 只用于回调；不是组件检测出来的异常 |
| `openable?:boolean / batchActionIds?:readonly string[] / disabledReason?:string` | 已获授权的能力声明与禁用原因；不构成受信任权限。批量还要求 waiting-human / draft / failed 且没有版本变化／协作占用；waiting / unknown / resolved / expired 不接受注入的批量能力 |

`AgentReviewQueueTarget={queueId,queueVersion,itemId,version}`。`AgentReviewQueueBatchAction={id,label,impact,disabledReason?}`；影响和禁用原因常驻并关联按钮。`AgentReviewQueueBatchIntent={queueId,queueVersion,actionId,items:readonly {itemId,version}[]}`，保留受控选择顺序、绑定每项复核依据，不只发数量。宿主在执行前核对所属任务／会话／轮次、当前权限、对象与版本、动作和幂等；将结果**逐项**映射回 `review`，再提供整体计数／进度。

`queue.snapshot=true` 标“当时状态”，仅显示传入的当时顺序、版本与计数，去掉选择、批量、打开／下一项／异常动作，筛选排序只读；展开与返回仍可用于查看同一快照。所有条目、计数、责任人、筛选选项和插槽内容须已获授权，队列不实现数据脱敏或重新授权。

### 三种用法与验证边界

- **inline**：队列身份／版本 → 宿主计数与可选进度 → 宿主优先顺序中的少量条目及关键事实 → 单项、下一项和可选进入队列。
- **workspace**：同一事实 → 固定标签筛选／排序 → 受控选择及批量影响 → DataRecordTable 完整输入列表 → 下一项与返回。不创建独立路由、Store 或外壳。
- **compact**：与任一 view 组合，收紧间距、隐藏零值状态计数；回执未确认／已过期的非零计数和全部他人处理事实常驻。总数与进度只取 progress.reviewed / progress.total，不累加状态、不统计条目；现有 API 的他人处理中来自条目 processingByOther，并非第八种复核状态。

`/next/components/agent-components#review-queue` 有 P04 三题校对及多名学生作答批阅两组标注示例。示例宿主共享三处选择、筛选与状态；批量点击仅载入示例 waiting，独立逐项回执控件分别载入 resolved／unknown，不能一键使整队已复核。数学分式位于展开说明，提供 320px 容器。单项／异常按钮只记录示例打开请求，不冒充已完成业务接入。

候选位于 `feat/agent-review-queue`，基于 main `36be612`。五项结果、18 项新增测试和 Workspace 本地 main `3413920` 的只读轻量接线方案见 `.sites-runtime/review-queue/REPORT.md`。未启动开发服务、未写 Git、未修改 Workspace；浏览器三主题／窄屏／键盘／读屏器、Workspace 接入与真实服务仍待验证。

## 单项复核器 v0.1

2026-09-25 设计候选，语义 **17 单项复核器**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-item-reviewer` 导入 `AgentItemReviewer` 及同文件公开类型。复核单题、单页、单条诊断或单份作答；评分结构由领域编辑插槽提供，不成为通用复核模型。不增加 80 项组件目录条目。

与 **16 AgentReviewQueue** 配对：16 提供集合、下一项和批量入口，17 承载选中对象的完整证据、编辑及单项动作；复用同一个 `AgentItemReview`、复核依据版本和独立 `versionChange`，不得从队列选择或批量请求生成已复核。公开的 `agentItemReviewLabels` 是两者共享词表，17 的既有行为保持不变。

### 复用检索与 QuestionReview 审查

- `QuestionReview` 已有题面、作答、评分点与理由布局；**不可直接包装为通用复核器**，其领域评分不成为通用复核模型。曾在确认点击后写入 `saved/record` 并清空理由的问题已修复（本 PR，2026-09-25）：现在复用 `AgentItemReview`，确认只回调意图；旧本地完成记录行为已移除。兼容与迁移见下方 QuestionReview 条目。
- `VerificationFields` 的判断、依据与事件由外部控制，没有内部完成态；P04 示例的编辑插槽直接复用。评分示例复用 QuestionReview 使用的 `PointsField`，不挂载旧确认逻辑。
- `AgentChangeReview / AgentChangeSet` 负责候选的采用／保留决定，不等同复核回执。本候选的原值／人工草稿对照是只读内容，使用 `comparison` 插槽，不为一份已编辑草稿补造“已采用”决定。宿主需要候选采纳时在同一工作区组合既有对比组件，采纳仍不能生成已复核状态。
- `AgentEvidenceDrilldown` 与 `DocumentRegionViewer` 作为 `evidence` 插槽示例，复用来源、版本、未知事实与区域查看；预览不生成读取、引用或复核事实。外框、状态、表单及补充说明复用 Card、Prism Badge、Alert、Field、Textarea、Button、RecordDetails / coss Collapsible，不修改 coss。

### 公开 API

`AgentItemReviewerProps<T = string>`：

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `item` | 必填 `AgentItemReviewTarget={id,title,version}` | 单一对象的稳定 ID、教师可读名称和**本次复核依据版本**，均为 string；不随新版本到达自动替换。缺少身份或版本时显示未确认并阻断操作／编辑 |
| `review` | 必填 `AgentItemReview` | 下表的外部复核事实；所有分支必填 description，不从点击、草稿差异、预览、时间或模型文案推定 |
| `checkpoints` | 必填 `readonly string[]` | 待复核要点和影响判断的证据限制；全部常驻，不因紧凑或展开能力截断。空数组显示未提供，不推定无需复核 |
| `summary` | 必填 `ReactNode` | 当前值摘要；由宿主明确呈现原值／草稿的含义，必要关键内容在 Inline 中保持可读 |
| `view / density` | `inline / workspace` 默认 inline；`default / compact` 默认 default | compact 是密度，可与任一 view 组合；只调整间距和换行，不隐藏未知、过期或未保存提示，不改变字号 |
| `versionChange` | 可选 `{currentVersion?: string; description?: string}` | **传入即表示宿主确认当前版本已变化**；即使 review 仍为 resolved 也优先显示已过期，阻断原动作，不沿用旧确认。当前版本缺失显示未确认；不比较版本号或自动换草稿 |
| `restart` | 可选 `AgentItemReviewAction` | 已过期且没有在途 waiting/unknown 时才显示重新复核动作；仅请求宿主接续当前版本，不自动换版、提交或清空草稿 |
| `draft` | 可选 `AgentItemReviewDraft<T>` | `{value:T, onChange:(value:T)=>void, render:(editor:AgentItemReviewEditor<T>)=>ReactNode}`；组件没有初值、副本、重置或持久化。render 接收同一 value、带保护的 onChange、readOnly、describedBy |
| `reason` | 可选 `{value:string; onChange:(value:string)=>void}` | Workspace 固定标签“复核理由”输入；不 trim、不清空、不代写，提交必要性及校验由宿主提供 |
| `evidence / comparison` | 可选 `ReactNode` | Workspace 完整证据、原值与草稿对照；缺省明确未提供。当前获权的只读业务内容，可含区域定位等视图交互，不得放提交、重试或采纳按钮绕过复核状态 |
| `history` | 可选 `readonly AgentItemReviewRecord[]`，默认 `[]` | Workspace 只读当时事实，保留输入顺序，不填充、修改或追加。历史展示仍须先经宿主授权 |
| `onAction` | 可选 `(intent:AgentItemReviewIntent)=>void` | 仅返回对象、依据版本和动作标识；缺省禁用已提供的动作并说明不可执行。回调返回值不是回执 |
| `onExpand` | 可选 `(trigger:HTMLButtonElement)=>void` | Inline 的“完整复核”；缺省无入口，workspace 不重复显示。unknown 时隐藏，保留查询原请求。宿主负责同一对象／草稿、容器与焦点恢复 |
| `onBack` | 可选 `()=>void` | workspace 返回原位置，包括 unknown；只改变视图，不提交、丢弃或取消，离开时未保存输入的保护由宿主完成 |
| `disabledReason` | 可选 string | 非空阻断全部复核、重新复核、查询及输入，原因常驻并关联按钮；查看、展开和返回不受影响 |
| `notice / details` | 可选 `string / ReactNode` | 常驻复核提示按过期 > 回执未确认 > 其他取一条；notice、次要状态解释和补充 description 合并入默认收起“说明”。状态标记、版本、请求、未保存、动作影响与禁用原因仍常驻 |

`AgentItemReviewEditor<T>={value, onChange, readOnly, describedBy?}`。render 必须使用受控字段、遵守 readOnly 并关联 describedBy；可接单页文本、诊断字段、VerificationFields、可选评分等内容，不能私建执行或保存状态。组件保护传入的 onChange，waiting / unknown / resolved / expired、版本变化或 disabledReason 时不转发修改；插槽自身的外部回调仍由宿主负责约束。summary、evidence、comparison、details 都不能引入旁路业务动作或未经授权的数据。

### 状态、动作与历史

**2026-09-25 提示优先级**：过期 → 回执未确认 → 其他（修改未保存／提交中／review.description）。只保留最高优先级的一条常驻复核提示；剩余固定提示、description 与 notice 去重后进入同一个默认收起“说明”，再接 details。没有固定提示时 description 自身常驻。宿主不能把必要版本、请求或禁用事实只放入补充说明：分别使用 versionChange、request、disabledReason、checkpoints／summary 等已有字段。

过期与 unknown／waiting 并存时，“已过期”主 Badge 和“旧请求回执未确认／旧请求复核提交中”次 Badge 同时可见，原请求关联和查询入口保留。过期与 draft／failed 并存时常驻“修改未保存／已退回 / 失败”标记；旧 resolved 仍为此前复核记录。必要事实和动作影响／禁用原因不计作可折叠的边界提示，不为减行隐藏。动作状态、回调与受控保护不变。

| `review.state` | 必需事实 / 能力 | 呈现与行为 |
| --- | --- | --- |
| `waiting-human` | 可选 `actions` | 待复核；宿主给出“确认无误”“修改”“标记待议”等实际可用动作 |
| `draft` | 可选 `actions` | 已编辑未提交，常驻“修改未保存”；不因组件收到新值自动推定已保存 |
| `waiting` | 必填 `request`；可选 `query` | 复核提交中，只查询原请求，没有重复提交 |
| `unknown` | 必填 `request`；可选 `query` | 回执未确认，只查询原请求，不宣称成功或失败；没有查询能力则明确无入口 |
| `resolved` | 必填 `resolution={reviewer,version,time?}` | 已复核；复核人、结果版本和时间取自记录，时间缺失显示“时间未确认”，不读客户端时钟；没有旧确认动作 |
| `failed` | 可选 `actions` | 已退回 / 失败，description 说明具体事实；宿主核实恢复条件后才能提供修订动作 |
| `expired` | 顶层可提供 `versionChange / restart` | 已过期，要求重新复核；保留原草稿、理由和依据版本，旧确认不可执行 |

`AgentItemReviewAction={id,label,impact,disabledReason?}`；前三项为必填 string，影响常驻并关联按钮，按宿主提供的顺序呈现，首个动作为主操作。`AgentItemReviewRequest={id,label}`。每个意图共同包含 `{itemId,version,actionId}`：

- 普通复核／修改／待议：`kind:'review'`；actionId 由宿主受控注册，不解析按钮文案，不接任意脚本或 URL。
- 查询：`kind:'query', requestId`；必须关联原请求，缺原 ID 禁用并说明原因。
- 重新复核：`kind:'restart', currentVersion?`；只在过期且没有在途请求时提供。旧依据 version 仍保留，用于宿主处理冲突。

TypeScript 联合类型禁止 waiting / unknown / resolved / expired 携带 actions，运行时也只在 waiting-human / draft / failed 且没有版本变化时使用 actions。若版本变化与 waiting / unknown 同时出现，**同时保留过期提示和原请求状态，只允许查询，不提供 restart**。宿主收到意图后重新核验所属任务／会话／轮次、对象、版本、动作范围、权限和幂等；组件不会提供第二套执行管理方。确认后必须由真实回执或显式标注的评审事实更新 review。

`AgentItemReviewRecord={id,item,state,description,reviewer?,time?,resultVersion?,reason?,request?}`。前四项必填；item 与当前对象同类型，但保留当时 ID、标题和依据版本。历史状态、理由、结果版本、复核人、时间及请求均只取本条记录，缺失明确未确认／未记录；不从当前 resolved 或当前版本回填，无任何执行动作。当前已过期时，既有 resolution 只呈现为“此前复核记录（不适用于当前版本）”。

### 三种用法与 P04 接续

- **inline**：身份／依据版本 → 当前状态及版本变化 → 待复核要点 → 当前值摘要 → 宿主动作；完整复核经 onExpand。
- **workspace**：同一事实，增加完整证据与受控编辑、原值对照、理由、当时复核记录及可选返回；不自建工作区外壳。
- **compact**：可换行紧凑布局；未知请求、过期版本、未保存、影响和禁用原因不折叠，不成为第三种正式业务态。

组件页 `/next/components/agent-components#item-reviewer` 提供两组固定示例：P04 单题与原稿对照（复用 VerificationFields、DocumentRegionViewer、AgentEvidenceDrilldown），以及单份作答评分复核（PointsField 仅在领域插槽内）。同一草稿／理由贯穿三种用法；手动状态选择器、独立版本变化开关、320px 容器、长中文和分式用于后续评审。确认／提交／查询只更新示例请求反馈，不能推进回执状态；示例不代表真实 OCR、评分或复核服务。

P04 轻量接入须在 Workspace `/teacher/agent/workspace` 复用既有试验台；`checked=true` 的“已与原稿对照”只是本地人工对照标记，不能直接映射 resolved、复核人、复核时间或保存成功。适配器须单独保留对象 revision、基准版本、草稿归属和复核请求／回执；已有 checked 放在要点／事实摘要中说明，缺复核记录时仍待复核。点击只发请求，在途待回执用 waiting／unknown，只有匹配原请求和版本的复核记录才能提供 resolved；无时间保持未确认。版本变化先过期，不清空手改与理由；历史只追加新事实。

本轮未合并候选位于 `feat/agent-item-reviewer`（main 基线 `278e7e3`）；测试及五项结果、QuestionReview 问题定位和 P04 映射见 `.sites-runtime/item-reviewer/REPORT.md`。不启动开发服务，不改 Workspace，不写入 Git；浏览器三主题、窄容器、键盘／焦点、实体设备、读屏器、Workspace 接入及真实服务另行验证，候选待 Supervisor 独立 Review。

## 下钻与证据浏览 v0.1

2026-09-25 设计候选，语义 **21 下钻与证据浏览**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-evidence-drilldown` 导入 `AgentEvidenceDrilldown` 及同文件公开类型。不增加 80 项目录条目；宿主接入验证入口仍为 `/teacher/agent/workspace`。

复用检索依据：`DiagnosisEvidenceTable` 已提供观察、来源、定位与查看回调，适合作为诊断入口，但没有多层证据导航；`DocumentRegionViewer` 已有受控区域与定位，作为证据预览插槽使用；`AgentContextList / AgentContextSummary` 提供来源行及独立事实呈现起点。新组合复用 AgentContextList、Card、Button、Prism Badge、Breadcrumb 与 RecordDetails；compact 沿用记录组件的可换行列表布局。原有三组件无需修改；不引入取数、权限判断、业务 Store、路由、持久化或 Workspace 私有类型。

### 公开 API

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `conclusion` | 必填 `AgentEvidenceConclusion` | `id / statement` 必填；可选 `version / snapshot / summary / evidenceCount / coverage`。id 引用宿主结论；statement 为结论陈述，summary 为依据摘要。历史快照显式传 snapshot；版本缺省显示未确认，不从对象补造 |
| `nodes` | 必填 `readonly AgentEvidenceNode[]` | 结论之下的对象／证据树。兄弟节点 ID 唯一、跨两态稳定；顺序由宿主决定，前两条可披露证据用于摘要。允许学生 → 题目 → 作答片段等多层对象 |
| `view / density` | `inline / workspace` 默认 inline；`default / compact` 默认 default | compact 是密度，可与任一 view 组合；只改变布局和间距，不改变事实、字号或能力 |
| `path` | `readonly string[]`，默认 `[]` | `[]` 是结论；各 ID 逐层选中子节点。完全受控，无内部路径副本；找不到路径时说明当前位置未提供，不回退展示其他对象或旧预览 |
| `onNavigate` | 可选 `(path, trigger: HTMLButtonElement) => void` | 只请求进入对象／证据、返回上层或面包屑层级；值更新后才改变呈现。缺省只读展示指定层级，没有假导航按钮；宿主负责焦点、滚动和两态恢复 |
| `onExpand` | 可选 `(trigger: HTMLButtonElement) => void` | 仅 inline 显示“查看证据链”；缺省隐藏入口并展示全部已提供证据摘要，避免第三条以后不可达；不创建面板或改变 path |
| `onOpen` | 可选 `(intent: AgentEvidenceOpenIntent, trigger: HTMLButtonElement) => void` | 节点还须显式提供 `openable=true` 才显示打开入口；intent 为 `{kind:'object'/'evidence', conclusionId, nodeId, path}`。不取数、不改写事实；由宿主解析身份／版本并重新核验授权 |
| `onBack` | 可选 `() => void` | workspace 的“返回原位置”；仅返回原入口，不取消、提交或改变结论。原触发器、阅读位置和焦点由宿主保存与恢复 |
| `notice / details` | 可选 `string / ReactNode` | inline 的 notice 与 details 合并到同一个默认收起“说明”，记录不完整等状态事实常驻；workspace 保留原 notice 常驻输出。记录缺失、不可用、访问限制不得折叠 |

`AgentEvidenceConclusion.coverage: AgentEvidenceCoverage` 是 `{state:'complete'/'incomplete'/'unavailable'/'unknown', description?}`。分别显示“记录覆盖完整／记录不完整／记录暂不可用／覆盖状态未确认”。证据数量与覆盖情况**仅在宿主提供时显示**，不以树中条目数充当总体数量或分母。没有传 coverage 表示没有提供覆盖说明；宿主已知存在覆盖缺口时必须显式传 incomplete，不能省略。覆盖不完整也不撤销已有匹配的读取／引用事实。

### 节点、来源与独立证据事实

| 类型 | 字段与职责 |
| --- | --- |
| `AgentEvidenceObject` | `kind:'object', id, title, type, children` 必填；可选 `access:'available', version, location, summary, openable`。type 是教师可读对象类型；对象版本与证据来源版本独立 |
| `AgentEvidenceItem` | `kind:'evidence', id, title, type, source, facts, relation` 必填；可选 `access:'available', summary, preview, previewUnavailableReason, openable`。summary 为关键摘录，workspace 选中该证据后才呈现 preview |
| `AgentEvidenceSource` | `objectId, label, location` 必填，`version / snapshot` 可选。objectId 为已有来源身份，label 为可披露名称，location 描述页／区域／题号／作答段落。snapshot 标为历史证据，显示该记录自己的“当时版本”；不从当前对象或结论回填 |
| `AgentEvidenceRestrictedNode` | `id, kind:'object'/'evidence', access:'restricted', disclosure:{label,reason}`。只传可披露标题与原因；类型不接受正文、来源、版本、事实、预览、子节点或打开能力。运行时同样忽略误传的私密字段及子树 |
| `relation` | `supports / counterexample / pending`，显示“支持／反例／待核”；全部由宿主给出，不按已引用、已读取或预览内容计算，不用成功色证明结论正确 |

`AgentEvidenceNode` 是以上对象、证据、受限节点的联合。宿主只能传入当前授权可见的数据；受限分支可披露字段也必须先经宿主处理。组件的展示分支不是最终授权检查。来源记录、结论摘要、总量、限制原因及 preview/details 同样受披露范围约束。

`facts: readonly AgentEvidenceFact[]` 是**并列的独立事实集合**，不是互斥状态机或进度链：

| `state` | 文案 | 必要条件 / 附加字段 |
| --- | --- | --- |
| `read` | 已读取 | 必填 description，说明谁读取及实际覆盖范围；不外推完整材料或模型读取 |
| `cited` | 已引用 | 必填 description、version、location，后两项是被引用成果的版本和引用位置；来源版本另见 source.version |
| `not-read / not-cited` | 未读取／未引用 | 仅宿主核实记录覆盖完整且没有相应事件时传入；组件不因 facts 为空产生否定事实 |
| `retrieval-only / preview-only` | 仅检索命中／仅预览 | 宿主明确给出的有限记录；组件不从检索数量、挂载预览或点击生成 |
| `incomplete` | 记录不完整 | 已知记录覆盖缺口，description 说明缺失范围；不推定未读取／未引用 |
| `unavailable` | 记录暂不可用 | 当前记录来源无法核验；不把不可用写成未发生 |
| `unknown` | 状态未确认 | 尚不能确认的事实；description 可说明具体未确认项 |

各事实可附独立 description、version、location；除 cited 的成果定位要求外，其余版本／定位按所描述记录提供，彼此不复制。facts 为空仅说“暂无证据事实记录”。宿主／受信任层先匹配任务、会话、执行轮次、来源及版本和成果引用位置，再传事实；组件不验证证据真伪。已引用不证明结论正确、充分或已进入本次模型上下文；点击只发意图，不生成事实。

`previewUnavailableReason` 只描述内容预览能力，有值时不挂载 preview；记录暂不可用与材料能否预览独立。preview 缺省显示“暂未提供证据预览”。preview/details 必须是当前允许披露的只读内容，可包含 DocumentRegionViewer 的区域选择、缩放等视图交互，不得绕过公开动作接入业务提交。

### 三种用法与验证边界

- **inline**：结论、版本、依据摘要、宿主给出的数量／覆盖，按输入顺序呈现关键 1–2 条证据；无展开能力时保留全部摘要。摘要之外的 incomplete、unavailable、unknown、预览不可用与权限受限信息集中在常驻“其他记录限制”，不因截断消失；宿主须将其他影响判断的关键依据保留于 summary 或前两条。
- **workspace**：同一结论、面包屑、上层与原位置返回；逐层浏览对象及证据。选中证据显示自身类型、来源／版本／定位、关系、独立事实与领域预览。path 失效不取其他对象代替，提供返回最近已有层级的请求。
- **compact**：同样事实采用可换行短列表，减少间距；两态都保留记录不完整、不可用、未确认和访问原因，不缩字。

`/next/components/agent-components#evidence-drilldown` 原位示例：扫描校对“第 2 题识别可能有误”→第 2 题→原稿第 1 页区域／识别文本；学情诊断“二次函数配方掌握不足”→学生→题目→作答片段，含反例、检索命中、历史版本与受限记录。明确标“固定示例”；DiagnosisEvidenceTable 提供诊断入口，DocumentRegionViewer 展示人工区域与公式，示例宿主控制路径及返回焦点。未新增业务页面。

本轮分支 `feat/agent-evidence-drilldown`，基线 main `2f04f5a`；仍是未合并组件候选。测试覆盖独立事实、受控层级、回调不改变记录、缺少展开能力、受限内容隔离、历史版本、紧凑限制及类型约束。五项结果与 P04 轻量验证方案记录于 `.sites-runtime/evidence-drilldown/REPORT.md`。不启动开发服务；浏览器三主题／窄容器／键盘焦点、Workspace 接入、真实服务、实体设备和读屏器另行验证，SSR 与回调检查不代替这些验收。

## 异常处理器 v0.1

2026-09-25 设计候选，语义 **18 异常处理器**，声明 **Inline + 专用扩展内容**。从 `components/prism-next/agent-exception-handler` 导入 `AgentExceptionHandler` 及下列同名类型。检索依据：`AgentExecutionProgress.exceptions` 只有只读异常记录；`AgentChangeSet` 负责修改比较；`AgentExecutionResult` 提供原请求查询边界；Workspace `8f9bb13` 的 P04TaskView 仅有本地 Alert 组合。因此组合既有 Card、Alert、Prism Badge、Button、AgentStepStatus 词表与 RecordDetails（coss Collapsible），不新增组件目录项、执行器、权限判断、Store 或 Workspace 私有类型。

### 公开属性

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `title / items` | 必填 `string / readonly AgentExceptionItem[]` | 同一业务对象的异常集合；稳定唯一项 ID 由宿主提供，空数组仅表示暂无异常记录 |
| `view` | `'inline' / 'workspace'`，默认 `inline` | 两态共用相同事实，workspace 只提供内容区，不创建浮层或路由 |
| `density` | `'default' / 'compact'`，默认 `default` | compact 为可换行短列表；不缩字、不隐藏未知、失败、影响及禁用原因；可与任一 view 组合 |
| `inlineLimit` | `number`，默认 `2` | 有展开能力时显示前 N 项及所有 critical、failed、waiting 项，保留输入顺序；有限值向下取整且至少 1，非有限值回退 2 |
| `onExpand` | 可选 `(trigger: HTMLButtonElement) => void` | inline 的“查看全部 N 项异常”；缺省不显示入口且保留全部项。存在 unknown 时同执行结果隐藏该入口并保留全部项；workspace 不显示入口 |
| `onAction` | 可选 `(intent: AgentExceptionIntent) => void` | 仅发处置或查询意图，不变更输入、状态或历史；缺省时已提供的动作仍显示为禁用，并说明当前无法执行 |
| `onBack` | 可选 `() => void` | 仅 workspace 显示“返回”；纯视图导航，包括 unknown，不能绑定处置、恢复、取消或提交。恢复任务须作为明确的处置动作另行提供 |
| `disabledReason` | 可选 `string` | 非空时阻断本组所有处置与查询，原因常驻并关联按钮；查看与返回不受影响 |
| `notice` | 可选 `string` | 整卡最多一条常驻边界提示；必要状态事实不放在这里代替状态字段 |
| `details` | 可选 `ReactNode` | 补充说明，默认收起；不放未知、失败、影响、禁用原因或其他必须即时看到的事实 |

`AgentExceptionItem`：

| 属性 | 类型 | 契约 |
| --- | --- | --- |
| `id / title` | 必填 `string` | 稳定异常 ID / 教师可读标题；按钮可访问名称包含标题 |
| `kind` | 必填 `AgentExceptionKind` | `low-confidence / conflict / missing / unparseable` 分别显示识别不确定、内容冲突、信息缺失、无法解析；不生成置信度或自动检测异常 |
| `scope / retained` | 必填 `string` | 影响范围 / 已保留部分；没有或不确定须如实描述，不由其他状态推算 |
| `basis` | 必填 `string` | workspace 的判定依据或规则说明，必要的来源与版本由宿主描述；决策关键的证据不足仍需写入常驻 description/scope |
| `disposition` | 必填 `AgentExceptionDisposition` | 见状态表；描述、状态与可用动作独立从宿主取得 |
| `critical` | 可选 `boolean` | 宿主指定关键项，始终保留于摘要；不从标题或异常类型推算优先级 |
| `disabledReason` | 可选 `string` | 与整组及动作原因合并，阻断本项所有处置与查询，不推定解决或失败 |
| `evidence` | 可选 `readonly AgentExceptionEvidence[]` | workspace 原始材料/证据列表；缺省显示暂无可核对的材料记录 |
| `history` | 可选 `readonly AgentExceptionRecord[]` | workspace 的只读当时事实，按输入顺序显示；不从当前项补字段，不追加、不覆盖 |

### 状态、动作与历史

所有 disposition 均必填 `description: string`。等待、未知和失败徽标复用 `AgentStepStatus`；处置上下文明确说明“处置提交中”“处置回执未确认”“处置失败”，不改变共享步骤词表。

| `state` | 必填补充字段 | 可选动作 | 事实语义 |
| --- | --- | --- | --- |
| `waiting-human` | 无 | `actions` | 当前等待人工决定，不能代表尚未到达的步骤 |
| `waiting` | `request: { id, label }` | `query` | 处置已提交，有明确等待事实；无普通处置动作 |
| `unknown` | `request: { id, label }` | `query` | 原处置回执未确认，不宣称失败或成功；仅查询原请求 |
| `resolved` | `resolution: { method, time? }` | `actions` | 已有处置记录；显示处置方式和时间，时间缺失显示“时间未确认”，不使用客户端时钟；不等于任务完成 |
| `failed` | 无 | `actions` | 明确处置失败；恢复/重试是否可用由宿主核验后提供，不自动添加 |
| `ignored / skipped` | `resolution: { method, time? }` | `actions` | 按宿主事实显示已忽略／已跳过与当时方式，不等于已解决或内容正确 |

`AgentExceptionAction={ id, label, impact, disabledReason? }`：前三项为必填 string。`impact` 常驻且以 `aria-describedby` 关联按钮。普通处置包括替换、跳过或恢复，只通过 `onAction({ kind:'handle', exceptionId, actionId })` 发出；原请求查询只通过 `onAction({ kind:'query', exceptionId, actionId, requestId })` 发出。组件不按按钮名称识别查询。unknown/waiting 的类型不接受 actions，运行时也忽略非类型化输入混入的 actions；未知请求 ID 时查询禁用并说明原因。普通处置与查询均有禁用事件保护，仍不能替代受信任层的权限、版本、请求归属和幂等核验。

`AgentExceptionEvidence={ id, label, location, version?, preview?, unavailableReason? }`：前三项为 string；`preview` 是宿主提供的**只读** ReactNode 插槽。不提供版本时显示“来源版本未确认”，不提供预览时显示“暂未提供材料预览”；有 unavailableReason 时优先显示原因，不渲染不可用预览。组件不加载材料、不授予访问权，也不把预览提升为已读取／已引用记录。preview/details 不得塞入处置、重试或恢复按钮绕过受控动作，尤其 unknown。

`AgentExceptionRecord={ id, state, description, scope, basis, method?, time?, request? }`：前五项必填，state 同七值状态集合，其他均为文本或上述 request。始终标“当时状态／当时范围／当时依据”，时间与处置方式只取本条记录，缺省显示未确认／未记录；无执行动作。宿主按事件匹配到原任务、轮次、对象与版本后提供快照，不把当前状态映射回旧记录。接口内 readonly 数组不等于宿主已实现历史存储。

### 三种用法与 P04 映射

- inline：异常总数＋关键项的类型、范围、已保留部分、当前处置与操作影响；提供展开才可缩略列表，未知时保留全部。原请求关联、未确认、失败和禁用原因始终可见。
- workspace：全部异常及各项的原始材料/证据定位、规则、处置、当时记录；可选返回。恢复任务是宿主明确提供的动作，不因返回或 resolved 自动恢复。
- compact：减少间距，采用可换行短列表；与 view 正交，事实和动作规则不变。

只读参考 Workspace main `8f9bb13` 的 `src/features/teacher/agent-workspace/P04TaskView.tsx` 与 `p04-task.ts`；本轮不修改 Workspace。

| P04 事实 | 建议映射 | 接入边界 |
| --- | --- | --- |
| `owner / requestId / objectId` | 宿主持有原关联；`items.id` 可组合原 requestId 与局部问题标识 | 组件不建立任务对象；`onAction` 由适配器校验所属会话、轮次、版本和 writable |
| `phase='issue'` | `kind='low-confidence'`、`state='waiting-human'`；scope 第 3 页，retained 已整理部分 | `replace / skip` 作为 actions，影响说明写明仅替换/跳过局部，映射原 `resolve` 事件 |
| `phase='issue-submitting'` | `state='waiting'`；`request.id=run.intent.id` | intent.choice 只表示已请求的方式，不能当已处置回执 |
| `phase='issue-unknown'` | `state='unknown'`；同一 request；仅 query | 查询原 intent.id；不能再次发 resolve，也不能以点击查询自动产出回执。现有“模拟原局部请求处理回执”是评审事件，不是真实查询服务；未接查询能力时省略 query 或以 disabledReason 说明 |
| `delivery` + `issueChoice='replace' / 'skip'` | 匹配原处置回执后分别 resolved / skipped，method 描述实际方式 | ready/reviewing 或输出存在本身不证明处置；P04 无处置时间，保持 time 缺省／未确认。scope.blurry='skip' 须依据明确范围及交付事实说明跳过 |
| `entries` 的当时 text / event / intentId / outputVersion / scope | 适配器仅将可确认状态的事件映射 history，保留当时范围与版本 | 现有 entries 无统一处置状态与时间，不用当前 phase 反填历史，不从自然语言记录猜测状态 |
| 原材料/页定位、当前权限与可查看能力 | evidence.location / version / preview / unavailableReason；规则写 basis | P04 当前为固定示例，不伪造 OCR、置信度、真实扫描图或真实 evidence |
| 已有右工作区与来源触发器 | onExpand 传同一 items、view=workspace；onBack 返回并恢复焦点 | 两态切换不发处置、不复制 Store；缺失失败事实不自行制造 failed |

示例入口 `/next/components/agent-components#exception-handler`：P04 第 3 页模糊，以及题目识别冲突／缺失答案；三种用法、七值手动状态、320px、长中文与公式均明确标“示例”。验证日志与报告：`.sites-runtime/exception-handler/`。五项验证均退出 0：排版 107 个 TSX，全量测试 151/151（含本项 15 项），类型检查 0 错误；详情见报告。浏览器打开本地文件预览被 URL 安全策略拒绝，三主题、窄容器、键盘/焦点未实看。组件静态与回调测试不能替代 Workspace `/teacher/agent/workspace` 接入验证；真实服务、移动设备和读屏器不在本轮验证范围。

## 任务记录三件套两态 v0.1

2026-09-24 设计候选，覆盖语义 26 任务进度、27 执行结果、03 上下文摘要，声明 **Inline + 通用扩展容器**。紧凑密度是列表布局，不增加第三种业务呈现方式。语义 25 执行确认继续仅 Inline，本轮不改。验证入口是 Workspace `/teacher/agent/workspace`；本仓库组件页只提供示例，不以历史骨架作为接入验收依据。

检索与复用：沿用 `AgentExecutionProgress` / `AgentTaskProgress`、`AgentExecutionResult` / `AgentSemanticAction`、`AgentContextSummary` / `AgentContextList`；采用已批准 `AgentChangeSet.view` 的命名、其“说明”折叠方式以及 data-display 的 `density` 命名。`agent-record-parts.tsx` 仅收纳共用呈现属性和内部说明/展开组合，不是新组件目录项。未新增状态管理、权限服务、执行器、依赖或视觉令牌，目录仍为 80 项。

### 三组件共用的新增属性

| 属性 | 类型 / 默认值 | 职责 |
| --- | --- | --- |
| `view` | `'inline' / 'workspace'`，默认 `inline` | 两态内容；不创建浮层、路由或第二份业务对象。workspace 直接展示完整步骤及来源定位，不受局部 expanded 限制 |
| `density` | `'default' / 'compact'`，默认 `default` | compact 用可换行列表行、较小行间距，状态与说明仍为 ui-body / ui-hint；可以与两种 view 组合，不截断记录或缩小字体 |
| `onExpand` | 可选 `(trigger: HTMLButtonElement) => void`，默认未提供 | inline 的“更多”仅发出查看完整记录的意图；缺省无入口，已有事实不因缺入口被删去。workspace 不重复提供入口。执行结果 unknown 时也隐藏此入口，只允许查询原请求的业务动作 |
| `details` | 可选 `ReactNode`，默认未提供 | 默认收起的“说明”，不放未知、不可用、禁用原因、失败和未完成范围等必要事实；不触发业务动作 |

进度与结果的 `presentation='card' / 'inline'` 仍仅表示卡片外框，默认 `card`；上下文摘要沿用原有 Card 外框，没有借本轮增加同名属性。只传旧属性，或显式传 `view='inline' density='default'`，与 main `e99813a` 的 28 组 SSR 快照一致（仅归一化 React 自动 ID，所有引用关系保留）。

### AgentExecutionProgress（语义 26）

从 `agent-semantic-components` 导入组件及 `AgentExecutionProgressProps / AgentExecutionRun / AgentExecutionStage / AgentExecutionIssue`。

| 属性 | 类型 / 默认值 | 职责 |
| --- | --- | --- |
| `title / state / description / steps` | 原有必填属性 | 整体状态显式取自调用方；steps 继续使用 `readonly AgentStep[]`，不能用最后一步反推整体状态 |
| `expanded / onExpandedChange` | 原有必填 boolean / 可选回调 | 仅 inline 默认密度下控制当前步骤的局部披露；workspace / compact 直接展示步骤，切换不调用此回调 |
| `updatedAt` | 原有可选 string，默认未提供 | 调用方给出的更新时间文本；workspace 缺省显示“更新时间未确认”，不取客户端时钟 |
| `action` | 原有可选 `AgentSemanticAction` | 恢复/查询能力由调用方提供和核验，点击不改变任何状态；未知时应提供原请求查询能力 |
| `run` | 可选 `{ id: string; label: string; version?: string }`，默认未提供 | 当前轮身份、名称及版本；记录视图标明“当前状态”。workspace 缺少轮次时明确未确认；ID 作为 data-run-id 供定位 |
| `stages` | 可选 `readonly AgentExecutionStage[]`，默认未提供 | 完整阶段；每项含 `id/title/state/steps`，可选 `time/description`；时间仅展示输入，缺省“阶段时间未确认” |
| `exceptions` | 可选 `readonly AgentExecutionIssue[]`，默认未提供 | 异常与处置；每项 `id/title/description` 必填，可选 `time/resolution`。缺 resolution 显示“处置状态未确认”，不从记录出现推断已解决 |
| `history` | 可选 `readonly AgentExecutionRun[]`，默认未提供 | 每轮 `id/label/state/description/steps` 必填，可选 `version/updatedAt/stages/exceptions`。始终标记“当时状态/当时版本”，所有层级只读快照，不放执行动作 |
| `snapshot` | 可选 string，默认未提供 | 将顶层记录明确标作当时快照；即使 state=running 也不转圈，不标 aria-current。不会验证 action 的有效性，旧记录可用动作仍需调用方重新核验 |

支持层增量：`AgentStep.time?: string` 默认未提供；`AgentTaskProgress.density?: 'default' / 'compact'` 默认 default。默认输出保持原样。compact 将步骤名称、状态、时间和说明放入可换行的同一行。当前轮只有整体 `state=running` 且无 snapshot 时使用 live；阶段还要求自己的 state=running。历史轮及其阶段一律 snapshot；running 步骤文字为“上次进行到”，无 animate-spin、aria-current 或 live 标记。减少动态效果继续使用既有 motion-reduce 规则。阶段/异常/历史完整呈现，不进行自动分页、数量截断或状态合并。

#### 步骤状态（2026-09-24）

`AgentStep.state` 接受以下八值；`AgentStepStatus` 与所有消费步骤的 `AgentTaskProgress`、`AgentExecutionProgress` 当前轮、阶段及历史轮共用此契约，覆盖 inline / workspace 与 default / compact。标签复用 `lib/prism-next/agent-progress.ts` 的 `agentProgressLabels`；`done` 对应 completed，旧 `error` 保留原文“失败”以兼容原输出。

| 值 | 标签 | Badge variant | 步骤行图形 | 外部事实 |
| --- | --- | --- | --- | --- |
| `pending` | 待开始 | secondary | Circle | 步骤尚未到达或开始；未来步骤只能用 pending |
| `running` | 进行中 | info | Spinner | 当前有可信的运行事实；live 时才转动 |
| `done` | 已完成 | success | Check | 明确完成本步骤，不推定整个任务完成 |
| `error` | 失败 | error | CircleAlert | 明确失败，不能用来代替回执不明 |
| `unknown` | 状态未确认 | warning | CircleHelp | 已提交或已发生，但回执缺失、超时或当前状态无法确认 |
| `waiting-human` | 待人工处理 | warning | CircleAlert | 当前明确等待教师处理，不标记尚未到达的人工步骤 |
| `waiting` | 等待处理 | warning | Clock3 | 有明确的等待回执或等待处理事实；具体内容由 detail 描述，不推定已接收或已运行 |
| `partial` | 部分完成 | warning | CircleAlert | 明确仅完成部分范围，detail 保留已完成与未完成范围 |

已发生但尚无回执的步骤依据事实使用 unknown / waiting，不回退 pending；回执不明用 unknown，只有明确的等待事实才用 waiting。点击确认不构成运行或完成证据。组件仅展示传入状态，宿主负责到达判断、请求关联和原请求查询；整体状态仍独立提供，不从步骤推算。

`snapshot` 保留所有非 running 状态的原标签、Badge 与静态图形；running 仍显示“上次进行到”、outline 与 Circle。新增四值在 live / snapshot 均无动效且不设置 aria-current。状态文字与步骤图形同时呈现，图形对读屏隐藏，含义不只靠颜色。

旧四值的独立 Badge、步骤列表、阶段/历史以及两态两密度输出以 main `0a19ff7` 的 25 组 SSR 快照对比；仅归一化 React 自动 ID，保留引用关系。`/next/components/agent-components#record-views` 的 P04 固定示例包含上述新增状态与旧 running 快照；示例不证明真实回执或业务接入。

### AgentExecutionResult（语义 27）

从 `agent-semantic-components` 导入组件及 `AgentExecutionResultProps / AgentExecutionReceipt / AgentExecutionOutput`。

27 报告执行事实；33 `AgentArtifactOutput` 负责格式、版式、范围、版本与文件交付，两者可组合。27 的 succeeded/outputs 或 28 的文稿保存不等于文件已可下载；下载能力与对应版本由 33 的宿主输入明确提供。unknown 的原请求查询限制不因组合而放宽。

| 属性 | 类型 / 默认值 | 职责 |
| --- | --- | --- |
| `title / description / receipt` | 原有必填属性 | receipt.status 为 succeeded / partial / failed / unknown；前三者必填 completed / remaining 字符串列表，保持外部回执事实；unknown 不推算范围 |
| `receipt.record` | 新增可选 `{ request: string; run: string; version?: string; receivedAt?: string }`，默认未提供 | 完整回执关联；版本/时间缺失分别显示未确认。收到时间不等于执行完成时间 |
| `facts / children` | 原有可选字段，默认 [] / 未提供 | 补充回执事实与只读内容插槽；children 中不得另塞执行、重试、打开等动作绕过 unknown 约束，补充说明迁至 details |
| `outputs` | 可选 `readonly AgentExecutionOutput[]`，默认未提供 | 每项 `id/title/version/status` 必填，`open?: AgentSemanticAction`；版本与内容状态原样呈现，文件存在不改变 receipt.status |
| `outputs[].open` | 默认未提供 | 只在非 unknown 回执显示真实能力；未提供则“暂不可打开”且无假入口；disabledReason 保留为可访问关联的禁用原因；可打开能力不证明发布或保存 |
| `failures` | 可选 `readonly AgentExecutionIssue[]`，默认未提供 | 明确失败明细与处置事实。空列表只说“暂无失败明细”，不代表已核实没有失败 |

unknown 在所有密度/两态只呈现 `receipt.query` 提供的原请求查询动作；忽略非类型化调用误传的 next/secondary，抑制所有产出 open 与 onExpand。其余三种回执保留原 next/secondary 能力。query 的实际目标、参数和幂等核验由调用方保证，组件不靠按钮名称识别合法请求。产出名称、版本、内容状态和暂不可打开提示仍显示，不能因有产出改称已成功。

### AgentContextSummary（语义 03）

从 `agent-context-summary` 导入组件及 `AgentContextSummaryProps / AgentContextSource / AgentContextFact`。

| 属性 | 类型 / 默认值 | 职责 |
| --- | --- | --- |
| `title / scope / sources / expanded` | 原有必填属性 | 同一任务、范围与来源集合；workspace / compact 展示全部来源和 source.details，不受 expanded 控制；inline 原局部版本披露保持 |
| `onExpandedChange / onInspect / notice / snapshot` | 原有可选字段 | 查看只发出来源 ID；缺 onInspect 或 inspectable=false 无入口。notice 为一条边界/必要事实提示，snapshot 区分历史依据 |
| `sources[].version` | 可选 string，默认未提供 | 来源版本；记录视图缺省标“来源版本未确认”，不解析 location 文本补造版本。location 继续表示来源定位 |
| `sources[].selection` | 原三值外增加 `unavailable` | selected / not-selected / unknown / unavailable 分别表示本次选用、未选用、选用状态未确认、记录暂不可用；只描述选用事实 |
| `sources[].selectionDetail` | 可选 `{ description?: string; version?: string; location?: string }`，默认未提供 | 选用记录自身的范围和版本定位，不改变 selection |
| `sources[].read/context/citation` | 原有必填 `AgentContextFact` | 四事实中的另外三项，独立接受 confirmed / absent / unknown / unavailable；confirmed 仍必填 description |
| `AgentContextFact.version/location` | 新增可选 string，默认未提供 | 每项事实各自对应的版本和定位；不在三项间复制。citation.version/location 应指向成果版本和引用位置，来源版本另见 source.version 或 details |
| `sources[].details/inspectable` | 原有可选字段 | details 可补任务、执行、证据记录与引用来源版本；inspectable 只控制查看能力，不改变任何证据事实 |

四事实分别显示 **选用 / 读取 / Agent 本次参考 / 成果引用**。记录覆盖不完整且无匹配有效事件用 unknown；记录来源无法核验用 unavailable；只有覆盖完整且没有对应事件才用 absent。匹配任务、来源、版本、执行与成果定位是适配器职责，组件不认证证据。本机读取、历史读取、已选用或查看材料都不推定本次参考；引用不推定读取或结论正确。

### 三态信息结构与接入验证

- inline：保留原标题、状态、范围及局部步骤/版本披露；新增回执、产出、异常与历史同源呈现，关键未知/不可用事实常驻。
- workspace：完整当前执行、阶段步骤、时间说明、异常处置、当时轮次；完整回执和产出失败明细；全部来源四事实及版本定位。这里只提供内容区，外壳、焦点/返回/专注仍归 Workspace。
- compact：同样输入采用一项一行的可换行列表，不缩字、不截断、不把未知合并为失败或完成；可选“更多”由调用方接至完整记录。

`/next/components/agent-components#record-views` 提供 P04 扫描整理与备课资料整理两组明确标注的固定示例；选择记录类型后并排查看三种用法，含 320px 窄容器、长中文及打开示例中的公式。点击查询仅记录请求，不产生新回执。示例、正文和交互控件均在 demos；没有引入 Workspace 私有类型。

Workspace 适配建议（只读核对 `ole-school-workbench` main `a2962e9`，本轮未修改）：

| P04 / Workspace 事实 | 组件输入 | 缺口与边界 |
| --- | --- | --- |
| `P04Runtime.runs[owner]`、`P04Run.requestId/objectId` | 当前轮 run.id/label/version；先前轮映射 history；通过原任务/轮次/对象保留关联 | 组件不挑当前轮、不排序，不把旧轮覆写为新轮；label/version 由适配器明确提供 |
| `p04Progress(run)` 的 state/description/steps | AgentExecutionProgress 的同名输入；time/stages/exceptions 可从已有执行事实追加 | 当前 P04Run 没有 updatedAt、阶段时间或可信耗时，保持缺省/未确认；不读客户端时间，不把步骤 done 当整体 completed |
| `run.phase/scopeReceipt/intent/entries/issueChoice` | 经原适配器确定 receipt 与 exceptions 的描述、处置和关联；requestId 对应 receipt.record.request | scopeReceipt 是范围确认回执，不能作为保存/发布成功回执；ready/reviewing 仍需核对，entries 叙述不自动提升为完整审计或已解决 |
| `P04Output.id/title/version/reason`、`p04Target/resolveP04Target` | outputs 的身份、名称、版本及外部内容状态；有效目标+实际 onOpen 能力时提供 open | reason 是说明，不自动变成执行状态；snapshot 由既有查看器承接，旧版保持当时内容；产出数量不证明保存、入库或导出完成 |
| `p04ContextSources(run)` | sources 原样提供 selection/read/context/citation；补 source.version 及各项实际定位 | 当前示例选用为 selected，另三项全 unknown；不因有校对稿而改为已引用；保留 fixture 标注 |
| `WorkspaceResources.coverage`、`ReadEvidence`、`CitationEvidence` | 适配器匹配 owner/source/version/run/output 后，分别形成 read 与 citation 的 fact/description/version/location | coverage=unknown 且缺匹配事件仍 unknown，unavailable 保持不可用；现有数据没有本次参考证据，context 保持 unknown，不由 read 推算 |
| 同一组 task/run/output/source 视图数据 | 浮层 `view='inline' density='compact'`；完整记录 `view='workspace'` | 打开/收起只改变视图；复用原单一右栏、Popover、会话归属与焦点返回，不新增 Store、路由或持久化 |

接入测试仍需在 Workspace `/teacher/agent/workspace` 完成：资源浮层→完整记录→返回、会话切换与历史版本回看、未知查询、来源不可用、三主题/窄容器/键盘/焦点恢复。当前 P04 的保存与去向回执仍 unknown，没有真实服务；本候选不把静态示例或 SSR 测试当成业务验收。

## Agent 可读性与规范权威

跨 Agent 使用时以站点根目录 `/llms.txt` 为发现入口，并遵循 `docs/agent-readable-contract.md`。组件页 Agent Spec、Foundations、Pattern / 应用示例、固定 coss upstream、Agent inference 依次构成权威顺序；后一级不得覆盖前一级。

基础 Form / Field / Input / Textarea / Select 统一采用**常驻固定标签**。Floating label 不属于基础输入组件契约；若未来需要，只能作为单独评审的 Specialized Pattern 引入。缺失视觉值先复用固定 coss 行为，仍无定义时报告规范缺口，不从截图或模型偏好补造。

## 常用展示约定

- Avatar：通过 `className` 使用 24、32、40、48、64、96px 六档示例，默认 32px；保留图像失败时的文字回退。
- Card：内容操作、横向条目、指标、人物、选择与分组由同一套 Card 子组件组合，不新增六套独立组件。
- Frame：保留 coss 默认外框内边距 4px、面板内部 20px；多面板之间间隔 4px。
- 教材目录：外部 `createDirectory` 数据支持递归层级，2—5 级示例位于独立 `directory-depth` fixture。选择以叶节点为准，父级勾选包含全部下级，取消不提交草稿。

### 实心信息色徽标

`components/prism-next/badge` 复用固定来源的 coss Badge，并增加 `variant="info-solid"`；变体和 render/ARIA 属性继续透传；Prism 默认采用 lg，状态文字统一为 14/20，短标签例外见字体规范。coss 原始源码及其来源校验保持不变。

```tsx
import { Badge } from "@/components/prism-next/badge"

<Button variant="outline" aria-label={`查看已选材料，${count} 项`}>
  已选材料
  <Badge variant="info-solid" size="sm" aria-hidden="true">{count}</Badge>
</Button>
```

- 彩色承载于气泡背景，内容采用对比中性色；浅色、暖纸、深色使用现有信息色与背景令牌。
- `info` 保持浅底信息呈现，`info-solid` 只提高信息强调程度，不推断待办、错误、类别或完成状态。
- 数量、零值是否展示、是否采用 `99+` 以及入口行为由调用方决定。组件不添加自动动画或存储。
- 数量与含义须由可访问名称共同表达；在已提供完整名称的按钮内，可隐藏重复的数字读屏内容。
- 组件示例位于 `/next/components/badge`，同时展示浅底／实心、0／2／100 及描边入口组合。

## 代码与导航分层

| 层级 | 目录 / 入口 | 内容 |
| --- | --- | --- |
| 基础组件 | `components/coss` | 54 个固定来源的 coss 原始组件 |
| 可复用组件 | `components/prism-next`、`charts` | 数据、可选插槽、受控状态与事件接口 |
| 组件示例 | `demos`、`/next/components/[slug]` | 单个组件的最小使用与不同输入对照 |
| 页面骨架 | `components/prism-next/skeletons`、`/next/skeletons` | 可复用公共外壳与布局，不计入组件数量 |
| 标准页面 | `/next/pages` | 独立分类；当前未启动，不预建业务页面 |
| 应用示例 | `examples`、`/next/examples/[slug]` | 题库与打印组合、统一学习支持流程，不计入组件数量 |
| 示例数据 | `fixtures` | 人工题目、作答、评分和关联资料 |

`/next/reading` 和 `/next/agent` 保留原入口。80 个组件展示页保持完整，应用示例仅保留 `questions` 与 `evaluation` 两个入口。评价、诊断、目标和计划在同一示例内切换；旧阶段地址跳转至对应 `stage`，学习状态限定在该示例内。

学生分析整页撤下，旧分析地址跳转到图表目录。矩阵、里程碑、负荷日历和文档区域的重复应用示例撤下，旧链接跳转到对应通用组件。日历、里程碑和文档区域仍按用途分类。

## 题目

```tsx
<QuestionCard question={question} />
<QuestionCard
  question={question}
  checked={selected}
  onCheckedChange={setSelected}
  actions={actions}
  details={details}
/>
```

- `QuestionRecord` 只定义题面、选项、小问与可选答案。题卡不负责试题篮、选题筛选、组卷、题目保存或统计。
- `QuestionPrint` 可作为 33 `AgentArtifactOutput.preview` 的题卷打印预览；原分页、纸面设置与浏览器打印行为不变。打印可用不等于生成服务已有可下载文件，33 不把打印动作当 ready 回执。
- `details` 是可选内容插槽。未传入时没有详情按钮；展开可在内部维护，或由 `detailsOpen` / `onDetailsOpenChange` 控制。
- `QuestionDetails` 单独接收资料、教材定义、关联目录与允许的标签页。限制标签页会阻止相应面板渲染。敏感答案仍应由服务端从题目载荷中移除；UI 隐藏不是权限控制。
- `QuestionActions` 仅显示实际传入回调的操作。是否进入试题篮、移动、替换与删除由容器决定。
- `QuestionResponse` 接收题型、选项、`value` / `onChange`，只收集作答，不自动判分。
- `QuestionReview` 接收 `question`、`attempts`（按小问 ID）、`initialScores`（按评分点 ID）。可提供 `editor` 与 `onEditorChange` 成对控制草稿；否则内部维护。新增可选 `review?: AgentItemReview`，类型复用 `components/prism-next/agent-item-reviewer`；确认通过原签名 `onConfirm(scores, reason)` 返回提交意图，回调返回值不是回执。
- 没有细分 rubric 时：已有小问分值使用 `${part.id}-score`；没有小问分值回退整题 `score`。不擅自平均分配分值。未提供初评的评分点保持待评分。更换被复核对象时使用 `key={question.id}` 重建独立编辑草稿。


### QuestionReview 状态外部化迁移（2026-09-25）

旧的点击确认后本地写入 `saved/record`、清空 `reason`、显示“最新复核记录”的行为**已移除**。公开属性及 `ReviewEditor` 字段、`createReviewEditor` 和 `onConfirm(scores, reason)` 签名均保留。未传 `review` 的旧调用仍可编译与渲染：校验通过并调用回调后只提示“已发出确认，等待记录”；未提供回调时提示“未提供确认处理，尚未发出确认”，不生成完成事实。组件不依据 Promise 返回、计时器或点击次数推进状态。本仓库未发现开发环境一次性警告惯例，因此仅用本文档迁移提示，不新增 console.warn。

- `review` 使用 `AgentItemReview` 的七种状态：`waiting-human` 待复核、`draft` 已编辑未提交（修改未保存）、`waiting` 复核提交中、`unknown` 回执未确认、`resolved` 已复核、`failed` 已退回 / 失败、`expired` 已过期。description 取外部输入；waiting/unknown 的原请求、resolved 的复核人／时间／版本均只取对应分支事实，缺少时间显示“时间未确认”。
- 有 `review` 时，只在 waiting-human/draft/failed 允许确认；waiting/unknown/resolved/expired 禁用并在事件中阻断确认。此领域组件保留评分草稿编辑与取消行为，宿主负责编辑后的状态与版本失效、原请求查询和重新复核入口；`actions/query` 不在此自动生成按钮。
- `editor.scores/reason/error` 是草稿与校验反馈；确认保留 scores/reason，不请求写入 saved/record。`editor.saved` 是**宿主提供的已记录评分基准**，未成对控制 editor 时初始值来自 initialScores；用于已记录得分、作答回看、取消修改及分数变化校验，不能代替复核回执。宿主收到有效回执后可更新 saved；需回填得分时使用受控 editor。
- 兼容保留 `editor.record` 字段，但不再显示其内容或据其显示已复核。仅在未传 review 的旧用法中保留“record 非空且草稿未改时禁用确认”的原按钮行为；传入 review 后，以外部状态决定确认可用性。只有旧 record、没有 review 时显示“复核状态未提供，等待外部记录”，不能自动转换为 resolved，需核对原记录的对象、版本与请求。
- 推荐迁移：宿主持有 review 与 editor → onConfirm 发出绑定对象和基准版本的请求并传入 waiting → 超时或回执不明传入 unknown 并查询原请求 → 仅匹配当前对象／请求／版本的记录可传入 resolved 与 resolution，并更新 editor.saved。拒绝用 P04 的本地 checked 标记直接生成 resolved；版本变化传入 expired，保留草稿，迟到回执不得覆盖新草稿。
- 对象或作答／基准版本切换时用稳定身份组合的 key 隔离实例，避免沿用另一对象的草稿和兼容交互提示。

五处演示统一使用 `demos/question-review.tsx` 的 **QuestionReviewExample 示例宿主**（不是组件目录条目）。宿主持有 editor、review 和待确认的分数／理由快照；“确认复核”只进入示例 waiting，独立“载入示例回执”才注入 resolved 并更新 saved。中途编辑会废弃该示例待回执并进入 draft，不用计时器模拟成功。`QuestionReviewDemo` 提供固定数学数据；`onConfirm` 仍为意图，示例专属 `onRecord` 只在载入回执时调用。learning-workspace 的评价版本与诊断接续改由 onRecord 推进。示例明确标注，无真实复核服务连接；生产调用方不得将此示例完成机制作为业务执行器。

## 图表与分析

| 组件 | 输入 | 返回 |
| --- | --- | --- |
| TrendChart | 任意数值序列、标签、单位、可选数值范围 | `onSelect(id)` |
| ComparisonChart | 分类与数值、横/纵方向、单位 | `onSelect(id)` |
| HeatmapChart | 行列定义、单元格值/标签、选中 ID、可选 sequentialColors | `onSelect(id)` |
| ScatterChart / QuadrantScatterChart | x/y、分组与点形、范围、可选点大小；四象限额外传分界值与四个名称 | `onSelect(id)` |
| PairedDotChart | 两个指标定义、每行两个值、同一单位与范围 | `onSelect(rowId, metricId?)` |
| ComboChart | 分类、一个或两个坐标轴、绑定轴的柱/线系列 | `onSelect(categoryId, seriesId?)` |
| BoxPlotChart | 下须、Q1、中位数、Q3、上须 | `onSelect(id)` |
| MetricSummary | 标签、数值、说明、density | 可选查看回调 |
| GoalComparison | 基线、当前、目标、单位、状态插槽 | 不推断目标达成 |
| StatusComposition | 分类、数量、可选颜色、单位与受控选中 ID | `onSelect(id)` |
| FilterBar | 字段定义、选项、当前值 | 值变更 / 重置 |
| DataRecordTable | 任意记录、列渲染函数 | 选中记录 ID |

新增复杂图形采用按需加载的 ECharts 6.1.0 SVG 引擎。原有趋势与比较继续使用 Recharts；没有同时引入第二套新引擎。图表提供数据表作为文字和键盘操作入口。缺测用 null 保留，零值不等于缺测；非法箱线摘要明确提示并不绘制。分箱、统计方法、达标判定和学情结论在组件外处理。

`HeatmapChart.sequentialColors?: readonly [string, string, string]` 接收按低—中—高排列的三个六位 HEX 实色（`#RRGGBB`）。不接受 CSS 变量、短 HEX、透明色或颜色函数；非法输入回退原主题色阶。前景按实际 RGB 插值色选择黑/白，悬停继承原填色，仅改变边框。零值、缺测、数据表和受控选择行为不变。暖纸候选仅由演示页显式传入，不替换全局主题。

现有能力包含热力矩阵、散点、箱线、成对指标、四象限和柱线组合；雷达、桑基、网络、树图等尚未封装，按真实复用需求继续添加。

## 四类图表的约束

- 状态组成的数量必须非负且有限；null 不进入分母，非法值提示并排除。零值仍保留图例，合计为零不造出占比。图例显示数量和占比，第六类有独立中性色。微小分段也可通过图例选择。
- 成对指标只比较同单位、同尺度的数据。圆点和菱形上下错开 6px，横坐标仍是原值，因此相等/接近值可区分。单侧缺测不隐藏另一侧；越界点不绘制并提示。过长名称在图中截断，提示框与数据表保留全文。
- 四象限 `labels` 顺序为左上、右上、左下、右下；阈值必须在坐标范围内。边界点保留原坐标，重叠点不通过移动位置伪造数值，数据表可逐项选择。窄屏收起常驻点标签和象限内文字，外部象限说明仍可读；恢复宽度后标签恢复。未匹配分组、缺测和越界均显式说明。
- 柱线各系列以 `axisId` 绑定轴，按类别 ID 对齐数据；缺测不补零，线段不跨越缺测连接。左右轴各自明确单位，工具提示和数据表保持对应单位；不同轴的高度不可直接比较大小。无效域自动回退有效数据范围并提示。类别外的数据不影响轴范围。
- SVG 图形提供悬停详情与点击事件；数据表提供完整数值与键盘选择入口。从数据表选择时事件第二参数为空，因为选择的是整行。组件不内置“查看学生/错题/批阅”等导航。
- 独立示例入口：`status-composition`、`paired-dot-chart`、`quadrant-chart`、`combo-chart`。每个提供学习、运营、边界与缺测三组输入，以及空态；不新增分析整页。

## 学习、文档与 Agent

### 界面文案原则

成果物输出 33 同样提供 `details?: ReactNode`：一条 notice 以外的补充解释收起；有损／不支持原因、生成失败、状态未确认、已过期／无权下载和“基于旧版本”在两态两密度常驻。文件名不接受原始路径作显示值，内部 ID 与可读标签分离。

约束构建器 08 同样提供 `details?: ReactNode`：一块常驻 Alert 汇总宿主提供的全部冲突／不可用结果，关键条件变化需重新确认、禁用原因和影响保持可见；compact 不隐藏问题。每张卡最多一条 notice，补充解释进入“说明”；与 25 组合时只保留一份边界说明。

2026-09-25 经 Product Owner 批准的密度整理：单项复核器按过期 > 回执未确认 > 其他仅常驻一条提示，其余解释进“说明”，并存状态用独立标记保留；指标摘要只合并显式组级样本／时间／版本，差异逐项显示；审核队列 inline/compact 只显示非零状态计数（无效值仍标未确认），进度与总数只用宿主提供值；证据浏览 inline 的边界解释进入“说明”，覆盖限制与独立事实常驻。详见各组件条目，不改变业务状态集合或回调。

内容输入同样提供 `details?: ReactNode`。固定标签、长度／格式约束、校验失败、保存未知、冲突版本、来源／抓取状态及禁用原因在两态两密度常驻；当前草稿与已提交版分别标明。组合公式预览时不重复边界提示。

审核队列同样提供 `details?: ReactNode`。回执未确认、过期、修改未保存、他人处理中、责任人、优先级理由、异常和批量禁用原因均常驻；一条 notice 之外的补充边界说明收起。不把内部 ID 或“宿主／意图／回调”等术语显示给教师。

对象选择器同样提供 `details?: ReactNode`；推荐依据及来源、加载／空／错误、不可选原因、失效选择、上限与禁用原因在两态两密度常驻，不移入说明。常驻边界提示最多一条。

范围构建器提供 `details?: ReactNode`。default 和 workspace 的校验、越权／不可用、排除原因及重新确认提示保持常驻。inline compact 按“范围构建器”契约例外处理：问题计数与重新确认标记常驻，具体原因在摘要入口可访问名称中可读，并可一键展开；边界提示只在本地详情出现一次，其他视图只常驻一次。

Product Owner 2026-09-24 批准：每张卡最多一条常驻边界提示，其余补充说明放入默认收起的 Collapsible“说明”；已有的版本与定位、步骤折叠继续承载各自详情。优先删除重复解释，不为所有组件统一增加插槽；AgentChangeSet、任务记录三件套、异常处理器、下钻与证据浏览及单项复核器提供 `details?: ReactNode`。

指标摘要的缺测、样本不足、状态未确认、显著变化、异常与受限事实在两态两密度均常驻；补充说明放入 `details`。

文档工作区、文件输入与集合篮同样提供 `details?: ReactNode`；能力限制、转换风险、节选范围、保存事实、上传失败及回执不明保持常驻。集合篮两种密度的失效、冲突、受限原因与同步失败均常驻。文件输入 inline compact 按本节“文件输入”契约例外处理：异常状态文字常驻，具体原因一键展开且在入口可访问名称中可读；其余能力与限制进入“说明”，选择禁用原因优先常驻。

组件自带文案及调用方提供的教师界面文案使用简短教师语言，不出现“意图”“宿主”“回调”“受控”等实现术语；组件职责与实现约束写入契约文档，开发者接入文档不受教师界面文案规则限制。

“回执未确认”“状态未确认”“示例”、冲突版本、禁用原因、部分完成与未完成范围等影响判断的必要事实必须常驻，不计作可删减的解释性边界提示，也不得移入折叠说明。缩短文案不改变状态来源、动作可用性、统计或可访问关联。

AgentContextSummary 的选用、读取、Agent 本次参考与成果引用分别记录，查看来源不会改变这些记录。界面名称“Agent 本次参考”对应 v0.2.1 §10.2 中“进入本次模型上下文”的独立事实（`context`），不从选用、读取或查看推定该事实。四值语义不变：`confirmed` 显示外部提供的已参考事实及具体范围，`absent` 为“未参考”（记录覆盖完整且无对应事件），`unknown` 为“状态未确认”，`unavailable` 为“记录暂不可用”。来源版本与定位沿用已有折叠区；删除重复的卡底职责解释。

- `DiagnosisEvidenceTable`：外部观察、来源、定位、状态、操作；可作为 AgentEvidenceDrilldown 的诊断入口，证据树与导航由宿主提供。
- `LearningGoalCard` / `VerificationFields`：目标容器与受控逐项核验字段。
- `AgentItemReviewer`：单对象人工复核与受控编辑；复核状态只来自外部事实。QuestionReview 点击生成记录的问题已修复（本 PR），现在共享外部复核状态词表；领域评分与通用复核仍分别组合。
- `AgentReviewQueue`：语义 16 的待审集合与批量审核，复用 DataRecordTable / FilterBar / Badge，与 17 配对；顺序、下一项、计数、协作与逐项回执由宿主提供，详见“审核队列 v0.1”。
- `AgentMetricSummary`：语义 19 的指标卡，组合 MetricSummary compact 与 TrendChart；宿主给值、分母、样本、变化判断、异常与来源。Inline + 专用扩展内容，详见“指标摘要 v0.1”。
- `AgentObjectPicker`：语义 01，复用 Combobox / Checkbox / DataRecordTable / FilterBar 选择具体对象；可作为 02 AgentScopeBuilder 的维度选择器，详见“对象选择器 v0.1”。候选、查询结果和选择都受控，选择不授予权限。
- `AgentObjectViewer`：打开后的通用对象外壳与只读领域分区；身份、版本、权限来自宿主，敏感分区明确确认，受限原因常驻。摘要卡与入口仍由 AgentArtifactPreview 承担；详见“对象查看器 v0.1”。
- `AgentCollectionBasket`：受控集合摘要与完整清单，复用 QuestionCard 插槽和可选 QuestionWorkPanel 外壳；汇总、同步、变化与权限来自宿主。TeacherQuestionBasket Provider 与业务逻辑不迁入；去向只发请求。
- `LearningTaskList` / `MilestoneList`：外部任务与阶段状态。
- `WorkloadCalendar`：日期索引数值、容量、单位、选中日期和月份。日历不生成任务。
- `DocumentRegionViewer`：文档内容、百分比区域坐标、缩放与选择。不提供扫描识别或 OCR；可放入 AgentEvidenceDrilldown.preview，定位或预览不改变证据事实。
- `AgentDocumentWorkspace`：长稿章节阅读、受控文本编辑与批注意图；格式能力、保存和历史由宿主提供。`MathContent` 为既有数学阅读示例，通用公式可通过 RootFormula / MathML / DraftMathPreview 放入章节内容；数学显示不等于格式转换、计算或校验。
- `AgentArtifactOutput`：语义 33 的受控输出配置、文件交付与队列／历史呈现；27 报告执行事实，28 承载文稿内容，QuestionPrint 可作打印预览插槽。详见“成果物输出 v0.1”，不内建文件生成或下载服务。
- `AgentContentInput`：语义 06 的任务材料／正文输入，复用 Textarea / InputGroup / Field，可选组合当前草稿公式预览；不承担已有文稿的完整阅读编辑（28）。详见“内容输入 v0.1”。
- `AgentComposer` / `AgentTaskProgress`：给 Agent 的受控指令输入、提交/停止事件与外部步骤状态。Composer 不冒充内容编辑器，题干、答案与粘贴文章交给 06。步骤可带 `detail`；`AgentStepStatus` 在两个 Agent 子流程及监视器详情中复用 14px 状态徽标，图标、状态文字及颜色共同表达。不连接模型或模拟执行器。
- `AgentQuestionCard`：`question / description / options / value / onValueChange / children / disabled`。选项用 RadioGroup；补充输入通过 children 组合。选中不等于执行或最终保存。
- `AgentContextList`：`items: {id,title,location,description?,status?}[]`，可选 `onInspect(id)`。来源、版本与页码由调用方提供，组件不检索、不读取文件。
- `AgentChangeReview`：`title / before / after / reason / decision / onDecision`，可传 `disabled / disabledReason`。新增可选 `beforeLabel / afterLabel / scope / beforePreview / afterPreview / onResetDecision`；原字符串调用兼容，预览插槽不代表领域差异算法。`decision` 必传；采纳、保留与重新选择只返回意图。调用方核验原文，负责草稿变更、撤销旧核对状态和独立保存。
- `DraftMathPreview`：`value / label?`，仅从当前草稿派生排版，题干与答案复用；不读原稿、不改变输入、不写库。Temml 0.13.4 作为同源原样 ESM 资产按需加载（避免构建优化改写词法器转义）；以 `throwOnError / strict` 开启、`trust` 关闭及展开/大小限额生成 MathML，沿用 Prism Math（STIX）与 `read-body`；正文经过 React 转义，只有渲染器生成的 MathML 可注入。默认识别保守的 Unicode 代数片段，复杂公式要求明确 `\(...\)` / `\[...\]` 标记；无法解析时显示当前原文与 14px 说明。渲染成功不等于数学正确；没有同步原稿或自动确认行为。

第一组 Agent 语义候选（2026-09-22，见 `docs/agent-context-summary-review.md`）：

| 组件 | 输入及回调 | 边界 |
| --- | --- | --- |
| AgentContextSummary | `title / scope / sources / expanded / onExpandedChange? / onInspect? / notice? / snapshot?` | 复用 AgentContextList；来源事实独立，不检索或认证证据 |
| AgentArtifactPreview | `title / version / status / summary / facts? / children? / open? / notice? / snapshot?` | 成果摘要卡与打开入口；打开后的对象呈现由 AgentObjectViewer / 领域工作区承担。预览不证明执行或发布，缺 open 没有入口 |
| AgentExecutionConfirmation | `title / target / version / effects / confirmation / conditions?` | ready 才有 confirm；submitting / received / recorded 为记录；blocked 可有 review；unknown 可有 query。conditions 组合 08；旧确认失效和确认后的编辑冻结由宿主同步提供，不由插槽推定 |
| AgentExecutionProgress | `title / state / description / steps / expanded / onExpandedChange? / updatedAt? / action?` | 复用 AgentTaskProgress；非 running 使用快照呈现，不自行判断进度 |
| AgentExecutionResult | `title / description / receipt / facts? / children?` | succeeded / partial / failed 接收 completed / remaining 及可选 next / secondary；unknown 仅可有 query |

上表保留第一组原有输入；三件套新增 view / density / details、记录字段和职责边界见本文「任务记录三件套两态 v0.1」。

`AgentExecutionProgress.state` 由调用方显式提供，统一类型与标签见 `lib/prism-next/agent-progress.ts`。按照 v0.2.1 §7.1 补充 `degraded`（已降级）和 `retrying`（重试中）；两者与 `paused`（已暂停）均为仅显示状态，**既有执行状态来源未接入**。`shell` / `review` 来源适配保持不变，不为这些显示状态虚构源状态；接入依据与对应关系见 [任务进度状态映射](agent-context-summary-review.md#任务进度状态映射)。

组件不依据计时器、经过时间、确认或重试按钮点击推测状态。仅整体状态为 `running` 时展示实时步骤，其他状态静态保留最后步骤记录。示例选择器提供 15 种手动组合样本，“待人工处理”使用 `waiting-human`，并提供 `queued` / `paused` / `degraded` / `retrying` 样本；这些样本只展示外部输入，不表示已经接入执行服务或自动流转。

后四项位于 `agent-semantic-components.tsx`，均可传 `presentation="card" | "inline"`，只控制外壳，不创建宿主面板。`AgentSemanticAction={label,onAction,disabledReason?}` 表示宿主提供的能力，回调仅为意图；条件、权限、有效版本、回执与恢复范围由宿主核验。新增 `AgentTaskProgress.activity="live" | "snapshot"`，默认 live 兼容；snapshot 将 running 步骤标作“上次进行到”，不转圈、不设置当前步骤。

引导式任务 v0.1.1 参考 [Beautiful UI](https://www.beautifului.dev/) 的 Approval Card / Context Cards / Task Rows / Diff Table 交互组织，以既有 Prism / coss 原位组合实现；未复制其源代码、引入依赖或第二套样式。独立样本在 `/next/components/agent-components`，完整流程在 `/next/agent` 的「试卷解析引导」。后者直接复用 `ParsingWorkspace embedded` 与原解析 reducer、校验、原稿和本机示例记录；`/next/use-cases/parsing` 同步使用这组组件。原材料复核助手与阅读页 compact 用法保留。

补充要求最多 500 字，保存在解析示例并写入任务指令；固定示例不根据自由文本生成内容。排版建议仅演示条件与问题分段，采用仅记录内容选择，核对状态见题目编辑区；若题干已被人工修改，旧建议不能覆盖。任务指令可在任意已添加材料的阶段展开，保存后直接展示；编辑复用副本不会修改当前任务。

应用示例中的题库状态、学习 reducer、合成证据、模拟任务与人工扫描区域均不放入这些复用组件。当前仍是本地交互演示，不含真实业务服务和持久化。


## 页面骨架：WorkbenchShell v0.3（Candidate）

组合路径：组件库 → 页面骨架 → 标准页面 → Demo / Website。骨架源码是唯一维护源，接入项目沿用按需复制源码与来源清单，不再还原独立设计稿。当前实现总骨架与第2项 Agent 页面骨架候选，第3—7项未启动。

| 输入 | 责任 |
| --- | --- |
| organization / user | 当前组织标识、名称、摘要与当前身份；无跨组织切换 |
| navigation / activeId / onNavigate / onPersonal | 导航数据、当前位置和路由回调；骨架不生成业务页面 |
| search | 外部查询、结果、加载/错误状态、来源与范围说明、选择回调；本轮夹具仅含五入口与一材料 |
| notifications | 记录、未读、逐条与全部已读回调；不改任务或业务成果状态 |
| monitor | 当前用户已授权的批阅/解析任务、availability、freshness、来源说明与可选 onOpenTask；不会从对话结束推断完成 |
| usage | 积分与 token 分别提供个人/组织/待确认归属，以及启用/未启用/不可用；未知数据不能显示 0 |
| context / auxiliary / auxiliaryLabel / children | 可选上下文侧栏、辅助区及其名称、主内容。context.content 可用 render function 接收目录关闭回调；辅助区只渲染一份，受控值由应用保存 |
| basket | 接收已有题篮的 open、position、empty，以预留布局空间。题篮状态、业务和浮层由应用拥有 |

骨架只使用现有组件 variant/size、主题令牌与字体，CSS 限于布局、区域尺寸及响应式。ThemeProvider 继续使用 `prism-v1-theme`；浅色、暖纸、深色应用到正文和 portal。搜索为模态 Dialog，通知/状态为 Popover，个人菜单为 Menu；同一时间只展开一个公共面板，关闭返回相应触发器，搜索选中结果后进入主内容。跳过链接不改写 HashRouter。顶部固定，主内容及桌面上下文分别滚动；中小屏收纳一级导航和上下文目录；题篮右侧/底部预留空间。

接入时同步整个 `components/prism-next/skeletons` 目录及其直接 coss/prism/lib 依赖。演示页 `examples/skeletons/workbench-review` 只用于评审，不作为生产数据源。工作台通过同源副本与薄适配器接入原 `TeacherQuestionBasketProvider`，保留原业务路由和持久化语义。


v0.2 空间规则：辅助区根据扣除上下文与题篮后的实际工作区测量；宽度不足1120px或高度不足640px时收纳到同一公共面板体系，入口保留在主内容滚动区之外。外壳不足1100px时再收纳上下文；关闭辅助面板保留阅读位置并返回入口焦点。设置改变引发收纳时自动接续面板，避免正在操作的控件消失。

题篮面板使用 `workbench-basket-panel workbench-basket-right` 或 `workbench-basket-bottom`，空态同时加 `workbench-basket-empty`；外壳传入相同的 `basket.empty`。两处由同一CSS变量声明尺寸，避免页面预留与portal尺寸脱节。空态右侧20rem/底部min(36dvh,19rem)，有题右侧clamp(18rem,32vw,26rem)/底部min(46dvh,24rem)。这些尺寸仅供使用该骨架的接入页选择，不自动重写既有业务外壳。

设计验收包含组件、色彩、用户体验、艺术表达、空间利用率。空间子项必须检查主区有效宽高、首屏内容、留白与密度、同时展开的收纳顺序、操作距离及滚动、桌面/中屏/窄屏/低高度视口；“无溢出”不是设计通过的充分条件。


## AgentPageSkeleton v0.1（Candidate）

组合：`WorkbenchShell contentLayout="workspace"` → `AgentPageSkeleton` → `AgentComposer` / 消息内容。沿用原工作台 Agent stage 的新对话和连续对话结构；不会创建一套平行导航。`contentLayout` 默认仍为 document，workspace 模式把消息滚动与输入区留给内容骨架管理。

| 输入 | 责任 |
| --- | --- |
| title / meta / actions | 当前对话标题、摘要与页面操作；允许长中文自然换行 |
| expression | 默认 `default`；`candidate` 仅用于表现评审，配合 `expression.css`，不改变对话数据或消息状态 |
| empty / welcome / suggestions | 新对话内容与可编辑示例；示例填入不自动发送 |
| messages / composer / notice | 消息、输入与反馈插槽；应用持有状态、草稿、材料快照、发送和停止回调 |

目录通过总骨架 context 接入。正文最大阅读区 760px；连续对话的消息区独立滚动，输入区在视口内保留，短高度改为整体可滚动以免裁切。页级样式只控制布局。消息不等于后台任务，回复结束不修改全局任务监视器状态。

`AgentComposer` 收回既有工作台的 default / compact / conversation 变体、tools / attachments / context / suggestions / footerNote 插槽及工具栏布局；使用现有 InputGroup 与 Textarea，不定义另一套输入皮肤。空白禁发、组合输入保护、Ctrl/⌘+Enter、运行时停止继续由组件提供，主动停止后焦点回到输入。

`examples/skeletons/agent-review` 为两仓同源评审 fixture；固定回复、材料与历史仅保留本页会话，刷新恢复初始示例。真实会话存储、模型接入、任务调度及业务成果由后续应用适配，不能把此 fixture 用作生产实现。`review-basket` 只共享演示题篮；工作台传入已有题篮适配。

AgentComposer 的 `inputSize="compact"` 缩短连续对话输入区，默认尺寸保持；最大输入高度仍由组件限定。workspace 模式的底部题篮为 min(36dvh,19rem)，与总骨架 document 模式分别保留空间。低高度时题篮入口有独立底部预留，避免覆盖发送按钮。

### 2026-09-20 快捷设置修复与 AI 活动监视器规划

快捷设置的主题选项使用纵向图文，但只设置 `h-auto`，被 Button 的 `sm:h-8` 覆盖：桌面实测容器高34px，图标在顶部外溢5px。组合层补全 `sm:h-auto`，文字置于可换行容器，网格按最小可读宽度自动收纳。保留现有 Button 外观、主题令牌和 `prism-v1-theme` 保存方式，不修改 coss 基础组件。

用户指定的旧版依据是 `ole-demo-site-offline-2026-08-20.html` 内的 `#/teacher`，而非新仓库的首页 AI 卡片或早期概念图。已实际打开并查看监视器、AI 运行活动页及三个任务示例；上传文件 SHA-256 为 `fd28c244c31e05d312a046c615cf4ad5e9f79c75b572f1e9ce19544a164c7414`。参考文件仅用于本地只读核对，不收进源码或发布产物。

旧版监视器约216×80px，位于导航下方、试题篮上方，包含名称、LIVE、弱波形、呼吸点和每3.6秒轮换的摘要；支持减少动态效果。点击进入 AI 运行活动，通过选择器查看需处理、进行中、排队中三个固定示例，详情含任务依据、进度、运行轨迹和业务成果。旧版常驻摘要来自固定演示数据，不随详情选择同步；不能把它当成真实实时任务源。

**2026-09-20 已按以下边界完成 WorkbenchShell v0.3 实现。** `AIActivityMonitor` 属于骨架组合，不计入组件数量；两评审页共享 `useActivityMonitorFixture`，演示数据不进入复用骨架。

- 范围：当前组织内属于当前用户的批阅、解析任务，跨本人的任教班级汇总；应用传入已授权记录，不增加组织管理或全校监控。
- 结构：沿用顶部公共区域的轻量入口，显示运行摘要与任务数；展开同一个活动面板查看任务。保留旧版简洁的状态文字与弱运行信号，不把216×80px侧栏卡片搬进顶栏，不另建业务详情页。
- 状态：空闲、排队、运行中、需关注、失败、AI处理完成；同屏区分执行状态与业务后续（如「批阅完成 · 7项待复核」），AI处理完成不等于教师复核或发布完成。
- 任务行：类型、标题、班级/学科、当前阶段、可信的已处理/总数、最近更新时间、必要的查看/处理入口。无可靠进度时只显示阶段，不造百分比或预计完成时间。解析与批阅各自使用明确阶段。
- 汇总：需处理事项优先提示，同时保留仍在运行的数量；空闲显示「暂无正在执行的批阅或解析任务」。未接入与任务为空分别表达。
- 动效：只在实际运行时显示轻微活动反馈；有多个运行任务才轮换，悬停/键盘焦点停留时暂停，减少动态效果时静态显示。轮换不重复播报读屏，不让提示文字挤动一级导航。
- 连接：正常连接不占醒目位置；刷新失败仅说明「状态暂未更新」并保留最后更新时间，不把连接断开推断为任务失败。通知只承接完成/失败等必要事件，不重复常驻执行进展。
- 详情：面板只呈现进度与接续入口，成果、复核、教学洞察由既有业务页承接；回调未接入时明确演示边界，不伪造跳转或重试成功。
- 审核：组件、色彩、用户体验、艺术表达、空间利用率。重点复核长标题、多个并发任务、窄屏、题篮展开、浮层互斥和焦点返回，不扩大第3—7项实施范围。

本次快捷设置已实看1363px桌面、1024×768、390×844、320×568；浅色/暖纸/深色清晰，图标与文字均在各自按钮边界内。320px放大根字体至200%时选项自动单列，可滚动并用键盘选择；Enter切换、刷新保留深色、Escape返回桌面设置入口/窄屏头像入口均已核对。此项局部布局检查不代替整站视觉验收。

### AI 活动监视器 v0.3 实现验证

`ShellTask` 包含批阅/解析类型、当前阶段、任教范围、最近更新时间、可选已处理/总数、执行轨迹，以及独立的 followUp/result。已处理与总数必须为有效整数；缺测不补零。完成但待复核的任务同时进入已完成与需处理筛选。`availability` 区分未接入与空态；`freshness=stale` 保留最后记录，不推断任务失败。详情回调由应用提供，fixture 没有真实业务回调。

轻量入口保留旧版弱活动信号与3.6秒轮换；只在多个任务运行且无优先待办时轮换，焦点/悬停/展开/减少动态时暂停。面板最大420px宽、680px高，窄屏留出视口边距，以单一滚动层承载长列表和详情；详情从顶部阅读，返回列表恢复滚动位置与原任务焦点。主题选项保留本节前述容器修复。

实际检查六类执行状态、多个并发任务、状态中断与未接入、筛选、演示推进、详情及返回焦点。受管 Chromium 目视桌面1363×936、中屏1024×768、390×844、320×568；浅色/暖纸/深色、长中文、题篮展开与公共浮层切换纳入复核。类型、构建与定向回归结果在工作台既有骨架验证记录登记。未做实体移动设备、屏幕阅读器、跨浏览器或真实服务验证；本轮仍待用户站点评审。

## Typography v0.2.1

参见 [字体规范](typography.md) 和站内 `/next/foundations/typography`。迁入时必须同时包含 `typography.css`；公共角色样式与控件适配属于 Prism 层，不修改固定 coss 源码。
