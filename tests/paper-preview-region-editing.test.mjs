import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL(`../.sites-runtime/paper-region-events-${process.pid}/`, import.meta.url);
await mkdir(dir, { recursive: true });
const contents = `export * from './components/prism-next/paper-preview-region-editor'; export * from './components/prism-next/paper-preview';`;
async function bundle(name, hooks = false) {
  const plugins = hooks ? [{ name: 'paper-region-stateful-hooks', setup(builder) {
    builder.onLoad({ filter: /paper-preview-(region-editor|continuous|mixed)\.tsx$/ }, async args => {
      let source = await readFile(args.path, 'utf8');
      source = source.replace(/import \{ ([^}]+) \} from "react"/, (_all, imports) => {
        const types = imports.split(',').map(value => value.trim()).filter(value => value.startsWith('type '));
        return `import { ${types.join(', ')} } from "react"`;
      });
      return { loader: 'tsx', contents: source + `\n${['useId', 'useRef', 'useState', 'useLayoutEffect'].map(name => `function ${name}(...args: any[]) { return (globalThis as any).__paperRegionHooks.${name}(...args) }`).join('\n')}` };
    });
  } }] : [];
  const result = await build({ stdin: { contents, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins });
  const file = new URL(name, dir);
  await writeFile(file, result.outputFiles[0].text);
  const api = await import(file);
  await rm(file);
  return api;
}
const api = await bundle('actual.mjs');
const events = await bundle('events.mjs', true);
const h = React.createElement;
const regions = [{ id: 'answer', label: '第 3 题作答', rect: [20, 30, 30, 40] }];
const page = { id: 'scan', imageUrl: '/scan.svg', dimensions: { width: 1000, height: 1000 }, width: 1000, height: 1000, regions };
function editing(overrides = {}) { return { pageId: 'scan', regionId: 'answer', label: '第 3 题作答', onChange() {}, ...overrides }; }
function close(actual, expected) { actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < 1e-9, `[${index}]: ${value} != ${expected[index]}`)); }
function walk(tree, result = []) {
  if (!React.isValidElement(tree)) return result;
  result.push(tree); React.Children.forEach(tree.props.children, child => walk(child, result));
  return result;
}

// Execute the actual event functions with persistent hook slots. DOM geometry,
// pointer capture and focus are explicit doubles; this does not claim browser QA.
let instanceId = 0;
function mount(Component, initial, attach = () => {}) {
  const slots = [], cleanups = [], effects = [];
  let cursor = 0, props = initial, nodes = [], tree;
  const id = ++instanceId;
  const hooks = {
    useId() { const index = cursor++; return slots[index] ??= `paper-region-${id}-${index}`; },
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useLayoutEffect(effect, deps) {
      const index = cursor++, prior = slots[index];
      if (!prior || deps.some((value, i) => !Object.is(value, prior[i]))) effects.push(() => { cleanups[index]?.(); cleanups[index] = effect(); });
      slots[index] = deps;
    },
  };
  function draw(next = props) {
    props = next; cursor = 0;
    const previous = globalThis.__paperRegionHooks;
    globalThis.__paperRegionHooks = hooks;
    try { tree = Component(props); nodes = walk(tree); attach(nodes); }
    finally { globalThis.__paperRegionHooks = previous; }
    const observer = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { observe() {} disconnect() {} };
    try { effects.splice(0).forEach(effect => effect()); }
    finally { globalThis.ResizeObserver = observer; }
    return tree;
  }
  draw();
  return { draw, get props() { return props; }, get tree() { return tree; }, get nodes() { return nodes; }, dispose() { cleanups.forEach(cleanup => cleanup?.()); } };
}
function element(kind, bounds = { left: 100, top: 200, width: 1000, height: 1000 }) {
  const captures = new Set(), focus = [];
  const node = {
    focusCalls: focus, getBoundingClientRect: () => ({ ...bounds, right: bounds.left + bounds.width, bottom: bounds.top + bounds.height }),
    focus: options => focus.push(options), setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id),
    closest: selector => selector === '[data-paper-region-editor]' && kind !== 'outside' ? node : null,
    contains: target => !!target?.inside, inside: kind !== 'outside',
  };
  return node;
}
function editorFixture(overrides = {}) {
  const changed = [], created = [], rootNode = element('editor'), areaNode = element('area');
  const props = { editing: editing({ onChange: value => changed.push(value), onCreate: value => created.push(value) }), regions, rotation: 0, geometryKey: '0:100:1000:1000:1', cancelRef: { current: null }, ...overrides };
  const instance = mount(events.PaperPreviewRegionEditor, props, nodes => {
    for (const node of nodes) {
      if (node.props['data-paper-region-editor']) node.props.ref.current = rootNode;
      else if (node.type === 'div' && node.props.ref) node.props.ref.current = areaNode;
    }
  });
  return {
    ...instance, instance, changed, created, rootNode, areaNode,
    get view() { return instance.nodes[0].props; },
    get area() { return instance.nodes.find(node => node.type === 'div' && node.props.style)?.props; },
    draw(next) { instance.draw(next); },
    pointer(pointerId, x, y, extra = {}) { return { pointerId, clientX: 100 + x * 1000, clientY: 200 + y * 1000, pointerType: 'mouse', button: 0, isPrimary: true, target: areaNode, currentTarget: rootNode, preventDefault() {}, ...extra }; },
  };
}
function key(key, extra = {}) { return { key, nativeEvent: {}, shiftKey: false, preventDefault() {}, stopPropagation() {}, ...extra }; }

