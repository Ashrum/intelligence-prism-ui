# OLE（Open Learning Engine）

Product Technology Architecture v5.1 · Frozen Baseline

- 内容截止日期：2026-08-29
- 冻结日期：2026-08-29
- 冻结标识：`OLE-PTA-v5.1-FROZEN-20260829`
- 规范口径：六层 / 七引擎 / 八图谱（八图全部归属 L3 Educational World Model）
- 文档状态：Frozen

## 文档结构

- Part 0 Architecture Foundation
  - 0.1 Vision Statement
  - 0.2 Design Principles
  - 0.3 Architecture Decision Records
  - 0.4 Revision History
  - 0.5 Source Calibration & Scope Rule
  - 0.6 Internal Architecture Consistency Check
  - 0.7 OLE Step1 Current R&D Boundary
  - 0.8 Freeze Scope & Change Control
- Part 1 Product Positioning
  - 1.1 Vision
  - 1.2 Product Definition
  - 1.3 Core Concept
  - 1.4 Educational World Model
  - 1.5 Capability Asset Strategy
  - 1.6 Product Value Chain
  - 1.7 Multi-Stakeholder Positioning
- Part 2 Overall Architecture
  - 2.1 Architecture Overview
  - 2.2 Six-layer Architecture
  - 2.3 Core Data Flow
  - 2.4 AI Native Learning Infrastructure
  - 2.5 Technology Philosophy
- Part 3 Application Experience Layer
  - 3.0 Experience Domain & Organizational Boundary
  - 3.1 Learning Experience
  - 3.2 Teaching Experience
  - 3.3 Institutional Experience
  - 3.4 Family Experience
  - 3.5 Goal Model
  - 3.6 Experience & Interaction Contract
- Part 4 AI Learning Intelligence Layer
  - 4.1 Learning Diagnosis Engine
  - 4.2 Similarity Training Engine
  - 4.3 Learning Path Engine
  - 4.4 Teaching Intelligence Engine
  - 4.5 Goal Planning Engine
  - 4.6 Home-School Collaboration Engine
  - 4.7 Learning State Engine
- Part 5 Educational World Model Layer
  - 5.1 Curriculum Graph
  - 5.2 Knowledge Graph
  - 5.3 Question Graph
  - 5.4 Skill Graph
  - 5.5 Assessment Graph
  - 5.6 Evidence Graph
  - 5.7 Teaching Graph
  - 5.8 Capability Graph
- Part 6 Capability Asset Portfolio
  - 6.1 Definition and Boundary
  - 6.2 Capability Asset Taxonomy
  - 6.3 Candidate Formation Boundary
  - 6.4 Validation Dossier
  - 6.5 Admission Governance
  - 6.6 Portfolio Data Model
  - 6.7 Asset Package and Versioning
  - 6.8 Reuse and Activation Contract
  - 6.9 Monitoring, Restriction and Retirement
  - 6.10 Transfer and Revalidation
  - 6.11 Service and Storage Architecture
  - 6.12 Security, Authorization and Audit
  - 6.13 Implementation Phases
- Part 7 Data Architecture
  - 7.1 L4 Education Data Intelligence
    - 7.1.1 Definition and Boundary
    - 7.1.2 Processing Pipeline
    - 7.1.3 Knowledge Extraction
    - 7.1.4 Semantic Mapping
    - 7.1.5 Data Quality
    - 7.1.6 Data Governance
    - 7.1.7 Implementation Profile
  - 7.2 L5 Data Foundation
    - 7.2.1 Definition and Boundary
    - 7.2.2 Data Domains
    - 7.2.3 Canonical Input Contract
    - 7.2.4 Acquisition
    - 7.2.5 Versioned Storage
    - 7.2.6 Reliable Pipeline
    - 7.2.7 OCR and Document Processing
    - 7.2.8 Learning Observation Collection
    - 7.2.9 Terminal Data Enhancement
    - 7.2.10 Foundation Controls
    - 7.2.11 Phase 1 Baseline
- Part 8 Platform Engineering
  - 8.1 Overall System Architecture
  - 8.2 Backend Architecture
  - 8.3 AI Service Architecture
  - 8.4 Storage Architecture
  - 8.5 Deployment Architecture
  - 8.6 Phase Implementation Summary
- Part 9 MVP Implementation Roadmap
  - Phase 0 Measurement & Data Foundation
  - Phase 1 Single-subject Closed Loop
  - Phase 2 Institutional & Teaching Experience
  - Phase 3 Seven-engine / Eight-graph Scale-out
  - Phase 4 Capability Asset Admission
- Part 10 Technical Reference System
  - Educational Theory / AI / Knowledge Engineering / Data / Industry
  - Current Standards & Governance Baseline
  - Complete Architecture Summary
  - Long-Term Evolution Direction

## Module Design Contract（模块设计契约）

每个完整模块按需要覆盖：

1. Definition
2. Capability
3. Design Rationale
4. Core Model
   - Entity
   - Relation
   - Event
   - State
   - Context
5. Technical Implementation
   - Data
   - Processing
   - Storage
   - Algorithm
   - Service
6. Candidate Implementation Profile
7. Reference
8. OLE Integration
9. Staged Implementation / Activation Priority

> **实现解释规则**：全文所有 `Service` 名称和连线均表示逻辑模块、端口或适配器，Phase 1 默认部署在模块化单体或独立 AI Worker 内。所有 Technology Stack 表均按 Candidate Implementation Profile 解释；除明确标为 Phase 1 稳定基线的 PostgreSQL / pgvector / outbox 外，具体语言、框架、模型以及图、向量、缓存产品均不作为验收条件。物理拆分或固定技术选型必须由量化瓶颈和 ADR 触发。

---

# PART 0 Architecture Foundation（架构基础）

## 0.1 Vision Statement（愿景声明）

OLE（Open Learning Engine，开放学习引擎）是以 Educational World Model（教育世界模型）为核心的 AI 原生学习基础设施。其长期目标是形成可验证、可迁移、可持续治理的 Educational Capability Asset（教育能力资产）。

OLE 的产品边界不包含通用内容平台、在线课程系统、答疑机器人或教育基础模型。系统定位为教育对象、过程、状态与行动的数字化认知基础设施。

## 0.2 Design Principles（设计原则）

1. Education Value First（教育价值优先）：教育价值优先于科技价值，科技价值优先于商业价值；架构选择必须能回到学习增益、延迟保持、诊断一致性和教师复核一致性。
2. World Model First（世界模型优先）：所有智能能力建立在 Educational World Model（教育世界模型）之上，AI 输出必须有教育结构、来源和证据支撑。
3. Data Asset Oriented（数据资产导向）：原始数据属于业务记录；完成教育语义理解、质量治理、版本管理和血缘登记后，方可作为数据资产使用。
4. Experience over Role（体验域优先于角色域）：按 Institutional / Teaching / Learning / Family 四体验域组织系统，角色仅用于授权和参与关系。
5. Probability + Uncertainty（概率与不确定性分离）：掌握度以 0–1 后验概率存储；估计不确定性、展示等级和风险等级分别建模，不能互相替代。
6. Evidence, not Causality（证据而非因果宣称）：学习证据用于形成和检验诊断假设，不直接宣称因果关系。
7. Human + AI Collaboration（人机协同）：AI 负责规模化理解与建议生成，人负责教育语义质量控制、复核和高影响决定。
8. MVP Simple, Future Scalable（MVP 从简，面向扩展）：初期采用模块化单体、独立 AI Worker 与最小存储组合；后续演进必须由已量化的容量、性能、隔离或运维瓶颈触发。
9. Traceable Evolution（可追溯演化）：保留仍有效的详细设计，直接删除重复、失效和被取代的规范；历史版本由独立版本文件承担追溯。
10. Source Priority（事实源优先级）：产品拓扑与架构决策以已批准 ADR 为准，业务和数据合同以 Outline 现行规范为准，体验、组件、权限呈现和数据表达以 Figma 设计基线为准。界面结构不得作为技术职责划分的依据。

> **治理基线**：涉及未成年人的数据最小化、监护与组织授权、用途限制、访问审计、保留期限、导出控制和删除/撤回机制属于本版强制要求。对学生产生高影响的全自动诊断、分层、干预或资源分配暂不纳入实现范围；后续启用须另立 ADR，并完成法律、伦理、测量有效性、公平性、人工复核、申诉和回滚评审。

## 0.3 Architecture Decision Records（架构决策记录，ADR）

### ADR-001 Why World Model instead of Education LLM（大语言模型）?（为什么是世界模型而非教育大模型）

- 决策：不训练教育基座大模型；核心资产为 Educational World Model（教育世界模型） + 数据资产 + 推理能力。
- 理由：训练教育基座模型成本高，且能力迭代受基础模型厂商节奏制约。OLE 的长期积累应落在可治理、可迁移的结构化教育资产（Graph + Evidence）。
- 状态：Accepted（v3.0 起）。

### ADR-002 Why Graph + Embedding + Rule + Reasoning, with Conditional RAG?（为什么采用四项稳定能力并条件化 RAG）

- 决策：Graph 负责结构关系，Embedding 负责版本化语义表示与检索，Rule 负责确定性教育逻辑，AI Reasoning 作为七引擎调用的受控推理能力。RAG 只在 Organization AI Knowledge Base 或其他独立获批的来源化生成用例中启用，不属于通用能力组合，也不构成 Phase 1 学习闭环的必需项。
- 理由：结构查询、向量检索和确定性规则可以独立服务 Learning State / Learning Diagnosis / Similarity Training；只有确需生成自然语言且能满足来源、授权、评测和复核契约时才引入 RAG。
- 状态：Accepted（v5.0 范围修正，取代早期“五元能力均默认启用”的解释）。

### ADR-003 Why Experience Domain instead of Role Domain?（为什么按体验域而非角色域建系统）

- 决策：Application Experience Layer（应用体验层） 按 Institutional / Teaching / Learning / Family 四体验域组织，而非按 Teacher / Student / Parent 角色。
- 理由：角色是身份，体验是业务行为；同一人可跨角色（教师亦是家长），按角色建系统必然重复造轮子。
- 状态：Accepted（v3.1 起）。

### ADR-004 Capability Graph 与 Capability Asset Portfolio 分离

- 决策：Capability Graph（能力图谱）归属 L3 Educational World Model Layer，是世界模型的第八张图；Capability Asset Portfolio（能力资产组合）归属 L0，负责经验证成果的准入、版本、组合、迁移、监测与退役。
- 理由：Capability Graph 表达教育世界中的能力定义、结构、依赖、发展和迁移关系；Capability Asset Portfolio 管理经过效果与适用范围验证、可在限定用途内复用的教育能力资产。前者是认知模型，后者是治理后的资产集合，二者不能合并。
- 影响：L3 统一包含 Curriculum / Knowledge / Question / Skill / Assessment / Evidence / Teaching / Capability 八图；L0 不计入图谱数量，不再使用 Capability Asset Graph 名称。
- 状态：Superseded and Re-approved（2026-08-26；取代 v3.2 的七图拆分口径）。

### ADR-005 Data Acquisition Layer（数据采集层）升级为 Data Foundation Layer（数据基座层）

- 决策：L5 由 Data Acquisition Layer 升级为 Data Foundation Layer，内含 Acquisition（采集）、Storage（存储）、Pipeline（流水线）、Foundation Controls（基础控制）四域；语义抽取、教育映射、质量判定与语义血缘治理归属 L4 Education Data Intelligence。
- 理由：采集只是数据基座的入口能力之一；Event Streaming（事件流）、Data Warehouse（数据仓库）、Feature Store（特征仓库）、Metadata Management（元数据管理）等未来必然纳入，需要更宽的层定义。
- 影响：原 Part 6 / Part 7 的有效内容合并进 Part 7 Data Architecture，并明确 L4 与 L5 是两个不同的规范层。
- 状态：Accepted（v3.2）。

### ADR-006 Probability-based State（概率化状态存储）

- 决策：所有经验证并获准输出的掌握度 / 能力状态统一以 0–1 后验概率存储；`Intermediate` / `medium` 等离散等级仅作版本化概率区间的派生展示，不单独存储。Phase 1 只输出知识概念 `knowledge_mastery`；能力维度只输出证据摘要，`skill_mastery` 须等待获批 Measurement Profile。
- 理由：概率状态可直接支撑 Knowledge Tracing（知识追踪）、贝叶斯更新与阈值告警；离散枚举丢失信息且无法比较。
- 状态：Accepted（v3.1 起，v5.0 明确构念与准入边界）。

### ADR-007 Core Model 元模型扩展为 Entity（实体） / Relation（关系） / Event（事件） / State（状态） / Context（上下文）

- 决策：所有 Graph 与模块的 Core Model（核心模型）模板自 v3.2 起由四元组（Entity（实体） / Relation（关系） / State（状态） / Context（上下文））扩展为五元组，新增 **Event（事件）**。
- 理由：教育对象及其状态持续变化，变化过程必须由事件驱动（AnswerQuestion、AttendLesson、FinishHomework、TakeExam、ReceiveFeedback 等）。Event（事件）是 Evidence Graph（学习证据图谱）与实时智能的第一公民。
- 影响：Part 5 各 Graph 增加 Event（事件）小节；事件契约必须稳定，传输设施按规模选择，不绑定 Kafka。
- 状态：Accepted（v3.2）。

### ADR-008 Canonical Architecture and Naming（规范架构与命名）

- 决策：采用六层规范架构；L3 统一包含八图谱；L0 正式名称为 Capability Asset Portfolio；七引擎名称以 Part 4 现行清单为准。
- 影响：历史名称只作为检索别名，不再作为 v5.0 正文名称。
- 状态：Approved（2026-07-18）。

### ADR-009 Education Value and State Estimation Correction（教育价值与状态估计修正）

- 决策：教育价值优先；L3 包含八图；Phase 1 生产状态估计只运行 BKT；掌握概率、不确定性、展示等级和风险等级分离；证据只支持诊断假设。
- 影响：DKT、迁移分析和强化学习推荐只保留为离线候选实验，不按数据量自动切换。
- 状态：Approved（2026-07-18）。

### ADR-010 OLE Step1 Stage Boundary and Rule-system Separation（OLE Step1 阶段边界与规则系统分离）

- 决策：`OLE Step1` 是 Open Learning Engine 当前研发阶段，统筹 Educational World Model System、Versioned Rule Runtime、Rule Evolution & Governance、系统间契约与联合垂直验证，归属 OLE 六层整体架构。
- 边界：Educational World Model、Versioned Rule Runtime 与 Rule Evolution & Governance 保持独立职责、独立版本生命周期和独立验收标准，通过对象 ID、证据、上下文、版本、事件与发布契约协作；不得因处于同一阶段而合并为一个体系或互相从属。
- 解释：`OLE Step1` 规定阶段级研发规划边界；Part 9 Phase 0–4 规定架构内部实施与验收阶段。两者通过独立 Master Plan 显式映射。
- 状态：Approved（2026-08-29）。

## 0.4 Revision History（版本修订史）

| 版本 | 时间 | 主要变更 |
|---|---|---|
| v3.0 | 2026-07 | 完整十部分产品技术架构初稿：五层架构、八图世界模型、九段模块模板、MVP（最小可行产品）路线 |
| v3.1 | 2026-07 | 多利益相关方定位（1.7/3.0/3.4/3.5）；Curriculum Theme（课程主题） 实体；概率化状态规范；Similarity→Adaptive Training 更名建议；标注流水线选型（当时为 8.3，现行见 §7.1.7）；理论署名与参考 URL 补充（Part 10）；多租户数据治理（6.4） |
| v3.2 | 2026-07 | 新增 Part 0（愿景/原则/ADR（架构决策记录）×7/修订史）；Capability Asset（能力资产）独立层（ADR-004）；Data Foundation Layer（ADR-005）；Core Model 增 Event（ADR-007）；AI Learning Intelligence（AI 学习智能）七引擎定稿（Part 4 开头）；补全 5.4 Skill Graph（技能图谱）完整模块；6.0.4 知识工程流水线总览；Part 10 理论署名补全；全文格式化（标题层级/表格/删除生成残留）；英文术语全量中文备注 |
| v4.0 | 2026-07 | 汇总 v3.x 增量修订，形成完整产品技术架构源稿；保留旧正文与修订批注并存的历史结构。 |
| v5.0-RC | 2026-08-26 | 将六层、七引擎、八图谱提升为正文唯一口径；八图统一归属 L3；L0 定名为 Capability Asset Portfolio；校准体验与工程边界；修正状态估计、证据语义和 MVP 技术基线。 |
| v5.1 | 2026-08-29 | 明确 OLE Step1 的阶段边界及其与 Phase 1 的区别；确认世界模型、Versioned Rule Runtime、Rule Evolution & Governance 独立协作；统一 Phase 2 / Phase 3 激活口径；清理重复与残留文本；冻结架构基线与变更控制。 |

## 0.5 Source Calibration & Scope Rule（事实源校准与范围规则）

2026-08-26 已只读复核 Outline `Open Learning Engine` collection 的最近更新、业务流程、题目标注、数据契约与 Design System；Figma `OLE-team-library / 00 · OLE Agent Context` 于 2026-08-25 完成只读复核。本稿采用以下范围解释：

1. 六层 / 七引擎 / 八图谱是本稿已批准的整体架构口径。Outline 中 `L5→L1` 五层表约束日常运行链的局部数据契约；题目标注文档中的 Curriculum / Knowledge / Question / Skill 四张子图约束该子系统的本阶段实现范围；Outline P0/P1 业务优先级与本稿 Phase 0–4 产品架构阶段分别定义并显式映射。
2. 现行业务与数据约束直接继承：原始事实追加版本、不可静默覆盖；事实、状态、分析、诊断与行动分离；PostgreSQL 保存事务/版本/审计/恢复事实源，图访问实现只作为由正式版本重建的投影，不作为绕过发布流程的编辑入口。
3. AI、模型、规则、提示、工具授权与图关系都必须版本化；发布固定制品哈希、依赖、能力版本和作用范围，并经过分层评测、最小灰度、人工审批与可回滚发布，新版不得改写历史结果或扩大既有权限。正式关系只来自带来源、复核/裁决链和版本的 published assertion；模型置信、相似度、向量邻近、共现或 Agent 候选不得直接成为 L3 正式边。高影响写入只生成 Candidate / Handoff，并进入对应业务流程人工确认。
4. 权限动作分别判定 `VIEW / RETRIEVE / USE_BY_AGENT / DERIVE / EXPORT / PUBLISH`；每次请求按当前组织、Membership / Employment / TeachingAssignment、用途、对象、字段与期限在服务端重验。敏感访问默认拒绝，必要访问须最小授权、全程审计；审计不可用时阻断。
5. 体验遵循 Clear / Calm / Precise / Forward、全局层—任务层—内容层、每页一个主操作和真实异步阶段。生成、待确认、完成、发布、分析分态；局部失败不丢失其他成果。指标必须携带口径、样本、分子分母、截止时间、版本、可比性与排除项；无证据、不可比或权限受限不得渲染为 0 或确定性结论。

若来源出现表面差异，先判断文档作用范围和更新时间；已批准的整体 ADR 决定产品拓扑，Outline 现行规范约束其覆盖的业务、数据和设计合同，Figma 作为 Design System 的执行与验收来源，不从页面结构反推架构职责。

## 0.6 Internal Architecture Consistency Check（架构内部一致性检查）

本节记录 v5.1 在结构、职责、数据流、状态所有权、阶段依赖和实现约束方面的内部检查结果，用于发现正文矛盾，不替代独立技术评审、教育测量验证、安全评估或生产批准。

1. **总体口径一致**：六层、七引擎、八图谱的数量、归属与正文定义一致。八图全部归属 L3 Educational World Model；L0 Capability Asset Portfolio 管理经准入形成的能力资产，不计入图谱数量。L1–L5 构成产品运行与数据闭环；平台工程和治理属于横切关注点，不新增架构层。
2. **职责边界闭合**：L5 保存可追溯原始事实和观察候选，L4 形成教育语义提案，L3 负责版本化发布事实与证据，L2 负责状态估计、诊断假设和行动候选，L1 负责授权后的复核、执行与结果回收。各层之间通过引用、事件和发布版本衔接，没有要求下层复制上层状态。
3. **状态与证据口径一致**：Phase 1 仅发布 `knowledge_mastery`；能力维度保留证据摘要，待 Measurement Profile 获批后再形成概率状态。掌握概率、不确定性、展示等级和风险等级分别建模；观察证据不直接解释为因果事实。
4. **阶段依赖可执行**：Phase 1 采用模块化单体、独立 AI Worker、PostgreSQL、pgvector 与 outbox；独立图数据库、缓存、复杂 Agent、DKT、强化学习和通用 RAG 均受量化门槛或独立 ADR 约束，不构成 MVP 前置条件。
5. **能力资产准入独立**：日常学习闭环不会自动生成 L0 资产。Capability Candidate 必须经过效果、适用范围、失败样本、子群、迁移、人工准入、版本和退役治理后，方可进入 Capability Asset Portfolio。

