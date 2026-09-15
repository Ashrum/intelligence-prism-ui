import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateQuestionUnits} from '../lib/prism-next/question-pagination.ts';
test('pagination keeps every unit in order and respects requested page breaks without empty pages',()=>{
  const units=[{id:'header',height:20},{id:'one',height:60},{id:'two',height:50,breakBefore:true},{id:'three',height:45}];
  assert.deepEqual(paginateQuestionUnits(units,100),{pages:[['header','one'],['two','three']],oversized:[]});
  assert.deepEqual(paginateQuestionUnits([{id:'first',height:40,breakBefore:true}],100).pages,[['first']]);
});
test('headings follow their content and oversized units are flagged without silently losing content',()=>{
  assert.deepEqual(paginateQuestionUnits([{id:'previous',height:60},{id:'heading',height:20,keepWithNext:true},{id:'body',height:40}],100).pages,[['previous'],['heading','body']]);
  const result=paginateQuestionUnits([{id:'large',height:130},{id:'next',height:20}],100);
  assert.deepEqual(result,{pages:[['large'],['next']],oversized:['large']});
  assert.deepEqual(paginateQuestionUnits([],100),{pages:[],oversized:[]});
});
