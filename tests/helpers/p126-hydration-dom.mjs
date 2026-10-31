// Extends the existing commit-only DOM with host measurement/storage APIs.
// No layout engine, browser events or visual acceptance are simulated here.
import { hydrationDOM, domNodes } from './ssr-hydration-dom.mjs';
export function reviewHydrationDOM() {
  const dom = hydrationDOM(1280, 900), { document, window } = dom;
  const proto = window.HTMLElement.prototype;
  const escape = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const serialize = n => {
    if(n.nodeType===3)return escape(n.nodeValue);
    if(n.nodeType===8)return `<!--${n.data}-->`;
    const tag=n.tagName.toLowerCase(),attrs=Object.entries(n.attributes).map(([k,v])=>` ${k}="${escape(v)}"`).join('');
    return `<${tag}${attrs}>`+(voids.has(tag)?'':n.childNodes.map(serialize).join('')+`</${tag}>`);
  };
  Object.defineProperty(proto,'innerHTML',{get(){return this.childNodes.map(serialize).join('');},set(html){this.childNodes=[];dom.parse(html,this);}});
  const match = (node, selector) => {
    if (node.nodeType !== 1) return false;
    return selector.split(',').some(s => {
      s = s.trim();
      if (s.includes(' ') || s.includes('>') || s.includes(':')) return false;
      const tag = s.match(/^[\w-]+/);
      if (tag && node.tagName !== tag[0].toUpperCase()) return false;
      for (const [,cls] of s.matchAll(/\.([\w-]+)/g)) if (!node.classList.contains(cls)) return false;
      for (const [,id] of s.matchAll(/#([\w-]+)/g)) if (node.getAttribute('id') !== id) return false;
      for (const [,key,value] of s.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)) {
        if (!node.hasAttribute(key) || (value !== undefined && node.getAttribute(key) !== value)) return false;
      }
      return true;
    });
  };
  proto.matches = function(s) { return match(this,s); };
  proto.closest = function(s) { for(let n=this;n?.nodeType===1;n=n.parentNode) if(match(n,s))return n;return null; };
  proto.querySelectorAll = function(s) { return domNodes(this,n=>n!==this && match(n,s)); };
  proto.querySelector = function(s) { return this.querySelectorAll(s)[0]??null; };
  proto.getRootNode = function() { return document; };
  proto.getClientRects = function() { return [this.getBoundingClientRect()]; };
  proto.focus = function() { document.activeElement=this; };
  proto.scrollTo = function({left=this.scrollLeft,top=this.scrollTop}) { this.scrollLeft=left;this.scrollTop=top; };
  proto.remove = function() { this.parentNode?.removeChild(this); };
  proto.scrollIntoView = function() {};
  proto.compareDocumentPosition = function(other) { const all=domNodes(document.documentElement,()=>true);return all.indexOf(this)<all.indexOf(other)?4:2; };
  Object.defineProperties(proto,{
    children:{get(){return this.childNodes.filter(n=>n.nodeType===1);}},
    className:{get(){return this.getAttribute('class')??'';},set(v){this.setAttribute('class',v);}},
    classList:{get(){return {contains:c=>this.className.split(' ').includes(c),add:(...c)=>{this.className=[...new Set([...this.className.split(' '),...c])].join(' ');},remove:(...c)=>{this.className=this.className.split(' ').filter(x=>!c.includes(x)).join(' ');}};}},
    dataset:{get(){return Object.fromEntries(Object.entries(this.attributes).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));}},
    clientWidth:{get(){return this.offsetWidth;}},clientHeight:{get(){return this.offsetHeight;}},
    isConnected:{get(){return document.documentElement.contains(this);}},
  });
  proto.scrollTop=0;proto.scrollLeft=0;
  document.head=document.createElement('head');
  document.documentElement.appendChild(document.head);
  document.documentElement.appendChild(document.body);
  document.querySelectorAll=s=>document.documentElement.querySelectorAll(s);
  document.querySelector=s=>document.querySelectorAll(s)[0]??null;
  document.getElementById=id=>document.querySelector(`[id="${id}"]`);
  const data=new Map();
  const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
  const matchMedia=media=>({media,matches:media.includes('prefers-reduced-motion'),addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  Object.assign(window,{Element:window.HTMLElement,Node:window.HTMLElement,HTMLInputElement:class {},HTMLTextAreaElement:class {},HTMLSelectElement:class {},innerWidth:1280,innerHeight:900,location:{search:'',href:'http://localhost/next/reviews/question-review'},localStorage,matchMedia,getComputedStyle:()=>({getPropertyValue:()=>'',direction:'ltr',display:'block',position:'static',overflow:'visible'}),requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
  return {...dom,globals:{window,document,localStorage,Element:window.Element,HTMLElement:window.HTMLElement,Node:window.Node,getComputedStyle:window.getComputedStyle,requestAnimationFrame:window.requestAnimationFrame,cancelAnimationFrame:window.cancelAnimationFrame,ResizeObserver:class {observe(){}unobserve(){}disconnect(){}},MutationObserver:class {observe(){}disconnect(){}},IS_REACT_ACT_ENVIRONMENT:true}};
}
