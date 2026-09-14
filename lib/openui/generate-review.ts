import { evidence, fixedResponse, limitations, tasks, validateReview } from "./review-contract"
import type { Task } from "./review-contract"

export type ReviewEnv = { OPENAI_API_KEY?: string; OPENUI_MODEL?: string; OPENUI_REVIEWER_EMAILS?: string }
const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" }
function reply(body: unknown, status = 200) { return Response.json(body, { status, headers }) }
function generationFailure(reason: string, upstreamStatus?: number, validationRule?: string) {
  // Log only our own categories and the HTTP status, never provider messages or model text.
  console.warn("openui_generation_failed", { reason, upstreamStatus, validationRule })
  return reply({ error: reason }, 502)
}

// Called only in the Worker. Credentials and account allowlist never enter the client bundle.
// Sites supplies the authenticated-user header; do not trust this endpoint behind an untrusted proxy.
export async function handleReviewRequest(request: Request, env: ReviewEnv, fetchModel: typeof fetch = fetch): Promise<Response> {
  const configured = Boolean(env.OPENAI_API_KEY && env.OPENUI_MODEL && env.OPENUI_REVIEWER_EMAILS?.trim())
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase()
  const permitted = Boolean(email && env.OPENUI_REVIEWER_EMAILS?.split(",").map(value => value.trim().toLowerCase()).includes(email))
  if (request.method === "GET") return reply({ configured, authenticated: Boolean(email), ready: configured && permitted })
  if (request.method !== "POST") return reply({ error: "method_not_allowed" }, 405)
  if (!configured) return reply({ error: "model_not_configured" }, 503)
  if (!permitted) return reply({ error: "reviewer_required" }, 403)
  if (request.headers.get("Origin") !== new URL(request.url).origin) return reply({ error: "origin_mismatch" }, 403)
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return reply({ error: "invalid_request" }, 400)
  let task: Task
  try {
    const raw = await request.text()
    if (raw.length > 200) return reply({ error: "invalid_request" }, 400)
    const data = JSON.parse(raw)
    if (!data || Object.keys(data).length !== 1 || !tasks.some(item => item.value === data.task)) return reply({ error: "invalid_task" }, 400)
    task = data.task
  } catch { return reply({ error: "invalid_request" }, 400) }
  const controller = new AbortController()
  const abort = () => controller.abort()
  request.signal.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(abort, 30000)
  let stage: "request" | "response" | "validation" = "request"
  try {
    const upstream = await fetchModel("https://api.openai.com/v1/responses", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.OPENAI_API_KEY}` }, signal: controller.signal,
      body: JSON.stringify({
        model: env.OPENUI_MODEL, store: false, max_output_tokens: 1800,
        instructions: "你是教学证据阅读助手。输出以下受控 OpenUI Lang v1 的四行语句，不加代码围栏、空行或解释。仅可调整 root 数组内 summary/evidence/limits 的顺序，并改写 Candidate 第一个参数（一个 JSON 字符串，中文，最多800字）。其余内容逐字保留。三个区块各出现一次。禁止新增组件、参数、绑定、状态、Query、Mutation、动作或外部链接。候选说明必须基于给定证据，明确局限，不编造数字、趋势、来源或复核状态。不要输出个人信息。",
        input: `任务：${tasks.find(item => item.value === task)!.label}\n证据：${JSON.stringify(evidence)}\n局限：${limitations}\n格式：\n${fixedResponse(task)}`,
      }),
    })
    if (!upstream.ok) {
      const error = await upstream.json().catch(() => null) as { error?: { code?: string; type?: string } } | null
      const code = error?.error?.code
      const quotaCodes = ["insufficient_quota", "credit_balance_exhausted", "organization_spend_limit_exceeded", "project_spend_limit_exceeded", "organization_usage_limit_exceeded"]
      const quota = quotaCodes.includes(code || "") || (!code && error?.error?.type === "insufficient_quota")
      const rateLimited = ["slow_down", "rate_limit_exceeded", "rate_limit_error"].includes(code || "") || error?.error?.type === "rate_limit_error"
      const reason = upstream.status === 401 ? "model_auth_failed"
        : code === "model_not_found" ? "model_unavailable"
        : upstream.status === 403 ? "model_access_denied"
        : upstream.status === 429 ? quota ? "quota_exceeded" : rateLimited ? "rate_limited" : "model_limit_unknown"
        : upstream.status === 400 || upstream.status === 404 ? "model_request_rejected"
        : "upstream_unavailable"
      return generationFailure(reason, upstream.status)
    }
    stage = "response"
    const data = await upstream.json() as { status?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }
    if (data?.status !== "completed") return generationFailure("incomplete_generation", upstream.status)
    const text = (data.output || []).filter(item => item.type === "message").flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text || "").join("")
    stage = "validation"
    try {
      const checked = validateReview(text)
      return reply({ response: checked.response, source: "model" })
    } catch (error) {
      const rules = new Map([
        ["Invalid response size", "response_size"],
        ["Expected exactly four statements", "statement_count"],
        ["Required blocks missing or duplicated", "required_blocks"],
        ["Invalid candidate or missing citations", "candidate_citations"],
        ["Invalid candidate text", "candidate_text"],
        ["Authoritative evidence changed", "host_evidence"],
      ])
      return generationFailure("invalid_model_output", upstream.status, error instanceof Error ? rules.get(error.message) || "invalid_json_string" : "unknown")
    }
  } catch { return generationFailure(controller.signal.aborted ? "generation_timeout" : stage === "request" ? "model_connection_failed" : stage === "validation" ? "invalid_model_output" : "invalid_model_response") }
  finally { clearTimeout(timeout); request.signal.removeEventListener("abort", abort) }
}
