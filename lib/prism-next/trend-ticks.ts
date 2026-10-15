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