内部一致性通过只说明总体设计可以继续细化，不说明系统已经具备生产条件。Phase 1 启动开发前，必须在相应模块中落实 owner、SLO、数据保留期、威胁模型、Measurement Profile、验收样本、非 AI 基线和回滚演练要求；未满足的项目不得以“架构已通过”为由豁免。

## 0.7 OLE Step1 Current R&D Boundary（OLE Step1 当前研发边界）

`OLE Step1` 是 Open Learning Engine 当前研发阶段，统筹同一阶段内的协同策划、接口冻结、验证与交付。OLE 六层逻辑架构继续作为整体边界。

当前规划边界包括：

1. Educational World Model System（教育世界模型系统）；
2. Versioned Rule Runtime（版本化规则运行能力）；
3. Rule Evolution & Governance（规则演化与治理系统）；
4. 系统间对象、证据、上下文、事件、版本与发布契约；
5. 联合垂直验证场景与回归评测。

上述对象处于同一研发阶段，但保持独立职责和生命周期。World Model 描述并发布教育对象、关系、事件、状态引用和上下文；Versioned Rule Runtime 执行已发布的确定性规则与约束；Rule Evolution & Governance 负责候选规则、参数优化、离线评测、专家审核、Shadow / 灰度、监测、回滚和退役。候选规则不得绕过评测与人工治理直接进入生产。

Step1 与 Part 9 Phase 0–4 的范围映射由独立 Master Plan 明确。

## 0.8 Freeze Scope & Change Control（冻结范围与变更控制）

### Frozen Baseline（本次冻结内容）

以下内容自 2026-08-29 起作为 v5.1 冻结基线：

- 六层逻辑架构及 L0–L5 的职责边界；
- 七引擎的规范名称、职责和状态所有权；
- 八图谱全部归属 L3，且 Capability Graph 与 L0 Capability Asset Portfolio 分离；
- L5 → L4 → L3 → L2 → L1 日常闭环，以及独立的可选 Phase 4 资产准入链；
- Evidence、State、Diagnosis、Action 与 Asset 的分离原则；
- Platform Engineering 与 Governance 为横切关注点，不新增架构层；
- OLE Step1 的阶段属性及世界模型、规则运行、规则演化治理的独立协作边界；
- Phase 0–4 的激活顺序与最小验收依赖。

### Not Frozen（仍可由后续设计确定）

以下内容不因 v5.1 冻结而固化：

- 物理服务拆分、仓库拆分和部署拓扑；
- 除明确的 Phase 1 稳定基线外，具体语言、框架、模型、数据库、中间件和供应商；
- OLE Step1 的详细对象模型、Rule DSL、Schema、API、数据表和评测阈值；
- 研发工期、人员配置和阶段映射；
- 标记为 Candidate、Optional、Proposed 或待基线校准的指标与实现。

### Change Rule（变更规则）

- 改变 Frozen Baseline 必须新增或修订 ADR，并提升文档版本；不得静默覆盖 v5.1。
- 仅修复错别字、重复、格式和不改变语义的交叉引用，可作为勘误记录处理。
- 任何后续版本必须显式说明 supersedes / compatibility / migration / rollback。
- Git 历史与冻结文件共同承担追溯；正式发布后不得用同名文件改写已冻结内容。

---

# PART 1 项目定位（Product Positioning）

## 1.1 OLE Vision

Open Learning Engine（开放学习引擎）

OLE（Open Learning Engine，开放学习引擎）面向教育场景提供 AI 原生学习基础设施（AI-Native Learning Infrastructure）。

下列产品形态不属于 OLE 的定位：

- 一个教育内容平台
- 一个在线课程系统
- 一个智能答疑机器人
- 一个教育领域大模型

OLE 的核心目标如下：

将教育领域中的知识、课程、题目、能力、评价、教学过程和学习行为进行统一数字化建模，形成 Educational World Model（教育世界模型）并支撑可复核的学习智能。只有在 `[Optional / Separately Authorized Phase 4]` 候选形成工作流中，获批运行结果引用才可建立 Capability Candidate dossier；通过教育效果与适用范围验证、失败/子群审查、人工准入和版本治理后，才可能成为可迁移的 L0 Educational Capability Asset。

## 1.2 Product Definition

OLE 是基于 Educational World Model（教育世界模型）的 AI 原生学习基础设施。系统将课程、知识、题目、技能、评价、证据、教学和能力统一表达为可计算、可追溯的模型，并由七引擎形成限定用途的学习状态、诊断假设和教育行动候选。

OLE 的核心能力包括：

- 建立并治理教育对象、关系、事件、状态引用和上下文；
- 通过 Graph、Embedding、Versioned Rule Runtime 和受控 AI Reasoning 支撑结构查询、候选发现与解释；
- 说明当前学习状态、诊断依据、后续行动及其不确定性；
- 在明确人群、场景和研究设计下评估教学或学习方案；
- 将通过独立验证和人工准入的成果登记到 L0 Capability Asset Portfolio。

日常学习闭环与能力资产准入是两条相互衔接但职责独立的链路：

```text
L5 Traceable Data → L4 Semantic Proposal → L3 Commit
        → L2 Learning State / Learning Diagnosis / Action Candidate
        → L1 Review / Execution / Observed Outcome
        → L5 → L4 → L3 Evidence Commit → L2 Update

[Optional / Separately Authorized Phase 4 Asset-admission Chain]
Versioned Outcome / Capability Candidate Dossier
        → estimand + comparison + education effect + scope + failure / subgroup validation
        → Human Admission + Version Governance
        → L0 Educational Capability Asset
```

普通数据、图谱对象、模型更新或观察关联都不能直接成为能力资产。

## 1.3 Core Concept

OLE 以教育世界的数字化认知为核心。内容生成可以作为受控能力接入，但不构成产品定义。

传统教育系统主要处理内容分发和教学管理；OLE 在此基础上进一步处理教育对象建模、学习状态理解、证据解释、行动规划和结果反馈。内容生成只是受控能力，核心要求是每次诊断和行动都能追溯到明确的对象、关系、证据、版本和授权范围。

## 1.4 Educational World Model Definition

Educational World Model（教育世界模型）是 OLE 的核心技术抽象。

Educational World Model（教育世界模型）是 OLE 对教育领域实体、关系、事件、状态、上下文与版本化观察关联的统一数字化表达。L3 只登记带来源、范围、方法、限制和外部分析结果引用的观察关联，不拥有因果假设；L2 Diagnosis 只形成可支持、反驳和复核的非因果诊断假设。因果声明必须来自独立获批研究/分析流程并保留研究设计与限制。

其边界可通过下表进一步明确：

| 对象 | 原因 |
|---|---|
| 数据库 | 数据库只是存储能力 |
| 知识图谱 | 知识图谱只描述知识关系 |
| AI 模型 | 模型负责预测和生成 |
| 规则系统 | 规则只是部分逻辑 |

Educational World Model（教育世界模型）统一组织上述能力所处理的教育实体、关系、事件、状态引用、上下文和版本化证据。

世界模型采用 Entity、Relation、Event、State Reference 和 Context 五类基本表达：

| 类型 | 示例 | 约束 |
|---|---|---|
| Entity | Curriculum、Knowledge Concept、Question、Skill、Assessment、Teaching Activity、Capability | 身份和组织关系由 Identity / Organization 域管理 |
| Relation | prerequisite、contains、assesses、requires、references_committed_evidence | 正式关系必须有来源、版本和发布记录 |
| Event | AnswerQuestion、AttendLesson、FinishHomework、TakeExam、ReceiveFeedback | 事件记录可追溯观察，不直接等同于掌握或能力 |
| State Reference | learning state、knowledge mastery、skill evidence summary 引用 | L3 只保存引用，状态由 L2 管理 |
| Context | 年级、学科、教材版本、教学阶段、考试环境和学习目标 | 上下文必须绑定适用范围和时间 |

学习状态由 L2 Learning State Engine 所有；World Model 只保存不可变、可追溯的状态引用。例如 ParticipantRef 可关联：

`learning_state_ref = learning_state:v42`

`knowledge_mastery_ref = knowledge_mastery:quadratic_function:v42`

`skill_evidence_summary_ref = skill_evidence:reasoning:v17`

Phase 1 不在 L3 保存 `skill_mastery`；只有获批的 Measurement Profile 才能由 L2 形成版本化能力概率状态。估计不确定性与派生展示区间随 L2 状态引用读取，不复制为 L3 自有状态。

题目只关联版本化测量/观察记录：

`difficulty_calibration_ref = question_calibration:q123:d4`

`discrimination_calibration_ref = question_calibration:q123:disc4`

`observed_error_pattern_association_ref = question_error_assoc:q123:v2`

每个记录必须包含 population、sample / missing、time window、method / Profile、data / model version、estimate + interval / uncertainty 与 limitations。错误模式只能是版本化观察关联或 Diagnosis reference，不能固化为题目事实。
## 1.5 Educational Capability Asset Strategy

Educational Capability Asset（教育能力资产）是 OLE 长期价值核心。

定义：Educational Capability Asset 是经过准入、能够在明确人群、学科、场景和用途内复用、迁移、监测和退役的教育能力包。数据、图谱、模型、提示或策略只是资产包的组成制品，不能单独取得能力资产资格。

每个资产至少包含：

- 1. **Capability Claim & Scope**：能力主张、目标人群/学科/场景、预定用途、禁止用途与边界
- 2. **Versioned Implementation References**：对 L1 工作流、L2 模型/策略、L3 图谱版本及 L4/L5 数据与血缘的不可变引用
- 3. **Validation Dossier**：estimand、比较条件、研究设计、样本与时间窗、效应量与不确定性、失败样本、子群结果和迁移验证
- 4. **Governance Contract**：责任人、人工准入记录、版本、监测、降级、回滚、变更和退役条件

可作为候选的对象包括经验证的诊断协议、自适应练习策略、教学支持模式或获批 Measurement Profile；它们仍须先形成 Capability Candidate dossier。

以下对象不属于 L0 Asset：L3 的课程/知识/题目/能力/评价/证据/教学图谱对象，原始或派生数据，单次学习路径/推荐，以及未经效果验证的模型、提示、规则或观察关联。

## 1.6 Product Value Chain

OLE 的价值链：

```text
日常运行闭环：
L5 Educational Data / Observation Candidate
        ↓
L4 Data Intelligence Proposal
        ↓
L3 Educational World Model Commit
        ↓
L2 Learning Intelligence Candidate
        ↓
L1 Application Review / Execution / Outcome
        ↓
New Observation Candidate → L5

可选 Phase 4 资产准入链：
Approved Reusable Result References
        ↓
Candidate Dossier（效果、范围、失败、子群、迁移与限制）
        ↓
Independent Validation → Human Admission / Version Governance
        ↓
L0 Capability Asset
```
### Phase 1 业务入口与最小闭环

Phase 1 不等待完整 World Model 建成。必需业务入口为 Similarity Training Experience，最小闭环同时包含 Learning State Engine（BKT）、Learning Diagnosis Engine、Similarity Training Engine，以及 `Observation Candidate → L5 → L4 → L3 Evidence Commit → L2` 的证据回流。

Organization AI Knowledge Base 是 Phase 1–2 条件性业务入口，仅在组织授权、来源化检索/生成用例和独立验收成立时启用。Phase 1 闭环依据 Learning State、Learning Diagnosis、Similarity Training 与证据回流验收。

第一阶段优先验证教学资源治理、试卷分析、题目检索和相似训练的实际价值。数据建设以文档解析、OCR、题目结构化和知识映射为入口，重点形成 Curriculum、Knowledge、Question 和 Evidence Graph 的闭环子集。

Phase 1 同时实装最小 Skill vocabulary（稳定 ID / 版本）与 `question_requires_skill` 映射，用于 `skill_evidence_summary` 的覆盖分母和证据聚合；Skill 层级、依赖、迁移与 Measurement Profile 关系，以及 Assessment / Teaching Graph，只预留本体与接口边界，至 Phase 2 扩展，不把未实现图谱伪装成已完成能力。
形成最小闭环：Question / Document / Learning Observation → L5 可靠接入 → L4 映射与质量 → L3 Curriculum / Knowledge / Question / Evidence commit → L2 State / Learning Diagnosis / Similarity Training → L1 复核与执行 → 新观察回流。

---

## 1.7 Multi-Stakeholder Positioning（多利益相关方定位）

OLE 的服务范围覆盖学生、教师、学校、校外教育机构和家庭，面向多种教育场景提供统一基础设施。

服务对象（Stakeholders，利益相关方）：

学校（School）；校外培训机构（Training Institution）；教育集团（Education Group）；教师（含家庭教师 Tutor）；学生（Student）；家长（Parent）。

架构判断：若仅覆盖学校场景，OLE 的边界将收缩为 AI 教学管理系统。统一纳入学校、培训机构、教育集团、教师、学生与家庭，才能形成跨组织复用的 Educational World Model Infrastructure（教育世界模型基础设施）。

实现方式：

同一 World Model（世界模型），不同体验入口。通过 Organization（组织）与成员、任职、任教关系支持学校、培训机构和教育集团的数据隔离并复用七引擎；跨组织使用必须具备明确授权、目的限制和审计记录（详见 Part 3 / Part 7）。

# PART 2 总体产品技术架构（Overall Architecture）

## 2.1 Architecture Overview

OLE 采用六层规范架构。L0 表示长期运行形成的能力资产输出，位于架构顶层；L5 提供技术数据基座。Platform Engineering（平台工程）与 Governance（治理）横切全部层级。

```
L0  Capability Asset Portfolio（能力资产组合）
    Admission / Version / Composition / Transfer / Monitoring / Retirement
                         ↑ [Optional Phase 4] dossier → effect/scope/failure/subgroup validation → human admission
L1  Application Experience Layer（应用体验层）
    Institutional / Teaching / Learning / Family
                         ↕ 目标、行动、反馈
L2  AI Learning Intelligence Layer（AI 学习智能层）
    Learning Diagnosis / Similarity Training / Learning Path /
    Teaching Intelligence / Goal Planning / Home-School Collaboration / Learning State
                         ↕ 推理、状态、策略
L3  Educational World Model Layer（教育世界模型层）
    Curriculum / Knowledge / Question / Skill /
    Assessment / Evidence / Teaching / Capability Graph
                         ↕ 语义对象、关系、事件
L4  Education Data Intelligence Layer（教育数据智能层）
    语义处理、知识抽取、质量估计、模型/语义更新候选准备
                         ↕ 加工、验证、回放
L5  Data Foundation Layer（数据基座层）
    Acquisition / Storage / Pipeline / Foundation Controls
```

> L3 是认知核心；L2 以 L3 和学习状态为依据完成学习诊断、相似训练、学习路径、教学智能、目标规划和家校协同中的智能判断；L1 承载任务、沟通、确认、异议和执行闭环；L4/L5 提供可信数据输入。L0 只接收可选 Phase 4 dossier 经效果、范围、失败/子群验证和人工准入后的资产，不与 L1 日常闭环直连。六层定义逻辑边界；服务、数据库与部署拓扑由实现设计确定。

### 2.1.1 Seven Engines（七引擎）

| # | Engine | 中文名称 | 核心职责 |
|---|---|---|---|
| 1 | Learning Diagnosis Engine | 学习诊断引擎 | 基于状态与证据形成可复核的诊断假设 |
| 2 | Similarity Training Engine | 相似训练引擎 | 组织相似题检索、变式、训练编排与反馈 |
| 3 | Learning Path Engine | 学习路径引擎 | 形成受目标、先修、状态和资源约束的学习路径 |
| 4 | Teaching Intelligence Engine | 教学智能引擎 | 形成教师可执行、可复核的教学支持 |
| 5 | Goal Planning Engine | 目标规划引擎 | 表达、协调并分解教育目标，形成规划约束 |
| 6 | Home-School Collaboration Engine | 家校协同引擎 | 形成经授权的家校披露、解释、摘要和协同建议；业务任务与沟通记录由 L1 持有 |
| 7 | Learning State Engine | 学习状态引擎 | 维护知识概率状态、不确定性与能力证据摘要；获批 Measurement Profile 后才可输出能力概率 |

七引擎共享闭环：`State → Reviewable Diagnosis Hypothesis → Authorized Objective / Goal Constraint → Candidate Plan / Practice → L1 Review / Action → Observation Candidate → L5 Capture → L4 Mapping / Quality / Lineage → L3 Evidence Commit → L2 State Update`。引擎是职责边界，不要求独立部署；不同阶段只激活闭环所需子集。

### 2.1.2 Eight-Graph System（八图谱体系）

| 归属 | Graph | 中文名称 |
|---|---|---|
| L3 | Curriculum Graph | 课程图谱 |
| L3 | Knowledge Graph | 知识图谱 |
| L3 | Question Graph | 题目图谱 |
| L3 | Skill Graph | 技能图谱 |
| L3 | Assessment Graph | 评价图谱 |
| L3 | Evidence Graph | 学习证据图谱 |
| L3 | Teaching Graph | 教学图谱 |
| L3 | Capability Graph | 能力图谱 |

八张图谱全部归属 Educational World Model。Capability Asset Portfolio 属于 L0 资产治理层，不计入图谱数量。

## 2.2 Six-layer Architecture

### L0 Capability Asset Portfolio（能力资产组合）

定位：只承接可选 Phase 4 准入链批准的 Capability Asset。候选必须形成 dossier，至少包含预定用途、效果/比较条件、适用范围、失败样本、子群结果、迁移验证、不确定性与限制，并经过独立验证、人工准入、版本登记、持续监测和退役治理。L2/L3 运行结果不会自动进入 L0，也不由 L0 运行诊断或推理。L0 是输出资产层，不存放一般学生画像或普通知识对象。

### L1 Application Experience Layer（应用体验层）

定位：以 Institutional / Teaching / Learning / Family 四体验域承载任务和反馈。身份与角色用于授权，不作为重复建设产品线的依据。体验层必须显示组织范围、数据时间与来源、AI 状态、待复核状态、可执行动作和错误恢复方式。只有存在获批且适用于当前对象、场景和版本的度量记录时，才显示量化质量或不确定性信号，并关联其 metric、method、Profile、calibration、sample 与 limitations；不得把裸 `confidence` 当作校准概率。

### L2 AI Learning Intelligence Layer（AI 学习智能层）

定位：基于目标、学习状态和 L3 世界模型执行教育推理。规范能力由 Learning Diagnosis、Similarity Training、Learning Path、Teaching Intelligence、Goal Planning、Home-School Collaboration、Learning State 七个引擎承担。

### L3 Educational World Model Layer（教育世界模型层）

定位：统一表达教育对象、关系、事件、状态引用与上下文。L3 包含 Curriculum、Knowledge、Question、Skill、Assessment、Evidence、Teaching、Capability 八图。所有图谱 Core Model 采用 Entity / Relation / Event / State / Context 五元模型。

OLE 所称 Educational World Model，是对教育对象、正式关系、教育事件、证据引用和上下文进行版本化表达的领域认知模型。当前阶段不宣称具备通用环境模拟、因果推断或反事实预测能力；相关能力只有在构念、数据、评测和适用范围经过独立验证后才能纳入正式定义。

### L4 Education Data Intelligence Layer（教育数据智能层）

定位：把 L5 提供的原始和结构化数据转化为可计算、可验证的教育语义。核心能力包括知识抽取、实体与关系解析、本体对齐、质量与不确定性估计、语义验证、图谱构建建议和模型更新准备。L4 不承担原始文件持久化和底层采集设备管理。

### L5 Data Foundation Layer（数据基座层）

定位：提供可追溯、可回放、可隔离的数据基础。包含 Acquisition、Storage、Pipeline、Foundation Controls 四域，覆盖文档与事件接入、对象存储、关系/向量/图访问接口、数据流水线、底层元数据、技术血缘、版本、租户隔离和审计；教育语义治理归 L4。

### Cross-cutting Platform Engineering（横切平台工程）

Part 8 定义身份与权限、领域服务、AI 服务、存储接口、可观测性、部署和恢复。具体数据库、模型、云服务和编排框架属于可替换的实现配置，不构成六层架构本身。

## 2.3 Core Data Flow

OLE 核心数据循环（持续进化闭环）：

