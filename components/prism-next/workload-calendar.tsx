"use client"
import { createContext,useContext,type ComponentProps } from "react"
import { DayButton } from "react-day-picker"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar } from "@/components/coss/calendar"
export type DayLoad={value:number;label?:string;hasItems?:boolean;overCapacity?:boolean}
const LoadContext=createContext<{days:Record<string,DayLoad>;capacity:number|null;unit:string;assessment:"value"|"external";emptyLabel:string}|null>(null)
function LoadDay(props:ComponentProps<typeof DayButton>){const context=useContext(LoadContext)!;const date=format(props.day.date,"yyyy-MM-dd"),day=context.days[date];const busy=context.assessment==="external"?day?.overCapacity===true:!!day&&context.capacity!==null&&day.value>context.capacity;const unknown=context.assessment==="external"&&day?.overCapacity===undefined;return <DayButton {...props} data-load={busy?"over":(day?.hasItems??!!day)?"planned":"empty"} aria-label={`${date}，${day?day.label??`${day.value} ${context.unit}`:context.emptyLabel}${busy?"，超出容量":unknown?"，负荷判断未知":""}`}><span>{props.day.date.getDate()}</span><span className="load-day-minutes" aria-hidden="true">{day?.label??(day?`${day.value}${context.unit}`:"—")}</span>{busy&&<span className="load-day-flag" aria-hidden="true">!</span>}</DayButton>}
/** external consumes supplied assessments; it never compares values to capacity. */
export function WorkloadCalendar({days,capacity,unit="分钟",selected,onSelect,month,onMonthChange,assessment="value",emptyLabel="无安排"}:{days:Record<string,DayLoad>;capacity:number|null;unit?:string;selected:Date;onSelect:(date:Date)=>void;month:Date;onMonthChange:(date:Date)=>void;assessment?:"value"|"external";emptyLabel?:string}){return <LoadContext value={{days,capacity,unit,assessment,emptyLabel}}><Calendar mode="single" required locale={zhCN} weekStartsOn={1} className="workload-calendar" selected={selected} onSelect={onSelect} month={month} onMonthChange={onMonthChange} components={{DayButton:LoadDay}}/></LoadContext>}
