/** Read-only seed replay; outputs stay in this research directory. No business source is written. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
const repo = process.env.OLE_IMPACT_SOURCE || '/Users/OLE/HermesWork/ole-school-workbench';
const out = path.dirname(fileURLToPath(import.meta.url));
const source = rel => path.join(repo,rel);
const imp = rel => import(pathToFileURL(source(rel)).href);
const { buildWorkspaceDataset } = await imp('src/mocks/workspace/index.ts');
const { workspaceDatasetCatalog } = await imp('src/mocks/workspace/catalog.ts');
const { selectLearningAnalysis, defaultLearningScope, learningMastery } = await imp('src/features/teacher/analysis/learning-selectors.ts');
const { viewableContexts, scopeForContext } = await imp('src/features/teacher/analysis/learning-scope.ts');
const table = { '基础':80, '巩固':60, '提升':40 };
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const digest = x => sha(JSON.stringify(x));
const git = (...args) => execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
const metadata = {generatedAt:new Date().toISOString(),repo,head:git('rev-parse','HEAD'),dirty:git('status','--porcelain'),node:process.version};
// Record the transitive local source graph, so a moving checkout cannot silently change this replay.
const sources = new Map();
function record(rel) { const full=source(rel); if(sources.has(rel)||!fs.existsSync(full))return; const txt=fs.readFileSync(full,'utf8'); sources.set(rel,sha(txt)); for(const match of txt.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/g)){ const next=path.resolve(path.dirname(full),match[1]); if(next.startsWith(repo+'/'))record(path.relative(repo,next)); } }
for(const f of ['src/mocks/workspace/index.ts','src/features/teacher/analysis/learning-selectors.ts','src/features/teacher/analysis/learning-scope.ts'])record(f);
metadata.sourceHashes=Object.fromEntries([...sources].sort());
const valid = x => Number.isFinite(x)&&x>=0&&x<=100;
const same = (a,b) => typeof a==='number' && typeof b==='number' ? Math.abs(a-b)<1e-8 : a===b;
function cloneWithPolicy(base, policy) {
 const state=structuredClone(base), registrations=[], changes=[];
 const byFact=new Map((state.learningFacts?.detections??[]).map(f=>[f.resultId,f]));
 const originalFacts = new Map((base.learningFacts?.detections??[]).map(f=>[f.resultId,f]));
 for(const result of state.results){
   const paper=state.papers.find(p=>p.id===result.paperVersionId);
   if(!paper)continue;
   let fact=byFact.get(result.id);
   // No bank-time lookup: fallback needs an exact saved item snapshot and explicit version.
   const questions=paper.itemSnapshots??[];
   if(!fact && policy!=='direct-replace-existing-only' && questions.length){
     fact={resultId:result.id,date:result.createdAt.slice(0,10),newContext:false,expectations:[],unmappedQuestionIds:[]};
     state.learningFacts.detections.push(fact);byFact.set(result.id,fact);
   }
   if(!fact)continue;
   const qids=new Set(result.rows.flatMap(r=>r.scores.map(s=>s.questionId)));
   for(const qid of qids){
     const question=questions.find(q=>q.id===qid);
     let entry=fact.expectations.find(e=>e.questionId===qid);
     const old=entry?.rate??null;
     const hasAuthored = valid(old) && Boolean(entry?.basis) && Boolean(question?.version);
     const fallback=question?.version ? table[question.difficulty]??null : null;
     if(hasAuthored){
       registrations.push({resultId:result.id,paperVersionId:paper.id,questionId:qid,questionVersion:question.version,annotationVersion:question.annotationVersion??null,learningSeedVersion:base.learningSeedVersion,rate:old,basis:entry.basis,sourceKind:'version-pinned-authored-seed',adapter:'legacy-authored-expectation-v1',tupleSha256:digest({resultId:result.id,paperVersionId:paper.id,question,expectation:entry})});
     }
     let next=old;
     if(policy==='direct-replace-existing-only') {if(old!==null && fallback!==null)next=fallback;}
     else if(!hasAuthored)next=fallback;
     if(!same(old,next)){
       if(!entry){entry={questionId:qid,rate:null,basis:''};fact.expectations.push(entry);}
       entry.rate=next;entry.basis='PO-approved difficulty mapping v0; exact saved question snapshot; sensitivity replay only';
       changes.push({resultId:result.id,paperVersionId:paper.id,questionId:qid,questionVersion:question?.version??null,difficulty:question?.difficulty??null,from:old,to:next,reason:old===null?'qualified-snapshot-fallback':'unsafe-overwrite-authored-rate'});
     }
   }
 }
 // Hold retest qualification fixed. A newly supplied expectation must not itself grant comparison permission.
 let frozenIneligibleLinks=0;
 if(policy==='priority-with-fixed-retest-eligibility'){
   for(const link of state.learningFacts.retests){
     const before=originalFacts.get(link.before.resultId)?.expectations.find(e=>e.questionId===link.before.questionId)?.rate;
     const after=originalFacts.get(link.after.resultId)?.expectations.find(e=>e.questionId===link.after.questionId)?.rate;
     if(before==null||after==null){if(link.comparable)frozenIneligibleLinks++;link.comparable=false;}
   }
 }
 return {state,registrations,changes,frozenIneligibleLinks};
}
function summarize(m) {
 const list = arr => Object.fromEntries(arr.map(x=>[x.id,x]));
 const metrics = x => ({gap:x.gap.value,actual:x.recent.value,expected:x.expected.value,recovery:x.recovery.value,retention:x.retention.value,validAnswers:x.validAnswers,sufficient:x.sufficient});
 return {
   evidenceCount:m.evidence.length,evidenceIds:m.evidence.map(x=>x.id).sort(),
   comparableRetests:m.retests.filter(x=>x.comparable).length,
   detections:list(m.classSummary.detections.map(x=>({id:x.id,actual:x.actual.value,expected:x.expected.value,gap:x.gap.value,category:x.category,answers:x.validAnswers}))),
   students:list(m.students.map(x=>({id:x.id,name:x.name,mastery:learningMastery(x),progress:x.progress,progressReason:x.progressReason,...metrics(x)}))),
   knowledge:list(m.knowledge.map(x=>({id:x.id,label:x.label,mastery:x.mastery,...metrics(x)}))),
   studentKnowledge:list(m.students.flatMap(s=>s.knowledge.map(x=>({id:s.id+'::'+x.id,studentId:s.id,studentName:s.name,knowledgeId:x.id,label:x.label,mastery:x.mastery,...metrics(x)})))),
 };
}
function delta(before,after){
 assert.deepEqual(before.evidenceIds,after.evidenceIds,'Source/answer cohort changed');
 const changed=(kind,fields)=>Object.entries(before[kind]).flatMap(([id,a])=>{const b=after[kind][id];assert.ok(b,`Missing ${kind} ${id}`);const changes=fields.filter(f=>!same(a[f],b[f]));return changes.length?[{id,name:a.name??a.studentName??a.label,changes,before:a,after:b}]:[];});
 const students=changed('students',['mastery','progress']);
 const knowledge=changed('knowledge',['mastery']);
 const studentKnowledge=changed('studentKnowledge',['mastery']);
 const detections=changed('detections',['expected','gap','category']);
 return {denominators:{students:Object.keys(before.students).length,studentsWithAnswers:Object.values(before.students).filter(x=>x.validAnswers>0).length,studentsSufficient:Object.values(before.students).filter(x=>x.sufficient).length,knowledgeRows:Object.keys(before.knowledge).length,knowledgeWithAnswers:Object.values(before.knowledge).filter(x=>x.validAnswers>0).length,studentKnowledgeRows:Object.keys(before.studentKnowledge).length,studentKnowledgeWithAnswers:Object.values(before.studentKnowledge).filter(x=>x.validAnswers>0).length,detections:Object.keys(before.detections).length},counts:{studentMastery:students.filter(x=>x.changes.includes('mastery')).length,studentProgress:students.filter(x=>x.changes.includes('progress')).length,studentsAny:students.length,knowledgeMastery:knowledge.length,studentKnowledgeMastery:studentKnowledge.length,detections: detections.length,comparableRetestsBefore:before.comparableRetests,comparableRetestsAfter:after.comparableRetests},students,knowledge,studentKnowledge,detections};
}
function verifyWeighted(m){
 let checked=0;
 for(const d of m.classSummary.detections){
  const rows=m.evidence.filter(x=>x.resultId===d.id); const den=rows.reduce((n,x)=>n+x.max,0), score=rows.reduce((n,x)=>n+x.score,0);
  const missing=rows.some(x=>x.expectedRate===null); const expected=rows.reduce((n,x)=>n+x.max*(x.expectedRate??0)/100,0);
  assert.ok(same(d.actual.value,den?score/den*100:null));
  assert.ok(same(d.expected.value,missing||!den?null:expected/den*100));
  assert.ok(same(d.gap.value,missing||!den?null:(score-expected)/den*100));checked++;
 }
 return checked;
}
const results=[], aggregate={};let weightedChecks=0;
for(const packageId of workspaceDatasetCatalog.map(x=>x.id)){
 for(const seedVersion of [1,2,3,4,5]){
  const base=buildWorkspaceDataset(packageId,seedVersion).state;
  const baseHash=digest(base);
  const variants=Object.fromEntries(['direct-replace-existing-only','priority-with-fixed-retest-eligibility','priority-raw-current-selector'].map(p=>[p,cloneWithPolicy(base,p)]));
  const contexts=viewableContexts(base);
  const unique=new Map(contexts.map(c=>[JSON.stringify([c.classId,c.subject]),c]));
  for(const context of unique.values()){
    const scope={...defaultLearningScope(base),...scopeForContext(base,context.id)};
    const beforeModel=selectLearningAnalysis(base,scope),before=summarize(beforeModel);
    weightedChecks+=verifyWeighted(beforeModel);
    const comparisons={};
    for(const [name,value]of Object.entries(variants)){
      const model=selectLearningAnalysis(value.state,scope),after=summarize(model);weightedChecks+=verifyWeighted(model);
      comparisons[name]=delta(before,after);
    }
    results.push({packageId,seedVersion,contextId:context.id,className:context.className,subject:context.subject,scope,baselineHash:baseHash,answerCount:before.evidenceCount,baseline:{studentCount:Object.keys(before.students).length,knowledgeCount:Object.keys(before.knowledge).length,studentKnowledgeCount:Object.keys(before.studentKnowledge).length,detections:before.detections},comparisons});
  }
  aggregate[packageId+'@'+seedVersion]={sourceFacts:base.learningFacts?.detections.length??0,authoredRegisteredRows:variants['priority-with-fixed-retest-eligibility'].registrations.length,registrationSha256:digest(variants['priority-with-fixed-retest-eligibility'].registrations),changes:Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,v.changes])),frozenIneligibleLinks:variants['priority-with-fixed-retest-eligibility'].frozenIneligibleLinks};
  assert.equal(digest(base),baseHash,'Seed baseline mutated');
 }
}
metadata.headAtEnd=git('rev-parse','HEAD');metadata.dirtyAtEnd=git('status','--porcelain');
metadata.hashesStable=[...sources].every(([f,h])=>sha(fs.readFileSync(source(f)))===h);
assert.equal(metadata.hashesStable,true,'Source files changed during replay; rerun on stable sources');
metadata.replayScriptSha256=sha(fs.readFileSync(fileURLToPath(import.meta.url)));
const totals={};
for(const group of ['current-v5','legacy-v1-v3','all-v1-v5']){
 const rows=results.filter(r=>group==='current-v5'?r.seedVersion===5:group==='legacy-v1-v3'?r.seedVersion<=3:true);
 const variants={};
 for(const name of ['direct-replace-existing-only','priority-with-fixed-retest-eligibility','priority-raw-current-selector']){
  const sums={}; for(const row of rows){for(const [k,v]of Object.entries(row.comparisons[name].counts))sums[k]=(sums[k]??0)+v;}
  variants[name]=sums;
 }
 const den={};for(const row of rows){for(const [k,v]of Object.entries(row.comparisons['direct-replace-existing-only'].denominators))den[k]=(den[k]??0)+v;}
 totals[group]={scopeCount:rows.length,denominators:den,variants};
}
const output={metadata,policy:{priority:['qualified version-pinned per-item expectation (including explicitly registered legacy seed adapter)','approved 80/60/40 lookup from exact saved question version difficulty','incomparable'],classificationRule:'Unmodified current source selectors; v0.7 full measurement implementation is NOT claimed',expectedOnly:'Fixed-retetest scenario keeps original qualification. Raw scenario demonstrates existing selector coupling risk.',unit:'student/context/package/seed; no claim of distinct real students across packages or versions'},weightedChecks,totals,packages:aggregate,results};
fs.writeFileSync(path.join(out,'review-v07r1-expected-impact.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({metadata:{...metadata,sourceHashes:undefined},weightedChecks,totals},null,2));
