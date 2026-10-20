import {screenshotName} from './measurement-utils.mjs';
export const representative=(theme,width)=>['blueprint','blueprint-night'].includes(theme)?[320,1280].includes(width):theme==='light'&&width===1280;
export function checklistRows(catalog,manifest){
 const rows=[];
 for(const [index,item]of catalog.items.entries()){
  if(item.category==='不适用或已被其他项覆盖')continue;
  for(const theme of manifest.themes)for(const width of manifest.widths){
   if(item.category==='需目检'&&!representative(theme,width)&&!item.extraVisualCombinations?.some(x=>x.theme===theme&&x.width===width))continue;
   rows.push({id:`check-${index+1}-${theme}-${width}`,name:`${item.round} / ${item.criterion}`,theme,viewport:{width,height:manifest.height},route:item.route,pass:null,status:item.category==='需目检'?'pending-visual':'pending-supervisor-browser',measured:null,screenshots:[],source:item.source,sourceLines:item.lines,checklistId:item.id,classification:item.category,roundProbe:item.probe,visual:item.category==='需目检',selector:item.selector,captureKey:`check-${String(index+1).padStart(3,'0')}-${item.probe||'reading'}`,criteria:item.criterion});
  }
 }
 return rows;
}
export function manualMarkdown(rows,baseline){
 const lines=['# BPM1d · Supervisor 目检清单','',`基线：\`${baseline}\`。逐项列出视觉义务；通常为 5 个代表组合，P87 增加 light/320。自动断言与来源排除项见 checklist-classification.json。`,'','截图状态以每行标注为准：未生成的路径是执行计划，不是已有证据。运行 per-round 后本文件自动刷新实际截图索引；生成截图不会自动勾选或判通过。非代表组合没有被宣称目检通过。',''];
 for(const r of rows.filter(x=>x.visual)){
  lines.push(`- [ ] **${r.checklistId} · ${r.theme} · ${r.viewport.width}×${r.viewport.height}**`, `  - 路由：\`${r.route}\`；操作：${r.roundProbe?`脚本准备 \`${r.roundProbe}\` 状态`:'打开原始页面并定位指定区域'}；区域：\`${r.selector||'main'}\`。`, `  - 要看：${r.criteria}`,`  - 来源：\`${r.source}:${r.sourceLines.join(',')}\`。`);
  if(r.screenshots.length){for(const file of r.screenshots)lines.push(`  - 已生成：[${file.split('/').at(-1)}](../../screens/matrix-closeout-20261019/${file.split('/').at(-1)})`);}
  else lines.push(`  - 待生成：\`docs/blueprint/screens/matrix-closeout-20261019/${screenshotName(r)}\`（若准备状态失败，看同项 -failure 文件与 per-round.json 的 error）。`);
  lines.push('');
 }
 return lines.join('\n');
}
