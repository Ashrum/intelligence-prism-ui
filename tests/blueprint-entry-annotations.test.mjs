import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(root + p, 'utf8');
const sheetPath = 'components/prism-next/blueprint/blueprint.tsx';
const entryPath = 'components/prism-next/blueprint/entry-annotations.tsx';
const sheetSource = read(sheetPath), entrySource = read(entryPath);
const css = read('app/(next)/next/blueprint.css').match(/\/\* P87 entry annotations:[\s\S]*?\/\* End P87 entry annotations\. \*\//)[0];
const runtime = await createTestRuntime('p87-entry');
let serial = 0;
async function load(overrides = {}, hooks = false, demo = false) {
  const bundle = await build({ stdin: { contents: `export * from './${sheetPath}'; export * from './${entryPath}';` + (demo ? `export * from './components/prism-next/demos/blueprint';` : ''), resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: [{ name: 'p87-source-probe', setup(b) { b.onLoad({ filter: /(?:blueprint|entry-annotations)\.tsx$/ }, args => {
      const path = args.path.slice(root.length);
      if (![sheetPath, entryPath].includes(path)) return;
      let contents = overrides[path] ?? read(path);
      if (hooks) {
        contents = contents.replace(/\buseId, /, '').replace(/\buseState, /, '');
        contents += `\nconst useId = () => 'p87-id';
const useState = (initial: any) => { const p = (globalThis as any).__p87Probe; const i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (next: any) => { p.values[i] = typeof next === 'function' ? next(p.values[i]) : next }]; };`;
      }
      return { contents, loader: 'tsx' };
    }); } }],
  });
  const file = new URL(`entry-${serial++}.mjs`, runtime);
  writeFileSync(file, bundle.outputFiles[0].text);
  return import(file);
}
const api = await load({}, false, true), probe = await load({}, true), h = React.createElement;
const html = (name, props, a = api) => render(h(a[name], props));
const cases = [
  { title: '图纸', children: '正文' },
  { title: '题目与公式 x² + y²', letter: 'A', sheetNo: '1 / 4', description: '中文长标题与描述', className: 'caller', children: h('p', null, '长中文内容') },
  { title: '无标尺', rulers: false, headingLevel: 3, id: 'caller-sheet', children: '内容' },
  { title: '版本', folio: { kind: 'rev', value: 'v2' }, folioAriaHidden: true, titleActions: h('button', { type: 'button' }, '更多'), children: h('span', null, '成果') },
];
const baselinePath = 'tests/fixtures/blueprint-sheet-p87-main.json';
// Explicit baseline capture: git show reads the approved main commit, never candidate output.
if (process.env.P87_CAPTURE_BASELINE === '1') {
  const base = 'f472fa64e1761e85e26416a09e9fc333ba202d03';
  const original = execFileSync('git', ['show', `${base}:${sheetPath}`], { cwd: root, encoding: 'utf8' });
  const legacy = await load({ [sheetPath]: original });
  writeFileSync(root + baselinePath, JSON.stringify({ base, sourceSha256: createHash('sha256').update(original).digest('hex'), snapshots: cases.map(props => html('BlueprintSheet', props, legacy)) }, null, 2) + '\n');
}
test('P87: default BlueprintSheet SSR is byte-identical to four main snapshots without ID normalization', () => {
  const baseline = JSON.parse(read(baselinePath));
  assert.equal(baseline.base, 'f472fa64e1761e85e26416a09e9fc333ba202d03');
  cases.forEach((props, i) => assert.equal(html('BlueprintSheet', props), baseline.snapshots[i]));
});
const activeLabels = out => [...out.matchAll(/<span data-active="">([^<]+)<\/span>/g)].map(m => m[1]);
test('P87: controlled marks select exactly four matching cells; invalid / null marks select none', () => {
  for (let column = 0; column < 8; column++) for (let row = 0; row < 4; row++) {
    assert.deepEqual(activeLabels(html('BlueprintSheet', { title: '图纸', rulerMark: { column, row }, rulerTracking: true })), [String(column + 1), String(column + 1), 'ABCD'[row], 'ABCD'[row]]);
  }
  for (const rulerMark of [null, { column: -1, row: 0 }, { column: 8, row: 0 }, { column: 0, row: 4 }, { column: 0.1, row: 1 }, { column: NaN, row: 0 }]) assert.deepEqual(activeLabels(html('BlueprintSheet', { title: '图纸', rulerMark })), []);
});
function sheetProbe(a = probe) {
  globalThis.__p87Probe = { cursor: 0, values: [] };
  return props => { globalThis.__p87Probe.cursor = 0; return a.BlueprintSheet({ title: '图纸', ...props }); };
}
const pointer = (overrides = {}) => ({ pointerType: 'mouse', clientX: 250, clientY: 175, currentTarget: { getBoundingClientRect: () => ({ left: 100, top: 100, width: 800, height: 400 }) }, ...overrides });
function controlledPriority(a) {
  const draw = sheetProbe(a), props = { rulerTracking: true };
  draw(props).props.onPointerMove(pointer());
  assert.deepEqual(activeLabels(render(draw(props))), ['2', '2', 'A', 'A']);
  assert.deepEqual(activeLabels(render(draw({ ...props, rulerMark: null }))), []);
  const controlled = { ...props, rulerMark: { column: 6, row: 2 } };
  draw(controlled).props.onPointerMove(pointer({ clientX: 890, clientY: 490 }));
  assert.deepEqual(activeLabels(render(draw(controlled))), ['7', '7', 'C', 'C']);
  assert.deepEqual(globalThis.__p87Probe.values[0], { column: 1, row: 0 }, 'controlled moves do not update pointer state');
}
test('P87: actual pointer handlers honor controlled mark and explicit null over tracked state', () => controlledPriority(probe));
test('P87: pointer tracking clamps edges, ignores touch / disabled tracking, composes callbacks, and clears on leave', () => {
  const draw = sheetProbe(); let moves = 0, leaves = 0;
  const props = { rulerTracking: true, onPointerMove: () => moves++, onPointerLeave: () => leaves++ };
  draw(props).props.onPointerMove(pointer({ clientX: 900, clientY: 500 }));
  assert.deepEqual(activeLabels(render(draw(props))), ['8', '8', 'D', 'D']);
  draw(props).props.onPointerLeave({});
  assert.deepEqual(activeLabels(render(draw(props))), []);
  draw(props).props.onPointerMove(pointer({ pointerType: 'touch' }));
  assert.deepEqual(activeLabels(render(draw(props))), []);
  draw({ ...props, rulerTracking: false }).props.onPointerMove(pointer());
  assert.deepEqual(activeLabels(render(draw(props))), []);
  draw(props).props.onPointerMove(pointer({ pointerType: 'pen', clientX: -5, clientY: -5 }));
  assert.deepEqual(activeLabels(render(draw(props))), ['1', '1', 'A', 'A']);
  assert.equal(moves, 4); assert.equal(leaves, 1);
});
test('P87: rollback mutation losing explicit-null priority is caught by the same event probe', async () => {
  const changed = sheetSource.replace('rulerMark !== undefined ? rulerMark', 'rulerMark != null ? rulerMark');
  assert.notEqual(changed, sheetSource);
  const mutant = await load({ [sheetPath]: changed }, true);
  assert.throws(() => controlledPriority(mutant), { name: 'AssertionError' });
});
const row = { title: '结构关系', description: '三个节点', actionLabel: '查看关系', code: 'R02', icon: h('svg', null, h('path', { d: 'M0 0L1 1' })) };
test('P87: entry row has one native target, complete accessible name and native attributes', () => {
  for (const extra of [{}, { href: '/map', target: '_blank', rel: 'noreferrer', download: 'map' }, { disabled: true, name: 'entry', value: 'map' }]) {
    const out = html('BpEntryRow', { ...row, ...extra });
    assert.match(out, extra.href ? /^<a / : /^<button [^>]*type="button"/);
    assert.equal([...out.matchAll(/<(?:a|button|input|select|textarea)\b/g)].length, 1);
    const refs = out.match(/aria-labelledby="([^"]+)"/)[1].split(' ');
    const name = refs.map(id => out.match(new RegExp(`<span id="${id}"[^>]*>([^<]+)</span>`))[1]).join(' ');
    assert.equal(name, '结构关系 三个节点 查看关系');
    if (extra.href) for (const key of ['href', 'target', 'rel', 'download']) assert.ok(out.includes(`${key}="${extra[key]}"`));
    if (extra.disabled) assert.match(out, /disabled=""/);
  }
});
test('P87: entry row forwards hover / focus and composes click without overriding preventDefault', () => {
  for (const href of [undefined, '/map']) {
    let clicked = 0, selected = 0, entered = 0, focused = 0;
    const el = probe.BpEntryRow({ ...row, href, onPointerEnter: () => entered++, onFocus: () => focused++, onClick: () => clicked++, onSelect: () => selected++ });
    el.props.onPointerEnter(); el.props.onFocus(); el.props.onClick({ defaultPrevented: false }); el.props.onClick({ defaultPrevented: true });
    assert.deepEqual([clicked, selected, entered, focused], [2, 1, 1, 1]);
  }
});
test('P87: target-lock is a decorative SVG group, inactive children stop animations, halo is optional', () => {
  const out = html('BpTargetLock', { x: 25, y: 80, active: true, halo: true });
  assert.match(out, /^<g [^>]*aria-hidden="true"[^>]*transform="translate\(25 80\)"/);
  assert.match(out, /bp-target-lock-brackets/); assert.match(out, /bp-target-lock-halo/);
  assert.doesNotMatch(html('BpTargetLock', { x: 1, y: 2, active: false, halo: true }), /<circle|<path|animation/);
  assert.doesNotMatch(html('BpTargetLock', { x: 1, y: 2, active: true }), /bp-target-lock-halo/);
});
test('P87: callout positions all directions in percentages, uses HTML text, and hides inactive content', () => {
  for (const direction of ['ne', 'nw', 'se', 'sw']) {
    const props = { x: 100, y: 50, viewBox: [400, 200], direction, label: '结构关系', code: 'R02', meta: 'B2', active: true };
    const out = html('BpDiagramCallout', props);
    assert.match(out, /^<div [^>]*aria-hidden="true"/);
    assert.ok(out.includes(`style="left:25%;top:25%;width:${direction.endsWith('w') ? 25 : 75}%"`));
    assert.match(out, /<span>结构关系<\/span>/); assert.doesNotMatch(out, /<text\b/);
    assert.match(out, /<polyline points="0,(?:0 20,20 32,20|32 20,12 32,12)"/);
    assert.match(html('BpDiagramCallout', { ...props, active: false }), /hidden=""/);
  }
  assert.doesNotMatch(entrySource + sheetSource, /setTimeout|setInterval|requestAnimationFrame|Date\.now/);
});
// Selector AST checks scope only; no browser cascade / layout / focus claim.
function node(classes = [], attrs = {}, parent) { return { classes, attrs, parent }; }
function matches(s, n) {
  if (!n) return false;
  const split = s.findLastIndex(p => p.type === 'combinator');
  if (split >= 0) {
    assert.equal(s[split].value, 'descendant');
    if (!matches(s.slice(split + 1), n)) return false;
    for (let p = n.parent; p; p = p.parent) if (matches(s.slice(0, split), p)) return true;
    return false;
  }
  return s.every(p => {
    if (p.type === 'universal') return true;
    if (p.type === 'class') return n.classes.includes(p.name);
    if (p.type === 'attribute') return p.operation ? n.attrs[p.name] === p.operation.value : Object.hasOwn(n.attrs, p.name);
    if (p.type === 'pseudo-class' && ['is', 'where', 'not'].includes(p.kind)) { const any = p.selectors.some(q => matches(q, n)); return p.kind === 'not' ? !any : any; }
    assert.fail(`Unhandled selector ${JSON.stringify(p)}`);
  });
}
test('P87: accent selector includes new classes, excludes nested core roots/descendants and ordinary components', () => {
  const accent = postcss.parse(css).nodes.find(n => n.type === 'rule' && n.selector.startsWith(':is([data-prism-theme'));
  let ast;
  transform({ code: Buffer.from(`${accent.selector}{color:red}`), visitor: { Selector(value) { ast = value; } } });
  for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
    const outer = node([], { 'data-prism-theme': theme });
    for (const cls of ['bp-target-lock', 'bp-diagram-callout', 'bp-entry-row-action']) {
      const parent = node(['bp-entry-row'], { 'data-emphasis': '' }, outer);
      assert.equal(matches(ast, node([cls], {}, parent)), theme.startsWith('blueprint'));
      for (const core of ['light', 'paper', 'dark']) {
        const preview = node([cls], { 'data-agent-preview': '', 'data-prism-theme': core }, parent);
        assert.equal(matches(ast, preview), false);
        assert.equal(matches(ast, node([cls], {}, preview)), false);
      }
    }
    for (const cls of ['button', 'card', 'prism-card']) assert.equal(matches(ast, node([cls], {}, outer)), false);
  }
  postcss.parse(css).walkRules(rule => {
    if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
    for (const selector of rule.selectors) assert.match(selector, /\.bp-/, `unscoped rule: ${selector}`);
  });
  assert.doesNotMatch(css, /--[\w-]+\s*:/, 'no new token declarations');
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(|oklch\(/i, 'no literal palette');
});
test('P87: motion and responsive rules preserve static lock and single-target entry layout', () => {
  assert.match(css, /animation:bp-target-lock-in \.38s/);
  assert.match(css, /transform:scale\(2\.4\) rotate\(45deg\)/);
  const parsed = postcss.parse(css), reduced = parsed.nodes.find(n => n.type === 'atrule' && n.params === '(prefers-reduced-motion:reduce)');
  assert.ok(reduced.toString().includes('.bp-target-lock-brackets,.bp-target-lock-halo { animation:none; }'));
  assert.ok(reduced.toString().includes('transition:none'));
  assert.doesNotMatch(reduced.toString(), /display:none|opacity:0/);
  assert.match(css, /\.bp-ruler > span\[data-active\] \{ background:var\(--head-bg\); color:var\(--head-fg\)/);
  assert.match(css, /min-height:68px/); assert.match(css, /grid-column:3/);
  assert.match(css, /outline:2px solid var\(--ring\)/);
  assert.doesNotMatch(css, /border-(?:top|bottom):|\.bp-entry-row\s*\+/);
  assert.match(read('app/(next)/next/blueprint.css'), /@media[^{}]*max-width:\s*760px[\s\S]*?\.bp-sheet::before,\.bp-ruler \{ display:none; \}/);
});
test('P87: new E sheet contains exactly one link and two buttons with readable diagram facts', () => {
  const out = html('BlueprintComponentsDemo');
  const section = out.slice(out.indexOf('id="entry-annotations"'));
  assert.match(section, /SHEET 05 \/ 05/);
  assert.equal([...section.matchAll(/<a [^>]*class="bp-entry-row"/g)].length, 1);
  assert.equal([...section.matchAll(/<button [^>]*class="bp-entry-row"/g)].length, 2);
  assert.match(section, /资料索引连接结构关系/);
  assert.doesNotMatch(section, /示例|演示|教师|学生/);
});
