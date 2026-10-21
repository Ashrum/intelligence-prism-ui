import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { api as charts, capture, defaults, h, render } from './p58-chart-harness.mjs';
import { chartSeriesColors, blueprintChartOverrides } from '../lib/prism-next/chart-palette.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = new URL('bundle.mjs', await createTestRuntime('p97-blueprint'));
writeFileSync(bundle, (await build({ stdin: { contents: `export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/badge'; export { Badge as CossBadge } from './components/coss/badge'; export { PrismScopeProvider } from './components/prism-next/prism-scope'; export { ChartLegend } from './components/prism-next/charts/chart-legend';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false })).outputFiles[0].text);
const api = await import(bundle);
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const bp = themes.slice(3);
const themeCSS = postcss.parse(read('app/(next)/next/theme.css'));
function tokens(theme) {
  const result = {};
  themeCSS.walkRules(rule => {
    if (rule.selectors.includes(':root:where([data-ui-version="coss-v1"])') || (['light', 'paper'].includes(theme) && rule.selector.includes(':where([data-agent-preview]):is([data-prism-theme="light"], [data-prism-theme="paper"])')) || rule.selector.includes(`:where([data-agent-preview])[data-prism-theme="${theme}"]`)) {
      rule.walkDecls(d => { result[d.prop] = d.value; });
    }
  });
  return result;
}

test('P97 B-01: both Recharts tooltip props resolve to 8px core / 0px Blueprint, matching ECharts Blueprint corners', () => {
  for (const theme of themes) {
    const values = tokens(theme);
    const base = parseFloat(values['--radius']) * (values['--radius'].endsWith('rem') ? 16 : 1);
    for (const [name, props] of [['TrendChart', defaults.TrendChart], ['ComparisonChart', { label: '对照', data: [{ id: 'a', label: '甲', value: 100 }] }]]) {
      const tooltip = capture(name, props, theme).nodes.find(node => node.props.contentStyle?.borderRadius);
      assert.ok(tooltip, name);
      assert.equal(tooltip.props.contentStyle.borderRadius, 'max(0px, var(--radius-md))');
      assert.equal(Math.max(0, base - 2), bp.includes(theme) ? 0 : 8);
    }
    if (bp.includes(theme)) assert.equal(blueprintChartOverrides(theme).tooltip.borderRadius, 0);
    else assert.deepEqual(blueprintChartOverrides(theme), {});
  }
  assert.match(read('app/(next)/next/theme.css'), /--radius-md:calc\(var\(--radius\) - 2px\)/);
  assert.match(read('app/(next)/next/blueprint.css'), /--radius-md:calc\(var\(--radius\) - 2px\)/);
});

test('P97 B-03: night CSS/JS match slots 1–8; core colours and the white Blueprint five-slot bridge remain unchanged', () => {
  for (const theme of themes) {
    const css = tokens(theme), colors = chartSeriesColors(theme);
    for (let i = 1; i <= 8; i++) {
      if (theme === 'blueprint' && i === 6) assert.equal(css['--chart-6'], undefined, 'existing white bridge only exposes five series');
      else assert.equal(css[`--chart-${i}`], colors[i - 1], `${theme}/chart-${i}`);
    }
  }
  assert.equal(tokens('blueprint-night')['--chart-6'], '#B6BEC9');
});

// Production selectors parsed by Lightning CSS, matched on synthetic trees.
// This verifies selector scope/declarations, not browser cascade/layout.
function parse(selector) {
  let result;
  transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(ast) { result = ast; } } });
  return result;
}
function matches(selector, node) {
  if (!node) return false;
  const split = selector.findLastIndex(s => s.type === 'combinator');
  if (split >= 0) {
    if (!matches(selector.slice(split + 1), node)) return false;
    if (selector[split].value === 'child') return matches(selector.slice(0, split), node.parent);
    assert.equal(selector[split].value, 'descendant');
    for (let p = node.parent; p; p = p.parent) if (matches(selector.slice(0, split), p)) return true;
    return false;
  }
  return selector.every(s => {
    if (s.type === 'universal') return true;
    if (s.type === 'class') return node.classes?.includes(s.name) ?? false;
    if (s.type === 'attribute') return s.operation ? node.attrs[s.name] === s.operation.value : Object.hasOwn(node.attrs, s.name);
    if (s.type === 'pseudo-class' && ['is', 'where', 'not'].includes(s.kind)) {
      const any = s.selectors.some(child => matches(child, node));
      return s.kind === 'not' ? !any : any;
    }
    assert.fail(JSON.stringify(s));
  });
}
const badgeRules = postcss.parse(read('app/(next)/next/blueprint.css').split('/* P97 · Status badges')[1].split('*/')[1]).nodes.filter(n => n.type === 'rule').map(rule => ({ rule, selectors: rule.selectors.map(parse) }));
const element = (attrs, parent, classes = []) => ({ attrs, parent, classes });
const style = node => Object.fromEntries(badgeRules.filter(({ selectors }) => selectors.some(s => matches(s, node))).flatMap(({ rule }) => rule.nodes.filter(n => n.type === 'decl').map(d => [d.prop, d.value])));
const badgeClasses = variant => render(h(api.Badge, { variant }, '状态')).match(/class="([^"]+)"/)[1].split(/\s+/);

test('P97 Badge: real variant classes receive square paper geometry and semantic ink in both blueprints', () => {
  const variants = { default: 'foreground', secondary: 'foreground', outline: 'foreground', success: 'success-foreground', warning: 'warning-foreground', error: 'destructive-foreground', destructive: 'destructive-foreground', attention: 'destructive-foreground', info: 'info-foreground', 'info-solid': 'info-foreground' };
  for (const theme of bp) for (const [variant, ink] of Object.entries(variants)) {
    const node = element({ 'data-slot': 'badge' }, element({ 'data-prism-theme': theme }), badgeClasses(variant));
    assert.deepEqual(style(node), { 'border-radius': '0', border: 'var(--line-width) solid currentColor', background: 'var(--card)', color: `var(--${ink})` });
    assert.equal(tokens(theme)['--line-width'], '1.5px');
    assert.deepEqual(style(element({ 'data-slot': 'badge-mark' }, node)), { display: 'inline' });
  }
});

test('P97 Badge: core roots/descendants and nested core previews receive no Blueprint changes, including marks', () => {
  for (const outer of themes) for (const core of themes.slice(0, 3)) {
    const preview = element({ 'data-agent-preview': '', 'data-prism-theme': core, 'data-slot': 'badge' }, element({ 'data-prism-theme': outer }), badgeClasses('success'));
    const child = element({ 'data-slot': 'badge' }, preview, badgeClasses('warning'));
    for (const node of [preview, child, element({ 'data-slot': 'badge-mark' }, child)]) assert.deepEqual(style(node), {});
  }
  for (const theme of themes.slice(0, 3)) assert.deepEqual(style(element({ 'data-slot': 'badge' }, element({ 'data-prism-theme': theme }), badgeClasses('error'))), {});
});

test('P97 Badge: omitted mark preserves legacy coss composition; marks are decorative, hidden by default, text remains', () => {
  for (const variant of ['default', 'secondary', 'outline', 'success', 'warning', 'error', 'destructive', 'info']) {
    assert.equal(render(h(api.Badge, { variant }, '状态')), render(h(api.CossBadge, { variant, size: 'lg' }, '状态')));
  }
  const renderProps = { render: h('a', { href: '/status' }, '链接状态'), variant: 'outline' };
  assert.equal(render(h(api.Badge, renderProps)), render(h(api.CossBadge, { ...renderProps, size: 'lg' })), 'omitting children must preserve render-element content');
  for (const [mark, glyph] of [['ok', '✓'], ['warn', '!'], ['no', '✗']]) {
    const out = render(h(api.Badge, { mark, variant: 'success' }, '可读状态'));
    assert.match(out, new RegExp(`<span data-slot="badge-mark" class="hidden" aria-hidden="true">${glyph}</span>可读状态`));
    assert.doesNotMatch(out, / mark=/);
  }
});

const segments = value => [{ id: 'qualified', label: '合格', value, fill: 'ink' }, { id: 'excluded', label: '排除 / 未核实', value: 0, fill: 'hatch' }, { id: 'other', label: '其他', value: 23.5, fill: 'quiet' }];
const row = { id: 'first', label: '补回率', unit: '项', segments: segments(12345) };
const bar = props => render(h(api.BpSizeBar, props));

test('P97 SizeBar: sum, visible legend and accessible values use grouping without changing precision or zero geometry', () => {
  const out = bar({ rows: [row] });
  assert.match(out, /aria-label="补回率：合格 12,345项，排除 \/ 未核实 0项，其他 23.5项"/);
  assert.match(out, />12,368.5<\/b> 项/);
  assert.match(out, /排除 \/ 未核实 <b[^>]*>0<\/b>/);
  assert.match(out, /合格 <b[^>]*>12,345<\/b>/);
  assert.doesNotMatch(out, /class="bp-fill-hatch" style/);
});

test('P97 SizeBar: display is verbatim and does not change denominator, segment facts or add another unit', () => {
  const out = bar({ rows: [{ ...row, total: 20000, display: '65% · 177 / 272' }] });
  assert.match(out, />65% · 177 \/ 272<\/b><\/span>/);
  assert.ok(Math.abs(Number(out.match(/bp-fill-ink" style="width:([^%]+)%/)[1]) - 61.725) < 1e-10);
  assert.match(out, /合格 12,345项/);
  assert.match(bar({ rows: [{ ...row, display: '' }] }), /tabular-nums"><\/b><\/span>/);
});

test('P97 SizeBar: opt-in multi-row values keep repeated ids separate, with named row legends and explicit zeros', () => {
  const out = bar({ rows: [row, { ...row, id: 'second', label: '保持率', segments: segments(960) }], legendValues: true });
  const first = out.match(/<ul aria-label="补回率：图例"[^>]*>(.*?)<\/ul>/)[1];
  const second = out.match(/<ul aria-label="保持率：图例"[^>]*>(.*?)<\/ul>/)[1];
  assert.match(first, />12,345<\/b>/); assert.doesNotMatch(first, />960<\/b>/);
  assert.match(second, />960<\/b>/); assert.doesNotMatch(second, />12,345<\/b>/);
  for (const legend of [first, second]) assert.match(legend, /排除 \/ 未核实 <b[^>]*>0<\/b>/);
  assert.equal((bar({ rows: [row, { ...row, id: 'second' }] }).match(/<ul /g) ?? []).length, 1, 'legacy multi-row category legend stays merged by default');
});

test('P97 SizeBar: hidden legend retains all facts, all-zero input still labels zero', () => {
  const out = bar({ rows: [{ ...row, segments: [{ id: 'zero', label: '未核实', value: 0, fill: 'hatch' }] }], legend: false });
  assert.match(out, /aria-label="补回率：未核实 0项"/);
  assert.doesNotMatch(out, /<ul|style="width/);
  assert.match(out, />0<\/b> 项/);
});

test('P97 legends: category geometry changes only for Blueprint; point and line geometry remain exact in all themes', () => {
  const pointAndLine = ['dot', 'hollow-dot', 'diamond', 'triangle', 'square', 'line', 'dashed-line'];
  for (const theme of themes) for (const marker of [...pointAndLine, 'area', 'bar', 'segment']) {
    const out = capture('ChartLegend', { items: [{ id: marker, label: marker, marker, color: '#123456', tone: 'warning' }] }, theme).html;
    const actual = out.match(/<svg[^>]*>(.*?)<\/svg>/)[1];
    const expected = bp.includes(theme) && ['area', 'bar', 'segment'].includes(marker) ? 'square' : marker;
    assert.equal(actual, render(h(charts.ChartMarker, { marker: expected, color: '#123456' })), `${theme}/${marker}`);
    if (bp.includes(theme) && ['area', 'bar', 'segment'].includes(marker)) assert.match(actual, /<rect[^>]*width="13" height="13"/);
  }
});

test('P97 legends: hatch is a stroked square with unique pattern references, not a point or a solid blob', () => {
  const out = capture('ChartLegend', { items: ['a', 'b'].map(id => ({ id, label: id, marker: 'hatch', color: '#123456' })) }, 'blueprint').html;
  const ids = [...out.matchAll(/<pattern id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.ok(out.includes(`fill="url(#${id})"`));
  assert.equal((out.match(/stroke="#123456" stroke-width="1.5"/g) ?? []).length, 4);
  assert.doesNotMatch(out, /<circle/);
});

test('P97 legends: local core preview keeps category circle / original bar while local Blueprint gets a square', () => {
  for (const theme of themes) {
    const out = render(h(api.PrismScopeProvider, { theme }, h(api.ChartLegend, { items: [{ id: 'area', label: '面积', marker: 'area' }] })));
    assert.match(out, bp.includes(theme) ? /<rect / : /<circle /);
  }
});
