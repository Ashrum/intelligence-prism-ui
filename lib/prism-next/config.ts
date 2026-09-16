export const DESIGN_VERSION = "1.11.0"
export const COSS_COMMIT = "e937becd2d5ffb5c621eed6f8b1f223cbb6051e7"
export const themeOptions = [
  { value: "light", label: "浅色" },
  { value: "paper", label: "暖纸" },
  { value: "dark", label: "深色" },
] as const
export type PrismTheme = (typeof themeOptions)[number]["value"]

export const themePalette = {
  light: { background: "#FFFFFF", surface: "#FFFFFF", secondary: "#F4F5F7", border: "#E3E5E9", foreground: "#1F2328", heading: "#1F2328", muted: "#6B7280", disabled: "#B0B4BB", link: "#1769AA" },
  paper: { background: "#F4F1EA", surface: "#FFFEFB", secondary: "#EAE6DF", border: "#D8D5CE", foreground: "#1E293B", heading: "#0F172A", muted: "#4B5563", disabled: "#A5A29C", link: "#1D4ED8" },
  dark: { background: "#0F0F0F", surface: "#17191C", secondary: "#202328", border: "#34383E", foreground: "#E1E5EA", heading: "#F4F6F8", muted: "#B6BEC9", disabled: "#7A8593", link: "#86C5FF" },
} as const

export const brandColors = [
  { name: "曜蓝", color: "#339FF2" },
  { name: "曜紫红", color: "#E0438F" },
  { name: "曜青绿", color: "#C2F25B" },
] as const
