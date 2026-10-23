import type { CSSProperties } from "react"

export interface ResizeHandleProps {
  /** Direction of the separator, not the direction of pointer travel. */
  orientation?: "vertical" | "horizontal"
  /** Physical left/top, center, or right/bottom edge of the host. */
  align?: "start" | "center" | "end"
  /** Host-owned pointer capture / drag state. */
  dragging?: boolean
}

/** Decorative visual only. The host needs relative + group/resize-handle. */
export function ResizeHandle({ orientation = "vertical", align = "center", dragging = false }: ResizeHandleProps) {
  const vertical = orientation === "vertical"
  const position: CSSProperties = vertical
    ? { left: align === "start" ? "0%" : align === "end" ? "100%" : "50%", top: "50%", transform: "translate(-50%, -50%)" }
    : { top: align === "start" ? "0%" : align === "end" ? "100%" : "50%", left: "50%", transform: "translate(-50%, -50%)" }
  const lineColor = dragging ? "bg-ring" : "bg-border group-hover/resize-handle:bg-ring"
  const gripColor = dragging ? "bg-ring" : "bg-muted-foreground group-hover/resize-handle:bg-ring"
  return <span aria-hidden="true" data-slot="resize-handle" data-orientation={orientation} data-align={align} data-dragging={dragging}
    className={`absolute inset-0 block ${vertical ? "cursor-col-resize" : "cursor-row-resize"} group-focus-visible/resize-handle:outline-2 group-focus-visible/resize-handle:outline-offset-2 group-focus-visible/resize-handle:outline-ring`}>
    <span data-slot="resize-handle-line" style={position} className={`absolute block transition-colors motion-reduce:transition-none ${lineColor} ${vertical ? dragging ? "h-full w-0.5" : "h-full w-px group-hover/resize-handle:w-0.5" : dragging ? "h-0.5 w-full" : "h-px w-full group-hover/resize-handle:h-0.5"}`} />
    <span data-slot="resize-handle-grip" style={position} className={`absolute block transition-colors motion-reduce:transition-none ${gripColor} ${vertical ? "h-5 w-1" : "h-1 w-5"}`} />
  </span>
}
