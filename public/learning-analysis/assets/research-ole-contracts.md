# OLE 学情分析重设计：愿景、STEP1、Agent 与 Blueprint 基线对照

日期：2026-10-18。文档角色：研究工作底稿 / Derived / Non-canonical。只读调研，未修改产品代码、权威文档或外部发布状态。

## 1. 核心判断

建议将本轮学情分析的主线定为：**教学目标与范围 → 可核验的学习证据 → 可复核的问题/诊断假设 → 教师或管理者选择的下一轮教学行动 → 新作答与新证据 → 对照复盘。** “可干预”必须具体到谁在什么时候能改变什么，并约定如何观察结果；它不能被“AI 已找到原因”“系统自动布置”“成绩提升即证明教学有效”替代。

这条主线与 OLEPTA 的证据、状态、诊断、行动分离，以及 STEP1 的 VVP-A 批阅回流、VVP-C/D 任务生成与回流一致。它应成为同一产品与事实链上的教师、班主任、校长、集团和教育局视图，不能形成五套重复数据或五个独立诊断引擎。

当前文档支持完整设计，但不支持宣称生产链已经具备。Agent 三项 P0 能力仍 `CLOSED_TO_TRAFFIC`；Blueprint 的首条落地链仍为批阅与解析，学情分析是待展开业务视图；STEP1 的设计交接就绪不等于 Gate 通过。

## 2. 阅读清单与当前核验

行号均指下列本地正文或本次抓取快照；引用范围用于定位，不替代整份规范。八份指定本地文件共 8062 行，已分段读取；这不等于全文阅读全部 STEP1 01–11 规范。补充抓取的 Six-Graph、Core 明确按表列章节阅读，不计入全文阅读声明。所有“当前”均限定于本次 2026-10-18 抓取时点；GitHub `main` 和 Outline 链接可能后续更新，复核须同时核对下列 blob/revision。

| 来源 | 阅读覆盖 | 2026-10-18 当前核验 | 使用方式 |
|---|---|---|---|
| `/Users/OLE/HermesWork/OLE_Teacher_Workspace_Agent_Architecture_v1.0.md` | 全文 1–1283；分段读取，截断处补读 | 用户指定 GitHub main 文件 blob `c7a21b09bd561d24d38abc4e6767a1595d24389a` 与本地 `git hash-object` 一致 | 当前 Agent 正式设计基线；Approved Design / Derived / Non-canonical |
| `/Users/OLE/HermesWork/intelligence-prism-ui/docs/OLE_Agent_Frontend_Blueprint_v1.0.md` | 全文 1–1791；分段读取，截断处补读 | GitHub `Ashrum/intelligence-prism-ui` 同路径 blob `9e53ec8e7f54685f3d49d0c9b2e07a2e53b9f5d3` 与本地一致 | 当前 Blueprint v1.0 设计，不作为已实现能力证明 |
| `/Users/OLE/HermesWork/OLE-Knowledge-Base/02_Product/OLE愿景.md` | 全文 1–31 | 本地迁移的 v4.0 历史愿景摘要；未将其当现行规范 | 追溯愿景，当前口径服从 v5.1 |
| `/Users/OLE/HermesWork/ole-paper-redesign-research-2026-10-16/sources/OLEPTAv5.1.github.md` | 全文 1–2743 | GitHub `docs/architecture/OLEPTAv5.1.MD` blob `2db728e72ae86b21a90e39d3867e78870dd9d636` 与本地一致 | Frozen，2026-08-29；六层、七引擎、八图谱 |
| 同目录 `Step1_00_Index.outline.md` | 本地全文 1–158；另读当前完整正文 | 本地为 rev274，现行 Outline rev277，updatedAt `2026-10-16T10:14:00.893Z` | 本地旧索引不可当当前；本次快照见 sources/authority-step1-index-2026-10-18.md，1–172 |
| 同目录 `Step1_GUIDE_v0.1.outline.md` | 全文 1–1185 | live rev45，updatedAt `2026-10-13T03:31:22.001Z`；本地与 live `.strip()` 后逐字符一致 | Derived / Non-canonical 导读；正文非字节同一，首尾空白不同 |
| 同目录 `Step1_04_Package_Task_v0.2.outline.md` | 全文 1–325 | live rev51，updatedAt `2026-09-05T07:47:33.588Z`；本地与 live `.strip()` 后一致 | Current / Approved Package 与 Task DSL |
| 同目录 `Step1_10_Validation_v0.3.outline.md` | 全文 1–546，长表截断处另行补读 | live rev109，updatedAt `2026-09-09T02:20:52.581Z`；本地与 live `.strip()` 后一致 | Current / Approved 验证计划；不是执行报告 |
| Outline Six-Graph Scope v0.4 | 补充精读 §§1–4，并检索所有权、失效、兼容边界；非全文阅读声明 | rev53，updatedAt `2026-09-05T01:34:20.226Z`，已保存全文 231 行快照 | 核实 STEP1 六图与八图关系 |
| Outline Core Processing Contracts v0.3 | 补充精读 §§10、12.3–12.4、13、14；扫描全文章节与对象命名；非全文阅读声明 | rev150，updatedAt `2026-10-09T03:32:33.671Z`，已保存全文 721 行快照 | 核实评价、状态、诊断的 canonical 对象 |

