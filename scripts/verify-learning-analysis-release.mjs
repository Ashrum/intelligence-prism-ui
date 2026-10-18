import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { syncLearningAnalysis } from './sync-learning-analysis-docs.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'docs/learning-analysis');
const read=p=>readFileSync(path.join(dir,p),'utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
const manifest=JSON.parse(read('split-manifest.json'));
const main=read(manifest.baseline_file);
assert.equal(hash(main),manifest.baseline_sha256,'baseline hash');
assert.equal(manifest.specs.length,6);
const all=[];
for(const spec of manifest.specs){
 const text=read(spec.file);assert.equal(hash(text),spec.sha256,spec.file);
 for(const segment of spec.segments){
  const source=main.slice(segment.source_start,segment.source_end).trim();
  assert.equal(hash(source),segment.sha256,segment.key+' hash');
  assert.ok(text.includes(source),segment.key+' verbatim excerpt');all.push(segment);
 }
 for(const gate of spec.gates){const row=main.split('\n').find(l=>l.startsWith('| '+gate));assert.ok(row&&text.includes(row),spec.file+' '+gate);}
}
all.sort((a,b)=>a.source_start-b.source_start);
assert.equal(all.length,17);assert.equal(all[0].source_start,main.indexOf('## 4 '));assert.equal(all.at(-1).source_end,main.indexOf('## 13 '));
for(let i=1;i<all.length;i++)assert.equal(all[i-1].source_end,all[i].source_start,'continuous single-owner excerpt');
for(const [prefix,max] of [['MET',10],['LA',9],['ED',4],['T',7],['E',10],['EDU',12],['M',4],['AG',6]])for(let n=1;n<=max;n++)assert.ok(main.includes(prefix+String(n).padStart(2,'0')),prefix+n);
assert.ok(main.includes('AG02 / r2 建议变化与来源'));
assert.equal(hash(readFileSync(path.join(dir,'evidence/approved-v0.7-r1.md'))),'a979d411f4886ec7c93d5440239b012e2ab2978987466dab2b66d0e1e230e05a');
// Numeric/eligibility rules remain the approved r1 text. Only portable URLs may differ in §6.
const section6=s=>s.slice(s.indexOf('## 6 '),s.indexOf('## 7 ')).replace(/\]\([^\n)]+\)/g,'](LINK)');
assert.equal(section6(main),section6(read('evidence/approved-v0.7-r1.md')),'all §6 metric rules unchanged');
const result={status:'PASS',revision:'v0.7 r2',baseline_sha256:manifest.baseline_sha256,specs:6,verbatim_segments:17,section4_to12_continuous:true,gate_rows_identical:true,section6_rules_unchanged:true,scope:'document integrity and deterministic publication; not production admission'};
if(process.argv.includes('--write'))writeFileSync(path.join(dir,'split-validation.json'),JSON.stringify(result,null,2)+'\n');
else result.site=syncLearningAnalysis(true);
console.log(JSON.stringify(result));
