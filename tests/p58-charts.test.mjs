import { withoutP64Legend } from "./helpers/p64-legend-migration.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { api, capture, defaults, optionJSON, h, render } from './p58-chart-harness.mjs';

const before=JSON.parse(await readFile(new URL('./fixtures/p58-defaults-before.json',import.meta.url),'utf8'));
for(const snapshot of before) test(`P58 ${snapshot.theme} ${snapshot.name} ${JSON.stringify(snapshot.extra)}: default SSR/options retain pre-change bytes except authorized P59/P60 disclosure, labels and P64 legend markup`,()=>{
 const out=capture(snapshot.name,{...defaults[snapshot.name],...snapshot.extra},snapshot.theme);
 let expected=snapshot.html;
 if(['ScatterChart','PairedDotChart'].includes(snapshot.name)){
  // P59 intentionally moves the exact former footer into the closed disclosure.
  const start=expected.indexOf('<p class="text-ui-hint'),end=expected.indexOf('<details>');
  if(start>=0&&start<end){const notes=expected.slice(start,end);expected=expected.slice(0,start)+expected.slice(end);expected=expected.replace('</summary>','</summary>'+notes);}
 }
 assert.equal(withoutP64Legend(out.html.replace('</summary> ','</summary>')),withoutP64Legend(expected));
 const options=snapshot.options.map(text=>{const option=JSON.parse(text);if(snapshot.name==='ScatterChart')for(const series of option.series){series.label.formatter='[function]';delete series.label.overflow; if(series.markArea)series.markArea.data=series.markArea.data.map(([first,second],i)=>[{name:first.name,label:{position:['insideTopLeft','insideTopRight','insideBottomLeft','insideBottomRight'][i],color:series.markArea.label.color},...Object.fromEntries(Object.entries(first).filter(([key])=>key!=='name'))},second]);}return JSON.stringify(option)});
 assert.deepEqual(out.charts.map(c=>optionJSON(c.option)),options);
});

test('P58 explicit solid/connect/default density preserve the original output',()=>{
 const trend={...defaults.TrendChart,series:defaults.TrendChart.series.map(s=>({...s,lineStyle:'solid',connect:true}))};
 assert.equal(capture('TrendChart',trend).html,capture('TrendChart',defaults.TrendChart).html);
 const out=capture('PairedDotChart',{...defaults.PairedDotChart,density:'default',connectPairs:false});
 assert.equal(out.html,capture('PairedDotChart',defaults.PairedDotChart).html);
 assert.equal(optionJSON(out.charts[0].option),optionJSON(capture('PairedDotChart',defaults.PairedDotChart).charts[0].option));
});

test('P58 trend passes dashed/point-only geometry, symbols, text disclosure, tooltip and selection intent',()=>{
 const calls=[],out=capture('TrendChart',{label:'学情',series:api.learningTrendSeries,unit:'%',onSelect:(...args)=>calls.push(args)});
 const lines=out.nodes.filter(n=>n.type?.displayName==='Line'||n.type?.name==='Line');
 assert.equal(lines.length,4);assert.equal(lines[1].props.strokeDasharray,'5 4');assert.equal(lines[2].props.strokeOpacity,0);assert.equal(lines[3].props.strokeOpacity,0);
 assert.deepEqual(lines.map(n=>n.props.connectNulls),[true,true,false,false]);assert.ok(lines.every(n=>n.props.isAnimationActive===false));
 const dot=lines[2].props.dot({cx:100,cy:100,payload:{id:'week-3'}});
 assert.match(render(dot),/data-trend-symbol="hollow-circle"/);assert.match(render(dot),/fill="var\(--background\)"/);
 dot.props.onSelect();assert.deepEqual(calls,[['week-3','incomparable']]);
 assert.match(render(lines[3].props.activeDot({cx:150,cy:100,payload:{id:'week-6'}})),/data-trend-symbol="diamond"/);
 const tooltip=out.nodes.find(n=>n.props.formatter&&n.props.contentStyle);
 const tip=render(tooltip.props.formatter(66,'不可比检测',{dataKey:'incomparable',payload:{id:'week-3'}})[0]);
 assert.match(tip,/66%/);assert.match(tip,/不可比：口径不同/);assert.match(tip,/空心圆/);
 for(const text of ['高于预期 3','不可比：口径不同','新情境：独立观察','仅画点，不连线','虚线','菱形'])assert.ok(out.html.includes(text));
});

