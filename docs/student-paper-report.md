# Student Paper Report 学生整卷报告 · P16

PO 2026-10-05 批准新增；入口 `/next/components/student-paper-report`。Builder 实现，独立 Review 由 Supervisor 执行。

## 实施前复用依据

本轮离线阅读固定 coss Frame / Meter / Progress / Button、Prism Badge、ReviewMeter、QuestionInspector，以及 Workspace 的 `StudentPaperInspector.tsx` / `ai-student-model.ts`（只读）。coss Frame 提供分区，Meter 表达已经存在的统计量，Progress 表达过程，不适合失分原因分布；直接组合 Frame、ReviewMeter 与标准 Button / Badge。

particles 的 `p-frame-1`、`p-meter-3/4` 和 `p-progress-1/2/3` 依据来自仓库 `docs/question-inspector.md`、`docs/score-review.md`、`docs/stepper.md` 已记录的检索；其历史 `/private/tmp/claude-503/.../audit/` 缓存本次未找到，未重新读取注册源码，也未联网核验数量或最新能力。Beautiful UI 的 Approval Card / Recommendation Card 依据来自 `docs/score-review.md`：分别是执行前问答与建议接受，不能承担四档统计、归因分布和整卷报告；本次未复制第三方代码。QuestionInspector 是当前单题呈现，扩展成整卷报告会混合两种数据契约，因此按已批准的 P5 新增此组件，复用其 ReviewMeter 和 AI 来源令牌，不改既有组件。

## 公开 API

从 `components/prism-next/student-paper-report.tsx` 导出 `StudentPaperReport`、`StudentPaperReportProps`、`StudentPaperReportCounts`、`StudentPaperReportCause`。

| 属性 | 契约 |
| --- | --- |
| `title? / studentName? / status?: ReactNode` | 标题默认“整卷报告”；学生和状态缺失明确显示“未提供”，不按得分或待办数生成状态。 |
| `score? / maxScore?: number \| null` | 外部总分与满分。缺失或非有限/负数显示“未提供”，0 是已知事实。不会从每题计数或失分反推总分。 |
| `counts?: StudentPaperReportCounts` | `full / partial / wrong / unanswered / unprovided` 均为可选 `number \| null`。四档固定呈现全对/部分对/错/未作答，缺失项显示“未提供”；unprovided 有值时另行显示未提供题数。数量须为非负整数。 |
| `complete?: boolean / provided?: number \| null / coverageText?: ReactNode` | complete 严格为 false 时默认“仅统计已提供的 n 题”；n 缺失则“统计范围：未提供”。true 不显示缺失范围提示；undefined 明确范围未提供。coverageText 可替换该提示，组件不根据计数推断完整性。 |
| `causes?: readonly StudentPaperReportCause[]` | 条目 `id / category: ReactNode / count? / lost? / meter?`；count 为题数、lost 为失分；meter 为外部明确提供的 `{ value, max, label }`。Meter 只在 0 ≤ value ≤ max 且 max > 0 时显示，否则显示“分布量值未提供”。不会按最大分类、总分或计数计算条形比例。 |
| `totalLost? / missingCauses? / unattributedLost?: number \| null` | 已提供统计范围内的失分总量、错因未提供题数、未归因失分。缺失不补 0、不计算加总。 |
| `causesEmptyText?: ReactNode` | 无分类时默认“未提供”。只有宿主确认本卷没有失分，才传“本卷没有失分”。空数组不自动等于没有失分。 |
| `analysis? / analysisSource?: ReactNode` | AI 分析内容与来源说明；内容缺失显示“未提供”，来源默认“AI”。保留文字和 MathML，不生成分析；装饰细线沿用 `--brand-ai-gradient`，同时有可读 AI 标识。 |
| `pendingCount?: number \| null / pendingText?: ReactNode` | 显示宿主待办事实；未知显示“待办题数：未提供”，0 显示“待办 0 题”。pendingText 可替换提示；只有已知正整数待办数才展示定位按钮。 |
| `onFirstPending?: () => void / firstPendingDisabledReason?: string` | “定位第一道待办题”只发意图。缺回调或存在禁用原因时禁用并通过 aria-describedby 关联可见原因；点击不减待办、不改报告、不导航。 |
| `footer?: ReactNode / className?: string` | 底部说明插槽与宿主布局类；不包含业务步骤、保存或发布逻辑。 |

数值校验仅防止无效量值进入视图，不改变外部统计定义。统计完整性、每题判定、归因聚合、条形分母、待办目标与权限全部由宿主负责；运行时代码不导入 Workspace 类型、Store、路由或执行器。

## Workspace 对应

将 `StudentPaperInspector.tsx` 的 reportMode 分支内整卷报告替换为 `StudentPaperReport`，保留既有外层检查器、滚动区、当前题目分支与宿主导航。`ai-student-model.ts:studentReport` 仍由宿主调用；其 counts/complete/provided/causes/totalLost/missingCauses/unattributedLost/aiAnalysis 映射同名事实属性。provided 为 0 时由宿主将未成立的四档统计映射为 null，而非传伪零。

现有 `Math.max(...report.causes.map(...))` 留在宿主，用于构造每个 cause.meter 的 value/max/label；组件不做统计。reportTotal / reportRow.max 映射 score/maxScore，status 原样传入，pending/onFirstPending 映射待办协议；`entry === 'ai'` 的“整体分析”说明由宿主放进 footer，不把业务阶段搬入组件。Workspace 本轮只读，尚未接入。

## 验证与浏览器清单

独立测试覆盖完整/部分/未知、真实零分、非法值、条形范围与来源、精确定位意图和禁用关联、底部插槽、三主题 320px 长中文与 MathML。自动化数字由 P16 总报告记录，SSR 不代替浏览器。

交给 Supervisor 的浏览器验收：打开 `/next/components/student-paper-report`，light/paper/dark × 320px 窄容器及桌面；检查完整/部分/未知/零失分示例的字号、分区、AI 来源、长中文和公式；点击定位只看到“已请求定位第一道待办题”，报告与待办数保持不变；禁用示例关联并显示原因；Tab/Enter 可达定位按钮、底部说明可读，条形在减少动态效果偏好下无过渡。

未验证范围：浏览器验收：按分工由 Supervisor 执行。未验证 Workspace 实际接入、真实 AI/扫描/统计服务、移动真机与读屏器。
