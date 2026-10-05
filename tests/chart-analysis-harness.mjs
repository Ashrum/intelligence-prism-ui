import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=fileURLToPath(new URL('../',import.meta.url));
const file=new URL(`../.sites-runtime/p20-${process.pid}/bundle.mjs`,import.meta.url);
await mkdir(new URL('.',file),{recursive:true});
const result=await build({stdin:{contents:`export * from './components/prism-next/charts/basic-charts'; export * from './components/prism-next/question-analysis-panel'; export * from './components/prism-next/demos/question-analysis-fixtures';`,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false});
await writeFile(file,result.outputFiles[0].text);
export const api=await import(file),h=React.createElement,render=renderToStaticMarkup;
const noop=()=>{};
export const panelProps={...api.analysisPanel,onKnowledge:noop,onEvidence:noop};
export const chartProps={label:'外部数值',data:[{id:'a',label:'长中文类别',value:0},{id:'b',label:'缺测',value:null},{id:'c',label:'类别三',value:80}],unit:'分',onSelect:noop};
export function legacySnapshots(){return Object.fromEntries([
 ...[true,false].flatMap(horizontal=>[undefined,[-20,100]].map(domain=>[`chart-${horizontal}-${domain}`,render(h(api.ComparisonChart,{...chartProps,horizontal,domain}))])),
 ['chart-empty',render(h(api.ComparisonChart,{label:'空数据',data:[]}))],
 ...['选择题','填空题','解答题'].map(kind=>[`panel-${kind}`,render(h(api.QuestionAnalysisPanel,{...panelProps,kind}))]),
 ['panel-knowledge',render(h(api.QuestionAnalysisPanel,{...panelProps,knowledge:{topic:'专题',rate:42,affected:21,volumeText:'12 分',evidence:api.analysisEvidence}}))],
 ['panel-unknown',render(h(api.QuestionAnalysisPanel,{...panelProps,knowledge:{topic:'未知专题',rate:null,rateEmptyText:'未提供',affected:'未提供',evidence:[]}}))]
]);}