```
L5 Data Foundation → L4 Mapping / Quality / Lineage
        ↓
L3 Educational World Model（八图谱；约束校验与版本 Commit）
        ↓
L2 AI Learning Intelligence（七引擎；状态、假设与行动候选）
        ↓
L1 Experience Action
        ↓
New Observation / Event
        ↓
L5 Capture / Persist / Outbox / Replay
        ↓
L4 Semantic Mapping / Quality / Lineage
        ↓
L3 Evidence Graph Commit
        ↓
L2 BKT Knowledge-state Update / Skill Evidence Summary / Reviewable Decision
        └──────────────────────────────→ L1 Next Action

[Optional / Separately Authorized Phase 4 Asset-admission Chain]
Versioned Outcome Evidence + Candidate Dossier
        ↓
Educational-effect Validation + Scope / Failure / Subgroup Review
        ↓
Human Admission Decision + Version Governance
        ↓
L0 Capability Asset Portfolio（经验证的可复用教育能力资产）
```

> 核心机制：学习行动只产生可追溯的 Observation Candidate；经 L5 保存与重放、L4 映射/质量/血缘、L3 约束校验并 Commit 后才成为 Evidence，随后才能供 L2 更新状态。日常闭环到状态更新结束；只有独立获权的可选 Phase 4 工作流才可建立 dossier，并在教育效果、范围、失败/子群、人工复核与版本治理全部通过后准入 L0。

## 2.4 AI Native Learning Infrastructure（AI 原生学习基础设施）

OLE 区别于传统教育系统（核心范式转变）：

```
传统教育系统
┌──────────────┐
│ Content      │
│ 内容分发     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Student    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Result/Score │
│ 结果评价     │
└──────────────┘

          vs

OLE AI-Native 系统（持续闭环）
L5 Capture / Persist / Replay
           ↓
L4 Mapping / Quality / Lineage Proposal
           ↓
L3 World Model Commit
           ↓
L2 Learning State / Learning Diagnosis / Action Candidate
           ↓
L1 Review / Execute / Observed Response
           ↓
L5 → L4 → L3 Evidence Commit → L2 State Update / Re-plan

独立资产准入链：
Versioned Outcome / Capability Candidate Dossier
           ↓ education effect + scope + failure / subgroup validation
Human Admission + Version Governance
           ↓
L0 Educational Capability Asset
```

> 关键差异：传统以“内容传递 + 结果评价”为主；OLE 以“理解教育 → 推理教育 → 持续优化学习过程”形成闭环进化能力。

## 2.5 Technology Philosophy

OLE 稳定技术能力：`Graph + Embedding + Rule + AI Reasoning`。这些能力由七引擎按契约调用，不形成额外教育决策层。

RAG 是条件性生成能力：仅在 Organization AI Knowledge Base 或其他独立批准用例需要来源化自然语言生成时启用；普通图查询、向量检索、学习诊断和相似训练闭环不依赖 RAG。

| 能力 | 职责 | 典型用途 |
|---|---|---|
| Graph | 表达并查询结构化教育关系 | 知识依赖、课程体系、技能与能力关系 |
| Embedding | 提供版本化语义表示与候选检索 | 相似题发现、知识候选匹配、受控语义检索 |
| Rule | 执行确定性教育逻辑 | 路径约束、教学规则、评价规则与权限约束 |
| AI Reasoning | 为七引擎提供受控推理工具 | 诊断候选分析、约束检查、可追溯解释生成 |

---

# PART 3 Application Experience Layer（应用体验层）

## 3.0 Experience Domain & Organizational Boundary（体验域与组织边界）

OLE 按 Institutional / Teaching / Learning / Family 四个体验域组织产品。学校、培训机构、教育集团、教师、学生、家长和管理员作为参与者进入相应体验域，并通过统一授权关系开展协作。

最小领域模型：

- `User`：全局身份；账号状态独立维护。
- `Organization`：学校、培训机构或教育集团等组织主体。
- `Membership`：用户与组织之间的成员、角色和组织内状态。
- `Employment`：人员在组织内的任职关系。
- `TeachingAssignment`：教师与班级、课程、学科的任教关系。
- `Campus`、`Space`：校区与空间边界。
- `DeviceAsset`、`Installation`：设备资产归属与安装位置。

Evidence 默认按组织隔离。跨组织聚合仅在数据主体与组织授权、用途一致、字段最小化、可撤回且全程审计时启用；聚合结果必须保留来源组织与证据血缘。

## 3.1 Learning Experience（学习体验）

Student AI Learning Assistant（学生 AI 学习助手）是学习体验域的交互组件之一，不承担 OLE 的产品边界或整体架构定义。

### 1. Definition（定义）

Student AI Learning Assistant（学生 AI 学习助手）是 OLE 面向学生端的 AI 学习交互入口。

该组件是基于 Educational World Model（教育世界模型）的个人学习智能接口。通用聊天、搜题和作业批改可作为具体交互能力，但不得替代状态、证据、目标与行动契约。

该组件读取 L2 当前知识状态、能力证据摘要和已授权学习目标，并引用 L3 已提交证据，为学生提供带依据、不确定性和复核入口的诊断、解释、训练、反馈与路径服务。L1 不直接读取原始学习行为；Phase 1 不输出未经验证的能力概率。

### 2. Capability（能力）

Student AI Learning Assistant（学生 AI 学习助手） 支撑以下业务能力：

#### 2.1 Learning Diagnosis（学习诊断）

L1 不依据作业、测试或行为自行形成学生判断。它编排并展示：

- L2 Learning State Engine 的版本化知识状态与能力证据摘要；
- L2 Learning Diagnosis Engine 的可复核薄弱点/能力证据缺口假设及备选解释；
- 独立 Risk Assessment 的版本化结果引用。

原始观察必须先经 L5 capture/persist、L4 mapping/quality/lineage 和 L3 Evidence Graph commit，才能进入上述 L2 契约。

展示结果应直接说明主要假设、备选解释、证据依据、不确定性和复核状态。例如：“现有证据较支持数量关系建模困难；计算错误仍不能排除。该判断等待教师复核。”

#### 2.2 AI Explanation（智能讲解）

该能力调用 L2 的解释与诊断契约，并引用 L3 Knowledge Graph、Question Graph 和 Evidence Graph 的版本化关系，为学生提供：

- 个性化解释
- 分步骤推导
- 类比说明
- 候选错误解释（同时展示备选假设、证据与不确定性）

#### 2.3 Personalized Practice（个性化训练）

Phase 1 中，L1 将知识状态、不确定性、`skill_evidence_summary`、诊断假设和已授权任务约束提交给 Similarity Training Engine。引擎返回巩固题、变式题或提升题等训练候选，同时说明选择依据并提供替代方案。Phase 3 启用 Candidate Ranking Service 后，才允许对不同引擎产生的候选进行统一排序。

#### 2.4 Learning Path Guidance（学习路径指导）

该能力在 Phase 3 启用。Goal Planning Engine 与 Learning Path Engine 综合已授权目标、当前状态、诊断假设、资源约束，以及 Curriculum、Knowledge、Skill 和 Capability Graph 的已发布关系，形成可复核的路径方案。界面应清楚说明当前学习内容、后续安排及其依据，并允许用户编辑、确认或拒绝。Phase 1 只展示业务方已确认的静态学习目标和任务安排，不依赖动态目标规划或路径生成。

### 3. Design Rationale（设计理念）

通用问答只能处理一次性的“提问—回答”。学习体验还必须持续维护学习目标、当前状态、可复核诊断假设、学习行动和结果证据，并在新证据提交后更新状态。

Student AI Learning Assistant 必须建立在版本化学习状态和已提交证据之上。Knowledge Tracing 用于估计知识状态；Bloom's Taxonomy 可辅助定义目标层级；Cognitive Diagnosis Model 仅作为后续获批 Measurement Profile 的候选。Phase 1 只展示能力证据摘要，不输出 `skill_mastery`。

### 4. Core Model

#### Entity（实体）

L1 只拥有体验业务对象与跨层不可变引用：

| Entity（实体） | 说明 |
|---|---|
| Participant Membership Reference | 经授权的参与者与组织成员关系引用 |
| Learning Workspace / Session | 学习工作区与会话 |
| Learning Task | 获权任务与约束 |
| Learner Action / Command | 用户动作或正式命令 |
| Draft / Review Decision | 草稿、确认、拒绝与纠正记录 |
| Display Projection | 面向展示读取 L2/L3 引用的临时投影，不持有独立状态 |
#### Relation（关系）

| Relation（关系） | 说明 |
|---|---|
| membership_operates_workspace | 成员在授权范围内操作工作区 |
| session_contains_task | 会话包含任务 |
| action_references_candidate | 动作引用 L2 候选而不复制其内容 |
| experience_references_state_snapshot | 体验引用 L2 不可变状态快照 |
| experience_references_graph_version | 体验引用 L3 查询所用图谱版本 |
#### State（状态）

L1 只保存 Session / Task / Draft / Review / Execution 等业务状态，以及用户声明且可撤回的偏好。知识状态、能力证据摘要、诊断假设、风险评估与图谱对象均只保存 immutable ref；掌握概率、不确定性、证据窗口和模型版本由 L2 查询响应按当前授权即时投影，不复制进 L1 业务对象。

示例：

```json
{
 "participant_membership_ref":"membership:m001",
 "learning_session_ref":"learning_session:s88",
 "learning_task_ref":"learning_task:t17",
 "learning_state_ref":"learning_state:v42",
 "skill_evidence_summary_ref":"skill_evidence:v17",
 "diagnosis_hypothesis_ref":"diagnosis_hypothesis:d19",
 "adaptive_candidate_ref":"adaptive_candidate:a31",
 "risk_assessment_ref":"risk_assessment:v8",
 "projection_profile_ref":"learning_experience_projection:v3"
}
```
#### Context（上下文）

适用上下文包括：
- 年级
- 学科
- 教材版本
- 学习阶段
- 考试目标
- 学校教学计划

### 5. Technical Implementation

#### Data（数据来源）

体验层使用三类版本化引用：作业、考试、错题和在线训练等学习记录；试卷、题库、教材和教辅等教育资源；学习时长、点击和交互等行为观察。所有原始输入先进入 L5，完成 L4 语义处理并经 L3 commit 后，才能被 L2 和 L1 使用。

#### Processing（处理流程）

Learning Experience 只编排正式业务动作与展示，不在 L1 内执行数据清洗、教育语义映射、图谱提交或状态估计：

```text
Learner Action / Authorized Command（L1）
        ↓
Traceable Acquisition & Persistence（L5）
        ↓
Semantic Mapping / Quality / Lineage（L4）
        ↓
Evidence Graph Commit（L3）
        ↓
Learning State / Learning Diagnosis / Similarity Training（Phase 1）；Goal Planning / Learning Path（Phase 3）（L2）
        ↓
Source-aware, Reviewable Experience（L1）
```
#### Storage（存储方案）

L1 不拥有独立图、向量或状态存储。界面草稿、会话与正式业务对象通过领域服务保存；关系查询、向量检索、证据、状态和审计分别通过 Part 8 的稳定适配器访问。Phase 1 的物理基线统一见 §8.4–§8.5，不在体验模块重复指定数据库。
#### Algorithm（算法）

L1 不拥有学习算法。Phase 1 的知识状态由 Learning State Engine 使用 BKT 维护，诊断假设与相似题训练分别调用 Learning Diagnosis、Similarity Training；Goal Planning 与 Learning Path 到 Phase 3 才激活。DKT 仅为离线候选，不进入体验运行链路。
#### Service（服务实现）

Phase 1 的逻辑模块包括 student learning、learning state、learning diagnosis、similarity training 和 world-model query adapter。这些模块可以位于同一 deployable，不按名称强制拆分服务。

### 6. Technology Stack（技术栈）

| 技术 | 用途 |
|---|---|
| Application Runtime Profile | 业务模块运行时按团队能力与评测选择；Spring Boot 仅为可替换候选 |
| AI Worker Profile | AI Worker 语言/框架按模型与维护约束选择；Python/FastAPI 仅为可替换候选 |
| Graph Access Adapter | 教育关系查询；Phase 1 使用 PostgreSQL 逻辑图 |
| Vector Retrieval Adapter | 向量检索；Phase 1 使用 pgvector |
| PostgreSQL | 业务数据库 |
| Cache Adapter | 非必需；瓶颈触发后选择实现 |
| Versioned Embedding Profile（版本化向量配置） | 中文语义向量模型 |
| Optional Generation / Reasoning Adapter | 仅获批 Capability Profile / 用例启用；LLM 只是可替换实现 |

### 7. Reference（参考）

#### 理论参考
Bloom Taxonomy（布鲁姆教育目标分类学）

学习目标分类体系。

Knowledge Tracing（知识追踪）

学生知识状态建模方法。

Cognitive Diagnosis Model（认知诊断模型）

认知诊断模型。

#### 技术参考
Google Knowledge Graph（知识图谱）

大规模实体关系建模。

Knowledge Graph RAG（知识图谱增强检索生成）

图谱增强检索生成。

Marble

教育知识图谱相关探索。

K12-KGraph

K12（基础教育）教育知识图谱研究方向。

### 8. OLE Integration（在OLE中的作用）

Student AI Learning Assistant（学生 AI 学习助手） 连接：

```text
Authorized Participant / Learning Experience（L1）
        ↕ review / command / explanation
Learning State / Learning Diagnosis / Similarity Training（Phase 1）；Goal Planning / Learning Path / Home-School Collaboration（Phase 3）（L2）
        ↕ versioned query and evidence reference
Curriculum / Knowledge / Question / Evidence + minimal Skill vocabulary / mapping（Phase 1）；完整 Skill / Assessment（Phase 2）（L3）
```

它是 OLE 面向最终用户的主要智能入口。

### 9. MVP Implementation Priority

| 能力 | 优先级 / 阶段 |
|---|---|
| L2 版本化知识状态、能力证据摘要与不确定性展示视图；不另建“学生画像”对象 | Phase 1 必须 |
| 可复核诊断假设、备选解释、弃权与人工纠正 | Phase 1 必须 |
| Similarity Training Practice 候选排序、观察经 L5→L4→L3 commit 后回流与状态更新 | Phase 1 必须 |
| 带 L3 引用的基础解释、错题与知识关联 | Phase 1 必须 |
| Goal Planning / Learning Path / Home-School Collaboration 完整协同 | Phase 3 |
| 跨学科长期支持与后续获批 Measurement Profile | 独立验证与 ADR 后建设 |

## 3.2 Teaching Experience（教学体验）

Teacher AI Assistant（教师 AI 助手）是 Phase 2 激活的教学体验组件，面向教师的理解、判断、设计、实施与评价工作流；它不把自动生成内容等同于教学智能。Phase 2 可复用 Learning State、Diagnosis 与 L3 查询提供基础分析；Teaching Intelligence 与跨候选 Candidate Ranking 到 Phase 3 才激活。

### 1. Definition（定义）

Teacher AI Assistant（教师 AI 助手）是 OLE 面向教师角色的 AI 教学智能应用。

该组件基于 Educational World Model 和 L2 版本化状态、诊断引用，帮助教师复核学习证据、形成教学候选、执行教学活动并观察结果。教案生成、备课和内容搜索属于具体能力，不能代替完整的“证据复核—教学决定—课堂执行—结果回流”工作流。

### 2. Capability（能力）

#### 2.1 Student Learning Analysis

教师可以查看：

- 班级整体知识掌握情况
- Learning Diagnosis Engine 已形成的高频错误假设汇总及备选解释
- 独立风险评估产生的待复核候选
- 能力证据覆盖与结果分布（Phase 2 体验读取 Phase 1 已形成的摘要）

示例：

系统汇总：在已覆盖的函数性质任务中，班级 mastery 估计偏低；已分类错误的 80% 与“图像—解析式对应”任务相关。该比例是样本内观察，须同时展示覆盖率、不确定性和未分类错误。

#### 2.2 Teaching Diagnostic Review

Phase 2 只编排并展示 L2 Learning State / Diagnosis references、L3 committed Evidence 与 Question / Assessment definition refs，用于复核教学目标证据覆盖、Learning Diagnosis Engine 已形成的知识假设和待教师核查对象；L1 不自行形成诊断假设。任何个性化干预都须经过授权、用途校验与人工确认，不由风险或诊断结果自动触发。

#### 2.3 AI Lesson Planning

本能力在 Phase 3 由 Teaching Intelligence Engine 提供候选；Phase 2 仅支持人工主导、基于版本化查询的模板与资源编排。结合：

- Curriculum Graph（课程图谱）
- Knowledge Graph（知识图谱）
- Teaching Graph（教学图谱）

形成可复核的备课候选：

- 引用获权 Teaching Objective / Goal constraint（不在本模块协调价值冲突）
- 教学重点
- 教学流程
- 课堂练习
- 差异化教学方案

AI 在备课环节提供基于教育模型、可说明依据且可复核的决策建议；教学设计与最终决定仍由教师负责。

#### 2.4 Teaching Resource Query & Candidate Review

Phase 2 支持教材关联、题目/案例/历史方案的授权查询候选，不称为智能推荐。Phase 3 由 Teaching Intelligence 形成教学候选，需要跨集合排序时再交 Candidate Ranking Service；L1 只展示、复核或执行。

#### 2.5 Classroom Feedback

```text
L1 Teaching Action → Student Response / Observation Candidate
        ↓
L5 Capture / Persist → L4 Mapping / Quality / Lineage → L3 Evidence Commit
        ↓
L2 Learning State / Learning Diagnosis / Outcome Association References
        ↓
Phase 2 Teacher Review View
        ↓ Phase 3 only
Teaching Intelligence Candidate → optional Candidate Ranking → Teacher Decision
```

### 3. Design Rationale（设计理念）

传统教师工具：Teacher、Resource Library、Teaching Material。

OLE 模式（反馈闭环，不声明单次教学决策造成学习提升）：Teacher、Educational World Model（教育世界模型）、Authorized State & Evidence Review、Reviewable Teaching Decision Candidate（可复核教学决策候选）、Observed Response → L5 Capture / Persist → L4 Mapping / Quality / Lineage → L3 Evidence Commit → L2 State Update。

设计原则：教师 AI 提供证据汇总、候选生成和影响说明，教师保留复核、调整与决定权。

理论依据包括 Teaching Analytics、Learning Analytics 和 Formative Assessment；其作用是约束证据汇总、反馈和复核流程，不直接决定教学行动。

### 4. Core Model

#### Entity（实体）
| Entity（实体） | 说明 |
|---|---|
| Teacher Membership Reference | 教师身份、组织与授权范围引用 |
| Teaching Workspace | 教学工作区 |
| Teaching Task | 教学任务与约束 |
| Lesson Plan Draft | 教学方案草稿 |
| Activity Execution | 教学活动执行记录 |
| Review Decision | 教师确认、拒绝或纠正记录 |
| Published Resource Reference | 已发布教学资源引用 |
#### Relation（关系）
| Relation（关系） | 说明 |
|---|---|
| membership_operates_workspace | 教师在授权范围内操作工作区 |
| workspace_contains_task | 工作区包含教学任务 |
| draft_contains_activity_candidate | 草稿包含待复核教学活动候选 |
| execution_references_published_resource | 执行记录引用已发布资源版本 |
| experience_references_state_aggregate | 体验引用 L2 班级状态聚合 |
| experience_references_graph_query | 体验引用 L3 Teaching / Curriculum / Knowledge / Assessment 查询版本 |
#### State（状态）

L1 只拥有 Teaching Progress、Activity Execution、Draft / Review 等业务状态。其余均为版本化展示引用：

- `knowledge_coverage_ref`：L3 课程/知识覆盖查询版本；
- `knowledge_state_aggregate_ref`：L2 班级知识状态聚合及不确定性；
- `learning_achievement_ref`：获批 Assessment / Measurement Profile 输出，携带用途、证据窗口、模型与验证版本；
- `engagement_assessment_ref`：仅在构念、用途和模型获批后展示，不把点击或时长直接等同于投入度；
- `observed_outcome_association_ref`：携带 estimand、样本、时间窗、比较条件、模型版本、潜在混杂与解释限制。
#### Context（上下文）

适用上下文包括：
- 学校
- 年级
- 学科
- 教材版本
- 教学计划
- 考试要求

### 5. Technical Implementation

#### Data（数据来源）

教学体验使用教案、教学资源和教学计划等业务数据，作业、测试和错题等学习记录，以及 Curriculum、Knowledge、Assessment、Evidence 和 Teaching Graph 的版本化引用。原始数据仍按 L5→L4→L3 链路处理。
#### Processing
Teaching Experience 只提交正式教学命令并展示可复核结果：

```text
Authorized Teaching Resource / Action（L1）
        ↓
L5 Capture / Persistence / Replay
        ↓
L4 Extraction / Mapping / Quality / Lineage
        ↓
L3 World-model Commit / Query
        ↓
L2 Learning State Aggregation / Learning Diagnosis（Phase 2）；Teaching Intelligence / Candidate Ranking（Phase 3）
        ↓
Teacher Review / Correction / Execution（L1）
```
#### Storage
L1 不拥有图、向量、分析仓库或学生状态存储。教学业务对象通过领域服务保存；图查询、资源检索、证据、状态与班级聚合通过稳定适配器访问，物理实现统一遵循 §8.4–§8.5。
#### Algorithm
L1 不运行状态估计或推荐算法。Phase 2 的基础班级视图只聚合 Learning State 与 Learning Diagnosis 的版本化引用；Phase 3 的班级诊断汇总和观察结果关联由 Teaching Intelligence 依据版本化状态、诊断假设、证据覆盖与非因果解释契约生成，跨候选排序由 Candidate Ranking Service 提供。Similarity Training 仍拥有练习候选；教师决定是否采用、纠正或执行。
#### Service

