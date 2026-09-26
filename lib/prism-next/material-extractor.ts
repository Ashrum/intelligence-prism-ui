/** Text offsets are zero-based UTF-16, with an exclusive end. Never normalize source text. */
export type MaterialParagraph = { id: string; label: string; text: string }
export type MaterialTextSource = { id: string; version: string | null; paragraphs: readonly MaterialParagraph[] }
export type MaterialTextPoint = { paragraphId: string; offset: number }
export type MaterialTextRange = { sourceId: string; sourceVersion: string | null; start: MaterialTextPoint; end: MaterialTextPoint }

const uniqueIds = (items: readonly { id: string }[]) => items.every(item => item.id.trim()) && new Set(items.map(item => item.id)).size === items.length
const boundary = (text: string, offset: number) => Number.isInteger(offset) && offset >= 0 && offset <= text.length
  && !(offset > 0 && offset < text.length && /[\uD800-\uDBFF]/u.test(text[offset - 1]) && /[\uDC00-\uDFFF]/u.test(text[offset]))

/** Reject stale, reversed, empty and ambiguous ranges instead of silently clamping provenance. */
export function materialRangeParts(source: MaterialTextSource, range: MaterialTextRange) {
  if (!source.id.trim() || !source.version?.trim() || range.sourceId !== source.id || range.sourceVersion !== source.version || !uniqueIds(source.paragraphs)) return null
  const start = source.paragraphs.findIndex(item => item.id === range.start.paragraphId)
  const end = source.paragraphs.findIndex(item => item.id === range.end.paragraphId)
  if (start < 0 || end < start || !boundary(source.paragraphs[start].text, range.start.offset) || !boundary(source.paragraphs[end].text, range.end.offset)) return null
  if (range.start.offset === source.paragraphs[start].text.length || range.end.offset === 0) return null
  if (start === end && range.start.offset >= range.end.offset) return null
  const parts = source.paragraphs.slice(start, end + 1).map((paragraph, index) => ({
    paragraph, start: index === 0 ? range.start.offset : 0,
    end: start + index === end ? range.end.offset : paragraph.text.length,
  }))
  return parts.some(part => part.end > part.start) ? parts : null
}

export function materialRangeText(source: MaterialTextSource, range: MaterialTextRange) {
  return materialRangeParts(source, range)?.map(part => part.paragraph.text.slice(part.start, part.end)).join("\n") ?? null
}

export function materialRangeDescription(source: MaterialTextSource, range: MaterialTextRange) {
  const parts = materialRangeParts(source, range)
  if (!parts) return "所选范围暂不可定位，请重新选择。"
  const first = parts[0], last = parts[parts.length - 1]
  const from = [...first.paragraph.text.slice(0, first.start)].length + 1
  const to = [...last.paragraph.text.slice(0, last.end)].length
  return parts.length === 1
    ? `${first.paragraph.label} · 第 ${from}–${to} 个字符`
    : `${first.paragraph.label}第 ${from} 个字符起，至${last.paragraph.label}第 ${to} 个字符止（含 ${parts.length} 段）`
}

/** Explicit punctuation boundaries only; this is a selection aid, not linguistic analysis. */
export function materialSentenceRanges(text: string): readonly { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = []
  const pattern = /[。！？!?；;\n]+[”’」』）)]*|\.(?=\s|$)/gu
  let start = 0
  for (const match of text.matchAll(pattern)) {
    const end = match.index + match[0].length
    ranges.push({ start, end }); start = end
  }
  if (start < text.length) ranges.push({ start, end: text.length })
  return ranges
}

export function materialParagraphRange(source: MaterialTextSource, paragraphId: string, unit: "paragraph" | "sentence" = "paragraph"): MaterialTextRange | null {
  const paragraph = source.paragraphs.find(item => item.id === paragraphId)
  if (!paragraph) return null
  const range = { sourceId: source.id, sourceVersion: source.version, start: { paragraphId, offset: 0 }, end: { paragraphId, offset: unit === "sentence" ? materialSentenceRanges(paragraph.text)[0]?.end ?? 0 : paragraph.text.length } }
  return materialRangeParts(source, range) ? range : null
}

export function extendMaterialRange(source: MaterialTextSource, range: MaterialTextRange, unit: "sentence" | "paragraph", direction: "before" | "after"): MaterialTextRange | null {
  if (!materialRangeParts(source, range)) return null
  const point = direction === "before" ? range.start : range.end
  let index = source.paragraphs.findIndex(item => item.id === point.paragraphId)
  let offset = point.offset
  const step = direction === "before" ? -1 : 1
  if (direction === "before" ? offset === 0 : offset === source.paragraphs[index].text.length) {
    index += step
    while (source.paragraphs[index] && !source.paragraphs[index].text.length) index += step
    if (!source.paragraphs[index]) return null
    offset = direction === "before" ? source.paragraphs[index].text.length : 0
  }
  const paragraph = source.paragraphs[index], sentences = materialSentenceRanges(paragraph.text)
  const nextOffset = unit === "paragraph" ? (direction === "before" ? 0 : paragraph.text.length)
    : direction === "before" ? [...sentences].reverse().find(sentence => sentence.start < offset)?.start
      : sentences.find(sentence => sentence.end > offset)?.end
  if (nextOffset === undefined) return null
  const next = { ...range, [direction === "before" ? "start" : "end"]: { paragraphId: paragraph.id, offset: nextOffset } }
  return materialRangeParts(source, next) ? next : null
}

/** Human controls count Unicode code points from 1, with an inclusive last character. */
export function materialRangeFromCharacters(source: MaterialTextSource, startId: string, endId: string, first: number, last: number): MaterialTextRange | null {
  const start = source.paragraphs.find(item => item.id === startId), end = source.paragraphs.find(item => item.id === endId)
  if (!start || !end || !Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < 1 || first > [...start.text].length || last > [...end.text].length) return null
  const range = { sourceId: source.id, sourceVersion: source.version,
    start: { paragraphId: startId, offset: [...start.text].slice(0, first - 1).join("").length },
    end: { paragraphId: endId, offset: [...end.text].slice(0, last).join("").length } }
  return materialRangeParts(source, range) ? range : null
}

export function sameMaterialRange(a: MaterialTextRange, b: MaterialTextRange) {
  return a.sourceId === b.sourceId && a.sourceVersion === b.sourceVersion && a.start.paragraphId === b.start.paragraphId
    && a.start.offset === b.start.offset && a.end.paragraphId === b.end.paragraphId && a.end.offset === b.end.offset
}

/** Copy only provenance, never the source paragraphs or the full candidate object. */
export function copyMaterialRange(range: MaterialTextRange): MaterialTextRange {
  return { sourceId: range.sourceId, sourceVersion: range.sourceVersion,
    start: { paragraphId: range.start.paragraphId, offset: range.start.offset },
    end: { paragraphId: range.end.paragraphId, offset: range.end.offset } }
}
