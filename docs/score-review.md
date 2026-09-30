# Score Review 人工评分 v0.1 · Builder 实现

PO 批准候选 #9；目录「内容与数据」，入口 `/next/components/score-review`。独立 Review 与产品验收另行确认。

## 实施前复用检索

- 已读取 `agent-item-reviewer.tsx`、`agent-review-queue.tsx` 与 Workspace `GradingAnswerEditor.tsx`。AgentItemReviewer 的 item/version/request/resolution 是版本化通用复核协议，draft 插槽适合业务编辑器；AgentReviewQueue 是同协议的集合视图。本次独立评分组合无需队列版本、查询或重启协议，强塞入旧组件会扩张旧契约。保持旧 API，共享 AgentMetaLine、AgentStatus、coss 表单/反馈原子；宿主仍可将评分组合接入现有复核流程。
- [Beautiful UI](https://www.beautifului.dev) 的 Approval Card 是执行前问答，Recommendation Card 是带置信信息的建议接受卡；均没有分值范围、半分步进、理由门禁与原卷定位。注册文件 `r/approval-card.json`、`r/recommendation-card.json` 本轮读取失败；未复制其代码，不将官网描述当成源码验证。
- 阅读固定 coss NumberField、Textarea、Card、Alert、Button；[particles](https://coss.com/ui/particles) 显示 510 项，在线 [registry](https://coss.com/ui/r/registry.json) 和 `p-number-field-10.json` 读取失败。只读检查既有缓存 `.../f9a352c5-7ad1-4d06-9d0d-08fc4599e165/scratchpad/coss/particles-src/` 的 p-number-field-1、p-number-field-10、p-textarea-5：采用步进组合和固定标签，不复制提交执行和等待计时器。缓存位于 `/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/`，不声称在线最新。
- 组合已合并 PaperPreview / DocumentRegionViewer；OCR 使用 DraftMathPreview 的固定 Temml + MathML 渲染链路。AI 卡使用普通 Card 和明确 AI 标题，不铺设 AI 底色。
- 已查看 S35 同名前缀 PNG，并只读核对 5174 TeacherGradingManualReviewPage 210–233 行。Figma 只取功能，不复制色值、局部字体或布局像素。

## API 与事实边界

从 `components/prism-next/score-review.tsx` 导出 ScoreReview、ScoreReviewProps、ScoreReviewState、ScoreReviewDraft、ScoreReviewRecord、normalizeReviewScore。

- `studentName / questionLabel / examNumber / eyebrow / progress`：宿主提供身份、可选小标及题项进度；缺失身份与考号显示「未提供」。`confidencePercent` 使用 0–100，缺失、非有限或越界值显示「置信度 未提供」；`confidenceLabel` 可显式传「低置信度」，组件不设置阈值。
- `answer`：OCR 原文，复用 DraftMathPreview；支持 `\(...\)`、`\[...\]` 公式，非公式文本保留。缺失显示「OCR 文本未提供」。组件不识别图片、不判断数学结论。
- `paper?: PaperPreviewProps`：完整复用既有原卷组件和区域定位；省略时只呈现评分面板。960px 容器以上左右排列，否则原卷在上、评分在下。`locationNotice` 仅展示宿主确认的定位事实；真实宿主可传「左侧已定位原始笔迹区域」，窄容器宜使用不含方位的文案。当前页面仅有区域框，明确说明原始笔迹图像未接入，不将框选当作已获得扫描原件。
- `maxScore` 必需且有限、非负；`step` 默认 1，必须有限且大于 0，支持 0.5。无效配置锁定评分编辑和提交，显示原因。`score` 非 undefined 时受控，null 为空；否则本地草稿从 defaultScore（默认 null）初始化。草稿钳制到 0..满分并按从 0 起的步长就近取值，满分端点可达；源 AI 分数与历史回执从不被钳制。
- `onScoreChange(number|null)` 接收规范化草稿；受控宿主须回传。`aiSuggestion` 提供 score/reason/basis；无效或不符合当前步长的 AI 分数保留原值展示但不可接受。接受建议先发 onScoreChange，再发 onAcceptAi(score)；非受控同步本地草稿，均不保存。
- `reason / defaultReason / onReasonChange` 支持受控与非受控理由；`showReason` 默认 false，`requireReasonOnChange` 默认 false。开启必填策略时总显示理由字段；比较 baselineScore（优先）或有效 AI 建议，分数不同或基准未知时要求非空白理由。返回基准分数后理由可选，不擅自清空已填写内容。
- `state` 默认 `{kind:'ready'}`；saving 锁定编辑、接受建议、保存与前后导航；failed 显示 reason 和「重试保存」；saved 使用回执的 score，锁定编辑与重复保存。只有回执明确 `auditUpdated:true` 才显示「审计记录已更新」，否则明确审计状态未提供。`disabledReason` 锁定编辑与操作并显示原因。
- `onSave / onRetry({score,reason})` 只发当前有效草稿（理由去除首尾空白），共享同一门禁；失败后允许修改草稿再重试。重试的请求关联、幂等性与权限由宿主负责。缺少回调时对应按钮禁用；onPrev / onSkip 可选，均不自行导航。保存、审计、结果与历史不随点击推进。
- `history` 可选，提供过去的 id/score/reason/time；coss Collapsible 折叠展示，不从当前评分产生新记录。
- 宿主按复核对象身份设置 React key（学生/题目/版本变化时重新挂载）或受控重置 score/reason；保存请求的版本、权限、过期判断、离开未保存提示、审计执行与下一题选择均属于宿主。组件不导入 Workspace 类型或 Store。

## 夹具与验证

页面提供可编辑 62% 主面板、调整为 7 分的理由门禁、0.5 分非受控评分、保存中、失败重试、成功回执、未知置信度、公式作答、历史、320px 开关，以及三主题 320px 长中文。夹具动作只报告请求，不把点击变成保存成功。所有可换行的新增 coss Button 同时含 h-auto 与 sm:h-auto。

新增小文件测试覆盖范围钳制、步长、受控/非受控、接受建议、保存与重试理由门禁、保存中禁用、未知置信度、精确意图回调及 PaperPreview/AgentItemReviewer/AgentReviewQueue 复用回归；真实构建路由测试检查所有状态、主题与禁用词。SSR 回调探针不等同 DOM 或浏览器验证。

**ESCALATE：本轮真实浏览器验收被自动审批拒绝。** Chrome 打开本地 5173 返回 browser security policy / user declined permission，未尝试绕过。三主题实际配色、320px 视觉与触控、键盘输入/焦点、公式客户端渲染、区域定位滚动与折叠交互仍待 Supervisor 浏览器验证。真实保存/审计服务、移动设备、读屏器与 Workspace 接入未验证。数字及原始日志见 `/tmp/prism-score/Report.md`、`checks/`。
