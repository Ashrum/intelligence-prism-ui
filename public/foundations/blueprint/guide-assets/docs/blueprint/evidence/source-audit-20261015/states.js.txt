async page => {
 await page.setViewportSize({width:1280,height:960});
 if(await page.locator('html').getAttribute('data-mode')!=='light') await page.getByRole('button',{name:'切换亮色 / 暗色'}).click();
 const button=page.getByRole('link',{name:'在线试一试',exact:false}).first();
 const read=()=>button.evaluate(e=>{const s=getComputedStyle(e);return {shadow:s.boxShadow,transform:s.transform,outline:s.outline,outlineOffset:s.outlineOffset};});
 await page.mouse.move(0,0); const normal=await read();
 await button.hover(); await page.waitForTimeout(250); const hover=await read();
 await page.mouse.move(0,0); await page.keyboard.press('Tab'); await button.focus(); const focus=await read();
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await button.evaluate(e=>getComputedStyle(e).transitionDuration);
 return {normal,hover,focus,reduced};
}
