import test from 'node:test';
import assert from 'node:assert/strict';
import {api,capture,defaults,h,render} from './p58-chart-harness.mjs';

const lines=out=>out.nodes.filter(n=>n.type?.displayName==='Line'||n.type?.name==='Line');
const axis=out=>out.nodes.find(n=>n.props.tickFormatter);
const tip=out=>out.nodes.find(n=>n.props.formatter&&n.props.contentStyle).props.formatter;

test('P59 gap connection is opt-in and point-only wins; category order and missing values remain intact',()=>{
 const original=defaults.TrendChart.series[0],make=extra=>capture('TrendChart',{...defaults.TrendChart,series:[{...original,...extra}]});
 assert.equal(lines(make({}))[0].props.connectNulls,false);
 assert.equal(lines(make({connectGaps:true}))[0].props.connectNulls,true);
 assert.equal(lines(make({connectGaps:true,connect:false}))[0].props.connectNulls,false);
 assert.equal(lines(make({connectGaps:true,connect:false}))[0].props.strokeOpacity,0);
 const rows=make({connectGaps:true}).nodes.find(n=>n.props.accessibilityLayer).props.data;
 assert.deepEqual(rows.map(r=>[r.id,r.a]),[['zero',0],['missing',null],['b',80]]);
 assert.match(make({connectGaps:true}).html,/aria-description="实际：实线，跨缺测连线"/);
});

for(const theme of ['light','paper','dark'])test(`P59 ${theme}: expected/hollow dots use neutral, diamonds use palette three, explicit color wins`,()=>{
 const out=capture('TrendChart',{label:'学情',series:api.learningTrendSeries},theme),paths=lines(out);
 assert.equal(paths[1].props.stroke,theme==='dark'?'#B6BEC9':'#6B7280');
 assert.equal(paths[2].props.stroke,paths[1].props.stroke);assert.equal(paths[3].props.stroke,out.theme.colors[2]);
 const custom=capture('TrendChart',{...defaults.TrendChart,series:[{...defaults.TrendChart.series[0],tone:'neutral',color:'#123456'}]},theme);
 assert.equal(lines(custom)[0].props.stroke,'#123456');
});

test('P59 percentage rounding is shared by table, tooltip, labels, threshold and aria-consumed text; coordinates are never rounded',()=>{
 assert.equal(api.formatChartValue(56.46929824561403,'%'),'56%');
 assert.equal(api.formatChartValue(82.222,'%',1),'82.2%');assert.equal(api.formatChartValue(56.204,'％'),'56％');
 assert.equal(api.formatChartValue(82.222,'%',99),'82%');assert.equal(api.formatChartValue(1.23456),'1.235');
 for(const value of [null,NaN,Infinity])assert.equal(api.formatChartValue(value,'%'),'缺测');
 for(const decimals of [undefined,0,1]){
  const text=decimals===1?'56.5%':'56%',value=56.46929824561403;
  const trend=capture('TrendChart',{label:'精度',unit:'%',decimals,series:[{id:'a',label:'实际',data:[{id:'one',label:'检测',value}]}]});
  assert.ok(trend.html.includes(text));assert.equal(tip(trend)(value),text);assert.equal(axis(trend).props.tickFormatter(value),'56%');
  const scatter=capture('ScatterChart',{...defaults.ScatterChart,unit:'%',xUnit:'%',decimals,data:[{id:'a',label:'章',x:value,y:82.222}],quadrants:{...defaults.ScatterChart.quadrants,x:value}});
  const option=scatter.charts[0].option;
  assert.deepEqual(option.series[0].data[0].value,[value,82.222]);assert.ok(scatter.html.includes(`分界：得分率 ${text}`));
  assert.ok(option.tooltip.formatter({name:'章',value:[value,82.222]}).includes(text));assert.equal(option.xAxis.axisLabel.formatter(value),text);
  const paired=capture('PairedDotChart',{...defaults.PairedDotChart,unit:'%',decimals,density:'compact',data:[{id:'a',label:'题目',first:value,second:82.222}]});
  const series=paired.charts[0].option.series;
  assert.equal(series[0].label.formatter({data:series[0].data[0]}),text);assert.ok(paired.html.includes(text));
  assert.ok(paired.charts[0].option.tooltip.formatter({seriesName:'出错',data:series[0].data[0]}).includes(text));
  assert.equal(series[0].data[0].raw,value);
  for(const out of [trend,scatter,paired])assert.doesNotMatch(out.html,/56\.46929824561403|82\.222/);
 }
});

