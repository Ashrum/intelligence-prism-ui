import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import postcss from 'postcss';

const root = fileURLToPath(new URL('../', import.meta.url));
const css = readFileSync(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8');
const dir = new URL(`../.sites-runtime/p150-${process.pid}/`, import.meta.url);
mkdirSync(dir, { recursive: true });
const bundle = await build({ stdin: { contents: `export { BpButton, BpTool } from './components/prism-next/blueprint/blueprint';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
const entry = new URL('fixture.mjs', dir);
writeFileSync(entry, bundle.outputFiles[0].text);
const { BpButton, BpTool } = await import(entry);
rmSync(dir, { recursive: true });
const render = (component, props) => renderToStaticMarkup(createElement(component, props, '示例'));
const classes = html => html.match(/class="([^"]+)"/)[1].split(' ');

test('P150 component styles leave only shared CSS hooks', () => {
  postcss.parse(css).walkRules(rule => {
    for (const selector of rule.selectors) assert.doesNotMatch(selector, /^\.bp-(?:btn|tool)(?:\b|-)/);
  });
});
test('P150 SSR preserves all variants, sizes, disabled and tool hooks', () => {
  for (const variant of ['default', 'primary', 'danger']) for (const size of ['default', 'sm']) {
    const html = render(BpButton, { variant, size, disabled: true });
    assert.ok(classes(html).includes('bp-btn'));
    assert.match(html, /type="button" disabled=""/);
    for (const [key, value] of [['variant', variant], ['size', size]]) {
      if (value === 'default') assert.ok(!html.includes(`data-${key}=`));
      else assert.ok(html.includes(`data-${key}="${value}"`));
    }
  }
  for (const iconOnly of [false, true]) {
    const html = render(BpTool, { iconOnly, count: 0, 'aria-label': '工具' });
    assert.ok(classes(html).includes('bp-tool'));
    assert.equal(html.includes('data-icon=""'), iconOnly);
    assert.match(html, /class="bp-tool-count [^"]*">0<\/span>/);
  }
});
test('P150 component classes retain geometry, color, timing and active/reduced motion', () => {
  const list = classes(render(BpButton, { variant: 'primary' }));
  for (const expected of ['min-h-[46px]', 'px-[22px]', 'py-[10px]', 'border-[length:var(--line-width)]', 'border-solid', 'border-(--line)', 'text-ui-action', 'data-[size=sm]:min-h-[34px]', 'data-[variant=primary]:enabled:shadow-(--shadow-offset)', 'data-[variant=primary]:enabled:active:[transform:translate(3px,3px)]', 'data-[variant=primary]:enabled:active:shadow-none', 'motion-reduce:data-[variant=primary]:enabled:active:transform-none', 'duration-(--motion-fast)', 'ease-bp', 'disabled:shadow-none']) assert.ok(list.includes(expected), expected);
  for (const expected of ['h-[32px]', 'min-w-[32px]', 'data-[icon]:w-[32px]', 'data-[icon]:p-0', 'duration-(--motion-fast)']) assert.ok(classes(render(BpTool, {})).includes(expected), expected);
});
test('P150 coss primary and toolbar states preserve rings, guard and reduced motion', () => {
  const rules = [];
  postcss.parse(css).walkRules(rule => rules.push(rule));
  for (const target of ['[data-slot="toolbar-button"].bg-primary', '[data-slot="button"].bg-primary']) {
    const matched = rules.filter(rule => rule.selector.includes(target));
    const hover = matched.find(rule => rule.selector.includes(':hover') && rule.nodes.some(d => d.prop === 'box-shadow'));
    assert.ok(hover.toString().includes('var(--shadow-offset)'));
    assert.ok(!hover.toString().includes('--shadow-offset-sm'));
    const active = matched.find(rule => rule.nodes.some(d => d.prop === 'transform' && d.value === 'translate(3px,3px)'));
    assert.ok(active.selector.includes(':active:not(:disabled)'));
    assert.ok(active.selector.includes(':not(:where([data-agent-preview]'));
    const reduced = matched.find(rule => rule.parent.type === 'atrule' && rule.parent.params.includes('prefers-reduced-motion') && rule.nodes.some(d => d.prop === 'transform' && d.value === 'none'));
    assert.ok(reduced);
    assert.ok(reduced.selector.includes(':not([disabled])'), 'early reduce rule must outrank later active rule');
    assert.ok(matched.some(rule => rule.nodes.some(d => d.prop === 'transition' && d.value.includes('var(--motion-fast)'))));
  }
});
