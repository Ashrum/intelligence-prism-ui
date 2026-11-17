import type { ComponentProps, CSSProperties } from "react"
import { cn } from "@/lib/utils"

export interface BlankSlotProps extends Omit<ComponentProps<"span">, "children" | "contentEditable" | "dangerouslySetInnerHTML"> {
  index: number
  width?: CSSProperties["width"]
  selected?: boolean
}

/** An inline atom only; the host owns numbering, selection and editor operations. */
export function BlankSlot({ index, width = 84, selected = false, className, style, ...props }: BlankSlotProps) {
  const label = Number.isInteger(index) && index >= 1 && index <= 20 ? String.fromCodePoint(0x2460 + index - 1) : String(index)
  return <span {...props} role="img" aria-label={`第 ${index} 空`} contentEditable={false} data-selected={selected || undefined}
    className={cn("bp-blank-slot text-ui-hint", className)} style={{ ...style, width }}>
    <span aria-hidden="true">{label}</span>
  </span>
}
