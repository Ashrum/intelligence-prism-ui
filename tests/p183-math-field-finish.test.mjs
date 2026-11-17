import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTestRuntime } from './helpers/test-runtime.mjs'
import { clientDOM } from './helpers/chart-client-dom.mjs'
import { modelField, send, ml } from './helpers/mathlive-model.mjs'
import { configureMathFieldRuntime } from '../lib/prism-next/math-field-runtime.ts'
import { previewFormula, draftMathErrorLocation } from '../lib/prism-next/draft-math.ts'
import temml from 'temml'
const root = fileURLToPath(new URL('../', import.meta.url)), h = React.createElement
const file = new URL('bundle.mjs', await createTestRuntime('p183'))
writeFileSync(file, (await build({
  stdin: { contents: "export * from './components/prism-next/math-field'; export * from './components/prism-next/demos/math-field'; export * from './lib/prism-next/math-field-compact';", loader:'tsx', resolveDir:root },
  bundle:true, jsx:'automatic', platform:'node', format:'esm', packages:'external', alias:{'@':root}, loader:{'.css':'empty'}, write:false,
  plugins:[{name:'test-runtime',setup(b){
    b.onResolve({filter:/temml\.mjs\?url$/},()=>({path:'temml-url',namespace:'preview-asset'}))
    b.onLoad({filter:/.*/,namespace:'preview-asset'},()=>({contents:`export default ${JSON.stringify(new URL('../node_modules/temml/dist/temml.mjs',import.meta.url).href)}`}))
    b.onResolve({filter:/math-field-runtime$/},()=>({path:'runtime',namespace:'probe'}))
    b.onLoad({filter:/.*/,namespace:'probe'},()=>({contents:'export const loadMathFieldRuntime=()=>globalThis.__p119Loader(); export const configureMathFieldRuntime=element=>globalThis.__p119Configure(element)'}))
  }}],
})).outputFiles[0].text)
const {MathField, MathFieldDemo, FormulaQuickTools, FormulaPalette} = await import(file)
const read = path => readFileSync(root+path,'utf8')
function all(node){return [node,...(node.childNodes??[]).flatMap(all)]}
const content=node=>node.nodeType===3?node.nodeValue:node.childNodes?.length?node.childNodes.map(content).join(''):node.textContent
const handlers=node=>node?.[Object.keys(node).find(k=>k.startsWith('__reactProps$'))]
function button(host,text){return all(host).find(n=>n.tagName==='BUTTON'&&(n.textContent===text || (['确认','取消'].includes(text) && n.textContent.startsWith(text))))}
const click=async node=>{assert.ok(node);await act(async()=>handlers(node).onClick?.({preventDefault(){},stopPropagation(){},currentTarget:node}))}
async function mounted(fail=false,accept=false,options={}){
  const dom=clientDOM(390,800), saved={}
  for(const key of ['window','document','Element','HTMLElement','Node','IS_REACT_ACT_ENVIRONMENT']){saved[key]=Object.getOwnPropertyDescriptor(globalThis,key)}
  dom.window.matchMedia=()=>Object.assign(new EventTarget(),{matches:false});
  dom.window.Element=dom.window.HTMLElement; dom.window.Node=dom.window.HTMLElement
  dom.window.HTMLElement.prototype.closest=function(){return null}
  dom.window.HTMLElement.prototype.getRootNode=function(){return this.ownerDocument}
  dom.window.HTMLElement.prototype.focus=function(){dom.document.activeElement=this}
  dom.window.HTMLElement.prototype.contains=function(node){return node===this||this.childNodes.some(child=>child===node||child.contains?.(node))}
  dom.window.mathVirtualKeyboard={visible:false,container:dom.document.body,layouts:['default'],update(){},show(){this.visible=true},hide(){this.visible=false}}
  Object.assign(globalThis,{window:dom.window,document:dom.document,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,IS_REACT_ACT_ENVIRONMENT:true})
  // Commit DOM and real model bridge. No geometry, native keyboard or AT claims.
  let loadCalls=0, element
  class FakeMathfield {
    constructor(){
      const el=dom.document.createElement('math-field'), harness=modelField(), bus=new EventTarget()
      for(const name of ['getValue','setValue','insert','executeCommand'])el[name]=harness.field[name]
      Object.defineProperty(el,'selection',{get:()=>harness.field.selection,set:v=>{harness.field.selection=v}})
      Object.defineProperty(el,'lastOffset',{get:()=>harness.model.lastOffset})
      Object.defineProperty(el,'position',{get:()=>harness.model.position,set:value=>{harness.model.position=value}})
      harness.internal.host=el; harness.model.announce=()=>{}
      el.shadowRoot=dom.document.createElement('div');el.focus=()=>{if(options.fault==='focus')throw options.error;dom.document.activeElement=el;send(el,'focus')};el.remove=()=>el.parentNode?.removeChild(el)
      // Use the installed public accessors, including their pre-mount guards.
      // This is a lifecycle-aware bridge, not a real custom-element DOM.
      harness.internal.menu={_menuItems:[],menuItems:[]}
      const receiver={
        get _mathfield(){return el.parentNode?harness.internal:undefined},
        _getOption:key=>harness.internal.options[key],
        _setOptions:values=>Object.assign(harness.internal.options,values),
      }
      for(const name of ['menuItems','inlineShortcuts']){
        const descriptor=Object.getOwnPropertyDescriptor(ml.MathfieldElement.prototype,name)
        Object.defineProperty(el,name,{
          get:()=>descriptor.get.call(receiver),
          set:value=>{if(options.fault===name)throw options.error;descriptor.set.call(receiver,value)},
        })
      }
      // Node EventTarget's boolean remove capture differs from browser DOM;
      // normalize both calls so this bridge preserves DOM listener matching.
      const listenerOptions=options=>typeof options==='boolean'?{capture:options}:options
      el.addEventListener=(type,listener,options)=>bus.addEventListener(type,listener,listenerOptions(options))
      el.removeEventListener=(type,listener,options)=>bus.removeEventListener(type,listener,listenerOptions(options))
      el.dispatchEvent=bus.dispatchEvent.bind(bus)
      el.harness=harness;element=el;return el
    }
  }
  globalThis.__p119Configure=element=>{if(options.fault==='configure')throw options.error;configureMathFieldRuntime(element)}
  globalThis.__p119Loader=()=>{loadCalls++;return fail?Promise.reject(Error('injected import failure')):Promise.resolve(options.pending).then(()=>({MathfieldElement:FakeMathfield,validateLatex:ml.validateLatex,sourceIsValid:value=>!value.trim()||previewFormula(value,temml.renderToString)[0].kind==='math'}))}
  const host=dom.document.createElement('div'), mounted=createRoot(host), calls=[]
  let props={label:'编辑测试',value:'x+1',onChange:value=>{calls.push(value);if(accept){props={...props,value};mounted.render(h(MathField,props))}},onConfirm:()=>calls.push('confirm'),onCancel:()=>calls.push('cancel'),onSplitRequest:cursor=>calls.push(cursor)}
  const render=async extra=>{props={...props,...extra};await act(async()=>mounted.render(options.demo?h(MathFieldDemo):h(MathField,props)))}
  await render(options.props??{})
  return {host,calls,render,dom,get props(){return props},get element(){return element},get loadCalls(){return loadCalls},async cleanup(){await act(()=>mounted.unmount());for(const key of Object.keys(saved)){if(saved[key])Object.defineProperty(globalThis,key,saved[key]);else delete globalThis[key]}}}
}


