// One-time, offline migration of the 645 layout PNGs. Existing browser judgments stay unchanged.
import {readFile, writeFile, rename, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {screenshotName} from './measurement-utils.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../../..');
const read=async name=>JSON.parse(await readFile(path.join(dir,name),'utf8'));
const auditPath=path.join(dir,'screenshot-renames.json');
try {await access(auditPath);throw Error('Migration already recorded; use validate.mjs to verify it.');} catch(e) {if(e.code!=='ENOENT')throw e;}
const matrix=await read('matrix.json'),index=await read('screenshots-matrix.json');
const mapping=new Map(),entries=[];
for(const shot of index) {
 const row=matrix.results.find(r=>r.id.startsWith('layout-')&&r.screenshots.includes(shot.file));
 assert.ok(row,shot.file);
 const target=path.posix.join(path.posix.dirname(shot.file),screenshotName(row));
 assert.notEqual(target,shot.file);
 assert.ok(!entries.some(e=>e.to===target),'duplicate target '+target);
 try {await access(path.join(root,target));throw Error('Destination exists: '+target);} catch(e) {if(e.code!=='ENOENT')throw e;}
 const bytes=await readFile(path.join(root,shot.file));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 entries.push({from:shot.file,to:target,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 mapping.set(shot.file,target);
}
assert.equal(entries.length,645);
// Complete preflight before any rename. Record a reversible mapping first.
await writeFile(auditPath,JSON.stringify({baseline:matrix.baseline,entries},null,2)+'\n');
for(const entry of entries) await rename(path.join(root,entry.from),path.join(root,entry.to));
const updated=[];
for(const name of ['matrix.json','interactions.json','isolation.json','per-round.json',...['matrix','interactions','isolation','per-round'].map(g=>`screenshots-${g}.json`),'checks.md']) {
 const file=path.join(dir,name);let text=await readFile(file,'utf8');const original=text;
 for(const [from,to] of mapping) text=text.replaceAll(from,to);
 if(text!==original) {await writeFile(file,text);updated.push(name);}
}
console.log(JSON.stringify({renamed:entries.length,pngBytesUnchanged:true,updated}));
