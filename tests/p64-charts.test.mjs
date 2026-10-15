import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { api, capture, defaults, h, render } from './p58-chart-harness.mjs';

const entries = JSON.parse(await readFile(new URL('./fixtures/p63-defaults-before.json', import.meta.url), 'utf8'));
const list = html => html.match(/<ul\b[^>]*data-chart-legend[^>]*>[\s\S]*?<\/ul>/)?.[0];
const legend = out => out.nodes.find(n => n.type === api.ChartLegend);
const lines = out => out.nodes.filter(n => n.type?.displayName === 'Line' || n.type?.name === 'Line');
const helper = (name, props) => name === 'TrendChart' ? api.trendLegendItems(props.series) : name === 'ComparisonChart' ? api.comparisonLegendItems(props) : name === 'ComboChart' ? api.comboLegendItems(props.series, props.axes) : name === 'PairedDotChart' ? api.pairedDotLegendItems(props.metrics) : api.scatterLegendItems(props.groups);

for (const theme of ['light', 'paper', 'dark']) test(`P64 ${theme}: independent legend uses exact trend strokes and dot geometry, with monochrome text`, () => {
 const series = [...api.learningTrendSeries, { id: 'explicit', label: '显式色覆盖 tone', connect: false, color: '#123456', tone: 'warning', data: [{ id: 'a', label: '零值', value: 0 }] }];
 const out = capture('TrendChart', { label: '趋势', series }, theme), items = api.trendLegendItems(series);
 assert.deepEqual(items.map(i => i.marker), ['line', 'dashed-line', 'hollow-dot', 'diamond', 'dot']);
 assert.deepEqual(items.map(i => i.id), series.map(s => s.id));
 assert.deepEqual(items.map(i => i.label), series.map(s => s.label));
 assert.deepEqual(items.map((i, index) => api.chartLegendColor(i, index, out.theme)), lines(out).map(n => n.props.stroke));
 const external = capture('ChartLegend', { items, align: 'right' }, theme).html;
 assert.match(external, /flex-wrap/); assert.match(external, /justify-end/); assert.match(external, /overflow-wrap:anywhere/);
 assert.equal((external.match(/text-ui-hint text-foreground/g) ?? []).length, 5);
 assert.doesNotMatch(external, /style="color:|<button|tabindex/);
 assert.match(external, /stroke-dasharray="5 4"/); assert.match(external, /fill="var\(--card\)"/);
 for (const [index, id] of [[2, 'week-3'], [3, 'week-6'], [4, 'a']]) {
  const dot = lines(out)[index].props.dot({ cx: 12, cy: 8, payload: { id } });
  const drawing = render(h(api.ChartMarker, { marker: items[index].marker, color: api.chartLegendColor(items[index], index, out.theme) }));
  assert.ok(render(dot).includes(drawing), 'legend and plotted dot use the same marker geometry');
 }
 const without = capture('TrendChart', { label: '趋势', series, legendPosition: 'none' }, theme);
 assert.equal(legend(without), undefined);
 assert.deepEqual(lines(out).map(n=>[n.props.stroke,n.props.strokeOpacity,n.props.strokeDasharray]), lines(without).map(n=>[n.props.stroke,n.props.strokeOpacity,n.props.strokeDasharray]));
 assert.equal(out.html.slice(out.html.indexOf('<details')), without.html.slice(without.html.indexOf('<details')));
});

for (const entry of entries) test(`P64 ${entry.theme} ${entry.name}: props helper and internal legend are identical and retain engine colours`, () => {
 const props = { ...entry.props, legendPosition: 'top-left' }, out = capture(entry.name, props, entry.theme), internal = legend(entry.name === 'QuadrantScatterChart' ? capture('ScatterChart', props, entry.theme) : out);
 assert.ok(internal);
 const items = helper(entry.name, props);
 assert.deepEqual(internal.props.items, items);
 assert.equal(list(out.html), capture('ChartLegend', { ...internal.props, items }, entry.theme).html);
 const colours = items.map((item, i) => api.chartLegendColor(item, i, out.theme));
 if (entry.name === 'ComboChart') {
  assert.deepEqual(items.map(i => i.marker), props.series.map(s => s.type === 'bar' ? 'bar' : 'line'));
  assert.deepEqual(colours, out.charts[0].option.series.map(s => s.color));
  for (const item of items) assert.match(item.label, /[左右]轴（/);
 } else if (entry.name === 'ScatterChart' || entry.name === 'QuadrantScatterChart') {
  assert.deepEqual(items.map(i=>i.marker), props.groups.map(g=>({circle:'dot',diamond:'diamond',triangle:'triangle',rect:'square'})[g.symbol??'circle']));
  assert.deepEqual(colours, out.charts[0].option.series.map(s => s.data[0].itemStyle.color));
 } else if (entry.name === 'PairedDotChart') {
  assert.deepEqual(items.map(i=>i.marker), ['dot','diamond']);
  assert.deepEqual(colours, out.charts[0].option.series.map(s=>s.data[0].itemStyle.color));
 } else if (entry.name === 'ComparisonChart') {
  const refs = out.nodes.find(n=>n.props.lines && n.props.horizontal!==undefined).props.lines;
  assert.equal(items.length, refs.length);
  assert.ok(items.every(i=>i.marker==='dashed-line'));
  for (const [i,ref] of refs.entries()) assert.equal(items[i].label, `${ref.label}：${api.formatChartValue(ref.value, props.data.some(p=>p.range)?'':props.unit??'')}`);
 }
});

test('P64 helpers preserve zero, mixed point symbols and all input objects; empty input produces no invented series', () => {
 const series = [{ id:'mixed',label:'同一系列',connect:false,data:[{id:'a',label:'零值',value:0,symbol:'hollow-circle'},{id:'b',label:'有效值',value:1,symbol:'diamond'},{id:'c',label:'缺测',value:null,symbol:'circle'}] }];
 const before = JSON.stringify(series), items = api.trendLegendItems(series);
 assert.deepEqual(items.map(i=>i.marker), ['hollow-dot','diamond']);
 assert.deepEqual(items.map(i=>i.id), ['mixed:hollow-circle','mixed:diamond']);
 assert.deepEqual(items.map(i=>i.label), ['同一系列 · 空心圆','同一系列 · 菱形']);
 assert.equal(JSON.stringify(series), before);
 for (const result of [api.trendLegendItems([]),api.scatterLegendItems(),api.pairedDotLegendItems([]),api.comboLegendItems([],[]),api.comparisonLegendItems({data:[],referenceLines:[]})]) assert.deepEqual(result,[]);
 assert.equal(capture('ChartLegend',{items:[]}).html, '');
 assert.deepEqual(api.quadrantLegendItems([{id:'a',label:'章'}]),api.scatterLegendItems([{id:'a',label:'章'}]));
 const refs = api.comparisonLegendItems({data:[{id:'a',label:'A',value:10}],domain:[0,100],unit:'%',referenceLines:[{value:NaN,label:'无效'},{value:70,label:'目标'},{value:200,label:'域外'}]});
 assert.deepEqual(refs.map(i=>[i.id,i.label]), [['reference-1','目标：70%']]);
});

test('P64 standalone paired legend retains help content without chart selection; labels are escaped and shapes remain distinct', () => {
 const items = api.pairedDotLegendItems(defaults.PairedDotChart.metrics.map(m=>({...m,help:h('strong',null,'完整口径')})));
 const html = capture('ChartLegend',{items,align:'right'}).html;
 assert.equal((html.match(/data-slot="popover-trigger"/g)??[]).length,2);
 assert.match(html,/aria-label="出错：指标说明"/); assert.match(html,/aria-label="再错：指标说明"/);
 assert.equal(render(items[0].help),'<strong>完整口径</strong>');
 const markers=['line','dashed-line','dot','hollow-dot','diamond','triangle','square','bar'];
 const output=capture('ChartLegend',{items:markers.map(marker=>({id:marker,label:'<中文 & x²>',marker,color:'#123456'}))}).html;
 assert.equal((output.match(/&lt;中文 &amp; x²&gt;/g)??[]).length,8);
 assert.equal((output.match(/aria-hidden="true"/g)??[]).length,8);
 const drawings=markers.map(marker=>render(h(api.ChartMarker,{marker,color:'#123456'})));
 assert.equal(new Set(drawings).size,8);
});

test('P64 overview card places one right-aligned legend in title row before plot; chart still discloses data',()=>{
 const html=capture('LearningOverviewCards',{}).html;
 const start=html.indexOf('<h3 class="text-block-title">班级得分率与预期</h3>'), plot=html.indexOf('role="group" aria-label="班级得分率与预期"');
 assert.ok(start>=0&&plot>start);
 const header=html.slice(start,plot);
 assert.equal((header.match(/data-chart-legend/g)??[]).length,1);assert.match(header,/justify-end/);
 assert.match(header,/data-legend-marker="hollow-dot"/);assert.match(header,/data-legend-marker="diamond"/);
 const chart=html.slice(plot,html.indexOf('<h3 class="text-block-title">课程与知识点聚焦</h3>'));
 assert.doesNotMatch(chart,/data-chart-legend/);assert.match(chart,/班级得分率与预期：数据/);
});
