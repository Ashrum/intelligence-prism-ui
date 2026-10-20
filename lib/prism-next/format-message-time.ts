/** Absolute ISO timestamps only; reject invalid calendar dates instead of rolling them forward. */
function parseTime(iso: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(iso)
  if (!match) return undefined
  const [, year, month, day, hour, minute, second] = match.map(Number)
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (month < 1 || month > 12 || day < 1 || day > days || hour > 23 || minute > 59 || second > 59) return undefined
  const date = new Date(iso)
  return Number.isFinite(date.getTime()) ? date : undefined
}

/** Pure formatting: the host supplies now; no clock, timer or browser state is read. */
export function formatMessageTime(
  iso: string,
  now: string | number | Date,
  { timeZone = "Asia/Taipei" }: { timeZone?: string } = {},
): { label: string; title: string } | undefined {
  const date = parseTime(iso)
  const reference = typeof now === "string" ? parseTime(now) : new Date(now)
  if (!date || !reference || !Number.isFinite(reference.getTime())) return undefined
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone, year: "numeric", month: "numeric", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    })
    const parts = (value: Date) => Object.fromEntries(formatter.formatToParts(value).map(part => [part.type, part.value]))
    const value = parts(date)
    const current = parts(reference)
    const day = `${Number(value.month)}月${Number(value.day)}日`
    const hour = Number(value.hour)
    const title = `${value.year}年${day} ${hour < 12 ? "上午" : "下午"}${hour % 12 || 12}:${value.minute}`
    const daysApart = (Date.UTC(Number(current.year), Number(current.month) - 1, Number(current.day)) - Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day))) / 86400000
    const minutes = Math.floor((reference.getTime() - date.getTime()) / 60000)
    // Future timestamps use their calendar date; do not label them as a past event.
    const calendar = `${value.year === current.year ? "" : `${value.year}年`}${day}`
    const label = minutes < 0 ? calendar
      : minutes < 1 ? "刚刚"
      : minutes < 60 ? `${minutes} 分钟前`
      : daysApart === 0 ? `${Math.floor(minutes / 60)} 小时前`
      : daysApart === 1 ? "昨天"
      : daysApart < 7 ? `${daysApart} 天前`
      : calendar
    return { label, title }
  } catch {
    return undefined
  }
}
