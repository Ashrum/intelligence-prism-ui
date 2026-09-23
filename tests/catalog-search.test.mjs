import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { components, searchComponents } from '../lib/prism-next/catalog.ts'

for (const query of ['执行确认', '任务进度', '上下文摘要', '摘要预览', 'AgentExecutionConfirmation']) {
  test(`semantic catalog query ${query} reaches the existing Agent sample`, () => {
    const results = searchComponents(query)
    assert.ok(results.length >= 1)
    const agent = results.find(result => result.item.id === 'agent-components')
    assert.equal(agent?.href, '/next/components/agent-components#context-summary-review')
    const demo = readFileSync(new URL('../components/prism-next/demos/agent-semantic-group.tsx', import.meta.url), 'utf8')
    assert.ok(demo.includes('id="context-summary-review"'))
  })
}

test('semantic aliases preserve 80 entries, deduplicate hits and support trimmed case-insensitive search', () => {
  assert.equal(components.length, 80)
  assert.equal(searchComponents('').length, 80)
  assert.equal(searchComponents('AgentExecution').length, 1)
  assert.equal(searchComponents('  agentexecutionconfirmation  ')[0].href, '/next/components/agent-components#context-summary-review')
  assert.equal(searchComponents('Agent')[0].item.id, 'agent-components')
  assert.equal(searchComponents('完全无匹配的名称').length, 0)
  assert.equal(searchComponents('Dialog 对话框')[0].href, '/next/components/dialog')
})
