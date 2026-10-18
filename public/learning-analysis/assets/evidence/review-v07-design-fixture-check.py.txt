"""Independent v0.7 design-oracle checks, NOT workbench/business-code acceptance.
No application imports or services. Small semantic fixtures evaluate the approved
text rules; dictionary names below are local test names, not canonical schemas.
"""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json

BASE = Path(__file__).resolve().parent.parent
MAIN = BASE / 'OLE-学情分析系统设计与规划-决策修订稿-v0.7.md'
OUT = BASE / 'evidence/review-v07-design-fixture-check.json'
checks = []

def check(name, inputs, actual, expected):
    checks.append({'name': name, 'inputs': inputs, 'actual': actual,
                   'expected': expected, 'pass': actual == expected})

def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()

# Gate only; all other ordinary-analysis qualifications remain independent.
def ordinary_gate(x):
    if not x['other_qualifications']:
        return False, None
    if x['published']:
        return True, 'published-main-test-label'
    seed = x['learningSeedVersion']
    if type(seed) is not int or seed not in (1, 2, 3):
        return False, None
    if not x['same_task_and_context_completed'] or x['any_task_version_published']:
        return False, None
    object_ids = {'task-A', 'result-A1', 'result-A2'}
    if any(e['objectId'] in object_ids and '发布' in e['label'] for e in x['events']):
        return False, None
    return True, 'legacy-learning-read-v1'

legacy = {'learningSeedVersion': 1, 'ResultVersion.version': 'v99',
          'same_task_and_context_completed': True, 'published': False,
          'any_task_version_published': False, 'events': [],
          'other_qualifications': True}
for seed in (1, 2, 3):
    x = dict(legacy, learningSeedVersion=seed)
    before = deepcopy(x)
    allowed, rule = ordinary_gate(x)
    check(f'R1 old seed {seed}', x, [35 + int(allowed), 40, rule],
          [36, 40, 'legacy-learning-read-v1'])
    check(f'R1 seed {seed} read-only', before, x, before)
for seed in (4, 5, None, 9):
    x = dict(legacy, learningSeedVersion=seed, **{'ResultVersion.version': 'v3'})
    allowed, rule = ordinary_gate(x)
    check(f'R1 new/missing/invalid {seed}', x, [35 + int(allowed), 40, rule],
          [35, 40, None])
for event_id in ('task-A', 'result-A1', 'result-A2'):
    x = dict(legacy, events=[{'objectId': event_id, 'label': '发布结果'}])
    check('R1 prior publication ' + event_id, x,
          [35 + int(ordinary_gate(x)[0]), 40], [35, 40])
for name, change, expected in [
    ('unrelated publication', {'events': [{'objectId': 'task-B', 'label': '发布结果'}]}, True),
    ('other version published', {'any_task_version_published': True}, False),
    ('wrong task/context or unfinished', {'same_task_and_context_completed': False}, False),
    ('withdrawn or unauthorized', {'other_qualifications': False}, False),
    ('new published', {'learningSeedVersion': 5, 'published': True}, True),
]:
    x = dict(legacy, **change)
    check('R1 ' + name, x, ordinary_gate(x)[0], expected)

# Exact rational arithmetic for the approved design table; not service admission.
# An absent per-item source AND absent qualified fallback is not a zero expected rate.
def met10(points, scores, expected_rates):
    actual = sum(map(F, scores)) / sum(map(F, points))
    if any(rate is None for rate in expected_rates):
        return [float(100 * actual), None, None]
    expected = sum(F(p) * F(e) for p, e in zip(points, expected_rates)) / sum(map(F, points))
    return [float(100 * actual), float(100 * expected), float(100 * (actual - expected))]
check('MET10 weighted approved v0 fallback', {'points': [2,3,5], 'scores':[1,3,3], 'rates':['4/5','3/5','2/5']},
      met10([2,3,5], [1,3,3], ['4/5','3/5','2/5']), [70.0,54.0,16.0])
