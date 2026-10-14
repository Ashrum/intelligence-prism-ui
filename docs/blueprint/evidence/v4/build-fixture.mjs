import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), out=path.join(root,'public/__blueprint-v4-qa');
await mkdir(out,{recursive:true});
const source=`
import React from 'react';
import '@/app/(next)/next/blueprint.css';
import {createRoot} from 'react-dom/client';
import {ThemeProvider,useTheme} from 'next-themes';
import {EChart} from '@/components/prism-next/charts/echart';
import {chartSeriesColors} from '@/lib/prism-next/chart-palette';
import {themePalette} from '@/lib/prism-next/config';
function Charts(){
 const {theme,setTheme}=useTheme();const palette=themePalette[theme]??themePalette.light;
 const colors=chartSeriesColors(theme);
 const names=['本次','对照','分类三','分类四','分类五','分类六'];
 const option=(type)=>({color:[...colors],legend:{top:0,textStyle:{color:palette.foreground}},grid:{left:40,right:20,top:75,bottom:35},xAxis:{type:'category',data:['甲','乙','丙','丁']},yAxis:{type:'value'},series:names.map((name,i)=>({type:type==='area'?'line':'bar',name,data:[3+i,5+i,4+i,6+i],...(type==='area'?{areaStyle:{opacity:.8},stack:'total',symbol:'circle'}:{})}))});
 return <main style={{background:palette.background,color:palette.foreground,padding:24}}><h1>蓝图图案浏览器验证</h1><nav>{['light','paper','dark','blueprint'].map(t=><button key={t} onClick={()=>setTheme(t)} aria-pressed={theme===t}>{t}</button>)}</nav>{['bar','area'].map(type=><section key={type} style={{background:palette.surface,marginTop:20,padding:16,border:'1px solid '+palette.border}}><h2>{type==='bar'?'六系列柱形':'六系列堆叠面积'}</h2><EChart label={type==='bar'?'六系列柱形':'六系列堆叠面积'} option={option(type)} height={320}/></section>)}</main>;
}
createRoot(document.getElementById('root')).render(<ThemeProvider attribute="data-prism-theme" defaultTheme="blueprint" enableSystem={false} storageKey="blueprint-v4-qa-theme"><Charts/></ThemeProvider>);
`;
await writeFile('.sites-runtime/blueprint-v4/fixture.tsx',source);
await build({stdin:{contents:source,resolveDir:root,loader:'tsx'},outfile:path.join(out,'fixture.js'),bundle:true,jsx:'automatic',platform:'browser',format:'esm',alias:{'@':root},define:{'process.env.NODE_ENV':'"development"'}});
await writeFile(path.join(out,'index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blueprint v4 chart QA</title><link rel="stylesheet" href="./fixture.css"><style>:root{--line-width:1.5px;--line:#1D2026}body{margin:0;font-family:system-ui,sans-serif}main{min-height:100vh}nav{display:flex;gap:8px;flex-wrap:wrap}button{padding:8px 12px}h1{font-size:22px}h2{font-size:18px}</style><div id="root"></div><script type="module" src="./fixture.js"></script></html>');
console.log('Temporary browser fixture ready: /__blueprint-v4-qa/index.html');