逻辑模块包括 teacher experience、class state and diagnosis view、teaching resource query 和 world-model query adapter，可在同一模块化应用中实现。

### 6. Technology Stack（技术栈）

以下内容属于可替换的 Implementation Profile，不改变体验层的存储和算法所有权：
| 技术 | 用途 |
|---|---|
| Application Runtime Profile | 教学体验业务模块；Spring Boot 仅为可替换候选 |
| AI Worker Profile | 教学辅助候选；Python/FastAPI 仅为可替换候选 |
| Graph Access Adapter | Phase 2 查询已发布教学关系；底层 PostgreSQL 逻辑图基线可复用 |
| Vector Retrieval Adapter | Phase 2 可选资源语义检索；默认复用 pgvector 基线，未达到收益门槛可不启用 |
| PostgreSQL | 业务数据 |
| Batch Analysis Adapter | Phase 2 使用普通批任务；规模化后按瓶颈选择实现 |
| Versioned Embedding Profile（版本化向量配置） | 语义理解 |

### 7. Reference（参考）

#### 理论参考
Learning Analytics
Teaching Analytics
Formative Assessment（形成性评价）
#### 技术参考
Google Knowledge Graph
Knowledge Graph RAG
Learning Analytics Platform

### 8. OLE Integration（在OLE中的作用）

Teacher AI Assistant（教师 AI 助手）连接：Teaching Graph（教学图谱）、Curriculum Graph（课程图谱）、Knowledge Graph（知识图谱）、Assessment Graph（评价图谱）、Evidence Graph（学习证据图谱）。

它负责：

将 L3 版本化查询与 L2 Learning State / Diagnosis refs 组织成来源清晰、可复核的教师体验，并承接教师正式命令。Phase 2 不生成教学决策；Phase 3 Teaching Intelligence 才形成教学候选，最终决定仍由教师作出。

### 9. Phase 2 Experience Activation Priority

| 能力 | 阶段 / 优先级 |
|---|---|
| 班级知识状态与诊断假设视图 | Phase 2 必须 |
| 错题证据模式查询 | Phase 2 必须 |
| 教学资源检索 | Phase 2 必须 |
| AI 辅助备课候选 | Phase 3（Teaching Intelligence） |
| 课堂实时分析 | 后续独立验证，不作为 Phase 2 验收 |

## 3.3 Institutional Experience（机构体验）

Organization AI Knowledge Base（组织 AI 知识库）

### 1. Definition（定义）

Organization AI Knowledge Base 是 Phase 1–2 的条件性机构体验扩展，不属于 Phase 1 核心学习闭环。School 是 Organization 的一种类型，不形成独立架构边界。该模块面向已授权组织，对教案、试卷、教材和其他教育资料进行结构化与语义处理，形成来源可追溯、权限可校验的组织知识资产。

该模块是组织教育资源进入 Educational World Model（教育世界模型）的授权入口，仅在用例获批并启用后工作。文件管理、网盘存储和通用 RAG（检索增强生成）问答不属于其核心职责。

其处理链涉及 L1 Application Experience、L5 Data Foundation、L4 Education Data Intelligence 和 L3 Educational World Model；各层仍按既定职责完成接入、持久化、语义处理、质量治理和发布。

### 2. Capability（能力）

#### 2.1 Educational Resource Intelligence（教育资源智能化）

该能力接收教案、试卷、练习册、教材和教学资料。L5 负责可靠接入与保存，L4 完成 OCR、分类、标签和知识映射，并将结果作为待复核的语义提案提交后续流程。

#### 2.2 Semantic Search（教育语义搜索）

语义搜索根据学科、年级、知识点、题型、难度、用途和权限范围检索组织资源。例如，教师查询“八年级一次函数应用题，目标难度中等”时，系统可返回符合条件的题目、教案和历史资源，并标明来源、版本和授权状态。

#### 2.3 AI Knowledge Query（AI 知识问答）

该能力在获批用例中结合来源化 RAG 与 Knowledge Graph，回答教学资源、知识关系和内容定位问题。答案必须附带来源、版本与权限范围；检索证据不足时应明确说明，不生成确定性结论。

#### 2.4 Resource Assetization（资源资产化）

资源资产化将原始文件转换为带版本和来源的结构化对象，经语义抽取、质量校验和人工复核后，形成可由 Educational World Model 引用的教育实体。原始文件和未发布候选不能直接称为世界模型资产。

### 3. Design Rationale（设计理念）

学校通常已经积累试卷、题库、教案和教学资料，但这些文件缺少统一语义、版本、来源和权限信息，难以直接支持检索、推理和复用。

必须严格区分文件资产与教育能力资产。OLE 先把文件升级为可追溯的组织知识资产：Document、Knowledge Extraction（知识抽取）、Semantic Mapping + Quality + Lineage、Organization Knowledge Asset（组织知识资产）。

只有进一步完成教育效果验证、适用范围确认、人工复核、版本登记与持续监测后，候选模式才可按 Part 6 的准入契约进入 L0 Educational Capability Asset；文档抽取或入图本身不构成能力资产。

### 4. Core Model

#### Entity（实体）
| Entity（实体） | 说明 |
|---|---|
| Organization Membership Reference | 组织主体、成员与权限范围引用 |
| Resource Workspace | 组织资源工作区 |
| Import / Processing Job | 导入与处理任务 |
| Review Queue | 待复核提案队列 |
| Publication Decision | 发布、拒绝、撤回或退役决定 |
| Source Object Reference | L5 文档/对象版本引用 |
| Published Graph Version Reference | L3 已提交图谱版本引用 |
#### Relation（关系）
| Relation（关系） | 说明 |
|---|---|
| membership_operates_workspace | 成员在授权范围内操作工作区 |
| job_references_source_object | 处理任务引用 L5 对象版本 |
| review_queue_contains_proposal_ref | 复核队列引用 L4 语义提案 |
| publication_references_graph_version | 发布决定引用 L3 已提交版本 |
| workspace_references_coverage_query | 工作区引用 L3 课程/知识覆盖查询版本 |
#### State（状态）

L1 只拥有资源 Draft / Review / Published / Retired 等业务生命周期。质量、使用与结果均通过版本化引用展示：

- `content_quality_ref`：L4 质量与审核结果；
- `usage_metric_ref`：带统计口径、时间窗与组织范围的使用指标；
- `knowledge_coverage_ref`：L3 课程/知识映射版本；
- `observed_resource_outcome_association_ref`：携带 estimand、样本、时间窗、比较条件、模型版本、潜在混杂与解释限制，不命名为资源效果。
#### Context（上下文）

适用上下文包括：
- 组织
- 年级
- 学科
- 教材
- 教学阶段

### 5. Technical Implementation

#### Data

来源：

- 组织文件系统
- 试卷
- 教案
- 题库
- 教学资料

Organization AI Knowledge Base 只编排授权、提交、检索、复核与发布体验；处理职责按层交接：

```text
Authorized Resource Submission（L1）
        ↓
Acquisition / Object Persistence / Replay（L5）
        ↓
OCR Structure Output → Extraction / Mapping / Quality / Lineage（L5 → L4）
        ↓
Versioned World-model Update Proposal（L4 → L3）
        ↓
Authorized Graph / Vector Retrieval（stable adapters）
        ↓
Source-aware Answer / Human Review / Publication（L1）
```
#### Storage

L1 不拥有 OCR、图、向量或对象存储。正式资源、处理产物、索引和图更新分别通过 Object Access、Job、Vector Retrieval 与 Graph Access 契约访问；Phase 1 的物理实现统一遵循 §8.4–§8.5。
#### Algorithm

L1 仅调用 OCR 结构输出、L4 抽取/映射、版本化 Embedding Profile，以及在用例获批并启用时的 RAG 检索能力，不在体验模块声明算法所有权。所有生成答案必须返回来源、版本、组织范围、AI 状态与复核入口。
#### Service
knowledge-base-service

        |

document-processing-service

        |

knowledge-extraction-service

        |

retrieval-service

### 6. Technology Stack（技术栈）

| 技术 | 用途 |
|---|---|
| OCR Engine | 文档识别 |
| Apache Tika | 文档解析 |
| Versioned Embedding Profile（版本化向量配置） | 中文向量模型 |
| Vector Retrieval Adapter | 条件性用例启用时默认复用 pgvector |
| Graph Access Adapter | 条件性用例启用时默认复用 PostgreSQL 逻辑图 |
| Optional Generation / Understanding Adapter | 仅该条件性知识库用例获批后启用；LLM 只是可替换实现 |

### 7. Reference（参考）

理论：

Knowledge Management
Knowledge Graph
RAG Architecture（检索增强生成架构）

技术：

Google Knowledge Graph
Enterprise Knowledge Base
Graph RAG（图增强检索生成）

### 8. OLE Integration（在OLE中的作用）

Organization AI Knowledge Base 是 Phase 1–2 的条件性扩展入口；其启用不改变 Phase 1 核心闭环验收。

连接链路：

```text
Organization Resource（L1）
        ↓
L5 Data Foundation（接入、存储、重放）
        ↓
L4 Education Data Intelligence（抽取、映射、质量、血缘）
        ↓
L3 Question / Knowledge / Curriculum Graph Update Proposal & Commit
        ↓
Authorized Retrieval / Reviewable Experience（L1）
```

### 9. Conditional Phase 1–2 Activation Priority

| 能力 | 启用时要求 |
|---|---|
| 文档解析与来源/授权/版本 | 必须 |
| 题目结构化候选与准入 | 按用例需要 |
| 知识映射候选与准入 | 必须 |
| 授权检索 | 必须 |
| RAG / AI 搜索 | 条件性；达到质量与收益门槛后启用；核心闭环按基础能力独立验收 |

## 3.4 Family Experience（家庭体验）

服务对象：家长（Parent）。

家庭体验围绕四个问题展开：孩子当前处于什么状态、哪些方面需要关注、下一步如何安排、家庭可以怎样配合。产品形态定义为 Parent Learning Insight（家长学习洞察），重点提供经授权、可理解、可行动的信息，不设置独立的教育 Agent（智能体）。

能力：经授权的 Student Evidence 引用 → L2 Learning State / 独立 Risk Assessment 引用 → 适龄、可解释且可复核的 Parent Report。Family Experience 不自行估计状态、风险或干预。

示例输出（量化而非模糊）：
```
知识概念“全等三角形判定”掌握后验: 0.62；估计区间/模型/证据窗口: 见 learning_state:v42
能力证据摘要“几何证明”: 18 条 L3 committed evidence refs；任务覆盖 60%；不输出能力概率
待复核假设: 证据更支持“证明步骤连接不足”；备选解释为题目映射或偶然失误
建议候选: 请求教师确认后安排基础任务与强化练习
```
案例：
- 案例1：家长收到月度报告，显示“几何证明” `skill_evidence_summary` 的覆盖、结果分布、来源和不确定性；独立 Risk Profile 如形成“建议教师复核”，同时展示 reason codes、证据新鲜度、规则版本、复核状态和失效时间，不把能力证据摘要直接等同于风险或干预结论。
- 案例2：家长在 App 设置 Parent Expectation（家长期望）“期末上 90”。Phase 1 仅由获权业务方把该期望与学生目标一并呈现并确认静态约束；Phase 3 激活 Goal Planning Engine 后，才由其记录冲突并形成优先级建议，仍不得自行裁决价值冲突。

## 3.5 Goal Model（目标模型）

原 School/Teacher/Student Goal（学生目标） 扩展为 Educational Goal Model（教育目标模型）：

```
Educational Goal Model
├── Institution Goal（机构目标，如完成课程进度）
├── Teaching Goal（教学目标，如达成知识点覆盖率）
├── Exam Goal（考试目标，如中考数学 80 分）
├── Student Goal（学生目标，如提升兴趣）
└── Parent Expectation（家长期望，如三个月提高 30 分）
```

Phase 3 激活的 Goal Planning Engine 负责记录目标、冲突与优先级建议。上述目标可能冲突（学生想提升兴趣 vs 家长想提分 vs 机构想完成进度）；Phase 1 如需目标，只允许由获权业务方提供并确认静态 Learning Objective / 约束，不依赖 Goal Planning Engine，任何阶段均不得由系统自行裁决价值冲突。

## 3.6 Experience & Interaction Contract（体验与交互契约）

本节只约束产品体验与领域命令，不反推六层架构。界面和 Agent 入口必须复用正式业务页面、领域对象与权限判断，不复制表单，不建立平行 CRUD 流程。

### 3.6.1 Scope, Status and AI Disclosure（范围、状态与 AI 表达）

- 视觉与信息表达遵循 Clear / Calm / Precise / Forward；采用全局层—任务层—内容层三级信息结构、8px spacing scale 与每页一个主操作。AI 紫仅用于 AI 内容、过程和操作状态，不覆盖普通导航或常规业务工作台。
- 正式实现复用 `@ole/tokens` 与 `@ole/ui`；不得用页面级临时样式绕过设计变量、组件状态或无障碍语义。
- 对数据、诊断、推荐和生成结果，展示组织范围、数据时间、数据来源、涉及对象、AI 状态、估计不确定性或待复核状态。
- 展示可执行动作、失败原因与恢复入口；异步任务按真实处理阶段表达，不伪造百分比，并至少覆盖 loading / success / partial success / failure / stopped / retry。单题、单页或单文件失败只阻断自身，其他成果保留并可恢复。
- 状态不得仅依赖颜色表达；Web 验收以 WCAG 2.2 AA 为基线。
- 发布、删除、批量修改、导出、分享和权限变更必须先说明影响范围并再次确认。
- 生成、待确认、完成、发布、分析是独立状态；AI 只生成带依据的候选，不直接发布试卷、结果、诊断或教学任务。
- 指标展示必须携带口径、样本、分子分母、截止时间、版本、可比性与排除项；无证据、不可比或权限受限显示明确状态，不用 `0` 代替。

### 3.6.2 Domain Invariants（领域不变量）

- 组织结构 ≠ 校区边界 ≠ 任职关系。
- 组织内关系状态 ≠ 全局账号状态。
- 设备资产归属 ≠ 安装位置。
- 设备业务状态 ≠ 安装位置；位置变更不能隐式改变启用、停用、故障或维修状态。
- 任职关系 ≠ 任教关系。
- 校区、空间和设备资产主数据由 OLE 平台侧管理，学校侧对主数据只读；学校侧可在授权范围内维护业务关系、绑定或变更安装位置并处理异常，这些动作不得改写资产归属。
- 基础设置引导 ≠ 独立冷启动业务；引导流程复用正式设置页面、领域命令与权限，不复制一套平行业务。
- 手机号、证件号等敏感字段在界面默认脱敏；导出须单独授权并记录审计事件。

### 3.6.3 Batch Job Contract（批量作业契约）

批量导入统一经历 upload → validation → conflict resolution → execution → result；结果允许部分成功，并提供幂等重试、逐项错误、操作人、组织范围、输入版本与审计记录。

---

# PART 4 AI Learning Intelligence Layer（AI 学习智能层）

AI 学习智能层由七个职责引擎构成：Learning Diagnosis、Similarity Training、Learning Path、Teaching Intelligence、Goal Planning、Home-School Collaboration、Learning State。引擎名称代表稳定的业务职责和契约，不要求一项引擎对应一个进程、服务或模型。

| 编号 | 规范引擎 | 中文名称 | 核心职责 |
|---|---|---|---|
| 4.1 | Learning Diagnosis Engine | 学习诊断引擎 | 基于状态与证据形成可复核的诊断假设 |
| 4.2 | Similarity Training Engine | 相似训练引擎 | 组织相似题检索、变式训练、训练编排和反馈 |
| 4.3 | Learning Path Engine | 学习路径引擎 | 形成并调整受目标、先修、状态和资源约束的学习路径 |
| 4.4 | Teaching Intelligence Engine | 教学智能引擎 | 为教师提供可追溯、可复核的教学决策候选 |
| 4.5 | Goal Planning Engine | 目标规划引擎 | 表达、协调并分解教育目标，形成规划约束 |
| 4.6 | Home-School Collaboration Engine | 家校协同引擎 | 形成经授权的披露判断、适龄解释、反馈摘要和协同建议 |
| 4.7 | Learning State Engine | 学习状态引擎 | 维护带用途、版本、证据窗口与不确定性的学习状态 |

七引擎共享以下运行约束：

- 1. 只消费带版本、来源、用途和授权上下文的输入
- 2. L3 已提交 Evidence 是状态更新和诊断的事实入口；L2 不直接消费未经提交的原始行为
- 3. 引擎输出分为状态、假设、候选和披露/解释建议，不得混写为学生事实；任务、消息、确认和异议等业务记录由 L1 持有
- 4. 高影响行动必须进入 L1 人工复核或明确授权的业务流程
- 5. 模型、规则、提示、检索配置和评测 Profile 均须版本化并可回滚
- 6. 引擎间通过不可变引用和显式 handoff 协作，不共享隐式可变状态

规范闭环：

```text
Goal Planning Constraint + Learning State Snapshot
        ↓
Learning Diagnosis Hypothesis
        ↓
Similarity Training / Learning Path / Teaching Intelligence Candidate
        ↓
L1 Review and Execution
        ↓
Observation Candidate → L5 → L4 → L3 Evidence Commit
        ↓
Learning State Update
        ↓
Home-School Collaboration（仅在授权范围内形成协同反馈）
```

## 4.1 Learning Diagnosis Engine（学习诊断引擎）

### 4.1.1 Definition

Learning Diagnosis Engine 基于 Learning State Engine 发布的状态快照、L3 已提交证据及八图谱关系，形成可支持、反驳、限制和人工复核的诊断假设。诊断结论属于限定用途的解释性假设，不构成学生固有属性或因果事实。

### 4.1.2 Contract

| 项目 | 规范 |
|---|---|
| 输入 | `learning_state_snapshot_ref`、L3 evidence refs、Question / Knowledge / Skill / Capability / Assessment refs、用途与授权上下文 |
| 输出 | `diagnosis_hypothesis_ref`、备选解释、支持/反对证据、不确定性、适用范围、复核状态与失效时间 |
| 所有权 | 诊断请求、冻结输入、假设版本、复核、拒绝和失效记录 |
| 不承担 | BKT 或能力测量、原始行为采集、学生画像固化、因果判断、自动干预 |

### 4.1.3 Processing

```text
Authorized Request
  → freeze state / evidence / graph versions
  → evidence sufficiency and freshness check
  → competing-hypothesis formation
  → rule / graph / optional model evaluation
  → abstain or publish reviewable hypothesis
  → human review / correction / rejection
```

Phase 1 使用规则、图关系和可解释统计形成知识维度假设。能力维度仅引用 `skill_evidence_summary` 与 Capability Graph 定义；没有获批 Measurement Profile 时，不输出能力概率。

## 4.2 Similarity Training Engine（相似训练引擎）

### 4.2.1 Definition

Similarity Training Engine 根据目标约束、学习状态和诊断假设，完成相似题候选检索、约束过滤、变式生成、训练序列编排与结果反馈。相似度只用于候选发现，不能单独决定训练动作。

### 4.2.2 Contract

| 项目 | 规范 |
|---|---|
| 输入 | 状态快照、诊断假设、目标约束、Question / Knowledge / Skill / Capability refs、难度校准与授权范围 |
| 输出 | 训练候选、选择依据、替代项、难度与覆盖说明、训练计划、复核记录 |
| 所有权 | 训练请求、候选集合、约束快照、训练编排、生成记录和审核记录 |
| 不承担 | OCR、图谱提交、学习状态更新、跨业务域通用推荐、未经校准的难度宣称 |

候选排序至少综合知识与技能映射、能力目标、解法结构、难度 Profile、历史暴露、内容安全、版权与组织授权。向量邻近不得直接发布为“相似题”正式关系。

训练结果按 Observation Candidate 回流 L5，经 L4 处理和 L3 Evidence commit 后，才可触发 Learning State Engine 更新。

## 4.3 Learning Path Engine（学习路径引擎）

### 4.3.1 Definition

Learning Path Engine 将 Goal Planning Engine 的目标约束、Learning State Engine 的状态快照、Learning Diagnosis Engine 的假设，以及 Curriculum / Knowledge / Skill / Capability Graph 的已发布关系，转换为可编辑、可解释、可重算的学习路径。

### 4.3.2 Contract

