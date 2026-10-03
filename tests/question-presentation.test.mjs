import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/question-charter/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const result = await build({ stdin: { contents: `
export { Button as CossButton } from './components/coss/button';
export * from './components/prism-next/question-card';
export * from './components/prism-next/question-content';
export * from './components/prism-next/question-details';
export * from './components/prism-next/demos/agent-demo-presentation';
export * from './components/prism-next/demos/agent-candidate-picker';
export * from './components/prism-next/demos/agent-object-viewer';
export * from './components/prism-next/demos/agent-item-reviewer';
export * from './components/prism-next/demos/agent-collection-basket';
export * from './components/prism-next/demos/agent-structure-arranger';
export * from './components/prism-next/demos/agent-question-presentation';
export * from './components/prism-next/demos/agent-review-queue';
export * from './components/prism-next/demos/agent-metric-summary';
export * from './components/prism-next/demos/agent-distribution-matrix';
export * from './components/prism-next/demos/agent-evidence-drilldown';
export * from './components/prism-next/agent-collection-basket';
export * from './components/prism-next/agent-object-viewer';
export * from './components/prism-next/agent-semantic-components';
export * from './components/prism-next/fixtures/question-presentation-samples';
`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, result.outputFiles[0].text);
const c = await import(file);
await rm(file);
const h = React.createElement;
const text = html => html.replace(/<[^>]*>/g, '');
const question = { id: 'real-question-2048', title: '从配方解释最小值', kind: '复合题', points: 10, stem: '完整题干。', answer: 'ANSWER_SECRET', explanation: 'EXPLANATION_SECRET' };
const metadata = { knowledge: [], method: '', demand: '', family: '', source: '', version: '' };
const detailProps = { question, metadata, links: {}, onLinksChange() {}, tab: 'answer', onTabChange() {} };
function capture(Component, props) {
  const nodes = [];
  function Probe() {
    const tree = Component(props);
    function visit(node) {
      if (!React.isValidElement(node)) return;
      nodes.push(node); React.Children.forEach(node.props.children, visit);
    }
    visit(tree); return tree;
  }
  render(h(Probe)); return nodes;
}
function demo(Component, props, view = 'inline', density = 'default') {
  return render(h(c.AgentDemoPresentation.Provider, { value: { previewOnly: true, embedded: true, view, density, onExpand() {}, onBack() {} } }, h(Component, props)));
}

test('all five ResponseModels have exact part labels, including multiple without points', () => {
  const labels = { single: '单选', multiple: '多选', fill: '填空', boolean: '判断', long: '解答' };
  for (const [response, label] of Object.entries(labels)) {
    const html = render(h(c.QuestionContent, { question: { ...question, parts: [{ id: '1', response, points: 2, content: '问题。' }] } }));
    assert.ok(text(html).includes(`${label} · 2 分`), response);
    if (response === 'multiple') assert.doesNotMatch(text(html), /解答/);
  }
  assert.match(render(h(c.QuestionContent, { question: { ...question, parts: [{ id: 'a', response: 'multiple', content: '多选内容' }] } })), /多选/);
});

test('missing archive status stays unknown and an explicitly supplied status is preserved', () => {
  const unknown = render(h(c.QuestionDetails, { ...detailProps, tab: 'archive' }));
  assert.match(unknown, /可用状态<\/dt><dd[^>]*>未知<\/dd>/);
  const supplied = render(h(c.QuestionDetails, { ...detailProps, tab: 'archive', status: '已停用' }));
  assert.match(supplied, /可用状态<\/dt><dd[^>]*>已停用<\/dd>/);
  assert.doesNotMatch(unknown, /<dd[^>]*>可用<\/dd>/);
});

test('missing answers and explanations are explicit at whole-question and part level; zero is not missing', () => {
  const html = render(h(c.QuestionSolution, { question: { ...question, answer: undefined, explanation: null, parts: [{ id: '1', content: '问题', answer: '', explanation: undefined }] } }));
  assert.equal(text(html).split('未提供参考答案').length - 1, 2);
  assert.equal(text(html).split('未提供解析').length - 1, 2);
  assert.doesNotMatch(html, /text-block-title|undefined 分/);
  const zero = render(h(c.QuestionSolution, { question: { ...question, answer: 0 } }));
  assert.match(text(zero), /参考答案0/); assert.doesNotMatch(zero, /未提供参考答案/);
});

test('the host can remove the answer tab completely; all missing teaching fields stay visible', () => {
  const html = render(h(c.QuestionDetails, { ...detailProps, tabs: ['teaching', 'archive'] }));
  assert.doesNotMatch(html, /ANSWER_SECRET|EXPLANATION_SECRET|question-solution|aria-label="答案与解析"/);
  for (const label of ['核心知识点', '考查方法', '认知要求', '教材与章节', '课程标准', '未关联', '尚未关联教材章节']) assert.ok(text(html).includes(label));
  assert.equal(render(h(c.QuestionDetails, { ...detailProps, tabs: [] })), '');
});

test('number is only a display ordinal and never changes the actual archive identifier', () => {
  const copy = structuredClone(question);
  const html = render(h(c.QuestionCard, { question, number: 7, detailsOpen: true, details: h(c.QuestionDetails, { ...detailProps, tab: 'archive' }) }));
  assert.match(text(html), /第 7 题 · 从配方解释最小值/);
  assert.match(html, /题目编号<\/dt><dd[^>]*>real-question-2048<\/dd>/);
  assert.deepEqual(question, copy);
  assert.match(render(h(c.QuestionCard, { question })), /<h3[^>]*>从配方解释最小值<\/h3>/);
});

test('headingLevel defaults to 3 and all six optional levels keep their aria association', () => {
  for (const headingLevel of [undefined, 1, 2, 3, 4, 5, 6]) {
    const html = render(h(c.QuestionCard, { question, headingLevel }));
    const id = html.match(/aria-labelledby="([^"]+)"/)[1];
    assert.ok(html.includes(`<h${headingLevel ?? 3} id="${id}"`));
  }
});

test('L0 is a native button or link, exposes title/status, and never mounts the question body', () => {
  const calls = [], trigger = {};
  const props = { question, number: 3, onOpen: value => calls.push(value), status: h('span', null, '待核对') };
  const html = render(h(c.QuestionReference, props));
  assert.match(html, /<button[^>]*type="button"/); assert.match(text(html), /第 3 题 · 从配方解释最小值/);
  assert.match(html, /待核对/); assert.doesNotMatch(html, /完整题干|ANSWER_SECRET|question-solution/);
  capture(c.QuestionReference, props).find(node => node.type.name === 'Button').props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, [trigger]);
  assert.match(render(h(c.QuestionReference, { question, href: '/questions/real-question-2048' })), /<a[^>]*href="\/questions\/real-question-2048"/);
});

