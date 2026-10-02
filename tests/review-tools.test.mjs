import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Executes review host handlers with deterministic hooks, not browser input or coss internals.
const root = fileURLToPath(new URL('../', import.meta.url));
const probe = new URL('../.sites-runtime/review-tools-test/probe.mjs', import.meta.url);
await mkdir(new URL('.', probe), { recursive: true });
const result = await build({ stdin: { contents: "export { ReviewTools } from './examples/review-tools/review-tools'", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'review-tools-events', setup(build) {
  build.onLoad({ filter: /examples\/review-tools\/review-tools\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace(/import \{ useEffect[^\n]+from "react"/, `
const useState = (initial: any): any => { const h = (globalThis as any).__toolsHost; const i = h.cursor++; if (!(i in h.values)) h.values[i] = initial; return [h.values[i], (v: any) => { h.values[i] = typeof v === 'function' ? v(h.values[i]) : v }]; };
const useRef = (initial: any): any => { const h = (globalThis as any).__toolsHost; const i = h.cursor++; if (!(i in h.values)) h.values[i] = { current: initial }; return h.values[i]; };
const useEffect = (callback: any, deps: any[]) => { const h = (globalThis as any).__toolsHost; const i = h.cursor++; const old = h.values[i]; if (!old || deps.some((d: any, index: number) => !Object.is(d, old.deps[index]))) { h.values[i] = { deps }; h.effects.push(() => { old?.cleanup?.(); const cleanup = callback(); h.values[i].cleanup = cleanup; return cleanup; }); } };
const useId = () => 'review-test';`)
    .replace('import { ThemePicker } from "@/components/prism-next/shell"', 'const ThemePicker = () => null') }));
} }] });
await writeFile(probe, result.outputFiles[0].text);
const { ReviewTools } = await import(probe);
await rm(probe);

function setup(t, { saved = null, failStorage = false, defaultPosition, toolSize = 56, onResetRailPreferences } = {}) {
  const oldObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const listeners = new Map(), effects = [], values = [];
  let stored = saved, captured = false, writes = 0;
  const window = { innerWidth: 1000, innerHeight: 800, addEventListener: (name, cb) => listeners.set(name, cb), removeEventListener: name => listeners.delete(name) };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: window });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem(key) { assert.equal(key, 'prism-review-tools-edge-position-v2'); if (failStorage) throw Error('blocked'); return stored; }, setItem(key, value) { if (failStorage) throw Error('blocked'); assert.equal(key, 'prism-review-tools-edge-position-v2'); stored = value; writes++; }, removeItem(key) { if (failStorage) throw Error('blocked'); assert.equal(key, 'prism-review-tools-edge-position-v2'); stored = null; } } });
  globalThis.__toolsHost = { cursor: 0, effects, values };
  const cleanups = [];
  t.after(() => {
    for (const cleanup of cleanups) cleanup?.();
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete globalThis.window;
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage); else delete globalThis.localStorage;
    globalThis.ResizeObserver = oldObserver;
    delete globalThis.__toolsHost;
  });
  const render = () => { globalThis.__toolsHost.cursor = 0; const tree = ReviewTools({ device: 'auto', onDeviceChange() {}, missing: false, onMissingChange() {}, defaultPosition, onResetRailPreferences }); tree.props.children[0].props.ref.current = { offsetWidth: toolSize }; for (const effect of effects.splice(0)) cleanups.push(effect()); return tree; };
  const trigger = () => render().props.children[0];
  const target = { getBoundingClientRect: () => { const left = values[0]?.x ?? 920, top = values[0]?.y ?? 720; return { left, top, right: left + 56, bottom: top + 56 }; }, setPointerCapture() { captured = true; }, hasPointerCapture() { return captured; }, releasePointerCapture() { captured = false; } };
  const pointer = (x, y, type = 'mouse', id = 1) => ({ button: 0, pointerId: id, pointerType: type, clientX: x, clientY: y, currentTarget: target });
  const key = (key, shiftKey = false) => trigger().props.onKeyDown({ key, shiftKey, currentTarget: target, preventDefault() {}, stopPropagation() {} });
  const change = (value, reason) => { let canceled = false; render().props.onOpenChange(value, { reason, cancel() { canceled = true; } }); return canceled; };
  render(); for (const effect of effects.splice(0)) cleanups.push(effect());
  return { render, trigger, pointer, key, change, window, listeners, setDefault(value) { defaultPosition = value; render(); }, stored: () => stored, writes: () => writes, captured: () => captured };
}

function findReset(node) {
  if (Array.isArray(node)) return node.map(findReset).find(Boolean);
  if (!node?.props) return;
  return node.props.children === '按钮归位' ? node : findReset(node.props.children);
}

