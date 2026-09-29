# Agent-readable design-system contract

智能曜彩同时服务人类评审与 Web / coding Agent。站点仍是同一套设计系统，不维护 Claude、Gemini、Codex 等模型的分叉版本。

## 权威顺序

当信息发生冲突时，按以下顺序解释：

1. 当前组件页的组件规范与 Agent Spec。
2. Foundations 基础规范。
3. 可复用 Pattern 与应用示例。
4. 固定版本的 coss upstream 行为。
5. Agent inference。

应用示例只说明组合方式，不覆盖组件契约。Agent inference 不得覆盖已经存在的规范。

## 缺失规范

如果任务需要的值或行为没有在智能曜彩中定义：

1. 优先复用固定 coss 版本已经定义的行为；
2. coss 仍未定义时，明确报告 specification gap；
3. 不从截图猜测像素值，不凭模型偏好新增视觉规则、组件或交互。

## 表单标签策略

基础 Form / Field / Input / Textarea / Select 的 Canonical 策略为 **persistent fixed label（常驻固定标签）**。字段身份在默认、已有内容、错误、只读与禁用状态均保持可见。

Floating label 不属于基础 Input / Field 行为。若未来确有紧凑场景需要，可作为单独的 Specialized Pattern 评审与记录；在此之前 Agent 不得自行推断或实现浮动标签。

## Agent 入口

部署站点根目录的 `/llms.txt` 是发现入口，提供 Authority、核心页面和 Agent 阅读规则。核心组件页面同时暴露 Agent Spec；人类可折叠查看，抓取 HTML 的 Agent 也可直接读取。

## 字体契约

Foundations / Typography v0.2.1 已落实为语义 Token 与公共适配层。以 [typography.md](typography.md) 为规则入口，业务页面只选择角色，不写局部字号。固定 coss 尺寸与本规范冲突时由 Prism 适配层统一处理，不改 vendored 文件。

## Beautiful UI Prompt Bar 扫光动效例外（PO 2026-09-29 批准）

仅 `AgentPromptBar` 可采用 Beautiful UI Prompt Bar 的 `glimm@0.3.1` 单次彩色扫光，触发限用户发送或开始语音的操作；不得在挂载、模型属性变化或后台状态更新时自动播放。扫光只反馈操作，不能充当任务已接收、识别成功或执行完成的凭证。其彩色光带为此次批准的动效例外，不新增 Prism 视觉令牌，也不扩展为其他组件的配色规则。

`prefers-reduced-motion: reduce` 时不创建或播放扫光；运行中开启减少动效立即取消并释放。WebGL 不可用、创建失败或 context lost 时静默降级为普通输入框；结束或卸载时取消动画并释放 shader。表面、正文、按钮、菜单与两种变体仍使用现有 Prism / coss 语义令牌。

同次批准的 `AgentMark` 仅在宿主报告 thinking / working 时播放 Beautiful UI 3×3 点阵与微光标签；减少动效时冻结。用时必须有宿主开始时间；终态用时须同时有结束时间，无事实时间不从挂载时刻起计。禁止 Surfer 外链视频与任何演示计时器状态推进。
