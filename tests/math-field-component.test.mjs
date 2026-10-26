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
const file = new URL('bundle.mjs', await createTestRuntime('p119'))
writeFileSync(file, (await build({
  stdin: { contents: "export * from './components/prism-next/math-field'; export * from './components/prism-next/demos/math-field';", loader:'tsx', resolveDir:root },
  bundle:true, jsx:'automatic', platform:'node', format:'esm', packages:'external', alias:{'@':root}, loader:{'.css':'empty'}, write:false,
  plugins:[{name:'test-runtime',setup(b){
    b.onResolve({filter:/temml\.mjs\?url$/},()=>({path:'temml-url',namespace:'preview-asset'}))
    b.onLoad({filter:/.*/,namespace:'preview-asset'},()=>({contents:`export default ${JSON.stringify(new URL('../node_modules/temml/dist/temml.mjs',import.meta.url).href)}`}))
    b.onResolve({filter:/math-field-runtime$/},()=>({path:'runtime',namespace:'probe'}))
    b.onLoad({filter:/.*/,namespace:'probe'},()=>({contents:'export const loadMathFieldRuntime=()=>globalThis.__p119Loader(); export const configureMathFieldRuntime=element=>globalThis.__p119Configure(element)'}))
  }}],
})).outputFiles[0].text)
const {MathField, MathFieldDemo} = await import(file)
const read = path => readFileSync(root+path,'utf8')
const themes=['light','paper','dark','blueprint','blueprint-night']
test('SSR in five theme roots has a fixed label, raw preview, closed advanced field and no MathLive load', () => {
  let calls=0;globalThis.__p119Loader=()=>{calls++;throw Error('SSR import forbidden')}
  for(const theme of themes){
    const html=renderToStaticMarkup(h('div',{'data-prism-theme':theme},h(MathField,{label:'公式编辑',value:'x^2',onChange(){}})))
    assert.match(html,/公式编辑/);assert.match(html,/打开公式框/);assert.match(html,/x\^2/)
    assert.doesNotMatch(html,/<math-field|数学虚拟键盘|<details open/u)
  }
  assert.equal(calls,0)
})
function all(node){return [node,...(node.childNodes??[]).flatMap(all)]}
const content=node=>node.nodeType===3?node.nodeValue:node.childNodes?.length?node.childNodes.map(content).join(''):node.textContent
const handlers=node=>node?.[Object.keys(node).find(k=>k.startsWith('__reactProps$'))]
function button(host,text){return all(host).find(n=>n.tagName==='BUTTON'&&n.textContent===text)}
const click=async node=>{assert.ok(node);await act(async()=>handlers(node).onClick?.({preventDefault(){},stopPropagation(){},currentTarget:node}))}
async function mounted(fail=false,accept=false,options={}){
  const dom=clientDOM(390,800), saved={}
  for(const key of ['window','document','IS_REACT_ACT_ENVIRONMENT']){saved[key]=Object.getOwnPropertyDescriptor(globalThis,key)}
  dom.window.mathVirtualKeyboard={visible:false,update(){}}
  Object.assign(globalThis,{window:dom.window,document:dom.document,IS_REACT_ACT_ENVIRONMENT:true})
  // Commit DOM and real model bridge. No geometry, native keyboard or AT claims.
  let loadCalls=0, element
  class FakeMathfield {
    constructor(){
      const el=dom.document.createElement('math-field'), harness=modelField(), bus=new EventTarget()
      for(const name of ['getValue','setValue','insert','executeCommand'])el[name]=harness.field[name]
      Object.defineProperty(el,'selection',{get:()=>harness.field.selection,set:v=>{harness.field.selection=v}})
      Object.defineProperty(el,'position',{get:()=>harness.model.position})
      el.shadowRoot=dom.document.createElement('div');el.focus=()=>{if(options.fault==='focus')throw options.error;dom.document.activeElement=el};el.remove=()=>el.parentNode?.removeChild(el)
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
  return {host,calls,render,get element(){return element},get loadCalls(){return loadCalls},async cleanup(){await act(()=>mounted.unmount());for(const key of Object.keys(saved)){if(saved[key])Object.defineProperty(globalThis,key,saved[key]);else delete globalThis[key]}}}
}
test('client lifecycle: deferred load, source synchronization, IME held writes, keyboard/confirm/cancel, read-only, split and cleanup',async()=>{
  const m=await mounted()
  try{
    assert.equal(m.loadCalls,0)
    await click(button(m.host,'打开公式框'))
    assert.equal(m.loadCalls,1);assert.ok(m.element);assert.equal(m.element.getValue(),'x+1')
    assert.equal(m.element.getAttribute('aria-label'),'编辑测试')
    assert.match(content(m.element.shadowRoot),/prefers-reduced-motion: reduce/u)
    assert.match(content(m.element.shadowRoot),/\*::before, \*::after/u)
    await act(()=>send(m.element,'compositionstart',{data:''}))
    await m.render({value:'z+2'})
    assert.equal(m.element.getValue(),'x+1','controlled writes suspended during IME')
    await act(()=>send(m.element,'keydown',{key:'Enter',metaKey:true,isComposing:true}))
    assert.equal(m.calls.length,0)
    await act(()=>send(m.element,'compositionend',{data:'中文'}))
    assert.deepEqual(m.calls,[String.raw`x+1\text{中文}`])
    assert.equal(m.element.getValue(),'z+2','host rejection restores the authoritative value after composition')
    await m.render({value:String.raw`x+1\text{中文}`})
    await act(()=>send(m.element,'keydown',{key:'Enter',metaKey:true}))
    await act(()=>send(m.element,'keydown',{key:'Escape'}))
    assert.deepEqual(m.calls.slice(-2),['confirm','cancel'])
    await click(button(m.host,'数学键盘'))
    assert.ok(all(m.host).some(n=>n.getAttribute?.('aria-label')==='数学虚拟键盘'))
    await click(button(m.host,'学科'));await m.render({subject:'chemistry'})
    assert.ok(all(m.host).some(n=>n.getAttribute?.('aria-label')==='插入化学方程式'))
    await click(button(m.host,'在光标处拆开'))
    assert.equal(typeof m.calls.at(-1).position,'number');assert.ok(m.calls.at(-1).selection.ranges)
    await m.render({value:'\\frac{1}{2x^{2}'})
    assert.ok(content(m.host).includes('公式原文有误'))
    assert.equal(m.element.readOnly,true)
    await m.render({value:'a+b',readOnlyReason:'正在复核，暂只读'})
    assert.equal(m.element.getValue(),'a+b');assert.equal(m.element.readOnly,true)
    assert.ok(content(m.host).includes('正在复核，暂只读'))
    const before=m.calls.length
    await act(()=>send(m.element,'keydown',{key:'Enter',ctrlKey:true}))
    assert.equal(m.calls.length,before)
    assert.ok(m.element.getAttribute('aria-describedby').includes('description'))
  }finally{await m.cleanup()}
})
test('import rejection leaves the raw source editable and confirmable without retry loops',async()=>{
  const m=await mounted(true)
  try{
    await click(button(m.host,'打开公式框'))
    assert.ok(content(m.host).includes('公式框暂不可用'), content(m.host))
    const area=all(m.host).find(n=>n.tagName==='TEXTAREA')
    assert.ok(area);assert.equal(handlers(area).readOnly,false)
    await act(()=>handlers(area).onChange({target:{value:'x+9'},currentTarget:{value:'x+9'},nativeEvent:new Event('change')}))
    assert.equal(m.calls.at(-1),'x+9')
    await m.render({value:'x+9'})
    await click(button(m.host,'确认'))
    assert.equal(m.calls.at(-1),'confirm');assert.equal(m.loadCalls,1)
  }finally{await m.cleanup()}
})
test('offline configuration, same-origin byte-identical fonts and unchanged existing stylesheet boundaries',()=>{
  const fake={};let calls=0;const saved=globalThis.fetch
  globalThis.fetch=()=>{calls++;throw Error('network blocked')}
  try{configureMathFieldRuntime(fake);assert.equal(fake.fontsDirectory,'/mathlive/fonts');assert.equal(fake.soundsDirectory,null);assert.equal(fake.computeEngine,null);fake.speakHook('x');fake.readAloudHook(null,'x');assert.equal(calls,0)}finally{globalThis.fetch=saved}
  const names=readdirSync(root+'public/mathlive/fonts')
  assert.equal(names.length,20)
  for(const name of names)assert.deepEqual(readFileSync(root+'public/mathlive/fonts/'+name),readFileSync(root+'node_modules/mathlive/fonts/'+name))
  const css=read('components/prism-next/math-field.css')
  assert.ok(css.startsWith('/* P119'));assert.doesNotMatch(css,/https?:|#[a-fA-F0-9]{3,8}\b|@font-face/u)
  assert.match(css,/grid-template-columns: repeat\(7, minmax\(0, 1fr\)\); gap: 0\.25rem/u)
  assert.match(css,/\.prism-math-key \{ min-height: 44px; padding-inline: 0;/u)
  assert.match(css,/\.prism-math-key::after \{ min-width: 0;/u)
  for(const token of ['foreground','background','input','accent','accent-foreground','ring','muted-foreground'])assert.ok(css.includes(`var(--${token})`))
})
test('raw syntax error location comes from Temml and is passed to source focus without source rewriting',()=>{
  const value=String.raw`\frac{1}{2x^{2}`,part=previewFormula(value,temml.renderToString)[0]
  assert.equal(part.kind,'error');assert.equal(typeof part.position,'number')
  const loc=draftMathErrorLocation(value,part.position);assert.ok(loc)
  assert.match(read('components/prism-next/math-field.tsx'),/setSelectionRange\(location.start, location.end\)/u)
})

test('accepted controlled edits survive reconciliation on the same mounted field',async()=>{
 const m=await mounted(false,true)
 try{
  await click(button(m.host,'打开公式框'))
  const element=m.element
  await click(button(m.host,'分式'))
  assert.equal(m.element,element)
  assert.equal(m.element.getValue('latex-without-placeholders'),m.calls.at(-1))
  assert.ok(m.calls.at(-1).includes('\\frac{}{}'))
 }finally{await m.cleanup()}
})


test('D1: installed MathLive accessors reject menu/shortcut access before mounting',()=>{
  for(const name of ['menuItems','inlineShortcuts']){
    const descriptor=Object.getOwnPropertyDescriptor(ml.MathfieldElement.prototype,name)
    assert.throws(()=>descriptor.get.call({}),/Mathfield not mounted/)
    assert.throws(()=>descriptor.set.call({},name==='menuItems'?[]:{}),/Mathfield not mounted/)
  }
})

test('D1: every authored demo opens, including the read-only and invalid-source examples',async()=>{
  const m=await mounted(false,false,{demo:true})
  try{
    const openers=all(m.host).filter(n=>n.tagName==='BUTTON'&&n.textContent==='打开公式框')
    // Seven existing examples remain manual; the appended P120 example auto-opens.
    assert.equal(openers.length,7)
    for(const opener of openers){assert.equal(Boolean(handlers(opener).disabled),false);await click(opener)}
    const fields=all(m.host).filter(n=>n.tagName==='MATH-FIELD')
    assert.equal(fields.length,8)
    assert.equal(fields.filter(n=>n.readOnly).length,2)
    assert.ok(fields.every(n=>n.menuItems.length===0&&n.inlineShortcuts.sqrt))
    assert.doesNotMatch(content(m.host),/公式框暂不可用|公式框初始化出错|正在准备公式框/)
    assert.match(content(m.host),/公式原文有误/)
  }finally{await m.cleanup()}
})

for(const fault of ['configure','menuItems','focus'])test(`D1: ${fault} initialization error is reported separately and partial setup is disposed`,async()=>{
  const error=new Error(`injected ${fault} initialization bug`), errors=[],original=console.error
  console.error=(...args)=>errors.push(args)
  const m=await mounted(false,false,{fault,error})
  try{
    await click(button(m.host,'打开公式框'))
    assert.match(content(m.host),/公式框初始化出错/)
    assert.doesNotMatch(content(m.host),/公式框暂不可用|正在准备公式框/)
    assert.equal(errors.length,1);assert.equal(errors[0][1],error)
    assert.equal(all(m.host).filter(n=>n.tagName==='MATH-FIELD').length,0)
    if(m.element){
      assert.equal(m.element.parentNode,null)
      await act(()=>send(m.element,'keydown',{key:'Enter',metaKey:true}))
    }
    assert.deepEqual(m.calls,[],'partially attached callbacks were removed')
    const area=all(m.host).find(n=>n.tagName==='TEXTAREA')
    assert.equal(handlers(area).readOnly,false)
    assert.equal(handlers(all(m.host).find(n=>n.tagName==='DETAILS')).open,true)
    await click(button(m.host,'确认'));assert.equal(m.calls.at(-1),'confirm')
    assert.equal(m.loadCalls,1)
  }finally{await m.cleanup();console.error=original}
})

test('SHEET 08 keyboard uses four ordered symbol rows and Chinese accessible names; all pages retain insertion and commands', async () => {
  const m=await mounted(false,true)
  const keyboard=()=>all(m.host).find(n=>n.getAttribute?.('aria-label')==='数学虚拟键盘')
  const grid=()=>all(keyboard()).find(n=>n.getAttribute?.('class')==='prism-math-keyboard-grid')
  const keys=()=>all(grid()).filter(n=>n.tagName==='BUTTON')
  const faces=()=>keys().map(content)
  try {
    await click(button(m.host,'打开公式框'));await click(button(m.host,'数学键盘'))
    assert.deepEqual(faces(), '7 8 9 ÷ ▭/▭ x² √ 4 5 6 × ( ) π 1 2 3 − ≤ ≥ ⌫ 0 . x + = ← →'.split(' '))
    assert.deepEqual(keys().map(n=>n.getAttribute('aria-label')), [
      '数字 7','数字 8','数字 9','除','分式','上标','根式',
      '数字 4','数字 5','数字 6','乘','左括号','右括号','派',
      '数字 1','数字 2','数字 3','减','小于等于','大于等于','退格',
      '数字 0','小数点','字母 x','加','等于','上一个空格','下一个空格',
    ])
    const inserts=[],commands=[], originalInsert=m.element.insert, originalCommand=m.element.executeCommand
    m.element.insert=(value,options)=>{inserts.push([value,options]);return originalInsert(value,options)}
    m.element.executeCommand=command=>{commands.push(command);return originalCommand(command)}
    for(const face of ['÷','▭/▭','x²','√','×','(',')','π','−','≤','≥','.'])await click(button(grid(),face))
    assert.deepEqual(inserts.map(([value])=>value), [String.raw`\div`,String.raw`\frac{#?}{#?}`,'^{#?}',String.raw`\sqrt{#?}`,String.raw`\times`,'(',')',String.raw`\pi`,'-',String.raw`\le`,String.raw`\ge`,'.'])
    assert.ok(inserts.every(([,options])=>options.selectionMode==='placeholder'))
    await click(button(grid(),'⌫'))
    // Keep both navigation targets inside the model: leaving the field needs
    // browser document tab order, which this commit/model bridge does not own.
    await m.render({value:String.raw`\frac{}{}`})
    await click(button(grid(),'→'));await click(button(grid(),'←'))
    assert.deepEqual(commands,['deleteBackward','moveToNextPlaceholder','moveToPreviousPlaceholder'])
    for(const [page,expected] of [
      ['字母',Array.from('abcdefghijklmnopqrstuvwxyz')],
      ['符号',['≤','≥','≠','≈','±','×','÷']],
      ['希腊',['α','β','θ','π','γ','Δ']],
      ['学科',['∈','∉','⊂','∪','∩','ℝ','|x|','ⁿ√']],
    ]) {
      await click(button(keyboard(),page));assert.deepEqual(faces(),expected)
      assert.ok(keys().every(n=>/[\u4e00-\u9fff]/u.test(n.getAttribute('aria-label'))))
      assert.ok(keys().every(n=>!/[\u4e00-\u9fff]/u.test(content(n))))
      for(const face of ['⌫','←','→'])assert.ok(button(keyboard(),face))
    }
    await m.render({subject:'physics'});assert.deepEqual(faces(),['x⃗','m/s','N','m/s²'])
    assert.equal(handlers(button(grid(),'m/s²')).style.gridColumn,'span 2')
    await m.render({subject:'chemistry'});assert.deepEqual(faces(),['H₂O','→','⇌','2H₂+O₂→2H₂O'])
    assert.equal(handlers(button(grid(),'2H₂+O₂→2H₂O')).style.gridColumn,'span 4')
    assert.equal(button(grid(),'2H₂+O₂→2H₂O').getAttribute('aria-label'),'化学方程式')
    await click(button(keyboard(),'⌄'));assert.equal(keyboard(),undefined)
  } finally { await m.cleanup() }
})

test('description always follows authoritative source and never requests English spoken-text', async () => {
  const m=await mounted()
  const description=()=>all(m.host).find(n=>n.getAttribute?.('id')?.endsWith('-description'))
  try {
    assert.equal(content(description()),'当前公式原文：x+1')
    await click(button(m.host,'打开公式框'))
    assert.equal(content(description()),'当前公式原文：x+1')
    const original=m.element.getValue
    m.element.getValue=(format)=>{assert.notEqual(format,'spoken-text');return original(format)}
    await click(button(m.host,'分式'))
    assert.equal(content(description()),'当前公式原文：x+1','host rejected edit must not be described')
    for(const value of [String.raw`x+1\text{中文}`,String.raw`\frac{1}{`,String.raw`\ce{H2O}`,'']) {
      await m.render({value});assert.equal(content(description()),`当前公式原文：${value || '空'}`)
    }
    assert.doesNotMatch(read('components/prism-next/math-field.tsx'),/spoken-text/u)
  } finally { await m.cleanup() }
})

for (const autoOpen of [undefined, false, true]) test(`P120 SSR: autoOpen=${autoOpen} never loads MathLive`, () => {
  let calls=0;globalThis.__p119Loader=()=>{calls++;throw Error('SSR import forbidden')}
  const html=renderToStaticMarkup(h(MathField,{label:'空公式',value:'',onChange(){},autoOpen}))
  assert.equal(calls,0)
  assert.match(html,autoOpen?/正在准备公式框/:/打开公式框/)
  assert.doesNotMatch(html,/公式内容为空|暂无法确定具体位置|仅预览排版/)
  assert.match(html,/当前公式原文：空/)
})

test('P120 autoOpen: loading, focus, one load across rerenders and no implicit open on a later prop change',async()=>{
  let resolve
  const pending=new Promise(done=>{resolve=done})
  const m=await mounted(false,false,{pending,props:{autoOpen:true,value:''}})
  try {
    assert.equal(m.loadCalls,1);assert.match(content(m.host),/正在准备公式框/)
    assert.equal(button(m.host,'打开公式框'),undefined)
    await act(async()=>resolve())
    assert.ok(m.element);assert.equal(document.activeElement,m.element)
    assert.equal(m.element.getValue(),'')
    await m.render({value:'z',autoOpen:false});assert.equal(m.loadCalls,1)
  }finally{await m.cleanup()}
  const manual=await mounted()
  try {
    await manual.render({autoOpen:true})
    assert.equal(manual.loadCalls,0);assert.ok(button(manual.host,'打开公式框'))
    await click(button(manual.host,'打开公式框'))
    assert.equal(document.activeElement,manual.element)
  }finally{await manual.cleanup()}
})

test('P120 autoOpen import rejection retains raw editing, confirmation and no retry loop',async()=>{
  const m=await mounted(true,true,{props:{autoOpen:true,value:''}})
  try {
    assert.match(content(m.host),/公式框暂不可用/)
    assert.doesNotMatch(content(m.host),/公式内容为空|暂无法确定具体位置/)
    const area=all(m.host).find(n=>n.tagName==='TEXTAREA')
    await act(()=>handlers(area).onChange({target:{value:'x+2'},currentTarget:{value:'x+2'},nativeEvent:new Event('change')}))
    await click(button(m.host,'确认'))
    assert.deepEqual(m.calls,['x+2','confirm']);assert.equal(m.loadCalls,1)
  }finally{await m.cleanup()}
})

for(const path of ['button','visual-meta','visual-ctrl','source-meta','source-ctrl'])test(`P120 empty feedback follows explicit confirmation via ${path} and resets on edits`,async()=>{
  const m=await mounted(false,true,{props:{autoOpen:true,value:' \n '}})
  try {
    assert.doesNotMatch(content(m.host),/公式内容为空|暂无法确定具体位置|仅预览排版/)
    assert.match(content(m.host),/输入内容后，在这里查看排版/)
    const area=all(m.host).find(n=>n.tagName==='TEXTAREA')
    if(path==='button')await click(button(m.host,'确认'))
    else {
      const event={key:'Enter',metaKey:path.endsWith('meta'),ctrlKey:path.endsWith('ctrl')}
      if(path.startsWith('visual'))await act(()=>send(m.element,'keydown',event))
      else await act(()=>handlers(area).onKeyDown({...event,target:area,currentTarget:area,nativeEvent:{},preventDefault(){},stopPropagation(){}} ))
    }
    assert.match(content(m.host),/公式内容为空，请补充表达式/)
    assert.equal(m.calls.at(-1),'confirm','confirmation remains an intent for the host')
    await m.render({value:'x+1'});await m.render({value:''})
    assert.doesNotMatch(content(m.host),/公式内容为空|暂无法确定具体位置/)
    await click(button(m.host,'确认'));assert.match(content(m.host),/公式内容为空/)
    await act(()=>handlers(area).onChange({target:{value:' '},currentTarget:{value:' '},nativeEvent:new Event('change')}))
    assert.doesNotMatch(content(m.host),/公式内容为空|暂无法确定具体位置/)
  }finally{await m.cleanup()}
})

test('P120 autoOpen respects read-only and both composition gates before reporting empty confirmation',async()=>{
  const m=await mounted(false,false,{props:{autoOpen:true,value:'',readOnlyReason:'只供查看'}})
  try {
    assert.equal(m.element.readOnly,true);assert.notEqual(document.activeElement,m.element)
    await act(()=>send(m.element,'keydown',{key:'Enter',metaKey:true}))
    assert.deepEqual(m.calls,[]);assert.doesNotMatch(content(m.host),/公式内容为空/)
    await m.render({readOnlyReason:undefined})
    await act(()=>send(m.element,'compositionstart',{data:''}))
    await act(()=>send(m.element,'keydown',{key:'Enter',ctrlKey:true,isComposing:true}))
    await click(button(m.host,'确认'))
    assert.deepEqual(m.calls,[]);assert.doesNotMatch(content(m.host),/公式内容为空/)
    await act(()=>send(m.element,'compositionend',{data:''}))
    const area=all(m.host).find(n=>n.tagName==='TEXTAREA')
    await act(()=>handlers(area).onCompositionStart())
    await act(()=>handlers(area).onKeyDown({key:'Enter',metaKey:true,target:area,currentTarget:area,nativeEvent:{isComposing:true}}))
    await click(button(m.host,'确认'))
    assert.deepEqual(m.calls,[]);assert.doesNotMatch(content(m.host),/公式内容为空/)
    await act(()=>handlers(area).onCompositionEnd({currentTarget:{value:''}}))
    await click(button(m.host,'确认'));assert.match(content(m.host),/公式内容为空/)
  }finally{await m.cleanup()}
})

test('P120 nonempty error uses real Temml feedback and unchanged UTF-16 focus/selection',async()=>{
  const value=String.raw`\frac{1}{2x^{2}`,part=previewFormula(value,temml.renderToString)[0]
  const location=draftMathErrorLocation(value,part.position)
  const m=await mounted(false,false,{props:{autoOpen:true,value}})
  try {
    assert.ok(content(m.host).includes(part.message))
    assert.ok(content(m.host).includes(`第 ${location.line} 行，第 ${location.column} 列`))
    const area=all(m.host).find(n=>n.tagName==='TEXTAREA');let selection
    area.focus=()=>{document.activeElement=area}
    area.setSelectionRange=(...args)=>{selection=args}
    await click(button(m.host,'定位到原文'))
    assert.equal(document.activeElement,area);assert.deepEqual(selection,[location.start,location.end])
    assert.equal(handlers(area).value,value);assert.deepEqual(m.calls,[])
    assert.doesNotMatch(content(m.host),/仅预览排版/)
  }finally{await m.cleanup()}
})

test('P120 default SSR and seven existing demo fields match e1e8aa4 except the explicitly removed preview notice',async()=>{
  const baseline='e1e8aa46fbcd2d61db1f8cfcde737e36bd00f702'
  const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{cwd:root,encoding:'utf8'})
  const baselineFile=new URL('baseline.mjs',file)
  writeFileSync(baselineFile,(await build({
    stdin:{contents:"export * from './components/prism-next/math-field'; export * from './components/prism-next/demos/math-field';",loader:'tsx',resolveDir:root},
    bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false,
    plugins:[{name:'baseline',setup(b){
      b.onLoad({filter:/components\/prism-next\/(?:demos\/)?math-field\.tsx$/},args=>({contents:old(args.path.slice(root.length)),loader:'tsx'}))
    }}],
  })).outputFiles[0].text)
  const before=await import(baselineFile)
  const stripNotice=html=>html.replace('<p class="text-ui-hint text-muted-foreground">仅预览排版，不校验数学结论。未识别内容按原文显示。</p>','')
  for(const theme of themes)for(const value of ['', 'x^2',String.raw`\frac{1}{`]) {
    const props={label:'公式',value,onChange(){}}
    const render=Component=>renderToStaticMarkup(h('div',{'data-prism-theme':theme},h(Component,props)))
    assert.equal(render(MathField),stripNotice(render(before.MathField)))
    assert.equal(renderToStaticMarkup(h(MathField,{...props,autoOpen:false})),renderToStaticMarkup(h(MathField,props)))
  }
  // Capture each full field including its nested preview section, excluding new demo content.
  const fields=html=>[...html.matchAll(/<section class="prism-math-field[\s\S]*?<\/section>[\s\S]*?<\/section>/g)].map(match=>stripNotice(match[0]).replace(/_R_[a-z0-9]+_/g,'_REACT_ID_'))
  const previous=fields(renderToStaticMarkup(h(before.MathFieldDemo)))
  const current=fields(renderToStaticMarkup(h(MathFieldDemo)))
  assert.equal(previous.length,7);assert.equal(current.length,8)
  assert.deepEqual(current.slice(0,7),previous)
})
