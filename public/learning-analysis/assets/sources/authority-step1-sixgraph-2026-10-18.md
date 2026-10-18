# Step1 Six-Graph Scope v0.4

| 字段  | 内容  |
|-----|-----|
| 阶段  | OLE Step1 |
| 版本  | v0.4 |
| 角色  | Educational World Model / Scope |
| 基线状态 | Current / Approved |
| 状态总表 | [00｜OLE Step1 总体设计与状态基线](https://outline.wj985.cc/doc/00ole-step1-e3zdBslfWl) |

## 1. 强制范围

OLE 的总体架构保持八图谱口径，八图谱全部归属 L3 Educational World Model。本 v0.4 是 Step1 六图交付范围的 Current / Approved canonical owner；Phase 追溯引用 [Step1 Master Plan v0.7](https://outline.wj985.cc/doc/01step1-master-plan-v07approved-CQwebASTGw) 的 Relationship Type，不建立并列 Phase mapping。

Step1 强制交付 Curriculum、Knowledge、Question、Skill、Assessment、Evidence 六张图谱。Phase 对应关系固定如下：

| OLEPTA 对应 | Step1 六图范围 | 明确不表示 |
|-----------|------------|-------|
| `Phase 1 Baseline Delivery` | Curriculum、Knowledge、Question、Evidence；minimal Skill vocabulary 的稳定 ID / 版本；无权重布尔型 `question_requires_skill` | 不表示完整 Skill hierarchy、Measurement Profile 或 Assessment capabilities |
| `Pulled-forward Bounded Subset` | 超出 minimal baseline 且仅为 Step1 获批场景必需的 Skill hierarchy、dependency、transfer、rubric links、measurement links、knowledge / assessment mappings；Assessment Graph 的 `bounded production-ready subset` | 不表示 Phase 2 完成 |
| `Compatibility-only Validation` | Teaching Graph 接口；Capability Graph 契约、稳定引用与历史回放边界 | 不表示 Phase 3 或 Phase 4 交付 |

T1 / T2 / T3 与 Z1 / Z2 只是部署和验证坐标，不是新的 OLEPTA Relationship Type。六张图共同支撑高并发解析与批阅、结构标注、评价、Evidence Commit、诊断、相似题与变式题、练习任务和试卷任务。

Curriculum、Knowledge、Question、Skill、Assessment 五张语义图谱通过 `SemanticGraphRelease` 发布；Evidence 使用独立高频 `EvidenceCommit` / `EvidenceRecord` 流。Evidence 永不成为 `SemanticGraphRelease` 成员。两条节奏共享精确版本坐标、审计、失效、回放和可重建投影语义，但生命周期、门禁与控制动作保持独立。

## 2. Production-ready subset 标准

六图共享以下 production-ready subset 基线：

* 覆盖 Step1 获批业务场景所需的对象、关系、事件与稳定引用；
* 使用稳定 ID、不可变精确版本、状态、来源、质量、血缘、责任人与适用范围；
* 完成授权、审计、幂等、部分成功、失败恢复与影响分析；
* 支持固定历史输入与 `ExecutionCoordinateSet` 回放、差异解释和正式投影重建；
* 通过业务质量、吞吐、人工复核、组织隔离、私域驻留与垂直验证 Gate；
* 在 T1 / T2 范围内验证确切 Release 的完整分发、原子安装和本地投影；T3 只完成 Z2 / 多区县兼容性验证，不把兼容结果解释为生产准备度、容量承诺或 Phase 交付；
* 提供 Teaching Graph 与 Capability Graph 的 `Compatibility-only Validation` 材料。

Curriculum、Knowledge、Question、Skill、Assessment 各自完成 Candidate、Review 与领域版本提交；`SemanticGraphRelease` 的唯一获权 writer 再把通过门禁的五个 exact member versions 固定为一个不可变兼容集合并签发。对应图谱 Domain Owner 只拥有自身对象、关系、Proposal 与成员版本的生命周期 / 正式写入权；聚合 Release 中记录的唯一获权 release writer / 发布责任方拥有聚合 Release 的签发与 subject-action authorization，单一成员图 owner 无权单独激活整个聚合 Release。AHO 只承担具名 accountability 与批准快照；除非存在另行登记的有效委派，AHO 身份本身不授予 writer、action authorization 或 CAD ordering 权。Core v0.3 只维护跨领域共同最小声明，Central Governance 只分发已获准的确切决定与制品。

Evidence Graph 接收候选输入，经 Evidence Domain Owner 门禁后执行 `EvidenceCommit`，并以 Append、Correct、Withdraw 或 Supersede 形成不可变 `EvidenceRecord` 与追加事件。Evidence Graph 不使用 `SemanticGraphRelease`，也不建立内容发布状态机。

Private Cell 中的 Release cache、installed projection、ANN / KNN index、Read Model、ActiveSet、staging 状态、Release Bundle、`transportReceipt` 与 `enforcementReceipt` 均不取得新的顶层 canonical 业务对象资格。它们分别按 Core、Governance 与 Deployment 的既有缓存、投影、传输和审计边界处理。

## 3. 六图谱交付

### 3.1 Curriculum Graph

| 交付维度 | Step1 production-ready subset |
|------|-------------------------------|
| 对象   | 课程标准、学段、年级、学科、主题、学习目标与版本      |
| 关系   | 组成、顺序、覆盖、目标对齐及其来源与适用范围        |
| 业务支持 | 文档解析范围、题目对齐、任务目标与试卷覆盖         |
| 发布门禁 | 来源有效、结构一致、版本兼容、课程 Review、分发范围与回滚验证 |

### 3.2 Knowledge Graph

| 交付维度 | Step1 production-ready subset |
|------|-------------------------------|
| 对象   | 知识概念、表示、方法、别名与版本              |
| 关系   | 组成、先修、相关、课程对齐及其方向与依据          |
| 业务支持 | 题目映射、知识状态、诊断、相似题与任务覆盖         |
| 发布门禁 | 来源、重复、冲突、循环、映射质量、适用范围与人工抽样通过  |

### 3.3 Question Graph

| 交付维度 | Step1 production-ready subset |
|------|-------------------------------|
| 对象   | 题目版本、题干、选项、答案、解析、解法、题型与内容引用   |
| 关系   | 课程、知识、技能、评价、相似与变式的已发布关系       |
| 业务支持 | 结构化入库、批阅、检索、生成、练习任务与试卷任务      |
| 发布门禁 | 结构、答案、可解性、映射、授权、重复、组织可见性与人工复核通过 |

相似与变式结果先形成候选，完成规则校验和人工复核后进入正式关系与新版本。

每个 Question Version 必须声明 `visibilityScope = SystemPublic | TenantPrivate(orgId)`。面向任一当前组织的检索只能返回 `SystemPublic` 与该组织的 `TenantPrivate` 对象；ANN / KNN 候选召回必须在数据库执行层同时施加组织、授权、Release 与可见性约束，禁止跨组织全库召回后在应用内存过滤。

`TenantPrivate(orgId)` 的题目、关系、索引分片与投影只能分发到获准 tenant scope。`orgId`、`homePrivateDomainRef` 与 `deploymentCellRef` 是三个独立坐标：T2 / T3 中学校 `orgId` 必须属于该 District Home 的获准 tenant scope，但不得与 Home ref 等同；目标 Cell 必须同时属于 `DeploymentProfile.allowedDeploymentCells`。三者任一不匹配均 fail closed。`SystemPublic` 允许按获准范围复用，但不取消运行时的组织、用途和授权校验。

### 3.4 Skill Graph

| 交付维度 | Step1 delivery boundary |
|------|-------------------------|
| 对象   | Phase 1 minimal Skill vocabulary（稳定 ID / 版本）；按获批场景前置的有限技能定义、层级与量规引用 |
| 关系   | Phase 1 `question_requires_skill` 映射；按获批场景前置的有限分解、依赖、迁移、知识与评价映射 |
| 业务支持 | 题目分析、评价、诊断支持、训练与任务生成    |
| 发布门禁 | 定义可观察、关系可解释、测量引用完整、范围、兼容与复核通过 |

minimal Skill vocabulary 与 `question_requires_skill` 属于 `Baseline Delivery`。Step1 基线中的 `question_requires_skill` 是无权重布尔型有向关系：关系存在只表达 Question Version 对 Skill Version 的准入要求，不承载掌握概率、衰减、贝叶斯先验、测量权重或其他连续参数。超出该 baseline 的有限层级、依赖、迁移、量规、测量及知识 / 评价映射仅在 Step1 获批场景必需范围内作为 `Pulled-forward Bounded Subset` 交付；该有界扩展不构成完整 Skill hierarchy、Measurement Profile 体系或 Phase 2 完成。

### 3.5 Assessment Graph

| 交付维度 | Step1 bounded production-ready subset |
|------|---------------------------------------|
| 对象   | 构念、评价任务、量规、评分规则、诊断资产、结果语义与版本          |
| 关系   | 题目、知识、技能、证据类型、适用范围与解释限制               |
| 业务支持 | 批阅、评价、诊断输入、变式题校验和试卷任务                 |
| 发布门禁 | 构念、评分、解释限制、人工责任、校准、兼容与回放验证通过          |

诊断模式、诊断标签及其他诊断资产作为 Assessment Graph 中的版本化资产管理；具体发生记录作为 Evidence Graph 中的 Evidence 管理。Learning Diagnosis Engine 只能基于已提交 Evidence 与获准诊断资产形成独立 `DiagnosisHypothesis`。仅当 Step1 获批场景必需且落入 Assessment Graph 的 `bounded production-ready subset` 时，`EvolutionPattern` 经 Education & Measurement Review 后才可形成 `DiagnosticAssetCandidate`；其仍须由 Assessment Domain Owner 完成领域提交后才取得诊断资产资格。

### 3.6 Evidence Graph

| 交付维度 | Step1 production-ready subset |
|------|-------------------------------|
| 对象   | 经 `EvidenceCommit` 提交的不可变 `EvidenceRecord`，覆盖 Direct Observation、Normalized Observation、Assessment Result、Human Correction 与 Derived Evidence Summary；原始作答、feedback、候选和上下文仅作为上游引用 |
| 关系   | 学习者、任务、题目、评价、来源、时间、组织与处理血缘    |
| 业务支持 | Learning State、Learning Diagnosis、任务回流、验证与历史回放 |
| 提交门禁 | 来源、授权、完整性、质量、Evidence Type / schema 版本、精确 ECS、Home / Cell fence、撤回与影响范围通过 |

学生级 `EvidenceRecord`、原始与派生 Payload、`LearningStateSnapshot`、`DiagnosisHypothesis` 默认驻留在 Home Private Domain。T1 的正式 Evidence writer 位于 School Private Cell；T2 / T3 的正式 writer 位于 District Home Cell，School Edge 只形成 provisional envelope / checkpoint，不创建 canonical Evidence 或 `domainCommitKey`。

## 4. 共同建模、坐标与边界原则

* 每个正式对象使用稳定 ID、独立精确版本、来源、状态、责任人与适用范围；租户范围对象与事件传播不可变 `orgId`。
* 每条正式关系记录来源、方向、版本、质量、复核，以及适用的 Release 或 Commit 信息。
* 候选对象、候选关系、模型结果和检索邻近进入 Proposal / Review；候选和 projection 不取得正式事实资格。
* 图谱对象、Evidence、学习状态、诊断假设、行动与能力资产分别建模。
* `LearningPackageVersion` 的 Content Manifest 只组合 Curriculum、Knowledge、Question、Skill、Assessment 五张语义图谱的已发布内容对象；学生级 `EvidenceRecord` 永不进入该 Manifest。
* Curriculum、Knowledge、Question、Skill、Assessment 分别版本化，并由 `SemanticGraphRelease` 固定兼容成员集合；Evidence 通过独立 Commit Stream 提交。
* 每次 `EvidenceCommit` 与每条 `EvidenceRecord` 固定 `executionCoordinateSetRef`、`semanticGraphReleaseRef` 和 `ruleSetReleaseRef`。后两个直接字段必须与 ECS 中的同名坐标 exact-ref / digest 精确相等；它们是 lineage / query mirror，不形成第二份运行权威。`ExecutionCoordinateSet` 是 `ProcessingProfileVersion`、`DeploymentProfile`、`CapacityProfile` 三个精确引用的唯一权威载体；为查询保留的直接 `processingProfileRef` 只能是与 ECS 精确相等的 non-authoritative projection，不复制 Deployment / Capacity 的第二份权威引用。
* 原始事实采用追加版本；纠正、撤回和替代形成新记录、事务 Outbox 事件与影响评估。
* Central Governance 不成为语义图谱 Domain Owner 或学生数据 owner；Private Cell cache / projection 不改变 canonical ownership。
* 默认禁止跨域数据库表复制、跨区县学生级强一致事务、中心学生业务主库，以及学生级 Evidence / State / Diagnosis / Payload 的跨区县读取、联表或可逆重识别。

## 5. 双节奏、发布分发与提交链

### 5.1 `SemanticGraphRelease`

Curriculum、Knowledge、Question、Skill、Assessment 各自完成 Candidate、Review 与领域版本提交；对应 Domain Owner 只写自身对象、关系、Proposal 与 member version。聚合 Release 中记录且 Registry 可解析的唯一获权 release writer / 发布责任方校验五个 exact members、Review、scope、rights、依赖和回滚目标，并原子签发不可变 `SemanticGraphRelease`。Evidence 保持独立 Commit Stream，不进入该 Release。

exact Release 签发后，每个 control action 仍须取得 terminal `ReviewDecision(Action=Accept)` 与绑定该 Release、当前 action 和作用范围的 typed Handoff。Central Governance 只分发获准 Release、决定与签名材料；Private Cell 完整校验 exact ref、`contentHash`、签名、依赖闭包、组织 / Home / Cell scope 与兼容后 staging，再按 [Contract Governance v0.3 §§7.1–7.2](https://outline.wj985.cc/doc/07contract-governance-v03approved-LcaGdKiXeB) 和 [Deployment & Scaling Architecture v0.1 §§8–9](https://outline.wj985.cc/doc/13ole-step1-deployment-and-scaling-architecture-v01approved-vDXsatCB5R) 原子激活。

`SemanticGraphRelease` 固定五张语义图谱的 member versions、依赖、作用范围、完整性摘要、审批、发布时间、回滚目标和 `domainCommitKey`。任一 member 变化或回退都必须形成或选择另一个 exact Release；不得原地改写成员或 `contentHash`。Release cache、installed projection 与 index 必须可由 exact Release 和正式来源完整重建，不是 canonical source。

Release 分发前必须证明 Release 及全部 member / dependency 的 visibility、content-rights、purpose、alias、embedding 与 index shard 均落在目标 `DeploymentProfile.applicableScope`、Home tenant scope 和 allowed Cells 的交集内；任一外组织 `TenantPrivate` artifact 或跨 scope 依赖均使整包 Reject / Quarantine。不同组织范围必须签发或选择另一个 scope-closed exact Release，查询后过滤不能补救越界分发。

Release Bundle 只是 non-canonical、content-addressed 传输封套，可以携带 exact refs、hash、签名副本、依赖、顺序与 canonical decision 引用；不得产生或延长批准、scope、offline authority、control sequence、Rollback、Kill Switch 或生命周期，Runtime 不读取 Bundle。

#### `SEMANTIC_GRAPH_RELEASE` 控制应用登记

| 项目  | 规范映射 |
|-----|------|
| `subjectType` | `SEMANTIC_GRAPH_RELEASE` |
| subject authorizer | 聚合 Release 中记录、Registry 可解析且唯一的获权 release writer / 发布责任方；member owner 只写自身版本，AHO 只承担具名责任 / 批准快照，Central、Cell、Bundle 与本文档均不取得签发权 |
| `authorityDecisionRef` | 指向签发后形成的 terminal `ReviewDecision(Action=Accept)`；typed Handoff 固定 Release exact ref / digest、当前 action、org / Home / target Cells、scope / purpose / input category、activation mode、effective window、action effect、`revokeInFlight`、owner authority、AHO snapshot 与适用 `explicitReversesRef` |
| 允许动作 | `ACTIVATE`、`RESTRICT`、`ROLLBACK`、`RETIRE`、`KILL_SWITCH` |
| 禁止动作 | `WITHDRAW` 及 typed Handoff 未明确授权的动作 |
| `revokeInFlight` | `ACTIVATE`、ordinary `ROLLBACK`、`RETIRE` 为 `false`；`RESTRICT` 显式取值；`KILL_SWITCH` 为 `true` |
| Scope normalization | 与可能相交的 Rule、Profile、Offline 和 Re-home subject 使用 [Contract Governance v0.3 §5.1](https://outline.wj985.cc/doc/07contract-governance-v03approved-LcaGdKiXeB) 的同一规范化与 lane 语义 |
| 应用语义 | 完全沿用 [Contract Governance v0.3 §§7.1–7.3](https://outline.wj985.cc/doc/07contract-governance-v03approved-LcaGdKiXeB)，不新建 graph-specific decision、sequence、ActiveSet、slot、fence、epoch 或 receipt |

图谱专属不变量是：只有完整、scope-closed、已 staged 且 projection / index ready 的 exact Release 才可按当前 terminal-`APPLIED` 状态对新运行可见；部分安装、摘要 / 签名 / 依赖 / scope 错误、历史 receipt 或 `transportReceipt` 均无效。新 Live Admission 对完整 ECS tuple 的原子检查以 [Core Processing Contracts v0.3 §4.4](https://outline.wj985.cc/doc/03step1-core-processing-contracts-v03approved-KSe6X34mvu) 为准。Rollback 必须固定另一个已获准且完整 staged 的 exact Release，并以 `explicitReversesRef` 指向被反转决定；禁止 `latest`、alias 或运行时 fallback。

### 5.2 Evidence Commit、失效与驻留

Evidence 使用独立于 `SemanticGraphRelease` 的高频 Commit Stream。原始作答、feedback、任务与上下文先形成可追溯候选或正式上游事实；Assessment Domain Owner 提交 `GradingResult`，Evidence Domain Owner 再在 Home Private Domain 校验授权、类型 / schema、完整 ECS、组织与当前提交资格，并以 `domainCommitKey` 幂等形成 `EvidenceRecord`、提交台账、事务 Outbox 和下游影响范围。Correct / Withdraw / Supersede 采用追加语义并阻断旧依据参与新决策。

`EvidenceTypeVersion`、feedback 映射、ECS mirror、双台账、Outbox、失效、successor CAS、event-time、consumer watermark、反循环与回放的 canonical contract 以 [Core Processing Contracts v0.3 §§2.1、7、12](https://outline.wj985.cc/doc/03step1-core-processing-contracts-v03approved-KSe6X34mvu) 为准；Review、control sequence、offline authority 和 Cell fence 以 [Contract Governance v0.3 §§6–7](https://outline.wj985.cc/doc/07contract-governance-v03approved-LcaGdKiXeB) 为准；物理驻留与同步以 [Deployment & Scaling Architecture v0.1](https://outline.wj985.cc/doc/13ole-step1-deployment-and-scaling-architecture-v01approved-vDXsatCB5R) 为准。

Home Private Domain 只向 Central 与其他 District 同步策略允许且不可逆去标识化的质量、容量、成本、失败与治理健康聚合；接收方不接收 canonical `EvidenceRecord`、学生级稳定引用、原始或派生 Payload、State、Diagnosis，也不得形成跨区县学生轨迹连接键。

### 5.3 断网、重复与缺口

Semantic Graph Release application 与 Evidence Commit 复用 Contract Governance v0.3 §§5.1、7.2–7.4 的连续 `controlSequence`、signed offline authority、fence、gap recovery 与 re-home 语义；Run / ECS / Domain Commit 幂等以 Core Processing Contracts v0.3 §§4–7 为准；物理 Cell application 以 Deployment & Scaling v0.1 §§9.5–9.6 为准。本页不建立独立的 lease、sequence、fence 或 recovery 状态机。对六图范围，gap、authority expiry、digest 或 scope 不一致均 fail closed；既有 Run 保持 immutable ECS，恢复或重处理按上述 canonical source 创建新的精确执行引用。

## 6. Step1 里程碑

Milestone 与 Gate 的规划权威为 [Step1 Master Plan v0.7 §10](https://outline.wj985.cc/doc/01step1-master-plan-v07approved-CQwebASTGw)。本规范只固定六图在各里程碑的专属贡献：

| 里程碑 | 六图专属贡献 |
|-----|--------|
| M0  | 六图对象、双节奏、版本、控制、驻留与回放边界进入预登记 |
| M1  | 六图参与高优先级纵向切片，Review、Evidence Commit 与历史回放可运行 |
| M2  | Curriculum、Knowledge、Question、minimal Skill vocabulary / `question_requires_skill` 完成 `Baseline Delivery`；Skill 有界扩展与 Assessment 有界子集按 `Pulled-forward Bounded Subset` 发布；T1 / T2 验证 exact Release 与私域 Evidence |
| M3A / M3B | 六图分别支撑 Question / Assessment 发布，以及 Package / Task、State / Diagnosis 与 Evidence 回流 |
| M4  | 六图完成联合验证；T3 / Z2、Teaching 与 Capability 只形成 compatibility-only evidence，不形成容量、Production 或 Phase 完成声明 |

拓扑、容量组合与证据方法分别以 [Deployment & Scaling Architecture v0.1](https://outline.wj985.cc/doc/13ole-step1-deployment-and-scaling-architecture-v01approved-vDXsatCB5R)、[High-Throughput Benchmark Plan v0.3](https://outline.wj985.cc/doc/11high-throughput-benchmark-plan-v03approved-fK3n2fvpUP) 和 [Step1 Vertical Validation Plan v0.3](https://outline.wj985.cc/doc/12step1-vertical-validation-plan-v03approved-qjle8hmhHO) 为准。本规范不定义线上 workload authority、资源预算或 Gate 状态。

## 7. 状态与写入所有权

| 信息 / 动作 | Authoritative owner / writer | 非权威参与方 |
|---------|------------------------------|--------|
| 五张语义图谱对象、关系、Proposal 与 member versions | 对应图谱 Domain Owner；在获准 canonical writer domain 提交 | Core 维护共同最小声明；Central Governance 不代写 |
| 聚合 `SemanticGraphRelease` 的签发与 action authority | Release 中记录、Registry 可解析且唯一的获权 release writer / 发布责任方 | 成员图 owner 只确认自身 member；AHO 只承担具名责任 / 批准快照；Central 只分发；Private Cell 只应用与投影 |
| Release 跨 Cell control ordering | Contract Governance 登记的 lane authority 与 `ControlApplicationDecision` | Bundle 只传输；Cell 只验证并本地执行 |
| 已提交学习观察 | Evidence Domain Owner 在 Home Private Domain 写 `EvidenceCommit` / `EvidenceRecord` | Edge 只提交 provisional envelope；Central 只接收获准聚合 |
| Minimal Learning State | Learning State Engine        | Evidence / Graph 只提供稳定引用 |
| 诊断假设    | Learning Diagnosis Engine    | Assessment Graph 提供诊断资产；Evidence 提供已提交事实 |
| 训练候选    | Similarity Training Engine   | Question / Assessment Domain Owner 决定正式发布 |
| 任务定义与执行 | L1 Task Flow                 | 图谱和 Evidence 提供固定版本引用 |

Domain Owner 的正式提交必须在同一原子边界锁定并读取当前 Home Cell control / fence state，核对 expected epoch、连续 sequence、offline lease、不可变 `orgId` 和 ECS。Central Governance、Release Bundle、Read Model、index 或投影均不能替代该线性化点。

### 7.1 T1 / T2 / T3 责任边界

Topology、Home / Ingress / Execution Cell、allowed Cells、release distribution、T3 no-production mode 与 re-home 以 Deployment & Scaling v0.1 §§4–10 为准；Run / Stage 与 Domain Commit writer 以 Core Processing Contracts v0.3 §§3、5–7 为准。Six-Graph Scope 只保留以下图谱主题不变量：

* 图谱 Domain ownership 不因 placement 改变；
* 正式 Evidence 只由 Home Private Domain 内的 Evidence Domain Owner 写入；Edge、Central、Bundle、projection 与 index 均不是 canonical writer；
* `orgId`、`homePrivateDomainRef` 与 `deploymentCellRef` 分别校验，TenantPrivate 内容只能进入获准 org / Home / Cell scope；
* T3 仅作隔离 District Cell 的 compatibility-only / no-production 验证，禁止跨 District 学生事实、TenantPrivate artifact、查询或索引混合。

## 8. Teaching 与 Capability 的 Compatibility-only Validation

| 接口  | Step1 交付 |
|-----|----------|
| Teaching Graph | 验证已发布 Curriculum、Knowledge、Question、Skill、Assessment 与已提交 Evidence 的稳定引用、版本兼容和事件订阅接口 |
| Capability Graph | 验证已发布五张语义图谱、已提交 Evidence、规则、任务、效果、范围、失败样本和回放记录的兼容契约、稳定引用和历史回放边界 |

上述交付只形成兼容性验证材料；不得创建 Teaching / Capability 的 production writer、业务数据集、跨域学生视图或新 Phase Gate。其验收不构成 OLEPTA Phase 3 教学智能能力或 Phase 4 能力资产交付。

## 9. 历史回放、投影与拓扑变化

Replay 与历史坐标以 [Core Processing Contracts v0.3](https://outline.wj985.cc/doc/03step1-core-processing-contracts-v03approved-KSe6X34mvu) §§7、18 为准；ActiveSet / generation / fence 与 re-home control 以 [Contract Governance v0.3](https://outline.wj985.cc/doc/07contract-governance-v03approved-LcaGdKiXeB) §§7.2–7.4 为准；投影分发、Cell application 与物理迁移以 [Deployment & Scaling v0.1](https://outline.wj985.cc/doc/13ole-step1-deployment-and-scaling-architecture-v01approved-vDXsatCB5R) §§8、9.6 为准。Six-Graph Scope 只保留：projection / index 必须可由 exact Release 与正式 Commit 重建；单次查询固定同一完整 generation；TenantPrivate artifact 持续保持 org / Home 隔离；拓扑变化不得改写历史引用或转移 Domain ownership；T3 不建立跨 District 学生级 Join。

## 10. 验收边界

执行场景、证据资格、Gate attribution 与 PASS / INCONCLUSIVE 规则以 [Step1 Vertical Validation Plan v0.3](https://outline.wj985.cc/doc/12step1-vertical-validation-plan-v03approved-qjle8hmhHO) 为准。Six-Graph Scope 只保留以下图谱主题硬不变量：


1. Evidence 永不进入 `SemanticGraphRelease`。
2. Release 及全部 member / dependency / rights / alias / embedding / index shard 必须完整、exact 且 scope-closed；部分安装、错误 hash / signature、缺失依赖或越界 artifact 对新运行不可见。
3. Question、关系、projection 与 ANN / KNN 候选召回在数据库执行层同时绑定 org、Release、authorization 与 visibility；跨组织命中不能由应用后过滤抵消。
4. 学生级 Evidence、State、Diagnosis 与 Payload 只驻留 Home Private Domain；Central 与其他 District 不得持有 canonical 记录或可重建连接键。
5. Bundle、cache、projection、index、Read Model 和 receipt 不取得批准、领域写入、控制排序或事实源资格。
6. Evidence Commit 必须使用 exact ECS，并通过 Home、组织、continuous control、offline authority 与 Cell fence 门禁；direct mirror 与 ECS 不等时 fail closed。
7. projection / index 必须可由 exact Release 与正式 Commit 重建；单次查询固定同一完整 generation，不允许 torn read 或历史 fallback。
8. Evidence invalidation gap 未闭合时消费者不得越过水位，同一 predecessor 不得产生两个有效 successor。
9. 不允许跨 Home CAD、跨 Cell application 事务、T1 → T2 双写窗口，或 T3 partial convergence 导致跨 District 学生事实与 TenantPrivate artifact 混合。
