import { withoutPromptOpticalAlignment } from './helpers/p110-spacing.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'prism-disabled-announce-'));
await symlink(join(root, 'node_modules'), join(temp, 'node_modules'));
const result = await build({ stdin: { contents: "export { AgentPromptBar } from './components/prism-next/agent-prompt-bar';", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(join(temp, 'bundle.mjs'), result.outputFiles[0].text);
const { AgentPromptBar } = await import(pathToFileURL(join(temp, 'bundle.mjs')));
const base = { value: '保留草稿 f(x) = x²', onValueChange() {}, onIntent() {}, sources: [], commands: [], models: [], dictation: { state: 'idle' }, voice: { state: 'idle' } };
const reason = '暂时无法连接服务，草稿仍可编辑；连接恢复后可提交。';
const markup = props => render(React.createElement(AgentPromptBar, { ...base, ...props }));
const button = html => html.match(/<button\b[^>]*aria-label="发送消息"[^>]*>/)[0];
const paragraph = html => html.match(/<p\b[^>]*id="[^"]+-blocked"[^>]*>[^<]*<\/p>/)?.[0];
for (const variant of ['Rounded', 'Pill']) {
  for (const announce of [undefined, true, false]) {
    test(`${variant}: announcement=${announce}, visible reason and button description`, () => {
      const html = markup({ variant, sendDisabledReason: reason, ...(announce === undefined ? {} : { announceDisabledReason: announce }) });
      const p = paragraph(html);
      assert.ok(p.includes(reason));
      assert.equal(p.includes('role="status"'), announce !== false);
      assert.doesNotMatch(p, /aria-live|aria-hidden|hidden=/);
      const id = p.match(/id="([^"]+)"/)[1];
      assert.ok(button(html).includes(`aria-describedby="${id}"`));
      assert.match(button(html), /disabled=""/);
      assert.match(html, /保留草稿 f\(x\) = x²<\/textarea>/);
    });
  }
  for (const sendDisabledReason of [undefined, '']) {
    test(`${variant}: absent/empty reason ${JSON.stringify(sendDisabledReason)} has no association`, () => {
      for (const announceDisabledReason of [true, false]) {
        const html = markup({ variant, sendDisabledReason, announceDisabledReason });
        assert.equal(paragraph(html), undefined);
        assert.doesNotMatch(button(html), /aria-describedby|disabled=""/);
      }
    });
  }
}

// Captured from main 88173e0, not regenerated from the candidate. Preserve React IDs.
const snapshots = JSON.parse(await readFile(new URL('./fixtures/prompt-bar-disabled-announce/main-88173e0.json', import.meta.url), 'utf8'));
test('default API: exact main SSR snapshots except the approved send-button description', () => {
  for (const snapshot of snapshots.cases) {
    const html = markup(snapshot.props);
    const send = button(html);
    const description = send.match(/ aria-describedby="([^"]+)"/);
    if (snapshot.props.sendDisabledReason) assert.ok(description);
    else assert.equal(description, null);
    const comparable = withoutPromptOpticalAlignment(description ? html.replace(send, send.replace(description[0], '')) : html);
    assert.equal(Buffer.byteLength(comparable), snapshot.bytes, snapshot.name);
    assert.equal(createHash('sha256').update(comparable).digest('hex'), snapshot.sha256, snapshot.name);
    assert.equal(markup({ ...snapshot.props, announceDisabledReason: true }), html);
  }
});
test.after(() => rm(temp, { recursive: true, force: true }));
