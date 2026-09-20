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
