/**
 * Publish the existing Blueprint Markdown as safe structured data, without a
 * second authored copy or a runtime Markdown dependency. Run after editing the
 * source or any directly linked evidence: node scripts/sync-blueprint-guide.mjs.
 * --check verifies both the generated data and the exact referenced asset bytes.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
export const sourcePath = 'docs/blueprint-theme.md';
export const generatedPath = 'lib/prism-next/blueprint-guide.json';
export const assetPrefix = '/foundations/blueprint/guide-assets/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const within = (root, candidate) => { const relative = path.relative(root, candidate); return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative); };

export function createLinkResolver(root = repositoryRoot) {
  const assets = new Map();
  const docsRoot = realpathSync(path.join(root, 'docs'));
  function resolveLink(raw, image = false) {
    if (/[\u0000-\u0020\u007f\\]/.test(raw)) throw new Error(`Unsafe documentation link: ${raw}`);
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      if (url.username || url.password || image) throw new Error(`External image or credential URL is not supported: ${raw}`);
      return { href: url.href, external: true };
    }
    if (raw.startsWith('#')) return { href: raw, external: false };
    if (/^\/next\/(?!\/)/.test(raw) && !image) {
      const decoded = decodeURIComponent(raw);
      if (/[\\\u0000-\u0020]/.test(decoded) || decoded.includes('..')) throw new Error(`Unsafe site route: ${raw}`);
      return { href: raw, external: false };
    }
    // This is the one source-code reference already present in the document.
    // It is a repository link, never a file copy from outside docs/.
    if (raw === '../components/prism-next/blueprint/blueprint.tsx' && !image) return {
      href: 'https://github.com/Ashrum/intelligence-prism-ui/blob/main/components/prism-next/blueprint/blueprint.tsx', external: true,
    };
    if (/^[a-z][a-z\d+.-]*:/i.test(raw) || raw.startsWith('/')) throw new Error(`Unsupported documentation URL: ${raw}`);
    let decoded;
    try { decoded = decodeURIComponent(raw); } catch { throw new Error(`Malformed documentation URL: ${raw}`); }
    if (/[?#:\\\u0000-\u001f]/.test(decoded)) throw new Error(`Unsupported local documentation URL: ${raw}`);
    const absolute = path.resolve(docsRoot, decoded);
    if (!within(docsRoot, absolute) || !existsSync(absolute) || !within(docsRoot, realpathSync(absolute))) throw new Error(`Documentation link must resolve inside docs/: ${raw}`);
    const relative = path.relative(docsRoot, absolute).split(path.sep).join('/');
    const extension = path.extname(relative).toLowerCase();
    const raster = ['.png', '.jpg', '.jpeg', '.webp'].includes(extension);
    if ((!raster && !['.md', '.json', '.js', '.log', '.txt'].includes(extension)) || (image && !raster)) throw new Error(`Unsupported documentation asset: ${raw}`);
    // Only raster images and Markdown downloads retain their extension. Scripts
    // and logs are served as plain text, never as executable browser resources.
    const published = `docs/${relative}${raster || extension === '.md' ? '' : '.txt'}`;
    const href = assetPrefix + published.split('/').map(encodeURIComponent).join('/');
    const bytes = readFileSync(absolute);
    assets.set(published, { source: `docs/${relative}`, href, bytes, sha256: hash(bytes) });
    return { href, external: false, download: !raster };
  }
  return { assets, resolveLink };
}

export function parseInline(source, resolveLink) {
  const nodes = [];
  const text = value => { if (!value) return; const last = nodes.at(-1); if (last?.type === 'text') last.value += value; else nodes.push({ type: 'text', value }); };
  for (let i = 0; i < source.length;) {
    if (source[i] === '\\' && /[\\`*{}[\]()#+.!_|>-]/.test(source[i + 1] ?? '')) { text(source[i + 1]); i += 2; continue; }
    const code = source.slice(i).match(/^(`+)([\s\S]*?)\1(?!`)/);
    if (code) { nodes.push({ type: 'code', value: code[2] }); i += code[0].length; continue; }
    if (source.startsWith('**', i)) {
      const end = source.indexOf('**', i + 2);
      if (end > i + 2) { nodes.push({ type: 'strong', children: parseInline(source.slice(i + 2, end), resolveLink) }); i = end + 2; continue; }
    }
    const start = source.startsWith('![', i) ? i + 2 : source[i] === '[' ? i + 1 : -1;
    const labelEnd = start < 0 ? -1 : source.indexOf('](', start);
    if (labelEnd >= 0) {
      let depth = 1, end = labelEnd + 2;
      for (; end < source.length && depth; end++) { if (source[end] === '(') depth++; if (source[end] === ')') depth--; }
      if (!depth) {
        const isImage = source[i] === '!';
        const destination = resolveLink(source.slice(labelEnd + 2, end - 1), isImage);
        nodes.push(isImage ? { type: 'image', alt: source.slice(start, labelEnd), ...destination } : { type: 'link', children: parseInline(source.slice(start, labelEnd), resolveLink), ...destination });
        i = end; continue;
      }
    }
    // Raw HTML and unsupported inline syntax remain escaped React text. They
    // are never parsed as HTML, discarded, or evaluated.
    text(source[i++]);
  }
  return nodes;
}

export function tableCells(line) {
  const cells = []; let current = '', code = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\' && line[i + 1] === '|') { current += '\\|'; i++; continue; }
    if (ch === '`') code = !code;
    if (ch === '|' && !code) { cells.push(current.trim()); current = ''; } else current += ch;
  }
  cells.push(current.trim());
  if (line.trimStart().startsWith('|')) cells.shift();
  if (line.trimEnd().endsWith('|')) cells.pop();
  return cells;
}

export function parseMarkdown(source, resolveLink) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [], headings = [];
  let title = '', sectionNumber = 0;
  const inline = value => parseInline(value, resolveLink);
  const tableStart = i => i + 1 < lines.length && lines[i].includes('|') && tableCells(lines[i + 1]).length > 0 && tableCells(lines[i + 1]).every(cell => /^:?-{3,}:?$/.test(cell));
  const special = i => !lines[i].trim() || /^(#{1,6}) |^```|^~~~|^\s*([-*+] |\d+\. )|^> ?|^---+$/.test(lines[i]) || tableStart(i);
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const heading = line.match(/^(#{1,6}) (.+)$/);
    if (heading) {
      const level = heading[1].length;
      if (level === 1 && !title && !blocks.length) title = heading[2];
      else { const id = `section-${++sectionNumber}`; const children = inline(heading[2]); blocks.push({ type: 'heading', level, id, children }); headings.push({ id, level, text: heading[2] }); }
      i++; continue;
    }
    const fence = line.match(/^(```+|~~~+)(.*)$/);
    if (fence) {
      const content = []; i++;
      while (i < lines.length && !lines[i].startsWith(fence[1])) content.push(lines[i++]);
      if (i === lines.length) throw new Error('Unclosed Markdown code fence');
      blocks.push({ type: 'code', language: fence[2].trim(), value: content.join('\n') }); i++; continue;
    }
    if (tableStart(i)) {
      const headers = tableCells(line).map(inline); const rows = []; i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        const cells = tableCells(lines[i++]);
        if (cells.length !== headers.length) throw new Error('Markdown table row has a different column count');
        rows.push(cells.map(inline));
      }
      blocks.push({ type: 'table', headers, rows }); continue;
    }
    if (/^\s*([-*+] |\d+\. )/.test(line)) {
      const ordered = /^\s*\d+\. /.test(line); const items = []; const start = ordered ? Number(line.trim().match(/^\d+/)[0]) : undefined;
      while (i < lines.length && (ordered ? /^\d+\. / : /^[-*+] /).test(lines[i])) {
        let item = lines[i++].replace(/^(?:[-*+]|\d+\.) /, '');
        while (i < lines.length && lines[i].trim() && !special(i)) item += '\n' + lines[i++];
        items.push(inline(item));
      }
      if (!items.length) { blocks.push({ type: 'paragraph', children: inline(lines[i++]) }); continue; }
      blocks.push({ type: 'list', ordered, ...(ordered ? { start } : {}), items }); continue;
    }
    if (/^> ?/.test(line)) {
      const quote = []; while (i < lines.length && /^> ?/.test(lines[i])) quote.push(lines[i++].replace(/^> ?/, ''));
      blocks.push({ type: 'quote', children: inline(quote.join('\n')) }); continue;
    }
    if (/^---+$/.test(line)) { blocks.push({ type: 'rule' }); i++; continue; }
    const paragraph = [lines[i++]];
    while (i < lines.length && !special(i)) paragraph.push(lines[i++]);
    blocks.push({ type: 'paragraph', children: inline(paragraph.join('\n')) });
  }
  if (!title) throw new Error('Blueprint guide must start with its Markdown H1 title');
  return { title, headings, blocks };
}

export function compileGuide(root = repositoryRoot) {
  const bytes = readFileSync(path.join(root, sourcePath));
  const { assets, resolveLink } = createLinkResolver(root);
  const document = parseMarkdown(bytes.toString('utf8'), resolveLink);
  const sourceDownload = resolveLink('blueprint-theme.md').href;
  return {
    data: { sourcePath, sourceSha256: hash(bytes), sourceDownload, ...document, assets: [...assets.values()].map(({ bytes: _bytes, ...asset }) => asset) },
    assets,
  };
}

export function syncGuide({ root = repositoryRoot, check = false } = {}) {
  const { data, assets } = compileGuide(root);
  const outputs = [[generatedPath, Buffer.from(JSON.stringify(data, null, 2) + '\n')], ...[...assets.entries()].map(([published, asset]) => [`public${assetPrefix}${published}`, asset.bytes])];
  for (const [relative, bytes] of outputs) {
    const destination = path.join(root, relative);
    if (check) {
      if (!existsSync(destination) || !readFileSync(destination).equals(bytes)) throw new Error(`Stale Blueprint guide output: ${relative}. Run node scripts/sync-blueprint-guide.mjs`);
    } else { mkdirSync(path.dirname(destination), { recursive: true }); writeFileSync(destination, bytes); }
  }
  return { sourceSha256: data.sourceSha256, blocks: data.blocks.length, assets: assets.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(syncGuide({ check: process.argv.includes('--check') })));
}
