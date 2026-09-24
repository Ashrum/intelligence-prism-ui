import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationReducer, demoConversations } from '../examples/skeletons/agent-review-model.ts';

test('a stopped reply ignores late completion without inventing a business outcome',()=>{
 let state=conversationReducer(demoConversations,{type:'draft',id:'new',value:'解释最小值'});
 state=conversationReducer(state,{type:'send',id:'new',messageId:'r1'});
 state=conversationReducer(state,{type:'settle',id:'new',messageId:'r1',state:'stopped',text:'停止'});
 state=conversationReducer(state,{type:'settle',id:'new',messageId:'r1',state:'ready',text:'迟到的回复'});
 assert.equal(state[0].messages.at(-1).state,'stopped');
 assert.equal(state[0].messages.at(-1).text,'停止');
 assert.equal(state[0].messages[0].text,'解释最小值');
});
test('drafts and reference snapshots remain attached to their own conversation',()=>{
 let state=conversationReducer(demoConversations,{type:'draft',id:'new',value:'请求 A'});
 state=conversationReducer(state,{type:'material',id:'new',value:true});
 state=conversationReducer(state,{type:'send',id:'new',messageId:'r2'});
 assert.equal(state.find(c=>c.id==='planning').draft,'请把问题改得更简洁一些。');
 assert.equal(state[0].messages[0].material,true);
 assert.equal(state[0].material,false);
 state=conversationReducer(state,{type:'material',id:'new',value:false});
 assert.equal(state[0].messages[0].material,true);
});
test('blank and duplicate sends cannot create extra pending replies',()=>{
 assert.deepEqual(conversationReducer(demoConversations,{type:'send',id:'new',messageId:'empty'}),demoConversations);
 let state=conversationReducer(demoConversations,{type:'draft',id:'new',value:'请求'});
 state=conversationReducer(state,{type:'send',id:'new',messageId:'r3'});
 state=conversationReducer(state,{type:'draft',id:'new',value:'重复'});
 state=conversationReducer(state,{type:'send',id:'new',messageId:'duplicate'});
 assert.equal(state[0].messages.length,2);
 assert.equal(state[0].draft,'重复');
});
test('failure in one conversation cannot finish another conversation',()=>{
 let state=conversationReducer(demoConversations,{type:'draft',id:'new',value:'请求'});
 state=conversationReducer(state,{type:'send',id:'new',messageId:'r4'});
 state=conversationReducer(state,{type:'settle',id:'planning',messageId:'r4',state:'ready',text:'wrong'});
 assert.equal(state[0].messages.at(-1).state,'replying');
 state=conversationReducer(state,{type:'settle',id:'new',messageId:'r4',state:'failed',text:'失败'});
 assert.equal(state[0].messages[0].text,'请求');
 assert.equal(state[0].messages.at(-1).state,'failed');
});
