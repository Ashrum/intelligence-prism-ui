// Browser functions are inert until the Supervisor calls them. One registry key per historical check.
import assert from 'node:assert/strict';
export const legacyProbes = {};
const register=(batch,index,fn)=>{legacyProbes[`${batch===1?'first-interactions':'interactions'}.json-${index+1}`]=fn;};
const role=(scope,r,name)=>scope.getByRole(r,{name,exact:true});
const btn=(scope,name)=>role(scope,'button',name);
const field=(scope,name)=>scope.locator('input,textarea').and(scope.getByLabel(name,{exact:true}));
const one=page=>page.locator('#common-components');
const two=page=>page.locator('#common-components-two');
const sample=(scope,name)=>scope.locator(`[data-blueprint-component="${name}"]`);
export async function poll(page,fn,arg) {await page.waitForFunction(fn,arg,{timeout:7000});}
export async function focused(page,locator) {
 const handle=await locator.elementHandle();assert.ok(handle);
 await poll(page,el=>el===document.activeElement||el.contains(document.activeElement),handle);
 return true;
}
export async function hiddenNode(page,handle) {
 assert.ok(handle,'popup handle must exist');
 // Do not use ElementHandle.waitForElementState: Base UI may remove a portal node during Esc.
 await poll(page,el=>!el.isConnected||el.hidden||getComputedStyle(el).display==='none'||getComputedStyle(el).visibility==='hidden'||!el.getClientRects().length,handle);
}
export async function trap(page,popup) {
 const observations=[];
 const count=await popup.locator('button,input,textarea,select,a[href],[tabindex="0"]').count();
 assert.ok(count>0,'focus trap has controls');
 for(const key of ['Tab','Shift+Tab']) for(let i=0;i<count+3;i++) {
  await page.keyboard.press(key);
  const state=await popup.evaluate(el=>({inside:el.contains(document.activeElement),tag:document.activeElement?.tagName,name:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent}));
  observations.push({key,...state});assert.ok(state.inside,'focus escaped modal');
 }
 return observations;
}
async function disabled(locator){assert.ok(await locator.isDisabled());return {disabled:await locator.isDisabled(),value:await locator.getAttribute('aria-disabled')};}
async function readonly(page,input){assert.ok(await input.evaluate(el=>el.readOnly));const value=await input.inputValue();await input.focus();await input.press('End');await input.press('x');assert.equal(await input.inputValue(),value);await focused(page,input);return {value,readOnly:true,focusable:true};}
async function invalid(input,expected){assert.equal(await input.getAttribute('aria-invalid')==='true',expected);}
async function surface(input){return input.evaluate(el=>{
 const outer=el.closest('[data-slot="input-group"]')||el.parentElement;
 const read=e=>{const s=getComputedStyle(e);return {outline:s.outlineStyle,outlineWidth:s.outlineWidth,outlineOffset:s.outlineOffset,shadow:s.boxShadow,border:s.borderTopColor,borderWidth:s.borderTopWidth};};
 const token=document.createElement('span');outer.append(token);token.style.color='var(--destructive)';const destructive=getComputedStyle(token).color;token.remove();
 return {invalid:el.getAttribute('aria-invalid'),outer:read(outer),inner:read(el),wrapper:read(el.parentElement),destructive};
});}
async function errorTransition(page,input,error,text){await input.fill('');await invalid(input,true);await error.waitFor({state:'visible'});await input.fill(text);await invalid(input,false);await error.waitFor({state:'hidden'});return {value:await input.inputValue(),errorCleared:true};}
async function keyboardFocus(page,input){await input.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await focused(page,input);}
const blue=row=>['blueprint','blueprint-night'].includes(row.theme);
async function openPopup(page,trigger,slot){await trigger.click();const popup=page.locator(`[data-slot="${slot}"]:visible`).last();await popup.waitFor({state:'visible'});return popup;}
async function closePopup(page,popup,trigger){const handle=await popup.elementHandle();await page.keyboard.press('Escape');await hiddenNode(page,handle);await focused(page,trigger);return {closed:true,returned:true};}
async function dialog(page){const trigger=btn(one(page),'打开演示对话框');const popup=await openPopup(page,trigger,'dialog-popup');return {trigger,popup,input:field(popup,'演示材料名称')};}
async function menu(page){const trigger=btn(two(page),'打开样例菜单');return {trigger,popup:await openPopup(page,trigger,'menu-popup')};}
async function popover(page){const trigger=btn(two(page),'编辑本页备注');const popup=await openPopup(page,trigger,'popover-popup');return {trigger,popup,input:field(popup,'演示备注')};}
async function alert(page){const trigger=btn(two(page),'清空演示备注');return {trigger,popup:await openPopup(page,trigger,'alert-dialog-popup')};}
async function sheet(page){const trigger=btn(two(page),'打开长内容侧面板');return {trigger,popup:await openPopup(page,trigger,'sheet-popup')};}
async function tooltip(page){const trigger=btn(two(page),'查看字段说明');await keyboardFocus(page,trigger);const popup=page.locator('[data-slot="tooltip-popup"]:visible');await popup.waitFor({state:'visible'});return {trigger,popup};}
async function threeToasts(page){for(const label of ['信息','成功','错误'])await btn(two(page),`${label}通知样例`).click();const items=two(page).locator('[data-slot="toast-viewport"] > [data-position]:visible');await poll(page,()=>document.querySelectorAll('#common-components-two [data-slot="toast-viewport"] > [data-position]').length===3);await two(page).locator('[data-slot="toast-viewport"]').hover();return items;}
export async function actualContrast(locator,foreground='color',background='backgroundColor') {
 return locator.evaluate((el,{foreground,background})=>{
  const rgba=css=>{const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d');ctx.fillStyle=css;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
  const composite=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3])).concat(1);
  const effective=e=>{const stack=[];for(let n=e;n;n=n.parentElement)stack.push(rgba(getComputedStyle(n).backgroundColor));return stack.reverse().reduce((bg,fg)=>composite(fg,bg),[255,255,255,1]);};
  const s=getComputedStyle(el),bg=background==='parent'?effective(el.parentElement):effective(el),fg=composite(rgba(s[foreground]),bg);
  const l=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const x=l(fg),y=l(bg);return {foreground:s[foreground],background:bg,contrast:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 },{foreground,background});
}
register(1,0,async page=>{const names=await one(page).locator('[data-blueprint-component]').evaluateAll(es=>es.map(e=>e.dataset.blueprintComponent));assert.deepEqual(names,['Button','Input','Textarea','Select','Dialog','Checkbox','RadioGroup','Switch','Tabs','Card','Badge','Alert']);return names;});
register(1,1,async page=>{await btn(one(page),'查看图标按钮说明').click();const text=await sample(one(page),'Button').innerText();assert.match(text,/已查看图标按钮的点击反馈/);return {text};});
register(1,2,async page=>{const s=sample(one(page),'Button'),loading=btn(s,'处理中，固定状态演示');await disabled(btn(s,'禁用按钮'));await disabled(loading);assert.equal(await loading.getAttribute('aria-busy'),'true');return {disabled:true,busy:await loading.getAttribute('aria-busy'),text:await loading.innerText()};});
for(const [start,label,errorText] of [[3,'材料名称 · 必填校验','请输入材料名称。'],[6,'修改理由 · 必填校验','请补充修改理由。']]){
 register(1,start,async(page,row)=>{const input=field(one(page),label);await input.fill('');await input.blur();await invalid(input,true);await one(page).getByText(errorText,{exact:true}).waitFor({state:'visible'});const value=await surface(input);row.measured=value;assert.equal(value.inner.borderWidth,'0px');if(blue(row))assert.equal(value.outer.border,value.destructive);return value;});
 register(1,start+1,async page=>errorTransition(page,field(one(page),label),one(page).getByText(errorText,{exact:true}),'复核中文与 f(x)=x²'));
 register(1,start+2,async(page,row)=>{const input=field(one(page),label);await input.fill('完整复核');await keyboardFocus(page,input);const value=await surface(input);row.measured=value;assert.equal(value.inner.outline,'none');assert.equal(value.inner.shadow,'none');if(blue(row)){assert.equal(value.outer.outlineWidth,'2px');assert.equal(value.outer.outline,'solid');assert.equal(value.outer.shadow,'none');}else assert.ok(value.outer.shadow!=='none'||value.outer.outline!=='none','core focus indicator');return value;});
}
register(1,9,async page=>{const values=[];for(const name of ['材料编号 · 只读','原始说明 · 只读'])values.push({name,...await readonly(page,field(one(page),name))});return values;});
register(1,10,async page=>{const out=[];for(const name of ['归档名称 · 禁用','归档说明 · 禁用'])out.push({name,...await disabled(field(one(page),name))});out.push(await disabled(role(one(page),'combobox','归档类型 · 禁用')));return out;});
register(1,11,async page=>{await role(one(page),'combobox','材料类型').click();const item=role(page,'option','已归档材料（不可选）');await item.waitFor({state:'visible'});await disabled(item);return {text:await item.innerText(),disabled:true};});
register(1,12,async page=>{const trigger=role(one(page),'combobox','用途 · 必填校验');await invalid(trigger,true);await trigger.focus();await trigger.press('ArrowDown');await page.locator('[data-slot="select-popup"]:visible').waitFor();await page.keyboard.press('Home');await page.keyboard.press('Enter');await invalid(trigger,false);await one(page).getByText('请选择一种用途。',{exact:true}).waitFor({state:'hidden'});assert.match(await trigger.innerText(),/例题讲解/);return {text:await trigger.innerText(),invalid:false};});
register(1,13,async page=>{const trigger=role(one(page),'combobox','材料类型');return closePopup(page,await openPopup(page,trigger,'select-popup'),trigger);});
register(1,14,async page=>{const control=role(one(page),'checkbox','将完整公式推导加入本页预览');await control.focus();await control.press('Space');assert.equal(await control.getAttribute('aria-checked'),'true');await control.press('Space');assert.equal(await control.getAttribute('aria-checked'),'false');return {afterSpace:true,afterSecondSpace:false};});
for(const [index,skip]of [[15,false],[16,true]])register(1,index,async page=>{const a=role(one(page),'radio','个人预览'),b=role(one(page),'radio','教研团队共同核对长中文题干与公式'),c=role(one(page),'radio','全校范围 · 禁用样例');await a.focus();await a.press('ArrowRight');await focused(page,b);assert.equal(await b.getAttribute('aria-checked'),'true');if(skip){await b.press('ArrowRight');await focused(page,a);assert.equal(await a.getAttribute('aria-checked'),'true');assert.equal(await c.getAttribute('aria-checked'),'false');}return {selected:await role(one(page),'radiogroup','示例材料可见范围').locator('[aria-checked="true"]').innerText(),skipped:skip};});
register(1,17,async(page,row)=>{const sw=role(one(page),'switch','显示本页补充说明');const color=()=>sw.evaluate(e=>getComputedStyle(e).backgroundColor);const on=await color();await sw.focus();await sw.press('Space');assert.equal(await sw.getAttribute('aria-checked'),'false');const off=await color();await sw.press('Space');assert.equal(await sw.getAttribute('aria-checked'),'true');const ratio=await actualContrast(sw,'backgroundColor','parent');const value={on,off,ratio};row.measured=value;assert.notEqual(on,off);if(blue(row))assert.ok(ratio.contrast>=3);return value;});
for(const [index,label,second]of [[18,'基础组件材料预览','长中文推导与复核说明'],[20,'基础组件补充信息','来源与版本记录']]){
 register(1,index,async page=>{const list=role(one(page),'tablist',label),tabs=list.getByRole('tab');await tabs.first().focus();await tabs.first().press('ArrowRight');await focused(page,role(list,'tab',second));await page.keyboard.press('Enter');assert.equal(await role(list,'tab',second).getAttribute('aria-selected'),'true');return {label,selected:second};});
 register(1,index+1,async page=>{const list=role(one(page),'tablist',label),tabs=list.getByRole('tab');const before=await list.locator('[aria-selected="true"]').innerText();await tabs.first().focus();await tabs.first().press('End');await page.keyboard.press('Enter');assert.ok(await tabs.last().isDisabled());assert.notEqual(await tabs.last().getAttribute('aria-selected'),'true');assert.equal(await list.locator('[aria-selected="true"]').innerText(),before);return {disabled:true,selection:before};});
}
register(1,22,async page=>{const {input}=await dialog(page);await focused(page,input);return {initialFocus:await input.getAttribute('id')};});
register(1,23,async page=>{const {input,popup}=await dialog(page);await input.fill('');await btn(popup,'保存本页演示').click();await invalid(input,true);await focused(page,input);await popup.getByText('请输入演示材料名称。',{exact:true}).waitFor();return {invalid:true,focused:true};});
register(1,24,async page=>{const {popup}=await dialog(page),trigger=role(popup,'combobox','演示材料类型');const nested=await openPopup(page,trigger,'select-popup');const closed=await closePopup(page,nested,trigger);assert.ok(await popup.isVisible());return {...closed,dialogStillOpen:true};});
register(1,25,async page=>{const {popup,input}=await dialog(page);await focused(page,input);return trap(page,popup);});
register(1,26,async page=>{const {popup,trigger}=await dialog(page);return closePopup(page,popup,trigger);});
register(1,27,async page=>{const {popup,input,trigger}=await dialog(page);await input.fill('BPM1c 中文本页样例');await btn(popup,'保存本页演示').click();await popup.waitFor({state:'hidden'});await focused(page,trigger);const text=await sample(one(page),'Card').innerText();assert.match(text,/名称：BPM1c 中文本页样例/);return {text,returned:true};});
register(1,28,async page=>{const cards=sample(one(page),'Card');assert.equal(await cards.locator('[data-slot="card"][role="button"], [data-slot="card"][tabindex="0"], button').count(),0);assert.ok(await cards.locator('[data-slot="card"]').count()>=2);return {cards:await cards.locator('[data-slot="card"]').count(),interactive:0};});
register(1,29,async page=>{const badges=await sample(one(page),'Badge').locator('[data-slot="badge"]').allTextContents();assert.deepEqual(badges,['草稿','待确认','已通过','需补充','有错误']);assert.equal(await sample(one(page),'Alert').getByRole('note').count(),4);return {badges,alerts:4};});
register(1,30,async(page,row)=>{const list=role(one(page),'tablist','基础组件材料预览'),tab=role(list,'tab','长中文推导与复核说明');await list.getByRole('tab').first().focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await focused(page,tab);await poll(page,el=>{const r=el.getBoundingClientRect(),p=el.parentElement.parentElement.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1;},await tab.elementHandle());const value=await tab.evaluate(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.parentElement;const b=p.getBoundingClientRect();return {left:r.left,right:r.right,parentLeft:b.left,parentRight:b.right,scrollLeft:p.scrollLeft,scrollWidth:document.documentElement.scrollWidth,width:innerWidth};});row.measured=value;assert.ok(value.left>=value.parentLeft-1&&value.right<=value.parentRight+1);assert.equal(value.scrollWidth,value.width);return value;});
register(2,0,async page=>{const names=await two(page).locator('[data-blueprint-component]').evaluateAll(es=>es.map(e=>e.dataset.blueprintComponent));assert.deepEqual(names,['InputGroup','Combobox','ToggleGroup','Progress','Menu','Popover','Tooltip','Toast','AlertDialog','Sheet','Skeleton','Empty']);return names;});
register(2,1,async page=>{const duplicates=await page.locator('[id]').evaluateAll(es=>{const ids=es.map(e=>e.id);return [...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];});assert.deepEqual(duplicates,[]);return {duplicates};});
register(2,2,async page=>{const input=field(two(page),'材料关键词');await input.fill('新关键词');await btn(two(page),'清除本页关键词').click();assert.equal(await input.inputValue(),'');await focused(page,input);return {value:'',focused:true};});
register(2,3,async page=>{await field(two(page),'材料关键词').fill('');return disabled(btn(two(page),'清除本页关键词'));});
register(2,4,async(page,row)=>{const input=field(two(page),'起始页 · 必填校验');await input.fill('');await input.blur();await invalid(input,true);const value=await surface(input);row.measured=value;assert.equal(value.inner.borderWidth,'0px');assert.equal(value.wrapper.borderWidth,'0px');if(blue(row))assert.equal(value.outer.border,value.destructive);return value;});
register(2,5,async page=>{const input=field(two(page),'起始页 · 必填校验'),values=[];for(const v of ['0','-1','1.5','abc',' ']){await input.fill(v);await invalid(input,true);values.push({value:v,invalid:true});}return values;});
register(2,6,async page=>errorTransition(page,field(two(page),'起始页 · 必填校验'),two(page).getByText('请输入大于零的整数页码。',{exact:true}),'12'));
register(2,7,async page=>({readonly:await readonly(page,field(two(page),'材料编号 · 只读')),disabled:await disabled(field(two(page),'归档关键词 · 禁用'))}));
register(2,8,async page=>{await btn(two(page),'清除关联知识点').click();const input=role(two(page),'combobox','关联知识点');assert.equal(await input.inputValue(),'');assert.match(await sample(two(page),'Combobox').innerText(),/当前选择：尚未选择/);return {value:'',selection:'尚未选择'};});
register(2,9,async page=>{await role(two(page),'combobox','关联知识点').fill('zzzz-no-result');await page.getByText('没有匹配的知识点。',{exact:true}).waitFor({state:'visible'});assert.equal(await page.getByRole('option').count(),0);return {query:'zzzz-no-result',options:0};});
register(2,10,async page=>{const input=role(two(page),'combobox','关联知识点');await input.fill('平面几何');await role(page,'option','平面几何与辅助线').click();assert.equal(await input.inputValue(),'平面几何与辅助线');assert.match(await sample(two(page),'Combobox').innerText(),/当前选择：平面几何与辅助线/);return {selection:await input.inputValue()};});
register(2,11,async page=>{const input=role(two(page),'combobox','必选知识点 · 校验');await input.fill('一元二次方程');await invalid(input,true);await two(page).getByText('请从候选项中选择知识点，仅输入文字不算选中。',{exact:true}).waitFor({state:'visible'});return {typed:await input.inputValue(),invalid:true};});
register(2,12,async page=>{const input=role(two(page),'combobox','必选知识点 · 校验');await input.fill('平面几何');await role(page,'option','平面几何与辅助线').waitFor();await input.press('ArrowDown');await input.press('Enter');await invalid(input,false);assert.equal(await input.inputValue(),'平面几何与辅助线');await two(page).getByText('请从候选项中选择知识点，仅输入文字不算选中。',{exact:true}).waitFor({state:'hidden'});return {value:await input.inputValue(),invalid:false};});
register(2,13,async page=>{const trigger=role(two(page),'combobox','关联知识点');await trigger.focus();await trigger.press('ArrowDown');const popup=page.locator('[data-slot="combobox-popup"]:visible');await popup.waitFor();return closePopup(page,popup,trigger);});
register(2,14,async page=>disabled(role(two(page),'combobox','归档知识点 · 禁用')));
register(2,15,async page=>{const s=sample(two(page),'ToggleGroup'),read=btn(s,'阅读'),review=btn(s,'复核');await read.focus();await read.press('ArrowRight');await focused(page,review);await review.press('Space');assert.equal(await review.getAttribute('aria-pressed'),'true');assert.equal(await read.getAttribute('aria-pressed'),'false');return {selected:'复核',single:true};});
register(2,16,async page=>{const s=sample(two(page),'ToggleGroup');await btn(s,'完整推导说明').click();for(const name of ['题干条件','完整推导说明'])assert.equal(await btn(s,name).getAttribute('aria-pressed'),'true');return {selected:['题干条件','完整推导说明']};});
register(2,17,async page=>{const out=[];for(const name of ['归档','未提供'])out.push({name,...await disabled(btn(sample(two(page),'ToggleGroup'),name))});return out;});
register(2,18,async page=>{const values=await sample(two(page),'Progress').getByRole('progressbar').evaluateAll(es=>es.map(e=>({now:e.getAttribute('aria-valuenow'),text:e.getAttribute('aria-valuetext')})));assert.deepEqual(values,[{now:'0',text:'0%'},{now:'40',text:'40%'},{now:'100',text:'100%'},{now:null,text:'未提供进度'}]);return values;});
register(2,19,async(page,row)=>{const fill=sample(two(page),'Progress').locator('[data-slot="progress-indicator"]').nth(1);const value=await actualContrast(fill,'backgroundColor','parent');row.measured=value;if(blue(row))assert.ok(value.contrast>=3,'fill/track >=3');else assert.ok(value.contrast>1,'core fill distinct; preserve upstream color contract');return value;});
register(2,20,async page=>{const {popup}=await menu(page);return disabled(role(popup,'menuitem','发布材料（未接入）'));});
register(2,21,async page=>{const {popup,trigger}=await menu(page),item=role(popup,'menuitemcheckbox','显示补充说明');assert.equal(await item.getAttribute('aria-checked'),'true');await item.click();if(!await popup.isVisible())await trigger.click();assert.equal(await role(page,'menuitemcheckbox','显示补充说明').getAttribute('aria-checked'),'false');return {before:true,after:false};});
register(2,22,async page=>{const {popup,trigger}=await menu(page);await role(popup,'menuitemradio','紧凑摘要').click();if(!await popup.isVisible())await trigger.click();assert.equal(await role(page,'menuitemradio','紧凑摘要').getAttribute('aria-checked'),'true');assert.equal(await role(page,'menuitemradio','完整阅读').getAttribute('aria-checked'),'false');return {selection:'紧凑摘要'};});
register(2,23,async page=>{const {popup,trigger}=await menu(page);return closePopup(page,popup,trigger);});
register(2,24,async page=>{const {popup}=await menu(page),item=role(popup,'menuitem','查看完整的中文题干与推导说明');await item.focus();await item.press('Enter');const text=await sample(two(page),'Menu').innerText();assert.match(text,/已选择查看完整说明/);return {text};});
register(2,25,async page=>{const {input}=await popover(page);await focused(page,input);return {initialFocus:await input.getAttribute('id')};});
register(2,26,async page=>{const {popup,input}=await popover(page);const old=await input.inputValue();await input.fill('不保存的备注');await btn(popup,'取消备注编辑').click();await popup.waitFor({state:'hidden'});const next=await popover(page);assert.equal(await next.input.inputValue(),old);return {old,afterCancel:await next.input.inputValue()};});
register(2,27,async page=>{const {popup,input,trigger}=await popover(page);await input.fill('BPM1c 已应用备注');await btn(popup,'应用本页备注').click();await popup.waitFor({state:'hidden'});await focused(page,trigger);assert.match(await sample(two(page),'Popover').innerText(),/本页备注：BPM1c 已应用备注/);return {value:'BPM1c 已应用备注',returned:true};});
register(2,28,async page=>{const {trigger,popup}=await tooltip(page);const id=await popup.getAttribute('id');assert.ok((await trigger.getAttribute('aria-describedby')).split(/\s+/).includes(id));assert.equal(await popup.getAttribute('role'),'tooltip');return {id,text:await popup.innerText(),describedby:await trigger.getAttribute('aria-describedby')};});
register(2,29,async page=>{const {trigger,popup}=await tooltip(page);await focused(page,trigger);return {visible:await popup.isVisible(),focus:true};});
register(2,30,async page=>{const {trigger,popup}=await tooltip(page);return closePopup(page,popup,trigger);});
register(2,31,async page=>{const items=await threeToasts(page);assert.equal(await items.count(),3);return {count:3,text:await items.allTextContents()};});
register(2,32,async page=>{await btn(two(page),'信息通知样例').click();await btn(two(page),'关闭信息状态样例').waitFor();const values=await page.locator('[data-slot="toast-viewport"] > [data-position]').evaluateAll(es=>es.map(e=>({local:!!e.closest('#common-components-two'),text:e.textContent})));assert.equal(values.length,1);assert.ok(values.every(v=>v.local));return {count:values.length,allLocal:true,values};});
register(2,33,async page=>{await threeToasts(page);await btn(two(page),'关闭成功状态样例').click();await btn(two(page),'关闭成功状态样例').waitFor({state:'hidden'});assert.equal(await two(page).locator('[data-slot="toast-viewport"] > [data-position]:visible').count(),2);await btn(two(page),'关闭信息状态样例').waitFor();await btn(two(page),'关闭错误状态样例').waitFor();return {remaining:['信息','错误']};});
register(2,34,async page=>{await threeToasts(page);await btn(two(page),'关闭本页全部通知').click();await poll(page,()=>!document.querySelector('#common-components-two [data-slot="toast-viewport"] > [data-position]'));return {remaining:0};});
register(2,35,async page=>{const {popup}=await alert(page);await focused(page,btn(popup,'保留本页备注'));return {initialFocus:'保留本页备注'};});
register(2,36,async page=>{const {popup}=await alert(page);await focused(page,btn(popup,'保留本页备注'));return trap(page,popup);});
register(2,37,async page=>{const old=await sample(two(page),'Popover').innerText(),{popup}=await alert(page);await btn(popup,'保留本页备注').click();await popup.waitFor({state:'hidden'});assert.equal(await sample(two(page),'Popover').innerText(),old);return {noteUnchanged:old};});
register(2,38,async page=>{const {popup,trigger}=await alert(page);await btn(popup,'确认清空本页示例').click();await popup.waitFor({state:'hidden'});await focused(page,trigger);assert.match(await sample(two(page),'Popover').innerText(),/本页备注：空白/);return {note:'空白',returned:true};});
register(2,39,async page=>{const {popup}=await sheet(page);await focused(page,btn(popup,'关闭长内容侧面板'));return {initialFocus:'关闭长内容侧面板'};});
register(2,40,async page=>{const {popup,trigger}=await sheet(page);return closePopup(page,popup,trigger);});
register(2,41,async(page,row)=>{const {popup}=await sheet(page);await focused(page,btn(popup,'关闭长内容侧面板'));const value=await popup.evaluate(el=>{const r=el.getBoundingClientRect(),p=el.querySelector('[data-slot="sheet-panel"]');const before=p.scrollTop;p.scrollTop=p.scrollHeight;return {left:r.left,right:r.right,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,panelHeight:p.clientHeight,panelScroll:p.scrollHeight,before,after:p.scrollTop};});row.measured=value;assert.ok(value.left>=-1&&value.right<=value.width+1);assert.equal(value.scrollWidth,value.width);assert.ok(value.panelScroll>value.panelHeight&&value.after>value.before);return value;});
register(2,42,async page=>{const s=sample(two(page),'Skeleton'),busy=s.locator('[aria-label="材料内容快照"]');assert.equal(await busy.getAttribute('aria-busy'),'true');assert.equal(await busy.locator('[data-slot="skeleton"]').count(),3);return {busy:true,skeletons:3};});
register(2,43,async page=>{await page.emulateMedia({reducedMotion:'reduce'});const animations=await sample(two(page),'Skeleton').locator('[data-slot="skeleton"]').evaluateAll(es=>es.map(e=>getComputedStyle(e).animationName));assert.equal(animations.length,3);assert.ok(animations.every(a=>a==='none'));return animations;});
register(2,44,async page=>{const s=sample(two(page),'Skeleton');await btn(s,'显示内容快照').click();assert.equal(await s.locator('[aria-label="材料内容快照"]').getAttribute('aria-busy'),'false');assert.equal(await s.locator('[data-slot="skeleton"]').count(),0);assert.match(await s.innerText(),/固定内容样例：先核对二次项系数/);return {busy:false,text:await s.innerText()};});
register(2,45,async page=>{const s=sample(two(page),'Empty');await btn(s,'显示固定材料样例').click();assert.match(await s.innerText(),/固定材料样例：二次方程的实数根/);return {text:await s.innerText()};});
register(2,46,async page=>{const s=sample(two(page),'Empty');await btn(s,'显示固定材料样例').click();await btn(s,'恢复空状态样例').click();assert.match(await s.innerText(),/暂无本页演示材料/);await btn(s,'显示固定材料样例').waitFor();return {text:await s.innerText()};});