test('D5 host default follows layout changes until moved; reset uses the latest host default', t => {
  const h = setup(t, { defaultPosition: { horizontal: 'right', vertical: 'bottom', offsetX: 388, offsetY: 16 } });
  assert.equal(h.trigger().props.style.left, 556); assert.equal(h.trigger().props.style.top, 728);
  h.setDefault({ horizontal: 'right', vertical: 'bottom', offsetX: 8, offsetY: 16 });
  assert.equal(h.trigger().props.style.left, 936); assert.equal(h.writes(), 0);
  h.key('ArrowLeft');
  h.setDefault({ horizontal: 'right', vertical: 'bottom', offsetX: 428, offsetY: 16 });
  assert.equal(h.trigger().props.style.left, 920); assert.equal(h.writes(), 1);
  findReset(h.render()).props.onClick();
  assert.equal(h.trigger().props.style.left, 516); assert.equal(h.stored(), null);
  h.setDefault({ horizontal: 'left', vertical: 'top', offsetX: 16, offsetY: 80 });
  assert.equal(h.trigger().props.style.left, 16); assert.equal(h.trigger().props.style.top, 80);
  assert.equal(h.writes(), 1);
});

test('D5 restored user anchor overrides host default until reset', t => {
  const h = setup(t, { saved: JSON.stringify({ horizontal: 'left', vertical: 'top', offsetX: 100, offsetY: 90 }), defaultPosition: { horizontal: 'right', vertical: 'bottom', offsetX: 388, offsetY: 16 } });
  assert.equal(h.trigger().props.style.left, 100); assert.equal(h.trigger().props.style.top, 90);
  findReset(h.render()).props.onClick();
  assert.equal(h.trigger().props.style.left, 556); assert.equal(h.trigger().props.style.top, 728);
  assert.equal(h.stored(), null);
});

test('D5 post-drag hover stays blocked through keyboard use or click until pointer leaves', t => {
  const h = setup(t);
  h.trigger().props.onPointerDown(h.pointer(940, 740));
  h.trigger().props.onPointerMove(h.pointer(800, 600));
  h.trigger().props.onPointerUp(h.pointer(800, 600));
  h.trigger().props.onPointerLeave(h.pointer(800, 600)); // Capture release is not a physical exit.
  assert.equal(h.change(true, 'trigger-hover'), true);
  h.key('Enter'); // Clears only the synthesized-click guard, never the hover guard.
  assert.equal(h.change(true, 'trigger-hover'), true); assert.equal(h.render().props.open, false);
  h.change(true, 'trigger-press'); assert.equal(h.render().props.open, true);
  h.change(false, 'escape-key');
  h.trigger().props.onPointerDown(h.pointer(800, 600));
  h.trigger().props.onPointerUp(h.pointer(800, 600));
  assert.equal(h.change(true, 'trigger-hover'), true);
  h.change(true, 'trigger-press'); assert.equal(h.render().props.open, true);
  h.change(false, 'outside-press');
  h.trigger().props.onPointerLeave(h.pointer(100, 100));
  assert.equal(h.change(true, 'trigger-hover'), false); assert.equal(h.render().props.open, true);
});

test('D3 keyboard movement persists 16/64px steps, clamps edges and reclamps on resize', t => {
  const h = setup(t);
  assert.deepEqual(h.trigger().props.style, { left: 920, top: 720, right: 'auto', bottom: 'auto' });
  h.key('ArrowLeft'); h.key('ArrowUp', true);
  assert.equal(h.trigger().props.style.left, 904); assert.equal(h.trigger().props.style.top, 656);
  assert.deepEqual(JSON.parse(h.stored()), { horizontal: 'right', vertical: 'bottom', offsetX: 40, offsetY: 88 });
  h.key('ArrowRight', true); assert.equal(h.trigger().props.style.left, 944);
  h.window.innerWidth = 320; h.window.innerHeight = 480; h.listeners.get('resize')();
  assert.equal(h.trigger().props.style.left, 264); assert.equal(h.trigger().props.style.top, 336);
  assert.equal(h.writes(), 3);
  h.window.innerWidth = 1000; h.window.innerHeight = 800; h.listeners.get('resize')();
  assert.equal(h.trigger().props.style.left, 944); assert.equal(h.trigger().props.style.top, 656);
  for (let i = 0; i < 16; i++) h.key('ArrowLeft', true);
  assert.equal(h.trigger().props.style.left, 0);
});

test('D3 storage restore and blocked/malformed storage never prevent rendering or movement', async t => {
  for (const options of [{ saved: '{' }, { saved: '{"x":"wrong","y":0}' }, { failStorage: true }, { saved: '{"x":-50,"y":9999}' }]) {
    await t.test(JSON.stringify(options), t => {
      const h = setup(t, options);
      assert.equal(h.trigger().props['aria-label'], '评审工具');
      assert.equal(h.trigger().props.style.left, 920); assert.equal(h.trigger().props.style.top, 720);
      assert.equal(h.writes(), 0);
      assert.doesNotThrow(() => h.key('ArrowUp'));
    });
  }
});

