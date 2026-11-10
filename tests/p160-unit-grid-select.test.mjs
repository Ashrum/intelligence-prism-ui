import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p160');
const h = React.createElement;
async function bundle(name, baseline = false) {
  const output = await build({
    stdin: {
      contents: `export { BpUnitGrid } from './components/prism-next/blueprint/drafting';
export { PrismScopeProvider } from './components/prism-next/prism-scope';`,
      loader: 'tsx', resolveDir: root,
    },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
    plugins: baseline ? [{ name: 'baseline-9b2f7e3', setup(builder) {
      builder.onLoad({ filter: /prism-next\/blueprint\/drafting\.tsx$/ }, args => ({
        contents: execFileSync('git', ['show', `9b2f7e3:${args.path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx',
      }));
    } }] : [],
  });
  const url = new URL(`${name}.mjs`, runtime);
  writeFileSync(url, output.outputFiles[0].text);
  return import(url);
}
const before = await bundle('before', true);
const after = await bundle('after');
const groups = [
  { id: 'support', label: '需要支持', count: 2, fill: 'todo' },
  { id: 'decline', label: '近期回落', count: 3, fill: 'hatch-todo' },
  { id: 'stable', label: '稳定保持', count: 4, fill: 'done' },
  { id: 'missing', label: '数据不足', count: 1, fill: 'hatch' },
];
const base = { label: '学生学习进展', groups };
function render(api, props, theme) {
  return renderToStaticMarkup(h(api.PrismScopeProvider, { theme }, h(api.BpUnitGrid, props)));
}
function capture(props) {
  let tree;
  function Probe() {
    tree = after.BpUnitGrid(props);
    return tree;
  }
  const html = renderToStaticMarkup(h(Probe));
  const nodes = [];
  function visit(element) {
    if (!React.isValidElement(element)) return;
    nodes.push(element);
    React.Children.forEach(element.props.children, visit);
  }
  visit(tree);
  return { tree, nodes, html };
}
const cells = nodes => nodes.filter(node => node.props.className?.startsWith('bp-unit-cell '));
const picks = nodes => nodes.filter(node => node.type === 'button' && node.props.className === 'bp-unit-pick');

for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
  test(`P160 ${theme}: default unit grid equals 9b2f7e3 bytes with and without legend`, () => {
    for (const legend of [undefined, true, false]) {
      const props = { ...base, legend };
      assert.equal(render(after, props, theme), render(before, props, theme));
    }
  });
}

test('P160 muted groups preserve counts, fill classes and positions across cells and legend', () => {
  for (const mutedGroup of groups) {
    const { nodes } = capture({ ...base, groups: groups.map(group => ({ ...group, muted: group.id === mutedGroup.id })) });
    const gridCells = cells(nodes);
    assert.equal(gridCells.length, 10);
    assert.deepEqual(gridCells.map(node => node.props.className), groups.flatMap(group => Array(group.count).fill(`bp-unit-cell bp-fill-${group.fill}`)));
    assert.equal(gridCells.filter(node => node.props['data-muted'] === '').length, mutedGroup.count);
    for (const node of gridCells) {
      assert.equal(node.props['data-muted'], node.props.className === `bp-unit-cell bp-fill-${mutedGroup.fill}` ? '' : undefined);
    }
    const items = nodes.filter(node => node.type === 'li');
    const keys = nodes.filter(node => node.props.className?.startsWith('bp-unit-key '));
    groups.forEach((group, index) => {
      const expected = group.id === mutedGroup.id ? '' : undefined;
      assert.equal(items[index].props['data-muted'], expected);
      assert.equal(keys[index].props['data-muted'], expected);
    });
  }
});

test('P160 selection exposes one keyboard button per group and keeps cells hidden from accessibility', () => {
  for (const selected of [undefined, [], ['support', 'decline'], ['missing']]) {
    const { tree, nodes, html } = capture({ ...base, selected, onSelect() {} });
    assert.equal(tree.props.role, 'group');
    assert.equal(tree.props['aria-label'], capture(base).tree.props['aria-label']);
    const legend = nodes.find(node => node.type === 'ul');
    assert.equal(legend.props['aria-hidden'], undefined);
    assert.match(html, /<ul class="bp-unit-legend text-ui-meta">/);
    assert.equal(nodes.find(node => node.props.className === 'bp-unit-cells').props['aria-hidden'], 'true');
    const buttons = picks(nodes);
    const items = nodes.filter(node => node.type === 'li');
    assert.equal(buttons.length, groups.length);
    groups.forEach((group, index) => {
      const pressed = selected?.includes(group.id) ?? false;
      assert.equal(buttons[index].props.type, 'button');
      assert.equal(buttons[index].props['aria-pressed'], pressed);
      assert.equal(items[index].props['data-selected'], pressed ? '' : undefined);
      assert.equal(renderToStaticMarkup(buttons[index].props.children), `<span class="bp-unit-key bp-fill-${group.fill}"></span><span>${group.label}</span><b class="bp-unit-count">${group.count}</b>`);
    });
    for (const node of cells(nodes)) {
      assert.equal(node.props['data-pickable'], '');
      assert.equal(node.props.tabIndex, undefined);
    }
  }
});

test('P160 selected without onSelect and explicit muted false preserve read-only bytes', () => {
  const props = { ...base, selected: ['support'], groups: groups.map(group => ({ ...group, muted: false })) };
  assert.equal(render(after, props, 'blueprint'), render(before, base, 'blueprint'));
  const { nodes } = capture(props);
  assert.equal(picks(nodes).length, 0);
  assert.ok(cells(nodes).every(node => node.props.onClick === undefined && node.props['data-pickable'] === undefined));
});

test('P160 legend and every cell emit their group id, including muted groups, without changing controlled selection', () => {
  const calls = [];
  const selected = Object.freeze(['support']);
  const props = { ...base, selected, groups: groups.map(group => ({ ...group, muted: group.id !== 'support' })), onSelect: id => calls.push(id) };
  const { nodes, html } = capture(props);
  for (const node of picks(nodes)) node.props.onClick();
  for (const node of cells(nodes)) node.props.onClick();
  assert.deepEqual(calls, [...groups.map(group => group.id), ...groups.flatMap(group => Array(group.count).fill(group.id))]);
  assert.deepEqual(selected, ['support']);
  assert.equal(capture(props).html, html);
});

test('P160 legend false still renders pickable cells and dispatches selection', () => {
  const calls = [];
  const { tree, nodes } = capture({ ...base, legend: false, onSelect: id => calls.push(id) });
  assert.equal(tree.props.role, 'group');
  assert.ok(!nodes.some(node => node.type === 'ul' || node.type === 'button'));
  cells(nodes)[0].props.onClick();
  assert.deepEqual(calls, ['support']);
});
