import test from 'node:test';
import assert from 'node:assert/strict';
import {createReviewEditor,getReviewStatus} from '../lib/prism-next/question-review-model.ts';
import {addToPaper,moveInPaper,replaceInPaper,entryPoints,reviewError,createQuestionWorkspace,addBasketItems,transferToDraft,removeFromScope,copyDraft,workspaceReducer} from '../lib/prism-next/question-workspace.ts';

test('whole composite selections deduplicate without sharing score overrides with the question definition',()=>{
  const source={id:'composite',points:16,partPoints:{'1':4,'2':4,'3':8}};
  const result=addToPaper([], [source,source]);
  assert.equal(result.length,1);result[0].partPoints['3']=10;
  assert.equal(entryPoints(result[0]),18);assert.equal(source.partPoints['3'],8);
  assert.equal(addToPaper(result,[source]).length,1);
});
test('paper moves preserve score and replacements preserve position while avoiding duplicates',()=>{
  const entries=[{id:'a',points:5},{id:'b',points:8},{id:'c',points:6}];
  assert.deepEqual(moveInPaper(entries,'b',-1).map(item=>item.id),['b','a','c']);
  assert.deepEqual(moveInPaper(entries,'a',-1),entries);
  assert.deepEqual(replaceInPaper(entries,'b',{id:'d',points:16}),[entries[0],{id:'d',points:16},entries[2]]);
  assert.deepEqual(replaceInPaper(entries,'b',{id:'a',points:5}),entries);
});
test('review permits unchanged confirmation and requires a reason for score changes',()=>{
  const original={choice:4,domain:0,maximum:2},limits={choice:4,domain:2,maximum:2};
  assert.equal(reviewError(original,limits,original,''),'');
  assert.match(reviewError({...original,domain:1},limits,original,''),/理由/);
  assert.equal(reviewError({...original,domain:1},limits,original,'补充过程有部分依据'),'');
  for(const value of [null,-1,3,NaN,0.2]) assert.match(reviewError({...original,domain:value},limits,original,'理由'),/范围/);
  assert.equal(original.maximum,2);
});

test('matching initial scores including zero remain pending until explicitly confirmed',()=>{
  const editor=createReviewEditor({a:0,b:0});
  assert.equal(getReviewStatus(editor,{a:2,b:2}).state,'pending');
  assert.deepEqual(getReviewStatus(editor,{a:2,b:2}).missing,[]);
});
test('offsetting criterion edits still require confirmation and a nonblank reason',()=>{
  const editor={...createReviewEditor({a:1,b:1}),scores:{a:2,b:0}};
  const limits={a:2,b:2};
  assert.equal(getReviewStatus(editor,limits).state,'changed');
  assert.deepEqual(getReviewStatus(editor,limits).changed,['a','b']);
  for(const reason of ['', '  ']) assert.match(reviewError(editor.scores,limits,editor.saved,reason),/理由/);
  assert.equal(reviewError(editor.scores,limits,editor.saved,'重新核对两个评分点'), '');
});
test('missing and invalid criteria take priority over old records and score equality',()=>{
  const base={...createReviewEditor({a:1,b:1}),record:'已确认'};
  for(const scores of [{a:2,b:null},{a:2}]) {
    const editor={...base,scores};
    assert.equal(getReviewStatus(editor,{a:2,b:2}).state,'incomplete');
    assert.match(reviewError(scores,{a:2,b:2},base.saved,''),/范围/);
  }
  assert.equal(getReviewStatus({...base,scores:{a:NaN,b:2}},{a:2,b:2}).state,'invalid');
});
test('confirmed scores become the comparison baseline even when different from initial scores',()=>{
  const editor={...createReviewEditor({a:0}),scores:{a:1},saved:{a:1},record:'补充依据后调整'};
  assert.equal(getReviewStatus(editor,{a:2}).state,'confirmed');
  assert.equal(reviewError(editor.scores,{a:2},editor.saved,''),'');
  const changed={...editor,scores:{a:0}};
  assert.equal(getReviewStatus(changed,{a:2}).state,'changed');
  assert.match(reviewError(changed.scores,{a:2},changed.saved,''),/理由/);
  assert.equal(getReviewStatus({...changed,scores:{...changed.saved},reason:'',error:''},{a:2}).state,'confirmed');
});
test('a note awaiting submission does not claim a score difference or confirmed state',()=>{
  const editor={...createReviewEditor({a:1}),record:'已确认',reason:'补充说明'};
  assert.equal(getReviewStatus(editor,{a:2}).state,'note');
  assert.deepEqual(getReviewStatus(editor,{a:2}).changed,[]);
});

test('basket, paper and practice retain independent whole-question selections and score overrides',()=>{
  const source={id:'composite',points:16,partPoints:{'1':4,'2':4,'3':8}};
  let workspace=addBasketItems(createQuestionWorkspace(),['composite','composite']);
  workspace=transferToDraft(workspace,'paper',[source]);
  workspace=transferToDraft(workspace,'practice',[source]);
  assert.deepEqual(workspace.basket,['composite']);
  workspace.paper.entries[0].partPoints['3']=10;
  assert.equal(workspace.practice.entries[0].partPoints['3'],8);
  assert.equal(source.partPoints['3'],8);
  const removed=removeFromScope(workspace,'paper',['composite']);
  assert.equal(removed.paper.entries.length,0);
  assert.equal(removed.practice.entries.length,1);
  assert.deepEqual(removed.basket,['composite']);
  assert.equal(removeFromScope(workspace,'basket',['composite']).paper.entries.length,1);
});
test('draft snapshots isolate later editing and undo restores replacement position, grouping and scores',()=>{
  let workspace=transferToDraft(createQuestionWorkspace(),'paper',[{id:'a',points:5},{id:'b',points:8,partPoints:{'1':8},group:'第二部分'}]);
  const saved=copyDraft(workspace.paper);
  const replacement={...workspace,paper:{...workspace.paper,entries:[workspace.paper.entries[0],{id:'c',points:6,group:'第二部分'}]}};
  let state=workspaceReducer({present:workspace,past:[],message:''},{type:'apply',workspace:replacement,label:'替换本卷题目'});
  state=workspaceReducer(state,{type:'undo'});
  assert.deepEqual(state.present.paper.entries,saved.entries);
  assert.equal(state.present.paper.entries[1].partPoints['1'],8);
  assert.equal(state.present.paper.entries[1].group,'第二部分');
  workspace.paper.entries[1].partPoints['1']=9;
  workspace.paper.groups[0]='新名称';
  assert.equal(saved.entries[1].partPoints['1'],8);
  assert.equal(saved.groups[0],'第一部分');
});
