// Static preparation only. Does not import Playwright, connect to a server or launch a browser.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../../..');
const read = p => readFile(path.join(root, p), 'utf8');
const hash = s => createHash('sha256').update(s).digest('hex');
const mapping = {
 'r1-20261016': 'P73', 'portal-20261016': 'P74', 'question-detail-20261016': 'P75',
 'shell-nav-20261016': 'P76', 'nav-folio-20261016': 'P77', 'user-bubble-20261016': 'P78',
 'cards-20261016': 'P79', 'facts-narrow-20261017': 'P82', 'agent-mark-glyph-20261017': 'P83',
 'r9-20261018': 'P84', 'object-cards-20261018': 'P85/P85b/P85c',
};
const sources = [], rounds = [], routeMap = new Map();
function route(p, source) { if(p==='/next/components/agent-components/existing-agent-inputs') p='/next/components/agent-components#existing-agent-inputs'; p = p.replace(/#.*$/, ''); if (!routeMap.has(p)) routeMap.set(p, new Set()); routeMap.get(p).add(source); }
for (const [folder, name] of Object.entries(mapping)) {
 const source = `docs/blueprint/evidence/${folder}/browser-checklist.md`;
 const content = await read(source);
 sources.push({ path: source, sha256: hash(content), lines: content.split('\n').length });
 const routes = [...new Set(content.match(/\/next\/[a-zA-Z0-9/#-]+/g) ?? [])];
 if (name === 'P76') routes.unshift('/next');
 routes.forEach(p => route(p, source));
 // Keep EVERY original line for traceability, including manual/host-specific boundaries.
 rounds.push({ name, sources: [source], routes, checklist: content.split('\n').map((text, i) => ({ line: i + 1, text })).filter(x => x.text.trim()) });
}
for (const [name, source, routes] of [
 ['首批', 'docs/blueprint/evidence/common-20261015/checks.md', ['/next/foundations/blueprint']],
 ['第二批', 'docs/blueprint/evidence/batch2-20261016/checks.md', ['/next/foundations/blueprint']],
 ['编辑式排版与字体', 'docs/blueprint/evidence/editorial-20261016/checks.md', ['/next/foundations/blueprint']],
 ['BPW1', 'tests/blueprint-theme.test.mjs', ['/next/foundations/blueprint']],
 ['夜图', 'docs/blueprint/evidence/night-20261016/checks.md', ['/next/foundations/blueprint', '/next/components/tabs', '/next/components/evidence-matrix']],
 ['P86', 'tests/agent-prompt-disabled-announce.test.mjs', ['/next/components/agent-components/prompt-bar']],
]) {
 const content = await read(source); sources.push({ path: source, sha256: hash(content), lines: content.split('\n').length });
 rounds.push({ name, sources: [source], routes, checklist: content.split('\n').map((text, i) => ({line: i + 1, text})).filter(x => x.text.trim()) });
 routes.forEach(p => route(p, source));
}
for (const batch of ['common-20261015', 'batch2-20261016']) {
 const source = `docs/blueprint/evidence/${batch}/routes.json`;
 const content = await read(source); sources.push({ path: source, sha256: hash(content) });
 for (const item of JSON.parse(content).routes) route(`/next/components/${item.route}`, source);
}
route('/next/experiments/blueprint', 'app/(next)/next/experiments/blueprint/page.tsx');
const legacy = [];
for (const [batch, filename] of [['batch2-20261016','first-interactions.json'], ['batch2-20261016','interactions.json']]) {
 const source = `docs/blueprint/evidence/${batch}/${filename}`;
 const content = await read(source); sources.push({path:source, sha256:hash(content)});
 JSON.parse(content).checks.forEach((c, i) => legacy.push({id:`${filename}-${i+1}`, name:c.name, source, historicalOnly:true}));
}
const routes = [...routeMap].map(([route, s]) => ({route, sources:[...s]}));
// Source existence: dynamic routes may be resolved through [slug], not a per-route page file.
const appFiles = [];
async function walk(p) { for (const d of await readdir(path.join(root,p),{withFileTypes:true})) { const q=`${p}/${d.name}`; if(d.isDirectory()) await walk(q); else if(d.name==='page.tsx') appFiles.push(q); } }
await walk('app/(next)');
for(const item of routes) {
 const exact=`app/(next)${item.route}/page.tsx`;
 item.pageSource=appFiles.includes(exact)?exact:appFiles.find(p=>new RegExp('^'+p.replace('app/(next)','').replace('/page.tsx','').replace(/\[[^\]]+\]/g,'[^/]+')+'$').test(item.route));
 if(!item.pageSource) throw Error(`Route requires source resolution: ${item.route}`);
}
const samples = [];
for (const source of ['components/prism-next/blueprint-foundation-demo.tsx','components/prism-next/blueprint-second-batch-demo.tsx']) {
 const content=await read(source); sources.push({path:source,sha256:hash(content)});
 samples.push(...[...content.matchAll(/<Sample\b[^>]*name="([^"]+)"/g)].map(m=>m[1]));
}
const manifest={coverageNotes:[{source:'P73',oldRoute:'/next/components/agent-components/existing-agent-inputs',effectiveRoute:'/next/components/agent-components#existing-agent-inputs',evidence:['components/prism-next/demos/agent-component-examples.tsx','components/prism-next/demos/agent-components-page.tsx','app/(next)/next/components/agent-components/[semantic]/page.tsx'],note:'旧清单路径不是当前语义组件注册项；保留原文，测量使用当前总览锚点。未声称已实测 HTTP 404。'},{source:'Agent Blueprint experiment',route:'/next/experiments/blueprint',note:'局部精修版仅 light/paper/dark；两蓝图外层场景保持 paper 局部，属于嵌套覆盖，不声称局部支持五主题。'},{source:'effective checklist precedence',note:'P78 覆盖 P73 用户气泡与链接焦点旧预期；P77 覆盖 P76 一级 AppBar 选中态；P85b/P85c 追加 P85 间距要求。'}],schemaVersion:1, preparedAt:new Date().toISOString(), baseline:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(), branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(), themes:['light','paper','dark','blueprint','blueprint-night'], widths:[320,768,1280], height:900, routes, samples, sources, rounds, legacy,
 limits:['浏览器验收：按分工由 Supervisor 执行','真机','读屏器','IME','实体打印','原生缩放','Workspace 接线和真实服务'],
 knownLimitations:['夜图普通分隔线历史约 1.58 / 1.45:1，须另测 --line 结构线','夜图浅色系列上的白色图案历史不足 3:1；不计新失败，必须记录实际值与适用表面']};
await writeFile(path.join(dir,'manifest.json'), JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({sources:sources.length,rounds:rounds.length,routes:routes.length,layoutScenarios:routes.length*15,samples:samples.length,legacyObligations:legacy.length,baseline:manifest.baseline}));