test('editing SSR exposes a focusable named region, linked instructions and exactly eight handles', () => {
  const html = render(h(api.PaperPreviewRegionEditor, { editing: editing(), regions, rotation: 0, geometryKey: 'x', cancelRef: { current: null } }));
  assert.match(html, /role="group" tabindex="0" aria-label="第 3 题作答，调整作答区域"/);
  const description = html.match(/aria-describedby="([^"]+)"/)[1];
  assert.ok(html.includes(`id="${description}"`));
  for (const text of ['方向键', '0.5%', 'Shift', 'Esc', '双指', '退出编辑']) assert.ok(html.includes(text));
  assert.equal((html.match(/data-region-handle=/g) ?? []).length, 8);
  for (const handle of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) assert.ok(html.includes(`data-region-handle="${handle}"`));
});

test('create drag commits once on release using final pointer coordinates; host rejection clears the draft', () => {
  const created = [], fixture = editorFixture({ editing: editing({ regionId: null, onCreate: value => created.push(value) }) });
  assert.equal(fixture.view.tabIndex, 0); assert.match(fixture.view['aria-label'], /框选作答区域/);
  fixture.view.onPointerDown(fixture.pointer(1, .2, .3));
  fixture.view.onPointerMove(fixture.pointer(1, .5, .6)); fixture.draw();
  assert.ok(fixture.area); assert.equal(created.length, 0);
  fixture.view.onPointerUp(fixture.pointer(1, .6, .8)); fixture.view.onPointerUp(fixture.pointer(1, .9, .9)); fixture.draw();
  assert.equal(created.length, 1); close(created[0].rect, [.2, .3, .4, .5]);
  assert.equal(created[0].regionId, null); assert.equal(created[0].pageId, 'scan'); assert.equal(created[0].label, '第 3 题作答');
  assert.equal(fixture.area, undefined); assert.equal(fixture.changed.length, 0);
  assert.equal(fixture.rootNode.focusCalls.length, 1);
});

test('moving commits one normalized intent, and unchanged controlled facts restore the original region', () => {
  const fixture = editorFixture();
  fixture.view.onPointerDown(fixture.pointer(1, .3, .4)); fixture.view.onPointerMove(fixture.pointer(1, .4, .5)); fixture.draw();
  assert.equal(fixture.changed.length, 0); close([parseFloat(fixture.area.style.left)], [30]);
  fixture.view.onPointerUp(fixture.pointer(1, .5, .6)); fixture.draw();
  assert.equal(fixture.changed.length, 1); close(fixture.changed[0].rect, [.4, .5, .3, .4]);
  assert.equal(fixture.area.style.left, '20%'); assert.equal(fixture.area.style.top, '30%');
  assert.equal(fixture.areaNode.focusCalls.length, 1);
  const accepted = [{ ...regions[0], rect: [40, 50, 30, 40] }];
  fixture.draw({ ...fixture.instance.props, regions: accepted });
  assert.equal(fixture.area.style.left, '40%'); assert.equal(fixture.area.style.top, '50%');
});

