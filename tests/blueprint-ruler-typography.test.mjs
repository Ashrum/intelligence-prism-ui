import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('typography guard permits only the approved decorative ruler rule', () => {
  const root=mkdtempSync(join(tmpdir(),'prism-ruler-typography-'));
  const css=readFileSync(new URL('../app/(next)/next/blueprint.css',import.meta.url),'utf8');
  const approved=css.split(/\r?\n/).find(line=>line.includes('font-size:0.625rem'));
  assert.ok(approved);
  try {
    for(const dir of ['scripts','components/prism-next','examples','app/(next)/next','lib/prism-next'])mkdirSync(join(root,dir),{recursive:true});
    writeFileSync(join(root,'scripts/check-typography.mjs'),readFileSync(new URL('../scripts/check-typography.mjs',import.meta.url)));
    writeFileSync(join(root,'lib/prism-next/typography.ts'),'const role={className:"text-score-display"}');
    writeFileSync(join(root,'app/(next)/next/typography.css'),'@theme { --text-score-display:2.5rem; }');
    const file=join(root,'app/(next)/next/blueprint.css');
    const run=source=>{writeFileSync(file,source);return spawnSync(process.execPath,[join(root,'scripts/check-typography.mjs')],{encoding:'utf8'});};
    assert.equal(run(approved).status,0);
    const invalid=[
      approved.replace(':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"]) ',''),
      approved.replace(/:not\(:where\([\s\S]*? \*\)\)/,''),
      '.ordinary-label,\n'+approved,
      approved.replace('.bp-ruler','.bp-sheet-no'),
      approved.replace('[aria-hidden="true"]',''),
      approved.replace('0.625rem','0.5rem'),
      approved+'\n.ordinary-label { font-size:10px; }',
    ];
    for(const source of invalid){const result=run(source);assert.equal(result.status,1,source);assert.match(result.stderr,/local CSS size must use a semantic token/);}
    writeFileSync(file,'');
    writeFileSync(join(root,'app/(next)/next/other.css'),approved);
    const other=spawnSync(process.execPath,[join(root,'scripts/check-typography.mjs')],{encoding:'utf8'});
    assert.equal(other.status,1,'the exception is file-specific');
  } finally {rmSync(root,{recursive:true,force:true});}
});
