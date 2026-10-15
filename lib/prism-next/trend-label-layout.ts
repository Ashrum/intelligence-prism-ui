import { comparisonTextWidth } from './comparison-reference'

type Box = { x: number; y: number; width: number; height: number }
export type TrendLabelPoint = { id: string; x: number; y: number; valueLabel?: string; annotation?: string }
export type TrendLabelSegment = { x1: number; y1: number; x2: number; y2: number }
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
const crosses = (line: TrendLabelSegment, box: Box) => {
  const left = Math.max(Math.min(line.x1, line.x2), box.x - 2), right = Math.min(Math.max(line.x1, line.x2), box.x + box.width + 2)
  if (left > right) return false
  const yAt = (x: number) => line.y1 + (x - line.x1) / (line.x2 - line.x1) * (line.y2 - line.y1)
  const ys = line.x1 === line.x2 ? [line.y1, line.y2] : [yAt(left), yAt(right)]
  return Math.min(...ys) <= box.y + box.height + 2 && Math.max(...ys) >= box.y - 2
}

/** Pixel coordinates come from the chart's plot/scales. Never shrink chart text.
 * Reserve every point first, then place labels above / annotations below. Any
 * text that cannot fit remains available in the tooltip and data disclosure. */
export function trendLabelLayout(points: TrendLabelPoint[], plot: Box, lines: TrendLabelSegment[] = []) {
  const placed: (Box & { id: string; text: string; kind: 'valueLabel' | 'annotation' })[] = []
  if (plot.width < 440) return placed
  const obstacles: Box[] = points.map(p => ({ x: p.x - 8, y: p.y - 8, width: 16, height: 16 }))
  for (const point of points) for (const kind of ['valueLabel', 'annotation'] as const) {
    const text = point[kind]
    if (!text) continue
    const width = comparisonTextWidth(text, 12) + 8, height = 18
    for (const offset of [0, 18, 36]) {
      const box = { x: Math.max(plot.x, Math.min(point.x - width / 2, plot.x + plot.width - width)), y: kind === 'valueLabel' ? point.y - 12 - height - offset : point.y + 12 + offset, width, height }
      if (box.x < plot.x || box.x + width > plot.x + plot.width || box.y < plot.y || box.y + height > plot.y + plot.height) continue
      if (obstacles.some(other => overlaps(box, other)) || lines.some(line => crosses(line, box))) continue
      placed.push({ ...box, id: point.id, text, kind }); obstacles.push(box); break
    }
  }
  return placed
}