check('MET10 retained two-question example', {'points':[2,3], 'scores':[1,3], 'rates':['4/5','3/5']},
      met10([2,3],[1,3],['4/5','3/5']), [80.0,68.0,12.0])
for missing in range(3):
    rates = ['4/5','3/5','2/5']; rates[missing] = None
    check('MET10 neither expected source available item ' + str(missing+1), {'rates':rates},
          met10([2,3,5],[1,3,3],rates), [70.0,None,None])

# V2 classification is separate from the v3 progress-history sufficient predicate.
def mastery(n, g, h=None, c=None, no_h_confirmed=False):
    if n is None: return '—'
    if n < 3: return '数据不足'
    if g is None: return '—'
    if D(g) >= 0:
        if h is None: return '基本掌握' if no_h_confirmed else '—'
        return '已掌握' if D(h) >= 80 else '基本掌握'
    if c is None: return '—'
    return '基本掌握' if D(c) >= 60 else '待巩固'
for name, args, expected in [
    ('2 questions', (2,'0','80',None,False), '数据不足'),
    ('H 80', (3,'0','80',None,False), '已掌握'),
    ('confirmed no H', (3,'0',None,None,True), '基本掌握'),
    ('H 79.9', (3,'0','79.9',None,False), '基本掌握'),
    ('H 0', (3,'0','0',None,False), '基本掌握'),
    ('C 60', (3,'-0.01',None,'60',False), '基本掌握'),
    ('C 59.9', (3,'-0.01',None,'59.9',False), '待巩固'),
    ('missing C', (3,'-0.01',None,None,False), '—'),
    ('unknown H not absent', (3,'0',None,None,False), '—'),
    ('no complete G', (3,None,'80','100',False), '—'),
    ('H unrounded 79.95', (3,'0','79.95',None,False), '基本掌握'),
    ('C unrounded 59.95', (3,'-1',None,'59.95',False), '待巩固'),
    ('negative G overrides low H shorthand', (3,'-1','79','30',False), '待巩固'),
]:
    check('V2 mastery ' + name, list(args), mastery(*args), expected)
refs = [('Q1','v1'), ('Q1','v1'), ('Q2','v1')]
check('V2 exact-version distinct count', refs, [len(set(refs)),len(set(refs+[('Q1','v2')]))], [2,3])
detections = [{'id':'D1','date':'2026-10-01','complete':True},
              {'id':'D2','date':'2026-10-08','complete':True},
              {'id':'D3','date':'2026-10-15','complete':False}]
latest = sorted((d for d in detections if d['complete']), key=lambda d:(d['date'],d['id']))[-1]
check('V2 most recent complete with later gap', detections,
      [latest['id'],[d['id'] for d in detections if d['date']>latest['date'] and not d['complete']]], ['D2',['D3']])

# Semantic summaries of v3 inputs; NOT data ingestion, matching, or owner qualification.
def progress(x):
    if not x['context_counts'] or any(n<3 for n in x['context_counts']) or x['answer_items']<3:
        return '数据不足'
    if any(lost>=2 and F(total-lost,total)<F(7,10) for lost,total in x['latest_retests'] if total):
        return '近期回落'
    gaps = x['gaps']
    if len(gaps[-3:])==3 and all(g is not None and D(g)>=0 for g in gaps[-3:]):
        return '稳定保持'
    if x['pending_correction']: return '已纠正待验证'
    rates = x['recovery_rounds'][-2:]
    if len(rates)==2 and F(rates[1])>F(rates[0]): return '正在巩固'
    if len(gaps[-2:])==2 and all(g is not None and D(g)<0 for g in gaps[-2:]) and x['c'] is not None and D(x['c'])<60:
        return '需要支持'
    return '继续观察'
p0 = {'context_counts':[3], 'answer_items':3, 'latest_retests':[],
      'gaps':['-5','5','-5'], 'pending_correction':False,
      'recovery_rounds':['1/2','1/2'], 'c':'50'}
