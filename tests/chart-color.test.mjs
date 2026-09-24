import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdir,writeFile,rm} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import React from 'react'
import {renderToStaticMarkup as render} from 'react-dom/server'
import {themePalette} from '../lib/prism-next/config.ts'

const root=fileURLToPath(new URL('../',import.meta.url))
const file=new URL('../.sites-runtime/chart-main-colors-test.mjs',import.meta.url)
await mkdir(new URL('../.sites-runtime/',import.meta.url),{recursive:true})
const bundle=await build({stdin:{contents:`export {HeatmapChart,BoxPlotChart} from './components/prism-next/charts/advanced-charts';export {useChartTheme} from './components/prism-next/charts/chart-theme';export {captured} from './components/prism-next/charts/echart';export {setTheme} from 'next-themes';`,resolveDir:root,loader:'tsx'},bundle:true,platform:'node',format:'esm',packages:'external',alias:{'@':root},write:false,plugins:[{name:'chart-option-probe',setup(build){
 build.onResolve({filter:/^next-themes$/},()=>({path:'theme-probe',namespace:'probe'}))
 build.onLoad({filter:/.*/,namespace:'probe'},()=>({contents:`let theme='light';export const setTheme=value=>theme=value;export const useTheme=()=>({theme});`,loader:'js'}))
 build.onLoad({filter:/[\\/]echart\.tsx$/},()=>({contents:`export const captured=[];export function EChart({option}){captured.push(option);return null}`,loader:'tsx'}))
}}]})
await writeFile(file,bundle.outputFiles[0].text)
const {HeatmapChart,BoxPlotChart,useChartTheme,captured,setTheme}=await import(file)
await rm(file)

test('main chart palettes and heatmap ramps are preserved in all themes with readable labels and explicit missing values',()=>{
 const expected={light:['#F4F5F7','#76A9D2','#1769AA'],paper:['#EAE6DF','#76A9D2','#1769AA'],dark:['#202328','#76A9D2','#1769AA']}
 for(const [theme,stops] of Object.entries(expected)){
  setTheme(theme)
  assert.deepEqual(useChartTheme().colors,theme==='dark'?['#86C5FF','#F296C2','#99DFB4','#F4CC86','#BDACED','#B6BEC9']:['#1769AA','#B8266E','#2B8050','#A57013','#7159A7','#6B7280'])
  const cells=Array.from({length:101},(_,value)=>({id:String(value),row:'r',column:'c',value})).concat({id:'missing',row:'r',column:'c',value:null})
  render(React.createElement(HeatmapChart,{label:'主线配色',rows:[{id:'r',label:'行'}],columns:[{id:'c',label:'列'}],cells,selectedId:'0'}))
  const option=captured.at(-1)
  assert.deepEqual(option.visualMap.inRange.color,stops)
  assert.deepEqual(option.visualMap.outOfRange.color,[themePalette[theme].secondary])
  assert.equal(sequentialColor(-10,0,100,stops).toUpperCase(),stops[0])
  assert.equal(sequentialColor(110,0,100,stops).toUpperCase(),stops[2])
  let previous=relativeLuminance(stops[0])
  for(let value=0;value<=100;value++){
   const fill=sequentialColor(value,0,100,stops),brightness=relativeLuminance(fill)
   // Main dark ramp rises to its midpoint, then falls; preserve that behavior exactly.
   assert.ok(theme==='dark'&&value<=50?brightness>=previous:brightness<=previous,`${theme}: ${value} ramp direction`)
   const label=option.series[0].data[value].label.color
   assert.equal(label,contrastForeground(fill))
   const labelBrightness=relativeLuminance(label)
   assert.ok((Math.max(brightness,labelBrightness)+.05)/(Math.min(brightness,labelBrightness)+.05)>=4.5,`${theme}: label at ${value}`)
   previous=brightness
  }
  const zero=option.series[0].data[0],missing=option.series[0].data.at(-1)
  assert.equal(zero.value[2],0);assert.ok(missing.value[2]<0);assert.equal(missing.rawLabel,'缺测')
  assert.equal(missing.label.color,themePalette[theme].muted);assert.equal(missing.itemStyle.decal,undefined)
  assert.equal(zero.itemStyle.borderWidth,2);assert.equal(option.series[0].emphasis.itemStyle.color,'inherit')
  render(React.createElement(BoxPlotChart,{label:'箱线图',selectedId:'b',data:[{id:'a',label:'A',values:[0,1,2,3,4]},{id:'b',label:'B',values:[0,1,2,3,4]}]}))
  const boxes=captured.at(-1).series[0].data
  assert.equal(boxes[0].itemStyle.color,theme==='dark'?'#365B7B':'#76A9D2')
  assert.equal(boxes[0].itemStyle.borderColor,theme==='dark'?'#86C5FF':'#1769AA')
  assert.equal(boxes[1].itemStyle.borderColor,theme==='dark'?'#F296C2':'#B8266E')
 }
})

import {paperSequentialCandidate, sequentialColor, relativeLuminance, contrastForeground} from '../lib/prism-next/chart-color.ts';

test('heatmap labels stay readable through the entire RGB ramp, including the former white-label failure range',()=>{
 for(const ramp of [['#F4F5F7','#76A9D2','#1769AA'],['#EAE6DF','#76A9D2','#1769AA'],['#202328','#76A9D2','#1769AA'],paperSequentialCandidate]){
  for(let value=0;value<=1000;value++){
   const bg=sequentialColor(value,0,1000,ramp),fg=contrastForeground(bg),a=relativeLuminance(bg),b=relativeLuminance(fg);
   assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${value}: ${bg}/${fg}`);
  }
 }
});
test('paper sequential ramp has monotonic luminance and preserves range endpoints',()=>{
 assert.equal(sequentialColor(-10,0,100,paperSequentialCandidate).toUpperCase(),paperSequentialCandidate[0]);
 assert.equal(sequentialColor(110,0,100,paperSequentialCandidate).toUpperCase(),paperSequentialCandidate[2]);
 let previous=Infinity;
 for(let value=0;value<=1000;value++){
  const l=relativeLuminance(sequentialColor(value,0,1000,paperSequentialCandidate));
  assert.ok(l<=previous+1e-12);previous=l;
 }
});
