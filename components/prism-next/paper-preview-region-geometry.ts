/** Source-page coordinates, before rotation; x/y/width/height are fractions of the page. */
export type PaperRegionRect = [number, number, number, number]
export type PaperRegionPoint = { x: number; y: number }
export type PaperRegionHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"
type Rotation = 0 | 90 | 180 | 270

const DEFAULT_MIN_SIZE = .02
const DEFAULT_KEYBOARD_STEP = .005
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const minimum = (value: number) => Number.isFinite(value) && value > 0 ? Math.min(1, value) : DEFAULT_MIN_SIZE

function sourceDelta({ x, y }: PaperRegionPoint, rotation: Rotation): PaperRegionPoint {
  switch (rotation) {
    case 90: return { x: y, y: -x }
    case 180: return { x: -x, y: -y }
    case 270: return { x: -y, y: x }
    default: return { x, y }
  }
}

/** Bounds are the actual rotated page's client rect, including zoom and any outer scale. */
export function paperRegionPoint(client: PaperRegionPoint, bounds: { left: number; top: number; width: number; height: number }, rotation: Rotation): PaperRegionPoint | null {
  if (![client.x, client.y, bounds.left, bounds.top, bounds.width, bounds.height].every(Number.isFinite) || bounds.width <= 0 || bounds.height <= 0) return null
  const x = (client.x - bounds.left) / bounds.width
  const y = (client.y - bounds.top) / bounds.height
  if (![x, y].every(Number.isFinite)) return null
  // Preserve out-of-page points so dragging beyond an edge retains the original delta.
  switch (rotation) {
    case 90: return { x: y, y: 1 - x }
    case 180: return { x: 1 - x, y: 1 - y }
    case 270: return { x: 1 - y, y: x }
    default: return { x, y }
  }
}

/** Project a source rectangle into the rotated page's normalized bounding box. */
export function paperRegionViewRect([x, y, width, height]: PaperRegionRect, rotation: Rotation): PaperRegionRect {
  switch (rotation) {
    case 90: return [1 - y - height, x, height, width]
    case 180: return [1 - x - width, 1 - y - height, width, height]
    case 270: return [y, 1 - x - width, height, width]
    default: return [x, y, width, height]
  }
}

/** Sanitize external geometry without mutating the host's rectangle. */
export function clampPaperRegion(rect: PaperRegionRect, minSize = DEFAULT_MIN_SIZE): PaperRegionRect {
  const min = minimum(minSize)
  const width = clamp(finite(rect[2], min), min, 1)
  const height = clamp(finite(rect[3], min), min, 1)
  return [clamp(finite(rect[0]), 0, 1 - width), clamp(finite(rect[1]), 0, 1 - height), width, height]
}

export function createPaperRegion(start: PaperRegionPoint, end: PaperRegionPoint, minSize = DEFAULT_MIN_SIZE): PaperRegionRect {
  const x1 = clamp(finite(start.x), 0, 1), y1 = clamp(finite(start.y), 0, 1)
  const x2 = clamp(finite(end.x), 0, 1), y2 = clamp(finite(end.y), 0, 1)
  return clampPaperRegion([Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)], minSize)
}

export function movePaperRegion(rect: PaperRegionRect, delta: PaperRegionPoint, minSize = DEFAULT_MIN_SIZE): PaperRegionRect {
  const [x, y, width, height] = clampPaperRegion(rect, minSize)
  return [clamp(x + finite(delta.x), 0, 1 - width), clamp(y + finite(delta.y), 0, 1 - height), width, height]
}

/** Resize source-page edges; the opposite edge stays fixed and handles never flip. */
export function resizePaperRegion(rect: PaperRegionRect, handle: PaperRegionHandle, delta: PaperRegionPoint, minSize = DEFAULT_MIN_SIZE): PaperRegionRect {
  const min = minimum(minSize)
  const [x, y, width, height] = clampPaperRegion(rect, min)
  let left = x, right = x + width, top = y, bottom = y + height
  if (handle.includes("w")) left = clamp(x + finite(delta.x), 0, right - min)
  if (handle.includes("e")) right = clamp(right + finite(delta.x), left + min, 1)
  if (handle.includes("n")) top = clamp(y + finite(delta.y), 0, bottom - min)
  if (handle.includes("s")) bottom = clamp(bottom + finite(delta.y), top + min, 1)
  return [left, top, right - left, bottom - top]
}

/** Arrows follow the screen; Shift adjusts the visual right or bottom edge. */
export function keyboardPaperRegion(rect: PaperRegionRect, key: string, shift: boolean, rotation: Rotation, minSize = DEFAULT_MIN_SIZE, step = DEFAULT_KEYBOARD_STEP): PaperRegionRect | null {
  const distance = Number.isFinite(step) && step > 0 ? Math.min(step, 1) : DEFAULT_KEYBOARD_STEP
  const screen = key === "ArrowLeft" ? { x: -distance, y: 0 }
    : key === "ArrowRight" ? { x: distance, y: 0 }
      : key === "ArrowUp" ? { x: 0, y: -distance }
        : key === "ArrowDown" ? { x: 0, y: distance } : null
  if (!screen) return null
  const delta = sourceDelta(screen, rotation)
  if (!shift) return movePaperRegion(rect, delta, minSize)
  const visualRight: Record<Rotation, PaperRegionHandle> = { 0: "e", 90: "n", 180: "w", 270: "s" }
  const visualBottom: Record<Rotation, PaperRegionHandle> = { 0: "s", 90: "e", 180: "n", 270: "w" }
  return resizePaperRegion(rect, screen.x ? visualRight[rotation] : visualBottom[rotation], delta, minSize)
}

/** DocumentRegionViewer retains its existing 0–100 percentage contract. */
export function documentRectToPaperRegion(rect: PaperRegionRect): PaperRegionRect {
  return [rect[0] / 100, rect[1] / 100, rect[2] / 100, rect[3] / 100]
}

export function paperRegionToDocumentRect(rect: PaperRegionRect): PaperRegionRect {
  return [rect[0] * 100, rect[1] * 100, rect[2] * 100, rect[3] * 100]
}
