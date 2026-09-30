import test from 'node:test'
import assert from 'node:assert/strict'
const workerPromise = import(new URL('../dist/server/index.js', import.meta.url))
import { components, searchComponents } from '../lib/prism-next/catalog.ts'

for (const query of ['执行确认', '任务进度', '上下文摘要', '摘要预览', 'AgentExecutionConfirmation']) {
  test(`semantic catalog query ${query} reaches the existing Agent sample`, async () => {
    const results = searchComponents(query)
    assert.ok(results.length >= 1)
    const agent = results.find(result => result.item.id === 'agent-components')
    assert.equal(agent?.href, '/next/components/agent-components#context-summary-review')
    const { default: worker } = await workerPromise
    const response = await worker.fetch(new Request('http://localhost/next/components/agent-components', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} })
    assert.equal(response.status, 200)
    const demo = await response.text()
    assert.ok(demo.includes('id="context-summary-review"'))
  })
}

test('semantic aliases preserve 81 entries, deduplicate hits and support trimmed case-insensitive search', () => {
  assert.equal(components.length, 81)
  assert.equal(searchComponents('').length, 81)
  assert.equal(searchComponents('AgentExecution').length, 1)
  assert.equal(searchComponents('  agentexecutionconfirmation  ')[0].href, '/next/components/agent-components#context-summary-review')
  assert.equal(searchComponents('Agent')[0].item.id, 'agent-components')
  assert.equal(searchComponents('完全无匹配的名称').length, 0)
  assert.equal(searchComponents('Dialog 对话框')[0].href, '/next/components/dialog')
})
