import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = '275883627188351c6739d8c634b5c825dac7d6d0';
const read = p => readFileSync(root + p, 'utf8');
const before = p => execFileSync('git', ['show', `${baseline}:${p}`], { cwd: root, encoding: 'utf8' });
const dir = await createTestRuntime('p118');
async function bundle(old) {
  const file = new URL(`${old ? 'before' : 'after'}.mjs`, dir);
  const plugins = [{ name: 'sources', setup(b) {
    b.onResolve({filter:/temml\.mjs\?url$/}, () => ({path:'temml',namespace:'url'}));
    b.onLoad({filter:/.*/,namespace:'url'}, () => ({contents:'export default "temml.mjs"'}));
    if (old) b.onLoad({filter:/prism-next\/(score-review|blueprint\/blueprint)\.tsx$/}, a => ({contents:before(a.path.slice(root.length)),loader:'tsx'}));
  }}];
  writeFileSync(file, (await build({stdin:{contents:"export * from './components/prism-next/score-review'; export * from './components/prism-next/blueprint/blueprint'; export {scoreReviewBase,scoreReviewFixtures} from './components/prism-next/demos/score-review';",resolveDir:root,loader:'tsx'}, bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false,plugins})).outputFiles[0].text);
  try { return await import(file); } finally { unlinkSync(file); }
}
const old = await bundle(true), api = await bundle(false), h = React.createElement;
const themes = ['light','paper','dark','blueprint','blueprint-night'];
const cases = [{studentName:'学生',questionLabel:'题目',maxScore:10}, ...api.scoreReviewFixtures.map(f => ({...api.scoreReviewBase,...f.props})), ...['review','confirm','edit','manual'].flatMap(mode => [false,true].map(hidden => ({...api.scoreReviewBase,mode,showIdentity:!hidden,density:'compact'})))];
for (const theme of themes) test(`P118 ${theme}: absent, undefined and non-AI preserve baseline SSR bytes`, () => {
  for (const props of cases) {
    const wrap = (lib, extra) => render(h('div',{'data-prism-theme':theme},h(lib.ScoreReview,{...props,...extra})));
    for (const source of [undefined,{kind:'teacher'},{kind:'other'}]) assert.equal(wrap(api,{source}),wrap(old,{}));
    assert.equal(wrap(api,{}),wrap(old,{}));
  }
});
test('P118 AI text is explicit, version stays honest and hidden identity does not hide provenance', () => {
  for (const mode of ['review','confirm','edit','manual']) for (const version of [undefined,null,'','  ','v7']) {
    const html = render(h(api.ScoreReview,{...api.scoreReviewBase,mode,showIdentity:false,source:{kind:'ai',version}}));
    assert.equal((html.match(/data-score-review-source="ai"/g)||[]).length,1);
    assert.ok(html.includes(version === 'v7' ? '来源 · AI 批阅 v7' : '来源 · AI 批阅 · 版本未提供'));
    assert.match(html,/<span class="bp-score-source-bar" aria-hidden="true"><\/span>/);
  }
});
test('P118 steps: only four bars opt in, every other count and chips keeps exact baseline HTML', () => {
  for(const count of [0,1,2,3,4,5,6]) for(const variant of ['chips','bars']) {
    const props={current:1,variant,steps:Array.from({length:count},(_,i)=>({id:String(i),label:`步骤 ${i}`}))};
    const html=render(h(api.BpSteps,props));
    assert.equal(html.replace(' data-four-steps=""',''),render(h(old.BpSteps,props)));
    assert.equal(html.includes('data-four-steps'),count===4 && variant==='bars');
  }
});
const path='app/(next)/next/blueprint.css', css=read(path), index=css.indexOf('\n/* P118 ·'), block=css.slice(index);
test('P118 append-only CSS, exact decoration and container thresholds', () => {
  assert.ok(index>0); assert.equal(css.slice(0,index),before(path));
  assert.equal(read('app/(next)/next/theme.css'),before('app/(next)/next/theme.css'));
  transform({filename:'p118.css',code:Buffer.from(block),minify:true});
  const ast=postcss.parse(block), rules=[]; ast.walkRules(r=>rules.push(r));
  assert.equal(rules.length,6);
  const declarations=r=>Object.fromEntries(r.nodes.map(d=>[d.prop,d.value]));
  assert.deepEqual(declarations(rules[0]),{display:'none'});
  assert.deepEqual(declarations(rules[1]),{display:'block',height:'3px',background:'linear-gradient(90deg,var(--bp-phase-ai),var(--bp-phase-review),var(--bp-phase-receive))'});
  assert.equal(rules[1].selector, ':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"]) .bp-score-source-bar:not(:where([data-agent-preview][data-prism-theme]:not(:is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])), [data-agent-preview][data-prism-theme]:not(:is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])) *))');
  assert.equal(rules[2].selector,'.bp-steps-bars[data-four-steps]');
  assert.deepEqual(declarations(rules[2]),{container:'bp-four-steps / inline-size'});
  for (const r of rules.slice(3)) assert.equal(r.selector,'.bp-steps-bars[data-four-steps] > ol');
  assert.deepEqual(rules.slice(3).map(declarations),[{'grid-template-columns':'minmax(0,1fr)'},{'grid-template-columns':'repeat(2,minmax(0,1fr))'},{'grid-template-columns':'repeat(4,minmax(0,1fr))'}]);
  assert.deepEqual(ast.nodes.filter(n=>n.type==='atrule').map(n=>[n.name,n.params]),[['container','bp-four-steps (min-width:316px)'],['container','bp-four-steps (min-width:648px)']]);
  // 150px existing minimum and 16px column gap: 2*150+16 and 4*150+3*16.
  for (const [width,columns] of [[150,1],[315,1],[316,2],[500,2],[647,2],[648,4],[1000,4]]) {
    const actual=width>=648?4:width>=316?2:1;
    assert.equal(actual,columns); assert.equal(4%actual,0);
  }
});
