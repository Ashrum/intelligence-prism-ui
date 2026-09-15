export type PaperEntry = { id: string; points: number; partPoints?: Record<string, number> }
export type QuestionAvailability = "ready" | "review" | "paused"
export function addToPaper(entries: PaperEntry[], additions: PaperEntry[]) {
  const ids = new Set(entries.map(item => item.id))
  return [...entries, ...additions.filter(item => { if (ids.has(item.id)) return false; ids.add(item.id); return true }).map(item => ({ ...item, partPoints: item.partPoints ? { ...item.partPoints } : undefined }))]
}
export function moveInPaper(entries: PaperEntry[], id: string, offset: number) {
  const from = entries.findIndex(item => item.id === id), to = from + offset
  if (from < 0 || to < 0 || to >= entries.length) return entries
  const next = [...entries]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next
}
export function replaceInPaper(entries: PaperEntry[], id: string, replacement: PaperEntry) {
  if (entries.some(item => item.id === replacement.id)) return entries
  return entries.map(item => item.id === id ? { ...replacement } : item)
}
export function entryPoints(entry: PaperEntry) {
  return entry.partPoints ? Object.values(entry.partPoints).reduce((sum, value) => sum + value, 0) : entry.points
}
export function reviewError(scores: Record<string, number | null>, limits: Record<string, number>, original: Record<string, number>, reason: string) {
  if (Object.keys(limits).some(id => scores[id] == null || !Number.isFinite(scores[id]) || scores[id]! < 0 || scores[id]! > limits[id] || !Number.isInteger(scores[id]! * 2))) return "请为每个评分点填写范围内的分数，步长为 0.5 分。"
  if (Object.keys(limits).some(id => scores[id] !== original[id]) && !reason.trim()) return "调整分数后，请填写复核理由。"
  return ""
}
