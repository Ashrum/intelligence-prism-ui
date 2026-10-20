# BPM1f · 目检结论与例外（2026-10-20 收口记录）

按 PO 2026-10-20 决定及 Supervisor 2026-10-19 截图对照目检，旧周期 3/3 收口。勾选仅表示下列**明确范围**获 Supervisor 确认；不是 Builder 本轮浏览器检查。原机器 `per-round.json` 保留 116 pending-visual，matrix 保留 645 pending-visual，不回写为自动 pass。逐类自动证据及未验项的收口理由、后续归属见 [checks.md](checks.md)。

- [x] P78 对话气泡：长中文、公式、代码局部滚动、链接焦点、附件通过。
- [x] P79 卡片：超长英文文件名换行、A/B 方块通过；不扩称五 tone / 全部密度细项逐一目检。
- [x] P87：锁定框、标签、入口行高亮对应通过；夜图标签反白通过；320 标尺按契约隐藏。
- [x] P85 对象卡片：墨底标题、关系列表通过；其他焦点/密度细项由对应探针覆盖。
- [x] 第二批 InputGroup：焦点、无效、只读、禁用通过。
- [x] 编辑式排版、Agent 组件总览、结构编排器、蓝图示例页：五主题 × 320/1280 布局抽查通过。
- [x] P73：仅浅色预览的长中文与公式＋附件阅读态实测通过；未获得精确逐组合目检记录，不能自动勾选下方全部组合。
- [x] P74 / 第二批浮层行为：打开、主题继承、越界、焦点归还由 1500/1500 交互组与 Supervisor 手工复核覆盖。
- [ ] P73 蓝图/夜图指定阅读态：截图准备失败，未验；使用布局矩阵截图和自动探针作为本次收口证据，归后续阅读态专项。
- [ ] P74 / 第二批浮层专项打开态截图：未生成，归后续补拍；不以历史索引中的文件名作为此次专项截图完成的证明。
- [ ] 原生 200% 浏览器缩放：未验；320 CSS zoom2 溢出为超原 1280 验收范围观察，转设备/可访问专项。
- [ ] P76 历史 ShellNavFixture 移动抽屉：无 openMobile 接线，未验；真实 Workspace 移动导航在矩阵外。
- [ ] 夜图已知限制未消除：分隔线 1.58 / 1.45:1、浅色系列白色图案不足 3:1，后续配色/可访问专项处理。
- [ ] 真机、读屏器、IME 引擎、实体打印未验，转后续专项。

