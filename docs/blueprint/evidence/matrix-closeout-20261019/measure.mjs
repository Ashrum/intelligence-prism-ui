// Supervisor browser handoff. Builder may run --plan ONLY (no Playwright import).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {screenshotName, contrastPolicy, waitForStableElements} from './measurement-utils.mjs';
import {legacyProbes, hiddenNode} from './legacy-probes.mjs';
import {roundProbes} from './round-probes.mjs';
import {checklistRows, manualMarkdown, representative} from './plan-utils.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../../..');
const manifest = JSON.parse(await readFile(path.join(dir,'manifest.json'),'utf8'));
const classification=JSON.parse(await readFile(path.join(dir,'checklist-classification.json'),'utf8'));
const base = process.env.BPM1_BASE_URL || 'http://localhost:5173';
if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw Error('Only the existing local review service is supported.');
const mode = process.argv.includes('--plan') ? 'plan' : process.argv.includes('--run') ? 'run' : null;
if (!mode) throw Error('Specify --plan (no browser), or Supervisor uses --run.');
const group = process.argv.find(s=>s.startsWith('--group='))?.split('=')[1] || 'all';
if (!['all','matrix','interactions','isolation','per-round'].includes(group)) throw Error('Unknown group');
const foundation='/next/foundations/blueprint', prompt='/next/components/agent-components/prompt-bar';
const labels={light:'浅色',paper:'暖纸',dark:'深色',blueprint:'蓝图','blueprint-night':'夜图'};
const result={matrix:[],interactions:[],isolation:[],'per-round':[]};
const shots=[];
const pending='pending-supervisor-browser';
function add(category,id,name,theme,width,route,extra={}) {
 const r={id,name,theme,viewport:{width,height:manifest.height},route,pass:null,status:pending,measured:null,screenshots:[],...extra};
 result[category].push(r); return r;
}
const overlays=[
 ['select','材料类型','select-popup','#common-components','label'],
 ['required-select','用途 · 必填校验','select-popup','#common-components','label'],
 ['dialog','打开演示对话框','dialog-popup','#common-components'],
 ['dialog-select','演示材料类型','select-popup','#common-components','label','打开演示对话框'],
 ['combobox','关联知识点','combobox-popup','#common-components-two','input'],
 ['required-combobox','必选知识点 · 校验','combobox-popup','#common-components-two','input'],
 ['menu','打开样例菜单','menu-popup','#common-components-two'],
 ['popover','编辑本页备注','popover-popup','#common-components-two'],
 ['tooltip','查看字段说明','tooltip-popup','#common-components-two','hover'],
 ['alert-dialog','清空演示备注','alert-dialog-popup','#common-components-two'],
 ['sheet','打开长内容侧面板','sheet-popup','#common-components-two'],
 ['local-select','局部材料类型','select-popup','#portal-scope','label'],
 ['local-picker','搜索班级','combobox-popup','#portal-scope','fill'],
 ['local-menu','局部材料操作','menu-popup','#portal-scope'],
 ['local-submenu','材料示例子菜单','menu-popup','#portal-scope','submenu','局部材料操作'],
 ['local-dialog','局部对话框','dialog-popup','#portal-scope'],
 ['local-dialog-select','对话框材料类型','select-popup','#portal-scope','label','局部对话框'],
];
for(const theme of manifest.themes) for(const width of manifest.widths) {
 for(const [i,item] of manifest.routes.entries()) {
  add('matrix',`layout-${theme}-${width}-${i}`,'文档宽度、主题与初态内容采样',theme,width,item.route,{source:item.pageSource});
  add('matrix',`reading-${theme}-${width}-${i}`,'长中文与公式逐项目检',theme,width,item.route,{status:'pending-visual',criteria:'逐项查看 text/MathML、局部滚动、裁切祖先与截图；几何测量不等于可读性通过。'});
 }
 for(const [id,name,slot,scope,activation,parent] of overlays) add('interactions',`overlay-${theme}-${width}-${id}`,`真实浮层 / ${id}`,theme,width,scope==='#portal-scope'?'/next/components/menu':foundation,{recipe:{name,slot,scope,activation,parent}});
 for(const probe of ['common-controls','cards-folio','prompt-states','mark-motion','toast-queues']) add('interactions',`${probe}-${theme}-${width}`,probe,theme,width,probe==='prompt-states'?prompt:probe==='mark-motion'?'/next/components/agent-components/agent-mark':foundation,{probe});
 for(const obligation of manifest.legacy) add('interactions',`legacy-${theme}-${width}-${obligation.id}`,`累计旧项：${obligation.name}`,theme,width,foundation,{source:obligation.source,legacyProbe:obligation.id,captureKey:`legacy-${obligation.id}`,criteria:obligation.name});
 for(const inner of manifest.themes) add('isolation',`isolation-${theme}-${inner}-${width}`,`嵌套 ${inner} 根/后代/伪元素与同主题外层对照`,theme,width,'/next/foundations',{innerTheme:inner});

 for(const probe of ['contrast','facts','object-spacing','font']) add('per-round',`${probe}-${theme}-${width}`,probe,theme,width,foundation,{probe});
}
result['per-round'].push(...checklistRows(classification,manifest));
for(const row of result.interactions.filter(r=>r.legacyProbe))assert.equal(typeof legacyProbes[row.legacyProbe],'function',row.legacyProbe);
for(const row of result['per-round'].filter(r=>r.roundProbe))assert.equal(typeof roundProbes[row.roundProbe],'function',row.roundProbe);
async function save() {
 for(const [key,rows] of Object.entries(result)) {
  if(mode==='run' && group!=='all' && key!==group) continue;
  const summary=Object.fromEntries(['pass','fail','error','unstable',pending,'pending-visual','known-limitation','observed'].map(s=>[s,rows.filter(r=>r.status===s).length]));
  await writeFile(path.join(dir,`${key}.json`),JSON.stringify({schemaVersion:2,baseline:manifest.baseline,generatedAt:new Date().toISOString(),execution:mode==='plan'?'not-run':group,summary,results:rows},null,2)+'\n');
 }
 if(mode==='run' && ['all','per-round'].includes(group))await writeFile(path.join(dir,'manual-review.md'),manualMarkdown(result['per-round'],manifest.baseline));
 if(mode==='run'){for(const key of (group==='all'?Object.keys(result):[group])){const files=new Set(result[key].flatMap(r=>r.screenshots));await writeFile(path.join(dir,`screenshots-${key}.json`),JSON.stringify(shots.filter(s=>files.has(s.file)),null,2)+'\n');}}
}
if(mode==='plan') {
 // Offline planning is read-only once evidence exists: never erase a Supervisor run.
 const preserved=[];
 for(const key of Object.keys(result)) {
  let previous; try { previous=JSON.parse(await readFile(path.join(dir,`${key}.json`),'utf8')); } catch(e) { if(e.code!=='ENOENT') throw e; }
  if(previous && previous.execution!=='not-run') preserved.push(key);
 }
 await writeFile(path.join(dir,'plan.json'),JSON.stringify({schemaVersion:2,baseline:manifest.baseline,browserLaunched:false,counts:Object.fromEntries(Object.entries(result).map(([k,v])=>[k,v.length])),classificationCounts:classification.counts,results:result},null,2)+'\n');
 let actual;try{actual=JSON.parse(await readFile(path.join(dir,'per-round.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(actual?.schemaVersion!==2)await writeFile(path.join(dir,'manual-review.md'),manualMarkdown(result['per-round'],manifest.baseline));
 console.log(JSON.stringify({mode:'plan',browserLaunched:false,evidencePreserved:preserved,counts:Object.fromEntries(Object.entries(result).map(([k,v])=>[k,v.length]))})); process.exit(0);
}
for(const key of Object.keys(result)) {
 if(group!=='all'&&key!==group) continue;
 let previous;try{previous=JSON.parse(await readFile(path.join(dir,`${key}.json`),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(previous && previous.execution!=='not-run' && !process.argv.includes('--replace')) throw Error(`Existing ${key} evidence: archive first, then use --replace for an intentional rerun.`);
}
// The imports and every browser operation below are deliberately unreachable in --plan.
const {chromium}=await import(pathToFileURL(process.env.BPM1_PLAYWRIGHT || '/Users/OLE/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs').href);
let browser;
const screenDir=path.join(root,'docs/blueprint/screens/matrix-closeout-20261019');
await mkdir(screenDir,{recursive:true});
async function choose(page,name,value) {
 const trigger=page.getByRole('combobox',{name,exact:true});
 await trigger.click(); await page.getByRole('option',{name:value,exact:true}).click();
}
async function open(theme,width,route,{reduce='no-preference',blockFont=false,hasTouch=false}={}) {
 const context=await browser.newContext({viewport:{width,height:manifest.height},deviceScaleFactor:1,reducedMotion:reduce,hasTouch});
 await context.addInitScript(t=>localStorage.setItem('prism-v1-theme',t),theme);
 if(blockFont) await context.route('**/fonts/blueprint/*.woff2',r=>r.abort());
 const page=await context.newPage(); page.setDefaultTimeout(10000);
 try {
 const response=await page.goto(base+route,{waitUntil:'networkidle'});
 assert.equal(response?.status(),200,`HTTP ${response?.status()}`);
 await page.locator('html').evaluate((el,t)=>{if(el.dataset.prismTheme!==t) throw Error(`Theme mismatch ${el.dataset.prismTheme} != ${t}`);},theme);
 // Agent demos own a local theme; exercise the actual selector rather than editing attributes.
 if(await page.getByRole('combobox',{name:'预览主题',exact:true}).count()===1) {
  const local = page.locator('[data-agent-conversation-demo]');
  await choose(page,'预览主题',await local.count()?labels[theme]:['blueprint','blueprint-night'].includes(theme)?'跟随站点':labels[theme]);
 }
 if(route==='/next/experiments/blueprint') {
  // Its reviewed API exposes only three local themes. Keep paper inside Blueprint outers.
  const local=['light','paper','dark'].includes(theme)?theme:'paper';
  await page.getByRole('group',{name:'精修版主题',exact:true}).getByRole('button',{name:local[0].toUpperCase()+local.slice(1),exact:true}).click();
 }
 await page.evaluate(()=>document.fonts.ready);
 return {context,page};
 } catch(e) { await context.close(); throw e; }
}
async function capture(page,row,suffix='') {
 if((row.legacyProbe||row.roundProbe||row.visual||row.probe==='font'||row.probe==='facts'||row.probe==='object-spacing')&&!representative(row.theme,row.viewport.width))return;
 // Each captured state gets a readable unique filename; no row silently overwrites another.
 if(row.visual&&row.selector&&await page.locator(row.selector).count()&&!await page.locator('[data-slot$="popup"]:visible').count())await page.locator(row.selector).first().scrollIntoViewIfNeeded().catch(()=>{});
 const file=screenshotName(row,suffix);
 await page.screenshot({path:path.join(screenDir,file),fullPage:!row.visual,timeout:30000});
 const relative=`docs/blueprint/screens/matrix-closeout-20261019/${file}`;
 row.screenshots.push(relative); shots.push({file:relative,theme:row.theme,viewport:row.viewport,route:row.route,date:new Date().toISOString(),baseline:manifest.baseline});
}
async function execute(row,fn) {
 let session;
 try {
  session=await open(row.theme,row.viewport.width,row.route);
  row.diagnostics=[];session.page.on('pageerror',e=>row.diagnostics.push({type:'pageerror',text:String(e)}));session.page.on('console',m=>{if(m.type()==='error')row.diagnostics.push({type:'console-error',text:m.text()});});
  row.measured=await fn(session.page,row);
  assert.equal(row.diagnostics.filter(x=>x.type==='pageerror').length,0,'uncaught browser errors');
  if(row.pass===null && row.status===pending) { row.pass=true; row.status='pass'; }
  await capture(session.page,row);
  if(row.id.startsWith('layout-')) result.matrix.find(r=>r.id===row.id.replace('layout-','reading-')).screenshots=[...row.screenshots];
 } catch(e) {
  row.pass=false;row.status=e.code==='BPM_UNSTABLE'?'unstable':e.code==='ERR_ASSERTION'?'fail':'error';row.error=String(e.stack||e);
  if(session) await capture(session.page,row,'-failure').catch(()=>{});
 } finally { await session?.context.close(); await save(); }
}
const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
// Shared snapshot includes root and both pseudo elements. No source-CSS inference.
async function styles(locator) {return locator.evaluateAll(nodes=>nodes.map(el=>{
 const props=['borderRadius','backgroundColor','color','borderTop','borderRight','borderBottom','borderLeft','boxShadow','outline','outlineOffset','fontFamily','fontSize','lineHeight','content'];
 const read=pseudo=>Object.fromEntries(props.map(p=>[p,getComputedStyle(el,pseudo)[p]]));
 return {tag:el.tagName,slot:el.getAttribute('data-slot'),normal:read(null),before:read('::before'),after:read('::after')};
}));}
async function layout(page,row) {
 const values=await page.evaluate(()=>{
  const dims=el=>({clientWidth:el.clientWidth,scrollWidth:el.scrollWidth});
  const content=document.querySelector('main')||document.body;
  const entries=[...content.querySelectorAll('math,p,pre')].filter(el=>el.getClientRects().length && (el.tagName.toLowerCase()==='math'||(el.textContent||'').length>30)).map((el,i)=>{
   const r=el.getBoundingClientRect(),s=getComputedStyle(el);
   const ancestors=[];let p=el.parentElement;
   while(p && p!==document.body){ const st=getComputedStyle(p);if(['hidden','clip','auto','scroll'].includes(st.overflowX)) ancestors.push({tag:p.tagName,overflowX:st.overflowX,clientWidth:p.clientWidth,scrollWidth:p.scrollWidth});p=p.parentElement;}
   return {index:i,tag:el.tagName,text:el.textContent,rect:{x:r.x,width:r.width,height:r.height},clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,overflow:s.overflow,lineClamp:s.webkitLineClamp,ancestors,judgment:'待 Supervisor 目检；局部公式/代码滚动本身不是失败'};
  });
  return {html:dims(document.documentElement),body:dims(document.body),actualTheme:document.documentElement.dataset.prismTheme,previews:[...document.querySelectorAll('[data-agent-preview]')].map(e=>e.getAttribute('data-prism-theme')),heading:content.querySelector('h1')?.textContent,samples:[...document.querySelectorAll('[data-blueprint-component]')].map(e=>e.getAttribute('data-blueprint-component')),reading:entries};
 });
 row.measured=values;
 const visual=result.matrix.find(r=>r.id===row.id.replace('layout-','reading-'));
 visual.measured={items:values.reading,expectedSamples:row.route===foundation?manifest.samples:'按 manifest 逐轮清单检查，页面 h1 不是样例齐全的证据',criterion:'每项检查换行、裁切、局部滚动可达及实际字形，未作自动视觉判定。'};
 assert.equal(values.html.scrollWidth,values.html.clientWidth,'html overflow');
 assert.equal(values.body.scrollWidth,values.body.clientWidth,'body overflow');
 assert.ok(values.heading,'missing page heading');
 if(row.route===foundation) assert.deepEqual([...values.samples].sort(),[...manifest.samples].sort(),'24 samples');
 return values;
}
function requireStable(value) {
 if(!value.stable) {const error=new Error('未稳定：动画或位置在时限内未收敛');error.code='BPM_UNSTABLE';throw error;}
}
async function focusReturned(page,trigger) {
 const element=await trigger.elementHandle();
 await page.waitForFunction(el=>document.activeElement===el || el.contains(document.activeElement),element,{timeout:5000});
 return trigger.evaluate(el=>document.activeElement===el || el.contains(document.activeElement));
}
async function overlay(page,row) {
 const r=row.recipe;
 if(r.scope==='#portal-scope') {
  await choose(page,'外层核心主题',labels[['light','paper','dark'].includes(row.theme)?row.theme:'light']);
  await choose(page,'局部主题',row.theme==='blueprint-night'?'蓝图夜色':labels[row.theme]);
 }
 const scope=page.locator(r.scope);
 const parentTrigger=r.parent?scope.getByRole('button',{name:r.parent,exact:true}):null;
 let parentPopup;
 if(parentTrigger) {
  await parentTrigger.click();
  if(r.activation==='submenu') parentPopup=await page.locator('[data-slot="menu-popup"]:visible').last().elementHandle();
 }
 let trigger;
 if(r.activation==='label'||r.activation==='fill'||r.activation==='input') trigger=page.getByRole('combobox',{name:r.name,exact:true});
 else if(r.activation==='submenu') trigger=page.getByRole('menuitem',{name:r.name,exact:true});
 else trigger=scope.getByRole('button',{name:r.name,exact:true});
 await trigger.scrollIntoViewIfNeeded();
 if(r.activation==='fill') await trigger.fill('高二');
 else if(r.activation==='hover') {await trigger.focus();await trigger.hover();}
 else {await trigger.focus();await trigger.press(r.activation==='submenu'?'ArrowRight':r.activation==='input'?'ArrowDown':'Enter');}
 const popup=page.locator(`[data-slot="${r.slot}"]:visible`).last();await popup.waitFor({state:'visible'});
 // Keep the actual node: a live :visible.last() locator would retarget the parent after submenu closes.
 const popupElement=await popup.elementHandle();
 const stability=await popup.evaluateAll(waitForStableElements,{});
 row.measured={stability};requireStable(stability);
 const measurement=await popup.evaluate(el=>{
  const rect=el.getBoundingClientRect();const ancestors=[];let p=el;
  while(p){if(p.hasAttribute('data-prism-theme')||p.hasAttribute('data-portal-scope-target')) ancestors.push({tag:p.tagName,theme:p.getAttribute('data-prism-theme'),target:p.getAttribute('data-portal-scope-target')});p=p.parentElement;}
  return {theme:el.closest('[data-prism-theme]')?.getAttribute('data-prism-theme'),ancestors,rect:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom},viewport:{width:innerWidth,height:innerHeight},text:el.textContent};
 });
 measurement.stability=stability;measurement.styles=await styles(popup);row.measured=measurement;await capture(page,row,'-open');
 assert.equal(measurement.theme,row.theme,'Portal effective theme');
 assert.ok(measurement.rect.left>=-1 && measurement.rect.right<=measurement.viewport.width+1,'Popup horizontal bounds');
 assert.ok(measurement.rect.top>=-1 && measurement.rect.bottom<=measurement.viewport.height+1,'Popup vertical bounds');
 await page.keyboard.press('Escape');await hiddenNode(page,popupElement);
 measurement.returned=await focusReturned(page,trigger);
 if(r.activation==='submenu') {
  measurement.firstEscape={submenuClosed:true,parentOpen:await parentPopup.isVisible(),returnedToSubmenuTrigger:measurement.returned};
  assert.ok(measurement.firstEscape.parentOpen,'First Escape keeps parent menu open');
  await page.keyboard.press('Escape');await hiddenNode(page,parentPopup);
  measurement.secondEscape={parentClosed:true,returnedToOriginalTrigger:await focusReturned(page,parentTrigger)};
  assert.ok(measurement.secondEscape.returnedToOriginalTrigger,'Second Escape returns to original trigger');
 }
 assert.ok(measurement.returned,'Escape focus return');
 return measurement;
}
async function common(page,row) {
 const details=[];
 for(const [label,value] of [['材料名称 · 必填校验','完整中文校验'],['修改理由 · 必填校验','核对条件与公式'],['起始页 · 必填校验','3']]) {
  const input=page.locator('input, textarea').and(page.getByLabel(label,{exact:true}));await input.fill(value);assert.notEqual(await input.getAttribute('aria-invalid'),'true');details.push({label,value:await input.inputValue()});
 }
 const query=page.locator('input').and(page.getByLabel('材料关键词',{exact:true}));await query.fill('长中文材料');await page.getByRole('button',{name:'清除本页关键词',exact:true}).click();assert.equal(await query.inputValue(),'');assert.ok(await query.evaluate(e=>document.activeElement===e));
 for(const [role,name] of [['checkbox','将完整公式推导加入本页预览'],['switch','显示本页补充说明']]) {
  const control=page.getByRole(role,{name,exact:true});const before=await control.getAttribute('aria-checked');await control.focus();await control.press('Space');const after=await control.getAttribute('aria-checked');assert.notEqual(after,before);details.push({name,before,after});
 }
 const button=page.locator('#common-components [data-blueprint-component="Button"] button:not([disabled])').first();
 await button.scrollIntoViewIfNeeded();const states={normal:await styles(button)};await button.hover();states.hover=await styles(button);
 await page.mouse.down();states.pressed=await styles(button);await page.mouse.up();
 await button.focus();await page.keyboard.press('Tab');states.tab=await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.textContent}));
 await page.keyboard.press('Shift+Tab');states.keyboard=await styles(button);
 return {details,states,visual:'hover/pressed/focus 样式已采样，焦点清晰与裁切仍待目检'};
}
async function cards(page) {
 const original=page.locator('#object-section-cards');
 const next=original.getByRole('button',{name:'查看下一份原件',exact:true});await next.focus();await next.press('Enter');
 assert.ok((await original.innerText()).includes('此份作答未提供原图，无法预览。'));assert.ok(await next.isDisabled());
 const note=original.getByRole('button',{name:'查看选择题作答说明',exact:true});await note.focus();await note.press('Space');assert.equal(await note.getAttribute('aria-expanded'),'true');await note.press('Enter');assert.equal(await note.getAttribute('aria-expanded'),'false');
 const folio=page.locator('#artifact-folio');await folio.getByRole('button',{name:'下一份作答',exact:true}).click();assert.ok((await folio.innerText()).includes('02 / 02'));
 return {original:await original.innerText(),folio:await folio.innerText()};
}
async function promptStates(page) {
 const observations=[];
 for(const variant of ['Rounded','Pill']) {
  await choose(page,'输入框变体',variant);await page.getByRole('button',{name:'载入草稿',exact:true}).click();
  const toggle=page.getByRole('button',{name:/^禁用原因夹具/});if(await toggle.getAttribute('aria-pressed')!=='true') await toggle.click();
  const send=page.getByRole('button',{name:'发送消息',exact:true});assert.ok(await send.isDisabled());
  const reasonId=await send.getAttribute('aria-describedby');assert.ok(reasonId);const reason=page.locator(`[id=${JSON.stringify(reasonId)}]`);await reason.waitFor({state:'visible'});
  const announce=page.getByRole('button',{name:/^原因播报/});
  for(const enabled of [true,false]) {
   if((await announce.getAttribute('aria-pressed')==='true')!==enabled) await announce.click();
   assert.equal(await reason.getAttribute('role'),enabled?'status':null);assert.equal(await send.getAttribute('aria-describedby'),reasonId);
   observations.push({variant,enabled,reason:await reason.innerText(),role:await reason.getAttribute('role'),disabled:await send.isDisabled()});
  }
  const draft=page.locator('[data-agent-preview] textarea');await draft.fill('仍可编辑的完整中文 f(x)=x²');assert.equal(await draft.inputValue(),'仍可编辑的完整中文 f(x)=x²');
  await toggle.click();assert.equal(await send.getAttribute('aria-describedby'),null);assert.ok(await send.isEnabled());
 }
 const modelToggle=page.getByRole('button',{name:'模型入口：显示',exact:true});await modelToggle.click();assert.equal(await page.getByRole('button',{name:/^选择模型：/}).count(),0);
 await page.getByRole('button',{name:'打开来源示例',exact:true}).click();await page.getByRole('option',{name:/题库/}).waitFor({state:'visible'});await page.keyboard.press('Escape');
 return observations;
}
async function markMotion(page,row) {
 const sample=async()=>page.locator('[data-agent-mark]').evaluateAll(nodes=>nodes.map(el=>({state:el.dataset.state,size:el.dataset.size,variant:el.dataset.variant,role:el.getAttribute('role'),label:el.getAttribute('aria-label'),rect:{width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height},pixels:[...el.querySelectorAll('.agent-mark-pixel')].map(p=>({animation:getComputedStyle(p).animationName,opacity:getComputedStyle(p).opacity,radius:getComputedStyle(p).borderRadius}))})));
 const observations=[];row.measured=observations;
 // Initial reduce is verified by a separate navigation, then dynamic changes on the same DOM.
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'networkidle'});await choose(page,'预览主题',labels[row.theme]);
 for(const mode of ['reduce','no-preference','reduce','no-preference']) {
  await page.emulateMedia({reducedMotion:mode});
  const stability=await page.locator('[data-agent-mark]').evaluateAll(waitForStableElements,{pixels:true,allowInfinite:mode==='no-preference'});
  const marks=await sample();observations.push({mode,stability,marks});requireStable(stability);
  assert.ok(marks.length>=18,'missing glyph states');
  for(const m of marks) {
   if(m.size==='glyph') {assert.equal(m.role,'img');assert.equal(m.rect.width,16);assert.equal(m.rect.height,16);assert.equal(m.pixels.length,9);}
   if(mode==='reduce') assert.ok(m.pixels.every(p=>p.animation==='none'),'reduced-motion animation must stop');
   if(mode==='reduce'&&m.size==='glyph') assert.ok(m.pixels.every(p=>Number(p.opacity)===1),'all glyph pixels visible');
  }
 }
 return observations;
}
async function toastQueues(page,row) {
 const measurements=[];
 for(const label of ['信息','成功','错误','提醒','加载']) {
  await page.getByRole('button',{name:`${label}通知样例`,exact:true}).click();
  const toast=page.locator('[data-slot="toast-viewport"] > [data-position]:visible').last();await toast.waitFor({state:'visible'});
  measurements.push({label,theme:await toast.evaluate(e=>e.closest('[data-prism-theme]')?.getAttribute('data-prism-theme')),text:await toast.innerText()});
  assert.equal(measurements.at(-1).theme,row.theme);await capture(page,row,`-${label}`);
  await page.getByRole('button',{name:'关闭本页全部通知',exact:true}).click();await toast.waitFor({state:'hidden'});
 }
 return {measurements,escape:'Toast 非模态队列；本探针使用显式关闭，Esc 与三队列卸载路径见 P74 待验清单。'};
}
async function isolation(page,row) {
 const selector=`[data-agent-preview][data-prism-theme="${row.innerTheme}"]`;
 const nodes=page.locator(selector);assert.ok(await nodes.count()>0,'missing nested theme');
 const actual=await styles(page.locator(`${selector}, ${selector} *`));
 const control=await open(row.innerTheme,row.viewport.width,row.route);
 try {const baseline=await styles(control.page.locator(`${selector}, ${selector} *`));row.measured={actual,baseline,scope:'当前版相同预览在同主题外层与目标外层对照；不是历史版本像素比较'};assert.deepEqual(actual,baseline,'nested computed styles differ');return row.measured;}
 finally {await control.context.close();}
}
async function contrasts(page,row) {
 const values=await page.evaluate(()=>{
  const probe=document.createElement('span');document.body.append(probe);
  const rgba=css=>{probe.style.color=css;const c=getComputedStyle(probe).color;const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=c;ctx.fillRect(0,0,1,1);return {css:c,rgba:[...ctx.getImageData(0,0,1,1).data]};};
  const l=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>{const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const results=[];for(const fg of ['warning-foreground','foreground','muted-foreground','line','border']) for(const bg of ['background','card','secondary','accent']) {
   const a=rgba(`var(--${fg})`),b=rgba(`var(--${bg})`);results.push({fg,bg,foreground:a,background:b,contrast:ratio(a.rgba,b.rgba)});
  }
  probe.remove();return results;
 });
 const pairs=values.map(v=>contrastPolicy(row.theme,v));
 row.measured={pairs,knownLimitations:row.theme==='blueprint-night'?manifest.knownLimitations:[],note:'--line ≥3:1 仅适用于两蓝图；核心主题线条只观察，文字仍检查 ≥4.5:1。夜图 border 为已知限制。半透明 Badge 合成、真实绘图系列图案仍须补验。'};
 for(const v of pairs) if(v.threshold!==null) assert.ok(v.contrast>=v.threshold,`${v.fg}/${v.bg} ${v.contrast}`);
 return row.measured;
}
async function facts(page) {
 // Reversible DOM fixture, restored by closing this isolated page. Source components are unchanged.
 return page.evaluate(()=>{
  const results=[];
  for(const dl of document.querySelectorAll('dl.bp-facts,dl.bp-titleblock')) {
   const host=dl.parentElement,original=dl.innerHTML,style=host.getAttribute('style');
   for(const width of [280,360,480,481,640,1000]) for(const count of [2,3,4,5]) {
    host.style.width=`${width}px`;host.style.maxWidth='none';dl.innerHTML=original;
    while(dl.children.length<count) dl.append(dl.firstElementChild.cloneNode(true));while(dl.children.length>count) dl.lastElementChild.remove();
    [...dl.children].forEach(el=>{el.querySelector('dt').textContent='很长的中文事实名称用于核对容器内换行';el.querySelector('dd').textContent='12345678901234567890';});
    const children=[...dl.children].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth};});
    const columns=getComputedStyle(dl).gridTemplateColumns.split(' ').length;
    results.push({kind:dl.className,width,count,columns,children,pass:columns===(width<=480?2:count)&&children.every(c=>c.scrollWidth<=c.clientWidth+1)&&(width>480||count%2===0||Math.abs(children.at(-1).width-dl.getBoundingClientRect().width)<=2)});
   }
   dl.innerHTML=original;if(style===null)host.removeAttribute('style');else host.setAttribute('style',style);
  }
  return results;
 });
}
async function spacing(page,row) {
 const measure=async p=>p.locator('[data-agent-relation-view],[data-agent-arranger-view]').evaluateAll(nodes=>nodes.map(el=>{
  const relation=el.hasAttribute('data-agent-relation-view');const title=el.querySelector(relation?':scope > h3':':scope > header > div');if(!title)return {error:'missing title'};
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let text;
  while(walker.nextNode()) {const n=walker.currentNode;if(title.contains(n)||!n.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(n);const r=range.getClientRects()[0];if(r && r.height && r.top>=title.getBoundingClientRect().bottom-1){text={text:n.textContent,top:r.top,gap:r.top-title.getBoundingClientRect().bottom};break;}}
  const ul=el.querySelector(':scope > ul');return {kind:relation?'relation':'arranger',density:el.getAttribute('data-density'),titleBottom:title.getBoundingClientRect().bottom,text,abilities:ul?{count:ul.children.length,display:getComputedStyle(ul).display}:null};
 }));
 const compact=await measure(page);const defaultPage=await open(row.theme,row.viewport.width,'/next/components/agent-components');
 try {const defaults=await measure(defaultPage.page);await capture(defaultPage.page,{...row,route:'/next/components/agent-components'},'-default');return {compact,defaults,judgment:'observed；按 density / 状态配对后核对两卡 Range gap 差 ≤4px，不能用容器或行盒值替代。'};}finally{await defaultPage.context.close();}
}
async function fonts(page,row) {
 const loaded=await page.evaluate(()=>[...document.fonts].filter(f=>f.family.includes('Geist')).map(f=>({family:f.family,weight:f.weight,status:f.status})));
 const fallback=await open(row.theme,row.viewport.width,foundation,{blockFont:true});
 try {
  const values=await fallback.page.evaluate(()=>({fonts:[...document.fonts].filter(f=>f.family.includes('Geist')).map(f=>({family:f.family,status:f.status})),html:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}}));
  assert.equal(values.html.scrollWidth,values.html.clientWidth,'font fallback overflow');
  if(['blueprint','blueprint-night'].includes(row.theme)){assert.ok(loaded.some(f=>f.status==='loaded'),'Geist loaded');assert.ok(values.fonts.some(f=>f.status==='error'),'blocked font failed as intended');}
  await capture(fallback.page,row,'-font-blocked');
  return {loaded,fallback:values,judgment:'observed；实际字形命中需 Chrome Fonts/CDP 复核；截图目检缺字和回退布局。'};
 }finally{await fallback.context.close();}
}
try {
 browser=await chromium.launch({headless:true});
 for(const category of Object.keys(result)) {
  if(group!=='all'&&group!==category)continue;
  for(const row of result[category]) {
   if(category==='matrix'&&row.id.startsWith('layout-')) await execute(row,layout);
   else if(row.legacyProbe)await execute(row,(page,r)=>legacyProbes[r.legacyProbe](page,r));
   else if(row.roundProbe||row.visual)await execute(row,async(page,r)=>{const value=r.roundProbe?await roundProbes[r.roundProbe](page,r,{capture,open,styles,choose}):{state:'initial',criterion:r.criteria};if(r.visual){r.status='pending-visual';r.pass=null;}return value;});
   else if(row.recipe) await execute(row,overlay);
   else if(category==='isolation') await execute(row,isolation);
   else if(row.probe) await execute(row,async(page,r)=>{
    const funcs={'common-controls':common,'cards-folio':cards,'prompt-states':promptStates,'mark-motion':markMotion,'toast-queues':toastQueues,contrast:contrasts,facts, 'object-spacing':spacing,font:fonts};
    const value=await funcs[r.probe](page,r);
    r.measured=value;
    if(r.probe==='facts'){assert.ok(value.length>0);assert.ok(value.every(x=>x.pass),'fact grid counts/overflow');}
    if(r.probe==='object-spacing')r.status='observed';
    return value;
   });
  }
 }
} catch(e) {await writeFile(path.join(dir,`run-error-${group}.json`),JSON.stringify({at:new Date().toISOString(),error:String(e.stack||e),baseline:manifest.baseline},null,2)+'\n');process.exitCode=1;}
finally {await save();await browser?.close();}
const failed=Object.values(result).flat().filter(r=>['fail','error','unstable'].includes(r.status));
console.log(JSON.stringify({group,failures:failed.length,pending:Object.values(result).flat().filter(r=>r.pass===null).length,closed:false}));
if(failed.length)process.exitCode=1;