| 项目 | 规范 |
|---|---|
| 输入 | 目标约束、状态快照、诊断假设、课程与先修关系、资源与时间约束 |
| 输出 | 路径候选、节点目标、依赖、节奏、替代路径、重规划条件和解释 |
| 所有权 | 路径版本、约束快照、节点状态、人工调整、重规划与失效记录 |
| 不承担 | 目标价值裁决、状态估计、证据提交、资源主数据维护 |

路径节点必须引用已发布对象和版本，不得将模型推断的先修关系直接写入 L3。状态变化、目标变化、资源不可用或证据不足时，系统生成新版本，不覆盖历史路径。

## 4.4 Teaching Intelligence Engine（教学智能引擎）

### 4.4.1 Definition

Teaching Intelligence Engine 将班级状态、学生级诊断假设、课程进度、教学目标和 Teaching Graph 的已发布策略，转换为教师可复核的教学候选。教师保留选择、调整、执行和拒绝权。

### 4.4.2 Contract

| 项目 | 规范 |
|---|---|
| 输入 | 班级状态投影、诊断假设引用、课程进度、目标约束、Teaching / Capability / Evidence refs |
| 输出 | 教学重点、分组候选、备课方案、课堂活动、反馈观察和复盘候选 |
| 所有权 | 教学候选、解释、适用上下文、教师复核和执行引用 |
| 不承担 | 创建学生诊断事实、改写学习状态、自动分层、替代教师决定 |

分组是可撤销、可复核的教学候选，不得固化为学生标签。所有班级聚合须声明人群范围、证据窗口、缺失数据、模型与校准版本。

## 4.5 Goal Planning Engine（目标规划引擎）

### 4.5.1 Definition

Goal Planning Engine 统一表达机构目标、教学目标、学习目标、评价目标、学生意愿和家长期望，识别冲突并形成供学习路径、相似训练和教学智能使用的版本化规划约束。

### 4.5.2 Contract

| 项目 | 规范 |
|---|---|
| 输入 | 各体验域授权目标、Learning State snapshot、课程要求、时间与资源约束 |
| 输出 | 目标版本、优先级建议、冲突记录、里程碑、成功条件和规划约束 |
| 所有权 | 目标、目标关系、确认、冲突、调整和失效记录 |
| 不承担 | 自行裁决价值冲突、生成诊断假设、估计学习状态、直接安排资源 |

系统可以说明冲突和后果，不能替利益相关方决定价值优先级。Phase 1 可采用经业务方确认的静态目标约束；动态目标协调在完成权限和交互验证后启用。

## 4.6 Home-School Collaboration Engine（家校协同引擎）

### 4.6.1 Definition

Home-School Collaboration Engine 负责学校、教师、学生与家庭之间经授权的信息选择、披露判断、适龄解释、反馈摘要和协同建议。它不保存消息、回执、确认、异议或任务执行状态；这些业务记录由 L1 Family / Teaching Experience 及其领域服务持有。该引擎不向家长开放教师权限，也不生成新的学习诊断。

### 4.6.2 Contract

| 项目 | 规范 |
|---|---|
| 输入 | 已获权目标摘要、状态与诊断的可披露投影、教师反馈、家庭观察、协同任务和沟通偏好 |
| 输出 | 可披露内容、家长可理解摘要、协同建议、建议接收人、有效期和升级条件 |
| 所有权 | 披露策略版本、解释规则、摘要与建议结果及其证据引用；不拥有业务协同状态 |
| 不承担 | 消息与任务管理、确认与异议记录、学习状态估计、诊断生成、教学决定、越权访问、自动问责 |

### 4.6.3 Disclosure and Authorization

每次披露必须按组织、监护关系、学生年龄、用途、字段、期限和撤回状态重验。家长侧默认展示面向行动的摘要，不暴露教师内部备注、其他学生数据、模型内部特征或超出用途的原始证据。

家庭反馈由 L1 业务流程接收，先作为 Observation Candidate 保存，不因家长提交而直接成为 L3 Evidence。确认、异议和争议记录与学习证据分开管理，防止将协同意见写成学生事实。

### 4.6.4 Lifecycle

L2 建议结果采用 `generated → available → expired / withdrawn` 生命周期。L1 Collaboration Case 可采用 `draft → awaiting_consent → active → awaiting_response → resolved / disputed → closed`，但其状态不属于 L2。授权撤回、学生转学、任教关系变化或数据过期时，L1 立即限制访问，L2 重新计算可披露范围并使旧建议失效。

## 4.7 Learning State Engine（学习状态引擎）

### 4.7.1 Definition

Learning State Engine 是学习状态的唯一生成者和所有者。它只以 L3 已提交的 Evidence Reference 为输入，维护带预定用途、人群范围、模型版本、证据窗口和不确定性的状态估计。

### 4.7.2 Contract

| 项目 | 规范 |
|---|---|
| 输入 | L3 committed evidence refs、Knowledge / Question / Skill / Capability / Assessment refs、Measurement Profile |
| 输出 | `learning_state_snapshot_ref`、知识掌握后验、趋势、不确定性、证据窗口和能力证据摘要 |
| 所有权 | 个体状态、群组聚合投影、模型版本、更新记录、校准与失效状态 |
| 不承担 | 诊断解释、目标协调、路径生成、训练选择、教学决定或家校披露 |

Phase 1 只运行 BKT 并输出知识概念的 `knowledge_mastery`。Skill 与 Capability 维度仅输出证据摘要。能力概率须在构念、Q-matrix 或量规、校准、稳定性、子群误差和人工复核流程通过独立 ADR 后启用。

状态值、估计不确定性、展示等级和风险等级分别建模。群组状态只能按获批 Aggregation Profile 生成只读投影，不得回写个体状态。

### 4.7.3 Implementation Profile

Phase 1 使用 PostgreSQL 保存状态快照、更新日志、模型与证据引用；BKT 可在模块化单体或独立 AI Worker 中运行。通过 outbox 接收 EvidenceCommitted 事件并保证幂等更新。DKT、CDM、IRT 和其他模型只作为离线候选，未获 ADR 批准前不得进入生产状态链。

## 4.8 Shared Technical Capabilities（共享技术能力）

Graph Access、Vector Retrieval、Versioned Rule Runtime、Candidate Ranking、Model Gateway 和 Evaluation 是七引擎共用的技术能力，不构成第八个引擎。Candidate Ranking 只按上游引擎请求排序候选，不拥有学习、教学或家校行动决策。

## 4.9 Activation Priority（启用优先级）

| 阶段 | 启用范围 |
|---|---|
| Phase 0 | Measurement Profile、事件契约、权限、审计和非 AI 基线 |
| Phase 1 | Learning State、Learning Diagnosis、Similarity Training |
| Phase 2 | Institutional / Teaching / Family 体验基础扩展；复用 Phase 1 引擎输出，并建设 Teaching Intelligence、Home-School Collaboration 的接口、数据与人工流程基线，不激活其自动候选能力 |
| Phase 3 | Goal Planning、Learning Path、Teaching Intelligence、Home-School Collaboration，以及七引擎间完整 handoff |
| Phase 4 | 与 Capability Asset Portfolio 的受控复用、监测和再验证 |

---

# PART 5 Educational World Model Layer（教育世界模型层）

L3 Educational World Model 由八张相互关联、协同发布的图谱构成。图谱用于表达教育对象及其正式关系，不负责学习状态估计、诊断、训练、规划或资产准入。

每张图谱独立版本化；`GraphRelease` 记录某一激活范围内通过兼容性校验的八图版本指针集合。存在强一致性依赖的图组联合切换，其余图谱可以独立发布；回滚以受影响的最小兼容图组为边界，不要求每次变更都重发八图。Evidence Graph 的高频证据提交与课程、本体等低频结构发布采用不同节奏，但任何激活组合都必须通过引用完整性和版本兼容性检查。正式节点与关系只能来自带来源、版本和复核记录的 `PublishedAssertionVersion`。模型置信、向量邻近、共现和 Agent 候选只能进入提案流程，不能直接成为正式关系。

| 图谱 | 核心问题 | 主要服务对象 |
|---|---|---|
| Curriculum Graph | 学什么、按什么阶段和顺序学、达到什么目标 | 目标规划、学习路径、教学智能 |
| Knowledge Graph | 有哪些知识、知识之间如何关联 | 学习诊断、相似训练、学习路径 |
| Question Graph | 题目测量什么、如何求解、与哪些对象关联 | 相似训练、学习诊断、评价 |
| Skill Graph | 完成具体任务需要哪些可观察技能 | 题目映射、评价、能力证据摘要 |
| Assessment Graph | 如何测量、评分和解释结果 | 学习状态、学习诊断、教学智能 |
| Evidence Graph | 哪些观察已经提交、来源和限制是什么 | 学习状态、学习诊断、审计追溯 |
| Teaching Graph | 教学目标、活动、策略和观察如何关联 | 教学智能、教师体验 |
| Capability Graph | 综合能力如何定义、构成、发展和迁移 | 七引擎、L0 资产引用 |

## 5.1 Curriculum Graph（课程图谱）

### Definition

Curriculum Graph 表达课程标准、学段、年级、学科、课程、主题、单元、章节和学习目标之间的组织关系，并登记正式的学习顺序和目标映射。教材目录和教学计划是课程图谱的来源或投影，不能单独代表课程结构。

### Core Model

| 类型 | 主要内容 |
|---|---|
| Entity | CurriculumStandard、Stage、Grade、Subject、Course、Theme、Unit、Chapter、LearningObjective |
| Relation | contains、aligned_to、precedes、requires、targets、equivalent_to |
| Event | CurriculumPublished、ObjectiveRevised、AlignmentApproved、CurriculumRetired |
| Context | 地区、学段、教材版本、学科、适用时间和发布范围 |

### Contract and Boundary

课程关系必须引用课程标准、教材版本或经批准的课程设计。Curriculum Graph 不保存学生学习进度，不生成学习路径，也不根据使用频率自动调整正式顺序。Learning Path Engine 读取课程与先修关系后形成路径候选；路径执行结果不会反向覆盖课程定义。

### Implementation

Phase 1 建设一个学科的课程、单元、章节、学习目标和必要先后关系。PostgreSQL 保存正式版本和发布记录，Graph Access Adapter 提供关系查询；独立图数据库由查询复杂度和负载触发。

## 5.2 Knowledge Graph（知识图谱）

### Definition

Knowledge Graph 表达知识概念、定义、表示形式、方法、例子和知识关系，为诊断、路径和训练提供可追溯的知识结构。

### Core Model

| 类型 | 主要内容 |
|---|---|
| Entity | KnowledgeConcept、Definition、Representation、Method、Example、MisconceptionDefinition |
| Relation | is_a、part_of、prerequisite_of、related_to、represented_by、applied_in |
| Event | ConceptPublished、RelationReviewed、ConceptMerged、ConceptRetired |
| Context | 学科、年级、课程版本、语言、用途和有效期 |

### Contract and Boundary

正式知识关系必须有来源、方向、范围、版本和质量记录。L4 可以提出关系候选，L3 负责约束校验和发布。Knowledge Graph 不保存学生掌握度、薄弱点或诊断结论；这些信息分别由 Learning State Engine 和 Learning Diagnosis Engine 管理。

### Implementation

Phase 1 建设闭环所需知识概念、课程映射和先修关系。语义向量用于候选检索，不能替代正式关系。关系变更通过新版本发布，不静默覆盖历史版本。

## 5.3 Question Graph（题目图谱）

### Definition

Question Graph 表达题目、题干结构、选项、答案、解法、知识与技能要求、评价用途和校准引用。题目在系统中按测量与学习活动对象管理，文本和测试结果分别作为其内容与观察记录。

### Core Model

| 类型 | 主要内容 |
|---|---|
| Entity | Question、QuestionVersion、Stem、Option、AnswerKey、Solution、Method、DifficultyProfileRef |
| Relation | assesses、requires_knowledge、requires_skill、uses_method、variant_of、aligned_to_objective |
| Event | QuestionIngested、QuestionReviewed、CalibrationLinked、QuestionRetired |
| Context | 学科、年级、题型、来源、版权、语言、用途和授权范围 |

### Contract and Boundary

题目—知识、题目—技能和题目—能力关系必须经过标注、质量校验和必要的人工复核。相似度、生成模型声明和共现不能直接成为正式关系。实际难度只能引用带人群、样本、时间窗、方法、区间和限制的校准记录。

Question Graph 不生成相似训练计划，不维护学生作答状态，也不把错误观察固化为知识缺口。Similarity Training Engine 负责候选选择与训练编排；Learning Diagnosis Engine 负责形成可复核假设。

### Implementation

Phase 1 支持题目版本、结构解析、知识与技能映射、答案和解法引用，以及必要的校准引用。原始题目文件保存在 L5，抽取候选由 L4 产生，正式题目版本由 L3 发布。

## 5.4 Skill Graph（技能图谱）

### Definition

Skill Graph 表达完成具体任务所需的可观察技能、技能分解、技能依赖和测量映射。Skill 强调任务表现单元；Capability 强调跨任务、跨情境的综合能力构念。

### Core Model

| 类型 | 主要内容 |
|---|---|
| Entity | Skill、SkillComponent、PerformanceIndicator、RubricRef、TaskType |
| Relation | composed_of、depends_on、required_by、demonstrated_in、measured_by、supports_capability |
| Event | SkillDefined、MappingReviewed、RubricApproved、SkillRetired |
| Context | 学科、任务、年级、场景、构念和 Measurement Profile |

### Contract and Boundary

Skill Graph 保存技能定义和正式映射，不保存个体技能状态。Phase 1 只支持 `skill_evidence_summary`：记录证据数量、覆盖、时间窗、来源和质量，不将其解释为能力高低。技能概率须在 Measurement Profile 完成构念、量规、校准、稳定性和子群误差验证后，由 Learning State Engine 输出。

### Implementation

Phase 1 建设 minimal Skill vocabulary 和 `question_requires_skill` 映射。Skill ID、定义、版本和映射依据必须稳定，为后续能力测量和 Capability Graph 提供基础。

## 5.5 Assessment Graph（评价图谱）

### Definition

Assessment Graph 表达评价目标、构念、任务、量规、评分规则、结果语义和解释限制，使评价结果能够按版本和用途被正确解释。

### Core Model

| 类型 | 主要内容 |
|---|---|
| Entity | Assessment、AssessmentVersion、Construct、Task、Rubric、ScoreScale、ResultRef、MeasurementProfileRef |
| Relation | measures、contains_task、uses_rubric、aligned_to_objective、produces_result、informs_state |
| Event | AssessmentPublished、ResultCommitted、RubricRevised、ProfileApproved |
| Context | 人群、学科、场景、时间窗、施测条件、用途和解释限制 |

### Contract and Boundary

Assessment Graph 定义如何测量和解释，不负责生成学习状态或诊断。分数、等级和能力状态不得互相替代。结果必须保留原始量尺、转换方法、版本和限制；只有 L3 已提交的结果引用才能进入 L2 状态与诊断流程。

### Implementation

Phase 1 建设与训练闭环相关的 Assessment、Task、Rubric 和 Result Reference。复杂能力评价、IRT、CDM 等 Profile 在验证和 ADR 批准后启用。

## 5.6 Evidence Graph（学习证据图谱）

### Definition

Evidence Graph 组织已经提交的学习观察、作答、结果、反馈和上下文引用，提供可追溯的事实基础。证据说明“观察到什么”，不直接说明“为什么发生”或“由什么造成”。

### Core Model

| 类型 | 主要内容 |
|---|---|
| Entity | EvidenceRecord、ObservationRef、AttemptRef、AssessmentResultRef、FeedbackRef、StateSnapshotRef |
| Relation | observes、produced_by、about_question、under_context、derived_from、followed_by |
| Event | EvidenceCommitted、EvidenceCorrected、EvidenceWithdrawn、StateReferenceLinked |
| Context | 组织、主体、任务、时间、设备、场景、授权、数据质量和保留期限 |

### Contract and Boundary

只有完成 L5 持久化、L4 映射与质量治理，并通过 L3 commit 的记录才能成为 Evidence。Evidence Graph 不运行 BKT，不生成诊断，不把单次观察解释为掌握、能力或因果效果。证据撤回或修正必须产生新事件，并触发相关状态和分析结果的重算或失效。

### Implementation

Phase 1 支持作答、反馈、评价结果和状态快照引用，使用幂等事件、outbox、版本和血缘保证可重放。原始行为仍保存在 L5，L3 保存正式证据引用和关系。

## 5.7 Teaching Graph（教学图谱）

### Definition

Teaching Graph 表达教学目标、活动、策略、资源、课堂组织方式及其适用上下文和观察结果引用，为教师体验和 Teaching Intelligence Engine 提供可追溯的教学知识。

### Core Model

| 类型 | 主要内容 |
|---|---|
| Entity | TeachingObjective、TeachingActivity、TeachingStrategy、LessonPattern、ResourceRef、ObservationProtocol |
| Relation | targets、uses_resource、applies_strategy、suitable_for、precedes、observed_with |
| Event | TeachingPlanPublished、ActivityExecuted、FeedbackCommitted、StrategyRevised |
| Context | 学科、年级、班级、课程进度、教学场景、资源条件和适用范围 |

### Contract and Boundary

Teaching Graph 保存已发布的教学定义、策略和观察关联，不生成教学建议，也不宣称某一策略造成学习提升。Teaching Intelligence Engine 结合状态、诊断和目标形成候选；教师负责确认和执行。经过效果验证的可复用教学成果可以进入 L0 Candidate 流程，但不会自动成为能力资产。

### Implementation

Phase 2 建设教学目标、活动、资源和基础策略查询；Phase 3 接入 Teaching Intelligence Engine。策略效果必须通过独立研究或验证流程登记，不能从普通课堂相关性直接推断。

## 5.8 Capability Graph（能力图谱）

### Definition

Capability Graph 是世界模型的第八张图，表达综合能力的定义、维度、组成、依赖、发展阶段、表现情境和迁移关系。它回答“需要形成什么能力、能力由什么构成、在何种情境中表现”，不负责认定某种方案已经成为可复用资产。

### Core Model

| 类型 | 主要内容 |
|---|---|
| Entity | Capability、CapabilityDimension、DevelopmentStage、ContextProfile、MeasurementProfileRef |
| Relation | composed_of、depends_on、develops_toward、transferable_to、demonstrated_in、measured_by、supported_by_skill |
| Event | CapabilityDefined、RelationReviewed、MeasurementProfileApproved、CapabilityRetired |
| Context | 人群、学科、年级、任务、场景、用途、时间窗和限制 |

### Contract and Boundary

Capability Graph 保存能力本体、结构关系、测量方案引用和已提交证据引用，不保存未经验证的学生标签，不运行能力估计，也不解释教育效果。个体状态由 Learning State Engine 管理，诊断假设由 Learning Diagnosis Engine 管理，经验证的复用成果进入 L0 Capability Asset Portfolio。

### Implementation

Phase 1 预留能力 ID、定义、Skill 映射和 Measurement Profile 引用；在构念与测量契约明确后逐步发布正式关系。L0 资产可以引用 Capability Graph 的已发布版本，但不得反向改写历史世界模型。

---

# PART 6 Capability Asset Portfolio（能力资产组合）

## 6.1 Definition and Boundary（定义与边界）

Capability Asset Portfolio 是独立的 L0 能力资产治理层，负责管理已验证教育成果的候选接收、验证引用、人工准入、版本登记、组合、授权复用、持续监测、迁移复验、限制和退役。

L3 Capability Graph 描述教育世界中的能力定义、结构、依赖、发展和迁移关系；L0 Capability Asset Portfolio 管理已经通过效果与适用范围验证、可在限定用途内复用的成果。Portfolio 可使用关系或图投影实现，但不计入 Educational World Model 的八图谱。

L0 不承担以下职责：

- 从原始数据中自动挖掘并发布资产；
- 运行学习状态估计、诊断或推荐模型；
- 保存一般学生画像、原始学习行为或普通知识对象；
- 以证据数量、相关性、模型置信或专家直觉替代教育效果验证；
- 允许资产脱离适用范围、版本和授权条件直接复用。

## 6.2 Capability Asset Taxonomy（能力资产分类）

| 资产类型 | 示例 | 必需验证重点 |
|---|---|---|
| Learning Strategy Asset | 相似训练策略、学习路径策略 | 学习增益、延迟保持、适用人群与失败边界 |
| Teaching Strategy Asset | 课堂活动、差异化教学方案 | 教师可执行性、教学结果、工作负担与子群影响 |
| Diagnostic Protocol Asset | 诊断流程、证据解释协议 | 测量有效性、校准、教师复核一致性与误判成本 |
| Assessment Profile Asset | 量规、测量 Profile、评价流程 | 构念效度、信度、公平性、用途与解释限制 |
| Collaboration Pattern Asset | 家校协同流程、反馈机制 | 授权、参与率、可执行性、风险与教育结果 |
| System Capability Asset | 已验证的编排、治理或安全能力 | 可靠性、安全性、兼容性、运维与恢复能力 |

