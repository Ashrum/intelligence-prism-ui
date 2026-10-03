// Coordinates are unscaled CSS pixels relative to the canvas; paperRight is
// measured from the widest page after scrolling, zoom, rotation and reflow.
export function dockPaperToolbar({ canvasWidth, paperRight, toolbarWidth = 56, inset = 8 }: {
  canvasWidth: number; paperRight: number; toolbarWidth?: number; inset?: number
}) {
  const rightLimit = Math.max(inset, canvasWidth - inset - toolbarWidth)
  return { left: Math.max(inset, Math.min(paperRight, rightLimit)) }
}
