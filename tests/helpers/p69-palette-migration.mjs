// Apply only P69-authorized visual changes to historical expectations; never
// regenerate the fixtures or normalize actual output. Axis/text colours stay intact.
import { expectedSeries } from './p69-palette-metrics.mjs';
import { sequentialColor, contrastForeground } from '../../lib/prism-next/chart-color.ts';
const oldSeries = {
  light: ['#1769AA', '#B8266E', '#2B8050', '#A57013', '#7159A7', '#6B7280'],
  paper: ['#1769AA', '#B8266E', '#2B8050', '#A57013', '#7159A7', '#6B7280'],
  dark: ['#86C5FF', '#F296C2', '#99DFB4', '#F4CC86', '#BDACED', '#B6BEC9'],
};
const updateColor = (color, theme) => expectedSeries[theme]?.[oldSeries[theme]?.indexOf(color)] ?? color;
export function p69Option(raw, name, theme) {
  const option = JSON.parse(raw), colors = expectedSeries[theme];
  if (!colors) return raw;
  if (option.color) option.color = option.color.map(c => updateColor(c, theme));
  if (name === 'HeatmapChart') {
    const ramp = [option.visualMap.inRange.color[0], theme === 'dark' ? '#3C719F' : '#99C9F3', colors[0]];
    option.visualMap.inRange.color = ramp;
    for (const series of option.series) for (const cell of series.data) {
      if (cell.value[2] >= option.visualMap.min) cell.label.color = contrastForeground(sequentialColor(cell.value[2], option.visualMap.min, option.visualMap.max, ramp));
    }
    return JSON.stringify(option);
  }
  for (const series of option.series ?? []) {
    if (series.color) series.color = updateColor(series.color, theme);
    if (series.itemStyle?.color) series.itemStyle.color = updateColor(series.itemStyle.color, theme);
    if (name === 'ComboChart') {
      series.symbolSize = 13;
      series.lineStyle.color = updateColor(series.lineStyle.color, theme);
    }
    if (name === 'PairedDotChart' && series.markLine) series.markLine.lineStyle.width = 2.5;
    for (const datum of series.data ?? []) {
      if (datum.itemStyle?.color) datum.itemStyle.color = updateColor(datum.itemStyle.color, theme);
      if (name === 'BoxPlotChart') {
        datum.itemStyle.color = theme === 'dark' ? '#3C719F' : '#99C9F3';
        datum.itemStyle.borderColor = updateColor(datum.itemStyle.borderColor, theme);
        if (datum.itemStyle.borderWidth === 1.5) datum.itemStyle.borderWidth = 2.5;
      }
      if (name === 'RadarChart') {
        datum.symbolSize = 13;
        datum.lineStyle.color = updateColor(datum.lineStyle.color, theme);
        datum.lineStyle.width = 2.5;
      }
    }
  }
  return JSON.stringify(option);
}
export function p69Snapshot(entry) {
  // Only coloured markers in these old HTML legends; no text/semantic colour replacement.
  const html = ['DonutChart', 'RadarChart'].includes(entry.name)
    ? entry.html.replace(/style="(background|border-color):(#[A-Fa-f0-9]{6})"/g, (_, prop, color) => `style="${prop}:${updateColor(color, entry.theme)}"`)
    : entry.html;
  return { ...entry, html, ...(entry.options ? { options: entry.options.map(raw => p69Option(raw, entry.name, entry.theme)) } : {}) };
}
