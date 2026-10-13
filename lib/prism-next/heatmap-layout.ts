/** Opt-in small-matrix geometry. Default grid remains byte-for-byte compatible. */
export function heatmapGrid(compact: boolean) {
  return compact ? { left: 76, right: 8, top: 16, bottom: 60 } : { left: 105, right: 20, top: 20, bottom: 75 }
}
export function heatmapAxisLabel(compact: boolean, width: number) {
  return compact ? { axisLabel: { interval: 0, width, overflow: "truncate" as const }, tooltip: { show: true } } : {}
}
