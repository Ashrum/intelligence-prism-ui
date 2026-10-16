import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const theme = read('app/(next)/next/theme.css');
const bp = read('app/(next)/next/blueprint.css');
const block = selector => theme.split(`${selector} {`)[1]?.split('}')[0] ?? '';
const token = (css, name) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
const blueprint = block(':where([data-agent-preview])[data-prism-theme="blueprint"]');
const rgb = hex => hex.slice(1).match(/../g).map(c => parseInt(c, 16));
const luminance = color => color.map(c => c / 255)
  .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
};
const blueprintColor = name => rgb(token(blueprint, name));

test('blueprint is a fourth selectable theme; core matrix stays light/paper/dark', () => {
  const config = read('lib/prism-next/config.ts');
  assert.match(config, /\{ value: "blueprint", label: "蓝图" \}/);
  assert.match(config, /coreThemes = \["light", "paper", "dark"\]/);
  assert.match(config, /blueprint: \{ background: "#F6F6F3"/);
  assert.match(read('components/prism-next/providers.tsx'), /themes=\{themes\}/);
});

test('blueprint boundary declares every role explicitly, including status, chart and AI tokens', () => {
  const root = theme.split('color-scheme:light;')[0];
  const names = [...root.matchAll(/--([\w-]+):/g)].map(m => m[1]).filter(n => !n.startsWith('brand-blue') && !n.startsWith('brand-magenta') && !n.startsWith('brand-green'));
  const own = block(':where([data-agent-preview])[data-prism-theme="blueprint"]');
  assert.ok(own.length > 0);
  for (const name of new Set(names)) assert.match(own, new RegExp(`--${name}:`), name);
  assert.match(own, /--radius:0px/); assert.match(own, /--line-width:1\.5px/); assert.match(own, /color-scheme:light/);
});

test('core theme tokens are unchanged', () => {
  const light = block(':where([data-agent-preview][data-prism-theme])');
  const paper = block(':where([data-agent-preview])[data-prism-theme="paper"]');
  const dark = block(':where([data-agent-preview])[data-prism-theme="dark"]');
  assert.match(light, /--background:#FFFFFF;\s*--foreground:#1F2328;/); assert.match(light, /--radius:0\.625rem/);
  assert.match(paper, /--background:#F4F1EA;\s*--foreground:#1E293B;/); assert.doesNotMatch(paper, /--radius:/);
  assert.match(dark, /--background:#0F0F0F;\s*--foreground:#E1E5EA;/); assert.doesNotMatch(dark, /--radius:/);
  assert.match(light, /--line:var\(--border\)/); assert.match(light, /--line-width:1px/);
});

test('blueprint ink pairs exceed 4.5:1 numerically', () => {
  const ratio = (a, b) => contrast(blueprintColor(a), blueprintColor(b));
  for (const [fg, bg] of [['foreground', 'background'], ['muted-foreground', 'card'], ['link', 'card'], ['primary-foreground', 'primary'], ['destructive-foreground', 'card'], ['success-foreground', 'card'], ['warning-foreground', 'card']]) assert.ok(ratio(fg, bg) >= 4.5, `${fg}/${bg} ${ratio(fg, bg).toFixed(2)}`);
});

test('core warning foreground values retain the main c5d2363 contract', () => {
  const light = block(':where([data-agent-preview][data-prism-theme])');
  const paper = block(':where([data-agent-preview])[data-prism-theme="paper"]');
  const dark = block(':where([data-agent-preview])[data-prism-theme="dark"]');
  // main defines light at the root; paper inherits it without an override.
  assert.equal(token(light, 'warning-foreground'), '#895509');
  assert.equal(token(paper, 'warning-foreground') ?? token(light, 'warning-foreground'), '#895509');
  assert.equal(token(dark, 'warning-foreground'), '#F4CC86');
});

test('blueprint warning text exceeds 4.5:1 on every supported surface', () => {
  for (const surface of ['background', 'secondary', 'muted', 'accent', 'card']) {
    const ratio = contrast(blueprintColor('warning-foreground'), blueprintColor(surface));
    assert.ok(ratio >= 4.5, `warning-foreground/${surface}: ${ratio.toFixed(4)}`);
  }
});

test('blueprint warning Badge exceeds 4.5:1 on its alpha-composited surfaces', () => {
  const warning = blueprintColor('warning');
  for (const surface of ['card', 'background', 'muted']) {
    // coss Badge bg-warning/8: composite in sRGB before linearizing for luminance.
    // Keep fractional channels instead of rounding the translucent result to hex.
    const composite = blueprintColor(surface).map((channel, i) => .08 * warning[i] + .92 * channel);
    const ratio = contrast(blueprintColor('warning-foreground'), composite);
    assert.ok(ratio >= 4.5, `warning-foreground/warning 8% over ${surface}: ${ratio.toFixed(4)}`);
  }
});

test('blueprint white labels exceed 4.5:1 on the warning foreground fill', () => {
  for (const foreground of ['primary-foreground', 'card']) {
    const ratio = contrast(blueprintColor(foreground), blueprintColor('warning-foreground'));
    assert.ok(ratio >= 4.5, `${foreground}/warning-foreground: ${ratio.toFixed(4)}`);
  }
});

test('blueprint geometry rules are scoped and do not touch coss sources', () => {
  const rules = bp.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map(r => r.split('{')[0].trim()).filter(Boolean).filter(s => !s.startsWith('@'));
  const topLevel = s => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; } return [...out, cur].map(x => x.trim()); };
  for (const selector of rules) {
    if (topLevel(selector).every(s => s.startsWith('.bp-'))) continue;
    assert.match(selector, /data-prism-theme="blueprint"/, selector);
  }
  assert.doesNotMatch(bp, /@layer/);
  assert.match(theme, /@import "\.\/blueprint\.css";/);
  assert.match(theme, /@custom-variant dark[^\n]+\[data-agent-preview\]\[data-prism-theme="blueprint"\]/);
});
