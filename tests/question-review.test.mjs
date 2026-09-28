import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import ts from 'typescript';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { legacyQuestionReviewCases, legacyQuestionReviewViews, withoutReviewStatus } from './fixtures/question-review-legacy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/question-review/', import.meta.url);
await mkdir(runtime, { recursive: true });
// Test-only hook adapter: retain state across real handlers without adding a DOM dependency.
// Child coss components still render with real React. This is not a browser interaction test.
const hookFile = new URL('test-hooks.mjs', runtime);
await writeFile(hookFile, `export * from 'react';
let active;
export function useState(initial) {
 const frame=active, index=frame.cursor++;
 if (!(index in frame.values)) frame.values[index]=typeof initial==='function'?initial():initial;
 return [frame.values[index], value=>{frame.values[index]=typeof value==='function'?value(frame.values[index]):value}];
}
export function useId(){return '_R_0_'}
export function harness(Component, props, seed={}) {
 const frame={values:{...seed},cursor:0};
 return { props, tree(){frame.cursor=0;active=frame;try{return Component(this.props)}finally{active=undefined}} };
}
`);
const { harness } = await import(hookFile);
async function bundleComponent(name, baseline = false, hooks = true) {
  const file = new URL(`${name}.mjs`, runtime);
  const plugins = [];
  if (baseline) plugins.push({ name: 'pinned-main', setup(b) {
    b.onLoad({ filter: /components\/prism-next\/question-review\.tsx$/ }, args => ({ contents: execFileSync('git', ['show', '3eb6533abb6db2506e79740265b245f4266c70ad:components/prism-next/question-review.tsx'], { cwd: root, encoding: 'utf8' }), loader: 'tsx', resolveDir: fileURLToPath(new URL('../components/prism-next/', import.meta.url)) }));
  } });
  if (hooks) plugins.push({ name: 'owned-hooks', setup(b) {
    b.onResolve({ filter: /^react$/ }, args => /(?:prism-next|demos)\/question-review\.tsx$/.test(args.importer) ? { path: fileURLToPath(hookFile), external: true } : undefined);
  } });
  const result = await build({ stdin: { contents: `export { QuestionReview } from './components/prism-next/question-review'; export { QuestionReviewExample } from './components/prism-next/demos/question-review';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, plugins });
  await writeFile(file, result.outputFiles[0].text);
  return import(file);
}
const { QuestionReview, QuestionReviewExample } = await bundleComponent('interaction-bundle');
const { QuestionReview: ActualQuestionReview } = await bundleComponent('ssr-bundle', false, false);
const cases = legacyQuestionReviewCases();
const h = React.createElement;
function nodes(tree) {
  const result=[];
  function visit(node) { if (!React.isValidElement(node)) return; result.push(node); React.Children.forEach(node.props.children, visit); }
  visit(tree); return result;
}
const button = (frame, label) => nodes(frame.tree()).find(node => node.props.children === label && node.props.onClick);
const html = frame => render(frame.tree());
const request = { id: 'original-request', label: '原复核请求' };
const states = {
  'waiting-human': { state: 'waiting-human', description: '等待核对' }, draft: { state: 'draft', description: '草稿待提交' },
  waiting: { state: 'waiting', description: '已受理请求', request }, unknown: { state: 'unknown', description: '结果未知', request },
  resolved: { state: 'resolved', description: '外部确认记录', resolution: { reviewer: '教师甲', version: 'r3' } },
  failed: { state: 'failed', description: '依据不足' }, expired: { state: 'expired', description: '基准版本改变' },
};

if (process.env.UPDATE_QUESTION_REVIEW_BASELINE === '1') {
  const { QuestionReview: Main } = await bundleComponent('main-bundle', true);
  const { QuestionReview: MainSSR } = await bundleComponent('main-ssr-bundle', true, false);
  const snapshots = {};
  for (const [name, props] of Object.entries(cases)) for (const [view, seed] of Object.entries(legacyQuestionReviewViews)) snapshots[`${name}/${view}`] = view==='review'?render(h(MainSSR,props)):html(harness(Main, props, seed));
  await writeFile(new URL('./fixtures/question-review-main.json', import.meta.url), JSON.stringify({ baseline: '3eb6533abb6db2506e79740265b245f4266c70ad', cases: snapshots }, null, 2)+'\n');
}

test('32 pinned main SSR snapshots preserve all scoring, answers, reference content and controls; only final status text differs', async () => {
  const snapshot = JSON.parse(await readFile(new URL('./fixtures/question-review-main.json', import.meta.url), 'utf8'));
  assert.equal(snapshot.baseline, '3eb6533abb6db2506e79740265b245f4266c70ad');
  const differences=[];
  for (const [name, props] of Object.entries(cases)) for (const [view, seed] of Object.entries(legacyQuestionReviewViews)) {
    const key=`${name}/${view}`, before=snapshot.cases[key], after=view==='review'?render(h(ActualQuestionReview,props)):html(harness(QuestionReview,props,seed));
    assert.equal(withoutReviewStatus(after), withoutReviewStatus(before), key);
    if (after!==before) differences.push({ case:key, before:before.match(/<p role="status" class="text-ui-body">([\s\S]*?)<\/p><\/div>$/)[1], after:after.match(/<p role="status" class="text-ui-body">([\s\S]*?)<\/p><\/div>$/)[1] });
  }
  assert.equal(Object.keys(snapshot.cases).length,32); assert.equal(differences.length,8);
  await writeFile(new URL('ssr-differences.json',runtime),JSON.stringify(differences,null,2)+'\n');
});

test('legacy uncontrolled confirm retains scores and reason over rerenders and never generates a completion record', () => {
  const calls=[], frame=harness(QuestionReview,{...cases.simple,onConfirm:(...args)=>calls.push(args)});
  const field=nodes(frame.tree()).find(node=>node.props.label==='第 1 问 · 整题得分');
  field.props.onChange(3.5);
  nodes(frame.tree()).find(node=>node.props.placeholder).props.onChange({target:{value:'  依据\n  '}});
  button(frame,'确认复核').props.onClick();
  assert.deepEqual(calls,[[{score:3.5},'  依据\n  ']]);
  const after=html(frame);
  assert.match(after,/已发出确认，等待记录/); assert.doesNotMatch(after,/最新复核记录|已复核|已保存/);
  assert.match(after,/已记录得分 <strong class="tabular-nums">2 \/ 5/);
  assert.match(after,/复核中得分 <strong class="tabular-nums">3.5 \/ 5/); assert.ok(after.includes('  依据\n  '));
  button(frame,'取消修改').props.onClick(); assert.match(html(frame),/复核中得分 <strong class="tabular-nums">2 \/ 5/);
});

test('controlled confirm emits a copied score intent only; no editor write, reason clearing, receipt mutation or return-value inference', () => {
  const editor=structuredClone(cases['controlled-draft'].editor), calls=[];
  Object.freeze(editor.scores);Object.freeze(editor.saved);Object.freeze(editor);
  for(const review of [undefined,states.draft]) {
    const frame=harness(QuestionReview,{...cases.simple,editor,onEditorChange(){assert.fail('confirm wrote editor')},review,onConfirm:(scores,reason)=>{calls.push([scores,reason]);scores.score=99;return states.resolved}});
    button(frame,'确认复核').props.onClick();
    assert.equal(editor.scores.score,3.5); assert.equal(editor.record,''); assert.equal(editor.reason,'  调整依据\n保留原空白  ');
    assert.doesNotMatch(html(frame),/已复核|最新复核记录|已保存/);
  }
  assert.equal(calls.length,2);
});

test('missing callback and invalid scores cannot claim a sent request', () => {
  const frame=harness(QuestionReview,cases.simple);
  button(frame,'确认复核').props.onClick();assert.match(html(frame),/未提供确认处理，尚未发出确认/);
  let calls=0;
  for(const scores of [{score:null},{score:6},{score:0.3}]) {
    const invalid=harness(QuestionReview,{...cases.simple,onConfirm(){calls++}}, {0:{scores,saved:{score:2},reason:'理由',record:'',error:''}});
    button(invalid,'确认复核').props.onClick();assert.match(html(invalid),/请为每个评分点填写范围内的分数/);assert.doesNotMatch(html(invalid),/已发出确认|已复核/);
  }
  const noReason=harness(QuestionReview,{...cases.simple,onConfirm(){calls++}},{0:{scores:{score:3},saved:{score:2},reason:'',record:'',error:''}});
  button(noReason,'确认复核').props.onClick();assert.match(html(noReason),/调整分数后，请填写复核理由/);assert.equal(calls,0);
});

test('seven external states render facts, block inappropriate confirmation and ignore stale legacy records', () => {
  const labels=['待复核','已编辑未提交','复核提交中','回执未确认','已复核','已退回 / 失败','已过期'];
  let index=0;
  for(const [state,review] of Object.entries(states)) {
    let calls=0;
    const frame=harness(QuestionReview,{...cases['legacy-record-unchanged'],review,onConfirm(){calls++}});
    const before=html(frame);assert.ok(before.includes(labels[index++]));assert.ok(before.includes(review.description));assert.doesNotMatch(before,/旧宿主的记录|最新复核记录/);
    const blocked=['waiting','unknown','resolved','expired'].includes(state);
    assert.equal(button(frame,'确认复核').props.disabled,blocked);button(frame,'确认复核').props.onClick();assert.equal(calls,blocked?0:1);assert.equal(html(frame),before);
    if(state!=='resolved')assert.doesNotMatch(before,/已复核/);
    if(state==='waiting'||state==='unknown')assert.match(before,/原复核请求/);
  }
  const frame=harness(QuestionReview,{...cases.simple,review:states.resolved});
  assert.match(html(frame),/复核人：教师甲 · 复核时间：时间未确认 · 复核结果版本：r3/);
  frame.props.review={...states.resolved,resolution:{...states.resolved.resolution,time:'外部时间'}};
  assert.match(html(frame),/复核时间：外部时间/);
});

test('external receipt and score baseline update only when supplied by host; expired and unknown replace resolved', () => {
  const frame=harness(QuestionReview,{...cases['controlled-draft'],review:states.waiting});
  assert.doesNotMatch(html(frame),/已复核/);
  frame.props={...frame.props,review:states.resolved,editor:{...frame.props.editor,saved:{score:3.5}}};
  assert.match(html(frame),/已复核/);assert.match(html(frame),/已记录得分 <strong class="tabular-nums">3.5 \/ 5/);
  for(const review of [states.expired,states.unknown]){frame.props.review=review;assert.doesNotMatch(html(frame),/已复核|教师甲/);assert.ok(html(frame).includes(review.description));}
});

test('example host separates confirmation from fixture receipt and forwards completion only after receipt', () => {
  const intents=[],records=[],frame=harness(QuestionReviewExample,{...cases.simple,onConfirm:(...args)=>intents.push(args),onRecord:(...args)=>records.push(args)});
  const reviewNode=()=>nodes(frame.tree()).find(node=>node.type===QuestionReview);
  assert.equal(reviewNode().props.review.state,'waiting-human');
  reviewNode().props.onConfirm({score:3},'说明');
  assert.equal(reviewNode().props.review.state,'waiting');assert.equal(intents.length,1);assert.equal(records.length,0);assert.equal(reviewNode().props.editor.saved.score,2);
  button(frame,'载入示例回执').props.onClick();
  assert.equal(reviewNode().props.review.state,'resolved');assert.equal(reviewNode().props.editor.saved.score,3);assert.deepEqual(records,[[{score:3},'说明']]);
  button(frame,'载入示例回执').props.onClick();assert.equal(records.length,1);
  reviewNode().props.onEditorChange(previous=>({...previous,scores:{score:4}}));assert.equal(reviewNode().props.review.state,'draft');
  reviewNode().props.onConfirm({score:4},'第二次');
  reviewNode().props.onEditorChange(previous=>({...previous,reason:'新草稿'}));
  button(frame,'载入示例回执').props.onClick();assert.equal(records.length,1);assert.equal(reviewNode().props.editor.reason,'新草稿');assert.equal(reviewNode().props.editor.saved.score,3);
});


test('public API preserves old props and editor types and reuses the discriminated external review union', async () => {
  const file=new URL('type-contract.tsx',runtime);
  await writeFile(file, `import { QuestionReview, type QuestionReviewProps } from '../../components/prism-next/question-review';
import type { AgentItemReview } from '../../components/prism-next/agent-item-reviewer';
import { createReviewEditor, type ReviewEditor } from '../../lib/prism-next/question-review-model';
const editor: ReviewEditor = createReviewEditor({score: 2});
const old: QuestionReviewProps = {question: {id:'q', title:'题目',kind:'简答',stem:'题干',points:5}, attempts:{1:'作答'}, initialScores:{score:2}, editor, onEditorChange: update=>{}, onConfirm:(scores,reason)=>{scores.score.toFixed();reason.trim()}};
const legacy = <QuestionReview {...old}/>;
const partial = <QuestionReview {...old} onEditorChange={undefined}/>;
const review: AgentItemReview={state:'resolved',description:'真实回执',resolution:{reviewer:'教师',version:'r2'}};
const current = <QuestionReview {...old} review={review}/>;
// @ts-expect-error waiting requires the original request
const noRequest: QuestionReviewProps['review']={state:'waiting',description:''};
// @ts-expect-error resolved requires external resolution facts
const noReceipt: QuestionReviewProps['review']={state:'resolved',description:''};
// @ts-expect-error no second status vocabulary
const wrong: QuestionReviewProps['review']={state:'saved',description:''};
void [legacy, partial, current, noRequest, noReceipt, wrong];
`);
  try {
    const config=ts.readConfigFile(`${root}tsconfig.json`,ts.sys.readFile);
    const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
    const program=ts.createProgram([fileURLToPath(file),`${root}types/mathml.d.ts`],{...parsed.options,incremental:false,noEmit:true});
    const diagnostics=ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length,0,diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
  } finally {await rm(file)}
});
