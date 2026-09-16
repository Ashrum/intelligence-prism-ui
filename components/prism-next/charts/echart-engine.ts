import { init, use } from "echarts/core"
import { HeatmapChart, ScatterChart, BoxplotChart } from "echarts/charts"
import { GridComponent, TooltipComponent, VisualMapComponent, AriaComponent } from "echarts/components"
import { SVGRenderer } from "echarts/renderers"
use([HeatmapChart,ScatterChart,BoxplotChart,GridComponent,TooltipComponent,VisualMapComponent,AriaComponent,SVGRenderer])
export { init }