test('L1 preserves the entire stem and MathML, marks block omission, and opens via the exact host trigger', () => {
  const calls = [], trigger = {};
  const formula = h(c.QuestionMath, { block: true, label: '分式公式' }, h('mfrac', null, h('mi', null, 'a'), h('mi', null, 'b')));
  const longStem = '很长的中文题干'.repeat(80);
  const q = { ...question, stem: h('div', null, longStem, formula), blocks: [{ id: 'b', content: '后续材料' }], options: [{ id: 'A', content: '选项内容' }], parts: [{ id: '1', content: '小问内容' }] };
  const props = { question: q, number: 8, onOpen: value => calls.push(value) };
  const html = render(h(c.QuestionSummaryRow, props));
  assert.ok(text(html).includes(longStem)); assert.match(html, /<mfrac><mi>a<\/mi><mi>b<\/mi><\/mfrac>/);
  assert.match(html, /data-question-excerpt="true"/); assert.match(html, /节选/); assert.match(html, /查看详情/);
  assert.doesNotMatch(html, /line-clamp|后续材料|选项内容|小问内容|question-detail-region|question-solution|ANSWER_SECRET/);
  capture(c.QuestionSummaryRow, props).find(node => node.type.name === 'Button').props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, [trigger]);
  assert.equal(render(h(c.QuestionSummaryRow, props)), html);
});

