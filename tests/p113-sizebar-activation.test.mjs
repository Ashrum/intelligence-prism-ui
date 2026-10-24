import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import postcss from 'postcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)), h=React.createElement;
const read=path=>readFileSync(root+path,'utf8');
const file=new URL('bundle.mjs',await createTestRuntime('p113'));
writeFileSync(file,(await build({stdin:{contents:`export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/demos/blueprint'; export * from './components/prism-next/demos/blueprint-overview'; export * from './components/prism-next/demos/learning-chart-properties';`,loader:'tsx',resolveDir:root},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false})).outputFiles[0].text);
const api=await import(file);
const fixture=JSON.parse(read('tests/fixtures/p113-static-before.json'));
for(const c of fixture.cases) test(`P113 static byte snapshot: ${c.label}`,()=>{
  assert.equal(render(h(api[c.name],c.props)),c.html);
  if(c.name==='BpSizeBar') assert.equal(render(h(api[c.name],{...c.props,activeRowId:'algebra',rowActionLabel(){throw Error('static callback must not run');}})),c.html);
});
const props={...fixture.cases[0].props,legend:false,marker:{value:1400,label:'目标'}};
function nodes(node,result=[]) {
  if(Array.isArray(node)) node.forEach(n=>nodes(n,result));
  else if(React.isValidElement(node)){result.push(node);nodes(node.props.children,result);}
  return result;
}
const buttons=tree=>nodes(tree).filter(n=>n.type==='button');
test('P113 native Tab/Enter/Space contract: buttons do not override or cancel browser keyboard activation',()=>{
  for(const b of buttons(api.BpSizeBar({...props,onRowActivate(){}}))){
    assert.equal(b.props.type,'button');
    for(const key of ['tabIndex','disabled','onKeyDown','onKeyUp','onKeyPress','role']) assert.equal(b.props[key],undefined,key);
    assert.equal(typeof b.props.onClick,'function');
    assert.equal(React.Children.toArray(b.props.children).length,3,'label, bar and summary share one button');
  }
  // This is native-element contract coverage; real Tab/Enter/Space default actions need Supervisor browser acceptance.
});
test('P113 callbacks emit exact row id once; selection remains host controlled',()=>{
  const calls=[], p={...props,onRowActivate:id=>calls.push(id),activeRowId:'algebra'};
  const before=api.BpSizeBar(p), rows=buttons(before);
  rows[1].props.onClick(); rows[0].props.onClick();
  assert.deepEqual(calls,['geometry','algebra']);
  assert.equal(render(api.BpSizeBar(p)),render(before));
  assert.deepEqual(buttons(api.BpSizeBar({...p,activeRowId:'geometry'})).map(b=>b.props['aria-current']),[undefined,'true']);
  for(const id of [undefined,'missing']) assert.ok(buttons(api.BpSizeBar({...p,activeRowId:id})).every(b=>b.props['aria-current']===undefined));
});
test('P113 merged accessible facts preserve values, display and marker without nested images',()=>{
  const tree=api.BpSizeBar({...props,onRowActivate(){},rowActionLabel:row=>`打开知识点：${row.label}`,formatValue:value=>({text:`视觉${value}`,ariaText:`读出${value}`})});
  const b=buttons(tree)[0];
  assert.equal(b.props['aria-label'],'打开知识点：一元二次方程 x² 与很长的中文知识点名称；已掌握 读出1300，待巩固 读出0，目标 读出1400；65% · 1,300 / 2,000');
  assert.ok(React.Children.toArray(b.props.children).every(n=>n.props['aria-hidden']===true));
  assert.ok(!nodes(b).some(n=>n.props.role==='img'));
  assert.match(buttons(api.BpSizeBar({...props,onRowActivate(){},rowActionLabel:()=> ' '}))[0].props['aria-label'],/^在报告中查看：/);
  assert.equal(buttons(api.BpSizeBar({...props,rows:[],onRowActivate(){}})).length,0);
});
const themes=['light','paper','dark','blueprint','blueprint-night'];
const interactive=render(h(api.BpSizeBar,{...props,onRowActivate(){},activeRowId:'algebra'}));
for(const theme of themes) test(`P113 ${theme}: identical interactive structure inside global and nested roots`,()=>{
  for(const outer of themes){
    const out=render(h('div',{'data-prism-theme':outer},h('div',{'data-agent-preview':'','data-prism-theme':theme},h(api.BpSizeBar,{...props,onRowActivate(){},activeRowId:'algebra'}))));
    assert.ok(out.endsWith(interactive+'</div></div>'));
  }
});
test('P113 default/sm/xs and hidden labels retain bar geometry on opt-in',()=>{
  for(const size of ['default','sm','xs']) for(const hideRowLabel of [false,true]){
    const p={...props,size,hideRowLabel};
    const bars=tree=>nodes(tree).filter(n=>n.props.className==='bp-size-bar').map(n=>render(h('span',null,n.props.children)));
    assert.deepEqual(bars(api.BpSizeBar({...p,onRowActivate(){}})),bars(api.BpSizeBar(p)));
  }
});
test('P113 CSS adds only explicit action visuals; all previous CSS and theme tokens stay exact',()=>{
  const path='app/(next)/next/blueprint.css',css=read(path).replace(/\n\/\* P114 ·[\s\S]*$/, ''),base=execFileSync('git',['show',`${fixture.baseline}:${path}`],{cwd:root,encoding:'utf8'});
  const marker='\n/* P113 ·', index=css.indexOf(marker); assert.ok(index>0);
  assert.equal(css.slice(0,index),base);
  const ast=postcss.parse(css.slice(index));
  const rules=[];ast.walkRules(r=>{rules.push(r);assert.match(r.selector,/^\.bp-size-row-action(?:$|:hover$|\[aria-current="true"\]$|:focus-visible$)/);});
  assert.equal(rules.length,4);
  const declarations=Object.fromEntries(rules.map(r=>[r.selector,Object.fromEntries(r.nodes.map(d=>[d.prop,d.value]))]));
  assert.deepEqual(declarations,{
    '.bp-size-row-action':{cursor:'pointer'},
    '.bp-size-row-action:hover':{background:'var(--secondary)'},
    '.bp-size-row-action[aria-current="true"]':{background:'var(--accent)'},
    '.bp-size-row-action:focus-visible':{outline:'2px solid var(--ring)','outline-offset':'2px'},
  });
  const tokens=read('app/(next)/next/theme.css');
  assert.equal(tokens,execFileSync('git',['show',`${fixture.baseline}:app/(next)/next/theme.css`],{cwd:root,encoding:'utf8'}));
  for(const theme of themes){
    let found=false;postcss.parse(tokens).walkRules(r=>{if(r.selector.includes(`[data-prism-theme="${theme}"]`) || (theme==='light' && r.selector.includes(':root'))){const accent=r.nodes.find(n=>n.prop==='--accent');if(accent){found=true;if(theme==='blueprint')assert.equal(accent.value,'#E4ECF8');}}});
    assert.ok(found,theme);
  }
});
test('P113 interactive example starts with controlled selection and synthetic explanation',()=>{
  const out=render(h(api.BlueprintSizeBarActivationDemo));
  assert.equal((out.match(/<button /g)||[]).length,2);
  assert.equal((out.match(/aria-current="true"/g)||[]).length,1);
  assert.match(out,/当前选中：一元二次方程 x²/);
  assert.match(out,/合成数据/);
});
