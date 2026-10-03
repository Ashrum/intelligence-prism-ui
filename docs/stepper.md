# Stepper 流程步骤条 v0.1 · 组件候选

PO 2026-09-30 批准候选 #2。目录归属「导航」，入口 `/next/components/stepper`。本轮为 Builder 实现，不代表独立 Review 或产品验收通过。

## 复用检索与取舍

- Supervisor 在 `/tmp/prism-stepper/task.md` 提供的在线检索：coss registry 579 项，含 particles；相关项为 `progress`、`p-progress-1/2/3`、`p-button-40`、`p-number-field-9`，无 stepper/steps/timeline。索引 https://coss.com/ui/r/registry.json，particles https://coss.com/ui/particles，单项 `https://coss.com/ui/r/p-<name>.json`。本轮沿用该证据，未再次联网核验数量或缺项。
- Supervisor 提供的 Beautiful UI 注册检索：`stepper`、`steps`、`progress-steps`、`timeline` 四项均 404（`https://www.beautifului.dev/r/<name>.json`）；本轮未复制 Beautiful UI 代码。
- Builder 查阅固定 coss Badge、Separator、Progress 与 Prism Badge；Fix1 延用上述 coss（含 particles）/ Beautiful UI 检索证据。Badge 无统一圆形状态标记，Progress 默认粗条，Separator 无完成状态变体；按 Supervisor V1/V3 裁定改用原生装饰元素与现有 info-foreground、border、muted-foreground、warning-foreground、destructive 语义令牌。样式仅在 Stepper 内组合，无 coss 重绘、依赖或令牌修改。
- Builder 查阅 `AgentStepStatus`、`AgentTaskProgress`：它们处理 running、waiting、partial、unknown、历史快照与执行记录，不等同 current/upcoming 流程位置。尤其 pending 的执行队列含义不能替代“先前阶段待完成”。没有可独立抽出的同义状态图标原子；仅共享 Lucide 图标，既有 API 与状态词汇不变。
- Workspace `SmartGradingNew.tsx` 的 `GradingJourney` 仅只读参考。未采用其根据 currentStep/basisConfirmed/captureAccepted 推定完成状态的业务逻辑，未导入私有类型。
- Figma 本地截图 S01、S07、S46 只核对六步结构、当前位置与批阅受阻含义，不复制视觉。受阻场景的业务当前位置应由宿主明确提供，不从受阻状态推断。

## API

```tsx
import { Stepper, type StepperStep } from "@/components/prism-next/stepper"

const steps: StepperStep[] = [
  { id: "settings", label: "设置任务", state: "done" },
  { id: "materials", label: "准备资料", state: "pending", description: "等待确认标准答案" },
  { id: "scan", label: "扫描学生试卷", state: "current" },
  { id: "review", label: "查看结果", state: "upcoming" },
]
<Stepper steps={steps} aria-label="批阅任务阶段" />
```

| 属性 | 契约 |
| --- | --- |
| `steps` | 只读完整有序数组，推荐 3–8 步；唯一 `id`、可读 `label`、显式 `state`，可选 `description`。不截断、不补造状态。调用方保证至多一个 current。 |
| `state` | `done / current / upcoming / pending / blocked / error`。error 是受阻呈现别名，原因通过 description 说明；pending 必须显示“待完成”，blocked/error 必须显示“受阻”及警示图标。 |
| `currentStepId` | 可选当前位置 ID；提供时覆盖所有 state=current，统一决定摘要、aria-current、当前标记/标签及自动滚动目标。未匹配 ID 时位置未知，不回退。省略时兼容 state=current。 |
| `orientation` | 默认 `horizontal`，可选 `vertical`。水平完整列表局部滚动，垂直侧栏自然换行。 |
| `aria-label` | 默认“流程阶段”，多个流程同时出现时由调用方提供不同名称。 |
| `className` | 宿主布局类。不可重绘颜色、字号、圆角或阴影。 |

默认步骤只读；P3 可选 onStepSelect/selectable 契约见下文。示例外部按钮仅载入固定状态夹具，不代表执行成功。

