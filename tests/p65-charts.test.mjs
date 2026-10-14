import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, defaults } from './p58-chart-harness.mjs';

const overlaps = (a,b) => a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
test('P65 spark uses equal index strides with both endpoints and >=8px text gaps', () => {
 for (const length of [0,1,2,13,52]) for (const width of [120,240,320,600,1440]) {
  const labels=Array.from({length},(_,i)=>i===length-1?'第十三周末检测':String(i+1));
  const ticks=api.sparkTickLayout(labels,width);
  if(!length){assert.deepEqual(ticks,[]);continue;}
  assert.equal(ticks[0].index,0);assert.equal(ticks.at(-1).index,length-1);
  ticks.forEach((t,i)=>{
   assert.ok(t.x-t.width/2>=0 && t.x+t.width/2<=width);
   if(i) assert.ok(t.x-t.width/2-(ticks[i-1].x+ticks[i-1].width/2)>=8-1e-8);
  });
  const interior=ticks.slice(0,-1);
  if(interior.length>2)assert.ok(interior.slice(2).every((t,i)=>t.index-interior[i+1].index===interior[1].index-interior[0].index));
 }
 assert.ok(api.sparkTickLayout(Array.from({length:13},(_,i)=>String(i+1)),120).length<13);
});

test('P65 Trend percentage steps follow the observed span, preserving raw values and other axes', () => {
 for(const unit of ['%','％'])for(const [values,step] of [[[65,85],10],[[65,84],5],[[68,68],5],[[],10],[[0,100],10],[[-5,15],10]]){
  const scale=api.trendAutoScale(values,unit);
  assert.equal(scale.interval,step);assert.ok(values.every(v=>v>=scale.domain[0]&&v<=scale.domain[1]));
  assert.ok(scale.ticks.slice(1).every((v,i)=>v-scale.ticks[i]===step));
  const out=capture('TrendChart',{label:'自动轴',unit,yDomain:'auto',series:[{id:'a',label:'实际',data:values.map((value,i)=>({id:String(i),label:String(i),value}))}]});
  const axis=out.nodes.find(n=>n.props.ticks);
  assert.deepEqual(axis.props.ticks,scale.ticks);
 }
 assert.deepEqual(api.trendAutoScale([.2,.9],'分'),api.chartAutoScale([.2,.9],'分'));
 const out=capture('TrendChart',{...defaults.TrendChart,yDomain:[61,89]});
 assert.equal(out.nodes.find(n=>n.props.tickFormatter&&n.props.domain).props.ticks,undefined);
});

test('P65 scatter tries four directions, reserves unlabelled symbols, drops blocked text',()=>{
 const plot={x:0,y:0,width:300,height:200};
 const target={id:'a',label:'函数与方程',x:150,y:100,radius:7,show:true};
 const obstacles=[{id:'r',label:'',x:195,y:100,radius:6,show:false},{id:'t',label:'',x:150,y:77,radius:6,show:false},{id:'l',label:'',x:105,y:100,radius:6,show:false},{id:'b',label:'',x:150,y:123,radius:6,show:false}];
 for(let n=0;n<=4;n++){
  const labels=api.scatterLabelLayout([target,...obstacles.slice(0,n)],plot);
  const box=labels.get('a');
  if(n===4){assert.equal(box,undefined);continue;}
  assert.ok(box);
  for(const p of [target,...obstacles.slice(0,n)])assert.ok(!overlaps(box,{x:p.x-p.radius,y:p.y-p.radius,width:2*p.radius,height:2*p.radius}));
 }
});

