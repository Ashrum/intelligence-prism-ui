import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleTask, parsingReducer as reduce, startProblem, saveProblem, missingSource, restoreTask, taskInstruction } from '../examples/teacher-use-cases/parsing-model.ts'
const finish=t=>{t=reduce(t,{type:'start'});while(t.stage==='processing')t=reduce(t,{type:'advance'});return t}
const checkAll=t=>t.questions.reduce((state,q)=>reduce(state,{type:'check',id:q.id}),t)

test('student work needs an explicit purpose and grading handoff never becomes a question result',()=>{
 let t=sampleTask('student');assert.match(startProblem(t),/用途|作答/);assert.equal(reduce(t,{type:'start'}).stage,'scope')
 t=reduce(t,{type:'scope',purpose:'student'});t=finish(t);assert.equal(t.stage,'handoff');assert.equal(t.questions.length,0);assert.equal(t.version,0)
})
test('scan quality and grouping must be resolved before parsing',()=>{
 let t=sampleTask('scan');assert.ok(startProblem(t));t=reduce(t,{type:'scope',grouping:'one'});assert.match(startProblem(t),/模糊/)
 t=reduce(t,{type:'replace',id:'p3'});assert.equal(startProblem(t),'');assert.equal(finish(t).questions.length,2)
})
test('missing cross-page content blocks saving even when the existing candidates are checked',()=>{
 let t=sampleTask('images');t=reduce(t,{type:'select-page',id:'p3',selected:false});t=checkAll(finish(t));assert.equal(t.questions.length,1);assert.ok(missingSource(t));assert.match(saveProblem(t),/跨页题/);assert.equal(reduce(t,{type:'save',at:'test'}).version,0)
})
test('retry preserves confirmed edits from successful pages and never duplicates them',()=>{
 let t=finish(reduce(sampleTask('pdf'),{type:'failure',value:true}));assert.equal(t.pages.filter(p=>p.status==='failed').length,1)
 t=reduce(t,{type:'edit',id:'q1',stem:'人工核对后的题干'});t=reduce(t,{type:'check',id:'q1'});assert.ok(saveProblem(t))
 t=reduce(t,{type:'retry'});while(t.stage==='processing')t=reduce(t,{type:'advance'});assert.equal(t.questions.length,2);assert.equal(t.questions[0].stem,'人工核对后的题干');assert.ok(t.questions[0].checked);assert.equal(t.pages.filter(p=>p.status==='failed').length,0)
})
test('editing a confirmed question requires renewed review and saving is idempotent',()=>{
 let t=checkAll(finish(sampleTask('single')));t=reduce(t,{type:'edit',id:'q1',stem:'修订题干'});assert.ok(saveProblem(t));t=checkAll(t);t=reduce(t,{type:'save',at:'test'});assert.equal(t.version,1);assert.equal(reduce(t,{type:'save',at:'test-again'}).version,1)
})
test('a confirmed result snapshot survives an unsaved revision and page replacement retains previous draft',()=>{
 let t=reduce(checkAll(finish(sampleTask('single'))),{type:'save',at:'test'});const original=t.savedResult.questions[0].stem;t=reduce(t,{type:'revise'});t=reduce(t,{type:'edit',id:'q1',stem:'未保存的修订'});assert.equal(t.savedResult.questions[0].stem,original)
 t=reduce(t,{type:'replace',id:'p1'});assert.equal(t.previousQuestions[0].stem,'未保存的修订');assert.equal(t.questions.length,0);while(t.stage==='processing')t=reduce(t,{type:'advance'});assert.equal(t.questions[0].checked,false);assert.equal(t.savedResult.questions[0].stem,original)
})
test('provided answers require explicit mapping; parsing does not invent absent answers',()=>{
 let t=checkAll(finish(sampleTask('answers')));assert.match(saveProblem(t),/参考答案/);t=reduce(t,{type:'link-answer',value:true});assert.ok(saveProblem(t));t=checkAll(t);assert.equal(saveProblem(t),'');assert.ok(t.questions.every(q=>q.answer.length>0));assert.ok(finish(sampleTask('images')).questions.every(q=>q.answer===''))
})
test('invalid stored snapshots fall back safely and valid progress can be restored',()=>{
 assert.equal(restoreTask('broken'),null);assert.equal(restoreTask('{"schema":1}'),null);const t=finish(sampleTask('single'));assert.deepEqual(restoreTask(JSON.stringify(t)),t)
})

test('clarification preserves extra requirements without starting work and records them in the reusable instruction',()=>{
 let t=reduce(sampleTask('images'),{type:'scope',requirements:'保留题号与分值。'});assert.equal(t.stage,'scope');assert.match(taskInstruction(t),/补充要求：保留题号与分值/);assert.deepEqual(restoreTask(JSON.stringify(t)),t)
 t=reduce(t,{type:'scope',requirements:'长'.repeat(501)});assert.equal(t.requirements.length,500);assert.equal(restoreTask(JSON.stringify({...t,requirements:{}})),null)
})
test('proposed changes cannot overwrite later manual edits and accepted changes require renewed checking',()=>{
 let t=checkAll(finish(sampleTask('single')));const before=t.questions[0].stem,after=before.replace('。求','。\n求');
 const edited=reduce(t,{type:'edit',id:'q1',stem:'教师新修订'});const stale=reduce(edited,{type:'apply-change',id:'q1',before,after});assert.equal(stale.questions[0].stem,'教师新修订');
 t=reduce(t,{type:'apply-change',id:'q1',before,after});assert.equal(t.questions[0].stem,after);assert.equal(t.questions[0].checked,false);assert.ok(saveProblem(t));
 const saved=reduce(checkAll(t),{type:'save',at:'test'});assert.equal(reduce(saved,{type:'apply-change',id:'q1',before:after,after:'覆盖保存'}).questions[0].stem,after)
})
