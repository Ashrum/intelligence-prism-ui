// Offline delivery audit. No test/source mutations, browser import, server or network access.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {screenshotName} from './measurement-utils.mjs';
import {legacyProbes} from './legacy-probes.mjs';
import {roundProbes} from './round-probes.mjs';
import {checklistRows,representative} from './plan-utils.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../../..');
const relative=path.relative(root,dir),read=p=>readFile(path.join(root,p),'utf8');
const sha=s=>createHash('sha256').update(s).digest('hex');
const commands=[],checks=[];
function command(args){const startedAt=new Date().toISOString();const r=spawnSync(args[0],args.slice(1),{cwd:root,encoding:'utf8'});commands.push({command:args.join(' '),startedAt,exitCode:r.status,stdout:r.stdout,stderr:r.stderr});assert.equal(r.status,0,args.join(' '));}
async function check(name,fn){const detail=await fn();checks.push({name,pass:true,detail:detail??null});}
try{
for(const script of ['prepare.mjs','measure.mjs','measurement-utils.mjs','rename-screenshots.mjs','offline-audit.mjs','legacy-probes.mjs','round-probes.mjs','plan-utils.mjs','validate-fixture.mjs','validate.mjs'])command(['node','--check',`${relative}/${script}`]);
const evidenceNames=['matrix','interactions','isolation','per-round'].flatMap(g=>[`${g}.json`,`screenshots-${g}.json`]);
const beforePlan=await Promise.all(evidenceNames.map(async name=>sha(await read(`${relative}/${name}`))));
command(['node',`${relative}/offline-audit.mjs`]);
command(['node',`${relative}/validate-fixture.mjs`]);
command(['node',`${relative}/measure.mjs`,'--plan']);
command(['git','diff','--check']);
await check('offline plan preserves all browser evidence bytes',async()=>{const afterPlan=await Promise.all(evidenceNames.map(async name=>sha(await read(`${relative}/${name}`))));assert.deepEqual(afterPlan,beforePlan);return evidenceNames.length;});
const m=JSON.parse(await read(`${relative}/manifest.json`));
await check('all 23 source hashes match current source',async()=>{for(const s of m.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path);return m.sources.length;});
await check('every existing round browser checklist included',async()=>{const directories=await readdir(path.join(root,'docs/blueprint/evidence'),{withFileTypes:true});const list=[];for(const d of directories.filter(x=>x.isDirectory())){const p=`docs/blueprint/evidence/${d.name}/browser-checklist.md`;try{await read(p);list.push(p);}catch(e){if(e.code!=='ENOENT')throw e;}}for(const p of list)assert.ok(m.rounds.some(r=>r.sources.includes(p)),p);return list.length;});
await check('43 route patterns match complete segment shape',async()=>{for(const r of m.routes){await read(r.pageSource);const pattern=r.pageSource.replace('app/(next)','').replace('/page.tsx','').replace(/\[[^\]]+\]/g,'[^/]+');assert.ok(new RegExp(`^${pattern}$`).test(r.route),r.route);}return m.routes.length;});
await check('P73 outdated URL mapped without editing source checklist',()=>{assert.ok(!m.routes.some(r=>r.route.endsWith('/existing-agent-inputs')));assert.ok(m.coverageNotes.some(r=>r.effectiveRoute?.endsWith('#existing-agent-inputs')));});
await check('source-derived sample names unique and legacy obligations complete',async()=>{assert.equal(new Set(m.samples).size,m.samples.length);let count=0;for(const file of ['first-interactions.json','interactions.json']){const original=JSON.parse(await read(`docs/blueprint/evidence/batch2-20261016/${file}`));const actual=m.legacy.filter(r=>r.source.endsWith('/'+file));assert.deepEqual(actual.map(r=>r.name),original.checks.map(r=>r.name));count+=original.checks.length;}return {samples:m.samples.length,legacy:count};});
await check('browser evidence schema and summaries remain truthful',async()=>{
 const totals={},summaries={};
 for(const file of ['matrix','interactions','isolation','per-round']) {
  const d=JSON.parse(await read(`${relative}/${file}.json`));assert.equal(d.baseline,m.baseline);const ids=new Set();
  for(const r of d.results) {
   assert.ok(r.name&&r.route&&r.theme&&r.viewport.width);assert.ok(!ids.has(r.id));ids.add(r.id);
   if(['pending-supervisor-browser','pending-visual'].includes(r.status))assert.equal(r.pass,null);
   else if(r.status==='pass') {assert.equal(r.pass,true);assert.notEqual(r.measured,null);}
   else if(['fail','error','unstable'].includes(r.status)) {assert.equal(r.pass,false);assert.ok(r.error);}
   else assert.ok(['observed','known-limitation'].includes(r.status),r.status);
   if(d.execution==='not-run') {assert.equal(r.measured,null);assert.deepEqual(r.screenshots,[]);}
  }
  for(const [status,count] of Object.entries(d.summary))assert.equal(count,d.results.filter(r=>r.status===status).length);
  assert.equal(Object.values(d.summary).reduce((a,b)=>a+b,0),d.results.length);
  totals[file]=d.results.length;summaries[file]=d.summary;
 }
 assert.equal(totals.matrix,m.routes.length*m.themes.length*m.widths.length*2);
 assert.equal(totals.isolation,m.themes.length**2*m.widths.length);
 assert.equal(totals.interactions,(17+5+m.legacy.length)*15);
 const perRound=JSON.parse(await read(`${relative}/per-round.json`));const catalog=JSON.parse(await read(`${relative}/checklist-classification.json`));assert.equal(totals['per-round'],perRound.schemaVersion===2?checklistRows(catalog,m).length+4*15:(m.rounds.length+4)*15);return {totals,summaries};
});
await check('78 historical obligations have distinct executable registry entries and 15 plan combinations',async()=>{
 const plan=JSON.parse(await read(`${relative}/plan.json`));
 assert.deepEqual(Object.keys(legacyProbes).sort(),m.legacy.map(x=>x.id).sort());
 for(const obligation of m.legacy){assert.equal(typeof legacyProbes[obligation.id],'function');const rows=plan.results.interactions.filter(r=>r.legacyProbe===obligation.id);assert.equal(rows.length,15);assert.ok(rows.every(r=>r.source===obligation.source&&r.criteria===obligation.name&&r.pass===null&&r.measured===null));assert.equal(new Set(rows.map(r=>r.theme+'-'+r.viewport.width)).size,15);}
 return {legacyFunctions:Object.keys(legacyProbes).length,plannedRows:1170,browserRun:false};
});
await check('17 checklists have complete source line ledger and all automatic probes resolve',async()=>{
 const c=JSON.parse(await read(`${relative}/checklist-classification.json`));assert.equal(c.baseline,m.baseline);const ids=new Set();
 for(const item of c.items){assert.ok(!ids.has(item.id));ids.add(item.id);assert.ok(item.criterion);const source=(await read(item.source)).split('\n');for(const [i,line]of item.lines.entries())assert.equal(source[line-1],item.original[i]);if(item.category==='可自动化'||item.probe)assert.equal(typeof roundProbes[item.probe],'function',item.probe);else assert.ok(['需目检','不适用或已被其他项覆盖'].includes(item.category));}
 for(const round of m.rounds){assert.ok(c.items.some(i=>i.round===round.name));for(const line of round.checklist)assert.ok(c.items.some(i=>i.round===round.name&&i.lines.includes(line.line))||c.sourceContext.some(i=>i.round===round.name&&i.line===line.line&&i.text===line.text),round.name+':'+line.line);}
 for(const [name,count]of Object.entries(c.counts))assert.equal(count,c.items.filter(i=>i.category===name).length);
 return {rounds:m.rounds.length,obligations:c.items.length,counts:c.counts,contextLines:c.sourceContext.length,roundFunctions:Object.keys(roundProbes).length};
});
await check('new per-round plan is atomic; 90 manual rows only use five representative combinations',async()=>{
 const c=JSON.parse(await read(`${relative}/checklist-classification.json`)),plan=JSON.parse(await read(`${relative}/plan.json`));const rows=checklistRows(c,m);assert.deepEqual(plan.results['per-round'].filter(r=>r.checklistId),rows);
 const visual=rows.filter(r=>r.visual);assert.equal(visual.length,c.counts['需目检']*5);assert.ok(visual.every(r=>representative(r.theme,r.viewport.width)&&r.pass===null&&r.status==='pending-visual'));
 assert.ok(!rows.some(r=>r.id.startsWith('round-')));const shots=rows.map(r=>screenshotName(r));assert.equal(new Set(shots).size,shots.length);assert.equal((await read(`${relative}/manual-review.md`)).match(/^- \[ \]/gm).length,visual.length);
 return {automatic:rows.filter(r=>!r.visual).length,visual:visual.length,coveredOrNotApplicable:c.counts['不适用或已被其他项覆盖'],screenshotNamesUnique:shots.length};
});
await check('BPM1b Supervisor run archived and not promoted to current passes',async()=>{
 const archive=JSON.parse(gunzipSync(await readFile(path.join(dir,'bpm1b-supervisor-run.json.gz'))));assert.equal(archive.files['interactions.json'].summary.error,15);assert.equal(archive.files['interactions.json'].summary['pending-supervisor-browser'],1170);assert.equal(archive.files['per-round.json'].summary['pending-supervisor-browser'],255);
 const data=JSON.parse(await read(`${relative}/interactions.json`));if(data.schemaVersion!==2)for(const name of evidenceNames)assert.equal(sha(await read(`${relative}/${name}`)),archive.sha256[name],name);
 return {archivedError:15,archivedPending:1425,existingRunPreserved:data.schemaVersion!==2};
});
await check('645 renamed PNG bytes match original hashes and all screenshot references resolve',async()=>{
 const migration=JSON.parse(await read(`${relative}/screenshot-renames.json`));assert.equal(migration.entries.length,645);
 const destinations=new Set();
 for(const e of migration.entries) {
  assert.ok(!destinations.has(e.to));destinations.add(e.to);
  const bytes=await readFile(path.join(root,e.to));assert.equal(sha(bytes),e.sha256);assert.equal(bytes.length,e.bytes);
  try {await readFile(path.join(root,e.from));assert.fail('Old screenshot still exists: '+e.from);}catch(error){if(error.code!=='ENOENT')throw error;}
 }
 const indexed=new Set();let count=0;
 for(const group of ['matrix','interactions','isolation','per-round']) {
  const shots=JSON.parse(await read(`${relative}/screenshots-${group}.json`));
  for(const shot of shots) {
   const bytes=await readFile(path.join(root,shot.file));assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(shot.baseline,m.baseline);assert.ok(shot.date&&shot.route&&shot.viewport.height);assert.ok(!indexed.has(shot.file));indexed.add(shot.file);count++;
  }
  const data=JSON.parse(await read(`${relative}/${group}.json`));
  for(const row of data.results)for(const file of row.screenshots)assert.ok(shots.some(s=>s.file===file),file);
  if(group==='matrix')for(const row of data.results.filter(r=>r.id.startsWith('layout-')))assert.equal(path.basename(row.screenshots[0]),screenshotName(row));
 }
 return {renamed:destinations.size,indexed:count};
});
await check('first Supervisor run archived without reclassifying failures',async()=>{
 const archive=JSON.parse(gunzipSync(await readFile(path.join(dir,'first-browser-run.json.gz'))));
 const expected={matrix:[645,0,0,645],isolation:[75,0,0,0],interactions:[239,31,60,1170],'per-round':[21,9,0,255]};
 for(const [group,[pass,fail,error,pending]] of Object.entries(expected)) {
  const s=archive.files[`${group}.json`].summary;assert.equal(s.pass,pass);assert.equal(s.fail,fail);assert.equal(s.error,error);assert.equal(s['pending-visual']+s['pending-supervisor-browser'],pending);
 }
 return {files:Object.keys(archive.files).length,sha256:sha(await readFile(path.join(dir,'first-browser-run.json.gz')))};
});
await check('BPM1b current preserved verbatim',async()=>{const before=await read(`${relative}/bpm1c-before-status.txt`);const now=await read('docs/blueprint/STATUS.md');assert.ok(now.includes('### BPM1b · 2026-10-19（BPM1c 前当前，原样保留）\n'+before.split('## 当前\n')[1].split('## 历史\n')[0]));});
await check('BPM1 current preserved verbatim',async()=>{const before=await read(`${relative}/bpm1b-before-status.txt`);const now=await read('docs/blueprint/STATUS.md');assert.ok(now.includes('### BPM1 · 2026-10-19（BPM1b 前当前，原样保留）\n'+before.split('## 当前\n')[1].split('## 历史\n')[0]));});
await check('old current moved verbatim; earlier history unchanged',async()=>{const old=execFileSync('git',['show','HEAD:docs/blueprint/STATUS.md'],{cwd:root,encoding:'utf8'});const now=await read('docs/blueprint/STATUS.md');const current=old.split('## 当前\n')[1].split('## 历史\n')[0];assert.ok(now.includes('### P85c · 2026-10-18（BPM1 前当前，原样保留）\n'+current));assert.ok(now.endsWith(old.split('## 历史\n')[1]));return {oldCurrentSha256:sha(current)};});
await check('only authorized tracked/untracked repository paths changed',()=>{const tracked=execFileSync('git',['diff','--name-only','-z','HEAD'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);const untracked=execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);for(const p of [...tracked,...untracked])assert.ok(p==='docs/blueprint/STATUS.md'||p.startsWith(relative+'/')||p.startsWith('docs/blueprint/screens/matrix-closeout-20261019/'),p);return {tracked,untracked};});
await check('new repository prose has no machine-local supervisor links',async()=>{for(const p of ['docs/blueprint/STATUS.md',`${relative}/checks.md`,`${relative}/route-index.md`,`${relative}/manual-review.md`,`${relative}/classification.md`])assert.ok(!(await read(p)).includes('/Users/OLE/HermesWork/.supervisor/'),p);});
await writeFile(path.join(dir,'scope.diff'),execFileSync('git',['diff','--','docs/blueprint/STATUS.md'],{cwd:root,encoding:'utf8'}));
await check('new Markdown links resolve',async()=>{let links=0;for(const f of ['checks.md','route-index.md','manual-review.md','classification.md']){const content=await read(`${relative}/${f}`);for(const match of content.matchAll(/\]\(([^)]+)\)/g)){if(/^https?:/.test(match[1]))continue;const target=path.resolve(dir,match[1].split('#')[0]);if(target.endsWith('/validation.json'))continue;await readFile(target);links++;}}return links;});
const patch=execFileSync('git',['diff','--','docs/blueprint/STATUS.md'],{cwd:root,encoding:'utf8'});await writeFile(path.join(dir,'scope.diff'),patch);
const inventory=[];for(const f of (await readdir(dir)).sort()){if(f==='validation.json')continue;const bytes=await readFile(path.join(dir,f));inventory.push({path:`${relative}/${f}`,bytes:bytes.length,sha256:sha(bytes)});}
await writeFile(path.join(dir,'validation.json'),JSON.stringify({at:new Date().toISOString(),baseline:m.baseline,browserExecuted:false,commands,checks,summary:{pass:checks.length,fail:0},inventory,excludedSelf:'validation.json omits its own hash'},null,2)+'\n');
console.log(JSON.stringify({staticChecks:checks.length,commands:commands.length,allExitCodesZero:commands.every(c=>c.exitCode===0),browserExecuted:false,files:inventory.length}));
}catch(e){console.error(e);await writeFile(path.join(dir,'validation-error.json'),JSON.stringify({at:new Date().toISOString(),commands,checks,error:String(e.stack||e)},null,2)+'\n');process.exitCode=1;}
