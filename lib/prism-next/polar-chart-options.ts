import type { EChartsOption } from "echarts"
import { formatChartValue, isChartValue } from "./chart-options"

/** All colours are supplied by useChartTheme; tones index its existing six-colour palette. */
export type ChartTone = "neutral" | "info" | "success" | "warning" | "destructive" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5" | "chart-6"
export type ChartTheme = { palette: { foreground: string; muted: string; border: string; background: string; surface: string }; colors: readonly string[] }
export type DonutSegment = { id: string; label: string; value: number; tone?: ChartTone }
export type RadarAxis = { id: string; label: string; max?: number }
export type RadarSeries = { id: string; label: string; values: number[]; tone?: ChartTone }
const toneIndex: Record<ChartTone, number> = { neutral: 5, info: 0, success: 2, warning: 3, destructive: 1, "chart-1": 0, "chart-2": 1, "chart-3": 2, "chart-4": 3, "chart-5": 4, "chart-6": 5 }
export const chartToneColor = (theme: ChartTheme, index: number, tone?: ChartTone) => theme.colors[(tone === undefined ? index : toneIndex[tone]) % theme.colors.length]
const nonnegative = (value: unknown): value is number => isChartValue(value) && value >= 0
export const polarValueText = (value: number | undefined) => value === undefined ? "缺测" : nonnegative(value) ? formatChartValue(value) : "无效值"

export function donutModel(segments: readonly DonutSegment[], theme: ChartTheme, valueFormatter?: (value: number, segment: DonutSegment) => string) {
  let colorIndex = 0
  const rows = segments.map(segment => ({
    ...segment,
    valid: nonnegative(segment.value),
    color: chartToneColor(theme, nonnegative(segment.value) && segment.value > 0 ? colorIndex++ : 5, segment.tone),
    text: nonnegative(segment.value) ? valueFormatter?.(segment.value, segment) ?? formatChartValue(segment.value) : "无效值",
  }))
  const positive = rows.filter(row => row.valid && row.value > 0)
  const tooMany = positive.length > 6
  return { rows, positive, tooMany, ready: positive.length > 0 && !tooMany, invalid: rows.filter(row => !row.valid).length }
}

/** No legend selection or selected state is delegated to ECharts; clicks only emit an ID. */
export function donutChartOption(model: ReturnType<typeof donutModel>, theme: ChartTheme): EChartsOption {
  return {
    animation: false,
    xAxis: [], yAxis: [],
    color: [...theme.colors],
    tooltip: { formatter: params => {
      const item = (Array.isArray(params) ? params[0] : params).data as { name: string; text: string }
      return `${item.name}：${item.text}`
    } },
    series: [{
      type: "pie", radius: ["62%", "92%"], center: ["50%", "50%"],
      selectedMode: false, stillShowZeroSum: false, showEmptyCircle: false,
      label: { show: false, color: theme.palette.foreground }, labelLine: { show: false },
      emphasis: { scale: false, label: { show: false } },
      data: model.ready ? model.positive.map(row => ({ id: row.id, name: row.label, value: row.value, text: row.text, itemStyle: { color: row.color, borderColor: theme.palette.background, borderWidth: 1 } })) : [],
    }],
  }
}

export function radarModel(axes: readonly RadarAxis[], series: readonly RadarSeries[]) {
  const maxima = axes.map((axis, index) => axis.max ?? Math.max(1, ...series.flatMap(item => nonnegative(item.values[index]) ? [item.values[index]] : [])))
  const invalidAxes = maxima.some(max => !isChartValue(max) || max <= 0)
  const valid = series.filter(item => item.values.length === axes.length && item.values.every((value, index) => nonnegative(value) && value <= maxima[index]))
  const dimensionOK = axes.length >= 3 && axes.length <= 8
  const countOK = series.length >= 1 && series.length <= 2
  return { maxima, valid, invalidAxes, dimensionOK, countOK, ready: dimensionOK && countOK && !invalidAxes && valid.length > 0, invalid: series.length - valid.length }
}

export function radarChartOption(axes: readonly RadarAxis[], series: readonly RadarSeries[], theme: ChartTheme): EChartsOption {
  const model = radarModel(axes, series)
  return {
    animation: false,
    xAxis: [], yAxis: [],
    color: [...theme.colors],
    radar: {
      center: ["50%", "50%"], radius: "58%", splitNumber: 4,
      axisName: { color: theme.palette.foreground, fontSize: 12 }, axisNameGap: 8,
      axisLine: { lineStyle: { color: theme.palette.border } },
      splitLine: { lineStyle: { color: theme.palette.border } }, splitArea: { show: false },
      // ECharts passes indicator options to AxisBuilder, including nameTruncate and tooltip.
      // Keep the original name, so truncation never loses the hover text.
      indicator: axes.map((axis, index) => ({ name: axis.label, min: 0, max: model.maxima[index], nameTruncate: { maxWidth: 64, ellipsis: "…" }, tooltip: { show: true, formatter: () => axis.label } })),
    },
    tooltip: { formatter: params => {
      const item = (Array.isArray(params) ? params[0] : params).data as { name: string; value: number[] }
      return [item.name, ...axes.map((axis, index) => `${axis.label}：${polarValueText(item.value[index])} / ${formatChartValue(model.maxima[index])}`)].join("\n")
    } },
    series: [{ type: "radar", data: model.ready ? model.valid.map(item => {
      const index = series.indexOf(item), color = chartToneColor(theme, index, item.tone)
      return { id: item.id, name: item.label, value: [...item.values], symbol: index === 0 ? "circle" : "diamond", symbolSize: 13,
        lineStyle: { color, width: 2.5, type: index === 0 ? "solid" : "dashed" }, itemStyle: { color, borderColor: theme.palette.surface, borderWidth: 2 } }
    }) : [] }],
    media: [{ option: { radar: { radius: "58%" } } }, { query: { maxWidth: 440 }, option: { radar: { radius: "42%" } } }],
  }
}
