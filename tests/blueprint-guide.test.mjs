import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { assetPrefix, compileGuide, createLinkResolver, generatedPath, parseInline, parseMarkdown, repositoryRoot, sourcePath, syncGuide, tableCells } from '../scripts/sync-blueprint-guide.mjs';

const read = relative => readFileSync(path.join(repositoryRoot, relative));
const text = nodes => nodes.map(node => node.children ? text(node.children) : node.value ?? node.alt ?? '').join('');

test('published guide is generated from the complete current Markdown and current evidence bytes', () => {
  assert.doesNotThrow(() => syncGuide({ check: true }));
  const actual = JSON.parse(read(generatedPath));
  assert.equal(actual.sourceSha256, createHash('sha256').update(read(sourcePath)).digest('hex'));
  const source = read(sourcePath).toString('utf8');
  const headingText = [...source.matchAll(/^## (.+)$/gm)].map(match => match[1].trim());
  assert.deepEqual(actual.headings.filter(heading => heading.level === 2).map(heading => heading.text), headingText);
  assert.ok(actual.headings.some(heading => heading.text.includes('首次本地验证')));
  assert.ok(actual.headings.some(heading => heading.text.includes('v4 图表配色')));
  assert.deepEqual(read(`public${actual.sourceDownload}`), read(sourcePath));
});

test('every directly referenced local evidence asset has a working public URL and matching hash', () => {
  const { data, assets } = compileGuide();
  assert.ok(data.assets.some(asset => asset.source.endsWith('light-1280.png')));
  assert.ok(data.assets.some(asset => asset.source.endsWith('states.js')));
  assert.ok(data.assets.some(asset => asset.source.endsWith('STATUS.md')));
  for (const [published, asset] of assets) {
    assert.ok(asset.href.startsWith(assetPrefix));
    assert.deepEqual(read(`public${assetPrefix}${published}`), asset.bytes);
    assert.equal(asset.sha256, createHash('sha256').update(read(asset.source)).digest('hex'));
    if (/\.(js|json|log)$/.test(asset.source)) assert.ok(asset.href.endsWith('.txt'));
  }
  const links = [];
  const walk = value => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') { if (value.href) links.push(value.href); Object.values(value).forEach(walk); }
  };
  walk(data.blocks);
  assert.ok(links.every(href => /^https?:\/\//.test(href) || href.startsWith(assetPrefix) || href.startsWith('/next/') || href.startsWith('#')));
});

test('Markdown conversion preserves Chinese, code, strong labels, nested link parentheses and table pipes', () => {
  const resolve = raw => ({ href: raw, external: true });
  const input = '# 完整规范\n\n## 历史\n\n**中文**与 `a | b`，<script>不可执行</script>。\n\n| 角色 | 内容 |\n| --- | --- |\n| 中文 | `a | b` 与 x\\|y |\n\n3. 第三项\n4. 第四项\n\n```html\n<script>文本</script>\n```\n\n[参考](https://example.org/a(b))';
  const parsed = parseMarkdown(input, resolve);
  assert.equal(parsed.title, '完整规范');
  assert.equal(text(parsed.blocks[1].children), '中文与 a | b，<script>不可执行</script>。');
  assert.equal(text(parsed.blocks[2].rows[0][1]), 'a | b 与 x|y');
  assert.equal(parsed.blocks[3].start, 3);
  assert.equal(parsed.blocks[4].value, '<script>文本</script>');
  assert.equal(parsed.blocks[5].children[0].href, 'https://example.org/a(b)');
  assert.deepEqual(tableCells('| `a | b` | x\\|y |'), ['`a | b`', 'x\\|y']);
});

test('unsafe links, local absolute paths, docs escapes and executable image formats are rejected', () => {
  const { resolveLink } = createLinkResolver();
  for (const raw of ['javascript:alert(1)', 'data:text/html,hello', 'file:///C:/private.txt', 'C:/private.txt', '//example.org/path', '/etc/passwd', '../package.json', '%2e%2e/package.json', '..%5cpackage.json', '/next/%2e%2e/private', 'https://user:secret@example.org/', 'https://example.org/\nscript']) {
    assert.throws(() => resolveLink(raw), undefined, raw);
  }
  assert.throws(() => resolveLink('https://example.org/image.png', true));
  assert.throws(() => resolveLink('blueprint/evidence/source-audit-20261015/states.js', true));
  assert.throws(() => parseInline('[执行](javascript:alert(1))', resolveLink));
  assert.match(resolveLink('../components/prism-next/blueprint/blueprint.tsx').href, /^https:\/\/github.com\/Ashrum\/intelligence-prism-ui\//);
});

test('unsupported syntax and raw HTML stay literal; malformed structure cannot silently discard content', () => {
  const { resolveLink } = createLinkResolver();
  const raw = '<iframe src="https://example.org"></iframe> ~~原文~~ [引用][ref]';
  assert.equal(text(parseInline(raw, resolveLink)), raw);
  assert.throws(() => parseMarkdown('# 文档\n\n```js\n内容', resolveLink), /Unclosed/);
  assert.throws(() => parseMarkdown('# 文档\n\n| 一 | 二 |\n| --- | --- |\n| 只有一格 |', resolveLink), /column count/);
});

test('guide route and existing navigation expose one authored source without a raw HTML renderer', () => {
  const route = read('app/(next)/next/foundations/blueprint/guide/page.tsx').toString();
  const renderer = read('components/prism-next/blueprint-guide.tsx').toString();
  assert.match(route, /BlueprintGuide/);
  assert.doesNotMatch(renderer, /dangerouslySetInnerHTML|eval\(|innerHTML/);
  assert.match(renderer, /noopener noreferrer/);
  for (const file of ['components/prism-next/shell.tsx', 'components/prism-next/foundations.tsx']) {
    assert.ok(read(file).toString().includes('/next/foundations/blueprint/guide'), file);
  }
  const demoRoute = 'app/(next)/next/foundations/blueprint/page.tsx';
  if (existsSync(path.join(repositoryRoot, demoRoute))) assert.ok(read(demoRoute).toString().includes('/next/foundations/blueprint/guide'));
  else assert.match(route, /showBlueprintDemo=\{false\}/, 'A docs-only site must not link to an unpublished demo route');
});
