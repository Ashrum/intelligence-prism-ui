export type ComparisonReferenceLine = {value:number;label:string;tone?:'info'|'success'|'warning'|'destructive'|'neutral'}
export type ComparisonDatum = {value:number|null;range?:[number,number]}

/** Reference lines never extend the host's numeric domain. */
export function comparisonDomain(data:ComparisonDatum[],domain?:[number,number]):[number,number] {
 if(domain?.every(Number.isFinite)&&domain[0]<domain[1])return domain
 const values=data.flatMap(p=>typeof p.value==='number'&&Number.isFinite(p.value)?[p.value]:[])
 const min=Math.min(0,...values),max=Math.max(0,...values)
 return min===max?[min,min+1]:[min,max]
}

/** Equal-width category bands; interpolate within the explicitly supplied range. */
export function comparisonReferencePosition(value:number,data:ComparisonDatum[],domain:[number,number]):number|null {
 if(!Number.isFinite(value))return null
 if(data.some(p=>p.range!==undefined)){
  if(!data.every((p,i)=>p.range?.every(Number.isFinite)&&p.range[0]<p.range[1]&&(i===0||p.range[0]>=data[i-1].range![1])))return null
  const index=data.findIndex((p,i)=>value>=p.range![0]&&(value<p.range![1]||(i===data.length-1&&value===p.range![1])))
  if(index<0)return null
  const [start,end]=data[index].range!
  return (index+(value-start)/(end-start))/data.length
 }
 if(!domain.every(Number.isFinite)||domain[0]>=domain[1]||value<domain[0]||value>domain[1])return null
 return (value-domain[0])/(domain[1]-domain[0])
}

export function comparisonReferenceSegment(position:number,plot:{x:number;y:number;width:number;height:number},horizontal:boolean,binned:boolean){
 const vertical=binned?!horizontal:horizontal
 const coordinate=vertical?plot.x+position*plot.width:plot.y+(binned?position:1-position)*plot.height
 return vertical?{x1:coordinate,x2:coordinate,y1:plot.y,y2:plot.y+plot.height}:{x1:plot.x,x2:plot.x+plot.width,y1:coordinate,y2:coordinate}
}
