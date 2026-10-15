async page => {
 const results=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1280,height:960});
 await page.getByRole('combobox',{name:'切换主题'}).click();
 const themes=await page.getByRole('option').allTextContents();
 await page.getByRole('option',{name:'蓝图',exact:true}).click();
 for(const route of ['experiments/blueprint','foundations/blueprint','foundations/blueprint/guide']){
  const r=await page.goto('http://127.0.0.1:5173/next/'+route);
  await page.waitForFunction(()=>document.documentElement.getAttribute('data-prism-theme')==='blueprint');
  await page.getByRole('combobox',{name:'切换主题'}).getByText('蓝图',{exact:true}).waitFor();
  for(const width of [320,1280]){
   await page.setViewportSize({width,height:width===320?800:960});
   await page.evaluate(()=>window.scrollTo(0,0));
   results.push(await page.evaluate(({route,status})=>({route,status,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.querySelector('h1')?.textContent,theme:document.documentElement.getAttribute('data-prism-theme')}),{route,status:r.status()}));
   await page.screenshot({path:`docs/blueprint/screens/sync-20261015/${route.replaceAll('/','-')}-${width}.png`});
  }
 }
 const nav=await page.getByRole('navigation',{name:'蓝图规范相关页面'}).getByRole('link').allTextContents();
 const links=await page.evaluate(async()=>Promise.all([...new Set([...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(x=>x.startsWith('/foundations/blueprint/guide-assets/')))].map(async url=>({url,status:(await fetch(url)).status}))));
 return {date:new Date().toISOString(),themes,results,nav,links,errors};
}