for name, changes, expected in [
    ('fallback', {}, '继续观察'),
    ('upward before support', {'gaps':['-5']*3,'recovery_rounds':['1/4','2/4'],'c':'37.5'}, '正在巩固'),
    ('decline before stable, interval10', {'gaps':['0']*3,'latest_retests':[(2,4)]}, '近期回落'),
    ('stable before pending', {'gaps':['0']*3,'pending_correction':True}, '稳定保持'),
    ('pending before upward', {'pending_correction':True,'recovery_rounds':['1/4','2/4']}, '已纠正待验证'),
    ('support', {'gaps':['-5']*3}, '需要支持'),
    ('support boundary C60', {'gaps':['-5']*3,'c':'60'}, '继续观察'),
    ('missing C not zero', {'gaps':['-5']*3,'c':None}, '继续观察'),
    ('missing numeric G retained', {'gaps':[None]*3,'c':None}, '继续观察'),
    ('context history short', {'context_counts':[3,2]}, '数据不足'),
    ('item history short', {'answer_items':2}, '数据不足'),
    ('decline exactly70 not below', {'latest_retests':[(3,10)]}, '继续观察'),
    ('two lost but80 retained', {'latest_retests':[(2,10)]}, '继续观察'),
    ('context slips not accumulated', {'context_counts':[3,3],'latest_retests':[(1,2),(1,2)]}, '继续观察'),
]:
    x = dict(p0, **changes)
    check('V2 progress ' + name, x, progress(x), expected)
# Different metric/denominator: 10-day repeated successes cannot yield MET08.
check('progress decline not MET08', {'days':[10,10,10,10],'full':[True,True,False,False]},
      sum(1 for day in [10,10,10,10] if day>=14), 0)

# Independently verify freshly generated specification provenance, not its runtime behavior.
text = MAIN.read_text()
manifest = json.loads((BASE/'implementation-specs-v0.7/split-manifest.json').read_text())
check('main hash matches manifest', {}, sha(text), manifest['baseline_sha256'])
spec_provenance=[]
for spec in manifest['specs']:
    path=BASE/'implementation-specs-v0.7'/spec['file']; content=path.read_text()
    valid=sha(content)==spec['sha256']
    segment_results=[]
    for seg in spec['segments']:
        extract=text[seg['source_start']:seg['source_end']].strip()
        segment_results.append({'key':seg['key'],'hash_matches':sha(extract)==seg['sha256'],
                                'exact_text_present':extract.strip() in content})
    spec_provenance.append({'file':str(path),'hash_matches':valid,'segments':segment_results})
    check('spec provenance ' + spec['file'], {},
          valid and all(s['hash_matches'] and s['exact_text_present'] for s in segment_results), True)
check('LA05 restored G precondition', {}, 'G≥0且H<80%为基本掌握' in text, True)
check('legacy registration is design-only identity', {},
      '本稿登记名 legacy-learning-read-v1' in text and '不是新设发布状态或扩大权限' in text, True)

result={'purpose':'Independent design-fixture calculation and document provenance only; NOT business code/browser/service acceptance',
        'generated_at_utc':datetime.now(timezone.utc).isoformat(),
        'main_file':str(MAIN),'main_sha256':sha(text),'historical_source_review_head':'3d32d4f3d06cd66b739665101778ff32757ce357','current_source_replay_evidence':'review-v07r1-expected-impact.json',
        'no_business_code_imports':True,'table_approval':'80/60/40 and label adaptation explicitly approved by user; per-item expectations take priority; design only',
        'checks':checks,'spec_provenance':spec_provenance,
        'summary':{'passed':sum(c['pass'] for c in checks),'failed':sum(not c['pass'] for c in checks)}}
OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'output':str(OUT),'main_sha256':result['main_sha256'],**result['summary']},ensure_ascii=False))
for c in checks:
    if not c['pass']: print(json.dumps(c,ensure_ascii=False))
raise SystemExit(1 if result['summary']['failed'] else 0)
