/** ECharts appends the common data-table guidance exactly once. */
export function chartDescription(label: string) {
  return `${label.replace(/[。.!！?？\s]+$/u, "")}。完整数值及缺测说明见下方数据表。`
}