for(const theme of ['light','paper','dark'])test(`P65 ${theme}: real ECharts resolved labels avoid points/labels across size and grouped data`,()=>{
 const data=[{id:'a',label:'函数与方程',x:50,y:50,group:'a'},{id:'b',label:'相邻知识点',x:54,y:50,group:'b'},{id:'c',label:'同位置',x:50,y:50,group:'a'},{id:'d',label:'上边界',x:50,y:100,group:'b'},{id:'long',label:'长中文完整名称与公式 x² + y² = 1',x:70,y:70,group:'a'}];
 const props={...defaults.ScatterChart,data,groups:[{id:'a',label:'章'},{id:'b',label:'知识点'}]};
 const c=capture('QuadrantScatterChart',props,theme).charts[0];
 const chart=api.init(null,undefined,{renderer:'svg',ssr:true,width:800,height:340});
 try{
  for(const width of [800,320,1440,800]){
   chart.resize({width,height:340});
   const option=c.resolveLayout(c.option,width,340);
   chart.setOption({animation:false,...option},true);
   const svg=chart.renderToSVGString();assert.doesNotMatch(svg,/NaN|Infinity/);
   assert.doesNotMatch(svg,/>长中文完整名称与公式/);
   const boxes=[],symbols=[];
   for(let si=0;si<option.series.length;si++){
    const series=option.series[si],model=chart.getModel().getSeriesByIndex(si),d=model.getData();
    series.data.forEach((p,i)=>{
     const xy=d.getItemLayout(i);symbols.push({x:xy[0]-6.5,y:xy[1]-6.5,width:13,height:13});
     if(!p.label.show)return;
     assert.ok(width>440);
     const host=d.getItemGraphicEl(i);
     host.traverse(el=>{const label=el.getTextContent?.();if(!label||label.ignore)return;const box=label.getBoundingRect().clone();box.applyTransform(label.getComputedTransform());boxes.push(box);});
    });
   }
   if(width>440)assert.ok(boxes.length>=2,'must move useful labels, not hide them all');
   else assert.equal(boxes.length,0);
   boxes.forEach((box,i)=>{
    assert.ok(box.x>=60&&box.x+box.width<=width-28&&box.y>=40&&box.y+box.height<=285);
    assert.ok(symbols.every(p=>!overlaps(box,p)),'label must avoid every symbol');
    assert.ok(boxes.slice(i+1).every(other=>!overlaps(box,other)),'labels must avoid each other');
   });
   assert.match(option.tooltip.formatter({name:data[4].label,value:[70,70]}),/长中文完整名称/);
  }
  for(const extra of [{labelMode:'none'},{labelIds:[]}]){
   const c=capture('QuadrantScatterChart',{...props,...extra}).charts[0],o=c.resolveLayout(c.option,800,340);
   assert.ok(o.series.every(s=>s.data.every(p=>!p.label.show&&!p.emphasis.label.show)));
  }
 }finally{chart.dispose();}
});

test('P65 paired width is opt-in, horizontal legends keep help, both compact/default hidden branches omit disclosures',()=>{
 const props={...defaults.PairedDotChart,density:'compact',maxTrackWidth:420,metrics:defaults.PairedDotChart.metrics.map(m=>({...m,help:'指标口径'}))};
 const out=capture('PairedDotChart',props);
 assert.equal((out.html.match(/max-width:420px/g)||[]).length,2);
 assert.match(out.html,/padding-left:30px;padding-right:35px/);
 assert.match(out.html,/flex-nowrap/);assert.equal((out.html.match(/data-slot="popover-trigger"/g)||[]).length,2);
 for(const density of ['default','compact'])for(const data of [props.data,[],[{id:'x',label:'缺测',first:null,second:null}]]){
  const hidden=capture('PairedDotChart',{...props,density,data,dataDisclosure:'hidden',onSelect(){}}).html;
  assert.doesNotMatch(hidden,/<summary|<details|查看数据/);assert.match(hidden,/class="sr-only" role="region"/);
 }
 for(const maxTrackWidth of [undefined,0,-1,NaN,Infinity])assert.doesNotMatch(capture('PairedDotChart',{...props,maxTrackWidth}).html,/max-width:/);
 assert.doesNotMatch(capture('PairedDotChart',{...props,density:'default'}).html,/max-width:420px/);
});

test('P65 all chart hidden modes retain read-only data even in empty/invalid branches',()=>{
 const cases={TrendChart:{...defaults.TrendChart,series:[],showData:false},ComparisonChart:{label:'空',data:[],variant:'spark'},ScatterChart:{...defaults.ScatterChart,data:[]},QuadrantScatterChart:{...defaults.ScatterChart,data:[]},PairedDotChart:{...defaults.PairedDotChart,data:[]},HeatmapChart:{label:'空',rows:[],columns:[],cells:[]},BoxPlotChart:{label:'空',data:[]},ComboChart:{label:'空',axes:[{id:'a',label:'值'}],categories:[],series:[]},DonutChart:{label:'空',segments:[]},RadarChart:{label:'空',axes:[],series:[]},SegmentedBar:{label:'空',segments:[]}};
 for(const [name,props]of Object.entries(cases)){
  const html=capture(name,{...props,dataDisclosure:'hidden',onSelect(){}}).html;
  assert.doesNotMatch(html,/<summary|<details|查看数据/,name);assert.match(html,/class="sr-only" role="region"/,name);
  assert.doesNotMatch(html.slice(html.indexOf('class="sr-only" role="region"')),/<button/,name);
 }
});