test('L1 without an opener or with excerpt=false keeps full blocks and never claims an excerpt', () => {
  const q = { ...question, blocks: [{ id: 'b', content: '完整后续材料' }], options: [{ id: 'A', content: '完整选项' }] };
  for (const extra of [{}, { onOpen() {}, excerpt: false }]) {
    const html = render(h(c.QuestionSummaryRow, { question: q, ...extra }));
    assert.match(html, /完整后续材料/); assert.match(html, /完整选项/); assert.doesNotMatch(html, /data-question-excerpt|节选/);
  }
});

test('L1 checkbox names include ordinal and title and selection only calls the host', () => {
  const calls = [], props = { question, number: 9, checked: false, onCheckedChange: value => calls.push(value) };
  const checkbox = capture(c.QuestionSummaryRow, props).find(node => node.type.name === 'Checkbox');
  assert.equal(checkbox.props['aria-label'], '批量勾选：第 9 题 · 从配方解释最小值');
  checkbox.props.onCheckedChange(true); assert.deepEqual(calls, [true]); assert.equal(props.checked, false);
});

test('legacy compact has a safe complete fallback; opting into L1 cannot mount details', () => {
  const q = { ...question, options: [{ id: 'A', content: '完整选项' }] };
  const legacy = render(h(c.QuestionCard, { question: q, compact: true }));
  assert.match(legacy, /完整选项/); assert.doesNotMatch(legacy, /line-clamp/);
  const summary = render(h(c.QuestionCard, { question: q, compact: true, onOpen() {}, detailsOpen: true, details: h(c.QuestionDetails, detailProps) }));
  assert.match(summary, /data-question-level="L1"/); assert.match(summary, /节选/);
  assert.doesNotMatch(summary, /question-solution|question-detail-region|ANSWER_SECRET/);
});

test('L3 remains borderless and has no selection, toolbar, status, or detail interaction', () => {
  const html = render(h(c.QuestionCard, { question, number: 2, reading: true, checked: true, onCheckedChange() {}, actions: 'PRIMARY_ACTION', status: 'STATUS', detailsOpen: true, details: h(c.QuestionDetails, detailProps) }));
  for (const value of ['第 2 题', '完整题干', '10 分']) assert.ok(text(html).includes(value));
  assert.doesNotMatch(html, /PRIMARY_ACTION|STATUS|question-solution|checkbox|ring-1|shadow-xs/);
});

test('detail tabs keep canonical order and full accessible names while offering three short labels', () => {
  const html = render(h(c.QuestionDetails, { ...detailProps, tabs: ['archive', 'answer', 'teaching'] }));
  for (const label of ['答案与解析', '教学定位', '题目档案']) assert.ok(html.includes(`aria-label="${label}"`));
  assert.ok(html.indexOf('aria-label="答案与解析"') < html.indexOf('aria-label="教学定位"'));
  assert.ok(html.indexOf('aria-label="教学定位"') < html.indexOf('aria-label="题目档案"'));
  for (const short of ['答案', '定位', '档案']) assert.ok(html.includes(`>${short}</span>`));
  assert.match(html, /auto-cols-fr grid-flow-col/); assert.doesNotMatch(html, /overflow-x-auto/);
});

test('the selected L2 uses the shared surface and metadata role across the 12 SSR review frames', () => {
  for (const theme of ['light', 'paper', 'dark']) for (const width of [1280, 900, 390, 320]) {
    const html = render(h('div', { 'data-prism-theme': theme, style: { width } }, h(c.QuestionCard, { question: c.questionPresentationSample, checked: true })));
    for (const token of ['rounded-xl', 'p-4', 'shadow-xs/5', 'ring-primary/60', 'bg-info/10', 'text-ui-meta', 'text-item-title', 'text-read-body']) assert.ok(html.includes(token), token);
    assert.match(html, /多选/); assert.match(html, /<math/); assert.doesNotMatch(html, /data-slot="badge"/);
  }
});

test('candidate conversation previews contain L1 and never a details region or answer payload', () => {
  for (const density of ['default', 'compact']) {
    const html = demo(c.CandidatePickerExample, { purpose: 'questions' }, 'inline', density);
    assert.match(html, /data-question-summary/); assert.match(html, /查看详情/); assert.match(html, /节选/);
    assert.doesNotMatch(html, /question-detail-region|question-solution|aria-label="答案与解析"|分子、分母同时乘以分母的共轭式/);
    for (const fact of ['失效', '受限', '已在集合中', '尚未提交']) assert.ok(text(html).includes(fact), fact);
  }
  const full = demo(c.CandidatePickerExample, { purpose: 'questions' }, 'workspace');
  assert.match(full, /data-question-level="L2"/); assert.match(full, /question-solution/);
});

