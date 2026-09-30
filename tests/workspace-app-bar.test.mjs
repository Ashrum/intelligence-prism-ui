import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/workspace-app-bar/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/app-bar';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AppBarTeachingContext, PrismBrandMark, InstitutionWordmark, AppBarNavLink, AppBarSpaceMenu, IconCountBadge, BarIconButton, SpaceBar, PageHead } = await import(file);
await rm(file);
const h = React.createElement;
const css = await readFile(new URL('../components/prism-next/app-bar.css', import.meta.url), 'utf8');
const typography = await readFile(new URL('../app/(next)/next/typography.css', import.meta.url), 'utf8');

test('brand mark preserves three decorative shell bars and uses only the existing brand colours', () => {
  const html = render(h(PrismBrandMark));
  assert.match(html, /aria-hidden="true"/);
  assert.equal((html.match(/<span/g) ?? []).length, 4);
  for (const colour of ['blue', 'magenta', 'green']) assert.ok(css.includes(`var(--brand-${colour})`));
  assert.match(css, /--prism-brand-mark-size:20px/);
  assert.match(css, /height:80%/); assert.match(css, /height:100%/); assert.match(css, /height:60%/);
  assert.match(render(h(PrismBrandMark, { size: 22 })), /--prism-brand-mark-size:22px/);
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b|rgba?\(/i);
});

test('institution asset alone consumes the approved brand role and preserves the full name', () => {
  const name = '北京市海淀区启明实验学校（集团）第二分校';
  const html = render(h(InstitutionWordmark, { maxWidth: 208 }, name));
  assert.match(html, /text-brand-wordmark/); assert.ok(html.includes(`title="${name}"`));
  assert.match(html, /max-width:208px/);
  assert.match(typography, /--text-brand-wordmark: 1\.0625rem/);
  assert.match(typography, /--text-brand-wordmark--font-weight: 700/);
  assert.match(typography, /"Songti SC","STSong","Noto Serif SC",serif/);
});

test('navigation is a native link with externally supplied aria-current and a neutral inset underline', () => {
  const current = render(h(AppBarNavLink, { href: '/agent', 'aria-current': 'page', icon: h('svg') }, 'Agent'));
  assert.match(current, /<a[^>]*href="\/agent"/); assert.match(current, /aria-current="page"/);
  assert.match(current, /prism-app-bar-nav-link/);
  assert.match(css, /\.prism-app-bar-nav-link\[aria-current="page"\][^{]*\{[^}]*box-shadow:inset 0 -2px 0 var\(--primary\)/);
  assert.match(css, /:not\(\[aria-current="page"\]\):hover::before/);
  assert.match(css, /:focus-visible::before[^}]*var\(--ring\)/);
  assert.match(css, /\.prism-app-bar-navigation[^}]*overflow-x:auto/);
  assert.doesNotMatch(render(h(AppBarNavLink, { href: '/papers', icon: h('svg'), hideIcon: true }, '组卷')), /aria-current|<svg/);
});

test('unknown counts stay absent, zero is known, and badges have a 12px role and one accessible reading', () => {
  for (const count of [undefined, null, NaN, Infinity, -1, 1.5]) assert.equal(render(h(IconCountBadge, { count })), '');
  for (const count of [0, 6]) {
    const html = render(h(BarIconButton, { label: '试题篮', count, countUnit: ' 题', size: 'space' }, h('svg')));
    assert.ok(html.includes(`aria-label="试题篮，${count} 题"`));
    assert.match(html, /prism-icon-count-badge text-component-label/);
    assert.match(html, /aria-hidden="true"[^>]*>\d+<\/span>/);
  }
  assert.match(css, /\.prism-icon-count-badge\[data-slot="badge"\]\.text-component-label[^}]*font-size:var\(--text-component-label\)/);
  assert.match(typography, /--text-component-label: 0\.75rem/);
});

