/** Fixture state only; deliberately separate from workbench conversations and business tasks. */
export type ReplyState = 'ready'|'replying'|'stopped'|'failed'
export type DemoMessage = { id:string; role:'user'|'assistant'; text:string; state:ReplyState; material?:boolean }
export type DemoConversation = { id:string; title:string; draft:string; material:boolean; messages:DemoMessage[] }
export type DemoAction =
 | {type:'new';id:string}
 | {type:'draft';id:string;value:string}
 | {type:'material';id:string;value:boolean}
 | {type:'send';id:string;messageId:string}
 | {type:'settle';id:string;messageId:string;state:Exclude<ReplyState,'replying'>;text:string}
export function conversationReducer(items:DemoConversation[],action:DemoAction):DemoConversation[] {
 if(action.type==='new')return [{id:action.id,title:'新对话',draft:'',material:false,messages:[]},...items]
 return items.map(item=>{
  if(item.id!==action.id)return item
  if(action.type==='draft')return {...item,draft:action.value}
  if(action.type==='material')return {...item,material:action.value}
  if(action.type==='send') {
   if(!item.draft.trim()||item.messages.some(m=>m.state==='replying'))return item
   return {...item,title:item.messages.length?item.title:item.draft.trim().slice(0,48),draft:'',material:false,messages:[...item.messages,{id:action.messageId+'-user',role:'user',text:item.draft.trim(),state:'ready',material:item.material},{id:action.messageId,role:'assistant',text:'',state:'replying',material:item.material}]}
  }
  return {...item,messages:item.messages.map(message=>message.id===action.messageId&&message.state==='replying'?{...message,state:action.state,text:action.text}:message)}
 })
}
export const demoConversations:DemoConversation[]=[
 {id:'new',title:'新对话',draft:'',material:false,messages:[]},
 {id:'example',title:'从二次函数到课堂提问：如何帮助学生说清取等条件',draft:'',material:false,messages:[
  {id:'e-user',role:'user',text:'怎样用一道二次函数题，引导学生解释最小值和取等条件？',state:'ready'},
  {id:'e-assistant',role:'assistant',text:'先让学生看见结构，再要求说明条件。可按“配方—判断—解释”组织提问。\n\n不要只追问最小值是多少，还要问：为什么不会更小？什么时候恰好取到？这样可以区分计算正确与理由完整。',state:'ready',material:true}
 ]},
 {id:'planning',title:'把长中文说明整理成清楚的课堂提问',draft:'请把问题改得更简洁一些。',material:false,messages:[
  {id:'p-user',role:'user',text:'一段较长的教学说明，怎样拆成学生容易理解的问题？',state:'ready'},
  {id:'p-assistant',role:'assistant',text:'每个问题只承担一个判断。先说明对象，再给出条件，最后提出需要解释的结论。保留必要的数学术语，避免用多段背景说明代替清楚的问题。',state:'ready'}
 ]}
]
export const demoReply='可以先让学生尝试配方，再解释平方项为什么非负，最后核对取等条件。\n\n建议追问：“如果换一个自变量，函数值会更小吗？请说明理由。”先保留学生的解释，再决定是否需要补一道对照题。'
