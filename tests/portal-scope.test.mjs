import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { compileScope, portalDOM, read } from './helpers/portal-scope-harness.mjs';

// Base UI chooses its client layout-effect implementation at module evaluation.
const bootstrap = portalDOM(), savedDocument = globalThis.document;
globalThis.document = bootstrap.document;
const api = await compileScope(), h = React.createElement;
globalThis.document = savedDocument;
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
// Independent W188 handoff inventory; do not derive expectations from the implementation.
const agentSites = {
  'agent-artifact-output': ['SelectPopup'], 'agent-capture-scan': ['SelectPopup'],
  'agent-collection-basket': ['SelectPopup', 'MenuPopup', 'DialogPopup'],
  'agent-constraint-builder': ['SelectPopup'], 'agent-distribution-matrix': ['SelectPopup'],
  'agent-material-pack': ['SelectPopup'], 'agent-object-picker': ['ComboboxPopup'],
  'agent-parameter-config': ['SelectPopup'], 'agent-path-priority': ['SelectPopup', 'SelectPopup'],
  'agent-plan-builder': ['SelectPopup'], 'agent-structure-arranger': ['SelectPopup', 'SelectPopup'],
  'agent-suggestion-set': ['SelectPopup'], 'agent-template-picker': ['SelectPopup'], 'agent-visual-parts': ['PopoverPopup'],
};
const dependencySites = {
  'charts/chart-legend': ['PopoverPopup'], 'data-display': ['PopoverPopup'], 'dialog-layout': ['DialogPopup'],
  'facet-filter': ['TooltipPopup', 'PopoverPopup'], 'knowledge-rail': ['SelectPopup'], 'paper-annotation-layer': ['TooltipPopup'],
  'question-actions': ['MenuPopup'], 'question-analysis-parts': ['TooltipPopup'], 'question-controls': ['SelectPopup'],
  'question-rail': ['TooltipPopup', 'TooltipPopup'], 'record-list': ['SelectPopup', 'MenuPopup', 'SelectPopup'],
  'review-parts': ['TooltipPopup'], 'review-workspace': ['DialogPopup'], 'textbook-directory': ['MenuPopup', 'SelectPopup', 'TooltipPopup'],
  'textbook-range-picker': ['SelectPopup', 'DialogPopup', 'SelectPopup', 'SelectPopup'],
};
const sites = { ...agentSites, ...dependencySites, 'question-work-panel': ['DrawerPopup'] };

