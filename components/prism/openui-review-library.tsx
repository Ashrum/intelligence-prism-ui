"use client"

import { createContext, useContext } from "react"
import { createLibrary, createParser, defineComponent } from "@openuidev/react-lang"
import { z } from "zod/v4"
import { AILabel, Badge } from "@/components/ui/badge"
import { ObjectCard, ObjectCardHeader, ObjectCardMeta } from "@/components/ui/card"
import { evidence, limitations, validateReview } from "@/lib/openui/review-contract"

export const ReviewOrigin = createContext<"sample" | "model">("sample")

export function CandidateView({ text }: { text: string }) {
  const origin = useContext(ReviewOrigin)
  return <ObjectCard tone="ai" className="openui-block" aria-labelledby="candidate-title">
    <ObjectCardHeader><h2 id="candidate-title">候选说明</h2><AILabel>{origin === "model" ? "AI 初稿" : "固定样例"}</AILabel></ObjectCardHeader>
    <p className="openui-reading">{text}</p>
    <ObjectCardMeta>依据：E1、E2 · 需人工核对</ObjectCardMeta>
  </ObjectCard>
}

export function EvidenceView() {
  return <ObjectCard className="openui-block" aria-labelledby="evidence-title">
    <ObjectCardHeader><h2 id="evidence-title">证据</h2><Badge>2 项来源</Badge></ObjectCardHeader>
    <div className="openui-evidence-list">{evidence.map(item => <section key={item.id}>
      <div className="openui-evidence-heading"><h3><span>{item.id}</span>{item.title}</h3><p><strong>{item.value}</strong><span>{item.unit}</span></p></div>
      <p>{item.detail}</p><ObjectCardMeta>{item.source}</ObjectCardMeta>
    </section>)}</div>
  </ObjectCard>
}

export function LimitsView() {
  return <ObjectCard className="openui-block openui-limits" aria-labelledby="limits-title"><h2 id="limits-title">结论的局限</h2><p>{limitations}</p></ObjectCard>
}

const Candidate = defineComponent({ name: "Candidate", description: "未复核的候选说明，必须引用全部证据。", props: z.object({ text: z.string().min(1).max(800), citations: z.tuple([z.literal("E1"), z.literal("E2")]) }), component: ({ props }) => <CandidateView text={props.text} /> })
const Evidence = defineComponent({ name: "Evidence", description: "只接受来源标识，站点提供原始数据。", props: z.object({ ids: z.tuple([z.literal("E1"), z.literal("E2")]) }), component: () => <EvidenceView /> })
const Limits = defineComponent({ name: "Limits", description: "必须展示由站点提供的局限。", props: z.object({}), component: () => <LimitsView /> })
const ReviewLayout = defineComponent({ name: "ReviewLayout", description: "三个区块各出现一次，可按任务调整顺序。", props: z.object({ children: z.array(z.union([Candidate.ref, Evidence.ref, Limits.ref])) }), component: ({ props, renderNode }) => <div className="openui-blocks">{renderNode(props.children)}</div> })

// OpenUI creates a random internal library ID. Workers forbid randomness while
// evaluating modules, so initialize on the first render/validation in a request.
// This cache contains component definitions only, never draft or reviewer data.
function createReviewLibrary() {
  return createLibrary({ root: "ReviewLayout", components: [ReviewLayout, Candidate, Evidence, Limits] })
}
let reviewLibrary: ReturnType<typeof createReviewLibrary> | undefined
export function getReviewLibrary() {
  return reviewLibrary ??= createReviewLibrary()
}

// A closed lexical gate catches ignored assignments, expressions and extra args.
// The real parser then checks completeness; Renderer never receives partial output.
export function checkRenderableReview(input: unknown) {
  const checked = validateReview(input)
  const parsed = createParser(getReviewLibrary().toJSONSchema(), "ReviewLayout").parse(checked.response)
  const { meta, root } = parsed
  if (!root || root.type !== "element" || root.typeName !== "ReviewLayout" || root.partial || root.hasDynamicProps !== false || meta.incomplete || meta.errors.length || meta.unresolved.length || meta.orphaned.length || meta.statementCount !== 4 || parsed.queryStatements.length || parsed.mutationStatements.length || Object.keys(parsed.stateDeclarations).length) throw new Error("Incomplete OpenUI tree")
  const children = root.props.children as Array<{ type: string; typeName: string; partial: boolean; hasDynamicProps?: boolean }>
  if (!Array.isArray(children) || children.length !== 3 || children.some(node => node.type !== "element" || node.partial || node.hasDynamicProps !== false) || new Set(children.map(node => node.typeName)).size !== 3) throw new Error("Invalid child tree")
  return checked
}
