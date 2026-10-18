> **Document role：Current Status & Document Index**
>
> **Outline normative baseline：11-doc CURRENT / APPROVED — 01–11**
>
> **Current milestone：** STEP1 设计完成与研发交接就绪 — DESIGN COMPLETE / HANDOFF READY
>
> **Active engineering：** [ENG｜Step1 Parsing Layer Engineering Specification v0.2](https://outline.wj985.cc/doc/engstep1-parsing-layer-engineering-specification-v02-ynFHrE7Dpw) — Draft / Derived / Non-canonical；2026-10-12 实施审阅修订稿，具体接口待冻结、编码未执行；[同源实施读本](https://outline.wj985.cc/doc/ole-v02-vLwuoLc6dR)
>
> **Annotation implementation：** [ENG Annotation｜OLE 标注体系实施草案 v0.2](https://outline.wj985.cc/doc/eng-annotationole-v02-B7J4C1yrau) — 2026-10-12 实施审阅修订稿 / Derived / Non-canonical；具体接口待冻结，试标与工程验收未执行
>
> **Six-Graph design：** [目标结构规范 v1.11](https://outline.wj985.cc/doc/eng-six-graphole-step1-v111-41EapFprfP)；[首期施工说明 v1.11](https://outline.wj985.cc/doc/eng-six-graphole-step1-v111-mIerUkFPGP) — Draft / Derived / Non-canonical；目标与施工分开维护，新增正式承载、一次性首发授权及真实验收仍待落实。
>
> **Canonical Object Registry：48 rows**
>
> **GitHub current baseline：** `main@edea7826dcc44cd62bac72ae73ed9c0eab48459a` — [六图谱审核记录清理 PR #28](https://github.com/Ashrum/open-learning-engine/pull/28) 已合并；[对应合并提交](https://github.com/Ashrum/open-learning-engine/commit/edea7826dcc44cd62bac72ae73ed9c0eab48459a) 移除 v1.11 独立审核报告及相关入口，当前六图谱正文仅保留目标结构规范与首期施工说明两份；原始审核输入和验证脚本保留。此前 v1.10 旧正文、旧审核报告及专用脚本已由 PR #27 移除，历史资料由 Git 历史追溯。解析/标注修订及 01–11 规范基线不变，PLAN 继续为 Outline-only
>
> **M0 / Gate：** DEVELOPMENT EXECUTION STOPPED / NOT AUTO-RESUMED / GATE 0–4 OPEN
>
> **Benchmark / Budget：** NOT EXECUTED / MEASURED BASELINE NOT FORMED / APPROVED BUDGET NOT FORMED / FINAL GATE NOT FORMED
>
> **Frozen source：** `docs/architecture/OLEPTAv5.1.MD` — UNCHANGED

## 1. 当前结论

**STEP1 当前设计里程碑已完成，达到首版研发交接就绪。** §4 的五项任务已依次完成：必要设计冲突已原位修正，解析任务2和跨模块难点已有明确方案，研发资料可按 GUIDE 导航取得。结论依据是规范回读、静态算例和关键业务／异常分支推演；在本轮检查范围内未发现阻断首版研发交接的剩余设计歧义。

这不表示实现、真实输入质量、容量或运行可靠性已验证。M0 及非设计执行保持停止，本次收束不自动启动编码、部署、测试或 Gate 验收。

2026-10-12 的解析实施审阅修订进一步区分已定设计边界与待冻结的具体接口。完整规范及同源读本按 §§10.2、11.2 落实最小接口冻结与阶段验收；此前的设计交接结论不等于多组并行编码的接口冻结，也不等于真实 OCR 或接收端联调通过。

2026-10-12 的标注实施审阅修订对照固定基线判断三份审核意见，补齐主张与选定结果、审核义务、恢复与背压、受限正式提交和消费门禁。Registry 的契约 Approved 与登记实现成熟度 Draft 分开记录；实际题库未接入，候选试标、流水线验收和质量／性能实测仍待执行。

2026-10-13 六图谱 v1.11 完成本轮三轮审核的 16 项取舍：4 项采纳、12 项部分采纳并修正适用前提。目标结构与首期施工拆为两份，明确标签级映射复核、完整活动集合的单活动版本、图谱就绪与评分依赖、一次性首发授权、平台就绪清单及全量/抽样审核成本。数学复算与 11 个合成活动图场景仅提供设计证据；34 组实现用例待执行。具体 schema、首发与运行能力、具名责任和真实数据/质量验证仍待落实，本稿保持 Draft / Derived / Non-canonical；Outline 当前仅保留两份 v1.11 正文；v1.10 正文、旧版审核记录及 v1.11 独立审核记录已移除；历史依据保留在 Git 历史中。

| 工作范围 | 当前成果与状态 |
|------|---------|
| 范围、对象与职责 | 保持 Step1 既定边界、11 份规范和 Canonical Registry 48 rows；未增加系统、对象、服务、Gate 或独立审批。 |
| 契约与处理链 | 一个正式 Parsing Stage 内四个 PLS 模块保持不变；按预声明评价范围组装并独立闭包交接，共享依赖约束受影响范围；不可变结果、接收方重验及全请求 pending 汇总保留。 |
| 解析任务2 | ENG v0.2 与同源读本已同步审核整改：明确声明单元、组装引用、五种事实语义、请求级恢复及当前资格；§11.2 区分解析封存 4a 与真实接收端联调 4b。具体接口冻结、真实主 OCR 与工程验收仍待落实。 |
| 质量与可靠性设计 | 明确公式比较支持域、Unknown 与资源耗尽处置、自动处理／校准失效、固定指标分母；区分消息重投与语义回放，补齐备份恢复前的受信对账要求。 |
| 文档与研发协助 | 01–11 连续规范索引保持不变；ENG 与同源实施读本共享 15 个实施章节，§10.2 维护接口绑定和验证责任；GUIDE 保留 31 个环节、每环节七项说明，§§1.5–1.6 提供资源和难点入口。 |
| 工作台 Agent 设计 | [v1.0正式设计基线](https://outline.wj985.cc/doc/eng-workspaceole-agent-v10approved-design-18ZheEyVTq)已发布，Approved Design / Derived / Non-canonical；批准人Ashrum，2026-10-15。WB-Gate 0实现与验证待执行，三项能力CLOSED_TO_TRAFFIC；[PR #29](https://github.com/Ashrum/open-learning-engine/pull/29)已合并，完整指纹见§3.3。 |
| 六图谱结构与维护 | v1.11 分为目标规范与首期施工说明，保留六图所有权、五成员 Release 与 Evidence 独立提交；16 项意见逐项取舍（4 项采纳、12 项部分采纳），修正首发、版本、解析/评分依赖和抽样成本边界；新增正式承载及真实验收待落实。 |
| 资源与同步 | PLAN 继续为 Outline-only；解析 PR #23、标注 PR #24 成果保留；v1.11 由 [PR #26](https://github.com/Ashrum/open-learning-engine/pull/26) 发布，[PR #27](https://github.com/Ashrum/open-learning-engine/pull/27) 完成旧版文件与导航清理。当前六图谱正文统一为 v1.11 目标规范与首期施工说明两份，独立审核记录已从 Outline 移除，[PR #28](https://github.com/Ashrum/open-learning-engine/pull/28) 已同步移除仓库报告及相关入口；历史资料由 Git 历史追溯；本轮原始审核输入和验证脚本保留在仓库。 |
| 工程与实测 | 既有任务1成果保留；本次六图谱执行统计复算及 11/11 合成活动图设计检查，34 组实现用例待执行。真实题库、生产序列化/数据库/故障与容量、真实 OCR、部署或 Benchmark 未执行；Gate 0–4、Measured Baseline 与预算状态不变。 |

**可复用的既有工程材料。** 任务1制品位于 `OLE-Step1/step1-parsing-fixture-runner`，版本 0.1.0、DTO task1.v0.1。已有记录为 14/14 单元测试与 4/4 fixture/golden PASS；本轮未重跑。输入为合成 fixture，执行为 LOCAL_TEST，六类正式效果计数为 0、parserHandoffEligible=false，仅覆盖路由、stub、bypass 及局部契约，不证明真实 OCR 质量、任务2能力或生产 Gate。代码尚未纳入已记录的 GitHub main 快照；local task1.v0.1 编码不等同于 ENG 的生产序列化合同。

## 2. Authority 与同步边界

| 层级  | 当前权威与状态 |
|-----|---------|
| Frozen architecture | `docs/architecture/OLEPTAv5.1.MD`；Frozen / 不变 |
| Outline normative | 01–11，共 11 份 Current / Approved 文档 |
| Outline engineering | ENG Parsing v0.2 与同源实施读本；实施审阅修订稿 / Derived / Non-canonical；具体接口待冻结 |
| Outline annotation reference | ENG Annotation v0.2；实施审阅修订稿 / Derived / Non-canonical，具体接口待冻结，候选试标与流水线验收分层；未取得系统实现或生产验收结论 |
| Outline six-graph reference | [目标结构规范 v1.11](https://outline.wj985.cc/doc/eng-six-graphole-step1-v111-41EapFprfP)、[首期施工说明 v1.11](https://outline.wj985.cc/doc/eng-six-graphole-step1-v111-mIerUkFPGP)；Draft / Derived / Non-canonical；Outline 仅保留 v1.11 两份正文，运行及新增正式承载按实际使用条件落实 |
| Outline workspace reference | [教师工作台Agent体系规划与设计 v1.0](https://outline.wj985.cc/doc/eng-workspaceole-agent-v10approved-design-18ZheEyVTq)；Approved Design / Derived / Non-canonical；仅设计发布批准，数据库/Owner/模型未验收，真实流量关闭 |
| Repository canonical | GitHub `main@ee2940936fc081fd8924d9796f3783bae1081ac5`；[PR #30](https://github.com/Ashrum/open-learning-engine/pull/30)已合并，发布组卷一体化设计 v1.0、实施验证计划与必要附件；[PR #29](https://github.com/Ashrum/open-learning-engine/pull/29)已合并，新增工作台Agent v1.0正式设计正文及索引批准登记；[PR #28](https://github.com/Ashrum/open-learning-engine/pull/28) 已合并，v1.11 独立审核报告及相关入口已移除；六图谱当前正文仅保留 v1.11 目标结构规范与首期施工说明，原始审核输入和验证脚本保留。v1.10 旧正文、报告及专用脚本已由 PR #27 移除，历史提交可追溯。阶段索引与 GUIDE 已同步清理，解析/标注修订及 01–11 规范基线保留 |
| Evidence / Gate | Benchmark 与 Vertical 执行证据尚未产生；Gate 0–4 Open |

解析实施审阅修订由 [PR #23](https://github.com/Ashrum/open-learning-engine/pull/23) 合并，标注实施审阅修订由 [PR #24](https://github.com/Ashrum/open-learning-engine/pull/24) 合并；六图谱 v1.10 由 [PR #25](https://github.com/Ashrum/open-learning-engine/pull/25) 合并，历史稿保留在 Git 历史中；本轮 v1.11 目标规范、首期施工说明与审核记录由 [PR #26](https://github.com/Ashrum/open-learning-engine/pull/26) 发布；[PR #27](https://github.com/Ashrum/open-learning-engine/pull/27) 随后清理当前目录中的旧版文件与导航，Outline 正文、本索引与 GUIDE 同步该清理。本次通过 [PR #28](https://github.com/Ashrum/open-learning-engine/pull/28) 进一步移除 v1.11 独立审核记录及导航入口，并同步 Outline，仅保留两份当前正文；原始审核输入和验证脚本继续保留在 GitHub。PLAN《计算资源与阿里云部署方案》继续作为 Outline-only 文档，其正文排除 GitHub 同步。文档发布保持 Draft/Derived 的既定边界，不改变 01–11、Registry、M0／Gate 与 Benchmark 状态。

## 3. 当前文档索引

### 3.1 Active normative baseline

| ID  | 领域  | Current / Approved 文档 |
|----:|-----|-----------------------|
| 01  | Planning | [Step1 Master Plan v0.7](https://outline.wj985.cc/doc/01step1-master-plan-v07approved-CQwebASTGw) |
| 02  | World Model | [Step1 Six-Graph Scope v0.4](https://outline.wj985.cc/doc/02step1-six-graph-scope-v04approved-DnaJurjjtA) |
| 03  | Contract Kernel | [Core Processing Contracts v0.3](https://outline.wj985.cc/doc/03step1-core-processing-contracts-v03approved-KSe6X34mvu) |
| 04  | Contract Kernel | [Learning Package & Task DSL v0.2](https://outline.wj985.cc/doc/04learning-package-task-dsl-specification-v02approved-j55w4GPdgU) |
| 05  | Contract Kernel | [Rule DSL v0.3](https://outline.wj985.cc/doc/05rule-dsl-specification-v03approved-UG2vjVJGQi) |
| 06  | Contract Kernel | [Contract Governance v0.3](https://outline.wj985.cc/doc/06contract-governance-v03approved-LcaGdKiXeB) |
| 07  | Rule Runtime | [Rule Runtime v0.3](https://outline.wj985.cc/doc/07rule-runtime-specification-v03approved-yOsLMJNygK) |
| 08  | Rule Evolution | [Rule Evolution & Governance v0.3](https://outline.wj985.cc/doc/08rule-evolution-governance-v03approved-VyhQTdWag6) |
| 09  | Validation | [High-Throughput Benchmark Plan v0.3](https://outline.wj985.cc/doc/09high-throughput-benchmark-plan-v03approved-fK3n2fvpUP) |
| 10  | Validation | [Vertical Validation Plan v0.3](https://outline.wj985.cc/doc/10step1-vertical-validation-plan-v03approved-qjle8hmhHO) |
| 11  | Architecture | [Deployment & Scaling Architecture v0.1](https://outline.wj985.cc/doc/11ole-step1-deployment-and-scaling-architecture-v01approved-vDXsatCB5R) |

### 3.2 研发说明与工程规格

| 文档  | 状态  | 边界  |
|-----|-----|-----|
| [GUIDE｜OLE Step1 全流程研发说明 v0.1](https://outline.wj985.cc/doc/guideole-step1-v01-A95ws3PntA) | Derived / Non-canonical | 全流程研发导读；复用现有契约，说明启动、输入、处理、依赖、结束、输出与交接 |
| [PLAN｜OLE Step1 计算资源与阿里云部署方案 v0.1](https://outline.wj985.cc/doc/planole-step1-v01-Va7ez9P3mu) | Derived / Initial Bound / Outline-only | 三环境资源、服务器与 Docker 组合、阿里云服务及拓扑；本文及正文不同步 GitHub |
| [ENG｜Step1 Parsing Layer Engineering Specification v0.2](https://outline.wj985.cc/doc/engstep1-parsing-layer-engineering-specification-v02-ynFHrE7Dpw) | Draft / Derived / Non-canonical；具体接口待冻结 | 完整 DTO、序列化、恢复与下游合同；文档感知审核整改已同步，实际接口与运行证据按 §§10.2、11.2 落实 |
| [OLE 文档感知实施文档 v0.2](https://outline.wj985.cc/doc/ole-v02-vLwuoLc6dR) | 实施审阅修订稿 / Derived / Non-canonical；具体接口待冻结 | 完整规范的同源实施读本，沿用章节编号和责任边界；提供文档感知主线、实施顺序与验收入口 |
| [ENG Annotation｜OLE 标注体系实施草案 v0.2](https://outline.wj985.cc/doc/eng-annotationole-v02-B7J4C1yrau) | 实施审阅修订稿 / Derived / Non-canonical；具体接口待冻结 | 主张与选定结果对账、审核义务、恢复与背压、正式提交允许列表和效果单元键、消费门禁；候选试标与流水线验收分层，正式承载逐项确认 |
| [目标结构规范 v1.11](https://outline.wj985.cc/doc/eng-six-graphole-step1-v111-41EapFprfP) | 设计审阅稿 / Draft / Derived / Non-canonical | 六图职责、边与活动版本、可信标签、发布/消费约束、质量策略和契约变更边界 |
| [首期施工说明 v1.11](https://outline.wj985.cc/doc/eng-six-graphole-step1-v111-mIerUkFPGP) | 施工说明 / Draft / Derived / Non-canonical | W0 前置、平台就绪、候选数据与流水线、接口、审核成本、里程碑及 34 组待执行用例 |
| [ENG Workspace｜OLE教师工作台Agent体系规划与设计 v1.0](https://outline.wj985.cc/doc/eng-workspaceole-agent-v10approved-design-18ZheEyVTq) | Approved Design / Derived / Non-canonical | 自然语言/结构化入口、草稿确认与可靠交接的设计基线；WB-Gate 0准备，读取/写入/模型分别验收；批准指纹见§3.3 |


### 3.3 工作台 Agent 设计批准登记

| 字段  | 记录  |
|-----|-----|
| 正式正文 | [OLE教师工作台Agent体系规划与设计 v1.0](https://outline.wj985.cc/doc/eng-workspaceole-agent-v10approved-design-18ZheEyVTq) |
| 批准人 / 日期 | Ashrum（OLE项目发起人）/ 2026-10-15 |
| 批准范围 | 正式设计基线发布、研发交接及GitHub/Outline同步；Approved Design / Derived / Non-canonical |
| 文件及指纹 | OLE_Teacher_Workspace_Agent_Architecture_v1.0.md；139090字节；SHA-256：`e857b5b253e17245f4d09f41a6e5d65ad1fc5382b7f357f31bdcbdf7a67fe4b5` |
| 审核源稿 | v0.8.3；139874字节；SHA-256：`226f83b72d035ddcdc94d7fcf5920029528df1c8d065e5c5e0f5071066d6682a`；两份最终复核PASS |
| GitHub发布 | [PR #29](https://github.com/Ashrum/open-learning-engine/pull/29)已合并；提交`5aa075bbe8404d5956fa07ac17a6788829fbf645`；[正式文件](https://github.com/Ashrum/open-learning-engine/blob/5aa075bbe8404d5956fa07ac17a6788829fbf645/stages/OLE-Step1/engineering/OLE_Teacher_Workspace_Agent_Architecture_v1.0.md) |
| 验证与准入 | 10个技术代码块与候选一致、7条目标编码断言及静态检查通过；数据库、Owner、模型与容量未实测。三项能力CLOSED_TO_TRAFFIC，生产NO-GO |

后续按WB-Gate 0 → 1a/1b → 2/3取得实现与准入证据。WB-Gate为工作台接入阶段；本次发布不改变01–11、48行Registry、M0、Step1 Gate 0–4或Budget状态，也未启动工程执行。GitHub保存字节级基线，Outline为阅读副本。

### 3.4 组卷产品设计基线 v1.0

[OLE 组卷产品与 Agent 智能组卷一体化设计 v1.0](https://outline.wj985.cc/doc/ole-agent-v10-EfO1ztuQP8)是组卷专项的唯一当前设计入口；[实施与验证计划](https://outline.wj985.cc/doc/ole-v10-dI7Pe8PdPo)作为其子文档。五张图版已作为 Outline 原生附件内嵌，研究依据和历史稿可从正文访问 GitHub 固定提交。

| 字段  | 记录  |
|-----|-----|
| 状态与范围 | Approved Design / Derived / Non-canonical；唯一产品负责人授权设计发布及 GitHub/Outline 同步 |
| 发布  | 2026-10-16；[PR #30](https://github.com/Ashrum/open-learning-engine/pull/30) 已合并；提交 `ee2940936fc081fd8924d9796f3783bae1081ac5` |
| 主文内容指纹 | SHA-256 `483af17935934d3f75b4d7f2b86fb3338a1276ea0ec422ffada49584115dd06e`；GitHub 保留字节基线，Outline 为同源阅读副本 |
| 首批  | 可独立使用的结构化组卷编辑器；普通教师与教研人员共用同一草稿、内容和版本 |
| 后续  | Agent 从第二批逐项准入；题源白名单、保存/不计分、持久 PDF、权限与真实使用按对应证据验证 |

本次为文档发布，不改变 STEP1 01–11、48 行 Registry、M0/Gate、WB-Gate、Benchmark 或现行能力流量状态，也不等于接口或服务验收。

## 4. 当前设计里程碑与研发交接

**当前结论：STEP1 设计完成 / 研发交接就绪。** 以下为当前任务状态、设计依据与研发交接，不新增 M 编号、Gate 或审批流程。既有 M0–M4 仍是后续研发路线；本次工作不自动恢复非设计执行。

### 4.1 五项任务状态

| 顺序  | 设计任务 | 状态与实际产出 | 权威位置 |
|-----|------|---------|------|
| 1   | 设计质量复审与必要整改 | 已完成。检查范围、职责、对象、主链和跨文档一致性；原位修正内容绑定、规则排序责任、单元与整体交接、重投／回放及备份恢复等实际问题。 | 01、03、04、11、ENG；PLAN 只同步恢复引用 |
| 2   | 解析工程任务2设计收敛 | 已完成文档整改。任务2提前接入真实主 OCR，贯通已知模板的单页、正常跨页、共享材料、多区域作答与乱序组装；固定 observation 支路用于确定性回归；实现和真实验证待研发。 | ENG §§2.2–2.3、6.4、7.3、8、11.2–11.3 |
| 3   | 跨模块研发难点拆解 | 已完成。PL-B01／03／04／07／09 的首版设计已确定：模块检查点、序列化与持久引用、有限比较、首次分段与评价交接、质量／校准和指标口径。 | Core §§6、9.2、10.2、17；ENG §§2–7、10；Benchmark §5.2；Vertical §8.6.3 |
| 4   | 研发设计资料补齐与导航 | 已完成。资料入口、五类难点和 31 环节七项流程已同步；对象／字段、交接、状态／异常、依赖、示例及验收方法回到责任规范查阅。 | GUIDE §§1.4–1.6、2–8；ENG；PLAN |
| 5   | 设计走查与交接结论 | 已完成。对关键正常、复核、失败与恢复路径做文档及算例推演，并回读修订内容；本轮检查范围未发现剩余首版设计阻断项。运行证明交后续研发取得。 | 本节；Master §§2、5.1.1、10 |

### 4.2 完成依据与适用限度

| 目标  | 当前设计依据 |
|-----|--------|
| 稳定性 | 范围、48 个 canonical 对象及既有 owner 保持一致；阶段、版本／摘要、首次分段、最终交接及失败责任已有明确合同。 |
| 简洁性 | 保持 11 份规范，细节原位维护；一个正式 Parsing Stage 承载四个模块；复用既有 JCS／Decimal、owner、Review、提交与控制机制，无另起协议或服务。 |
| 可用性 | GUIDE 七项流程能导航到字段、依赖、输入输出、终止／恢复、静态例子及验收预期；任务2按 ENG §§10.2、11.2–11.3 落实接口冻结和分步实现。 |
| 先进性 | 可替换感知、规则治理、不可变版本／回放、私域和弹性扩容的既定能力保持有界；模块、规则与部署演进不扩大本期承诺范围。 |
| 可靠性 | 对弃权／复核、重复、迟到、终态、撤销、断连与恢复均有可判定处置；当前只确认设计及验证方法明确，可靠性须由研发运行证据证明。 |
| 研发交接就绪 | 必要设计决策已有权威入口与示例；实际版本、参数、校准、资源和验证事项按 §4.3 交接，不把实现待办误写成未定共同语义。 |

| 静态走查场景 | 可确定的处理与结束 |
|--------|-----------|
| 扫描／数字／混合内容摄取 | 按实际来源路由；扫描正式裁题须先确认模板。按用途声明范围交接：评价用途可按预声明单元独立闭包交接，Content 用途首版保持完整声明内容范围；未满足条件者按原因保留 failed／unresolved／pending，共享依赖影响关联范围，未全齐不声称全卷完成。Parser 交候选，所属 owner 审查并提交。 |
| 首次作答分段与 Review | exact Attempt、题目范围和来源先固定；既有 owner 正式化分段候选并给出精确引用／映射，Assessment 重验声明范围。Accept 只解除所覆盖的阻塞，原不可变封套和旧资格字段不改写。 |
| 解析几何与层级 | ENG 的旋转、裁剪、透视与反例可推导明确输出；结构单父无环，跨页／共享材料用关系表达，裁剪不可逆内容不伪装已恢复。 |
| 有限比较与质量决定 | 支持域、前提和获准规则不足时 Unknown；预算耗尽按既有错误／ECP 处置。统计保留失败与弃权，必需分层无有效样本不判通过，校准失效不能继续授权自动接纳。 |
| 静态内容包、任务与回流 | M3B 可使用 M2 静态题目；Definition／Instance 分别提交并冻结实际内容。作答、批阅、Evidence 及 State／Diagnosis 各按有效依据交接，Task Closed 不冒充全链成功。 |
| 题目生成与发布 | 生成候选经校验、适用 Review、领域提交和发布后才可消费；失败／撤回不阻塞 M3B 静态基线，生成与任务交付的 Gate 责任仍独立保留。 |
| 重复、迟到、终态与恢复 | 当前 token、领域幂等及 Outbox 约束正式效果；旧终态不复活，语义变化走新逻辑执行。恢复先隔离并核对受信控制及提交记录，不能只凭回滚后的本地高水位恢复写入资格。 |
| Evidence 失效与私域控制 | 下游按当前有效依据与用途检查，不因已有快照绕过失效；组织过滤、驻留、控制序列、离线租约和 Cell fence 仍是独立执行／提交条件。 |

以上是静态设计走查，未执行代码、真实样本、故障演练、容量或质量测试，不构成 Gate 0–4 通过证据。

### 4.3 后续研发交接与主线

| 研发必须落实 | 既有责任归属与取得方式 | 进入阶段与限制 |
|--------|-------------|---------|
| 真实样本、工作负载和质量目标 | 业务／数据 owner 与验证负责人按 Master §5.1、Benchmark §5.2 固定授权来源、复杂度分层、独立 golden、计算版本和验收方法。 | M0 预登记，随后纵向切片／Benchmark 实测；合成 fixture 不代替真实覆盖。 |
| 契约与执行版本实例 | Contract／Profile／Rule owner 发布并绑定实际 schema、ECP、Manifest、三 Profile 与精确引用；ENG §10 提供所需边界。 | M0 准备及后续对应实现；未完成绑定不得声明 production conformance。 |
| 解析与交接实现 | Parser、Run／Stage、作答事实及 Assessment 的既有责任方按 ENG 任务2–6和 Core 合同实现，验证引用、检查点、Review、幂等与失败分支。 | 恢复研发后从任务2继续；本轮没有编码或测试执行。 |
| 质量校准与规则能力 | Adapter／Profile owner 形成适用校准，ReviewPolicy owner 固定自动接纳与复核条件；评价／规则 owner 验证支持域。使用独立样本报告覆盖、错误与不确定性。 | 获准数据与实现就绪后的研发验证；未校准信号不取得自动接纳权，未知不自动判零。 |
| 部署、容量与恢复证据 | 部署及验证负责人按 Deployment、PLAN、Benchmark／Vertical 落实版本、地域、OCR 配额、服务器与存储，执行隔离、负载和恢复验证。 | 后续 M0／M1–M4；资源值保持 Initial Bound，实测后才形成 Measured Baseline、Approved Budget 与 Gate 证据。 |

后续研发路线仍为 Master §10 的 M0 → M1 → M2 → M3A／M3B → M4；M3B 不以 M3A 完成为前置。当前设计里程碑已收束，M0 及非设计任务保持停止，待进入研发阶段时按现有路线执行。解析修订保留 [PR #23](https://github.com/Ashrum/open-learning-engine/pull/23) 的完整规范和同源实施读本；标注正文、索引与 GUIDE 已通过 [标注整改 PR #24](https://github.com/Ashrum/open-learning-engine/pull/24) 合并并同步，具体接口待冻结、真实试标未执行。六图谱 v1.11 由 [PR #26](https://github.com/Ashrum/open-learning-engine/pull/26) 发布；当前保留目标规范与首期施工说明两份正文，独立审核记录及导航入口按本次要求移除，原始审核输入与设计复核脚本保留在 GitHub；具体 schema、一次性首发授权、平台实现和真实验收仍按实际使用前检查点落实。v1.10 正文与历史审核证据保留在 Git 历史中；Outline 旧稿及旧版审核记录已移除。PLAN 及其正文继续排除 GitHub 同步。
