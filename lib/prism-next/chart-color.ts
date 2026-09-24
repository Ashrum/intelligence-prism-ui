/** Warm-paper review values only. These do not replace the global theme. */
export const paperCategoryCandidate = ['#286A96','#A43D72','#387653','#916C22','#735B98','#626B76'] as const
export const paperSequentialCandidate = ['#E4E9E9','#8CB1C5','#286A96'] as const
export type SequentialColors = readonly [string,string,string]
const rgb=(hex:string)=>[1,3,5].map(i=>Number.parseInt(hex.slice(i,i+2),16))
export function relativeLuminance(hex:string){return rgb(hex).map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)}
/** Matches the RGB interpolation used by the heatmap visualMap. */
export function sequentialColor(value:number,min:number,max:number,colors:SequentialColors){
 const position=Math.max(0,Math.min(1,(value-min)/(max-min||1)))*2
 const index=Math.min(1,Math.floor(position)),t=position-index,a=rgb(colors[index]),b=rgb(colors[index+1])
 return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('')
}
export function contrastForeground(background:string){const l=relativeLuminance(background);return (l+.05)/.05>=1.05/(l+.05)?'#000000':'#FFFFFF'}
