# v0.7 F2 预期来源与分类影响重放

状态：设计决策的确定性合成数据影响报告；不构成真实学校校准、正式测量或服务准入。

## 结论

采纳 PO 已批准的 **80% / 60% / 40%** 及 **基础→易、巩固→中、提升→难**，将其放在合格、有版本的逐题预期之后。现有逐题预期不可被难度表静默覆盖。

当前 v5 包的 266 个有作答学生范围中，192 个满足现行进展所需的检测次数。若直接覆盖既有逐题预期，会改变 **22 个学生汇总掌握度、62 个学生进展分类（去重 69 个学生范围）**，以及 **15 个班科知识点、40 个学生×知识点掌握度**。保留逐题预期优先后，以上分类变化均为 **0**；但 **12 / 38 个检测**从缺预期变为有可追溯难度兜底，因此不能表述为“没有任何数据变化”。

这些数值按实际 source selector 重放计算，未为了得出零变化而跳过缺失预期。历史报告仍绑定原规则版本；新规则的回填结果另列，禁止原地覆写。

## 1. 证据与复现

- 读取仓库：`/Users/OLE/HermesWork/ole-school-workbench`。
- 运行开始／结束 Git HEAD：`bbc8c11b66ad4e4b2f1b8a3392126cf7ab7841a6`；两端一致。
- Git 状态：两端均干净（本轮不包含 Claude 较早读取的未提交状态）。忽略文件 `.claude/launch.json` 不影响本脚本。
- 运行时间：`2026-10-18T06:58:27.942Z`；Node `v24.19.0`。
- 直接使用 `buildWorkspaceDataset`、`selectLearningAnalysis`、`learningMastery`、`viewableContexts`、`scopeForContext`。没有复制一份分类实现作为计算主源。
- 记录 118 个传递源码文件 SHA-256，运行前后核对稳定；脚本 SHA-256：`e0a67ec4c2254ed299c6190dd3fa2732c3f1fdb2525776ace48c6434a4b703a6`。
- 覆盖 5 种包的 v1—v5，共 25 个确定性包实例、200 个当前身份可见班科范围，包括无数据范围；没有扩展读取权限或变更 active teacher。当前 v5 有 40 个可见范围，其中 6 个有本期作答。
- 独立满分加权核算 **688 次**：逐次断言实际率、预期率和百分点差与 source selector 相同；各方案逐一断言原始作答集合完全相同、原始 state 未被改写。
- [重放脚本](./review-v07r1-expected-impact.mjs)、[完整机器结果与源码哈希](./review-v07r1-expected-impact.json)、[所有分类变更明细 CSV](./review-v07r1-expected-impact-changes.csv)。CSV 含学生／知识点精确键、旧新分类、预期与差距、进展判定理由。

```sh
/Users/OLE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --experimental-strip-types /Users/OLE/HermesWork/ole-learning-analysis-research-2026-10-18/evidence/review-v07r1-expected-impact.mjs
python3 /Users/OLE/HermesWork/ole-learning-analysis-research-2026-10-18/evidence/review-v07r1-expected-impact-report.py
```

脚本仅在研究目录写报告；重新运行会更新这组影响证据。源码发生变化后，必须以新 HEAD 和源哈希解释结果，不将旧报告冒充新基线。

## 2. 源码实际规则及旧数据适配

`src/mocks/workspace/learning-facts.ts:513–521` 的逐题预期是 **基础75、巩固70、提升65，再加检测要求修正**：第三、四轮各加 3 pp；第二轮显式缺预期。它不是只存一张固定三档表。

同文件 `:231–232` 明确保留原 scoringPlans 的权重与预期。v5 可能把展现题替换为开放题，同时保留原检测要求以避免重新分类；不能从替换后题目的当前 difficulty 反推覆盖已保存预期。

`learning-contract.ts:32–40` 目前只提供 `LearningFacts.version`（结构版本）及逐题 `questionId/rate/basis`，**没有正式的 expectation_rule_version / owner approval 字段**。本报告没有把结构版本、评分版本或非空 basis 冒充已批准的预期规则版本。

本次生成数据来自已知 dataset + learningSeedVersion 的确定性工厂，因此可登记一个 **Derived 文档层名称** `legacy-authored-expectation-v1` 适配器：绑定 datasetId、seed recipe version、resultId、paperVersionId、questionId+question.version、annotationVersion、原 rate/basis、冻结源码与条目 digest。JSON 保存各包可登记条目数和登记内容 hash。正式接入须由分析投影应用 owner 实现、Assessment/题目预期数据 owner 复核来源与用途并批准；不能仅凭存档声称 seedVersion=3 就予以认证。存档有补丁时须验证精确条目及其修订来源；来源不明的数字不可晋升为正式逐题预期。

题版缺快照或版本信息时，本次不从实时题库回填猜测；与 `paper-version.ts:26–36` 的旧引用边界分开。获准的显式旧引用解析器可后续登记，本报告未替它批准。

## 3. 三种主方案与一个耦合检查