test('basket compact titles and arranger L1 retain external facts without inline details', () => {
  const basket = demo(c.CollectionBasketExample, { purpose: 'questions', narrow: true });
  const arranger = demo(c.ArrangementExample, { purpose: 'paper', narrow: true });
  assert.match(basket, /查看题目/); assert.match(arranger, /查看详情/);
  assert.match(basket, /data-collection-summary-row/); assert.doesNotMatch(basket, /data-question-summary|data-collection-content/);
  assert.match(arranger, /data-question-summary/);
  for (const html of [basket, arranger]) {
    assert.doesNotMatch(html, /question-solution|question-detail-region|aria-label="答案与解析"/);
  }
  assert.match(basket, /本页暂存/); assert.match(arranger, /未保存/);
});

test('object-viewer question fixture mounts default answer only in workspace; review only permits answer details', () => {
  const inline = demo(c.ObjectViewerExample, { purpose: 'question', narrow: false });
  assert.match(inline, /data-question-reference/); assert.doesNotMatch(inline, /question-solution|展开完整题目|确认查看答案与解析/);
  const full = demo(c.ObjectViewerExample, { purpose: 'question', narrow: false }, 'workspace');
  assert.match(full, /question-solution/); assert.match(full, /分子、分母同时乘以分母的共轭式/);
  for (const view of ['inline', 'workspace']) {
    const review = demo(c.ReviewerExample, { example: c.itemReviewExamples.scan, grading: false, narrow: false }, view);
    if (view === 'inline') assert.doesNotMatch(review, /question-solution|aria-label="答案与解析"/);
    else { assert.match(review, /question-solution/); assert.match(review, /aria-label="答案与解析"/); assert.doesNotMatch(review, /aria-label="教学定位"|aria-label="题目档案"/); }
  }
});

test('new basket summary opt-in preserves workspace-only default and never invokes a restricted item slot', () => {
  const calls = [];
  const props = { collection: { id: 'c', title: '集合', type: '题目' }, items: [{ id: 'q', title: '题目', type: '题目' }, { id: 'private', access: 'restricted', disclosure: { label: '受限题', reason: '不可披露' } }], summary: { count: 2 },
    renderItem: item => { calls.push(item.id); return h('div', null, 'SLOT_CONTENT'); } };
  assert.doesNotMatch(render(h(c.AgentCollectionBasket, props)), /SLOT_CONTENT/); assert.deepEqual(calls, []);
  for (const view of ['inline', 'workspace']) {
    assert.doesNotMatch(render(h(c.AgentCollectionBasket, { ...props, view, itemPresentation: 'summary' })), /SLOT_CONTENT/); assert.deepEqual(calls, []);
  }
  calls.length = 0;
  assert.match(render(h(c.AgentCollectionBasket, { ...props, view: 'workspace' })), /SLOT_CONTENT/); assert.deepEqual(calls, ['q']);
});

test('object host-disclosure opt-in cannot mount sensitive summaries or content; local remains default', () => {
  const props = { object: { id: 'q', type: '题目', name: '题目' }, version: { id: 'v', label: 'v1', state: 'current' }, access: { state: 'available', scope: '本题' }, activeSection: null,
    sections: [{ id: 'stem', title: '题面', summary: 'SUMMARY', content: 'CONTENT' }, { id: 'answer', title: '答案', sensitive: { reason: '先确认' }, summary: 'SENSITIVE_SUMMARY', content: 'SENSITIVE_CONTENT' }] };
  const local = render(h(c.AgentObjectViewer, props)); assert.match(local, /展开题面|确认查看答案/);
  const host = render(h(c.AgentObjectViewer, { ...props, inlineDisclosure: 'host' }));
  assert.match(host, /SUMMARY/); assert.doesNotMatch(host, /CONTENT|SENSITIVE_SUMMARY|展开题面|确认查看答案/);
  const full = render(h(c.AgentObjectViewer, { ...props, view: 'workspace', inlineDisclosure: 'host' }));
  assert.match(full, /CONTENT/); assert.match(full, /确认查看答案/); assert.doesNotMatch(full, /SENSITIVE_CONTENT/);
});

