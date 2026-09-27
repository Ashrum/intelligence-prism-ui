import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaHarness } from './helpers/media-harness.mjs';
const all = Object.fromEntries(['play', 'transcribe', 'edit-transcript', 'clip', 'export'].map(key => [key, { supported: true }]));
const segments = [0, 1, 2, 3, 4, 5].map((n) => ({ id: `opaque-${n}`, start: n * 10, end: n * 10 + 10, text: n === 0 ? '公式 a² + b² = c²' : `课堂转写第${n}段`, ...(n === 2 ? {} : { speaker: '教师', confidence: { label: '待核对', source: '固定示例' } }) }));
const audio = { title: '课堂讲解', description: '课堂讲解说明', versionLabel: '录音 v1', duration: 60, availability: { state: 'available' }, source: { label: '模拟来源', openable: true } };
const base = { audioId: 'opaque-audio', version: 'opaque-version', audio, segments, capabilities: all, onIntent() {} };
const context = { audioId: base.audioId, version: base.version };
const { exports: api, reset, capture, click, input, html, h, render } = await mediaHarness('agent-audio-transcript', 'AgentAudioTranscript', base);
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];

test('audio SSR both views and compact: metadata, transcript summary, missing src and honest unknowns', () => {
  for (const mode of modes) {
    const out = html(mode);
    for (const value of ['课堂讲解', '6 段转写', '1:00', '录音 v1', '模拟来源', '音频不可播放', '未提供播放地址', '说话人未知', '置信度：未知']) assert.ok(out.includes(value), value);
    assert.doesNotMatch(out, /<audio|opaque-|宿主|回调|意图|<textarea/);
    assert.equal(out.includes('课堂转写第5段'), mode.view === 'workspace');
    assert.equal(out.split('不代表已保存').length - 1, 1);
    assert.match(out, new RegExp(`data-density="${mode.density ?? 'default'}"`));
  }
  assert.match(html({ audio: { ...audio, duration: undefined, versionLabel: undefined, source: undefined } }), /时长未知/);
});
test('audio native controls require src, play capability and known availability; description is associated', () => {
  const playable = { ...audio, src: 'data:audio/wav;base64,AAAA' };
  for (const mode of modes) assert.match(html({ ...mode, audio: playable }), /<audio[^>]*controls=""[^>]*preload="none"/);
  assert.doesNotMatch(html({ audio: { ...playable, availability: { state: 'unknown' } } }), /<audio/);
  assert.doesNotMatch(html({ audio: playable, capabilities: { ...all, play: { supported: false, reason: '不能播放此格式。' } } }), /<audio/);
  assert.match(html({ audio: playable }), /aria-describedby=/);
  reset(); const receiver = { current: null }; assert.equal(capture({ audio: playable, mediaRef: receiver }).nodes.find(node => node.type === 'audio').props.ref, receiver);
});
test('seek buttons emit exact segment/time/context; arrows only move focus and native Enter/Space remain available', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  const node = capture(extra).nodes.find(node => 'data-media-seek' in node.props); node.props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'seek', segmentId: segments[0].id, seconds: 0 }]);
  assert.equal(node.props.type, 'button'); assert.equal(node.props.onKeyDown, undefined);
  let focused = -1, prevented = false;
  const buttons = [0,1,2].map(index => ({ focus() { focused = index; } }));
  const event = { key: 'End', nativeEvent: {}, currentTarget: { querySelectorAll: () => buttons }, target: buttons[0], preventDefault() { prevented = true; } };
  api.mediaListKeys(event); assert.equal(focused, 2); assert.equal(prevented, true); assert.equal(calls.length, 1);
});
test('transcript search is case-insensitive local filtering and emits no request', () => {
  reset(); const extra = { onIntent() { assert.fail(); } };
  input(extra, '-search', '  A²  ');
  assert.match(capture(extra).html, /公式 a²/); assert.doesNotMatch(capture(extra).html, /课堂转写第1段/);
  input(extra, '-search', '不存在'); assert.match(capture(extra).html, /没有匹配/);
  input(extra, '-search', ''); assert.match(capture(extra).html, /课堂转写第5段/);
});
test('editing requires explicit confirmation, preserves raw text and does not change transcript/save facts', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '编辑第 1 段'); input(extra, '-text', '  更正文字\n第二行  '); assert.equal(calls.length, 0);
  assert.match(capture({ ...extra, view: 'inline' }).html, /更正文字/);
  assert.equal(click({ ...extra, onBack() { assert.fail(); } }, '返回原位置').props.disabled, true);
  click(extra, '确认请求'); assert.deepEqual(calls, [{ ...context, type: 'edit-segment', segmentId: segments[0].id, text: '  更正文字\n第二行  ' }]);
  assert.match(capture(extra).html, /结果待确认/); assert.match(capture(extra).html, /公式 a²/); assert.doesNotMatch(capture(extra).html, /<textarea/);
});
test('clip numeric range rejects blank/inverted/over-duration and emits versioned seconds only', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '选择音频片段'); assert.equal(click(extra, '确认请求').props.disabled, true);
  input(extra, '-start', '10'); input(extra, '-end', '9'); click(extra, '确认请求');
  input(extra, '-end', '61'); click(extra, '确认请求'); assert.equal(calls.length, 0);
  input(extra, '-end', '12.5'); click(extra, '确认请求'); assert.deepEqual(calls, [{ ...context, type: 'clip-request', start: 10, end: 12.5 }]);
});
test('version/content/capability changes block stale drafts; identity/readonly changes hide old input', () => {
  for (const change of [{ version: 'next' }, { segments: [] }, { audioId: 'other' }, { readOnlyReason: '' }, { capabilities: { ...all, 'edit-transcript': { supported: false, reason: '编辑已关闭。' } } }]) {
    reset(); const extra = { onIntent() { assert.fail(); } }; click(extra, '编辑第 1 段'); input(extra, '-text', '保留草稿');
    assert.equal(click({ ...extra, ...change }, '确认请求').props.disabled, true);
    assert.match(capture({ ...extra, ...change }).html, /草稿保留但不可提交/);
    if (change.audioId || 'readOnlyReason' in change) assert.doesNotMatch(capture({ ...extra, ...change }).html, /保留草稿/);
  }
});
test('unsupported reasons appear once without per-row disabled editing controls; unknown references block intents', () => {
  const capabilities = { ...all, ...Object.fromEntries(['transcribe', 'edit-transcript', 'clip', 'export'].map(key => [key, { supported: false, reason: '仅供核对。' }])) };
  for (const mode of modes) {
    const out = html({ ...mode, capabilities }); assert.equal(out.split('仅供核对。').length - 1, 1); assert.doesNotMatch(out, /编辑第|请求转写|请求导出|选择音频片段|<textarea/);
  }
  for (const extra of [{ audioId: '' }, { version: '' }, { segments: [segments[0], segments[0]] }, { segments: [{ ...segments[0], start: NaN }] }, { onIntent: undefined }, { readOnlyReason: '' }]) assert.doesNotMatch(html({ ...extra, view: 'workspace' }), /编辑第|选择音频片段|<textarea/);
});
test('source/transcribe/export and expand/back preserve original identity with no fake completion', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value), onExpand: (_, context) => calls.push(context), onBack: context => calls.push(context) };
  for (const label of ['请求转写', '请求导出', '查看来源']) click(extra, label);
  click({ ...extra, view: 'inline' }, '打开音频与转写'); click(extra, '返回原位置');
  assert.deepEqual(calls, [...['request-transcribe', 'request-export', 'open-source'].map(type => ({ ...context, type })), context, context]);
});
test('audio simulated fixture contains six segments and one unknown speaker/confidence; no remote media', () => {
  assert.equal(api.audioTranscriptExample.length, 6); assert.equal(api.audioTranscriptExample.filter(segment => !segment.speaker && !segment.confidence).length, 1);
  const out = render(h(api.AgentAudioTranscriptDemo)); assert.match(out, /id="audio-transcript"/); assert.match(out, /不可播放录音（模拟）/); assert.doesNotMatch(out, /<audio|src="https?:|宿主|回调|意图/);
});

test('identical limitations including playback have one explanation; list remains keyboard reachable', () => {
  const capabilities = Object.fromEntries(Object.keys(all).map(key => [key, { supported: false, reason: '共同限制。' }]));
  const out = html({ capabilities, view: 'workspace' });
  assert.equal(out.split('共同限制。').length - 1, 1);
  assert.match(out, /<li tabindex="0"/);
});
