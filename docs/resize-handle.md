# ResizeHandle 分割线拖动手柄

设计状态：P112 实施记录，待 Supervisor 独立 Review 与浏览器验收。  
工程准入：未开始。

## 职责与来源

实现：[resize-handle.tsx](../components/prism-next/resize-handle.tsx)。演示：`/next/components/separator` 的「ResizeHandle 拖动手柄（视觉夹具）」。这是新增的 Prism 装饰视觉，不是 coss Separator 的变体，也不新增拖动执行器。

检索：已有 Prism 组件没有独立面板分割手柄；冻结的 `components/coss/separator.tsx` 仅有 1px 边界，没有手柄；本地 coss 来源清单与 particles 用例没有可直接复用的 ResizableHandle。沿用常见 withHandle 的“线 + 中央握柄”组合方式，在 Prism 层实现，不修改 54 个冻结 coss 文件。按本轮离线限制未访问在线 coss particles / registry，不声称已审核最新 upstream。未复制第三方代码、未新增依赖。

## API

| 属性 | 默认 | 含义 |
| --- | --- | --- |
| `orientation` | `vertical` | `vertical` / `horizontal`，指线的方向 |
| `align` | `center` | `start` / `center` / `end`；竖线左/中/右，横线上/中/下，物理边缘不随 RTL 翻转 |
| `dragging` | `false` | 宿主传入的真实拖动状态，不由组件推定 |

宿主必须具备 `relative group/resize-handle` 和明确的尺寸（例如竖向 `w-4`、横向 `h-4`）。装饰层绝对铺满宿主，指针事件向宿主冒泡；宿主自己捕获指针，处理取消、释放、键盘和宽度计算。组件不占额外布局宽度，不提供 ref、事件回调或业务状态。

线和握柄中心位于同一轴；start/end 在宿主边缘，握柄各向边缘外延伸 2px。宿主与相邻面板必须允许这部分可见，必要时由宿主设定层叠顺序，不在宿主上裁切。宿主负责消除布局 gap、padding、背景灰缝；本组件不会修改面板布局。

## 状态与主题

- 默认：1px 线使用 `border`，与现有 Separator 一致；4 × 20px 常驻短条（横向 20 × 4px）使用 `muted-foreground`。
- 宿主 hover 或 `dragging=true`：2px 线，线和手柄都使用 `ring` 强调色。
- 宿主 focus-visible：整个命中区域显示 2px 外轮廓、2px 间距，与单纯 hover 可区分；可与 dragging 叠加。
- 仅颜色过渡；`motion-reduce:transition-none` 随系统设置关闭过渡，无循环动画。
- light / paper / dark / blueprint / blueprint-night 继承最近预览边界的现有主题令牌；没有全局 CSS 覆盖、硬编码颜色、新令牌、圆角或柔和投影。

定向测试计算五主题 `muted-foreground` 与 `ring` 对 `background` / `card` / `muted` 的对比度均 ≥ 3:1。分隔线沿用 `border` 现状，不另设对比度门槛。这是令牌计算证据；自定义背景、透明背景、真实面板相邻区域需宿主另外核验。

## W288 宿主接入

```tsx
import { ResizeHandle } from "@/components/prism-next/resize-handle"

// width、最小/最大值、dragging 及三个事件均由现有 WorkspaceDivider 提供。
<div
  className="group/resize-handle relative w-4 shrink-0 self-stretch outline-none"
  role="separator"
  tabIndex={0}
  aria-orientation="vertical"
  aria-label="调整对话与右栏宽度"
  aria-controls="conversation-panel"
  aria-valuemin={minWidth}
  aria-valuemax={maxWidth}
  aria-valuenow={width}
  aria-valuetext={`${width} 像素`}
  title="拖动或用左右方向键调整宽度"
  onPointerDown={onPointerDown}
  onKeyDown={onKeyDown}
>
  <ResizeHandle align="end" dragging={dragging} />
</div>
```

宿主须同时处理 pointermove / pointerup / pointercancel / lostpointercapture（可沿用现有实现），并在结束、取消时清除 dragging。目录 ↔ 对话分割线用同一组合，更换名称、目标面板 ID 和宽度边界；根据相邻面板所在边选择 start/end。横向时使用 `orientation="horizontal"`、`aria-orientation="horizontal"`、上下方向键和高度值。

组件整体 `aria-hidden=true`，无独立 Tab 停靠点或 separator 角色。可读名称、当前数值、范围、受控面板与操作提示必须放在宿主；提示可用 title 或可见说明。完整键盘行为、读屏器和触摸命中尺寸由宿主负责。

## 验证边界

演示包含五个隔离主题、每主题两方向 × 三对齐方式、静态 dragging 状态，可通过悬停与 Tab 检查样式。该演示明确标记为视觉夹具，不伪装为已接通的宽度调整。

浏览器验收：按分工由 Supervisor 执行。需检查 1280 / 390 宽度、五主题与嵌套预览、悬停加粗、焦点轮廓、边缘对齐、长中文提示、系统减少动态效果及原有 Separator 样例。W288 的真实拖动、键盘调整、灰缝消除另在工作台接入后验收。