test('P59 trend yDomain auto pads finite observations; explicit yDomain overrides legacy domain, omission retains it',()=>{
 assert.deepEqual(api.trendAutoDomain([55,75,null,NaN],'%'),[40,90]);
 assert.deepEqual(api.trendAutoDomain([], '%'),[0,100]);assert.deepEqual(api.trendAutoDomain([null,Infinity],''),[0,1]);
 for(const values of [[0],[100],[65,65],[0,100],[-15,-5],[.2,.3]]){
  const d=api.trendAutoDomain(values,'%');assert.ok(d[0]<d[1]);assert.ok(values.every(v=>v>=d[0]&&v<=d[1]));
 }
 const props={...defaults.TrendChart,series:[{id:'a',label:'值',data:[{id:'a',label:'一',value:55},{id:'b',label:'二',value:75}]}]};
 assert.deepEqual(axis(capture('TrendChart',props)).props.domain,[0,100]);
 assert.deepEqual(axis(capture('TrendChart',{...props,yDomain:'auto'})).props.domain,[40,90]);
 assert.deepEqual(axis(capture('TrendChart',{...props,yDomain:[45,85]})).props.domain,[45,85]);
});

test('P59 scatter auto omits crowded full names; none disables normal, emphasis and responsive point labels',()=>{
 const name='第二十二章 二次函数与一元二次方程 x² − 3x + 2 = 0';
 for(const labelMode of ['auto','none']){
  const out=capture('ScatterChart',{...defaults.ScatterChart,labelMode,data:[{id:'a',label:name,x:60,y:40}]}),o=out.charts[0].option;
  assert.equal(o.series[0].label.show,labelMode==='auto');assert.equal(o.series[0].emphasis.label.show,labelMode==='auto');
  assert.equal(o.series[0].label.formatter({name}),'');assert.equal(o.series[0].label.formatter({name:'短名称'}),'短名称');
  assert.ok(o.tooltip.formatter({name,value:[60,40]}).startsWith(name));assert.ok(out.html.includes(name));
  if(labelMode==='none')for(const media of o.media)assert.ok(media.option.series.every(s=>s.label.show===false));
 }
});

test('P59 compact paired names and ReactNode tags appear above each row chart, wrap, retain common scale and selection IDs',()=>{
 const name='一元二次方程完整的长中文题目名称与公式 x² − 3x + 2 = 0'.repeat(3),calls=[];
 const data=[{id:'long',label:name,tag:h('strong',null,'需复查'),first:0,second:100},{id:'missing',label:'单边缺测',first:null,second:50},{id:'equal',label:'相等',first:50,second:50}];
 const out=capture('PairedDotChart',{...defaults.PairedDotChart,data,density:'compact',connectPairs:true,onSelect:(...args)=>calls.push(args)});
 assert.equal(out.charts.length,3);assert.ok(out.html.indexOf(name)<out.html.indexOf('data-chart-engine'));assert.match(out.html,/<strong>需复查<\/strong>/);
 assert.match(out.html,/whitespace-normal \[overflow-wrap:anywhere\]/);assert.doesNotMatch(out.html,/>[^<]*\.\.\.</);
 for(const c of out.charts){assert.equal(c.option.xAxis.min,0);assert.equal(c.option.xAxis.max,100);assert.equal(c.option.yAxis.show,false);}
 assert.equal(out.charts[1].option.series[0].data.length,0);assert.equal(out.charts[1].option.series[1].data.length,1);assert.deepEqual(out.charts[1].option.series[0].markLine.data,[]);
 out.charts[1].onSelect('missing','second');assert.deepEqual(calls,[['missing','second']]);
 assert.deepEqual(data[1],{id:'missing',label:'单边缺测',first:null,second:50});
});

