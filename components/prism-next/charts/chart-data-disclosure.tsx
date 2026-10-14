import type { ReactNode } from "react"

export type ChartDataDisclosureMode = "visible" | "hidden"

/** Internal composition: hidden data stays in the accessibility tree, outside closed details. */
export function ChartDataDisclosure({ mode = "visible", label, summary = "查看数据", summaryClassName = "cursor-pointer text-ui-hint text-muted-foreground", children }: {
  mode?: ChartDataDisclosureMode
  label: string
  summary?: string
  summaryClassName?: string
  children: ReactNode
}) {
  return mode === "hidden"
    ? <div className="sr-only" role="region" aria-label={`${label}：数据`}>{children}</div>
    : <details><summary className={summaryClassName}>{summary}</summary>{children}</details>
}
