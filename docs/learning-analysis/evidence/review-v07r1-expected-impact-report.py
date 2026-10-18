from pathlib import Path
import json,csv
root=Path(__file__).resolve().parent
p=json.loads((root/'review-v07r1-expected-impact.json').read_text())
rows=p['results']; current=[r for r in rows if r['seedVersion']==5]; direct='direct-replace-existing-only'; priority='priority-with-fixed-retest-eligibility'
def n(v):return '—' if v is None else f'{v:.3f}'.rstrip('0').rstrip('.')
with (root/'review-v07r1-expected-impact-changes.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['package','seedVersion','contextId','className','subject','scenario','entityKind','entityKey','name','changedFields','oldMastery','newMastery','oldProgress','newProgress','oldExpectedPct','newExpectedPct','oldGapPP','newGapPP','oldReason','newReason'])
 for r in rows:
  for scenario,c in r['comparisons'].items():
   for kind in ['students','knowledge','studentKnowledge']:
    for e in c[kind]:
     a,b=e['before'],e['after'];w.writerow([r['packageId'],r['seedVersion'],r['contextId'],r['className'],r['subject'],scenario,kind,e['id'],e['name'],','.join(e['changes']),a.get('mastery'),b.get('mastery'),a.get('progress'),b.get('progress'),a.get('expected'),b.get('expected'),a.get('gap'),b.get('gap'),a.get('progressReason'),b.get('progressReason')])
summary=[]
for label,key in [('当前 v5','current-v5'),('历史 v1—v3','legacy-v1-v3'),('全部 v1—v5','all-v1-v5')]:
 t=p['totals'][key];d=t['denominators'];c=t['variants'][direct];z=t['variants'][priority]
 summary.append(f"| {label} | {t['scopeCount']} | {d['studentsWithAnswers']} / {d['studentsSufficient']} | {c['studentMastery']} / {c['studentProgress']}（去重 {c['studentsAny']}） | {c['knowledgeMastery']} / {d['knowledgeWithAnswers']} | {c['studentKnowledgeMastery']} / {d['studentKnowledgeWithAnswers']} | {z['studentMastery']} / {z['studentProgress']} / {z['knowledgeMastery']} / {z['studentKnowledgeMastery']} | {z['detections']} / {d['detections']} |")
classes=[]
for r in current:
 if not r['answerCount']:continue
 c=r['comparisons'][direct];d=c['denominators'];s=c['counts']
 classes.append(f"| {r['packageId']} · {r['className']} {r['subject']} (`{r['contextId']}`) | {d['studentsWithAnswers']} / {d['studentsSufficient']} | {s['studentMastery']} / {s['studentProgress']}（去重 {s['studentsAny']}） | {s['knowledgeMastery']} / {d['knowledgeWithAnswers']} | {s['studentKnowledgeMastery']} / {d['studentKnowledgeWithAnswers']} |")
examples=[]
for r in current:
 for x in r['comparisons'][direct]['students']:
  if 'mastery' not in x['changes'] and len(examples)>=2:continue
  a,b=x['before'],x['after'];examples.append(f"| {r['packageId']} / `{r['contextId']}` / `{x['id']}` | {x['name']} | {n(a['actual'])}% | {n(a['expected'])}% → {n(b['expected'])}% | {n(a['gap'])} → {n(b['gap'])} pp | {a['mastery']} → {b['mastery']}；{a['progress']} → {b['progress']} |")
  if len(examples)>=6:break
 if len(examples)>=6:break
fallback=[]
for r in current:
 for x in r['comparisons'][priority]['detections']:
  fallback.append(f"| {r['packageId']} / `{r['contextId']}` | `{x['id']}` | {n(x['before']['expected'])} → {n(x['after']['expected'])}% | {n(x['before']['gap'])} → {n(x['after']['gap'])} pp |")
text=f'''# v0.7 F2 预期来源与分类影响重放

状态：设计决策的确定性合成数据影响报告；不构成真实学校校准、正式测量或服务准入。

## 结论

采纳 PO 已批准的 **80% / 60% / 40%** 及 **基础→易、巩固→中、提升→难**，将其放在合格、有版本的逐题预期之后。现有逐题预期不可被难度表静默覆盖。

当前 v5 包的 266 个有作答学生范围中，192 个满足现行进展所需的检测次数。若直接覆盖既有逐题预期，会改变 **22 个学生汇总掌握度、62 个学生进展分类（去重 69 个学生范围）**，以及 **15 个班科知识点、40 个学生×知识点掌握度**。保留逐题预期优先后，以上分类变化均为 **0**；但 **12 / 38 个检测**从缺预期变为有可追溯难度兜底，因此不能表述为“没有任何数据变化”。

这些数值按实际 source selector 重放计算，未为了得出零变化而跳过缺失预期。历史报告仍绑定原规则版本；新规则的回填结果另列，禁止原地覆写。

## 1. 证据与复现

- 读取仓库：`{p['metadata']['repo']}`。
- 运行开始／结束 Git HEAD：`{p['metadata']['head']}`；两端一致。
- Git 状态：两端均干净（本轮不包含 Claude 较早读取的未提交状态）。忽略文件 `.claude/launch.json` 不影响本脚本。
- 运行时间：`{p['metadata']['generatedAt']}`；Node `{p['metadata']['node']}`。
- 直接使用 `buildWorkspaceDataset`、`selectLearningAnalysis`、`learningMastery`、`viewableContexts`、`scopeForContext`。没有复制一份分类实现作为计算主源。
- 记录 {len(p['metadata']['sourceHashes'])} 个传递源码文件 SHA-256，运行前后核对稳定；脚本 SHA-256：`{p['metadata']['replayScriptSha256']}`。
- 覆盖 5 种包的 v1—v5，共 25 个确定性包实例、200 个当前身份可见班科范围，包括无数据范围；没有扩展读取权限或变更 active teacher。当前 v5 有 40 个可见范围，其中 6 个有本期作答。
- 独立满分加权核算 **{p['weightedChecks']} 次**：逐次断言实际率、预期率和百分点差与 source selector 相同；各方案逐一断言原始作答集合完全相同、原始 state 未被改写。
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
{chr(10).join(summary)}

“学生汇总掌握度”是在原学生 aggregate 上调用现有导出 `learningMastery` 的敏感性统计，不声称当前学生列表存在该显示列；实际学生进展字段直接取 selector 输出。知识点掌握度与学生详情中的知识点掌握度均直接取实际 selector。

### 当前 v5 的有作答范围明细

| 包 / 班科 | 有作答 / 充分检测的学生范围 | 学生汇总掌握度 / 进展变化 | 班科知识点变化 / 有作答项 | 学生×知识点变化 / 有作答项 |
| --- | ---: | --- | ---: | ---: |
{chr(10).join(classes)}

### 直接覆盖的具体反例

以下人物均为既有合成数据；实际率未改变，只有预期基准变化。全部清单在 CSV。

| 精确范围与学生键 | 姓名 | 不变的实际率 | 预期率变化 | G 变化 | 分类变化 |
| --- | --- | ---: | --- | --- | --- |
{chr(10).join(examples)}

### 优先级方案的 12 个新可比较检测

这表示“可以按该检测自己的已登记预期计算 G”，不表示试卷等值，也不自动授予再考资格。新规则视图可以披露新结果；旧报告继续保留原缺数状态与规则版本。

| 范围 | 检测键 | 预期率 | G |
| --- | --- | --- | --- |
{chr(10).join(fallback)}

## 5. 可直接合入正文／规格的迁移条款

**预期来源优先级：** 单次检测中的每一题，先消费当前用途合格且精确绑定题版／检测要求版本的逐题预期；无该来源时，消费获准的题库难度标签及 `80/60/40` 转换规则 v0；两者均不合格则该检测的 G 为“不可比”。来源同级冲突不得任取、平均或取最新，应返回待核实。逐题预期失效后的切换也须形成新规则／报告修订并披露来源，不能静默降级改变既有报告。

**保留历史：** 已保存且可追溯的逐题预期先经版本化 legacy adapter 登记，原数值与要求修正不被新难度表覆盖。旧报告绑定旧 `expectation_rule_version` 和 `eligibility_rule_version`；新规则重算另建可对照视图，不改历史数值、标签或名册。

**按用途解耦：** MET10 采用预期优先级计算；MET07/08 仍按各自登记的原项关系、独立性、答案暴露、时间窗及资格规则纳入。不得因为补齐预期就扩大再考分母或更新正式 LearningState/BKT。

**迁移展示与验收：** 每次规则升级提供旧／新规则、使用来源、数值变化、学生与知识点分类变化清单以及未变化的精确分母。查看新版本可以并列解释，不能写“学生突然进步”。本次的确定性结果是 Builder 的起始回归证据；上线前对其实际快照和完整 v0.7 投影重放，报告交 PO，实际变更集合与说明一致后启用。

## 6. 边界与未验证

本报告是 **当前源码分类逻辑的预期来源敏感性评估**，不是完整 v0.7 指标投影的实现验收。现有 `learningMastery` 仍受旧 aggregate 的检测次数充分性约束；现有 `learningProgress` 未命中分支仍显示“正在巩固”。v0.7 已批准的不同题版3题规则、中性“继续观察”及新 MET07/08 资格尚须 Builder 接入后整体验收，不能用本次 0 变化替代该验收。中性兜底改名本身应单列来源，不与预期表引起的分类变化混算。

未运行真实学校数据、真实模型、正式测量/BKT、业务写入服务或生产迁移。当前合成数据对拟优先级的分类变化为0，不保证真实数据同样为0，也不能作为 80/60/40 已获得统计校准的证据。后续本校难度经验校准需治理批准的新版本与独立质量评估，不以本次合成结果代替。
'''
(root/'review-v07r1-expected-impact.md').write_text(text)
print(json.dumps({'report':str(root/'review-v07r1-expected-impact.md'),'csv':str(root/'review-v07r1-expected-impact-changes.csv'),'reportCharacters':len(text)},ensure_ascii=False))