const disclosureCases=[
 ['TrendChart',{...defaults.TrendChart,series:api.learningTrendSeries},'标注避让'],
 ['ScatterChart',{...defaults.ScatterChart,data:[...defaults.ScatterChart.data,{id:'missing',label:'缺测章',x:null,y:5}]},'分界：'],
 ['PairedDotChart',{...defaults.PairedDotChart,connectPairs:true},'缺测不补零'],
 ['HeatmapChart',{label:'矩阵',rows:[{id:'a',label:'章'}],columns:[{id:'b',label:'知识点'}],cells:[{id:'c',row:'a',column:'b',value:null}]},'缺测单独标记'],
 ['BoxPlotChart',{label:'分布',data:[{id:'a',label:'章',values:[1,2,3,4,5]}]},'统计方法'],
 ['ComboChart',{label:'组合',categories:[{id:'a',label:'周'}],axes:[{id:'left',label:'得分',unit:'%'}],series:[{id:'s',label:'值',axisId:'left',type:'line',data:[{id:'a',value:55}]}]},'缺测保留间断'],
 ['DonutChart',{label:'组成',segments:[{id:'a',label:'已完成',value:2}]},'零值仅保留'],
 ['RadarChart',{label:'能力',axes:['a','b','c'].map(id=>({id,label:id})),series:[{id:'s',label:'值',values:[1,2,3]}]},'上限见数据表'],
];
for(const [name,props,phrase] of disclosureCases)test(`P59 ${name}: technical explanations exist only inside closed data disclosure`,()=>{
 const out=capture(name,props),disclosure=out.html.match(/<details>[\s\S]*?<\/details>/)?.[0];
 assert.ok(disclosure?.includes(phrase));assert.ok(!out.html.replace(/<details>[\s\S]*?<\/details>/g,'').includes(phrase));
 assert.doesNotMatch(out.html,/<details open/);
});

test('P59 other analysis chart percentages format text without rounding model inputs',()=>{
 const value=56.46929824561403;
 const heat=capture('HeatmapChart',{label:'矩阵',unit:'%',rows:[{id:'a',label:'章'}],columns:[{id:'b',label:'知识点'}],cells:[{id:'c',row:'a',column:'b',value}]});
 assert.match(heat.html,/56%/);assert.equal(heat.charts[0].option.series[0].data[0].value[2],value);
 const box=capture('BoxPlotChart',{label:'分布',unit:'%',data:[{id:'a',label:'章',values:[1.11,2.22,3.33,4.44,value]}]});
 assert.match(box.html,/56%/);assert.match(box.charts[0].option.tooltip.formatter({data:{id:'a'}}),/上须：56%/);
 const comparison=capture('ComparisonChart',{label:'对比',unit:'%',data:[{id:'a',label:'章',value}],referenceLines:[{label:'阈值',value:50.123}],domain:[0,100]});
 assert.match(comparison.html,/aria-description="参考线；阈值：50%"/);assert.doesNotMatch(comparison.html,/56\.46929824561403|50\.123%/);
});

for(const theme of ['light','paper','dark'])test(`P59 ${theme}: actual ECharts renders label-free scatter and all compact rows at 320/800/1440`,()=>{
 const props={...defaults.PairedDotChart,unit:'%',density:'compact',connectPairs:true,data:[{id:'a',label:'完整名称',first:56.46929824561403,second:82.222},{id:'b',label:'缺测',first:null,second:50}]};
 for(const width of [320,800,1440])for(const [name,options] of [['PairedDotChart',props],['ScatterChart',{...defaults.ScatterChart,labelMode:'none',unit:'%',xUnit:'%'}]]){
  const out=capture(name,options,theme);
  for(const c of out.charts){const chart=api.init(null,undefined,{renderer:'svg',ssr:true,width,height:c.height});try{
   chart.setOption({animation:false,...c.option});const svg=chart.renderToSVGString();assert.doesNotMatch(svg,/NaN|Infinity|56\.46929824561403|82\.222%/);
   if(name==='PairedDotChart'&&c.label.includes('完整名称')){assert.match(svg,/>56%<\/text>/);assert.match(svg,/>82%<\/text>/);}
  }finally{chart.dispose();}}
 }
});