内容、模型、提示、规则、图谱节点或单次行动不单独构成能力资产。它们可以作为资产版本的实现依赖，由不可变引用和制品哈希登记。

## 6.3 Candidate Formation Boundary（候选形成边界）

候选形成位于 L4 或独立获批的分析域，不属于 L0。Candidate Factory 负责从 L1 运行结果、L2 引擎输出和 L3 八图谱版本引用中形成候选，并冻结候选形成时的用途、输入、方法和版本。

```text
L1 Observed Outcomes + L2 Versioned Outputs + L3 Eight-Graph References
        ↓
Approved Analysis / Candidate Factory
        ↓
Versioned Capability Candidate Dossier
        ↓
L0 Intake Validation
```

每个 Candidate Dossier 至少包含：

- candidate ID、名称、责任人与提出时间；
- Capability Claim 与预定用途；
- 目标人群、学科、组织、场景和时间窗；
- 禁止用途与已知限制；
- L1/L2/L3/L4/L5 不可变来源引用；
- 模型、规则、提示、策略和数据版本；
- 候选形成方法与选择偏差说明；
- 拟验证的 estimand、比较条件、指标和非 AI 基线；
- 失败样本、子群和风险评审计划。

候选生命周期：`draft → submitted → intake_rejected / accepted_for_validation`。候选记录与已准入资产必须分表、分权限、分检索索引管理。

## 6.4 Validation Dossier（验证档案）

Validation Dossier 是准入的主要证据制品。它必须保留研究设计、样本、方法、结果和限制，不能压缩为单一“有效分”或置信度。

最低内容包括：
- 1. 构念、Capability Claim、estimand 与预定用途
- 2. 比较条件、非 AI 基线和研究设计
- 3. 人群、样本量、缺失数据、时间窗和排除条件
- 4. 数据、模型、策略、图谱和计算版本
- 5. 效应量、误差或置信区间、校准与不确定性
- 6. 失败样本、反例、负面结果和子群结果
- 7. 混杂、选择偏差、外部效度和可迁移性限制
- 8. 教师或专家复核结果及分歧
- 9. 安全、隐私、公平性和未成年人影响评审
- 10. 监测、降级、回滚、复验和退役建议

验证计算可以在获批分析环境中完成。L0 只保存签名后的 dossier、摘要、版本、哈希与来源引用，不复制原始研究数据。

## 6.5 Admission Governance（准入治理）

### 6.5.1 Roles

| 角色 | 职责 |
|---|---|
| Asset Sponsor | 提出资产主张并承担业务责任 |
| Validation Owner | 负责研究设计、数据质量与验证报告 |
| Educational Reviewer | 审查教育合理性、构念与适用范围 |
| Data Governance Reviewer | 审查授权、血缘、隐私、保留与撤回 |
| Safety / Risk Reviewer | 审查公平性、安全、误用与高影响风险 |
| Admission Board | 作出准入、限制准入、补充验证或拒绝决定 |
| Portfolio Owner | 负责发布、监测、限制、再验证和退役 |

同一人员不得同时独立承担 Sponsor、Validation Owner 和最终 Admission Decision。例外必须说明理由并登记审计。

### 6.5.2 Decision

Admission Decision 只能取以下结果：

- `admit`：在明确范围和版本下准入；
- `admit_with_restrictions`：附加人群、场景、期限、人工复核或用量限制；
- `request_more_evidence`：证据不足，返回验证流程；
- `reject`：不满足准入要求；
- `hold`：因风险、授权或外部依赖暂停决定。

决定必须形成不可变记录，包含签署人、时间、理由、适用范围、禁止用途、有效期、监测 Profile 和回滚条件。新版不得覆盖旧决定。

## 6.6 Portfolio Data Model（组合数据模型）

Phase 4 以 PostgreSQL 作为 Portfolio 事实源。核心实体如下：

| Entity | 说明 |
|---|---|
| `capability_candidate` | 候选主记录 |
| `candidate_dossier_version` | 候选档案版本与制品哈希 |
| `validation_dossier_version` | 验证档案版本 |
| `admission_decision` | 不可变准入决定 |
| `capability_asset` | 稳定资产身份 |
| `capability_asset_version` | 可发布、可冻结的资产版本 |
| `applicability_profile` | 适用人群、学科、组织、场景和用途 |
| `prohibited_use` | 禁止用途与限制 |
| `asset_dependency` | 对模型、规则、提示、工作流和八图谱版本的依赖 |
| `asset_component` | 资产组合关系 |
| `transfer_validation` | 新场景迁移验证 |
| `activation_record` | 每次获权启用记录 |
| `monitoring_profile` | 监测指标、窗口和触发条件 |
| `monitoring_result` | 运行结果、漂移、失败与子群监测 |
| `restriction_record` | 限制、暂停和恢复记录 |
| `retirement_record` | 退役决定和替代资产引用 |
| `source_reference` | L1–L5 不可变来源引用 |

资产生命周期：

```text
draft
  → candidate
  → validating
  → under_review
  → admitted
  → active
  → restricted / suspended
  → revalidating
  → deprecated
  → retired
```

状态迁移只能由对应领域事件和获权命令触发。效果、不确定性、适用性和迁移性保留在 dossier 与 Profile 中，不压缩为生命周期状态。

## 6.7 Asset Package and Versioning（资产包与版本）

每个 `CapabilityAssetVersion` 是可冻结、可签名、可审计的资产包：

```text
Capability Asset Version
├── Asset Manifest
├── Capability Claim
├── Applicability Profile
├── Prohibited Uses
├── L3 Eight-Graph Version References
├── L2 Engine / Profile References
├── Model / Rule / Prompt / Strategy References
├── Validation Dossier
├── Admission Decision
├── Runtime Contract
├── Monitoring Profile
├── Rollback Contract
└── Retirement Conditions
```

资产包只保存引用、版本和哈希，不复制其依赖制品。任何依赖变更都产生新资产版本，并按变更影响触发兼容性评估、局部验证或完整再验证。

## 6.8 Reuse and Activation Contract（复用与启用契约）

资产处于 `active` 状态仍不能直接执行。L1 和 L2 必须通过 Capability Activation Gateway 申请启用，并在服务端重新校验：

- 当前组织、用户、角色和用途授权；
- 人群、学科、年级、任务和场景是否落入适用范围；
- 请求用途是否命中禁止用途；
- 资产、八图谱、引擎、模型、规则和策略版本是否兼容；
- 资产是否过期、受限、暂停、降级或退役；
- 当前是否满足人工复核、灰度、样本量和用量限制；
- 监测与审计链路是否可用。

审计、监测或授权校验不可用时，启用失败并返回明确原因。

建议接口：

```text
GET  /capability-assets
GET  /capability-assets/{assetId}/versions/{version}
POST /capability-assets/{assetId}/eligibility-check
POST /capability-assets/{assetId}/activation-requests
POST /capability-assets/{assetId}/usage-results
POST /capability-assets/{assetId}/revalidation-requests
```

`eligibility-check` 只返回当前请求是否满足准入范围及原因，不扩大数据访问权限。`activation-request` 成功后生成带期限、范围和版本的 `activation_ref`；引擎运行结果必须回传该引用。

## 6.9 Monitoring, Restriction and Retirement（监测、限制与退役）

每项资产在准入时必须绑定 Monitoring Profile，至少规定：

- 主要教育效果和安全指标；
- 非 AI 或现行方案基线；
- 样本、人群、子群和时间窗；
- 预期区间与最小有效样本；
- 失败率、校准、漂移和子群差异阈值；
- 人工抽检频率；
- 限制、暂停、复验、回滚和退役条件。

典型事件：

| Event | 说明 |
|---|---|
| `CapabilityCandidateSubmitted` | 候选档案提交 |
| `CapabilityValidationCompleted` | 验证档案冻结并签名 |
| `CapabilityAssetAdmitted` | 准入决定生效 |
| `CapabilityAssetActivated` | 在限定范围内启用 |
| `CapabilityMonitoringThresholdBreached` | 监测阈值越界 |
| `CapabilityAssetRestricted` | 限制用途、人群或场景 |
| `CapabilityAssetSuspended` | 暂停全部新启用 |
| `CapabilityRevalidationRequested` | 进入再验证 |
| `CapabilityAssetDeprecated` | 停止新增使用并提示替代版本 |
| `CapabilityAssetRetired` | 终止使用并保留历史审计 |

限制和退役不能删除历史 activation、运行结果或准入记录。受影响的活跃实例必须按 Rollback Contract 完成通知、替换、降级或终止。

## 6.10 Transfer and Revalidation（迁移与再验证）

资产迁移到新学科、年级、组织、人群或教学场景时，原验证结论不自动继承。迁移申请必须登记目标场景与原适用范围的差异，形成新的 Transfer Validation，并由 Admission Board 确认扩大范围、保持限制或拒绝迁移。

以下变化至少触发再验证：

- Capability Claim、预定用途或目标人群变化；
- 八图谱、Measurement Profile、模型或核心规则的非兼容变更；
- 关键教育效果低于准入阈值；
- 失败率、漂移或子群差异越界；
- 数据来源、授权或研究结论被撤回；
- 安全、法律或伦理要求发生变化。

## 6.11 Service and Storage Architecture（服务与存储架构）

```text
Candidate Factory（L4 / Approved Analysis Domain）
        ↓ versioned dossier
Portfolio Intake Service
        ↓
Validation Registry
        ↓
Admission Workflow
        ↓
Asset Registry（PostgreSQL fact source）
        ├── Object Storage：dossier、报告、签名制品
        ├── pgvector：已准入资产的授权语义检索
        ├── Graph Projection：组合、依赖和迁移查询的可重建投影
        └── Outbox：准入、启用、限制、退役事件
        ↓
Capability Activation Gateway
        ↓
L1 / L2 Authorized Runtime
        ↓
Monitoring and Revalidation Service
```

Phase 4 默认采用 PostgreSQL、对象存储、pgvector 和 outbox。只有组合查询、容量或延迟基准证明必要时，才引入独立图数据库或检索产品。任何投影均从正式版本重建，不作为绕过准入流程的编辑入口。

## 6.12 Security, Authorization and Audit（安全、授权与审计）

Portfolio 操作分别授权：`VIEW_METADATA / VIEW_DOSSIER / SUBMIT_CANDIDATE / VALIDATE / REVIEW / ADMIT / ACTIVATE / RESTRICT / RETIRE / EXPORT`。每次请求按组织、职责分离、用途、对象、字段、期限和当前状态重验。

敏感 dossier 默认最小披露；验证样本和个体数据不随资产包分发。所有准入、启用、限制、导出和退役操作进入不可变审计链。审计不可用时阻断写入和启用。

## 6.13 Implementation Phases（实施阶段）

| 阶段 | 实现范围 |
|---|---|
| Phase 0 | 定义 Candidate、Dossier、Asset、版本、事件和权限契约；锁定责任角色 |
| Phase 1 | 在 L1–L5 日常闭环中保留可形成 dossier 的不可变引用；不建设完整 Portfolio |
| Phase 2 | 建立候选登记与只读验证档案原型，用于人工研究和流程验证 |
| Phase 3 | 完成 Admission Workflow、Asset Registry、授权查询和审计 |
| Phase 4 | 启用 Activation Gateway、持续监测、迁移复验、限制和退役闭环 |

Phase 1 的验收条件是来源引用、版本、血缘和结果回流能够支持未来形成 dossier，不要求提前宣称或沉淀能力资产。

---

# PART 7 Data Architecture（数据架构）

数据架构由 L4 Education Data Intelligence 和 L5 Data Foundation 构成。L5 保证数据可接入、可保存、可校验、可重放和可审计；L4 负责教育语义抽取、映射、质量、血缘和发布提案。两层可以由同一运行环境承载，但职责、状态和验收标准必须分开。

```text
Source Data / Learning Observation
        ↓
L5 Acquisition → Versioned Storage → Reliable Pipeline
        ↓
L4 Extraction → Semantic Mapping → Quality / Lineage / Review
        ↓
L3 Graph Update Proposal → Validation → Commit
```

## 7.1 L4 Education Data Intelligence（教育数据智能）

### 7.1.1 Definition and Boundary

L4 将 L5 提供的文档、题目、资源和学习观察转换为带来源、质量、版本和不确定性的教育语义提案。它不保存原始文件，不管理采集设备，也不直接修改 L3 正式图谱。

L4 的输出包括实体候选、关系候选、语义映射、质量报告、血缘记录、冲突说明和 Graph Update Proposal。候选只有经过 L3 约束校验、必要的人工复核和 commit，才成为正式世界模型对象。

### 7.1.2 Processing Pipeline

| 阶段 | 主要职责 | 输出 |
|---|---|---|
| Intake Validation | 校验输入版本、格式、来源、授权和完整性 | Accepted / Quarantined Input |
| Structure Extraction | 识别文本、版面、公式、题目和文档结构 | Structured Document Candidate |
| Entity Extraction | 识别课程、知识、题目、技能、评价、教学和能力候选 | Entity Candidate Set |
| Relation Extraction | 提取包含、先修、测量、要求和对齐关系候选 | Relation Candidate Set |
| Semantic Mapping | 对齐正式 ID、本体、课程和 Measurement Profile | Versioned Mapping Proposal |
| Quality and Review | 评估完整性、一致性、来源、冲突和不确定性 | Quality Record / Review Task |
| Proposal Formation | 冻结候选、证据、版本和审查结果 | Graph Update Proposal |

### 7.1.3 Knowledge Extraction

Knowledge Extraction 处理教材、试卷、教案、课件和其他半结构化资源。OCR、版面分析、公式识别和题目切分属于结构理解；知识与关系识别属于语义抽取。两类结果须分别记录质量指标，避免用 OCR 准确率替代教育语义质量。

抽取结果至少包含：

- candidate ID 与类型；
- 原始文件、页码、区域或事件位置；
- 提取器、模型、提示和规则版本；
- 候选值、替代候选和不确定性；
- 目标本体与映射版本；
- 自动校验结果和人工复核状态。

### 7.1.4 Semantic Mapping

Semantic Mapping 将候选对象对齐到 L3 已发布实体或提出新实体。映射顺序为稳定 ID、确定性规则、词典或别名、受控向量检索、人工复核。向量相似度只用于候选排序，不能直接确认实体相同或关系成立。

当候选与多个正式对象冲突时，系统必须保留全部候选、差异依据和待裁决状态。禁止为提高自动通过率而静默创建重复节点。

### 7.1.5 Data Quality

质量记录分为技术质量与教育语义质量：

| 质量域 | 典型指标 |
|---|---|
| 技术质量 | 文件完整性、解析成功率、字段合法性、事件顺序和重复率 |
| 结构质量 | 版面、公式、题目边界、选项和答案结构准确性 |
| 语义质量 | 实体精确率与召回率、关系方向、映射一致性和本体冲突率 |
| 业务质量 | 适用范围、来源权威性、时效性、版权和人工复核结果 |

质量分数必须绑定 metric、样本、计算版本和用途。无校准依据的置信度只能作为内部排序信号，不能展示为可靠概率。

### 7.1.6 Data Governance

L4 Data Governance 管理教育语义提案的来源、版本、质量、血缘、冲突、复核和发布准备。正式关系只能来自可追溯来源与裁决链。撤回、纠错和来源失效必须触发受影响提案、图谱版本、状态估计和分析结果的失效评估。

治理记录至少包含 owner、组织、用途、来源、授权、数据类别、保留期、处理版本、质量结果、复核人、发布决定和下游影响范围。

### 7.1.7 Implementation Profile

Phase 1 使用独立 AI Worker 或模块化单体中的异步任务执行抽取、映射和质量处理；PostgreSQL 保存任务、候选、质量、血缘和复核状态，对象存储保存原始及中间制品，pgvector 提供受控候选检索，outbox 保证提案和事件可靠交付。

模型、OCR、标注和工作流产品均可替换。验收依据是数据合同、可追溯性、质量、重算和人工复核能力，不以选定工具作为完成标准。

## 7.2 L5 Data Foundation（数据基座）

### 7.2.1 Definition and Boundary

L5 提供数据接入、版本化存储、可靠流水线和基础控制。它保存原始事实与观察候选，保证输入在进入 L4 前不丢失、不静默覆盖，并能够按版本重放。

L5 不解释教育语义，不生成图谱正式节点，不估计学习状态，也不认定某项观察构成能力或教育效果。

### 7.2.2 Data Domains

| 数据域 | 内容 | 主要控制 |
|---|---|---|
| Document and Resource | 教材、试卷、教案、课件、图片和音视频 | 来源、版权、版本、哈希和对象存储 |
| Question Source | 题目文件、结构化题库和答案 | 版本、授权、去重和完整性 |
| Learning Observation | 作答、反馈、评价结果和学习事件 | 主体、会话、时间、用途和幂等键 |
| Teaching Observation | 课堂活动、教师反馈和教学结果 | 组织、任教关系、场景和权限 |
| Device and Terminal | 已有终端产生的交互事件 | 设备身份、安装关系、最小采集和撤回 |
| Reference Data | 组织、成员、课程、空间和配置引用 | 事实源、同步版本和隔离范围 |

### 7.2.3 Canonical Input Contract

每个输入至少包含：

```text
event_or_object_id
source_system
organization_id
subject_ref / actor_ref（按授权和最小化要求）
captured_at
received_at
schema_version
payload_hash
purpose
authorization_context_ref
retention_policy_ref
idempotency_key
```

缺少来源、用途、组织或授权上下文的敏感输入默认隔离，不进入后续处理。

### 7.2.4 Acquisition

Acquisition 支持 API、批量文件、对象存储通知、数据库变更、消息和终端事件。接入流程包括身份验证、schema 校验、病毒或恶意内容检查、哈希、幂等、组织范围确认和原始版本落盘。

批量作业允许部分成功，但必须返回逐项结果、错误原因、重试标识、操作人和审计记录。采集失败不能通过人工修改数据库绕过。

### 7.2.5 Versioned Storage

PostgreSQL 保存事务、元数据、版本、审计和恢复事实；S3-compatible object storage 保存原始文件和大制品；pgvector 保存经授权、带版本的语义表示。图访问由 L3 正式版本重建，只承担查询投影职责；L5 原始事实仍以正式存储记录为准。

原始输入采用追加版本，不静默覆盖。删除请求按法律、授权和血缘要求执行逻辑撤回、物理删除或保留证明，并记录受影响的下游版本。

### 7.2.6 Reliable Pipeline

Data Pipeline 负责校验、编排、重试、隔离、重放和交付。每个步骤必须幂等，并保存输入版本、输出版本、执行器版本、开始与结束时间、错误类型和重试状态。

```text
received → validated → persisted → queued → processing
        → completed / quarantined / failed_retryable / failed_terminal
```

L5 可以编排 L4 任务，但教育语义结果仍由 L4 所有。队列或流产品根据吞吐、顺序和恢复需求选择；Phase 1 可使用 PostgreSQL outbox 与后台任务，不强制 Kafka。

### 7.2.7 OCR and Document Processing

OCR 是教育文档理解的入口，包括文字、版面、表格、公式和题目结构识别。输出必须保留页码、坐标、置信信号、处理版本和原始区域引用。低质量页面、复杂公式和答案错位进入人工复核或隔离流程。

Document Processing 负责文件拆分、格式转换、版面结构、题目切分和上下文保真；知识实体、关系和本体对齐由 L4 完成。

### 7.2.8 Learning Observation Collection

Learning Observation Collection 保存真实学习过程中的可追溯观察候选，包括作答、修改、反馈、评价结果和任务完成记录。观察必须区分事实字段与客户端推断字段；客户端生成的“专注度”“困难”等标签不能作为事实入库。

观察经 L4 mapping、quality 和 lineage 后，只有被 L3 Evidence Graph commit 的版本化引用才能进入 Learning State Engine。单条或单类观察不能直接证明掌握、能力或因果效果。

### 7.2.9 Terminal Data Enhancement

Terminal Data Enhancement 是可选接入模块，用于接收现有教育终端产生的必要交互事件。OLE 不制造智能硬件，也不把终端数据作为核心闭环前提。

终端采集须遵循已声明用途和最小必要原则。摄像、音频、生物特征、精细行为轨迹等高敏感数据默认不采集；确需使用时必须另立专项方案，完成监护与组织授权、风险评估、端侧处理、保留删除和人工复核设计。

### 7.2.10 Foundation Controls

L5 基础控制包括多组织隔离、加密、密钥管理、访问审计、schema registry、备份恢复、保留删除、数据分类分级、监控告警和灾难恢复。敏感访问默认拒绝；审计不可用时阻断写入、导出和高影响读取。

### 7.2.11 Phase 1 Baseline

