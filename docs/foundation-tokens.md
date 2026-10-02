# Foundations · AI 来源与悬浮材质

Product Owner 2026-10-02 授权的正式增补。实现位于 `app/(next)/next/theme.css`，基础规范入口 `/next/foundations#ai-floating` 同时展示 light / paper / dark。不修改已有令牌值；字体角色见 [字体与字号](typography.md)。

## AI 来源

原色证据：`components/prism-next/app-bar.css` 的 `.prism-brand-mark` 依次使用 `--brand-blue` / `--brand-magenta` / `--brand-green`；`theme.css` 中既有原色为 `#339FF2` / `#E0438F` / `#C2F25B`。`expression.css` 的品牌签名也复用这组颜色。

| 语义令牌 | light | paper | dark |
| --- | --- | --- | --- |
| `--brand-ai-1` | `var(--brand-blue)` / #339FF2 | 同左 | 同左 |
| `--brand-ai-2` | `var(--brand-magenta)` / #E0438F | 同左 | 同左 |
| `--brand-ai-3` | `var(--brand-green)` / #C2F25B | 同左 | 同左 |
| `--brand-ai-gradient` | `linear-gradient(90deg,var(--brand-ai-1),var(--brand-ai-2),var(--brand-ai-3))` | 同左 | 同左 |

每个主题边界显式声明相同的品牌原色映射，保持品牌识别；不另造色板。只用于 AI 来源的细线和标识，不作大面积填充，不作为状态、得分或正确性颜色。细线须配中性、可读的「AI」来源文字，不能独自承载信息；浅色青柠仅为装饰色，不作小字。三主题表面可辨性仍须浏览器视觉验收，不据令牌定义宣称通过对比度认证。

## 悬浮材质

正式工具类 `surface-floating` 仅用于悬浮工具条与弹出层；不用于正文面板或纸张。

| 令牌 / 属性 | light | paper | dark |
| --- | --- | --- | --- |
| `--surface-floating-background` | `color-mix(in srgb,var(--popover) 92%,transparent)` | 同左 | 同左 |
| `--popover`（既有，不修改） | #FFFFFF | #FFFEFB | #202328 |
| `--surface-floating-blur` | 12px | 12px | 12px |
| 前景 | `var(--popover-foreground)` / #1F2328 | #1E293B | #E1E5EA |
| 阴影 | 既有 `shadow-lg` | 同左 | 同左 |

基础规则先使用不透明 `var(--popover)`；仅在 `@supports` 检出标准或 WebKit `backdrop-filter` 后启用 92% 表面与 12px 模糊。无支持时自然回退不透明。减弱动态效果时禁用材质内的过渡/动画与关联弹层定位器过渡。材质不改变 coss 的边框、圆角和控件尺寸。
