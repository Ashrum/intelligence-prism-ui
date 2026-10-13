import { init, use } from "echarts/core"
import { HeatmapChart, ScatterChart, BoxplotChart, BarChart, LineChart, PieChart, RadarChart } from "echarts/charts"
import { GridComponent, TooltipComponent, VisualMapComponent, AriaComponent, LegendComponent, MarkLineComponent, MarkAreaComponent, RadarComponent } from "echarts/components"
import { LabelLayout } from "echarts/features"
import { SVGRenderer } from "echarts/renderers"
use([HeatmapChart,ScatterChart,BoxplotChart,BarChart,LineChart,PieChart,RadarChart,RadarComponent,LegendComponent,MarkLineComponent,MarkAreaComponent,LabelLayout,GridComponent,TooltipComponent,VisualMapComponent,AriaComponent,SVGRenderer])
export { init }
