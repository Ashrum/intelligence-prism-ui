import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizeReview } from './review-freeze-harness.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
export const states = { default: {}, choice: {selected:'q1'}, fill: {selected:'q6'}, evidence: {view:'knowledge',knowledgeId:'ellipse-focus',markedPoints:['p2']}, student: {studentChosen:true}, full: {answerFilter:'all',fullOpen:true}, collapsed: {preferences:{best:true}}, immersive:{immersive:true}, missing:{missing:true}, sorted:{sort:'rate'} };
export async function renderer() {
 const file=new URL(`../.sites-runtime/c2-freeze-${process.pid}/probe.mjs`,import.meta.url);
 await mkdir(new URL('.',file),{recursive:true});
 const result=await build({stdin:{contents:"export { QuestionReviewDesign } from './examples/question-review/question-review'",resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false,plugins:[{name:'states',setup(b){b.onLoad({filter:/examples\/question-review\/question-review\.tsx$/},async args=>{let source=(await readFile(args.path,'utf8')).replace('import { ReviewTools } from "@/examples/review-tools/review-tools"','const ReviewTools = () => null');
 source=source.replace(/(\[(\w+),[^\]]+\]=useState(?:<[^;\n]*?>)?)\(([^\n]*?)\)(?=,|\n)/g,(all,prefix,name,value)=>Object.values(states).some(state=>name in state)?`${prefix}((globalThis as any).__c2State?.${name} ?? (${value}))`:all);
 source=source.replace('preferences:{},ready:false','preferences:(globalThis as any).__c2State?.preferences??{},ready:false');
 return {loader:'tsx',contents:source};});}}]});
 await writeFile(file,result.outputFiles[0].text);const api=await import(file);
 return state=>{globalThis.__c2State=state;try{return normalizeReview(renderToStaticMarkup(React.createElement(api.QuestionReviewDesign)))}finally{delete globalThis.__c2State}};
}
