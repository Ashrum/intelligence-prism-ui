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
  current: { action: ["#FFFFFF", "#339FF2"], ai: ["#751C4A", "#FDF0F6"], growth: ["#C2F25B", "#FFFFFF"] },
  light: { action: ["#2563EB", "#EFF6FF"], ai: ["#BE123C", "#FFF1F2"], growth: ["#3F6212", "#F7FEE7"] },
  dark: { action: ["#60A5FA", "#172554"], ai: ["#FB7185", "#4C0519"], growth: ["#BEF264", "#1A2E05"] },
} as const