1. **旧现行**：原始包、原始预期、原始分类，作为逐键比较基线。
2. **直接替换反例** `direct-replace-existing-only`：只把已有非空逐题预期改成题版 80/60/40，保留旧缺数与原再考资格。这样隔离“覆盖已有预期”的影响，避免将回填缺数混在一起。
3. **拟实施优先级** `priority-with-fixed-retest-eligibility`：保留可追溯既有逐题预期；对缺失预期，按已存精确题版的已批标签兜底；无依据保留不可比。原再考资格固定，补预期不能自动授予再考可比性。
4. **现有 selector 原样接入风险检查** `priority-raw-current-selector`：同优先级但不显式固定原资格。当前种子与方案3的再考可比数相同；原因是缺预期端点的原始 `fact.comparable` 已阻断。源码 `learning-selectors.ts:835–839` 仍把预期是否存在当作额外比较条件，这不是新 MET07/08 的资格依据。不能把本批样本没有扩大资格误写为该耦合普遍安全。

所有方案维持相同检测范围、名册、作答、原始得分与题目满分。MET10 的预期是同一次检测按作答满分加权，单位为百分点差；未计算跨卷增长。

## 4. 分类影响汇总

“学生”计数单位是 **dataset × seedVersion × class/subject scope × studentId**，不把不同版本、不同合成包的同名人物拼成真实学生总人数。知识点单位是该范围的 knowledgeId；学生×知识点以双键精确匹配。分母同时保留无数据行，不用变更后的名册作分母。

| 包范围 | 班科范围数 | 有作答 / 现行充分检测的学生范围 | 直接覆盖：学生汇总掌握度 / 进展变化 | 直接覆盖：知识点变化 / 有作答知识点 | 直接覆盖：学生×知识点变化 / 有作答项 | 优先级：四类分类变化 | 优先级：取得新预期的检测 / 全部检测 |
| --- | ---: | ---: | --- | ---: | ---: | --- | ---: |
| 当前 v5 | 40 | 266 / 192 | 22 / 62（去重 69） | 15 / 84 | 40 / 3576 | 0 / 0 / 0 / 0 | 12 / 38 |
| 历史 v1—v3 | 120 | 708 / 504 | 24 / 116（去重 129） | 30 / 180 | 49 / 8568 | 0 / 0 / 0 / 0 | 33 / 96 |
| 全部 v1—v5 | 200 | 1240 / 888 | 56 / 220（去重 245） | 64 / 348 | 105 / 15720 | 0 / 0 / 0 / 0 | 57 / 172 |

“学生汇总掌握度”是在原学生 aggregate 上调用现有导出 `learningMastery` 的敏感性统计，不声称当前学生列表存在该显示列；实际学生进展字段直接取 selector 输出。知识点掌握度与学生详情中的知识点掌握度均直接取实际 selector。

### 当前 v5 的有作答范围明细

| 包 / 班科 | 有作答 / 充分检测的学生范围 | 学生汇总掌握度 / 进展变化 | 班科知识点变化 / 有作答项 | 学生×知识点变化 / 有作答项 |
| --- | ---: | --- | ---: | ---: |
| teaching-default · 九年级（1）班 数学 (`ctx-91`) | 45 / 39 | 1 / 9（去重 9） | 4 / 24 | 0 / 1080 |
| teaching-default · 九年级（2）班 数学 (`ctx-92`) | 30 / 24 | 1 / 5（去重 5） | 8 / 24 | 0 / 720 |
| teaching-cycle · 九年级（1）班 数学 (`cycle-ctx-91`) | 51 / 45 | 4 / 14（去重 15） | 3 / 24 | 0 / 1224 |
| teaching-cycle · 九年级（2）班 数学 (`cycle-ctx-92`) | 44 / 0 | 0 / 0（去重 0） | 0 / 6 | 0 / 264 |
| high-school-all · 高一（1）班 数学 (`hs-ctx-10-1-math`) | 45 / 39 | 8 / 15（去重 18） | 0 / 3 | 18 / 135 |
| high-school · 高一（1）班 数学 (`hs-ctx-10-1-math`) | 51 / 45 | 8 / 19（去重 22） | 0 / 3 | 22 / 153 |

### 直接覆盖的具体反例

以下人物均为既有合成数据；实际率未改变，只有预期基准变化。全部清单在 CSV。

| 精确范围与学生键 | 姓名 | 不变的实际率 | 预期率变化 | G 变化 | 分类变化 |
| --- | --- | ---: | --- | --- | --- |
| teaching-default / `ctx-91` / `stu-6` | 赵安宁 | 91.667% | 72.083% → 68.333% | 19.583 → 23.333 pp | 基本掌握 → 基本掌握；正在巩固 → 稳定保持 |
| teaching-default / `ctx-91` / `la-class-91-student-11` | 宋予安 | 90% | 72.083% → 68.333% | 17.917 → 21.667 pp | 基本掌握 → 基本掌握；正在巩固 → 稳定保持 |
| teaching-default / `ctx-91` / `la-class-91-student-18` | 程星野 | 71.667% | 72.083% → 68.333% | -0.417 → 3.333 pp | 基本掌握 → 已掌握；正在巩固 → 稳定保持 |
| teaching-default / `ctx-92` / `la-class-92-student-18` | 苏慕言 | 71.667% | 72.083% → 68.333% | -0.417 → 3.333 pp | 基本掌握 → 已掌握；正在巩固 → 稳定保持 |
| teaching-cycle / `cycle-ctx-91` / `cycle-stu-1-19` | 韩若溪 | 70% | 70.063% → 60.25% | -0.063 → 9.75 pp | 基本掌握 → 已掌握；正在巩固 → 稳定保持 |
| teaching-cycle / `cycle-ctx-91` / `cycle-stu-1-21` | 邓可昕 | 70% | 70.063% → 60.25% | -0.063 → 9.75 pp | 基本掌握 → 已掌握；正在巩固 → 稳定保持 |

