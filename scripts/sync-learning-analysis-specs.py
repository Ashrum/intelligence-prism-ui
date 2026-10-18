from pathlib import Path
import re,json,hashlib
R=Path(__file__).resolve().parents[1]/'docs/learning-analysis'
B=R/'OLE_Learning_Analysis_Design_v0.7-r2.md';s=B.read_text()
D=R
sha=lambda t:hashlib.sha256(t.encode()).hexdigest()
def pos(t):
 assert s.count(t)==1,(t,s.count(t));return s.index(t)
def segment(key,start,end,owner):
 a,b=pos(start),pos(end)
 return {'key':key,'start':a,'end':b,'owner':owner,'text':s[a:b].strip(),'source_line':s[:a].count('\n')+1}
segs=[
segment('§4 职责与授权','## 4 ','## 5 ',5),
segment('§5 教学闭环','## 5 ','## 6 ',2),
segment('§6 指标与比较','## 6 ','## 7 ',1),
segment('§7 独立页面','## 7 ','## 8 ',3),
segment('§8 Agent与Blueprint','## 8 ','## 9 ',4),
segment('§9.1 正式对象与实例界限','## 9 ','#### 行动 复查与支持的逻辑映射',1),
segment('§9.1 应用行动与支持映射','#### 行动 复查与支持的逻辑映射','### 9.2 ',2),
segment('§9.2 事实与匹配','### 9.2 ','### 9.3 ',2),
segment('§9.3 证据与状态','### 9.3 ','### 9.4 ',1),
segment('§9.4 权限水位失效与驻留','### 9.4 ','### 9.5 ',1),
segment('§9.5 案例与能力资产','### 9.5 ','### 9.6 ',1),
segment('§9.6 共享模型与披露','### 9.6 ','## 10 ',5),
segment('§10.1 整改清单','## 10 ','### 10.2 ',3),
segment('§10.2 教育语义补强','### 10.2 ','### 10.3 ',2),
segment('§10.3 迁移与回滚','### 10.3 ','## 11 ',3),
segment('§11 批次与阶段','## 11 ','## 12 ',4),
segment('§12 全周期验证','## 12 ','## 13 ',6)]
for x,y in zip(segs,segs[1:]):assert x['end']==y['start'],(x['key'],y['key'])
assert segs[0]['start']==pos('## 4 ') and segs[-1]['end']==pos('## 13 ')
gate_block=next(b for b in s.split('\n\n') if b.startswith('| 核验项 |'))
gate_lines=gate_block.splitlines()
gates={re.search(r'G0\d',l)[0]:l for l in gate_lines[2:]}
meta=[
(1,'01-数据投影与指标规范.md','数据投影与指标规范','P0','G01 G03 G04',
'形成供独立页、报告与 Agent 共用的用途化分析投影，明确来源、集合、指标、比较、水位和失效行为。',
'MET01—MET10、LA01—LA06/LA08/LA09；E01—E08、AG04；正式模型继续按 Profile 门禁。',
[
('DP01 来源与资格','既有结果/Evidence/授权规则 → 每指标来源类型、用途与资格版本；映射实际 owner，不新增平行权威对象','G01；E02/E08'),
('DP02 集合与指标','事件时关系、原行动和合格对象 → MET01—10、原始分子分母、缺失原因与比较许可','E01/E04/E07；LA09'),
('DP03 投影一致','同用途/范围/精确版本/截止/授权视图 → 页面、报告、Agent及导出一致；模型用途独立','LA01/02、AG04'),
('DP04 精度与失效','原始量与格式版本、来源事件 → half-up显示、依赖停用/重算与历史引用','LA08十组夹具、E08；迁移见03')],
'02 提供执行与事实来源；03 消费投影与迁移；04 接入能力；05 负责组织/共享披露规则；06 执行验证。'),
(2,'02-教学行动与支持逻辑规范.md','教学行动与支持逻辑规范','P1','G01 G02 G04 G05',
'使教师能够保存、实施、修订并复查一轮教学，同时记录真实支持条件与责任，不强迫创建试卷或行政审批链。',
'LA07、ED01—ED04、T01—T07、E04/E05/E07/E08/E10、EDU01—EDU12；跨角色真实协作 M01—M04 留在 P4。',
[
('TA01 持久化映射','当前 LearningAction 与逻辑记录 → owner、schema/修订、权限、幂等、精确引用','G02；无回执不验真实执行'),
('TA02 事实和周期','组织/计划/教学/执行/支持事件或有来源报告 → 日期、范围、未知与功能限制','E01/E03；EDU02/03/11'),
('TA03 修订与复查','原计划、实际发生、新观察 → 原/修订集合、默认尝试规则、候选确认与探索性口径','E04/E05/E07/E08；01指标'),
('TA04 支持承接','请求/承诺/到位/可用/使用 → 分离事件及接收者回执，不把保存说成发送','P1本人记录；P4真实M场景')],
'01 定义指标和正式实例界限；03 提供行动入口；04 处理 Agent 交接；05 定义协作字段与权限。'),
(3,'03-独立页重构与迁移规范.md','独立页重构与迁移规范','P2','G01 G02 G04 G05',
'保留五入口并补行动入口，沿用同一事实与业务对象，修复已观察问题并保留旧深链、报告与回滚路径。',
'LA01—LA09 的整改总表；T01—T07、E10、AG01/06的独立页及合同部分；真实双入口在P3验收。',
[
('UI01 页面范围','五入口、分层范围条与角色上下文 → 总览/学生班级/课程/错题/既有报表；行动嵌入','§7；未知不画伪零'),
('UI02 详情与动作','来源事实/对象能力 → 可追溯行、原题与新题条件、普通无再考行、实际业务动作','LA03—LA09；非试卷见02'),
('UI03 共用承载','继续对象或主动总览 → 原范围/编辑恢复，界面遵循04的Blueprint与可及性要求','T07、AG01/06；未实接标未测'),
('UI04 迁移演练','固定样本、旧对象/报告/深链 → oracle对照、差异裁决、幂等迁移及回退','§10.3；已发布任务由owner撤销')],
'所有数值和资格由01主承接；行动由02主承接；Blueprint、主题、键盘/读屏/重排完整要求在04 §8.3；管理角色字段在05。'),
(4,'04-Agent协同与Blueprint承载规范.md','Agent协同与Blueprint承载规范','P3','G01 G02 G03 G04 G05',
'按现行能力阶段接入 Agent，使双入口继续同一对象并使用真实回执，保留只读、草稿、正式交接和生产门禁的区别。',
'AG01—AG06、EDU08、T07；P0能力目录保持 assessment.result.query / practice.draft.create / practice.publish。',
[
('AGI01 能力映射','产品意图 → 现有capability/owner/准入和精确输入输出；首批仅LA-C01—03待申请；C04—08后置，C09/10另议，已有practice能力复用原登记','G03；§8.1/11.2'),
('AGI02 字段与解释','05模型输入清单、教师选择/引擎输出与PO已批AI建议 → 有来源上下文、逐条证据、否决记录；不写正式诊断或自动分组','AG02/05；首模型调用前验证'),
('AGI03 双工作面','范围/对象/版本/未保存编辑 → 会话/协作/专注承载与恢复；最多两主要面','AG01/06；四主题、1016/1064净宽'),
('AGI04 交接与异常','获准确认 → 本地原子HANDOFF、owner复验、幂等、未知结果查询与恢复','AG03/04；故障注入见06')],
'01 统一投影/水位；02 行动与支持事实；03 独立页面与迁移；05 模型字段、共享和驻留；06 验证层与通过判定。'),
(5,'05-多角色与跨域披露规范.md','多角色与跨域披露规范','P4','G01 G02 G03 G04 G05',
'把教师、班主任、学校、集团和区域视角落实为职责、字段、用途、支持与披露规则，按合法组织及Home范围逐项开放。',
'M01—M04、AG02/04/05；角色矩阵、班主任摘要、共享/撤权、模型输入和组合披露。',
[
('ORG01 关系授权','权威任教/班主任/委派/归属及Home解析 → 有效职责、字段与六动作映射','G01/G04；不得取身份权限并集'),
('ORG02 协调支持','02支持事件 → 班主任提议/owner接受、学校/集团/区域真实承接及回执','M01—M04；不建设OA'),
('ORG03 共享与模型','资源版本/接收者/目的/期限 → 分离查看、派生、导出与模型许可；实际字段清单','G03/G04；未准字段不得发送'),
('ORG04 披露与撤销','批准用途策略/部署绑定 → 全出口一致、差分/唯一贡献用例、撤权和到期处理','M/AG反例；不固定任意人数阈值')],
'正式Home、writer、水位与依赖语义由01 §9.4承接；行动事件由02承接；模型调用和运行时由04承接。'),
(6,'06-全周期验证协议与夹具矩阵.md','全周期验证协议与夹具矩阵','P0—P4','G01 G02 G03 G04 G05',
'按设计、工程/浏览器、可用性、真实教学及正式教育五层记录证据，执行既有场景与本轮补充反例，分开设计候选、PO批准和实际准入。',
'T01—T07、E01—E10、EDU01—EDU12、M01—M04、AG01—AG06；LA08数值夹具与本轮八组反例。',
[
('QA01 固定输入','范围/源版本/规则/授权/场景 → 预期、差异、日志与回执的可定位证据','逐条断言全真；不得靠成功动画'),
('QA02 可用性','最低3名独立教师、适用任务 → 0/1/2、耗时、求助、负担和失败复测','两名独立复核者及领域仲裁'),
('QA03 真实流程','获准学校/角色/两班/周期/真实服务 → 行动、执行、新观察与下一轮决定','不要求先提分，不代因果评价'),
('QA04 发布范围','实际启用功能/来源/门禁 → 通过、不通过、未测、限制、责任及复核时点','不以Beta或文档定稿解除门禁')],
'按§11.1适用ID与子例登记范围，未测区分本批适用/未来不适用；01—05提供被测定义与真实对象；本规格主承接判定，不复制或降低各模块语义。')]
manifest={'baseline_file':B.name,'baseline_sha256':sha(s),'schema':'split-manifest-v2-portable','design_revision':'v0.7 r2','design_status':'approved-derived-baseline','implementation_status':'requires-applicable-gate-evidence','retained_in_baseline':['§1—§3 产品定位、研究与教育基础','§13 决定、审核台账与定稿管理','附录A/B 来源与历史追溯'],'specs':[]}
for num,f,title,batch,gs,purpose,coverage,items,deps in meta:
 selected=[x for x in segs if x['owner']==num]
 gate_table='\n'.join(gate_lines[:2]+[gates[g] for g in gs.split()])
 text='# OLE 学情分析 '+title+'\n\n2026-10-18 · v0.7 r2 · 已批准设计派生规格 · 待实施核验 · '+batch+' · Derived / Non-canonical\n\n'
 text+=purpose+'\n\n来源：[已批准设计基线 v0.7 r2]('+B.name+')。基线摘要 '+sha(s)[:12]+'，完整校验见本目录 split-manifest.json。§ 及原编号均指该基线；未改变其含义。本文按已批准设计基线单向派生，实际 owner、schema、字段、策略和服务是否获准见下表，不能把文档存在当作门禁通过。\n\n'
 text+='## 实施前待核验事项门禁表\n\n'+gate_table+'\n\n本表逐行取自基线 §13.5。未就绪仅限制相应依赖功能；本文通过不代表未承接批次或生产准入。\n\n'
 text+='## 范围 依赖与交付\n\n必须同时遵守基线 §1—§3 的产品目标、教育依据和反例边界；理论不转为学生标签或教师绩效分。主承接编号：'+coverage+'\n\n'+deps+'\n\n'
 text+='| 工作项 | 输入到交付物 | 验证与边界 |\n| --- | --- | --- |\n'
 for row in items:text+='| '+' | '.join(row)+' |\n'
 text+='\n## 基线承接正文\n\n以下按原章节号完整承接，未省略条件、例子或验收语句。共用条款只在其主承接文件维护；修改须先更新设计基线。来源与原文定位：\n\n'
 for x in selected:text+='- ['+x['key']+']('+B.name+')\n'
 text+='\n'
 for x in selected:text+=x['text']+'\n\n'
 if num==6:
  fixture=R/'evidence/review-round2-fixture-cases.md'
  assert fixture.exists(),'wait for reviewed fixture text'
  fixture_text=fixture.read_text().split('\n',1)[1].strip().replace('](../', '](')
  fixture_text=fixture_text.replace('输入：已正式提交且当前合格的 GradingResult', '输入：满足已发布或v1—v3旧存档兼容、已正式提交且当前合格的 GradingResult')
  fixture_text=re.sub(r'负责范围最终只读核验通过：.*?以下是待实现、待执行的合成夹具','以下是待实现、待执行的合成夹具',fixture_text)
  text+='## 第二轮补充夹具\n\n历史夹具在v0.7执行时统一绑定§6.4的新规则：普通分析来源须满足已发布或本版登记的v1—v3旧存档兼容（含GradingResult尚无Evidence的子例），MET07为三关系独立未暴露默认层，MET08≥14天；每例适用性按§11.1登记。输入不满足新前提则预期不沿用，必须另建版本并记录差异；不复用旧comparable布尔值。\n\n'+fixture_text+'\n\n'
  text+='## 执行记录模板\n\n| 项目 | 执行时填写 |\n| --- | --- |\n| 场景与输入 | 原ID/子例、版本、职责/用途、对象集合、原始数据与授权来源 |\n| 预期与实际 | 逐断言预期、实际值、差异与对象/回执引用；无结果记未测 |\n| 产品条件 | 实现/来源/规则/模型/部署版本、真实服务或夹具、浏览器/辅助技术及主题 |\n| 用户执行 | 参与者职责、任务、帮助内容、0/1/2、耗时、求助/放弃/重复输入与负担 |\n| 结论 | 通过/不通过/未测、两名复核者、分歧及仲裁、整改与关联回归 |\n| 出口 | 本次可用范围、仍关闭能力、证据位置、责任方与复核时点 |\n\n本模板为空白执行载体；没有实际记录、回执或复核时，不预填通过。\n'
 text=text.rstrip()+'\n'
 (D/f).write_text(text)
 manifest['specs'].append({'number':num,'file':f,'title':title,'batch':batch,'gates':gs.split(),'sha256':sha(text),'characters':len(text),'segments':[{'key':x['key'],'source_line':x['source_line'],'source_start':x['start'],'source_end':x['end'],'sha256':sha(x['text'])} for x in selected]})