Phase 1 的数据基线为 PostgreSQL、pgvector、S3-compatible object storage（存在文档时）、outbox 和可恢复后台任务。验收必须覆盖重复事件、乱序、失败重试、隔离、重放、备份恢复、权限拒绝和来源撤回。独立图数据库、缓存、流平台和湖仓仅在量化瓶颈出现后评估。

---

# PART 8 Platform Engineering（平台工程）

Platform Engineering 是横切 L0–L5 的实现视图，覆盖领域服务、AI 运行能力、存储适配、身份权限、可观测性、部署和恢复。它不新增产品层，也不要求按逻辑模块拆成独立微服务。

## 8.1 Overall System Architecture（总体系统架构）

```text
L1 Experience and Business Commands
        ↓
L2 Seven Engine Contracts
        ↓
L3 Eight-Graph Access and Release
        ↓
L4 Semantic Processing
        ↓
L5 Data Foundation

Cross-cutting:
Identity / Authorization / Audit / AI Runtime / Storage / Observability / Security / Recovery
```

工程架构遵循以下原则：

1. **逻辑边界稳定**：六层、七引擎和八图谱不随部署拓扑变化。
2. **模块化单体优先**：Phase 1 先建立清晰模块、稳定契约和可靠后台任务。
3. **事实源明确**：PostgreSQL 保存事务、版本和审计事实；其他存储是适配器或可重建投影。
4. **AI 能力受控**：业务通过七引擎调用共享 AI Runtime，不直接调用模型并发布决定。
5. **默认安全**：授权、审计、最小披露和组织隔离在服务端执行。
6. **可恢复优先**：部署必须支持重放、备份、恢复、回滚和降级。
7. **瓶颈驱动演进**：服务拆分和中间件引入由容量、延迟、隔离或运维指标触发。

## 8.2 Backend Architecture（后端架构）

### 8.2.1 Domain Modules

后端按教育领域职责组织，不按 Controller、数据库表或页面拆分。

| 模块 | 主要职责 |
|---|---|
| Identity and Organization | 用户、组织、Membership、Employment、TeachingAssignment 和授权上下文 |
| Learning | 学习任务、会话、行动执行和结果回收 |
| Assessment | 评价定义、施测流程和结果引用 |
| Content and Question | 资源与题目业务主数据、版权和发布 |
| World Model | L3 八图提案、校验、发布、查询和回滚 |
| Learning Intelligence | L2 七引擎契约与状态、假设、候选和协同记录 |
| Data Intelligence | L4 抽取、映射、质量、血缘和复核 |
| Data Foundation | L5 接入、存储、流水线和基础控制 |
| Capability Portfolio | L0 候选接收、准入、启用、监测和退役 |

模块之间通过领域命令、查询、不可变引用和事件协作。跨模块事务优先使用本地事务与 outbox；只有在独立部署和吞吐需求明确后，才引入分布式消息设施。

### 8.2.2 API Contract

API 必须包含组织、用途、授权上下文、请求 ID、幂等键和版本信息。写入接口返回资源版本与审计引用；异步任务返回 job ID、状态、部分成功结果和逐项错误。

错误响应区分参数错误、授权拒绝、对象不存在、版本冲突、前置条件不足、可重试故障和终止性故障。客户端不得通过重试绕过权限或版本冲突。

### 8.2.3 Identity and Authorization

`User` 表示全局身份；`Organization` 表示学校、培训机构或教育集团；`Membership`、`Employment` 和 `TeachingAssignment` 分别表达成员、任职和任教关系。Teacher、Student、Parent 和 Administrator 是特定组织与场景中的角色或参与关系，不建立第二套身份实体。

授权按 `VIEW / RETRIEVE / USE_BY_AGENT / DERIVE / EXPORT / PUBLISH` 分别判定，并结合组织、角色关系、用途、对象、字段、期限和当前状态重验。敏感访问默认拒绝，导出和发布须单独授权。

### 8.2.4 Reliable Execution

后台任务必须支持幂等、重试、隔离、取消、超时和重放。所有高影响写入先形成 Candidate、Review Task 或 Handoff，经授权流程确认后提交。禁止 AI Worker 直接修改正式图谱、学习状态或能力资产。

## 8.3 AI Service Architecture（AI 服务架构）

共享 AI Runtime 为 L2 和 L4 提供可替换的技术能力，不拥有教育状态、诊断、目标或行动决定。

| 能力 | 职责 | 边界 |
|---|---|---|
| Model Gateway | 路由模型、限制参数、记录版本和成本 | 不决定业务用途和发布状态 |
| Embedding Service | 生成版本化语义表示 | 不确认实体相同或关系成立 |
| Vector Retrieval | 在授权范围内检索候选 | 不直接选择最终行动 |
| Graph Access Adapter | 查询 L3 正式版本和关系路径 | 不修改正式图谱 |
| Versioned Rule Runtime | 执行确定性规则和约束 | 不绕过引擎职责 |
| Reasoning Adapter | 生成解释或候选推理结果 | 输出必须进入引擎契约和评测 |
| Candidate Ranking | 对上游候选进行排序 | 归入共享技术能力，不单独设置引擎 |
| Evaluation and Safety | 运行离线、在线和发布门禁评测 | 不代替教育专家与责任人签署 |

七引擎按任务需要调用 LLM。普通图查询、BKT、确定性规则和相似检索可以独立运行。RAG 只在来源化生成用例获批后启用，并须返回来源、版本、授权范围和评测记录。

模型、提示、工具、规则和 Capability Profile 全部版本化。发布记录包含制品哈希、依赖、作用范围、评测结果、灰度、审批和回滚条件。新版不改写历史结果，也不扩大既有权限。

## 8.4 Storage Architecture（存储架构）

存储架构先定义访问契约，再按负载选择物理产品。

| 存储 | Phase 1 用途 | 事实源地位 |
|---|---|---|
| PostgreSQL | 事务、领域对象、图谱版本、状态、任务、审计、outbox | 规范事实源 |
| pgvector | 带版本、授权和 Profile 的语义检索 | PostgreSQL 内的检索能力 |
| S3-compatible Object Storage | 原始文档、图片、报告和大制品 | 对象事实源，元数据在 PostgreSQL |
| Graph Projection | 多跳和图查询加速 | 可从正式版本重建，仅提供查询能力 |
| Cache | 热点只读结果和短期会话 | 可丢弃，不保存唯一事实 |
| Analytics Store | 获批分析和验证数据 | 独立用途与授权，不直接发布业务事实 |

Phase 1 可由 PostgreSQL 同时提供关系、JSON、向量和必要的递归查询。独立图数据库、向量库、缓存和流平台只有在基准测试证明必要时引入。

备份必须覆盖数据库、对象、配置、密钥引用和恢复文档。恢复演练同时验证 RPO、RTO、版本兼容、outbox 重放和权限一致性。

## 8.5 Deployment Architecture（部署架构）

### 8.5.1 Phase 1 Topology

```text
Reverse Proxy / API Entry
        ↓
Modular Application
        ├── L1 Domain Modules
        ├── L2 Engine Modules
        ├── L3 World Model Module
        └── Authorization / Audit
        ↓
AI Worker and Background Jobs
        ↓
PostgreSQL + pgvector + outbox
        ↓
S3-compatible Object Storage（when documents exist）
```

部署环境可以是单机、少量虚拟机或简单托管运行时。Phase 1 不以 Kubernetes、Service Mesh、多区域或微服务数量作为生产条件。

### 8.5.2 Environment and Release

开发、测试、预发布和生产环境必须隔离配置、密钥、数据和权限。构建制品可重复、可签名并包含版本清单；发布采用数据库迁移检查、最小灰度、健康检查、自动回滚和人工确认。

### 8.5.3 Observability

可观测性覆盖请求、领域命令、AI 调用、任务、数据库、队列或 outbox、模型版本、错误、成本和教育闭环指标。日志不得记录未脱敏敏感字段。trace ID、request ID、job ID、event ID 和 asset activation ref 应可关联查询。

### 8.5.4 Scale-out Triggers

达到以下已登记阈值后，才评估物理拆分：

- 应用或 AI Worker 的独立扩缩容需求；
- 数据库容量、锁竞争、查询延迟或恢复时间超标；
- 图查询或向量检索负载超过 PostgreSQL 基线；
- 任务吞吐、顺序或重放要求超过 outbox 能力；
- 安全、组织或数据域需要独立隔离；
- 团队具备相应运维、监控和故障处理能力。

每次拆分必须形成 ADR，说明指标、备选方案、迁移、回滚、成本和责任人。

## 8.6 Phase Implementation Summary（阶段实施摘要）

| 阶段 | 工程重点 |
|---|---|
| Phase 0 | 数据契约、Measurement Profile、权限、审计、备份恢复和非 AI 基线 |
| Phase 1 | 模块化应用、AI Worker、PostgreSQL/pgvector/outbox、核心闭环和可观测性 |
| Phase 2 | 教师与家校体验、异步作业、组织级治理和部分扩展接口 |
| Phase 3 | 七引擎完整协同、性能评测和按瓶颈拆分 |
| Phase 4 | Capability Asset Portfolio、Activation Gateway、监测与再验证 |

---

# PART 9 MVP Implementation Roadmap（MVP实施路线规划）

## 9.1 Definition（定义）

MVP Implementation Roadmap（MVP实施路线规划）定义 OLE 从技术架构设计进入实际研发阶段的建设路径。

> **命名边界**：`OLE Step1` 是当前阶段级研发规划名称；本 Part 的 `Phase 0–4` 是产品技术架构内部的实施与验收阶段。两者不得混用，也不预设一一对应关系；其映射由独立的 OLE Step1 Master Plan 与 ADR 确认。

OLE MVP（最小可行产品）在有限资源条件下，围绕明确的教育问题和非 AI 基线，依次验证教育价值、测量有效性、核心技术闭环和可运营性。完整 Educational World Model（教育世界模型）属于后续阶段。

核心目标是建立 OLE 从教育数据、World Model（世界模型）、Learning Intelligence（学习智能）到 Learning Action（学习行动）的第一条可运行、可测量、可回放闭环。

## 9.2 MVP Strategic Position（MVP战略定位）

Phase 1 必需产品入口：Similarity Training Engine（自适应练习闭环）。

Phase 1–2 条件性产品入口：Organization AI Knowledge Base（组织教育知识入口）；只有获批用例需要时启用，不计入 Phase 1 学习闭环验收。

### 9.2.1 快速形成可感知且可验证的使用价值

学校立即可以感知：

- 教学资料智能化
- 知识查询效率提升
- 自适应题目检索与练习候选选择能力

### 9.2.2 不依赖完整 World Model（世界模型）

完整教育世界模型需要长期数据积累。第一阶段只建设闭环所需的四图逻辑子集、minimal Skill vocabulary / `question_requires_skill`，以及 Learning State、Learning Diagnosis 和 Similarity Training 契约；其余图谱、引擎和物理扩展按阶段激活。

### 9.2.3 建立核心资产

每次获权资料处理、题目分析或学习反馈先形成可追溯 Data / Observation Candidate；经 L5 持久化、L4 语义提案与质量/血缘处理、L3 校验和 commit 后，才形成版本化 Evidence / World Model reference。未提交、拒绝或隔离的候选不得伪装成 World Model 资产。

只有 `[Optional / Separately Authorized Phase 4]` 候选形成工作流可基于运行结果建立 Capability Candidate dossier；日常闭环默认回到 Observation Candidate → L5。候选进一步完成效果验证、适用范围与失败/子群审查、人工准入和版本治理后，才可成为 L0 Capability Asset。

## 9.3 MVP Target Architecture（MVP 目标架构）

Phase 1 选择一个组织、一个学科和一组明确授权的数据，验证一条可重复的纵向闭环。输入覆盖文档/题目与真实学习事件；输出必须能回到状态更新和下一次行动。

```text
L5  Documents / Questions / Learning Events
        ↓ OCR、结构解析、可靠接入、存储、版本、outbox
L4  Extraction / Semantic Mapping / Quality / Lineage
        ↓
L3  Curriculum / Knowledge / Question / Evidence + minimal Skill vocabulary / question_requires_skill（Phase 1 重点逻辑模型）
        ↓
L2  Learning State（BKT）→ Diagnosis Hypothesis → Similarity Training Practice
        ↓
L1  Learning Experience + authorized teacher-review surface（不激活完整 Teaching Experience）
        ↓
L1 Observation → L5 Capture / Persist → L4 Mapping / Quality / Lineage → L3 Evidence Commit → BKT State Update → Review / Next Practice
```

MVP 只优先实现闭环需要的 L3 子集，但八图本体边界、七引擎接口和 L0 资产准入契约必须预留。Graph 是逻辑模型，不要求独立图数据库；候选保留在准入工作流中，只有经过学习结果验证、适用范围与失败/子群审查、人工准入和版本治理的资产才写入 L0 Capability Asset Portfolio。

## 9.4 MVP Scope Definition

| 必须能力 | Phase 1 最小验收 |
|---|---|
| Measurement & Governance Baseline | 构念、目标人群、预定用途、非 AI 基线、样本、指标、责任人和发布门槛已锁定 |
| L5 Data Foundation | 作答与文档可靠接入、版本化存储、outbox、重放、审计和恢复可用 |
| L4 Data Intelligence | 抽取、映射、质量、血缘和人工复核可追溯、可重算 |
| L3 World Model Foundation | Curriculum / Knowledge / Question / Evidence + minimal Skill vocabulary / `question_requires_skill` 的 Phase 1 子集可查询，八图本体边界保持完整 |
| Learning State Engine | BKT 只在 L2 运行，输出知识概率、不确定性、证据窗口和模型版本 |
| Learning Diagnosis Engine | 基于状态与证据形成可复核假设、备选解释、弃权和失效记录 |
| Similarity Training Engine | 依据目标、状态、诊断假设和约束选择练习候选；相似题检索只是子能力 |
| Closed-loop Experience | 建议、依据、不确定性、复核/拒绝、错误恢复、Observation→L5→L4→L3 Evidence Commit 与状态更新可端到端回放 |

Phase 1 的 Learning State、Learning Diagnosis 和 Similarity Training 必须同批形成最小闭环，不能把任一项降为可选能力。

## 9.5 Should Have（建议建设）

| 建议能力 | 阶段边界 |
|---|---|
| Organization AI Knowledge Base + RAG | Phase 1–2 条件性；仅获批用例启用，复用 L4 文档处理与授权检索，不另建平行内容后台 |
| Institutional / Teaching Experience；完整 Skill hierarchy / dependency / measurement links；Assessment / Teaching Graph | Phase 2；Phase 1 只保留 minimal Skill vocabulary / `question_requires_skill`，不改变闭环验收 |
| Goal Planning / Learning Path / Home-School Collaboration / Teaching Intelligence | Phase 3；Planning 基于目标、L2 状态、诊断假设、L3 关系与资源约束形成候选路径 |
| Capability Asset Admission | Phase 4；只有通过效果、适用范围、失败/子群与人工复核门槛的候选才进入 L0 |

## 9.6 Not in MVP

| 暂不建设 | 原因 |
|---|---|
| Education Foundation Model | 投入规模大，且不形成 OLE 的差异化资产 |
| Unbounded Autonomous Teaching Agent | 高影响教育决定必须保留明确责任人和人工复核 |
| Complex Agent System | Phase 1 只需受控任务编排，不需要复杂自治系统 |
| Full Classroom Intelligence | 硬件数据的教育价值、授权和风险尚未完成验证 |

## 9.7 Development Phase Design（阶段设计）

阶段表示验收依赖，不承诺固定自然月；每阶段工期由数据可用性、样本质量、组织协作和基线评测重新估算。

§3.6 Experience & Interaction Contract 是所有阶段的横切验收条件：正式页面复用、学校/平台边界、组织范围、脱敏、AI 状态与不确定性、批量部分成功/重试、错误恢复和无障碍不能推迟到后续阶段；后续阶段只扩展覆盖面。

### Phase 0 — Measurement & Data Foundation（测量与数据基础）

- 固定一个学科、目标人群、预定用途、非 AI 基线和验收样本。
- 建立 Organization / Membership / Employment / TeachingAssignment 边界。
- 建立 PostgreSQL、pgvector、outbox、审计、血缘、备份恢复与可选对象存储。
- 形成文档、题目、学习事件的版本化接入和人工校准集。

验收：同一输入可重放、可重算、可追溯；测量构念与用途已由教育负责人确认。

### Phase 1 — Single-subject Closed Loop（单学科闭环）

- 构建 Curriculum / Knowledge / Question / Evidence，以及 minimal Skill vocabulary（稳定 ID / 版本）与 `question_requires_skill` 映射的闭环所需逻辑模型。
- 运行 BKT Learning State、Learning Diagnosis Hypothesis 与 Similarity Training Practice。
- 跑通两支明确分离的链路：`资源/题目 → L5 接入 → L4 语义提案/质量/血缘 → L3 Curriculum / Knowledge / Question commit`；`L1 observation → L5 接入/持久化 → L4 映射/质量/血缘 → L3 Evidence commit → L2 Learning State → Learning Diagnosis → Similarity Training → L1 next observation`。
- 界面展示来源、时间、组织范围、AI 状态、不确定性、待复核和恢复动作。

验收：9.10 的闭环、质量、延迟与人工复核指标达到经基线确认的目标。

### Phase 2 — Institutional & Teaching Experience（机构与教学体验扩展）

- 在获批用例确有需要时条件性扩展 Organization AI Knowledge Base；同时扩展正式业务页面、批量作业和学校/平台边界的业务覆盖范围。
- 接入 Teaching Experience，展示并复核既有 L2 Learning State / Diagnosis refs，编排已发布资源与教学任务，并记录教学 observation；Phase 2 不生成 Teaching Intelligence 候选或跨候选 Candidate Ranking。
- 把 minimal Skill 扩展为完整 hierarchy / dependency / transfer / rubric / Measurement Profile 关系，并建设 Assessment / Teaching Graph 的实际数据与事件。

验收：权限、脱敏、批量部分成功/重试、教师纠正与结果观察可用。

### Phase 3 — Seven-engine / Eight-graph Scale-out（七引擎八图谱扩展）

- 按实际需求补齐 Goal Planning、Learning Path、Home-School Collaboration 与 Teaching Intelligence。
- 根据实测瓶颈评估独立图数据库、向量数据库、事件平台、缓存与 Kubernetes。
- DKT、强化学习和复杂迁移分析仍是离线候选，不按数据量自动上线。

验收：扩展不破坏事件兼容、状态回放、评测与回滚。

### Phase 4 — Capability Asset Admission（能力资产准入）

- 对可复用模式登记适用范围、证据、效果验证、限制、版本、责任人和退役条件。
- 通过人工复核与发布门槛后写入 L0 Capability Asset Portfolio。
- 失败或过期资产可撤回、重算与退役。

## 9.8 Responsibility Plan（责任计划）

计划按责任能力而非固定人数划分；一人可以兼任，但每项必须有唯一 accountable owner：

| 责任 | 最小职责 |
|---|---|
| Education & Measurement | 构念、预定用途、非 AI 基线、样本、学习收益与解释限制 |
| Product & Experience | 四体验域、正式业务流程复用、状态/错误/恢复与无障碍验收 |
| Domain & Platform | 组织权限、领域模型、事件、outbox、审计和接口兼容 |
| Data & Knowledge | 接入、抽取、映射、质量、血缘、版本与重算 |
| AI & Evaluation | BKT、检索、模型网关、固定评测、校准、回放与回滚 |
| Reliability & Security | 发布、监控、备份恢复、密钥、数据边界与事件响应 |

AI 可辅助编码、测试和文档，但产品、教育测量、架构准入和发布决策必须由明确责任人签署。

## 9.9 MVP Technical Milestones

1. **Measurement Baseline Locked**：学科、目标人群、预定用途、非 AI 基线、校准集和责任人确认。
2. **Traceable Data Foundation Running**：文档、题目、事件可接入、版本化、重放、审计和恢复。
3. **Logical World Model Queryable**：Phase 1 四图加 minimal Skill vocabulary / `question_requires_skill` 子集可查询，映射具有来源、质量与人工复核记录。
4. **Closed Loop Verified**：BKT 状态、诊断假设、自适应练习、Observation→L5→L4→L3 Evidence Commit 和状态更新可端到端回放。
5. **Experience Ready**：组织边界、脱敏、AI 状态、不确定性、批量部分成功、错误恢复和无障碍通过验收。

## 9.10 MVP Success Criteria（成功标准）

MVP 成功首先由教育与测量结果判断，不以用户数量代替价值验证。数据规模、节点数和响应时间属于闭环运行条件，也不能替代学习价值。

核心判断：是否相对非 AI 基线改善预先定义的学习结果与延迟保持；状态估计是否校准；诊断假设是否可被教师复核、纠正与拒绝；失败样本和子群结果是否可见；闭环是否形成：

