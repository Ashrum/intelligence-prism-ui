import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {dirname} from 'node:path'

// Exercise the actual component handlers without a DOM or development server.
// Only this component's hooks are supplied by a small in-memory host; its JSX and handlers are unchanged.
const root=fileURLToPath(new URL('../',import.meta.url))
const file=new URL('../.sites-runtime/review-intent-test.mjs',import.meta.url)
await mkdir(new URL('../.sites-runtime/',import.meta.url),{recursive:true})
const result=await build({stdin:{contents:`export {QuestionReview} from './components/prism-next/question-review';export {begin,reset} from 'review-hooks';`,resolveDir:root,loader:'tsx'},bundle:true,platform:'node',format:'esm',packages:'external',alias:{'@':root},write:false,plugins:[{name:'review-hook-host',setup(build){
 build.onResolve({filter:/^review-hooks$/},()=>({path:'hooks',namespace:'review-probe'}))
 build.onLoad({filter:/.*/,namespace:'review-probe'},()=>({contents:`let values=[],cursor=0;export const reset=()=>{values=[];cursor=0};export const begin=()=>{cursor=0};export const useId=()=>'review-test';export const useRef=()=>({current:null});export function useState(initial){const index=cursor++;if(!(index in values))values[index]=typeof initial==='function'?initial():initial;return [values[index],next=>{values[index]=typeof next==='function'?next(values[index]):next}]}`,loader:'js'}))
 build.onLoad({filter:/[\\/]question-review\.tsx$/},async({path})=>({contents:(await readFile(path,'utf8')).replace('from "react"','from "review-hooks"'),loader:'tsx',resolveDir:dirname(path)}))
}}]})
await writeFile(file,result.outputFiles[0].text)
const {QuestionReview,begin,reset}=await import(file)
await rm(file)
const question={id:'outside',title:'外部题目',kind:'解答',points:5,stem:'题干'}
const base={question,attempts:{1:'作答'},initialScores:{score:2}}
function nodes(tree){return Array.isArray(tree)?tree.flatMap(nodes):tree&&typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[]}
function text(tree){return Array.isArray(tree)?tree.map(text).join(''):tree&&typeof tree==='object'?text(tree.props?.children):tree==null||typeof tree==='boolean'?'':String(tree)}
function render(props){begin();return QuestionReview({...base,...props})}
const confirm=tree=>nodes(tree).find(node=>node.props?.children==='确认复核')
const score=tree=>nodes(tree).find(node=>node.props?.max===5&&node.props?.onChange)
const note=tree=>nodes(tree).find(node=>node.props?.placeholder==='说明调整的评分点与依据。')

test('uncontrolled confirmation emits scores without completing or discarding the draft',()=>{
 reset();const requests=[];const props={onConfirm:(scores,reason)=>requests.push({scores,reason})}
 let tree=render(props)
 confirm(tree).props.onClick()
 tree=render(props)
 assert.deepEqual(requests,[{scores:{score:2},reason:''}]);assert.match(text(tree),/待复核/);assert.doesNotMatch(text(tree),/已确认复核|最新复核记录/)
 score(tree).props.onChange(3)
 tree=render(props);note(tree).props.onChange({target:{value:'补充依据'}})
 tree=render(props);confirm(tree).props.onClick();tree=render(props)
 assert.deepEqual(requests.at(-1),{scores:{score:3},reason:'补充依据'})
 assert.equal(note(tree).props.value,'补充依据');assert.equal(score(tree).props.value,3)
 assert.match(text(tree),/评分有调整，待确认/);assert.doesNotMatch(text(tree),/已确认复核/)
 // The callback's payload is detached from the local draft.
 requests.at(-1).scores.score=5;assert.equal(score(render(props)).props.value,3)
 nodes(tree).find(node=>node.props?.children==='取消修改').props.onClick()
 tree=render(props);assert.equal(score(tree).props.value,2);assert.equal(note(tree).props.value,'')
})

test('invalid scores and missing reasons block intent; an external receipt controls completion',()=>{
 reset();let editor={scores:{score:null},saved:{score:2},reason:'',record:'旧记录',error:''};let count=0
 const props=()=>({editor,onEditorChange:next=>{editor=typeof next==='function'?next(editor):next},onConfirm:()=>count++})
 confirm(render(props())).props.onClick();assert.equal(count,0);assert.ok(editor.error)
 editor={...editor,scores:{score:3},error:''};confirm(render(props())).props.onClick();assert.equal(count,0);assert.match(editor.error,/理由/)
 editor={...editor,reason:'核对依据',error:''};confirm(render(props())).props.onClick();assert.equal(count,1)
 assert.deepEqual(editor.saved,{score:2});assert.equal(editor.record,'旧记录');assert.equal(editor.reason,'核对依据')
 assert.doesNotMatch(text(render(props())),/已确认复核/)
 editor={...editor,saved:{score:3},record:'外部回执',reason:''}
 assert.match(text(render({...props(),status:'confirmed'})),/已确认复核/)
 assert.match(text(render({...props(),status:'confirmed'})),/最新复核记录：外部回执/)
 assert.match(text(render({...props(),status:'unknown'})),/复核状态未确认/)
 assert.equal(confirm(render({})).props.disabled,true)
})