const apart=(a,b)=>a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y;
test('P58 trend labels avoid points/other labels, stay inside plot, preserve above/below and fall back when cramped',()=>{
 const plot={x:60,y:30,width:800,height:220},points=[{id:'a',x:60,y:100,valueLabel:'65%',annotation:'高于预期 1'},{id:'b',x:125,y:105,valueLabel:'68%',annotation:'高于预期 2'},{id:'c',x:850,y:90,valueLabel:'72%',annotation:'高于预期 3'},{id:'long',x:500,y:240,valueLabel:'需要完整保留的长中文与公式 x² + y² = 1'.repeat(5)}];
 const labels=api.trendLabelLayout(points,plot);assert.ok(labels.length>=4);
 for(const label of labels){assert.ok(label.x>=plot.x&&label.x+label.width<=860&&label.y>=30&&label.y+label.height<=250);const point=points.find(p=>p.id===label.id);assert.ok(label.kind==='valueLabel'?label.y+label.height<point.y:label.y>point.y);for(const p of points)assert.ok(apart(label,{x:p.x-8,y:p.y-8,width:16,height:16}));}
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)assert.ok(apart(labels[i],labels[j]));
 const crossing=api.trendLabelLayout([{id:'x',x:200,y:100,valueLabel:'65%'}],plot,[{x1:150,y1:82,x2:250,y2:82}]);assert.equal(crossing.length,1);assert.ok(crossing[0].y+crossing[0].height<80,'labels must also avoid connecting strokes');
 assert.ok(!labels.some(l=>l.id==='long'));assert.deepEqual(api.trendLabelLayout(points,{...plot,width:240}),[]);
});

for(const theme of ['light','paper','dark'])test(`P58 ${theme}: four highlighted quadrants use existing tone color beneath dots, with accessible names`,()=>{
 for(const [index,quadrant] of ['top-left','top-right','bottom-left','bottom-right'].entries()){
  const props={...defaults.ScatterChart,quadrants:{...defaults.ScatterChart.quadrants,highlight:{quadrant,tone:'destructive'}}};
  const out=capture('ScatterChart',props,theme),area=out.charts[0].option.series[0].markArea;
  assert.equal(area.data[index][0].itemStyle.color,out.theme.colors[1]);assert.equal(area.data[index][0].itemStyle.opacity,0.1);
  assert.ok(area.data.every((d,i)=>i===index||!d[0].itemStyle));assert.match(out.html,new RegExp(`${defaults.ScatterChart.quadrants.labels[index]}（高亮区域）`));
  assert.deepEqual(area.data[index].map(d=>d.coord),[[[0,100],[70,60]],[[70,100],[100,60]],[[0,60],[70,0]],[[70,60],[100,0]]][index]);
 }
});

test('P58 paired compact connects only valid pairs, leaves missing/invalid as gaps, keeps zero and equal values',()=>{
 const data=[{id:'bounds',label:'边界',first:0,second:100},{id:'equal',label:'相等',first:50,second:50},{id:'missing',label:'缺一个值',first:null,second:30},{id:'invalid',label:'域外',first:120,second:40}];
 const calls=[],out=capture('PairedDotChart',{...defaults.PairedDotChart,data,density:'compact',connectPairs:true,onSelect:(...args)=>calls.push(args)}),chart=out.charts[0];
 assert.equal(out.charts.length,4);assert.ok(out.charts.every(c=>c.height===48));assert.equal(capture('PairedDotChart',{...defaults.PairedDotChart,data:data.slice(0,3),density:'compact'}).charts.length,3);
 assert.deepEqual(out.charts.map(c=>c.option.series[0].markLine.data),[[[{coord:[0,0]},{coord:[100,0]}]],[[{coord:[50,0]},{coord:[50,0]}]],[],[]]);
 assert.equal(out.charts.reduce((n,c)=>n+c.option.series[0].data.length,0),2);assert.equal(out.charts.reduce((n,c)=>n+c.option.series[1].data.length,0),4);
 assert.deepEqual(chart.option.series.slice(0,2).map(s=>s.symbolOffset),[[0,0],[0,0]]);
 assert.equal(chart.option.series[0].markLine.z,1);assert.match(out.html,/缺测不补零/);assert.match(out.html,/另一项仍按原值显示/);
 chart.onSelect('missing','second');assert.deepEqual(calls,[['missing','second']]);
 assert.equal(chart.option.tooltip.formatter({data:out.charts[2].option.series[1].data[0],seriesName:'再错'}),'缺一个值\n再错：30');
});