for (const reason of ['enter','forward','backward','tab','escape','blur']) test(`finish ${reason} captures immediate value before host state and deduplicates blur`, async () => {
  const finished=[], ref=React.createRef()
  const m=await mounted(false,false,{props:{variant:'compact',virtualKeyboard:'off',ref,onFinish:(...args)=>finished.push(args)}})
  try {
    const el=m.element
    el.setValue('z+9',{silenceNotifications:true})
    assert.equal(m.props.value,'x+1');assert.equal(ref.current.getValue(),'z+9')
    await act(()=>{
      send(el,'input')
      if (reason==='forward'||reason==='backward') send(el,'move-out',{detail:{direction:reason}})
      else if(reason==='blur') send(el,'blur',{relatedTarget:m.dom.document.body})
      else send(el,'keydown',{key:{enter:'Enter',tab:'Tab',escape:'Escape'}[reason]})
      send(el,'blur',{relatedTarget:m.dom.document.body})
    })
    assert.equal(finished.length,1);assert.deepEqual(finished[0].slice(0,2),['z+9',reason])
    if(reason==='blur') assert.equal(finished[0][2].relatedTarget,m.dom.document.body)
  } finally {await m.cleanup()}
})
test('Tab skips single-child leap targets, visits real placeholders and Shift+Tab is symmetric',async()=>{
  const finished=[],m=await mounted(false,true,{props:{variant:'compact',virtualKeyboard:'off',value:String.raw`\frac{1}{}`,onFinish:(...args)=>finished.push(args)}})
  try {
    const el=m.element
    el.setValue(String.raw`\frac{\placeholder{}}{\placeholder{}}`,{selectionMode:'placeholder'})
    await act(()=>send(el,'keydown',{key:'Tab'}))
    assert.equal(el.harness.model.at(el.position).parentBranch,'below');assert.equal(finished.length,0)
    await act(()=>send(el,'keydown',{key:'Tab',shiftKey:true}))
    assert.equal(el.harness.model.at(el.position).parentBranch,'above');assert.equal(finished.length,0)
    await act(()=>send(el,'keydown',{key:'Tab',shiftKey:true}))
    assert.equal(finished[0][1],'tab')
    await act(()=>{el.setValue(String.raw`\frac{1}{2}`,{silenceNotifications:true});send(el,'input')})
    const before=structuredClone(el.selection)
    await act(()=>send(el,'keydown',{key:'Tab'}))
    assert.equal(finished.length,2);assert.deepEqual(el.selection,before,'no whole-formula selection')
  }finally{await m.cleanup()}
})
test('internal tool focus is not completion; empty values, IME and read-only gates',async()=>{
  const finished=[],m=await mounted(false,false,{props:{autoOpen:true,onFinish:(...args)=>finished.push(args)}})
  try{
    const el=m.element,tool=button(m.host,'数学键盘')
    await act(()=>send(el,'blur',{relatedTarget:tool}));assert.equal(finished.length,0)
    const virtualKey=m.dom.document.createElement('button')
    virtualKey.closest=selector=>selector==='.ML__keyboard'?virtualKey:null
    await act(()=>send(el,'blur',{relatedTarget:virtualKey}));assert.equal(finished.length,0)
    await act(()=>send(el,'keydown',{key:'Enter',shiftKey:true}));assert.equal(finished.length,0)
    await act(()=>send(el,'compositionstart',{data:''}))
    await act(()=>send(el,'keydown',{key:'Enter',isComposing:true}))
    await act(()=>send(el,'blur'));assert.equal(finished.length,0)
    await act(()=>send(el,'compositionend',{data:''}))
    await m.render({readOnlyReason:'只读'})
    await act(()=>send(el,'keydown',{key:'Enter'}));assert.equal(finished.length,0)
    await m.render({readOnlyReason:undefined})
    el.setValue('',{silenceNotifications:true})
    await click(button(m.host,'确认'))
    assert.deepEqual(finished[0].slice(0,2),['','enter'])
  }finally{await m.cleanup()}
})
test('without onFinish plain Enter and blur remain inert; legacy compact Escape confirms and exits',async()=>{
  const exits=[],m=await mounted(false,false,{props:{variant:'compact',virtualKeyboard:'off',onExit:r=>exits.push(r)}})
  try{
    await act(()=>send(m.element,'keydown',{key:'Enter'}));await act(()=>send(m.element,'blur'))
    assert.deepEqual(m.calls,[]);assert.deepEqual(exits,[])
    await act(()=>send(m.element,'keydown',{key:'Escape'}))
    assert.deepEqual(m.calls,['confirm']);assert.deepEqual(exits,['escape'])
  }finally{await m.cleanup()}
})