其余目检类（P75、P76 桌面、P77、P79 tones、P82 格线/流、P83、P84、P85 其他细项、首批、第二批其他细项、字体回退、夜图热图）按 [checks.md 逐类映射](checks.md#其余目检类与对应证据) 使用对应自动探针及交互组 1500/1500 作为收口依据，**没有额外人工逐组合目检结论**，故下方完整义务框保持未勾选。P87/P78 等上方已确认的类别细项同样不自动扩展成下方每个组合的完整义务；两层勾选语义不同。

截图按 PO 决定仅留 Supervisor 本机，不入库。以下“已生成”是历史脚本索引原文，表示脚本记录的路径，不证明上述专项状态准备成功或本轮重新生成；P73 指定阅读态与 P74/第二批打开态的最终边界以上方例外为准。后续若运行会重写本文件的 per-round 脚本，须先保留本次人工结论。

## 原始组合清单（保留来源与完整义务，非逐项通过声明）

# BPM1d · Supervisor 目检清单

基线：`c2dd2239b97963e12f7cf7cb3924328958e68a68`。逐项列出视觉义务；通常为 5 个代表组合，P87 增加 light/320。自动断言与来源排除项见 checklist-classification.json。

截图状态以每行标注为准：未生成的路径是执行计划，不是已有证据。运行 per-round 后本文件自动刷新实际截图索引；生成截图不会自动勾选或判通过。非代表组合没有被宣称目检通过。

- [ ] **P73-prompt-reading · light · 1280×900**
  - BPM1f 处置：浅色预览已手工通过（未获逐组合记录）；蓝图/夜图指定阅读态未验，见顶部例外。
  - 路由：`/next/components/agent-components/prompt-bar`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：加载附件与长中文公式；核对发送、范围、材料、语音入口及附件删除的焦点边缘、换行和正文。
  - 来源：`docs/blueprint/evidence/r1-20261016/browser-checklist.md:11`。
  - 已生成：[light-1280-prompt-bar-check-004-reading.png](../../screens/matrix-closeout-20261019/light-1280-prompt-bar-check-004-reading.png)

- [ ] **P73-prompt-reading · blueprint · 320×900**
  - BPM1f 处置：浅色预览已手工通过（未获逐组合记录）；蓝图/夜图指定阅读态未验，见顶部例外。
  - 路由：`/next/components/agent-components/prompt-bar`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：加载附件与长中文公式；核对发送、范围、材料、语音入口及附件删除的焦点边缘、换行和正文。
  - 来源：`docs/blueprint/evidence/r1-20261016/browser-checklist.md:11`。
  - 已生成：[blueprint-320-prompt-bar-check-004-reading.png](../../screens/matrix-closeout-20261019/blueprint-320-prompt-bar-check-004-reading.png)

- [ ] **P73-prompt-reading · blueprint · 1280×900**
  - BPM1f 处置：浅色预览已手工通过（未获逐组合记录）；蓝图/夜图指定阅读态未验，见顶部例外。
  - 路由：`/next/components/agent-components/prompt-bar`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：加载附件与长中文公式；核对发送、范围、材料、语音入口及附件删除的焦点边缘、换行和正文。
  - 来源：`docs/blueprint/evidence/r1-20261016/browser-checklist.md:11`。
  - 已生成：[blueprint-1280-prompt-bar-check-004-reading.png](../../screens/matrix-closeout-20261019/blueprint-1280-prompt-bar-check-004-reading.png)

- [ ] **P73-prompt-reading · blueprint-night · 320×900**
  - BPM1f 处置：浅色预览已手工通过（未获逐组合记录）；蓝图/夜图指定阅读态未验，见顶部例外。
  - 路由：`/next/components/agent-components/prompt-bar`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：加载附件与长中文公式；核对发送、范围、材料、语音入口及附件删除的焦点边缘、换行和正文。
  - 来源：`docs/blueprint/evidence/r1-20261016/browser-checklist.md:11`。
  - 已生成：[blueprint-night-320-prompt-bar-check-004-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-320-prompt-bar-check-004-reading.png)

- [ ] **P73-prompt-reading · blueprint-night · 1280×900**
  - BPM1f 处置：浅色预览已手工通过（未获逐组合记录）；蓝图/夜图指定阅读态未验，见顶部例外。
  - 路由：`/next/components/agent-components/prompt-bar`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：加载附件与长中文公式；核对发送、范围、材料、语音入口及附件删除的焦点边缘、换行和正文。
  - 来源：`docs/blueprint/evidence/r1-20261016/browser-checklist.md:11`。
  - 已生成：[blueprint-night-1280-prompt-bar-check-004-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-prompt-bar-check-004-reading.png)

- [ ] **P74-portal-visual · light · 1280×900**
  - BPM1f 处置：行为由交互组及 Supervisor 手工复核覆盖；专项打开态截图未生成，完整视觉义务未逐组合核销。
  - 路由：`/next/components/menu`；操作：脚本准备 `visual-portals` 状态；区域：`#portal-scope`。
  - 要看：真实打开局部对话框、子菜单；检查长中文/公式、浮层翻转、焦点圈、阴影与纸面比例。
  - 来源：`docs/blueprint/evidence/portal-20261016/browser-checklist.md:18`。
  - 已生成：[light-1280-menu-check-018-visual-portals-dialog.png](../../screens/matrix-closeout-20261019/light-1280-menu-check-018-visual-portals-dialog.png)
  - 已生成：[light-1280-menu-check-018-visual-portals-submenu.png](../../screens/matrix-closeout-20261019/light-1280-menu-check-018-visual-portals-submenu.png)
  - 已生成：[light-1280-menu-check-018-visual-portals.png](../../screens/matrix-closeout-20261019/light-1280-menu-check-018-visual-portals.png)

- [ ] **P74-portal-visual · blueprint · 320×900**
  - BPM1f 处置：行为由交互组及 Supervisor 手工复核覆盖；专项打开态截图未生成，完整视觉义务未逐组合核销。
  - 路由：`/next/components/menu`；操作：脚本准备 `visual-portals` 状态；区域：`#portal-scope`。
  - 要看：真实打开局部对话框、子菜单；检查长中文/公式、浮层翻转、焦点圈、阴影与纸面比例。
  - 来源：`docs/blueprint/evidence/portal-20261016/browser-checklist.md:18`。
  - 已生成：[blueprint-320-menu-check-018-visual-portals-dialog.png](../../screens/matrix-closeout-20261019/blueprint-320-menu-check-018-visual-portals-dialog.png)
  - 已生成：[blueprint-320-menu-check-018-visual-portals-submenu.png](../../screens/matrix-closeout-20261019/blueprint-320-menu-check-018-visual-portals-submenu.png)
  - 已生成：[blueprint-320-menu-check-018-visual-portals.png](../../screens/matrix-closeout-20261019/blueprint-320-menu-check-018-visual-portals.png)

- [ ] **P74-portal-visual · blueprint · 1280×900**
  - BPM1f 处置：行为由交互组及 Supervisor 手工复核覆盖；专项打开态截图未生成，完整视觉义务未逐组合核销。
  - 路由：`/next/components/menu`；操作：脚本准备 `visual-portals` 状态；区域：`#portal-scope`。
  - 要看：真实打开局部对话框、子菜单；检查长中文/公式、浮层翻转、焦点圈、阴影与纸面比例。
  - 来源：`docs/blueprint/evidence/portal-20261016/browser-checklist.md:18`。
  - 已生成：[blueprint-1280-menu-check-018-visual-portals-dialog.png](../../screens/matrix-closeout-20261019/blueprint-1280-menu-check-018-visual-portals-dialog.png)
  - 已生成：[blueprint-1280-menu-check-018-visual-portals-submenu.png](../../screens/matrix-closeout-20261019/blueprint-1280-menu-check-018-visual-portals-submenu.png)
  - 已生成：[blueprint-1280-menu-check-018-visual-portals.png](../../screens/matrix-closeout-20261019/blueprint-1280-menu-check-018-visual-portals.png)

- [ ] **P74-portal-visual · blueprint-night · 320×900**
  - BPM1f 处置：行为由交互组及 Supervisor 手工复核覆盖；专项打开态截图未生成，完整视觉义务未逐组合核销。
  - 路由：`/next/components/menu`；操作：脚本准备 `visual-portals` 状态；区域：`#portal-scope`。
  - 要看：真实打开局部对话框、子菜单；检查长中文/公式、浮层翻转、焦点圈、阴影与纸面比例。
  - 来源：`docs/blueprint/evidence/portal-20261016/browser-checklist.md:18`。
  - 已生成：[blueprint-night-320-menu-check-018-visual-portals-dialog.png](../../screens/matrix-closeout-20261019/blueprint-night-320-menu-check-018-visual-portals-dialog.png)
  - 已生成：[blueprint-night-320-menu-check-018-visual-portals-submenu.png](../../screens/matrix-closeout-20261019/blueprint-night-320-menu-check-018-visual-portals-submenu.png)
  - 已生成：[blueprint-night-320-menu-check-018-visual-portals.png](../../screens/matrix-closeout-20261019/blueprint-night-320-menu-check-018-visual-portals.png)

- [ ] **P74-portal-visual · blueprint-night · 1280×900**
  - BPM1f 处置：行为由交互组及 Supervisor 手工复核覆盖；专项打开态截图未生成，完整视觉义务未逐组合核销。
  - 路由：`/next/components/menu`；操作：脚本准备 `visual-portals` 状态；区域：`#portal-scope`。
  - 要看：真实打开局部对话框、子菜单；检查长中文/公式、浮层翻转、焦点圈、阴影与纸面比例。
  - 来源：`docs/blueprint/evidence/portal-20261016/browser-checklist.md:18`。
  - 已生成：[blueprint-night-1280-menu-check-018-visual-portals-dialog.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-menu-check-018-visual-portals-dialog.png)
  - 已生成：[blueprint-night-1280-menu-check-018-visual-portals-submenu.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-menu-check-018-visual-portals-submenu.png)
  - 已生成：[blueprint-night-1280-menu-check-018-visual-portals.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-menu-check-018-visual-portals.png)

- [ ] **P75-question-reading · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/question`；操作：脚本准备 `question-fixture` 状态；区域：`#bpm-question`。
  - 要看：逐一看三面板长中文、公式、图片、短标签与焦点间距；白图白底图连续，夜图白图不反色。
  - 来源：`docs/blueprint/evidence/question-detail-20261016/browser-checklist.md:37`。
  - 已生成：[light-1280-question-check-030-question-fixture-white-image.png](../../screens/matrix-closeout-20261019/light-1280-question-check-030-question-fixture-white-image.png)
  - 已生成：[light-1280-question-check-030-question-fixture.png](../../screens/matrix-closeout-20261019/light-1280-question-check-030-question-fixture.png)

- [ ] **P75-question-reading · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/question`；操作：脚本准备 `question-fixture` 状态；区域：`#bpm-question`。
  - 要看：逐一看三面板长中文、公式、图片、短标签与焦点间距；白图白底图连续，夜图白图不反色。
  - 来源：`docs/blueprint/evidence/question-detail-20261016/browser-checklist.md:37`。
  - 已生成：[blueprint-320-question-check-030-question-fixture-white-image.png](../../screens/matrix-closeout-20261019/blueprint-320-question-check-030-question-fixture-white-image.png)
  - 已生成：[blueprint-320-question-check-030-question-fixture.png](../../screens/matrix-closeout-20261019/blueprint-320-question-check-030-question-fixture.png)

- [ ] **P75-question-reading · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/question`；操作：脚本准备 `question-fixture` 状态；区域：`#bpm-question`。
  - 要看：逐一看三面板长中文、公式、图片、短标签与焦点间距；白图白底图连续，夜图白图不反色。
  - 来源：`docs/blueprint/evidence/question-detail-20261016/browser-checklist.md:37`。
  - 已生成：[blueprint-1280-question-check-030-question-fixture-white-image.png](../../screens/matrix-closeout-20261019/blueprint-1280-question-check-030-question-fixture-white-image.png)
  - 已生成：[blueprint-1280-question-check-030-question-fixture.png](../../screens/matrix-closeout-20261019/blueprint-1280-question-check-030-question-fixture.png)

- [ ] **P75-question-reading · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/question`；操作：脚本准备 `question-fixture` 状态；区域：`#bpm-question`。
  - 要看：逐一看三面板长中文、公式、图片、短标签与焦点间距；白图白底图连续，夜图白图不反色。
  - 来源：`docs/blueprint/evidence/question-detail-20261016/browser-checklist.md:37`。
  - 已生成：[blueprint-night-320-question-check-030-question-fixture-white-image.png](../../screens/matrix-closeout-20261019/blueprint-night-320-question-check-030-question-fixture-white-image.png)
  - 已生成：[blueprint-night-320-question-check-030-question-fixture.png](../../screens/matrix-closeout-20261019/blueprint-night-320-question-check-030-question-fixture.png)

- [ ] **P75-question-reading · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/question`；操作：脚本准备 `question-fixture` 状态；区域：`#bpm-question`。
  - 要看：逐一看三面板长中文、公式、图片、短标签与焦点间距；白图白底图连续，夜图白图不反色。
  - 来源：`docs/blueprint/evidence/question-detail-20261016/browser-checklist.md:37`。
  - 已生成：[blueprint-night-1280-question-check-030-question-fixture-white-image.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-question-check-030-question-fixture-white-image.png)
  - 已生成：[blueprint-night-1280-question-check-030-question-fixture.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-question-check-030-question-fixture.png)

- [ ] **P76-shell-reading · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：脚本准备 `shell-nav-state` 状态；区域：`[data-bpm-review="shell"]`。
  - 要看：导航不能挤压阅读区；桌面首末焦点边界，320 compact 菜单和抽屉，数字角标与身份层次。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:22`。
  - 已生成：[light-1280-workspace-app-bar-check-041-shell-nav-state-navigation.png](../../screens/matrix-closeout-20261019/light-1280-workspace-app-bar-check-041-shell-nav-state-navigation.png)
  - 已生成：[light-1280-workspace-app-bar-check-041-shell-nav-state.png](../../screens/matrix-closeout-20261019/light-1280-workspace-app-bar-check-041-shell-nav-state.png)

- [ ] **P76-shell-reading · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：脚本准备 `shell-nav-state` 状态；区域：`[data-bpm-review="shell"]`。
  - 要看：导航不能挤压阅读区；桌面首末焦点边界，320 compact 菜单和抽屉，数字角标与身份层次。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:22`。
  - 已生成：[blueprint-320-workspace-app-bar-check-041-shell-nav-state-navigation.png](../../screens/matrix-closeout-20261019/blueprint-320-workspace-app-bar-check-041-shell-nav-state-navigation.png)
  - 已生成：[blueprint-320-workspace-app-bar-check-041-shell-nav-state.png](../../screens/matrix-closeout-20261019/blueprint-320-workspace-app-bar-check-041-shell-nav-state.png)

- [ ] **P76-shell-reading · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：脚本准备 `shell-nav-state` 状态；区域：`[data-bpm-review="shell"]`。
  - 要看：导航不能挤压阅读区；桌面首末焦点边界，320 compact 菜单和抽屉，数字角标与身份层次。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:22`。
  - 已生成：[blueprint-1280-workspace-app-bar-check-041-shell-nav-state-navigation.png](../../screens/matrix-closeout-20261019/blueprint-1280-workspace-app-bar-check-041-shell-nav-state-navigation.png)
  - 已生成：[blueprint-1280-workspace-app-bar-check-041-shell-nav-state.png](../../screens/matrix-closeout-20261019/blueprint-1280-workspace-app-bar-check-041-shell-nav-state.png)

- [ ] **P76-shell-reading · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：脚本准备 `shell-nav-state` 状态；区域：`[data-bpm-review="shell"]`。
  - 要看：导航不能挤压阅读区；桌面首末焦点边界，320 compact 菜单和抽屉，数字角标与身份层次。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:22`。
  - 已生成：[blueprint-night-320-workspace-app-bar-check-041-shell-nav-state-navigation.png](../../screens/matrix-closeout-20261019/blueprint-night-320-workspace-app-bar-check-041-shell-nav-state-navigation.png)
  - 已生成：[blueprint-night-320-workspace-app-bar-check-041-shell-nav-state.png](../../screens/matrix-closeout-20261019/blueprint-night-320-workspace-app-bar-check-041-shell-nav-state.png)

- [ ] **P76-shell-reading · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：脚本准备 `shell-nav-state` 状态；区域：`[data-bpm-review="shell"]`。
  - 要看：导航不能挤压阅读区；桌面首末焦点边界，320 compact 菜单和抽屉，数字角标与身份层次。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:22`。
  - 已生成：[blueprint-night-1280-workspace-app-bar-check-041-shell-nav-state-navigation.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-workspace-app-bar-check-041-shell-nav-state-navigation.png)
  - 已生成：[blueprint-night-1280-workspace-app-bar-check-041-shell-nav-state.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-workspace-app-bar-check-041-shell-nav-state.png)

- [ ] **P77-folio-reading · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `folio` 状态；区域：`#artifact-folio`。
  - 要看：长中文标题自然换行、folio 右对齐且不挤正文，REV/SECTION/SHEET 层次与字体回退。
  - 来源：`docs/blueprint/evidence/nav-folio-20261016/browser-checklist.md:12`。
  - 已生成：[light-1280-foundations-blueprint-check-047-folio-api.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-047-folio-api.png)
  - 已生成：[light-1280-foundations-blueprint-check-047-folio.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-047-folio.png)

- [ ] **P77-folio-reading · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `folio` 状态；区域：`#artifact-folio`。
  - 要看：长中文标题自然换行、folio 右对齐且不挤正文，REV/SECTION/SHEET 层次与字体回退。
  - 来源：`docs/blueprint/evidence/nav-folio-20261016/browser-checklist.md:12`。
  - 已生成：[blueprint-320-foundations-blueprint-check-047-folio-api.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-047-folio-api.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-047-folio.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-047-folio.png)

- [ ] **P77-folio-reading · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `folio` 状态；区域：`#artifact-folio`。
  - 要看：长中文标题自然换行、folio 右对齐且不挤正文，REV/SECTION/SHEET 层次与字体回退。
  - 来源：`docs/blueprint/evidence/nav-folio-20261016/browser-checklist.md:12`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-047-folio-api.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-047-folio-api.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-047-folio.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-047-folio.png)

