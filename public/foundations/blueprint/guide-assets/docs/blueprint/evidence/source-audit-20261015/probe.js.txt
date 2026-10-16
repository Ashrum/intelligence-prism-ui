async page => {
 const reports=[];
 for (const mode of ['light','dark']) {
  if (await page.locator('html').getAttribute('data-mode')!==mode) await page.getByRole('button',{name:'切换亮色 / 暗色'}).click();
  for (const width of [1280,390]) {
   await page.setViewportSize({width,height:960});
   await page.evaluate(()=>window.scrollTo(0,0));
   reports.push(await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement);
    const tokens=Object.fromEntries(['--bg','--paper','--ink','--ink-2','--ink-3','--line','--line-2','--accent','--bw','--pad','--grid'].map(k=>[k,root.getPropertyValue(k).trim()]));
    const styles=Object.fromEntries(['body','.sheet','.sheet::before','.ruler','.sheet-head h2','.hero h1','.btn-primary','.tool','.seg-tabs'].map(s=>{
     const [selector,pseudo]=s.split('::');const e=document.querySelector(selector);if(!e)return[s,null];const c=getComputedStyle(e,pseudo?'::'+pseudo:null);
     return [s,Object.fromEntries(['display','color','backgroundColor','fontFamily','fontSize','lineHeight','borderTopWidth','borderRadius','padding','boxShadow','transform','backgroundSize'].map(k=>[k,c[k]]))];
    }));
    return {url:location.href,mode:document.documentElement.dataset.mode,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,dpr:devicePixelRatio,tokens,styles};
   }));
   await page.screenshot({path:'output/playwright/blueprint-reference-20261015/'+mode+'-'+width+'.png'});
  }
 }
 return reports;
}
