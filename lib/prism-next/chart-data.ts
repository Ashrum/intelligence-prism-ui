export type AxisItem={id:string;label:string}
export type MatrixCell={id:string;row:string;column:string;value:number|null;label?:string}
export type ScatterPoint={id:string;label:string;x:number|null;y:number|null;size?:number;group?:string}
export type BoxSummary={id:string;label:string;values:[number,number,number,number,number]}
export function validBox(values:BoxSummary["values"]){return values.every((v,i)=>Number.isFinite(v)&&(i===0||v>=values[i-1]))}
export function matrixExtent(cells:MatrixCell[]){const values=cells.flatMap(cell=>cell.value!==null&&Number.isFinite(cell.value)?[cell.value]:[]);const min=values.length?Math.min(...values):0;const max=values.length?Math.max(...values):1;return {min,max:max===min?min+1:max,missing:min-Math.max(1,Math.abs(min)*.1)}}