流程依次包括Data、World Model（世界模型）、AI、Action、Observation Candidate → L5 Capture / Persist → L4 Mapping / Quality / Lineage → L3 Evidence Commit → L2 Update。

以下数值均为待基线校准的目标假设，不能直接用作完成声明。每个指标在启动前必须登记 owner、构念/口径、预定用途、数据来源、非 AI 基线、样本量、时间窗、计算版本和验收方式；结果同时报告效应量或误差、置信区间/校准不确定性、失败样本和预先登记的子群结果。

| 指标维度 | Phase 1 目标值 | 说明 |
|---|---|---|
| 学习结果相对非 AI 基线 | 基线测量后预登记 | 对同一构念报告效应量、置信区间、缺失数据和比较条件；不以参与度或答题量替代 |
| 延迟保持 | 基线测量后预登记 | 在预登记的延迟窗口复测，并报告与即时结果的差异 |
| BKT 校准与预测 | 基线测量后预登记 | 报告 Brier/ECE 等校准指标、区分度、稳定性和子群误差；不把预测好直接称为学习增益 |
| 诊断—教师复核 | 基线测量后预登记 | 报告一致性、人工纠正率、拒答/弃权覆盖、证据充分性和失败类型 |
| 标注选择性准确率与覆盖率 | 基线测量后预登记 | 按 §7.1.7 报告自动候选的精确率/召回率、覆盖率、校准误差和人工纠正率，不追求自动采纳率本身 |
| 知识节点数 | ≥ 2,000（数学单科） | Knowledge Graph（知识图谱）可查询节点 |
| 题目结构化数 | ≥ 10,000 | Question Graph（题目图谱）入图题目 |
| 题目知识映射覆盖率 | ≥ 80% | 入图题目中标注了 question_assesses_concept 的比例 |
| 相似题检索 Top-5 命中率 | ≥ 80% | 人工标注"确实相似"的题目在 Top-5 返回中的比例 |
| 必要证据完整性 | 基线测量后预登记 | 衡量预期事件的完整、及时、可追溯与可重放，不以采集量激励过量收集 |
| BKT 状态更新延迟 | ≤ 5 秒 | 从作答事件到 mastery 概率更新完成 |
| RAG 检索响应时间（仅启用 RAG 的 Organization AI Knowledge Base 用例） | ≤ 2 秒 | 条件性体验指标，端到端（Embedding + Graph Expansion + LLM）；不纳入核心学习闭环验收门槛 |
| 闭环验证 | 人工抽样 ≥ 10 组 | 从“学生作答→诊断假设→人工可复核建议→练习→Observation→L5→L4→L3 Evidence Commit→状态更新”全链路可回放 |

## 9.11 MVP Implementation Priority Summary

| 模块 | 优先级 | 阶段 |
|---|---|---|
| 测量基线、组织边界与 Data Foundation | ★★★★★ | Phase 0 |
| Document / Question Processing 与 L4 映射治理 | ★★★★★ | Phase 0–1 |
| Curriculum / Knowledge / Question / Evidence + minimal Skill vocabulary / `question_requires_skill` | ★★★★★ | Phase 1 |
| Learning State Engine（BKT） | ★★★★★ | Phase 1 |
| Diagnosis + Similarity Training 闭环 | ★★★★★ | Phase 1 |
| Organization AI Knowledge Base + RAG | 条件性 ★★★★☆ | Phase 1–2；仅获批用例启用 |
| Institutional / Teaching Experience；完整 Skill hierarchy/dependency/measurement links；Assessment / Teaching Graph | ★★★★☆ | Phase 2 |
| Goal Planning / Learning Path / Home-School Collaboration / Teaching Intelligence 扩展 | ★★★☆☆ | Phase 3 |
| Capability Asset Portfolio 准入与退役 | 验证后建设 | Phase 4 |

# PART 10 Technical Reference System（技术参考体系）

## 10.1 Purpose（目的）

技术参考体系用于说明 OLE 的教育理论、测量方法、AI 架构、知识工程和数据治理依据。参考理论用于约束设计和验证，不直接等同于产品模块、算法选型或工程验收标准。

## 10.2 Foundation（基础体系）

| 基础领域 | 对 OLE 的作用 |
|---|---|
| Education and Learning Science | 定义学习目标、教学过程、反馈和教育价值 |
| Educational Measurement | 约束构念、证据、量规、状态估计和解释边界 |
| Knowledge Engineering | 支撑八图谱的本体、关系、版本和发布治理 |
| Artificial Intelligence | 提供检索、规则、推理、生成和评测能力 |
| Data Intelligence | 提供抽取、映射、质量、血缘和重算能力 |
| Software Engineering | 保证系统安全、可靠、可观察、可恢复和可演进 |

## 10.3 Educational Theory Reference（教育理论参考）

### 10.3.1 Bloom's Taxonomy

Bloom's Taxonomy 用于描述认知目标层级，可辅助 Curriculum、Skill、Capability 和 Assessment Graph 建模。它不能直接作为学生能力等级，也不能仅凭题目标签推断认知水平。OLE 应将认知层级绑定到具体构念、任务、量规和 Measurement Profile。

### 10.3.2 Knowledge Tracing

Knowledge Tracing 根据已提交学习证据估计知识状态。Phase 1 仅由 Learning State Engine 运行 BKT，输出带预定用途、模型版本、证据窗口、校准和不确定性的知识掌握后验。Evidence Graph 只提供已提交证据引用，不运行状态估计。

DKT、CDM、IRT 和其他模型属于候选 Measurement Profile，须完成构念、数据、校准、稳定性、子群误差和人工复核设计，并经 ADR 批准后才能进入生产。

### 10.3.3 Learning Analytics

Learning Analytics 用于理解学习过程和评估行动结果。在 OLE 中，状态解释、诊断和行动候选属于 L2；L4/L5 只通过 L3 已提交引用提供来源、质量、血缘和重放能力。分析结果必须声明人群、用途、时间窗、版本、缺失数据和限制。

### 10.3.4 Evidence-Centered Design

Evidence-Centered Design 将构念主张、任务、观察和解释规则分开管理。OLE 的对应关系如下：

| ECD 要素 | OLE 归属 |
|---|---|
| Claim / Construct | Skill、Capability、Assessment Graph |
| Task | Question、Assessment Graph |
| Observation | L5 Candidate → L4 → L3 Evidence commit |
| Mapping / Rubric | Assessment Graph / Measurement Profile |
| State and Diagnosis | Learning State / Learning Diagnosis Engine |

## 10.4 AI Architecture Reference（AI 架构参考）

### 10.4.1 Retrieval-Augmented Generation

RAG 通过授权检索结果为自然语言生成提供来源。OLE 只在 Organization AI Knowledge Base 或其他获批的来源化生成用例中启用 RAG。回答必须携带来源、版本、权限范围和评测记录；RAG 不参与 Phase 1 核心学习闭环的状态更新。

### 10.4.2 Graph Reasoning

Graph Reasoning 在 L3 已发布关系上执行路径查询、约束检查和候选发现。查询结果属于技术结果或候选依据，不自动成为诊断、路径、教学建议或正式图关系。

### 10.4.3 Agent Architecture

Agent 负责交互意图解析、获权任务编排、工具调用和结果呈现。教育目标、学习路径、训练候选、教学候选、家校协同和学习状态分别由七引擎所有。Agent 不保存第二套业务状态，也不直接执行高影响写入。

每次运行固定组织、用途、模型、提示、规则、工具授权和知识版本，并记录调用与结果引用。证据或权限不足时，Agent 应澄清、拒答或返回空候选。

## 10.5 Knowledge Engineering Reference（知识工程参考）

### 10.5.1 Ontology Engineering

Ontology Engineering 为课程、知识、题目、技能、评价、证据、教学和能力建立稳定概念、关系、约束和版本。正式本体变更须经过兼容性评估、发布和迁移，不根据模型输出即时修改。

### 10.5.2 Knowledge Graph Embedding

Knowledge Graph Embedding 可用于相似关系发现、候选检索和质量复核。Embedding Profile 必须版本化；预测关系只能进入提案流程，不能自动写入 L3，也不能直接形成 L0 能力资产。

### 10.5.3 External Graph References

Google Knowledge Graph 可作为通用实体关系建模参考，但 OLE 需要额外处理课程版本、教育测量、学习证据、教学过程和状态所有权。外部知识图谱只能作为设计或候选来源，不能代替 OLE 的权威发布流程。

## 10.6 Data Intelligence Reference（数据智能参考）

Data Lake、Feature Engineering 和 MLOps 在 OLE 中分别对应版本化原始存储、限定用途的模型输入和 AI 制品生命周期治理。

- Data Foundation 保存原始对象、事件、版本和重放信息。
- Education Data Intelligence 负责抽取、映射、质量和血缘。
- 特征引用必须携带来源、用途、版本、时间窗和质量说明。
- 模型、数据、提示、规则与评测版本从 Phase 1 起统一登记。
- 发布必须经过固定评测、灰度、监测、降级和回滚门禁。

## 10.7 Industry Reference（行业参考）

### 10.7.1 Marble

[Marble Skill Taxonomy v1](https://github.com/withmarbleapp/os-taxonomy) 提供细粒度主题、先修 DAG、来源描述、schema、manifest 和校验和，可作为 Curriculum、Knowledge 和 Skill Graph 的设计参考。采用前必须固定版本，核对课程来源和适用学段，并分别遵守数据库、作者文本和第三方课程标准的许可。

### 10.7.2 K12-KGraph

[K12-KGraph](https://github.com/haolpku/K12-KGraph) 提供中国 K–12 教材知识图谱、schema、证据位置和 benchmark，可用于研究教材对齐、抽取和评测流程。其数据集采用 CC BY-NC-SA 4.0；MIT 代码许可不改变数据的非商业限制。未经单独授权，数据不得进入商业发布物、训练语料或开放数据包。

### 10.7.3 Intelligent Tutoring Systems

传统 ITS 的 Student Model、Domain Model 和 Teaching Model 对 OLE 的职责映射如下：

| ITS 概念 | OLE 归属 |
|---|---|
| Student Model | L2 Learning State Engine |
| Domain Model | L3 八图谱 |
| Teaching Model | L3 Teaching Graph + L2 Teaching Intelligence + L1 Teaching Experience |

OLE 保留这种职责分离思想，但不把学生状态写入 Educational World Model。

## 10.8 Architecture Differentiation（架构差异）

| 体系 | 主要能力 | 与 OLE 的关系 |
|---|---|---|
| LMS | 内容、课程和学习活动管理 | 可作为 L1 业务入口或外部系统 |
| 题库系统 | 题目管理、组卷和考试 | 可向 Question / Assessment Graph 提供来源 |
| 知识图谱 | 知识实体和关系 | 仅覆盖 OLE 八图谱的一部分 |
| 教育 AI 助手 | 自然语言交互和任务编排 | 属于体验组件，不拥有核心状态和决定 |
| 教育大模型应用 | 生成、理解和推理 | 作为可替换 AI Runtime 能力接入 |
| OLE | 教育世界模型、七引擎和能力资产组合 | 提供跨体验、跨组织的学习智能基础设施 |

## 10.9 Technical Positioning（技术定位）

OLE 的技术定位由四部分共同构成：Educational World Model 提供八图谱认知结构，Learning Intelligence 提供七引擎，Data Architecture 提供可信数据与语义处理，Capability Asset Portfolio 管理验证后的可复用成果。具体模型、数据库和云供应商均属于可替换实现。

## 10.10 Current Standards & Governance Baseline（现行标准与治理基线）

本表是截至 2026-08-25 的版本化参考清单。标准更新时先评估影响并记录 ADR，不把某一版本写成永久不变的实现细节。

| 主题 | 类型 / 状态 | 现行参考 | OLE 最小落实 |
|---|---|---|---|
| 教育价值与人本原则 | 政策 / 国际指导，现行 | [教育部《“人工智能+教育”行动计划》](https://www.moe.gov.cn/srcsite/A16/s3342/202604/t20260410_1433240.html)；[UNESCO Guidance for Generative AI in Education and Research](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research) | 每项 AI 能力声明教育问题、受益对象、非 AI 基线、预期学习收益和验证方法 |
| 教育测量 | 专业标准，2014 现行版 | [Standards for Educational and Psychological Testing, 2014](https://www.testingstandards.net/uploads/7/6/6/4/76643089/standards_2014edition.pdf) | 掌握度、能力、兴趣、参与度、风险和适配度均按限定用途形成带版本与不确定性的推断，不得登记为学生事实 |
| 教育互操作 | 自愿互操作规范 | [1EdTech CASE 1.1](https://standards.1edtech.org/case/)；[QTI 3.0](https://www.1edtech.org/standards/qti/index)；[Caliper Analytics 1.2](https://www.1edtech.org/standards/caliper)；[OneRoster 1.2](https://www.1edtech.org/standards/oneroster) | 能力框架、题目/测评、学习事件和组织交换采用版本化映射；QTI 3 核心是 Final，Results Reporting / Usage Data 仍是 Public Candidate Final；互操作事件与学习效果证据分别建模 |
| 数据、个人信息与网络安全法定基线 | 法律 / 行政法规 / 部门规章，现行有效 | [《个人信息保护法》](https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html)；[《数据安全法》](https://www.npc.gov.cn/npc/c2/c30834/202106/t20210610_311888.html)；[2025 年《网络安全法》修改决定（2026-01-01 施行）](https://www.npc.gov.cn/npc/c1773/c1848/c21114/wlaqfxz/wlaqfxz002/202511/t20251103_449242.html)；[《网络数据安全管理条例》（2025-01-01 施行）](https://www.cac.gov.cn/2024-09/30/c_1729384452307680.htm)；[《网络数据安全风险评估办法》（2026-08-20 施行）](https://www.cac.gov.cn/2026-06/18/c_1783525609815499.htm) | 登记处理目的与合法性基础，执行最小必要、透明告知、权利响应、委托/共同处理、保留删除、跨境、分级保护、事件响应和适用的风险评估 |
| 教育数据分类与个人信息 | 教育行业 / 推荐性标准，现行 | [JY/T 0661—2025 教育数据分类分级指南](https://www.moe.gov.cn/srcsite/A16/s3342/202601/W020260107510856466340.pdf)；[JY/T 0643—2025 智慧教育平台个人信息保护通用要求](https://www.moe.gov.cn/srcsite/A16/s3342/202507/W020250902563098499971.pdf)；[GB/T 43697—2024](https://std.samr.gov.cn/gb/search/gbDetailed?id=14156507D2210337E06397BE0A0AE656) | 数据目录、来源、责任人、用途、最小范围、级别、血缘、质量、保留、共享审核和删除策略 |
| AI 生命周期风险 | 推荐性国标 / 自愿框架，现行 | [GB/T 45081—2024](https://std.samr.gov.cn/gb/search/gbDetailed?id=28045D84DA159055E06397BE0A0A7C5C)（等同采用 ISO/IEC 42001:2023）；[GB/T 46347—2025](https://std.samr.gov.cn/gb/search/gbDetailed?id=40B74A27FD32BD79E06397BE0A0AB048)；[NIST AI RMF 1.0](https://www.nist.gov/itl/ai-risk-management-framework) 与 [GenAI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)；[ISO/IEC 42005:2025](https://www.iso.org/standard/42005?browse=tc) | 系统卡、预定/禁止用途、责任人、模型/数据/提示版本、评测、风险、监测、降级、回滚、变更和事件日志 |
| 生成内容透明 | 强制性国标 + 部门规范，现行 | [GB 45438—2025](https://std.samr.gov.cn/gb/search/gbDetailed?id=301E0388CB75788DE06397BE0A0AE1B4)；[人工智能生成合成内容标识办法](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm) | 适用时保留显式/隐式标识、来源与版本 |
| 教育资源内容质量 | 教育行业规范，现行 | [国家智慧教育平台数字教育资源内容审核规范](https://www.moe.gov.cn/srcsite/A16/s3342/202407/t20240703_1139248.html) | 正式教育资源发布前进行政治性、科学性、适用性、规范性和时效性审核，并保留责任人与版本 |
| 无障碍 | 国际建议 + 推荐性国标，现行 | [WCAG 2.2](https://www.w3.org/TR/WCAG22/)；[GB/T 37668—2019](https://std.samr.gov.cn/gb/search/gbDetailed?id=%2ByURGZr3hiQ%3D&mode=p)；[GB/T 46070—2025](https://std.samr.gov.cn/gb/search/gbDetailed?id=3DBA213287030D16E06397BE0A0A8119) | Web 以 WCAG 2.2 AA 为基线；移动端同时评估 GB/T 46070，覆盖键盘/焦点、语义、对比度、文本替代、字幕、拖拽替代和目标尺寸，并进行人工辅助技术验证 |

实现时只依赖稳定能力契约：模型通过 Model Gateway，向量通过 Embedding Profile，文件通过 S3-compatible object storage。MinIO 上游仓库已于 2026-04-25 归档并声明不再维护，因此不作为 v5.1 的规范基线（[官方仓库](https://github.com/minio/minio)）。

## 10.11 Complete Architecture Summary

```text
L0  Capability Asset Portfolio（能力资产组合）
    经验证、可复用、可迁移、可监测、可退役
[Optional Phase 4] dossier → effect / scope / failure / subgroup validation → human admission
L1  Application Experience Layer
    Institutional / Teaching / Learning / Family
                         ↕ 行动、反馈、纠正
L2  AI Learning Intelligence Layer
    Learning Diagnosis / Similarity Training / Learning Path / Teaching Intelligence / Goal Planning / Home-School Collaboration / Learning State
                         ↕ 查询、推理、事件
L3  Educational World Model Layer
    Curriculum / Knowledge / Question / Skill / Assessment / Evidence / Teaching / Capability
                         ↑ 语义资产
L4  Education Data Intelligence Layer
    Extraction / Mapping / Quality / Lineage / Version
                         ↑ 可信输入
L5  Data Foundation Layer
    Acquisition / Storage / Pipeline / Foundation Controls

Cross-cutting Platform Engineering
Identity / Authorization / Domain / AI / Observability / Security / Deployment / Recovery
```

运行闭环：L5 接入初始数据 → L4 形成带质量与血缘的语义输入 → L3 更新八图 → L2 七引擎形成可复核行动建议 → L1 执行并产生新观察 → L5 capture/persist/outbox → L4 mapping/quality/lineage → L3 Evidence commit → L2 state update。日常闭环到此结束；只有独立获权的可选 Phase 4 工作流才可建立 dossier，并在教育效果、适用范围、失败/子群审查、人工复核和版本治理通过后准入 L0。

## 10.12 Long-Term Evolution Direction

OLE 的长期演化以提高教育状态估计、行动建议与能力资产的可验证性、可迁移性和可退役性为目标；模型或中间件数量不作为成熟度指标。

长期方向：

- 扩展更多学科、组织类型和真实教学上下文，同时保持构念与用途边界。
- 补齐八图与七引擎的运行数据，但不把逻辑边界强制映射为物理服务或数据库。
- 通过对照、校准、公平性、稳定性和学习增益验证逐步升级算法。
- 建立 Capability Asset 的准入、版本、适用范围、组合、迁移、监测与退役机制。
- 以开放互操作契约降低模型、存储和供应方替换成本。

OLE 最终沉淀三类长期资产：可追溯的 Educational World Model、可复核的 Learning Intelligence，以及经过验证的 Capability Asset Portfolio。软件版本、基础模型和供应商组合均作为可替换实现管理。

---

文档元数据：

| 字段 | 值 |
|---|---|
| 文档 | OLE Product Technology Architecture |
| 版本 | v5.1 |
| 状态 | Frozen |
| 内容截止日期 | 2026-08-29 |
| 冻结日期 | 2026-08-29 |
| 冻结标识 | `OLE-PTA-v5.1-FROZEN-20260829` |
| 规范架构 | 六层 / 七引擎 / 八图谱（八图全部归属 L3；L0 为 Capability Asset Portfolio） |
| OLE Step1 口径 | OLE 当前研发阶段；统筹三个独立职责系统、系统间契约与联合验证；通过 Master Plan 映射 Part 9 Phase 0–4 |
| 校准状态 | 已校准批准 ADR、Outline 现行业务/数据/Design System 契约与当前 Figma 执行契约；局部实现文档按其作用范围解释 |
| Figma 校准源 | [OLE-team-library，node 3661:2](https://www.figma.com/design/F8O1j94dmDgxgBNnv2l4rS/OLE-team-library?node-id=3661-2&p=f&t=IcgHT88xXPYvx3sC-0)，2026-08-25 只读检查 |
| Outline 校准源 | [Open Learning Engine collection / recent](https://outline.wj985.cc/collection/open-learning-engine-dpF1bDtEKM/recent)，2026-08-26 通过已配置 MCP 只读复核 |
| 历史追溯 | v4.0 源文件保留完整历史正文与版本批注 |
