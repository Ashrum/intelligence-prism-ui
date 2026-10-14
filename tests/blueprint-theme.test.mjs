import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const theme = read('app/(next)/next/theme.css');
const bp = read('app/(next)/next/blueprint.css');
const block = selector => theme.split(`${selector} {`)[1]?.split('}')[0] ?? '';

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
  const own = block(':where([data-agent-preview])[data-prism-theme="blueprint"]');
  const hex = n => own.match(new RegExp(`--${n}:(#[0-9A-Fa-f]{6})`))[1];
  const lum = h => h.slice(1).match(/../g).map(c => parseInt(c, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const ratio = (a, b) => { const x = lum(hex(a)), y = lum(hex(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };
  for (const [fg, bg] of [['foreground', 'background'], ['muted-foreground', 'card'], ['link', 'card'], ['primary-foreground', 'primary'], ['destructive-foreground', 'card'], ['success-foreground', 'card'], ['warning-foreground', 'card']]) assert.ok(ratio(fg, bg) >= 4.5, `${fg}/${bg} ${ratio(fg, bg).toFixed(2)}`);
});

test('blueprint geometry rules are scoped and do not touch coss sources', () => {
  const rules = bp.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map(r => r.split('{')[0].trim()).filter(Boolean).filter(s => !s.startsWith('@'));
  const topLevel = s => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; } return [...out, cur].map(x => x.trim()); };
  for (const selector of rules) {
    if (topLevel(selector).every(s => s.startsWith('.bp-'))) continue;
    assert.match(selector, /data-prism-theme="blueprint(?:-night)?"/, selector);
  }
  assert.doesNotMatch(bp, /@layer/);
  assert.match(theme, /@import "\.\/blueprint\.css";/);
  assert.match(theme, /@custom-variant dark[^\n]+\[data-agent-preview\]\[data-prism-theme="blueprint"\]/);
});
