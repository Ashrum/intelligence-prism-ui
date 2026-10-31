import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** Historical core-only snapshots keep their original render topology and React IDs.
 * P125 separately renders all 23 real routes with the complete five-theme matrix,
 * compares every retained core subtree and checks the two appended equivalents.
 * This projection changes only the explicit preview list, never component source,
 * HTML, IDs, props, visual declarations or the pinned snapshot hashes.
 */
export const corePreviewCompatibility = { name: 'p125-original-core-preview-matrix', setup(build) {
  build.onLoad({ filter: /lib\/prism-next\/preview-themes\.ts$/ }, ({ path }) => {
    const source = readFileSync(path, 'utf8');
    const full = 'componentPreviewThemes = ["light", "paper", "dark", "blueprint", "blueprint-night"] as const';
    assert.ok(source.includes(full), 'P125 five-theme contract must be reviewed before changing core projection');
    return { contents: source.replace(full, 'componentPreviewThemes = ["light", "paper", "dark"] as const'), loader: 'ts' };
  });
} };
