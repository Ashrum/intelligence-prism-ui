import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaHarness } from './helpers/media-harness.mjs';
const all = Object.fromEntries(['play', 'subtitle', 'mark', 'clip', 'export'].map(key => [key, { supported: true }]));
const marks = [0, 1, 2, 3].map(n => ({ id: `opaque-${n}`, time: n * 10, label: `章节${n}`, kind: 'chapter' }));
const subtitles = [0, 1, 2].map(n => ({ id: `opaque-sub-${n}`, start: n * 10, end: n * 10 + 8, text: `字幕${n}` }));
const video = { title: '教学视频', description: '教学说明', duration: 40, versionLabel: '视频 v1', source: { label: '模拟来源', openable: true }, availability: { state: 'available' } };
const base = { videoId: 'opaque-video', version: 'opaque-version', video, marks, subtitles, capabilities: all, onIntent() {} };
const context = { videoId: base.videoId, version: base.version };
const { exports: api, reset, capture, click, input, html, h, render } = await mediaHarness('agent-video-timeline', 'AgentVideoTimeline', base);
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];

test('video SSR inline/workspace and compact preserve summary and metadata; subtitles in workspace', () => {
  for (const mode of modes) {
    const out = html(mode);
    for (const text of ['4 个标记', '3 条字幕', '视频 v1', '模拟来源', '视频不可播放', '未提供播放地址']) assert.ok(out.includes(text), text);
    assert.doesNotMatch(out, /opaque-|宿主|回调|意图|<video/);
    assert.equal(out.includes('字幕2'), mode.view === 'workspace'); assert.equal(out.includes('章节3'), mode.view === 'workspace');
    assert.match(out, new RegExp(`data-density="${mode.density ?? 'default'}"`));
    assert.equal(out.split('不代表已保存').length - 1, 1);
  }
});
test('native video controls need source, capability and availability; optional poster is accessible', () => {
  const playable = { ...video, src: 'data:video/mp4;base64,AAAA', poster: { src: 'data:image/svg+xml,<svg/>', alt: '课堂封面示意' } };
  for (const mode of modes) assert.match(html({ ...mode, video: playable }), /<video[^>]*controls=""[^>]*playsInline=""[^>]*preload="none"/);
  assert.match(html({ video: playable }), /alt="课堂封面示意"/);
  assert.doesNotMatch(html({ video: { ...playable, availability: { state: 'unavailable', reason: '原视频不可用。' } } }), /<video|<img/);
  assert.doesNotMatch(html({ video: playable, capabilities: { ...all, play: { supported: false, reason: '不支持格式。' } } }), /<video/);
});
test('mark and subtitle seek buttons carry correct reference and preserve native keyboard activation', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  const buttons = capture(extra).nodes.filter(node => 'data-media-seek' in node.props);
  buttons[1].props.onClick(); buttons[5].props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'seek', markId: marks[1].id, seconds: 10 }, { ...context, type: 'seek', subtitleId: subtitles[1].id, seconds: 10 }]);
  assert.ok(buttons.every(node => node.props.type === 'button' && !node.props.onKeyDown));
  let focused = -1; const targets = buttons.map((_, index) => ({ focus() { focused = index; } }));
  api.mediaListKeys({ key: 'ArrowDown', nativeEvent: {}, currentTarget: { querySelectorAll: () => targets }, target: targets[0], preventDefault() {} }); assert.equal(focused, 1);
});
test('mark create/update is a numeric draft until confirmation and delete is request-only', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '新增标记'); input(extra, '-time', '15.5'); input(extra, '-label', '  检查条件  '); click(extra, '章节'); assert.equal(calls.length, 0);
  click(extra, '确认请求');
  assert.deepEqual(calls[0], { ...context, type: 'mark-create', time: 15.5, label: '  检查条件  ', kind: 'chapter' });
  click(extra, '编辑标记'); input(extra, '-label', '更正'); click(extra, '确认请求');
  assert.deepEqual(calls[1], { ...context, type: 'mark-update', markId: marks[0].id, time: 0, label: '更正', kind: 'chapter' });
  click(extra, '删除标记'); assert.deepEqual(calls[2], { ...context, type: 'mark-delete', markId: marks[0].id }); assert.equal(marks.length, 4); assert.match(capture(extra).html, /章节0/);
});
test('mark and clip reject invalid times, blank labels and ranges; valid clip emits seconds/context', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '新增标记'); input(extra, '-time', 'NaN'); input(extra, '-label', '名称'); click(extra, '确认请求');
  input(extra, '-time', '41'); click(extra, '确认请求'); assert.equal(calls.length, 0); click(extra, '放弃草稿');
  click(extra, '选择视频片段'); input(extra, '-start', '-1'); input(extra, '-end', '5'); click(extra, '确认请求'); assert.equal(calls.length, 0);
  input(extra, '-start', '2'); input(extra, '-end', '5.25'); click(extra, '确认请求'); assert.deepEqual(calls, [{ ...context, type: 'clip-request', start: 2, end: 5.25 }]);
});
test('draft blocks navigation/other operations, survives view change and rejects changed baseline', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value), onBack() { calls.push('back'); } };
  click(extra, '新增标记'); input(extra, '-label', '我的草稿'); input(extra, '-time', '12');
  assert.match(capture({ ...extra, view: 'inline' }).html, /我的草稿/);
  for (const label of ['请求字幕', '请求导出', '查看来源', '删除标记']) assert.equal(click(extra, label).props.disabled, true);
  click(extra, '返回原位置'); assert.deepEqual(calls, []);
  for (const change of [{ version: 'next' }, { marks: [] }, { videoId: 'other' }, { readOnlyReason: '' }, { capabilities: { ...all, mark: { supported: false, reason: '仅阅读。' } } }]) {
    assert.equal(click({ ...extra, ...change }, '确认请求').props.disabled, true); assert.match(capture({ ...extra, ...change }).html, /草稿保留但不可提交/);
    if (change.videoId || 'readOnlyReason' in change) assert.doesNotMatch(capture({ ...extra, ...change }).html, /我的草稿/);
  }
  click(extra, '放弃草稿'); click(extra, '返回原位置'); assert.deepEqual(calls, ['back']);
});
test('unsupported capabilities merge reasons once; no disabled edit form repeated for marks', () => {
  const capabilities = { ...all, ...Object.fromEntries(['subtitle', 'mark', 'clip', 'export'].map(key => [key, { supported: false, reason: '此材料仅供阅读。' }])) };
  for (const mode of modes) {
    const out = html({ ...mode, capabilities }); assert.equal(out.split('此材料仅供阅读。').length - 1, 1); assert.doesNotMatch(out, />编辑标记<|>删除标记<|>新增标记<|>选择视频片段<|>请求字幕<|>请求导出<|<input/);
  }
});
test('invalid identities/duplicate marks/subtitle bounds/readonly/missing receiver block changes', () => {
  for (const extra of [{ videoId: '' }, { version: '' }, { marks: [marks[0], marks[0]] }, { marks: [{ ...marks[0], time: Infinity }] }, { subtitles: [{ ...subtitles[0], end: 41 }] }, { onIntent: undefined }, { readOnlyReason: '' }]) assert.doesNotMatch(html({ ...extra, view: 'workspace' }), />编辑标记<|>新增标记<|>删除标记<|>选择视频片段</);
});
test('subtitle/export/source/expand/back retain version; source viewing is not citation', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value), onExpand: (_, value) => calls.push(value), onBack: value => calls.push(value) };
  for (const label of ['请求字幕', '请求导出', '查看来源']) click(extra, label);
  click({ ...extra, view: 'inline' }, '打开视频与时间轴'); click(extra, '返回原位置');
  assert.deepEqual(calls, [...['request-subtitle', 'request-export', 'open-source'].map(type => ({ ...context, type })), context, context]);
  assert.doesNotMatch(capture(extra).html, />已保存<|>已引用<|>已导出</);
});
test('video fixture has four chapters and three subtitles; clipping explanation once and no remote media', () => {
  assert.equal(api.videoTimelineExample.length, 4); assert.ok(api.videoTimelineExample.every(mark => mark.kind === 'chapter')); assert.equal(api.videoSubtitleExample.length, 3);
  const out = render(h(api.AgentVideoTimelineDemo)); assert.match(out, /id="video-timeline"/); assert.equal(out.split('尚未接入视频剪辑服务。').length - 1, 1); assert.doesNotMatch(out, /<video|src="https?:|宿主|回调|意图/);
});

test('identical limitations including playback have one explanation; list remains keyboard reachable', () => {
  const capabilities = Object.fromEntries(Object.keys(all).map(key => [key, { supported: false, reason: '共同限制。' }]));
  const out = html({ capabilities, view: 'workspace' });
  assert.equal(out.split('共同限制。').length - 1, 1);
  assert.match(out, /<li tabindex="0"/);
});


test('blocked back focuses this instance discard; discard restores back without navigating', () => {
  reset(); const calls = [], extra = { onBack: value => calls.push(value) };
  click(extra, '新增标记');
  let focused = '';
  const panel = { querySelector(selector) { return { focus() { focused = selector; } }; } };
  const event = { currentTarget: { closest(selector) { assert.equal(selector, '[data-agent-media]'); return panel; } } };
  let state = capture(extra);
  const back = state.nodes.find(node => 'data-media-back' in node.props);
  assert.equal(back.props.disabled, undefined);
  back.props.onClick(event);
  assert.equal(focused, '[data-media-discard]'); assert.deepEqual(calls, []);
  state.nodes.find(node => 'data-media-discard' in node.props).props.onClick(event);
  assert.equal(focused, '[data-media-back]'); assert.deepEqual(calls, []);
  state = capture(extra); assert.ok(!state.nodes.some(node => 'data-media-discard' in node.props));
  state.nodes.find(node => 'data-media-back' in node.props).props.onClick(event);
  assert.deepEqual(calls, [context]);
});

test('one host playback reason replaces missing src, availability reason takes precedence', () => {
  for (const mode of modes) {
    for (const availability of [{ state: 'unavailable', reason: '原文件暂不可用。' }, { state: 'unknown', reason: '正在核对文件。' }]) {
      const out = html({ ...mode, video: { ...video, availability }, capabilities: { ...all, play: { supported: false, reason: '当前格式不支持。' } } });
      assert.equal(out.split(availability.reason).length - 1, 1);
      assert.doesNotMatch(out, /未提供播放地址|当前格式不支持|<video/);
    }
    const out = html({ ...mode, capabilities: { ...all, play: { supported: false, reason: '文件不可播放。' } } });
    assert.equal(out.split('文件不可播放。').length - 1, 1); assert.doesNotMatch(out, /未提供播放地址/);
    assert.match(html(mode), /未提供播放地址/);
  }
});

test('marks sort before inline slicing, stable ties retain source order and original intent ids', () => {
  const rows = Object.freeze([marks[3], marks[1], { ...marks[2], time: 10 }, marks[0]].map(row => Object.freeze(row)));
  for (const mode of modes) {
    const out = html({ ...mode, marks: rows });
    const labels = [...out.matchAll(/ · 章节 · (章节\d)/g)].map(match => match[1]);
    assert.deepEqual(labels, mode.view === 'workspace' ? ['章节0', '章节1', '章节2', '章节3'] : ['章节0', '章节1', '章节2']);
  }
  reset(); const calls = [], extra = { marks: rows, onIntent: value => calls.push(value) };
  const state = capture(extra);
  state.nodes.filter(node => 'data-media-seek' in node.props)[2].props.onClick();
  click(extra, '编辑标记'); input(extra, '-label', '更正零秒'); click(extra, '确认请求'); click(extra, '删除标记');
  assert.deepEqual(calls, [{ ...context, type: 'seek', markId: marks[2].id, seconds: 10 }, { ...context, type: 'mark-update', markId: marks[0].id, time: 0, label: '更正零秒', kind: 'chapter' }, { ...context, type: 'mark-delete', markId: marks[0].id }]);
  assert.deepEqual(rows.map(row => row.id), [marks[3].id, marks[1].id, marks[2].id, marks[0].id]);
});
