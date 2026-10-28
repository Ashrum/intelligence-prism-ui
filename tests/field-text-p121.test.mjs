import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import postcss from 'postcss'
import { transform } from 'lightningcss'
import { fieldLayoutViolations, scanFieldLayouts, fieldSourceFiles } from './helpers/field-layout-guard.mjs'
import { createTestRuntime } from './helpers/test-runtime.mjs'
import { clientDOM } from './helpers/chart-client-dom.mjs'
const root=fileURLToPath(new URL('../',import.meta.url)), read=p=>readFileSync(root+p,'utf8')
const baseline='2eb5c01d4f0678b0457bd57f44604569cfea9cd6', before=p=>execFileSync('git',['show',`${baseline}:${p}`],{cwd:root,encoding:'utf8'})
const h=React.createElement, themes=['light','paper','dark','blueprint','blueprint-night']
const file=new URL('bundle.mjs',await createTestRuntime('p121'))
writeFileSync(file,(await build({stdin:{contents:`export * from './components/prism-next/field-row'; export * from './components/prism-next/inline-status'; export * from './components/prism-next/keyboard-hint'; export * from './components/coss/field'; export * from './components/coss/input';`,loader:'tsx',resolveDir:root},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false})).outputFiles[0].text)
const {FieldRow,InlineStatus,KeyboardHint,usePrimaryModifier,Field,FieldLabel,FieldDescription,Input}=await import(file)

