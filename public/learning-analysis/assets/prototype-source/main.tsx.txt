import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {AppBar,AppBarIdentity,AppBarNavigation,AppBarNavLink,BarIconButton,SpaceBar,SpaceBarTitle} from '@/components/prism-next/app-bar';
import {Button} from '@/components/coss/button';
import {Badge} from '@/components/coss/badge';
import {Card} from '@/components/coss/card';
import {Input} from '@/components/coss/input';
import {Textarea} from '@/components/coss/textarea';
import {BpFrameCard,BpSectionCard} from '@/components/prism-next/blueprint/blueprint';
import {AgentPromptBar} from '@/components/prism-next/agent-prompt-bar';
import './main.css';

// This local host converts its review-only semantic templates to actual React components.
// It does not mount the business AgentWorkspacePage, its providers, stores, or service owners.
const root=createRoot(document.getElementById('app')!);
const modal=createRoot(document.getElementById('dialog')!);
const attrMap:Record<string,string>={'class':'className','for':'htmlFor','tabindex':'tabIndex','readonly':'readOnly','maxlength':'maxLength','stroke-width':'strokeWidth','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin'};
function propsFor(node:Element):any {
 const p:any={};
 for(const attr of [...node.attributes]){
  let name=attrMap[attr.name]||attr.name;
  if(name==='style'){p.style=Object.fromEntries(attr.value.split(';').filter(Boolean).map(s=>{const i=s.indexOf(':');const k=s.slice(0,i).trim();return [k.startsWith('--')?k:k.replace(/-([a-z])/g,(_,x)=>x.toUpperCase()),s.slice(i+1).trim()]}));continue;}
  if(['disabled','checked','selected'].includes(name)){p[name==='checked'?'defaultChecked':name]=true;continue;}
  if(name==='value'){p.defaultValue=attr.value;continue;}
  p[name]=attr.value;
 }
 return p;
}
function Prompt(){const [value,setValue]=useState('');return <div className="actual-prompt"><AgentPromptBar value={value} onValueChange={setValue} onIntent={intent=>(window as any).reviewPromptIntent(intent)} sources={[]} commands={[]} models={[]} showModelSelector={false} label="消息" placeholder="继续讨论，或补充你的想法…" dictation={{state:'idle'}} voice={{state:'idle'}} contextActions={<Button variant="ghost" size="sm" className="prompt-context" data-action="capabilities">教学助手</Button>}/></div>}
function children(node:Node):React.ReactNode[]{return [...node.childNodes].map((n,i)=><React.Fragment key={i}>{convert(n)}</React.Fragment>)}
function convert(node:Node | null):React.ReactNode {
 if(!node)return null;
 if(node.nodeType===Node.TEXT_NODE)return node.textContent;
 if(!(node instanceof Element))return null;
 const p=propsFor(node),cls=node.classList,tag=node.tagName.toLowerCase();
 if(cls.contains('prism-app-bar-root'))return <AppBar identity={children(node.querySelector('.prism-app-bar-identity-slot')!)} navigation={children(node.querySelector('.prism-app-bar-navigation-slot')!)} tools={children(node.querySelector('.prism-app-bar-tools')!)}/>;
 if(cls.contains('prism-app-bar-identity'))return <AppBarIdentity institution="明德中学" href="#analysis" data-action="analysis"/>;
 if(cls.contains('prism-app-bar-navigation'))return <AppBarNavigation compact={<Button variant="secondary" data-action={(window as any).reviewState?.screen==='overview'?'overview':'analysis'}>{(window as any).reviewState?.screen==='overview'?'学情分析':'Agent'}</Button>}>{children(node)}</AppBarNavigation>;
 if(cls.contains('mobile-nav'))return null;
 if(cls.contains('prism-app-bar-nav-link'))return <AppBarNavLink href={'#'+p['data-action']} data-action={p['data-action']} aria-current={p['aria-current']} icon={convert(node.querySelector('svg')!)}>{node.textContent}</AppBarNavLink>;
 if(cls.contains('prism-bar-icon-button'))return <BarIconButton label={p['aria-label']} size={node.closest('.prism-space-bar')?'space':undefined} data-action={p['data-action']} title={p.title}>{convert(node.querySelector('svg')!)}</BarIconButton>;
 if(cls.contains('prism-space-bar-root'))return <SpaceBar side={{title:'对话目录',collapsed:true,onToggle:()=>(window as any).reviewToggleDirectory()}} tools={children(node.querySelector('.prism-space-bar-tools')!)}><BarIconButton size="space" label="新对话" data-action="newchat">{convert(node.querySelector('.prism-space-bar-side [data-action="newchat"] svg')!)}</BarIconButton>{children(node.querySelector('.prism-space-bar-content')!)}</SpaceBar>;
 if(cls.contains('prism-space-bar-title'))return <SpaceBarTitle>{children(node)}</SpaceBarTitle>;
 if(tag==='form'&&p.id==='composer')return <Prompt/>;
 if(cls.contains('answer-evidence'))return <BpFrameCard className="evidence-frame" title={<>典型错答 <span className="evidence-owner">{node.querySelector('.section-heading>.muted')?.textContent}</span></>}>{[...node.children].filter(n=>!n.classList.contains('section-heading')).map((n,i)=><React.Fragment key={i}>{convert(n)}</React.Fragment>)}</BpFrameCard>;
 if(cls.contains('form-section')&&node.parentElement?.classList.contains('draft-form'))return <BpSectionCard className="draft-section" title={node.querySelector('.section-heading h2')?.textContent} meta={convert(node.querySelector('.section-heading .tag')!)}>{[...node.children].filter(n=>!n.classList.contains('section-heading')).map((n,i)=><React.Fragment key={i}>{convert(n)}</React.Fragment>)}</BpSectionCard>;
 if(cls.contains('tag')){delete p.className;return <Badge {...p} className="tag" variant={cls.contains('warn')?'warning':cls.contains('good')?'success':'secondary'}>{children(node)}</Badge>}
 if(cls.contains('card'))return <Card {...p}>{children(node)}</Card>;
 if(tag==='button')return <Button {...p} variant={cls.contains('primary')?'default':cls.contains('link')?'link':cls.contains('secondary')?'secondary':cls.contains('quiet')||cls.contains('help')||cls.contains('avatar')||node.parentElement?.classList.contains('analysis-nav')?'ghost':'outline'} size={cls.contains('small')?'xs':'default'}>{children(node)}</Button>;
 if(tag==='input'&&!['checkbox','radio'].includes(p.type))return <Input {...p}/>;
 if(tag==='textarea')return <Textarea {...p} key={p['data-content-version']} defaultValue={node.textContent}/>;
 return React.createElement(tag,p,...children(node));
}
(window as any).renderReviewTemplate=(html:string)=>{const doc=new DOMParser().parseFromString(html,'text/html');flushSync(()=>root.render(<>{children(doc.body)}</>));};
(window as any).renderReviewDialog=(html:string)=>{const doc=new DOMParser().parseFromString(html,'text/html');flushSync(()=>modal.render(<>{children(doc.body)}</>));};
await import('./app.js');
