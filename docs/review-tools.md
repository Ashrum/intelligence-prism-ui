# ReviewTools v0.1 · 评审与测试工具

PO 2026-10-03 批准加入组件目录；Builder 实现候选，独立 Review 与浏览器验收另行记录。入口 `/next/components/review-tools`；源码 `components/prism-next/review-tools.tsx` 与同名 CSS。

## 复用检索与取舍

2026-10-03 读取固定 coss `Popover / Button / ToggleGroup / Switch / Select / AlertDialog` 源码，检查现有 `demos/overlays.tsx` 的 Popover 与确认操作写法、`examples/review-tools/*` 的完整拖动行为。直接复用这些控件与原有手势实现；不用新控件替代基础表单，不增依赖，不修改 coss 原件。

检索了 [coss particles](https://coss.com/ui/particles)（页面可读取，列出 510 个组合），尝试注册索引 `https://coss.com/ui/r/registry.json` 及 `p-popover-1 / p-toggle-group-1 / p-switch-1 / p-select-1 / p-alert-dialog-1` JSON；本次环境中 Web 返回不可访问，终端代理不可连且直连 DNS 失败；固定提交对应 GitHub raw 文件也未能读取。**未把这些条目内容记为已核验**。本轮组合依据为本仓库固定 coss 源码和既有评审实现；远端 particles 内容匹配仍待 Reviewer 补核。该工具是通用评审基础设施，不是 Agent 业务语义组件，不引入 Beautiful UI 代码。

现有 Popover 覆盖悬停、碰撞避让、可用高度滚动与焦点管理；Button 覆盖标准动作，ToggleGroup 覆盖分段选择，Switch 覆盖布尔值，Select 覆盖下拉，AlertDialog 覆盖危险操作确认。稳定缺口仅为可移动浮动入口和宿主分组插槽，因此将既有评审实现抽成获准的新目录组件。

## 外观与边界

56px 浮动圆形按钮，作用域变量 `--review-accent: #F04A1A`，三主题相同；**仅用于评审/测试工具，不得用于产品界面**。颜色不进入主题令牌。56px 为本轮 RT 明确要求；面板内所有控件保持 coss 标准尺寸。组件没有模型、执行器、业务 Store、服务、持久化、计时器或环境判断。

仅管理开关、手势与位置的界面状态；点击内容动作的业务结果由宿主回传。面板使用 coss Popover，支持长内容滚动；窗口变化只夹取显示坐标，不改原有边缘偏移，也不发位置回调。减少动态效果时按钮、面板内容、定位器不使用过渡。

## API

| 属性 | 契约 |
| --- | --- |
| `title?: string` | 标题与按钮可访问名称，默认“评审工具” |
| `description?: ReactNode` | 面板说明；未提供时不渲染 |
| `groups?: readonly ReviewToolsGroup[]` | `{id,title,children}`；唯一 id、常驻组标题、带名称的 group 与宿主内容插槽 |
| `children?: ReactNode` | 归位之前的额外内容；用于兼容冻结稿的控件顺序 |
| `footer?: ReactNode` | 归位之后的宿主操作，如返回组件库 |
| `position?: ReviewToolsPosition \| null` | undefined 为非受控；对象为受控边缘锚点；null 为受控“跟随默认位置” |
| `defaultPosition?: ReviewToolsPosition \| (() => ReviewToolsPosition)` | 默认右下各 24px；函数仅在客户端定位时调用，可读取宿主布局。默认值变化在没有手动位置时跟随；函数在 resize/归位时读取最新布局，其他布局变化由宿主更新属性/函数引用 |
| `onPositionChange?(next, {reason})` | 移动回传位置对象与 `move`；归位回传 null 与 `reset`。受控时必须由宿主回传新值才能移动；无回调时受控位置只读 |

`ReviewToolsPosition = { horizontal: 'left'|'right', vertical: 'top'|'bottom', offsetX: number, offsetY: number }`。偏移为有限非负 CSS px；宿主校验持久化数据。不要在一次挂载内切换受控/非受控模式。

位移大于 5px 才进入拖动；按最近水平/垂直边及偏移记录。拖动关闭面板并抑制合成点击与悬停误弹，指针真实离开后恢复悬停。首次点击固定悬停面板，第二次点击关闭；Esc / 点击外部关闭。方向键 16px，Shift+方向键 64px；Esc 的焦点归还通过 coss `finalFocus={buttonRef}` 实现，需浏览器复验。默认不持久化。

## 标准条目写法

实际可交互组合见 `components/prism-next/demos/review-tools.tsx`，不另导出一套动作/表单组件。

```tsx
// 每个字段保留常驻标签或 ReviewTools group 标题。
<Button variant="outline" disabled={!canRun} aria-describedby={!canRun ? 'run-reason' : undefined} onClick={onRun}>运行测试</Button>
{!canRun && <p id="run-reason" className="text-ui-hint">请先生成场景。</p>}

<ToggleGroup variant="outline" value={[mode]} onValueChange={values => { if (values[0]) onModeChange(values[0]) }} aria-label="数据模式">
  <ToggleGroupItem value="full">完整</ToggleGroupItem>
  <ToggleGroupItem value="missing">缺失</ToggleGroupItem>
</ToggleGroup>
<label htmlFor="missing" className="flex items-center justify-between gap-3 text-ui-body">
  缺少参考材料<Switch id="missing" checked={missing} onCheckedChange={onMissingChange} />
</label>
<label htmlFor="scene" className="text-ui-body">测试场景</label>
<Select items={scenes} value={scene} onValueChange={onSceneChange}>
  <SelectTrigger id="scene"><SelectValue /></SelectTrigger>
  <SelectPopup>{scenes.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup>
</Select>
```

危险操作复用 `AlertDialog + AlertDialogTrigger + AlertDialogPopup + Header/Title/Description + Footer/Close`；明确对象、数量与影响。提供“取消”和“确认清除”，仅后者调用宿主清除回调。可运行示例只清除本页内存记录，不操作真实数据。对需异步确认的动作，由宿主控制 Dialog `open`，成功回执后才关闭，错误仍由宿主显示。

## 评审页宿主与存储

两份冻结稿保留原来的 `examples/review-tools/review-tools.tsx` 入口，入口已缩减为通用组件适配器：评审视口、ThemePicker、缺失开关、恢复题目栏与返回链接均为宿主内容；拖动和 Popover 实现不重复。原 CSS 已并入组件。评审页宿主继续使用 `prism-review-tools-edge-position-v2`，非法值、读写错误静默降级；归位清除该键。

```tsx
const [position, setPosition] = useState<ReviewToolsPosition | null>(null)
// useEffect 内读取并校验 storage；SSR 不读取浏览器对象。
<ReviewTools position={position} defaultPosition={calculateDefaultPosition}
  onPositionChange={next => {
    setPosition(next)
    try {
      if (next) localStorage.setItem(key, JSON.stringify(next))
      else localStorage.removeItem(key)
    } catch { /* 存储不可用仍可操作。 */ }
  }} groups={groups} />
```

冻结 C1 的 7 态、C2 的 10 态 DOM 快照及一致性测试/harness 不修改。它们既有边界排除了浮动评审工具，因此不得用其通过证明工具外观已验收。旧 `paper-review-design` 的两处 CSS 路径断言只改向迁移后的组件文件，断言条件未放宽。

## Workspace DEV 接入推荐

宿主使用自己的构建环境开关与开发权限判断，在生产环境不挂载。Vite 示例：`import.meta.env.DEV && <ReviewTools title="测试工具" groups={devGroups} />`；非 Vite 使用项目已有等价开关。工具隐藏不是安全边界，真实测试动作仍由宿主/服务核验权限。此文只说明用法，本任务不修改 Workspace。

不需要位置恢复时用非受控模式；需要恢复时复制上面的宿主模式，并使用 Workspace 自己的 key，禁止跨应用混用评审页 key。场景生成、批量动作、清除确认都在宿主插槽里组合，不能在通用组件里推定执行成功。Portal 跟随页面根主题；组件页 ThemePicker 可切换 light / paper / dark，并有三主题 320px 内容夹具。

## 验证边界

确定性事件测试覆盖三类 pointer 的 >5px 阈值、抑制误弹、16/64px 移动、resize 不覆盖锚点、归位、受控回传、函数默认位置、宿主存储异常、默认不访问存储、分组与 coss 焦点配置。组件页展示评审/测试两种用法、三主题、长中文、MathML 与 320px 容器。实际浏览器打开被工具访问策略拒绝；这些夹具已实现但视觉、真实键盘焦点、嵌套确认弹层、触屏与读屏器均不宣称已通过。
