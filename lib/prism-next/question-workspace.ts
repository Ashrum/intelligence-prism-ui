export type PaperEntry = { id: string; points: number; partPoints?: Record<string, number>; group?: string }
export type QuestionAvailability = "ready" | "review" | "paused"
export function addToPaper(entries: PaperEntry[], additions: PaperEntry[]) {
  const ids = new Set(entries.map(item => item.id))
  return [...entries, ...additions.filter(item => { if (ids.has(item.id)) return false; ids.add(item.id); return true }).map(item => ({ ...item, partPoints: item.partPoints ? { ...item.partPoints } : undefined }))]
}
export function moveInPaper(entries: PaperEntry[], id: string, offset: number) {
  const from = entries.findIndex(item => item.id === id), to = from + offset
  if (from < 0 || to < 0 || to >= entries.length) return entries
  const next = [...entries]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next
}
export function replaceInPaper(entries: PaperEntry[], id: string, replacement: PaperEntry) {
  if (entries.some(item => item.id === replacement.id)) return entries
  return entries.map(item => item.id === id ? { ...replacement } : item)
}
export function entryPoints(entry: PaperEntry) {
  return entry.partPoints ? Object.values(entry.partPoints).reduce((sum, value) => sum + value, 0) : entry.points
}
export function reviewError(scores: Record<string, number | null>, limits: Record<string, number>, original: Record<string, number>, reason: string) {
  if (Object.keys(limits).some(id => scores[id] == null || !Number.isFinite(scores[id]) || scores[id]! < 0 || scores[id]! > limits[id] || !Number.isInteger(scores[id]! * 2))) return "请为每个评分点填写范围内的分数，步长为 0.5 分。"
  if (Object.keys(limits).some(id => scores[id] !== original[id]) && !reason.trim()) return "调整分数后，请填写复核理由。"
  return ""
}

export type DraftKind = "paper" | "practice"
export type QuestionDraft = {
  title:string; entries:PaperEntry[]; goal:string; minutes:number; showPoints:boolean; answers:"after"|"teacher"; groups:string[]
}
export type QuestionWorkspace = {basket:string[];paper:QuestionDraft;practice:QuestionDraft}
export function createQuestionWorkspace():QuestionWorkspace {
  return {basket:[],paper:{title:"数学综合练习卷",entries:[],goal:"",minutes:45,showPoints:true,answers:"teacher",groups:["第一部分","第二部分"]},practice:{title:"二次函数专项练习",entries:[],goal:"巩固函数性质，并在实际情境中应用。",minutes:20,showPoints:false,answers:"after",groups:["基础巩固","综合应用"]}}
}
export function copyDraft(draft:QuestionDraft):QuestionDraft {return {...draft,groups:[...draft.groups],entries:draft.entries.map(entry=>({...entry,partPoints:entry.partPoints?{...entry.partPoints}:undefined}))}}
export function addBasketItems(workspace:QuestionWorkspace,ids:string[]):QuestionWorkspace {return {...workspace,basket:[...new Set([...workspace.basket,...ids])]}}
export function transferToDraft(workspace:QuestionWorkspace,target:DraftKind,entries:PaperEntry[]):QuestionWorkspace {
  return {...workspace,[target]:{...workspace[target],entries:addToPaper(workspace[target].entries,entries.map(entry=>({...entry,group:entry.group??workspace[target].groups[0]})))}}
}
export function removeFromScope(workspace:QuestionWorkspace,scope:"basket"|DraftKind,ids:string[]):QuestionWorkspace {
  return scope==="basket"?{...workspace,basket:workspace.basket.filter(id=>!ids.includes(id))}:{...workspace,[scope]:{...workspace[scope],entries:workspace[scope].entries.filter(entry=>!ids.includes(entry.id))}}
}
export type WorkspaceHistory = {present:QuestionWorkspace;past:{workspace:QuestionWorkspace;label:string}[];message:string}
export type WorkspaceAction = {type:"apply";workspace:QuestionWorkspace;label:string}|{type:"undo"}
export function workspaceReducer(state:WorkspaceHistory,action:WorkspaceAction):WorkspaceHistory {
  if(action.type==="undo") {const previous=state.past.at(-1);return previous?{present:previous.workspace,past:state.past.slice(0,-1),message:`已撤销：${previous.label}`} :state}
  if(JSON.stringify(action.workspace)===JSON.stringify(state.present))return {...state,message:"内容未改变，重复题目不会再次加入。"}
  return {present:action.workspace,past:[...state.past,{workspace:state.present,label:action.label}].slice(-20),message:action.label}
}