test('count badges retain their paired foreground when the semantic label size is merged', () => {
  for (const size of ['global', 'space']) {
    const html = render(h(BarIconButton, { label: '试题篮', count: 6, size }, h('svg')));
    const badge = html.match(/<span\b[^>]*data-slot="badge"[^>]*>/)?.[0];
    assert.ok(badge);
    const classes = badge.match(/class="([^"]*)"/)[1].split(' ');
    assert.ok(classes.includes('bg-primary'));
    assert.ok(classes.includes('text-primary-foreground'));
    assert.ok(classes.includes('text-component-label'));
    assert.ok(!classes.includes('text-muted-foreground'));
  }
});

test('badge primary/primary-foreground theme tokens meet 4.5:1 contrast', async t => {
  const themeCss = await readFile(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
  const luminance = hex => {
    const linear = hex.match(/[a-f\d]{2}/gi).map(channel => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  for (const theme of ['light', 'paper', 'dark']) {
    const selector = theme === 'light' ? ':where([data-agent-preview][data-prism-theme])' : `:where([data-agent-preview])[data-prism-theme="${theme}"]`;
    assert.ok(themeCss.includes(`${selector} {`));
    const block = themeCss.split(`${selector} {`)[1].split('}')[0];
    const background = luminance(block.match(/--primary:\s*#([a-f\d]{6})/i)[1]);
    const foreground = luminance(block.match(/--primary-foreground:\s*#([a-f\d]{6})/i)[1]);
    const contrast = (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
    assert.ok(contrast >= 4.5, `${theme}: ${contrast}`);
    t.diagnostic(`${theme} primary/primary-foreground: ${contrast.toFixed(2)}:1`);
  }
});

test('SpaceBar middle controls can shrink while titles truncate and side/tools stay fixed', () => {
  const content = css.match(/\.prism-space-bar-content\s*\{([^}]+)\}/)[1];
  assert.match(content, /flex:1;/);
  assert.match(content, /min-width:0;/);
  // MenuTrigger replaces Button's data-slot, so both slots must be covered.
  const trigger = css.match(/\.prism-space-bar-content > :is\(([^)]+)\)\s*\{([^}]+)\}/);
  for (const slot of ['button', 'menu-trigger', 'select-trigger']) assert.ok(trigger[1].includes(`[data-slot="${slot}"]`));
  assert.match(trigger[2], /min-width:0;/);
  assert.match(trigger[2], /flex-shrink:1;/);
  for (const slot of ['side', 'tools']) {
    const rule = css.match(new RegExp(`\\.prism-space-bar-${slot}\\s*\\{([^}]+)\\}`))[1];
    assert.match(rule, /flex-shrink:0;/);
  }
  const title = css.match(/\.prism-space-bar-title\s*\{([^}]+)\}/)[1];
  for (const declaration of ['min-width:0;', 'overflow:hidden;', 'text-overflow:ellipsis;', 'white-space:nowrap;']) assert.ok(title.includes(declaration));
  const demo = new URL('../examples/workspace-app-bar/demo.tsx', import.meta.url);
  return readFile(demo, 'utf8').then(source => {
    assert.match(source, /<SpaceBarTitle title=\{conversation\}>/);
    assert.doesNotMatch(source, /任教范围：|scopeOptions/);
  });
});

test('space menu reads currentId and emits a selection without mutating the supplied current space', () => {
  const items = Object.freeze([Object.freeze({ id: 'a', label: 'Agent', href: '/a' }), Object.freeze({ id: 'p', label: '组卷' })]);
  const calls = [];
  const element = AppBarSpaceMenu({ items, currentId: 'a', onSelect: id => calls.push(id) });
  const [trigger, popup] = element.props.children;
  assert.equal(trigger.props['aria-label'], '当前空间 Agent，切换空间');
  assert.equal(popup.props.children[0].props['aria-current'], 'page');
  assert.equal(popup.props.children[0].props.href, '/a');
  assert.equal(popup.props.children[1].props['aria-current'], undefined);
  popup.props.children[1].props.onClick();
  assert.deepEqual(calls, ['p']);
  assert.equal(popup.props.children[0].props['aria-current'], 'page');
  const unknown = AppBarSpaceMenu({ items, currentId: null });
  assert.equal(unknown.props.children[0].props['aria-label'], '切换空间');
  assert.ok(unknown.props.children[1].props.children.every(item => item.props['aria-current'] === undefined));
});

test('SpaceBar collapse is controlled, unknown data is not fabricated, and PageHead retains heading roles', () => {
  const side = { title: '工作目录', collapsed: true, onToggle() {} };
  const collapsed = render(h(SpaceBar, { side }, '全部任教范围'));
  assert.match(collapsed, /data-side="collapsed"/); assert.match(collapsed, /aria-expanded="false"/);
  assert.doesNotMatch(collapsed, /prism-space-bar-side-title/);
  const expanded = render(h(SpaceBar, { side: { ...side, collapsed: false }, sideWidth: 280 }));
  assert.match(expanded, /width:280px/); assert.match(expanded, /aria-expanded="true"/);
  assert.match(expanded, /text-item-title prism-space-bar-side-title/);
  const head = render(h(PageHead, { title: '同步组卷', description: '沿教材与知识点选题，调整编排后保存正式试卷。', actions: h('button', {}, '新建试卷') }));
  assert.match(head, /<h1 class="text-section-title">同步组卷/);
  assert.match(head, /text-ui-hint text-muted-foreground/);
});

test('responsive sizes are based on named containers including portalled menu typography', () => {
  for (const width of [1180, 900, 600]) assert.ok(css.includes(`@container prism-app-bar (width < ${width}px)`));
  assert.match(css, /@container prism-page-head \(width < 600px\)/);
  assert.match(css, /\.prism-app-bar-space-item\[data-slot\][^}]*height:44px[^}]*font-size:var\(--text-block-title\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /@media\s*\([^)]*width/);
});

test('the built application example exposes all four widths and three themes outside the 80-entry catalog', async () => {
  const { default: worker } = await import(new URL('../dist/server/index.js', import.meta.url));
  const response = await worker.fetch(new Request('http://localhost/next/use-cases/workspace-app-bar', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const width of [1280, 1024, 800, 390]) assert.ok(html.includes(`>${width}</button>`));
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html, /Workspace 顶部区域/); assert.match(html, /同步组卷/);
  const { components } = await import('../lib/prism-next/catalog.ts');
  assert.equal(components.length, 80);
});

test('teaching context emits intents but waits for host-confirmed facts, with empty and stale states', () => {
  const items = Object.freeze([Object.freeze({ id: 'a', label: '一班 · 数学' }), Object.freeze({ id: 'b', label: '二班 · 数学' })]);
  const calls = [];
  const props = { summary: '一班 · 数学', items, currentId: 'a', status: '任教信息未确认', textbook: '宿主教材', onSelect: id => calls.push(id), settings: { href: '/settings/teaching', onSelect: () => calls.push('settings') } };
  const tree = AppBarTeachingContext(props);
  const [trigger, popup] = tree.props.children;
  assert.equal(trigger.props.render.props.label, '任教班级与教材：一班 · 数学');
  const content = popup.props.children.props.children;
  const buttons = content[2].props.children;
  assert.equal(buttons[0].props['aria-pressed'], true);
  buttons[1].props.onClick();
  assert.deepEqual(calls, ['b']);
  assert.equal(buttons[0].props['aria-pressed'], true);
  assert.equal(content[3].props.children[1].props.children, '宿主教材');
  assert.equal(content[4].props.render.props.href, '/settings/teaching');
  content[4].props.onClick();
  assert.deepEqual(calls, ['b', 'settings']);
  for (const patch of [{ items: [] }, { currentId: 'stale' }]) {
    const state = AppBarTeachingContext({ ...props, ...patch }).props.children[1].props.children.props.children;
    assert.equal(state[1].props.children[1].props.children, '任教信息未确认');
    assert.equal(state[4].props.children, '任教与教材设置');
  }
  const html = render(h(AppBarTeachingContext, props));
  assert.match(html, /aria-label="任教班级与教材：一班 · 数学"/);
  assert.match(html, /lucide-school/);
  assert.doesNotMatch(html, />一班 · 数学</);
});
