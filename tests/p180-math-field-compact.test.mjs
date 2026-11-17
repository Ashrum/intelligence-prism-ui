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
const file = new URL('bundle.mjs', await createTestRuntime('p180'))
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

test('full default and explicit full render byte-identically to main 490e2bf in five themes', async () => {
  const baselineFile = new URL('main.mjs', file)
  writeFileSync(baselineFile, (await build({
    stdin: { contents: "export * from './components/prism-next/math-field'", loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: {'@':root}, loader:{'.css':'empty'}, write:false,
    plugins: [{name:'main',setup(b){b.onLoad({filter:/components\/prism-next\/math-field\.tsx$/},()=>({contents:execFileSync('git',['show','490e2bf3e2c52e94f0988b2f18b05759da97ecc0:components/prism-next/math-field.tsx'],{cwd:root,encoding:'utf8'}),loader:'tsx'}))}}],
  })).outputFiles[0].text)
  const before = await import(baselineFile)
  for (const theme of ['light','paper','dark','blueprint','blueprint-night']) for (const value of ['', 'x^2', String.raw`\frac{1}{`]) for (const autoOpen of [false,true]) {
    const props={label:'公式',value,autoOpen,onChange(){},onConfirm(){},onCancel(){}}
    const render=(Component,extra={})=>renderToStaticMarkup(h('div',{'data-prism-theme':theme},h(Component,{...props,...extra})))
    assert.equal(render(MathField),render(before.MathField))
    assert.equal(render(MathField,{variant:'full'}),render(before.MathField))
  }
})

test('compact mounts immediately, omits full panels and exposes ref insertion at selection with first placeholder selected', async () => {
  const ref=React.createRef(), m=await mounted(false,true,{props:{variant:'compact',virtualKeyboard:'off',ref}})
  try {
    assert.equal(m.loadCalls,1)
    assert.doesNotMatch(content(m.host),/打开公式框|公式模板|撤销|重做|数学键盘|高级|排版预览|展开编辑/)
    assert.match(content(m.host),/Tab 下一格 · → 回到文字/)
    const el=m.element
    el.position=1
    await act(()=>ref.current.insert(String.raw`\frac{#?}{#?}`))
    assert.equal(el.getValue('latex-without-placeholders'),String.raw`x\frac{}{}+1`)
    const [start,end]=el.selection.ranges[0]
    assert.equal(el.harness.model.at(end).type,'placeholder')
    assert.equal(el.harness.model.at(end).parentBranch,'above')
    assert.equal(end-start,1)
    assert.equal(m.calls.at(-1),String.raw`x\frac{}{}+1`)
    document.activeElement=null;ref.current.focus();assert.equal(document.activeElement,el)
    await act(()=>ref.current.executeCommand('moveToNextPlaceholder'))
    assert.equal(el.harness.model.at(el.position).parentBranch,'below')
    await m.render({readOnlyReason:'只读'})
    const previous=el.getValue();await act(()=>ref.current.insert('z'));assert.equal(el.getValue(),previous)
  } finally { await m.cleanup() }
})

test('real MathLive arrow boundaries, last-placeholder Tab and Escape report exit once and confirm compact; IME/read-only gate exits', async () => {
  const exits=[],ref=React.createRef(),m=await mounted(false,true,{props:{variant:'compact',virtualKeyboard:'off',ref,onExit:reason=>exits.push(reason)}})
  try {
    const el=m.element
    el.position=1
    await act(()=>ref.current.executeCommand('moveToNextChar'));assert.deepEqual(exits,[])
    el.position=el.harness.model.lastOffset
    await act(()=>ref.current.executeCommand('moveToNextChar'))
    el.position=0
    await act(()=>ref.current.executeCommand('moveToPreviousChar'))
    await act(()=>send(el,'keydown',{key:'Escape'}))
    await m.render({value:''})
    await act(()=>ref.current.insert(String.raw`\frac{#?}{#?}`))
    await act(()=>ref.current.executeCommand('moveToNextPlaceholder'))
    assert.equal(exits.length,3,'first Tab stays inside the fraction')
    await act(()=>ref.current.executeCommand('moveToNextPlaceholder'))
    assert.deepEqual(exits,['forward','backward','escape','forward'])
    assert.equal(m.calls.filter(v=>v==='confirm').length,4)
    assert.equal(m.calls.includes('cancel'),false)
    await act(()=>send(el,'compositionstart',{data:''}))
    await act(()=>send(el,'keydown',{key:'Escape',isComposing:true}))
    await act(()=>send(el,'move-out',{detail:{direction:'forward'}}))
    assert.equal(exits.length,4)
    await act(()=>send(el,'compositionend',{data:''}))
    await m.render({readOnlyReason:'只读'})
    await act(()=>send(el,'keydown',{key:'Escape'}))
    await act(()=>send(el,'move-out',{detail:{direction:'backward'}}))
    assert.equal(exits.length,4)
  } finally { await m.cleanup() }
})

test('palette search and common grid include Chinese aliases, accessible labels and host slots', async () => {
  const {searchFormulaTools,formulaTools}=await import('../lib/prism-next/math-field-tools.ts')
  for(const [term,label] of [['绝对值','绝对值'],['分数','分数'],['分式','分数'],['根号','根号'],['根式','根号'],['平方','上标'],['LOG','对数'],['sin','正弦'],['cos','余弦'],['tan','正切'],['α','阿尔法'],['β','贝塔'],['θ','西塔'],['π','圆周率']]) {
    assert.ok(searchFormulaTools(term).some(t=>t.label===label),term)
  }
  for(const item of formulaTools) assert.ok(item.aliases && item.latex && item.face && item.label)
  const html=renderToStaticMarkup(h(FormulaPalette,{onInsert(){},footer:h('span',null,'公式原文')}))
  assert.match(html,/常用公式/);assert.match(html,/常用/);assert.match(html,/搜索公式/);assert.match(html,/公式原文/)
  assert.match(html,/aria-label="插入绝对值"/)
  const quick=renderToStaticMarkup(h(FormulaQuickTools,{onInsert(){},trailing:h('span',null,'更多')}))
  assert.equal((quick.match(/<button/g)||[]).length,9);assert.match(quick,/aria-label="插入分数"/);assert.match(quick,/更多/)
})

test('demo opens compact and palette; search arrow navigation and Enter insert into the focused formula', async () => {
  const m=await mounted(false,false,{demo:true})
  try {
    await click(button(m.host,'编辑文中公式'))
    const el=m.element
    await click(button(m.host,'更多'))
    const search=all(m.host).find(n=>n.tagName==='INPUT'&&handlers(n)?.type==='search')
    assert.ok(search)
    await act(()=>handlers(search).onChange({target:{value:'根号'},currentTarget:{value:'根号'},nativeEvent:new Event('change')}))
    const result=all(m.host).find(n=>n.tagName==='BUTTON'&&n.getAttribute?.('aria-label')==='插入根号'&&content(n).includes('根号'))
    assert.ok(result)
    let focused=false; result.focus=()=>{focused=true}
    const key=key=>({key,target:search,currentTarget:search,nativeEvent:{},preventDefault(){},stopPropagation(){}})
    await act(()=>handlers(search).onKeyDown(key('ArrowDown')));assert.equal(focused,true)
    await act(()=>handlers(search).onKeyDown(key('Enter')))
    assert.match(el.getValue(),/\\sqrt/)
    assert.doesNotMatch(content(m.host),/搜索结果/,'host closes palette after insertion')
    await act(()=>send(el,'keydown',{key:'Escape'}))
    assert.match(content(m.host),/走出回调 1 次 · escape/)
  } finally { await m.cleanup() }
})

test('native keyboard only auto-activates for narrow/coarse media, has four pages and releases global configuration', async () => {
  const {attachCompactKeyboard,compactKeyboardLayouts}=await import(file)
  assert.deepEqual(compactKeyboardLayouts.map(p=>p.label),['123','abc','符号','函数'])
  const oldWindow=globalThis.window,oldDocument=globalThis.document
  const media=new EventTarget();media.matches=false
  const keyboard={container:{name:'old'},layouts:['default'],visible:false,show(){this.visible=true},hide(){this.visible=false}}
  const previous={container:keyboard.container,layouts:keyboard.layouts}
  const el=new EventTarget();el.readOnly=false
  globalThis.window={mathVirtualKeyboard:keyboard,matchMedia:query=>{assert.match(query,/pointer: coarse/);assert.match(query,/768px/);return media}}
  globalThis.document={activeElement:el}
  const container={},dispose=attachCompactKeyboard(el,container)
  try {
    assert.equal(keyboard.visible,false)
    media.matches=true;send(media,'change');assert.equal(keyboard.visible,true)
    assert.equal(keyboard.container,container);assert.equal(keyboard.layouts,compactKeyboardLayouts)
    send(el,'blur');assert.equal(keyboard.visible,false);assert.equal(keyboard.container,previous.container)
    send(el,'focus');assert.equal(keyboard.visible,true)
    media.matches=false;send(media,'change');assert.equal(keyboard.visible,false)
    media.matches=true;el.readOnly=true;send(el,'focus');assert.equal(keyboard.visible,false)
  } finally {dispose();globalThis.window=oldWindow;globalThis.document=oldDocument}
  assert.equal(keyboard.container,previous.container);assert.equal(keyboard.layouts,previous.layouts)
})
