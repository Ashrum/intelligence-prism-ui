# Student Control Bar 学生控制条 · C2 契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。
入口 `/next/components/student-control-bar`；实现 `components/prism-next/student-control-bar.tsx`。

## 复用依据

本批通用预览组件，非 Agent 执行组件，Beautiful UI 不适用。读取 Supervisor 审核缓存 registry（579 项）及 particles `p-group-11`、`p-combobox-10`、`p-tabs-10/14`、`p-select-20`、`p-meter-3`、`p-frame-1` 源码；路径见 [第一批复用依据](review-workspace.md#复用依据)。核对固定 coss Group/Combobox/Tabs/Select/Collapsible/Meter/Frame/Tooltip/Badge 与现有 ReviewSwitcher、QuestionRail、QuestionContent、PaperPreview。采用标准控件、分组搜索、量值与折叠组合；其余提取自冻结题目预览，不复制 particles 演示数据或视觉覆盖。本轮未联网刷新上游，未复制 Beautiful UI 代码。

## 公开属性与边界

复合 API：StudentControlBar + Row + Home + Filters + Switcher + Scale。ref/style 对接宿主高度测量，topInset=实测高度+16；children 保留宿主组合顺序。Switcher 使用 ReviewSwitcher，items/groups/current/open/onSelect/searchId 受控；Scale 的 tone、tooltip、summary 完全外部提供。

筛选、排序、统计计算、业务身份转换、权限、持久化、路由与意图回执由宿主负责。组件不导入 examples 或 Workspace 私有类型，不内置服务或计时器；没有给定的数据不作统计推断。辅助导出不另增目录条目。

## 验证

组件页提供 light/paper/dark、320px、长中文与 MathML；自动测试覆盖事实、意图及目录页。题目评审十态重构前快照与第一批试卷/旧 PaperPreview 快照保持一致，原冻结测试文件不改。
浏览器工具明确拒绝 localhost:5173（此前拒绝授权），未绕过。三主题、窄容器、实际焦点/滚动/缩放/旋转/触摸和读屏器未获本轮实测；没有真实服务验证。

## P14 · 未给分（2026-10-04）

复用复核：本轮读取固定 coss Group / Combobox / Meter、既有 ReviewSwitcher / StudentIdentity / ThinBar，并检索上述文档中的 particles `p-group-11`、`p-combobox-10`、`p-meter-3` 记录；原 Supervisor 缓存路径已不存在，受 Builder 离线约束未刷新注册文件。Group / Combobox 继续负责导航与原生搜索；Meter 和 ThinBar 的数字量值不能表达未给分，故在既有 Switcher 组合处省略未知比例，不扩展基础控件。通用学生预览组件不涉及 Agent 执行，Beautiful UI 不适用；未新增组件、依赖或视觉令牌。

- `StudentControlItem.score: number | null`、`ratio: number | null`；null 表示尚未给分／比例未知，不能作为 0 参与数值比较。已知 0 仍是 0 分与 0% 轨道。
- 跳转面板仅当 score、ratio 都非 null 时渲染 ThinBar；任一为 null 都省略比例条，而非把未知画成零进度。score 为 null 时分数行原样显示调用方 `scoreText`（如“未给分”，支持 ReactNode），不拼接 `/ max`；只有 ratio 为 null 时保留已知的 `score / max`。
- `StudentIdentity` 始终显示 `scoreText`；触发器名称、姓名／考号搜索与序号不读取数值。调用方负责提供真实的 status、review、identityTone 和可访问文案，组件不推断“零分”“失分”或完成状态，未知就显示未知。
- 组件不进行成绩排序、数值筛选或统计；`items` 决定上一位／下一位与序号，`groups` 及组内 items 决定面板顺序，均保留宿主给定顺序。宿主需要数值排序／筛选时须排除 null 的数值比较，并保持未知项的既定位置与相对顺序，不用 `Number(null)` 或 `?? 0` 把未知归为零分。
- 搜索、↑↓ / Enter / Esc 与焦点返回仍交给 coss Combobox；导航和选择只发出 id，不会跳过未给分学生或修改分数。`StudentControlFilters` 只透传筛选意图与外部计数；Bar / Row / Home 不读 score / ratio。
- `StudentControlScale` 不接受或计算 score / ratio，只按传入顺序呈现每个 tick；tone、tooltip、summary 均由宿主提供。未知学生可以使用 neutral 与“未给分”；不得自行插值、按比例排序或把未知计入零分。
- 组件页保留原有已评分示例，另增“含未给分学生”示例，覆盖三主题、320px、长中文、公式、全部／未给分／已给分与空集合。冻结题目、试卷设计页不改。
- 自动验证方法与数字见 Supervisor `prism/P14-Report.md` / `prism/p14-checks/`。浏览器验收：按分工由 Supervisor 执行；原 C2 验证段仅为历史记录。
