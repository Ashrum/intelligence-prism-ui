import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, defaults, render } from './p58-chart-harness.mjs';

const data=[{id:'a',label:'章一',x:62.25,y:64.5},{id:'b',label:'章二',x:88.1,y:89.2},{id:'missing',label:'缺测',x:null,y:null}];
const props={...defaults.ScatterChart,data,xUnit:'%',unit:'%',xDomain:'auto',yDomain:'auto',decimals:1,quadrants:{x:75,y:75,labels:['左上角','右上角','左下角','右下角'],highlight:{quadrant:'bottom-left',tone:'destructive'}}};

test('P60 scatter auto domains frame clustered data, retain raw coordinates and integer percentage ticks',()=>{
 const out=capture('ScatterChart',props),o=out.charts[0].option;
 assert.deepEqual([o.xAxis.min,o.xAxis.max,o.yAxis.min,o.yAxis.max],[50,100,50,100]);
 assert.equal(o.xAxis.minInterval,1);assert.equal(o.yAxis.minInterval,1);
 assert.equal(o.xAxis.axisLabel.formatter(62.25),'62%');assert.equal(o.yAxis.axisLabel.formatter(64.5),'65%');
 assert.deepEqual(o.series[0].data.map(p=>p.value),[[62.25,64.5],[88.1,89.2]]);
 assert.match(o.tooltip.formatter({name:'章一',value:[62.25,64.5]}),/62.3%/);
 assert.match(out.html,/缺测 1 项/);
 const explicit=capture('ScatterChart',{...props,xDomain:[60,95],yDomain:[60,95]}).charts[0].option;
 assert.deepEqual([explicit.xAxis.min,explicit.xAxis.max],[60,95]);
 const legacy=capture('ScatterChart',{...props,xDomain:undefined,yDomain:undefined}).charts[0].option;
 assert.deepEqual([legacy.xAxis.min,legacy.xAxis.max],[0,88.1]);
 for(const values of [[0,100],[65,65],[-20,-10],[0.2,0.3]]){
  const option=capture('ScatterChart',{...props,data:values.map((x,i)=>({id:String(i),label:String(i),x,y:x})),quadrants:undefined}).charts[0].option;
  assert.ok(option.xAxis.min<option.xAxis.max);assert.equal(option.series[0].data.length,2);
 }
 const invalid=capture('ScatterChart',{...props,data:[{id:'a',label:'无效',x:NaN,y:Infinity}]});
 assert.equal(invalid.charts.length,0);assert.match(invalid.html,/暂无范围内/);
 const outside=capture('ScatterChart',{...props,quadrants:{...props.quadrants,x:20}});
 assert.match(outside.html,/分界值超出坐标范围/);assert.equal(outside.charts[0].option.series[0].markArea,undefined);
});

for(const theme of ['light','paper','dark'])test(`P60 ${theme}: actual ECharts places quadrant text at outer corners with emphasis colour`,()=>{
 const out=capture('ScatterChart',props,theme);
 for(const width of [320,800,1440]){
  const chart=api.init(null,undefined,{renderer:'svg',ssr:true,width,height:340});
  try{
   chart.setOption({animation:false,...out.charts[0].option});
   const svg=chart.renderToSVGString();assert.doesNotMatch(svg,/NaN|Infinity/);
   const labels=chart.getZr().storage.getDisplayList().filter(el=>props.quadrants.labels.includes(el.style?.text));
   if(width===320){assert.equal(labels.length,0);continue;}
   assert.equal(labels.length,4);
   const bounds=chart.convertToPixel({seriesIndex:0},[50,100]),end=chart.convertToPixel({seriesIndex:0},[100,50]);
   for(const element of labels){
    const index=props.quadrants.labels.indexOf(element.style.text),rect=element.getBoundingRect().clone();
    rect.applyTransform(element.getComputedTransform());
    assert.equal(element.style.fill,index===2?out.theme.colors[1]:out.theme.palette.muted);
    if(index%2===0)assert.ok(Math.abs(rect.x-bounds[0])<15);else assert.ok(Math.abs(rect.x+rect.width-end[0])<15);
    if(index<2)assert.ok(Math.abs(rect.y-bounds[1])<15);else assert.ok(Math.abs(rect.y+rect.height-end[1])<15);
   }
  }finally{chart.dispose();}
 }
});

test('P60 trend defaults retain auto ticks; explicit two-row text is disclosed and all requests interval zero',()=>{
 assert.equal(capture('TrendChart',defaults.TrendChart).html,capture('TrendChart',{...defaults.TrendChart,xTickMode:'auto'}).html);
 const out=capture('TrendChart',{label:'趋势',xTickMode:'all',series:api.learningTrendSeries});
 const axis=out.nodes.find(n=>n.props.dataKey==='id'&&n.props.tickFormatter);
 assert.equal(axis.props.interval,0);assert.equal(axis.props.height,54);
 const tick=render(axis.props.tick({x:500,y:200,payload:{value:'week-7'}}));
 assert.equal((tick.match(/<tspan/g)||[]).length,2);assert.match(tick,/第 8 周/);assert.match(tick,/数学检测/);
 assert.match(out.html,/第 8 周 · 数学检测/);
 const tip=out.nodes.find(n=>n.props.contentStyle).props.labelFormatter;assert.equal(tip('week-7'),'22 章单元测');
});

for(const theme of ['light','paper','dark'])test(`P60 ${theme}: trend legend formatter uses foreground while series retain distinct colours`,()=>{
 const out=capture('TrendChart',{label:'趋势',series:api.learningTrendSeries},theme);
 const legend=out.nodes.find(n=>n.type?.displayName==='Legend'||n.type?.name==='Legend');
 assert.ok(legend);
 for(const label of ['实际得分率','新情境检测'])assert.equal(render(legend.props.formatter(label)),`<span class="text-ui-hint text-foreground">${label}</span>`);
 const lines=out.nodes.filter(n=>n.type?.displayName==='Line'||n.type?.name==='Line');
 assert.notEqual(lines[0].props.stroke,lines[3].props.stroke);
});

test('P60 sparkline bridges missing/invalid slots without zero filling or changing x positions and accessible facts',()=>{
 const values=[null,10,null,0,20,NaN,30,null];
 const model=api.metricVisualModel({kind:'sparkline',values});assert.equal(model.runs.length,1);assert.equal(model.runs[0].length,4);
 assert.deepEqual(model.runs[0].map(p=>p.x),[1,3,4,6].map(i=>4+i/7*64));
 assert.equal(model.runs[0][1].y,36);assert.match(model.text,/缺测、10、缺测、0、20、无效值、30、缺测/);
 const out=capture('MetricSummary',{items:[{id:'a',label:'趋势',value:30,visual:{kind:'sparkline',values}}]});
 assert.equal((out.html.match(/<polyline/g)||[]).length,1);assert.equal((out.html.match(/<circle/g)||[]).length,4);
 assert.match(out.html,/aria-hidden="true" focusable="false"/);assert.doesNotMatch(out.html,/NaN|Infinity/);
 for(const values of [[],[null,null],[NaN,Infinity]])assert.deepEqual(api.metricVisualModel({kind:'sparkline',values}).runs,[]);
 assert.deepEqual(api.metricVisualModel({kind:'sparkline',values:[null,0,null]}).runs,[[{x:36,y:20}]]);
});
