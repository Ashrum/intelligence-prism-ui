import test from 'node:test';
import assert from 'node:assert/strict';
import {api,h} from './chart-analysis-harness.mjs';
import {act} from 'react';
import {createRoot} from 'react-dom/client';
// Minimal commit-only DOM, following question-review-render.test.mjs. Recharts is
// real; dimensions are injected. No CSS layout, tick-text measurement or browser QA.
function clientDOM(width,height){
class Element {
 constructor(tag,ownerDocument){this.nodeType=1;this.tagName=tag.toUpperCase();this.nodeName=this.tagName;this.ownerDocument=ownerDocument;this.namespaceURI='http://www.w3.org/1999/xhtml';this.childNodes=[];this.attributes={};this.style={setProperty(key,value){this[key]=value},removeProperty(key){delete this[key]}};this.offsetWidth=width;this.offsetHeight=height}
 appendChild(child){this.childNodes.push(child);child.parentNode=this;return child}
 insertBefore(child,next){this.childNodes.splice(this.childNodes.indexOf(next),0,child);child.parentNode=this;return child}
 removeChild(child){this.childNodes.splice(this.childNodes.indexOf(child),1);child.parentNode=null;return child}
 setAttribute(key,value){this.attributes[key]=String(value)} removeAttribute(key){delete this.attributes[key]}
 setAttributeNS(ns,key,value){this.setAttribute(key,value)} removeAttributeNS(ns,key){this.removeAttribute(key)}
 getAttribute(key){return this.attributes[key]??null}
 getElementsByClassName(){return []}
 addEventListener(){} removeEventListener(){}
 get firstChild(){return this.childNodes[0]??null}
 set textContent(value){this.childNodes=[];this.text=value} get textContent(){return this.text??this.childNodes.map(n=>n.nodeValue??n.textContent).join('')}
 getBoundingClientRect(){return {x:0,y:0,top:0,left:0,right:width,bottom:height,width,height}}
}
const document={nodeType:9,addEventListener(){},removeEventListener(){},createElement(tag){return new Element(tag,this)},createElementNS(ns,tag){const el=this.createElement(tag);el.namespaceURI=ns;return el},createTextNode(text){return {nodeType:3,nodeValue:text,ownerDocument:this}},getElementById(){return null},activeElement:null};
const window={document,HTMLElement:Element,HTMLIFrameElement:class {},addEventListener(){},removeEventListener(){}};
document.defaultView=window;document.documentElement=document.createElement('html');document.body=document.createElement('body');document.activeElement=document.body;
return {window,document,resize(nextWidth,nextHeight){width=nextWidth;height=nextHeight}};
}