- [ ] **P77-folio-reading · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `folio` 状态；区域：`#artifact-folio`。
  - 要看：长中文标题自然换行、folio 右对齐且不挤正文，REV/SECTION/SHEET 层次与字体回退。
  - 来源：`docs/blueprint/evidence/nav-folio-20261016/browser-checklist.md:12`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-047-folio-api.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-047-folio-api.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-047-folio.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-047-folio.png)

- [ ] **P77-folio-reading · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `folio` 状态；区域：`#artifact-folio`。
  - 要看：长中文标题自然换行、folio 右对齐且不挤正文，REV/SECTION/SHEET 层次与字体回退。
  - 来源：`docs/blueprint/evidence/nav-folio-20261016/browser-checklist.md:12`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-047-folio-api.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-047-folio-api.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-047-folio.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-047-folio.png)

- [ ] **P78-message-reading · light · 1280×900**
  - BPM1f 处置：该类长中文/公式/代码局部滚动/链接焦点/附件目检通过；未扩展为每个组合的全部细项。
  - 路由：`/next/components/agent-components/agent-message`；操作：脚本准备 `message` 状态；区域：`[data-agent-preview]`。
  - 要看：附件图标边框、长中文与公式/代码局部滚动、链接换行 focus 环无裁切；不能只看无横溢。
  - 来源：`docs/blueprint/evidence/user-bubble-20261016/browser-checklist.md:14`。
  - 已生成：[light-1280-agent-message-check-051-message-link-focus.png](../../screens/matrix-closeout-20261019/light-1280-agent-message-check-051-message-link-focus.png)
  - 已生成：[light-1280-agent-message-check-051-message.png](../../screens/matrix-closeout-20261019/light-1280-agent-message-check-051-message.png)

- [ ] **P78-message-reading · blueprint · 320×900**
  - BPM1f 处置：该类长中文/公式/代码局部滚动/链接焦点/附件目检通过；未扩展为每个组合的全部细项。
  - 路由：`/next/components/agent-components/agent-message`；操作：脚本准备 `message` 状态；区域：`[data-agent-preview]`。
  - 要看：附件图标边框、长中文与公式/代码局部滚动、链接换行 focus 环无裁切；不能只看无横溢。
  - 来源：`docs/blueprint/evidence/user-bubble-20261016/browser-checklist.md:14`。
  - 已生成：[blueprint-320-agent-message-check-051-message-link-focus.png](../../screens/matrix-closeout-20261019/blueprint-320-agent-message-check-051-message-link-focus.png)
  - 已生成：[blueprint-320-agent-message-check-051-message.png](../../screens/matrix-closeout-20261019/blueprint-320-agent-message-check-051-message.png)

- [ ] **P78-message-reading · blueprint · 1280×900**
  - BPM1f 处置：该类长中文/公式/代码局部滚动/链接焦点/附件目检通过；未扩展为每个组合的全部细项。
  - 路由：`/next/components/agent-components/agent-message`；操作：脚本准备 `message` 状态；区域：`[data-agent-preview]`。
  - 要看：附件图标边框、长中文与公式/代码局部滚动、链接换行 focus 环无裁切；不能只看无横溢。
  - 来源：`docs/blueprint/evidence/user-bubble-20261016/browser-checklist.md:14`。
  - 已生成：[blueprint-1280-agent-message-check-051-message-link-focus.png](../../screens/matrix-closeout-20261019/blueprint-1280-agent-message-check-051-message-link-focus.png)
  - 已生成：[blueprint-1280-agent-message-check-051-message.png](../../screens/matrix-closeout-20261019/blueprint-1280-agent-message-check-051-message.png)

- [ ] **P78-message-reading · blueprint-night · 320×900**
  - BPM1f 处置：该类长中文/公式/代码局部滚动/链接焦点/附件目检通过；未扩展为每个组合的全部细项。
  - 路由：`/next/components/agent-components/agent-message`；操作：脚本准备 `message` 状态；区域：`[data-agent-preview]`。
  - 要看：附件图标边框、长中文与公式/代码局部滚动、链接换行 focus 环无裁切；不能只看无横溢。
  - 来源：`docs/blueprint/evidence/user-bubble-20261016/browser-checklist.md:14`。
  - 已生成：[blueprint-night-320-agent-message-check-051-message-link-focus.png](../../screens/matrix-closeout-20261019/blueprint-night-320-agent-message-check-051-message-link-focus.png)
  - 已生成：[blueprint-night-320-agent-message-check-051-message.png](../../screens/matrix-closeout-20261019/blueprint-night-320-agent-message-check-051-message.png)

- [ ] **P78-message-reading · blueprint-night · 1280×900**
  - BPM1f 处置：该类长中文/公式/代码局部滚动/链接焦点/附件目检通过；未扩展为每个组合的全部细项。
  - 路由：`/next/components/agent-components/agent-message`；操作：脚本准备 `message` 状态；区域：`[data-agent-preview]`。
  - 要看：附件图标边框、长中文与公式/代码局部滚动、链接换行 focus 环无裁切；不能只看无横溢。
  - 来源：`docs/blueprint/evidence/user-bubble-20261016/browser-checklist.md:14`。
  - 已生成：[blueprint-night-1280-agent-message-check-051-message-link-focus.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-agent-message-check-051-message-link-focus.png)
  - 已生成：[blueprint-night-1280-agent-message-check-051-message.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-agent-message-check-051-message.png)

