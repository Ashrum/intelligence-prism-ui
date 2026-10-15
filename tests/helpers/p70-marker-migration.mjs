// Update only historical expected point outlines; retain frozen fixtures and
// compare the complete actual options without removing any fields.
const surfaces = { light: '#FFFFFF', paper: '#FFFEFB', dark: '#17191C' };
export function p70Snapshot(entry) {
  if (!surfaces[entry.theme] || !['ScatterChart', 'QuadrantScatterChart', 'PairedDotChart', 'ComboChart', 'RadarChart'].includes(entry.name)) return entry;
  return { ...entry, options: entry.options.map(raw => {
    const option = JSON.parse(raw);
    for (const series of option.series) {
      if (entry.name === 'ComboChart' && series.type !== 'line') continue;
      for (const point of series.data) {
        point.itemStyle = { ...point.itemStyle, borderColor: surfaces[entry.theme], borderWidth: 2 };
      }
    }
    return JSON.stringify(option);
  }) };
}
