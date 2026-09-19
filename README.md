# 智能曜彩 UI Design System

## 当前可用版本：coss v1.13.1

### Agent 页面骨架 v0.1 · 候选（2026-09-19）

评审入口 `/next/skeletons/agent`，分类仍为「页面骨架」，不增加组件数。`AgentPageSkeleton` 从工作台现有 Agent stage 提取消息阅读/输入布局，与 `WorkbenchShell contentLayout="workspace"` 组合；对话目录复用总骨架上下文区域。`AgentComposer` 收回工作台已有 conversation/compact 变体与材料、工具插槽，default 行为保留。对话示例由独立 reducer 管理，不接模型或业务执行服务，不改原工作台会话存储。

新对话、连续对话、历史筛选、草稿与材料接续、回复中/停止/失败恢复可以操作。搜索仅覆盖本页示例；停止后不会被迟到的演示回复覆盖。演示题篮由总骨架和 Agent 页复用同一 fixture，工作台仍传入原全局题篮。本轮只推进第2项；第3—7项未启动，标准页面与正式站点不替换。

### 总骨架 v0.2 · 候选（2026-09-19）

新增独立「页面骨架」与「标准页面」分类，组件数量仍为 80。骨架目录 `/next/skeletons`，教师工作台交互评审 `/next/skeletons/workbench`；标准页面仅登记阶段，尚未开始实现。原组件、两项应用示例及业务入口保留。

- 从 `Ashrum/ole-school-workbench@02109ef194d80f128be69265b65a5d7762456a74` 的 `PreviewHeader` 和全局题篮布局提取 `WorkbenchShell`，在本仓库 `a764bf6e5fb38d427e461d7144580093efb1263e` 基线上组合现有 coss/prism 组件。
- 公共壳包含组织、五项顶部导航、可选上下文侧栏、搜索、通知、后台状态、个人菜单、三主题与独立积分/token 插槽。业务数据和路由由调用方传入，演示夹具位于 `examples/skeletons`。
- `QuestionWorkPanel` 收回工作台已有的底部方向、初始/返回焦点、标题操作、页脚及关闭按钮公开属性，默认行为保持原状。没有改写题篮编辑/发布流程。
- v0.2 空间整改：按剩余工作区宽高收纳辅助区，固定入口保持可达；随后收纳上下文目录。题篮空态与有题状态共享尺寸预留；说明减量、正文前移，保持阅读行宽。
- 第1项总骨架保留；用户已批准开始第2项 Agent 页面骨架，第3—7项未启动。本次候选通过 PR 审核，不替换正式站点。

验证：两个项目类型检查和构建通过；组件复用/coss/语义共 17 项测试、工作台 13 项 ID/题篮/导航回归通过。浏览器检查 1363px 桌面，以及实际页面在 1280/820/390px iframe 视口下的响应式表现、三主题、长组织名、长中文/公式、键盘搜索、通知已读与空态、任务五状态、积分/token 三状态、题篮展开和跨路由保留。修复搜索结果的焦点落点、HashRouter 跳过链接和 Flex 宿主宽度。实体移动设备、屏幕阅读器、真实后端与多用户服务未验证；不把构建通过视为用户视觉验收。


当前 80 个组件已通过评审，作为研发接入的源码基线。包含 54 个 coss 基础组件、16 个组合组件、10 个扩展组件、3 套主题和 2 个应用示例；应用示例独立于组件，不计入组件数量。

