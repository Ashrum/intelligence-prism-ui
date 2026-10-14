/** Theme axes without changing single-axis / multi-axis structure. */
export function themeAxes(value:unknown,palette:{muted:string;border:string;line?:string}){
 const merge=(entry:unknown)=>{const v=(entry??{}) as Record<string,any>;return {...v,axisLabel:{color:palette.muted,fontSize:12,...v.axisLabel},nameTextStyle:{color:palette.muted,...v.nameTextStyle},axisLine:{...v.axisLine,lineStyle:{color:palette.line??palette.border,...v.axisLine?.lineStyle}},splitLine:{...v.splitLine,lineStyle:{color:palette.border,...v.splitLine?.lineStyle}}}}
 return Array.isArray(value)?value.map(merge):merge(value)
}
export const isChartValue=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)
export type ChartDecimals = 0 | 1
/** Percentages are display values (0–100), not fractions; formatting never changes geometry. */
export function formatChartValue(value:number|null|undefined,unit='',decimals?:ChartDecimals){return isChartValue(value)?`${new Intl.NumberFormat('zh-CN',{maximumFractionDigits:decimals===undefined?(unit.includes('%')||unit.includes('％')?0:3):decimals===1?1:0}).format(value)}${unit}`:'缺测'}
/** Opt-in padded extent for trend lines, independent of zero-based comparison axes. */
export function trendAutoDomain(values:(number|null)[],unit=''):[number,number]{
 const valid=values.filter(isChartValue),percent=unit.includes('%')||unit.includes('％')
 if(!valid.length)return percent?[0,100]:[0,1]
 const min=Math.min(...valid),max=Math.max(...valid),span=max-min
 const step=percent?Math.max(1,10**Math.floor(Math.log10(Math.max(span,10)))):10**Math.floor(Math.log10(span||Math.abs(max)||1))
 const pad=Math.max(step,span*.25),lower=Math.floor((min-pad)/step)*step,upper=Math.ceil((max+pad)/step)*step
 return percent&&min>=0&&max<=100?[Math.max(0,lower),Math.min(100,upper)]:[lower,upper]
}
export function chartDomain(values:(number|null)[],range?:[number,number]):[number,number]{if(range&&range.every(isChartValue)&&range[0]<range[1])return range;const valid=values.filter(isChartValue);const min=Math.min(0,...valid),max=Math.max(0,...valid);return [min,max===min?min+1:max]}
export function withinDomain(value:unknown,range:[number,number]){return isChartValue(value)&&value>=range[0]&&value<=range[1]}
export function compositionSummary(items:{value:number|null}[]){return {total:items.reduce((sum,item)=>sum+(isChartValue(item.value)&&item.value>=0?item.value:0),0),invalid:items.filter(item=>item.value!==null&&(!isChartValue(item.value)||item.value<0)).length,missing:items.filter(item=>item.value===null).length}}

export const validDomain=(range:unknown):range is [number,number]=>Array.isArray(range)&&range.length===2&&range.every(isChartValue)&&range[0]<range[1]
export function alignChartValues(categories:{id:string}[],data:{id:string;value:number|null}[]){const lookup=new Map(data.map(d=>[d.id,d.value]));return categories.map(c=>({id:c.id,value:lookup.get(c.id)??null}))}