test('R4 clears every component and demonstration violation without a path allowlist',()=>{
  assert.deepEqual(scanFieldLayouts(['components/prism-next','app/(next)']),[])
})
test('R4 detects real failures through aliases, expressions, fragments, raw labels and wrapped controls',()=>{
  const cases=[
    'const X=()=> <div><Label>标题</Label><Input /></div>',
    'const X=()=> <><Label>标题</Label>{editable ? <Textarea/> : <span/>}</>',
    'import { Label as Name } from "label"; const X=()=> <div><Name>标题</Name><QuestionSelect/></div>',
    'const X=()=> <div><label>标题</label><div><InputGroup><InputGroupInput/></InputGroup></div></div>',
    'const X=()=> <div><FieldLabel>标题</FieldLabel><Input/></div>',
    'const X=()=> <p>按 ⌘ / Ctrl + Enter 确认，Esc 取消。</p>',
    'const X=()=> <p>{"按 Esc 取消"}</p>',
  ]
  for(const source of cases)assert.ok(fieldLayoutViolations(source).length,source)
  for(const source of ['const X=()=> <Field><FieldLabel>标题</FieldLabel><Input/></Field>','const X=()=> <FieldRow><FieldLabel>标题</FieldLabel><Select/></FieldRow>','const X=()=> <Label><Checkbox/>复核</Label>','const X=()=> <p><Kbd>Esc</Kbd>取消</p>'])assert.deepEqual(fieldLayoutViolations(source),[],source)
})
test('R4 exempts proven hidden labels and aria-label-only controls, but never visible or uncertain labels',()=>{
  const valid = [
    '<div><Label className="sr-only" htmlFor="q">问题</Label><Input id="q"/></div>',
    '<div><label hidden>问题</label><input/></div>',
    '<div><span className="sr-only"><Label>问题</Label></span><Input/></div>',
    '<div><Input aria-label="搜索目录"/></div>',
    '<p>↑↓ 选择 · Enter 确认 · Esc 关闭</p>',
  ]
  const invalid = [
    '<div><Label aria-hidden="true">问题</Label><Input/></div>',
    '<div><Label className="sr-only md:not-sr-only">问题</Label><Input/></div>',
    '<div><Label className={compact ? "sr-only" : undefined}>问题</Label><Input/></div>',
    '<div><Label>问题</Label><Input aria-label="问题"/></div>',
    '<p>按 Esc 关闭 · 并保存所有修改。</p>',
  ]
  for(const source of valid)assert.deepEqual(fieldLayoutViolations(`const X=()=>${source}`),[],source)
  for(const source of invalid)assert.ok(fieldLayoutViolations(`const X=()=>${source}`).length,source)
})
test('baseline inventory is nonempty; the current guard independently detects former layout and shortcut violations',()=>{
  const files=execFileSync('git',['ls-tree','-r','--name-only',baseline,'components/prism-next','app/(next)'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.tsx'))
  const old=files.flatMap(f=>fieldLayoutViolations(before(f),f))
  assert.ok(old.filter(x=>x.rule==='bare-label-control').length>=50)
  assert.ok(old.some(x=>x.rule==='shortcut-prose'))
})
for(const theme of themes)test(`P121 ${theme}: SSR field structure, described-by association, status semantics and keyboard entry`,()=>{
  const html=renderToStaticMarkup(h('section',{'data-prism-theme':theme},
    h(FieldRow,null,h(FieldLabel,null,'标题'),h(Input,{id:'title','aria-describedby':'help',placeholder:'输入标题'}),h(FieldDescription,{id:'help'},'完整的长中文说明，不截断。')),
    ...['info','warning','destructive'].map(tone=>h(InlineStatus,{tone,key:tone,details:'详情'},tone)),h(KeyboardHint,{modifier:'Ctrl'})))
  assert.match(html,/class="[^"]*prism-field-row/);assert.match(html,/data-slot="field-label"/)
  assert.ok(html.indexOf('data-slot="field-label"')<html.indexOf('data-slot="input"'))
  const inputId=html.match(/<input[^>]*id="([^"]+)"/)[1]; assert.ok(html.includes(`for="${inputId}"`))
  assert.match(html,/aria-describedby="[^"]*help/);assert.match(html,/id="help"/)
  for(const tone of ['info','warning','destructive']) {assert.ok(html.includes(`data-tone="${tone}"`));assert.ok(html.includes(`text-${tone}-foreground`))}
  assert.equal((html.match(/role="status"/g)??[]).length,3)
  assert.match(html,/aria-label="公式编辑快捷键"/);assert.match(html,/<button[^>]*data-slot="tooltip-trigger"/)
  assert.doesNotMatch(html,/text-transform:uppercase|<math-field/)
})
test('platform modifier is SSR-safe and changes to the detected platform only after mount',async()=>{
  function Probe(){return h('span',null,usePrimaryModifier())}
  assert.equal(renderToStaticMarkup(h(Probe)),'<span>Ctrl</span>')
  for(const [platform,expected] of [['MacIntel','⌘'],['iPad','⌘'],['Win32','Ctrl'],['Linux x86_64','Ctrl']]){
    const dom=clientDOM(390,800),saved={};for(const k of ['window','document','navigator','IS_REACT_ACT_ENVIRONMENT'])saved[k]=Object.getOwnPropertyDescriptor(globalThis,k)
    Object.assign(globalThis,{window:dom.window,document:dom.document,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{configurable:true,value:{platform}})
    const host=dom.document.createElement('div'),mounted=createRoot(host)
    try{await act(()=>mounted.render(h(Probe)));assert.equal(host.firstChild.textContent,expected)}finally{await act(()=>mounted.unmount());for(const[k,v]of Object.entries(saved)){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
  }
})
test('P121 changes only field-description mapping and appends isolated blueprint rules; every other existing CSS byte stays unchanged',()=>{
  const tracked=execFileSync('git',['ls-tree','-r','--name-only',baseline],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.css'))
  for(const f of tracked){const current=read(f),old=before(f);if(f==='app/(next)/next/blueprint.css')assert.equal(current.split('\n/* P121 ·')[0],old);else if(f==='app/(next)/next/typography.css')assert.equal(current.split('\n/* P121 ·')[0],old.replace('[data-slot="field-description"],',''));else assert.equal(current,old,f)}
  const typo=read('app/(next)/next/typography.css').split('/* P121 ·')[1]
  assert.match(typo,/font-size:var\(--text-ui-meta\)/);assert.match(typo,/line-height:var\(--text-ui-meta--line-height\)/)
  const css=read('app/(next)/next/blueprint.css').split('\n/* P121 ·')[1],block='/* P121 ·'+css
  transform({code:Buffer.from(block),minify:true})
  postcss.parse(block).walkRules(rule=>{assert.ok(rule.selector.includes('[data-prism-theme="blueprint"]'));assert.ok(rule.selector.includes('[data-prism-theme="blueprint-night"]'));assert.ok(rule.selector.includes(':not(:where([data-agent-preview]'));rule.walkDecls(d=>assert.ok(!d.prop.startsWith('--'),'no new token definitions'))})
  assert.match(block,/border:var\(--line-width\) solid var\(--line\)/);assert.match(block,/font-family:var\(--font-sans\)/);assert.match(block,/text-transform:none/)
  assert.equal(execFileSync('git',['diff',baseline,'--','components/coss','package.json','package-lock.json'],{cwd:root,encoding:'utf8'}),'')
})
test('field layout uses intrinsic container wrapping; the helper gap and wrapping are explicit without visual overrides',()=>{
  const css=read('components/prism-next/field-layout.css');transform({code:Buffer.from(css),minify:true})
  assert.match(css,/flex-wrap:wrap/);assert.match(css,/flex-direction:row/);assert.match(css,/align-items:center/)
  assert.match(css,/gap:calc\(var\(--spacing\) \* 2\)/);assert.match(css,/margin-block-start:calc\(var\(--spacing\) \* -1\)/)
  assert.match(css,/white-space:normal/);assert.match(css,/overflow-wrap:anywhere/)
  assert.doesNotMatch(css,/font-size|border-radius|box-shadow|color:|@media|text-overflow:ellipsis/)
})
test('keyboard details use scoped coss tooltip and KbdGroup; MathField retains its public contract and event implementation',()=>{
  const hint=read('components/prism-next/keyboard-hint.tsx'),status=read('components/prism-next/inline-status.tsx'),math=read('components/prism-next/math-field.tsx'),old=before('components/prism-next/math-field.tsx')
  assert.match(hint,/aria-label="公式编辑快捷键"/);assert.match(hint,/KbdGroup/);assert.match(hint,/from '\.\/scoped-overlays'/)
  assert.match(status,/from '\.\/scoped-overlays'/);assert.match(status,/type="button"/)
  const props=s=>s.slice(s.indexOf('export type MathFieldCursor'),s.indexOf('export function MathField'))
  assert.equal(props(math),props(old))
  const events=s=>s.slice(s.indexOf('  const id = useId()'),s.indexOf('  return <'))
  assert.equal(events(math),events(old))
  assert.match(math,/placeholder="直接输入或粘贴公式原文/);assert.match(math,/<FieldDescription[^>]*>单独一行或答案中的公式不插作答空/)
})

function selectorAST(selector) { let ast; transform({code:Buffer.from(`${selector}{color:red}`),visitor:{Selector(s){ast=s}}}); return ast }
function matches(s,n) {
  if(!n)return false
  const split=s.findLastIndex(p=>p.type==='combinator')
  if(split>=0){if(!matches(s.slice(split+1),n))return false;assert.equal(s[split].value,'descendant');for(let p=n.parent;p;p=p.parent)if(matches(s.slice(0,split),p))return true;return false}
  return s.every(p=>{
    if(p.type==='universal')return true
    if(p.type==='class')return n.classes?.includes(p.name)??false
    if(p.type==='attribute')return p.operation?n.attrs[p.name]===p.operation.value:Object.hasOwn(n.attrs,p.name)
    if(p.type==='pseudo-class'&&['is','where','not'].includes(p.kind)){const any=p.selectors.some(s=>matches(s,n));return p.kind==='not'?!any:any}
    assert.fail(`Unsupported selector ${JSON.stringify(p)}`)
  })
}
test('all appended blueprint selectors exclude core preview roots and descendants across five outer themes',()=>{
  const block=read('app/(next)/next/blueprint.css').split('\n/* P121 ·')[1], rules=postcss.parse('/* P121 ·'+block).nodes.filter(n=>n.type==='rule').map(r=>r.selectors.map(selectorAST))
  const targets=[{'data-slot':'kbd'},{'data-slot':'field-description'},{'data-slot':'inline-status','data-tone':'info'},{'data-slot':'inline-status','data-tone':'warning'},{'data-slot':'inline-status','data-tone':'destructive'},{'data-slot':'field'}]
  const any=n=>rules.some(group=>group.some(s=>matches(s,n)))
  for(const outer of themes)for(const attrs of targets){const root={attrs:{'data-prism-theme':outer}};assert.equal(any({attrs,parent:root,classes:['prism-field-row']}),outer.startsWith('blueprint'))
    for(const core of themes.slice(0,3)){const boundary={attrs:{'data-agent-preview':'','data-prism-theme':core},parent:root};assert.equal(any({attrs,parent:boundary,classes:['prism-field-row']}),false);assert.equal(any({attrs:{...attrs,...boundary.attrs},parent:root,classes:['prism-field-row']}),false)}
  }
})
test('night keycap and status text reuse existing tokens with at least 4.5:1 static contrast on their surfaces',async()=>{
  const {relativeLuminance}=await import('../lib/prism-next/chart-color.ts')
  const css=read('app/(next)/next/theme.css'),body=css.split(':where([data-agent-preview])[data-prism-theme="blueprint-night"] {')[1].split('}')[0]
  const tokens=Object.fromEntries([...body.matchAll(/(--[\w-]+):([^;]+);/g)].map(m=>[m[1],m[2]]))
  const ratio=(a,b)=>(Math.max(relativeLuminance(a),relativeLuminance(b))+.05)/(Math.min(relativeLuminance(a),relativeLuminance(b))+.05)
  for(const color of ['--foreground','--info-foreground','--warning-foreground','--destructive-foreground'])for(const bg of ['--background','--card','--muted'])assert.ok(ratio(tokens[color],tokens[bg])>=4.5,`${color}/${bg}`)
})
test('migrated production components retain every original JSX control value and event callback expression',async()=>{
  const ts=(await import('typescript')).default
  const attributes=source=>{const sf=ts.createSourceFile('component.tsx',source,99,true,4),rows=[];function walk(n){if(ts.isJsxAttribute(n)&&(/^(on[A-Z]|value$|checked$|readOnly$|disabled$)/.test(n.name.getText(sf))))rows.push(n.getText(sf));ts.forEachChild(n,walk)}walk(sf);return rows.sort()}
  const files=execFileSync('git',['diff','--name-only',baseline,'--','components/prism-next/*.tsx'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>f.split('/').length===3)
  for(const f of files)assert.deepEqual(attributes(read(f)),attributes(before(f)),f)
})

test('built field-text foundation route renders the live comparison without eager MathLive loading',async()=>{
  const {default:worker}=await import('../dist/server/index.js')
  const response=await worker.fetch(new Request('http://localhost/next/foundations/field-text',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}})
  assert.equal(response.status,200);const html=await response.text()
  for(const text of ['字段与说明文字','R1 / S1 / S4','R2','改前','改后','公式编辑快捷键','切换 240 窄容器','嵌套核心主题'])assert.ok(html.includes(text),text)
})
