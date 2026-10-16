import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { chartDescription } from '../lib/prism-next/chart-description.ts';
import { heatmapDescription } from '../lib/prism-next/heatmap-labels.ts';

// Execute the real EChart component/effects with controlled hooks and engine events.
// This verifies the update lifecycle, not browser rendering or pointer synthesis.
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = await createTestRuntime('heatmap-tooltip');
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({
  stdin: { contents: `export {EChart} from './components/prism-next/charts/echart'`, resolveDir: root },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
  plugins: [{ name: 'controlled-chart-host', setup(b) {
    b.onResolve({ filter: /^(react|next-themes)$/ }, args => ({ path: args.path, namespace: 'host' }));
    b.onLoad({ filter: /.*/, namespace: 'host' }, args => ({ contents: args.path === 'react'
      // This controller-only host is unscoped; real Context/Portal behavior is covered in portal-scope.test.mjs.
      ? 'export const createContext=value=>({defaultValue:value});export const useContext=context=>context.defaultValue;export const useMemo=fn=>fn();export const useRef=(...a)=>globalThis.__tooltipHost.ref(...a);export const useState=(v)=>[v,()=>{}];export const useEffect=(...a)=>globalThis.__tooltipHost.effect(...a);'
      : 'export const useTheme=()=>({theme:globalThis.__tooltipHost.theme});' }));
    b.onLoad({ filter: /\/echart-engine\.ts$/ }, () => ({ contents: 'export const init=()=>{globalThis.__tooltipHost.inits++;return globalThis.__tooltipHost.chart}' }));
  } }],
})).outputFiles[0].text);
const { EChart } = await import(file);

async function host(theme, preserveItemTooltip = true) {
  const refs = [], effects = [], events = new Map(), zr = new Map(), documentEvents = new Map();
  let cursor = 0, effectCursor = 0, pending = [], props;
  const state = {
    theme, inits: 0, actions: [], options: [], visible: undefined, disposed: 0,
    ref(initial) { const index = cursor++; return refs[index] ??= { current: initial }; },
    effect(fn, deps) {
      const index = effectCursor++, prior = effects[index];
      if (!prior || deps.some((d, i) => !Object.is(d, prior.deps[i]))) pending.push(() => {
        prior?.cleanup?.(); effects[index] = { deps, cleanup: fn() };
      });
    },
    chart: {
      on(name, fn) { events.set(name, fn); },
      getZr() { return { on: (name, fn) => zr.set(name, fn) }; },
      setOption(option) { state.options.push(option); state.visible = undefined; events.get('hideTip')?.(); },
      dispatchAction(action) {
        state.actions.push(action);
        if (action.type === 'hideTip') { state.visible = undefined; events.get('hideTip')?.(); }
        else {
          const option = state.options.at(-1), item = option.series[action.seriesIndex].data[action.dataIndex];
          state.visible = option.tooltip.formatter({ data: item });
        }
      },
      resize() {}, dispose() { state.disposed++; },
    },
    render(next = {}) {
      props = { ...props, ...next }; cursor = effectCursor = 0;
      const element = EChart(props);
      element.props.children[0].props.ref.current = container;
      const jobs = pending; pending = []; jobs.forEach(fn => fn());
    },
    click(id = 'zero') { events.get('click')({ data: { id }, seriesIndex: 0, seriesId: 'matrix' }); },
    outside() { documentEvents.get('pointerdown')({ target: new FakeNode() }); },
    blank() { zr.get('click')({}); },
    leave() { zr.get('globalout')(); },
    hover() { events.get('mouseover')({}); },
    hide() { state.chart.dispatchAction({ type: 'hideTip' }); },
    cleanup() { effects.forEach(effect => effect.cleanup?.()); assert.equal(documentEvents.size, 0); saved.forEach(([key, value]) => { if(value === undefined) delete globalThis[key]; else globalThis[key] = value; }); },
  };
  class FakeNode { contains(node) { return this === node; } }
  const container = new FakeNode();
  const saved = ['__tooltipHost', 'document', 'Node', 'ResizeObserver'].map(key => [key, globalThis[key]]);
  globalThis.__tooltipHost = state; globalThis.Node = FakeNode;
  globalThis.document = { addEventListener: (name, fn) => documentEvents.set(name, fn), removeEventListener: name => documentEvents.delete(name) };
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  state.render({ option: option(), label: '能力与题目层级', preserveItemTooltip, onSelect: (id, seriesId) => {
    state.selected = [id, seriesId]; state.render({ option: option() });
  } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(state.inits, 1);
  return state;
}
function option(data = [{ id: 'zero', row: '运算求解', column: '基础', value: '0' }, { id: 'missing', row: '推理论证', column: '综合', value: '缺测' }]) {
  return { series: [{ type: 'heatmap', data }], tooltip: { triggerOn: 'mousemove|click', formatter: ({ data }) => `${data.row} · ${data.column}\n${data.value}` } };
}
for (const theme of ['light', 'paper', 'dark', 'blueprint']) {
  test(`${theme}: click + synchronous host update restores zero/missing tooltip, repeat tap, no remount`, async () => {
    const h = await host(theme);
    try {
      h.click(); assert.equal(h.visible, '运算求解 · 基础\n0'); assert.deepEqual(h.selected, ['zero', 'matrix']);
      h.click(); assert.equal(h.visible, '运算求解 · 基础\n0');
      h.click('missing'); assert.equal(h.visible, '推理论证 · 综合\n缺测');
      assert.equal(h.inits, 1);
    } finally { h.cleanup(); }
    assert.equal(h.disposed, 1);
  });
}
test('item identity survives reorder and selected styling updates; removed items are not restored', async () => {
  const h = await host('blueprint');
  try {
    h.click();
    const data = option().series[0].data.reverse(); data[1].itemStyle = { borderWidth: 2 };
    h.render({ option: option(data) }); assert.equal(h.actions.at(-1).dataIndex, 1); assert.equal(h.visible, '运算求解 · 基础\n0');
    h.render({ option: option([data[0]]) }); assert.equal(h.visible, undefined);
    h.render({ option: option() }); assert.equal(h.visible, undefined);
  } finally { h.cleanup(); }
});
for (const dismiss of ['outside', 'blank', 'leave', 'hover', 'hide']) {
  test(`${dismiss}: later host renders do not resurrect dismissed click tooltip`, async () => {
    const h = await host('blueprint');
    try { h.click(); h[dismiss](); h.render({ option: option() }); assert.equal(h.visible, undefined); }
    finally { h.cleanup(); }
  });
}
test('other EChart callers retain normal setOption and never dispatch restoration', async () => {
  const h = await host('light', false);
  try { h.click(); h.render({ option: option() }); assert.equal(h.visible, undefined); assert.deepEqual(h.actions, []); }
  finally { h.cleanup(); }
});
test('narrow accessible description has no repeated punctuation and one table instruction', () => {
  for (const label of ['能力与题目层级', '能力与题目层级。']) {
    const narrow = heatmapDescription(label, false);
    assert.equal(chartDescription(narrow), '能力与题目层级。窄屏下格内数值已隐藏，点按格子查看数值。完整数值及缺测说明见下方数据表。');
    assert.equal((chartDescription(narrow).match(/数据表/g) ?? []).length, 1);
    assert.equal(heatmapDescription(label, true), label);
    assert.equal(chartDescription(label), '能力与题目层级。完整数值及缺测说明见下方数据表。');
  }
});
