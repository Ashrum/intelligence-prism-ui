import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { taskReducer, initialTask, validateMaterial, initialMaterial, isMaterial, appendReviewNotes, reviewAdoptionState, reviewSuggestion } from '../lib/prism-next/review.ts';

const root = new URL('../', import.meta.url);
test('all vendored coss files retain their pinned source geometry and behavior', () => {
  const manifest=JSON.parse(readFileSync(new URL('vendor/coss-manifest.json',root),'utf8'));
  assert.equal(manifest.files.filter(x=>x.file.startsWith('components/coss/')).length,54);
  for(const file of manifest.files){
    const text=readFileSync(new URL(file.file,root),'utf8');
    assert.equal(createHash('sha256').update(text).digest('hex'),file.localSha256,file.file);
    let upstream=text;
    for(const rewrite of file.importRewrites) upstream=upstream.replaceAll('"'+rewrite.to+'"','"'+rewrite.from+'"');
    assert.equal(createHash('sha256').update(upstream).digest('hex'),file.upstreamSha256,file.file+' upstream');
  }
});
test('legacy route content is preserved byte-for-byte beneath the new legacy root',()=>{
  const files=execFileSync('git',['ls-tree','-r','--name-only','c61cc98','app'],{cwd:root,encoding:'utf8'}).trim().split('\n');
  let count=0;
  for(const file of files){
    if(file==='app/page.tsx'||/^app\/(components|foundations|benchmark|review)\//.test(file)){
      const previous=execFileSync('git',['show',`c61cc98:${file}`],{cwd:root});
      const current=readFileSync(new URL(file.replace('app/','app/(legacy)/'),root));
      assert.deepEqual(current,previous,file);count++;
    }
  }
  assert.ok(count>30);
});
test('material persistence rejects corrupted, invalid and incompatible records',()=>{
  assert.equal(isMaterial(initialMaterial),true);
  for(const value of [null,{}, {...initialMaterial,title:' '},{...initialMaterial,minutes:null},{...initialMaterial,minutes:0},{...initialMaterial,minutes:1.5},{...initialMaterial,minutes:121},{...initialMaterial,kind:'unknown'},{...initialMaterial,notes:'x'.repeat(501)}]) assert.equal(isMaterial(value),false);
  assert.ok(validateMaterial({...initialMaterial,minutes:null}).minutes);
});
test('agent result requires all steps and explicit confirmation',()=>{
  let s=taskReducer(initialTask,{type:'start',request:'检查公式',failure:false});
  assert.equal(taskReducer(s,{type:'apply'}).status,'running');
  s=taskReducer(s,{type:'advance'});s=taskReducer(s,{type:'advance'});
  assert.equal(s.status,'running');
  s=taskReducer(s,{type:'advance'});assert.equal(s.status,'confirm');
  s=taskReducer(s,{type:'apply'});assert.equal(s.status,'completed');
  assert.equal(taskReducer(s,{type:'advance'}).status,'completed');
});
test('stop cancels completion; failure supports a clean retry',()=>{
  let s=taskReducer(initialTask,{type:'start',request:'检查公式',failure:false});
  s=taskReducer(s,{type:'stop'});
  assert.equal(taskReducer(s,{type:'advance'}).status,'stopped');
  assert.equal(taskReducer(s,{type:'apply'}).status,'stopped');
  s=taskReducer(s,{type:'start',request:'重试',failure:true});
  s=taskReducer(s,{type:'advance'});s=taskReducer(s,{type:'advance'});assert.equal(s.status,'error');
  s=taskReducer(s,{type:'start',request:s.request,failure:false});assert.equal(s.step,0);assert.equal(s.status,'running');
  assert.deepEqual(taskReducer(s,{type:'reset'}),initialTask);
});

test('adopting agent notes preserves human work and rejects overflow',()=>{
  assert.equal(appendReviewNotes('人工备注','复核建议').notes,'人工备注\n\n复核建议');
  assert.equal(appendReviewNotes('人工备注\n\n复核建议','复核建议').notes,'人工备注\n\n复核建议');
  const long='人'.repeat(495);const result=appendReviewNotes(long,'补充完整的复核建议');assert.equal(result.notes,long);assert.ok(result.error);
});

test('review adoption follows actual draft and saved notes through cancellation, saving and removal',()=>{
  const original='教师手写备注';
  let saved=original;
  let draft=appendReviewNotes(saved,reviewSuggestion).notes;
  assert.equal(reviewAdoptionState(draft,saved),'draft');
  draft=saved; // Cancelling restores the saved notes, without rerunning the assistant.
  assert.equal(reviewAdoptionState(draft,saved),'absent');
  draft=appendReviewNotes(draft,reviewSuggestion).notes;
  assert.equal(appendReviewNotes(draft,reviewSuggestion).notes,draft);
  saved=draft;
  assert.equal(reviewAdoptionState(draft,saved),'saved');
  assert.equal(reviewAdoptionState(draft+'\n其他人工备注',saved),'saved');
  draft=original; // Manual removal takes precedence over the previous saved copy.
  assert.equal(reviewAdoptionState(draft,saved),'absent');
  assert.equal(reviewAdoptionState(saved,saved),'saved');
  const long='人'.repeat(495),result=appendReviewNotes(long,reviewSuggestion);
  assert.ok(result.error);
  assert.equal(reviewAdoptionState(result.notes,long),'absent');
});
