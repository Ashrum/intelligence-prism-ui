import { comparisonTextWidth } from './comparison-reference'

/** Keep each caller-supplied row on one line; full text remains in title/data disclosure. */
export function fitTrendTick(text: string, width: number, fontSize = 12) {
  if (comparisonTextWidth(text, fontSize) <= width) return text
  if (comparisonTextWidth('…', fontSize) > width) return ''
  let result = ''
  for (const character of text) {
    if (comparisonTextWidth(result + character + '…', fontSize) > width) break
    result += character
  }
  return result + '…'
}

/** Equal index strides, with both endpoints retained and at least 8px between text boxes. */
export function sparkTickLayout(labels: string[], width: number, fontSize = 12) {
  if (!labels.length || width <= 0) return []
  const cap = labels.length === 1 ? width : Math.max(0, (width - 8) / 2)
  const ticks = labels.map((label, index) => {
    const text = fitTrendTick(label, cap, fontSize), size = comparisonTextWidth(text, fontSize)
    const center = (index + .5) * width / labels.length
    return { index, label, text, width: size, x: Math.max(size / 2, Math.min(width - size / 2, center)) }
  })
  for (let stride = 1; stride <= labels.length; stride++) {
    const selected = ticks.filter(t => t.index % stride === 0 || t.index === labels.length - 1)
    if (selected.every((t, i) => !i || t.x - t.width / 2 - (selected[i - 1].x + selected[i - 1].width / 2) >= 8)) return selected
  }
  return ticks.filter(t => t.index === 0 || t.index === labels.length - 1)
}
