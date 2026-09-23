import { readFileSync,readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const dirs=['components/prism-next','examples','app/(next)'];
const issues=[];let count=0;
for(const dir of dirs)for(const name of readdirSync(join(root,dir),{recursive:true})){
 if(!/\.tsx$/.test(name))continue;
 const file=join(dir,name).split(sep).join('/'),src=readFileSync(join(root,file),'utf8');count++;
 for(const [i,line]of src.split('\n').entries()){
  if(/\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b|\btext-\[(?:\d|calc\(|clamp\()|\btracking-(?:tight|tighter|wide|wider|widest)|\bfont-(?:bold|extrabold|black)\b/.test(line))issues.push(`${file}:${i+1}: use a semantic typography role`);
  if(/fontSize\s*[:=]/.test(line)&&!['components/prism-next/question-print.tsx','components/prism-next/fixtures/question-figure.tsx','components/prism-next/charts/scatter-chart.tsx','components/prism-next/charts/basic-charts.tsx'].includes(file))issues.push(`${file}:${i+1}: local fontSize requires a documented print, figure or chart exception`);
 }
}
for(const dir of dirs)for(const name of readdirSync(join(root,dir),{recursive:true})){
 if(!/\.css$/.test(name))continue;
 const file=join(dir,name).split(sep).join('/');
 if(['app/(next)/next/theme.css','app/(next)/next/typography.css'].includes(file))continue;
 const src=readFileSync(join(root,file),'utf8');
 for(const m of src.matchAll(/font-size\s*:\s*([^;}]+)/g))if(!m[1].startsWith('var(--text-'))issues.push(`${file}: local CSS size must use a semantic token`);
}
if(issues.length){console.error(issues.join('\n'));process.exit(1);}
console.log(`Typography guard: ${count} owned TSX files use semantic sizes; pinned coss, print units, figure and chart labels have documented boundaries.`);