- [ ] **P79-cards-reading · light · 1280×900**
  - BPM1f 处置：超长英文文件名换行与 A/B 方块目检通过；完整义务其余部分按 checks.md 自动证据映射。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-cards` 状态；区域：`#object-section-cards`。
  - 要看：长中文和连续英文文件名注入后，标题/状态/meta/操作换行，A/B 方形、公式与两种密度的阅读比例。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:9,6`。
  - 已生成：[light-1280-foundations-blueprint-check-058-visual-cards-long-title.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-058-visual-cards-long-title.png)
  - 已生成：[light-1280-foundations-blueprint-check-058-visual-cards.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-058-visual-cards.png)

- [ ] **P79-cards-reading · blueprint · 320×900**
  - BPM1f 处置：超长英文文件名换行与 A/B 方块目检通过；完整义务其余部分按 checks.md 自动证据映射。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-cards` 状态；区域：`#object-section-cards`。
  - 要看：长中文和连续英文文件名注入后，标题/状态/meta/操作换行，A/B 方形、公式与两种密度的阅读比例。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:9,6`。
  - 已生成：[blueprint-320-foundations-blueprint-check-058-visual-cards-long-title.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-058-visual-cards-long-title.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-058-visual-cards.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-058-visual-cards.png)

- [ ] **P79-cards-reading · blueprint · 1280×900**
  - BPM1f 处置：超长英文文件名换行与 A/B 方块目检通过；完整义务其余部分按 checks.md 自动证据映射。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-cards` 状态；区域：`#object-section-cards`。
  - 要看：长中文和连续英文文件名注入后，标题/状态/meta/操作换行，A/B 方形、公式与两种密度的阅读比例。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:9,6`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-058-visual-cards-long-title.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-058-visual-cards-long-title.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-058-visual-cards.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-058-visual-cards.png)

- [ ] **P79-cards-reading · blueprint-night · 320×900**
  - BPM1f 处置：超长英文文件名换行与 A/B 方块目检通过；完整义务其余部分按 checks.md 自动证据映射。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-cards` 状态；区域：`#object-section-cards`。
  - 要看：长中文和连续英文文件名注入后，标题/状态/meta/操作换行，A/B 方形、公式与两种密度的阅读比例。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:9,6`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-058-visual-cards-long-title.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-058-visual-cards-long-title.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-058-visual-cards.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-058-visual-cards.png)

- [ ] **P79-cards-reading · blueprint-night · 1280×900**
  - BPM1f 处置：超长英文文件名换行与 A/B 方块目检通过；完整义务其余部分按 checks.md 自动证据映射。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-cards` 状态；区域：`#object-section-cards`。
  - 要看：长中文和连续英文文件名注入后，标题/状态/meta/操作换行，A/B 方形、公式与两种密度的阅读比例。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:9,6`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-058-visual-cards-long-title.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-058-visual-cards-long-title.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-058-visual-cards.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-058-visual-cards.png)

- [ ] **P79-card-tones · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `card-options` 状态；区域：`[data-bpm-review="cards"]`。
  - 要看：五状态小色块边界、文字与标题可辨；不足3:1填充依靠边界的设计需目检。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:10`。
  - 已生成：[light-1280-foundations-blueprint-check-061-card-options-omitted-and-tones.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-061-card-options-omitted-and-tones.png)
  - 已生成：[light-1280-foundations-blueprint-check-061-card-options.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-061-card-options.png)

- [ ] **P79-card-tones · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `card-options` 状态；区域：`[data-bpm-review="cards"]`。
  - 要看：五状态小色块边界、文字与标题可辨；不足3:1填充依靠边界的设计需目检。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:10`。
  - 已生成：[blueprint-320-foundations-blueprint-check-061-card-options-omitted-and-tones.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-061-card-options-omitted-and-tones.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-061-card-options.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-061-card-options.png)

- [ ] **P79-card-tones · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `card-options` 状态；区域：`[data-bpm-review="cards"]`。
  - 要看：五状态小色块边界、文字与标题可辨；不足3:1填充依靠边界的设计需目检。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:10`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-061-card-options-omitted-and-tones.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-061-card-options-omitted-and-tones.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-061-card-options.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-061-card-options.png)

- [ ] **P79-card-tones · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `card-options` 状态；区域：`[data-bpm-review="cards"]`。
  - 要看：五状态小色块边界、文字与标题可辨；不足3:1填充依靠边界的设计需目检。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:10`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-061-card-options-omitted-and-tones.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-061-card-options-omitted-and-tones.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-061-card-options.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-061-card-options.png)

- [ ] **P79-card-tones · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `card-options` 状态；区域：`[data-bpm-review="cards"]`。
  - 要看：五状态小色块边界、文字与标题可辨；不足3:1填充依靠边界的设计需目检。
  - 来源：`docs/blueprint/evidence/cards-20261016/browser-checklist.md:10`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-061-card-options-omitted-and-tones.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-061-card-options-omitted-and-tones.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-061-card-options.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-061-card-options.png)

- [ ] **P82-facts-lines · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `facts-extra` 状态；区域：`.bp-fact-container`。
  - 要看：查看奇数3/5项与长文本：无双线/半格线，末项满行、第二/四项无多余右线，字号未缩小。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:9`。
  - 已生成：[light-1280-foundations-blueprint-check-067-facts-extra-odd-3.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-067-facts-extra-odd-3.png)
  - 已生成：[light-1280-foundations-blueprint-check-067-facts-extra-odd-5.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-067-facts-extra-odd-5.png)
  - 已生成：[light-1280-foundations-blueprint-check-067-facts-extra.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-067-facts-extra.png)

- [ ] **P82-facts-lines · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `facts-extra` 状态；区域：`.bp-fact-container`。
  - 要看：查看奇数3/5项与长文本：无双线/半格线，末项满行、第二/四项无多余右线，字号未缩小。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:9`。
  - 已生成：[blueprint-320-foundations-blueprint-check-067-facts-extra-odd-3.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-067-facts-extra-odd-3.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-067-facts-extra-odd-5.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-067-facts-extra-odd-5.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-067-facts-extra.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-067-facts-extra.png)

- [ ] **P82-facts-lines · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `facts-extra` 状态；区域：`.bp-fact-container`。
  - 要看：查看奇数3/5项与长文本：无双线/半格线，末项满行、第二/四项无多余右线，字号未缩小。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:9`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-067-facts-extra-odd-3.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-067-facts-extra-odd-3.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-067-facts-extra-odd-5.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-067-facts-extra-odd-5.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-067-facts-extra.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-067-facts-extra.png)

- [ ] **P82-facts-lines · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `facts-extra` 状态；区域：`.bp-fact-container`。
  - 要看：查看奇数3/5项与长文本：无双线/半格线，末项满行、第二/四项无多余右线，字号未缩小。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:9`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-067-facts-extra-odd-3.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-067-facts-extra-odd-3.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-067-facts-extra-odd-5.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-067-facts-extra-odd-5.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-067-facts-extra.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-067-facts-extra.png)

- [ ] **P82-facts-lines · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `facts-extra` 状态；区域：`.bp-fact-container`。
  - 要看：查看奇数3/5项与长文本：无双线/半格线，末项满行、第二/四项无多余右线，字号未缩小。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:9`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-067-facts-extra-odd-3.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-067-facts-extra-odd-3.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-067-facts-extra-odd-5.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-067-facts-extra-odd-5.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-067-facts-extra.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-067-facts-extra.png)

- [ ] **P82-facts-flow · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`.bp-fact-container`。
  - 要看：原页面流与新增容器的 mt-5、邻接内容、标题块框线；代表窄屏用任务指定320，390补充自动几何记录。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:11`。
  - 已生成：[light-1280-foundations-blueprint-check-069-reading.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-069-reading.png)

- [ ] **P82-facts-flow · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`.bp-fact-container`。
  - 要看：原页面流与新增容器的 mt-5、邻接内容、标题块框线；代表窄屏用任务指定320，390补充自动几何记录。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:11`。
  - 已生成：[blueprint-320-foundations-blueprint-check-069-reading.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-069-reading.png)

- [ ] **P82-facts-flow · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`.bp-fact-container`。
  - 要看：原页面流与新增容器的 mt-5、邻接内容、标题块框线；代表窄屏用任务指定320，390补充自动几何记录。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:11`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-069-reading.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-069-reading.png)

- [ ] **P82-facts-flow · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`.bp-fact-container`。
  - 要看：原页面流与新增容器的 mt-5、邻接内容、标题块框线；代表窄屏用任务指定320，390补充自动几何记录。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:11`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-069-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-069-reading.png)

- [ ] **P82-facts-flow · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`.bp-fact-container`。
  - 要看：原页面流与新增容器的 mt-5、邻接内容、标题块框线；代表窄屏用任务指定320，390补充自动几何记录。
  - 来源：`docs/blueprint/evidence/facts-narrow-20261017/browser-checklist.md:11`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-069-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-069-reading.png)

- [ ] **P83-glyph-reading · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/agent-components/agent-mark`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：行首16px槽/13px图形与长中文并排；三变体各状态可辨，reduce九点完整。
  - 来源：`docs/blueprint/evidence/agent-mark-glyph-20261017/browser-checklist.md:6`。
  - 已生成：[light-1280-agent-mark-check-079-reading.png](../../screens/matrix-closeout-20261019/light-1280-agent-mark-check-079-reading.png)

- [ ] **P83-glyph-reading · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/agent-components/agent-mark`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：行首16px槽/13px图形与长中文并排；三变体各状态可辨，reduce九点完整。
  - 来源：`docs/blueprint/evidence/agent-mark-glyph-20261017/browser-checklist.md:6`。
  - 已生成：[blueprint-320-agent-mark-check-079-reading.png](../../screens/matrix-closeout-20261019/blueprint-320-agent-mark-check-079-reading.png)

- [ ] **P83-glyph-reading · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/agent-components/agent-mark`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：行首16px槽/13px图形与长中文并排；三变体各状态可辨，reduce九点完整。
  - 来源：`docs/blueprint/evidence/agent-mark-glyph-20261017/browser-checklist.md:6`。
  - 已生成：[blueprint-1280-agent-mark-check-079-reading.png](../../screens/matrix-closeout-20261019/blueprint-1280-agent-mark-check-079-reading.png)

- [ ] **P83-glyph-reading · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/agent-components/agent-mark`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：行首16px槽/13px图形与长中文并排；三变体各状态可辨，reduce九点完整。
  - 来源：`docs/blueprint/evidence/agent-mark-glyph-20261017/browser-checklist.md:6`。
  - 已生成：[blueprint-night-320-agent-mark-check-079-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-320-agent-mark-check-079-reading.png)

