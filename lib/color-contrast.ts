export function contrastRatio(foreground: string, background: string): number | null {
  if (![foreground, background].every(color => /^#[\da-f]{6}$/i.test(color))) return null
  const luminance = (color: string) => {
    const channels = [1, 3, 5].map(offset => {
      const value = parseInt(color.slice(offset, offset + 2), 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const first = luminance(foreground)
  const second = luminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

export const contrastPresets = {
  current: { action: ["#064B7E", "#E6F4FA"], ai: ["#751C4A", "#FDF0F6"], growth: ["#C2F25B", "#FFFFFF"] },
  light: { action: ["#2563EB", "#EFF6FF"], ai: ["#BE123C", "#FFF1F2"], growth: ["#3F6212", "#F7FEE7"] },
  dark: { action: ["#60A5FA", "#172554"], ai: ["#FB7185", "#4C0519"], growth: ["#BEF264", "#1A2E05"] },
} as const

// These candidates are scoped to the Color review; they do not set the site theme.
export const colorReviewPalettes = {
  current: {
    "--canvas": "#F5F5F3", "--surface": "#FFFFFF", "--surface-subtle": "#EFEFEC",
    "--surface-hover": "#EAEAE6", "--surface-active": "#E4E5E0",
    "--text-primary": "#20231F", "--text-secondary": "#3B4039", "--text-tertiary": "#444940",
    "--border-default": "#D5D6D1",
  },
  reference: {
    "--canvas": "#FAFAF8", "--surface": "#FFFFFF", "--surface-subtle": "#F1EFE8",
    "--surface-hover": "#F6F4EF", "--surface-active": "#F1EFE8",
    "--text-primary": "#2C2C2A", "--text-secondary": "#444440", "--text-tertiary": "#4F4F49",
    "--border-default": "#D3D1C7",
  },
} as const

export const colorReviewButtons = {
  bright: { foreground: "#05080A", background: "#339FF2", hover: "#45A8F4", pressed: "#58B1F6", border: "#064B7E" },
  deep: { foreground: "#FFFFFF", background: "#064B7E", hover: "#054372", pressed: "#04375E", border: "#064B7E" },
} as const
