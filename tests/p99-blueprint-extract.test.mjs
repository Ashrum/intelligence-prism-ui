import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { h, render, capture } from './p58-chart-harness.mjs';
import { blueprintTrendAutoScale, trendAutoScale } from '../lib/prism-next/chart-options.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const bundle = new URL('bundle.mjs', await createTestRuntime('p99-extract'));
writeFileSync(bundle, (await build({ stdin: { contents: `export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/demos/blueprint-overview'; export { blueprintTrendSeries } from './components/prism-next/demos/blueprint-trend';`, loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false })).outputFiles[0].text);
const api = await import(bundle);
const css = read('app/(next)/next/blueprint.css');
const out = (name, props, children) => render(h(api[name], props, children));
const cases = JSON.parse(read('tests/fixtures/p99-defaults-before.json')).cases;
for (const { name, props, html } of cases) test(`P99 ${name}: omitted options preserve pre-P99 SSR byte for byte`, () => {
  assert.equal(render(h(api[name], props)), html);
});

test('P99 BpStat: definition pairs, label/code/help, formatted value, unit, delta, caption and slot', () => {
  const html = out('BpStatStrip', { 'aria-label': '指标', className: 'host' }, h(api.BpStat, {
    label: '近期得分率', code: 'MET03', value: '75', unit: '%', delta: { text: '+1 pp' }, caption: '1,684 / 2,250 分',
    help: h('button', { 'aria-label': '指标说明' }, '?'),
  }, h('span', null, '分段条插槽')));
  assert.match(html, /<dl aria-label="指标" class="bp-stat-strip host">/);
  const dt = html.match(/<dt[^>]*>(.*?)<\/dt>/)[1];
  assert.match(dt, /近期得分率/); assert.match(dt, /MET03/); assert.match(dt, /aria-label="指标说明"/);
  assert.doesNotMatch(dt, /aria-hidden/);
  for (const value of ['<dd', 'text-score-display', '>75<', '>%<', '+1 pp', '1,684 / 2,250 分', '分段条插槽', 'data-tone="accent"']) assert.ok(html.includes(value), value);
  for (const tone of ['accent', 'warn', 'error', 'muted']) assert.match(out('BpStat', { label: '指标', value: 0, delta: { text: '变化', tone } }), new RegExp(`data-tone="${tone}"`));
  assert.match(out('BpStat', { label: '真实零', value: 0 }), />0<\/span>/);
});
for (const state of ['unknown', 'insufficient']) test(`P99 BpStat ${state}: supplied status text, no fabricated zero/unit/delta/bar`, () => {
  const html = out('BpStat', { label: '补回率', code: 'MET07', state, value: '等待更多记录', unit: '%', delta: { text: '+1 pp' }, caption: '待补充证据' }, '不应显示的条');
  assert.match(html, /等待更多记录/); assert.match(html, /待补充证据/); assert.match(html, new RegExp(`data-state="${state}"`));
  assert.doesNotMatch(html, /text-score-display|bp-stat-unit|bp-stat-delta|不应显示的条|>0</);
  assert.match(out('BpStat', { label: '未知', state, value: 0 }), new RegExp(state === 'unknown' ? '未知' : '数据不足'));
});

// Parse the real container rules and nth-child selectors; simulate only grid occupancy,
// NOT browser geometry, intrinsic text measurement or visual acceptance.
function declarations(selector, width, text = css) {
  const result = {};
  postcss.parse(text).walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    if (rule.parent.type !== 'root') {
      assert.equal(rule.parent.name, 'container');
      const query = rule.parent.params.match(/^bp-stat-layout \((min-width:|width < )(\d+)px\)$/);
      assert.ok(query, rule.parent.params);
      if (query[1] === 'width < ' ? width >= +query[2] : width < +query[2]) return;
    }
    for (const d of rule.nodes) if (d.type === 'decl') result[d.prop] = d.value;
  });
  return result;
}
function matches(selector, i, count) {
  if (selector.includes(':last-child') && i !== count) return false;
  if (selector.includes(':nth-last-child(2)') && i !== count - 1) return false;
  const nth = selector.match(/:nth-child\(([^)]+)\)/)?.[1];
  if (nth === 'odd') return i % 2 === 1;
  if (nth) { const [, factor, offset] = nth.match(/(\d+)n \+ (\d+)/); return i >= +offset && (i - +offset) % +factor === 0; }
  return true;
}
function occupied(width, count, text = css) {
  const tracks = declarations('.bp-stat-strip', width, text)['grid-template-columns'];
  const columns = tracks.startsWith('repeat(') ? +tracks.match(/repeat\((\d+)/)[1] : 1;
  const rules = [];
  postcss.parse(text).walkRules(rule => {
    if (rule.selector.includes('.bp-stat') && !rule.selector.includes('.bp-stat-strip {')) for (const selector of rule.selectors) {
      if (!selector.includes('.bp-stat') || !rule.nodes.some(d => d.prop === 'grid-column')) continue;
      const value = declarations(selector, width, text)['grid-column'];
      if (value) rules.push({selector, value, specificity: (selector.match(/\.[\w-]+|:(?!:)[\w-]+/g) ?? []).length});
    }
  });
  let cursor = 0;
  for (let i = 1; i <= count; i++) {
    let chosen = {value:'auto', specificity:0};
    for (const rule of rules) if (matches(rule.selector, i, count) && rule.specificity >= chosen.specificity) chosen = rule;
    const span = chosen.value === '1 / -1' ? columns : chosen.value.startsWith('span ') ? +chosen.value.slice(5) : 1;
    assert.ok(cursor + span <= columns, `${width}/${count}/${i}: no implicit columns or interior holes`);
    cursor = (cursor + span) % columns;
  }
  assert.equal(cursor, 0, `${width}/${count}: no unfilled tail`);
  return columns;
}
test('P99 BpStatStrip: actual CSS 4/2/1 tracks fill final rows for 1–9 items at each boundary', () => {
  assert.equal(declarations('.bp-stat-container', 1280).container, 'bp-stat-layout / inline-size');
  assert.equal(declarations('.bp-stat-strip', 1280).border, '1.5px solid var(--line)');
  assert.equal(declarations('.bp-stat', 1280)['box-shadow'], '1px 0 0 var(--border),0 1px 0 var(--border)');
  for (const [width, columns] of [[1280,4],[960,4],[959.5,2],[959,2],[600,2],[480,2],[479.5,1],[479,1],[390,1],[280,1]]) for (let count=1;count<=9;count++) assert.equal(occupied(width,count),columns);
  assert.throws(() => occupied(1280,3,css.replace('.bp-stat:last-child:nth-child(4n + 3) { grid-column:span 2;', '.bp-stat:last-child:nth-child(4n + 3) { grid-column:auto;')));
  assert.throws(() => occupied(600,3,css.replace('.bp-stat-strip > .bp-stat:last-child:nth-child(odd) { grid-column:1 / -1;', '.bp-stat-strip > .bp-stat:last-child:nth-child(odd) { grid-column:auto;')));
});

test('P99 compact SizeBar: no frame/padding, 14px bar, ui-meta legend, retained accessible labels and P97 values', () => {
  const props = { ...cases[0].props, framed:false, size:'sm', hideRowLabel:true };
  const html = out('BpSizeBar', props);
  assert.doesNotMatch(html, /p-4.5|pb-3.5|border-\(length:--line-width\)|text-item-title/);
  assert.match(html, /bp-size-sm/); assert.match(html, /bp-size-row-unlabelled/);
  assert.match(html, /aria-label="构成：补回 1,684项，排除 0项"/);
  assert.match(html, /text-ui-meta/); assert.match(html, />1,684<\/b>/); assert.match(html, />0<\/b>/);
  assert.equal(declarations('.bp-size-sm .bp-size-bar',1280).height,'14px');
  const hiddenSummary = out('BpSizeBar', {...props, rows:props.rows.map(row=>({...row,display:''}))});
  assert.match(hiddenSummary, /<span hidden=""[^>]*><b/);
  const noLegend = out('BpSizeBar', {...props,legend:false});
  assert.doesNotMatch(noLegend, /<ul/); assert.match(noLegend, /构成：补回 1,684项，排除 0项/);
});
test('P99 title tone/numeric, compact section and 6px neutral emphasis are opt-in', () => {
  const title = out('BpTitleBlock',{items:[{id:'a',label:'未纳入',value:'1',tone:'warn',numeric:true},{id:'b',label:'名册',value:'近似',tone:'muted'}]});
  assert.match(title, /data-tone="warn" class="bp-titleblock-numeric"/); assert.match(title,/data-tone="muted"/);
  assert.equal(declarations('.bp-titleblock dd.bp-titleblock-numeric',1280)['font-weight'],'700');
  assert.match(css,/\.bp-titleblock dt \{[^}]*var\(--font-mono\)[^}]*text-transform:uppercase/);
  assert.match(css,/@container bp-fact-layout \(max-width:480px\)/);
  const compact = out('BpSectionCard',{letter:'B',title:'走势',density:'compact'});
  assert.match(compact,/bp-section-card-compact/); assert.match(compact,/bp-section-card-title text-item-title/);
  assert.match(compact,/bp-section-card-letter font-mono text-ui-hint/);
  assert.equal(declarations('.bp-section-card-compact .bp-section-card-letter',1280).width,'28px');
  assert.match(out('BpCallout',{title:'结论',emphasis:true}),/bp-callout-emphasis/);
  assert.equal(declarations('.bp-callout.bp-callout-emphasis',1280)['border-left'],'6px solid var(--line)');
});
for (const theme of ['blueprint','blueprint-night','light','paper','dark']) test(`P99 ${theme}: auto TrendChart uses theme-selected scale; explicit domain remains caller-owned`, () => {
  const props = { label:'C0', series:api.blueprintTrendSeries, unit:'%', yDomain:'auto' };
  const axis = capture('TrendChart',props,theme).nodes.find(node=>node.props.tickFormatter&&node.props.allowDataOverflow);
  const values = props.series.flatMap(s=>s.data.map(p=>p.value));
  const expected = theme.startsWith('blueprint') ? {domain:[65,80],ticks:[65,70,75,80]} : trendAutoScale(values,'%');
  assert.deepEqual(axis.props.ticks,expected.ticks); assert.deepEqual(axis.props.domain,expected.domain);
  const explicit = capture('TrendChart',{...props,yDomain:[64,81]},theme).nodes.find(node=>node.props.domain?.[0]===64);
  assert.equal(explicit.props.ticks,undefined); assert.deepEqual(explicit.props.domain,[64,81]);
});
test('P99 blueprints: whole 1/2/5/10/20 steps, missing/constant/negative/large data remain bounded and finite', () => {
  for (const [values, interval] of [[[70,71],1],[[70,74],2],[[67,77],5],[[50,80],10],[[0,60],20]]) assert.equal(blueprintTrendAutoScale(values,'%').interval,interval);
  for (const values of [[null,NaN,Infinity],[0],[100],[70,70],[-7,4],[-0.2,0.5],[0,100],[120,220],[1e6,2e6]]) {
    const result=blueprintTrendAutoScale(values,'%');
    assert.ok(result.ticks.length>=2&&result.ticks.length<=8);
    assert.ok(result.ticks.every(t=>Number.isFinite(t)&&Number.isInteger(t/result.interval)));
    for(const v of values.filter(v=>typeof v==='number'&&Number.isFinite(v))) assert.ok(result.domain[0]<=v&&result.domain[1]>=v);
  }
});
test('P99 overview C0 data, unique trend anchor, help control, compact B heading and unknown fixture', () => {
  const html=out('BlueprintOverviewDemo');
  for(const text of ['overview-calibration','学情概览组合','45 人','6 次','2,436 次','08/01–10/21','2026-10-21','截止后 1 份','按当前班级近似','1,684 / 2,250 分','+1 pp 高于预期','MET03','MET07','MET08','RULE','数据不足','尚未提供统计结果','bp-section-card-compact']) assert.ok(html.includes(text),text);
  for(const number of [75,65,76,10,177,95,17,626,197,43]) assert.match(html,new RegExp(`>${number}<`));
  assert.equal((html.match(/id="trend-calibration"/g)??[]).length,1);
  assert.match(html,/aria-controls="overview-score-help"/); assert.match(html,/id="overview-score-help" hidden=""/);
  assert.match(html,/href="#overview-evidence"/); assert.match(html,/<details id="overview-evidence"/);
});