test('26 stage and historical row statuses carry icons and times in a following metadata element', () => {
  const html = render(h(c.AgentExecutionProgress, { title: '当前轮', state: 'partial', description: '部分记录', steps: [], expanded: true,
    stages: [{ id: 'stage', title: '阶段', state: 'partial', time: '09:19', steps: [] }],
    history: [{ id: 'past', label: '上一轮', state: 'unknown', description: '回执缺失', updatedAt: '08:00', steps: [] }] }));
  const rows = [...html.matchAll(/data-agent-trace-row=""[^>]*>([\s\S]*?)<\/div>/g)].map(match => match[1]);
  assert.equal(rows.length, 2);
  for (const [index, time] of ['09:19', '08:00'].entries()) {
    assert.match(rows[index], /data-agent-status=/); assert.match(rows[index], /<svg[^>]*aria-hidden="true"/);
    assert.match(rows[index], new RegExp(`data-agent-meta=""[^>]*>[\\s\\S]*${time}`));
    assert.ok(rows[index].indexOf('data-agent-status') < rows[index].indexOf('data-agent-meta'));
  }
  assert.doesNotMatch(html, /animate-spin|aria-current="step"/);
});

test('the published charter preserves the approved original, scoped PO amendment and contract link', async () => {
  const charter = await readFile(new URL('../docs/question-presentation-charter.md', import.meta.url), 'utf8');
  // Remove each dated, PO-approved standalone amendment and its following blank line.
  // Do not trim/normalize the remaining text: every original byte stays SHA-256 protected.
  const amendmentPattern = /^\*\*([^\n*]*修订)（(\d{4}-\d{2}-\d{2})，PO 批准）\*\*：[^\n]*\n\n/gm;
  const amendments = [...charter.matchAll(amendmentPattern)];
  assert.deepEqual(amendments.map(match => [match[1], match[2]]), [['文案修订', '2026-09-29'], ['预览框架修订', '2026-10-02'], ['原型阶段修订', '2026-09-28']]);
  const amendment = amendments.find(match => match[1] === '原型阶段修订')[0];
  assert.ok(amendment.startsWith('**原型阶段修订（2026-09-28，PO 批准）**：'), 'retain the approval date and PO approval');
  for (const condition of [
    '仅适用于未接入真实服务、全部为本机规则与预置数据的原型阶段。',
    '此阶段 Workspace 界面不逐项标注“示例／预置／演示”，组件保留 `visual.sample`、示例小签等标注能力，由 Workspace 停止传入相应标注属性。',
    '接入真实服务或混入真实数据后，恢复逐项标注；真实与示例混排时必须标注。',
    '本修订仅调整原型标注策略，不改变读取、引用、保存、提交等事实及状态的判定，不免除“节选”标记。',
    '原条文保留，恢复条件满足后继续适用。',
  ]) assert.ok(amendment.includes(condition), `prototype amendment must retain: ${condition}`);
  const copyAmendment = amendments.find(match => match[1] === '文案修订')[0];
  for (const condition of ['B 类对话中打开右栏 L2', '操作文案为‘查看详情’', '以明显按钮呈现', '行为不变']) {
    assert.ok(copyAmendment.includes(condition), `copy amendment must retain: ${condition}`);
  }
  const previewAmendment = amendments.find(match => match[1] === '预览框架修订')[0];
  assert.equal(previewAmendment, '**预览框架修订（2026-10-02，PO 批准）**：在三栏预览框架（试卷预览框架、题目与知识点预览框架，及今后同一外壳的预览框架）中，题目卡的题干、选项、小问与详情正文跟随两侧栏的正文字号与行高（ui-body，14/20），间距取两侧栏同一组间距值，公式随正文字号；由宿主通过 QuestionContent / QuestionSolution 的 textSize="ui" 传入，组件不自行判断场景。其他场景（组卷与题库页、Agent 右栏、正式试卷与打印等）仍按本款 16/28。\n\n');
  const previewStatus = '2026-10-02 经 Product Owner 批准追加预览框架修订（“改章程”）。';
  const previewReference = '三栏预览框架中的 L2 题目卡，字号、行高与间距按第七条的“预览框架修订（2026-10-02，PO 批准）”执行，呈现层级不变。\n\n';
  assert.ok(charter.split('\n')[2].endsWith(previewStatus));
  assert.ok(charter.includes(previewReference));
  assert.ok(charter.includes('3. 题面：题干与选项 16/28，公式不缩小；选项在容器 ≥ 480 时两栏，否则一栏。\n\n' + previewAmendment));
  // Strip only the exact approved status/reference additions and amendment separator;
  // keep the original charter hash unchanged, including its numbered visual rules.
  const original = charter.replace(previewStatus, '').replace(previewReference, '')
    .replace('\n' + previewAmendment, '').replace(amendmentPattern, '');
  assert.equal(createHash('sha256').update(original).digest('hex'), 'c788f525296429a7f0280552c6f6d07f901f885b21e04a69a73a8a66030ca7f7');
  const contracts = await readFile(new URL('../docs/component-contracts.md', import.meta.url), 'utf8');
  assert.match(contracts, /question-presentation-charter\.md/);
  const textSizeContract = contracts.split('## QuestionContent / QuestionSolution · 可选正文字号（Q7）')[1];
  const reviewDesign = await readFile(new URL('../docs/question-review-design.md', import.meta.url), 'utf8');
  for (const document of [textSizeContract, reviewDesign]) {
    assert.match(document, /依据章程 2026-10-02 预览框架修订/);
    assert.match(document, /question-presentation-charter\.md#第七条-视觉/);
    assert.doesNotMatch(document, /偏离《题目呈现章程》|提请 PO 另行裁定/);
  }
});


test('16/19/20/21 examples provide L0 references without changing their component contracts', () => {
  const cases = [[c.ReviewQueueExample, { purpose: 'p04', narrow: false }], [c.MetricSummaryExample, { purpose: 'learning' }],
    [c.DistributionMatrixExample, { purpose: 'students' }], [c.AgentEvidenceDrilldownDemo, {}]];
  for (const [Component, props] of cases) {
    // 20's full matrix carries the dimension references; its inline facts remain a compact matrix summary.
    const html = demo(Component, props, Component === c.DistributionMatrixExample ? 'workspace' : 'inline');
    assert.match(html, /data-question-reference/, Component.name);
    assert.doesNotMatch(html, /question-solution|question-detail-region/, Component.name);
  }
});


test('question card and summary checkbox targets align to the first 20px title line', () => {
  for (const Component of [c.QuestionCard, c.QuestionSummaryRow]) {
    const html = render(h(Component, { question: { ...question, title: question.title.repeat(4) }, onCheckedChange() {} }));
    assert.match(html, /<label class="[^"]*min-h-11[^"]*min-w-11[^"]*items-start[^"]*"><span class="flex h-5 items-center">/);
    assert.match(html, /data-slot="checkbox"/);
  }
});

test('question attributes are indivisible segments below the title and its trailing badge', () => {
  const composite = { ...question, points: 12, difficulty: '综合', parts: [1, 2, 3].map(id => ({ id: String(id), content: '小问' })) };
  for (const Component of [c.QuestionCard, c.QuestionSummaryRow]) {
    const html = render(h(Component, { question: composite, header: h('span', null, '示例') }));
    const attributes = html.match(/<p data-question-attributes="" class="([^"]*)">([\s\S]*?)<\/p>/);
    assert.ok(attributes);
    assert.match(attributes[1], /w-full/);
    const segments = [...attributes[2].matchAll(/<span class="inline-block whitespace-nowrap">([^<]*)<\/span>/g)].map(match => match[1]);
    assert.deepEqual(segments, ['复合题', ' · 12 分', ' · 综合', ' · 整题', ' · 含 3 个小问']);
    assert.match(html, /示例<\/span><\/div><\/div><p data-question-attributes/);
  }
});


