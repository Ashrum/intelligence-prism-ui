import { getAgentSpec } from "@/lib/prism-next/agent-specs"

export function AgentSpec({ id }: { id: string }) {
  const spec = getAgentSpec(id)
  if (!spec) return null

  const rows = [
    ["Source", [spec.source]],
    ["Contract", spec.contract],
    ["States", spec.states],
    ["Accessibility", spec.accessibility],
    ["Do", spec.do],
    ["Don't", spec.dont],
  ] as const

  return <section className="mt-10 border-t pt-6" aria-labelledby={"agent-spec-" + id}>
    <details>
      <summary className="cursor-pointer font-semibold text-(--heading)" id={"agent-spec-" + id}>Agent Spec</summary>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">机器可读的核心契约。视觉演示与本节冲突时，以组件规范、基础规范和固定 coss 源码的权威顺序解释，不自行补造缺失值。</p>
      <dl className="mt-5 grid max-w-4xl gap-5">
        <div><dt className="text-sm font-semibold">Component</dt><dd className="mt-1 text-sm">{spec.component}</dd></div>
        {rows.map(([label, values]) => values?.length ? <div key={label}><dt className="text-sm font-semibold">{label}</dt><dd className="mt-1"><ul className="list-disc space-y-1 pl-5 text-sm leading-6">{values.map(value => <li key={value}>{value}</li>)}</ul></dd></div> : null)}
      </dl>
    </details>
  </section>
}