- [ ] **P83-glyph-reading · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/components/agent-components/agent-mark`；操作：打开原始页面并定位指定区域；区域：`[data-agent-preview]`。
  - 要看：行首16px槽/13px图形与长中文并排；三变体各状态可辨，reduce九点完整。
  - 来源：`docs/blueprint/evidence/agent-mark-glyph-20261017/browser-checklist.md:6`。
  - 已生成：[blueprint-night-1280-agent-mark-check-079-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-agent-mark-check-079-reading.png)

- [ ] **P84-workspace-reading · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-workspace` 状态；区域：`#workspace-contracts`。
  - 要看：材料策略行、确认六态与题篮版本行/全文的视觉层级、公式与窄容器，不被裁切或操作挤压。
  - 来源：`docs/blueprint/evidence/r9-20261018/browser-checklist.md:15`。
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-1.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-1.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-2.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-2.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-3.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-3.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-4.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-4.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-5.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-5.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-6.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-6.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-7.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-7.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-8.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-8.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-material-9.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-material-9.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-1.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-1.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-2.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-2.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-3.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-3.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-4.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-4.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-5.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-5.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-6.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace-confirmation-6.png)
  - 已生成：[light-1280-foundations-blueprint-check-089-visual-workspace.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-089-visual-workspace.png)

- [ ] **P84-workspace-reading · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-workspace` 状态；区域：`#workspace-contracts`。
  - 要看：材料策略行、确认六态与题篮版本行/全文的视觉层级、公式与窄容器，不被裁切或操作挤压。
  - 来源：`docs/blueprint/evidence/r9-20261018/browser-checklist.md:15`。
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-1.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-1.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-2.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-2.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-3.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-3.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-4.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-4.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-5.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-5.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-6.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-6.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-7.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-7.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-8.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-8.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-material-9.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-material-9.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-1.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-1.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-2.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-2.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-3.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-3.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-4.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-4.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-5.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-5.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-6.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace-confirmation-6.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-089-visual-workspace.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-089-visual-workspace.png)

- [ ] **P84-workspace-reading · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-workspace` 状态；区域：`#workspace-contracts`。
  - 要看：材料策略行、确认六态与题篮版本行/全文的视觉层级、公式与窄容器，不被裁切或操作挤压。
  - 来源：`docs/blueprint/evidence/r9-20261018/browser-checklist.md:15`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-1.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-1.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-2.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-2.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-3.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-3.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-4.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-4.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-5.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-5.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-6.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-6.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-7.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-7.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-8.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-8.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-9.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-material-9.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-1.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-1.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-2.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-2.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-3.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-3.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-4.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-4.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-5.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-5.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-6.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace-confirmation-6.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-089-visual-workspace.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-089-visual-workspace.png)

- [ ] **P84-workspace-reading · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-workspace` 状态；区域：`#workspace-contracts`。
  - 要看：材料策略行、确认六态与题篮版本行/全文的视觉层级、公式与窄容器，不被裁切或操作挤压。
  - 来源：`docs/blueprint/evidence/r9-20261018/browser-checklist.md:15`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-1.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-1.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-2.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-2.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-3.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-3.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-4.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-4.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-5.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-5.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-6.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-6.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-7.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-7.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-8.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-8.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-9.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-material-9.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-1.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-1.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-2.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-2.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-3.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-3.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-4.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-4.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-5.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-5.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-6.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace-confirmation-6.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-089-visual-workspace.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-089-visual-workspace.png)

- [ ] **P84-workspace-reading · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-workspace` 状态；区域：`#workspace-contracts`。
  - 要看：材料策略行、确认六态与题篮版本行/全文的视觉层级、公式与窄容器，不被裁切或操作挤压。
  - 来源：`docs/blueprint/evidence/r9-20261018/browser-checklist.md:15`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-1.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-1.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-2.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-2.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-3.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-3.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-4.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-4.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-5.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-5.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-6.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-6.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-7.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-7.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-8.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-8.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-9.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-material-9.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-1.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-1.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-2.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-2.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-3.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-3.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-4.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-4.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-5.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-5.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-6.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace-confirmation-6.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-089-visual-workspace.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-089-visual-workspace.png)

- [ ] **P85-P85b-P85c-objects-focus · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-expand` 状态；区域：`#sheet-object-cards`。
  - 要看：对象卡片 Tab 顺序、标题无伪按钮、焦点圈完整，长中文与公式、操作换行保持自然。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:18`。
  - 已生成：[light-1280-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png)
  - 已生成：[light-1280-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png)
  - 已生成：[light-1280-foundations-blueprint-check-097-object-expand.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-097-object-expand.png)

- [ ] **P85-P85b-P85c-objects-focus · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-expand` 状态；区域：`#sheet-object-cards`。
  - 要看：对象卡片 Tab 顺序、标题无伪按钮、焦点圈完整，长中文与公式、操作换行保持自然。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:18`。
  - 已生成：[blueprint-320-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-097-object-expand.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-097-object-expand.png)

- [ ] **P85-P85b-P85c-objects-focus · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-expand` 状态；区域：`#sheet-object-cards`。
  - 要看：对象卡片 Tab 顺序、标题无伪按钮、焦点圈完整，长中文与公式、操作换行保持自然。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:18`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-097-object-expand.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-097-object-expand.png)

- [ ] **P85-P85b-P85c-objects-focus · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-expand` 状态；区域：`#sheet-object-cards`。
  - 要看：对象卡片 Tab 顺序、标题无伪按钮、焦点圈完整，长中文与公式、操作换行保持自然。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:18`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-097-object-expand.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-097-object-expand.png)

- [ ] **P85-P85b-P85c-objects-focus · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-expand` 状态；区域：`#sheet-object-cards`。
  - 要看：对象卡片 Tab 顺序、标题无伪按钮、焦点圈完整，长中文与公式、操作换行保持自然。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:18`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-097-object-expand-data-agent-relation-view-workspace.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-097-object-expand-data-agent-arranger-view-workspace.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-097-object-expand.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-097-object-expand.png)

- [ ] **P85-P85b-P85c-objects-reading · light · 1280×900**
  - BPM1f 处置：墨底标题与关系列表目检通过，其他细项使用 object-* 自动证据。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-geometry` 状态；区域：`#sheet-object-cards`。
  - 要看：与 BpFrameCard 比较墨底标题/正文留白、状态边界、图纸左右对齐及320长标题；default/compact分别看。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:19`。
  - 已生成：[light-1280-foundations-blueprint-check-098-object-geometry.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-098-object-geometry.png)

- [ ] **P85-P85b-P85c-objects-reading · blueprint · 320×900**
  - BPM1f 处置：墨底标题与关系列表目检通过，其他细项使用 object-* 自动证据。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-geometry` 状态；区域：`#sheet-object-cards`。
  - 要看：与 BpFrameCard 比较墨底标题/正文留白、状态边界、图纸左右对齐及320长标题；default/compact分别看。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:19`。
  - 已生成：[blueprint-320-foundations-blueprint-check-098-object-geometry.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-098-object-geometry.png)

- [ ] **P85-P85b-P85c-objects-reading · blueprint · 1280×900**
  - BPM1f 处置：墨底标题与关系列表目检通过，其他细项使用 object-* 自动证据。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-geometry` 状态；区域：`#sheet-object-cards`。
  - 要看：与 BpFrameCard 比较墨底标题/正文留白、状态边界、图纸左右对齐及320长标题；default/compact分别看。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:19`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-098-object-geometry.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-098-object-geometry.png)

- [ ] **P85-P85b-P85c-objects-reading · blueprint-night · 320×900**
  - BPM1f 处置：墨底标题与关系列表目检通过，其他细项使用 object-* 自动证据。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-geometry` 状态；区域：`#sheet-object-cards`。
  - 要看：与 BpFrameCard 比较墨底标题/正文留白、状态边界、图纸左右对齐及320长标题；default/compact分别看。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:19`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-098-object-geometry.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-098-object-geometry.png)

- [ ] **P85-P85b-P85c-objects-reading · blueprint-night · 1280×900**
  - BPM1f 处置：墨底标题与关系列表目检通过，其他细项使用 object-* 自动证据。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `object-geometry` 状态；区域：`#sheet-object-cards`。
  - 要看：与 BpFrameCard 比较墨底标题/正文留白、状态边界、图纸左右对齐及320长标题；default/compact分别看。
  - 来源：`docs/blueprint/evidence/object-cards-20261018/browser-checklist.md:19`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-098-object-geometry.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-098-object-geometry.png)

