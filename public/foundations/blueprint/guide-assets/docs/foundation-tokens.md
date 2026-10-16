# Foundations · AI 来源、悬浮材质与图表色板

Product Owner 2026-10-02 授权的正式增补；2026-10-16 按用户批准的蓝图配色规则补充品牌装饰与 AI 来源的兼容说明。实现位于 `app/(next)/next/theme.css`，基础规范入口 `/next/foundations#ai-floating` 当前展示 light / paper / dark / blueprint。本文不修改已有令牌名称或数值；P69 图表色板增补见下文，字体角色见 [字体与字号](typography.md)，第四主题规则见 [蓝图主题](blueprint-theme.md)。

## AI 来源

原色证据：`components/prism-next/app-bar.css` 的 `.prism-brand-mark` 依次使用 `--brand-blue` / `--brand-magenta` / `--brand-green`；`theme.css` 中既有原色为 `#339FF2` / `#E0438F` / `#C2F25B`。`expression.css` 的品牌签名也复用这组颜色。

| 语义令牌 | light | paper | dark | blueprint |
| --- | --- | --- | --- | --- |
| `--brand-ai-1` | `var(--brand-blue)` / #339FF2 | 同左 | 同左 | 同左 |
| `--brand-ai-2` | `var(--brand-magenta)` / #E0438F | 同左 | 同左 | 同左 |
| `--brand-ai-3` | `var(--brand-green)` / #C2F25B | 同左 | 同左 | 同左 |
| `--brand-ai-gradient` | `linear-gradient(90deg,var(--brand-ai-1),var(--brand-ai-2),var(--brand-ai-3))` | 同左 | 同左 | 同左 |

每个主题边界显式声明相同的品牌原色映射，保持品牌识别；不另造色板。作为 AI 来源呈现时，只用细线和标识，须配中性、可读的「AI」来源文字，并由调用方提供来源事实，渐变不能独自承载信息。不作大面积填充，不作为状态、得分或正确性颜色；浅色青柠仅为装饰色，不作小字。四主题的具体表面和状态仍须浏览器视觉验收，不据令牌定义宣称通过对比度认证。

2026-10-16 兼容澄清：既有 `TextbookDirectory` 教材封面细条和 `DialogLayout` 的可选顶部装饰也复用 `--brand-ai-gradient`，属于品牌装饰，不能因变量名中的 `ai` 就把教材或对话框声明为 AI 来源。教材封面及相关装饰本身为 `aria-hidden`，有意义的教材名称、版本和来源继续由可读内容承载；若另有 AI 来源事实，按上段独立标明。这保留现有品牌原色、变量名、组件 API 和业务源码，不执行全仓重命名，也不将已有兼容用法扩为任意新增渐变装饰的授权。

蓝图的纸墨、交互蓝 `#1D5FBF` 与品牌三原色分工保持独立。品牌标识继续使用原色；普通行动、链接、进度和状态沿用自身语义令牌，成功绿不替换成品牌青柠或信息蓝。任何悬停 / 焦点 / 按下适配同时检查前景与背景，不让来源装饰承担操作状态。

## 悬浮材质

正式工具类 `surface-floating` 仅用于悬浮工具条与弹出层；不用于正文面板或纸张。

| 令牌 / 属性 | light | paper | dark |
| --- | --- | --- | --- |
| `--surface-floating-background` | `color-mix(in srgb,var(--popover) 92%,transparent)` | 同左 | 同左 |
| `--popover`（既有，不修改） | #FFFFFF | #FFFEFB | #202328 |
| `--surface-floating-blur` | 12px | 12px | 12px |
| 前景 | `var(--popover-foreground)` / #1F2328 | #1E293B | #E1E5EA |
| 阴影 | 既有 `shadow-lg` | 同左 | 同左 |

基础规则先使用不透明 `var(--popover)`；仅在 `@supports` 检出标准或 WebKit `backdrop-filter` 后启用 92% 表面与 12px 模糊。无支持时自然回退不透明。减弱动态效果时禁用材质内的过渡/动画与关联弹层定位器过渡。以上为原核心三主题材质记录；材质规则自身不改变 coss 的边框、圆角和控件尺寸。第四主题已有几何适配仍按蓝图的隔离边界独立生效，不据本文扩大到核心主题。

2026-10-16 第二批验证发现，局部主题切换还须避免继承外层已计算的派生值。实现仅在涉及 Blueprint 的真实预览边界重新绑定既有 `--radius-lg`、`--radius-md` 与 `--color-muted`，读取边界自己的基础令牌；普通核心全局主题不受该桥接规则影响。未新增公共令牌或改变既有基础值；双向嵌套与真实浮层的实际覆盖见 [蓝图第二批验收记录](blueprint-theme.md)。


## P69 曜彩图表色板

PO 2026-10-15 批准的核心主题图表调整。单一来源为 `lib/prism-next/chart-palette.ts`，`theme.css` 的 `--chart-1…--chart-6` 与 Tailwind 桥接保持一致；paper 继承浅色六值。入口 `/next/foundations#chart-palette` 展示系列、页面/卡片表面、形状填充和连续色阶。Blueprint / Blueprint Night 的既有系列、形状、色阶和覆盖不变。

| 序号 | light / paper | 白底 | 纸色页面 | 纸色卡片 | dark | 深色页面 | 深色卡片 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | #1E88E5 | 3.679 | 3.261 | 3.648 | #62ACED | 7.889 | 7.249 |
| 2 | #D6337F | 4.527 | 4.013 | 4.488 | #E270A5 | 6.476 | 5.951 |
| 3 | #3A9A2A | 3.599 | 3.190 | 3.568 | #75B86A | 8.051 | 7.398 |
| 4 | #C27A00 | 3.455 | 3.063 | 3.426 | #D4A24D | 8.283 | 7.611 |
| 5 | #7E5BD6 | 4.823 | 4.275 | 4.782 | #A58CE2 | 6.800 | 6.248 |
| 6 | #6B7280 | 4.834 | 4.286 | 4.793 | #979CA6 | 6.957 | 6.393 |

以上为 sRGB 相对亮度对比度（比值均为 x:1），表面取实际主题令牌：light #FFFFFF；paper 页面 #F4F1EA / 卡片 #FFFEFB；dark 页面 #0F0F0F / 卡片 #17191C。全部系列 ≥ 3:1。深色每个 sRGB 通道按 `round(light × 0.7 + 255 × 0.3)` 提亮，保留色相；逐色 CIELAB D65 ΔE76 最小值为 32.024（本轮用 ≥ 20 作为两两区分的数值回归门槛，不是 WCAG 的色差标准，也不替代视觉或色觉差异验收）。图例仍需名称和形状。

形状 base / selected 对应系列 1 / 2；light/paper 面积 fill #99C9F3，白底对比度 1.750:1，纸色页面 1.551:1；dark fill #3C719F，对页面 3.701:1、卡片 3.401:1。连续色阶为 `[secondary, fill, base]`；1001 个采样点逐个选黑/白文字，文字对背景均 ≥ 4.5:1。系列色用于图形，不直接替代正文文字色。

默认图形尺寸与覆盖规则见 [图表组件 P69](learning-chart-properties.md#p69-曜彩与图形尺寸2026-10-15)。`--chart-6` 补齐中性第六色（浅/纸 #6B7280，深 #979CA6），不改品牌、状态或正文令牌。