test('L1 open labels are configurable without changing native button, excerpt or exact trigger forwarding', () => {
  const calls = [], trigger = {}, q = { ...question, options: [{ id: 'A', content: '完整选项' }] };
  const props = { question: q, number: 2, onOpen: value => calls.push(value), openLabel: '查看题目', openAccessibleLabel: '查看完整题目：第 2 题 · 从配方解释最小值' };
  const html = render(h(c.QuestionSummaryRow, props));
  assert.match(html, /<button[^>]*type="button"[^>]*aria-label="查看完整题目：第 2 题 · 从配方解释最小值"/);
  assert.match(text(html), /查看题目/); assert.doesNotMatch(text(html), /查看详情|完整选项/);
  assert.match(html, /data-question-excerpt="true"/);
  capture(c.QuestionSummaryRow, props).find(node => node.type.name === 'Button').props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, [trigger]);
  const defaults = render(h(c.QuestionSummaryRow, { question: q, onOpen() {} }));
  assert.match(defaults, /aria-label="查看详情：从配方解释最小值"/); assert.match(text(defaults), /查看详情/);
  const onlyVisible = render(h(c.QuestionSummaryRow, { question: q, onOpen() {}, openLabel: '查看题目' }));
  assert.match(onlyVisible, /aria-label="查看详情：从配方解释最小值"/);
  for (const extra of [{ onOpen: undefined }, { excerpt: false }]) {
    const complete = render(h(c.QuestionSummaryRow, { ...props, ...extra }));
    assert.match(complete, /完整选项/); assert.doesNotMatch(complete, /data-question-excerpt|节选/);
    if (extra.onOpen === undefined && !('excerpt' in extra)) assert.doesNotMatch(complete, /查看题目/);
  }
});

