import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup as render } from 'react-dom/server';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)), h=React.createElement;
const read=path=>readFileSync(root+path,'utf8');
const file=new URL('bundle.mjs',await createTestRuntime('p114'));
writeFileSync(file,(await build({stdin:{contents:`export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/demos/blueprint'; export * from './components/prism-next/demos/blueprint-trend';`,loader:'tsx',resolveDir:root},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false})).outputFiles[0].text);
const api=await import(file);
const fixture=JSON.parse(read('tests/fixtures/p114-section-card-before.json'));
assert.equal(fixture.baseline,'fc50fac4fce439f7e1855fb616b9f469aab4609b');
for(const [i,c] of fixture.cases.entries()) test(`P114 fc50fac byte snapshot ${i}: ${c.name}`,()=>{
  assert.equal(render(h(api[c.name],c.props)),c.html);
  if(c.name==='BpSectionCard') {
    assert.equal(render(h(api[c.name],{...c.props,selected:false})),c.html);
    assert.equal(render(h(api[c.name],{...c.props,selected:true})).replace(' data-selected=""',''),c.html);
  }
});
test('P114 selection adds no inferred ARIA, focusability, interaction or wrapper; slots and host semantics survive',()=>{
  const props={title:h('em',null,'范围'),letter:'A',meta:h('span',null,'第 1 页'),action:h('button',{'aria-label':'查看说明'},'说明'),children:h(api.BpCodebox,{file:'scope.ts'},'const count = 2;')};
  const normal=render(h(api.BpSectionCard,props)),selected=render(h(api.BpSectionCard,{...props,selected:true}));
  assert.equal(selected.replace(' data-selected=""',''),normal);
  assert.doesNotMatch(selected,/aria-selected|aria-current|tabindex| role=| selected=/);
  const host=render(h(api.BpSectionCard,{...props,selected:true,'aria-current':'page',id:'host',onClick(){throw Error('render must not activate');}}));
  assert.match(host,/aria-current="page"/);
  assert.match(host,/id="host"/);
  const source=read('components/prism-next/blueprint/blueprint.tsx').split('export function BpSectionCard(')[1].split('export type BpFill')[0];
  assert.doesNotMatch(source,/useState|useEffect|setTimeout|setInterval|onClick=|onKey|localStorage|aria-current=/);
});
const themes=['light','paper','dark','blueprint','blueprint-night'];
test('P114 controlled rerender updates only selection; host click does not toggle the card',async()=>{
  const keys=['window','document','IS_REACT_ACT_ENVIRONMENT'];
  const saved=Object.fromEntries(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  const dom=clientDOM(1280,230);
  Object.assign(globalThis,{window:dom.window,document:dom.document,IS_REACT_ACT_ENVIRONMENT:true});
  const host=dom.document.createElement('div'),mounted=createRoot(host);
  let calls=0;
  const props={title:'受控卡片',onClick:()=>calls++};
  try {
    await act(()=>mounted.render(h(api.BpSectionCard,props)));
    const card=host.firstChild,header=card.firstChild;
    const handlers=card[Object.keys(card).find(k=>k.startsWith('__reactProps$'))];
    await act(()=>handlers.onClick());
    assert.equal(calls,1);
    assert.equal(card.getAttribute('data-selected'),null);
    for(const selected of [true,false,true,undefined]) {
      await act(()=>mounted.render(h(api.BpSectionCard,{...props,selected})));
      assert.equal(host.firstChild,card);
      assert.equal(card.firstChild,header);
      assert.equal(card.getAttribute('data-selected'),selected?'':null);
      assert.equal(card.getAttribute('aria-current'),null);
    }
  } finally {
    await act(()=>mounted.unmount());
    for(const k of keys) if(saved[k])Object.defineProperty(globalThis,k,saved[k]);else delete globalThis[k];
  }
});
for(const theme of themes) test(`P114 ${theme}: selected and unselected DOM identical across theme roots`,()=>{
  for(const selected of [undefined,false,true]) {
    const props={title:'范围',selected,density:'compact',titleRule:true};
    const inner=render(h(api.BpSectionCard,props));
    for(const outer of themes) assert.ok(render(h('div',{'data-prism-theme':outer},h('div',{'data-agent-preview':'','data-prism-theme':theme},h(api.BpSectionCard,props)))).endsWith(inner+'</div></div>'));
  }
});
const path='app/(next)/next/blueprint.css',css=read(path).replace(/\n\/\* P115 ·[\s\S]*$/, ''),index=css.indexOf('\n/* P114 ·');
assert.ok(index>0);
const block=css.slice(index),ast=postcss.parse(block);
test('P114 append-only CSS and unchanged tokens/coss; only exact paint declarations allowed',()=>{
  assert.equal(css.slice(0,index),execFileSync('git',['show',`${fixture.baseline}:${path}`],{cwd:root,encoding:'utf8'}));
  assert.equal(read('app/(next)/next/theme.css'),execFileSync('git',['show',`${fixture.baseline}:app/(next)/next/theme.css`],{cwd:root,encoding:'utf8'}));
  assert.equal(execFileSync('git',['diff',fixture.baseline,'--','components/coss'],{cwd:root,encoding:'utf8'}),'');
  assert.deepEqual(ast.nodes.map(n=>n.type),['comment','rule','rule']);
  const rules=ast.nodes.filter(n=>n.type==='rule');
  assert.equal(rules[0].selector,'.bp-section-card[data-selected]');
  for(const [i,rule] of rules.entries()) {
    assert.deepEqual(rule.nodes.map(d=>[d.type,d.prop,d.value]),[['decl','box-shadow',i===0?'0 0 0 2px var(--ring)':'4px 4px 0 var(--ring)']]);
  }
  assert.equal(rules[1].selectors.length,2);
  for(const s of rules[1].selectors) {
    assert.match(s,/\.bp-section-card\[data-selected\]/);
    assert.match(s,/:not\(:where\(\[data-agent-preview\]/);
  }
  assert.doesNotThrow(()=>transform({filename:'p114.css',code:Buffer.from(block),minify:true}));
});
// Static selector/token evaluation only; actual paint and layout are Supervisor checks.
function node(attrs={},parent) {return {attrs,classes:(attrs.class??'').split(/\s+/),parent};}
function parse(selector) {let value;transform({code:Buffer.from(`${selector}{color:red}`),visitor:{Selector(s){value=s;}}});return value;}
function matches(s,n) {
  if(!n)return false;
  const split=s.findLastIndex(p=>p.type==='combinator');
  if(split>=0){
    if(!matches(s.slice(split+1),n))return false;
    assert.equal(s[split].value,'descendant');
    for(let p=n.parent;p;p=p.parent)if(matches(s.slice(0,split),p))return true;
    return false;
  }
  return s.every(p=>{
    if(p.type==='class')return n.classes.includes(p.name);
    if(p.type==='universal')return true;
    if(p.type==='attribute')return p.operation?n.attrs[p.name]===p.operation.value:Object.hasOwn(n.attrs,p.name);
    if(p.type==='pseudo-class'&&['is','where','not'].includes(p.kind)){const any=p.selectors.some(s=>matches(s,n));return p.kind==='not'?!any:any;}
    assert.fail(`Unsupported selector ${JSON.stringify(p)}`);
  });
}
const rules=ast.nodes.filter(n=>n.type==='rule').map(r=>({selectors:r.selectors.map(parse),shadow:r.nodes[0].value}));
const shadow=n=>rules.filter(r=>r.selectors.some(s=>matches(s,n))).at(-1)?.shadow;
const colors={light:'#1769AA',paper:'#1D4ED8',dark:'#86C5FF',blueprint:'#1D5FBF','blueprint-night':'#6EA8FF'};
for(const theme of themes) test(`P114 ${theme}: local ring and geometry survive global, nested root and descendant scopes`,()=>{
  let ring;
  postcss.parse(read('app/(next)/next/theme.css')).walkRules(r=>{
    if(r.selector.includes(`[data-prism-theme="${theme}"]`)||(theme==='light'&&r.selector=== ':root:where([data-ui-version="coss-v1"]),\n:where([data-agent-preview][data-prism-theme])')){const d=r.nodes.find(d=>d.prop==='--ring');if(d)ring=d.value;}
  });
  assert.equal(ring,colors[theme]);
  const expected=theme.startsWith('blueprint')?'4px 4px 0 var(--ring)':'0 0 0 2px var(--ring)';
  for(const outer of [undefined,...themes]) {
    const parent=outer?node({'data-prism-theme':outer}):undefined;
    const attrs={'data-prism-theme':theme,'data-agent-preview':''};
    const local=node(attrs,parent);
    const card={'class':'bp-section-card','data-selected':''};
    assert.equal(shadow(node(card,local)),expected,`${outer}/${theme} descendant`);
    assert.equal(shadow(node({...attrs,...card},parent)),expected,`${outer}/${theme} self root`);
    assert.equal(shadow(node({class:'bp-section-card'},local)),undefined,'unselected');
    assert.equal(shadow(node({class:'bp-frame-card','data-selected':''},local)),undefined,'unrelated card');
    const wrapper=node({},local);
    assert.equal(shadow(node(card,wrapper)),expected,'nested descendants');
  }
});
test('P114 demo exposes host controls, both densities, formula and nested core previews',()=>{
  const out=render(h(api.BlueprintSectionCardSelectionDemo));
  for(const label of ['查看概览','查看明细','清除选中','合成数据','当前选中：学情概览','bp-section-card-compact','data-title-rule','<math'])assert.ok(out.includes(label),label);
  assert.equal((out.match(/aria-current="true"/g)||[]).length,1);
  assert.equal((out.match(/data-selected=""/g)||[]).length,4,'one current result plus three static nested previews');
  for(const theme of themes.slice(0,3))assert.ok(out.includes(`data-prism-theme="${theme}"`));
});
