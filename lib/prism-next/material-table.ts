export type MaterialRow = { id: string; title: string; subject: string; minutes: number; score: number; status: "pending" | "reviewed" }
export const materialRows: MaterialRow[] = [
  { id: "M-001", title: "一元二次方程的实数根", subject: "数学", minutes: 8, score: 98.5, status: "pending" },
  { id: "M-002", title: "函数的单调性", subject: "数学", minutes: 12, score: 92, status: "pending" },
  { id: "M-003", title: "导数与极值", subject: "数学", minutes: 16, score: 95.75, status: "reviewed" },
  { id: "M-004", title: "数列求和", subject: "数学", minutes: 10, score: 87.5, status: "pending" },
  { id: "M-005", title: "平面向量的数量积", subject: "数学", minutes: 9, score: 90.25, status: "reviewed" },
  { id: "M-006", title: "圆锥曲线的几何性质", subject: "数学", minutes: 18, score: 94, status: "pending" },
  { id: "M-007", title: "立体几何中的空间距离", subject: "数学", minutes: 15, score: 89.5, status: "pending" },
  { id: "M-008", title: "概率与条件概率", subject: "数学", minutes: 14, score: 96, status: "reviewed" },
  { id: "M-009", title: "匀变速直线运动", subject: "物理", minutes: 11, score: 93.5, status: "pending" },
  { id: "M-010", title: "牛顿运动定律", subject: "物理", minutes: 13, score: 91.25, status: "reviewed" },
  { id: "M-011", title: "化学反应速率", subject: "化学", minutes: 10, score: 88.75, status: "pending" },
  { id: "M-012", title: "离子反应与方程式", subject: "化学", minutes: 12, score: 97.5, status: "reviewed" },
]
export function filterMaterials(rows: MaterialRow[], query: string, status: string) {
  const needle = query.trim().toLocaleLowerCase()
  return rows.filter(row => (status === "all" || row.status === status) && `${row.id} ${row.title} ${row.subject}`.toLocaleLowerCase().includes(needle))
}
export function setMaterialStatus(rows: MaterialRow[], ids: string[], status: MaterialRow["status"]) {
  const selected = new Set(ids)
  return rows.map(row => selected.has(row.id) ? { ...row, status } : row)
}
