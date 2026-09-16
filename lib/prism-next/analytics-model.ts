/** Independent synthetic fixtures. Never joins or mutates the evaluation workflow. */
export const topics = [{id:"model",label:"数量关系建模"},{id:"domain",label:"自变量取值范围"},{id:"verify",label:"结果检验与解释"}] as const
export const rounds = ["2026-09-02","2026-09-04","2026-09-07","2026-09-09","2026-09-11","2026-09-14"]
export type RecordStatus = "reviewed"|"pending"|"missing"
export const statusLabels:Record<RecordStatus,string> = {reviewed:"已复核",pending:"待复核",missing:"缺测"}
export type EvidenceRecord = {id:string;learner:string;date:string;topic:string;score:number|null;max:number;status:RecordStatus;note:string}
const scoreRows:(number|"pending"|null)[][] = [[1,0,1],[2,1,1],[null,null,null],[2,1,2],[2,2,1],[2,"pending",2]]
export const sampleRecords:EvidenceRecord[]=scoreRows.flatMap((row,index)=>row.map((score,column)=>({
  id:`SYN-A-${index+1}-${column+1}`,learner:"SYN-A",date:rounds[index],topic:topics[column].id,
  score:typeof score==="number"?score:null,max:2,status:score==="pending"?"pending":score===null?"missing":"reviewed",
  note:score===null?"本轮未提交作答，不计入得分分母。":score==="pending"?"已提交，教师尚未完成复核；不计入得分分母。":score===2?"按本示例统一评分标准，两个评分点均得分。":score===1?"按本示例统一评分标准，一个评分点得分，另一个需复核讲解。":"已复核，两个评分点均未得分；零分是有效观察。",
})))
export const rubric = ["明确列出所用条件或关系（1 分）","正确完成推导并解释结果（1 分）"]
export type AnalysisFilter={learner:string;topic:string;range:"all"|"recent"}
export const initialFilter:AnalysisFilter={learner:"SYN-A",topic:"all",range:"all"}
export function filterRecords(records:EvidenceRecord[],filter:AnalysisFilter){return records.filter(row=>row.learner===filter.learner&&(filter.topic==="all"||row.topic===filter.topic)&&(filter.range==="all"||row.date>=rounds[3]))}
export function isScored(row:EvidenceRecord){return row.status==="reviewed"&&row.score!==null&&Number.isFinite(row.score)&&Number.isFinite(row.max)&&row.max>0&&row.score>=0&&row.score<=row.max}
export function summarize(records:EvidenceRecord[]){const scored=records.filter(isScored);const earned=scored.reduce((sum,row)=>sum+row.score!,0);const possible=scored.reduce((sum,row)=>sum+row.max,0);return {count:records.length,scored:scored.length,earned,possible,rate:possible?earned/possible*100:null,pending:records.filter(row=>row.status==="pending").length,missing:records.filter(row=>row.status==="missing").length}}
export function trendSeries(records:EvidenceRecord[]){return [...new Set(records.map(row=>row.date))].sort().map(date=>({date,label:date.slice(5).replace("-","/"),...summarize(records.filter(row=>row.date===date))}))}
export function comparisonSeries(records:EvidenceRecord[]){return topics.map(topic=>({...topic,...summarize(records.filter(row=>row.topic===topic.id))})).filter(row=>row.count>0)}
export const bins=[{id:"low",label:"0–不足 50%",min:0,max:50},{id:"mid",label:"50–不足 100%",min:50,max:100},{id:"full",label:"100%",min:100,max:101}]
export function inBin(row:EvidenceRecord[],binId:string){const bin=bins.find(item=>item.id===binId);return bin?row.filter(item=>isScored(item)&&item.score!/item.max*100>=bin.min&&item.score!/item.max*100<bin.max):[]}
export function distributionSeries(records:EvidenceRecord[]){const total=records.filter(isScored).length;return bins.map(bin=>({...bin,count:inBin(records,bin.id).length,total}))}
export function statusSeries(records:EvidenceRecord[]){return (Object.keys(statusLabels) as RecordStatus[]).map(id=>({id,label:statusLabels[id],count:records.filter(row=>row.status===id).length,total:records.length}))}
export function displayRate(rate:number|null){return rate===null?"—":`${Math.round(rate*10)/10}%`}
export function goalProgress(baseline:number|null,current:number|null,target:number|null){if(baseline===null||current===null||target===null||!Number.isFinite(baseline+current+target)||target<=baseline)return null;return Math.max(0,Math.min(100,(current-baseline)/(target-baseline)*100))}
export type Drill={kind:"date"|"topic"|"bin"|"status";value:string;label:string}|null
export function drillRecords(records:EvidenceRecord[],drill:Drill){if(!drill)return records;if(drill.kind==="bin")return inBin(records,drill.value);return records.filter(row=>row[drill.kind as "date"|"topic"|"status"]===drill.value)}