- [ ] **首批-common-visual · light · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-common` 状态；区域：`#common-components`。
  - 要看：首批表单无效态、只读/禁用、单外框、Tabs两变体与真实Dialog焦点：层级清楚、焦点未裁切。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:13`。
  - 已生成：[light-1280-foundations-blueprint-check-109-visual-common-invalid-focus.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-109-visual-common-invalid-focus.png)
  - 已生成：[light-1280-foundations-blueprint-check-109-visual-common-dialog.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-109-visual-common-dialog.png)
  - 已生成：[light-1280-foundations-blueprint-check-109-visual-common.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-109-visual-common.png)

- [ ] **首批-common-visual · blueprint · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-common` 状态；区域：`#common-components`。
  - 要看：首批表单无效态、只读/禁用、单外框、Tabs两变体与真实Dialog焦点：层级清楚、焦点未裁切。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:13`。
  - 已生成：[blueprint-320-foundations-blueprint-check-109-visual-common-invalid-focus.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-109-visual-common-invalid-focus.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-109-visual-common-dialog.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-109-visual-common-dialog.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-109-visual-common.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-109-visual-common.png)

- [ ] **首批-common-visual · blueprint · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-common` 状态；区域：`#common-components`。
  - 要看：首批表单无效态、只读/禁用、单外框、Tabs两变体与真实Dialog焦点：层级清楚、焦点未裁切。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:13`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-109-visual-common-invalid-focus.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-109-visual-common-invalid-focus.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-109-visual-common-dialog.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-109-visual-common-dialog.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-109-visual-common.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-109-visual-common.png)

- [ ] **首批-common-visual · blueprint-night · 320×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-common` 状态；区域：`#common-components`。
  - 要看：首批表单无效态、只读/禁用、单外框、Tabs两变体与真实Dialog焦点：层级清楚、焦点未裁切。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:13`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-109-visual-common-invalid-focus.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-109-visual-common-invalid-focus.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-109-visual-common-dialog.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-109-visual-common-dialog.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-109-visual-common.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-109-visual-common.png)

- [ ] **首批-common-visual · blueprint-night · 1280×900**
  - BPM1f 处置：使用 checks.md 中本类别对应的自动探针及交互组作为收口证据；未补人工逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-common` 状态；区域：`#common-components`。
  - 要看：首批表单无效态、只读/禁用、单外框、Tabs两变体与真实Dialog焦点：层级清楚、焦点未裁切。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:13`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-109-visual-common-invalid-focus.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-109-visual-common-invalid-focus.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-109-visual-common-dialog.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-109-visual-common-dialog.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-109-visual-common.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-109-visual-common.png)

- [ ] **第二批-batch-two-visual · light · 1280×900**
  - BPM1f 处置：InputGroup 四类状态目检通过；浮层行为已覆盖，专项打开态截图未生成，见顶部例外。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-batch-two` 状态；区域：`#common-components-two`。
  - 要看：InputGroup整组焦点、Combobox候选/菜单/Toast、Sheet长文公式、Skeleton/Empty层次；按实际打开状态截图查看。
  - 来源：`docs/blueprint/evidence/batch2-20261016/checks.md:31`。
  - 已生成：[light-1280-foundations-blueprint-check-121-visual-batch-two-group-focus.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-121-visual-batch-two-group-focus.png)
  - 已生成：[light-1280-foundations-blueprint-check-121-visual-batch-two-menu-popup.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-121-visual-batch-two-menu-popup.png)
  - 已生成：[light-1280-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png)
  - 已生成：[light-1280-foundations-blueprint-check-121-visual-batch-two-toast.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-121-visual-batch-two-toast.png)
  - 已生成：[light-1280-foundations-blueprint-check-121-visual-batch-two.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-121-visual-batch-two.png)

- [ ] **第二批-batch-two-visual · blueprint · 320×900**
  - BPM1f 处置：InputGroup 四类状态目检通过；浮层行为已覆盖，专项打开态截图未生成，见顶部例外。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-batch-two` 状态；区域：`#common-components-two`。
  - 要看：InputGroup整组焦点、Combobox候选/菜单/Toast、Sheet长文公式、Skeleton/Empty层次；按实际打开状态截图查看。
  - 来源：`docs/blueprint/evidence/batch2-20261016/checks.md:31`。
  - 已生成：[blueprint-320-foundations-blueprint-check-121-visual-batch-two-group-focus.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-121-visual-batch-two-group-focus.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-121-visual-batch-two-menu-popup.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-121-visual-batch-two-menu-popup.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-121-visual-batch-two-toast.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-121-visual-batch-two-toast.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-121-visual-batch-two.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-121-visual-batch-two.png)

- [ ] **第二批-batch-two-visual · blueprint · 1280×900**
  - BPM1f 处置：InputGroup 四类状态目检通过；浮层行为已覆盖，专项打开态截图未生成，见顶部例外。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-batch-two` 状态；区域：`#common-components-two`。
  - 要看：InputGroup整组焦点、Combobox候选/菜单/Toast、Sheet长文公式、Skeleton/Empty层次；按实际打开状态截图查看。
  - 来源：`docs/blueprint/evidence/batch2-20261016/checks.md:31`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-121-visual-batch-two-group-focus.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-121-visual-batch-two-group-focus.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-121-visual-batch-two-menu-popup.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-121-visual-batch-two-menu-popup.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-121-visual-batch-two-toast.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-121-visual-batch-two-toast.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-121-visual-batch-two.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-121-visual-batch-two.png)

- [ ] **第二批-batch-two-visual · blueprint-night · 320×900**
  - BPM1f 处置：InputGroup 四类状态目检通过；浮层行为已覆盖，专项打开态截图未生成，见顶部例外。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-batch-two` 状态；区域：`#common-components-two`。
  - 要看：InputGroup整组焦点、Combobox候选/菜单/Toast、Sheet长文公式、Skeleton/Empty层次；按实际打开状态截图查看。
  - 来源：`docs/blueprint/evidence/batch2-20261016/checks.md:31`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-121-visual-batch-two-group-focus.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-121-visual-batch-two-group-focus.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-121-visual-batch-two-menu-popup.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-121-visual-batch-two-menu-popup.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-121-visual-batch-two-toast.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-121-visual-batch-two-toast.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-121-visual-batch-two.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-121-visual-batch-two.png)

- [ ] **第二批-batch-two-visual · blueprint-night · 1280×900**
  - BPM1f 处置：InputGroup 四类状态目检通过；浮层行为已覆盖，专项打开态截图未生成，见顶部例外。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-batch-two` 状态；区域：`#common-components-two`。
  - 要看：InputGroup整组焦点、Combobox候选/菜单/Toast、Sheet长文公式、Skeleton/Empty层次；按实际打开状态截图查看。
  - 来源：`docs/blueprint/evidence/batch2-20261016/checks.md:31`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two-group-focus.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two-group-focus.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two-menu-popup.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two-menu-popup.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two-sheet-popup.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two-toast.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two-toast.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-121-visual-batch-two.png)

- [ ] **编辑式排版与字体-editorial-reading · light · 1280×900**
  - BPM1f 处置：五主题 ×320/1280 布局抽查通过；字体回退细项使用 editorial/font 探针，未逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-fonts` 状态；区域：`main`。
  - 要看：章节/中文/编号/横线层级，窄屏folio换行；加载失败后无缺字遮挡且正文仍可读。
  - 来源：`docs/blueprint/evidence/editorial-20261016/checks.md:24`。
  - 已生成：[light-1280-foundations-blueprint-check-126-visual-fonts-loaded.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-126-visual-fonts-loaded.png)
  - 已生成：[light-1280-foundations-blueprint-check-126-visual-fonts-blocked.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-126-visual-fonts-blocked.png)
  - 已生成：[light-1280-foundations-blueprint-check-126-visual-fonts.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-126-visual-fonts.png)

- [ ] **编辑式排版与字体-editorial-reading · blueprint · 320×900**
  - BPM1f 处置：五主题 ×320/1280 布局抽查通过；字体回退细项使用 editorial/font 探针，未逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-fonts` 状态；区域：`main`。
  - 要看：章节/中文/编号/横线层级，窄屏folio换行；加载失败后无缺字遮挡且正文仍可读。
  - 来源：`docs/blueprint/evidence/editorial-20261016/checks.md:24`。
  - 已生成：[blueprint-320-foundations-blueprint-check-126-visual-fonts-loaded.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-126-visual-fonts-loaded.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-126-visual-fonts-blocked.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-126-visual-fonts-blocked.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-126-visual-fonts.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-126-visual-fonts.png)

- [ ] **编辑式排版与字体-editorial-reading · blueprint · 1280×900**
  - BPM1f 处置：五主题 ×320/1280 布局抽查通过；字体回退细项使用 editorial/font 探针，未逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-fonts` 状态；区域：`main`。
  - 要看：章节/中文/编号/横线层级，窄屏folio换行；加载失败后无缺字遮挡且正文仍可读。
  - 来源：`docs/blueprint/evidence/editorial-20261016/checks.md:24`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-126-visual-fonts-loaded.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-126-visual-fonts-loaded.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-126-visual-fonts-blocked.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-126-visual-fonts-blocked.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-126-visual-fonts.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-126-visual-fonts.png)

- [ ] **编辑式排版与字体-editorial-reading · blueprint-night · 320×900**
  - BPM1f 处置：五主题 ×320/1280 布局抽查通过；字体回退细项使用 editorial/font 探针，未逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-fonts` 状态；区域：`main`。
  - 要看：章节/中文/编号/横线层级，窄屏folio换行；加载失败后无缺字遮挡且正文仍可读。
  - 来源：`docs/blueprint/evidence/editorial-20261016/checks.md:24`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-126-visual-fonts-loaded.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-126-visual-fonts-loaded.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-126-visual-fonts-blocked.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-126-visual-fonts-blocked.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-126-visual-fonts.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-126-visual-fonts.png)

