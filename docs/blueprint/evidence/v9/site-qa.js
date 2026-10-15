async page => {
 await page.getByRole('combobox',{name:'切换主题'}).click();
 await page.getByRole('option',{name:'浅色',exact:true}).click();
 const checks=[];
 for(const width of [320,1280]){
  await page.setViewportSize({width,height:width===320?800:960});
  await page.evaluate(()=>window.scrollTo(0,0));
  checks.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.getAttribute('data-prism-theme'),title:document.querySelector('h1').textContent,demoLink:!!document.querySelector('a[href="/next/foundations/blueprint"]')})));
  await page.screenshot({path:`docs/blueprint/screens/v9/site-guide-${width}.png`});
 }
 const assets=await page.evaluate(async()=>{
  const links=[...new Set([...document.querySelectorAll('a[href]')].map(e=>e.getAttribute('href')).filter(h=>h.startsWith('/foundations/blueprint/guide-assets/')))];
  return Promise.all(links.map(async url=>{const r=await fetch(url);const b=await r.arrayBuffer();return {url,status:r.status,bytes:b.byteLength}}));
 });
 const experiment=await page.request.get('http://127.0.0.1:5173/next/experiments/blueprint');
 return {checks,assets,experiment:{status:experiment.status(),v04:(await experiment.text()).includes('v0.4')}};
}
