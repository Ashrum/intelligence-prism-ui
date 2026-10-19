// Typecheck only the evidence fixture's dependency graph; no emit/build/browser/server.
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../../..');
const configPath=ts.findConfigFile(root,ts.sys.fileExists,'tsconfig.json');
const raw=ts.readConfigFile(configPath,ts.sys.readFile);
const config=ts.parseJsonConfigFileContent(raw.config,ts.sys,root);
const program=ts.createProgram([path.join(dir,'review-fixture.tsx'),...config.fileNames.filter(f=>f.endsWith('.d.ts'))],{...config.options,noEmit:true,incremental:false});
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length)console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
console.log(JSON.stringify({scope:'review-fixture.tsx and imported dependencies',diagnostics:diagnostics.length,noEmit:true}));
if(diagnostics.length)process.exitCode=1;