test('pointerup without a move event still commits its final geometry and clicks below threshold do not', () => {
  const fixture = editorFixture();
  fixture.view.onPointerDown(fixture.pointer(1, .3, .4)); fixture.view.onPointerUp(fixture.pointer(1, .5, .6));
  close(fixture.changed[0].rect, [.4, .5, .3, .4]);
  fixture.view.onPointerDown(fixture.pointer(2, .3, .4)); fixture.view.onPointerUp(fixture.pointer(2, .303, .402));
  assert.equal(fixture.changed.length, 1);
});

test('handle drags use the source edge and keep the opposite edge fixed after rotation', () => {
  const fixture = editorFixture({ rotation: 90 });
  const handle = { ...fixture.areaNode, closest: selector => selector === '[data-region-handle]' ? { dataset: { regionHandle: 'n' } } : fixture.rootNode };
  fixture.view.onPointerDown(fixture.pointer(1, .7, .2, { target: handle }));
  fixture.view.onPointerUp(fixture.pointer(1, .8, .2, { target: handle }));
  close(fixture.changed[0].rect, [.2, .2, .3, .5]);
});

test('Esc, pointercancel, lost capture and outside blur discard drafts without callbacks', () => {
  for (const cancel of ['escape', 'onPointerCancel', 'onLostPointerCapture', 'blur']) {
    const fixture = editorFixture();
    fixture.view.onPointerDown(fixture.pointer(1, .3, .4)); fixture.view.onPointerMove(fixture.pointer(1, .5, .6)); fixture.draw();
    if (cancel === 'escape') fixture.view.onKeyDown(key('Escape'));
    else if (cancel === 'blur') fixture.view.onBlur({ currentTarget: fixture.rootNode, relatedTarget: null });
    else fixture.view[cancel](fixture.pointer(1, .5, .6));
    fixture.view.onPointerUp(fixture.pointer(1, .6, .7)); fixture.draw();
    assert.equal(fixture.changed.length, 0, cancel); assert.equal(fixture.area.style.left, '20%', cancel);
  }
});

test('host geometry or transform changes cancel in-flight pointer baselines', () => {
  for (const update of [{ geometryKey: '90:100:1000:1000:1', rotation: 90 }, { regions: [{ ...regions[0], rect: [10, 10, 30, 40] }] }]) {
    const fixture = editorFixture();
    fixture.view.onPointerDown(fixture.pointer(1, .3, .4)); fixture.view.onPointerMove(fixture.pointer(1, .5, .6));
    fixture.draw({ ...fixture.instance.props, ...update }); fixture.view.onPointerUp(fixture.pointer(1, .6, .7));
    assert.equal(fixture.changed.length, 0);
  }
});

test('keyboard moves and Shift resizes source facts; modified/composing keys do not emit intents', () => {
  const fixture = editorFixture({ rotation: 90 });
  fixture.view.onKeyDown(key('ArrowRight')); close(fixture.changed[0].rect, [.2, .295, .3, .4]);
  fixture.view.onKeyDown(key('ArrowRight', { shiftKey: true })); close(fixture.changed[1].rect, [.2, .295, .3, .405]);
  for (const extra of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { nativeEvent: { isComposing: true } }]) fixture.view.onKeyDown(key('ArrowRight', extra));
  fixture.view.onKeyDown(key('Tab')); assert.equal(fixture.changed.length, 2);
});

test('Enter/Space create accessible centered intents without retaining a local region', () => {
  const created = [], fixture = editorFixture({ editing: editing({ regionId: null, onCreate: value => created.push(value) }) });
  fixture.view.onKeyDown(key('Enter')); fixture.view.onKeyDown(key(' ')); fixture.draw();
  assert.equal(created.length, 2); created.forEach(value => close(value.rect, [.4, .4, .2, .2]));
  assert.equal(fixture.area, undefined);
});

test('keyboard creation expands to minSize before centering, including a full-page maximum', () => {
  for (const [minSize, expected] of [[.4, [.3, .3, .4, .4]], [2, [0, 0, 1, 1]]]) {
    const created = [], fixture = editorFixture({ editing: editing({ regionId: null, minSize, onCreate: value => created.push(value) }) });
    fixture.view.onKeyDown(key('Enter')); fixture.view.onKeyDown(key(' ')); fixture.draw();
    assert.equal(created.length, 2); created.forEach(value => close(value.rect, expected));
    assert.equal(fixture.area, undefined);
  }
});

