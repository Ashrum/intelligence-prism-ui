/** Theme-aware chart colours. Core themes keep their existing values byte-for-byte; blueprint adds ink/accent + pattern decals.
 *  Pure data (no React) so tests can import it directly. */
import { isBlueprintTheme, type PrismTheme } from "./config.ts"

const LIGHT_SERIES = ["#1769AA", "#B8266E", "#2B8050", "#A57013", "#7159A7", "#6B7280"] as const
const DARK_SERIES = ["#86C5FF", "#F296C2", "#99DFB4", "#F4CC86", "#BDACED", "#B6BEC9"] as const
/** Accent first (current / primary series), ink second (baseline), then Prism's existing categorical hues. */
export const BLUEPRINT_SERIES = ["#1D5FBF", "#16181D", "#B8266E", "#2B8050", "#A57013", "#6B7280"] as const
/** secondary → mid → accent; mid is the RGB midpoint so contrastForeground stays ≥ 4.5 across the ramp. */
export const BLUEPRINT_SEQUENTIAL = ["#F3F5F8", "#88AADD", "#1D5FBF"] as const

export function chartSeriesColors(theme?: string): readonly string[] {
  return (theme === "dark" || theme === "blueprint-night") ? DARK_SERIES : theme === "blueprint" ? BLUEPRINT_SERIES : LIGHT_SERIES
}
/** base / selected / fill for single-series shapes (box plot). */
export function chartShapeColors(theme?: string) {
  if (theme === "dark" || theme === "blueprint-night") return { base: "#86C5FF", selected: "#F296C2", fill: "#365B7B" }
  if (theme === "blueprint") return { base: "#16181D", selected: "#1D5FBF", fill: "#E4ECF8" }
  return { base: "#1769AA", selected: "#B8266E", fill: "#76A9D2" }
}
// Night uses the existing dark ramp algorithm with the night secondary surface.
export function chartSequentialDefault(theme: string | undefined, secondary: string): readonly [string, string, string] {
  return theme === "blueprint" ? BLUEPRINT_SEQUENTIAL : [secondary, "#76A9D2", "#1769AA"]
}

/** ECharts surface overrides for blueprint: square ink tooltip with hard offset shadow, ink axis line, per-series decals.
 *  Returns {} for the three core themes so their options are unchanged. */
export function blueprintChartOverrides(theme?: PrismTheme | string) {
  if (!isBlueprintTheme(theme)) return {}
  const night = theme === "blueprint-night"
  return {
    // Keep six texture signatures at CSS-pixel scale: solid, ±45° 2/4 hatch,
    // 2.4px dots on an 8px grid, horizontal/vertical 3/3 stripes.
    // White at .8 keeps pattern/base luminance contrast above 3:1 for the
    // five white-Blueprint fills; night retains these patterns pending design review; printer halftoning and small marks still need paper QA.
    aria: { enabled: true, decal: { show: true, decals: [
      { symbol: "none" },
      { symbol: "rect", symbolSize: 1, dashArrayX: [1, 0], dashArrayY: [2, 4], rotation: -Math.PI / 4, color: "rgba(255,255,255,.8)" },
      { symbol: "rect", symbolSize: 1, dashArrayX: [1, 0], dashArrayY: [2, 4], rotation: Math.PI / 4, color: "rgba(255,255,255,.8)" },
      { symbol: "circle", symbolSize: 0.6, dashArrayX: [4, 4], dashArrayY: [4, 4], color: "rgba(255,255,255,.8)" },
      { symbol: "rect", symbolSize: 1, dashArrayX: [1, 0], dashArrayY: [3, 3], rotation: 0, color: "rgba(255,255,255,.8)" },
      { symbol: "rect", symbolSize: 1, dashArrayX: [1, 0], dashArrayY: [3, 3], rotation: Math.PI / 2, color: "rgba(255,255,255,.8)" },
    ] } },
    tooltip: { borderRadius: 0, borderWidth: 1.5, borderColor: night ? "#C9D6E8" : "#1D2026", shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6, shadowColor: night ? "#6EA8FF" : "rgba(22,24,29,.06)", padding: [8, 12] },
  }
}
