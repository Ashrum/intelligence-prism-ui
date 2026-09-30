# Material Intake 资料接收

PO 批准候选 #6；目录「内容与数据」，入口 `/next/components/material-intake`。本轮为 Builder 实现，独立 Review 与产品验收另行确认。

## 实施前复用评估

- 采用 Supervisor 在 `/tmp/prism-intake/task.md` 提供的检索结果：coss（含 particles）仅 `p-input-5` File input 相关，未找到 dropzone/intake；Beautiful UI 未见对应条目。本轮未重新联网核实，也未复制第三方代码。
- `AgentFileInput` 已有原生选择、拖放、能力限制、文件校验/上传状态模型。新增可选 `renderItem(item)` 行内容插槽（返回行内内容，由原组件包裹 li）；默认 FileRow 与旧 API 保持兼容。宿主插槽负责遵守既有状态与动作资格，不改变队列或执行行为。
- `Attachment` 直接消费同一 `AgentFileItem`，用于该插槽；不再创建第二套文件状态。所有文件校验（类型、大小、数量与内容）由宿主负责；accept 仅是选择器提示，组件原样发出 Files，不伪造上传或接收成功。
- `AgentCaptureScan` 的 AgentCapturePage、quality、needsRecapture、usage、版本/请求回执适用于接收后的页集质量与版本核对。把它嵌入等待接收面板会要求尚不存在的版本与页面事实，并引入重排/预览等超范围动作，因此保留原组件与 API，交由后续流程消费；不从文件数推断页数或清晰度。
- 流程直接组合 `Stepper`，沿用当前位置摘要与水平局部滚动。基础界面组合固定 coss Card / Skeleton / Dialog 与 Prism Button / AgentStatus；不新增 CSS、视觉令牌、依赖或组件皮肤。S21/S22/S23/S27/S28/S43 只提供功能依据。

## 契约

`MaterialIntake` 必填 `title, description, station, platform, state, files, limits, capabilities, steps`。文件、限制和能力复用 AgentFileInput 的类型。`station` 包含 name/connection/location/mode/receivedPages；connection 为 connected/available/disconnected/offline/unknown，文字与 AgentStatus 语义同步。缺失文字、未知/负数/非整数页数显示「未提供」，0 为真实零页。

`state` 是 waiting/receiving/review/invalid/loading/error/unknown 联合；invalid/error 必须提供 reason。状态由宿主显式提供，不从文件、设备、按钮、时间或步骤推定。Loading/Error 替代接收区；其他状态保留文件清单。`steps` 与 `currentStepId?` 原样传入 Stepper，与接收状态独立。

`mode?` 默认 all；limited 需正整数 pageLimit，显示「只收 N 页」，非法值显示未提供并阻止选择与保存；replace-page 需 targetLabel，固定只收 1 页，显示「仅替换当前缺失页，不新增试卷或覆盖其他正常页面」。限制是接收页数而非文件数，不在前端截断 PDF 页或丢弃文件；宿主负责执行与回传校验结果。

`platform` 为 web/android/device；后两者提示「优先连接数据站扫描」，Web 提示 PDF/图片选择或拖放。`platformHint?`、`sourceDescription?` 可覆盖提示；默认双来源说明为「扫描与上传均可接收：两种方式汇入同一资料清单；接收完成后统一预览、核对并保存」。设备断开不阻止独立的 Web 文件选择。

`onFilesSelected(files)` 原样转发选择/拖放；`onRemove({fileId,version,kind})`、`onRetry(intent)` 保留附件版本/请求标识。retry 联合包含 `{kind:'receive'}` / `{kind:'load'}` 或附件 retry 意图；仅显式失败可重试，unknown 不重试。`onChangeStation/onCancel/onConfirm` 只发出意图。组件无 Runtime、上传、设备连接、存储、计时器或业务状态。

`selectionDisabledReason?` / `confirmDisabledReason?` / `retryDisabledReason?` 由宿主提供。未传回调的动作禁用并显示原因；附件既有动作限制保留。waiting 按钮显示「等待接收」，其余显示「完成并保存」；只有 review 可发确认意图，仍受 confirmDisabledReason 限制。接收中、校验失败、加载/错误、未知均禁用确认并显示原因。review 是可进入核对保存的外部事实，不是已保存凭证。

## 承载与验证边界

组件是具名 section，可内嵌或放入 coss Dialog。弹窗开关、取消后的关闭与焦点恢复由宿主及 coss 负责。标题/状态/原因保持文字，禁用原因与按钮 aria-describedby 关联；固定文件标签、原生输入、状态 live region、语义字号与减少动态效果沿用既有组件。

组件页覆盖原卷等待、答案答题卡 2 文件、学生答题卡上传中、单页等待/已接收、未连接、校验失败、未知、Loading/Error、对话框、320px 三主题长中文与公式。夹具按钮只记录意图；文件选择仅做宿主元数据校验并显示本机 selected/invalid，不推进接收状态。真实上传、设备扫描、OCR、持久化、实际移动端与读屏器未接入或未验证。浏览器验收证据和阻塞以本轮 Report.md 为准。