### 优先级方案的 12 个新可比较检测

这表示“可以按该检测自己的已登记预期计算 G”，不表示试卷等值，也不自动授予再考资格。新规则视图可以披露新结果；旧报告继续保留原缺数状态与规则版本。

| 范围 | 检测键 | 预期率 | G |
| --- | --- | --- | --- |
| teaching-default / `ctx-91` | `la-2-result-v1` | — → 66.774% | — → 5.103 pp |
| teaching-default / `ctx-92` | `la-ctx-92-2-result-v1` | — → 66.774% | — → 5.269 pp |
| teaching-cycle / `cycle-ctx-91` | `la-2-result-v1` | — → 70.69% | — → 0.69 pp |
| teaching-cycle / `cycle-ctx-91` | `cycle-task-followup-1-result-v1` | — → 66.154% | — → 9.487 pp |
| teaching-cycle / `cycle-ctx-91` | `cycle-task-unit-1-result-v1` | — → 66.154% | — → 7.692 pp |
| teaching-cycle / `cycle-ctx-91` | `cycle-task-baseline-1-result-v2` | — → 66.154% | — → 7.692 pp |
| teaching-cycle / `cycle-ctx-92` | `cycle-task-baseline-2-result-v1` | — → 66.154% | — → 5.612 pp |
| teaching-cycle / `cycle-ctx-92` | `cycle-task-unit-2-result-v1` | — → 66.154% | — → 12.051 pp |
| high-school-all / `hs-ctx-10-1-math` | `la-2-result-v1` | — → 52.222% | — → 17.436 pp |
| high-school-all / `hs-ctx-10-1-math` | `hs-result-10-1-math-v1` | — → 76.667% | — → 0 pp |
| high-school / `hs-ctx-10-1-math` | `la-2-result-v1` | — → 52.222% | — → 16.296 pp |
| high-school / `hs-ctx-10-1-math` | `hs-result-10-1-math-v1` | — → 76.667% | — → -6.667 pp |

## 5. 可直接合入正文／规格的迁移条款

**预期来源优先级：** 单次检测中的每一题，先消费当前用途合格且精确绑定题版／检测要求版本的逐题预期；无该来源时，消费获准的题库难度标签及 `80/60/40` 转换规则 v0；两者均不合格则该检测的 G 为“不可比”。来源同级冲突不得任取、平均或取最新，应返回待核实。逐题预期失效后的切换也须形成新规则／报告修订并披露来源，不能静默降级改变既有报告。

**保留历史：** 已保存且可追溯的逐题预期先经版本化 legacy adapter 登记，原数值与要求修正不被新难度表覆盖。旧报告绑定旧 `expectation_rule_version` 和 `eligibility_rule_version`；新规则重算另建可对照视图，不改历史数值、标签或名册。

**按用途解耦：** MET10 采用预期优先级计算；MET07/08 仍按各自登记的原项关系、独立性、答案暴露、时间窗及资格规则纳入。不得因为补齐预期就扩大再考分母或更新正式 LearningState/BKT。

**迁移展示与验收：** 每次规则升级提供旧／新规则、使用来源、数值变化、学生与知识点分类变化清单以及未变化的精确分母。查看新版本可以并列解释，不能写“学生突然进步”。本次的确定性结果是 Builder 的起始回归证据；上线前对其实际快照和完整 v0.7 投影重放，报告交 PO，实际变更集合与说明一致后启用。

## 6. 边界与未验证

本报告是 **当前源码分类逻辑的预期来源敏感性评估**，不是完整 v0.7 指标投影的实现验收。现有 `learningMastery` 仍受旧 aggregate 的检测次数充分性约束；现有 `learningProgress` 未命中分支仍显示“正在巩固”。v0.7 已批准的不同题版3题规则、中性“继续观察”及新 MET07/08 资格尚须 Builder 接入后整体验收，不能用本次 0 变化替代该验收。中性兜底改名本身应单列来源，不与预期表引起的分类变化混算。

未运行真实学校数据、真实模型、正式测量/BKT、业务写入服务或生产迁移。当前合成数据对拟优先级的分类变化为0，不保证真实数据同样为0，也不能作为 80/60/40 已获得统计校准的证据。后续本校难度经验校准需治理批准的新版本与独立质量评估，不以本次合成结果代替。
