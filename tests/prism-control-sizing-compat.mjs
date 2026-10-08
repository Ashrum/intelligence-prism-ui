import assert from 'node:assert/strict';

// Only P31's authorized sizing tokens on controls and non-semantic text wrappers
// are normalized. Text, ARIA, IDs, state, DOM structure and other styles stay exact.
const sizeTokens = new Set([
  'min-h-11', 'min-h-12', 'min-w-11', 'h-11', 'sm:h-11', 'h-auto', 'sm:h-auto',
  'h-9', 'sm:h-8', 'h-8.5', 'sm:h-7.5', 'pointer-coarse:min-h-11', 'pointer-coarse:min-w-11',
  'whitespace-normal', 'whitespace-nowrap', 'max-w-full',
]);
export const normalizeControlSizing = html => html
  .replace(/<span class="truncate">([^<]*)<\/span>/g, '$1')
  .replace(/<(?:button|input|a|label)\b[^>]*>/g, tag => tag.replace(/class="([^"]*)"/g, (_, value) =>
    `class="${value.split(' ').filter(token => !sizeTokens.has(token)).sort().join(' ')}"`));
export const assertControlSizingOnly = (actual, expected, message) => assert.equal(normalizeControlSizing(actual), normalizeControlSizing(expected), message);

