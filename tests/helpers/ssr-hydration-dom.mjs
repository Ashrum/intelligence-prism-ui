// Minimal SSR DOM adapter for React's real hydrateRoot reconciler. It implements
// parsing/traversal/attribute reads, not browser layout, CSS, events or a11y.
// Keep mismatch controls in the consuming test so missing DOM behavior cannot
// silently turn attribute/element hydration failures into a passing test.
import { clientDOM } from './chart-client-dom.mjs';
const decode = s => s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2),16) : +e.slice(1)) : ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"})[e]);
export function hydrationDOM(width = 1280, height = 230) {
  const dom = clientDOM(width, height), {document} = dom;
  const sibling = function () { const nodes = this.parentNode?.childNodes; return nodes?.[nodes.indexOf(this) + 1] ?? null; };
  const proto = dom.window.HTMLElement.prototype;
  Object.defineProperty(proto, 'nextSibling', {get:sibling});
  Object.defineProperty(proto, 'parentElement', {get(){return this.parentNode?.nodeType === 1 ? this.parentNode : null;}});
  proto.hasAttribute = function (key) { return this.getAttribute(key) !== null; };
  proto.contains = function (node) { return node === this || this.childNodes.some(child => child.nodeType === 1 && child.contains(node)); };
  const createElement = document.createElement.bind(document);
  document.createElement = tag => {
    const el = createElement(tag);
    el.attributes = new Proxy(el.attributes, {get(target,key){
      if (key === 'length') return Object.keys(target).length;
      if (typeof key === 'string' && /^\d+$/.test(key)) { const name=Object.keys(target)[+key]; return name === undefined ? undefined : {name,value:target[name]}; }
      return target[key];
    }});
    el.style.getPropertyValue = key => el.style[key] ?? '';
    return el;
  };
  const createText = document.createTextNode.bind(document);
  document.createTextNode = text => {
    const node = createText(text);
    Object.defineProperty(node,'nextSibling',{get:sibling});
    Object.defineProperty(node,'textContent',{get(){return this.nodeValue;},set(value){this.nodeValue=value;}});
    return node;
  };
  document.createComment = text => {
    const node={nodeType:8,data:text,nodeValue:text,ownerDocument:document,textContent:''};
    Object.defineProperty(node,'nextSibling',{get:sibling}); return node;
  };
  const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  function parse(html, host) {
    const stack=[host];
    for (const token of html.match(/<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g) ?? []) {
      const parent=stack.at(-1);
      if(token.startsWith('<!--')) {parent.appendChild(document.createComment(token.slice(4,-3))); continue;}
      if(token.startsWith('</')) {const tag=token.slice(2,-1).toLowerCase(); if(stack.at(-1).tagName.toLowerCase() !== tag) throw new Error(`Unbalanced SSR ${tag}`); stack.pop();continue;}
      if(token[0] !== '<') {parent.appendChild(document.createTextNode(decode(token)));continue;}
      const tag=token.match(/^<([^\s/>]+)/)[1], el=document.createElement(tag);
      if(tag==='svg'||parent.namespaceURI==='http://www.w3.org/2000/svg') el.namespaceURI='http://www.w3.org/2000/svg';
      for(const [,key,value] of token.slice(tag.length+1).matchAll(/([^\s=/>]+)(?:="([^"]*)")?/g)) el.setAttribute(key,decode(value??''));
      const style=el.getAttribute('style');
      if(style) for(const part of style.split(';')) {const i=part.indexOf(':');if(i>0) {const key=part.slice(0,i),value=part.slice(i+1);el.style[key]=value;el.style[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;}}
      parent.appendChild(el);
      if(!voids.has(tag)&&!token.endsWith('/>')) stack.push(el);
    }
    if(stack.length!==1) throw new Error('Unclosed SSR element');
    return host;
  }
  return {...dom,parse};
}
export function domNodes(host,predicate) {
  const found=[];
  function walk(node) {if(predicate(node)) found.push(node);node.childNodes?.forEach(walk);}
  walk(host); return found;
}
