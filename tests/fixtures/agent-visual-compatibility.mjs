import assert from 'node:assert/strict';

// Frozen baseline HTML stays untouched. Compare its facts and capabilities independently
// of the v2 frame, icon paths, text wrappers, classes and additional honest markers.
const withoutGlyphs = html => html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, '');
const leaves = html => withoutGlyphs(html).split(/<[^>]*>/).map(value => value.trim()).filter(Boolean);
const occurrences = (text, value) => text.split(value).length - 1;
const buttons = html => [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([, attrs, body]) => ({
  label: attrs.match(/aria-label="([^"]*)"/)?.[1] ?? leaves(body).join(''),
  disabled: /\bdisabled(?:=|\s|$)/.test(attrs),
  type: attrs.match(/type="([^"]*)"/)?.[1],
}));

export function assertLegacyVisualFacts(actual, expected, name) {
  const actualText = leaves(actual).join(' '), expectedText = leaves(expected).join(' ');
  for (const fact of new Set(leaves(expected))) assert.ok(occurrences(actualText, fact) >= occurrences(expectedText, fact), `${name}: preserved visible fact ${fact}`);
  assert.deepEqual(buttons(actual), buttons(expected), `${name}: same capabilities, labels and disabled states`);
  assert.equal((actual.match(/aria-current="step"/g) ?? []).length, (expected.match(/aria-current="step"/g) ?? []).length, `${name}: same current steps`);
  assert.equal(/animate-spin/.test(actual), /animate-spin/.test(expected), `${name}: same live versus static activity`);
}
