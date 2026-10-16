async page => {
  const errors=[],results=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const measure=()=>({theme:document.documentElement.dataset.prismTheme,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,sheets:[...document.querySelectorAll('.bp-sheet')].map(sheet=>({width:sheet.getBoundingClientRect().width,padding:getComputedStyle(sheet).padding,inset:getComputedStyle(sheet,'::before').inset,rulers:[...sheet.querySelectorAll('.bp-ruler')].map(el=>{const c=getComputedStyle(el);return {side:el.className,display:c.display,width:c.width,height:c.height,font:c.fontSize,lineHeight:c.lineHeight,hiddenFromAT:el.getAttribute('aria-hidden'),clippedGlyphs:[...el.children].filter(span=>{const range=document.createRange();range.selectNodeContents(span);const r=range.getBoundingClientRect(),b=span.getBoundingClientRect();return c.display!=='none'&&(r.left<b.left-0.5||r.right>b.right+0.5||r.top<b.top-0.5||r.bottom>b.bottom+0.5)}).length}})}))});
  for(const [theme,label] of [['blueprint','蓝图'],['light','浅色'],['paper','暖纸'],['dark','深色']]){
    await page.setViewportSize({width:1280,height:960});
    await page.getByRole('combobox',{name:'切换主题'}).click();
    await page.getByRole('option',{name:label,exact:true}).click();
    for(const width of [1280,320]){
      await page.setViewportSize({width,height:width===320?800:960});
      await page.locator('.bp-sheet').first().scrollIntoViewIfNeeded();
      results.push(await page.evaluate(measure));
      await page.screenshot({path:`docs/blueprint/screens/ruler-20261015/${theme}-${width}-after.png`});
    }
  }
  await page.setViewportSize({width:1280,height:960});
  await page.getByRole('combobox',{name:'切换主题'}).click();
  await page.getByRole('option',{name:'蓝图',exact:true}).click();
  const isolation=await page.evaluate(()=>{
    const original=document.querySelector('.bp-sheet');
    return ['light','paper','dark'].map(theme=>{
      const host=document.createElement('div');host.dataset.agentPreview='';host.dataset.prismTheme=theme;
      const nested=host.cloneNode();nested.append(original.cloneNode(true));host.append(nested);document.querySelector('main').append(host);
      const sheet=host.querySelector('.bp-sheet'),ruler=sheet.querySelector('.bp-ruler');
      const result={theme,inset:getComputedStyle(sheet,'::before').inset,rulerHeight:getComputedStyle(ruler).height,font:getComputedStyle(ruler).fontSize};host.remove();return result;
    });
  });
  await page.evaluate(()=>document.documentElement.style.fontSize='20px');
  const enlarged=await page.evaluate(measure);
  await page.locator('.bp-sheet').first().scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/blueprint/screens/ruler-20261015/blueprint-1280-enlarged.png'});
  await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));
  return {date:new Date().toISOString(),route:page.url(),baseline:'a36acadade4068a21f5bc9a0336d9714a812450f',before:{width:1280,sheetWidth:975,padding:'48px 40px 40px',inset:'18px',rulerHeight:'18px',font:'12px',lineHeight:'18px'},results,isolation,enlarged,errors};
}
