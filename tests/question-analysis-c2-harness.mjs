import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=fileURLToPath(new URL('../',import.meta.url)),file=new URL(`../.sites-runtime/c2-components-${process.pid}/bundle.mjs`,import.meta.url);
await mkdir(new URL('.',file),{recursive:true});
const modules=['question-analysis-panel-compact','knowledge-rail','student-control-bar','question-analysis-card','question-analysis-panel','question-analysis-groups','question-rail','paper-preview-mixed','paper-preview-group'];
const demo=['question-analysis-compact','knowledge-rail','student-control-bar','question-analysis-card','question-analysis-panel','question-analysis-fixtures','paper-preview-mixed'];
const result=await build({stdin:{contents:modules.map(m=>`export * from './components/prism-next/${m}';`).concat(demo.map(m=>`export * from './components/prism-next/demos/${m}';`)).join('\n'),resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false});
await writeFile(file,result.outputFiles[0].text);
export const api=await import(file),h=React.createElement,render=renderToStaticMarkup;
export function capture(Component,props){const nodes=[];function walk(n){if(!React.isValidElement(n))return;nodes.push(n);React.Children.forEach(n.props.children,walk);if(React.isValidElement(n.props.render))walk(n.props.render)}function Probe(){const node=Component(props);walk(node);return node}return {html:render(h(Probe)),nodes}}
