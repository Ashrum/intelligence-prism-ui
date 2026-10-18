# Step1 Core Processing Contracts v0.3

| 字段  | 内容  |
|-----|-----|
| 阶段  | OLE Step1 |
| 版本  | v0.3 |
| 角色  | Contract Kernel |
| 基线状态 | Current / Approved |
| 状态总表 | [00｜OLE Step1 总体设计与状态基线](https://outline.wj985.cc/doc/00ole-step1-e3zdBslfWl) |


## 1. 目的

本规范是共同 Identity、`ExecutionCoordinateSet`、`ProcessingProfileVersion`、`DeploymentProfile`、`CapacityProfile`、`ProcessingRun`、`ProcessingStageRun`、Lifecycle Status / Outcome / Disposition 三轴状态及 Evidence 边界的 canonical Contract Owner。Core 只拥有这些对象的共同结构、精确引用、完整性、兼容和交接语义；Profile 实例的生命周期与写入权须由 Contract Governance Registry 登记，物理部署与运行实现不属于 Core ownership。

本规范同时维护 §§8–15 中下列对象的 Step1 最小 canonical 声明契约：`TypedObservationCandidate`、`StructuredDocument`、`QuestionCandidate`、`QuestionVersion`、`Attempt`、`AnswerSegment`、`AssessmentTaskVersion`、`RubricVersion`、`AssessmentExecution`、`GradingResultCandidate`、`GradingResult`、`EvidenceTypeVersion`、`EvidenceCommit`、`EvidenceRecord`、`LearningStateSnapshot`、`DiagnosisHypothesis`、`SemanticGraphProposal` 与 `SemanticGraphRelease`。该 ownership 固定跨领域交换所需的共同身份、必备字段、稳定引用、兼容和交接语义；对象生命周期、领域写入、质量裁决及发布责任继续由对应 Domain Owner 承担。领域规范可以增加自身参数和约束，但不得重新定义或分叉上述最小声明。

`StageExecutionAttempt` 是 `ProcessingStageRun` 下的 Stage-scoped append-only 执行子记录，不是顶层 canonical 对象，并与 §9.2 的学生作答对象 `Attempt` 严格区分。其 Start / Claim / Placement 段在创建后不可变，进度与 checkpoint report 只追加，Terminal 段由 Home Cell owner 在当前 token 下单次写入后冻结；修正或重试必须创建新的 `StageExecutionAttempt`。Processing Orchestrator 与 Private-Domain Deployment 是 cross-cutting 实现能力，不是新的 OLE Domain、Engine 或业务闭环。

Contract Kernel 是规范与可生成制品集合。获准 Profile 只固定能力、驻留、放置、容量和恢复边界；产品型号、节点数量、队列产品及超出合同边界的物理拆分由后续实现设计依据 Measured Baseline 决定。

## 2. 共同语义与约束

| 语义组 | 必备内容 |
|-----|------|
| Identity | 稳定 ID、对象类型、契约版本、对象版本与状态 |
| Scope & Authorization | 不可变 `orgId`、tenant 补充范围、Home Private Domain、用途、参与关系、对象范围、有效时间与授权快照 |
| Ownership | canonical Contract Owner 与负责领域；高影响治理事件按 Contract Governance 固定责任快照 |
| Provenance | 原始来源、派生关系、处理阶段、责任主体与时间 |
| Immutable Coordinates | `ExecutionCoordinateSet` 及其中三个独立的 Processing / Deployment / Capacity Profile 精确引用 |
| Quality | 质量维度、门槛、质量信号、校准引用与复核状态 |
| Workflow | Home Cell authoritative writer、运行、阶段、工作单元、`StageExecutionAttempt`、检查点、重试与完成状态 |
| Failure | 失败分类、部分成功、弃权、隔离、降级、恢复条件与责任人 |
| Observability & Cost | 追踪引用、审计事件、资源计量、成本归属与预算状态 |
| Compatibility & Replay | 兼容结论、迁移要求、回放关系、差异与投影重建依据 |
| Temporal Authority | 来源事件时间、受信接收时间、canonical system time、可靠排序坐标、`controlSequence`、activation generation、Cell fence epoch、Stage claim epoch 与时钟质量 |

核心处理遵循以下约束：


 1. 每次运行在开始时固定 `ExecutionCoordinateSet`。
 2. 候选、正式事实、状态快照、诊断假设、人工决策、提交与发布保持独立对象语义。
 3. 领域事实采用追加式记录；修订通过新对象、新事件和显式替代关系表达。
 4. 阶段消息采用 at-least-once delivery，领域提交采用幂等提交。
 5. Review Capability 展示必要输入与候选差异，记录人工决定并将修订结果交还 Domain Owner 校验和提交。实现形态由获批实现设计确定。
 6. 系统执行记录与学习 Evidence 使用独立身份、所有权、提交链和用途语义。
 7. 规则回滚通过切换已发布 Rule Set 引用完成，执行记录、演化知识和治理决策历史继续保留。
 8. 治理审计连续性持续保留对象 ID、版本、哈希、决定、理由、血缘、Tombstone 和脱敏审计记录。原始输入、学生数据、Trace Payload、样本正文及其他敏感内容按用途、保留期限、撤回、删除和脱敏策略处理。
 9. 所有持久状态变化、决定、领域提交、发布和审计记录使用受信服务端或数据库生成的 UTC canonical system time；客户端或来源时间仅保留为带来源与时钟质量的事件声明。
10. `ProcessingProfileVersion`、`DeploymentProfile` 与 `CapacityProfile` 是三个独立 Profile；共同身份元数据可以同构，业务处理、部署驻留和容量资源策略载荷不得重叠。
11. `orgId` 在 Run、Stage、`StageExecutionAttempt`、Checkpoint、Ledger、Outbox 与 Replay 全链不可变；`tenantScope` 只能补充作用范围，不能替代组织身份。
12. 每个 Run 只有一个 Home Private Domain 和一个 authoritative writer Cell。Ingress / execution Cell 可以不同，但不转移 Run / Stage 写入权或领域所有权。
13. Release Bundle 是 non-canonical 传输与安装封套，不进入 Core Registry，不被 Rule Runtime 读取，也不签发 Profile、离线租约、control sequence 或正式控制权限。

### 2.1 权威时间语义

| 时间或排序语义 | 规范来源与用途 |
|---------|---------|
| `occurredAt` / `capturedAt` | 来源系统或客户端声明的事件发生时间；必须保留来源、时区或 UTC 偏移、采集方式与时钟质量，不单独承担权限、生效顺序或审计裁决 |
| `receivedAt` | 受信服务端首次接收时间，以 UTC 保存，用于接收延迟、迟到与乱序判断 |
| `recordedAt` / `decidedAt` / `committedAt` | 在持久化事务内由服务端或数据库生成的 canonical system time，以 UTC 保存；用于正式状态变化、决定、提交、发布与审计记录 |
| Sequence / Version / Outbox Position | 跨记录可靠排序坐标；事件序号、对象版本、事务提交序列或 outbox position 承担确定顺序，wall-clock timestamp 不单独决定先后 |
| `controlSequence` | 在 `(homePrivateDomainRef, controlScopeKey)` 内严格单调排序已获准 canonical control / activation decision；`controlScopeKey` 的规范化算法、算法版本与冲突规则由 Contract Governance v0.3 定义，gap 未闭合时相关 Admission 与 Domain Commit fail closed |
| Activation Generation | Private Cell 本地 ActiveSet 的原子激活代次；只表达本地投影，不替代 canonical Release / Profile 引用 |
| Cell `fenceEpoch` | Home Cell 本地 slot / fence store 中的正式提交栅栏；Domain Commit 在同一原子边界校验，Central decision time 不是执行线性化点 |
| Stage claim epoch / execution fencing token | 单个 `stageExecutionKey` 的执行所有权顺序；只防止失效 Worker 写 Stage 子记录，不替代 Cell control fence |

Freshness、有效窗口和迟到判断可以同时消费来源事件时间与 canonical system time，但必须由固定版本的 Profile 明确选择字段、容忍窗口、缺失值与时钟质量策略。客户端时间不得直接扩大授权、提前生效或覆盖服务器记录。节点时钟偏移、时间同步状态和异常跳变必须进入可观察性；超过获批阈值时停止生成依赖精确时序的确定性结论，改为 `Unknown`、保守处置或 Review。

时间窗口型消费者以完成可信校验的 `occurredAt` 判定 event-time 归属，并以受信 `receivedAt` 与可靠 Sequence / Outbox Position 形成消费水位。每个投影必须记录已应用的可靠位置和上游版本；Late-arriving、Correct、Withdraw 或 Supersede 到达时，先显式标记受影响结论为 stale / ineligible，再异步补算或进入 Review。允许迟到窗口、最大补算跨度和超界处置由精确 `ProcessingProfileVersion` 固定；未获批准的客户端时间不得回推水位。

跨 Cell 控制与 Kill Oracle 使用每个 Cell 的本地持久提交位置判定，不使用跨 Cell wall-clock 构造单一全局事务。`controlSequence`、activation generation、Cell `fenceEpoch` 与 Stage execution fencing token 的作用域不可互换。

## 3. 规范所有权边界

本规范完整定义共同 Identity、`ExecutionCoordinateSet`、跨领域最小 `ProcessingProfileVersion`、`DeploymentProfile`、`CapacityProfile`、`ProcessingRun`、`ProcessingStageRun`、三轴状态、交付幂等与 Evidence 边界，并维护 §1 所列领域协作对象的 Step1 最小 canonical 声明。Core ownership 限定于共同字段、引用、兼容和交接合同；Lifecycle / write authority 由 Contract Governance Registry 登记并由既有 Domain Owner 与 Accountable Human Owner 体系承担。

`DeploymentProfile` 与 `CapacityProfile` 的定义、owner、write authority、consumer、compatibility 与 lifecycle 以 Core v0.3、Governance v0.3 及 Current Registry 的已批准组合为准。

| Profile | 唯一规范边界 | 明确排除 |
|---------|--------|------|
| `ProcessingProfileVersion` | 影响业务处理行为或结果的领域参数、semantic timeout、safe-retry 与 disposition 语义 | Topology、Residency、Egress、Queue / resource budget、Scale trigger |
| `DeploymentProfile` | Topology、Residency、Model Egress、Synchronization、Offline、Execution Placement、Failure Domain 与 Release Distribution | 业务处理参数、资源 / 队列 / 成本预算 |
| `CapacityProfile` | Workload、Admission、Queue、Fleet / Worker、Database、Storage、Network、Review、Recovery、Cost 与 Scale trigger 包络 | 业务处理行为、Topology、Residency、Egress |

三者共同的 `stableId + version + contentHash`、`applicableScope`、owner、compatibility、supersedes 与 lifecycle status 只是版本治理骨架，不表示策略字段可以重复。若同一策略字段存在多个权威来源、作用范围交集为空或兼容失败，Admission fail closed。

| 主体  | 唯一写入边界 | 禁止事项 |
|-----|--------|------|
| Home Cell 的 Run / Stage owner；由 Processing Orchestrator 受托实现 | 通过 Core CAS 持久化 Run / Stage、Admission、Queue、Claim / lease / execution fencing、Checkpoint、Retry、Placement 与 Recovery | 不定义规则语义，不提交正式领域事实 |
| Worker | 携带有效 execution fencing token 执行并回报 `StageExecutionAttempt` 与 checkpoint report | 不直接推进或持久化 Run / Stage，不创建 `domainCommitKey` |
| Rule Runtime | 写不可变 `RuleExecutionTrace`，返回 Candidate、Conflict、Abstain 与 Review requirement | 不执行 Admission、Queue、Placement、Run / Stage 转换、Checkpoint 或 Domain Commit |
| Domain Owner | 在 Home Private Domain 内校验 `orgId`、当前本地 control state / fence，以 `domainCommitKey` 原子提交正式事实与 effect Outbox | 不接受 stale epoch、sequence gap、过期 offline lease 或错误组织上下文 |
| T2 / T3 School Edge | 形成 provisional submission / preflight envelope | 不创建 canonical Run / Stage、正式 `RuleExecutionTrace`、`ReviewDecision` 或 `domainCommitKey` |
| Central Governance | 分发获准决定并接收 receipt / 去标识化聚合信息 | 不成为业务 Run writer 或学生级 canonical 数据库 |

`homePrivateDomainRef` 解析到既有组织与数据驻留权威；Home / Ingress / Execution Cell refs 解析到部署资产清单，均不形成新的 OLE 业务对象。Release Bundle 只复制获准 Release、Profile 与 canonical control / activation decision 的精确引用、摘要、签名和分发顺序。transport receipt 只是 non-canonical acknowledgement；enforcement receipt 复用追加式治理审计事件。ActiveSet、Read Model 与 telemetry 是本地或查询投影；slot / fence store 虽不进入 Core Registry，却是 Home Cell Domain Commit 的 durable authoritative local enforcement state，不得降格为普通投影。


## 4. `ExecutionCoordinateSet`

`ExecutionCoordinateSet` 是运行级不可变版本坐标集合。运行、阶段、候选、决策、提交和正式结果引用同一集合，并按需补充对象自身版本。

| 坐标组 | 必备内容 |
|-----|------|
| Contract | Core Processing Contracts、Contract Governance 及本场景启用 DSL 的确切版本 |
| Input Snapshot | 原始输入、上下文和依赖输入的不可变快照引用 |
| Authorization Snapshot | 主体、用途、范围、授权结论、评估时间和有效窗口 |
| Processing | 精确 `processingProfileRef = stableId + version + contentHash`；不得使用可变别名 |
| Deployment | 精确 `deploymentProfileRef = stableId + version + contentHash`；固定拓扑、驻留、Egress、同步、离线、放置与故障域边界 |
| Capacity | 精确 `capacityProfileRef = stableId + version + contentHash`；固定 Workload、Admission、Queue、资源、恢复、成本与扩容包络 |
| Perception | 每个启用感知适配器的 `perceptionProfileRef` 与处理器版本 |
| Rule | 不可变 `ruleSetReleaseRef`、`executionCompatibilityProfileRef`、确定性 Runtime 版本与谓词库版本 |
| Semantic Graph | `semanticGraphReleaseRef`，固定 Curriculum、Knowledge、Question、Skill、Assessment 版本集合 |
| Executor | 每类执行单元的确切 `executorBuildRef` |
| Scenario Coordinates | 本场景按条件启用的 Model、Prompt、Tool、`AssessmentTaskVersion`、`RubricVersion`、`LearningPackageVersion`、获准 `LearningPackageRelease`、`LearningTaskDefinitionVersion` 与 `LearningTaskInstance` 引用 |
| Execution Scope | 本次运行的不可变 `orgId`、用途、对象、输入类型、复杂度、时间与激活模式 |
| Registration | 坐标集合 ID、创建时间、创建主体、用途和完整性结论 |

`ExecutionCoordinateSet` 是三个 Profile 引用的唯一权威载体。Run、Stage、Trace、Evidence 或投影为了查询而保存的 Profile 镜像均为 non-authoritative projection，必须与 ECS 精确相等；不新增 `orchestrationPolicyVersion` 或第四个 Workload Profile。Live Production、Gray 与 Shadow Run 的 workload authority 只属于 `CapacityProfile.workloadBlock`；Benchmark scenario 只能作为验证输入或 `evidenceRef`，不得授权、覆盖或替代线上运行的 workload boundary。

每个场景坐标显式记录 `ENABLED`、`NOT_ENABLED` 或具体版本引用。`ExecutionCompatibilityProfile` 表达规则执行的获准兼容包络，不能替代 Deployment / Capacity Profile；`ExecutionCoordinateSet` 记录一次实际执行坐标。实际 Contract、Runtime、Executor Build、谓词库、按条件启用的 Model / Prompt / Tool 均必须满足对应 Profile，实际 Execution Scope 必须完整位于三 Profile `applicableScope` 的交集内，并避开 `knownIncompatibilities` 和 `knownNegativeTransfer`。

`ruleSetVersion` 是 `RuleSetManifest` 内的逻辑规则集版本；`ruleSetReleaseRef` 固定已批准决定、兼容 Profile、作用范围和激活模式的不可变发布封套。Production、Gray 与 Shadow 运行固定当前获准发布；获授权的 Replay 可固定不可变历史、已回滚或已退役发布，默认领域提交权限为关闭。运行开始后坐标集保持不变，后续 Rollback 只影响新运行的发布选择。

### 4.1 `ProcessingProfileVersion`

`ProcessingProfileVersion` 是跨领域业务处理参数的最小规范对象。Core 只拥有共同身份、精确版本引用、完整性、适用范围与兼容语义；OCR、评价、状态、诊断、生成或其他领域专属参数继续由相应 canonical 规范定义。

| 字段  | 规范语义 |
|-----|------|
| `stableId` | 跨版本稳定身份 |
| `version` | 不可变的确切版本；别名、latest 或可变标签不得用于正式坐标 |
| `contentHash` | 对该版本不可变内容的完整性摘要 |
| `parameters` | 影响业务处理行为或结果的领域参数、semantic timeout、safe-retry 与 disposition 语义 |
| `applicableScope` | 获准组织、用途、对象、输入、时间窗与业务处理边界 |
| `owner` | canonical profile owner 与负责维护主体的稳定引用 |
| `compatibility` | Contract、Runtime、Executor、上下游输入输出及迁移兼容条件 |
| `supersedes` | 被该版本替代的确切 Profile 引用；首版为空 |
| `lifecycleStatus` | Draft、Approved、Deprecated 或 Retired；状态变化使用治理记录或投影表达 |

`ProcessingProfileVersion` 不定义 Topology、Residency、Egress、Synchronization、Offline、Placement、Queue / resource budget、Recovery、Cost 或 Scale trigger。所有 `processingProfileRef` 必须解析到确切三元组；引用无法解析、命中可变别名、摘要不匹配、范围越界或兼容失败时处理保持未开始并产生零正式领域效果。

### 4.2 `DeploymentProfile`

`DeploymentProfile` 是部署、驻留与跨节点执行边界的版本化 Profile。其共同版本骨架与 §4.1 一致，策略载荷至少包含：

| 字段组 | 最小合同 |
|-----|------|
| Identity / Governance | `stableId`、exact `version`、`contentHash`、owner、`applicableScope`、compatibility、supersedes、`lifecycleStatus` |
| Topology | T1 / T2 / T3、node role set、`homePrivateDomainRef` 与 allowed Deployment Cells |
| Embedded policy blocks | Data Residency、Model Egress、Synchronization、Offline、Execution Placement、Failure Domain 与 Release Distribution |
| Cross-domain boundary | allowed payload types、不可变 `orgId` 传播、禁止出域对象与最小化要求 |
| Activation | activation window、依赖与 compatibility requirements |

Policy blocks 是 Profile 的不可变内嵌内容并计入 `contentHash`，不得拆出一组隐含 canonical `*PolicyRef` 对象。当前节点健康、ActiveSet、control sequence、activation generation、Cell fence、实际 execution Cell 和运行指标不进入 Profile 原 hash；它们是控制、运行或 telemetry 事实。Central Governance 只分发获准版本，Private Cell 只校验和本地激活，二者均不因分发取得 canonical definition ownership。

### 4.3 `CapacityProfile`

`CapacityProfile` 是工作负载、资源与恢复边界的版本化 Profile。其共同版本骨架与 §4.1 一致，策略载荷至少包含：

| 字段组 | 最小合同 |
|-----|------|
| Identity / Governance | `stableId`、exact `version`、`contentHash`、owner、`applicableScope`、compatibility、supersedes、`lifecycleStatus` |
| Workload block | workload unit / class、输入分布、arrival pattern、concurrency、duration、completion objective / deadline 与允许降级 |
| Admission / Queue | admission budget、queue class / partition envelope、delivery / redelivery budget、backpressure 与 fairness |
| Resource envelope | Fleet / Worker、Database、Storage、Index、Network 与 Review capacity |
| Recovery / Cost | failure budget、RPO / RTO、recovery envelope、cost attribution 与 approved upper bounds |
| Scale trigger | `signal + threshold + observationWindow + action + cooldown + upperBound + recoveryCondition` |
| Evidence | 每项指标的 `value + unit + evidenceLevel + evidenceRef` |

动态 Worker 数、Pod / machine ID、当前队列深度、实际资源消耗和健康状态不进入 Profile 原 hash；它们进入 `StageExecutionAttempt`、Run telemetry 与 Measured Baseline。业务处理的 semantic timeout / retry / disposition 不属于 Capacity；Queue delivery / redelivery 和资源恢复预算不属于 Processing。

### 4.4 三 Profile Admission 交集

Home Cell 的授权 Run / Stage owner 在 `ADMIT` 前必须对完整 ECS tuple 原子确认：


1. 三个 Profile exact refs 均可解析、hash-valid、处于 `Approved` lifecycle，并在同一当前本地 `PROFILE_ACTIVE_SET` / `activationGeneration` 中 terminal-`APPLIED`；
2. exact `ruleSetReleaseRef` 与 `semanticGraphReleaseRef` 均可解析、获准、scope-valid、terminal-`APPLIED`，Semantic Graph projection / index 已完整 ready；
3. Contract、compatibility envelope、Executor 与其他 ECS 依赖 exact available、hash-valid、获准且与全部受控 refs 兼容；这些普通依赖不因此取得或被要求取得独立 CAD；
4. Execution Scope 完整落在三个 Profile、Rule 与 Semantic Graph Release 的作用范围交集，字段无重叠权威，Home Domain、Home / allowed Cells、不可变 `orgId` 与用途一致；
5. shared scope normalization、single-lane control、continuous sequence、offline authority、ActiveSet / receipt provenance 与 Cell fence 满足 [Contract Governance v0.3 §§5.1、7](https://outline.wj985.cc/doc/07contract-governance-v03approved-LcaGdKiXeB)，Cell placement 与 projection ready 满足 [Deployment & Scaling Architecture v0.1](https://outline.wj985.cc/doc/13ole-step1-deployment-and-scaling-architecture-v01approved-vDXsatCB5R)。

部分 rollout、历史 `APPLIED` receipt、`transportReceipt`、未 ready projection 或任一 mirror / ECS 不一致均不得通过 Admission。任一条件失败时 fail closed：Run 不得进入 Ready / Running，不创建有效 Stage、Claim、Queue dispatch 或 Active `StageExecutionAttempt`，正式效果和 effect Outbox 增量均为零。确定性失格形成拒绝；sequence gap 或暂时无法证明连续控制状态保持 Paused / Pending / Quarantine 等非终态并等待恢复。

Historical Replay 只有在显式授权下才可固定不可变历史 Profile refs，且默认关闭 Domain Commit；它不得把历史 Profile 重新解释为 Live authority。

## 5. `ProcessingRun`

`ProcessingRun` 表达一次可追踪、可恢复的端到端处理运行。

| 语义  | 内容  |
|-----|-----|
| Identity | `processingRunId`、不可变 `orgId`、用途、创建主体、创建时间、`parentRunRef` 与 `replayOf` |
| Scope / Home | 可选 `tenantScope`、不可变 `homePrivateDomainRef`、不可变 `homeDeploymentCellRef` 与登记的 `ingressDeploymentCellRef`；tenant 不能替代 `orgId` |
| Workload | `workloadClass`、实际工作负载单位 / 规模 / 到达事实 / 输入复杂度，以及从 Capacity Profile 解析的 completion objective / deadline |
| Coordinates | 唯一权威 `executionCoordinateSetRef` |
| Admission Control Snapshot | Admission 时观察到的 canonical decision refs、`controlScopeKey`、`controlSequence`、`activationGeneration`、`offlineLeaseRef`、`offlineExecutionUntil`、`admittedCellFenceEpoch` 与本地状态摘要；其中 `admittedCellFenceEpoch` 是该 Run 的唯一 authoritative expected Cell fence epoch |
| Inputs | 输入快照、上下文、授权快照和父业务对象引用 |
| Stages | `ProcessingStageRun` 引用、依赖顺序与最近持久检查点 |
| Outputs | 候选、决策与正式领域结果 / commit / release / state / diagnosis / task 的稳定引用；Run 不拥有这些领域事实 |
| Budgets | 从 Processing / Capacity Profile 解析的业务、质量、成本、失败、Review、恢复与完成窗口快照，以及实际消耗 |
| Observability | 追踪、审计、资源计量、预算消耗、控制传播和异常引用 |

`ProcessingRun` 是 `orgId`、Home Private Domain、authoritative writer Cell 和 ingress fact 的运行级权威记录。`homeDeploymentCellRef` 在 Run 生命周期内不可变；执行放置变化只记录在 `StageExecutionAttempt.executionDeploymentCellRef`。三个 Profile 的权威引用只存在于 ECS，Run 中任何镜像均为可重建、non-authoritative projection。

T1 的 authoritative writer 是 School Private Cell；T2 / T3 的 authoritative writer 是 District Private Cell。T2 / T3 School Edge 只提交带 `orgId + businessOperationKey + inputHash` 的 provisional envelope，District 重新校验后注册唯一 canonical Run。只有 Home Cell 的授权 Run / Stage owner 可通过 Core CAS 写 Run / Stage；物理 Orchestrator 只是该 owner 的受托实现。 `ProcessingRun` 使用三个独立状态轴：

| 状态轴 | 取值  | 语义  |
|-----|-----|-----|
| Lifecycle Status | Registered、Ready、Running、Waiting for Review、Paused、Terminal | 表示运行所处的生命周期位置 |
| Outcome | Pending、Succeeded、Partially Succeeded、Failed、Cancelled、Expired | 表示运行已产生或尚待产生的结果结论 |
| Disposition | Continue、Retry、Review、Quarantine、Commit、Reject、Withdraw、No Action | 表示下一步获准处理方式 |

Lifecycle Status、Outcome 与 Disposition 分别记录变更时间、依据和责任主体。终态运行以 `Terminal` 配合非 `Pending` Outcome 表达；Disposition 继续保留领域提交、隔离、撤回或后续处理结论。

### 5.1 三轴合法组合与转换

下表是 `ProcessingRun` 与 `ProcessingStageRun` 的 canonical 合法组合白名单。未列出的组合均为非法组合。

| Lifecycle Status | Outcome | 允许的 Disposition | 必备不变量 |
|------------------|---------|-----------------|-------|
| Registered       | Pending | Continue        | 身份、工作负载、输入引用与坐标登记已持久化，执行尚未开始 |
| Ready            | Pending | Continue        | 授权、依赖、兼容、作用范围与预算前置检查通过 |
| Running          | Pending | Continue        | 固定坐标下存在当前 Active `StageExecutionAttempt` 引用，检查点和预算仍有效 |
| Waiting for Review | Pending | Review          | 已固定 `reviewPolicyRef`、Review 材料、触发原因与恢复点 |
| Paused           | Pending | Retry、Quarantine | 已记录暂停原因、最近有效检查点、预算余量与恢复前置条件 |
| Terminal         | Succeeded | Commit、No Action | 全部工作单元具有终结论；正式效果及幂等台账已完成对账 |
| Terminal         | Partially Succeeded | Commit、Quarantine、No Action | 已完成、未完成与失败工作单元集合互斥且并集等于输入集合；已产生效果全部可追溯 |
| Terminal         | Failed  | Reject、Quarantine、No Action | 失败分类、责任主体、恢复条件和正式效果计数已固定 |
| Terminal         | Cancelled | Withdraw、No Action | 取消授权与未完成工作范围已固定 |
| Terminal         | Expired | No Action       | 到期依据、权威时间与未完成工作范围已固定 |

三轴只通过下列 canonical 事件转换：

| 事件  | 允许的来源 | 前置条件 | 目标组合 |
|-----|-------|------|------|
| `REGISTER` | 尚无记录  | 不可变 `orgId`、Home Domain / Cell、Ingress Cell、稳定 Identity、工作负载、输入快照与 `ExecutionCoordinateSet` 可由 Home Cell writer 原子持久化 | Registered / Pending / Continue |
| `ADMIT` | Registered / Pending / Continue | §4.4 三 Profile 交集、授权、依赖、`orgId` / Home、预算、本地连续 control sequence、适用 offline lease 与当前 Cell fence 前置检查通过，并固定 Admission Control Snapshot | Ready / Pending / Continue |
| `START` | Ready / Pending / Continue | Home Cell Stage owner 已通过 CAS 登记固定坐标、预算、首个检查点及有效 `stageExecutionKey` Claim；目标 execution Cell 位于 Deployment Profile allowed Cells，昂贵处理链尚未由其他有效 Claim 启动 | Running / Pending / Continue |
| `REQUEST_REVIEW` | Registered、Ready、Running 或 Paused 的合法组合 | Review Policy 命中，材料、原因和恢复点完整 | Waiting for Review / Pending / Review |
| `RESOLVE_REVIEW` | Waiting for Review / Pending / Review | 已持久化的 `ReviewDecision` 已通过 §11.1 联合校验，且其 Contract Governance-defined Action 为 Accept 或 Modify；Accept 只解除 Review 阻塞，Modify 必须进入新的修订执行；二者均不得直接形成 Domain Commit | Ready / Pending / Continue 或 Running / Pending / Continue；Action=Reject 不得使用本事件并须走 `REJECT`；Action=Abstain 不得使用本事件或返回 Continue，存在恢复条件时走 `PAUSE_QUARANTINE`，不能恢复时走 `COMPLETE_NO_ACTION` 或 `FAIL_NO_EFFECT` |
| `PAUSE_RETRY` | Running / Pending / Continue | 失败可重试，检查点已确认，预算仍允许重试 | Paused / Pending / Retry |
| `PAUSE_QUARANTINE` | Registered、Ready、Running 或 Waiting for Review 的合法组合 | 隔离原因、范围、责任主体和解除条件完整 | Paused / Pending / Quarantine |
| `RESUME` | Paused / Pending / Retry 或 Paused / Pending / Quarantine | 恢复条件已满足；坐标变化时创建新 Run 或新逻辑 Stage Run | Ready / Pending / Continue 或 Running / Pending / Continue |
| `COMPLETE_WITH_EFFECT` | Running 或 Waiting for Review 的合法组合 | 正式效果资格通过；§7 台账、终态与效果满足原子提交协议 | Terminal / Succeeded / Commit，或 Terminal / Partially Succeeded / Commit |
| `COMPLETE_NO_ACTION` | Registered、Ready、Running、Waiting for Review 或 Paused 的合法组合 | 已确定本次处理合法完成且不产生正式领域效果 | Terminal / Succeeded / No Action，或 Terminal / Partially Succeeded / No Action |
| `REJECT` | 任一非终态合法组合 | 授权、契约、兼容、质量或用途门禁形成确定性拒绝依据 | Terminal / Failed / Reject |
| `FAIL_NO_EFFECT` | 任一非终态合法组合 | 执行失败且正式效果数量为零；Reject 与 Quarantine 均不适用 | Terminal / Failed / No Action |
| `QUARANTINE_TERMINAL` | 任一非终态合法组合 | 本次运行终止，隔离对象、原因、责任主体和后续新运行条件完整 | Terminal / Failed / Quarantine 或 Terminal / Partially Succeeded / Quarantine |
| `CANCEL` | 任一非终态合法组合 | 获授权取消决定已持久化 | Terminal / Cancelled / Withdraw 或 Terminal / Cancelled / No Action |
| `EXPIRE` | 任一非终态合法组合 | 受信时间与固定有效窗口证明运行到期 | Terminal / Expired / No Action |

Run / Stage 的每次三轴转换必须由 `homeDeploymentCellRef` 指定 Cell 中的授权 writer 以对象版本和预期前序事件执行 compare-and-set。非 Home Cell、Edge、Worker、Rule Runtime 或 Central Governance 的写入请求以 `NON_AUTHORITATIVE_PROCESSING_WRITER` 拒绝；对象版本、三轴、Checkpoint、候选、提交请求和正式效果保持不变，只追加最小审计。

每次合法转换以当前三轴值、对象版本和预期前序事件执行 compare-and-set。`Terminal` 组合创建后保持不变；重试、回放、修正或恢复创建新的 `ProcessingRun` 或新的逻辑 `ProcessingStageRun`，并引用原记录。Terminal 记录固定终态事件、完成时间、依据、责任主体、正式效果计数、效果引用和幂等台账引用。

批处理以 Terminal / Partially Succeeded 结束后，失败或未提交工作单元的补偿必须创建新的 `ProcessingRun`，通过 `parentRunRef` 或 `replayOf` 指向原 Run，只派发失败或未提交集合。新 Run 为新效果使用新的 `domainCommitKey`，并引用已成功工作单元的既有正式结果；不得向原 Terminal Run 追加 `StageExecutionAttempt`、工作单元或效果。

非法组合、非法转换、前置条件缺失及并发陈旧写入统一以 `ILLEGAL_PROCESSING_STATE_TRANSITION` 拒绝。拒绝事务保持原三轴和对象版本不变，产生零新增正式领域效果，并追加包含 from / requested-to、请求主体、受信时间、规则版本与拒绝原因的审计记录；该审计记录不属于正式领域效果。

Domain Owner 在正式提交事务中锁定并读取 Home Cell 本地 slot / fence store，原子校验当前 `(homePrivateDomainRef, controlScopeKey)` 的连续 `controlSequence`、适用 offline lease、不可变 `orgId` 与 Cell fence epoch。`expectedCellFenceEpoch = ProcessingRun.AdmissionControlSnapshot.admittedCellFenceEpoch` 是唯一权威来源；`StageExecutionAttempt` 与 Domain Commit ledger 如保存该值，只能作为必须精确相等的 non-authoritative mirror。Central decision time、Bundle 接收时间和 Stage execution fencing token 均不能替代该提交门禁。

提交时当前 Cell `fenceEpoch` 高于 expected epoch，使用 `FENCE_EPOCH_REVOKED`；尚无正式效果的受影响 Stage 由 Stage owner 按 Core Oracle 通过 `REJECT` 收敛为 Terminal / Failed / Reject，相关提交台账为 `REJECTED`、`retryable=false`，效果与 effect Outbox 增量均为零。当前 Cell `fenceEpoch` 低于 expected epoch 或任何镜像不相等属于完整性异常，必须 fail closed 并保持 Quarantine，不能形成 `APPLIED`。

sequence gap 或暂时无法证明连续控制状态时，Run / Stage 保持 Paused / Pending / Quarantine 等非终态；不推进消费 offset，不写 terminal ledger outcome。只有补齐完整序列或取得签名 authoritative snapshot 后才可恢复。offline lease 到期则永久撤销该 Run 的 Domain Commit 资格：当前提交可确定性形成 `REJECTED`、`retryable=false`，Stage owner 通过 `EXPIRE` 或其他合法终态关闭；重新授权必须创建新 Run、新 ECS 与新 Admission Control Snapshot。

Fence 前已经合法提交的效果保持原值；批量 Run 按既有工作单元集合聚合为 Partially Succeeded 或其他合法终态。同一 Run、同一坐标和旧 epoch 的重复请求只返回既有拒绝结果，不重新启动处理链；重新授权后只能显式创建新 Run，并重新解析 Release、Profile、control state 与执行坐标。

正式效果至少包括 `GradingResult`、`EvidenceRecord`、已确认的 `LearningStateSnapshot` / `DiagnosisHypothesis`、`ReviewDecision`、`SemanticGraphProposal` / `SemanticGraphRelease`、Question / Task 领域发布及其 effect Outbox。审计、telemetry 和无提交资格 Candidate 不属于正式效果。Cell fence Oracle 使用本地 commit position：fence position 之后携带旧 epoch 的 `APPLIED` 正式效果计数必须为零。

历史回放创建新的 `ProcessingRun` 和新的运行 ID，通过 `replayOf` 引用原运行。回放固定或替换的坐标均显式记录，差异报告连接两个运行。回放需要提交新领域事实时使用新的 `domainCommitKey` 和显式替代关系。

### 5.2 工作负载与预算证据等级

| 等级  | 使用时点 | 记录要求 |
|-----|------|------|
| Target / Assumption | 实现与测量前 | 登记目标、假设、初始范围、测量方法和证据状态，统一标记为未验证 |
| Measured Baseline | POC 或纵向链路完成测量后 | 固定样本、环境、时间窗口、测量方法、结果和不确定性 |
| Approved Budget | 实测结果完成 Review 后 | 固定获准质量、成本、失败、人工容量和完成窗口边界及批准引用 |

各预算字段携带证据等级和来源引用。Measured Baseline 形成前，运行只消费明确标记的 Target、Assumption 或 Initial Bound。

`ProcessingRun` 的 Budgets 只记录解析快照、证据等级与实际消耗，不成为政策定义源。业务行为与结果参数指回 `ProcessingProfileVersion`；Workload、Admission、Queue、资源、Review、Recovery、Cost、Scale 与 archive recovery / query budget 指回 `CapacityProfile`。

## 6. `ProcessingStageRun`

`ProcessingStageRun` 表达 `ProcessingRun` 内一个逻辑处理阶段的可恢复执行记录。它通过 `processingRunRef` 继承不可变 `orgId`、Home Private Domain、authoritative writer Cell 与 ECS；Stage 不形成第二份权威 Profile、Org 或 Home 记录。

| 语义  | 内容  |
|-----|-----|
| Identity | `processingStageRunId`、`processingRunRef`、阶段类型与 `stageExecutionKey` |
| Queue Routing | 稳定 `queueClass`；实际 queue partition / pool 记录在每次 `StageExecutionAttempt` |
| Work Unit | 工作负载单位类型、范围、输入引用、数量和复杂度 |
| Claim State | 当前 Claim owner、lease、claim epoch、execution fencing token 与 `currentStageExecutionAttemptRef` |
| `StageExecutionAttempt` Records | 递增、append-only 且终态不可变的 Stage 执行子记录引用；不得简称为学生作答 `Attempt` |
| Durable Checkpoint | 已完成 / 未完成工作、状态摘要、检查点引用、replication position / ref、写入时间与恢复前置条件 |
| Failure Classification | 输入、授权、兼容、质量、依赖、规则、模型、资源、超时、领域提交或未知失败 |
| Safe Retry | 可重试结论、重试范围、退避约束、预算余量、最近有效检查点和禁止重复的领域效果 |
| Outputs | 候选、Abstain、Review requirement 与正式领域结果 / commit 的稳定引用；Stage 不拥有领域事实 |
| Completion | 阶段 Lifecycle Status、Outcome 与 Disposition |

同一逻辑阶段的重复投递和安全重试保持 `stageExecutionKey`，`StageExecutionAttempt.attemptNumber`、claim epoch 与 execution fencing token 严格递增。检查点只有在 Home Cell Stage owner 校验当前 token、`orgId`、Run / Stage 版本并持久化后才成为恢复起点。

Home Cell Stage owner / delegated Orchestrator 原子创建 Claim、lease、execution fencing token、`StageExecutionAttempt` 的 immutable Start segment 和 canonical Checkpoint。Worker 只携有效 token 执行并回报 `StageExecutionAttempt` progress / checkpoint report，不直接推进 Run / Stage；只有 Home Cell Stage owner 可在当前 token 下追加进度并单次写入 Terminal segment。持旧 token 的 Worker 对 Checkpoint、Candidate、Terminal segment 和提交请求的新增量均为零；可以追加不具正式资格的 stale-attempt 审计。

解析首版把一次固定输入与用途的解析映射为一个既有 `ProcessingStageRun`；`PLS-01～04` 只是该 Stage 内的模块与 checkpoint locator，阶段类型及其适用规则由 exact `ProcessingProfileVersion` 与 `RuleSetManifest` 绑定，不自动派生四个 Stage 类型、队列或服务。Stage 的输入合同固定各模块可读输入与 dependency group；Runtime 调用以模块 locator、component／group locator、typed-input digest 与 exact Manifest applicability 形成各自 request digest，仍遵守 Runtime 的既有 Trace 唯一性约束。模块完成与 checkpoint 不等于 Stage Terminal；只有适用模块、分区与交接结论均已对账，Home Stage owner 才按§5.1收敛阶段。

### 6.1 `StageExecutionAttempt`

`StageExecutionAttempt` 是 Stage-scoped append-only 执行子记录，不进入 Canonical Object Registry，也不得简称为 §9.2 的学生作答对象 `Attempt`。它由 immutable Start segment、append-only Progress / Checkpoint reports 与 write-once Terminal segment 组成；Terminal segment 写入后整条记录冻结，修正、重试或 takeover 创建新的 `StageExecutionAttempt`。

| 字段组 | 最小合同 |
|-----|------|
| Identity — immutable start | `stageExecutionAttemptId`、parent `processingStageRunRef`、递增 `attemptNumber`、不可变 `orgId` |
| Claim — immutable start | claim owner / worker ref、claim epoch、lease boundary、execution fencing token |
| Placement — immutable start | `executionDeploymentCellRef`、queue partition、worker pool，以及内嵌不可变 `placementDecision`（target、reason、Profile / control refs、decision time） |
| Applied admission — immutable start | applied Capacity / Admission decision、resolved budget snapshot、allowed-cell validation，以及 Admission Control Snapshot 的 non-authoritative exact mirrors |
| Progress — append-only | started canonical time、progress 与 checkpoint report refs、累计资源观测；只由 Home Cell Stage owner 在当前 token 下追加 |
| Terminal — write once | Succeeded / Failed / Aborted / Stale、finished canonical time、queue wait / service time、resource usage summary、candidate / checkpoint report refs 与 failure classification；写入后不可覆盖 |

`placementDecision` 是 `StageExecutionAttempt` 内嵌记录，不建立隐藏顶层对象。`executionDeploymentCellRef` 必须位于 `DeploymentProfile.allowedDeploymentCells`；否则不创建 Active `StageExecutionAttempt`，Worker 不启动。Execution Cell、queue partition 或 worker pool 的变化不转移 `homeDeploymentCellRef` 的 canonical write authority。

Pod ID、machine ID、临时 Worker 数和当前健康是 telemetry；它们不进入 ECS、业务对象 content hash 或语义回放坐标。

### 6.2 Rule Runtime 协作边界

[Rule Runtime Specification v0.3](https://outline.wj985.cc/doc/08rule-runtime-specification-v03approved-yOsLMJNygK) 是 `RuleExecutionTrace` 的 canonical Contract Owner。本规范固定 Core 与 Runtime 的连接边界：


1. 正式 Rule Runtime 只在 T1 School Private Cell 或 T2 / T3 District Private Cell 的 canonical Stage 上执行；T2 / T3 Edge 仅运行 non-canonical preflight evaluator，不创建正式 Trace。
2. Runtime 读取固定输入、`processingStageRunRef` 与该 Stage 的 `executionCoordinateSetRef`，执行无副作用求值，只写不可变 `RuleExecutionTrace`，返回 Candidate、Conflict、Abstain 与 Review requirement。
3. Admission、Queue、Claim / lease / fencing、`StageExecutionAttempt`、Checkpoint、Retry、Placement、Recovery 与三轴推进均由 Home Cell Stage owner / Orchestrator 持久化；Trace 只使用引用连接这些事实。
4. `PREFLIGHT_BLOCKED` 只是一种 Trace classification，表示规则求值尚未开始且正式领域效果为零。Stage owner 按 Core Oracle 映射为 Terminal / Failed / Reject 或 Terminal / Failed / Quarantine；Runtime 不发出或持久化权威 Lifecycle / Outcome / Disposition transition。
5. Trace 创建后保持不变。晚于 Trace 的正式领域结果通过追加式关联事件连接 Trace、`domainCommitKey` 和结果引用；Runtime 不创建 `domainCommitKey` 或正式领域事实。

## 7. 幂等、交付、重试与回放

| 幂等键 | 作用范围 | 稳定规则 | 负责方 |
|-----|------|------|-----|
| `sourceDeduplicationKey` | 原始来源或来源事件 | 同一来源内容与来源身份保持稳定；重复只形成检测记录 | 输入登记领域 |
| `businessOperationKey` | 一次逻辑业务请求 | 客户端重试和重复编排请求保持稳定 | 业务流程 Domain Owner |
| `stageExecutionKey` | 一次逻辑阶段执行 | 重复投递和安全重试保持稳定；`StageExecutionAttempt` 单独递增 | Home Cell Stage owner / delegated Orchestrator |
| `domainCommitKey` | 一次预期领域事实或发布效果 | 所有重复提交请求保持稳定；新事实、修正、撤回和回放提交使用新键 | 目标领域 Domain Owner |

每次接受幂等请求时，对应 authoritative writer 以 `(orgId, idempotencyScope, idempotencyKey)` 原子保存 `canonicalRequestDigest` 与 `coordinateDigest`。`canonicalRequestDigest` 覆盖不可变 `orgId`、Home Private Domain、规范化业务载荷和输入 hash；`coordinateDigest` 覆盖本次精确 `ExecutionCoordinateSet`。Run / Stage 请求由 Home Cell writer 负责，正式领域提交由 Domain Owner 负责；摘要算法与规范化方法由对应契约固定并进入版本坐标。

| 条件  | 确定性处理 | 正式领域效果 | 审计  |
|-----|-------|--------|-----|
| 同一作用域与 Key、两个摘要均相同 | 首次记录已终结时返回其确定性结果；首次记录仍在处理时返回同一 `ProcessingRun` / `ProcessingStageRun` 引用与当前状态，或按调用契约有界等待；不得创建新 Run、重复入队或启动第二条处理链 | 不增加    | 记录重复命中、首次运行引用与当前状态 |
| 同一作用域与 Key、任一摘要不同 | 在同一事务内拒绝，错误码 `IDEMPOTENCY_KEY_REUSE_MISMATCH` | 零      | 记录 Key、作用域、已有与请求摘要及拒绝原因 |
| 并发首次请求 | 以数据库唯一约束或等价 compare-and-set 对 `(orgId, idempotencyScope, idempotencyKey)` 竞争；唯一胜出者在 Home Cell 同一事务或线性化点创建首次幂等记录与唯一 `ProcessingRun`；Admission 后再由 Stage owner 创建调度 Outbox 与执行 Claim | 仅胜出请求可进入唯一运行链并最多产生一次正式效果 | 失败竞争者读取胜出记录，返回同一运行引用或按摘要不一致规则拒绝 |

同键异载荷拒绝路径不得创建候选转正、发布、Evidence、State、Diagnosis、任务或其他正式领域效果。审计记录使用摘要与稳定引用，敏感业务载荷按既有保留策略处理。

T2 / T3 Edge envelope 的 `stableBusinessOperationKey` 规范映射为既有 `businessOperationKey`，`inputHash` 进入 `canonicalRequestDigest`；不新建平行幂等键体系。District 对相同 `orgId + businessOperationKey + canonicalRequestDigest` 的重复投递返回同一 canonical Run；同键异摘要使用 `IDEMPOTENCY_KEY_REUSE_MISMATCH`。Edge 不生成 `domainCommitKey`。

### 7.1 Consumer 与 Domain Commit 幂等台账

每个消费方维护消费台账，每个 Domain Owner 维护领域提交台账。两类台账是对应处理事务内的规范记录结构，仅在所属消费或提交边界内使用，不建立独立的跨文档业务生命周期。

| 台账  | 唯一键 | 必备记录 | Terminal outcome |
|-----|-----|------|------------------|
| Consumer ledger | `(orgId, consumerEffectScope, sourceEventRef)` | 不可变 `orgId`、Home Domain / Cell、消费方、订阅或用途、逻辑业务操作或 replay generation、来源事件稳定 ID / stream / position、`canonicalRequestDigest`、`coordinateDigest`、处理运行与阶段引用、`domainCommitKey`、首次接收时间、`StageExecutionAttempt` 与 checkpoint refs | `APPLIED`、`NO_ACTION` 或 `REJECTED` |
| Domain Commit ledger | `(orgId, idempotencyScope, domainCommitKey)` | 不可变 `orgId`、Home Domain / Cell、目标领域、`controlScopeKey`、applied `controlSequence`、`offlineLeaseRef`、`offlineExecutionUntil`、expected / observed Cell fence epoch、fence commit ref / position、`domainCommitPosition` 或可比较的可靠本地事务顺序、预期效果类型、`canonicalRequestDigest`、`coordinateDigest`、`effectSetDigest`、正式效果数量与稳定引用、Consumer ledger 引用、终态时间与责任主体；timestamp 不得替代可靠顺序 | `APPLIED`、`NO_ACTION` 或 `REJECTED` |

`consumerEffectScope` 固定消费方身份、Home Private Domain、用途、逻辑业务操作及 replay generation。同一逻辑消费重试保持该 scope；获准以新坐标重放时创建新的 replay generation 和业务操作键。`sourceEventRef` 固定来源流、事件稳定 ID 与可靠位置。两类台账遇到同键异摘要时执行 `IDEMPOTENCY_KEY_REUSE_MISMATCH`，不覆盖首次记录。

租户范围事件的 canonical Event Envelope 顶层必须包含不可变 `orgId`。Run → Stage → `StageExecutionAttempt` → Checkpoint → Consumer ledger → Domain Commit ledger → 事务 Outbox → 发布 / 消费 → Replay 必须对账同一 `orgId`、Home Domain 与适用 Cell 上下文；`tenantScope` 不能替代组织身份。缺失、篡改或不一致时形成 `REJECTED`，正式效果与 effect Outbox 增量均为零。

对单一数据库边界，Consumer ledger 的 terminal outcome、Domain Commit ledger 的 terminal outcome、正式领域效果、效果引用和事务 Outbox 事件必须在同一事务提交。跨存储边界采用经 Review 批准的等价原子协议，并同时保持以下不变量：


1. `APPLIED` 台账记录与其全部正式效果同时可见；不存在已标记 `APPLIED` 但效果缺失的状态，也不存在缺少唯一 `APPLIED` 台账记录的正式效果。
2. `APPLIED` 前 Domain Owner 在同一原子边界校验当前连续 `controlSequence`、适用 offline lease、expected / observed Cell fence epoch 与不可变 `orgId`。sequence gap 或暂时无法证明连续控制状态保持 Paused / Pending / Quarantine 等非终态，不写 terminal ledger、不推进 offset，补齐序列或取得签名 authoritative snapshot 后方可恢复；stale epoch 或不可变 `orgId` 不一致等确定性失格形成 `REJECTED`。offline lease 到期使当前 Run 的提交资格永久失效，提交形成 `REJECTED`、`retryable=false`，重新授权须创建新 Run / ECS / Admission Control Snapshot。所有非 `APPLIED` 路径的正式效果均为零。
3. 正式效果由 `effectSetDigest` 与有序稳定引用完整对账；同一 `(orgId, idempotencyScope, domainCommitKey)` 最多存在一个 `APPLIED` 结果。
4. 中间 `PREPARED`、锁、租约或传输状态不具备 terminal outcome 和正式领域效果资格；恢复流程在对外确认消费完成前收敛为一个 terminal outcome。
5. 来源确认、消费 offset 或等价进度只在上述原子边界持久化后推进。提交前崩溃保持台账 terminal outcome、正式效果和进度均未推进；提交后崩溃的重复投递返回已保存结果。

通过授权、契约、兼容、质量、Review 与领域门禁的合格事件，在每个 `consumerEffectScope` 和预期领域效果范围内形成 exactly-once effect：唯一 Consumer ledger 记录、唯一 Domain Commit ledger `APPLIED` 记录及一组原子正式效果。确定性判定为无需效果的事件形成一个 `NO_ACTION` terminal outcome，确定性拒绝的事件形成一个 `REJECTED` terminal outcome；两者的正式效果数量均为零。Review、Retry 或 Quarantine 等待状态保持非 terminal，不得作为已完成消费确认；后续处理最终收敛到 `APPLIED`、`NO_ACTION` 或 `REJECTED` 之一。

Consumer ledger 的 terminal outcome 必须与 §5.1 三轴终态对账：`APPLIED` 对应 Terminal / Succeeded / Commit 或 Terminal / Partially Succeeded / Commit；`NO_ACTION` 对应 Disposition 为 No Action 的任一合法 Terminal 组合；`REJECTED` 对应 Terminal / Failed / Reject；仅因 offline lease 到期拒绝、该 Stage 正式效果为零且满足 §5.1 `EXPIRE` 的受信时间与固定有效窗口前置条件时，也允许对应 Terminal / Expired / No Action，并固定到期原因与 `retryable=false`。每个 terminal outcome 固定唯一 `processingRunRef`、`processingStageRunRef`、效果计数和审计引用。

正式交付语义为 at-least-once delivery + idempotent domain commit：


1. 传递和阶段执行允许重复发生，每次尝试保留完整审计。
2. Domain Owner 以 `domainCommitKey` 校验提交，使同一预期领域效果最多生效一次。
3. `sourceDeduplicationKey` 只判断来源重复，业务用途、授权或处理坐标差异仍可形成独立业务运行。
4. `businessOperationKey` 连接同一业务意图，禁止替代领域提交幂等检查。
5. 回放创建新的 `ProcessingRun`、`businessOperationKey` 和 `stageExecutionKey`；来源快照可继续引用原 `sourceDeduplicationKey`。
6. 回放仅作比较时不创建领域提交；回放获准形成新事实时使用新的 `domainCommitKey`。

双台账允许依据实测规模采用分区、冷热分层或只读归档；具体物理策略属于实现设计。任何归档或压缩都必须保留幂等唯一性判断、首次结果摘要、终态、效果对账、审计血缘及获准回放窗口。热记录退出后仍须通过不可变摘要或等价索引阻止历史 Key 被重新解释为首次请求。业务回放语义由 `ProcessingProfileVersion` 固定；保留 / 删除边界由数据治理策略固定；archive recovery time、查询和资源预算由 `CapacityProfile` 固定。

## 8. 感知与文档对象

### 8.1 `TypedObservationCandidate`

`TypedObservationCandidate` 表达感知适配器对原始输入区域提出的类型化观察候选。

| 字段或语义 | 必备内容 |
|-------|------|
| Identity | 候选 ID、候选版本、创建时间与状态 |
| `observationType` | 已注册类型及版本，例如文本、版面区域、公式、手写、表格或图形 |
| `sourceRegionRef` | 输入快照、文档与页面 occurrence、原始坐标系、raw geometry 和原始内容引用；如存在 normalized geometry，须同时固定有序、版本化且可重放的 transform lineage，且 normalized 结果不得覆盖 raw geometry |
| `candidateValue` | 与 `observationType` 一致的类型化候选值和规范声明 |
| `alternativeValues` | 有序替代值、各自质量信号和差异依据 |
| `qualitySignals` | 适配器相对分值、完整性、清晰度、覆盖、冲突、缺失、弃权与信号定义版本 |
| `perceptionProfileRef` | 感知 Profile、适用输入范围和参数版本 |
| Processing Version | 感知处理器版本、`executorBuildRef` 与 `executionCoordinateSetRef` |
| Provenance | 来源快照、处理阶段、适配器、`stageExecutionAttemptRef` 和生成时间 |
| Review Requirement | `reviewPolicyRef`、触发原因、必要上下文、来源引用与领域交接要求 |

`qualitySignals` 保留适配器原始或相对质量信号，其数值不具备 Evidence 资格和校准概率语义。概率校准通过独立校准合同与版本引用表达。`TypedObservationCandidate` 经确定性标准化、领域校验和适用 Review Policy 后，方可参与正式领域对象或 Evidence 提交。

结构化数字来源不得为满足感知合同而伪造 observation、bbox、geometry 或 confidence。OCR 空输出、低质量信号、不可辨认、遮挡或缺页只表达 observation / quality 状态，不构成 learner blank 的证明；learner blank、擦除残留、不可辨认、遮挡与缺页不得相互折叠。

### 8.2 `StructuredDocument`

`StructuredDocument` 表达适用时的 `TypedObservationCandidate`，或经验证的不可变结构化数字来源，经过确定性标准化与文档领域校验后，由已登记 Domain Owner 形成的不可变文档结构版本。Parser 产生的 assembly 本身不是 `StructuredDocument`。

| 语义  | 内容  |
|-----|-----|
| Source | 文件、页面、区域或结构化字段路径、来源授权、输入快照与 raw source anchor；混合来源同时保留扫描与结构化两类来源锚点及其显式对应关系 |
| Observation References | 仅在 Perception 实际发生时，保留已接受或显式保留的 `TypedObservationCandidate` 引用；结构化数字来源不得补造引用 |
| Structure | 页面、区域、阅读顺序、题目边界、答案区、公式、表格和图形引用 |
| Normalization | 字符、公式、坐标、单位、方向和版面标准化结果；geometry 仅在来源原生提供或存在可重放 transform 时保留，且不得覆盖 raw 表示 |
| Quality | 完整性、冲突、缺失、弃权、校准引用和复核结论 |
| Lineage | 执行坐标、规则轨迹、模型异常候选、人工决策和领域提交引用 |

需要解析的扫描、结构化数字与混合来源在 `REGISTER` 时固定来源类型、用途与输入快照，在 `ADMIT` 时完成授权及 input-contract preflight；不通过则按既有状态机 fail closed，不创建有效 Claim / Active `StageExecutionAttempt`，也不得以空 observation 或伪 structured value 绕过。

## 9. 题目与作答对象

### 9.1 `QuestionCandidate` / `QuestionVersion`

| 对象  | 语义  |
|-----|-----|
| `QuestionCandidate` | 从 `StructuredDocument`、检索或问题生成流程形成的题干、选项、答案、解析、解法、题型、映射、来源、质量与复核候选 |
| `QuestionVersion` | 通过结构、答案、可解性、授权、映射和领域门禁后形成的不可变已发布题目版本 |

`QuestionCandidate` 记录候选差异、执行坐标、规则轨迹、模型版本与 `ReviewDecision`。发布创建 `QuestionVersion`，并通过 `SemanticGraphProposal` 纳入后续 `SemanticGraphRelease`。修改产生 Proposed Patch 或 Revised Candidate，经 Question Graph Domain Owner 校验后形成新版本。

### 9.2 `Attempt` / `AnswerSegment`

| 对象  | 语义  |
|-----|-----|
| `Attempt` | 学习者或获权群组对任务、试卷或题目集合的一次不可变作答尝试，固定参与者、任务、题目、时间、来源和授权 |
| `AnswerSegment` | `Attempt` 中与 `QuestionVersion`、页面区域或作答区域对应的最小可评价作答单元 |

`Attempt` 的学习者或获权群组是作答事实提交者；接收该提交的既有作答事实领域写入方，在所属 Home Cell 按授权与§7的幂等合同形成 `Attempt` 和 `AnswerSegment`。Parser、Runtime与学习者客户端不因此取得canonical写权。

`AnswerSegment` 固定唯一 exact `Attempt`、唯一 published `QuestionVersion`，以及该版本内的 subquestion／answer-slot locator（不适用时明确表达）；它保留一个或多个有序 source anchors。跨页或分散书写可以属于同一分段，页面和区域数量不决定分段数量。同一题可有多个分段；它们按评价定义声明的范围和顺序组成输入，不按扫描到达次序或页面数聚合。分段保留扫描原始区域及适用 observation，或结构化数字 typed path／raw value，并保留规范化内容、手写或公式引用、完整性和复核状态。修订形成新版本，引用原 `Attempt` 与前序版本。

初次解析尚无正式 `AnswerSegment` 时，入口固定已有 exact `Attempt`、获授权的题目范围与来源快照，Parser只形成分段和题目关联候选。作答事实写入方校验来源闭包、题目绑定、授权及适用 Review 后，以自己的 `domainCommitKey` 形成正式分段；随后把 owner-issued精确引用及其与原候选的对应关系交最终handoff独立重验。纯粹把未改内容的候选对应到正式引用，不重跑OCR、不回写原解析请求或结果，也不强制创建新Run；内容、题目范围或来源关系发生变化时按既有修订／reprocessing规则处理。正式分段未齐备时不得创建或推进 `AssessmentExecution`。

## 10. 评价定义与评价运行

### 10.1 评价定义

Assessment Graph 只拥有评价定义资产及其发布关系。

| 对象  | 语义  |
|-----|-----|
| `AssessmentTaskVersion` | 不可变评价任务定义，固定评价目的、构念、适用对象类型、题目范围、量规引用、完成条件、解释限制和复核策略 |
| `RubricVersion` | 不可变量规定义，固定评分维度、等级、分值、证据要求、规则引用、弃权条件、适用范围和人工责任 |

评价定义引用 Question、Knowledge、Skill 与 Curriculum 的已发布版本。定义中不绑定具体 `Attempt` 或 `AnswerSegment`。

### 10.2 评价运行

| 对象  | 语义  |
|-----|-----|
| `AssessmentExecution` | 一次评价运行，固定 `AssessmentTaskVersion`、`RubricVersion`、具体 `Attempt`、一个或多个 `AnswerSegment`、执行坐标、用途、阶段运行和复核策略 |
| `GradingResultCandidate` | 评价运行产生的候选分值、等级、标签、分项结果、依据、不确定性、冲突、弃权、解释限制和替代候选 |
| `GradingResult` | 通过评价领域校验与适用 Review Policy 后形成的不可变正式评价结果，固定候选、评价运行、裁决和领域提交引用 |

Assessment Graph 管理 `AssessmentTaskVersion` 与 `RubricVersion`。评价运行领域管理 `AssessmentExecution`、`GradingResultCandidate` 与 `GradingResult`。`GradingResultCandidate` 可进入复核和比较；`GradingResult` 可作为 Assessment Result 类型 Evidence 的上游依据。

Parser 提供的 source-preserving 作答 binding 仅是 candidate。Assessment owner 必须重验 exact `Attempt`、本次评价声明范围内的一个或多个 `AnswerSegment`、对应的 published `QuestionVersion`、组织与授权上下文，以及 `AssessmentTaskVersion` / `RubricVersion`，才能创建或推进 `AssessmentExecution`。

每个 `AssessmentExecution` 只绑定一个 exact `Attempt`、一个 `AssessmentTaskVersion` 和一个 `RubricVersion`，消费其声明评价范围内的一个或多个 exact `AnswerSegment`。handoff中的“全部分段”指该评价范围必需的完整集合，不等于整个Attempt所有题目的分段。评价范围以已发布QuestionVersion及版本内有效locator表示，不能用可变题号、页面序号或QuestionCandidate代替。

一个分段的多个source anchors可以跨页；共享题干／材料由多个题目引用，同一分段仍只归属于一个题目范围。确需同一原始作答支撑多个题目时，为各题保留明确的分段绑定及相同来源引用，并由 `AssessmentTaskVersion`／`RubricVersion` 明示复用和计分聚合语义；未声明或存在归属歧义时保留候选并进入适用Review／Abstain，不复制答案来填齐输入。缺少分段不能推断未作答，qualified blank也必须有来源与适用规则依据。

Assessment owner逐项重验同一org／Home／授权上下文、Attempt成员关系、题目及locator合法性、分段版本／顺序／完整性、共享来源及计分范围、Review和当前控制门禁；重复引用按同一精确分段去重计数，冲突版本或未闭合范围不得Admission。Parser的局部eligible结论不能替代这些校验。

**有限比较与不确定性。**`AssessmentTaskVersion`／`RubricVersion` 经已有规则引用固定适用题型、评价单元、答案类型、允许的规范化／比较语义、分值或分项映射、弃权与复核条件。每次运行由 ECS 固定 exact Rule／Manifest／ECP 与谓词库版本。首版基础路径支持以下确定性比较；需要数学等价、部分分或步骤评价时，使用该量规显式引用且已获准的领域评估规则，并受其支持域、前提及资源上限约束，不由 Parser 或语言默认行为补充语义。

| 输入／能力 | 比较条件 | 不可判定边界 |
|-------|------|--------|
| 单选、枚举及多选集合 | 比较稳定 option／value 引用；集合只有在量规明确顺序无关、重复项和漏选／多选处理后才使用集合语义 | 选项身份、归属、有效涂改或集合规则不明时为 Unknown |
| 精确数值及单位 | 使用 Rule DSL Decimal 合同；允许的数值规范化、单位换算、容差、舍入和边界均由量规所引规则明确；未声明容差不得隐式近似 | 单位、数量含义、精度或换算条件不明时为 Unknown |
| 公式、表达式及步骤 | 只调用支持域已固定的获准纯函数谓词／领域规则，记录定义域、假设、比较级别和依赖版本 | 无获准等价规则、前提不足或符号多义时为 Unknown；字符串或结构不等不推导数学不等。预算耗尽按 Rule DSL §6.1 返回 EVALUATION_LIMIT_EXCEEDED，执行 exact ECP 的失败处置并停止求值，不将不完整计算当成比较结果。 |

比较采用 True／False／Unknown：True 或 False 只在适用性、来源解释及比较前提全部满足时进入量规的候选评分；Unknown 保留来源、alternatives、缺失前提和原因，按 exact ReviewPolicy 进入复核，否则 Abstain，不自动赋零分。部分分仅来自量规显式分项规则。Parser 不读取标准答案替学生选择字形；Assessment 可消费已保真传递的答案与获准答案／量规，但不回写或掩盖来源歧义。正式结果仍由 Assessment owner 在领域门禁和适用 Review 后提交。

设计例：量规声明无序精确集合时 `{A,C}` 与 `{C,A}` 比较为 True；同单位精确 Decimal 的 `0.50` 与 `0.5` 比较为 True；`x+x` 与 `2x` 在缺获准等价规则／定义域时为 Unknown。后续允许扩展获准规则的支持域，不将这些基础例限制为整个 Step1 的永久能力上限。

## 11. 人工复核

### 11.1 `ReviewPolicyRef` 与 `ReviewDecision` 协作

[Contract Governance v0.3](https://outline.wj985.cc/doc/07contract-governance-v03approved-LcaGdKiXeB) 是 `ReviewPolicyRef` 与 `ReviewDecision` 的 canonical Contract Owner。Core Processing Contracts 固定实际运行使用的 `reviewPolicyRef`、`reviewDecisionRef`、`executionCoordinateSetRef` 和领域提交引用。Review Capability 提供必要材料、记录决定并支持流程恢复或明确终止；Domain Owner 校验修订产物并使用 `domainCommitKey` 提交领域事实。

Core 只消费 Contract Governance 已定义的 Review action，不复制其枚举，也不向 `ReviewDecision` 增加字段。执行交接时，按 Governance 定义的 Subject / Policy / Handoff，联合校验 immutable candidate 自身的 ref / digest 与既有 execution / review context；旧 candidate 不得修改。Accept 仅允许目标 owner 独立重验，不等于 Domain Commit；Modify 对旧 candidate 的目标 handoff 增量为零，由 Stage owner 依据 terminality 调度原 producer 进入新的 `StageExecutionAttempt` 或新 logical execution；Reject / Abstain 对该旧 candidate 的目标 handoff 与目标 Domain formal-effect 增量均为零；`ReviewDecision` 及其治理审计仍按 Contract Governance 追加持久化。任何决定均不直接形成目标领域事实。

## 12. Evidence 契约

### 12.1 `EvidenceTypeVersion` 与 Evidence 类型

`EvidenceTypeVersion` 是 Evidence 类型与 schema 绑定关系的不可变版本对象。Core Processing Contracts 是其 Step1 最小 canonical 声明契约 owner；Evidence Domain Owner 维护类型版本、schema 绑定、兼容结论、用途边界与批准记录。领域扩展可以增加类型专属约束，但必须引用本对象，不能以 Core contract version 或未版本化类型名称替代。

| 字段  | 规范语义 |
|-----|------|
| `stableId` | Evidence 类型跨版本稳定身份 |
| `version` | 不可变精确版本；别名、latest 或可变标签不得用于正式提交 |
| `contentHash` | 该版本全部不可变声明内容的完整性摘要；摘要排除自身与追加式当前状态投影 |
| `typeCode` | 已登记的稳定类型代码，与下表语义类别一致 |
| `schemaRef` | Evidence schema 的稳定 ID、精确版本与 `contentHash`，以及规范校验入口 |
| `semanticContract` | 类型语义、必备字段、单位、空值、时间、质量与 provenance 约束 |
| `requiredBasis` | 允许的最小上游对象类型、版本条件、血缘和反循环要求 |
| `applicableScope` | 获准组织、用途、主体、任务、对象与有效时间范围 |
| `intendedUse` / `prohibitedUse` | 获准用途、解释限制、禁止用途与决策强度边界 |
| `compatibility` | 可兼容消费者、迁移条件、双版本窗口与已知不兼容范围 |
| `supersedes` | 被替代 `EvidenceTypeVersion` 的精确引用；首版为空 |
| `owner` | Evidence Domain Owner、维护主体与适用 Accountable Human Owner 的稳定引用 |
| `lifecycleStatusAtIssuance` / `approvalDecisionRef` | 签发时 Draft、Approved、Deprecated 或 Retired 状态及确切批准决定；当前状态由追加式治理记录投影 |

`EvidenceTypeVersion` 的 schema、语义、上游依据、作用范围、用途、兼容或 owner 发生实质变化时创建新版本。批准、弃用和退役决定采用追加式治理记录，不回写版本内容或 `contentHash`。

`evidenceTypeRef` 是对 `EvidenceTypeVersion` 的精确引用，固定 `stableId + version + contentHash`。Evidence Commit 在 `committedAt` 校验引用解析、内容摘要、`schemaRef`、当前批准状态、作用范围、用途和兼容结论；未解析、摘要不匹配、未获准用于新提交、schema 不兼容或范围越界时，以零正式 Evidence 效果拒绝。Deprecated 或 Retired 版本只有在确切迁移决定明确授权的范围和窗口内才可用于新提交。

| 类型  | 语义  | 最小上游依据 |
|-----|-----|--------|
| Direct Observation | 经来源、授权和领域门禁确认的直接发生事实 | 原始输入快照、发生上下文和获准观察 |
| Normalized Observation | 对直接观察执行确定性标准化后形成的观察事实 | Direct Observation、规范化规则与处理血缘 |
| Assessment Result | 正式评价结果形成的证据 | `GradingResult`、评价定义、作答和固定坐标 |
| Human Correction | 人工提出且经 Domain Owner 提交的修正事实 | 被修正记录、理由、责任签署和 `ReviewDecision` |
| Derived Evidence Summary | 对获准 Evidence Window 计算的派生摘要 | 完整上游 Evidence 谱系、方法版本和窗口 |

每条 Evidence 使用精确 `evidenceTypeRef` 标识对应 `EvidenceTypeVersion`。`evidenceTypeRef` 独立于 Core Processing Contracts 版本；Evidence Type 版本、Evidence schema 版本与 Core contract 版本不得相互替代。

任务或批阅 `feedback` 进入 Evidence 前必须规范映射为 `Direct Observation` 候选，并固定：`source` 原始反馈引用、`actor` 与授权主体、`occurredAt` / `capturedAt` 及其时钟质量、受信 `receivedAt`、`confidence` 与其信号语义、完整 `provenance`、精确 `evidenceTypeRef` 及 schema version。未校准的 confidence 只表达来源质量信号。Evidence Domain Owner 在提交门禁中校验来源、主体、时间、置信语义、血缘、授权和 schema 兼容后，才可通过 `EvidenceCommit` 形成 `EvidenceRecord`。

`TypedObservationCandidate` 和 `GradingResultCandidate` 保持候选资格，不能直接作为 Evidence。

### 12.2 `EvidenceCommit`

`EvidenceCommit` 表达 Evidence Domain Owner 对一组预期证据效果执行的幂等领域提交。

| 语义  | 内容  |
|-----|-----|
| Identity | Commit ID、`domainCommitKey`、操作类型、提交主体和时间 |
| Inputs | 候选来源、授权、质量、Review、`ExecutionCoordinateSet` 与上游事实引用 |
| Validation | 精确 `evidenceTypeRef`、作用范围、血缘完整性、反循环、兼容和用途提交门禁结论 |
| Operation | Append、Correct、Withdraw 或 Supersede |
| Outcome | 已创建 `EvidenceRecord`、事件、拒绝、隔离或重复提交引用 |
| Impact | State、Diagnosis、Task 和投影的失效或重算评估引用 |

Evidence 使用独立高频 Commit Stream。每次 Commit 固定 `semanticGraphReleaseRef`、`ruleSetReleaseRef` 和 `executionCoordinateSetRef`。两个 direct Release refs 与可选的 `processingProfileRef` 均只作为 lineage / query mirror，不形成第二份权威坐标；它们必须分别与 ECS 中同名坐标的 exact ref / digest 精确相等。Deployment / Capacity Profile 只经 ECS 解析，不在 Evidence 中复制第二份权威引用；任一 mirror mismatch 必须在 Commit 前 fail closed。

### 12.3 `EvidenceRecord`

`EvidenceRecord` 是不可变学习证据事实。

| 语义  | 内容  |
|-----|-----|
| Identity & Type | Evidence ID、精确 `evidenceTypeRef`（Evidence schema / type version）、创建时间、状态投影引用 |
| Subject & Context | 学习者或获权群组、组织、任务、用途、发生时间和记录时间 |
| Basis & Lineage | 上游非派生或派生 Evidence、Attempt、AnswerSegment、GradingResult、人工修正与处理血缘 |
| Fixed Coordinates | `executionCoordinateSetRef` 是权威运行坐标；`semanticGraphReleaseRef`、`ruleSetReleaseRef` 与可选 `processingProfileRef` 只作 lineage / query mirror，必须分别与 ECS 中同名坐标的 exact ref / digest 精确相等；mismatch 时不得形成 Record |
| Quality & Review | 完整性、不确定性、校准引用、`reviewPolicyRef` 与 `ReviewDecision` |
| Commit | `evidenceCommitRef`、`domainCommitKey`、前序记录和修正、撤回或替代关系 |

修正和撤回创建新的 Evidence 事件与新的 `EvidenceRecord`，旧记录保持原值。有效状态由追加记录重建。Correct、Withdraw 或 Supersede 必须在 Evidence 领域事务中同时写入标准 Event Envelope，`eventType=EVIDENCE_INVALIDATED`，至少固定原 `evidenceRef`、不可变 `orgId`、原因码、受影响的 event-time window、可靠 Sequence / Outbox Position 和记录时间。

对同一 predecessor 的 Correct / Withdraw / Supersede，以 predecessor head CAS 或等价原子条件保证最多一个有效 successor；successor `EvidenceRecord`、`EVIDENCE_INVALIDATED`、提交台账与 effect Outbox 在同一领域事务或获批等价原子协议内提交。

State、Diagnosis、Task 与投影消费者异步处理失效事件，并记录已应用水位、旧对象失效资格及后续运行引用。达到失效位置后，旧 State、Diagnosis 或任务依据不得参与新的正式决策；补算可以异步完成，但不得把级联重算放入原 Evidence Commit 的同步事务。

### 12.4 反循环约束


1. `DiagnosisHypothesis` 不能成为支持自身的上游 Evidence，也不能通过派生链间接回流到自身。
2. `LearningStateSnapshot` 不能反向成为生成该快照的 Evidence，也不能通过任务或诊断链间接形成自我依赖。
3. Derived Evidence 必须沿完整谱系追溯到至少一个非派生来源。
4. Evidence Commit 在提交前执行依赖环检测；发现循环时采用 `reject` 或 `mandatory_review`，并保留路径与原因。
5. 实现可以使用预计算拓扑层级、增量依赖索引或有界遍历优化检测，但不得把达到遍历上限解释为“无环”。最大依赖深度、节点访问预算与超界处置由精确 `ProcessingProfileVersion` 固定；超界时进入 Reject 或 mandatory Review，正式 Evidence、State、Diagnosis 与任务效果均为零。

### 12.5 执行记录、演化知识与诊断资产边界

* `RuleExecutionTrace` 保持系统执行记录资格，作为 Evolution Pattern 分析的运行来源。
* `EvolutionPattern` 和 `RuleImpactRecord` 保持演化知识资格，使用自身所有权、版本和审计链。
* 上述对象不直接获得 `EvidenceRecord` 资格。Evidence Domain Owner 仍通过独立 `EvidenceCommit` 提交学习 Evidence。
* `EvolutionPattern` 通过 Education & Measurement Review 后可生成 `DiagnosticAssetCandidate`。最小交接契约由 Rule Evolution & Governance 维护；本规范只保留来源 Pattern、Review 决定与后续领域提交引用。
* `patternExplanation`、`mechanismHypothesis`、支持记录、反对记录与不确定性共同表达 Pattern 解释。`mechanismHypothesis` 保持可验证假设资格。

Assessment Domain Owner 对 `DiagnosticAssetCandidate` 执行构念、用途、证据、兼容和发布校验，并以新的领域提交授予评价图谱诊断资产资格。

## 13. `LearningStateSnapshot`

`LearningStateSnapshot` 是 Learning State Engine 基于已提交 Evidence Window 形成的不可变最小学习状态快照。

| 必备字段 | 语义  |
|------|-----|
| Knowledge Concept State | 指定知识概念范围内的状态及其依据 |
| Evidence Window | 纳入计算的 Evidence 集合、时间范围、筛选条件和完整性 |
| Estimation Uncertainty | 估计不确定性、充分性和解释限制 |
| Model / Rule / Graph Version | 状态估计模型、Rule Set Release 与 Semantic Graph Release 版本 |
| Freshness | 计算时间、上游最新时间、有效窗口和过期结论 |
| Skill Evidence Summary | 与 Skill 引用关联的证据摘要和谱系 |

Step1 范围排除 `skill_mastery`、`capability_mastery` 和综合学生画像。快照固定 `executionCoordinateSetRef`、上游 Evidence Window、生成时间、有效范围和替代关系。Evidence 修正或撤回触发快照失效或重算评估，新结果形成新快照。

没有符合用途、授权、Freshness 与充分性要求的 Evidence Window 时，不得签发默认值、全零、中性先验或固定最大不确定性的占位 `LearningStateSnapshot`，也不得生成伪 `DiagnosisHypothesis`。`Estimation Uncertainty` 只描述实际签发快照的估计质量。任务生成将该状态记录为不可用，并按 Learning Task DSL 的排他规则进入 `Curriculum-baseline` 或其他具备真实依据的路径。

## 14. `DiagnosisHypothesis`

`DiagnosisHypothesis` 表达 Learning Diagnosis Engine 基于已提交 Evidence 和已发布诊断资产形成的版本化假设。

| 字段或语义 | 必备内容 |
|-------|------|
| Claim | 诊断标签、模式、范围、支持强度、不确定性与解释限制 |
| Evidence Basis | Evidence Window、支持或反对 Evidence、缺失信息、充分性和完整谱系 |
| Coordinates | `executionCoordinateSetRef`、Assessment、Semantic Graph、Rule Set、模型和诊断处理版本 |
| Outcome | Supported、Contested、Insufficient、Abstained、Invalidated 或 Superseded |
| `alternativeHypothesisRefs` | 同一证据范围内的替代假设及比较关系 |
| `validFrom` | 假设开始适用的时间 |
| `expiresAt` | 假设停止用于新决策的时间 |
| `freshness` | 计算时间、Evidence Window 最新时间、阈值和新鲜度结论 |
| `intendedUse` | 获准用途、对象范围和决策强度 |
| `prohibitedUse` | 禁止用途、禁止决策和强制门禁 |
| `invalidationReason` | 失效触发、上游变化、责任主体、时间和替代假设引用 |
| Review | `reviewPolicyRef`、`ReviewDecision`、理由和责任记录 |

`intendedUse` 与 `prohibitedUse` 作为授权和运行门禁执行。达到 `expiresAt`、Freshness 阈值或上游失效条件时，假设停止用于新决策并触发重算评估。诊断资产归属 Assessment Graph，具体发生证据通过 Evidence Commit Stream 管理。

## 15. 语义图谱发布

### 15.1 `SemanticGraphProposal`

`SemanticGraphProposal` 表达 Curriculum、Knowledge、Question、Skill 或 Assessment 的对象与关系候选变更集合。提案固定来源、质量、作用范围、Domain Owner、规则轨迹、兼容影响、Review 材料、迁移和回滚建议。

ReviewDecision 的 Modify 形成 Proposed Patch 或 Revised Candidate。对应语义图谱 Domain Owner 校验后创建新提案或领域对象版本。

### 15.2 `SemanticGraphRelease`

`SemanticGraphRelease` 是通过领域 Review、兼容、回滚、回放和投影重建门禁后的不可变发布。成员范围固定为以下五张语义图谱：


1. Curriculum Graph；
2. Knowledge Graph；
3. Question Graph；
4. Skill Graph；
5. Assessment Graph。

发布记录固定成员图谱版本、依赖、作用范围、完整性摘要、审批、发布时间、回滚目标和 `domainCommitKey`。对象、关系或兼容发布集合变化时创建新发布。

Evidence 使用 `EvidenceCommit` 与 `EvidenceRecord` 的独立高频 Commit Stream。语义图谱发布不包含 Evidence 记录，Evidence Commit 也不触发每条 Evidence 对应的语义图谱重发。

聚合 Release 的 exact members、唯一 release writer / action authority、scope closure、Bundle / cache / projection / index / receipt 边界以 [Step1 Six-Graph Scope v0.4 §§5.1、7](https://outline.wj985.cc/doc/02step1-six-graph-scope-v04approved-DnaJurjjtA) 为准；application action、`ControlApplicationDecision` 与 per-cell terminal-`APPLIED` enforcement 以 [Contract Governance v0.3 §7](https://outline.wj985.cc/doc/07contract-governance-v03approved-LcaGdKiXeB) 为准。Core 只保留本节的共同对象字段、五成员集合与 Evidence 排除边界。

## 16. Rule Evolution & Governance 协作引用

Core 与规则契约的强制连接仅包含共同 Identity、`executionCoordinateSetRef`、`processingStageRunRef`、幂等提交引用、追加式关联事件及 Evidence 边界。`RuleExecutionTrace` 由 [Rule Runtime v0.3](https://outline.wj985.cc/doc/08rule-runtime-specification-v03approved-yOsLMJNygK) 定义；规则制品、兼容包络与分类语义由 [Rule DSL v0.3](https://outline.wj985.cc/doc/06rule-dsl-specification-v03approved-UG2vjVJGQi) 定义；演化知识、Proposal、Dossier、`RuleEvolutionDecision` 与 `RuleSetRelease` 由 [Rule Evolution & Governance v0.3](https://outline.wj985.cc/doc/10rule-evolution-governance-v03approved-VyhQTdWag6) 定义。

`RuleEvolutionDecision` 是 `RULE_SET_RELEASE` 的上游 subject-owner 授权，Contract Governance 为每个 lane 派生 `ControlApplicationDecision`，每个 Cell 本地应用。Core 只消费不可变 decision / application refs，并固定相关 `ProcessingRun`、`ProcessingStageRun`、`ExecutionCoordinateSet` 与领域提交引用；不复制其字段、生命周期、评测集隔离、决定链或读取行为。

## 17. 对象协作顺序

以下是按来源与用途选择的条件化 partial order，不表示每个 Run 串行经过全部步骤。作答评价路径在 Parsing 前固定既有 exact `Attempt`、获授权题目范围及来源快照；已有 `AnswerSegment` 时携精确引用，首次分段按 §9.2 由作答事实 owner 正式化候选后，再进入最终评价交接。内容路径不经过作答与评价步骤；结构化数字来源可跳过 Perception。


 1. T2 / T3 Edge 只形成带 `orgId + businessOperationKey + inputHash` 的 provisional envelope；T1 School Cell 或 T2 / T3 District Cell 的 Home writer 重新校验后注册 canonical `ProcessingRun`。
 2. Run 固定不可变 `orgId`、Home Domain / Cell、Ingress Cell、Workload、`ExecutionCoordinateSet` 三 Profile 引用及 Admission Control Snapshot。
 3. Home Cell Orchestrator / Stage owner 通过 Core CAS 执行 Admission、创建 `ProcessingStageRun`、Queue / Claim / lease / fencing、Checkpoint、Retry、Placement 与 Recovery。
 4. Worker 携有效 token 执行并回报 `StageExecutionAttempt` 与 checkpoint report；Stage owner 校验后持久化。Rule Runtime 在 canonical Stage 上只写不可变 `RuleExecutionTrace` 并返回候选。
 5. 需要感知的扫描或混合来源由 Adapter 形成 `TypedObservationCandidate`；结构化数字来源可以跳过 Perception，且不得补造 observation 或 geometry。Parsing 只形成 source-preserving 的 non-canonical assembly / binding candidate。
 6. 内容路径由 Content / Question Domain Owner 重验 schema、rights、structure、Review 与提交条件后，形成 `StructuredDocument`，或先形成 canonical `QuestionCandidate` 并按 §9.1 发布 `QuestionVersion`；Parser 不是这些对象的 writer。
 7. 学习者作答对象 `Attempt` 与 `AnswerSegment` 固定作答事实和题目引用；首次分段候选由既有作答事实 owner 按 §9.2 正式提交，保留原候选到精确分段的映射，Parser 不取得写权。它们不等同于 `StageExecutionAttempt`。
 8. 评价路径绑定既有 `Attempt`、适用 `AnswerSegment` 与 exact `QuestionVersion`，再由 Assessment owner 创建或推进 `AssessmentExecution` 并形成 `GradingResultCandidate`；Parser 不评分或解析 Rubric。
 9. 适用 `ReviewPolicyRef` 决定自动门禁、抽样、强制复核或拒绝；正式 `ReviewDecision` 由 Home Domain 的权威 owner 写入。
10. Domain Owner 在同一提交原子边界校验 `orgId`、continuous control sequence、offline lease 与当前 Cell fence，以新的 `domainCommitKey` 形成 `GradingResult` 或其他正式领域事实及 effect Outbox。
11. `EvidenceCommit` 校验 Evidence 类型、血缘与反循环约束，形成不可变 `EvidenceRecord`。
12. Learning State Engine 形成 `LearningStateSnapshot`，Learning Diagnosis Engine 形成 `DiagnosisHypothesis`。
13. 语义图谱变更通过 `SemanticGraphProposal` 进入 `SemanticGraphRelease`；Evidence 保持独立 Commit Stream。
14. `RuleExecutionTrace` 只通过追加式关联事件连接正式结果；Runtime 不推进 Run / Stage 或提交领域事实。
15. 运行只读取获准 `RuleSetRelease`；提案、评测、人工批准和发布控制遵循 Rule Evolution & Governance 的 canonical 流程。
16. 正式事实、事件、决策、提交和发布共同支持历史回放与投影重建。

## 18. 兼容与迁移

共同 Identity、必备关系、版本坐标、幂等语义、三轴状态、权威时间语义或 Evidence 边界变化时，Contract Governance 记录兼容等级、消费者影响、双版本窗口、回放差异与回滚目标。Rule DSL 维护 `atomicPatch` 与 `ExecutionCompatibilityProfile` 新版本的 canonical 声明；Rule Evolution & Governance 维护对应 Proposal、Dossier、Decision 与 Release 治理记录。历史对象继续引用原契约版本；重算和迁移创建新的 `ProcessingRun` 与新对象版本。

v0.2 历史 ECS、Run、Stage、Trace、Ledger 和正式事实不回填、不原地修改。v0.3 生效后的新 Live Run 必须固定三个 Profile 精确引用；双版本窗口内继续运行的 v0.2 Run 保持 v0.2 合同与原坐标，若需采用新 Profile、Home Domain、Home Cell 或 control state，必须显式创建新 Run 与新 ECS。

T1 → T2 re-home 属于受控迁移，不是普通扩容。迁移决定固定稳定 `rehomeOperationKey`、不可变 request digest、来源 / 目标 Home Domain、Home Cell、不可变 `orgId`、输入快照、授权、Profile 与回滚边界。来源 Home Cell 必须先在可靠本地 commit position 安装 migration / source-commit fence，停止新 Admission 与 Domain Commit，并形成签名 enforcement audit / receipt；目标 District 只有验证该 source-fence receipt 与迁移决定后，才可创建唯一的新 Run、新 ECS 与新幂等范围。不存在来源与目标正式写入窗口重叠。

同一 `rehomeOperationKey` 与同一 digest 的重复请求返回同一 target Run；同键异 digest 原子拒绝。旧 Run 的 `homePrivateDomainRef` / `homeDeploymentCellRef` 保持不变且不得重新开启；回滚必须产生新的 reverse migration decision，而不是撤销 source fence。Replay 若形成新正式事实，同样创建新 Run、ECS 与 `domainCommitKey`；只读比较默认关闭领域提交。

旧对象名按以下关系进入迁移 Review：

| 旧语义 | Current 语义 |
|-----|------------|
| `AssessmentTask` | `AssessmentTaskVersion` |
| `Rubric` | `RubricVersion` |
| 直接评价运行 | `AssessmentExecution` |
| 候选评价结果 | `GradingResultCandidate` |
| `GraphProposal` | `SemanticGraphProposal` |
| `GraphRelease` | `SemanticGraphRelease` |

迁移保留原对象、来源版本和替代关系。消费者在双版本窗口内完成读取、回放和领域提交验证。

`DeploymentProfile`、`CapacityProfile`、`homePrivateDomainRef`、Cell refs 与 `StageExecutionAttempt` 均不得通过迁移暗生新 OLE Domain 或顶层生命周期；Governance v0.3 只登记两个 Profile 的 canonical ownership，Stage 子记录、Bundle、receipt、ActiveSet、slot / fence store 和 telemetry 不进入 Registry。

## 19. Baseline Review Checklist

Core conformance 与联合 Gate 证据以 [Step1 Vertical Validation Plan v0.3](https://outline.wj985.cc/doc/12step1-vertical-validation-plan-v03approved-qjle8hmhHO) 为准；workload、metrics、执行协议与 benchmark evidence eligibility 以 [High-Throughput Benchmark Plan v0.3](https://outline.wj985.cc/doc/11high-throughput-benchmark-plan-v03approved-fK3n2fvpUP) 为准。本节不复制执行性检查清单；§§1–18 的 canonical schema、三轴状态、ECS / Profile、幂等、提交和 ownership 声明保持不变。
