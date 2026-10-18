# P85 · 交给 Supervisor 的浏览器验收清单

本文件是待执行清单，不是通过记录。基线 `21560ebca1e4e8b45fe57125b8fdb619bece113c`，分支 `fix/blueprint-object-card-ink`。浏览器验收：按分工由 Supervisor 执行。Builder 未启动 / 重启开发服务，未打开浏览器，无本轮截图。

## 路由与矩阵

使用当前工作树对应的 5173 服务；每条路由覆盖 `light / paper / dark / blueprint / blueprint-night` × **1280×900 / 320×900**。另在桌面把预览内容容器收窄至 320，覆盖长中文、公式和 default / compact。

1. `http://localhost:5173/next/foundations/blueprint#sheet-object-cards`：位于“卡片与线条”图纸，依次出现“知识点关系图（固定示例）”和“数学课堂练习（固定示例）”。两蓝图中外框是 1.5px 墨线、标题铺到框内左右边；编排右侧有装饰点和“当前编排”，关系图标题没有伪造状态。正文仍提示保存状态未知。五主题检查外框与同一图纸内容盒对齐，标题不跑出外框，外侧不额外内缩。
2. 同处：点“查看关系图”进入 workspace，出现筛选及只读条件说明；点“返回原位置”回 inline。点“展开编排”进入 workspace，再返回。状态不因展开变已保存 / 已完成；操作容器保持正文后原位置，布局可换行。该固定示例未提供编辑 onIntent，禁用说明应保留。
3. `http://localhost:5173/next/components/agent-components/structure-arranger`：对话态、专用工作区、紧凑呈现、状态示例。确认当前 / 历史身份、保存未知 / 保存中 / 已保存 / 冲突等说明分开；上移下移、分组选择、确认编排资格和说明、展开返回焦点均回归。标题长中文仍可换行，右侧状态不遮挡。标题墨线只应用外层对象，内部题目卡片不被重复套墨色标题。
4. `http://localhost:5173/next/components/agent-components/relation-graph`：对话态 / 专用工作区 / 紧凑与大图场景；320 内容盒默认列表、仍查看关系图、筛选、选中节点、查看来源及返回路径回归。资料不可用时标题仍存在；任何节点统计都不得变成整体“完成”状态。检查标题铺满但内容测量 / 图示阈值不因边距改动改变原行为。

## 隔离、视觉与键盘

- 外层 blueprint 与 blueprint-night 分别在组件页选择内层 light / paper / dark：整个预览根、标题、状态点、操作及 Card 伪元素保持核心主题原貌。跟随站点时才回到墨线标题；检查反向核心外层 / 蓝图局部预览（如需现有夹具）及两蓝图互嵌令牌。
- 核心三主题与 `21560eb` 默认卡片对照；SSR 一致仅为工程证据，仍需视觉检查字号、圆角、间距及操作位置。
- Tab / Shift+Tab 顺序与 DOM 一致，操作焦点环清晰；标题栏不包含伪按钮，装饰点不进入可访问名。读屏器另行实测，未实测不得写通过。
- 对比现有 BpFrameCard：墨底 / 文字颜色一致，状态有完整文字和可辨边界。1280 与 320 下检查真实像素布局、长标题、公式、操作换行；不以只有 scrollWidth 无溢出作为合格。
- 记录真实主题、视口宽高、路由、操作、看到的文案和截图；不要把本文件、源码探针或旧截图写成当前浏览器已通过。

## Workspace 后续同步

先按 [workspace-sync.json](workspace-sync.json) 校验 CSS 的 blob / SHA-256，核对两个未改 TSX 的前置散列，再由 Workspace 任务处理宿主图纸宽度。复验 R10 编排对象内关系图与编排卡共同左右对齐，以及原题打开 / 返回、保存状态和数据版本不变。此清单不代表 Workspace 已同步。

未验：真实浏览器、Workspace 接入、真实服务、移动真机、读屏器、实体打印。CSS / SSR 测试仅验证规则与输出，不代替这些验收。

## P85b 增量验收

在上述三路由、两蓝图 × 1280×900 / 320×900，分别查看 default 与 compact；对照 BpFrameCard 的正文上内边距。默认标题底边到紧邻正文元素上沿应为 20px，compact 两卡均为 12px；同时目视首行文字留白。分别检查编排当前/历史、关系图可用/不可用、inline/workspace，包含说明为空的情况，记录空说明元素是否影响第一条可见正文的位置。原后续块间距、横向宽度、长标题换行不变。核心三主题及蓝图外层嵌套核心预览保持原间距。

## P85c · 标题底边到第一行文字顶边

URL：`http://localhost:5173/next/foundations/blueprint#sheet-object-cards`（compact）；default 使用 `/next/components/agent-components` 中两组件 default 示例。覆盖 blueprint / blueprint-night × 1280 / 320，以及 light / paper / dark 和嵌套三主题预览回归。

1. 两卡标题条分别取关系图直接 h3、编排 header 的第一 div；用 getBoundingClientRect().bottom。
2. 空能力列表场景：确认 ul computed display=none，关系图首行是“示例 v1 · … 个节点 · … 条关系”，编排首行是版本文字。用首个文本节点的 Range.getClientRects()[0].top，减标题 bottom；不要用空 ul 或整个正文容器代替文字 Range。记录字体就绪后的值、主题、宽度与 density。default 和 compact 两卡差均须 ≤4px。
3. 有能力说明场景：unsupported 原因或 supported=true 且 reason 非空，ul 仍显示；首行改为 li 文字，内容与顺序不变。嵌套非蓝图预览不能命中隐藏规则。
4. SSR 行盒推算 default 20px / compact 12px；不能当作上述 Range 实测。保留截图与原始数值，由 Supervisor 回填验收结论。