test('arrows during a pointer drag are consumed without emitting a competing keyboard intent', () => {
  const fixture = editorFixture();
  let prevented = 0, stopped = 0;
  fixture.view.onPointerDown(fixture.pointer(1, .3, .4)); fixture.view.onPointerMove(fixture.pointer(1, .4, .5));
  for (const name of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) fixture.view.onKeyDown(key(name, { shiftKey: true, preventDefault() { prevented++; }, stopPropagation() { stopped++; } }));
  assert.equal(prevented, 4); assert.equal(stopped, 4); assert.equal(fixture.changed.length, 0);
  fixture.view.onPointerUp(fixture.pointer(1, .4, .5));
  assert.equal(fixture.changed.length, 1); close(fixture.changed[0].rect, [.3, .4, .3, .4]);
});

function canvasFixture(mode, editingOverride = editing()) {
  const zooms = [], changed = [], listeners = new Map();
  const paperNode = { dataset: { pageId: 'scan', percent: '100' }, getBoundingClientRect: () => ({ left: 100, top: 200, right: 1100, bottom: 1200, width: 1000, height: 1000 }) };
  const node = { scrollLeft: 100, scrollTop: 100, clientWidth: 1072, clientHeight: 1016, getBoundingClientRect: () => ({ left: 0, top: 0, right: 1300, bottom: 1400, width: 1300, height: 1400 }), querySelectorAll: () => [paperNode], querySelector: selector => selector.includes('question') ? null : paperNode, addEventListener: (name, listener) => listeners.set(name, listener), removeEventListener: name => listeners.delete(name) };
  const props = { viewportRef: { current: node }, pages: [page], zoom: 100, rotations: {}, scale: 1, onZoom: value => zooms.push(value), selected: 'answer', onSelect() {}, onVisiblePage() {}, onViewport() {}, headers: {}, activePage: 'scan', topInset: 0, regionEditing: { ...editingOverride, onChange: value => changed.push(value) } };
  const parent = mount(mode === 'continuous' ? events.PaperPreviewContinuous : events.PaperPreviewMixed, props);
  const child = parent.nodes.find(node => node.type === events.PaperPreviewRegionEditor);
  const fixture = child ? editorFixture(child.props) : null;
  const view = parent.nodes[0].props;
  return {
    parent, view, fixture, zooms, changed, node, listeners,
    dispatch(name, event, bubble = true) { fixture?.view[name]?.(event); if (bubble) view[name]?.(event); },
  };
}