当前位置优先来自 `currentStepId`，省略时来自 `state=current`；无匹配位置时显示“共 N 步 · 未提供当前阶段”，不推定最后一步或受阻步为当前。显式 ID 覆盖后，其他遗留 current 按后续阶段呈现，不产生第二个当前位置。S46 使用 `currentStepId="stage-5"` 与第五步 `state="blocked"`，显示“当前阶段 · 受阻”及警示图标；error 同理，待完成等独立事实也予以保留。

标记统一 32px 圆形：done 为强调色实心勾、不显示数字；当前为强调色实心序号、标签使用 item-title；后续为描边序号；pending 为警示描边序号；blocked/error 为错误色警示图标。当前且特殊状态保留特殊标记，标签仍加粗。已完成/当前/后续状态仅提供 SR 文本；待完成、受阻文字可见，description 不覆盖状态。每个出发步骤为 done 时，其出线使用强调色，其余使用弱色。1px 装饰线贯穿相邻圆形标记间的剩余空间，隐藏于辅助技术，不提供总进度百分比。

## 布局、无障碍与减少动效

- `nav` + `ol/li`；只有统一解析出的当前位置带 `aria-current="step"`。每步提供序号和已完成/当前阶段/后续阶段/待完成/受阻的屏幕阅读器文本；装饰序号、图标与重复可见状态从辅助树隐藏。
- 顶部摘要默认常驻显示当前序号、总步数与标签。水平列表在自身容器滚动，标签换行且不缩字；说明最多两行省略，title 与独立 SR 文本保留完整内容。滚动区可通过 Tab 聚焦，再用原生方向键滚动；未启用选择的步骤不占 Tab 顺序。
- 首次挂载、currentStepId/状态/标签变化及 ResizeObserver 尺寸变化时，仅横向调整该区域以显露当前步骤，不调用 scrollIntoView、不移动焦点或页面滚动。用户主动滚动不会被持续拉回。
- 垂直列表及卡片按内容自然撑高，连接线随步骤高度延伸，不自动滚动；无计时器、自动播放或动画，减少动效偏好下亦无动画。

## 验证边界

组件页含第 1/3/5 步、待完成、受阻、垂直、320px、长中文、公式、三主题及 3/8 步夹具。测试与类型检查结果见 `/tmp/prism-stepper/Fix1-Report.md` 和 `fix1-checks/`。
真实浏览器验证因浏览器安全策略拒绝访问 localhost:5173 而未执行；SSR 与模拟尺寸测试不等于视觉、原生键盘滚动或真实读屏器验收。Workspace 未接入，移动真机、实际服务及业务流程均未验证。

## W4 紧凑工具栏（历史，S1 已替代）

沿用上述 coss（含 particles）/ Beautiful UI 检索与既有 Stepper；本轮补查 particles 索引可访问，registry 与 Beautiful UI stepper 注册文件访问失败，未取得新来源代码。

`compact?: boolean` 默认 false，仅在 horizontal 生效：步骤内标记和内容横排，隐藏装饰连接线，标签区最大 16rem 后换行，所有步骤仍在可聚焦的局部滚动区。compact 水平模式的步骤摘要使用 `sr-only`，仅供读屏，非 compact 模式保持可见。vertical 即使传 compact 仍保持原来的摘要、连接线与布局。compact 变化也重新显露当前步骤；未匹配 currentStepId 仍明确未知。没有新增交互、执行状态、计时器或动效。新增紧凑三主题 320px、长中文、受阻与未知位置示例。

## 2026-10-02 P3：宿主授权的可选步骤

