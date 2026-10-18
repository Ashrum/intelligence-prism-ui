import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseMarkdown } from './sync-blueprint-guide.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'docs/learning-analysis');
const prefix = '/learning-analysis/assets/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const definitions = [
  ['index','README.md'],['main','OLE_Learning_Analysis_Design_v0.7-r2.md'],['specs','00-实施规格索引.md'],
  ['data','01-数据投影与指标规范.md'],['action','02-教学行动与支持逻辑规范.md'],['standalone','03-独立页重构与迁移规范.md'],
  ['agent','04-Agent协同与Blueprint承载规范.md'],['roles','05-多角色与跨域披露规范.md'],['validation','06-全周期验证协议与夹具矩阵.md'],
  ['screens','SCREENS.md'],['impact','evidence/review-v07r1-expected-impact.md'],['release','RELEASE.md'],
];
const route = slug => '/next/learning-analysis' + (slug === 'index' ? '' : '/' + slug);
const within = p => p === sourceRoot || p.startsWith(sourceRoot + path.sep);
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function published(relative){return relative + (/\.(png|jpe?g|webp|md|csv)$/i.test(relative) ? '' : '.txt');}
function href(relative){return prefix + published(relative).split('/').map(encodeURIComponent).join('/');}
export function compileLearningAnalysis(){
 const sources = files(sourceRoot).filter(f=>!f.endsWith('/release-manifest.json'));
 const manifest={revision:'v0.7 r2',status:'approved-derived-design',implementationStatus:'requires-applicable-gates',files:sources.map(p=>({path:path.relative(sourceRoot,p).split(path.sep).join('/'),sha256:hash(readFileSync(p)),bytes:readFileSync(p).length})).sort((a,b)=>a.path.localeCompare(b.path))};
 const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
 const outputs=new Map([['docs/learning-analysis/release-manifest.json',manifestBytes]]);
 for(const p of sources)outputs.set('public'+href(path.relative(sourceRoot,p)).split('/').map(decodeURIComponent).join('/'),readFileSync(p));
 outputs.set('public'+prefix+'release-manifest.json.txt',manifestBytes);
 const docs=definitions.map(([slug,file])=>{
  const bytes=readFileSync(path.join(sourceRoot,file));
  const resolveLink=(raw,image=false)=>{
   if(/^https?:\/\//i.test(raw)){const url=new URL(raw);if(url.username||url.password||image)throw Error('Unsafe remote link: '+raw);return {href:url.href,external:true};}
   if(raw.startsWith('#'))return {href:raw,external:false};
   if(/^[a-z][a-z\d+.-]*:|^\/|[\\\u0000-\u001f]/i.test(raw))throw Error('Unsafe local link: '+raw);
   const p=path.resolve(path.dirname(path.join(sourceRoot,file)),decodeURIComponent(raw));
   const isManifest=p===path.join(sourceRoot,'release-manifest.json');
   if(!within(p)||(!isManifest&&(!existsSync(p)||!within(realpathSync(p)))))throw Error(`Missing/local escape: ${file} → ${raw}`);
   const relative=path.relative(sourceRoot,p).split(path.sep).join('/');
   const target=definitions.find(([,f])=>f===relative);
   if(image&&!/\.(png|jpe?g|webp)$/i.test(relative))throw Error('Not a raster image: '+raw);
   return {href:target&&!image?route(target[0]):href(relative),external:false,download:!target&&!image};
  };
  return {slug,route:route(slug),source:file,sourceSha256:hash(bytes),sourceDownload:href(file),...parseMarkdown(bytes.toString('utf8'),resolveLink)};
 });
 outputs.set('lib/prism-next/learning-analysis-docs.json',Buffer.from(JSON.stringify({revision:'v0.7 r2',documents:docs},null,2)+'\n'));
 return {outputs,docs,manifest};
}
export function syncLearningAnalysis(check=false){const {outputs,docs,manifest}=compileLearningAnalysis();for(const [rel,bytes] of outputs){const dest=path.join(root,rel);if(check){if(!existsSync(dest)||!readFileSync(dest).equals(bytes))throw Error('Stale release output: '+rel);}else{mkdirSync(path.dirname(dest),{recursive:true});writeFileSync(dest,bytes);}}return {documents:docs.length,files:manifest.files.length,outputs:outputs.size,mainSha256:docs.find(x=>x.slug==='main').sourceSha256};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(syncLearningAnalysis(process.argv.includes('--check'))));