- [组件站点](https://intelligence-prism-ui.ashrvm.chatgpt.site/next) · [基础规范](https://intelligence-prism-ui.ashrvm.chatgpt.site/next/foundations)
- [源码接入与组件约定](docs/component-contracts.md)：依赖、主题、字体、目录与数据接口。
- 本版在 v1.13.0 上统一评审状态和版本号，沿用已验证的视觉、交互与组件接口。
- 交付方式为源码复用，`private: true` 保留；未发布独立 npm 包。应用示例使用演示数据，业务服务、权限和持久化由接入应用提供。

### 启动现有组件站点

使用 Node.js 22.13 或以上和 npm。现有构建脚本依赖 Bash 与 GNU 工具，请在 Linux 或 WSL2 中运行。

```bash
git clone https://github.com/Ashrum/intelligence-prism-ui.git
cd intelligence-prism-ui
npm ci
npm run dev
```

生产构建运行 `npm run build`；自动回归运行 `npm test`。源码接入目标项目时，使用 [组件复用约定](docs/component-contracts.md) 中的依赖与主题设置。

以下为历史迭代记录，当前范围与状态以上述可用版本为准。

## v1.13.0 — 层级与常用组件示例完善

- 修复 Select 横向“复核状态”标签与触发器贴合的问题，显式保留 12px 水平间距。
- 弹出式教材选择器移除深层缩进上限，以递进缩进、分支线和级数标记区分层级；增加独立 2／3／4／5 级数据切换，默认教材内容及 ID 保留。
- Avatar 展示 24、32、40、48、64、96px 六档尺寸；Card 增加内容、横向条目、指标、人物、选择与分组六种组合，均复用 coss 原始组件。
- Frame 原实现符合 coss：外框 4px、面板内边距 20px，保持标准比例并补充多面板示例。80 个组件入口不变，没有新增应用页面。

## v1.12.1 — 重复页面清理

- 80 个通用组件展示页与 54 个 coss 原始组件保持完整；应用示例由 10 个收敛为 2 个：题库与打印组合、统一学习支持流程。材料研读、Agent 工作区与基础规范保留。
- 撤下学生分析整页及矩阵、里程碑、负荷日历、答卷定位的重复应用示例；诊断、目标和计划合并到学习支持流程内。旧链接跳转到对应组件、图表目录或流程阶段。
- 删除撤下页面的专用代码、演示数据模型及对应测试，修正内部入口；学习示例状态不再挂载到全站。组件接口、图表能力、主题与基础控件未变。

## v1.12.0 — 四类通用图表补齐

- 新增成对指标、四象限散点、柱线组合；完善状态组成的数量/占比、六分类色、选择与缺测。独立组件以外部数据、单位、范围、分组和回调驱动，不增加业务分析整页。
- 组件目录 80 项（54 基础 / 16 组合 / 10 扩展），应用示例仍为 10 项。54 个 coss 原始组件保持不变，延续浅色、暖纸和深色主题。
- 各图提供学习、运营、边界与缺测输入和空数据切换；支持图形点击、悬停与数据表选择。柱线明确双轴单位并保留缺测断点；四象限阈值由调用方设置；相等的成对指标保留两个形状。
- 验证：类型检查、生产构建与 56 项回归通过；使用生产样式检查三主题、双轴单位、缺测断点、相等指标和图形/数据表回调。窄屏以 390px 浏览器容器核对，真实移动设备与真实业务数据未验收。
- 入口：`/next/components/status-composition`、`paired-dot-chart`、`quadrant-chart`、`combo-chart`。接口与边界见 [组件复用约定](docs/component-contracts.md)。

## v1.11.0 — 可复用组件与应用示例分离

- 保留 54 个 coss 原始组件，组件目录共 77 项（54 基础 / 16 组合 / 7 扩展）；题库、分析和学习工作流等 10 个入口单列为应用示例，不再计入组件数量。材料研读与 Agent 工作区保留。
- QuestionCard 仅传一道题即可使用；详情、选择、操作和分值覆盖均可选。题目数据、学生作答、评分规则与教材资料从外部传入；作答控件独立，评分复核支持不同题目及没有细分 rubric 的情况。模拟题目和作答移入 fixtures，工作流移入 examples。
- 指标、趋势、比较、状态组成、目标对照、筛选与数据表改用通用数据和事件接口。诊断证据、目标卡片、核验字段、任务列表、里程碑、负荷日历、文档区域和 Agent 输入/步骤进度独立复用；原应用示例使用这些组件。
- 新增 ECharts 6.1.0，按需加载 SVG 引擎，首批封装热力矩阵、散点和箱线。现有趋势/比较继续使用 Recharts。组件不固定学情口径、不推断诊断或达标、不内置目标 80%。提供两组用途不同的数据、空态及数据表操作入口。
- 原浅色 / 暖纸 / 深色、系统字体、STIX Two Math、coss 选择框与右侧 Drawer 继续使用。里程碑、日历、文档区域和 Agent 按用途归类。
- 接口与迁移说明：[组件复用约定](docs/component-contracts.md)。入口：`/next/components/question`、`evidence-matrix`、`scatter-chart`、`box-plot`；应用：`/next/examples/questions`、`student-analysis` 等。旧分析地址自动重定向。
- 验证：类型检查、生产构建、53 项回归通过，覆盖 77 个组件入口、10 个应用示例及全部 coss 源码散列。浏览器核对外部题目复核、题卡可选详情、图表数据替换/缺测/空态、三主题、390px 窄屏、试题篮导入组卷、纸面预览与 448px 非模态 Drawer。静态生产样式夹具存在 Vinext 预取提示，不据此宣称真实部署导航已做浏览器端验收；实体打印、真实移动设备及真实业务数据未验收。
- 当前仍是组件交互演示；没有新增真实模型、学情、扫描/OCR、业务持久化或正式组件包发布。

## v1.10.0 — 四类可操作的分析视图

- 新增学习证据矩阵、目标里程碑、学习负荷日历和答卷复核定位。组件入口共 75 个：54 个原始 coss 基础组件、16 项业务组合、5 项扩展。保留原图标目录与统计图表，并在单元分析页添加四类视图入口。
- 矩阵复用 SYN-A 的 18 条合成证据，以知识项 × 轮次排列，直接区分 0/2、1/2、2/2、缺测和待复核；点击单元格筛选既有证据表及右侧 Drawer。颜色仅辅助，行头在横向滚动中保留。
- 里程碑与日历复用 learningReducer、goalStatus、goalSourceValid、VerificationPanel、LearningDate、QuestionWorkPanel。提供隔离的预置演示与当前工作流两种来源；预置演示不写入外层 Provider，也不关联 SYN-A 历史。
- 里程碑展示来源、启用和两次独立作答核验，来源或标准变化使旧核验失效。日历在原 coss Calendar / DayPicker 上扩展日格，保留键盘行为；展示预计剩余分钟、超量、任务状态，支持改期、时长、跳过理由和截止提示。暂停、未启用及失效来源不计入可执行负荷。
- 答卷定位使用明确标识的排版示意和人工区域坐标，不声称真实扫描或 OCR。支持题号与纸面联动、跨页、缩放、类型筛选、同范围下一项、识别文本修正、需补扫及撤回。只有填写依据并保存才记为处理；核对记录不修改评分，补扫仍标为待跟进。
- 验证：类型检查、生产构建及 46 项回归通过，包括全部 75 个入口和 54 个 coss 源码散列。浏览器检查了生产样式下的浅色、暖纸、深色，矩阵下钻，1/2→2/2 目标核验与焦点回返，预置示例隔离，25 分钟任务跨日改期，答卷记录保存、跨页和 150% 缩放，以及 390px 日历。真实移动设备、扫描服务、持久化和实体打印未接入本轮验证。
- 新入口：`/next/components/evidence-matrix`、`goal-milestones`、`workload-calendar`、`answer-review-map`。分析组件继续按需加载，未添加依赖或更改 coss 原始组件。

## v1.9.0 — 图标与数据分析

- 新增图标目录（41 个明确导入的 Lucide 图标），支持中文用途/英文名称检索、业务分类、尺寸对照与导入代码复制。沿用系统字色，不修改 coss 控件内部图标尺寸。
- 新增 8 类分析组件与“学生单元学习分析”组合页：指标、趋势、比较、分布、目标对照、状态组成、筛选、证据明细。共 71 个组件入口：54 个 coss 原始基础组件、12 项组合、5 项扩展。
- 图表使用现有 Recharts 3，采用 shadcn Chart 的组合思路；分析模块按需加载。坐标、网格、提示框和系列使用现有三主题 token，不增加全局 SVG/字体覆盖。54 个 coss 源文件保持原样。
- 使用独立的 SYN-A 合成记录，不补造评价工作流中的作答。得分率以有效得分/有效满分加权；待复核与缺测排除，复核零分保留。趋势缺测断开，分布区间互斥，目标数值进展不自动等于达成。
- 筛选同步图表与明细；下钻保留总览范围，支持键盘明细入口和日期排序；证据复用无背景遮罩的 coss 右侧 Drawer。切换范围关闭旧证据。另提供加载、失败恢复与无数据状态。
- 验证：41 项回归覆盖全部 71 个入口和 coss 原始源码；浏览器核对正式 CSS 下的三主题、14px/20px 选择框、448px/0.45s 右侧 Drawer、筛选下钻、图标搜索与复制。当前为组件演示，实体打印和真实移动设备另行校样。
- 入口：`/next/components/icons`、`/next/components/student-analysis`。尚未接入真实学生数据、服务端存储、统计推断或 AI 诊断；热力图、知识网络和雷达图不属于此轮范围。

## v1.8.0 — 评价与学习支持

- 新增 4 项 coss 业务组合：`/next/components/evaluation`、`diagnosis`、`goals`、`learning-plan`。目前共 54 项官方基础组件、6 项组合和 1 项教材目录扩展，61 个组件入口。四阶段共享当前会话；刷新或确认重置后恢复初始示例。
- 评价复用现有 QuestionReview、QuestionContent 与 PointsField，抽离可控编辑状态。未评分保留为空；教师确认产生不可变评价版本，不把未提交修改当作诊断依据。
- 诊断候选引用具体学生、题目版本、作答与评分点，支持确认、排除和重新复核；诊断自身保留修订号。评价或判断变化后，关联目标与任务保留，但来源需要明确复核。
- 目标保留起点、来源、可编辑标准、截止日期和状态。标准变更及来源重新确认会使旧核验失效；任务完成进度与目标达成分别计算。两份独立新作答逐项通过是本演示约定，不声称是 OLE 规定。
- 学习计划支持生成去重、添加、搜索、状态筛选、改期、调序、开始、完成和带理由跳过；复用既有 Drawer、Table、Field、Select、Number Field、Calendar 和 Progress。暂停或来源失效时阻止任务状态推进，仍可改日期及备注。
- 右侧编辑面板不遮挡原工作区；步骤切换保留草稿并隐藏非当前步骤的抽屉。新作答核验按作答 ID 保存草稿；保存被拒绝时保留面板、输入和错误提示。目标达成被更正后转为重新验证，历史记录不删除。
- 原 OLE Outline 文档当前无法公开读取。本轮依据已有题目、教材目录、评分设计及用户明确提出的四个方向实现，待原规范可访问后继续逐条核对。学生与作答均为人工编写示例，没有连接真实学情、模型评分、扫描识别或后端存储。
- 验证：类型检查、生产构建及 36 项回归通过，覆盖 61 个组件入口和 54 个 coss 源码散列。浏览器使用真实生产 SSR、CSS 与交互脚本，走通评价至目标核验流程；实测步骤切换草稿、B/C 核验草稿、暂停拦截、重复生成、跳过理由和两份独立证据判定。三主题、14px 按钮/选择框与 448px 右侧 Drawer 已检查。移动触摸、真实学生数据及实体打印不属于本轮验收。

## v1.7.4 — 旧版移除与 coss 对齐

v1.7.4：
- 按用户最新要求移除旧版页面、组件、全局样式、旧字体和 OpenUI 试验接口，清除旧版导航入口；原站首页直接跳转 `/next`。当前只保留 coss 根布局，历史实现及评审通过版本记录回溯。
- 发布产物中已复现 Select 闭合值 16px / 24px 行高、选项 14px / 20px 行高的不一致，以及深色页面默认文字仍为深灰、字体继承旧阅读字体的问题。修复后恢复 coss 桌面 14px / 20px、sm/default/lg 高度 28/32/36px；题目正文和数学排版尺寸保持不变。54 个 coss 原始组件不修改。
- 试题篮与卷面设置从 coss Sheet 改为已有的右侧 Drawer，直接复用全宽滑入、圆角、阴影、滚动和关闭行为。保持非模态、页面可操作与实时预览；宽屏内容避让与 Drawer 的 450ms 时序一致，删除试题篮 Footer 的网格覆盖，恢复 coss 响应式排列。
- 此次视觉核对使用生产构建的 SSR 页面、合并 CSS 和实际交互脚本，而非只检查开发预览。实测普通按钮 14px/20px、字重 500、默认横向内边距 11px、图文间距 8px；输入框桌面 28/32/36px 与标签间距 8px 均与官方一致。检查三主题普通文字与公式、抽屉外搜索、80mm 作答区即时更新及嵌套 Escape。旧路由 404、首页跳转和 57 条组件路由均有回归验证。移动设备手势与实体打印仍需后续实测。

上一轮 v1.7.3：
- 完成五轮有不同目标的验证：三主题视觉与布局；菜单、试题篮与纸面预览交互；跨场景草稿状态；键盘与桌面重排；构建与自动回归。第五轮 56 项检查通过，包含全部 57 条组件路由、54 个 coss 原始组件散列和旧版内容保留。
- 修复“隐藏界面”丢失来源草稿展示参数的问题：保留编排题号、整题和小问分值，以及练习的隐藏分值设置。显示界面按钮与 Esc 共用返回逻辑，恢复来源题卡的视口位置及“更多”按钮焦点。
- 五轮之后继续优化材料研读：复核建议的“未追加／已追加待保存／已保存”由实际草稿与保存的备注计算。取消或手动移除后恢复追加入口，保留复核结果；不会重复追加，超过 500 字仍保留原备注。
- 基础规范的组件范围直接使用目录数据；外壳与基础规范的版本显示统一读取配置，避免独立文案落后。

验证证据：浏览器实测三主题公式与文字、无重复的桌面更多菜单、右侧 coss Sheet 开启时搜索、示例 6 题与实际空草稿隔离、A4 794px 物理宽度、实际草稿 3 页及独立页边距、10 分与编排题号保留、练习无分值、末题返回位置与键盘焦点、嵌套 Escape，以及建议追加／取消／保存／手动移除／超限路径。窄屏断点及减少动态效果做源码核对，未替代移动设备实测；实际 PDF／实体打印仍待校样。

上一轮 v1.7.2：
- 修复刷新后直接进入纸面预览没有示例内容的问题。默认“示例试卷 · 6 题”，使用现有六种题型和同一 QuestionPrint 渲染，不修改试题篮、试卷或练习草稿。
- “预览内容”可切换示例、当前试卷与当前练习，并显示题数；从编排区点预览严格进入对应草稿。各来源的排版设置独立保留。
- 空草稿就地提供“前往组卷／组练习”和“查看示例试卷”，不会自动填入示例；继续使用已确定的 coss 右侧 Sheet。

上一轮 v1.7.1：
- 试题篮与排版设置恢复为现有 coss Sheet 的最右侧推出样式，复用 SheetPopup、Header、Panel、Footer、ScrollArea 及原有动效；删除上一版文档流面板的自定义外壳与布局。
- 使用 `modal={false}` 和 `disablePointerDismissal`。只在这两个业务 Portal 内隐藏遮罩、让视口透传指针，保留主页面操作；coss 原始组件文件不改动。
- 宽屏为右侧 Sheet 留出空间，纸面按可用宽度显示，A4 测量与实际分页不变。窄屏遵循 coss 右侧覆盖样式，查看题目详情或导入草稿时收起，关闭后立即看到设置结果。
- 保留勾选、滚动位置、排版设置与纸面定位；同一时间只打开一个工具 Sheet。题目资料编辑继续使用原 Dialog。

验证：类型检查、生产构建、18 项相关回归通过，包含 coss 源码散列、旧内容保留和全部 57 条组件路由。浏览器验证右侧推出、外部搜索、勾选保留、嵌套下拉 Escape、实时作答高度与 A4 尺寸；窄屏做源码复核，未宣称移动设备验收。实际 PDF／实体打印仍待校样。

来源：[coss Sheet](https://coss.com/ui/docs/components/sheet)、[Base UI Dialog](https://base-ui.com/react/components/dialog)。本次仅做业务组合与局部非模态适配，继续遵循“已有组件 → 修改/组合已有 → 必要时全新创建”。

上一轮 v1.7（布局已由 v1.7.1 替换）：
- 排版设置与试题篮改为文档流内的工作面板，不使用遮罩、焦点锁定或外部点击关闭。复用 coss 控件，原始组件文件保持不变。
- 桌面试题篮与主区并行搜索、选题；勾选与面板滚动位置在收起后保留。查看已有题目会在主区定位，筛选外题目使用主区详情并可返回原筛选。
- 排版设置实时更新，修改小问留白或题前换页会定位对应内容。A4 实际宽度与分页独立于面板宽度，适合宽度／100% 仅改变屏幕预览，打印恢复 100%。
- 窄内容区的排版设置在预览上方；试题篮与主区明确切换。同一时间只显示一个工作面板，题目资料编辑仍使用独立 Dialog。
- 公式继续使用原生 MathML + 本地 STIX Two Math。截图化简式实测根号内 3 与外部 1 的底部一致；未施加数字位移、未替换数学字体。补齐数学字体的字重、字形、数字特性及字距隔离，避免继承普通 UI 字体样式。

验证：类型检查、生产构建及 56 项自动检查通过。浏览器已核验试题篮勾选保留、筛选外题目往返、导入草稿、并排纸面、80 mm 留白与对应内容定位，以及 700px 内容容器的上下布局与试题篮区域切换；这不是实体移动设备验收。实际 PDF／实体打印仍待校样。

上一轮 v1.6：
- 更多菜单按当前场景去重；分组操作改为“移至其他题组”。
- 隐藏界面仅收起导航与无关控件，显示界面／Esc 返回；不扩展课堂讲解系统。
- 题目资料使用 coss Dialog 按需编辑，教材关联与资料一起提交；取消不改变原题。移除列表中常驻表单。
- 详情使用所属题目内的次级背景，正文、公式、解析步骤、评分依据采用独立阅读层级。
- A4 纵向按物理尺寸实测分页；题面与作答区、紧凑题面、配套答题纸、教师答案四种输出。逐小问留白、字号、页边距与题前换页分别跟随试卷／练习保存。
- 每页保留内容版次、页码，题目保留 ID 与资料版本；这些是演示核对标识，不是正式扫描模板协议。
- 作答回看与教师复核按小问对应学生作答和评分点，区分初评、复核中和已记录得分。

验证：类型检查、生产构建及 56 项自动检查通过；浏览器核验菜单、取消编辑、隐藏／恢复界面、三主题、逐小问作答区、排版设置返回保留与答案分页。

打印验证边界：预览分页与交互可验证；当前 Cloud Browser 不提供 PDF 导出能力，实际浏览器 PDF／实体打印仍待验收。A3 拼版及扫描识别业务接入未在此版实现。


本轮用户授权完成一版组件库，并要求自行验证、继续修正后发布。当前基线优先于下面保留的历史流程与旧版设计说明。

- 新版入口：`/next`；规范：`/next/foundations`；组件：`/next/components/[slug]`。
- 应用模式：`/next/reading` 材料研读编辑、`/next/agent` Agent 工作区。
- 54 项 coss 官方基础组件、6 项场景组合（Date Picker / Question / Evaluation / Diagnosis / Goals / Learning Plan）和 1 项教材目录扩展均有可操作示例。旧目录的 59 项规划是历史记录，不等同于本版交付范围。
- 浅色 / 暖纸 / 深色一起提供；语义变量同时控制背景、标题、正文、公式、图标、状态与 Portal 浮层。
- MD 浮动标签、Beautiful UI 和旧智能曜彩组件样式均不进入新版。保留 shadcn 的组件源码方式，采用 coss 视觉与 Base UI 行为；Motion 负责应用状态动效。
- Agent 借鉴任务、上下文、执行步骤、停止、失败重试、结果确认的交互结构。本版为本地演示，不调用模型，不需要 API key 或额度。采用建议追加到人工备注，超出 500 字时不改变原文。

### 组件复用顺序

新增场景先查现有项目与 coss 官方可用组件；其次基于已有组件组合或修改；只有缺乏合适基础时才全新创建。注明复用来源与必要改动，沿用已定主题和控件尺寸，不引入另一套全局视觉样式。

### v1.5 题目详情与独立场景工作区

- 详情使用固定的“答案与解析 / 教学定位 / 题目档案”标签页。“详情”入口名称不变；教学定位先呈现知识点、解题方法、要求与完整教材路径。仅维护场景提供“编辑教材与知识点”，直接复用原范围选择器；取消不改变关联。
- 新增 `QuestionDetails`、`QuestionActions`、`QuestionDraftSettings` 与题目元数据。工具栏和菜单使用 coss 原始 Toolbar / Menu，选择与数值输入维持其标准尺寸；没有修改 `components/coss` 或依赖。
- 批量勾选、收藏、试题篮、试卷与练习分别维护。篮中候选导入草稿后继续保留，重复导入去重；移除、换题和改分只作用于对应草稿。复合题保留共同材料与全部小问。
- 试卷和练习各自设置标题、分组、时长、分值显示及答案可见策略，练习额外设置目标。分组重命名保留题目；删除分组才将题目移至第一组。支持组内上移/下移、拖动调序、跨组调整、保存/恢复本页草稿。
- “相似题”浏览与“换题”替换分开。候选解释同方法或相关知识点，不编造相似百分比。替换保留位置和分组，采用新题默认分值；工作区撤销说明具体对象并能恢复原分值。
- 维护资料、复制为新题、纠错均为当前页面演示。档案与各场景使用同一可用状态；不可用题不能新增入篮或导入，含不可用题的草稿禁用预览/打印。打印读取所选草稿，练习可以隐藏题面分值，教师答案版保留原题依据。
- 统计、来源和课程标准缺失时如实说明；不调用 AI，不向外部发送纠错，不实现真实题库写入、学生发布或后端保存。刷新后演示状态重置。
- 验证：类型检查、生产构建及 54 项自动检查通过，覆盖 57 个组件路由、coss 原始源码、旧版内容保留、教材目录、工作区隔离和评分约束。浏览器核验三类详情、教材搜索取消、双草稿导入、调分/换题/撤销、分组重命名、调序和保存恢复；三主题的题面、菜单与弹层可读性，以及不可用原因校验、档案同步、草稿打印阻断、纠错记录均已核验。实体打印的分页仍需最终校样。

### v1.4 题目多场景组合（历史记录）

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

### 单一 coss 实现

用户已明确要求移除旧版。旧页面、组件、全局样式及阅读字体不再参与构建，`/` 跳转 `/next`；原 `/next/...` 地址保持不变。历史源码与评审只在版本记录中保留，不重新加入当前运行时。系统字体用于界面，本地完整 STIX Two Math 用于数学公式。

### 验证与维护

- `npx tsc --noEmit`：完整类型检查。Worker 声明由当前 Wrangler 官方 runtime 生成；真实 DB 绑定仍为可选。
- `npm run build`：有界生产构建与完整 STIX 数学字体校验。
- `node --test tests/*.test.mjs`：全部 80 条组件路由、2 个应用示例、首页跳转、旧路由下线、原始 coss 散列、教材目录、题目工作区、材料校验和 Agent 状态约束。
- v1.0 实际浏览器验证：三主题正文、MathML、选择浮层；coss三档外框实测28/32/36px；键盘选择与Esc；搜索过滤；对话框取消与归档焦点回退；OTP连续输入；中文日期选择；材料保存刷新、Agent采用/停止/失败重试、页签草稿保留。
- v1.1 实际浏览器验证：深色多选删除/搜索与分组搜索；浅色 Select 说明/多选；暖纸日期范围、快捷日期和月份同步；表格跨页选择、批量标记、筛选清空选择、空结果及失败重试；弹窗未保存确认、焦点回退、失败保留原文并重试成功；长内容滚动布局；搜索清除后焦点保留和数值范围报错。
- v1.1 类型检查、生产构建和 12 项针对性回归通过；未重复无关的旧功能全量浏览器验收。受控 HTTP 预览的 vinext 客户端导航遇到 Web Crypto 安全上下文限制并回退整页导航；路由仍可打开，该限制不计为生产 HTTPS 验收。
- 窄屏布局已做源码与尺寸审查，修复顶栏、长标题、长日期和动效越界；未将其宣称为真实移动设备验收。
- 浏览器检查记录以实际操作为准；源代码检查不替代视觉确认。v1.13.1 已由用户确认评审通过；后续新增或修改按实际范围评审。


完善设计规范，并逐项打磨组件的视觉、交互和动效。组件质量是主线；工程操作只服务于真实效果的实现和评审。

- 评审与交付站点：https://intelligence-prism-ui.ashrvm.chatgpt.site/
- 源码与变更记录：https://github.com/Ashrum/intelligence-prism-ui
- 原站首页直接进入 `/next`，旧版 `/foundations`、`/components`、`/review` 已移除。

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

## OpenUI 研究记录

早期 `/review/openui` 试验未证明优于普通 React 组合。该页面与服务端试验接口已在 v1.7.4 移除，不属于当前可用版本；真实生成和流式服务未接入。

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