test('P20 real Recharts client commit places dashed SVG references in the measured plot',async()=>{
 const previous={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 const errors=[],originalError=console.error;console.error=(...args)=>errors.push(args.join(' '));
 try{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
  for(const width of [320,600])for(const horizontal of [false,true])for(const binned of [false,true]){
   const height=260,{window,document}=clientDOM(width,height);globalThis.window=window;globalThis.document=document;
   const host=document.createElement('div'),client=createRoot(host);
   const data=Array.from({length:10},(_,i)=>({id:String(i),label:String(i),value:i*10,...(binned?{range:[i*10,(i+1)*10]}:{})}));
   const referenceLines=[{value:60,label:'及格线',tone:'warning'},{value:85,label:'优秀线',tone:'success'},{value:90,label:'目标线',tone:'info'},{value:90,label:'同值参考',tone:'neutral'},{value:101,label:'域外忽略'}];
   try{
    await act(()=>client.render(h(api.ComparisonChart,{label:'分布',horizontal,data,domain:[0,100],referenceLines})));
    const lines=[];function walk(n){if(n.attributes?.['data-reference-value'])lines.push(n);n.childNodes?.forEach(walk)}walk(host);
    assert.equal(lines.length,4);
    const left=horizontal?110:45,plotWidth=width-left-16,plotHeight=height-12-30-6;
    const colors=['warning-foreground','success-foreground','info-foreground','muted-foreground'];
    lines.forEach((line,index)=>{
     const a=line.attributes,ratio=referenceLines[index].value/100;
     assert.equal(a['stroke-dasharray'],'3 4');assert.equal(a.stroke,`var(--${colors[index]})`);
     assert.equal(line.childNodes.find(n=>n.tagName==='TITLE').textContent,`${referenceLines[index].label}：${referenceLines[index].value}`);
     if(binned?!horizontal:horizontal){assert.equal(+a.x1,left+ratio*plotWidth);assert.equal(a.x1,a.x2);assert.equal(+a.y1,12);assert.equal(+a.y2,12+plotHeight)}
     else{assert.equal(+a.y1,12+(binned?ratio:1-ratio)*plotHeight);assert.equal(a.y1,a.y2);assert.equal(+a.x1,left);assert.equal(+a.x2,width-16)}
    });
   }finally{await act(()=>client.unmount())}
  }
  assert.deepEqual(errors,[]);
 }finally{console.error=originalError;globalThis.window=previous.window;globalThis.document=previous.document;globalThis.ResizeObserver=previous.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act}
});

test('P21 Fix1 short charts keep every reference text box clear of every bar and value label',async t=>{
 const previous={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 const errors=[],originalError=console.error;console.error=(...args)=>errors.push(args.join(' '));
 const nodes=(host,predicate)=>{const all=[];function walk(n){if(predicate(n))all.push(n);n.childNodes?.forEach(walk)}walk(host);return all};
 const marked=(host,key)=>nodes(host,n=>n.attributes?.[key]!==undefined);
 const textWidth=text=>Array.from(text).reduce((sum,c)=>sum+(/^[\x20-\x7e]$/.test(c)?8:12),0);
 const textBox=(node,reference,horizontal)=>{
  const a=node.attributes,x=+a.x,y=+a.y;
  const rows=reference?node.childNodes.filter(n=>n.tagName==='TSPAN').map(n=>n.textContent):[node.textContent];
  const width=Math.max(...rows.map(textWidth)),left=a['text-anchor']==='end'?x-width:a['text-anchor']==='middle'?x-width/2:x;
  const top=reference?y-12:horizontal?y-9:a['dominant-baseline']==='hanging'?y:y-12;
  return {left,right:left+width,top,bottom:top+rows.length*18};
 };
 const apart=(a,b)=>a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top;
 let pairs=0;
 try{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  globalThis.ResizeObserver=class{constructor(callback){this.callback=callback}observe(node){this.node=node}unobserve(){}disconnect(){}};
  for(const [width,height,horizontal,binned] of [[620,140,false,true],[1078,360,false,true],[620,120,false,true],[620,460,true,true],[620,360,true,false],[620,360,false,false],[620,180,false,true]]){
   const {window,document}=clientDOM(width,height);globalThis.window=window;globalThis.document=document;
   const host=document.createElement('div'),client=createRoot(host);
   const values=[0,2,7,8,7,8,7,8,7,8];
   const data=values.map((v,i)=>({id:String(i),label:String(i),value:binned?v:v*12.5,...(binned?{range:[i*10,(i+1)*10]}:{})}));
   const referenceLines=[{value:40,label:'参考线'},{value:height===180?40:60,label:'及格线'},{value:85,label:'优秀线'}];
   try{
    await act(()=>client.render(h(api.ComparisonChart,{label:'矮图高柱回归',data,domain:[0,binned?8:100],horizontal,height,showValueLabels:true,referenceLabelPlacement:'plot',referenceLines})));
    const references=marked(host,'data-reference-label'),values=marked(host,'data-value-label');
    const bars=nodes(host,n=>n.tagName==='PATH'&&n.attributes?.class?.split(' ').includes('recharts-rectangle'));
    assert.equal(references.length,3,`${width}x${height}: band must fit`);assert.equal(values.length,10);assert.equal(bars.length,9);
    const referenceBoxes=references.map(n=>textBox(n,true,horizontal));
    const valueBoxes=values.map(n=>textBox(n,false,horizontal));
    const barBoxes=bars.map(n=>{const a=n.attributes,x=+a.x,y=+a.y,w=+a.width,h=+a.height;return {left:Math.min(x,x+w),right:Math.max(x,x+w),top:Math.min(y,y+h),bottom:Math.max(y,y+h)}});
    referenceBoxes.forEach((box,i)=>{
     assert.ok(box.left>=0&&box.right<=width&&box.top>=0&&box.bottom<=height);
     [...valueBoxes,...barBoxes,...referenceBoxes.slice(i+1)].forEach(other=>{assert.ok(apart(box,other),JSON.stringify({width,height,horizontal,binned,box,other}));pairs++});
     // A stronger separation invariant also protects maximum-value tick text.
     assert.ok(box.bottom<Math.min(...valueBoxes.map(b=>b.top)));
     assert.ok(box.bottom+6<=Math.min(...barBoxes.map(b=>b.top)));
    });
    const lines=marked(host,'data-reference-value');
    if(binned&&!horizontal)lines.forEach(n=>{assert.equal(+n.attributes.y1,12);assert.equal(+n.attributes.y2,height-36)});
    if(height===180)assert.notEqual(references[0].attributes.y,references[1].attributes.y);
    assert.equal(marked(host,'aria-label').filter(n=>n.attributes['aria-label']==='参考线标签').length,0);
   }finally{await act(()=>client.unmount())}
  }
  assert.deepEqual(errors,[]);t.diagnostic(`${pairs} disjoint-box assertions across 7 actual Recharts commits (including 620x140, 1078x360, 620x120 and horizontal).`);
 }finally{console.error=originalError;globalThis.window=previous.window;globalThis.document=previous.document;globalThis.ResizeObserver=previous.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act}
});

test('P21 Fix1 resizing restores legend on insufficient space and restores band when space returns',async()=>{
 const previous={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 let client;
 try{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const observers=new Set();
  globalThis.ResizeObserver=class{constructor(callback){this.callback=callback}observe(node){this.node=node;observers.add(this)}unobserve(){}disconnect(){observers.delete(this)}};
  const dom=clientDOM(1078,140);globalThis.window=dom.window;globalThis.document=dom.document;
  const host=dom.document.createElement('div');client=createRoot(host);
  const props={label:'尺寸变化',data:Array.from({length:10},(_,i)=>({id:String(i),label:String(i),value:8,range:[i*10,(i+1)*10]})),height:140,horizontal:false,showValueLabels:true,referenceLabelPlacement:'plot',dataDisclosure:'none',referenceLines:[{value:40,label:'参考线'},{value:60,label:'及格线'},{value:85,label:'优秀线'}]};
  const count=key=>{let result=0;function walk(n){if(n.attributes?.[key]!==undefined)result++;n.childNodes?.forEach(walk)}walk(host);return result};
  await act(()=>client.render(h(api.ComparisonChart,props)));
  assert.equal(count('data-reference-label'),3);
  for(const [width,height,expected] of [[320,140,0],[620,140,3],[620,80,0],[620,120,3]]){
   dom.resize(width,height);
   await act(()=>{client.render(h(api.ComparisonChart,{...props,height}));observers.forEach(observer=>observer.callback([{target:observer.node,contentRect:{width,height}}]))});
   assert.equal(count('data-reference-label'),expected,`${width}x${height}`);assert.equal(count('data-reference-value'),3);assert.equal(count('data-value-label'),10);
   const legends=[];function walk(n){if(n.attributes?.['aria-label']==='参考线标签')legends.push(n);n.childNodes?.forEach(walk)}walk(host);
   assert.equal(legends.length,expected?0:1);if(!expected)assert.match(legends[0].textContent,/参考线：40及格线：60优秀线：85/);
   const tables=[];function collect(n){if(n.attributes?.['aria-label']==='参考线数据')tables.push(n);n.childNodes?.forEach(collect)}collect(host);
   assert.equal(tables.length,1);
  }
 }finally{if(client)await act(()=>client.unmount());globalThis.window=previous.window;globalThis.document=previous.document;globalThis.ResizeObserver=previous.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act}
});

test('P21 real Recharts renders optional value and plot labels without changing domain mapping',async()=>{
 const previous={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 const errors=[],originalError=console.error;console.error=(...args)=>errors.push(args.join(' '));
 try{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
  for(const width of [320,600,1280,1440])for(const horizontal of [false,true])for(const binned of [false,true]){
   const height=420,{window,document}=clientDOM(width,height);globalThis.window=window;globalThis.document=document;
   const host=document.createElement('div'),client=createRoot(host);
   const data=Array.from({length:10},(_,i)=>({id:String(i),label:String(i),value:i===9?null:i*10,...(binned?{range:[i*10,(i+1)*10]}:{})}));
   const referenceLines=[{value:20,label:'下界',tone:'warning'},{value:60,label:'参考一',tone:'success'},{value:65,label:'参考二',tone:'info'},{value:100,label:'需要完整保留名称的长中文参考线',tone:'neutral'}];
   const nodes=attribute=>{const all=[];function walk(n){if(n.attributes?.[attribute]!==undefined)all.push(n);n.childNodes?.forEach(walk)}walk(host);return all};
   try{
    const props={label:'分布',unit:'件',horizontal,height,data,domain:[0,100],referenceLines,showValueLabels:true,referenceLabelPlacement:'plot',dataDisclosure:'none'};
    await act(()=>client.render(h(api.ComparisonChart,props)));
    const labels=nodes('data-value-label'),references=nodes('data-reference-label'),lines=nodes('data-reference-value');
    assert.equal(labels.length,9);assert.equal(labels[0].textContent,'0件');assert.equal(labels[8].textContent,'80件');
    assert.equal(references.length,4);assert.equal(lines.length,4);
    if(width<=600)assert.notEqual(references[1].attributes.y,references[2].attributes.y);
    assert.equal(references[3].attributes['text-anchor'],'end');
    references.forEach((node,i)=>assert.equal(node.attributes.fill,lines[i].attributes.stroke));
    // The reserved band ends after the last occupied text row, plus padding;
    // original 30px headroom for value labels remains below it.
    const bandHeight=Math.max(...references.map(n=>+n.attributes.y-12+n.childNodes.filter(c=>c.tagName==='TSPAN').length*18))-12+6;
    const plotLeft=horizontal?110:45,plotRight=width-(horizontal?39.6:16),plotTop=30+bandHeight,plotBottom=height-36;
    lines.forEach((node,i)=>{
     const vertical=binned?!horizontal:horizontal,ratio=referenceLines[i].value/100;
     assert.ok(Math.abs(+(vertical?node.attributes.x1:node.attributes.y1)-(vertical?plotLeft+ratio*(plotRight-plotLeft):plotTop+(binned?ratio:1-ratio)*(plotBottom-plotTop)))<.001);
    });
    labels.forEach(node=>{assert.ok(+node.attributes.x>=0&&+node.attributes.x<=width);assert.ok(+node.attributes.y>=0&&+node.attributes.y<=height)});
    assert.equal(nodes('aria-label').filter(n=>n.attributes['aria-label']==='参考线标签').length,0);
    const seen=[];
    await act(()=>client.render(h(api.ComparisonChart,{...props,valueLabelFormatter:(value,datum)=>{seen.push(datum);return value===0?'':`${datum.label}=${value}`}})));
    assert.equal(nodes('data-value-label').length,8);assert.equal(nodes('data-value-label')[0].textContent,'1=10');assert.ok(seen.includes(data[0]));
    await act(()=>client.render(h(api.ComparisonChart,{...props,referenceLines:[],domain:[-20,100],data:[{id:'zero',label:'零',value:0},{id:'missing',label:'缺测',value:null},{id:'positive',label:'正值',value:42},{id:'negative',label:'负值',value:-20}]})));
    const mixedLabels=nodes('data-value-label');
    assert.deepEqual(mixedLabels.map(n=>[n.attributes['data-value-label'],n.textContent]),[['zero','0件'],['positive','42件'],['negative','-20件']]);
    mixedLabels.forEach(node=>{assert.ok(+node.attributes.x>=0&&+node.attributes.x<=width);assert.ok(+node.attributes.y>=0&&+node.attributes.y<=height)});
    await act(()=>client.render(h(api.ComparisonChart,{...props,showValueLabels:false})));
    assert.equal(nodes('data-value-label').length,0);
   }finally{await act(()=>client.unmount())}
  }
  assert.deepEqual(errors,[]);
 }finally{console.error=originalError;globalThis.window=previous.window;globalThis.document=previous.document;globalThis.ResizeObserver=previous.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act}
});
