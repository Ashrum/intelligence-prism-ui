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
| `pointsEmptyText?`、`comparisonEmptyText?` | 对应数组为空且提供属性时，在该区标题下显示宿主文本；未传保持原 DOM，不自动推断“未提供”。 |
| `evidence`、`confidence?`、`knowledge` | AI 依据、置信度与标签；缺置信度显示“未提供”。唯一 AI 三色线沿用冻结令牌。 |
| `comparison` | `{id,label,text,value:number或null,max,ariaLabel}[]`；宿主负责班级人数、比例和计算口径。 |
| `actions`、`onIntent?` | `{id,label,primary?,disabled?,disabledReason?}[]`，宿主最多提供一个 primary；无回调或禁用时不可操作。点击仅发 ID，状态、得分不改变。实际禁用（显式 disabled 或缺 onIntent）且有非空 disabledReason 时，在动作区下方逐条显示“动作名：原因”，使用 text-ui-hint / muted 并以实例唯一 ID 的 aria-describedby 关联对应按钮；启用动作不显示原因。 |
| `onStep(delta)`、`onWrong`、`extraLink?` | 相邻题/下一错题意图；额外链接完全由宿主决定，不内置路由。 |

Frame/Header/Footer、ScrollArea scrollFade、Meter、Badge 和标准按钮保持冻结结构；text-score-display 仅用于本题得分。单个学生单题反馈，不承担全班分析的业务计算或教师评分保存。第二批可在外层组合全班分析并复用本组件。

## 验证与边界

组件页提供三主题、320px、长中文与公式夹具；自动测试覆盖受控事实、意图与渲染。冻结页默认及六种附加状态采用重构前 SHA-256，原有 `paper-review-v1.sha256` 不变。浏览器三主题、窄容器、焦点、触摸和视觉签名由 Supervisor 验收；不声明真实服务、移动设备或读屏器已验证。

## G1 · 数据不全的兼容扩展（2026-10-03）

复读本地缓存 registry 的 Button、Frame、Field 与 particles `p-frame-1` / `p-toolbar-1` 源码，以及固定 coss Button / Frame 和 Prism Button。继续用现有 Frame 分区与标准 Button，说明文字复用语义 `text-ui-hint` 和 `text-muted-foreground`；无需新组件或按钮尺寸覆盖。未联网刷新缓存；此为通用预览组件，Beautiful UI 不适用。

同类检查：evidence 与 knowledge 的“未提供”仍由宿主以内容传入，confidence 仍默认“未提供”；comparison 的条目 text 原样显示，未知数值不画 Meter。空 comparison 数组确有空标题，因此新增可选 comparisonEmptyText；两个数组本身仍为必传，未传新属性时保持原 DOM。组件页新增三主题 320px“数据不全”示例，包含评分点/班级对比空态与两条禁用原因；原长中文与公式夹具保留。
