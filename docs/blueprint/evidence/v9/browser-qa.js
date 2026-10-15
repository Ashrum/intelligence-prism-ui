async page => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const out = { date: new Date().toISOString(), viewport: [], errors };
  for (const [theme, label] of [['blueprint','蓝图'], ['light','浅色'], ['paper','暖纸'], ['dark','深色']]) {
    await page.setViewportSize({width:1280,height:960});
    await page.getByRole('combobox', {name:'切换主题'}).click();
    await page.getByRole('option', {name:label,exact:true}).click();
    for (const width of [1280,320]) {
      await page.setViewportSize({width,height:width===320?800:960});
      await page.evaluate(() => window.scrollTo(0,0));
      out.viewport.push(await page.evaluate(({theme,width})=>({theme,width,actualTheme:document.documentElement.dataset.theme,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}),{theme,width}));
      await page.screenshot({path:`docs/blueprint/screens/v9/${theme}-${width}.png`});
    }
  }
  await page.setViewportSize({width:1280,height:960});
  await page.getByRole('combobox',{name:'切换主题'}).click();
  await page.getByRole('option',{name:'蓝图',exact:true}).click();
  await page.setViewportSize({width:320,height:800});
  const group = page.getByRole('radiogroup',{name:'答卷状态预览'});
  const first = group.getByRole('radio',{name:'全部',exact:true});
  await first.focus();
  await page.keyboard.press('End');
  out.segmentEnd = await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect(); return {text:e.textContent,checked:e.getAttribute('aria-checked'),rect:{left:r.left,right:r.right},parent:{left:p.left,right:p.right},scrollLeft:e.parentElement.scrollLeft,outline:getComputedStyle(e).outline}});
  await page.screenshot({path:'docs/blueprint/screens/v9/segment-end-320.png'});
  await page.keyboard.press('Home');
  out.segmentHome = await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect(); return {text:e.textContent,checked:e.getAttribute('aria-checked'),rect:{left:r.left,right:r.right},parent:{left:p.left,right:p.right},scrollLeft:e.parentElement.scrollLeft}});
  const disabled = page.getByRole('button',{name:'主行动不可用',exact:true});
  await disabled.scrollIntoViewIfNeeded();
  const styles = el => {const s=getComputedStyle(el);return {background:s.backgroundColor,color:s.color,transform:s.transform,boxShadow:s.boxShadow,border:s.borderColor,disabled:el.disabled}};
  out.disabledBefore = await disabled.evaluate(styles);
  await disabled.hover(); await page.mouse.down();
  out.disabledPressed = await disabled.evaluate(styles);
  await page.mouse.up();
  const primary = page.getByRole('button',{name:'预览主行动 →',exact:true});
  await primary.focus(); await page.keyboard.press('Shift');
  out.primaryFocus = await primary.evaluate(el=>({outline:getComputedStyle(el).outline,offset:getComputedStyle(el).outlineOffset,shadow:getComputedStyle(el).boxShadow}));
  const paneLink = page.getByRole('link',{name:'查看阅读样例',exact:true});
  await paneLink.focus(); await page.keyboard.press('Shift');
  out.paneFocus = await paneLink.evaluate(el=>({outline:getComputedStyle(el).outline,offset:getComputedStyle(el).outlineOffset,shadow:getComputedStyle(el).boxShadow}));
  await paneLink.scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/blueprint/screens/v9/pane-focus-320.png'});
  const tabs=page.getByRole('tablist',{name:'长内容阅读样例'});
  await tabs.getByRole('tab',{name:'题干与条件说明'}).focus();
  await page.keyboard.press('ArrowRight');
  out.tabsBeforeEnter = await page.evaluate(()=>({focus:document.activeElement.textContent,selected:document.activeElement.getAttribute('aria-selected')}));
  await page.keyboard.press('Enter');
  out.tabsAfterEnter = await page.evaluate(()=>({focus:document.activeElement.textContent,selected:document.activeElement.getAttribute('aria-selected'),scrollWidth:document.documentElement.scrollWidth,formula:[...document.querySelectorAll('.q-math-scroll')].map(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth}))}));
  await page.screenshot({path:'docs/blueprint/screens/v9/reading-320.png'});
  await page.goto('http://127.0.0.1:5173/next/foundations/blueprint/guide');
  await page.getByRole('heading',{name:'Foundations · 第四主题「蓝图」',exact:true}).waitFor();
  out.guide = await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,tableScroll:[...document.querySelectorAll('article [role=region]')].slice(0,3).map(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth})),unsafeLinks:[...document.querySelectorAll('article a')].filter(a=>/^(javascript:|data:)/i.test(a.getAttribute('href'))).length}));
  await page.screenshot({path:'docs/blueprint/screens/v9/guide-320.png'});
  return out;
}