当前权威入口：

- [Agent v1.0 GitHub 正文](https://github.com/Ashrum/open-learning-engine/blob/main/stages/OLE-Step1/engineering/OLE_Teacher_Workspace_Agent_Architecture_v1.0.md)
- [Blueprint v1.0 GitHub 正文](https://github.com/Ashrum/intelligence-prism-ui/blob/main/docs/OLE_Agent_Frontend_Blueprint_v1.0.md)
- [OLEPTA v5.1](https://github.com/Ashrum/open-learning-engine/blob/main/docs/architecture/OLEPTAv5.1.MD)
- [STEP1 当前状态](https://outline.wj985.cc/doc/00ole-step1-e3zdBslfWl)
- [STEP1 GUIDE](https://outline.wj985.cc/doc/guideole-step1-v01-A95ws3PntA)
- [Six-Graph Scope](https://outline.wj985.cc/doc/02step1-six-graph-scope-v04approved-DnaJurjjtA)
- [Core Processing Contracts](https://outline.wj985.cc/doc/03step1-core-processing-contracts-v03approved-KSe6X34mvu)
- [Learning Package & Task DSL](https://outline.wj985.cc/doc/04learning-package-task-dsl-specification-v02approved-j55w4GPdgU)
- [Vertical Validation](https://outline.wj985.cc/doc/10step1-vertical-validation-plan-v03approved-qjle8hmhHO)

当前索引内部存在一处表述时差：顶部 GitHub current baseline 仍列 PR28 提交，而 §2 Authority 已列 PR30 `ee2940936fc081fd8924d9796f3783bae1081ac5`，§3.4 增加组卷 v1.0。这里按具体文件 blob 和索引的最新专项登记判断，不把顶部旧摘要当唯一依据。未修改该索引。

复核可使用本次保存的 [当前索引](sources/authority-step1-index-2026-10-18.md)、[Six-Graph 正文](sources/authority-step1-sixgraph-2026-10-18.md)、[Core 正文](sources/authority-step1-core-2026-10-18.md)。其中“保存全文”描述抓取完整性，不表示 Six-Graph/Core 已全文精读。GUIDE/Package/Validation 的逐字符比较只去除整份文本首尾空白，没有清理正文差异。

**外部来源计数复核：** [国内底稿](REFERENCE-ARCHIVE.md)有 8 个“来源”条目；[国际底稿](REFERENCE-ARCHIVE.md)索引含 E1–E10、A1–A4、M1–M5，共 19 条。合计 27 个不同 URL，无重复。该数字指正式列入两份底稿的外部来源页面/文件，不是 27 家产品，也不包含 OLE 内部基线、失败读取或仅有搜索摘要的来源。国际 M5 只读了标明的方法章节，不能将“27 个来源”写成“27 份文档全部全文精读”。本次复核只对本地来源索引计数，没有重新检索或重新验证外部页面。

## 3. 必须保持的设计约束

| 主题 | 现行约束和定位 | 对学情重设计的直接要求 |
|---|---|---|
| OLE 的教育目标 | PTA §0.1–0.2，145–164；§1.1–1.2，319–361：教育价值优先、可审阅学习智能、人类负责决策 | 首页主对象应是待解决的教学问题与行动机会；图表服务问题，不以驾驶舱密度作为价值 |
| 证据不等于原因 | PTA §0.5，243–253；§4.1，1370–1401；Core §14，620–639 | 区分观察事实、可能解释、正式诊断假设、教学决定。展示支持/反对证据、替代解释、缺失信息和有效期 |
| 当前研发状态 | 当前 Index 1–21、23–47、§3.3 96–108、§3.4 110–122 | 设计可推进；不能把静态验收、页面 mock、文档批准标成真实服务或 Gate 已通过 |
| 六图与八图 | SixGraph §1，13–25；§3，45–111 | 总体八图，STEP1 强制六图：Curriculum、Knowledge、Question、Skill、Assessment、Evidence。Teaching/Capability 本期兼容验证，不是完整交付 |
| 双节奏事实链 | SixGraph 25、39–41、118–124；VVP §3.1 60–68 | 五语义图以 SemanticGraphRelease 固定版本；Evidence 独立提交。分析读模型引用它们，不自己写第二套事实 |
| 最小学习状态 | Core §13，603–618；VVP §10 | STEP1 不输出 skill_mastery、capability_mastery 或综合学生画像；技能只展示证据摘要，不把正确率装成能力掌握概率 |
| 冷启动与弃权 | Core 618；Package §B.6，280–293 | 缺证据显示“尚无可用依据/待采集”，不能默认零掌握、全班薄弱、伪诊断或固定最大不确定性 |
| 正式结果与部分结果 | Agent §2.1、§7，48–80、303–312；§8.1，328–340 | 完整班级结论要求完整分母、正式版本、严格水位；部分结果可以查，但不能据此称“全班最薄弱点” |
| 版本与时效 | Agent §7–8.1；Core §13–14；GUIDE §§4.4–4.7，510–640 | 数据截止、查询时间、计算时间分别表达；被修正/撤回依据先失去新决策资格，再重算，旧报告可审计 |
| 双入口 | PTA §3.6，1297–1328；Agent §§1–4；Blueprint §§3、11 | 独立学情页和 Agent 共用范围、报告、成果版本、证据详情及操作合同，不能各有一套“AI 报告” |
| Agent 首期边界 | Agent §2，32–80；§13，755–770 | 当前 P0 仅 assessment.result.query / practice.draft.create / practice.publish，且全关闭；综合分析、跨学科管理、预警订阅不是已准入能力 |
| 模型权限 | Agent §4.2，152–169；§5，198–253 | 模型只提候选；VIEW、RETRIEVE、USE_BY_AGENT、DERIVE、EXPORT、PUBLISH 分别检查。可看不自动等于可供模型分析或导出 |
| 行动与发布 | Agent §8；Package §§3、B.1–B.7；VVP §6 | 保存草稿、教师采用、内容发布、任务定义、任务实例分开。建议不是已经实施，发布回执不是学习发生证据 |
| 回流资格 | Agent §6.3，270–277；Core §12；VVP §6 反馈跃迁 | 教师反馈和操作轨迹不自动成为学习 Evidence；需现有 owner、Evidence Type、授权和提交门禁。诊断不能支持自身 |
| 跨组织 | PTA §1.7、§3.0；SixGraph 111、124；VVP §§8.7、10 | 管理角色不自动取得个人全量数据。集团/教育局优先授权的聚合投影；跨区县学生级 join、中心学生主库不在默认许可内 |
| 非数值状态 | PTA §0.5；Blueprint §8.4，557–563；Agent §10，598–634 | 无证据、未批完、过期、不可比、争议、无权限、读取失败分别显示；不能统一填 0 或“暂无异常” |
| UI 与事实分层 | Blueprint §7.1，364–377；§14 | 执行状态、成果版本/复核状态、发布状态、连接/新鲜度分别显示；一个绿色“完成”不能替代四种事实 |

## 4. 现有对象与新增提案边界

以下“已定义”表示文档契约已定义，不表示后端已实现。

| 产品概念 | 已定义的权威对象 | 本轮应怎样使用 |
|---|---|---|
| 教学/评价目标 | Curriculum/Knowledge/Skill 的 exact versions；AssessmentTaskVersion、RubricVersion | 锁定目标范围、评价目的、评分、解释限制；不要只拿题号串联 |
| 作答与评分 | Attempt、AnswerSegment、AssessmentExecution、GradingResultCandidate、GradingResult | 候选复核后才正式；报告引用确切正式结果与题目 locator |
| 可用证据 | EvidenceTypeVersion、EvidenceCommit、EvidenceRecord | five types：Direct Observation、Normalized Observation、Assessment Result、Human Correction、Derived Evidence Summary |
| 学习状态 | LearningStateSnapshot | 知识状态、Evidence Window、不确定性、版本、Freshness、Skill Evidence Summary；不得扩写综合画像 |
| 诊断 | DiagnosisHypothesis | Supported / Contested / Insufficient / Abstained / Invalidated / Superseded；结果与替代假设、用途、过期和复核绑定 |
| 复核 | ReviewPolicyRef、ReviewDecision | Accept 只解除复核阻塞，不等于 Domain Commit；Modify 不覆盖旧候选 |
| 下一轮内容 | LearningPackage → LearningPackageVersion → LearningPackageRelease | Version 固定内容；Release 控制获准使用；个体 Evidence/State/Diagnosis 不放进可复用内容 Manifest |
| 下一轮任务 | LearningTaskDefinitionVersion、LearningTaskInstance | 定义与分配独立；generation/assignment/execution/assessment 四类引用及分时授权分开 |
| 审计与执行 | ProcessingRun、ProcessingStageRun、StageExecutionAttempt、ExecutionCoordinateSet 等 | 复用既有编排和 owner；不让 Agent 自建平行业务运行时 |

来源：Core §§10、12–14；Package §§2–8、B.1–B.10；GUIDE §§4、6。当前所读 canonical 声明没有将 `AnalysisVersion`、`AnalysisReportVersion`、`InterventionPlan`、`TeachingCycle` 定义为正式领域对象。不能因为名字适合产品就把它们写成现行 Registry 条目；完整新增 owner/字段仍需后续契约工作。

建议采用三个**新增应用层契约提案**，先作读模型/成果与工作流记录设计，不直接宣告新增 canonical 类型：

1. **分析报告版本（建议名 AnalysisReportVersion）**：聚合身份、范围快照、intendedUse、exact 结果/证据引用、指标定义版本、分母/覆盖/排除、dataAsOf、连续 watermark、比较资格、来源血缘、结论与诊断引用、作者/责任人与修订链。报告叙述不是 Evidence；报告中的正式诊断只引用 DiagnosisHypothesis。
2. **教学行动计划（建议名 TeachingActionPlan / InterventionPlan）**：谁负责、面向哪些对象、问题/证据、可改变的教学要素、计划时间、教师选择理由、检查目标、后续采集与复测方案、实际执行记录。涉及练习时引用 Package/Task 对象；涉及讲解、分组、辅导、教研、课时协调时先约定相应业务承载和 Evidence 资格。采用、已排期、已实施、已完成观察、已复盘应分开。
3. **教学周期关联（建议名 TeachingCycleLink）**：把前测/本轮目标、采用的行动、后续任务、后测/新证据、复盘报告串为可追溯关系。首先可作为应用层关系与版本引用，不能成为另一套评分、Evidence 或 State owner。

不建议把所有结果塞进一个 `AnalysisVersion` 后同时承载评分事实、诊断、教师决定和效果证明；它会造成失效传播、权限和“已完成”的含义冲突。

## 5. 可干预主线如何落到五类角色

| 角色 | 首要问题 | 可直接改变的事项 | 最小可交付行动 | 结果核对 |
|---|---|---|---|---|
| 任课教师 | 我教过的目标，谁在哪一步缺少足够证据或出现稳定问题？ | 下一课讲解、示例、提问、练习、临时分组、补充采集 | 一项有责任、时间与检查目标的下轮教学安排；练习可进入现有任务草稿 | 同目标的新证据、覆盖率、配对学生变化、未改善/新问题，不自动归因 |
| 班主任 | 本班哪些跨学科问题需要协调，而非单学科加练？ | 教师协同、测评/作业节奏、学生支持、必要沟通 | 对某问题发起校内协调/支持安排，明确涉及学科和负责人 | 各学科独立口径的后续变化、问题解决进度与学生负担 |
| 校长/教学负责人 | 哪些年级/学科的教学目标、覆盖和质量需要支持？ | 教研支持、教师协作、课时/资源、测评质量整改 | 有范围和责任人的支持/整改项目 | 同口径多周期结果、执行覆盖、数据/测评质量，不能直接以分数排名评价教师因果贡献 |
| 集团校 | 哪些学校的问题可用共同资源或协作改善？ | 跨校教研、资源共享、人员支持、统一测评质量 | 机构级支持行动与局部试点 | 同一可比框架下的学校聚合结果及实施差异 |
| 教育局 | 管辖范围内哪些教学与支持条件值得优先配置资源？ | 区域教研、资源配置、薄弱环节支持、质量治理 | 指向学校/学科/目标的支持任务与复盘周期 | 授权聚合、样本与不确定性、区域差异及支持覆盖 |

这些是本轮产品建议，非已批准角色授权。班主任跨学科读取、校长校内读取、集团/教育局跨校聚合都需明确关系、目的、当前授权及最小数据。不能把“上级角色”实现成绕过 school/org scope 的 superuser。组别必须可解释、临时、可复核，不制造“学困型/粗心型/能力弱型”等固定学生标签。

管理层视图应沿着“需要支持的教学目标/问题 → 哪些学校/班级受影响 → 什么条件可变 → 责任人及行动 → 后续结果”下钻。不同试卷/难度、年级、学科、样本构成或缺失模式未具可比资格时不直接比较原始平均分；可显示并列事实和差异原因，不伪造统一质量总分。

## 6. Agent 设计建议与现行架构对照

建议自然语言与结构化入口共享以下步骤：范围选择 → 明确教学问题 → 读取合格结果/证据 → 展示结论及依据 → 教师选择行动 → 形成草稿/进入独立工作区 → 需要时明确确认后交给既有 owner → 下轮数据齐备后复盘。

| 场景 | 现有基础 | 本轮新增设计/准入工作 |
|---|---|---|
| “分析这次数学测验” | `assessment.result.query` 只读能力设计；范围与严格水位 | 确定统计聚合 owner、报告结构和证据摘要合同。不能默认 query 已提供复杂诊断或跨考试趋势 |
| “下一节课应该补哪一部分” | 正式诊断与四路径降级；静态 Question Graph 可支撑 M3B | 给出有依据的行动候选与限制；教师选择。证据不足时可建议补充检查而非立即加练 |
| “给这组学生准备练习” | `practice.draft.create`，Package/Task DSL | 固定组别及选择依据/范围/数量/目标；草稿可审阅；不能借“这组”推断未经确认的人群 |
| “发给本班” | `practice.publish` 首发单班设计 | 使用当前获准版本、目标摘要、权限与确认；不把“继续”“好”默认为发布批准 |
| “上次调整后有没有改善” | 不可变结果、Evidence、Task 及版本链 | 新增可比性与周期关联合同；报告配对样本、缺失、时间间隔、题目曝光及其他变化，不宣称因果 |
| “每天盯住所有班级并通知” | 当前 Agent P0 不包括主动定时/事件触发/推送 | 后续能力，需独立用户订阅、噪声/合并/去重/升级、权限变化与准入，不作为首期默认承诺 |
| “看整个集团学校” | 当前教师工作台会话学校固定 | 管理视图与授权聚合能力需新增设计；不得由一句 NL 指令跨组织读取 |

现行 Agent 的单小模型候选、代码预检、模板补槽、owner 交接适合这条路径；没有必要为学情另起一个自由编排的多 Agent 中枢。复核、发布、状态查询和安全重试仍走原合同；未知回执查原请求，不新建第二次干预或任务。

## 7. Blueprint UI 的落点

1. **独立学情页是完整工作区，Agent 是同一对象的会话入口。** 从学情页进入 Agent 时携带有权的明确范围/报告版本；从 Agent 打开成果时重开同一报告。会话删除不级联删除成果、正式任务或已采用证据。依据 Blueprint §§3.1–3.4，98–148。
2. **页首紧凑显示范围和待解决问题。** 教学周期、班级/学科、数据覆盖和截止时间就近可见。避免单独大标题、巨型 KPI 区和无目的图表；具体学情要求已在 §8.2，498–507，规定“范围/结论先行，证据、筛选、题目定位与后续任务”。
3. **三种模式按工作触发。** 开始问答用对话；报告审阅用窄对话+宽成果；批量核对用专注。最多两个主工作面，不常驻对话+编辑器+工具栏三列。1440/1280 桌面 P0，协作净宽≥1016；不足改为单主面；表格可局部横看，普通正文不横滚。依据 §4，150–189。
4. **推荐主工作区结构（新增提案）**：教学问题/行动机会列表 → 选中问题的证据视图 → 行动与下轮核对。不要按“概览、几十张图、AI 长报告”拆成不能连续操作的孤岛。问题详情显依据充分性、影响范围、替代解释和可做的下一步。
5. **证据详情不靠一个 Tooltip 承载。** 就近展示分母/覆盖/截止/统计口径，展开可查原题、评分/复核、Evidence 与版本；观察与推断必须分区。依据 §8.4，557–563。
6. **复用组件而非重建。** §11.1，765–782：AgentMetricSummary、AgentDistributionMatrix、AgentEvidenceDrilldown；AgentObjectPicker、AgentScopeBuilder、AgentContextSummary；AgentArtifactPreview、AgentObjectViewer、AgentChangeSet、AgentArtifactOutput；AgentExecutionConfirmation、AgentExecutionProgress、AgentExecutionResult；AgentReviewQueue、AgentItemReviewer、AgentExceptionHandler。组件只表达宿主给出的事实与意图，权限和提交归服务。
7. **轻量 Blueprint。** 细线、编号、结构标记，继承 Prism tokens/四主题，不加全页制图框、比例尺或逐行粗重装饰。来源 §5，191–277；复用顺序 Prism→coss 基础粒度→必要适配，外部项目只借机制，§11.6，835–849。
8. **测试不能停在截图。** 学情应增加数据未齐、无证据、不可比、争议撤回、权限变化、旧报告重开、Agent/独立页一致、窄屏/键盘、未知回执/重复操作等真实交互验收；Blueprint AT01–AT32 是待执行要求，不是已通过结果。

## 8. STEP1 切分建议

| 层次 | 建议交付 | 依赖与边界 |
|---|---|---|
| 第一批：独立结构化学情闭环 | 一学校/一学科/一教学目标范围的正式结果查询、覆盖/题目/知识证据、问题定位、教师记录行动、下轮结果关联与可比性复盘 | 先把统计事实、版本、水位、授权、原题定位做实；无有效 State/Diagnosis 仍可诚实提供 Evidence-only 或 Curriculum-baseline 工作流 |
| 第二批：Agent 接入 | 与独立页同一成果的自然语言查询、解释、行动草稿、现有练习草稿和逐项准入的发布 | 按 WB-Gate 0→1a/1b→2/3；结构化入口不被模型验收阻塞。新增分析能力需登记，三项 P0 本身当前也未开放 |
| 第三批：班主任/校级协同 | 跨学科问题协调、数据与测评质量、教学支持、校内责任/执行/复盘 | 先确认跨学科授权及行动 owner；不要求完整 Teaching Graph 才能做授权投影，但不能宣称完整 Teaching Intelligence 已交付 |
| 第四批：集团/教育局 | 授权聚合、比较资格、区域支持与资源行动闭环 | 分离 T1/T2/T3；T3 当前只有 no-production compatibility，不可把跨区县个体数据平台包装成首期已具备 |
| 后续研究 | 经验证的教学策略推荐、完整技能/能力测量、长期效果研究、主动提醒 | 分别对应模型/测量/Teaching/Capability 与订阅准入；不提前承诺自动策略有效或能力资产形成 |

这是建议的产品切分，不新增 STEP1 Gate，不替换 Master 的 M0→M1→M2→M3A/M3B→M4。第一批也不是立即恢复已停止的工程执行；当前任务仅研究与设计。M3B 基于静态题库可独立成立，不能等 M3A 新题生成完成才交付“下一轮教学”。

## 9. 行动与结果的测量建议

建议在报告与行动合同中预先登记：目标、适用人群、基线、观察窗口、可比评价、配对/未配对样本、缺失与排除、指标定义版本、责任人、解释限制与复盘时间。

- **产品闭环指标**：有证据支持的问题中有多少形成教师采用的具体行动；采用后实际实施比例；预定观察已到期且有可用后续证据的比例；报告到行动的时间；教师复核/改写/拒绝与负担。分母必须明确，未到观察期不算失败。
- **教育结果指标**：同目标的作答证据变化、知识状态变化（仅在模型/测量获准时）、迁移或延迟保持证据、未改善/反复问题、受益与未受益子群。不能以操作点击、发布成功或短期同题得分作为掌握证明。
- **质量指标**：证据覆盖、评分/标签正确性、复核撤回率、引用可定位率、失效传播及时性、诊断与教师判断一致/修正/弃权、不可比正确阻断、真实缺失表达、权限与导出边界。
- **归因层次**：观察到变化 → 与行动时间相关 → 在设计与假设充分时估计效果。普通前后对照只能给前两层；不能将非随机样本变化、回归均值、题目熟悉或班级构成变化归为教师贡献。

与 PTA §9.10（约2505起）一致：成功评价须记录教育与测量结果、相对非 AI 基线、校准/子群/失效与复核负担；目标数值是待验证假设。不得凭本轮设计写出“提升 X%”承诺。

## 10. 需要在总方案中明确的未决项

1. 学情报告、教学行动和周期关联的应用 owner、持久化、版本/权限、跨入口引用与失效传播合同；不能仅靠前端 localStorage。
2. 哪些“原因”是正式 DiagnosisHypothesis，哪些只是教师备注或解释候选；典型问题的诊断资产/构念/证据充分性与 ReviewPolicy。
3. 知识/技能/题型映射缺失时的可用视图；特别是多知识点题如何避免重复计数与伪精确贡献分摊。
4. 复测比较资格：同题、平行题、不同难度、不同 Rubric/规则、部分重做、题目泄露和不同参与者分别如何处理。
5. 班主任、校长、集团、教育局的现有真实角色/关系/授权接口；最小聚合单位、少量样本保护、可下钻边界及撤权传播。
6. 讲解/分组/辅导/教研/资源安排等非练习行动的实际记录方式；何种记录只是执行事实，何种经独立门禁成为学习 Evidence。
7. 现场部署与数据成熟度：本次仅完成文档/契约核验，未检查生产接口、真实学校数据、真实模型效果或运行 Gate。

本底稿建议的核心验收用例是：一名教师从一份有明确版本与覆盖的批阅结果出发，找到一项有证据的问题，选择并实施下一轮教学行动，采集新证据，在同一问题记录中判断“发生了什么变化、还不能确定什么、下一步改什么”。班主任到教育局逐层扩展的是可作用范围、协调能力和聚合比较，而非对个人结论的无限放大。