function checkBindings(file, expected, source = read(`components/prism-next/${file}.tsx`)) {
  const ast = ts.createSourceFile(file + '.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = new Map(), calls = [];
  for (const statement of ast.statements) if (ts.isImportDeclaration(statement)) {
    for (const binding of statement.importClause?.namedBindings?.elements ?? []) imports.set(binding.name.text, { from: statement.moduleSpecifier.text, imported: binding.propertyName?.text ?? binding.name.text });
  }
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast), binding = imports.get(tag);
      if (tag.endsWith('Popup')) {
        assert.equal(binding?.from, '@/components/prism-next/scoped-overlays', `${file}:${tag} must use the host-aware adapter`);
        calls.push({ name: binding.imported, node });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.deepEqual(calls.map(c => c.name).sort(), [...expected].sort(), `${file} retains the handoff call sites`);
  return calls;
}

async function mounted(run) {
  const saved = Object.fromEntries(['window', 'document', 'Node', 'HTMLElement', 'Element', 'IS_REACT_ACT_ENVIRONMENT', 'ResizeObserver'].map(key => [key, globalThis[key]]));
  const dom = portalDOM(), errors = [], originalError = console.error;
  Object.assign(globalThis, { window: dom.window, document: dom.document, Node: dom.window.Node, Element: dom.window.Element, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  console.error = (...args) => errors.push(args.join(' '));
  const host = dom.document.createElement('div'); dom.document.body.appendChild(host);
  const root = createRoot(host);
  try { await run({ ...dom, host, root, render: tree => act(() => root.render(tree)) }); }
  finally { await act(() => root.unmount()); console.error = originalError; Object.assign(globalThis, saved); delete globalThis.__p74Primitives; }
  assert.deepEqual(errors, [], 'no React warnings');
}
const all = (node, predicate) => [ ...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap(child => all(child, predicate)) ];
const portals = node => all(node, item => item.hasAttribute?.('data-base-ui-portal'));
const marker = (node, id) => all(node, item => item.getAttribute?.('data-p74-marker') === id);
const scope = (runtime, container, theme, child) => h(runtime.PrismScopeProvider, { portalContainer: container, theme }, child);
const popup = (runtime, name, id, props = {}) => h(runtime[name], { ...props, children: h('span', { 'data-p74-marker': id }, id) });

test('P74: all 18 Agent and 24 dependency call sites plus the legacy Drawer bind to scoped adapters', () => {
  for (const [file, names] of Object.entries(sites)) checkBindings(file, names);
});

test('P74: all 43 call-site bindings mount through real Base UI Portal transport in the supplied container; unscoped uses body', async () => {
  await mounted(async ({ document, render }) => {
    const container = document.createElement('section'); document.body.appendChild(container);
    let index = 0;
    for (const [file, names] of Object.entries(sites)) for (const name of names) {
      const id = `${file}-${index++}`;
      await render(scope(api, container, 'blueprint', popup(api, name, id)));
      assert.equal(marker(container, id).length, 1, id);
      assert.equal(portals(document.body).filter(p => !container.contains(p)).length, 0);
      await render(popup(api, name, id));
      assert.equal(marker(container, id).length, 0);
      assert.equal(portals(document.body).filter(p => p.parentNode === document.body).length, 1);
      assert.equal(marker(document.body, id).length, 1);
    }
  });
});

test('P74: explicit element/ref/null, portal attributes and the default props retain their semantics', async () => {
  await mounted(async ({ document, render }) => {
    const target = document.createElement('section'), other = document.createElement('aside');
    document.body.appendChild(target); document.body.appendChild(other);
    for (const name of ['SelectPopup', 'ComboboxPopup', 'MenuPopup', 'MenuSubPopup', 'DialogPopup', 'PopoverPopup', 'TooltipPopup', 'DrawerPopup']) {
      for (const container of [other, { current: other }]) {
        const props = { portalProps: { container, className: 'portal-marker', 'data-extra': 'kept' } };
        await render(scope(api, target, 'blueprint', popup(api, name, name, props)));
        assert.equal(marker(other, name).length, 1); assert.equal(marker(target, name).length, 0);
        assert.equal(portals(other)[0].getAttribute('class'), 'portal-marker');
        assert.equal(portals(other)[0].getAttribute('data-extra'), 'kept');
      }
      await render(scope(api, target, 'blueprint', popup(api, name, name, { portalProps: { container: null } })));
      assert.equal(marker(document.body, name).length, 0, 'explicit null waits instead of falling through to the scope/body');
    }
    let input, result;
    function PropsProbe() { result = api.usePrismPortalProps(input); return null; }
    for (input of [undefined, { className: 'original' }, { container: null }]) {
      await render(h(PropsProbe)); assert.equal(result, input, 'no scope preserves the original props object');
    }
  });
});

test('P74: scoped null waits for a target, ref attachment precedes Portal effects, changing/unmounting a scope cleans old nodes', async () => {
  await mounted(async ({ document, render }) => {
    await render(scope(api, null, 'blueprint', popup(api, 'SelectPopup', 'waiting')));
    assert.equal(portals(document.body).length, 0);
    const ref = React.createRef();
    await render(h('section', null, h('div', { ref }), scope(api, ref, 'blueprint', popup(api, 'SelectPopup', 'ref'))));
    assert.equal(marker(ref.current, 'ref').length, 1);
    const previous = ref.current, target = document.createElement('section'); document.body.appendChild(target);
    await render(scope(api, target, 'paper', popup(api, 'SelectPopup', 'new')));
    assert.equal(portals(previous).length, 0); assert.equal(marker(target, 'new').length, 1);
    await render(null); assert.equal(portals(document.body).length, 0);
  });
});

test('P74: submenu keeps coss offsets, scoped/explicit targets and real parent Portal inheritance', async () => {
  await mounted(async ({ document, render }) => {
    const target = document.createElement('section'); document.body.appendChild(target);
    await render(h(api.MenuPopup, { portalProps: { container: target } }, popup(api, 'MenuSubPopup', 'inherited')));
    assert.equal(marker(target, 'inherited').length, 1);
    assert.equal(portals(target).length, 2);
    assert.equal(portals(target)[1].parentNode, portals(target)[0], 'no scope keeps Base UI parent inheritance');
    for (const [align, offset] of [[undefined, -5], ['start', -5], ['center', undefined], ['end', -5]]) {
      globalThis.__p74Primitives = [];
      await render(scope(api, target, 'blueprint', popup(api, 'MenuSubPopup', 'scoped', { align })));
      const positioner = globalThis.__p74Primitives.filter(p => p.kind === 'menu.Positioner').at(-1).props;
      assert.equal(positioner.side, 'inline-end'); assert.equal(positioner.sideOffset, 0); assert.equal(positioner.alignOffset, offset);
      assert.equal(marker(target, 'scoped').length, 1);
    }
  });
});

test('P74: chart scope uses the local palette in both directions and empty nested boundaries restore global defaults', async () => {
  await mounted(async ({render}) => {
    async function capture(tree) { let result; function Probe() { result = api.useChartTheme(); return null; } await render(tree(h(Probe))); return result; }
    for (const globalTheme of [...themes, undefined]) {
      globalThis.__p74GlobalTheme = globalTheme;
      const original = await capture(child => child);
      assert.equal(original.theme, globalTheme ?? 'light');
      assert.deepEqual(original.colors, api.chartSeriesColors(globalTheme));
      assert.deepEqual(original.palette, api.themePalette[globalTheme] ?? api.themePalette.light);
      for (const theme of themes) {
        const local = await capture(child => scope(api, undefined, theme, child));
        assert.equal(local.theme, theme); assert.deepEqual(local.colors, api.chartSeriesColors(theme)); assert.deepEqual(local.palette, api.themePalette[theme]);
        assert.deepEqual(await capture(child => scope(api, undefined, theme, h(api.PrismScopeProvider, null, child))), original);
      }
    }
  });
  delete globalThis.__p74GlobalTheme;
});

test('P74: Providers forwards its controlled Toast container and preserves the original global singleton by default', async () => {
  await mounted(async ({ document, render }) => {
    const target = document.createElement('section'); document.body.appendChild(target);
    let manager;
    function Probe() { manager = api.ToastPrimitive.useToastManager(); return null; }
    await render(h(api.Providers, null, h(Probe)));
    await act(() => api.toastManager.add({ title: 'global', timeout: 0 }));
    assert.equal(manager.toasts.at(-1).title, 'global');
    assert.equal(portals(document.body)[0].parentNode, document.body);
    await render(h(api.Providers, { toastPortalProps: { container: target, className: 'toast-host' } }, h(Probe)));
    assert.equal(portals(target).length, 1); assert.equal(portals(target)[0].getAttribute('class'), 'toast-host');
    assert.equal(manager.toasts.at(-1).title, 'global', 'controlled target moves this whole queue, not selected origins');
  });
});

test('P74: separate Toast managers isolate Agent and global origins; leaving a page discards its queue and ignores late events', async () => {
  await mounted(async ({ document, render }) => {
    const target = document.createElement('section'); document.body.appendChild(target);
    const agentManager = api.ToastPrimitive.createToastManager(), globalManager = api.ToastPrimitive.createToastManager();
    const stores = {};
    function Probe({ id }) { stores[id] = api.ToastPrimitive.useToastManager(); return null; }
    function Tree({ agent }) {
      return h(api.Providers, { toastManager: globalManager }, h(Probe, { id: 'global' }), agent && scope(api, target, 'blueprint', h(api.ToastProvider, { toastManager: agentManager, timeout: 0 }, h(Probe, { id: 'agent' }))));
    }
    await render(h(Tree, { agent: true }));
    await act(() => { agentManager.add({ title: 'Agent', timeout: 0 }); globalManager.add({ title: 'AppBar', timeout: 0 }); });
    assert.deepEqual(stores.agent.toasts.map(t => t.title), ['Agent']);
    assert.deepEqual(stores.global.toasts.map(t => t.title), ['AppBar']);
    assert.equal(portals(target).length, 1);
    await render(h(Tree, { agent: false }));
    assert.equal(portals(target).length, 0);
    await act(() => { agentManager.add({ title: 'late Agent event', timeout: 0 }); globalManager.add({ title: 'other page', timeout: 0 }); });
    await render(h(Tree, { agent: true }));
    assert.deepEqual(stores.agent.toasts, []);
    assert.deepEqual(stores.global.toasts.map(t => t.title).sort(), ['AppBar', 'other page']);
  });
});

test('P74: EChart applies local axis/tooltip/decal options on mount and live theme changes without mutating core defaults', async () => {
  await mounted(async ({ render }) => {
    const calls = [];
    let disposals = 0;
    globalThis.__p74Engine = { on() {}, getZr: () => ({ on() {} }), getWidth: () => 1280, getHeight: () => 300, resize() {}, setOption: option => calls.push(option), dispose() { disposals++; } };
    const props = { label: 'scope', option: { series: [{ type: 'bar', data: [1] }], xAxis: { type: 'value' } } };
    try {
      const baselines = new Map();
      for (const theme of themes) {
        globalThis.__p74GlobalTheme = theme;
        await render(h(api.EChart, props));
        baselines.set(theme, calls.at(-1));
      }
      globalThis.__p74GlobalTheme = 'light';
      for (const theme of themes) {
        await render(scope(api, undefined, theme, h(api.EChart, props)));
        assert.deepEqual(calls.at(-1), baselines.get(theme), `${theme}: local and global options must agree`);
        assert.equal(calls.at(-1).textStyle.color, api.themePalette[theme].foreground);
        assert.equal(calls.at(-1).tooltip.borderRadius, theme.startsWith('blueprint') ? 0 : undefined);
      }
      assert.equal(disposals, 1, 'only entering the scope remounts; subsequent local theme changes reuse the chart');
    } finally { delete globalThis.__p74Engine; delete globalThis.__p74GlobalTheme; }
  });
});

test('P74: reverting each of the 43 call-site bindings is rejected independently', () => {
  let rejected = 0;
  for (const [file, names] of Object.entries(sites)) {
    const source = read(`components/prism-next/${file}.tsx`);
    for (const { name, node } of checkBindings(file, names, source)) {
      const edits = [node.tagName];
      if (ts.isJsxOpeningElement(node)) edits.push(node.parent.closingElement.tagName);
      let mutant = source;
      for (const tag of edits.sort((a, b) => b.getStart() - a.getStart())) mutant = mutant.slice(0, tag.getStart()) + 'LegacyPopup' + mutant.slice(tag.end);
      const primitive = { SelectPopup: 'select', MenuPopup: 'menu', DialogPopup: 'dialog', ComboboxPopup: 'combobox', PopoverPopup: 'popover', TooltipPopup: 'tooltip', DrawerPopup: 'drawer' }[name];
      mutant += `\nimport { ${name} as LegacyPopup } from '@/components/coss/${primitive}';\n`;
      assert.throws(() => checkBindings(file, names, mutant)); rejected++;
    }
  }
  assert.equal(rejected, 43);
});

test('P74: context, explicit precedence, submenu and Toast regressions fail the same mounted transport assertions', async () => {
  const scopePath = 'components/prism-next/prism-scope.tsx', overlayPath = 'components/prism-next/scoped-overlays.tsx';
  const source = read(scopePath), overlays = read(overlayPath);
  const mutants = [
    { file: scopePath, text: source.replace('return { ...portalProps, container: portalContainer }', 'return portalProps'), name: 'SelectPopup', explicit: false },
    { file: scopePath, text: source.replace('portalProps?.container !== undefined || ', ''), name: 'SelectPopup', explicit: true },
    { file: overlayPath, text: overlays.replace('<MenuPopup align={align}', '<CossMenuPopup align={align}'), name: 'MenuSubPopup', explicit: false },
    { file: overlayPath, text: overlays.replace('<CossToastProvider {...props} portalProps={usePrismPortalProps(portalProps)} />', '<CossToastProvider {...props} portalProps={portalProps} />'), name: 'ToastProvider', explicit: false },
  ];
  for (const mutant of mutants) {
    const runtime = await compileScope({ [mutant.file]: mutant.text });
    await mounted(async ({ document, render }) => {
      const target = document.createElement('section'), explicit = document.createElement('aside');
      document.body.appendChild(target); document.body.appendChild(explicit);
      await render(scope(runtime, target, 'blueprint', popup(runtime, mutant.name, 'mutation', mutant.explicit ? { portalProps: { container: explicit } } : {})));
      const expected = mutant.explicit ? explicit : target;
      assert.throws(() => assert.equal(portals(expected).length, 1), `${mutant.name} regression must fail`);
    });
  }
});

test('P74: dropping the local chart theme is caught by the palette assertion', async () => {
  const path = 'components/prism-next/charts/chart-theme.ts';
  const source = read(path), mutated = source.replace('localTheme ?? hydratedTheme', 'hydratedTheme');
  assert.notEqual(mutated, source, 'mutation must actually remove the local scope');
  const runtime = await compileScope({ [path]: mutated });
  globalThis.__p74GlobalTheme = 'light';
  let result; function Probe() { result = runtime.useChartTheme(); return null; }
  renderToStaticMarkup(scope(runtime, undefined, 'blueprint', h(Probe)));
  assert.throws(() => assert.deepEqual(result.colors, api.BLUEPRINT_SERIES));
  delete globalThis.__p74GlobalTheme;
});
