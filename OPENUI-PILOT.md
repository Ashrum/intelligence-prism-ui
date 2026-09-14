# OpenUI evidence review pilot

Route: `/review/openui`. Status: candidate, awaiting review.

The first slice uses the real `@openuidev/react-lang` 0.2.15 Renderer with existing
ObjectCard, AILabel, StateLabel, Button, SegmentedControl and Textarea primitives.
It is a constrained display protocol, not a general chat interface. There are no
tools, MCP calls, generated event handlers or model-controlled review actions.

## Scope and data

- Three tasks reorder Candidate, Evidence and Limits. Fixed-order comparison uses
  the same content and React components.
- Every record is synthetic and labelled as example data. E1/E2 values, source
  descriptions and limitations come from the host; only candidate prose and the
  three-block order may vary.
- A closed four-statement Lang contract rejects extra/repeated assignments,
  missing/duplicate blocks, missing evidence IDs, dynamic expressions and tools.
  The real parser then checks completeness before Renderer receives the output.
- All upstream output is buffered. Partial/incomplete output never replaces the
  last accepted tree. This slice does not claim live streaming UI support.
- Drafts, applied text, provenance, edits, undo and review state live outside the
  generated tree. Updating a candidate cannot overwrite a dirty draft. Applying
  changed text clears review, and undo restores the prior record and review.
- Operations are in-memory for this page session only. There is no formal record
  write, review persistence or production teaching decision.
- Runtime observability is explicitly disabled. Dependency install used
  `OPENUI_TELEMETRY_DISABLED=1`; keep that flag on future CI installations.

## Model connection

The Worker owns `/api/openui-review`. It sends the fixed synthetic evidence to the
OpenAI Responses API, with no tools, `store:false`, a 30 second deadline and an
output token limit. Credentials never enter the browser. Only configured review
accounts may call generation; identity is supplied by Sites dispatch, plus an
exact same-origin POST check. Public visitors can still use fixed examples.

Required production settings (not configured in this delivery):

| Variable | Meaning |
| --- | --- |
| `OPENAI_API_KEY` | Server secret, created/reused through OpenAI Developers with approval |
| `OPENUI_MODEL` | An explicitly selected Responses-compatible model available to that key |
| `OPENUI_REVIEWER_EMAILS` | Comma-separated review account allowlist |

Use the existing dispatch-owned Sign in with ChatGPT flow. Do not trust the
identity header if this Worker is moved to an untrusted deployment. No internal
Codex credentials or gateway configuration are used by this adapter.

Real generation is disabled until these settings are present and the reviewer
is signed in. Mock adapter tests are not evidence of model quality or latency.
Next gate: connect the model, repeat each task, inspect factual accuracy and
rejection rate, then compare reading efficiency and state preservation in the
original Site. These evaluations are still outstanding.

## Verification

`node --test tests/openui-review.test.mjs` checks actual parser/Renderer output,
malformed/executable inputs, host draft/review transitions, access boundaries and
completed-vs-truncated upstream responses. The full existing test suite and
production build are also used for this change. Browser interaction/visual QA
and live model evaluation have not been performed in this slice.

The repository's standalone `tsc` reports existing missing Cloudflare declarations
(`cloudflare:workers`, `Fetcher`, `D1Database`); the production Vinext build is the
supported build gate. This change does not alter those unrelated declarations.

References: [OpenUI React Lang API](https://www.openui.com/docs/api-reference/react-lang),
[OpenUI component definitions](https://www.openui.com/docs/openui-lang/defining-components),
[OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create/).
