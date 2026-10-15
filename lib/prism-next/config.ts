export const DESIGN_VERSION = "1.14.0"
export const DESIGN_STATUS = "字体实施候选"
export const COSS_COMMIT = "e937becd2d5ffb5c621eed6f8b1f223cbb6051e7"
export const themeOptions = [
  { value: "light", label: "浅色" },
  { value: "paper", label: "暖纸" },
  { value: "dark", label: "深色" },
  { value: "blueprint", label: "蓝图" },
] as const
export type PrismTheme = (typeof themeOptions)[number]["value"]
/** Core three-theme review matrix. Existing demo matrices keep their scope; selectable Blueprint is reviewed separately. */
export const coreThemes = ["light", "paper", "dark"] as const satisfies readonly PrismTheme[]
export type PrismCoreTheme = (typeof coreThemes)[number]

export const themePalette = {
  light: { background: "#FFFFFF", surface: "#FFFFFF", secondary: "#F4F5F7", border: "#E3E5E9", foreground: "#1F2328", heading: "#1F2328", muted: "#4B5563", disabled: "#B0B4BB", link: "#1769AA" },
  paper: { background: "#F4F1EA", surface: "#FFFEFB", secondary: "#EAE6DF", border: "#D8D5CE", foreground: "#1E293B", heading: "#0F172A", muted: "#4B5563", disabled: "#A5A29C", link: "#1D4ED8" },
  dark: { background: "#0F0F0F", surface: "#17191C", secondary: "#202328", border: "#34383E", foreground: "#E1E5EA", heading: "#F4F6F8", muted: "#B6BEC9", disabled: "#7A8593", link: "#86C5FF" },
  blueprint: { background: "#F6F6F3", surface: "#FFFFFF", secondary: "#F3F5F8", border: "#D6DAE1", foreground: "#16181D", heading: "#16181D", muted: "#4B5260", disabled: "#8B929E", link: "#1D5FBF", line: "#1D2026" },
} as const

/** Blueprint-only structure values; mirrored by theme.css. Not used by the three core themes. */
export const blueprintGeometry = { radius: "0px", line: "#1D2026", lineWidth: "1.5px", grid: "rgba(29,32,38,.055)", gridSize: "40px", frameInset: "18px", shadowOffset: "4px 4px 0 #1D5FBF" } as const

export const brandColors = [
  { name: "曜蓝", color: "#339FF2" },
  { name: "曜紫红", color: "#E0438F" },
  { name: "曜青绿", color: "#C2F25B" },
] as const
