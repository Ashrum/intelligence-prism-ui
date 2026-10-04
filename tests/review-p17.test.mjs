import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {api,h,render,capture,noop,rail,classRail} from './review-p17-harness.mjs';
const marker={icon:h('svg',{'data-test-icon':true}),ariaLabel:'待确认',tooltip:'核对原卷与长中文公式',tone:'warning'};
for(const name of ['QuestionRail','QuestionRailClass']) for(const layout of ['cell','row']) test(`P17 ${name} ${layout} marker preserves grid sizing, names and selection intent`,()=>{
 const calls=[];
 const item={id:'a',number:17,value:'6 分',denominator:12,tone:'neutral',ratio:50,ariaLabel:'第 17 题，6 分',tooltip:'本题评分依据',marker};
 const props=name==='QuestionRail'?{...rail,sections:[{id:'s',label:'题目',layout,pages:[{id:'p',items:[item]}]}]}:{...classRail,sections:[{id:'s',label:'题目',layout,items:[item]}]};
 props.onSelect=id=>calls.push(id);
 const out=capture(api[name],props);
 assert.match(out.html,/aria-label="第 17 题，6 分，待确认"/);
 assert.match(out.html,/aria-hidden="true" data-question-marker="true"/);
 assert.match(out.html,/absolute right-0 top-0/);
 assert.match(out.html,/text-warning/);
 assert.doesNotMatch(out.html,/>待确认</); // short status stays out of the cell
 const trigger=out.nodes.find(n=>n.type===api.TooltipTrigger);
 trigger.props.render.props.onClick();assert.deepEqual(calls,['a']);
 const tooltip=out.nodes.find(n=>n.type===api.TooltipPopup);
 assert.match(render(tooltip.props.children),/本题评分依据.*核对原卷与长中文公式/);
 const oldItem={...item,marker:undefined};
 const oldProps=name==='QuestionRail'?{...props,sections:[{...props.sections[0],pages:[{id:'p',items:[oldItem]}]}]}:{...props,sections:[{...props.sections[0],items:[oldItem]}]};
 const oldTrigger=capture(api[name],oldProps).nodes.find(n=>n.type===api.TooltipTrigger);
 assert.equal(trigger.props.render.props.className.replace('d1-question relative h-auto','d1-question h-auto'),oldTrigger.props.render.props.className.replace('d1-question relative h-auto','d1-question h-auto'));
 assert.equal(capture(api[name],props).html,out.html,'intent does not clear the marker');
});
test('P17 marker defaults and existing class boolean marker stay distinct',()=>{
 const item={...classRail.sections[0].items[0],marker:{icon:marker.icon,ariaLabel:'待处理'}};
 const props={...classRail,sections:[{id:'s',label:'题目',layout:'cell',items:[item]}]};
 const out=capture(api.QuestionRailClass,props);
 assert.match(out.html,/text-muted-foreground/);
 assert.match(render(out.nodes.find(n=>n.type===api.TooltipPopup).props.children),/待处理/);
 const legacy=render(h(api.QuestionRailClass,{...props,sections:[{...props.sections[0],items:[{...item,marker:true}]}]}));
 assert.match(legacy,/size-1.5 rounded-full bg-info/);assert.doesNotMatch(legacy,/data-question-marker/);
});
const score={...api.scoreReviewBase,density:'compact',standardAnswer:'参考答案全文',onSave:noop};
test('P17 long sections use standard keyboard-focusable coss buttons, host initial state and linked ARIA',()=>{
 for(const open of [false,true]) {
  const html=render(h(api.ScoreReview,{...score,sectionsDefaultOpen:{answer:open,standardAnswer:open,history:open}}));
  const triggers=[...html.matchAll(/<button[^>]*data-slot="collapsible-trigger"[^>]*>[\s\S]*?<\/button>/g)].map(m=>m[0]);
  assert.equal(triggers.length,3);
  for(const trigger of triggers){
   assert.match(trigger,/type="button"/);assert.match(trigger,/tabindex="0"/);assert.match(trigger,new RegExp(`aria-expanded="${open}"`));
   if(open){const id=trigger.match(/aria-controls="([^"]+)"/)[1];assert.ok(html.includes(`id="${id}"`));}
  }
  if(open){assert.match(html,/参考答案全文/);assert.match(html,/过往评分/);assert.match(html,/motion-reduce:transition-none/);}
  else {assert.doesNotMatch(html,/参考答案全文|过往评分/);}
 }
 const out=capture(api.ScoreReview,score);
 for(const trigger of out.nodes.filter(n=>n.type===api.CollapsibleTrigger)) assert.equal(trigger.props.render.type,api.Button);
 // No custom key handler intercepts native Enter/Space or Tab on the collapsible.
 for(const trigger of out.nodes.filter(n=>n.type===api.CollapsibleTrigger)) assert.equal(trigger.props.onKeyDown,undefined);
 const mixed=render(h(api.ScoreReview,{...score,sectionsDefaultOpen:{answer:true,history:false}}));
 assert.equal((mixed.match(/aria-expanded="true"/g)||[]).length,1);
});
test('P17 hidden identity retains the panel accessible name and a visible focus target',()=>{
 const out=capture(api.ScoreReview,{...score,showIdentity:false,questionId:'s-q',focusOnQuestionChange:true});
 assert.match(out.html,/<header class="sr-only">/);
 assert.match(out.html,/<section aria-labelledby="[^"]+" tabindex="-1"/);
 assert.match(out.html,/李华 · 主观题 3/);
});
test('P17 compact preserves gate, shortcut intents, draft and all standard control sizes',()=>{
 const calls=[];
 const props={...score,shortcuts:true,score:7,reason:'已核对',onSave:d=>calls.push(d)};
 const out=capture(api.ScoreReview,props);
 const save=out.nodes.find(n=>n.type===api.Button && React.Children.toArray(n.props.children).includes('保存并处理下一份'));
 save.props.onClick();
 const key=out.nodes.find(n=>n.props['data-score-review']!==undefined).props.onKeyDown;
 key({key:'Enter',ctrlKey:true,nativeEvent:{},preventDefault(){}});
 assert.deepEqual(calls,[{score:7,reason:'已核对'},{score:7,reason:'已核对'}]);
 assert.equal(capture(api.ScoreReview,props).html,out.html);
 const blocked=capture(api.ScoreReview,{...props,saveDisabledReason:'版本待核对'});
 blocked.nodes.find(n=>n.props['data-score-review']!==undefined).props.onKeyDown({key:'Enter',ctrlKey:true,nativeEvent:{},preventDefault(){}});
 assert.equal(calls.length,2);assert.match(blocked.html,/版本待核对/);
 const defaults=capture(api.ScoreReview,{...props,density:'default'});
 const namedButtons=o=>o.nodes.filter(n=>n.type===api.Button).map(n=>[n.props.className,n.props.disabled]);
 // All scoring and history buttons retain their original dimensions.
 assert.deepEqual(namedButtons(out).slice(-3),namedButtons(defaults).slice(-3));
 assert.match(out.html,/min-h-11 h-11 sm:h-11/);
});
for(const [name,props] of [['ErrorCauseReview',{categories:api.errorCauseReviewCategories,value:api.errorCauseReviewValue,history:api.errorCauseReviewHistory,onEdit:noop}],['ErrorCauseReview',{categories:api.errorCauseReviewCategories,value:api.errorCauseReviewValue,editing:true,draft:{category:'other',explanation:'核对'},onSave:noop,onChange:noop}],['StudentPaperReport',api.studentPaperReportFixture]]) test(`P17 ${name} compact changes layout without losing information`,()=>{
 const strip=html=>html.replace(/ class="[^"]*"/g,'');
 const standard=render(h(api[name],props)), compact=render(h(api[name],{...props,density:'compact'}));
 assert.notEqual(standard,compact);assert.equal(strip(standard),strip(compact));
});
test('P17 extension routes expose three-theme narrow examples and updated Agent Specs',async()=>{
 const {default:worker}=await import('../dist/server/index.js');
 for(const [path,title] of [['question-rail/extensions','题号格与行'],['score-review/compact','同一数据'],['error-cause-review/compact','错因核对'],['student-paper-report/compact','整卷报告']]){
  const response=await worker.fetch(new Request(`http://localhost/next/components/${path}`,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200);
  const html=await response.text();assert.ok(html.includes(title));assert.ok(html.includes('P17:'));
  for(const theme of ['light','paper','dark'])assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.ok(html.includes('320px'));assert.ok(html.includes('data-ui-version="coss-v1"'));
 }
});