- [ ] **编辑式排版与字体-editorial-reading · blueprint-night · 1280×900**
  - BPM1f 处置：五主题 ×320/1280 布局抽查通过；字体回退细项使用 editorial/font 探针，未逐组合目检。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-fonts` 状态；区域：`main`。
  - 要看：章节/中文/编号/横线层级，窄屏folio换行；加载失败后无缺字遮挡且正文仍可读。
  - 来源：`docs/blueprint/evidence/editorial-20261016/checks.md:24`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-126-visual-fonts-loaded.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-126-visual-fonts-loaded.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-126-visual-fonts-blocked.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-126-visual-fonts-blocked.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-126-visual-fonts.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-126-visual-fonts.png)

- [ ] **夜图-heatmap-reading · light · 1280×900**
  - BPM1f 处置：使用 heatmap/heatmap-zero 及交互证据；夜图分隔线与白色图案对比度限制保留。
  - 路由：`/next/components/evidence-matrix`；操作：脚本准备 `heatmap-zero` 状态；区域：`#compact-heatmap`。
  - 要看：热图图形、零值真实tooltip、数据表缺测；数字隐去后仍能找到格子，图案/墨线/硬阴影可辨。
  - 来源：`docs/blueprint/evidence/night-20261016/checks.md:17`。
  - 已生成：[light-1280-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png](../../screens/matrix-closeout-20261019/light-1280-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png)
  - 已生成：[light-1280-evidence-matrix-check-143-heatmap-zero.png](../../screens/matrix-closeout-20261019/light-1280-evidence-matrix-check-143-heatmap-zero.png)

- [ ] **夜图-heatmap-reading · blueprint · 320×900**
  - BPM1f 处置：使用 heatmap/heatmap-zero 及交互证据；夜图分隔线与白色图案对比度限制保留。
  - 路由：`/next/components/evidence-matrix`；操作：脚本准备 `heatmap-zero` 状态；区域：`#compact-heatmap`。
  - 要看：热图图形、零值真实tooltip、数据表缺测；数字隐去后仍能找到格子，图案/墨线/硬阴影可辨。
  - 来源：`docs/blueprint/evidence/night-20261016/checks.md:17`。
  - 已生成：[blueprint-320-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png](../../screens/matrix-closeout-20261019/blueprint-320-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png)
  - 已生成：[blueprint-320-evidence-matrix-check-143-heatmap-zero.png](../../screens/matrix-closeout-20261019/blueprint-320-evidence-matrix-check-143-heatmap-zero.png)

- [ ] **夜图-heatmap-reading · blueprint · 1280×900**
  - BPM1f 处置：使用 heatmap/heatmap-zero 及交互证据；夜图分隔线与白色图案对比度限制保留。
  - 路由：`/next/components/evidence-matrix`；操作：脚本准备 `heatmap-zero` 状态；区域：`#compact-heatmap`。
  - 要看：热图图形、零值真实tooltip、数据表缺测；数字隐去后仍能找到格子，图案/墨线/硬阴影可辨。
  - 来源：`docs/blueprint/evidence/night-20261016/checks.md:17`。
  - 已生成：[blueprint-1280-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png](../../screens/matrix-closeout-20261019/blueprint-1280-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png)
  - 已生成：[blueprint-1280-evidence-matrix-check-143-heatmap-zero.png](../../screens/matrix-closeout-20261019/blueprint-1280-evidence-matrix-check-143-heatmap-zero.png)

- [ ] **夜图-heatmap-reading · blueprint-night · 320×900**
  - BPM1f 处置：使用 heatmap/heatmap-zero 及交互证据；夜图分隔线与白色图案对比度限制保留。
  - 路由：`/next/components/evidence-matrix`；操作：脚本准备 `heatmap-zero` 状态；区域：`#compact-heatmap`。
  - 要看：热图图形、零值真实tooltip、数据表缺测；数字隐去后仍能找到格子，图案/墨线/硬阴影可辨。
  - 来源：`docs/blueprint/evidence/night-20261016/checks.md:17`。
  - 已生成：[blueprint-night-320-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png](../../screens/matrix-closeout-20261019/blueprint-night-320-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png)
  - 已生成：[blueprint-night-320-evidence-matrix-check-143-heatmap-zero.png](../../screens/matrix-closeout-20261019/blueprint-night-320-evidence-matrix-check-143-heatmap-zero.png)

- [ ] **夜图-heatmap-reading · blueprint-night · 1280×900**
  - BPM1f 处置：使用 heatmap/heatmap-zero 及交互证据；夜图分隔线与白色图案对比度限制保留。
  - 路由：`/next/components/evidence-matrix`；操作：脚本准备 `heatmap-zero` 状态；区域：`#compact-heatmap`。
  - 要看：热图图形、零值真实tooltip、数据表缺测；数字隐去后仍能找到格子，图案/墨线/硬阴影可辨。
  - 来源：`docs/blueprint/evidence/night-20261016/checks.md:17`。
  - 已生成：[blueprint-night-1280-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-evidence-matrix-check-143-heatmap-zero-zero-tooltip.png)
  - 已生成：[blueprint-night-1280-evidence-matrix-check-143-heatmap-zero.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-evidence-matrix-check-143-heatmap-zero.png)

- [ ] **P87-reading · light · 320×900**
  - BPM1f 处置：锁定框/标签/入口行高亮及夜图标签反白目检通过；320 标尺隐藏，完整义务未逐组合人工核销。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-entry` 状态；区域：`#entry-annotations`。
  - 要看：图纸 E 四边反白与节点/标签对应清晰；68px 基准、窄屏换行、行间无分割线；reduce 静态高亮仍可辨。覆盖 blueprint / light ×320/1280，另保留 night 代表组合。
  - 来源：`docs/blueprint/evidence/matrix-closeout-20261019/bpm1d-before-status.txt:12`。
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-hover-1.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-hover-1.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-hover-2.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-hover-2.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-hover-3.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-hover-3.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-keyboard-1.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-keyboard-1.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-keyboard-2.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-keyboard-2.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-keyboard-3.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-keyboard-3.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-no-preference-1.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-no-preference-1.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-reduce-2.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-reduce-2.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-no-preference-3.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-no-preference-3.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry-reduce-4.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry-reduce-4.png)
  - 已生成：[light-320-foundations-blueprint-check-155-visual-entry.png](../../screens/matrix-closeout-20261019/light-320-foundations-blueprint-check-155-visual-entry.png)

- [ ] **P87-reading · light · 1280×900**
  - BPM1f 处置：锁定框/标签/入口行高亮及夜图标签反白目检通过；320 标尺隐藏，完整义务未逐组合人工核销。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-entry` 状态；区域：`#entry-annotations`。
  - 要看：图纸 E 四边反白与节点/标签对应清晰；68px 基准、窄屏换行、行间无分割线；reduce 静态高亮仍可辨。覆盖 blueprint / light ×320/1280，另保留 night 代表组合。
  - 来源：`docs/blueprint/evidence/matrix-closeout-20261019/bpm1d-before-status.txt:12`。
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-hover-1.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-hover-1.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-hover-2.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-hover-2.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-hover-3.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-hover-3.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-keyboard-1.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-keyboard-1.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-keyboard-2.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-keyboard-2.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-keyboard-3.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-keyboard-3.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-no-preference-1.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-no-preference-1.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-reduce-2.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-reduce-2.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-no-preference-3.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-no-preference-3.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry-reduce-4.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry-reduce-4.png)
  - 已生成：[light-1280-foundations-blueprint-check-155-visual-entry.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-155-visual-entry.png)

- [ ] **P87-reading · blueprint · 320×900**
  - BPM1f 处置：锁定框/标签/入口行高亮及夜图标签反白目检通过；320 标尺隐藏，完整义务未逐组合人工核销。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-entry` 状态；区域：`#entry-annotations`。
  - 要看：图纸 E 四边反白与节点/标签对应清晰；68px 基准、窄屏换行、行间无分割线；reduce 静态高亮仍可辨。覆盖 blueprint / light ×320/1280，另保留 night 代表组合。
  - 来源：`docs/blueprint/evidence/matrix-closeout-20261019/bpm1d-before-status.txt:12`。
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-hover-1.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-hover-1.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-hover-2.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-hover-2.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-hover-3.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-hover-3.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-keyboard-1.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-keyboard-1.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-keyboard-2.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-keyboard-2.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-keyboard-3.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-keyboard-3.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-no-preference-1.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-no-preference-1.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-reduce-2.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-reduce-2.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-no-preference-3.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-no-preference-3.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry-reduce-4.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry-reduce-4.png)
  - 已生成：[blueprint-320-foundations-blueprint-check-155-visual-entry.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-155-visual-entry.png)