test('D3 mouse/touch/pen drag uses >5px threshold, suppresses click and releases capture on cancel', async t => {
  for (const type of ['mouse', 'touch', 'pen']) await t.test(type, t => {
    const h = setup(t);
    h.trigger().props.onPointerDown(h.pointer(940, 740, type));
    h.trigger().props.onPointerMove(h.pointer(943, 744, type));
    assert.equal(h.trigger().props.style.left, 920); // Exactly 5px is still a click.
    h.trigger().props.onPointerMove(h.pointer(930, 730, type));
    assert.equal(h.trigger().props.style.left, 910); assert.equal(h.trigger().props.style.top, 710);
    assert.equal(h.render().props.open, false);
    h.trigger().props.onPointerCancel(h.pointer(930, 730, type));
    assert.equal(h.captured(), false);
    let prevented = false;
    h.trigger().props.onClickCapture({ preventDefault() { prevented = true; }, stopPropagation() {} });
    assert.equal(prevented, true); assert.equal(h.change(true, 'trigger-hover'), true);
    h.trigger().props.onPointerDown(h.pointer(930, 730, type));
    h.trigger().props.onPointerUp(h.pointer(930, 730, type));
    h.change(true, 'trigger-press'); assert.equal(h.render().props.open, true);
  });
});

test('D3 hover closes normally; first click pins even after a long hover, second click/Escape/outside closes', t => {
  const h = setup(t);
  h.change(true, 'trigger-hover'); assert.equal(h.render().props.open, true);
  h.change(false, 'trigger-hover'); assert.equal(h.render().props.open, false);
  h.change(true, 'trigger-hover');
  assert.equal(h.change(false, 'trigger-press'), true); assert.equal(h.render().props.open, true);
  assert.equal(h.change(false, 'trigger-hover'), true); assert.equal(h.render().props.open, true);
  h.change(false, 'trigger-press'); assert.equal(h.render().props.open, false);
  for (const reason of ['escape-key', 'outside-press']) {
    h.change(true, 'trigger-press'); assert.equal(h.render().props.open, true);
    h.change(false, reason); assert.equal(h.render().props.open, false);
  }
});


test('D4 default corner follows viewport without storage writes; reset clears a moved position', t => {
  const h = setup(t);
  h.window.innerWidth = 320; h.window.innerHeight = 480; h.listeners.get('resize')();
  assert.equal(h.trigger().props.style.left, 240); assert.equal(h.trigger().props.style.top, 400);
  h.window.innerWidth = 1440; h.window.innerHeight = 900; h.listeners.get('resize')();
  assert.equal(h.trigger().props.style.left, 1360); assert.equal(h.trigger().props.style.top, 820);
  assert.equal(h.writes(), 0); assert.equal(h.stored(), null);
  h.key('ArrowLeft'); assert.equal(h.writes(), 1);
  const find = node => {
    if (Array.isArray(node)) return node.map(find).find(Boolean);
    if (!node?.props) return;
    return node.props.children === '按钮归位' ? node : find(node.props.children);
  };
  find(h.render()).props.onClick();
  assert.equal(h.trigger().props.style.left, 1360); assert.equal(h.trigger().props.style.top, 820);
  assert.equal(h.stored(), null); assert.equal(h.writes(), 1);
});

test('D4 each saved edge survives tiny-viewport clamping and restores its original offsets', async t => {
  for (const horizontal of ['left', 'right']) for (const vertical of ['top', 'bottom']) {
    await t.test(`${horizontal}/${vertical}`, t => {
      const saved = JSON.stringify({ horizontal, vertical, offsetX: 100, offsetY: 90 });
      const h = setup(t, { saved });
      h.window.innerWidth = 80; h.window.innerHeight = 80; h.listeners.get('resize')();
      assert.ok(h.trigger().props.style.left >= 0 && h.trigger().props.style.left <= 24);
      assert.ok(h.trigger().props.style.top >= 0 && h.trigger().props.style.top <= 24);
      h.window.innerWidth = 1440; h.window.innerHeight = 900; h.listeners.get('resize')();
      assert.equal(h.trigger().props.style.left, horizontal === 'left' ? 100 : 1284);
      assert.equal(h.trigger().props.style.top, vertical === 'top' ? 90 : 754);
      assert.equal(h.stored(), saved); assert.equal(h.writes(), 0);
    });
  }
});

test('D8 floating utility positioning measures coss default sizes and reset action is host-owned', async t => {
  for (const toolSize of [32, 36]) await t.test(`${toolSize}px`, t => {
    let resets = 0;
    const h = setup(t, { toolSize, onResetRailPreferences: () => { resets++; } });
    assert.equal(h.trigger().props.style.left, 1000 - toolSize - 24);
    assert.equal(h.trigger().props.style.top, 800 - toolSize - 24);
    function find(node) {
      if (Array.isArray(node)) return node.map(find).find(Boolean);
      if (!node?.props) return;
      return node.props.children === '恢复题目栏默认' ? node : find(node.props.children);
    }
    find(h.render()).props.onClick();
    assert.equal(resets, 1);
    assert.equal(h.writes(), 0);
  });
});
