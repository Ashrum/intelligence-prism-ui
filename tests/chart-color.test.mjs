import test from 'node:test';
import assert from 'node:assert/strict';
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
