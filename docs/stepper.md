# Stepper 流程步骤条 v0.1 · 组件候选

PO 2026-09-30 批准候选 #2。目录归属「导航」，入口 `/next/components/stepper`。本轮为 Builder 实现，不代表独立 Review 或产品验收通过。

## 复用检索与取舍

- Supervisor 在 `/tmp/prism-stepper/task.md` 提供的在线检索：coss registry 579 项，含 particles；相关项为 `progress`、`p-progress-1/2/3`、`p-button-40`、`p-number-field-9`，无 stepper/steps/timeline。索引 https://coss.com/ui/r/registry.json，particles https://coss.com/ui/particles，单项 `https://coss.com/ui/r/p-<name>.json`。本轮沿用该证据，未再次联网核验数量或缺项。
- Supervisor 提供的 Beautiful UI 注册检索：`stepper`、`steps`、`progress-steps`、`timeline` 四项均 404（`https://www.beautifului.dev/r/<name>.json`）；本轮未复制 Beautiful UI 代码。
- Builder 查阅固定 coss Badge、Separator、Progress 与 Prism Badge。采用 Prism Badge 的 success/info-solid/secondary/warning/error 现有变体；连接线采用 coss Progress 的 100/0 值，保留原 Track/Indicator 表面，仅禁用过渡。Separator 只有通用分隔能力，不能直接区分已完成段，因此未采用。没有修改 coss、依赖或视觉令牌。
- Builder 查阅 `AgentStepStatus`、`AgentTaskProgress`：它们处理 running、waiting、partial、unknown、历史快照与执行记录，不等同 current/upcoming 流程位置。尤其 pending 的执行队列含义不能替代“先前阶段待完成”。没有可独立抽出的同义状态图标原子；仅共享基础 Badge 和 Lucide 图标，既有 API 与状态词汇不变。
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
| `orientation` | 默认 `horizontal`，可选 `vertical`。水平完整列表局部滚动，垂直侧栏自然换行。 |
| `aria-label` | 默认“流程阶段”，多个流程同时出现时由调用方提供不同名称。 |
| `className` | 宿主布局类。不可重绘颜色、字号、圆角或阴影。 |

没有 `onStepSelect`：任务没有明确跳转需要，故不提供点击导航。所有步骤均只读，示例外部按钮仅载入固定状态夹具，不代表执行成功。

当前位置仅来自 `state=current`；无 current（例如流程结束、受阻但位置未提供）时显示“共 N 步 · 未提供当前阶段”，不推定最后一步或受阻步为当前。若要同时表达“当前且受阻”，宿主可用 current 加受阻说明，但独立受阻图标与 current 的正交状态 API 尚未定义，本轮不自行扩张，交 Supervisor / PO 判断是否需要。

序号始终可见；done 另带勾，blocked/error 另带警示图标。每步保留状态文字，description 不能覆盖状态。每个出发步骤为 done 时，其出线显示完成；pending/current/upcoming/blocked/error 的出线不显示完成。连接段是装饰，隐藏于辅助技术，不提供总进度百分比。

## 布局、无障碍与减少动效

- `nav` + `ol/li`；只有显式 current 带 `aria-current="step"`。每步提供序号和已完成/当前阶段/后续阶段/待完成/受阻的屏幕阅读器文本；装饰序号、图标与重复可见状态从辅助树隐藏。
- 顶部摘要常驻显示当前序号、总步数与标签。水平列表在自身容器滚动，标签换行且不缩字、不裁掉待完成或受阻原因。滚动区可通过 Tab 聚焦，再用原生方向键滚动；步骤本身不占 Tab 顺序。
- 首次挂载、状态/标签变化及 ResizeObserver 尺寸变化时，仅横向调整该区域以显露当前步骤，不调用 scrollIntoView、不移动焦点或页面滚动。用户主动滚动不会被持续拉回。
- 垂直布局不自动滚动；无计时器、自动播放或平滑滚动，Progress 过渡禁用，减少动效偏好下亦无动画。

## 验证边界

组件页含第 1/3/5 步、待完成、受阻、垂直、320px、长中文、公式、三主题及 3/8 步夹具。测试与类型检查结果见 `/tmp/prism-stepper/Report.md` 和 `checks/`。
真实浏览器验证因浏览器安全策略拒绝访问 localhost:5173 而未执行；SSR 与模拟尺寸测试不等于视觉、原生键盘滚动或真实读屏器验收。Workspace 未接入，移动真机、实际服务及业务流程均未验证。
