export type AgentSpec = {
  component: string
  source: string
  contract: string[]
  states?: string[]
  accessibility?: string[]
  do?: string[]
  dont?: string[]
}

export const coreAgentSpecs: Record<string, AgentSpec> = {
  'agent-components': {
    component: 'Agent semantic group v0.1 — design candidate',
    source: 'Prism / coss composition; interaction reference: https://www.beautifului.dev/',
    contract: ['AgentChangeSet (semantic 15) supports view=inline|workspace with the same host items and decisions; presentation remains unrelated. Required basis identifies source/version. Inline defaults to two items plus every critical or conflict item; without onExpand all items remain reachable and no expansion entry is shown. onExpand receives the trigger for host focus restoration. Item conflict={baseLabel,currentLabel,description?} and group notice only expose host facts, never auto-decide or disable. onDecision(id,pending|accepted|kept), onRewrite(id,value) and optional apply={label,onApply,disabledReason?} return intent only; the host owns drafts, freshness checks, application and saving. Group disabledReason blocks decisions, rewrites and apply; item disabledReason blocks that item; apply.disabledReason blocks application only. No accepted-count or conflict-based application rule is inferred. beforePreview/afterPreview remain host domain-rendering slots. Real integration is verified in Workspace /teacher/agent/workspace, never the historical skeleton.', 'AgentComposer scope is a host-provided slot. readOnly/sendDisabled default false; a nonempty sendDisabledReason also blocks form and keyboard submission. Read-only keeps the native draft readable; sendDisabled alone permits editing. The visible status reason describes both input and send button. Running stop behavior stays unchanged; slots remain host-owned.', 'AgentContextSummary composes AgentContextList; selection, read, current context and citation are independent host facts. confirmed requires a scoped description; absent requires complete host-verified coverage; unknown and unavailable stay distinct. Opening a source does not change facts.', 'AgentArtifactPreview receives object identity, version, status and optional open capability. Preview content never proves execution or publication.', 'AgentExecutionConfirmation receives a discriminated ready/submitting/received/blocked/unknown/recorded state. Only ready exposes confirmation. Callbacks return intent, not acknowledgements.', 'AgentExecutionProgress reuses AgentTaskProgress; overall state and expansion are external. Waiting/unknown renders old running steps as static snapshots, never ongoing activity.', 'AgentExecutionResult receives a succeeded/partial/failed/unknown receipt. Unknown exposes query only; partial preserves completed and remaining scope. Host capabilities determine recovery.', 'AgentChangeReview preserves controlled string input and adds optional version labels, scope, presentation slots and reset intent. Caller owns freshness, draft updates and saving. AgentQuestionCard remains controlled; choosing does not execute or save.'],
    states: ['draft/current/historical/unavailable preview', 'pending/accepted/kept or externally blocked comparison', 'ready/submitting/received/blocked/recorded/unknown confirmation', 'running/waiting/snapshot progress', 'succeeded/partial/failed/unknown receipt'],
    accessibility: ['Change decision and reset names include each item title; disabled reasons are visible and associated with controls.', 'Choices use the pinned RadioGroup and associated labels.', 'Decision information is at least 14px; long source and comparison text uses read-body 16/28.', 'Narrow containers wrap or stack; source dialogs return focus.'],
    dont: ['Do not put demo execution, business persistence or model calls in reusable components.', 'Do not treat selection or accepted changes as permission to publish.', 'Do not manufacture confidence, completion percentages or internal reasoning.'],
  },
  button: {
    component: "Button",
    source: "Pinned coss Button with components/prism-next/button adaptation; preserve upstream sizing, radius, padding and focus behavior",
    contract: ["One primary action per action region.", "Use native sizes; Prism Button additionally exposes navigation and navigation-icon with 40px desktop / 44px coarse-pointer targets. Default output is unchanged; icon buttons require an accessible name.", "Prism variant=info uses existing semantic info tokens for guidance and informational actions, composes with navigation sizes, and does not replace the default primary action hierarchy.", "Destructive actions use the destructive treatment and confirmation when impact warrants it."],
    states: ["default", "hover", "focus-visible", "active", "loading", "disabled"],
    accessibility: ["Preserve keyboard focus and loading/disabled semantics.", "Icon-only buttons require aria-label or equivalent accessible naming."],
    do: ["Use hierarchy before adding color.", "Keep coss interaction behavior intact."],
    dont: ["Do not invent new internal dimensions.", "Do not use Prism colors as decoration."]
  },
  toolbar: {
    component: 'Toolbar',
    source: 'Pinned coss Toolbar; optional Prism composition',
    contract: ['Prism variant defaults to framed with identical coss output. plain reuses the same Base UI root and children without the visual frame; no new tokens.'],
    accessibility: ['Preserve arrow-key navigation, ToolbarLink semantics and accessible naming.'],
  },
  'metric-summary': {
    component: 'MetricSummary',
    source: 'components/prism-next/data-display.tsx',
    contract: ['density defaults to default; compact changes only layout to two columns with baseline-aligned label/value. Preserve analytics-value typography, external detail and onSelect intent.'],
  },
  'status-composition': {
    component: 'StatusComposition',
    source: 'components/prism-next/data-display.tsx',
    contract: ['density defaults to default; compact uses a wrapping legend and an 8px read-only bar. An interactive bar stays 32px. Missing and invalid values retain existing semantics.'],
    accessibility: ['Compact read-only legends retain full quantity and percentage through accessible labels and titles. Interactive bars and legends remain keyboard-selectable.'],
  },
  question: {
    component: 'Question composition / QuestionPrint',
    source: 'components/prism-next/question-print.tsx',
    contract: ['QuestionPrint showQuestionIds defaults true. false hides the printed ID/version line and triggers pagination; question numbering, internal version references and edition hash stay unchanged. It is not a data-redaction API.'],
  },
  form: {
    component: "Form",
    source: "coss Form composed with Field, Input, Select, Textarea and Button",
    contract: ["Canonical structure is fields plus explicit submit/reset actions.", "Validation is local to the affected field and recovery feedback remains visible.", "Labels are persistent fixed labels."],
    states: ["editing", "invalid", "submitting", "success/recovery"],
    accessibility: ["Associate errors with fields and preserve native form semantics."],
    dont: ["Do not replace persistent labels with placeholder-only identification.", "Do not introduce floating labels as base behavior."]
  },
  field: {
    component: "Field",
    source: "coss Field",
    contract: ["Field owns label, description and inline validation feedback.", "Field identity remains visible in every state.", "Canonical label strategy is persistent fixed label."],
    states: ["default", "filled", "invalid", "readonly", "disabled"],
    accessibility: ["Keep label-control association and error announcement semantics."],
    dont: ["Do not infer floating-label behavior.", "Do not hide field identity after input."]
  },
  input: {
    component: "Input",
    source: "coss Input",
    contract: ["Use native sm / default / lg sizing; field container controls width.", "Persistent fixed label is canonical.", "Readonly, disabled, invalid and filled states remain distinguishable.", "Single-line title fields commonly fill the form column; short numeric/select fields stay content-sized."],
    states: ["default", "hover", "focus-visible", "filled", "invalid", "readonly", "disabled"],
    accessibility: ["Use a persistent associated label.", "Use aria-invalid and associated inline error text for invalid fields."],
    dont: ["Do not override internal coss height, radius or padding.", "Do not use placeholder as the only label.", "Do not infer floating labels."]
  },
  textarea: {
    component: "Textarea",
    source: "coss Textarea",
    contract: ["Persistent fixed label is canonical.", "Allow long content to grow naturally when the product context needs it.", "Character count is supporting information, not a replacement for validation."],
    states: ["default", "focus-visible", "filled", "invalid", "readonly", "disabled"],
    accessibility: ["Keep a persistent associated label and explicit max-length/error feedback when applicable."],
    dont: ["Do not introduce floating labels as base behavior."]
  },
  select: {
    component: "Select",
    source: "coss Select",
    contract: ["Preserve coss list, selected indicator, keyboard behavior and native size variants.", "Width follows content and field context; short choices should not be stretched into a full column.", "Use a persistent fixed label."],
    states: ["closed", "open", "focus-visible", "selected", "disabled"],
    accessibility: ["Preserve keyboard navigation, selection semantics and focus return."],
    dont: ["Do not replace the component's popup behavior.", "Do not infer custom motion or dimensions."]
  },
  badge: {
    component: "Badge",
    source: "coss Badge plus Prism info-solid and attention aliases",
    contract: ["Use text plus restrained color to express status.", "Prism semantic colors require textual meaning.", "info-solid increases information emphasis only; it does not imply pending, error, category or completion.", "attention maps to the existing error appearance for host-declared human attention; text defines meaning, never infer execution failure. Prism size remains lg by default.", "Counts do not automatically hide zero or collapse to 99+."],
    accessibility: ["Ensure the containing control has a complete accessible name when a numeric badge is visually repeated."],
    dont: ["Do not communicate status by color alone.", "Do not invent automatic count truncation."]
  },
  card: {
    component: "Card",
    source: "coss Card composition",
    contract: ["Reuse one Card family for content, horizontal rows, metrics, people, selection and grouping.", "Hierarchy comes from content structure and spacing before separators or decoration."],
    states: ["default", "interactive when the caller provides interaction", "selected when explicitly composed"],
    dont: ["Do not create a new component for every card layout.", "Do not add decorative icon backgrounds or repeated separators without a semantic need."]
  },
  dialog: {
    component: "Dialog",
    source: "coss Dialog",
    contract: ["Use for temporary focused editing while preserving the surrounding context.", "Nested controls such as Select must inherit the active theme.", "Footer actions state the commit/cancel choice clearly."],
    states: ["closed", "opening/open", "nested-popup", "closing"],
    accessibility: ["Preserve focus trapping, close semantics, accessible title/description and focus return."],
    dont: ["Do not replace a destructive confirmation with a generic Dialog when Alert Dialog is the correct primitive."]
  },
  tabs: {
    component: "Tabs",
    source: "coss Tabs",
    contract: ["Use segmented tabs or underline tabs to switch related content for the same object.", "Selected state must remain clear without glow or decorative shadow.", "Disabled tabs remain explicit."],
    states: ["default", "hover", "focus-visible", "selected", "disabled"],
    accessibility: ["Preserve tablist/tab/tabpanel semantics and keyboard navigation."],
    dont: ["Do not use Tabs as unrelated page navigation.", "Do not add glow/shadow to manufacture selected state."]
  }
}

export function getAgentSpec(id: string) {
  return coreAgentSpecs[id]
}