test('P58 actual ECharts SVG renders highlight and compact connectors at both widths in three themes',()=>{
 for(const theme of ['light','paper','dark'])for(const width of [320,960])for(const name of ['ScatterChart','PairedDotChart']){
  const props=name==='ScatterChart'?{...defaults[name],quadrants:{...defaults[name].quadrants,highlight:{quadrant:'bottom-left',tone:'destructive'}}}:{...defaults[name],density:'compact',connectPairs:true};
  const out=capture(name,props,theme),chart=api.init(null,undefined,{renderer:'svg',ssr:true,width,height:out.charts[0].height});
  try{chart.setOption({animation:false,...out.charts[0].option});const svg=chart.renderToSVGString();assert.match(svg,/<svg/);assert.doesNotMatch(svg,/NaN|Infinity/);if(name==='ScatterChart'){assert.ok(svg.includes(out.theme.colors[1]));assert.match(svg,/fill-opacity="0.1"/);}else{assert.ok(svg.includes(out.theme.palette.muted));assert.equal(chart.getModel().getSeriesByIndex(1).getData().count(),1);}}
  finally{chart.dispose();}
 }
});

test('P58 miniature geometry preserves original values, P60 gap-spanning line, isolated zero and invalid ring fallback',()=>{
 assert.equal(api.metricVisualModel({kind:'ring',value:61,max:100}).ratio,0.61);
 for(const [value,max] of [[-1,100],[101,100],[0,0],[Infinity,100],[10,NaN]])assert.equal(api.metricVisualModel({kind:'ring',value,max}).ratio,null);
 assert.equal(api.metricVisualModel({kind:'ring',value:0,max:100}).ratio,0);
 const model=api.metricVisualModel({kind:'sparkline',values:[10,null,0,20,NaN,30]});assert.deepEqual(model.runs.map(r=>r.length),[4]);assert.match(model.text,/10、缺测、0、20、无效值、30/);
 assert.deepEqual(api.metricVisualModel({kind:'sparkline',values:[null]}).runs,[]);assert.deepEqual(api.metricVisualModel({kind:'sparkline',values:[0]}).runs,[[{x:36,y:20}]]);
});

for(const theme of ['light','paper','dark'])test(`P58 ${theme}: metric decoration is hidden, text discloses values, help uses named coss buttons in all layouts`,()=>{
 for(const extra of [{},{density:'compact'},{layout:'strip'}]){
  const out=capture('MetricSummary',{...extra,items:api.learningMetrics},theme);
  assert.equal((out.html.match(/data-metric-visual=/g)||[]).length,4);assert.equal((out.html.match(/<svg aria-hidden="true" focusable="false"/g)||[]).length,4);
  assert.match(out.html,/环形数值：10 \/ 45/);assert.match(out.html,/走势数值：65、缺测、68、70、缺测、72/);
  assert.equal((out.html.match(/data-slot="popover-trigger"/g)||[]).length,4);assert.match(out.html,/aria-label="稳定保持：指标说明"/);assert.match(out.html,/aria-expanded="false"/);
  assert.ok(out.html.includes('var(--chart-1)'));assert.doesNotMatch(out.html,/NaN|Infinity/);
 }
});

test('P58 metric help is independently optional, supports ReactNode and does not turn card into a button',()=>{
 const out=capture('MetricSummary',{items:[{id:'x',label:'口径',value:0,help:h('strong',null,'说明内容')}]});
 assert.equal((out.html.match(/<button/g)||[]).length,1);assert.doesNotMatch(out.html,/data-metric-visual/);assert.match(out.html,/aria-haspopup="dialog"/);
});
