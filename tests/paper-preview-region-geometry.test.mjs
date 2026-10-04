import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/paper-preview-region-geometry-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({ entryPoints: [root + 'components/prism-next/paper-preview-region-geometry.ts'], bundle: true, platform: 'node', format: 'esm', write: false })).outputFiles[0].text);
const api = await import(file);
await rm(file);

const rotations = [0, 90, 180, 270];
const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
function close(actual, expected, message = '') {
  assert.equal(actual.length, expected.length, message);
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < 1e-10, `${message} [${index}]: ${value} != ${expected[index]}`));
}
function pointArray(point) { return [point.x, point.y]; }
function screenPoint({ x, y }, rotation) {
  if (rotation === 90) return { x: 1 - y, y: x };
  if (rotation === 180) return { x: 1 - x, y: 1 - y };
  if (rotation === 270) return { x: y, y: 1 - x };
  return { x, y };
}
function bounded(rect, min = .02) {
  assert.ok(rect.every(Number.isFinite));
  assert.ok(rect[0] >= -1e-12 && rect[1] >= -1e-12);
  assert.ok(rect[2] >= min - 1e-12 && rect[3] >= min - 1e-12);
  assert.ok(rect[0] + rect[2] <= 1 + 1e-12 && rect[1] + rect[3] <= 1 + 1e-12);
}

test('pointer conversion covers 5/50/100/300 percent zoom, outer scale, offsets and four rotations', () => {
  const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: .2, y: .7 }, { x: -.3, y: 1.4 }];
  for (const rotation of rotations) for (const zoom of [5, 50, 100, 300]) for (const outerScale of [.65, 1, 1.4]) {
    const swapped = rotation === 90 || rotation === 270;
    const bounds = { left: -37, top: 153, width: (swapped ? 1200 : 800) * zoom / 100 * outerScale, height: (swapped ? 800 : 1200) * zoom / 100 * outerScale };
    for (const source of points) {
      const screen = screenPoint(source, rotation);
      const client = { x: bounds.left + screen.x * bounds.width, y: bounds.top + screen.y * bounds.height };
      close(pointArray(api.paperRegionPoint(client, bounds, rotation)), pointArray(source), `${rotation}/${zoom}/${outerScale}`);
    }
  }
});

test('pointer conversion rejects nonfinite or zero-size geometry instead of emitting invalid coordinates', () => {
  const bounds = { left: 10, top: 20, width: 800, height: 1200 };
  for (const value of [NaN, Infinity, -Infinity]) {
    for (const key of ['left', 'top', 'width', 'height']) assert.equal(api.paperRegionPoint({ x: 100, y: 200 }, { ...bounds, [key]: value }, 0), null);
    for (const key of ['x', 'y']) assert.equal(api.paperRegionPoint({ x: 100, y: 200, [key]: value }, bounds, 0), null);
  }
  for (const value of [0, -1]) for (const key of ['width', 'height']) assert.equal(api.paperRegionPoint({ x: 100, y: 200 }, { ...bounds, [key]: value }, 0), null);
  assert.equal(api.paperRegionPoint({ x: Number.MAX_VALUE, y: 0 }, { left: -Number.MAX_VALUE, top: 0, width: 1, height: 1 }, 0), null);
});

test('rotation projections enclose the same four source corners', () => {
  const rect = [.1, .2, .35, .5];
  const sourceCorners = [{ x: .1, y: .2 }, { x: .45, y: .2 }, { x: .1, y: .7 }, { x: .45, y: .7 }];
  for (const rotation of rotations) {
    const corners = sourceCorners.map(point => screenPoint(point, rotation));
    const xs = corners.map(point => point.x), ys = corners.map(point => point.y);
    close(api.paperRegionViewRect(rect, rotation), [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]);
  }
  close(rect, [.1, .2, .35, .5]);
});

test('region creation supports every drag direction and clamps both endpoints at the page boundary', () => {
  for (const [start, end] of [
    [{ x: .2, y: .3 }, { x: .8, y: .9 }], [{ x: .8, y: .9 }, { x: .2, y: .3 }],
    [{ x: .8, y: .3 }, { x: .2, y: .9 }], [{ x: .2, y: .9 }, { x: .8, y: .3 }],
  ]) close(api.createPaperRegion(start, end), [.2, .3, .6, .6]);
  close(api.createPaperRegion({ x: -.5, y: -.1 }, { x: 2, y: 1.1 }), [0, 0, 1, 1]);
  close(api.createPaperRegion({ x: 1, y: 1 }, { x: 1, y: 1 }), [.98, .98, .02, .02]);
  close(api.createPaperRegion({ x: 0, y: 0 }, { x: .001, y: .002 }, .1), [0, 0, .1, .1]);
});

test('region clamp constrains sizes and origin and recovers invalid external values', () => {
  close(api.clampPaperRegion([-.5, .95, 3, -.1]), [0, .95, 1, .02]);
  close(api.clampPaperRegion([NaN, Infinity, NaN, -Infinity]), [0, 0, .02, .02]);
  close(api.clampPaperRegion([.5, .8, .2, .2], 2), [0, 0, 1, 1]);
  for (const min of [0, -1, NaN, Infinity]) close(api.clampPaperRegion([0, 0, 0, 0], min), [0, 0, .02, .02]);
  close(api.clampPaperRegion([.99, .99, .001, .001], .05), [.95, .95, .05, .05]);
});

