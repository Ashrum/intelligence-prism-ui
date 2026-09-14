import assert from "node:assert/strict"
import test, { after, mock } from "node:test"
import { fileURLToPath } from "node:url"
import { createServer } from "vite"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const root = fileURLToPath(new URL("..", import.meta.url))
const vite = await createServer({ appType: "custom", cacheDir: "node_modules/.vite-test-openui-review", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false } })
after(() => vite.close())
const contract = await vite.ssrLoadModule("/lib/openui/review-contract.ts")
// Match the Workers module-evaluation restriction that caused the deployed 1101.
const randomDuringImport = mock.method(globalThis.crypto, "randomUUID", () => { throw new Error("Randomness during module evaluation") })
let reviewModule
try {
  reviewModule = await vite.ssrLoadModule("/components/prism/openui-review-library.tsx")
} finally {
  randomDuringImport.mock.restore()
}
const { checkRenderableReview, getReviewLibrary } = reviewModule
const reviewLibrary = getReviewLibrary()
const { handleReviewRequest } = await vite.ssrLoadModule("/lib/openui/generate-review.ts")
const { Renderer } = await import("@openuidev/react-lang")

test("library initializes after module evaluation and keeps stable renderer identity", () => {
  assert.equal(randomDuringImport.mock.callCount(), 0)
  assert.equal(getReviewLibrary(), reviewLibrary)
})

test("all task layouts render complete host evidence through the real OpenUI parser and Renderer", () => {
  for (const task of contract.tasks) {
    const checked = checkRenderableReview(contract.fixedResponse(task.value))
    assert.deepEqual(checked.order, [...task.order])
    const html = renderToStaticMarkup(React.createElement(Renderer, { response: checked.response, library: reviewLibrary, isStreaming: false, publishObservability: false }))
    for (const title of ["候选说明", "证据", "结论的局限"]) assert.ok(html.includes(title))
    assert.ok(html.includes("18 / 22"))
    assert.ok(html.includes("OCR"))
    assert.equal((html.match(/data-slot="object-card"/g) || []).length, 3)
  }
})

