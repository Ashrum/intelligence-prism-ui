// Pure naming/policy helpers and a browser callback; importing this file launches nothing.
export function screenshotName(row, suffix = '') {
 const parts = row.route.split('#')[0].split('/').filter(Boolean);
 const short = parts.at(-1) === 'blueprint' ? parts.slice(-2).join('-') : parts.at(-1);
 const content = row.captureKey || (row.id.startsWith('layout-') ? ''
  : row.innerTheme ? `isolation-${row.innerTheme}`
  : row.probe || row.id.replace(`overlay-${row.theme}-${row.viewport.width}-`, ''));
 return `${row.theme}-${row.viewport.width}-${short}${content ? '-'+content : ''}${suffix}.png`;
}

export function contrastPolicy(theme, pair) {
 const blueprint = ['blueprint', 'blueprint-night'].includes(theme);
 const threshold = pair.fg === 'line' ? (blueprint ? 3 : null) : pair.fg === 'border' ? null : 4.5;
 const status = theme === 'blueprint-night' && pair.fg === 'border' ? 'known-limitation'
  : threshold === null ? 'observed' : pair.contrast >= threshold ? 'pass' : 'fail';
 return {...pair, threshold, status};
}

// Passed directly to locator.evaluateAll. Read geometry before getAnimations to flush style.
// Finite transitions must finish; infinite decorative loops are ignored only when explicitly allowed.
export function waitForStableElements(elements, {timeoutMs = 5000, pixels = false, allowInfinite = false} = {}) {
 return new Promise(resolve => {
  const started = performance.now();
  let previous, unchanged = 0, frames = 0, last = null, raf, done = false;
  const finish = stable => {
   if (done) return;
   done = true; clearTimeout(timer); cancelAnimationFrame(raf);
   resolve({stable, status:stable ? 'stable' : '未稳定', elapsedMs:performance.now()-started, timeoutMs, frames, last});
  };
  const timer = setTimeout(() => finish(false), timeoutMs);
  const tick = () => {
   if (done) return;
   frames++;
   const nodes = pixels ? elements.flatMap(el => [el, ...el.querySelectorAll('.agent-mark-pixel')]) : elements;
   const samples = nodes.map(el => {
    const r = el.getBoundingClientRect();
    return {connected:el.isConnected, rect:[r.left,r.top,r.right,r.bottom], ...(pixels && !allowInfinite ? {opacity:getComputedStyle(el).opacity} : {})};
   });
   const animated = new Set();
   for (const el of nodes) for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
    for (const animation of ancestor.getAnimations()) animated.add(animation);
   }
   const active = [...animated].filter(a => a.pending || !['finished','idle'].includes(a.playState))
    .filter(a => !allowInfinite || a.effect?.getComputedTiming().iterations !== Infinity);
   const signature = JSON.stringify(samples);
   unchanged = signature === previous ? unchanged + 1 : 0; previous = signature;
   last = {samples, activeAnimations:active.map(a => ({playState:a.playState, pending:a.pending, endTime:String(a.effect?.getComputedTiming().endTime)}))};
   if (nodes.length && samples.every(s => s.connected) && !active.length && unchanged >= 2) finish(true);
   else raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
 });
}

// Base UI focus guards are transient; a stable non-guard outside remains a real failure.
export function waitForStableFocus(popup, {timeoutMs=5000}={}) {
 return new Promise(resolve=>{
  const start=performance.now();let previous=null,unchanged=0,frames=0,guards=0,last=null,raf,done=false;
  const finish=stable=>{if(done)return;done=true;clearTimeout(timer);cancelAnimationFrame(raf);resolve({stable,frames,guards,elapsedMs:performance.now()-start,...last});};
  const timer=setTimeout(()=>finish(false),timeoutMs);
  const tick=()=>{if(done)return;frames++;const active=document.activeElement,guard=!!active?.matches('[data-base-ui-focus-guard]');if(guard)guards++;unchanged=!guard&&active===previous?unchanged+1:0;previous=active;
   last={inside:!!active&&popup.contains(active),guard,tag:active?.tagName,name:active?.getAttribute('aria-label')||active?.textContent?.slice(0,160)};
   if(active&&!guard&&unchanged>=2)finish(true);else raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);
 });
}
export function reducedAnimationOK({name,duration,iterations}) {
 const names=name.split(',').map(s=>s.trim()),times=duration.split(',').map(s=>s.trim()),counts=iterations.split(',').map(s=>s.trim());
 return names.every((n,i)=>{if(n==='none')return true;const time=times[i%times.length];const ms=parseFloat(time)*(time.endsWith('ms')?1:1000);return Number.isFinite(ms)&&ms<=0.01&&Number(counts[i%counts.length])===1;});
}
