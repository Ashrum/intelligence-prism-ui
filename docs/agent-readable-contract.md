# Agent-readable design-system contract

智能曜彩同时服务人类评审与 Web / coding Agent。站点仍是同一套设计系统，不维护 Claude、Gemini、Codex 等模型的分叉版本。

## 权威顺序

当信息发生冲突时，按以下顺序解释：

1. [OLE Agent 前端界面设计规范 · 蓝图 v1.0](OLE_Agent_Frontend_Blueprint_v1.0.md) 的目标交互、来源取舍与实施门禁；未实现的目标不冒充现有 API。
2. 当前组件页的组件规范与 Agent Spec（现有公开契约）。
3. Foundations 基础规范。
4. 可复用 Pattern 与应用示例。
5. 固定版本的 coss upstream 行为。
6. Agent inference。

应用示例只说明组合方式，不覆盖组件契约。Agent inference 不得覆盖已经存在的规范。

## 组件来源与复用顺序（2026-10-16 正式基线）

- 先复用已有智能曜彩／Prism组件，再检索 coss（含 particles），然后做必要的 Prism 组合与适配；仍有稳定缺口才新建。
- Beautiful UI 为可选来源与局部效果参考，不再强制优先检索，不因本次调整重写已验收实现。引用其代码须核对具体许可、保留 MIT 声明，并去掉演示计时器与自动播放。
- coss 检索包含 [particles](https://coss.com/ui/particles)；[注册索引](https://coss.com/ui/r/registry.json)，单项 `https://coss.com/ui/r/p-<name>.json`。适配在 `components/prism-next` 完成，冻结的 `components/coss/**` 原始字节不变；官方最新实现不视为已接入。
- 新增／改造前记录检索条目、匹配情况与取舍。Open WebUI、Open-ClaudeCode 等客户端只作交互研究，不整体引入运行时或替换前端框架。

依据 [OLE Agent 前端界面设计规范 · 蓝图 v1.0](OLE_Agent_Frontend_Blueprint_v1.0.md) §11.6，同步用户已批准的来源取舍；目标设计与实施门禁以该规范为准，现有 props/API 的已实现事实仍须核对源码和组件契约。未实现项不因定稿自动升级为可用。主题、字体、冻结 coss 和双仓边界继续有效；本轮仅同步规则，未完成 CI 修复或服务签认。

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

## 动效实施边界（2026-10-16）

依正式规范 §5.5：简单反馈使用 CSS，复杂布局连续性按需用现有 Motion，符合既有约束的 glimm 扫光保留。三者不得竞争同节点同属性。P0 唯一偏好源为系统 `prefers-reduced-motion`，须在初始及运行中变化时一致响应；MotionConfig 不能代替装饰性循环／扫光的显式停用。阅读用旋转、缩放、平移可直接更新静态结果。上述为实施与验收要求，本轮未复验运行表现。
