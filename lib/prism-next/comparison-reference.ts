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

type PlotArea={x:number;y:number;width:number;height:number}
/** Conservative SVG text width, shared with the existing tick font size. */
export function comparisonTextWidth(text:string,fontSize:number){
 return Array.from(text).reduce((width,char)=>width+fontSize*(/^[\x20-\x7e]$/.test(char)?.65:1),0)
}

/** Wrap long names without changing the axis font; the SVG title retains the full text. */
function referenceTextRows(text:string,width:number,fontSize:number){
 const rows:string[]=[]
 let row=''
 for(const char of text){
  if(row&&comparisonTextWidth(row+char,fontSize)>width){rows.push(row);row=''}
  row+=char
 }
 if(row)rows.push(row)
 return rows
}

export function comparisonReferenceLabels(lines:{id:string;position:number;text:string}[],plot:PlotArea,horizontal:boolean,binned:boolean,fontSize:number){
 const gap=6,lineHeight=fontSize*1.5,vertical=binned?!horizontal:horizontal
 const occupied:{left:number;top:number;width:number;height:number}[]=[]
 return lines.map(line=>{
  const segment=comparisonReferenceSegment(line.position,plot,horizontal,binned)
  const rightSpace=plot.x+plot.width-segment.x1-gap*2,leftSpace=segment.x1-plot.x-gap*2
  const anchor=vertical&&(comparisonTextWidth(line.text,fontSize)<=rightSpace||rightSpace>leftSpace)?'start':'end'
  const available=Math.max(fontSize,vertical?(anchor==='start'?rightSpace:leftSpace):plot.width-gap*2)
  const rows=referenceTextRows(line.text,available,fontSize)
  const width=Math.min(available,Math.max(...rows.map(row=>comparisonTextWidth(row,fontSize)),0)),height=rows.length*lineHeight
  const x=anchor==='start'?segment.x1+gap:(vertical?segment.x1:segment.x2)-gap
  const left=anchor==='start'?x:x-width
  const minY=plot.y+gap,maxY=Math.max(minY,plot.y+plot.height-height-gap)
  const preferred=Math.max(minY,Math.min(maxY,vertical?minY:segment.y1-height-gap))
  const candidates=[preferred]
  for(let offset=lineHeight;offset<=plot.height;offset+=lineHeight)candidates.push(preferred+offset,preferred-offset)
  const top=candidates.find(y=>y>=minY&&y<=maxY&&!occupied.some(box=>left<box.left+box.width+gap&&left+width+gap>box.left&&y<box.top+box.height+gap&&y+height+gap>box.top))??preferred
  occupied.push({left,top,width,height})
  return {...line,x,y:top+fontSize,anchor:anchor as 'start'|'end',rows,lineHeight}
 })
}