- [ ] **P87-reading · blueprint · 1280×900**
  - BPM1f 处置：锁定框/标签/入口行高亮及夜图标签反白目检通过；320 标尺隐藏，完整义务未逐组合人工核销。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-entry` 状态；区域：`#entry-annotations`。
  - 要看：图纸 E 四边反白与节点/标签对应清晰；68px 基准、窄屏换行、行间无分割线；reduce 静态高亮仍可辨。覆盖 blueprint / light ×320/1280，另保留 night 代表组合。
  - 来源：`docs/blueprint/evidence/matrix-closeout-20261019/bpm1d-before-status.txt:12`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-hover-1.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-hover-1.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-hover-2.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-hover-2.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-hover-3.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-hover-3.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-keyboard-1.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-keyboard-1.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-keyboard-2.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-keyboard-2.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-keyboard-3.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-keyboard-3.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-no-preference-1.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-no-preference-1.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-reduce-2.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-reduce-2.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-no-preference-3.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-no-preference-3.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry-reduce-4.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry-reduce-4.png)
  - 已生成：[blueprint-1280-foundations-blueprint-check-155-visual-entry.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-155-visual-entry.png)

- [ ] **P87-reading · blueprint-night · 320×900**
  - BPM1f 处置：锁定框/标签/入口行高亮及夜图标签反白目检通过；320 标尺隐藏，完整义务未逐组合人工核销。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-entry` 状态；区域：`#entry-annotations`。
  - 要看：图纸 E 四边反白与节点/标签对应清晰；68px 基准、窄屏换行、行间无分割线；reduce 静态高亮仍可辨。覆盖 blueprint / light ×320/1280，另保留 night 代表组合。
  - 来源：`docs/blueprint/evidence/matrix-closeout-20261019/bpm1d-before-status.txt:12`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-hover-1.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-hover-1.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-hover-2.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-hover-2.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-hover-3.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-hover-3.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-keyboard-1.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-keyboard-1.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-keyboard-2.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-keyboard-2.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-keyboard-3.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-keyboard-3.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-no-preference-1.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-no-preference-1.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-reduce-2.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-reduce-2.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-no-preference-3.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-no-preference-3.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry-reduce-4.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry-reduce-4.png)
  - 已生成：[blueprint-night-320-foundations-blueprint-check-155-visual-entry.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-155-visual-entry.png)

- [ ] **P87-reading · blueprint-night · 1280×900**
  - BPM1f 处置：锁定框/标签/入口行高亮及夜图标签反白目检通过；320 标尺隐藏，完整义务未逐组合人工核销。
  - 路由：`/next/foundations/blueprint`；操作：脚本准备 `visual-entry` 状态；区域：`#entry-annotations`。
  - 要看：图纸 E 四边反白与节点/标签对应清晰；68px 基准、窄屏换行、行间无分割线；reduce 静态高亮仍可辨。覆盖 blueprint / light ×320/1280，另保留 night 代表组合。
  - 来源：`docs/blueprint/evidence/matrix-closeout-20261019/bpm1d-before-status.txt:12`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-hover-1.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-hover-1.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-hover-2.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-hover-2.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-hover-3.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-hover-3.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-keyboard-1.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-keyboard-1.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-keyboard-2.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-keyboard-2.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-keyboard-3.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-keyboard-3.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-no-preference-1.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-no-preference-1.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-reduce-2.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-reduce-2.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-no-preference-3.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-no-preference-3.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry-reduce-4.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry-reduce-4.png)
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-155-visual-entry.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-155-visual-entry.png)

- [ ] **P76-shell-mobile-manual · light · 1280×900**
  - BPM1f 处置：未验：历史夹具无 openMobile 接线；Workspace 真实移动导航不在范围。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：320/768 下历史 ShellNavFixture SpaceBar 仅写 desktop open，没有 openMobile 接线；不能以本站 drawer 通过代替夹具或 Workspace 的移动导航。Supervisor 复核真实宿主接线。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:12`。
  - 已生成：[light-1280-workspace-app-bar-check-157-reading.png](../../screens/matrix-closeout-20261019/light-1280-workspace-app-bar-check-157-reading.png)

- [ ] **P76-shell-mobile-manual · blueprint · 320×900**
  - BPM1f 处置：未验：历史夹具无 openMobile 接线；Workspace 真实移动导航不在范围。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：320/768 下历史 ShellNavFixture SpaceBar 仅写 desktop open，没有 openMobile 接线；不能以本站 drawer 通过代替夹具或 Workspace 的移动导航。Supervisor 复核真实宿主接线。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:12`。
  - 已生成：[blueprint-320-workspace-app-bar-check-157-reading.png](../../screens/matrix-closeout-20261019/blueprint-320-workspace-app-bar-check-157-reading.png)

- [ ] **P76-shell-mobile-manual · blueprint · 1280×900**
  - BPM1f 处置：未验：历史夹具无 openMobile 接线；Workspace 真实移动导航不在范围。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：320/768 下历史 ShellNavFixture SpaceBar 仅写 desktop open，没有 openMobile 接线；不能以本站 drawer 通过代替夹具或 Workspace 的移动导航。Supervisor 复核真实宿主接线。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:12`。
  - 已生成：[blueprint-1280-workspace-app-bar-check-157-reading.png](../../screens/matrix-closeout-20261019/blueprint-1280-workspace-app-bar-check-157-reading.png)

- [ ] **P76-shell-mobile-manual · blueprint-night · 320×900**
  - BPM1f 处置：未验：历史夹具无 openMobile 接线；Workspace 真实移动导航不在范围。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：320/768 下历史 ShellNavFixture SpaceBar 仅写 desktop open，没有 openMobile 接线；不能以本站 drawer 通过代替夹具或 Workspace 的移动导航。Supervisor 复核真实宿主接线。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:12`。
  - 已生成：[blueprint-night-320-workspace-app-bar-check-157-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-320-workspace-app-bar-check-157-reading.png)

- [ ] **P76-shell-mobile-manual · blueprint-night · 1280×900**
  - BPM1f 处置：未验：历史夹具无 openMobile 接线；Workspace 真实移动导航不在范围。
  - 路由：`/next/use-cases/workspace-app-bar`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：320/768 下历史 ShellNavFixture SpaceBar 仅写 desktop open，没有 openMobile 接线；不能以本站 drawer 通过代替夹具或 Workspace 的移动导航。Supervisor 复核真实宿主接线。
  - 来源：`docs/blueprint/evidence/shell-nav-20261016/browser-checklist.md:12`。
  - 已生成：[blueprint-night-1280-workspace-app-bar-check-157-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-workspace-app-bar-check-157-reading.png)

- [ ] **首批-native-zoom-review · light · 1280×900**
  - BPM1f 处置：未验：原生 200% 缩放转后续设备/可访问专项；CSS zoom2 320 仅观察。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：CSS zoom2 320 下溢出保留失败与 geometry；按真实浏览器 200% 缩放复核重排、长中文和公式可达性，不把 CSS 投影等同原生缩放。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:24`。
  - 已生成：[light-1280-foundations-blueprint-check-158-reading.png](../../screens/matrix-closeout-20261019/light-1280-foundations-blueprint-check-158-reading.png)

- [ ] **首批-native-zoom-review · blueprint · 320×900**
  - BPM1f 处置：未验：原生 200% 缩放转后续设备/可访问专项；CSS zoom2 320 仅观察。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：CSS zoom2 320 下溢出保留失败与 geometry；按真实浏览器 200% 缩放复核重排、长中文和公式可达性，不把 CSS 投影等同原生缩放。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:24`。
  - 已生成：[blueprint-320-foundations-blueprint-check-158-reading.png](../../screens/matrix-closeout-20261019/blueprint-320-foundations-blueprint-check-158-reading.png)

- [ ] **首批-native-zoom-review · blueprint · 1280×900**
  - BPM1f 处置：未验：原生 200% 缩放转后续设备/可访问专项；CSS zoom2 320 仅观察。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：CSS zoom2 320 下溢出保留失败与 geometry；按真实浏览器 200% 缩放复核重排、长中文和公式可达性，不把 CSS 投影等同原生缩放。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:24`。
  - 已生成：[blueprint-1280-foundations-blueprint-check-158-reading.png](../../screens/matrix-closeout-20261019/blueprint-1280-foundations-blueprint-check-158-reading.png)

- [ ] **首批-native-zoom-review · blueprint-night · 320×900**
  - BPM1f 处置：未验：原生 200% 缩放转后续设备/可访问专项；CSS zoom2 320 仅观察。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：CSS zoom2 320 下溢出保留失败与 geometry；按真实浏览器 200% 缩放复核重排、长中文和公式可达性，不把 CSS 投影等同原生缩放。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:24`。
  - 已生成：[blueprint-night-320-foundations-blueprint-check-158-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-320-foundations-blueprint-check-158-reading.png)

- [ ] **首批-native-zoom-review · blueprint-night · 1280×900**
  - BPM1f 处置：未验：原生 200% 缩放转后续设备/可访问专项；CSS zoom2 320 仅观察。
  - 路由：`/next/foundations/blueprint`；操作：打开原始页面并定位指定区域；区域：`main`。
  - 要看：CSS zoom2 320 下溢出保留失败与 geometry；按真实浏览器 200% 缩放复核重排、长中文和公式可达性，不把 CSS 投影等同原生缩放。
  - 来源：`docs/blueprint/evidence/common-20261015/checks.md:24`。
  - 已生成：[blueprint-night-1280-foundations-blueprint-check-158-reading.png](../../screens/matrix-closeout-20261019/blueprint-night-1280-foundations-blueprint-check-158-reading.png)
