import test from 'node:test'
import assert from 'node:assert/strict'
import { mapAgentProgressState, agentProgressLabels } from '../lib/prism-next/agent-progress.ts'

const contracts = {
  shell: { idle: null, queued: 'queued', running: 'running', attention: 'waiting', failed: 'failed', completed: 'completed' },
  review: { idle: null, running: 'running', confirm: 'waiting-human', completed: 'completed', stopped: null, error: 'failed' },
}

for (const [source, states] of Object.entries(contracts)) {
  test(`${source} vocabulary maps without treating idle or stop as execution receipts`, () => {
    for (const [state, expected] of Object.entries(states)) assert.equal(mapAgentProgressState({ source, state }), expected, state)
  })
}

test('terminal stop is host-handled and no current source produces paused', () => {
  assert.equal(mapAgentProgressState({ source: 'review', state: 'stopped' }), null)
  for (const [source, states] of Object.entries(contracts)) {
    for (const state of Object.keys(states)) assert.notEqual(mapAgentProgressState({ source, state }), 'paused')
  }
})

test('queued, paused and human waiting stay distinct from generic waiting and unknown receipts', () => {
  assert.deepEqual(['queued', 'paused', 'waiting-human', 'waiting', 'unknown'].map(state => agentProgressLabels[state]), ['排队中', '已暂停', '待人工处理', '等待处理', '状态未确认'])
  assert.deepEqual(['pending', 'running', 'completed', 'partial', 'failed'].map(state => agentProgressLabels[state]), ['待开始', '进行中', '已完成', '部分完成', '执行失败'])
  assert.equal('degraded' in agentProgressLabels, false)
  assert.equal('retrying' in agentProgressLabels, false)
})
