// P64 intentionally extracts/replaces ONLY these legend subtrees. Frozen fixtures
// remain unchanged; all surrounding markup, disclosures and chart options still compare.
// Exact new legend content/markers/colours and placement are covered by p64-charts.
export const withoutP64Legend = html => html.replace(/<ul\b(?=[^>]*aria-label="(?:图例|系列图例|指标图例|点形图例|系列与坐标轴|参考线标签)")[^>]*>[\s\S]*?<\/ul>/g, '');

// Preserve P21's frozen hashes, including actual label text and actual marker colour:
// reconstruct only the former HTML wrapper from the current rendered legend.
export const restoreP64ReferenceLegend = html => html.replace(/<ul aria-label="参考线标签" data-chart-legend="true"[^>]*>([\s\S]*?)<\/ul>/g, (_, content) => {
 const items = [...content.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(([, item]) => {
  const color = item.match(/<line\b[^>]* stroke="([^"]+)"/), label = item.match(/<span class="whitespace-normal \[overflow-wrap:anywhere\]">([\s\S]*?)<\/span>/);
  if (!color || !label || !item.includes('data-legend-marker="dashed-line"')) throw new Error('Unexpected P64 reference legend shape');
  return `<li class="flex min-w-0 items-start gap-2"><span aria-hidden="true" class="mt-2 w-6 shrink-0 border-t border-dashed" style="border-color:${color[1]}"></span><span class="min-w-0 break-words [overflow-wrap:anywhere]">${label[1]}</span></li>`;
 });
 return `<ul aria-label="参考线标签" class="space-y-1 text-ui-hint">${items.join('')}</ul>`;
});
