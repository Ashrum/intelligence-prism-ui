import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=new URL('../.sites-runtime/grading-p1-default/',import.meta.url);
await mkdir(dir,{recursive:true});
const out=await build({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup as render} from 'react-dom/server'; import {ScoreReview} from './components/prism-next/score-review'; import {MaterialIntake} from './components/prism-next/material-intake'; import {materialIntakeBase} from './components/prism-next/demos/material-intake'; import {PaperPreview} from './components/prism-next/paper-preview'; export const snapshots={score:render(<ScoreReview studentName="学生" questionLabel="第1题" maxScore={10}/>),material:render(<MaterialIntake {...materialIntakeBase}/>),paper:render(<PaperPreview pages={[{id:'p'}]}/>)};`,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},plugins:[{name:'url',setup(b){b.onResolve({filter:/temml\.mjs\?url$/},()=>({path:'temml',namespace:'url'}));b.onLoad({filter:/.*/,namespace:'url'},()=>({contents:'export default "temml.mjs"'}))}}],write:false});
const file=new URL('bundle.mjs',dir);await writeFile(file,out.outputFiles[0].text);const {snapshots}=await import(file);await rm(file);
const baseline=JSON.parse(await readFile(new URL('./fixtures/grading-p1-baseline.json',import.meta.url),'utf8'));
// React useId's tree-derived values may shift when optional siblings are added;
// preserve every attribute/relationship and normalize only the opaque ID prefix.
function normalize(html){const ids=new Map();return html.replace(/_R_[a-zA-Z0-9]+_/g,id=>{if(!ids.has(id))ids.set(id,`_ID${ids.size}_`);return ids.get(id)})}
test('P1 default ScoreReview and MaterialIntake retain main 8ba0cd6 DOM without opt-in props',()=>{
  for(const name of ['score','material'])assert.equal(normalize(snapshots[name]),normalize(baseline[name]),name);
});
test('P1 default PaperPreview retains baseline DOM except explicitly authorized rotation controls/keyboard help',()=>{
  const actual=snapshots.paper.replace(/<button\b[^>]*aria-label="向[左右]旋转"[\s\S]*?<\/button>/g,'').replace(/aria-label="试卷页面，左右方向键翻页[^\"]*"/,'aria-label="试卷页面，左右方向键翻页"');
  assert.equal(normalize(actual),normalize(baseline.paper));
});
