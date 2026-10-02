# QuestionInspector · C1 组件契约

2026-10-02 · PO 已批准新增目录；Builder 实现，独立 Review 待 Supervisor。入口 `/next/components/question-inspector`，实现 `components/prism-next/question-inspector.tsx`。

## 复用依据

本批为 PO 2026-10-02 已批准的通用预览组件，不属于 Agent 执行组件，Beautiful UI 不适用。沿用并复核 [试卷冻结稿](paper-review-design.md) D7/D8 和[题目冻结稿](question-review-design.md)的检索记录。读取 Supervisor 本地缓存 registry（579 项）以及 particles `p-group-11`、`p-combobox-10/8`、`p-tabs-14/10`、`p-frame-1`、`p-meter-3`、`p-toolbar-1`，对照固定 coss Group、Combobox、Tabs、Badge、Frame、Meter、Toolbar 与既有 PaperPreview / DocumentRegionViewer。缓存路径为 `/private/tmp/claude-503/-Users-OLE-HermesWork-intelligence-prism-ui/1d576e28-cd27-426e-9e4f-a7e83380d382/scratchpad/audit/`。

采用相连导航、分组原生搜索、标准 Tabs/Badge、内容分区、量值与工具分组；不复制演示数据、计时器或局部视觉值。coss 没有完整三栏预览/成绩地图/单题反馈协议，因此从已冻结的宿主组合提取，不重新设计。连续纸张增强已有 PaperPreview，未另建目录。未联网刷新缓存，不声称本轮重新抓取上游。

## 公开 API

| 属性 | 契约 |
| --- | --- |
| `title`、`status`、`navigation` | 完整题号/题型标题与外部状态，previous/next/nextWrong 能力布尔值。 |
| `score` | `{value:number或null,max,text,denominator,judgement}`。文字原样显示；已知有限数值才显示 Meter，未知不当作零分。 |
| `points` | `{id,label,value,reason?,tone,status}`，原因含前缀也由宿主给；不从得分反算结论。 |
| `evidence`、`confidence?`、`knowledge` | AI 依据、置信度与标签；缺置信度显示“未提供”。唯一 AI 三色线沿用冻结令牌。 |
| `comparison` | `{id,label,text,value:number或null,max,ariaLabel}[]`；宿主负责班级人数、比例和计算口径。 |
| `actions`、`onIntent?` | `{id,label,primary?,disabled?}[]`，宿主最多提供一个 primary；无回调或禁用时不可操作。点击仅发 ID，状态、得分不改变。 |
| `onStep(delta)`、`onWrong`、`extraLink?` | 相邻题/下一错题意图；额外链接完全由宿主决定，不内置路由。 |

Frame/Header/Footer、ScrollArea scrollFade、Meter、Badge 和标准按钮保持冻结结构；text-score-display 仅用于本题得分。单个学生单题反馈，不承担全班分析的业务计算或教师评分保存。第二批可在外层组合全班分析并复用本组件。

## 验证与边界

组件页提供三主题、320px、长中文与公式夹具；自动测试覆盖受控事实、意图与渲染。冻结页默认及六种附加状态采用重构前 SHA-256，原有 `paper-review-v1.sha256` 不变。浏览器三主题、窄容器、焦点、触摸和视觉签名由 Supervisor 验收；不声明真实服务、移动设备或读屏器已验证。