- 延用本页 coss（含 particles）与 Beautiful UI 无同义步骤组件的检索；本轮复核 Supervisor 的 registry 快照（579 项），固定 coss Button/Tabs 均没有“位置事实 + 每步选择资格”契约，因此扩展现有 Stepper，不新增组件。Ant Design Steps onChange、MUI StepButton、Mantine onStepClick 仅为委派中的能力对照，未复制代码或声称重新联网核验。
- 新增 `onStepSelect?: (id: string) => void`、`StepperStep.selectable?: boolean`、`StepperStep.selectLabel?: string`。只有回调存在、selectable 严格为 true、且不是解析后的当前位置，才用原生 button；不按 done/pending/upcoming 推断资格。currentStepId 优先规则不变，未知位置不补造。
- 默认可访问名称为“前往：{label}”，宿主可用 selectLabel 提供“返回：{label}”。原生 Enter/Space、可见 focus-visible outline，非紧凑布局最小 44×44px（紧凑布局见 S1）；button 内部使用 span，保持有效 HTML。horizontal/compact/vertical 共享资格规则。
- 仅发送 ID，组件不跳转、不改 state/currentStepId，不自动标记完成。未传回调或未授权时保持旧 div/p DOM；当前步骤始终只读。三布局交互夹具与三主题 320px 长文公式夹具已同步。

检索来源为委派提供的本地快照 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/` 下的 `registry.json` / `particles/*.json`，本轮未重新联网获取。浏览器工具拒绝访问 localhost:5173，P3 的实际视觉、键盘/触屏与焦点验收未完成；自动化证据见 `/tmp/prism-audit/Report-P3.md`。


## 2026-10-03 S1：按内容收拢的紧凑步骤组

PO 批准，委派 `/Users/OLE/HermesWork/.supervisor/prism/task-S1.md`。沿用上文 coss registry/particles、Beautiful UI 无同义组件的检索记录，本轮未重新联网核验；实现前复核固定 `components/coss/button.tsx` 的 `pointer-coarse:after` 命中区惯例。扩展已有 Stepper，不新建组件、不复制其他设计系统代码，也不修改固定 coss、依赖或视觉令牌。

- 仅 `compact && orientation === "horizontal"` 生效。步骤组 `width: max-content`、`max-width: 100%`，每步不拉伸；宿主以 `flex items-center justify-center` 在 56px 顶栏居中，也可左对齐。
- 24px 标记与文字组垂直居中；已完成显示勾、当前使用 `text-item-title`，普通后续标签使用 `text-muted-foreground`。pending / blocked / error 保留警示标记和状态事实。相邻步骤保留固定 24px 连线，两侧各 4px 间隔；已完成步骤的出线为现有 `info-foreground`，其余为 `border`。
- 原生 button 的资格、回调与当前位置契约不变。紧凑布局不设置 44px 最小宽高，复用 coss 的 `pointer-coarse:after:size-full/min-h-11/min-w-11` 扩展触屏命中区；focus-visible outline 保留。非紧凑布局继续保留原有 44px 目标。
- 首次挂载、外部内容/位置变化与 ResizeObserver 尺寸变化时，测量展开内容与实际容器宽度；放不下则所有非当前步骤只显示标记。标签及状态保留于 SR 文本，只读步骤有完整 `aria-label`，按钮有操作名称与 `aria-description`；原生 `title` 保留完整标签、状态及原因。无匹配当前位置时仍显示 SR 未知摘要，不推定当前。
- 当前标签单行省略，完整文本仍可访问；常态标签区最多 16rem。说明不在紧凑工具栏占用多行，保留在完整名称/描述与 title。SR 摘要始终存在，紧凑容器没有滚动 Tab 停靠、滚动提示或自动滚动。
- 极窄或 6–8 步时，若全部固定标记、短线与当前标签仍不能同排，按步骤顺序自然换行（容器需允许自然撑高）；不缩标记、不隐藏步骤、不出现横向滚动。56px 顶栏示例采用四步；多步长中文示例使用自然高度容器。
- 默认水平、垂直（含 vertical + compact）的 SSR DOM/类名与 main `9673dc3` 六组快照逐字节对应；默认布局 CSS 规则保持不变。原有水平局部滚动与 reveal 行为保留。

示例覆盖 56px 居中顶栏、三主题 320px、长中文、公式、受阻、未知位置与八步。自动化日志与基线在 `/Users/OLE/HermesWork/.supervisor/prism/s1-checks/`；实际浏览器访问被安全策略拒绝，不能据模拟尺寸测试宣称视觉、原生键盘或触屏验收通过。S1 Builder 报告见同目录上级 `Report-S1.md`，仍需 Supervisor 独立 Review。
