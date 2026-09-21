import type { ShellNotification, ShellSearchResult } from '@/components/prism-next/skeletons/workbench-shell'
import type { ShellTask, TaskState, UsageAccount } from '@/components/prism-next/skeletons/workbench-model'
export const reviewNotifications: ShellNotification[] = [
 { id: 'notice-1', title: '教研活动时间更新', detail: '本周数学教研活动调整至周四 16:30，请留意时间安排。', time: '今天 09:20 · 演示通知', read: false },
 { id: 'notice-2', title: '共享材料说明已更新', detail: '数学组补充了材料命名与引用说明，可在教研活动中查阅。', time: '昨天 15:40 · 演示通知', read: false },
]
export const reviewSearch: ShellSearchResult[] = [
 { id:'agent', title:'Agent', description:'一级业务入口 · 仅验证导航状态', type:'入口' },
 { id:'records', title:'工作记录', description:'一级业务入口 · 仅验证导航状态', type:'入口' },
 { id:'grading', title:'批阅与解析', description:'一级业务入口 · 仅验证导航状态', type:'入口' },
 { id:'papers', title:'组卷', description:'一级业务入口 · 仅验证导航状态', type:'入口' },
 { id:'analysis', title:'学情分析', description:'一级业务入口 · 仅验证导航状态', type:'入口' },
 { id:'material', title:'数学 · 函数与不等式课堂材料', description:'本页阅读样例 · 非生产资料', type:'材料' },
]
export function reviewTasks(state: TaskState): ShellTask[] {
 if(state==='idle')return []
 const details = { running:'已处理 12 / 20 页。后台处理仍在运行，对话回复结束不会改变该状态。', attention:'第 8 页方向异常，等待人工确认；尚未形成可用成果。', failed:'材料处理失败，未生成结果。此处仅演示失败呈现。', completed:'20 / 20 页处理结束，示例成果已生成；发布是独立操作。' }
 return [{id:'task-1',title:'课堂材料处理',state,detail:details[state],...(state==='running'?{progress:60}:{}),...(state==='completed'?{result:'演示成果：课堂材料结构化记录 v1'}:{})}]
}
export function reviewUsage(state: 'enabled'|'disabled'|'unavailable'): UsageAccount[] {
 return [
 {kind:'points',scope:state==='enabled'?'personal':'undetermined',state,unit:'分',...(state==='enabled'?{value:1280}:{}),detail:state==='enabled'?'个人积分示例，仅验证展示。不代表真实余额。':'积分尚未接入，未确认归属；没有可核实的余额。'},
 {kind:'tokens',scope:state==='enabled'?'organization':'undetermined',state,unit:'tokens',...(state==='enabled'?{value:240000}:{}),detail:state==='enabled'?'组织 token 额度示例，与个人积分无兑换关系。':'Token 用量与额度尚未接入，不推断为 0。'},
 ]
}
