// Commit-only DOM: injected dimensions, no browser layout or accessibility verification.
export function clientDOM(width,height){
class Element {
 constructor(tag,ownerDocument){this.nodeType=1;this.tagName=tag.toUpperCase();this.nodeName=this.tagName;this.ownerDocument=ownerDocument;this.namespaceURI='http://www.w3.org/1999/xhtml';this.childNodes=[];this.attributes={};this.style={setProperty(key,value){this[key]=value},removeProperty(key){delete this[key]}};this.offsetWidth=width;this.offsetHeight=height}
 appendChild(child){this.childNodes.push(child);child.parentNode=this;return child}
 insertBefore(child,next){this.childNodes.splice(this.childNodes.indexOf(next),0,child);child.parentNode=this;return child}
 removeChild(child){this.childNodes.splice(this.childNodes.indexOf(child),1);child.parentNode=null;return child}
 setAttribute(key,value){this.attributes[key]=String(value)} removeAttribute(key){delete this.attributes[key]}
 setAttributeNS(ns,key,value){this.setAttribute(key,value)} removeAttributeNS(ns,key){this.removeAttribute(key)}
 getAttribute(key){return this.attributes[key]??null}
 getElementsByClassName(){return []}
 addEventListener(){} removeEventListener(){}
 get firstChild(){return this.childNodes[0]??null}
 set textContent(value){this.childNodes=[];this.text=value} get textContent(){return this.text??this.childNodes.map(n=>n.nodeValue??n.textContent).join('')}
 getBoundingClientRect(){const h=this.attributes.class?.includes("recharts-legend-wrapper")?36:height;return {x:0,y:0,top:0,left:0,right:width,bottom:h,width,height:h}}
}
const document={nodeType:9,addEventListener(){},removeEventListener(){},createElement(tag){return new Element(tag,this)},createElementNS(ns,tag){const el=this.createElement(tag);el.namespaceURI=ns;return el},createTextNode(text){return {nodeType:3,nodeValue:text,ownerDocument:this}},getElementById(){return null},activeElement:null};
const window={document,HTMLElement:Element,HTMLIFrameElement:class {},addEventListener(){},removeEventListener(){}};
document.defaultView=window;document.documentElement=document.createElement('html');document.body=document.createElement('body');document.activeElement=document.body;
return {window,document,resize(nextWidth,nextHeight){width=nextWidth;height=nextHeight}};
}