test("rejects partial, dropped, executable and ambiguous statements before rendering", () => {
  const valid = contract.fixedResponse("explain")
  const invalid = [
    valid.replace("limits = Limits()", ""), valid.slice(0, -1),
    valid.replace("summary, evidence, limits", "summary, evidence, evidence"),
    valid.replace("Candidate(", "Unknown("), valid.replaceAll('"E2"', '"E3"'),
    valid + "\nlimits = Limits()", valid + '\nq = Query("secret", {})',
    valid.replace("Limits()", 'Limits(Mutation("write", {}))'),
    valid.replace("Limits()", "Limits(@Run(write))"),
    valid.replace("Limits()", 'Limits("extra")'),
    valid.replace("summary, evidence, limits", "summary, evidence, missing"),
    valid.replace(/Candidate\("[^\"]+"/, "Candidate($draft"),
  ]
  let lastGood = checkRenderableReview(valid)
  for (const input of invalid) {
    assert.throws(() => { lastGood = checkRenderableReview(input) })
    assert.equal(lastGood.response, valid)
  }
})

test("draft, origin and review belong to the host; candidate updates cannot overwrite dirty input", () => {
  const reduce = contract.reviewReducer
  let state = reduce(contract.initialReview(), { type: "review" })
  const reviewed = state.record
  state = reduce(state, { type: "edit", text: "人工补充的草稿" })
  const dirty = state
  state = reduce(state, { type: "candidate", text: "new model text", source: "model" })
  assert.equal(state, dirty)
  assert.equal(reduce(state, { type: "review" }), state)
  state = reduce(state, { type: "apply" })
  assert.equal(state.record.reviewed, false)
  assert.equal(state.record.source, "sample")
  assert.equal(state.record.edited, true)
  state = reduce(state, { type: "undo" })
  assert.deepEqual(state.record, reviewed)
  state = reduce(state, { type: "candidate", text: "model candidate", source: "model" })
  assert.equal(state.record.reviewed, true)
  state = reduce(state, { type: "apply" })
  assert.equal(state.record.source, "model")
  assert.equal(state.record.reviewed, false)
  assert.equal(state.record.edited, false)
  state = reduce(state, { type: "edit", text: "revised model candidate" })
  state = reduce(state, { type: "apply" })
  assert.equal(state.record.source, "model")
  assert.equal(state.record.edited, true)
})

const env = { OPENAI_API_KEY: "test-only-key", OPENUI_MODEL: "test-model", OPENUI_REVIEWER_EMAILS: "reviewer@example.test" }
function request(body = { task: "explain" }, extraHeaders = {}) {
  return new Request("https://site.example/api/openui-review", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://site.example", "oai-authenticated-user-email": "reviewer@example.test", ...extraHeaders }, body: JSON.stringify(body) })
}
test("generation stays unavailable without config, reviewer identity or same-origin request", async () => {
  const noCall = () => { throw new Error("unexpected upstream call") }
  assert.equal((await handleReviewRequest(request(), {}, noCall)).status, 503)
  assert.equal((await handleReviewRequest(request({}, { "oai-authenticated-user-email": "" }), env, noCall)).status, 403)
  assert.equal((await handleReviewRequest(request({}, { Origin: "https://elsewhere.example" }), env, noCall)).status, 403)
  assert.equal((await handleReviewRequest(request({ task: "execute", prompt: "extra" }), env, noCall)).status, 400)
  const status = await handleReviewRequest(new Request("https://site.example/api/openui-review"), {})
  assert.deepEqual(await status.json(), { configured: false, authenticated: false, ready: false })
  for (const [email, authenticated, ready] of [["", false, false], ["other@example.test", true, false], ["reviewer@example.test", true, true]]) {
    const status = await handleReviewRequest(new Request("https://site.example/api/openui-review", { headers: { "oai-authenticated-user-email": email } }), env, noCall)
    assert.equal(status.headers.get("Cache-Control"), "no-store")
    assert.deepEqual(await status.json(), { configured: true, authenticated, ready })
  }
})

test("adapter only returns completed validated model text; truncation and tool-only outputs fail closed", async () => {
  const result = (status, text) => async (_url, init) => {
    const payload = JSON.parse(init.body)
    assert.equal(payload.store, false)
    assert.equal(payload.tools, undefined)
    assert.equal(payload.model, "test-model")
    return Response.json({ status, output: [{ type: "message", content: [{ type: "output_text", text }] }] })
  }
  const response = await handleReviewRequest(request(), env, result("completed", contract.fixedResponse("explain")))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).source, "model")
  assert.equal((await handleReviewRequest(request(), env, result("incomplete", contract.fixedResponse("explain")))).status, 502)
  assert.equal((await handleReviewRequest(request(), env, result("completed", "root = Query()"))).status, 502)
  assert.equal((await handleReviewRequest(request(), env, async () => Response.json({ status: "completed", output: [{ type: "function_call" }] }))).status, 502)
})

test("generation failures distinguish provider limits from output validation without leaking provider content", async t => {
  const warnings = t.mock.method(console, "warn", () => {})
  const privateMessage = "private-provider-message-test-only-key"
  for (const [status, code, expected] of [
    [401, "invalid_api_key", "model_auth_failed"],
    [403, "unknown", "model_access_denied"],
    [404, "model_not_found", "model_unavailable"],
    [404, "unknown", "model_request_rejected"],
    [429, "insufficient_quota", "quota_exceeded"],
    [429, "credit_balance_exhausted", "quota_exceeded"],
    [429, "project_spend_limit_exceeded", "quota_exceeded"],
    [429, "rate_limit_exceeded", "rate_limited"],
    [429, "unknown", "model_limit_unknown"],
    [503, "server_is_overloaded", "upstream_unavailable"],
  ]) {
    const response = await handleReviewRequest(request(), env, async () => Response.json({ error: { code, message: privateMessage } }, { status }))
    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { error: expected })
  }
  const invalid = await handleReviewRequest(request(), env, async () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: privateMessage }] }] }))
  assert.deepEqual(await invalid.json(), { error: "invalid_model_output" })
  const logText = JSON.stringify(warnings.mock.calls.map(call => call.arguments))
  assert.equal(logText.includes(privateMessage), false)
  assert.equal(logText.includes(env.OPENAI_API_KEY), false)
})
