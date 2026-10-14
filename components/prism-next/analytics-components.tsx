// Public reusable exports. Data aggregation and business rules belong to the caller.
export { MetricSummary, GoalComparison, StatusComposition, FilterBar, DataRecordTable } from "./data-display"
export { TrendChart, ComparisonChart } from "./charts/basic-charts"
export { HeatmapChart, ScatterChart, BoxPlotChart } from "./charts/advanced-charts"

export {PairedDotChart} from "./charts/paired-dot-chart"
export {QuadrantScatterChart} from "./charts/scatter-chart"
export {ComboChart} from "./charts/combo-chart"
export { DonutChart, type DonutChartProps, type DonutSegment, type ChartTone } from "./charts/donut-chart"
export { RadarChart, type RadarChartProps, type RadarAxis, type RadarSeries } from "./charts/radar-chart"
export { SegmentedBar, type SegmentedBarProps, type SegmentedBarSegment, type SegmentedBarTone } from "./charts/segmented-bar"

export { ChartLegend, type ChartLegendProps, type ChartLegendItem, type ChartLegendMarker } from "./charts/chart-legend"
export { trendLegendItems, comparisonLegendItems } from "./charts/basic-charts"
export { comboLegendItems } from "./charts/combo-chart"
export { scatterLegendItems, quadrantLegendItems } from "./charts/scatter-chart"
export { pairedDotLegendItems } from "./charts/paired-dot-chart"