for (const mode of ['continuous', 'mixed']) {
  test(`${mode}: single-pointer editing does not pan; a second pointer cancels the draft and pinches`, () => {
    const canvas = canvasFixture(mode), fixture = canvas.fixture;
    const pointer = (id, x, y, extra = {}) => fixture.pointer(id, x, y, { pointerType: 'touch', ...extra });
    canvas.dispatch('onPointerDown', pointer(1, .3, .4)); canvas.dispatch('onPointerMove', pointer(1, .35, .45)); fixture.draw();
    assert.equal(canvas.node.scrollLeft, 100); assert.equal(canvas.node.scrollTop, 100); assert.equal(canvas.changed.length, 0);
    assert.notEqual(fixture.area.style.left, '20%');
    canvas.dispatch('onPointerDown', pointer(2, .45, .45, { isPrimary: false })); fixture.draw();
    assert.equal(fixture.area.style.left, '20%');
    assert.equal(fixture.areaNode.hasPointerCapture(2), true, 'canvas captures the secondary pointer skipped by the editor');
    canvas.dispatch('onPointerMove', pointer(2, .55, .45, { isPrimary: false }));
    close(canvas.zooms, [200]);
    canvas.dispatch('onPointerUp', pointer(2, .55, .45, { isPrimary: false }));
    assert.equal(fixture.areaNode.hasPointerCapture(2), false);
    canvas.dispatch('onPointerMove', pointer(1, .5, .5)); canvas.dispatch('onPointerUp', pointer(1, .5, .5));
    assert.equal(canvas.changed.length, 0); assert.equal(canvas.node.scrollLeft, 100); assert.equal(canvas.node.scrollTop, 100);
    canvas.parent.dispose();
  });

  test(`${mode}: outside-region dragging still pans and wheel zoom cancels an editing draft`, () => {
    const canvas = canvasFixture(mode), fixture = canvas.fixture, outside = element('outside');
    const first = fixture.pointer(1, .1, .1, { target: outside });
    canvas.view.onPointerDown(first); canvas.view.onPointerMove({ ...first, clientX: first.clientX + 30, clientY: first.clientY + 20 }); canvas.view.onPointerUp(first);
    assert.equal(canvas.node.scrollLeft, 70); assert.equal(canvas.node.scrollTop, 80);
    canvas.dispatch('onPointerDown', fixture.pointer(2, .3, .4)); canvas.dispatch('onPointerMove', fixture.pointer(2, .4, .5)); fixture.draw();
    canvas.listeners.get('wheel')({ ctrlKey: true, clientX: 500, clientY: 600, deltaY: -10, deltaMode: 0, preventDefault() {} }); fixture.draw();
    canvas.dispatch('onPointerUp', fixture.pointer(2, .5, .6));
    assert.equal(canvas.changed.length, 0); assert.equal(fixture.area.style.left, '20%');
    assert.equal(canvas.zooms.length, 1); assert.ok(canvas.zooms[0] > 100);
    canvas.parent.dispose();
  });

  test(`${mode}: exit, page/region changes and missing targets clear gestures before panning or re-entering editing`, () => {
    const transitions = {
      exit: props => ({ ...props, regionEditing: undefined }),
      page: props => ({ ...props, pages: [{ ...page, id: 'next-page' }], regionEditing: { ...props.regionEditing, pageId: 'next-page' } }),
      region: props => ({ ...props, pages: [{ ...page, regions: [{ ...regions[0], id: 'next-answer' }] }], regionEditing: { ...props.regionEditing, regionId: 'next-answer' } }),
      missing: props => ({ ...props, pages: [{ ...page, regions: [] }] }),
    };
    for (const [reason, transition] of Object.entries(transitions)) {
      const canvas = canvasFixture(mode), fixture = canvas.fixture, originalProps = canvas.parent.props;
      canvas.dispatch('onPointerDown', fixture.pointer(1, .3, .4, { pointerType: 'touch' }));
      canvas.dispatch('onPointerMove', fixture.pointer(1, .4, .5, { pointerType: 'touch' })); fixture.draw();
      assert.notEqual(fixture.area.style.left, '20%', reason);

      // No pointerup arrives before the host removes or replaces the editing target.
      canvas.parent.draw(transition(originalProps)); fixture.draw();
      let view = canvas.parent.nodes[0].props, stopped = 0;
      view.onClickCapture({ detail: 1, preventDefault() {}, stopPropagation() { stopped++; } });
      assert.equal(stopped, 0, `${reason}: click suppression resets`);
      assert.equal(fixture.area.style.left, '20%', `${reason}: previous draft cancels`);
      fixture.view.onPointerUp(fixture.pointer(1, .6, .7));
      assert.equal(canvas.changed.length, 0, `${reason}: stale pointer cannot commit`);
      view.onPointerMove(fixture.pointer(1, .6, .7));
      assert.equal(canvas.node.scrollLeft, 100); assert.equal(canvas.node.scrollTop, 100);
      fixture.instance.dispose();

      const outside = element('outside'), pan = fixture.pointer(2, .1, .1, { pointerType: 'touch', target: outside });
      view.onPointerDown(pan); view.onPointerMove({ ...pan, clientX: pan.clientX + 30, clientY: pan.clientY + 20 }); view.onPointerUp(pan);
      assert.equal(canvas.node.scrollLeft, 70, `${reason}: next pointer pans normally`);
      assert.equal(canvas.node.scrollTop, 80); assert.equal(canvas.zooms.length, 0, `${reason}: no phantom pinch`);

      // Enter editing while another outside pointer remains down: the new session
      // also clears that pointer instead of treating the editor pointer as a pinch.
      view.onPointerDown({ ...pan, pointerId: 3 });
      canvas.parent.draw(originalProps);
      view = canvas.parent.nodes[0].props;
      const child = canvas.parent.nodes.find(node => node.type === events.PaperPreviewRegionEditor);
      const next = editorFixture(child.props);
      const down = next.pointer(4, .3, .4, { pointerType: 'touch' }), up = next.pointer(4, .4, .5, { pointerType: 'touch' });
      next.view.onPointerDown(down); view.onPointerDown(down);
      next.view.onPointerMove(up); view.onPointerMove(up);
      next.view.onPointerUp(up); view.onPointerUp(up);
      assert.equal(canvas.changed.length, 1, `${reason}: next editing gesture commits`);
      close(canvas.changed[0].rect, [.3, .4, .3, .4]);
      assert.equal(canvas.zooms.length, 0, `${reason}: re-entry cannot pinch with a stale pointer`);
      assert.equal(canvas.node.scrollLeft, 70); assert.equal(canvas.node.scrollTop, 80);
      next.instance.dispose(); canvas.parent.dispose();
    }
  });
}

