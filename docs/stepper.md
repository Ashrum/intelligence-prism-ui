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

没有 `onStepSelect`：任务没有明确跳转需要，故不提供点击导航。所有步骤均只读，示例外部按钮仅载入固定状态夹具，不代表执行成功。

当前位置优先来自 `currentStepId`，省略时来自 `state=current`；无匹配位置时显示“共 N 步 · 未提供当前阶段”，不推定最后一步或受阻步为当前。显式 ID 覆盖后，其他遗留 current 按后续阶段呈现，不产生第二个当前位置。S46 使用 `currentStepId="stage-5"` 与第五步 `state="blocked"`，显示“当前阶段 · 受阻”及警示图标；error 同理，待完成等独立事实也予以保留。

标记统一 32px 圆形：done 为强调色实心勾、不显示数字；当前为强调色实心序号、标签使用 item-title；后续为描边序号；pending 为警示描边序号；blocked/error 为错误色警示图标。当前且特殊状态保留特殊标记，标签仍加粗。已完成/当前/后续状态仅提供 SR 文本；待完成、受阻文字可见，description 不覆盖状态。每个出发步骤为 done 时，其出线使用强调色，其余使用弱色。1px 装饰线贯穿相邻圆形标记间的剩余空间，隐藏于辅助技术，不提供总进度百分比。

## 布局、无障碍与减少动效

- `nav` + `ol/li`；只有统一解析出的当前位置带 `aria-current="step"`。每步提供序号和已完成/当前阶段/后续阶段/待完成/受阻的屏幕阅读器文本；装饰序号、图标与重复可见状态从辅助树隐藏。
- 顶部摘要默认常驻显示当前序号、总步数与标签。水平列表在自身容器滚动，标签换行且不缩字；说明最多两行省略，title 与独立 SR 文本保留完整内容。滚动区可通过 Tab 聚焦，再用原生方向键滚动；步骤本身不占 Tab 顺序。
- 首次挂载、currentStepId/状态/标签变化及 ResizeObserver 尺寸变化时，仅横向调整该区域以显露当前步骤，不调用 scrollIntoView、不移动焦点或页面滚动。用户主动滚动不会被持续拉回。
- 垂直列表及卡片按内容自然撑高，连接线随步骤高度延伸，不自动滚动；无计时器、自动播放或动画，减少动效偏好下亦无动画。

## 验证边界

组件页含第 1/3/5 步、待完成、受阻、垂直、320px、长中文、公式、三主题及 3/8 步夹具。测试与类型检查结果见 `/tmp/prism-stepper/Fix1-Report.md` 和 `fix1-checks/`。
真实浏览器验证因浏览器安全策略拒绝访问 localhost:5173 而未执行；SSR 与模拟尺寸测试不等于视觉、原生键盘滚动或真实读屏器验收。Workspace 未接入，移动真机、实际服务及业务流程均未验证。

## W4 紧凑工具栏

沿用上述 coss（含 particles）/ Beautiful UI 检索与既有 Stepper；本轮补查 particles 索引可访问，registry 与 Beautiful UI stepper 注册文件访问失败，未取得新来源代码。

`compact?: boolean` 默认 false，仅在 horizontal 生效：步骤内标记和内容横排，隐藏装饰连接线，标签区最大 16rem 后换行，所有步骤仍在可聚焦的局部滚动区。compact 水平模式的步骤摘要使用 `sr-only`，仅供读屏，非 compact 模式保持可见。vertical 即使传 compact 仍保持原来的摘要、连接线与布局。compact 变化也重新显露当前步骤；未匹配 currentStepId 仍明确未知。没有新增交互、执行状态、计时器或动效。新增紧凑三主题 320px、长中文、受阻与未知位置示例。
