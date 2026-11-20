import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { clientDOM } from './helpers/chart-client-dom.mjs';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      export { Button } from './components/prism-next/button';
      export { Badge } from './components/prism-next/badge';
      export { Button as BaselineButton } from 'baseline-button';
      export { Badge as BaselineBadge } from 'baseline-badge';
      export { SegmentedControl } from './components/prism-next/segmented-control';
      export { DeltaValue } from './components/prism-next/delta-value';
      export { RulerSheet, RulerSheetBand } from './components/prism-next/ruler-sheet';
      export { Table, TableHeader, TableRow, TableHead } from './components/coss/table';
    `,
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true,
  jsx: 'automatic',
  platform: 'node',
  format: 'esm',
  packages: 'external',
  alias: { '@': root },
  loader: { '.css': 'empty' },
  write: false,
  plugins: [{
    name: 'p194-baseline',
    setup(builder) {
      builder.onResolve({ filter: /^baseline-(button|badge)$/ }, ({ path }) => ({
        path: path.slice('baseline-'.length),
        namespace: 'p194',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'p194' }, ({ path }) => ({
        contents: execFileSync('git', ['show', `e24f762:components/prism-next/${path}.tsx`], { cwd: root, encoding: 'utf8' }),
        loader: 'tsx',
        resolveDir: root,
      }));
    },
  }],
});
const bundleFile = new URL('bundle.mjs', await createTestRuntime('p194'));
await writeFile(bundleFile, bundle.outputFiles[0].text);
const {
  Button, Badge, BaselineButton, BaselineBadge, SegmentedControl, DeltaValue,
  RulerSheet, RulerSheetBand, Table, TableHeader, TableRow, TableHead,
} = await import(bundleFile);
const h = React.createElement;
const render = (component, props) => renderToStaticMarkup(h(component, props));

test('existing Button and Badge output is byte-for-byte equal to e24f762', () => {
  const buttons = [{}, { variant: 'default' }, { variant: 'outline', size: 'sm' }, {
    variant: 'info', size: 'navigation', loading: true, className: 'test-button',
  }, { size: 'navigation-icon', disabled: true, render: h('a', { href: '/preview' }) }];
  const badges = [{}, { variant: 'info-solid', size: 'sm' }, { variant: 'attention', mark: 'warn' }, {
    variant: 'outline', className: 'test-badge', render: h('a', { href: '/preview' }),
  }];
  for (const [component, baseline, cases] of [[Button, BaselineButton, buttons], [Badge, BaselineBadge, badges]]) {
    for (const theme of ['light', 'paper', 'dark', 'blueprint']) {
      for (const props of cases) {
        const themed = child => render('div', {
          'data-prism-theme': theme, children: h(child, { ...props, children: '预览' }),
        });
        assert.equal(themed(component), themed(baseline), theme);
      }
    }
  }
});

test('Chromatic Button and Badge add their opt-in appearance classes', () => {
  assert.match(render(Button, { appearance: 'chromatic', variant: 'outline' }), /prism-button-chromatic prism-button-chromatic-outline/);
  for (const variant of [undefined, 'default']) {
    const html = render(Button, { appearance: 'chromatic', variant });
    assert.match(html, /prism-button-chromatic prism-button-chromatic-primary/);
    assert.doesNotMatch(html, /appearance=/);
  }
  assert.match(render(Badge, { variant: 'count-info', children: 0 }), /prism-badge-count-info[^>]*>0</);
  assert.match(render(Badge, { variant: 'attention-soft', children: '低于预警线' }), /prism-badge-attention-soft[^>]*>低于预警线</);
});

const items = [
  { value: 'a', label: '同步' }, { value: 'b', label: '阶段' }, { value: 'c', label: '备考' },
];
const segmentProps = { items, value: 'b', onValueChange() {}, 'aria-label': '资源分类' };

test('SegmentedControl sizes keep a single radio tab stop and an independent lead', () => {
  const sm = render(SegmentedControl, { ...segmentProps, size: 'sm' });
  const lead = h('button', { type: 'button' }, '初中数学 ▾');
  const md = render(SegmentedControl, { ...segmentProps, size: 'md', lead });
  assert.match(sm, /class="prism-segmented-control" data-size="sm"/);
  assert.doesNotMatch(sm, /prism-segmented-control-lead|prism-segmented-control-divider/);
  assert.match(md, /data-size="md"><div class="prism-segmented-control-lead"><button type="button">初中数学 ▾<\/button><span class="prism-segmented-control-divider" aria-hidden="true"><\/span><\/div>/);
  for (const html of [sm, md]) {
    assert.match(html, /role="radiogroup"[^>]*aria-label="资源分类"/);
    const radios = html.match(/<button[^>]*role="radio"[^>]*>/g);
    assert.equal(radios.length, 3);
    assert.deepEqual(radios.map(radio => radio.match(/tabindex="(-?\d+)"/i)?.[1]), ['-1', '0', '-1']);
    assert.match(radios[1], /aria-checked="true"/);
    assert.doesNotMatch(html, /aria-pressed=/);
  }
});

test('SegmentedControl arrow keys focus and select, wrapping at the ends', async () => {
  const { window, document } = clientDOM(390, 74);
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, { window, document, HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement('div');
  const listeners = new Map();
  host.addEventListener = (type, handler, capture) => listeners.set(`${type}:${!!capture}`, handler);
  const dispatch = (type, target, options = {}, capture = false) => {
    const event = {
      type, target, ...options,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.cancelBubble = true; },
    };
    listeners.get(`${type}:${capture}`)(event);
    return event;
  };
  const selected = [];
  function Fixture() {
    const [value, setValue] = React.useState('b');
    return h(SegmentedControl, {
      ...segmentProps, size: 'md', value,
      onValueChange(next) { selected.push(next); setValue(next); },
    });
  }
  const client = createRoot(host);
  try {
    await act(() => client.render(h(Fixture)));
    const group = host.firstChild.firstChild;
    const radios = group.childNodes;
    group.querySelectorAll = () => radios;
    group.matches = () => false;
    for (const radio of radios) {
      radio.focus = () => { document.activeElement = radio; };
      radio.click = () => dispatch('click', radio, { button: 0 });
    }
    await act(() => {
      assert.equal(dispatch('keydown', radios[1], { key: 'ArrowRight' }, true).defaultPrevented, true);
    });
    assert.equal(document.activeElement, radios[2]);
    assert.equal(radios[2].getAttribute('aria-checked'), 'true');
    await act(() => { dispatch('keydown', radios[2], { key: 'ArrowRight' }, true); });
    assert.equal(document.activeElement, radios[0]);
    await act(() => { dispatch('keydown', radios[0], { key: 'ArrowLeft' }, true); });
    assert.equal(document.activeElement, radios[2]);
    assert.deepEqual(selected, ['c', 'a', 'c']);
  } finally {
    await act(() => client.unmount());
    Object.assign(globalThis, previous);
  }
});

test('DeltaValue rounds first, uses a Unicode minus, and distinguishes the baseline', () => {
  for (const [value, text, color] of [
    [1.24, '+1.2', 'positive'], [-34.96, '−35.0', 'pink-ink'],
    [0, '0.0', 'muted'], [-0.04, '0.0', 'muted'], [0.04, '0.0', 'muted'],
  ]) {
    assert.equal(render(DeltaValue, { value }),
      `<span class="text-ui-meta font-semibold tabular-nums" style="color:var(--chromatic-${color})">${text} 百分点</span>`);
  }
  assert.match(render(DeltaValue, { value: 1, unit: '%', prefix: '较上次 ' }), />较上次 \+1\.0 %</);
  assert.equal(render(DeltaValue), '<span class="text-ui-meta text-muted-foreground">基准次</span>');
  assert.match(render(DeltaValue, { baseLabel: '首次基准记录', prefix: '较上次 ' }), />首次基准记录</);
});

test('RulerSheet renders the decorative eight marks, band and coss table', () => {
  const html = render(RulerSheet, {
    children: [
      h(RulerSheetBand, { key: 'band' }, '已完成批阅'),
      h(Table, { key: 'table' }, h(TableHeader, null, h(TableRow, null, h(TableHead, null, '练习')))),
    ],
  });
  assert.match(html, /^<div class="prism-ruler-sheet" style="max-width:1280px">/);
  const marks = html.match(/<div class="prism-ruler-sheet-top" aria-hidden="true">(.*?)<\/div>/)?.[1];
  assert.deepEqual(Array.from(marks.matchAll(/<span>(\d+)<\/span>/g), match => match[1]),
    ['01', '02', '03', '04', '05', '06', '07', '08']);
  assert.match(html, /<header class="prism-ruler-sheet-band">已完成批阅<\/header>/);
  assert.match(html, /<table[^>]*data-slot="table"><thead[^>]*data-slot="table-header">/);
  assert.match(render(RulerSheet, { maxWidth: 900 }), /style="max-width:900px"/);
});
