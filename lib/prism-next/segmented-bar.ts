/** Internal layout math; percentages remain true data ratios, widths may be enlarged. */
export function segmentedBarLayout(rawValues: readonly number[], total?: number) {
  const values = rawValues.map(value => Number.isFinite(value) && value >= 0 ? value : 0)
  const invalidValues = rawValues.some((value, index) => value !== values[index])
  // Scale before summing so even multiple Number.MAX_VALUE entries stay finite.
  const scale = Math.max(0, ...values, Number.isFinite(total) && total! > 0 ? total! : 0)
  const scaled = values.map(value => scale ? value / scale : 0)
  const sum = scaled.reduce((a, b) => a + b, 0)
  const supplied = scale && Number.isFinite(total) && total! >= 0 ? total! / scale : 0
  const invalidTotal = total !== undefined && (!Number.isFinite(total) || total < 0 || supplied < sum)
  const denominator = Math.max(sum, supplied)
  const ratios = scaled.map(value => denominator ? value / denominator : 0)
  const remainderRatio = denominator ? Math.max(0, (denominator - sum) / denominator) : 0
  const weights = [...ratios, remainderRatio]
  const positive = values.filter(value => value > 0).length
  const floor = Math.min(0.01, 1 / (positive + (remainderRatio > 0 ? 1 : 0)))
  const widths = weights.map(() => 0)
  // Water-fill: pin undersized positive segments, then redistribute the remaining
  // width proportionally. No pixel min-width or inter-item gap can overflow.
  const pending = new Set(weights.flatMap((weight, index) => weight > 0 || values[index] > 0 ? [index] : []))
  let available = 1
  while (pending.size) {
    const weightSum = [...pending].reduce((sum, index) => sum + weights[index], 0)
    const small = [...pending].filter(index => index < values.length && (weightSum ? weights[index] / weightSum * available : 0) < floor)
    if (!small.length) {
      for (const index of pending) widths[index] = weightSum ? weights[index] / weightSum * available : 0
      break
    }
    for (const index of small) { widths[index] = floor; available = Math.max(0, available - floor); pending.delete(index) }
  }
  return { values, ratios, widths: widths.slice(0, -1), remainderRatio, remainderWidth: widths.at(-1)!, invalidValues, invalidTotal, empty: positive === 0 }
}
