async page => {
 await page.setViewportSize({width:320,height:800});
 const primary=page.getByRole('button',{name:'预览主行动 →',exact:true});
 await primary.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
 await page.waitForFunction(()=>getComputedStyle(document.activeElement).boxShadow==='rgb(255, 255, 255) 0px 0px 0px 2px');
 const focus=await primary.evaluate(el=>({theme:document.documentElement.getAttribute('data-prism-theme'),focused:el===document.activeElement,visible:el.matches(':focus-visible'),outline:getComputedStyle(el).outline,shadow:getComputedStyle(el).boxShadow}));
 await primary.scrollIntoViewIfNeeded();
 await page.screenshot({path:'docs/blueprint/screens/v9/primary-focus-320.png'});
 const tab=page.getByRole('tab',{name:'完整公式推导与教学提示'});
 await tab.click();
 const formula=await page.getByRole('math').evaluateAll(els=>els.map(el=>{const p=el.parentElement; return {className:p.className,width:p.clientWidth,scrollWidth:p.scrollWidth,overflow:getComputedStyle(p).overflowX}}));
 const nested = await page.evaluate(()=>{
  const template=document.querySelector('[data-slot="tabs-tab"]');
  const host=document.createElement('div');host.id='qa-nested';host.style.cssText='position:fixed;top:80px;left:10px;z-index:9999';document.body.append(host);
  function node(theme){const d=document.createElement('div');d.setAttribute('data-agent-preview','');d.setAttribute('data-prism-theme',theme);return d}
  function style(e){const s=getComputedStyle(e);return {background:s.backgroundColor,color:s.color,border:s.borderColor,radius:s.borderRadius,shadow:s.boxShadow,outline:s.outline,font:s.fontSize}}
  const results=[];
  for(const theme of ['light','paper','dark']){const direct=node(theme),outer=node(theme),inner=node(theme),a=template.cloneNode(true),b=template.cloneNode(true);direct.append(a);inner.append(b);outer.append(inner);host.append(direct,outer);a.focus();const one=style(a);b.focus();const two=style(b);results.push({theme,direct:one,doubleNested:two,equal:JSON.stringify(one)===JSON.stringify(two)});direct.remove();outer.remove()}
  host.remove();return results;
 });
 return {focus,formula,nested};
}
