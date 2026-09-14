import { evidence, fixedResponse, limitations, tasks, validateReview } from "./review-contract"
import type { Task } from "./review-contract"

export type ReviewEnv = { OPENAI_API_KEY?: string; OPENUI_MODEL?: string; OPENUI_REVIEWER_EMAILS?: string }
const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" }
function reply(body: unknown, status = 200) { return Response.json(body, { status, headers }) }

// Called only in the Worker. Credentials and account allowlist never enter the client bundle.
// Sites supplies the authenticated-user header; do not trust this endpoint behind an untrusted proxy.
export async function handleReviewRequest(request: Request, env: ReviewEnv, fetchModel: typeof fetch = fetch): Promise<Response> {
  const configured = Boolean(env.OPENAI_API_KEY && env.OPENUI_MODEL && env.OPENUI_REVIEWER_EMAILS?.trim())
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase()
  const permitted = Boolean(email && env.OPENUI_REVIEWER_EMAILS?.split(",").map(value => value.trim().toLowerCase()).includes(email))
  if (request.method === "GET") return reply({ configured, ready: configured && permitted })
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
  try {
    const upstream = await fetchModel("https://api.openai.com/v1/responses", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.OPENAI_API_KEY}` }, signal: controller.signal,
      body: JSON.stringify({
        model: env.OPENUI_MODEL, store: false, max_output_tokens: 1800,
        instructions: "你是教学证据阅读助手。输出以下受控 OpenUI Lang v1 的四行语句，不加代码围栏、空行或解释。仅可调整 root 数组内 summary/evidence/limits 的顺序，并改写 Candidate 第一个参数（一个 JSON 字符串，中文，最多800字）。其余内容逐字保留。三个区块各出现一次。禁止新增组件、参数、绑定、状态、Query、Mutation、动作或外部链接。候选说明必须基于给定证据，明确局限，不编造数字、趋势、来源或复核状态。不要输出个人信息。",
        input: `任务：${tasks.find(item => item.value === task)!.label}\n证据：${JSON.stringify(evidence)}\n局限：${limitations}\n格式：\n${fixedResponse(task)}`,
      }),
    })
    if (!upstream.ok) return reply({ error: "generation_failed" }, 502)
    const data = await upstream.json() as { status?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }
    if (data.status !== "completed") return reply({ error: "incomplete_generation" }, 502)
    const text = (data.output || []).filter(item => item.type === "message").flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text || "").join("")
    const checked = validateReview(text)
    return reply({ response: checked.response, source: "model" })
  } catch { return reply({ error: "generation_failed" }, 502) }
  finally { clearTimeout(timeout); request.signal.removeEventListener("abort", abort) }
}
