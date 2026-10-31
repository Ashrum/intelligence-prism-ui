import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render, renderToReadableStream } from 'react-dom/server';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = '01080cb635549e188dd2c3ba21ef733a0011f20c';
const read = p => readFileSync(root + p, 'utf8');
const before = p => execFileSync('git', ['show', `${baseline}:${p}`], { cwd: root, encoding: 'utf8' });
const runtime = await createTestRuntime('p125');
const h = React.createElement;
let hookCursor = 0; const hookSlots = [];
globalThis.__p125Hooks = { useState(initial) { const i = hookCursor++; if (!(i in hookSlots)) hookSlots[i] = typeof initial === 'function' ? initial() : initial; return [hookSlots[i], value => { hookSlots[i] = typeof value === 'function' ? value(hookSlots[i]) : value; }]; }, useRef: value => ({current:value}), useId: () => 'p125-controls', useEffect() {}, useLayoutEffect() {} };
const names = ['review-tools','stepper','error-cause-review','student-paper-report','knowledge-rail','student-control-bar','question-analysis-card','question-analysis-panel','question-inspector','review-switcher','review-workspace','record-list','score-review','queue-board','data-station','material-intake','attachment','instrument-panel','comparison-chart','segmented-bar','distribution-chart'];
const routes = [...names.map(n => `/next/components/${n}`), '/next/reviews/grading-function-area', '/next/use-cases/workspace-app-bar'];
const changedDemos = ['review-workspace-fixtures','stepper','record-list','score-review','queue-board','data-station','material-intake','attachment','instrument-panel','grading-function-area','agent-component-page'].map(n => `components/prism-next/demos/${n}.tsx`);
const replaced = new Set([...changedDemos, 'examples/workspace-app-bar/demo.tsx']);
async function bundle(mode) {
  const file = new URL(`${mode}.mjs`, runtime);
  const result = await build({ stdin: { contents: `
export {default as componentPage} from './app/(next)/next/components/[slug]/page';
export {default as agentPage} from './app/(next)/next/agent/page';
export {default as paperReviewPage} from './app/(next)/next/reviews/paper-review/page';
export {default as gradingPage} from './app/(next)/next/reviews/grading-function-area/page';
export {default as workspacePage} from './app/(next)/next/use-cases/workspace-app-bar/page';
export * from './components/prism-next/demos/agent-component-page';
export * from './components/prism-next/demos/review-workspace-fixtures';
export * from './components/prism-next/demos/review-switcher';
export * from './lib/prism-next/agent-component-registry';
`, loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root, 'next/link': 'next/link.js', 'next/navigation': 'next/navigation.js' }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'p125-baseline', setup(b) {
    b.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml-url', namespace: 'url' }));
    b.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' }));
    b.onLoad({ filter: /\.(tsx|ts)$/ }, ({ path }) => {
      const relative = path.slice(root.length);
      if (mode === 'probe' && relative === 'components/prism-next/demos/agent-component-page.tsx') return { contents: read(relative).replace('import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"', 'import type { ReactNode } from "react"; const { useEffect, useId, useLayoutEffect, useRef, useState } = (globalThis as any).__p125Hooks').replace('import { useTheme } from "next-themes"', 'const useTheme = () => ({resolvedTheme: "light"})'), loader: 'tsx' };
      if (mode === 'parsing' && relative === 'examples/teacher-use-cases/parsing-workspace.tsx') return { contents: read(relative).replace("import { useEffect, useRef, useState, type ChangeEvent } from 'react'", "import type { ChangeEvent } from 'react'; const {useEffect,useRef,useState} = (globalThis as any).__p125ParsingHooks"), loader: 'tsx' };
      if (mode === 'old'  && replaced.has(relative)) return { contents: before(relative), loader: 'tsx' };
      // Exact baseline SSR with only the original three preview entries enabled.
      // The full five-theme DOM is independently checked below.
      if (mode === 'core' && relative === 'lib/prism-next/preview-themes.ts') return { contents: read(relative).replace(', "blueprint", "blueprint-night"] as const', '] as const'), loader: 'ts' };
    });
  } }] });
  writeFileSync(file, result.outputFiles[0].text); return import(file);
}
let parsingCursor = 0; const parsingSlots = [], parsingEffects = [];
globalThis.__p125ParsingHooks = {
  useState(initial) { const i=parsingCursor++; if (!(i in parsingSlots)) parsingSlots[i]=typeof initial==='function'?initial():initial; return [parsingSlots[i],value=>{parsingSlots[i]=typeof value==='function'?value(parsingSlots[i]):value;}]; },
  useRef: value=>({current:value}), useEffect: effect=>parsingEffects.push(effect),
};
const parsing = await bundle('parsing');
const old = await bundle('old'), api = await bundle('new'), core = await bundle('core'), probe = await bundle('probe');
async function page(lib, route) {
  if (route === '/next/agent') return h(lib.agentPage);
  if (route === '/next/reviews/paper-review') return h(lib.paperReviewPage);
  return route.includes('/components/') ? lib.componentPage({ params: Promise.resolve({ slug: route.split('/').at(-1) }) }) : route.includes('/reviews/') ? h(lib.gradingPage) : h(lib.workspacePage);
}
// Preserve original substrings (no HTML reserialization) for byte comparisons.
function previewNodes(html) {
  const stack = [], out = [], voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for (const m of html.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    if (m[0].startsWith('</')) {
      const node = stack.pop(); assert.equal(node?.tag, m[1]);
      if (node.preview) out.push({ theme: node.theme, start: node.start, end: m.index + m[0].length, html: html.slice(node.start, m.index + m[0].length) });
    } else if (!voids.has(m[1]) && !m[0].endsWith('/>')) {
      stack.push({ tag: m[1], preview: /\bdata-agent-preview(?:=|\s|>)/.test(m[0]), theme: m[0].match(/data-prism-theme="([^"]*)"/)?.[1], start: m.index });
    }
  }
  return out.sort((a,b) => a.start-b.start);
}
const normalizeIds = html => html.replace(/_R_[\w-]+_/g, '_REACT_ID_');
for (const route of routes) test(`P125 ${route}: real route five-theme fixtures and baseline core SSR`, async () => {
  for (const lib of [old, api, core]) { const stream = await renderToReadableStream(await page(lib, route)); await stream.allReady; await stream.cancel(); }
  const actual = render(await page(api, route)), previous = render(await page(old, route));
  const expectedPreviews = previewNodes(previous), previews = previewNodes(actual);
  for (const theme of ['light','paper','dark','blueprint','blueprint-night']) assert.ok(previews.some(p => p.theme === theme), `${route}/${theme}`);
  // Every existing core preview stays in sequence and retains its full content.
  const originalCore = expectedPreviews.filter(p => ['light','paper','dark'].includes(p.theme));
  const actualCore = previews.filter(p => ['light','paper','dark'].includes(p.theme));
  assert.equal(actualCore.length, originalCore.length);
  actualCore.forEach((p,i) => { assert.equal(p.theme, originalCore[i].theme); assert.equal(normalizeIds(p.html), normalizeIds(originalCore[i].html)); });
  for (const theme of ['light','paper','dark']) {
    assert.equal(render(h('div', { 'data-prism-theme': theme }, await page(core, route))), render(h('div', { 'data-prism-theme': theme }, await page(old, route))), `exact ${theme} core-only SSR`);
  }
  // Every light example gets the same corresponding Blueprint examples, not an empty frame.
  const light = previews.filter(p => p.theme === 'light');
  for (const theme of ['blueprint','blueprint-night']) {
    const blue = previews.filter(p => p.theme === theme); assert.equal(blue.length, light.length);
    blue.forEach((p,i) => {
      const clean = value => normalizeIds(value).replaceAll(theme, 'light').replaceAll(theme === 'blueprint' ? '蓝图' : '夜图', '浅色');
      assert.equal(clean(p.html), clean(light[i].html));
      assert.ok(p.start > previews.filter(q => q.theme === 'dark')[i].start);
    });
  }
});
test('P125 AgentPreviewFrame exposes both choices without changing default or core markup', () => {
  assert.deepEqual(api.previewThemes.map(p => p.value), ['site','light','paper','dark','blueprint','blueprint-night']);
  assert.deepEqual(api.previewThemes.slice(-2).map(p => p.label), ['蓝图','夜图']);
  assert.match(read('components/prism-next/demos/agent-component-page.tsx'), /useState<PreviewTheme>\("site"\)/);
  for (const theme of ['site','light','paper','dark']) for (const width of ['auto','390','1280']) {
    assert.equal(render(h(api.AgentPreviewFrame, { theme, width }, h(api.ReviewSwitcherFixture))), render(h(old.AgentPreviewFrame, { theme, width }, h(old.ReviewSwitcherFixture))));
  }
  for (const theme of ['blueprint','blueprint-night']) for (const width of ['390','1280']) {
    const html = render(h(api.AgentPreviewFrame, { theme, width }, h(api.ReviewSwitcherFixture)));
    assert.match(html, new RegExp(`data-prism-theme="${theme}"`)); assert.ok(html.includes(`width:${width}px`));
    assert.ok(html.includes(`预览 · ${theme === 'blueprint' ? '蓝图' : '夜图'}`));
  }
});
const cssPath = 'app/(next)/next/blueprint.css', css = read(cssPath), marker = '\n/* P125 ·';
const block = css.slice(css.indexOf(marker)), sheet = postcss.parse(block);
const family = ':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])';
const guard = `:not(:where([data-agent-preview][data-prism-theme]:not(${family}), [data-agent-preview][data-prism-theme]:not(${family}) *))`;
function paintOnly(source) {
  postcss.parse(source).walkRules(r => {
    r.selectors.forEach(s => { assert.ok(s.includes(family)); assert.ok(s.includes(guard)); });
    r.walkDecls(d => { assert.ok(['border-radius','box-shadow'].includes(d.prop)); assert.equal(d.important, undefined); });
  });
}
test('P125 append-only visual CSS; no tokens, source components, coss or dependencies changed', () => {
  assert.equal(css.slice(0, css.indexOf(marker)), before(cssPath)); paintOnly(block);
  transform({ code: Buffer.from(block), minify: true });
  for (const p of ['app/(next)/next/theme.css','package.json','package-lock.json']) assert.equal(read(p), before(p));
  const changed = execFileSync('git', ['diff', baseline, '--name-only', '--', 'components/coss', 'components/prism-next'], {cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
  assert.ok(changed.every(p => changedDemos.includes(p)), changed.join('\n'));
  for (const prop of ['padding','margin','gap','width','height','display','position','overflow','transform','font-size','--new-token']) assert.throws(() => paintOnly(block.replace('border-radius:0;', `border-radius:0;${prop}:0;`)));
  assert.throws(() => paintOnly(block.replaceAll(guard, '')));
});
test('P125 targets only audited surfaces, retains rings and excludes semantic circles', () => {
  for (const anchor of ['collapsible','number-field-group','textarea-control','badge','agent-well','agent-capsule','paper-variant','table-cell','review-region-hit','command','学习目标','prism-signature','expression-starters','data-paper-size','data-agent-preview']) assert.ok(block.includes(anchor), anchor);
  assert.doesNotMatch(block, /data-step-marker|data-paper-success|data-paper-pending|data-slot="(?:avatar|radio)"/);
  sheet.walkDecls('box-shadow', d => { assert.ok(d.value.includes('--tw-ring-offset-shadow')); assert.ok(d.value.includes('--tw-ring-shadow')); });
  const paper = read('components/prism-next/paper-preview-mixed.tsx');
  assert.match(paper, /shadow-2xl transition-opacity/); assert.match(paper, /"opacity-100" : "opacity-65"/);
});


test('P125 shipped Agent page integration: theme menu → Blueprints → 390 / 1280 → original example', () => {
  const entry = api.agentComponentRegistry.find(e => e.slug === 'agent-resource-retriever') ?? api.agentComponentRegistry[0];
  const tree = () => { hookCursor = 0; return probe.AgentComponentPage({entry, contract: []}); };
  const all = node => Array.isArray(node) ? node.flatMap(all) : React.isValidElement(node) ? [node, ...all(node.props.children)] : [];
  const select = (label, value) => { const control = all(tree()).find(n => n.props.label === label && typeof n.props.onChange === 'function'); assert.ok(control, label); assert.ok(control.props.items.some(i => i.value === value)); control.props.onChange(value); };
  assert.equal(all(tree()).find(n => n.type === probe.AgentPreviewFrame).props.theme, 'site');
  for (const theme of ['blueprint','blueprint-night','light','paper','dark']) for (const width of ['390','1280']) {
    select('预览主题', theme); select('预览宽度', width);
    const frames = all(tree()).filter(n => n.type === probe.AgentPreviewFrame);
    assert.ok(frames.length); assert.ok(frames.every(n => n.props.theme === theme && n.props.width === width));
    const html = render(frames[0]); assert.ok(html.includes(`data-prism-theme="${theme}"`)); assert.ok(html.includes(`width:${width}px`));
    assert.ok(frames[0].props.children.props.entry === entry, 'same shipped entry, no alternate Blueprint component');
  }
});

// Evaluate the actual selector AST against both preview roots and descendants.
function parseSelector(selector) { let ast; transform({code:Buffer.from(`${selector}{color:red}`),visitor:{Selector(value){ast=value;}}}); return ast; }
const node = (attrs = {}, parent, tag = 'div') => { const n = {attrs,parent,tag,children:[]}; parent?.children.push(n); return n; };
function matches(ast, n, pseudo) {
  if (!n) return false;
  const split = ast.findLastIndex(s => s.type === 'combinator');
  if (split >= 0) {
    if (!matches(ast.slice(split+1), n, pseudo)) return false;
    if (ast[split].value === 'child') return matches(ast.slice(0,split), n.parent);
    assert.equal(ast[split].value, 'descendant');
    for(let p=n.parent;p;p=p.parent) if(matches(ast.slice(0,split),p)) return true;
    return false;
  }
  return ast.every(s => {
    if(s.type==='universal') return true;
    if(s.type==='type') return s.name===n.tag;
    if(s.type==='class') return (n.attrs.class??'').split(' ').includes(s.name);
    if(s.type==='attribute') {
      if(!s.operation) return Object.hasOwn(n.attrs,s.name);
      if(s.operation.operator==='equal') return n.attrs[s.name]===s.operation.value;
      if(s.operation.operator==='suffix') return n.attrs[s.name]?.endsWith(s.operation.value)??false;
      assert.fail(JSON.stringify(s));
    }
    if(s.type==='pseudo-element') return s.kind===pseudo;
    if(s.type==='pseudo-class') {
      if(['is','where','not'].includes(s.kind)) {const any=s.selectors.some(v=>matches(v,n,pseudo));return s.kind==='not'?!any:any;}
      if(s.kind==='has') { const descendants=p=>p.children.flatMap(c=>[c,...descendants(c)]);return descendants(n).some(c=>s.selectors.some(v=>matches(v,c))); }
    }
    assert.fail(JSON.stringify(s));
  });
}
const rules = sheet.nodes.filter(n=>n.type==='rule').flatMap(r=>r.selectors.map(s=>({ast:parseSelector(s),pseudo:s.includes('::before'),decls:Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]))})));
const style = (n,pseudo) => Object.assign({},...rules.filter(r=>r.pseudo===Boolean(pseudo)&&matches(r.ast,n,pseudo)).map(r=>r.decls));
function targets(parent) {
  const command = node({class:'max-w-lg overflow-hidden rounded-2xl'},parent); node({'data-slot':'command-list'},command);
  return [node({'data-slot':'collapsible'},parent),node({class:'shadow-xs/5 ring-1'},parent,'header'),node({'data-slot':'number-field-group'},parent),node({'data-slot':'textarea-control',class:'border'},parent),node({'data-slot':'badge',class:'prism-icon-count-badge text-component-label'},parent),node({'data-agent-well':''},parent),node({'data-agent-capsule':''},parent),node({'data-paper-variant':'sheet'},parent,'article'),node({class:'rounded-sm'},node({'data-paper-sheet-media':''},parent),'span'),node({'data-slot':'table-cell'},parent,'td'),node({'data-slot':'card'},parent),node({class:'review-region-hit'},parent,'button'),node({'data-paper-size':'crop',class:'shadow-2xl'},parent),node({'aria-label':'G1 学习目标'},parent,'article'),command];
}
for (const theme of ['blueprint','blueprint-night']) test(`P125 ${theme}: selectors cover targets and exclude nested core roots / descendants / pseudos`, () => {
  const outer = node({'data-prism-theme':theme});
  const painted = targets(outer).map(n=>style(n)); assert.ok(painted.every(v=>Object.keys(v).length));
  assert.equal(painted[4]['border-radius'],'0');
  assert.equal(style(node({'data-agent-preview':'','data-prism-theme':theme,class:'rounded-xl'},undefined,'section'))['border-radius'],'0');
  for(const core of ['light','paper','dark']) {
    const plain=node({'data-prism-theme':core});
    const local=node({'data-agent-preview':'','data-prism-theme':core},outer);
    for(const n of [...targets(plain),...targets(local),...targets(outer).map(n=>({...n,attrs:{...n.attrs,'data-agent-preview':'','data-prism-theme':core}}))]) {
      assert.deepEqual(style(n),{}); assert.deepEqual(style(n,'before'),{});
    }
  }
});