index='# OLE 学情分析 v0.7 实施规格索引\n\n2026-10-18 · 已批准设计派生的六份规格 · 待实施核验 · Derived / Non-canonical\n\n'
index+='[总设计基线]('+B.name+')与[正式发布记录](RELEASE.md)保留产品总纲、教育理念、调研来源和两轮审核决定。本目录承接执行细则，不生成第二套设计权威。实际实施、服务及生产门禁均未由拆分解除。\n\n'
index+='| 文件 | 主承接 | 入口门禁 |\n| --- | --- | --- |\n'
for num,f,title,batch,gs,purpose,coverage,items,deps in meta:index+='| ['+f+']('+f+') | '+batch+'；'+purpose+' | '+gs.replace(' ','、')+' |\n'
index+='\n## 阅读与实施顺序\n\n先按 01 确定事实、用途、集合与数值，再按 02 承接教师一轮教学；03 的低保真及合同设计可并行，真实功能依赖已就绪的事实和动作。04 的受控接入与生产准入分别验证；05 按职责和域逐项扩展。06 从 P0 起贯穿所有批次，不等最后才补测试。工期须由真实 owner、依赖与资源评估登记，不承诺附件中的月份。\n\n'
index+='## 要求与场景的主承接\n\n| 范围 | 主承接文件 | 相关文件 |\n| --- | --- | --- |\n| MET01—MET10、资格/分母/比较/精度与LA01—06/08/09定义 | 01 | 03保存整改定位；06验证 |\n| LA07、ED01—ED04、行动/执行/修订/复查 | 02 | 01指标；03入口；04交接；05协作 |\n| 五入口、既有报表兼容、LA整改总表、旧深链与迁移 | 03 | 01/02提供事实；04规定Blueprint与可及性 |\n| 阶段、能力目录、双入口、HANDOFF、Blueprint | 04 | 05字段/模型/披露；06验证 |\n| 职责关系、班主任摘要、共享、模型数据、跨域披露 | 05 | 01正式Home与来源资格；02支持事件 |\n| T01—07、E01—10、EDU01—12、M01—04、AG01—06及判定 | 06 | 01—05为被测定义；不得只用夹具宣称真实服务通过 |\n| G01—G05 | 总基线§13.5 | 每份规格头部同步对应行，实例证据实施前取得 |\n\n'
index+='## 完整性与变更\n\n§4—§12 的原文按连续片段逐段分配到一个主承接文件，保留原章节号与来源定位；§1—§3、§13和附录留在总基线。未削减原要求、情境例子或场景条件；新增工作项仅组织原要求，八组补充夹具只把本轮已决定规则具体化。共用规则通过引用连接，必要门禁按要求在各文件头部重复。\n\n'
index+='split-manifest.json 记录源文件 SHA256、每片段位置/摘要与规格摘要；split-validation.json 记录抽取、门禁、场景和表格检查。它们证明文档拆分完整性，不是接口、浏览器、教育或生产验收证据。设计变更先改总基线并记录决定，再重出受影响规格；禁止独立修改复制段落后互相冲突。\n'
(D/'00-实施规格索引.md').write_text(index)
(D/'split-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'specs':len(meta),'segments':len(segs),'characters':sum(x['characters'] for x in manifest['specs']),'index':str(D/'00-实施规格索引.md')},ensure_ascii=False))
