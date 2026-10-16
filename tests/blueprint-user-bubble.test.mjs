import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { relativeLuminance } from '../lib/prism-next/chart-color.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const css = read('app/(next)/next/blueprint.css');
const theme = read('app/(next)/next/theme.css');
const conversation = read('components/prism-next/agent-conversation.css');
const family = ':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])';
const guard = `:not(:where([data-agent-preview][data-prism-theme]:not(${family}), [data-agent-preview][data-prism-theme]:not(${family}) *))`;
const blueprints = ['blueprint', 'blueprint-night'];
const core = ['light', 'paper', 'dark'];
const themes = [...core, ...blueprints];
const runtime = await createTestRuntime('p78-user-bubble');
const result = await build({ stdin: { contents: `export { AgentMessage, AgentMessageAttachment } from './components/prism-next/agent-message';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': root }, write: false });
const file = new URL('message.mjs', runtime);
writeFileSync(file, result.outputFiles[0].text);
const api = await import(file);
const h = React.createElement;
const markup = speaker => renderToStaticMarkup(h(api.AgentMessage, {
  speaker, attachments: h(api.AgentMessageAttachment, null, '函数单元复习材料与课堂练习.pdf'),
}, h('p', null, '保留原题条件与出处，长中文自然换行。'), h('a', { href: '#materials' }, '查看材料说明'), h('math', null, h('mi', null, 'x')), h('pre', null, h('code', null, 'x = 1'))));

// Parse actual SSR into a selector probe; this is not a browser cascade/layout engine.
function tree(html, parent) {
  const nodes = [], stack = [parent];
  for (const tag of html.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    if (tag[0].startsWith('</')) { stack.pop(); continue; }
    const name = tag[0].match(/^<([\w-]+)/)[1];
    const attrs = Object.fromEntries([...tag[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const n = { name, attrs, classes: (attrs.class ?? '').split(/\s+/), parent: stack.at(-1), focused: false };
    nodes.push(n);
    if (!['input','img','br','hr','link','meta','source','wbr','area','embed'].includes(name) && !tag[0].endsWith('/>')) stack.push(n);
  }
  return nodes;
}
const element = (t, parent, preview = false) => ({ name: 'div', attrs: { 'data-prism-theme': t, ...(preview ? { 'data-agent-preview': '' } : {}) }, classes: [], parent });
function parse(selector) {
  let ast;
  transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(s) { ast = s; } } });
  assert.ok(ast); return ast;
}
function matches(s, n) {
  if (!n) return false;
  const split = s.findLastIndex(p => p.type === 'combinator');
  if (split >= 0) {
    assert.equal(s[split].value, 'descendant');
    if (!matches(s.slice(split + 1), n)) return false;
    for (let p = n.parent; p; p = p.parent) if (matches(s.slice(0, split), p)) return true;
    return false;
  }
  return s.every(p => {
    if (p.type === 'universal') return true;
    if (p.type === 'type') return n.name === p.name;
    if (p.type === 'class') return n.classes.includes(p.name);
    if (p.type === 'attribute') {
      if (!p.operation) return Object.hasOwn(n.attrs, p.name);
      assert.equal(p.operation.operator, 'equal'); return n.attrs[p.name] === p.operation.value;
    }
    if (p.type === 'pseudo-class') {
      if (p.kind === 'focus-visible') return n.focused;
      assert.ok(['is', 'where', 'not'].includes(p.kind), p.kind);
      const any = p.selectors.some(child => matches(child, n)); return p.kind === 'not' ? !any : any;
    }
    if (p.type === 'pseudo-element') return p.kind === n.pseudo;
    assert.fail(`Unsupported selector ${JSON.stringify(p)}`);
  });
}
function rules(source = css) {
  const found = [];
  postcss.parse(source).walkRules(r => {
    if (!/data-agent-message|agent-message-attachment/.test(r.selector)) return;
    assert.equal(r.parent.type, 'root', 'message rules must not rely on viewport/media gates');
    found.push({ selectors: r.selectors.map(parse), declarations: Object.fromEntries(r.nodes.filter(d => d.type === 'decl').map(d => [d.prop, d.value])) });
  });
  return found;
}
const current = rules();
function style(node, parsed = current) {
  const out = {};
  for (const rule of parsed) if (rule.selectors.some(s => matches(s, node))) Object.assign(out, rule.declarations);
  return out;
}
function fixture(t, outer, speaker = 'user') {
  const parent = outer ? element(t, element(outer), true) : element(t);
  const nodes = tree(markup(speaker), parent);
  return { parent, nodes, bubble: nodes.find(n => n.attrs['data-agent-message']), link: nodes.find(n => n.name === 'a'), attachment: nodes.find(n => n.attrs['data-slot'] === 'agent-message-attachment') };
}
function surface(parsed = current) {
  for (const t of blueprints) for (const outer of [undefined, ...themes]) {
    const f = fixture(t, outer);
    assert.deepEqual(style(f.bubble, parsed), { 'border-radius': '0', background: 'var(--secondary)', color: 'var(--foreground)' }, `${outer}/${t}`);
    assert.deepEqual(style(f.attachment, parsed), { 'border-radius': '0' });
  }
}
function links(parsed = current) {
  for (const t of blueprints) for (const outer of [undefined, ...themes]) {
    const f = fixture(t, outer);
    assert.deepEqual(style(f.link, parsed), { color: 'var(--link)' });
    f.link.focused = true;
    assert.deepEqual(style(f.link, parsed), { color: 'var(--link)', outline: '2px solid var(--ring)', 'outline-offset': '2px', 'box-shadow': 'none' });
  }
}
function isolation(parsed = current) {
  for (const t of core) for (const outer of [undefined, ...themes]) {
    const f = fixture(t, outer);
    for (const n of f.nodes) {
      n.focused = true;
      assert.deepEqual(style(n, parsed), {}, `${outer}/${t}/${n.name}`);
      if (outer) {
        // A styled target can itself be the excluded preview root.
        const preview = { ...n, attrs: { ...n.attrs, ...f.parent.attrs }, parent: f.parent.parent };
        assert.deepEqual(style(preview, parsed), {}, `preview root ${outer}/${t}/${n.name}`);
      }
    }
    // A core island inside a user bubble must not acquire Blueprint link rules.
    if (blueprints.includes(outer)) {
      const host = fixture(outer);
      f.parent.parent = host.bubble;
      for (const n of f.nodes) assert.deepEqual(style(n, parsed), {}, `island ${outer}/${t}/${n.name}`);
    }
  }
  for (const t of themes) {
    const f = fixture(t, undefined, 'agent'); f.link.focused = true;
    assert.deepEqual(style(f.bubble, parsed), {});
    assert.deepEqual(style(f.link, parsed), {});
  }
}
function tokens(t, source = theme) {
  const body = source.split(`:where([data-agent-preview])[data-prism-theme="${t}"] {`)[1].split('}')[0];
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):([^;]+);/g)].map(m => [m[1], m[2].trim()]));
}
const ratio = (a, b) => (Math.max(relativeLuminance(a), relativeLuminance(b)) + .05) / (Math.min(relativeLuminance(a), relativeLuminance(b)) + .05);
function contrast(parsed = current, source = theme) {
  const evidence = [];
  for (const t of blueprints) {
    const f = fixture(t), values = tokens(t, source);
    const resolve = value => { const key = value.match(/var\((--[\w-]+)\)/)?.[1]; assert.ok(key, value); assert.ok(values[key], key); return values[key]; };
    const bubble = style(f.bubble, parsed); f.link.focused = true;
    const link = style(f.link, parsed);
    for (const [label, foreground, background] of [
      ['text / bubble', resolve(bubble.color), resolve(bubble.background)],
      ['attachment text-icon-border / bubble', resolve(bubble.color), resolve(bubble.background)],
      ['link / bubble', resolve(link.color), resolve(bubble.background)],
      ['focus / bubble', resolve(link.outline), resolve(bubble.background)],
      ['focus / card', resolve(link.outline), values['--card']],
      ['focus / canvas', resolve(link.outline), values['--background']],
    ]) {
      const value = ratio(foreground, background);
      assert.ok(value >= 4.5, `${t}: ${label} = ${value}`);
      evidence.push({ theme: t, label, foreground, background, ratio: value });
    }
  }
  return evidence;
}

test('P78: actual message SSR retains core ink utilities, role, attachment currentColor and semantic content', () => {
  const f = fixture('light');
  for (const c of ['bg-foreground', 'text-background', 'rounded-xl', 'ml-auto']) assert.ok(f.bubble.classes.includes(c));
  assert.equal(f.bubble.attrs['aria-label'], '你说');
  assert.ok(f.attachment.classes.includes('border-current'));
  assert.ok(f.nodes.some(n => n.name === 'svg' && n.attrs.stroke === 'currentColor'));
  assert.ok(f.nodes.some(n => n.name === 'math'));
  assert.ok(f.nodes.some(n => n.name === 'code'));
  assert.match(conversation, /\.agent-user-message \.agent-message-content a \{ text-decoration: underline; \}/);
  assert.match(conversation, /\.agent-user-message \.agent-message-content :is\(p, span, a, pre, code, math, \.katex, \[data-slot="badge"\]\) \{ color: inherit; background-color: transparent; \}/);
});
test('P78: two Blueprint surfaces use secondary/foreground and retain square geometry without added border/shadow', () => surface());
test('P78: both Blueprint links use link color and a single 2px ring with 2px offset', () => links());
test('P78: core delta is empty including preview roots, descendants and core islands; Agent body stays unchanged', () => isolation());
test('P78: every new target excludes nested core previews and introduces no pseudo decoration, token or typography', () => {
  const block = css.match(/\/\* P78 user bubble:[\s\S]*?\/\* End P78 user bubble\. \*\//)[0];
  postcss.parse(block).walkRules(r => {
    for (const s of r.selectors) { assert.ok(s.startsWith(family)); assert.ok(s.endsWith(guard)); assert.ok(!s.includes('::')); }
    for (const d of r.nodes) assert.ok(!/^(--|font|line-height|border|text-shadow)/.test(d.prop), d.prop);
  });
});
test('P78: actual rule/token pairs for body, attachment, link and focus all exceed 4.5:1', t => {
  for (const row of contrast()) t.diagnostic(JSON.stringify(row));
});
test('P78: rollback and isolation mutations fail the behavioral rule contracts', t => {
  const block = css.match(/\/\* P78 user bubble:[\s\S]*?\/\* End P78 user bubble\. \*\//)[0];
  const cases = [
    ['remove adaptation', s => s.replace(block, ''), surface],
    ['ink background', s => s.replace('background:var(--secondary)', 'background:var(--foreground)'), surface],
    ['inverse text', s => s.replace('color:var(--foreground)', 'color:var(--background)'), surface],
    ['extra border', s => s.replace('background:var(--secondary)', 'border:1px solid; background:var(--secondary)'), surface],
    ['extra shadow', s => s.replace('background:var(--secondary)', 'box-shadow:0 0 0 1px; background:var(--secondary)'), surface],
    ['link inherits ink rule', s => s.replace('color:var(--link)', 'color:inherit'), links],
    ['white focus rollback', s => s.replace('solid var(--ring)', 'solid var(--primary-foreground)'), links],
    ['no focus offset', s => s.replace('outline-offset:2px', 'outline-offset:0'), links],
    ['double focus', s => s.replace('box-shadow:none', 'box-shadow:0 0 0 4px var(--ring)'), links],
    ['night omitted', s => s.replaceAll(family, '[data-prism-theme="blueprint"]'), surface],
    ['unscoped rules', s => s.replaceAll(`${family} [data-agent-message`, '[data-agent-message'), isolation],
    ['preview guard removed', s => s.replaceAll(guard, ''), isolation],
    ['preview root exclusion lost', s => s.replaceAll(`[data-agent-preview][data-prism-theme]:not(${family}), `, ''), isolation],
    ['preview descendant exclusion lost', s => s.replaceAll(`, [data-agent-preview][data-prism-theme]:not(${family}) *`, ''), isolation],
    ['assistant accidentally included', s => s.replaceAll('[data-agent-message="user"]', '[data-agent-message]'), isolation],
  ];
  for (const [name, mutate, check] of cases) {
    const changed = mutate(block); assert.notEqual(changed, block, name);
    assert.throws(() => check(rules(css.replace(block, changed))), undefined, name);
    t.diagnostic(`detected: ${name}`);
  }
  for (const name of blueprints) {
    const start = theme.indexOf(`:where([data-agent-preview])[data-prism-theme="${name}"] {`);
    const changed = theme.slice(0, start) + theme.slice(start).replace(/--link:#[\da-f]+;/i, `--link:${tokens(name)['--secondary']};`);
    assert.notEqual(changed, theme);
    assert.throws(() => contrast(current, changed), undefined, `${name} contrast regression`);
    t.diagnostic(`detected: ${name} contrast regression`);
  }
});
