export type MeasuredPrintUnit = {id:string;height:number;keepWithNext?:boolean;breakBefore?:boolean}
/** Units are measured at physical paper width. Oversize units stay visible and block printing. */
export function paginateQuestionUnits(units:MeasuredPrintUnit[],capacity:number) {
  const pages:string[][]=[];const oversized:string[]=[];let page:string[]=[];let used=0
  for(let index=0;index<units.length;index++) {
    const unit=units[index]
    if(unit.height>capacity)oversized.push(unit.id)
    const next=units[index+1]
    const reserve=unit.keepWithNext&&next&&unit.height+next.height<=capacity?next.height:0
    if(page.length&&(unit.breakBefore||used+unit.height+reserve>capacity)){pages.push(page);page=[];used=0}
    page.push(unit.id);used+=unit.height
  }
  if(page.length)pages.push(page)
  return {pages,oversized}
}
