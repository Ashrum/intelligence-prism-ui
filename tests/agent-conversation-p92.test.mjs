import { withoutPromptOpticalAlignment } from './helpers/p110-spacing.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { gunzipSync } from 'node:zlib';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p92');
const options = { stdin: { contents: "export * from './components/prism-next/agent-prompt-bar'; export * from './components/prism-next/agent-message';", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
const bundle = new URL('components.mjs', runtime);
await writeFile(bundle, (await build(options)).outputFiles[0].text);
const api = await import(bundle);
const h = React.createElement;
const base = { value: '保留草稿 f(x) = x²', onValueChange() {}, onIntent() {}, sources: [], commands: [], models: [], dictation: { state: 'idle' }, voice: { state: 'idle' } };
const prompt = extra => render(h(api.AgentPromptBar, { ...base, ...extra }));
const message = extra => render(h(api.AgentMessage, { speaker: 'agent', children: h('p', {}, '保留正文'), ...extra }));
const snapshots = JSON.parse(await readFile(new URL('./fixtures/p92/main-e56908d.json', import.meta.url), 'utf8'));
for (const [index, item] of snapshots.promptCases.entries()) test(`P92 default PromptBar SSR matches main bytes ${index}`, () => assert.equal(withoutPromptOpticalAlignment(prompt(item.props)), gunzipSync(Buffer.from(item.htmlGzipBase64, 'base64')).toString('utf8')));
for (const [index, item] of snapshots.messageCases.entries()) test(`P92 default Message SSR matches main bytes ${index}`, () => assert.equal(message(item.props), gunzipSync(Buffer.from(item.htmlGzipBase64, 'base64')).toString('utf8')));
test('P92 compact layout is opt-in, retains labels and reserves 44px primary hit area', () => {
  const html = prompt({ density: 'compact', showModelSelector: false, value: '' });
  for (const text of ['data-density="compact"', 'rows="1"', '[&amp;&gt;textarea]:min-h-13!', 'aria-label="材料与输入工具"', 'aria-label="主动作"', 'pointer-coarse:after:size-11', 'after:size-11', 'size-9 sm:size-9']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /选择模型|data-expanded/);
  assert.match(html, /<button(?=[^>]*aria-label="发送消息")(?=[^>]*disabled="")[^>]*>/);
});
test('P92 stop facts are independent of draft and send eligibility', () => {
  const stop = prompt({ primaryAction: 'stop', value: '', sendDisabledReason: '下一条草稿', stopLabel: '停止整理材料' });
  const button = stop.match(/<button[^>]*aria-label="停止整理材料"[^>]*>/)[0];
  assert.doesNotMatch(button, /disabled=""/);
  assert.match(stop, />停止整理材料<\/span>/);
  const stopping = prompt({ primaryAction: 'stopping' });
  assert.match(stopping, /<button(?=[^>]*aria-label="正在请求停止")(?=[^>]*disabled="")[^>]*>/);
  assert.match(stopping, /role="status"[^>]*>正在请求停止/);
  assert.doesNotMatch(stopping, /已停止/);
});
test('P92 status hint uses one visible main reason, text error semantics and details', () => {
  const html = prompt({ sendDisabledReason: '连接待核对', statusHint: { message: '较低优先提示', tone: 'error', details: '原请求记录', action: { label: '核对原请求', onClick() {} } } });
  assert.equal((html.match(/连接待核对/g) ?? []).length, 1);
  assert.doesNotMatch(html, /较低优先提示/);
  assert.match(html, /role="alert"[^>]*>错误：连接待核对/);
  assert.match(html, /<summary[^>]*>详情<\/summary>/);
  assert.match(html, /核对原请求/);
  assert.match(html, /aria-describedby="[^"]+-blocked"/);
});
test('P92 body role and action spacing opt in without empty action rows', () => {
  const html = message({ bodyRole: 'read-body', attachments: '附件', details: '来源' });
  assert.match(html, /\[&amp;&gt;p\]:text-read-body/);
  assert.match(html, /flex w-full flex-col gap-2/);
  assert.doesNotMatch(html, /data-message-actions|space-y-3|mt-3/);
  assert.doesNotMatch(message({ actions: [], moreActions: h(React.Fragment, {}, false), persistentActions: '' }), /data-message-actions/);
  const action = message({ actions: h('button', {}, '打开成果'), persistentActions: h('button', {}, '核对原请求') });
  assert.match(action, /data-message-actions="true" data-actions-visible="false" class="mt-1/);
  assert.ok(action.indexOf('核对原请求') < action.indexOf('agent-message-secondary-actions'));
});
test('P92 last, persistent and copy-result actions are visible and copy feedback is host-controlled', () => {
  for (const props of [{ isLast: true }, { actionsVisibility: 'always' }, { copyAction: { state: 'copied', onCopy() {} } }, { copyAction: { state: 'error', onCopy() {} } }]) assert.match(message({ actions: '动作', ...props }), /data-actions-visible="true"/);
  const html = message({ copyAction: { state: 'copied', onCopy() {} }, moreActions: h('span', {}, '查看详情') });
  assert.match(html, /aria-label="已复制"/);
  assert.match(html, /role="status"[^>]*>已复制/);
  assert.match(html, /aria-label="更多消息操作"/);
  assert.doesNotMatch(message({ copyAction: { onCopy() {} } }), /已复制/);
});
test('P92 hover/focus/coarse rules reserve space and do not hide persistent actions', async () => {
  const css = await readFile(new URL('../components/prism-next/agent-conversation.css', import.meta.url), 'utf8');
  const rules = css.slice(css.indexOf('/* P92'));
  assert.match(rules, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(rules, /container:hover/);
  assert.match(rules, /container:focus-within/);
  assert.match(rules, /@media \(pointer: coarse\)/);
  assert.doesNotMatch(rules, /display:\s*none|visibility:\s*hidden|height:\s*0/);
  assert.match(rules, /data-actions-visible="false"\]\s+\.agent-message-secondary-actions/);
});
