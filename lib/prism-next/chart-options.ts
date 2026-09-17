/** Theme axes without changing single-axis / multi-axis structure. */
export function themeAxes(value:unknown,palette:{muted:string;border:string}){
 const merge=(entry:unknown)=>{const v=(entry??{}) as Record<string,any>;return {...v,axisLabel:{color:palette.muted,fontSize:12,...v.axisLabel},nameTextStyle:{color:palette.muted,...v.nameTextStyle},axisLine:{...v.axisLine,lineStyle:{color:palette.border,...v.axisLine?.lineStyle}},splitLine:{...v.splitLine,lineStyle:{color:palette.border,...v.splitLine?.lineStyle}}}}
 return Array.isArray(value)?value.map(merge):merge(value)
}
export const isChartValue=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)
export function formatChartValue(value:number|null|undefined,unit=''){return isChartValue(value)?`${new Intl.NumberFormat('zh-CN',{maximumFractionDigits:3}).format(value)}${unit}`:'缺测'}
export function chartDomain(values:(number|null)[],range?:[number,number]):[number,number]{if(range&&range.every(isChartValue)&&range[0]<range[1])return range;const valid=values.filter(isChartValue);const min=Math.min(0,...valid),max=Math.max(0,...valid);return [min,max===min?min+1:max]}
export function withinDomain(value:unknown,range:[number,number]){return isChartValue(value)&&value>=range[0]&&value<=range[1]}
export function compositionSummary(items:{value:number|null}[]){return {total:items.reduce((sum,item)=>sum+(isChartValue(item.value)&&item.value>=0?item.value:0),0),invalid:items.filter(item=>item.value!==null&&(!isChartValue(item.value)||item.value<0)).length,missing:items.filter(item=>item.value===null).length}}

export const validDomain=(range:unknown):range is [number,number]=>Array.isArray(range)&&range.length===2&&range.every(isChartValue)&&range[0]<range[1]
export function alignChartValues(categories:{id:string}[],data:{id:string;value:number|null}[]){const lookup=new Map(data.map(d=>[d.id,d.value]));return categories.map(c=>({id:c.id,value:lookup.get(c.id)??null}))}

/** Match the continuous RGB ramp so cell labels follow the actual fill, including theme changes. */
export function heatmapFill(value:number,min:number,max:number,stops:readonly string[]) {
 const position=Math.max(0,Math.min(1,max>min?(value-min)/(max-min):0))*(stops.length-1)
 const index=Math.min(stops.length-2,Math.floor(position)),amount=position-index
 const rgb=(hex:string)=>[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16))
 const from=rgb(stops[index]),to=rgb(stops[index+1])
 return '#'+from.map((channel,i)=>Math.round(channel+(to[i]-channel)*amount).toString(16).padStart(2,'0')).join('')
}
export function colorLuminance(hex:string) {
 const channels=[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4)
 return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722
}
export function heatmapLabelColor(fill:string) {
 const luminance=colorLuminance(fill)
 return (luminance+.05)/.05>=1.05/(luminance+.05)?'#000000':'#FFFFFF'
}
