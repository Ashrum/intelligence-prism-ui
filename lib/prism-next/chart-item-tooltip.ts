/** Opt-in preservation of a clicked item across setOption (heatmaps only).
 * Resolve by stable item ID so reordered/removed data never displays a stale index. */
type ItemTarget = { seriesIndex: number; id: string }
type ItemEvent = { seriesIndex?: number; data?: unknown }
type TooltipChart = { dispatchAction: (action: { type: "showTip" | "hideTip"; seriesIndex?: number; dataIndex?: number }) => void }

export function createItemTooltipTracker() {
  let target: ItemTarget | undefined
  function clear() { target = undefined }
  return {
    clear,
    click(event: ItemEvent) {
      const data = event.data as { id?: unknown } | undefined
      target = typeof data?.id === "string" && typeof event.seriesIndex === "number"
        ? { seriesIndex: event.seriesIndex, id: data.id } : undefined
    },
    dismiss(chart: TooltipChart) {
      clear()
      chart.dispatchAction({ type: "hideTip" })
    },
    apply(chart: TooltipChart, seriesOption: unknown, setOption: () => void) {
      // setOption may emit hideTip synchronously; retain only the pre-update intent.
      const clicked = target
      setOption()
      if (!clicked) return
      const series = Array.isArray(seriesOption) ? seriesOption : [seriesOption]
      const data: unknown = series[clicked.seriesIndex]?.data
      const dataIndex = Array.isArray(data)
        ? data.findIndex(item => item && typeof item === "object" && item.id === clicked.id) : -1
      if (dataIndex < 0) { clear(); return }
      target = clicked
      chart.dispatchAction({ type: "showTip", seriesIndex: clicked.seriesIndex, dataIndex })
    },
  }
}