test('moving preserves dimensions and clamps the whole region without changing the input', () => {
  const rect = [.2, .3, .4, .5];
  close(api.movePaperRegion(rect, { x: .1, y: -.1 }), [.3, .2, .4, .5]);
  close(api.movePaperRegion(rect, { x: 20, y: -20 }), [.6, 0, .4, .5]);
  close(api.movePaperRegion(rect, { x: NaN, y: Infinity }), rect);
  close(rect, [.2, .3, .4, .5]);
});

test('all eight resize handles preserve the opposite edges and untouched axes', () => {
  const rect = [.2, .3, .4, .5], delta = { x: .1, y: -.1 };
  for (const handle of handles) {
    const result = api.resizePaperRegion(rect, handle, delta);
    const left = handle.includes('w') ? .3 : .2;
    const top = handle.includes('n') ? .2 : .3;
    const right = handle.includes('e') ? .7 : .6;
    const bottom = handle.includes('s') ? .7 : .8;
    close(result, [left, top, right - left, bottom - top], handle);
  }
  close(rect, [.2, .3, .4, .5]);
});

test('every resize handle clamps to boundaries and minimum dimensions without flipping', () => {
  const rect = [.2, .3, .4, .5];
  for (const handle of handles) for (const x of [-10, 0, 10]) for (const y of [-10, 0, 10]) {
    const result = api.resizePaperRegion(rect, handle, { x, y }, .08);
    bounded(result, .08);
    if (!handle.includes('w')) close([result[0]], [rect[0]], handle);
    if (!handle.includes('e')) close([result[0] + result[2]], [rect[0] + rect[2]], handle);
    if (!handle.includes('n')) close([result[1]], [rect[1]], handle);
    if (!handle.includes('s')) close([result[1] + result[3]], [rect[1] + rect[3]], handle);
  }
  close(api.resizePaperRegion(rect, 'nw', { x: NaN, y: Infinity }), rect);
});

test('keyboard arrows move along visual axes in all rotations with the documented page-relative step', () => {
  const rect = [.2, .3, .3, .4];
  const expected = { ArrowLeft: [-.005, 0], ArrowRight: [.005, 0], ArrowUp: [0, -.005], ArrowDown: [0, .005] };
  for (const rotation of rotations) for (const [key, delta] of Object.entries(expected)) {
    const before = api.paperRegionViewRect(rect, rotation);
    const after = api.paperRegionViewRect(api.keyboardPaperRegion(rect, key, false, rotation), rotation);
    close(after, [before[0] + delta[0], before[1] + delta[1], before[2], before[3]], `${rotation}/${key}`);
  }
  assert.equal(api.keyboardPaperRegion(rect, 'Escape', false, 0), null);
  assert.equal(api.keyboardPaperRegion(rect, 'Enter', true, 90), null);
});

test('Shift arrows resize visual right/bottom edges while keeping visual left/top fixed in all rotations', () => {
  const rect = [.2, .3, .3, .4];
  const expected = { ArrowLeft: [-.005, 0], ArrowRight: [.005, 0], ArrowUp: [0, -.005], ArrowDown: [0, .005] };
  for (const rotation of rotations) for (const [key, delta] of Object.entries(expected)) {
    const before = api.paperRegionViewRect(rect, rotation);
    const after = api.paperRegionViewRect(api.keyboardPaperRegion(rect, key, true, rotation), rotation);
    close(after, [before[0], before[1], before[2] + delta[0], before[3] + delta[1]], `${rotation}/${key}`);
  }
});

test('keyboard respects boundaries/minimums, optional step, and invalid step fallback', () => {
  for (const rotation of rotations) for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) for (const shift of [false, true]) {
    bounded(api.keyboardPaperRegion([0, 0, 1, 1], key, shift, rotation));
    bounded(api.keyboardPaperRegion([.5, .5, .02, .02], key, shift, rotation));
  }
  close(api.keyboardPaperRegion([.2, .3, .3, .4], 'ArrowRight', false, 0, .02, .1), [.3, .3, .3, .4]);
  for (const step of [NaN, Infinity, 0, -1]) close(api.keyboardPaperRegion([.2, .3, .3, .4], 'ArrowRight', false, 0, .02, step), [.205, .3, .3, .4]);
});

test('document percentage conversions preserve values with no hidden clipping or mutation', () => {
  const documentRect = [8, 42, 84, 24];
  close(api.documentRectToPaperRegion(documentRect), [.08, .42, .84, .24]);
  close(api.paperRegionToDocumentRect(api.documentRectToPaperRegion(documentRect)), documentRect);
  close(api.documentRectToPaperRegion([-10, 120, 200, 0]), [-.1, 1.2, 2, 0]);
  close(api.paperRegionToDocumentRect([-.1, 1.2, 2, 0]), [-10, 120, 200, 0]);
  close(documentRect, [8, 42, 84, 24]);
});
