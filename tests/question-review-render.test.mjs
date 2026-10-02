import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {reviewQuestions,answersForQuestion} from '../examples/question-review/fixture.ts';
import {answerHeight,PAPER_WIDTH} from '../examples/question-review/artwork.ts';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=new URL('../.sites-runtime/q5-test/canvas.mjs',import.meta.url);
await mkdir(new URL('.',out),{recursive:true});
const result=await build({stdin:{contents:"export {QuestionPaperCanvas} from './examples/question-review/question-paper-canvas'",resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false,plugins:[{name:'canvas-dimensions-only',setup(b){b.onLoad({filter:/document-region-viewer\.tsx$/},()=>({loader:'tsx',contents:'export const DocumentRegionViewer=({pageLayout,background}:any)=><div data-viewer style={pageLayout}>{background}</div>'}))}}]});
await writeFile(out,result.outputFiles[0].text);const {QuestionPaperCanvas}=await import(out);await rm(out);

// Minimal in-memory DOM for React's client commit. It deliberately retains invalid
// style assignments that a browser CSS parser might discard. No browser/layout emulation.
function clientDOM(){
 const styles=[];
 class Element {
  constructor(tag,ownerDocument){this.nodeType=1;this.tagName=tag.toUpperCase();this.nodeName=this.tagName;this.ownerDocument=ownerDocument;this.namespaceURI='http://www.w3.org/1999/xhtml';this.childNodes=[];this.attributes={};this.style=new Proxy({setProperty(key,value){this[key]=value}}, {set(target,key,value){styles.push([key,value]);target[key]=value;return true}})}
  appendChild(child){this.childNodes.push(child);child.parentNode=this;return child}
  insertBefore(child,next){this.childNodes.splice(this.childNodes.indexOf(next),0,child);child.parentNode=this;return child}
  removeChild(child){this.childNodes.splice(this.childNodes.indexOf(child),1);child.parentNode=null;return child}
  setAttribute(key,value){this.attributes[key]=String(value)}
  removeAttribute(key){delete this.attributes[key]}
  addEventListener(){} removeEventListener(){}
  get firstChild(){return this.childNodes[0]??null}
  set textContent(value){this.childNodes=[];this.text=value}
  get textContent(){return this.text??''}
 }
 const document={nodeType:9,addEventListener(){},removeEventListener(){},createElement(tag){return new Element(tag,this)},createElementNS(ns,tag){return this.createElement(tag)},createTextNode(text){return {nodeType:3,nodeValue:text,ownerDocument:this}},activeElement:null};
 const window={document,HTMLElement:Element,HTMLIFrameElement:class {}};document.defaultView=window;document.documentElement=document.createElement('html');document.body=document.createElement('body');document.activeElement=document.body;
 return {window,document,styles};
}
function propsFor(q,pages){return {pages:pages??[{id:'question',width:794,height:1,content:React.createElement('article',{'data-digital-question':true},q.record.title)},...answersForQuestion(q).map(a=>({id:a.student.id,width:PAPER_WIDTH,height:answerHeight(q)}))],zoom:'width',rotations:{},headers:{},selected:'question',activePage:'question',scale:1,topInset:68,viewportRef:()=>{},onSelect(){},onZoom(){},onVisiblePage(){},onViewport(){}}}
const assertFiniteStyles=html=>{for(const [,style] of html.matchAll(/style="([^"]*)"/g))assert.doesNotMatch(style,/NaN|Infinity/)};
test('Q5 canvas SSR and initial React client commit never assign non-finite inline sizes',async()=>{
 const env=clientDOM(),previous={window:globalThis.window,document:globalThis.document,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 globalThis.window=env.window;globalThis.document=env.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const errors=[],oldError=console.error;console.error=(...args)=>errors.push(args.join(' '));
 try{
  const cases=reviewQuestions.map(q=>propsFor(q));
  cases.push(propsFor(reviewQuestions[16],[]));
  for(const width of [undefined,NaN,Infinity,0])cases.push(propsFor(reviewQuestions[16],[{id:'not-measured',width,height:NaN}]));
  for(const props of cases){
   assertFiniteStyles(renderToStaticMarkup(React.createElement(QuestionPaperCanvas,props)));
   const client=createRoot(env.document.createElement('div'));
   try{await act(()=>client.render(React.createElement(QuestionPaperCanvas,props)))}finally{await act(()=>client.unmount())}
  }
  assert.ok(env.styles.some(([name,value])=>name==='width'&&value));
  for(const [name,value] of env.styles)assert.doesNotMatch(String(value),/NaN|Infinity/,`${name}=${value}`);
  assert.deepEqual(errors,[]);
 }finally{console.error=oldError;globalThis.window=previous.window;globalThis.document=previous.document;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act}
});
