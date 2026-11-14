"use client"

import type { ComponentProps } from "react"
import { Meter, MeterTrack, MeterIndicator } from "@/components/coss/meter"
import "./scale-meter.css"

export type ScaleMeterProps = Pick<ComponentProps<typeof Meter>, "value" | "min" | "max" | "aria-valuetext" | "aria-label" | "aria-labelledby"> & {
  label?: { start: string; end: string }
}

/** The host supplies the reading, range, accessible name and optional endpoint labels. */
export function ScaleMeter({ label, ...props }: ScaleMeterProps) {
  return <Meter {...props} className="prism-scale-meter">
    <MeterTrack className="prism-scale-meter-track"><MeterIndicator className="prism-scale-meter-indicator" /></MeterTrack>
    {label && <div className="flex justify-between gap-3 text-ui-meta text-muted-foreground"><span>{label.start}</span><span>{label.end}</span></div>}
  </Meter>
}
