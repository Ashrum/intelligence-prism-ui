import test from 'node:test'
import assert from 'node:assert/strict'
import { monitorState, usageText } from '../components/prism-next/skeletons/workbench-model.ts'
const task = state => ({id:state,title:'任务',state,detail:'测试'})
test('monitor prioritizes failed/attention/running over completed and does not infer completion from replies',()=>{
 assert.equal(monitorState([]),'idle')
 assert.equal(monitorState([task('completed'),task('running')]),'running')
 assert.equal(monitorState([task('running'),task('attention')]),'attention')
 assert.equal(monitorState([task('attention'),task('failed')]),'failed')
 assert.equal(monitorState([task('completed')]),'completed')
})
test('unconnected and undetermined usage never becomes a zero balance',()=>{
 const a={kind:'tokens',scope:'organization',state:'enabled',unit:'tokens',detail:''}
 assert.equal(usageText({...a,state:'disabled',value:0}),'未启用')
 assert.equal(usageText({...a,state:'unavailable',value:0}),'暂不可用')
 assert.equal(usageText({...a,scope:'undetermined',value:99}),'归属待确认')
 assert.equal(usageText(a),'数据暂不可用')
 for(const value of [-1,NaN,Infinity])assert.equal(usageText({...a,value}),'数据暂不可用')
 assert.equal(usageText({...a,value:0}),'0 tokens')
 assert.equal(usageText({...a,value:12000}),'12,000 tokens')
})