test('L1 default opener is the coss secondary extra-small button with a 16px decorative icon', () => {
  const props = { question, number: 8, onOpen() {} };
  const button = capture(c.QuestionSummaryRow, props).find(node => node.type === c.CossButton);
  assert.ok(button, 'reuse the actual coss Button export');
  assert.equal(button.props.variant, 'secondary');
  assert.equal(button.props.size, 'xs');
  assert.equal(button.props['aria-label'], '查看详情：第 8 题 · 从配方解释最小值');
  const icon = React.Children.toArray(button.props.children).find(React.isValidElement);
  assert.equal(icon.props.className, 'size-4');
  assert.equal(icon.props['aria-hidden'], 'true');
  const html = render(h(c.QuestionSummaryRow, props));
  assert.match(html, /<button[^>]*data-slot="button"/);
  assert.match(text(html), /查看详情/);
  assert.doesNotMatch(html, /在右栏查看/);
});

test('collection workspace example opens compact titles using context-neutral question labels', () => {
  const html = demo(c.CollectionBasketExample, { purpose: 'questions', narrow: false }, 'workspace');
  assert.match(html, /data-collection-summary-row/); assert.match(html, /aria-label="查看题目：第 1 题/);
  assert.doesNotMatch(html, /data-question-summary|data-collection-content/); assert.doesNotMatch(html, /查看详情/); assert.match(html, /<math/); assert.match(html, /data-collection-summary-clamp/);
});

test('L1 action row aligns left with the opener first and optional excerpt immediately after', () => {
  for (const omitted of [false, true]) {
    const props = { question: { ...question, options: omitted ? [{ id: 'a', content: '完整选项' }] : undefined }, onOpen() {} };
    const nodes = capture(c.QuestionSummaryRow, props);
    const row = nodes.find(node => 'data-question-actions' in node.props);
    assert.ok(row);
    for (const token of ['flex', 'flex-wrap', 'items-center', 'justify-start']) assert.ok(row.props.className.split(' ').includes(token));
    const children = React.Children.toArray(row.props.children);
    assert.equal(children.length, omitted ? 2 : 1);
    const [button, excerpt] = children;
    if (omitted) assert.equal(text(render(excerpt)), '节选');
    assert.match(render(row), /^<div[^>]*data-question-actions[^>]*><button\b/);
    assert.equal(button.type, c.CossButton);
    const classes = button.props.className.split(' ');
    assert.ok(!classes.includes('ml-auto'), 'opener stays at the left edge after wrapping');
    assert.equal(button.props.variant, 'secondary');
    assert.equal(button.props.size, 'xs');
    assert.ok(classes.includes('pointer-coarse:min-h-11'));
    assert.ok(!classes.includes('min-h-11'), 'desktop uses the coss xs height');
  }
  assert.doesNotMatch(render(h(c.QuestionSummaryRow, { question })), /data-question-actions/);
});
