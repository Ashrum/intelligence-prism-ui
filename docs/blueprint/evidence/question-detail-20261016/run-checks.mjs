import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd();
const evidence = resolve(root, 'docs/blueprint/evidence/question-detail-20261016');
const runtime = resolve(root, '.sites-runtime');
for (const p of ['xdg-config','tmp','npm-cache','wrangler/logs','wrangler/registry']) mkdirSync(resolve(runtime,p), { recursive:true });
const env = { ...process.env, SITES_ENV_READY:'1', SITES_PROJECT_ROOT:root, XDG_CONFIG_HOME:resolve(runtime,'xdg-config'), TMPDIR:resolve(runtime,'tmp'), WRANGLER_WRITE_LOGS:'false', WRANGLER_LOG_PATH:resolve(runtime,'wrangler/logs'), MINIFLARE_REGISTRY_PATH:resolve(runtime,'wrangler/registry'), npm_config_cache:resolve(runtime,'npm-cache'), npm_config_audit:'false', npm_config_fund:'false', npm_config_update_notifier:'false' };
const records=[];
const commands=[['math-font',['scripts/check-math-font.mjs']],['typography',['scripts/check-typography.mjs']],['build',['node_modules/vinext/dist/cli.js','build']],['tests',['--test',...readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).sort().map(f=>`tests/${f}`)]],['types',['node_modules/typescript/bin/tsc','--noEmit']]];
for (const [name,args] of commands) {
  if(name==='tests' && records.find(r=>r.name==='build').exitCode!==0) { console.log('Tests withheld: build failed'); continue; }
  const started=new Date().toISOString();
  const result=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8',maxBuffer:64*1024*1024});
  writeFileSync(resolve(evidence,`${name}.log`), (result.stdout??'')+(result.stderr??''));
  const record={name,command:name==='tests'?'node --test tests/*.test.mjs':`node ${args.join(' ')}`,started,finished:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message};
  records.push(record); writeFileSync(resolve(evidence,'engineering.json'),JSON.stringify({node:process.version,homePreserved:true,records},null,2)+'\n');
  console.log(JSON.stringify(record));
}
