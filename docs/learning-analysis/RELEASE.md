# 学情分析 v1.1 维护与签发记录

- 设计状态：设计候选 v1.1（待 PO 签发）
- 工程准入：未开始
- 版本：v1.1 · 2026-10-24 · Derived, Non-canonical
- 批准人：待签发
- 批准日期：待签发

## 当前交付与证据范围

[主稿](OLE_Learning_Analysis_Design_v1.1.md)、[六规格索引](00-实施规格索引.md)、原位保留的[工程线附录](engineering-appendix-v1.0.md)、[工作台粗验登记](SCREENS.md)与三份 JSON 清单构成本轮 v1.1 候选设计包。PO 2026-10-24 授权先修 F06／E1，尚未整体签发 v1.1。v1.0 主稿与工程派生附件只改头部历史标签，正文保持原字节；六规格当前路径按主稿重出，旧版可从 [609879d 文档目录](https://github.com/Ashrum/intelligence-prism-ui/tree/609879d83d307a54039b24bfe53587eea742e297/docs/learning-analysis) 原路径读取。v0.7-r2、原批准稿、截图、源码参考及影响报告未改。

本版23段产品正文从修订后主稿§4–§12连续派生；新增§12.12承接 F06／A1 增量。29组工程／后续验证片段仍按原历史 Git 9435e92 逐字核对。§6 全文及受保护指标／分类块同时与 v1.0 基线609879d比较；工程附录正文与历史主稿正文也作精确核对。split-validation只证明文档完整性，不代表 Supervisor Review、浏览器验收、真实模型或工程准入。

A1 的 D1／D9／D10／D12 已在合成通道实现，G1–G4 已补验；证据为 W294d #234（516abbf）、W296 #235（e282e93）、W297 #236（9478ab9），详细链接与 Supervisor 2026-10-24 观察转录在 SCREENS。G2 无数值泄露但 E1 提示偏差、E3 工具缺水位未知场景由 W299 处理；G4 保留480＋150%字号覆盖值超框9px未截断观察。C01 真实模型和 C03 持久化原边界不变。P116 不重跑浏览器、不联网读取 PR，也不把合成粗验当真实学校或工程准入。

## v1.1 维护与待签发事项

- 主稿§8落实 F06，并在§9.6写入 E1、§11更新阶段、§12.12登记增量、§13.10登记来源和 PO 派单决定；六规格仅从主稿派生。
- 当前设计状态为“设计候选 v1.1（待 PO 签发）”，批准人／日期“待签发”，工程准入未开始。E1 文案已由 PO 于 2026-10-24 确定；E1／E3 工作台修正 W299 已经 Supervisor 浏览器验收，合并前不得写成已上线。
- 签发元数据唯一入口是下方工具的 `RELEASE_STATE` 常量：PO 实际签发后由 Supervisor 在这一处对象改 `design_status` 为 `design-final`、填写 `approval_person`／`approval_date`，再按同一流程 `--write` 与只读校验。工具同步主稿、README、00、SCREENS、本文件的五行头部和六规格／清单；手工正文与证据不自动改写。当前候选期叙述保留发生时状态，未来签发事实另行登记，不以脚本替代批准或外部同步。
- 本轮无站点产物、组件、scripts 或依赖改动，无提交、推送或发布；签发与发布仍分开。

## 本轮校验与维护流程

1. 先修主稿与决定；工程机制在附录维护。保留已批公式、分母、旧档兼容与交互规则；改变产品规则须有对应授权。
2. 使用split-manifest里的start_marker/end_marker及主承接配置重出六规格。源范围以Unicode字符索引、左闭右开计，不混用UTF-8字节位置；摘要计算实际UTF-8内容。
3. 运行下方文档工具的`--write`模式更新六规格、split-manifest、split-validation及release-manifest，并统一当前五个入口的头部，再以默认只读模式复核；README／00／SCREENS／本文件的正文手工维护。检查新增相对链接、Markdown表格、保护的指标／分类区块、历史正文、10组oracle和工程转移源／目标逐字一致。
4. `git diff --check`；`git status --short`应仅有本目录文档／清单变化。正文不嵌入自己的完整哈希；release-manifest排除自身以避免循环，其余文件逐个指纹。
5. 本次是文档任务，不运行应用构建／全量测试，不沿用旧工程测试数字。浏览器验收由Supervisor执行；已登记粗验／C01证据见 SCREENS，未测范围仍单列。

旧脚本 `scripts/sync-learning-analysis-specs.py` 固定 v0.7-r2，旧 verify 固定17段和旧门禁结构，站点生成器也未适配当前入口。只运行旧 verify 与站点 `--check` 记录预期不兼容，不计本版失败或通过；不运行其写模式、不修改 scripts，不覆盖现行稿或写 public／lib 产物。旧基线通过只对应历史版本。

下方是本轮文档派生／校验工具全文，保留在文档中便于复跑，不新增仓库脚本。仓库根目录可用以下命令提取到临时文件；工具只写本目录当前入口的五行头部、六规格和三份JSON，不调用网络、服务、模型或Git写操作。默认校验也会从既有Git对象读取历史来源；缺历史blob时应取回准确基线再检查，不能跳过来源验证。

```sh
python3 - <<'PYCODE'
from pathlib import Path
text=Path('docs/learning-analysis/RELEASE.md').read_text()
code=text.split('<!-- p96-document-tool:start -->\n```python\n',1)[1].split('\n```\n<!-- p96-document-tool:end -->',1)[0]
Path('/tmp/p96-document-check.py').write_text(code+'\n')
PYCODE
python3 /tmp/p96-document-check.py --write
python3 /tmp/p96-document-check.py
```

<!-- p96-document-tool:start -->
```python
from pathlib import Path
import sys, json, hashlib, re, subprocess
from urllib.parse import unquote
D=Path.cwd()/'docs/learning-analysis'
write='--write' in sys.argv
H=lambda b: hashlib.sha256(b).hexdigest()
J=lambda x: (json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode()
# Single publication metadata source. Change only this object after actual PO approval.
RELEASE_STATE = {
    'revision': 'v1.1',
    'version_date': '2026-10-24',
    'design_status': 'design-candidate',
    'approval_person': '待签发',
    'approval_date': '待签发',
}
r=RELEASE_STATE
assert r['design_status'] in ('design-candidate','design-final')
final=r['design_status']=='design-final'
assert (r['approval_person']!='待签发' and r['approval_date']!='待签发') if final else (r['approval_person']==r['approval_date']=='待签发')
label=('设计正式版 '+r['revision']) if final else ('设计候选 '+r['revision']+'（待 PO 签发）')
header=(f"- 设计状态：{label}\n- 工程准入：未开始\n"
        f"- 版本：{r['revision']} · {r['version_date']} · Derived, Non-canonical\n"
        f"- 批准人：{r['approval_person']}\n- 批准日期：{r['approval_date']}")
m=json.loads((D/'split-manifest.json').read_text())
m.update(design_revision=r['revision'],design_status=r['design_status'],
         approval_person=r['approval_person'],approval_date=r['approval_date'],
         baseline_file='OLE_Learning_Analysis_Design_'+r['revision']+'.md')
outputs={}; segments=[]; count=0
# Only synchronize these five metadata lines; editorial bodies remain manually maintained.
reading=[m['baseline_file'],'README.md','00-实施规格索引.md','SCREENS.md','RELEASE.md']
for name in reading:
    text=(D/name).read_text()
    pattern=r'^- 设计状态：[^\n]*\n- 工程准入：[^\n]*\n- 版本：[^\n]*\n- 批准人：[^\n]*\n- 批准日期：[^\n]*'
    text,n=re.subn(pattern,lambda _: header,text,count=1,flags=re.M)
    assert n==1,name+' missing metadata header'
    outputs[name]=text.encode()
main=outputs[m['baseline_file']].decode()
for spec in m['specs']:
    selected=[]
    for seg in spec['segments']:
        assert main.count(seg['start_marker'])==1 and main.count(seg['end_marker'])==1
        a=main.index(seg['start_marker']); b=main.index(seg['end_marker'],a); body=main[a:b].strip()
        seg.update(source_start=a,source_end=b,source_line=main[:a].count('\n')+1,sha256=H(body.encode()))
        selected.append(body); segments.append((a,b)); count+=1
    text=f"# OLE 学情分析 {spec['title']}\n\n"
    text+=header+'\n\n'
    text+=spec['purpose']+'\n\n'
    text+=f"来源：[{r['revision']}主稿]({m['baseline_file']})。保留主稿章节号，产品正文单向派生；历史结论不作为当前通过。\n\n"
    text+='## 范围与工程交接\n\n'
    text+='本版适用性以主稿§13.9 LD01–LD04、§13.10 F06／E1及06规格§12.10–12.12为准；完整生命周期语义中的后续能力不构成本版即时交付。关联工程索引：'+ '、'.join(spec['engineering_gate_refs'])+'，细则统一在[工程线附录](engineering-appendix-v1.0.md)，不作为设计转正前置。\n\n'
    text+='01定义数值与资格，02定义行动语义，03承接独立页，04定义C01及Agent交互，05定义职责用途，06登记粗验。主稿§1–§3和当前决定共同适用；变更先修主稿，再按[RELEASE](RELEASE.md)重出。\n\n## 基线承接正文\n\n'
    text+='\n\n'.join(selected)+'\n'
    data=text.encode(); outputs[spec['file']]=data
    spec.update(sha256=H(data),characters=len(text))
segments.sort(); assert len(segments)==len(set(segments))
assert segments[0][0]==main.index('## 4 ') and segments[-1][1]==main.index('## 13 ')
assert all(a[1]==b[0] for a,b in zip(segments,segments[1:]))
m['baseline_sha256']=H(main.encode())
app=m['engineering_appendix']; apptext=(D/app['file']).read_text()
app['sha256']=H(apptext.encode()); old_sources={}
for t in app['transfers']:
    source=subprocess.check_output(['git','show',m['historical_git_commit']+':docs/learning-analysis/'+t['source_file']]).decode()
    old_sources[t['source_file']]=H(source.encode())
    piece=source[t['source_start']:t['source_end']]
    assert H(piece.encode())==t['sha256'], t['key']+' historical source mismatch'
    start='<!-- '+t['key']+':start -->\n'; end='\n<!-- '+t['key']+':end -->'
    assert apptext.count(start)==1 and apptext.count(end)==1
    a=apptext.index(start)+len(start); b=apptext.index(end,a)
    assert apptext[a:b]==piece, t['key']+' transfer mismatch'
    t.update(target_start=a,target_end=b,target_line=apptext[:a].count('\n')+1)
app['historical_sources']=old_sources
old=subprocess.check_output(['git','show',m['historical_git_commit']+':docs/learning-analysis/OLE_Learning_Analysis_Design_v0.7-r2.md']).decode()
# Independent protected product blocks; do not claim all section 6 unchanged.
protected=[('| 指标编号与名称 |','MET07 的注册须'),('| 条件 | 显示 |','N按当前学生'),('| 顺序 / 状态 |','旧报告按learning'),('| 题库难度 |','80%/60%/40% 以'),('N按当前学生','**学生进展。**')]
for start,end in protected:
    before=old[old.index(start):old.index(end,old.index(start))].strip()
    after=main[main.index(start):main.index(end,main.index(start))].strip()
    assert before==after, start+' changed approved product block'
# Compare the entire metric chapter against the last signed product source as well.
previous=subprocess.check_output(['git','show',m['previous_design_git_commit']+':docs/learning-analysis/'+m['previous_design_file']]).decode()
section6=lambda t: t[t.index('## 6 '):t.index('## 7 ')]
assert section6(main)==section6(previous),'v1.0 section 6 changed'
for start,end in protected:
    extract=lambda t: t[t.index(start):t.index(end,t.index(start))].strip()
    assert extract(main)==extract(previous),start+' differs from v1.0'
# Historical v1.0 files may change only their design-status line.
for name in [m['previous_design_file'],app['file']]:
    before=subprocess.check_output(['git','show',m['previous_design_git_commit']+':docs/learning-analysis/'+name]).decode()
    after=(D/name).read_text()
    strip_status=lambda t: re.sub(r'^- 设计状态：[^\n]*$', '',t,flags=re.M)
    assert strip_status(before)==strip_status(after),name+' changed beyond historical label'
legacy=(D/'OLE_Learning_Analysis_Design_v0.7-r2.md').read_text()
assert legacy[legacy.index('本文件供产品'):]==old[old.index('本文件供产品'):], 'historical body changed'
assert H((D/'evidence/approved-v0.7-r1.md').read_bytes())=='a979d411f4886ec7c93d5440239b012e2ab2978987466dab2b66d0e1e230e05a'
# Verify ten numerical oracle rows appear exactly in both the source definition and current QA.
start='| 原始输入 | 预期可读结果 |'; oracle=old[old.index(start):old.index('## 7 ')].strip()
assert len([l for l in oracle.splitlines()[2:] if l.startswith('|')])==10
assert main.count(oracle)==2
assert oracle in outputs[next(x['file'] for x in m['specs'] if x['number']==6)].decode()
for prefix,maximum in [('MET',10),('LA',9),('ED',4),('T',7),('E',10),('EDU',12),('M',4),('AG',6)]:
    for n in range(1,maximum+1): assert prefix+str(n).zfill(2) in main
for field in ['LD01=A','LD02=A','LD03=A','LD04=B','qwen3.8-flash','ole-agent-workspace-appearance','blueprint-night','复查统计口径待确认','设计状态：'+label,'批准人：'+r['approval_person'],'批准日期：'+r['approval_date']]:
    assert field in main,field
assert '.supervisor/' not in main and '.supervisor/' not in apptext
outputs['split-manifest.json']=J(m)
# Validate local links and table structure for all changed reading entries, including derived specs.
names=reading+[app['file'],m['previous_design_file']]+[x['file'] for x in m['specs']]
links=0; tables=0
for name in names:
    text=outputs.get(name,(D/name).read_bytes()).decode(); content=re.sub(r'```.*?```','',text,flags=re.S)
    for url in re.findall(r'!?\[[^\]]*\]\(([^\n)]+)\)',content):
        if re.match(r'https?://|#',url): continue
        path=unquote(url.split('#',1)[0]); assert not re.match(r'\w+:|/',path), (name,url)
        dest=(D/name).parent/path
        assert dest.exists(),(name,url); links+=1
    widths=[]
    for line in content.splitlines()+['']:
        if line.startswith('|'):
            widths.append(line.count('|'))
        elif widths:
            assert len(set(widths))==1,(name,'ragged table',widths)
            tables+=1; widths=[]
result={'status':'PASS','revision':r['revision'],'scope':'document integrity only; not Supervisor Review, browser acceptance, model smoke or production admission','baseline_sha256':m['baseline_sha256'],'specs':len(m['specs']),'verbatim_product_segments':count,'section4_to12_continuous':True,'engineering_transfers':len(app['transfers']),'engineering_source_and_target_exact':True,'protected_product_blocks_unchanged':len(protected),'la08_oracles':10,'historical_master_body_unchanged':True,'historical_r1_hash_verified':True,'local_links_checked':links,'tables_checked':tables,'browser_acceptance':'Supervisor A1 2026-10-24 and historical L6 recorded; E1/E3 accepted by Supervisor via W299 (pending merge); see SCREENS.md; not rerun by document tool','c01_smoke':'W278 recorded: timeouts, displayable but blocked, insufficient; see SCREENS.md','approval':r['approval_person']+' · '+r['approval_date'],
        'v1_0_section6_verbatim':True, 'v1_0_history_status_only':True}
outputs['split-validation.json']=J(result)
files=[]
for p in sorted(D.rglob('*')):
    if not p.is_file() or p.name=='release-manifest.json': continue
    rel=p.relative_to(D).as_posix(); b=outputs.get(rel,p.read_bytes())
    files.append({'path':rel,'sha256':H(b),'bytes':len(b)})
release={'revision':r['revision'],'status':r['design_status']+'-local-sync-pending','engineeringAdmission':'not-started','approvalPerson':r['approval_person'],'approvalDate':r['approval_date'],'publication':{'github':'not-synced','outline':'not-synced','site':'not-synced; historical assets unchanged'},'files':files}
outputs['release-manifest.json']=J(release)
for rel in outputs:
    assert (D/rel).resolve().is_relative_to(D.resolve()),'output escapes package: '+rel
if write:
    for rel,b in outputs.items(): (D/rel).write_bytes(b)
else:
    for rel,b in outputs.items(): assert (D/rel).read_bytes()==b,'stale document output: '+rel
# Parse all JSON under the package, including retained evidence.
json_count=0
for p in D.rglob('*.json'): json.loads(p.read_text()); json_count+=1
print(json.dumps({'mode':'write' if write else 'check',**result,'release_files':len(files),'json_files_parsed':json_count},ensure_ascii=False))
```
<!-- p96-document-tool:end -->

## v1.0 签发记录（历史）

- 签发人：Ashrum（PO）；签发日期：2026-10-23；设计正式版 v1.0，Derived, Non-canonical；工程准入：未开始。
- 依据：Supervisor（Claude）2026-10-23 L6 粗验记录，无阻断项。初验基线 `e2a027a`，合成包 `teaching-default` / `teaching-empty`；九行矩阵通过或以定向测试覆盖。主题以 L5b-B 实跑与 L6 补验为准，详见 [SCREENS](SCREENS.md)。LA08／宽度／L5-A/C/D 等定向测试记录为 97/97，并非 P111 重新执行。
- 签发实现：[ole-school-workbench b8191bb](https://github.com/Ashrum/ole-school-workbench/commit/b8191bbfce592ca980fa93f79b09fb07a27a84fb)。[W284 PR #219](https://github.com/Ashrum/ole-school-workbench/pull/219) 修复 N1 未纳入原因、N2 未判定说明、N3 当前深链措辞、N4 旧报告更新提示与新版本入口、A1 仅文字放大 200% 排版；Supervisor 复验通过，原记录全量 7770/7770。此处仅转录既有证据，不冒称本次构建或测试。
- 实施追溯：L3 [#209](https://github.com/Ashrum/ole-school-workbench/pull/209) / [#210](https://github.com/Ashrum/ole-school-workbench/pull/210)、L4-C [#212](https://github.com/Ashrum/ole-school-workbench/pull/212)、L5-A [#213](https://github.com/Ashrum/ole-school-workbench/pull/213)、L5-B [#215](https://github.com/Ashrum/ole-school-workbench/pull/215)、L5-C [#217](https://github.com/Ashrum/ole-school-workbench/pull/217)、L5-D [#218](https://github.com/Ashrum/ole-school-workbench/pull/218)、W281 [#216](https://github.com/Ashrum/ole-school-workbench/pull/216)。链接用于定位，P111 未联网读回。

### 已知限制（LE2，登记不阻断）

1. 合成数据更正后，演示环境 C01 用途授权（绑定原合成包）拒绝再生成建议。
2. 来源变化按整体来源阻断草稿，未受影响题的草稿也需逐份确认。
3. 练习保存成功后直接显示完整版本 ID。
4. 真实 qwen 冒烟链路可用，但建议常被校验拦下；不把 displayable 当成建议可采纳或质量通过。
5. 真实服务、真实写入 / HANDOFF、生产准入、真实教师可用性与教学试点均未测。

未测范围还包括 light / paper Agent 四画面、390 下 light / paper / blueprint-night、真实读屏软件朗读；撤权／切账号、迟到回调、净宽迟滞及阈值边界以定向测试替代浏览器逐项操作。真实 C01 模型冒烟是限定合成字段的例外证据，不代表其余真实服务验收。

主稿与六规格的产品正文按 P111 范围原样保留，其中“候选／待执行／待整体批准”是候选期叙述；当前签发与实际证据以本节和 SCREENS 为准。工程交接附录也保持原样，候选期附件头部不代表本版退回候选，工程准入仍未开始。

## 后续同步（v1.1 未执行）

本次仅完成本地 v1.1 候选设计包及内容指纹更新。PO 实际签发后，由 Supervisor 独立 Review 当前 diff 后按授权提交、同步 GitHub／Outline 并逐项读回；本地签发登记不等于各端已同步。组件站点发布归 GPT 线，需另单适配版本入口、附录和新映射校验，生产构建后沿既有站点发布链执行，不新建站点。本任务不运行站点生成／发布脚本，不写 public 或 lib 产物。

## 历史 v0.7-r2 发布记录

以下原发布与审核叙述仅对应2026-10-18版本，历史维护命令不可直接运行于当前候选正文；其批准、PASS、实拍及发布均不转移为v1.0／v1.1证据。

# 学情分析 v0.7 r2 正式发布记录

2026-10-18 · 已批准设计与实施规格拆分基线 · Derived / Non-canonical

本次发布由用户在对话明确授权：“形成正式文档，并同步本地-github-组件站点。”采用已批准的 v0.7，增加 r2 发布修订号；不另造 Canonical 版本，不重复请求此前已批准的产品决定。

## 发布内容

- [完整主稿](OLE_Learning_Analysis_Design_v0.7-r2.md)：总体规划、教育理论、独立页、Agent、多角色、数据与验证。
- [六份规格索引](00-实施规格索引.md)：P0—P4 及全周期验证，17 段正文单向派生，G01—G05 按适用依赖核验。
- [画面与交互说明](SCREENS.md)：四画面及 r2 差异提示，均为合成数据设计证据。
- [分类影响报告](evidence/review-v07r1-expected-impact.md)：原脚本、JSON 和 CSV 保留；本次未改数值规则或重写旧证据。
- [r1→r2 主稿差异](evidence/formal-r2-main.diff)、[拆分清单](split-manifest.json)、[发布文件清单](release-manifest.json)。

## 审核依据与签发范围

Claude 的 v0.7 r1 增量复核结论为 **PASS**，F1—F7 全部核销，F1/F2 两个整体批准条件已满足。该结论来自用户本次粘贴的复核意见，没有生成或冒称 Claude 另行签字文件。r1 主稿 SHA-256：`a979d411f4886ec7c93d5440239b012e2ab2978987466dab2b66d0e1e230e05a`；[原样审核对象](evidence/approved-v0.7-r1.md)供哈希核对，其中旧本机链接仅反映历史环境。

用户已批准 80/60/40 及基础→易、巩固→中、提升→难；整体 v0.7 在修复 F1/F2 后获条件批准。MET08 学校时区日历日、含第14天由用户委托设计方按教学日历习惯决定，r1 复核已认可。r2 不改变这些规则。

| 层次 | 结论 |
| --- | --- |
| r1 独立审核 | Claude PASS：主稿、六份规格、四画面原型；11张截图、F2独立重放、F5五条路径 |
| r2 增量收口 | Codex 修复并实测下表三项；不冒称 Claude 又审核了 r2 |
| 正式设计发布 | 用户授权，本地/GitHub/组件站点使用同一发布包；发布 SHA 与 Site 版本由完成回执记录 |
| 实施与生产 | 待适用门禁和实际证据；真实服务、BKT、正式测量、教师试点与生产开放未因设计发布通过 |

## r2 差异与验证

| 遗留项 | 决策与正文承接 | 实际验证 |
| --- | --- | --- |
| R-1 | 采纳。更正对照表显示“失分比例”；§8.3/规格04 | 浏览器显示18/36→16/36及50.0%→44.4%，见更新画面4 |
| R-2 | 采纳差异提示与显式替换；教师可确认“教师自拟”，内部引用/编辑链保留。§8.2、AG02/r2、规格04/06 | 实走“改后采纳→手改→改为采纳→再进草稿”，提示变化且保留原文；取消保持原文和提示；来源确认显示教师自拟；确认替换更新实际输入框和来源。复测修复了隔离 React 宿主 defaultValue 只更新状态、未刷新字段的问题 |
| R-3 | 采纳。概览“集中在2个知识点”；§8.3/规格04 | 浏览器读回人数8、支持5+回落3、七状态合计40；正式实现仍须同一学生投影计算 |

本轮本机 Chrome 按实际视口1728×996核对并记录新图；r1已有1440/1280、浅色、390截图按原验证范围保留。未重新宣称 r2 的390交互、完整键盘/读屏、真实服务或工作台端到端已通过。隔离宿主 Vite production build 通过；网页阅读器的检查另见仓库 PR 验证说明。

F2 原证据固定工作台 `bbc8c11b66ad4e4b2f1b8a3392126cf7ab7841a6`，Claude 独立重放使用 `5c073ca`，仅运行时间、HEAD和Node版本不同，汇总和逐项结果一致；这是用户提交的独立复核结果。本轮读取工作台完整 HEAD `5c073ca43241d45dd959b3e1588e973b03517ecb`，组件发布起点 `a2adebf22341c67916fca67ce492cb27b6825194`。这些源码基线与本次文档发布提交分别登记。

## 同步与维护

仓库正式位置为 `docs/learning-analysis/`。本地研究目录的 `formal-release-v0.7-r2/` 为同字节副本；历史 v0.7 r1 研究文件保留原样。组件站点从仓库 Markdown 生成可读正文及下载文件，图片和影响报告一并发布，不另建站点。

规则变更先修订主稿及决定，再运行 `python3 scripts/sync-learning-analysis-specs.py`；之后运行 `node scripts/sync-learning-analysis-docs.mjs` 生成站点正文与资产。`node scripts/verify-learning-analysis-release.mjs` 核对摘录、分母/场景编号、文件链接和源哈希。不能直接改派生摘录或网页JSON后当成基线更新。

本次未修改 PTA/STEP1 冻结文档、教师工作台业务代码或 `.claude/launch.json`。需由权威文档责任方承接的已批调整继续按主稿§13.7登记，不因本次发布宣称回写完成。