// P125-r1: run the Supervisor's reported routes through the shipped page + lazy demos,
// then match the real SSR elements against the shipped CSS. No hand-authored target DOM.
function htmlNodes(html, parent) {
  const stack = [parent], out = [], voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for (const m of html.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    if (m[0].startsWith('</')) { assert.equal(stack.pop()?.tag, m[1]); continue; }
    const attrs = Object.fromEntries([...m[0].slice(m[1].length + 1, -1).matchAll(/([^\s=]+)(?:="([^"]*)")?/g)].map(a => [a[1], a[2] ?? '']));
    const n = node(attrs, stack.at(-1), m[1]); out.push(n);
    if (!voids.has(m[1]) && !m[0].endsWith('/>')) stack.push(n);
  }
  assert.equal(stack.length, 1); return out;
}
const hasClass = (n, c) => (n.attrs.class ?? '').split(' ').includes(c);
const coreAncestor = n => { for (let p=n;p;p=p.parent) if (Object.hasOwn(p.attrs,'data-agent-preview') && ['light','paper','dark'].includes(p.attrs['data-prism-theme'])) return p; };
const residuals = [
  ['record-list', n => n.attrs['data-slot'] === 'pagination-link', ['box-shadow']],
  ['table', n => n.attrs['data-slot'] === 'pagination-link', ['box-shadow']],
  ['paper-preview', n => hasClass(n,'relative') && hasClass(n,'mx-auto') && Object.hasOwn(n.attrs,'data-paper-size'), ['box-shadow']],
  ['/next/reviews/paper-review', n => hasClass(n,'relative') && hasClass(n,'mx-auto') && Object.hasOwn(n.attrs,'data-paper-size'), ['box-shadow']],
  ['command', n => hasClass(n,'max-w-lg') && hasClass(n,'overflow-hidden'), ['border-radius','box-shadow']],
  ['command', n => hasClass(n,'relative') && hasClass(n,'-mx-px'), ['border-radius','box-shadow']],
  ['answer-review-map', n => hasClass(n,'review-sheet'), ['box-shadow']],
  ['/next/agent', n => hasClass(n,'parsing-embedded'), ['border-radius']],
];
async function routeNodes(route, theme) {
  if (route === '/next/agent') {
    // Execute the shipped mount effect against empty isolated storage, then render
    // the same real route after readiness. Plain SSR intentionally shows loading.
    parsingSlots.length=0; parsingEffects.length=0; parsingCursor=0;
    const element=await page(parsing,route);
    assert.match(render(element), /正在读取本机示例进度/);
    const previousWindow=globalThis.window, previousStorage=globalThis.localStorage;
    const reads=[];
    try {
      globalThis.window={location:{search:''}};
      globalThis.localStorage={getItem(key){reads.push(key);return null;}};
      parsingEffects[0]();
    } finally {
      if(previousWindow===undefined) delete globalThis.window; else globalThis.window=previousWindow;
      if(previousStorage===undefined) delete globalThis.localStorage; else globalThis.localStorage=previousStorage;
    }
    assert.deepEqual(reads,['ole-parsing-validation-v1:images']);
    parsingCursor=0;
    const html=render(element); assert.ok(html.includes('解析材料'));
    return htmlNodes(html,node({'data-prism-theme':theme}));
  }
  const element = await page(api, route);
  const stream = await renderToReadableStream(element); await stream.allReady; await stream.cancel();
  return htmlNodes(render(element), node({'data-prism-theme':theme}));
}
for (const theme of ['blueprint','blueprint-night']) test(`P125-r1 ${theme}: reported residuals match real route DOM, core previews stay excluded`, async t => {
  for (const [slug, predicate, properties] of residuals) {
    const route = slug.startsWith('/') ? slug : `/next/components/${slug}`;
    const nodes = await routeNodes(route, theme), found = nodes.filter(predicate), targets = found.filter(n => !coreAncestor(n));
    assert.ok(targets.length, `${route}: actual reported element must exist`);
    t.diagnostic(`${route}: matched=${targets.length}, explicit core excluded=${found.length-targets.length}`);
    for (const n of targets) {
      const declarations = style(n);
      for (const property of properties) assert.equal(declarations[property], property === 'border-radius' ? '0' : 'var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000)', `${route}: ${property}`);
      if (slug === 'command' && hasClass(n,'-mx-px')) assert.equal(style(n,'before')['border-radius'],'0');
      for (const coreTheme of ['light','paper','dark']) {
        // Reuse the real route subtree under a nested explicit core preview root.
        let top=n; while(top.parent?.parent) top=top.parent;
        const outer=top.parent, original={...outer.attrs};
        outer.attrs={'data-agent-preview':'','data-prism-theme':coreTheme};
        outer.parent=node({'data-prism-theme':theme});
        assert.deepEqual(style(n),{}); assert.deepEqual(style(n,'before'),{});
        outer.attrs=original; outer.parent=undefined;
      }
    }
    for (const n of found.filter(coreAncestor)) { assert.deepEqual(style(n),{}); assert.deepEqual(style(n,'before'),{}); }
  }
});
for (const theme of ['blueprint','blueprint-night']) test(`P125-r1 ${theme}: menu core preview controls and semantic circles remain excluded`, async t => {
  const menu = await routeNodes('/next/components/menu', theme);
  for (const slot of ['button','select-trigger','input-control','card']) {
    const controls = menu.filter(n => n.attrs['data-slot'] === slot && coreAncestor(n));
    assert.ok(controls.length, `menu has explicit core ${slot}`);
    t.diagnostic(`menu ${slot}: explicit core=${controls.length}, other=${menu.filter(n=>n.attrs['data-slot']===slot&&!coreAncestor(n)).length}`);
    for (const n of controls) { assert.deepEqual(style(n),{}); assert.deepEqual(style(n,'before'),{}); }
  }
  const selectors = ['.milestone-mark','.prism-app-bar-personal-trigger','[data-slot="popover-trigger"]','[data-slot="avatar"]','[data-slot="radio"]','[data-slot="switch-thumb"]','[data-step-marker]','[data-paper-success]','[data-paper-pending]'];
  const seen = new Set();
  for (const route of ['/next/components/switch','/next/components/goal-milestones','/next/components/stepper','/next/components/material-intake','/next/components/attachment','/next/components/data-station','/next/use-cases/workspace-app-bar']) {
    const nodes = await routeNodes(route,theme);
    for (const selector of selectors) for (const n of nodes.filter(n=>matches(parseSelector(selector),n))) {
      seen.add(selector); assert.deepEqual(style(n),{});
    }
  }
  assert.deepEqual([...seen].sort(), [...selectors].sort(), 'every preserved semantic target is exercised');
});