test('mixed accepts a second pointer on a button while an editing pointer is active', () => {
  const canvas = canvasFixture('mixed'), fixture = canvas.fixture, button = element('outside');
  button.closest = selector => selector.includes('button') ? button : null;
  canvas.dispatch('onPointerDown', fixture.pointer(1, .3, .4, { pointerType: 'touch' }));
  canvas.dispatch('onPointerMove', fixture.pointer(1, .35, .45, { pointerType: 'touch' })); fixture.draw();
  const second = fixture.pointer(2, .45, .45, { pointerType: 'touch', isPrimary: false, target: button });
  canvas.view.onPointerDown(second); fixture.draw();
  assert.equal(fixture.area.style.left, '20%'); assert.equal(button.hasPointerCapture(2), true);
  canvas.view.onPointerMove({ ...second, clientX: second.clientX + 100 }); close(canvas.zooms, [200]);
  canvas.view.onPointerUp(second); canvas.dispatch('onPointerUp', fixture.pointer(1, .5, .6, { pointerType: 'touch' }));
  assert.equal(canvas.changed.length, 0); assert.equal(button.hasPointerCapture(2), false);
  canvas.parent.dispose();
});

test('adjust mode replaces the selected viewer hit target while preserving location and other regions', () => {
  for (const mode of ['continuous', 'mixed']) {
    const other = { id: 'other', label: '其他作答', rect: [5, 5, 10, 10] };
    const props = { pages: [{ ...page, regions: [...regions, other] }], regionEditing: editing(), zoom: 100, rotations: {}, viewportRef: { current: null }, headers: {}, activePage: 'scan', scale: 1, topInset: 0, onZoom() {}, onSelect() {}, onVisiblePage() {}, onViewport() {} };
    const Component = mode === 'continuous' ? api.PaperPreviewContinuous : api.PaperPreviewMixed;
    const html = render(h(Component, props));
    assert.equal((html.match(/data-region="answer"/g) ?? []).length, 1, mode);
    assert.match(html, /data-editable-region="answer" data-region="answer"/);
    assert.doesNotMatch(html, /aria-label="定位第 3 题作答"/);
    assert.match(html, /data-region="other"/); assert.match(html, /aria-label="定位其他作答"/);
  }
});

test('continuous/mixed enable editing only on the requested editable page and reject missing region/create callback', () => {
  for (const mode of ['continuous', 'mixed']) {
    for (const value of [editing({ pageId: 'absent' }), editing({ regionId: 'absent' }), editing({ regionId: null, onCreate: undefined })]) {
      const canvas = canvasFixture(mode, value); assert.equal(canvas.fixture, null); canvas.parent.dispose();
    }
    const props = { pages: [page], zoom: 100, rotations: {}, viewportRef: { current: null }, headers: {}, activePage: 'scan', scale: 1, topInset: 0, onZoom() {}, onSelect() {}, onVisiblePage() {}, onViewport() {} };
    const Component = mode === 'continuous' ? api.PaperPreviewContinuous : api.PaperPreviewMixed;
    assert.equal(render(h(Component, props)), render(h(Component, { ...props, regionEditing: undefined })));
    assert.doesNotMatch(render(h(Component, props)), /data-paper-region-editor|data-region-handle/);
  }
});

test('mixed digital content never mounts the editor even with a matching region and creation callback', () => {
  for (const regionId of [null, 'answer']) {
    const props = { pages: [{ ...page, content: h('article', {}, '数字题面') }], regionEditing: editing({ regionId, onCreate() {} }), viewportRef: { current: null }, zoom: 100, rotations: {}, headers: {}, activePage: 'scan', scale: 1, topInset: 0, onZoom() {}, onSelect() {}, onVisiblePage() {}, onViewport() {} };
    const html = render(h(api.PaperPreviewMixed, props));
    assert.match(html, /数字题面/); assert.doesNotMatch(html, /data-paper-region-editor|data-region-handle/);
  }
});
