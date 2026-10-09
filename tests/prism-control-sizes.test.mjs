import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import ts from 'typescript';

// Exact literals, not file-wide exclusions: a new control in any of these files still fails.
// Multiline cards/rows, non-control layout and frozen question cells retain their minima.
const retained = [
  ['question-rail.tsx', 'min-h-11 ', '已冻结预览框架的题目格，尺寸待 Product Owner 决定'],
  ['question-rail.tsx', 'min-h-11 flex-col gap-0.5', '已冻结预览框架的题目格，尺寸待 Product Owner 决定'],
  ['agent-collection-basket.tsx', 'min-h-11 gap-2.5 p-3', 'AgentSurface 多行内容卡片容器，不是操作按钮'],
  ['agent-components.tsx', '[&>textarea]:min-h-12', '多行 composer textarea 的内容区域，不是单行控件触点覆盖'],
  ['agent-components.tsx', 'flex min-h-11 min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 py-1', '步骤 li 的多行行高，无交互控件'],
  ['agent-material-pack.tsx', 'min-h-11 py-3 text-ui-hint text-muted-foreground', '分类拖放容器，保留空投放区域'],
  ['data-station.tsx', 'min-h-11 min-w-0 gap-2 p-4', '整张设备 label 卡包含名称、状态和原因，多行选择目标'],
  ['queue-board.tsx', 'h-auto sm:h-auto min-h-11 min-w-0 justify-start whitespace-normal p-3 text-left motion-reduce:transition-none', 'ToggleGroupItem 是整张多行统计分类卡，包含计数、标签和说明'],
  ['stepper.tsx', 'min-h-11 min-w-11 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', '原生非紧凑步骤 button/div 是多行步骤导航行，非 coss 操作控件'],
];
const key = (file, text) => JSON.stringify([file, text]);
const allowed = new Map(retained.map(([file, text, reason]) => [key(file, text), reason]));

function overrides(file, source) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits = [];
  function visit(node) {
    // Also scan constants and conditional/template branches, so aliases cannot hide overrides.
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const tokens = node.text.split(/\s+/).filter(token => !token.includes('pointer-coarse:') && /(?:^|:)!?min-[hw]-(?:11|12)!?$/.test(token));
      if (tokens.length) hits.push({ file, text: node.text, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, tokens });
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return hits;
}
async function sources(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = prefix + entry.name, url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) result.push(...await sources(url, name + '/'));
    else if (/\.tsx?$/.test(name)) result.push([name, await readFile(url, 'utf8')]);
  }
  return result;
}

test('all prism-next controls reject unconditional 44/48px minima, with exact documented layout exceptions', async () => {
  const hits = (await sources(new URL('../components/prism-next/', import.meta.url))).flatMap(([file, source]) => overrides(file, source));
  const unexpected = hits.filter(hit => !allowed.has(key(hit.file, hit.text)));
  assert.deepEqual(unexpected, [], 'Use coss size or pointer-coarse:; document multiline layout exceptions explicitly.');
  for (const [id, reason] of allowed) {
    assert.ok(reason.trim());
    assert.equal(hits.filter(hit => key(hit.file, hit.text) === id).length, 1, `Remove stale or duplicated exception: ${id}`);
  }
});

test('size scanner covers shared constants, render props, responsive and conditional/template classes', () => {
  const source = 'const target = "min-h-11 sm:min-w-11"; const nested = <Close render={<Button className={target} />} />; const action = <Button className={compact ? "min-h-12" : `max-w-full ${other} md:min-h-11!`} />';
  assert.deepEqual(overrides('example.tsx', source).flatMap(hit => hit.tokens), ['min-h-11', 'sm:min-w-11', 'min-h-12', 'md:min-h-11!']);
  assert.equal(overrides('example.tsx', 'const touch = "pointer-coarse:min-h-11 pointer-coarse:after:min-w-11 sm:pointer-coarse:min-h-12"; // min-h-11').length, 0);
});

test('compatibility normalization accepts sizing only and still rejects content, ARIA and non-control layout drift', async () => {
  const { normalizeControlSizing } = await import('./prism-control-sizing-compat.mjs');
  const before = '<button class="min-h-11 h-auto max-w-full bg-primary" aria-label="保存">保存</button>';
  const after = '<button class="h-9 sm:h-8 max-w-full bg-primary" aria-label="保存"><span class="truncate">保存</span></button>';
  assert.equal(normalizeControlSizing(after), normalizeControlSizing(before));
  for (const mutated of [after.replace('aria-label="保存"', 'aria-label="删除"'), after.replace('>保存<', '>删除<'), after.replace('bg-primary', 'bg-destructive'), after.replace('<button ', '<button disabled ')]) {
    assert.notEqual(normalizeControlSizing(mutated), normalizeControlSizing(before));
  }
  assert.notEqual(normalizeControlSizing('<div class="h-auto">正文</div>'), normalizeControlSizing('<div class="h-9">正文</div>'));
});
