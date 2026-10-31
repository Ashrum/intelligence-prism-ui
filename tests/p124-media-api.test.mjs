import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), h = React.createElement;
const baseline = '0477484c45f71fdaba4a63960f054349659d5367';
const paths = ['agent-media-parts', 'agent-prompt-bar', 'agent-prompt-attachments'].map(n => `components/prism-next/${n}.tsx`);
const runtime = await createTestRuntime('p124');
let active;
const hooks = {
  useId: () => 'p124',
  useRef(value) { const i = active.cursor++; return active.slots[i] ??= { current: value }; },
  useState(value) { const s = active, i = s.cursor++; if (!(i in s.slots)) s.slots[i] = value; return [s.slots[i], next => { s.slots[i] = typeof next === 'function' ? next(s.slots[i]) : next; }]; },
  useEffect() { active.cursor++; }, useLayoutEffect() { active.cursor++; },
};
globalThis.__p124Hooks = hooks;
async function bundle(mode) {
  const file = new URL(`${mode}.mjs`, runtime);
  const result = await build({ stdin: { contents: paths.map(p => `export * from './${p}';`).join('\n') + (mode === 'old' ? '' : "export * from './components/prism-next/demos/agent-media-api-demo'; export * from './components/prism-next/demos/agent-prompt-attachments-demo';"), loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: mode === 'old' ? [{ name: 'baseline', setup(b) {
    b.onLoad({ filter: /(?:agent-media-parts|agent-prompt-bar|agent-prompt-attachments)\.tsx$/ }, ({ path }) => ({ contents: execFileSync('git', ['show', `${baseline}:${path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
  } }] : mode === 'probe' ? [{ name: 'hooks', setup(b) {
    b.onLoad({ filter: /(?:agent-media-parts|agent-prompt-bar|agent-media-api-demo)\.tsx$/ }, ({ path }) => ({ loader: 'tsx', contents: readFileSync(path, 'utf8').replace(/import \{ ([^\n]+) \} from "react"/, (_, imports) => {
      const names = imports.split(', ').filter(n => !n.startsWith('type '));
      const types = imports.split(', ').filter(n => n.startsWith('type '));
      return `${types.length ? `import { ${types.join(', ')} } from "react";` : ''} const { ${names.join(', ')} } = (globalThis as any).__p124Hooks;`;
    }) }));
  } }] : [] });
  writeFileSync(file, result.outputFiles[0].text); return import(file);
}
const old = await bundle('old'), api = await bundle('current'), probe = await bundle('probe');
const base = { value: '', onValueChange() {}, onIntent() {}, sources: [], commands: [], models: [], dictation: { state: 'idle' }, voice: { state: 'idle' } };
const media = { title: '课堂视频', description: '抛物线 y = x²', src: '/test.webm', availability: { state: 'available' } };
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
for (const theme of themes) test(`P124 ${theme}: baseline SSR bytes unchanged for NativeMedia, PromptBar and strip`, () => {
  const wrap = (C, props) => render(h('div', { 'data-prism-theme': theme }, h(C, props)));
  for (const kind of ['audio', 'video']) for (const extra of [{}, { poster: '/square.png' }, { media: { ...media, src: undefined } }, { media: { ...media, availability: { state: 'unknown' } } }, { capability: { supported: false, reason: '暂不可播放' } }]) {
    const props = { media, kind, capability: { supported: true }, ...extra };
    for (const optional of [{}, { fit: undefined, containerClassName: undefined, mediaClassName: undefined, preload: undefined }]) assert.equal(wrap(api.NativeMedia, { ...props, ...optional }), wrap(old.NativeMedia, props));
  }
  for (const variant of ['Rounded', 'Pill']) for (const extra of [{}, { density: 'compact' }, { disabled: true }, { primaryAction: 'stop' }, { sendDisabledReason: '外部禁发原因' }, { attachments: [{ id: 'old', label: '旧附件.pdf' }] }]) for (const richAttachments of [undefined, [], api.promptAttachmentExamples, api.attachmentFailureExamples]) {
    const props = { ...base, variant, ...extra, richAttachments };
    for (const optional of [{}, { attachmentErrorDisplay: undefined }]) assert.equal(wrap(api.AgentPromptBar, { ...props, ...optional }), wrap(old.AgentPromptBar, props));
  }
  for (const items of [[], api.promptAttachmentExamples, api.attachmentFailureExamples]) for (const disabled of [false, true]) for (const onOpen of [undefined, () => {}]) {
    const props = { items, disabled, onRemove() {}, onOpen };
    for (const optional of [{}, { errorDisplay: undefined }, { errorDisplay: 'item' }]) assert.equal(wrap(api.AgentPromptAttachmentStrip, { ...props, ...optional }), wrap(old.AgentPromptAttachmentStrip, props));
  }
});
const nodes = (tree, out = []) => { if (Array.isArray(tree)) tree.forEach(n => nodes(n, out)); else if (React.isValidElement(tree)) { out.push(tree); nodes(tree.props.children, out); } return out; };
const state = () => ({ slots: [], cursor: 0 });
function capture(C, props, store = state()) { active = store; store.cursor = 0; return nodes(C(props)); }
const text = n => typeof n === 'string' || typeof n === 'number' ? String(n) : Array.isArray(n) ? n.map(text).join('') : n?.props ? text(n.props.children) : '';

test('P124 NativeMedia: contain removes fixed cap, forwards bounds/preload and locks metadata ratio independent of poster', () => {
  const store = state(), props = { media, kind: 'video', capability: { supported: true }, poster: api.lightboxPoster, fit: 'contain', preload: 'metadata', containerClassName: 'w-full', mediaClassName: 'max-h-[65dvh] max-w-full' };
  let ui = capture(probe.NativeMedia, props, store), video = ui.find(n => n.type === 'video');
  assert.match(ui[0].props.className, /w-full/); assert.match(video.props.className, /object-contain/); assert.match(video.props.className, /max-h-\[65dvh\]/); assert.doesNotMatch(video.props.className, /max-h-96/);
  assert.equal(video.props.preload, 'metadata'); assert.equal(video.props.style, undefined);
  for (const [videoWidth, videoHeight] of [[640, 360], [360, 640]]) {
    video.props.onLoadedMetadata({ currentTarget: { videoWidth, videoHeight } });
    video = capture(probe.NativeMedia, props, store).find(n => n.type === 'video');
    assert.equal(video.props.style.aspectRatio, `${videoWidth} / ${videoHeight}`);
  }
  const changed = capture(probe.NativeMedia, { ...props, media: { ...media, src: '/other.webm' } }, store).find(n => n.type === 'video');
  assert.equal(changed.props.style, undefined, 'ratio cannot leak to another src');
  video.props.onEmptied(); assert.equal(capture(probe.NativeMedia, props, store).find(n => n.type === 'video').props.style, undefined);
  video.props.onLoadedMetadata({ currentTarget: { videoWidth: 0, videoHeight: 0 } });
  assert.equal(capture(probe.NativeMedia, props, store).find(n => n.type === 'video').props.style, undefined);
  video.props.onError(); ui = capture(probe.NativeMedia, props, store);
  assert.ok(!ui.some(n => n.type === 'video')); assert.match(text(ui.find(n => n.props.role === 'status')), /媒体加载失败/);
  for (const kind of ['video', 'audio']) for (const preload of ['none', 'metadata', 'auto']) assert.match(render(h(api.NativeMedia, { media, kind, capability: { supported: true }, preload })), new RegExp(`preload="${preload}"`));
});

test('P124 summary/hidden: accessible failure reasons, fallback, one row per failure directly under strip inside input', () => {
  for (const errorDisplay of ['summary', 'hidden']) for (const onOpen of [undefined, () => {}]) {
    const html = render(h(api.AgentPromptAttachmentStrip, { items: api.attachmentFailureExamples, disabled: false, onRemove() {}, onOpen, errorDisplay }));
    const strip = html.slice(html.indexOf('aria-label="附件条"'), html.indexOf('</ul>'));
    assert.doesNotMatch(strip, /<p role="status"/);
    assert.equal((strip.match(/border-destructive-foreground/g) ?? []).length, 4);
    assert.equal((strip.match(/lucide-circle-alert/g) ?? []).length, 4);
    for (const item of api.attachmentFailureExamples) assert.ok(strip.includes(`${item.name}；失败：${item.errorReason || '原因未提供'}`));
    if (errorDisplay === 'hidden') assert.doesNotMatch(html, /附件失败原因/);
    else {
      const summary = html.slice(html.indexOf('aria-label="附件失败原因"'));
      assert.equal((summary.match(/<li /g) ?? []).length, 4); assert.match(summary, /max-w-\[40%\]/); assert.match(summary, /truncate/);
      for (const item of api.attachmentFailureExamples) { assert.ok(summary.includes(`title="${item.name}"`)); assert.ok(summary.includes(`<span class="sr-only">${item.name}</span>`)); assert.ok(summary.includes(item.errorReason || '原因未提供')); }
    }
  }
  const html = render(h(api.AgentPromptBar, { ...base, richAttachments: api.attachmentFailureExamples, attachmentErrorDisplay: 'summary' }));
  assert.ok(html.indexOf('aria-label="附件条"') < html.indexOf('aria-label="附件失败原因"'));
  assert.ok(html.indexOf('aria-label="附件失败原因"') < html.indexOf('<textarea'));
  const empty = render(h(api.AgentPromptBar, { ...base, richAttachments: [], attachmentErrorDisplay: 'summary' }));
  assert.doesNotMatch(empty, /附件失败原因/);
});

test('P124 modes preserve click/Enter send gates, remove/open intents, disabled and stop semantics', () => {
  for (const attachmentErrorDisplay of ['item', 'summary', 'hidden']) for (const density of [undefined, 'compact']) {
    const calls = [], props = { ...base, value: '正文', density, attachmentErrorDisplay, richAttachments: api.attachmentFailureExamples, onIntent: i => calls.push(i) };
    const ui = capture(probe.AgentPromptBar, props), send = ui.find(n => n.props['aria-label'] === '发送消息');
    assert.equal(send.props.disabled, true); send.props.onClick();
    ui.find(n => n.props.role === 'combobox').props.onKeyDown({ key: 'Enter', nativeEvent: {}, preventDefault() {} }); assert.deepEqual(calls, []);
    const strip = ui.find(n => n.type === probe.AgentPromptAttachmentStrip); assert.equal(strip.props.errorDisplay, attachmentErrorDisplay);
    nodes(probe.AgentPromptAttachmentStrip(strip.props)).find(n => n.props['aria-label'] === '移除附件：空文件.png').props.onClick();
    assert.deepEqual(calls, [{ type: 'remove-attachment', id: 'empty' }]);
    const stop = capture(probe.AgentPromptBar, { ...props, primaryAction: 'stop' }).find(n => n.props['aria-label'] === '停止当前回答');
    assert.equal(Boolean(stop.props.disabled), false); stop.props.onClick(); assert.deepEqual(calls.at(-1), { type: 'stop' });
    const actions = [], disabledStrip = nodes(probe.AgentPromptAttachmentStrip({ ...strip.props, disabled: true, onOpen: id => actions.push(id), onRemove: id => actions.push(id) }));
    for (const n of disabledStrip.filter(n => n.props.onClick)) n.props.onClick(); assert.deepEqual(actions, []);
  }
});

test('P124 shipped demo integration: five themes, narrow container, both lightboxes, switch, all failure removals and send', () => {
  // Actual demo fixtures and callbacks → actual PromptBar/strip/NativeMedia. No DOM/playback claims.
  const demoState = state(), promptState = state(); let demo, ui;
  const refresh = () => { demo = capture(probe.AgentMediaApiDemo, {}, demoState); const p = demo.find(n => n.type === probe.AgentPromptBar); ui = capture(probe.AgentPromptBar, p.props, promptState); };
  refresh();
  const themesGroup = demo.find(n => n.props['aria-label'] === '媒体适配主题');
  for (const n of nodes(themesGroup).filter(n => n.props.onClick)) { n.props.onClick(); refresh(); assert.equal(demo.find(n => n.props['data-agent-preview']).props['data-prism-theme'], n.key); }
  demo.find(n => n.props.onClick && text(n) === '390px 容器').props.onClick(); refresh(); assert.equal(demo.find(n => n.props['data-agent-preview']).props.style.width, 390);
  for (const item of api.lightboxVideoExamples) {
    const trigger = { id: item.id }, button = demo.find(n => n.props['aria-label'] === `打开${item.title}`);
    button.props.onClick({ currentTarget: trigger }); demo.find(n => n.props.onOpenChange).props.onOpenChange(true); refresh();
    const native = demo.find(n => n.type === probe.NativeMedia); assert.equal(native.props.media.src, item.src); assert.equal(native.props.fit, 'contain');
    const player = capture(probe.NativeMedia, native.props).find(n => n.type === 'video'); assert.equal(player.props.preload, 'metadata'); assert.equal(player.props.poster, api.lightboxPoster);
    const popup = demo.find(n => n.props.finalFocus); assert.equal(popup.props.finalFocus(), trigger);
    demo.find(n => n.props.onClick && text(n) === '切换横竖视频').props.onClick(); refresh(); assert.notEqual(demo.find(n => n.type === probe.NativeMedia).props.media.src, item.src);
    demo.find(n => n.props.onOpenChange).props.onOpenChange(false); refresh(); assert.equal(demo.find(n => n.props.finalFocus).props.finalFocus(), trigger);
  }
  for (const item of api.attachmentFailureExamples) {
    const strip = ui.find(n => n.type === probe.AgentPromptAttachmentStrip); assert.equal(strip.props.errorDisplay, 'summary'); assert.equal(ui.find(n => n.props['aria-label'] === '发送消息').props.disabled, true);
    nodes(probe.AgentPromptAttachmentStrip(strip.props)).find(n => n.props['aria-label'] === `移除附件：${item.name}`).props.onClick(); refresh();
  }
  const send = ui.find(n => n.props['aria-label'] === '发送消息'); assert.equal(Boolean(send.props.disabled), false); send.props.onClick(); refresh();
  assert.match(text(demo.find(n => n.props.role === 'status')), /"type":"submit"/);
  demo.find(n => n.props.onClick && text(n) === '重置失败样例').props.onClick(); refresh(); assert.equal(ui.find(n => n.type === probe.AgentPromptAttachmentStrip).props.items.length, 4);
});

test('P124 reusable badge retains original markup and unknown duration; frozen visual sources unchanged', () => {
  const html = render(h(api.AttachmentPlayBadge, { durationLabel: '0:02' }));
  assert.match(html, /bp-prompt-attachment-play/); assert.match(html, /bp-prompt-attachment-meta/); assert.match(html, /0:02/); assert.doesNotMatch(html, /<button/);
  assert.doesNotMatch(render(h(api.AttachmentPlayBadge)), /bp-prompt-attachment-meta/);
  for (const path of ['components/prism-next/blueprint/prompt-attachments.css', 'components/prism-next/agent-prompt-attachments.css', 'app/(next)/next/theme.css', 'app/(next)/next/blueprint.css', 'package.json', 'package-lock.json']) assert.equal(path === 'app/(next)/next/blueprint.css' ? readFileSync(root + path, 'utf8').split('\n/* P125 ·')[0] : readFileSync(root + path, 'utf8'), execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' }));
  assert.equal(execFileSync('git', ['diff', baseline, '--', 'components/coss'], { cwd: root, encoding: 'utf8' }), '');
  for (const item of api.lightboxVideoExamples) {
    const bytes = readFileSync(root + 'public' + item.src);
    assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3'); assert.ok(bytes.length > 1000);
  }
});
