import { comparisonTextWidth } from './comparison-reference'

export type ScatterLabelBox = { x: number; y: number; width: number; height: number }
export type ScatterLabelPoint = { id: string; label: string; x: number; y: number; radius: number; show: boolean }
const overlaps = (a: ScatterLabelBox, b: ScatterLabelBox) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y

/** Reserve every symbol, including unlabelled points, before placing any text. */
export function scatterLabelLayout(points: ScatterLabelPoint[], plot: ScatterLabelBox, reserved: ScatterLabelBox[] = []) {
  const obstacles = [...reserved, ...points.map(p => ({ x: p.x - p.radius - 3, y: p.y - p.radius - 3, width: (p.radius + 3) * 2, height: (p.radius + 3) * 2 }))]
  const labels = new Map<string, ScatterLabelBox>()
  for (const point of points) {
    if (!point.show) continue
    const textWidth = comparisonTextWidth(point.label, 12)
    if (textWidth > 110 || !point.label) continue
    const width = textWidth + 6, height = 20, gap = point.radius + 6
    const candidates = [
      { x: point.x + gap, y: point.y - height / 2, width, height },
      { x: point.x - width / 2, y: point.y - gap - height, width, height },
      { x: point.x - width - gap, y: point.y - height / 2, width, height },
      { x: point.x - width / 2, y: point.y + gap, width, height },
    ]
    const box = candidates.find(b => b.x >= plot.x && b.y >= plot.y && b.x + width <= plot.x + plot.width && b.y + height <= plot.y + plot.height && !obstacles.some(other => overlaps(b, other)))
    if (box) { labels.set(point.id, box); obstacles.push(box) }
  }
  return labels
}
