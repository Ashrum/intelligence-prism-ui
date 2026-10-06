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
return {window,document};
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
    const plotLeft=horizontal?110:45,plotRight=width-(horizontal?39.6:16),plotTop=30,plotBottom=height-36;
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
