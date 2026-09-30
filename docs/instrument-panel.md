# Instrument 任务状态面板 v0.1 · Builder 实现

PO 2026-09-30 批准候选 #3；目录「内容与数据」，入口 `/next/components/instrument-panel`。实现、自测与独立 Review / 产品验收是不同阶段。

## 复用检索与取舍（实施前记录）

- Supervisor `/tmp/prism-instrument/task.md` 已检索 coss registry 579 项，无 status panel / inspector；Beautiful UI `status-panel`、`task-panel`、`inspector`、`side-panel` 均 404。沿用该证据，不宣称本轮再次核实缺项或数量。未复制 Beautiful UI 代码。
- Builder 查询 [coss particles](https://coss.com/ui/particles)，页面列出 510 个组合；[注册索引](https://coss.com/ui/r/registry.json) 本轮 web 无法读取，命令行代理连接失败。结合仓库 `docs/stepper.md` 已记录的 `p-progress-1/2/3` 检索：这些为进度条组合，不提供完整任务状态面板；本轮没有取得其最新源代码，不据此推断额外能力。
- 已读固定 coss Card / Progress / Alert / Empty，以及 Prism Button / Badge / AgentStatus。组合 Card、Progress、Alert、Skeleton、Empty、Button；状态文字与语义色复用 `AgentStatus`，不另造状态视觉规则。
- `MetricSummary` 的单项 `layout="strip"` 可直接复用指标语义与字号；只传一项，不使用其固定明细按钮，行内链接由面板单独发出意图。
- Fix1 沿用上述复用检索与既有组件：指标 Card 建立本地查询容器，并仅对其直接子 `dl` 固定单列（含宽面板）；不修改 MetricSummary 旧行为。清单链接独立使用首行高度与顶部对齐，不沿用主动作最小高度。
- 已查 `AgentTaskProgress` / `AgentExecutionProgress` / `AgentStepStatus`：绑定执行词汇、快照与记录展开，不能把“缺失、有限开放、接收中”等任意业务事实塞进固定执行枚举。复用它们的 `AgentStatus` 原子；清单是面板内部结构，不新增公共组件或改变旧 API。
- `StatusComposition` 用于分类数量与占比，自动计算总量；`AgentContextSummary` 用于材料读取/引用事实，均不等同当前任务清单。保持旧调用兼容，不复制统计、执行或上下文逻辑。
- 只读核对 5174 `TeacherGradingWorkflowPages.tsx` 与 Workspace `SmartGradingReceive.tsx` / `SmartGradingMonitor.tsx`；Figma S10 本地截图用于核对功能结构。沿用任务文件对其余截图的功能提炼；未复制深青黛配色、运行计时或业务推断。

## API 与边界

`InstrumentPanel` 来自 `components/prism-next/instrument-panel.tsx`。所有业务区块可省略，按头部 → 指标 → 当前处理 → 关注 → 清单 → 动作 → 下一步排序。

- `eyebrow / title / description / headerAction`：可选头部；`aria-label` 用于无标题面板，默认“任务状态面板”。头部动作使用 `onHeaderAction()`。
- `metric: { value, label, status?, linkLabel?, progress? }`：value 为调用方原样传入的文字/数字；progress 为 `{ value, max?, label }`，仅有限、合法范围显示，省略/非法不显示进度条，不从指标文本解析进度。`onMetricLink()` 只发出查看意图。
- `current: { label, title, description? }`；`attention: { label, title, description?, tone? }` 默认 warning。说明支持 ReactNode（如公式），由宿主负责内容安全与语义。
- `list: { title, items }`：每行唯一 `id`、`title`、可选 `description / status / completed / selectable`；明确 `completed=true` 才显示完成勾，否则显示序号。`onItemSelect(id)` 仅对 selectable 行提供按钮。
- 所有 `status` 为 `{ label, tone? }`，tone 为 neutral / info / success / warning / error。状态文字不可省；不从文字或色彩推断业务状态。
- `primaryAction` 仅一个 `{ label, disabled?, disabledReason? }`；TypeScript 要求 disabled=true 时提供原因，运行时空缺显示“操作暂不可用”。`actionNote` 提供动作说明；原因和说明置于主按钮下并通过 `aria-describedby` 关联。`onPrimary()` 仅发意图。
- `secondaryActions` 为 0–2 项只读元组 `{ id, label, disabled? }`，运行时最多展示前两项；`onSecondary(id)`。缺少回调的动作禁用，主按钮说明“操作暂不可用”。
- `next: { text, status? }` 显示“下一步”及调用方事实。
- `state` 为 ready（默认）/ loading / empty / error；后三者保留头部，替换业务内容，隐藏头部操作，防止操作旧快照。loading 用 Skeleton；emptyMessage / errorMessage 可配置；error 的重试由 `onRetry()` 发意图，没有回调不显示重试按钮。
- className 仅用于宿主布局；侧栏推荐 320–380px、自然高度。原生按钮继承 coss 键盘和焦点行为；长文换行，Progress / Skeleton 遵守减少动态效果。多实例 useId 隔离标题、说明关联。

```tsx
<InstrumentPanel
  title="正在接收学生试卷"
  metric={{ value: "1/42", label: "已收到 / 预计提交", progress: { value: 1, max: 42, label: "学生试卷接收比例" } }}
  primaryAction={{ label: "结束扫描并核对", disabled: true, disabledReason: "请先确认批阅依据" }}
  next={{ text: "核对扫描结果", status: { label: "等待" } }}
/>
```

## 验证范围

组件页提供六个固定中文业务快照、禁用原因、三状态、三主题 320px 长中文和 MathML；交互反馈只记录“请求”，不会更改进度或模拟发布成功。具体测试数字、浏览器证据和未验证范围见本任务 `/tmp/prism-instrument/Report.md` 及 `checks/`。真实服务、移动真机、读屏器与业务接入不在本轮验证范围。
