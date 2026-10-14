import {formatChartValue} from "./chart-options"
export type MetricVisual = { kind: 'ring'; value: number; max: number } | { kind: 'sparkline'; values: (number | null)[] }

/** Geometry only: connect finite observations without inventing values at missing positions. */
export function metricVisualModel(visual: MetricVisual) {
  if (visual.kind === 'ring') {
    const valid = Number.isFinite(visual.value) && Number.isFinite(visual.max) && visual.max > 0 && visual.value >= 0 && visual.value <= visual.max
    return { kind: 'ring' as const, ratio: valid ? visual.value / visual.max : null, text: valid ? `环形数值：${formatChartValue(visual.value)} / ${formatChartValue(visual.max)}` : `环形数据无效：${formatChartValue(visual.value)} / ${formatChartValue(visual.max)}` }
  }
  const valid = visual.values.filter((v): v is number => v !== null && Number.isFinite(v))
  const min = Math.min(...valid), max = Math.max(...valid)
  const runs: { x: number; y: number }[][] = []
  const run: { x: number; y: number }[] = []
  visual.values.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) return
    run.push({ x: visual.values.length === 1 ? 36 : 4 + index / (visual.values.length - 1) * 64, y: max === min ? 20 : 36 - (value - min) / (max - min) * 32 })
  })
  if (run.length) runs.push(run)
  return { kind: 'sparkline' as const, runs, text: `走势数值：${visual.values.length ? visual.values.map(v => v === null ? '缺测' : Number.isFinite(v) ? formatChartValue(v) : '无效值').join('、') : '暂无数据'}` }
}
