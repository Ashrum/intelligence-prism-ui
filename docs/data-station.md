# Data Station 教学数据站

PO 批准候选 #7；目录「内容与数据」，入口 `/next/components/data-station`。Builder 实现待独立 Review；不代表设备接入或产品验收完成。

## 复用依据

- 采用 Supervisor `/tmp/prism-station/task.md` 的检索结论：coss Sheet/Drawer、RadioGroup、Card、Badge、Skeleton、Empty，registry 无设备/连接面板；Beautiful UI 无匹配项。本轮不复制 Beautiful UI 代码。
- 补查 [coss particles](https://coss.com/ui/particles)（510 项组合索引）；网页只返回索引简介，[registry](https://coss.com/ui/r/registry.json) 经网页工具访问失败，无法独立复核单项名单，沿用 Supervisor 的 registry 无设备面板结论，不声称完成逐项检索。
- 本地检查 material-intake、agent-object-picker、coss RadioGroup 与 Sheet。AgentObjectPicker 面向带筛选/分页的对象集合，设备可用性、连接目标与失败回执是本组件稳定职责；复用底层 RadioGroup，而不引入通用对象查询界面。
- 从 MaterialIntake 提取 DataStationConnectionStatus 原子；保留旧连接五态文字、tone、API 与接收业务边界。新面板与资料接收卡共享该原子，连接与设备可用性分开。徽标用 Prism outline Button，保留可访问点击语义；状态用现有 AgentStatus，不复制 Badge 皮肤。
- Sheet 默认右侧，复用 Card、Skeleton、Empty、Prism Button；Printer / ArrowLeftRight / Monitor 组合关系图。不新增 CSS、视觉令牌、依赖，不修改 coss 源码。S44/S45 仅供功能依据，不复制截图视觉。

## API 与事实边界

`DataStation` 默认 `presentation="sheet"`，必须传受控 `open`，`onClose` 表达关闭意图；宿主收到后更新 open。`presentation="inline"` 内嵌同一面板，不传 open。Sheet 的 Escape、焦点约束与恢复交由 coss/Base UI；组件不维护业务状态。

必填 `devices, selectedId, connection, state, task`。设备 ID 唯一；`selectedId` 为字符串或 null，由宿主明确传入（推荐不自动选中）。`recommendedId?` 指向推荐设备；无匹配则显示未提供并保留列表。`refreshDescription?` 原样追加到说明，不提供时不声称定时刷新；组件没有计时器。

设备含 `id/name`，可选 `location/number/onlineTime/paperSizes/sides/onlineDescription`。在线说明是宿主事实，空闲不推断“两端在线”。`availability` 为 available/busy/offline/unknown；busy 含 occupiedBy/estimatedMinutes，offline 含 lostMinutesAgo。使用中、离线、未知均不可选也不可连接，并说明原因。缺失文字与能力显示未提供；非法或缺失时间不变为零。纸张与单双面是能力描述，不在前端推断兼容性。

`connection` 为 idle，或带 stationId 的 connecting/connected，或带 stationId/reason 的 failed。连接目标与推荐/待选目标独立；面板始终标明实际连接目标，仅目标一致时把连接状态显示在推荐卡。connecting 锁定选择与连接按钮；connected 锁定选择，呈现断开动作。主按钮随选中推荐/其他目标显示“连接推荐数据站 / 连接所选数据站”；连接中显示“连接中”。外部更新导致原选中设备不可用时，保留选中事实但禁用连接。

`task` 含 className/subject/gradingMode/bindingDescription；绑定说明由宿主提供，不从连接状态推定已绑定。`state` 为 ready/loading/empty/error；loading 显示 Skeleton；empty 必须 nextStep；error 必须 reason，呈现重新加载。后三态替代设备、任务与连接动作，仅保留返回（error 另有加载重试）。ready 的空列表只声明列表为空，不推断学校未配置。

`onSelect(id), onConnect(id), onDisconnect(id), onClose()` 仅发意图。`onRetry({kind:'load'})` 重试加载；`onRetry({kind:'connect',stationId})` 明确重试原失败目标（按钮注明名称），不因待选目标改变而静默重定向；目标缺失或不可用时禁用。缺失动作回调禁用并显示原因，用 aria-describedby 关联；受控 Sheet/Drawer 的 onClose 是必填，宿主始终提供并处理。

`DataStationBadge` 接收 `state={kind:'connected',name}`（name 为如“02”的站点显示标识）、`{kind:'available',count}` 或 `{kind:'disconnected'}`，以及 `onOpen()`。显示“教学数据站 02 · 已连接 › / 教学数据站 1 台可用 › / 教学数据站 未连接 ›”。非法数量显示未提供，0 为有效零台；入口未接入则禁用并说明。

## 无障碍与验证边界

设备整卡为 label，关联单选的名称和详细原因；RadioGroup 保留方向键与单选行为。动作、徽标、Sheet 关闭按钮与设备标签至少 44px，适用横屏触屏目标；实际 Android 1920×1080 仍需真机验证。实时状态单独 live region，Loading busy 不包裹状态播报。现有主题/语义字号、MathML 与减少动态效果策略保持不变。

组件页提供待连接（02 可用/01 占用/初中部 01 离线）、连接中、已连接、失败、空态、加载中、加载失败、右侧抽屉、徽标三态、多可用设备选择、320px 三主题长中文与公式。夹具仅管理待选目标/抽屉可见性和意图反馈；不轮询，不推进连接状态。

浏览器工具拒绝访问本地组件页；本轮没有完成实际三主题、320px、1920×1080、键盘/焦点恢复或触屏视觉验收，报告标记 ESCALATE。静态渲染与回调测试不替代浏览器验收；真实设备连接、扫描、任务绑定、读屏器、移动设备未接入或未验证。

## W4 多行操作适配

沿用本页 coss Sheet/RadioGroup/Card/Button、particles 与 Beautiful UI 复用调查；本轮核对固定 Button 的 sm:h-8 默认尺寸，通用操作类补上 `sm:h-auto`（与 `h-auto` 配对），最小高 48px、最小宽 44px。关闭 Sheet 的图标入口仍为 44px。无需新增 prop；设备、连接、禁用与回调语义保持不变。新增 176px 长名称入口，桌面断点也可自然换行。三主题与实际点击/键盘验收由 Supervisor 执行。

## 2026-10-02 P3：受控右侧 Drawer

- 复核 Supervisor registry 快照（579 项）、`p-drawer-12` 与固定 coss Drawer/Sheet。p-drawer-12 在触控宽度用 Drawer、桌面用 Dialog；本次只采用复用同一内容的取舍，宿主显式选择 presentation，不复制媒体查询或自行按屏宽切换。
- 新增 `presentation="drawer"`，与默认 sheet 同样必须提供 open/onClose；inline/sheet 分支保持原 DOM 与行为。Drawer `position="right"`，复用同一个 DataStationPanel、标题说明、选择与连接状态；不新建组件或业务状态。
- coss/Base UI 提供焦点约束、初始焦点、关闭后返回之前聚焦元素、Escape/遮罩/滑动关闭请求；onOpenChange(false) 映射 onClose，open 必须由宿主回传。中文关闭按钮通过 DrawerClose + Prism Button 组合，44×44px，面板返回也仅发 onClose。
- 保留 Drawer 固定外观，仅设置面板宽度；portalProps 的局部 reduced-motion 选择器关闭遮罩与滚动控件过渡，popup 自身关闭过渡。固定版本类型支持上述契约，但实际触屏手势、焦点圈定/恢复尚待浏览器核验，不声称已经验收。

检索来源为委派提供的本地快照 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/` 下的 `registry.json` / `particles/*.json`，本轮未重新联网获取。浏览器工具拒绝访问 localhost:5173，P3 的实际视觉、键盘/触屏与焦点验收未完成；自动化证据见 `/tmp/prism-audit/Report-P3.md`。
