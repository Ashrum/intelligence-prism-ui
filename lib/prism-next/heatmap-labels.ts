/** Blueprint-only narrow-width rule (PO decision 2026-10-14, option B).
 * Keep labels when width is unknown or the visible data disclosure is unavailable. */
export const HEATMAP_LABEL_MIN_WIDTH = 400
export function heatmapDescription(label: string, showCellLabels: boolean) {
  return showCellLabels ? label : `${label.replace(/[。.!！?？\s]+$/u, "")}。窄屏下格内数值已隐藏，点按格子查看数值`
}
export function heatmapShowsCellLabels(
  width: number | undefined,
  dataDisclosure: "visible" | "hidden" = "visible",
  theme?: string,
) {
  if (theme !== "blueprint" || dataDisclosure === "hidden") return true
  return width === undefined || width >= HEATMAP_LABEL_MIN_WIDTH
}
